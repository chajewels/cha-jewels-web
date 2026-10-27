import type { Metadata } from "next";
import { headers } from "next/headers";
import { CheckCircle2, CircleSlash, SearchX } from "lucide-react";
import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { hub, HubError, type ReceiptVerification } from "@/lib/hub-api";
import { normaliseVerifyCode } from "@/lib/receipts";
import { formatSiteDate } from "@/lib/site-time";
import { formatMoney } from "@/lib/utils";
import { alertLight, inputLight } from "@/lib/form-classes";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  // A lookup page, not content: never indexed.
  return { ...(await pageMeta("receiptVerify")), robots: { index: false, follow: false } };
}

/**
 * /receipts/verify?code=<40 hex> — the page every receipt's QR code opens
 * (owner 2026-10-27: authenticity is the QR + verification code, no seal).
 * Public, no sign-in. The Hub answers with the receipt number, issue date,
 * amount and valid/cancelled — nothing else — and limits lookups per IP.
 */
export default async function ReceiptVerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [lang, query, h] = await Promise.all([getLang(), searchParams, headers()]);
  const t = tr(lang);
  const raw = typeof query.code === "string" ? query.code : "";
  const code = raw ? normaliseVerifyCode(raw) : null;
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip");

  let result: ReceiptVerification | null = null;
  let outcome: "none" | "bad" | "found" | "missing" | "limited" | "error" = "none";
  if (raw && !code) outcome = "bad";
  else if (code) {
    try {
      result = await hub.verifyReceipt(code, ip);
      outcome = result ? "found" : "missing";
    } catch (e) {
      outcome = e instanceof HubError && e.status === 429 ? "limited" : "error";
    }
  }
  const eyebrow = `text-[11px] font-semibold text-gold-dark ${lang === "en" ? "uppercase tracking-[0.14em]" : "tracking-[0.05em]"}`;

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[760px]">
        <p className={eyebrow}>Cha Jewels</p>
        <h1 className="mt-3 font-display text-[clamp(32px,4.5vw,56px)] leading-tight text-charcoal-deep">{t("receipts", "verifyH1")}</h1>
        <p className="mt-4 max-w-[58ch] text-charcoal">{t("receipts", "verifyLede")}</p>

        <form method="get" action="/receipts/verify" className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="text-sm text-charcoal/70">
            {t("receipts", "codeLabel")}
            <input
              name="code" defaultValue={raw} required autoComplete="off" spellCheck={false} inputMode="text"
              maxLength={60} className={`mt-1 w-full px-3 py-2 font-mono text-[14px] ${inputLight}`} data-testid="verify-code"
            />
          </label>
          <Button type="submit" className="min-h-11">{t("receipts", "check")}</Button>
        </form>

        <div className="mt-8" aria-live="polite">
          {outcome === "bad" && <p role="alert" className={`${alertLight} p-4 text-sm`}>{t("receipts", "badCode")}</p>}
          {outcome === "limited" && <p role="alert" className={`${alertLight} p-4 text-sm`}>{t("receipts", "rateLimited")}</p>}
          {outcome === "error" && <p role="alert" className={`${alertLight} p-4 text-sm`}>{t("receipts", "unavailable")}</p>}
          {outcome === "missing" && (
            <div className="border border-hairline bg-white p-5" data-testid="verify-missing">
              <p className="flex items-center gap-2 font-display text-[20px] text-charcoal-deep"><SearchX aria-hidden="true" className="h-5 w-5 text-charcoal/70" strokeWidth={1.5} />{t("receipts", "notFoundH")}</p>
              <p className="mt-2 text-sm text-charcoal/80">{t("receipts", "notFoundNote")}</p>
            </div>
          )}
          {outcome === "found" && result && (
            <div className={`border bg-white p-5 sm:p-6 ${result.status === "valid" ? "border-gold-dark" : "border-charcoal/40"}`} data-testid={`verify-${result.status}`}>
              <p className="flex items-center gap-2 font-display text-[22px] text-charcoal-deep">
                {result.status === "valid"
                  ? <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-gold-dark" strokeWidth={1.5} />
                  : <CircleSlash aria-hidden="true" className="h-6 w-6 text-charcoal/70" strokeWidth={1.5} />}
                {t("receipts", result.status === "valid" ? "validH" : "cancelledH")}
              </p>
              {result.status === "cancelled" && <p className="mt-2 text-sm text-charcoal/80">{t("receipts", "cancelledVerifyNote")}</p>}
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                <Kv k={t("receipts", "number")}><span className="cj-fig font-mono text-[13px]">{result.receipt_number}</span></Kv>
                <Kv k={t("receipts", "issued")}><span className="cj-fig">{formatSiteDate(result.issued_at, lang)}</span></Kv>
                <Kv k={t("receipts", "total")}><span className="cj-fig font-display text-[19px]">{formatMoney(Number(result.total), result.currency)}</span></Kv>
              </dl>
            </div>
          )}
        </div>

        <p className="mt-8 text-[13px] text-charcoal/75">{t("receipts", "verifyPrivacy")}</p>
      </div>
    </section>
  );
}

function Kv({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{k}</dt>
      <dd className="mt-1 text-charcoal-deep">{children}</dd>
    </div>
  );
}
