// Local stub Hub for the DP-15 experiments (matrix §S.7). Never deployed.
// Control: GET /__set?fail=collections,posts  (comma list of families to fail with 503; empty = healthy)
//          GET /__set?slow=collections:20000  (delay a family)
//          GET /__get -> current state
import http from "node:http";

export const DATA = {
  collections: [{ slug: "kihei", name_en: "Kihei" }, { slug: "pearls", name_en: "Pearls" }],
  categories: [{ slug: "necklaces", name_en: "Necklaces", sort_order: 1 }],
  products: [{ slug: "exp-ring-1", updated_at: "2026-10-01" }, { slug: "exp-chain-2", updated_at: "2026-10-02" }, { slug: "exp-pearl-3", updated_at: "2026-10-03" }],
  posts: [{ slug: "exp-post", published_at: "2026-09-01" }],
  post: { "exp-post": { slug: "exp-post", title_en: "Exp", body_en: "b", title_ja: "題", body_ja: "本" } },
};
const state = { fail: new Set(), slow: {} };
const family = (path, q) => {
  if (path === "/catalog/collections") return "collections";
  if (path === "/catalog/categories") return "categories";
  if (path === "/catalog/products") return q.get("fields") ? "product-slugs" : "images";
  if (path === "/content/posts") return "posts";
  if (path.startsWith("/content/posts/")) return "post";
  return null;
};
export function start(port) {
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, "http://x");
    const send = (code, body) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
    if (u.pathname === "/__set") {
      state.fail = new Set((u.searchParams.get("fail") ?? "").split(",").filter(Boolean));
      state.slow = Object.fromEntries((u.searchParams.get("slow") ?? "").split(",").filter(Boolean).map((x) => x.split(":")));
      return send(200, { fail: [...state.fail], slow: state.slow });
    }
    if (u.pathname === "/__get") return send(200, { fail: [...state.fail], slow: state.slow });
    const fam = family(u.pathname, u.searchParams);
    if (!fam) return send(404, { error: "not_found" });
    if (state.slow[fam]) await new Promise((r) => setTimeout(r, Number(state.slow[fam])));
    if (state.fail.has(fam)) return send(503, { error: "BOOT_ERROR" });
    if (fam === "collections") return send(200, DATA.collections);
    if (fam === "categories") return send(200, DATA.categories);
    if (fam === "product-slugs") return send(200, DATA.products);
    if (fam === "images") return send(200, []);
    if (fam === "posts") return send(200, DATA.posts);
    const slug = decodeURIComponent(u.pathname.split("/").pop());
    return DATA.post[slug] ? send(200, DATA.post[slug]) : send(404, { error: "not_found" });
  });
  return new Promise((r) => server.listen(port, "127.0.0.1", () => r(server)));
}
if (process.argv[1].endsWith("stub-hub.mjs")) { await start(Number(process.argv[2] ?? 3141)); console.log("stub hub on", process.argv[2] ?? 3141); }
