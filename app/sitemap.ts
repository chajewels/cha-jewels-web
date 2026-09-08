import type { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase/server";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.chajewelsjapan.com";
  if (process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1") return [{ url: base }];
  const sb = await supabaseServer();
  const [{ data: cols }, { data: prods }] = await Promise.all([
    sb.from("collections").select("slug").returns<{ slug: string }[]>(),
    sb.from("products").select("slug, created_at").eq("status", "active").returns<{ slug: string; created_at: string }[]>(),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/layaway`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/loyalty`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ...(cols ?? []).map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...(prods ?? []).map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.created_at, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
