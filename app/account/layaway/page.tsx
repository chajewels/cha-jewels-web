import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isNotLinked, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { layawayOffered } from "@/lib/layaway-availability";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { planFigure, planStatusLabel } from "@/lib/plan-status";
import { StatusBadge } from "@/components/account/status-badge";
import type { HubDraft, HubLayawayPlan } from "@/lib/types";
import { listableDraft } from "@/lib/drafts";
import { DraftRows } from "@/components/account/draft-rows";
import { alertLight } from "@/lib/form-classes";
import { AccountShell } from "@/components/account/account-shell";

export const generateMetadata = () => pageMeta("layaway");
export const dynamic = "force-dynamic";

/**
 * The customer's layaway plans — every plan, not only the ones placed here.
 *
 * GATED ON LANGUAGE since 2026-09-25. It used to be deliberately ungated, so
 * that an existing plan never disappeared when someone moved the language
 * toggle. The owner's final rule now is that NOTHING layaway-related is
 * visible on the Japanese site, this page included: on `ja` it is not found,
 * like /layaway, and a plan-holder reads it in English. The payment-report
 * action (lib/layaway-actions.ts) stays ungated; it renders nothing.
 *
 * Every figure is the Hub's: the balance is the Hub's `remaining_balance`, not
 * a subtraction done on this side, so it never disagrees with what a reviewer
 * sees. What this page must be careful about is the LABEL on that figure, since
 * a closed plan keeps a positive balance in the Hub's books; see
 * `remainingLabel`.
 */
export default async function AccountLayawayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [lang, query] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  // NO LAYAWAY ON THE JAPANESE SITE (owner decision 2026-09-25, final), and
  // that now includes the account's plan pages, which used to stay reachable in
  // either language. Same answer as /layaway: not found on `ja`.
  if (!layawayOffered(lang)) notFound();
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/layaway");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let plans: HubLayawayPlan[] = [];
  let drafts: HubDraft[] = [];
  let failed = false;
  if (jwt) {
    // Layaway requests still waiting for confirmation (storefront PR 7).
    drafts = (await hub.drafts(jwt).catch(() => [] as HubDraft[])).filter((d) => d.mode === "layaway" && listableDraft(d));
    try { plans = await hub.layawayPlans(jwt); } catch (e) {
      // Signed in, no customer record yet: the profile step, not an error.
      if (isNotLinked(e)) redirect(profileUrl(withQuery("/account/layaway", query)));
      failed = true;
    }
  } else {
    failed = true;
  }

  return (
    <AccountShell lang={lang} current="layaway" eyebrow={t("accountMenu", "layaway")} title={t("plans", "h1")}>
        <p className="max-w-[70ch] text-[15px] leading-relaxed text-charcoal-deep">{t("plans", "readOnlyNote")}</p>

        {failed && (
          <p className={`mt-8 ${alertLight} p-5 text-sm`}>{t("account", "unavailable")}</p>
        )}

        <DraftRows drafts={drafts} lang={lang} />

        {!failed && plans.length === 0 && drafts.length === 0 && (
          <>
            <p className="mt-10 text-charcoal">{t("plans", "empty")}</p>
            <Link href="/layaway" className="mt-6 inline-block text-gold-dark underline underline-offset-4">{t("account", "layawayLearn")}</Link>
          </>
        )}

        {plans.length > 0 && (
          <ul className="rule-grid mt-8 grid gap-px border border-hairline">
            {plans.map((plan) => {
              const status = planStatusLabel(plan, lang);
              const money = (n: number) => formatMoney(n, plan.currency);
              // What the big figure is, and what to call it. A closed plan that
              // left nothing unpaid must not say anything about unpaid amounts
              // — its badge already reads "Paid in full".
              const figure = planFigure(plan, lang);
              return (
                <li key={plan.id} className="flex flex-wrap items-center justify-between gap-4 bg-white p-5">
                  <div>
                    <p className="font-mono text-gold-dark">{plan.web_reference ?? plan.invoice_number ?? "—"}</p>
                    <p className="mt-1 text-xs text-charcoal/70">
                      {t("plans", "term")} {t("plans", "months", { n: String(plan.payment_plan_months) })}
                    </p>
                  </div>
                  <StatusBadge tone={status.tone} text={status.text} />
                  <div className="text-right">
                    <p className={`font-display text-xl ${figure.emphasise ? "text-gold-dark" : "text-charcoal/70"}`}>
                      {money(figure.amount)}
                    </p>
                    <p className="text-xs text-charcoal/70">
                      {figure.label}
                      {figure.withPlanTotal && <> · {t("plans", "total")} {money(Number(plan.total_amount))}</>}
                    </p>
                  </div>
                  <Link href={`/account/layaway/${plan.id}`} className="text-sm text-gold-dark underline underline-offset-4">
                    {t("plans", "view")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
    </AccountShell>
  );
}
