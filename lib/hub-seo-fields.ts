/**
 * HUB SEO FIELDS FOR COLLECTIONS AND CATEGORIES — storefront side (DP-06, owner-approved 2026-11-02).
 *
 * The Hub owner implements the fields (draft: docs/seo/phase-6/COMMERCIAL-LANDING-ARCHITECTURE.md §4); until they exist
 * every function here returns null/[]/false and the pages behave EXACTLY as before (today's name and description are the
 * fallback). Nothing is invented and nothing crosses languages: a Japanese page never shows English field text.
 * A value longer than its documented limit is treated as invalid and ignored (falls back), so a bad Hub edit cannot
 * produce a 2,000-character <title>.
 */
export type Lang = "en" | "ja";
export type HubSeoFields = {
  seo_title_en?: string | null; seo_title_ja?: string | null;
  seo_description_en?: string | null; seo_description_ja?: string | null;
  h1_en?: string | null; h1_ja?: string | null;
  intro_en?: string | null; intro_ja?: string | null;
  seo_copy_en?: string | null; seo_copy_ja?: string | null;
  hero_alt_en?: string | null; hero_alt_ja?: string | null;
  faq?: unknown;
  noindex?: boolean | null;
};
const LIMITS = { seo_title: 70, seo_description: 160, h1: 80, intro: 400, seo_copy: 4000, hero_alt: 125 } as const;
type Key = keyof typeof LIMITS;

function field(e: HubSeoFields | null | undefined, key: Key, lang: Lang): string | null {
  const v = (e as Record<string, unknown> | null | undefined)?.[`${key}_${lang}`];
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= LIMITS[key] ? t : null;
}
export const seoTitle = (e: HubSeoFields | null | undefined, lang: Lang) => field(e, "seo_title", lang);
export const seoDescription = (e: HubSeoFields | null | undefined, lang: Lang) => field(e, "seo_description", lang);
export const seoH1 = (e: HubSeoFields | null | undefined, lang: Lang) => field(e, "h1", lang);
export const seoIntro = (e: HubSeoFields | null | undefined, lang: Lang) => field(e, "intro", lang);
export const seoCopy = (e: HubSeoFields | null | undefined, lang: Lang) => field(e, "seo_copy", lang);
export const heroAlt = (e: HubSeoFields | null | undefined, lang: Lang) => field(e, "hero_alt", lang);

/** Thin-page guard: only an explicit `true` hides the page (a missing or odd value never does). */
export const isNoindex = (e: HubSeoFields | null | undefined): boolean => e?.noindex === true;

export type FaqEntry = { q: string; a: string };
/**
 * Visible FAQ entries for one language: at most 6, each with BOTH a question and an answer in THAT language. FAQ
 * JSON-LD may be emitted only from what this returns AND only when the entries are rendered on the page (governance
 * rule 11): an empty array means no block and no markup.
 */
export function faqEntries(e: HubSeoFields | null | undefined, lang: Lang): FaqEntry[] {
  if (!Array.isArray(e?.faq)) return [];
  const out: FaqEntry[] = [];
  for (const row of e.faq as unknown[]) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const q = r[`q_${lang}`], a = r[`a_${lang}`];
    if (typeof q === "string" && typeof a === "string" && q.trim() && a.trim()) out.push({ q: q.trim(), a: a.trim() });
    if (out.length === 6) break;
  }
  return out;
}
