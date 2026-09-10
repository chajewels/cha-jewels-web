import type { Lang } from "@/lib/i18n";
import type { Condition } from "@/lib/types";

/**
 * The only place a preloved claim is rendered. Copy is fixed on purpose, like
 * KaratBadge: "authenticated in Japan" is a claim about our own intake process,
 * so it is never assembled from product data.
 *
 * New renders nothing — a badge on every piece would say nothing.
 */
export function ConditionBadge({ condition, lang }: { condition: Condition | undefined; lang: Lang }) {
  if (condition !== "Preloved") return null;
  const label = lang === "ja" ? "プレラブド · 日本で真贋確認済み" : "Preloved · authenticated in Japan";
  return <span className="inline-block border border-gold px-3 py-1 text-xs tracking-wide text-gold-pale">{label}</span>;
}
