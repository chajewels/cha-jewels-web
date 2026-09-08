import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { hub } from "@/lib/hub-api";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [cols, prods] = await Promise.all([hub.collections().catch(() => []), hub.productSlugs().catch(() => [])]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/layaway`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/loyalty`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ...cols.map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...prods.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
