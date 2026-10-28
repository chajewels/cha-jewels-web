// sitemap.xml (app/sitemap.ts). Run: npm run test:unit.
//
// Only public, indexable, 200-answering URLs belong in a sitemap. The Hub is
// replaced by the test harness's stub; each test fills in what it needs.
//
// PHASE 2D (owner-approved 2026-10-28): every page is listed at its /ja and
// /en locale URLs, never at its bare legacy URL (2E-stage-1 redirects those);
// the root `/` alone stays listed beside /ja and /en until OD-3; no hreflang
// in the sitemap (OD-12: HTML only).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const { hub } = await import("@/lib/hub-api");
const policy = await import("@/lib/seo-policy");
const { localeOf, stripLocale } = await import("@/lib/locale");
const { default: sitemap } = await import("../app/sitemap.ts");

const BASE = "https://www.chajewelsjp.com";
// Full rows for hub.post(slug): the list route sends no bodies, the article
// route does, and postLanguages reads the article route.
const FULL = {
  "what-is-kihei": { slug: "what-is-kihei", title_en: "Kihei", body_en: "b", title_ja: "喜平", body_ja: "本文" },
  "english-only": { slug: "english-only", title_en: "Only English", body_en: "b", title_ja: null, body_ja: null },
  "japanese-only": { slug: "japanese-only", title_en: null, body_en: null, title_ja: "日本語のみ", body_ja: "本文" },
  "ja-title-no-body": { slug: "ja-title-no-body", title_en: "T", body_en: "b", title_ja: "題", body_ja: "  " },
  "layaway-how-it-works": { slug: "layaway-how-it-works", title_en: "Layaway", body_en: "b", layaway_only: true },
};
function stubHub(over = {}) {
  Object.assign(hub, {
    collections: async () => [{ slug: "kihei" }, { slug: "pearls" }],
    categories: async () => [{ slug: "necklaces" }],
    productSlugs: async () => [{ slug: "p1-ring", updated_at: "2026-10-01" }, { slug: "p2-chain", updated_at: "2026-10-02" }],
    posts: async () => [
      { slug: "what-is-kihei", published_at: "2026-09-01", updated_at: "2026-09-05" },
      { slug: "english-only", published_at: "2026-09-06" },
      { slug: "japanese-only", published_at: "2026-09-07" },
      { slug: "ja-title-no-body", published_at: "2026-09-08" },
      { slug: "layaway-how-it-works", published_at: "2026-09-02", layaway_only: true },
      { slug: "draft-post", published_at: "2026-09-03", published: false },
      { slug: "  ", published_at: "2026-09-04" },
    ],
    post: async (slug) => FULL[slug] ?? null,
    ...over,
  });
}
const urls = async () => (await sitemap()).map((e) => e.url);
const paths = async () => (await urls()).map((x) => new URL(x).pathname);

test("every entry is an absolute, query-free URL on the site origin, listed once", async () => {
  stubHub();
  const u = await urls();
  for (const x of u) {
    const url = new URL(x);
    assert.equal(url.origin, BASE, x);
    assert.equal(url.search, "", `${x} must not carry a query string`);
    assert.equal(url.hash, "", `${x} must not carry a fragment`);
  }
  assert.equal(new Set(u).size, u.length, "no duplicate entries");
});

test("no private or utility route is advertised", async () => {
  stubHub();
  for (const path of await paths()) {
    assert.equal(policy.isNoindexPath(path), false, `${path} is noindex but is in the sitemap`);
  }
});

test("2D: every entry is a locale URL except the root, which stays (OD-3)", async () => {
  stubHub();
  for (const path of await paths()) {
    if (path === "/") continue;
    assert.ok(localeOf(path), `${path} is a bare legacy URL; 2E-stage-1 redirects it, so it must not be listed`);
  }
  const p = await paths();
  for (const home of ["/", "/ja", "/en"]) assert.ok(p.includes(home), `${home} should be listed`);
});

test("2D: each resource is listed in both languages, Japanese first", async () => {
  stubHub();
  const p = await paths();
  for (const bare of ["/products/p1-ring", "/products/p2-chain", "/categories/necklaces", "/collections/kihei", "/collections/pearls", "/blog", "/blog/what-is-kihei", "/jewelry-guide", "/faq", "/legal/tokusho", "/loyalty", "/sale"]) {
    const ja = p.indexOf(`/ja${bare}`), en = p.indexOf(`/en${bare}`);
    assert.ok(ja !== -1 && en !== -1, `${bare} should be listed as /ja and /en`);
    assert.ok(ja < en, `${bare}: /ja before /en`);
  }
});

test("2D: the static pages listed are exactly the [lang] routes, minus the never-listed /collections index", async () => {
  stubHub();
  // The static [lang] page files: every page.tsx under app/[lang] with no
  // dynamic segment, as a bare path.
  const root = join(process.cwd(), "app", "[lang]");
  const found = [];
  (function walk(dir, rel) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { if (!name.startsWith("[")) walk(full, `${rel}/${name}`); }
      else if (name === "page.tsx") found.push(rel || "/");
    }
  })(root, "");
  const listed = new Set((await paths()).filter((x) => x !== "/").map((x) => stripLocale(x)));
  const dynamic = /^\/(products|categories|collections|blog)\/[^/]+$/;
  const staticListed = [...listed].filter((x) => !dynamic.test(x));
  for (const x of staticListed) assert.ok(found.includes(x), `${x} is listed but has no app/[lang] route`);
  assert.deepEqual(found.filter((x) => !listed.has(x)).sort(), ["/collections"], "an app/[lang] page is missing from the sitemap");
});

test("2D: a post is listed only in the languages its page answers 200 in", async () => {
  stubHub();
  const p = await paths();
  assert.ok(p.includes("/en/blog/english-only") && !p.includes("/ja/blog/english-only"), "English-only post: /en only");
  assert.ok(p.includes("/ja/blog/japanese-only") && !p.includes("/en/blog/japanese-only"), "Japanese-only post: /ja only");
  assert.ok(p.includes("/en/blog/ja-title-no-body") && !p.includes("/ja/blog/ja-title-no-body"), "a title without a body is a draft in that language");
});

test("2D: a post whose article read fails is left out, not guessed", async () => {
  stubHub({ post: async () => { throw new Error("hub down"); } });
  assert.ok(!(await paths()).some((x) => /\/blog\/[^/]+$/.test(x)), "no post URL without a successful read");
});

test("layaway is never listed: no /layaway, /en/layaway or /ja/layaway, no layaway-only post", async () => {
  stubHub();
  const p = await paths();
  assert.ok(!p.some((x) => /^\/(en\/|ja\/)?layaway$/.test(x)));
  assert.ok(!p.some((x) => x.includes("layaway-how-it-works")), "layaway-only post (layaway indexability is Phase 3)");
});

test("posts that are not published, or have no slug, are not listed", async () => {
  stubHub();
  const u = await urls();
  assert.ok(!u.some((x) => x.includes("draft-post")), "unpublished post");
  assert.ok(!u.some((x) => /\/blog\/\s*$/.test(x)), "blank slug");
});

test("OD-12: no entry carries alternates (hreflang lives in the HTML only)", async () => {
  stubHub();
  for (const e of await sitemap()) assert.equal(e.alternates, undefined, e.url);
});

test("a post's lastModified is its edit date, else its publish date, in both languages", async () => {
  stubHub();
  const all = await sitemap();
  for (const l of ["ja", "en"]) assert.equal(all.find((x) => x.url.endsWith(`/${l}/blog/what-is-kihei`)).lastModified, "2026-09-05");
  assert.equal(all.find((x) => x.url.endsWith("/en/blog/english-only")).lastModified, "2026-09-06");
});

test("a Hub outage still answers with the static pages instead of throwing", async () => {
  const boom = async () => { throw new Error("hub down"); };
  stubHub({ collections: boom, categories: boom, productSlugs: boom, posts: boom, post: boom });
  const u = await urls();
  assert.ok(u.includes(BASE));
  assert.ok(u.includes(`${BASE}/ja/faq`) && u.includes(`${BASE}/en/faq`));
  assert.ok(!u.some((x) => x.includes("/products/")));
});
