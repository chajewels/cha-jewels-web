// DP-15 sitemap reliability (matrix §S). Mocked Hub, no network, small real
// timers (no fake clocks) so cancellation is observed on real AbortSignals.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { hub } = await import("@/lib/hub-api");
const R = await import("@/lib/sitemap-reads");
const { gatherSitemapData } = await import("@/lib/sitemap-data");
const { default: sitemap } = await import("../app/sitemap.ts");

const FAST = { attemptMs: 200, retryDelaysMs: [5, 10], globalMs: 2000 };
const FULL = { "a-post": { slug: "a-post", title_en: "T", body_en: "b", title_ja: "題", body_ja: "本" }, "en-only": { slug: "en-only", title_en: "T", body_en: "b" } };
const healthy = () => ({
  collections: async () => [{ slug: "kihei" }],
  categories: async () => [{ slug: "necklaces" }],
  productSlugs: async () => [{ slug: "p1", updated_at: "2026-10-01" }],
  posts: async () => [{ slug: "a-post", published_at: "2026-09-01" }, { slug: "en-only", published_at: "2026-09-02" }],
  post: async (slug) => FULL[slug] ?? null,
  allProducts: async () => [],
});
const stub = (over = {}) => Object.assign(hub, healthy(), over);
const hubErr = (status) => Object.assign(new Error(`Hub ${status}`), { status });
const strict = (timing = FAST) => gatherSitemapData({ strict: true, timing });
const names = (e) => e instanceof R.SitemapUnavailable && e.families;

for (const [family, key] of [["collections", "collections"], ["categories", "categories"], ["product-slugs", "productSlugs"], ["posts", "posts"]]) {
  test(`strict: a failed ${family} read throws SitemapUnavailable naming it`, async () => {
    stub({ [key]: async () => { throw hubErr(503); } });
    await assert.rejects(strict(), (e) => names(e)?.includes(family));
  });
  test(`strict: a non-array ${family} response is a failed read, not an empty one`, async () => {
    stub({ [key]: async () => ({ error: "x" }) });
    await assert.rejects(strict(), (e) => names(e)?.includes(family));
  });
}

test("strict: successful EMPTY lists are accepted for every family (no catalog invariant)", async () => {
  stub({ collections: async () => [], categories: async () => [], productSlugs: async () => [], posts: async () => [] });
  const d = await strict();
  assert.deepEqual([d.cols, d.cats, d.prods, d.posts], [[], [], [], []]);
  const urls = (await sitemap_with_strict_env()).map((e) => e.url);
  assert.ok(urls.length > 0 && !urls.some((u) => u.includes("/products/")));
});

test("strict: a failed post-language lookup throws (naming the post); a 404 is a successful absence", async () => {
  stub({ post: async (slug) => { if (slug === "a-post") throw hubErr(503); return null; } });
  await assert.rejects(strict(), (e) => names(e)?.includes("post-language:a-post"));
  stub({ post: async (slug) => (slug === "a-post" ? FULL[slug] : null) }); // en-only 404
  const d = await strict();
  assert.deepEqual(d.langs.get("a-post"), { en: true, ja: true });
  assert.deepEqual(d.langs.get("en-only"), { en: false, ja: false });
});

test("optional image catalog failure never fails the sitemap and logs one warning", async () => {
  stub({ allProducts: async () => { throw hubErr(503); } });
  const warn = console.warn; const lines = []; console.warn = (m) => lines.push(m);
  try { const d = await strict(); assert.deepEqual(d.catalog, []); } finally { console.warn = warn; }
  assert.deepEqual(lines, ["sitemap-images-unavailable"]);
});

test("retries: fail twice then succeed -> ok; exhausted -> throws after exactly 3 attempts", async () => {
  let n = 0;
  stub({ collections: async () => { if (++n < 3) throw hubErr(503); return [{ slug: "k" }]; } });
  assert.equal((await strict()).cols.length, 1);
  assert.equal(n, 3);
  let m = 0;
  stub({ collections: async () => { m++; throw hubErr(503); } });
  await assert.rejects(strict(), (e) => names(e)?.includes("collections"));
  assert.equal(m, 3);
});

test("retries: a definite 4xx (401) is not retried; 429 is", async () => {
  let a = 0; stub({ categories: async () => { a++; throw hubErr(401); } });
  await assert.rejects(strict());
  assert.equal(a, 1);
  let b = 0; stub({ categories: async () => { if (++b < 2) throw hubErr(429); return []; } });
  await strict(); assert.equal(b, 2);
});

test("per-attempt abort really aborts the request signal", async () => {
  const seen = [];
  stub({ collections: (o) => new Promise((_, rej) => { seen.push(o.signal); o.signal.addEventListener("abort", () => rej(o.signal.reason)); }) });
  await assert.rejects(strict({ attemptMs: 30, retryDelaysMs: [1], globalMs: 5000 }), (e) => names(e)?.includes("collections"));
  assert.equal(seen.length, 2);
  assert.ok(seen.every((s) => s.aborted), "every attempt's signal was aborted");
});

test("global deadline aborts everything still running and throws", async () => {
  const seen = [];
  const hang = (o) => new Promise((_, rej) => { seen.push(o.signal); o.signal.addEventListener("abort", () => rej(o.signal.reason)); });
  stub({ collections: hang, categories: hang, productSlugs: hang, posts: (_t, o) => hang(o) });
  const t0 = Date.now();
  await assert.rejects(strict({ attemptMs: 10_000, retryDelaysMs: [1], globalMs: 60 }), (e) => e instanceof R.SitemapUnavailable);
  assert.ok(Date.now() - t0 < 1000, "returned at the deadline, not after the attempt timeout");
  assert.equal(seen.length, 4);
  assert.ok(seen.every((s) => s.aborted));
});

test("fail-fast: after one family fails, reads still running are cancelled", async () => {
  let slow;
  stub({ categories: async () => { throw hubErr(404 + 99 /* 503 */); }, collections: (o) => new Promise((_, rej) => { slow = o.signal; o.signal.addEventListener("abort", () => rej(o.signal.reason)); }) });
  await assert.rejects(strict({ attemptMs: 10_000, retryDelaysMs: [], globalMs: 5000 }), (e) => names(e)?.includes("categories") && !names(e)?.includes("collections"));
  assert.ok(slow.aborted);
});

test("signals compose without AbortSignal.any (older runtime fallback)", () => {
  const orig = AbortSignal.any;
  try {
    AbortSignal.any = undefined;
    const c1 = new AbortController(), c2 = new AbortController();
    const s = R.anySignal([c1.signal, c2.signal]);
    assert.equal(s.aborted, false);
    c2.abort(new Error("x"));
    assert.equal(s.aborted, true);
    const pre = new AbortController(); pre.abort();
    assert.equal(R.anySignal([pre.signal]).aborted, true);
  } finally { AbortSignal.any = orig; }
});

test("mode follows the data source: strict with a real Hub (any environment), tolerant only for fixtures / unconfigured non-production", () => {
  const cfg = { HUB_API_URL: "https://h", HUB_API_KEY: "k" };
  assert.equal(R.strictSitemap({ ...cfg, VERCEL_ENV: "production" }), true);
  assert.equal(R.strictSitemap({ ...cfg, VERCEL_ENV: "preview" }), true, "the real-data acceptance preview is strict");
  assert.equal(R.strictSitemap({ ...cfg }), true);
  assert.equal(R.strictSitemap({ ...cfg }, true), false, "fixtures flag -> tolerant");
  assert.equal(R.strictSitemap({}), false, "CI/local build with no Hub");
  assert.equal(R.strictSitemap({ VERCEL_ENV: "preview" }), false);
  assert.equal(R.strictSitemap({ VERCEL_ENV: "production" }), true, "production without Hub config is a failure, never silent fixtures");
});

test("tolerant (fixture) mode keeps today's static output, labelled sitemap-fixture-mode", async () => {
  const boom = async () => { throw hubErr(503); };
  stub({ collections: boom, categories: boom, productSlugs: boom, posts: boom, allProducts: boom });
  const warn = console.warn; const lines = []; console.warn = (m) => lines.push(m);
  try {
    const d = await gatherSitemapData({ strict: false });
    assert.deepEqual([d.cols, d.cats, d.prods, d.posts], [[], [], [], []]);
  } finally { console.warn = warn; }
  assert.ok(lines.includes("sitemap-fixture-mode"));
});

async function sitemap_with_strict_env() {
  const prev = { u: process.env.HUB_API_URL, k: process.env.HUB_API_KEY };
  process.env.HUB_API_URL = "https://hub.test"; process.env.HUB_API_KEY = "k";
  try { return await sitemap(); } finally { for (const [n, v] of [["HUB_API_URL", prev.u], ["HUB_API_KEY", prev.k]]) v === undefined ? delete process.env[n] : (process.env[n] = v); }
}

test("app/sitemap.ts: strict env + failing Hub rejects; healthy strict output equals the tolerant output", async () => {
  stub();
  const strictOut = (await sitemap_with_strict_env()).map((e) => e.url);
  const tolerantOut = (await sitemap()).map((e) => e.url);
  assert.deepEqual(strictOut, tolerantOut);
  assert.ok(strictOut.includes("https://www.chajewelsjp.com/en/layaway") && !strictOut.some((u) => u.includes("/ja/layaway")));
  stub({ productSlugs: async () => { throw hubErr(503); } });
  await assert.rejects(sitemap_with_strict_env(), (e) => names(e)?.includes("product-slugs"));
});

test("source guard: no essential read is swallowed into an empty result on the strict path", () => {
  const sm = readFileSync("app/sitemap.ts", "utf8");
  const data = readFileSync("lib/sitemap-data.ts", "utf8");
  assert.ok(!/hub\.(collections|categories|productSlugs|posts|post)\([^)]*\)\.catch/.test(sm), "app/sitemap.ts must not .catch an essential read");
  const strictPart = data.slice(data.indexOf("const cancel"));
  assert.ok(!/\.catch\(\s*\(\)\s*=>/.test(strictPart), "strict path must not swallow a read");
});
