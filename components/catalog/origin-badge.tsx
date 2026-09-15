import { dict, type Lang } from "@/lib/i18n";
import type { Origin } from "@/lib/types";

/**
 * The ONLY place an origin claim is rendered, and it renders one only from
 * data. The check-terminology script exempts this file and the dictionary
 * entry it reads (product.originJapan): the Japanese-origin claim hardcoded
 * anywhere else fails the build.
 *
 *   JAPAN            -> the Japanese-origin label (product.originJapan)
 *   BRAND with brand -> the brand name, and NO origin claim
 *   OTHER, UNKNOWN   -> nothing (a missing origin is not a Japanese one)
 *
 * The metal lives in KaratBadge and the preloved check in ConditionBadge —
 * "authenticated in Japan" is a claim about our intake, not about origin, so
 * it stays true whatever this badge says.
 */
export function OriginBadge({ origin, brand, lang }: { origin: Origin | undefined; brand: string | null | undefined; lang: Lang }) {
  const label = origin === "JAPAN"
    ? dict.product.originJapan[lang]
    : origin === "BRAND" && brand?.trim()
      ? brand.trim()
      : null;
  if (!label) return null;
  return <span className="inline-block border border-gold px-3 py-1 text-xs tracking-wide text-gold-pale">{label}</span>;
}
