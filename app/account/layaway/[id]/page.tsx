import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { orderLineTitle } from "@/lib/catalog-i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { canPayHere, isLivePlan, planNote, planStatusLabel, remainingIsPayable, remainingLabel, rowStatusLabel, showsRemainingFigure } from "@/lib/plan-status";
import { Button } from "@/components/ui/button";
import { TransferDetails } from "@/components/commerce/transfer-details";
import { LayawayPayForm } from "@/components/commerce/layaway-pay-form";
import { StatusBadge } from "@/components/account/status-badge";
import { PrintButton } from "@/components/account/print-button";
import { PrintHeader } from "@/components/account/print-header";
import { ServiceRequestForm } from "@/components/account/service-request-form";
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

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/login?next=/account/layaway/${id}`);
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  // Service requests ride alongside the plan; a failure reading them leaves
  // the plan page standing with none listed rather than taking it down.
  const [detail, requests] = jwt
    ? await Promise.all([hub.layawayPlan(jwt, id).catch(() => null), hub.serviceRequests(jwt).catch((): ServiceRequest[] => [])])
    : [null, [] as ServiceRequest[]];
  if (!detail) {
    return (
      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap max-w-[720px]">
          <h1 className="text-[clamp(28px,3.6vw,44px)]">{t("plans", "notFound")}</h1>
          <Button asChild variant="ghost" className="mt-6"><Link href="/account/layaway">{t("plans", "back")}</Link></Button>
        </div>
      </section>
    );
  }

  const { plan, schedule, items, payments, pending_submissions: pendingSubs, transfer_methods: methods } = detail;
  const status = planStatusLabel(plan, lang);
  const ownRequests = requests.filter((r) => r.layaway_plan_id === plan.id);
  const money = (n: number) => formatMoney(n, plan.currency);
  const locale = lang === "ja" ? "ja-JP" : "en-GB";
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });
  const fmtStamp = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });

  const live = isLivePlan(plan);
  const payHere = canPayHere(plan);
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

  const placed = (plan.order_date ?? plan.created_at).slice(0, 10);

  return (
    <section className="print-invoice py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[820px]">
        <PrintHeader lang={lang} invoiceNumber={plan.invoice_number} reference={plan.web_reference} date={placed} />

        <Link href="/account/layaway" className="print-hide text-sm text-chalk/55 underline underline-offset-4">{t("plans", "back")}</Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-mono text-[clamp(24px,3vw,38px)] text-gold-pale">{plan.web_reference ?? plan.invoice_number ?? "—"}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={status.tone} text={status.text} />
            <PrintButton label={t("account", "print")} />
          </div>
        </div>

        {/* What this state means, in one sentence. Closed plans get no
            encouragement here — see planNote. */}
        {note && (
          <p className="mt-6 border border-rule bg-charcoal-deep p-4 text-sm text-chalk/80">{note}</p>
        )}

        {/* Straight off the checkout, before any deposit exists. */}
        {query.placed === "1" && awaitingDeposit && (
          <p className="mt-6 border border-gold px-4 py-3 text-sm text-gold-pale">{t("complete", "layawayLede")}</p>
        )}

        <dl className="mt-10 grid gap-4 border border-rule p-5 sm:grid-cols-3">
          <Figure k={t("plans", "total")} v={money(Number(plan.total_amount))} />
          <Figure k={t("plans", "paid")} v={money(Number(plan.total_paid))} />
          {/* Hidden on a closed plan that left nothing unpaid: the two cells
              above already say "Plan total X · Paid so far X", and a third
              reading "Unpaid when it closed 0" would contradict the badge. */}
          {showsRemainingFigure(plan) && (
            <Figure k={remainingLabel(plan, lang)} v={money(Number(plan.remaining_balance))} dim={!remainingIsPayable(plan)} />
          )}
        </dl>

        <dl className="mt-4 space-y-2 text-sm">
          <Row k={t("plans", "deposit")} v={money(Number(plan.downpayment_amount))} />
          <Row k={t("plans", "term")} v={t("plans", "months", { n: String(plan.payment_plan_months) })} />
          {plan.transfer_due_at && awaitingDeposit && (
            <Row k={t("plans", "depositDue")} v={fmtStamp(plan.transfer_due_at)} />
          )}
          {plan.settlement_due_at && <Row k={t("plans", "settlementDue")} v={fmtDate(plan.settlement_due_at)} />}
        </dl>

        {awaitingDeposit && (
          <p className="mt-6 text-sm text-chalk/70">{t("plans", "awaitingDeposit")}</p>
        )}

        {items.length === 0 && (
          <p className="mt-10 text-sm text-chalk/70">{t("plans", "arrangedWithUs")}</p>
        )}

        {items.length > 0 && (
          <ul className="rule-grid mt-10 grid gap-px">
            {items.map((line) => (
              <li key={line.id} className="flex flex-wrap items-baseline justify-between gap-4 bg-charcoal p-5">
                <div>
                  <p className="text-chalk">{orderLineTitle(line, lang)}</p>
                  <p className="mt-1 text-xs text-chalk/55">
                    {line.sku ? `SKU ${line.sku}` : ""}{line.quantity > 1 ? ` · × ${line.quantity}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
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

        <h2 className="mt-12 font-display text-xl text-gold-pale">{t("plans", "schedule")}</h2>
        <ul className="rule-grid mt-4 grid gap-px">
          {schedule.map((row) => (
            <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-4 bg-charcoal p-4 text-sm">
              <span className="text-chalk/75">
                {t("plans", "installment", { n: String(row.installment_number) })} · {fmtDate(row.due_date)}
              </span>
              <span className="text-xs text-chalk/55">{rowStatusLabel(row, lang)}</span>
              {/*
                WHAT THE FIGURE MEANS depends on whether the row still owes.
                A row with something left shows what is left; a settled or
                cancelled row shows what it was for. Rendering actual_remaining
                unconditionally — which is what this did — put a flat "¥0"
                against every paid row. No web plan had paid rows yet, so it
                never showed; a Hub plan is mostly paid rows.
              */}
              <span className={`font-display text-lg ${owes(row) ? "text-gold-pale" : "text-chalk/55"}`}>
                {money(Number(owes(row) ? row.actual_remaining : row.total_due_amount))}
              </span>
            </li>
          ))}
        </ul>

        {pendingSubs.length > 0 && (
          <div className="mt-10 border border-gold/60 p-5">
            <h2 className="font-display text-lg text-gold-pale">{t("plans", "pending")}</h2>
            <ul className="mt-3 space-y-1 text-sm text-chalk/70">
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
          <div className="mt-10">
            <h2 className="font-display text-lg text-gold-pale">{t("plans", "payments")}</h2>
            <ul className="rule-grid mt-4 grid gap-px">
              {payments.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-4 bg-charcoal p-4 text-sm">
                  <span className="text-chalk/70">{fmtDate(p.date_paid)}{p.payment_method ? ` · ${p.payment_method}` : ""}</span>
                  <span className="font-display text-lg text-gold-pale">{money(Number(p.amount_paid))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Where the money goes, only while the plan can still take money. A
            closed plan gets no bank details and no payment route. */}
        {live && (
          <>
            <div className="mt-12">
              <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-chalk/55">{t("complete", "instructions")}</h2>
              <TransferDetails methods={methods} lang={lang} />
              {methods.length > 0 && <p className="mt-4 text-sm text-chalk/60">{t("complete", "keepRef")}</p>}
            </div>

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
                 portal. The link is the Hub's own — bare for a customer with a
                 linked account, their token for a legacy one, and the portal
                 home when no valid token is left, which is why the fallback
                 line below is not optional. */
              <div className="mt-10 border border-rule p-6">
                <h2 className="font-display text-xl text-gold-pale">{t("plans", "payElsewhereH")}</h2>
                <p className="mt-2 max-w-[60ch] text-sm text-chalk/70">{t("plans", "payElsewhereP")}</p>
                {detail.portal_url && (
                  <Button asChild className="mt-5">
                    <a href={detail.portal_url} target="_blank" rel="noopener noreferrer">{t("plans", "portalCta")}</a>
                  </Button>
                )}
                <p className="mt-4 text-xs text-chalk/55">{t("plans", "portalFallback")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Figure({ k, v, dim }: { k: string; v: string; dim?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-chalk/55">{k}</dt>
      <dd className={`mt-1 font-display text-2xl ${dim ? "text-chalk/55" : "text-gold-pale"}`}>{v}</dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-chalk/55">{k}</dt>
      <dd className="text-chalk">{v}</dd>
    </div>
  );
}
