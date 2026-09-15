import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { hub } from "@/lib/hub-api";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [cols, prods] = await Promise.all([hub.collections().catch(() => []), hub.productSlugs().catch(() => [])]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    // /layaway is NOT listed, and this is not an oversight — read this before
    // "fixing" it.
    //
    // It 404s in Japanese (owner decision 2026-09-15). A crawler with no
    // cj-lang cookie falls through to Accept-Language, which Googlebot usually
    // does not send, so it is served Japanese and gets the 404. Listing
    // `/layaway` would therefore advertise a URL that 404s for the only visitor
    // that reads this file.
    //
    // `/layaway?lang=en` DOES resolve for any crawler (see LANG_PARAM) — but
    // listing that does not work either: its canonical is `/layaway` (we drop
    // ?lang deliberately, so the parameter does not mint a second indexable URL
    // per page), and that canonical is the URL which 404s. Pointing a crawler
    // at a page whose canonical is a 404 is worse than saying nothing.
    //
    // So the page is genuinely unindexable today, and the fix is not in this
    // file: English needs its own path (an /en/... prefix), which is a URL-
    // scheme decision, not a sitemap entry. Until that exists, share the
    // English page as a link — /layaway?lang=en works perfectly for a person.
    { url: `${base}/loyalty`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/wholesale`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/gold-guide`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ...cols.map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...prods.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
