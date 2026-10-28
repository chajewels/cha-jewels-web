// Indexing policy for private and utility routes (lib/seo-policy.ts).
// Phase 1 of docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md. Run: npm run test:unit.
//
// These state the INTENDED policy. A page a customer reaches through a form, a
// session or a one-use link is never a search landing page; a curated page is.
import { test } from "node:test";
import assert from "node:assert/strict";

const policy = await import("@/lib/seo-policy");

const NOINDEX = [
  "/cart", "/cart/restore",
  "/login", "/auth/callback", "/auth/confirm",
  "/account", "/account/orders", "/account/orders/abc-123", "/account/orders/abc-123/pay-card",
  "/account/layaway/42", "/account/addresses", "/account/complete-profile", "/account/service-requests",
  "/checkout", "/checkout/complete",
  "/loyalty/join", "/already-registered",
  "/search",
  "/review/some-token", "/receipts/verify",
  "/newsletter/unsubscribe", "/cart-reminders/unsubscribe",
];

const INDEXABLE = [
  "/", "/products/k18-kihei-100g", "/categories/necklaces", "/collections", "/collections/kihei",
  "/blog", "/blog/what-is-kihei", "/jewelry-guide", "/shopping-guide", "/layaway", "/sale",
  "/loyalty", "/wholesale", "/faq", "/about", "/why-cha-jewels", "/contact", "/affiliations",
  "/legal/privacy", "/legal/terms", "/legal/returns", "/legal/tokusho",
];

test("every private or utility route is noindex", () => {
  for (const p of NOINDEX) assert.equal(policy.isNoindexPath(p), true, `${p} must be noindex`);
});

test("every curated public route stays indexable", () => {
  for (const p of INDEXABLE) {
    assert.equal(policy.isNoindexPath(p), false, `${p} must stay indexable`);
    assert.equal(policy.indexingFor(p), null, `${p} must carry no robots directive`);
  }
});

test("the directive is noindex everywhere it applies", () => {
  for (const p of NOINDEX) assert.equal(policy.indexingFor(p)?.index, false, p);
});

test("search keeps its links crawlable; session and token pages do not", () => {
  assert.equal(policy.indexingFor("/search")?.follow, true);
  assert.equal(policy.indexingFor("/cart")?.follow, true);
  for (const p of ["/account/orders/abc-123", "/checkout", "/auth/confirm", "/loyalty/join", "/already-registered"]) {
    assert.equal(policy.indexingFor(p)?.follow, false, p);
  }
});

test("matching is by path segment, not by string prefix", () => {
  for (const p of ["/cartography", "/login-help", "/searchlight", "/accounting", "/checkouts", "/reviews", "/loyalty-program"]) {
    assert.equal(policy.isNoindexPath(p), false, `${p} only looks like a private route`);
  }
});

test("/loyalty is public; only /loyalty/join is private", () => {
  assert.equal(policy.isNoindexPath("/loyalty"), false);
  assert.equal(policy.isNoindexPath("/loyalty/join"), true);
});

test("a trailing slash does not change the answer", () => {
  assert.equal(policy.isNoindexPath("/cart/"), true);
  assert.equal(policy.isNoindexPath("/account/orders/"), true);
  assert.equal(policy.isNoindexPath("/about/"), false);
});

test("a noindex page does not declare a canonical or language alternates", () => {
  for (const p of NOINDEX) assert.equal(policy.emitsCanonical(p), false, `${p} must not emit canonical/hreflang`);
  for (const p of INDEXABLE) assert.equal(policy.emitsCanonical(p), true, `${p} must keep canonical/hreflang`);
});

// ---------------------------------------------------------------------------
// Phase 2A: prefix-aware classification (lib/seo-policy.ts `classifyPath`).
// Not wired to any live output yet; the tests above still pin the live functions.

test("classifyPath: bare public paths are public", () => {
  for (const p of INDEXABLE) {
    const c = policy.classifyPath(p);
    assert.equal(c.kind, "public", p);
    assert.equal(c.locale, null, p);
  }
});

test("classifyPath: future /en and /ja public paths are public and keep their locale", () => {
  for (const loc of ["en", "ja"]) {
    for (const p of INDEXABLE.filter((x) => x !== "/layaway")) {
      const prefixed = p === "/" ? `/${loc}` : `/${loc}${p}`;
      const c = policy.classifyPath(prefixed);
      assert.equal(c.kind, "public", prefixed);
      assert.equal(c.locale, loc, prefixed);
      assert.equal(c.path, p, `${prefixed} classifies as ${p}`);
    }
  }
});

test("classifyPath: private and utility routes stay private, prefixed or not", () => {
  for (const p of NOINDEX) {
    assert.equal(policy.classifyPath(p).kind, "private", p);
    for (const loc of ["en", "ja"]) {
      const prefixed = `/${loc}${p}`;
      assert.equal(policy.classifyPath(prefixed).kind, "private", `${prefixed} must never read as an indexable page`);
    }
  }
});

test("classifyPath: unknown paths and non-site strings are unknown", () => {
  for (const p of ["/nonexistent", "/en/nonexistent", "/fr/products/x", "/EN/products/x", "/english", "/xx", "/faq/extra", "//evil", "x", "", "https://x.example/"]) {
    assert.equal(policy.classifyPath(p).kind, "unknown", JSON.stringify(p));
  }
});

test("classifyPath: layaway is English-only, so /ja/layaway is never a public page", () => {
  assert.equal(policy.classifyPath("/layaway").kind, "public");
  assert.equal(policy.classifyPath("/en/layaway").kind, "public");
  assert.equal(policy.classifyPath("/ja/layaway").kind, "unknown", "Japanese layaway does not exist and will not");
});

test("classifyPath: an unsafe path is unknown, never public or private", () => {
  for (const p of ["/en//cart", "/en//evil.com", "/en/\\cart", "/cart\n", "//cart"]) {
    assert.equal(policy.classifyPath(p).kind, "unknown", JSON.stringify(p));
  }
});

test("the live robots functions are unchanged for every existing URL", () => {
  for (const p of NOINDEX) {
    assert.equal(policy.isNoindexPath(p), true, p);
    assert.equal(policy.emitsCanonical(p), false, p);
  }
  for (const p of INDEXABLE) {
    assert.equal(policy.indexingFor(p), null, p);
    assert.equal(policy.emitsCanonical(p), true, p);
  }
});
