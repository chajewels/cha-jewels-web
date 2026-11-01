// Local stub Hub for the DP-15 experiments (matrix §S.10). Never deployed. Identifies itself with
// the header x-sitemap-exp-stub so the runner can tell it from anything else on the port.
// Control (GET):
//   /__set?fail=collections,posts   families that answer 503 BOOT_ERROR (empty = healthy)
//   /__set?bad=collections          families that answer 200 with a MALFORMED row
//   /__set?dataset=v1|v2            which valid dataset is served
//   /__get                          state + per-family counters (hits, served503)
import http from "node:http";

const POST_BOTH = { slug: "exp-post", title_en: "Exp", body_en: "b", title_ja: "題", body_ja: "本" };
const POST_EN = { slug: "exp-en-only", title_en: "Exp EN", body_en: "b", title_ja: null, body_ja: null };
export const DATASETS = {
  v1: {
    collections: [{ slug: "kihei" }, { slug: "pearls" }],
    categories: [{ slug: "necklaces", sort_order: 1 }],
    products: [{ slug: "exp-ring-1" }, { slug: "exp-chain-2" }, { slug: "exp-pearl-3" }],
    posts: [{ slug: "exp-post", published_at: "2026-09-01", updated_at: "2026-09-05" }, { slug: "exp-en-only", published_at: "2026-09-06" }],
    post: { "exp-post": POST_BOTH, "exp-en-only": POST_EN },
    images: [{ slug: "exp-ring-1", product_variants: [{ product_media: [{ url: "https://img.example.com/exp-ring-1.jpg", sort: 0 }] }] }],
  },
  // A CHANGED valid dataset: one collection added, one product added, one product removed.
  v2: {
    collections: [{ slug: "kihei" }, { slug: "pearls" }, { slug: "exp-new-col" }],
    categories: [{ slug: "necklaces", sort_order: 1 }],
    products: [{ slug: "exp-ring-1" }, { slug: "exp-pearl-3" }, { slug: "exp-new-4" }],
    posts: [{ slug: "exp-post", published_at: "2026-09-01", updated_at: "2026-09-05" }, { slug: "exp-en-only", published_at: "2026-09-06" }],
    post: { "exp-post": POST_BOTH, "exp-en-only": POST_EN },
    images: [{ slug: "exp-ring-1", product_variants: [{ product_media: [{ url: "https://img.example.com/exp-ring-1.jpg", sort: 0 }] }] }],
  },
};
const has = (v) => typeof v === "string" && v.trim() !== "";
/** The exact set of eligible dynamic paths, derived from the dataset and the language rule (a post is listed in a language only when it has both title and body there). */
export function expectedPaths(ds) {
  const d = DATASETS[ds], out = [];
  for (const c of d.collections) out.push(`/ja/collections/${c.slug}`, `/en/collections/${c.slug}`);
  for (const c of d.categories) out.push(`/ja/categories/${c.slug}`, `/en/categories/${c.slug}`);
  for (const p of d.products) out.push(`/ja/products/${p.slug}`, `/en/products/${p.slug}`);
  for (const p of d.posts) { const f = d.post[p.slug]; if (has(f.title_ja) && has(f.body_ja)) out.push(`/ja/blog/${p.slug}`); if (has(f.title_en) && has(f.body_en)) out.push(`/en/blog/${p.slug}`); }
  return out.sort();
}
const state = { fail: new Set(), bad: new Set(), dataset: "v1" };
const counters = {};
const bump = (fam, k) => { (counters[fam] ??= { hits: 0, served503: 0 })[k]++; };
const family = (path, q) => {
  if (path === "/catalog/collections") return "collections";
  if (path === "/catalog/categories") return "categories";
  if (path === "/catalog/products") return q.get("fields") ? "product-slugs" : "images";
  if (path === "/content/posts") return "posts";
  if (path.startsWith("/content/posts/")) return "post";
  return null;
};
const list = (s) => new Set((s ?? "").split(",").filter(Boolean));
export function start(port) {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    const send = (code, body) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store", "x-sitemap-exp-stub": "1" }); res.end(JSON.stringify(body)); };
    if (u.pathname === "/__set") {
      if (u.searchParams.has("fail")) state.fail = list(u.searchParams.get("fail"));
      if (u.searchParams.has("bad")) state.bad = list(u.searchParams.get("bad"));
      if (u.searchParams.has("dataset")) state.dataset = u.searchParams.get("dataset");
    }
    if (u.pathname === "/__set" || u.pathname === "/__get") return send(200, { fail: [...state.fail], bad: [...state.bad], dataset: state.dataset, counters });
    const fam = family(u.pathname, u.searchParams);
    if (!fam) return send(404, { error: "not_found" });
    bump(fam, "hits");
    if (state.fail.has(fam)) { bump(fam, "served503"); return send(503, { error: "BOOT_ERROR" }); }
    const d = DATASETS[state.dataset];
    if (state.bad.has(fam)) return send(200, [{ name: "row without a slug" }]);
    if (fam === "collections") return send(200, d.collections);
    if (fam === "categories") return send(200, d.categories);
    if (fam === "product-slugs") return send(200, d.products.map((p) => ({ ...p, updated_at: "2026-10-01" })));
    if (fam === "images") return send(200, d.images);
    if (fam === "posts") return send(200, d.posts);
    const slug = decodeURIComponent(u.pathname.split("/").pop());
    return d.post[slug] ? send(200, d.post[slug]) : send(404, { error: "not_found" });
  });
  return new Promise((r) => server.listen(port, "127.0.0.1", () => r(server)));
}
if (process.argv[1]?.endsWith("stub-hub.mjs")) { await start(Number(process.argv[2] ?? 3141)); console.log("stub hub on", process.argv[2] ?? 3141); }
