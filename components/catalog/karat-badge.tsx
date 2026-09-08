import type { Lang } from "@/lib/i18n";
/** The only place the metal claim is rendered. Copy is fixed on purpose. */
export function KaratBadge({ karat, lang }: { karat: string | null; lang: Lang }) {
  if (!karat) return null;
  const mij = lang === "ja" ? "日本製" : "Made in Japan";
  const label = karat === "K18" ? (lang === "ja" ? `K18ゴールド · ${mij}` : `K18 gold · ${mij}`) : `${karat} · ${mij}`;
  return <span className="inline-block border border-gold px-3 py-1 text-xs tracking-wide text-gold-pale">{label}</span>;
}
