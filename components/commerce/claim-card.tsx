import { formatMoney } from "@/lib/utils";
import { tr, type Lang } from "@/lib/i18n";
type Claim = { id: string; code: string; price_locked: number; status: string; expires_at: string };
export function ClaimCard({ claim, lang }: { claim: Claim; lang: Lang }) {
  const t = tr(lang);
  const expired = claim.status !== "held" || new Date(claim.expires_at) < new Date();
  const until = new Date(claim.expires_at).toLocaleString(lang === "ja" ? "ja-JP" : "en-GB", { timeZone: "Asia/Tokyo" });
  return (
    <div className="border border-gold bg-velvet-deep p-6">
      <p className="text-xs text-champagne/55">{t("claim", "code")}</p>
      <p className="font-display text-3xl text-gold-pale">{claim.code}</p>
      <p className="mt-4 text-champagne/80">{t("claim", "priceLocked")} <b className="text-champagne">{formatMoney(claim.price_locked)}</b></p>
      {expired
        ? <p className="mt-4 border border-garnet p-3 text-sm">{t("claim", "ended")}</p>
        : <p className="mt-4 text-sm text-champagne/70">{t("claim", "heldUntil", { time: until })}</p>}
    </div>
  );
}
