import { publishedGuide, type Guide } from "@/lib/guides/registry";

/**
 * "LEARN MORE" LINKS for a product page (docs/seo/phase-6/INTERNAL-LINKING-MAP.md §3), decided ONLY from data the Hub
 * already sends (never from a SKU or a name: api.md §718). A guide is linked only when it is PUBLISHED (and the
 * language is English: guides have no Japanese version); otherwise the link goes to the existing page that serves the
 * intent today. Never a link to layaway; at most three links; one per target.
 */
export type LinkContext = {
  lang: "en" | "ja";
  material?: string | null;
  collectionSlugs?: readonly string[] | null;
  weightG?: number | null;
  condition?: "New" | "Preloved" | null;
};
export type LearnMoreLink = { id: "k18" | "kihei" | "weight" | "preloved"; label: string; href: string; kind: "guide" | "fallback" };

const LABEL = {
  k18: { en: "What K18 means and how to read the stamp", ja: "K18とは・刻印の読み方" },
  kihei: { en: "Learn about Kihei cuts and weaves", ja: "喜平の種類と編み方" },
  weight: { en: "How gram weight works", ja: "重量（グラム）の見方" },
  preloved: { en: "Preloved pieces: questions and answers", ja: "プレラブド品についてのよくあるご質問" },
} as const;

export function learnMoreLinks(ctx: LinkContext, all?: readonly Guide[]): LearnMoreLink[] {
  const L = ctx.lang;
  const guide = (slug: string) => (L === "en" ? publishedGuide(slug, all) : undefined);
  const out: LearnMoreLink[] = [];
  const add = (id: LearnMoreLink["id"], guideSlug: string | null, fallback: string) => {
    const g = guideSlug ? guide(guideSlug) : undefined;
    out.push({ id, label: LABEL[id][L], href: g ? `/en/guides/${g.slug}` : fallback, kind: g ? "guide" : "fallback" });
  };
  if (typeof ctx.material === "string" && /k\s?18/i.test(ctx.material)) add("k18", "k18-gold-japan", `/${L}/jewelry-guide#metals`);
  if (ctx.collectionSlugs?.includes("kihei")) add("kihei", "kihei", `/${L}/collections/necklaces`);
  if (typeof ctx.weightG === "number" && ctx.weightG > 0) add("weight", "how-gold-jewelry-is-weighed", `/${L}/jewelry-guide#metals`);
  if (ctx.condition === "Preloved") add("preloved", null, `/${L}/faq`);
  const seen = new Set<string>();
  return out.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true))).slice(0, 3);
}
