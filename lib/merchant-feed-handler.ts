import { siteUrl } from "@/lib/site";
import { buildFeed, reconcile, renderRss, type IdentifierRule } from "@/lib/merchant-feed";
import type { Product } from "@/lib/types";

/** The read limit of the Website API catalog reads (`?limit=5000`). The API offers NO offset, cursor or total (supabase/contracts/api.md). */
export const CATALOG_LIMIT = 5000;
const ERR = { "cache-control": "no-store", "x-robots-tag": "noindex" } as const;
const fail = (status: number, body: string) => new Response(body, { status, headers: ERR });

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const optStr = (v: unknown) => v === undefined || v === null || typeof v === "string";

/** The first reason a product row is malformed, or null. Only the fields the builder reads are checked; never echoes row data. */
export function productRowProblem(p: unknown): string | null {
  if (!isObj(p)) return "row is not an object";
  if (typeof p.slug !== "string" || !p.slug.trim()) return "slug missing";
  for (const k of ["sku", "name", "name_en", "name_ja", "description_en", "description_ja", "status", "condition", "origin", "brand"]) if (!optStr(p[k])) return `${k} has the wrong type`;
  if (p.product_variants !== undefined && p.product_variants !== null) {
    if (!Array.isArray(p.product_variants)) return "product_variants is not a list";
    for (const v of p.product_variants) {
      if (!isObj(v)) return "a variant is not an object";
      if (typeof v.price_jpy !== "number" || !Number.isFinite(v.price_jpy)) return "a variant price is not a number";
      if (v.product_media !== undefined && v.product_media !== null && !Array.isArray(v.product_media)) return "product_media is not a list";
    }
  }
  for (const k of ["collection_slugs", "category_slugs", "metals"]) if (p[k] !== undefined && p[k] !== null && !(Array.isArray(p[k]) && (p[k] as unknown[]).every((x) => typeof x === "string"))) return `${k} is not a list of strings`;
  return null;
}

export type FeedDeps = {
  readProducts: (limit: number) => Promise<unknown>;
  readSlugs: () => Promise<unknown>;
  rule: IdentifierRule;
  base?: string;
};

/**
 * Serves the Japanese feed, or refuses. Every refusal is a controlled 503 with `no-store`: a failed read, an invalid
 * upstream row, a read that reached the API limit (completeness cannot be proven: the API has no offset or total), a
 * catalog that does not reconcile exactly with the build, or a feed with no items.
 */
export async function serveFeed(req: Request, deps: FeedDeps): Promise<Response> {
  const lang = new URL(req.url).searchParams.get("lang") ?? "ja";
  if (lang !== "ja" && lang !== "en") return fail(400, "lang must be ja");
  if (lang === "en") return fail(404, "the English feed is not enabled");
  let products: unknown, slugs: unknown;
  try { [products, slugs] = await Promise.all([deps.readProducts(CATALOG_LIMIT), deps.readSlugs()]); }
  catch { return fail(503, "catalog unavailable"); }
  if (!Array.isArray(products) || !Array.isArray(slugs)) return fail(503, "catalog invalid: a list was expected");
  try {
    for (let i = 0; i < products.length; i++) { const why = productRowProblem(products[i]); if (why) return fail(503, `catalog invalid: product row ${i}: ${why}`); }
  } catch { return fail(503, "catalog invalid: a row could not be read"); }
  for (let i = 0; i < slugs.length; i++) if (!isObj(slugs[i]) || typeof (slugs[i] as { slug?: unknown }).slug !== "string") return fail(503, `catalog invalid: slug row ${i}`);
  if (products.length >= CATALOG_LIMIT || slugs.length >= CATALOG_LIMIT)
    return fail(503, `catalog read reached its limit (${CATALOG_LIMIT}): completeness cannot be proven because the Website API has no offset or total`);
  const base = deps.base ?? siteUrl();
  let build;
  try { build = buildFeed(products as Product[], "ja", base, deps.rule); } catch { return fail(503, "feed build failed on the upstream data"); }
  const problems = reconcile(build, (slugs as { slug: string }[]).map((s) => s.slug), { authoritativeTotal: null });
  if (problems.length) return fail(503, `feed incomplete: ${problems.join("; ")}`);
  const reasons: Record<string, number> = {};
  for (const e of build.excluded) reasons[e.reason] = (reasons[e.reason] ?? 0) + 1;
  return new Response(renderRss(build, { title: "Cha Jewels", link: `${base}/ja`, description: "Cha Jewels の商品フィード" }), {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300",
      "x-robots-tag": "noindex",
      "x-feed-items": String(build.items.length),
      "x-feed-excluded": String(build.excluded.length),
      "x-feed-excluded-reasons": Object.entries(reasons).map(([k, v]) => `${k}=${v}`).sort().join(","),
      "x-feed-completeness": `membership-exact; read-limit-${CATALOG_LIMIT}-not-reached; no-authoritative-total`,
    },
  });
}
