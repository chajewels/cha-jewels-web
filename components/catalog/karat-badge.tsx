import type { Lang } from "@/lib/i18n";
import { metalLabel, normalizeMetal, isGold } from "@/lib/metals";
/** The only place the metal claim is rendered. Copy is fixed on purpose. */
export function KaratBadge({ karat, lang }: { karat: string | null; lang: Lang }) {
  const m = normalizeMetal(karat);
  if (!m) return null;
  const mij = lang === "ja" ? "日本製" : "Made in Japan";
  const label = isGold(m) ? (lang === "ja" ? `${metalLabel(m, lang)} ゴールド · ${mij}` : `${metalLabel(m, lang)} gold · ${mij}`) : `${metalLabel(m, lang)} · ${mij}`;
  return <span className="inline-block border border-gold px-3 py-1 text-xs tracking-wide text-gold-pale">{label}</span>;
}
