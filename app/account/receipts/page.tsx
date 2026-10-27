import { pageMeta } from "@/lib/page-meta";
import { redirect } from "next/navigation";
import { isNotLinked, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { formatSiteDate } from "@/lib/site-time";
import { ADDRESSEE_MAX, receiptErrorKey, visibleReceipts, type HubReceipt } from "@/lib/receipts";
import { alertLight } from "@/lib/form-classes";
import { AccountShell } from "@/components/account/account-shell";
import { ReceiptPanel } from "@/components/account/receipt-panel";

export const generateMetadata = () => pageMeta("receipts");
export const dynamic = "force-dynamic";

/**
 * Every website receipt she owns, newest first — issued and cancelled.
 * Plan receipts are not shown on the Japanese site (lib/receipts.ts). A failed
 * PDF download lands here with ?error=<Hub code>.
 */
export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [lang, query] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/receipts");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let receipts: HubReceipt[] = [];
  let failed = false;
  if (jwt) {
    try { receipts = visibleReceipts(await hub.receipts(jwt), lang); } catch (e) {
      if (isNotLinked(e)) redirect(profileUrl(withQuery("/account/receipts", query)));
      failed = true;
    }
  } else {
    failed = true;
  }
  const errorCode = typeof query.error === "string" ? query.error : null;

  return (
    <AccountShell lang={lang} current="receipts" eyebrow={t("accountMenu", "receipts")} title={t("receipts", "h1")}>
      <p className="mb-6 max-w-[62ch] text-[15px] leading-relaxed text-charcoal-deep">{t("receipts", "lede")}</p>

      {errorCode && <p role="alert" className={`mb-6 ${alertLight} p-4 text-sm`} data-testid="receipt-download-error">{t("receipts", receiptErrorKey(errorCode), { max: String(ADDRESSEE_MAX) })}</p>}
      {failed && <p className={`mb-6 ${alertLight} p-5 text-sm`}>{t("account", "unavailable")}</p>}

      {!failed && receipts.length === 0 && (
        <p className="border border-hairline bg-white p-5 text-charcoal-deep" data-testid="receipts-empty">{t("receipts", "empty")}</p>
      )}

      {receipts.map((r) => (
        <ReceiptPanel
          key={r.id}
          lang={lang}
          receipt={r}
          issuedLabel={formatSiteDate(r.issued_at, lang)}
          totalLabel={formatMoney(Number(r.total), r.currency)}
          headingLevel={2}
          orderHref={{
            href: r.kind === "layaway" ? `/account/layaway/${encodeURIComponent(r.order_id)}` : `/account/orders/${encodeURIComponent(r.order_id)}`,
            label: t("receipts", r.kind === "layaway" ? "viewPlan" : "viewOrder"),
          }}
        />
      ))}
    </AccountShell>
  );
}
