/**
 * THE STATIC PUBLIC PAGES THE SITEMAP ADVERTISES, in one place.
 *
 * Moved out of app/sitemap.ts (SEO master-plan completion batch, 2026-11-01)
 * so that llms.txt (lib/llms-txt.ts) lists exactly the pages the sitemap
 * lists: one list, two readers, no drift. Each path has an `app/[lang]` route
 * that answers 200 in both languages (tests/seo-sitemap.test.mjs holds this
 * list to the route files). /sale answers 200 even with nothing on sale (its
 * empty state); /legal/tokusho in both languages (only its layaway lines vary).
 * The /collections index has a route but was never listed (a standing
 * sitemap-policy decision).
 *
 * /layaway is NOT in this list because it is English-only: app/sitemap.ts lists
 * it separately through LAYAWAY_LANGS, and llms.txt does the same.
 */
export type SitemapFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export const STATIC_PAGES: readonly { path: string; changeFrequency: SitemapFreq; priority: number }[] = [
  { path: "/sale", changeFrequency: "daily", priority: 0.8 },
  { path: "/loyalty", changeFrequency: "monthly", priority: 0.7 },
  { path: "/wholesale", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/jewelry-guide", changeFrequency: "monthly", priority: 0.6 },
  { path: "/shopping-guide", changeFrequency: "monthly", priority: 0.6 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/why-cha-jewels", changeFrequency: "yearly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/affiliations", changeFrequency: "yearly", priority: 0.4 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/returns", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/tokusho", changeFrequency: "yearly", priority: 0.3 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
];
