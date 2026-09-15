import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { planStatusLabel, remainingIsPayable, remainingLabel } from "@/lib/plan-status";
import { toneClass } from "@/lib/order-status";
import type { HubLayawayPlan } from "@/lib/types";

export const generateMetadata = () => pageMeta("layaway");
export const dynamic = "force-dynamic";

/**
 * The customer's layaway plans — every plan, not only the ones placed here.
 *
 * Every figure is the Hub's: the balance is the Hub's `remaining_balance`, not
 * a subtraction done on this side, so it never disagrees with what a reviewer
 * sees. What this page must be careful about is the LABEL on that figure, since
 * a closed plan keeps a positive balance in the Hub's books; see
 * `remainingLabel`.
 */
export default async function AccountLayawayPage() {
  const lang = await getLang();
  const t = tr(lang);
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/layaway");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let plans: HubLayawayPlan[] = [];
  let failed = false;
  if (jwt) {
    try { plans = await hub.layawayPlans(jwt); } catch { failed = true; }
  } else {
    failed = true;
  }

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[900px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("plans", "h1")}</h1>
          <Link href="/account" className="text-sm text-champagne/60 underline underline-offset-4">{t("account", "h1")}</Link>
        </div>

        <p className="mt-6 max-w-[70ch] text-sm text-champagne/65">{t("plans", "readOnlyNote")}</p>

        {failed && (
          <p className="mt-8 border border-garnet/60 bg-velvet-deep p-5 text-sm text-champagne/85">{t("account", "unavailable")}</p>
        )}

        {!failed && plans.length === 0 && (
          <>
            <p className="mt-10 text-champagne/75">{t("plans", "empty")}</p>
            <Link href="/layaway" className="mt-6 inline-block text-gold-pale underline underline-offset-4">{t("account", "layawayLearn")}</Link>
          </>
        )}

        {plans.length > 0 && (
          <ul className="rule-grid mt-10 grid gap-px">
            {plans.map((plan) => {
              const status = planStatusLabel(plan, lang);
              const money = (n: number) => formatMoney(n, plan.currency);
              return (
                <li key={plan.id} className="flex flex-wrap items-center justify-between gap-4 bg-velvet p-5">
                  <div>
                    <p className="font-mono text-gold-pale">{plan.web_reference ?? plan.invoice_number ?? "—"}</p>
                    <p className="mt-1 text-xs text-champagne/55">
                      {t("plans", "term")} {t("plans", "months", { n: String(plan.payment_plan_months) })}
                    </p>
                  </div>
                  <span className={`border px-3 py-1 text-xs ${toneClass(status.tone)}`}>{status.text}</span>
                  <div className="text-right">
                    <p className={`font-display text-xl ${remainingIsPayable(plan) ? "text-gold-pale" : "text-champagne/55"}`}>
                      {money(Number(plan.remaining_balance))}
                    </p>
                    <p className="text-xs text-champagne/55">
                      {remainingLabel(plan, lang)} · {t("plans", "total")} {money(Number(plan.total_amount))}
                    </p>
                  </div>
                  <Link href={`/account/layaway/${plan.id}`} className="text-sm text-gold-pale underline underline-offset-4">
                    {t("plans", "view")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
