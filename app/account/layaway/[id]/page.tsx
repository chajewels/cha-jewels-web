import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { orderLineTitle } from "@/lib/catalog-i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { toneClass } from "@/lib/order-status";
import { isLivePlan, planStatusLabel, rowStatusLabel } from "@/lib/plan-status";
import { Button } from "@/components/ui/button";
import { TransferDetails } from "@/components/commerce/transfer-details";
import { LayawayPayForm } from "@/components/commerce/layaway-pay-form";

export const generateMetadata = () => pageMeta("layaway");
export const dynamic = "force-dynamic";

/**
 * One plan: what is owed, when, what has been paid, and where to send the next
 * transfer.
 *
 * Every figure is the Hub's. Per-row amounts come from `actual_remaining` and
 * per-row state from `computed_status` — the Hub's display rule — so a row that
 * has been part paid reads the same here as it does to a reviewer.
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

  const detail = jwt ? await hub.layawayPlan(jwt, id).catch(() => null) : null;
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
  const money = (n: number) => formatMoney(n, plan.currency);
  const locale = lang === "ja" ? "ja-JP" : "en-GB";
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });
  const fmtStamp = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });

  const live = isLivePlan(plan);
  const awaitingDeposit = live && !detail.deposit_paid;
  // What to send next: the deposit while it is outstanding, otherwise the
  // earliest row that still owes something. The Hub's own waterfall order.
  const nextRow = schedule.find((row) => row.actual_remaining > 0 && row.computed_status !== "cancelled");
  const suggested = awaitingDeposit
    ? Number(plan.downpayment_amount)
    : Number(nextRow?.actual_remaining ?? plan.remaining_balance);

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[820px]">
        <Link href="/account/layaway" className="text-sm text-champagne/55 underline underline-offset-4">{t("plans", "back")}</Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-mono text-[clamp(24px,3vw,38px)] text-gold-pale">{plan.web_reference ?? plan.invoice_number ?? "—"}</h1>
          <span className={`border px-3 py-1 text-xs ${toneClass(status.tone)}`}>{status.text}</span>
        </div>

        {/* Straight off the checkout, before any deposit exists. */}
        {query.placed === "1" && awaitingDeposit && (
          <p className="mt-6 border border-gold px-4 py-3 text-sm text-gold-pale">{t("complete", "layawayLede")}</p>
        )}

        <dl className="mt-10 grid gap-4 border border-rule p-5 sm:grid-cols-3">
          <Figure k={t("plans", "total")} v={money(Number(plan.total_amount))} />
          <Figure k={t("plans", "paid")} v={money(Number(plan.total_paid))} />
          <Figure k={t("plans", "remaining")} v={money(Number(plan.remaining_balance))} />
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
          <p className="mt-6 text-sm text-champagne/70">{t("plans", "awaitingDeposit")}</p>
        )}
        {/* A lapsed hold is a closed plan with nothing owed — say both. */}
        {plan.expired_at && (
          <p className="mt-6 border border-rule p-4 text-sm text-champagne/70">{t("plans", "expiredNote")}</p>
        )}

        {items.length > 0 && (
          <ul className="rule-grid mt-10 grid gap-px">
            {items.map((line) => (
              <li key={line.id} className="flex flex-wrap items-baseline justify-between gap-4 bg-velvet p-5">
                <div>
                  <p className="text-champagne">{orderLineTitle(line, lang)}</p>
                  <p className="mt-1 text-xs text-champagne/55">
                    {line.sku ? `SKU ${line.sku}` : ""}{line.quantity > 1 ? ` · × ${line.quantity}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-12 font-display text-xl text-gold-pale">{t("plans", "schedule")}</h2>
        <ul className="rule-grid mt-4 grid gap-px">
          {schedule.map((row) => (
            <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-4 bg-velvet p-4 text-sm">
              <span className="text-champagne/75">
                {t("plans", "installment", { n: String(row.installment_number) })} · {fmtDate(row.due_date)}
              </span>
              <span className="text-xs text-champagne/55">{rowStatusLabel(row, lang)}</span>
              {/* actual_remaining is what is still owed on this row; the amount
                  beside it is what the row was for. */}
              <span className="font-display text-lg text-gold-pale">
                {money(Number(row.actual_remaining))}
              </span>
            </li>
          ))}
        </ul>

        {pendingSubs.length > 0 && (
          <div className="mt-10 border border-gold/60 p-5">
            <h2 className="font-display text-lg text-gold-pale">{t("plans", "pending")}</h2>
            <ul className="mt-3 space-y-1 text-sm text-champagne/70">
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
                <li key={p.id} className="flex items-baseline justify-between gap-4 bg-velvet p-4 text-sm">
                  <span className="text-champagne/70">{fmtDate(p.date_paid)}{p.payment_method ? ` · ${p.payment_method}` : ""}</span>
                  <span className="font-display text-lg text-gold-pale">{money(Number(p.amount_paid))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions and the report form only while the plan can take money. */}
        {live && (
          <>
            <div className="mt-12">
              <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-champagne/45">{t("complete", "instructions")}</h2>
              <TransferDetails methods={methods} lang={lang} />
              {methods.length > 0 && <p className="mt-4 text-sm text-champagne/60">{t("complete", "keepRef")}</p>}
            </div>
            <LayawayPayForm
              accountId={plan.id}
              lang={lang}
              currency={plan.currency}
              suggestedAmount={Math.max(0, Math.round(suggested))}
              methods={methods}
            />
          </>
        )}
      </div>
    </section>
  );
}

function Figure({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-champagne/55">{k}</dt>
      <dd className="mt-1 font-display text-2xl text-gold-pale">{v}</dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-champagne/55">{k}</dt>
      <dd className="text-champagne">{v}</dd>
    </div>
  );
}
