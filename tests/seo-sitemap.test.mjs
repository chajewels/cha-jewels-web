// sitemap.xml (app/sitemap.ts). Run: npm run test:unit.
//
// Only public, indexable, 200-answering URLs belong in a sitemap. The Hub is
// replaced by the test harness's stub; each test fills in what it needs.
import { test } from "node:test";
import assert from "node:assert/strict";

const { hub } = await import("@/lib/hub-api");
const policy = await import("@/lib/seo-policy");
const { default: sitemap } = await import("../app/sitemap.ts");

const BASE = "https://www.chajewelsjp.com";
function stubHub(over = {}) {
  Object.assign(hub, {
    collections: async () => [{ slug: "kihei" }, { slug: "pearls" }],
    categories: async () => [{ slug: "necklaces" }],
    productSlugs: async () => [{ slug: "p1-ring", updated_at: "2026-10-01" }, { slug: "p2-chain", updated_at: "2026-10-02" }],
    posts: async () => [
      { slug: "what-is-kihei", published_at: "2026-09-01", updated_at: "2026-09-05" },
      { slug: "layaway-how-it-works", published_at: "2026-09-02", layaway_only: true },
      { slug: "draft-post", published_at: "2026-09-03", published: false },
      { slug: "  ", published_at: "2026-09-04" },
    ],
    ...over,
  });
}
const urls = async () => (await sitemap()).map((e) => e.url);

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
  for (const x of await urls()) {
    const path = new URL(x).pathname;
    assert.equal(policy.isNoindexPath(path), false, `${path} is noindex but is in the sitemap`);
  }
});

test("curated pages are listed: home, products, categories, collections, posts", async () => {
  stubHub();
  const u = await urls();
  for (const p of ["", "/products/p1-ring", "/products/p2-chain", "/categories/necklaces", "/collections/kihei", "/collections/pearls", "/blog", "/blog/what-is-kihei", "/jewelry-guide", "/faq", "/legal/tokusho", "/loyalty"]) {
    assert.ok(u.includes(`${BASE}${p}`), `${p || "/"} should be listed`);
  }
});

test("/layaway is not listed while it 404s for a crawler", async () => {
  stubHub();
  assert.ok(!(await urls()).some((x) => new URL(x).pathname === "/layaway"));
});

test("posts that 404 or are not published are not listed", async () => {
  stubHub();
  const u = await urls();
  assert.ok(!u.some((x) => x.includes("layaway-how-it-works")), "layaway-only post");
  assert.ok(!u.some((x) => x.includes("draft-post")), "unpublished post");
  assert.ok(!u.some((x) => /\/blog\/\s*$/.test(x) && x !== `${BASE}/blog`), "blank slug");
});

test("a post's lastModified is its edit date, else its publish date", async () => {
  stubHub();
  const e = (await sitemap()).find((x) => x.url.endsWith("/blog/what-is-kihei"));
  assert.equal(e.lastModified, "2026-09-05");
});

test("a Hub outage still answers with the static pages instead of throwing", async () => {
  const boom = async () => { throw new Error("hub down"); };
  stubHub({ collections: boom, categories: boom, productSlugs: boom, posts: boom });
  const u = await urls();
  assert.ok(u.includes(BASE));
  assert.ok(u.includes(`${BASE}/faq`));
  assert.ok(!u.some((x) => x.includes("/products/")));
});
