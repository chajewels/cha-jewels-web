import type { Lang } from "@/lib/i18n";
import { metalsLabel } from "@/lib/metals";
/**
 * The metal stamps, and only the stamps — "PT900 / K18", exactly as stamped.
 * Origin is a separate claim with a separate source (OriginBadge, from product
 * data); a badge that fused the two was asserting an origin for every piece
 * that had a metal.
 */
export function KaratBadge({ metals, lang }: { metals: string[]; lang: Lang }) {
  if (!metals.length) return null;
  return <span className="inline-block border border-gold px-3 py-1 text-xs tracking-wide text-gold-pale">{metalsLabel(metals, lang)}</span>;
}
