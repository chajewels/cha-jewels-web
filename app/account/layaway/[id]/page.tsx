import { pageMeta } from "@/lib/page-meta";
import { formatDeadline, formatSiteDate, siteDay } from "@/lib/site-time";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { notLinkedProbe, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { layawayOffered } from "@/lib/layaway-availability";
import { tr } from "@/lib/i18n";
import { orderLineTitle } from "@/lib/catalog-i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { canPayHere, isLivePlan, planNote, planStatusLabel, remainingLabel, rowStatusLabel, showsPaymentDetails, showsRemainingFigure } from "@/lib/plan-status";
import { isAwaitingConfirmation } from "@/lib/reservation";
import { Button } from "@/components/ui/button";
import { TransferDetails } from "@/components/commerce/transfer-details";
import { LayawayPayForm } from "@/components/commerce/layaway-pay-form";
import { PrintButton } from "@/components/account/print-button";
import { PrintHeader } from "@/components/account/print-header";
import { ServiceRequestForm } from "@/components/account/service-request-form";
import { PaymentDueCard } from "@/components/account/payment-due-card";
import { AccountShell } from "@/components/account/account-shell";
import { Notice } from "@/components/commerce/commerce-ui";
import { HubImage } from "@/components/media/hub-image";
import { Lock } from "lucide-react";
import type { Tone } from "@/lib/order-status";
import type { ServiceRequest } from "@/lib/types";

export const generateMetadata = () => pageMeta("layaway");
export const dynamic = "force-dynamic";

/**
 * One plan: what is owed, when, what has been paid, and where to pay it.
 *
 * Every figure is the Hub's. Per-row amounts come from `actual_remaining` and
 * per-row state from `computed_status` — the Hub's display rule — so a row that
 * has been part paid reads the same here as it does to a reviewer.
 *
 * SHOWS BOTH KINDS OF PLAN (2026-09-15). Most plans were arranged with Cha
 * Jewels directly rather than at this checkout, and they reach states a web
 * plan never had: overdue, extended, forfeited, in settlement, paid in full.
 * Two rules follow from that, and both are load-bearing:
 *
 *   1. A closed plan is never shown a payment route, and its remaining balance
 *      is never labelled as an amount to pay. The Hub keeps a real positive
 *      remaining_balance on a forfeited plan; presenting that as "still to pay"
 *      would invite a payment the plan cannot accept.
 *   2. Only a plan that started here gets the payment form. Everything else is
 *      paid in the customer portal, which stays the primary surface.
 *
 * NOT GATED ON LANGUAGE, for the same reason as the list: layaway being
 * English-only (owner decision 2026-09-15) decides whether a plan can be
 * STARTED, never whether an existing one can be read or paid.
 */
export default async function LayawayPlanPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const [lang, { id }, query] = await Promise.all([getLang(), params, searchParams]);
  const t = tr(lang);
  // NO LAYAWAY ON THE JAPANESE SITE (owner decision 2026-09-25, final), and
  // that now includes the account's plan pages, which used to stay reachable in
  // either language. Same answer as /layaway: not found on `ja`.
  if (!layawayOffered(lang)) notFound();

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/login?next=/account/layaway/${id}`);
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  // Service requests ride alongside the plan; a failure reading them leaves
  // the plan page standing with none listed rather than taking it down.
  //
  // 404 not_linked (no customer record yet) goes to the profile step; 404
  // not_found (no such plan, or not hers) keeps the "not found" below.
  const link = notLinkedProbe();
  const [detail, requests] = jwt
    ? await Promise.all([hub.layawayPlan(jwt, id).catch(link.or(null)), hub.serviceRequests(jwt).catch(link.or<ServiceRequest[]>([]))])
    : [null, [] as ServiceRequest[]];
  if (link.hit) redirect(profileUrl(withQuery(`/account/layaway/${id}`, query)));
  if (!detail) {
    return (
      <AccountShell lang={lang} current="layaway" eyebrow={t("accountMenu", "layaway")} title={t("plans", "notFound")} back={{ href: "/account/layaway", label: t("plans", "back") }}>
        <Button asChild variant="outline"><Link href="/account/layaway">{t("plans", "back")}</Link></Button>
      </AccountShell>
    );
  }

  const { plan, schedule, items, payments, pending_submissions: pendingSubs, transfer_methods: methods } = detail;
  const status = planStatusLabel(plan, lang);
  const ownRequests = requests.filter((r) => r.layaway_plan_id === plan.id);
  const money = (n: number) => formatMoney(n, plan.currency);
  // Japan time, zone named on deadlines (lib/site-time.ts).
  const fmtDate = (iso: string) => formatSiteDate(iso, lang);
  const fmtStamp = (iso: string) => formatDeadline(iso, lang);

  const live = isLivePlan(plan);
  const payHere = canPayHere(plan);
  // RESERVE FIRST (Hub A2): held, not yet confirmed by staff. No bank details,
  // no deadline and no payment form until the Hub says it is ready — owner
  // rule. `payHere` and `showsPaymentDetails` both already refuse it; this
  // names the state for the copy.
  const reserved = isAwaitingConfirmation(plan);
  const justPlaced = query.placed === "1";
  /**
   * Whether a row is still money this customer owes — the only rows that get
   * the gold emphasis.
   *
   * A cancelled row is NOT: forfeiture cancels the unpaid rows and they keep a
   * positive actual_remaining in the Hub's books, so keying the emphasis off
   * that figure alone lit up seven cancelled rows in gold on a closed plan and
   * left the paid ones grey — the exact opposite of the truth. A row on a plan
   * that can no longer take money is never emphasised either.
   */
  const owes = (row: (typeof schedule)[number]) =>
    live && row.computed_status !== "cancelled" && Number(row.actual_remaining) > 0;
  const note = planNote(plan, lang);
  // "The piece stays reserved until your deposit arrives" is true of a plan
  // placed at this checkout minutes ago. It is not true of a Hub-arranged plan
  // that happens to have nothing paid against it yet, and two live ones do.
  const awaitingDeposit = payHere && !detail.deposit_paid;
  // What to send next: the deposit while it is outstanding, otherwise the
  // earliest row that still owes something. The Hub's own waterfall order.
  const nextRow = schedule.find((row) => row.actual_remaining > 0 && row.computed_status !== "cancelled");
  const suggested = awaitingDeposit
    ? Number(plan.downpayment_amount)
    : Number(nextRow?.actual_remaining ?? plan.remaining_balance);

  // Bank details and a payment route only while the plan can still take
  // money, and never before staff confirm a reservation.
  const payDue = showsPaymentDetails(plan);
  // The date that goes with `suggested`: the deposit's transfer deadline while
  // it is outstanding, otherwise the due date of the row being paid next.
  const dueBy = awaitingDeposit
    ? (plan.transfer_due_at ? fmtStamp(plan.transfer_due_at) : null)
    : (nextRow ? fmtDate(nextRow.due_date) : null);

  const placed = siteDay(plan.order_date ?? plan.created_at);

  const reference = plan.web_reference ?? plan.invoice_number ?? "—";
  const first = items[0] ?? null;
  const firstName = first ? orderLineTitle(first, lang) : null;

  return (
    <AccountShell
      lang={lang}
      current="layaway"
      className="print-invoice"
      back={{ href: "/account/layaway", label: t("plans", "back") }}
      eyebrow={<>{t("accountMenu", "layaway")} · {t("plans", "reference")} <span className="cj-fig font-mono text-[13px] normal-case tracking-[0.04em] text-charcoal-deep">{reference}</span></>}
      title={status.text}
      headAside={<PrintButton label={t("account", "print")} />}
    >
      <PrintHeader lang={lang} invoiceNumber={plan.invoice_number} reference={plan.web_reference} date={placed} />

      {/* THE PLAN CARD (build step 4; comp "Layaway plan"): the piece, the
          term and currency, and the Hub's figures — plan total, paid so far,
          and what is left, labelled by remainingLabel so a closed plan never
          calls its balance "still to pay". Nothing here is computed. */}
      <section aria-label={t("plans", "total")} className="band-dark relative mb-6 bg-charcoal-deep p-5 text-chalk outline outline-1 -outline-offset-1 outline-gold/35 sm:p-[26px]">
        <span aria-hidden="true" className="cj-slab-rule" />
        <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className={first?.image_url ? "grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[104px_minmax(0,1fr)]" : ""}>
            {/* No photo on the line (a Hub-arranged plan): no empty frame. */}
            {first?.image_url && (
              <span className="relative block aspect-square overflow-hidden bg-white outline outline-1 -outline-offset-1 outline-gold/35">
                <HubImage src={first.image_url} alt={firstName ?? ""} fill sizes="104px" className="object-contain" />
              </span>
            )}
            <div className="min-w-0">
              <StatusBadgeDark tone={status.tone} text={status.text} />
              {firstName && <p className="mt-2.5 text-sm leading-relaxed text-chalk/90">{firstName}{items.length > 1 ? ` +${items.length - 1}` : ""}</p>}
              <p className="mt-1 text-[13px] text-chalk/75">
                {t("plans", "months", { n: String(plan.payment_plan_months) })} · {t("plans", "deposit")} <span className="cj-fig">{money(Number(plan.downpayment_amount))}</span>
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-pale">{t("plans", "total")}</p>
            {/* A closed plan's figure is never gold (the lists' rule). */}
            <p className={`cj-fig mt-1 font-display text-[30px] leading-[1.1] sm:text-[36px] ${status.tone === "dead" ? "text-chalk/75" : "text-gold-pale"}`}>{money(Number(plan.total_amount))}</p>
            <p className="cj-fig mt-1 text-[13px] text-chalk/80">
              {t("plans", "paid")} {money(Number(plan.total_paid))}
              {/* Hidden on a closed plan that left nothing unpaid: "Unpaid when
                  it closed 0" would contradict the badge. */}
              {showsRemainingFigure(plan) && <> · {remainingLabel(plan, lang)} {money(Number(plan.remaining_balance))}</>}
            </p>
          </div>
        </div>
        {plan.settlement_due_at && (
          <p className="mt-4 border-t border-chalk/20 pt-3 text-[13px] text-chalk/80">{t("plans", "settlementDue")} <span className="cj-fig">{fmtDate(plan.settlement_due_at)}</span></p>
        )}
      </section>

      {/* PAYMENT FIRST (owner request 2026-09-24). While the plan can take
          money, what to send, by when and where comes first — on screen and
          on paper. A closed plan, and a reservation staff have not confirmed
          yet, get no bank details and no payment route. */}
      {payDue && (
        <div className="mb-6 [&>section]:mt-0">
          <PaymentDueCard
            lang={lang}
            amountLabel={awaitingDeposit ? t("account", "depositAmountDue") : undefined}
            amount={suggested > 0 ? money(suggested) : null}
            deadline={dueBy}
          >
            <h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-charcoal/70">{t("complete", "instructions")}</h3>
            <TransferDetails methods={methods} lang={lang} />
            {methods.length > 0 && <p className="mt-4 text-sm text-charcoal/70">{t("complete", "keepRef")}</p>}

            {payHere ? (
              /* The pay form and its proof upload are an action, not a
                 record of one: they have no place on a printed statement. */
              <div className="print-hide">
                <LayawayPayForm
                  accountId={plan.id}
                  lang={lang}
                  currency={plan.currency}
                  suggestedAmount={Math.max(0, Math.round(suggested))}
                  methods={methods}
                />
              </div>
            ) : (
              /* Reporting a transfer for a Hub-arranged plan happens in the
                 portal. The link is the Hub's own; the fallback line below is
                 not optional. */
              <div className="mt-8 border-t border-hairline pt-6">
                <h3 className="font-display text-xl text-charcoal-deep">{t("plans", "payElsewhereH")}</h3>
                <p className="mt-2 max-w-[60ch] text-sm text-charcoal/70">{t("plans", "payElsewhereP")}</p>
                {detail.portal_url && (
                  <Button asChild className="print-hide mt-5">
                    <a href={detail.portal_url} target="_blank" rel="noopener noreferrer">{t("plans", "portalCta")}</a>
                  </Button>
                )}
                <p className="mt-4 text-xs text-charcoal/70">{t("plans", "portalFallback")}</p>
              </div>
            )}
          </PaymentDueCard>
        </div>
      )}

      {/* RESERVE FIRST: held, not yet confirmed — words only. Straight off the
          checkout it reads "Reservation received". */}
      {reserved && (
        <Notice icon={<Lock className="h-5 w-5" strokeWidth={1.5} />} className="mb-6">
          {justPlaced && <p className="font-medium">{t("complete", "reservedH1")}</p>}
          <p>{t("plans", "noteReserved")}</p>
          {justPlaced && <p className="mt-1 text-charcoal/80">{t("complete", "reservedNoPayment")}</p>}
        </Notice>
      )}

      {/* What this state means, in one sentence. Closed plans get no
          encouragement here — see planNote. */}
      {note && !reserved && (
        <p className="mb-6 border border-hairline bg-white p-4 text-sm text-charcoal-deep">{note}</p>
      )}

      {/* Straight off the checkout, before any deposit exists. */}
      {justPlaced && awaitingDeposit && (
        <p className="mb-6 border border-gold-dark px-4 py-3 text-sm text-gold-dark">{t("complete", "layawayLede")}</p>
      )}

      {awaitingDeposit && (
        <p className="mb-6 text-sm text-charcoal/80">{t("plans", "awaitingDeposit")}</p>
      )}

      {items.length === 0 && (
        <p className="mb-6 border border-hairline bg-white p-5 text-sm leading-relaxed text-charcoal/80">{t("plans", "arrangedWithUs")}</p>
      )}

      {/* Every piece on the plan, when there is more than the one on the card. */}
      {items.length > 1 && (
        <ul className="rule-grid mb-6 grid gap-px border border-hairline">
          {items.map((line) => (
            <li key={line.id} className="bg-white p-4 text-sm">
              <p className="text-charcoal-deep">{orderLineTitle(line, lang)}</p>
              <p className="mt-1 text-xs text-charcoal/75">
                {line.sku ? `SKU ${line.sku}` : ""}{line.quantity > 1 ? ` · × ${line.quantity}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <section className="border border-hairline bg-white p-5 sm:p-6">
        <h2 className="font-display text-[22px] text-charcoal-deep">{t("plans", "schedule")}</h2>
        {/* The Hub re-dates every row to the confirmation day, so the dates
            shown before then are not the ones the customer will pay on. */}
        {reserved && <p className="mt-1.5 text-sm text-charcoal/80">{t("plans", "scheduleProvisional")}</p>}
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline">
              <th className={TH}>{t("orders", "payment")}</th>
              <th className={TH}>{t("plans", "due")}</th>
              <th className={`${TH} max-sm:sr-only`}><span className="sr-only sm:not-sr-only">{t("orders", "status")}</span></th>
              <th className={`${TH} text-right`}>{t("plans", "amount")}</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr key={row.id} className="border-b border-hairline last:border-b-0">
                <td className="py-3 pr-3 text-charcoal-deep">{t("plans", "installment", { n: String(row.installment_number) })}</td>
                <td className="cj-fig py-3 pr-3 text-charcoal/80">
                  {fmtDate(row.due_date)}
                  <span className="block text-xs text-charcoal/75 sm:hidden">{rowStatusLabel(row, lang)}</span>
                </td>
                <td className="py-3 pr-3 text-xs text-charcoal/75 max-sm:hidden">{rowStatusLabel(row, lang)}</td>
                {/*
                  WHAT THE FIGURE MEANS depends on whether the row still owes.
                  A row with something left shows what is left; a settled or
                  cancelled row shows what it was for.
                */}
                <td className={`cj-fig whitespace-nowrap py-3 text-right font-display text-[17px] ${owes(row) ? "text-charcoal-deep" : "text-charcoal/70"}`}>
                  {money(Number(owes(row) ? row.actual_remaining : row.total_due_amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {pendingSubs.length > 0 && (
        <div className="mt-6 border border-gold-dark bg-white p-5">
          <h2 className="font-display text-lg text-charcoal-deep">{t("plans", "pending")}</h2>
          <ul className="mt-3 space-y-1 text-sm text-charcoal/80">
            {pendingSubs.map((sub) => (
              <li key={sub.id}>
                {t("plans", "pendingNote", {
                  amount: money(Number(sub.submitted_amount)),
                  date: fmtDate(sub.payment_date),
                })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {payments.length > 0 && (
        <section className="mt-6 border border-hairline bg-white p-5 sm:p-6">
          <h2 className="font-display text-[22px] text-charcoal-deep">{t("plans", "payments")}</h2>
          <ul className="mt-3">
            {payments.map((p) => (
              <li key={p.id} className="flex items-baseline justify-between gap-4 border-b border-hairline py-3 text-sm last:border-b-0">
                <span className="cj-fig text-charcoal/80">{fmtDate(p.date_paid)}{p.payment_method ? ` · ${p.payment_method}` : ""}</span>
                <span className="cj-fig font-display text-[17px] text-charcoal-deep">{money(Number(p.amount_paid))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Work on the piece, asked for next to the plan it is on. A closed plan
          — forfeited, settled, cancelled — is not offered the form. */}
      <ServiceRequestForm
        lang={lang}
        target={{ layaway_plan_id: plan.id }}
        items={items.map((line) => ({ value: line.title, label: orderLineTitle(line, lang) }))}
        initial={ownRequests}
        canRequest={status.tone !== "dead"}
      />
    </AccountShell>
  );
}

const TH = "pb-2.5 pr-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark";

/** The status on the dark plan card: the badge's wording and dot, in the slab's colours. */
function StatusBadgeDark({ tone, text }: { tone: Tone; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 border border-gold/50 px-3 py-1 text-xs text-chalk">
      <i aria-hidden="true" className={`h-1.5 w-1.5 rotate-45 ${tone === "good" ? "bg-gold-pale" : tone === "pending" ? "bg-orange" : "border border-chalk/70"}`} />
      {text}
    </span>
  );
}
