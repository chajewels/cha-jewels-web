import type { Lang } from "@/lib/i18n";
import { metalLabel, normalizeMetal } from "@/lib/metals";
/**
 * The metal, and only the metal — "K18 (Au750)". Origin is a separate claim
 * with a separate source (OriginBadge, from product data); a badge that fused
 * the two was asserting an origin for every piece that had a metal.
 */
export function KaratBadge({ karat, lang }: { karat: string | null; lang: Lang }) {
  const m = normalizeMetal(karat);
  if (!m) return null;
  return <span className="inline-block border border-gold px-3 py-1 text-xs tracking-wide text-gold-pale">{metalLabel(m, lang)}</span>;
}
