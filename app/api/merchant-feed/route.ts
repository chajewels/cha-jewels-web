import { hub } from "@/lib/hub-api";
import { siteUrl } from "@/lib/site";
import { buildFeed, reconcile, renderRss } from "@/lib/merchant-feed";
import { CHA_IDENTIFIER_RULE } from "@/lib/merchant-identifiers";

/**
 * GET /api/merchant-feed?lang=ja  (Phase 5; DP-08, owner-approved 2026-11-02; JAPANESE FEED FIRST, OD-MC-1).
 *
 * Read-only. The feed is complete or it is not served: a failed Hub read, a catalog that does not reconcile
 * exactly with the build (every product either an item or a recorded exclusion), or a feed with no items answers
 * 503 with `no-store`. Unsupported records (unknown identifier, condition, status, no description/image/price) are
 * EXCLUDED and counted in `x-feed-excluded`, never guessed. The English feed is not enabled (OD-MC-2: no English
 * target until a Philippines rate card exists): `?lang=en` answers 404.
 * Shipping, returns and tax live at the Merchant Center account level (OD-MC-5/-10); nothing here sends
 * `shipping_weight` (OD-MC-6) or any origin claim. `x-robots-tag: noindex`: it is a data feed, not a page.
 */
export const revalidate = 300;

const HEADERS_ERR = { "cache-control": "no-store", "x-robots-tag": "noindex" } as const;

export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang") ?? "ja";
  if (lang !== "ja" && lang !== "en") return new Response("lang must be ja", { status: 400, headers: HEADERS_ERR });
  if (lang === "en") return new Response("the English feed is not enabled", { status: 404, headers: HEADERS_ERR });
  let products, slugs;
  try {
    [products, slugs] = await Promise.all([hub.allProducts(5000), hub.productSlugs()]);
  } catch {
    return new Response("catalog unavailable", { status: 503, headers: HEADERS_ERR });
  }
  if (!Array.isArray(products) || !Array.isArray(slugs)) return new Response("catalog unavailable", { status: 503, headers: HEADERS_ERR });
  const build = buildFeed(products, "ja", siteUrl(), CHA_IDENTIFIER_RULE);
  // No authoritative total exists in the Website API (OD-MC-12): exact membership is the completeness check, stated in the header.
  const problems = reconcile(build, slugs.map((s) => s.slug), { authoritativeTotal: null });
  if (problems.length) return new Response(`feed incomplete: ${problems.join("; ")}`, { status: 503, headers: HEADERS_ERR });
  const reasons: Record<string, number> = {};
  for (const e of build.excluded) reasons[e.reason] = (reasons[e.reason] ?? 0) + 1;
  const xml = renderRss(build, { title: "Cha Jewels", link: `${siteUrl()}/ja`, description: "Cha Jewels の商品フィード" });
  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300",
      "x-robots-tag": "noindex",
      "x-feed-items": String(build.items.length),
      "x-feed-excluded": String(build.excluded.length),
      "x-feed-excluded-reasons": Object.entries(reasons).map(([k, v]) => `${k}=${v}`).sort().join(","),
      "x-feed-completeness": "membership-exact; no-authoritative-total",
    },
  });
}
