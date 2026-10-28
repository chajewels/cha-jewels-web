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
