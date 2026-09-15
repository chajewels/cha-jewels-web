import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { hub } from "@/lib/hub-api";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [cols, prods] = await Promise.all([hub.collections().catch(() => []), hub.productSlugs().catch(() => [])]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    // /layaway is NOT listed. It 404s in Japanese (owner decision 2026-09-15)
    // and a crawler arrives with no cj-lang cookie, so it is served Japanese —
    // a sitemap entry for it would advertise a URL that 404s for the only
    // visitor that reads this file. The cost is that the layaway page is no
    // longer indexable at all; see the PR.
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
