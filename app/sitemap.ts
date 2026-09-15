import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { hub } from "@/lib/hub-api";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [cols, prods] = await Promise.all([hub.collections().catch(() => []), hub.productSlugs().catch(() => [])]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    // /layaway is NOT listed. It 404s in Japanese (owner decision 2026-09-15),
    // and a crawler with no cj-lang cookie now falls to Accept-Language — which
    // Googlebot usually does not send, so it is still served Japanese and still
    // gets a 404. A sitemap entry would advertise a URL that 404s for the only
    // visitor that reads this file.
    //
    // `/layaway?lang=en` WOULD resolve for any crawler (see LANG_PARAM), so the
    // fix is available, but listing it is pointless while every page in this
    // file declares rel=canonical pointing at the home page — see the PR. Do
    // not add it here until that is fixed.
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
