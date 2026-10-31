// Lumière P1 — where Lenis smooth scroll is mounted (owner decision D-13,
// docs/tasks/lumiere-p0-report.md §3.2): public pages yes; /checkout/**,
// /account/**, /login and /auth/** never.
import { test } from "node:test";
import assert from "node:assert/strict";

const { lenisAllowed } = await import("@/lib/lumiere/lenis-paths");

test("Lenis runs on the public pages", () => {
  for (const p of ["/", "/en", "/ja", "/en/collections/rings", "/ja/products/x", "/cart", "/cart/restore", "/blog/post", "/loyalty", "/en/layaway", "/search?q=ring", "/accounting", "/authors"]) {
    assert.equal(lenisAllowed(p), true, p);
  }
  assert.equal(lenisAllowed(null), true, "no pathname yet: allowed, the controller re-checks on navigation");
  assert.equal(lenisAllowed(undefined), true);
});

test("Lenis is never created on the transactional routes", () => {
  for (const p of [
    "/checkout", "/checkout/", "/checkout/complete/d/abc", "/checkout?mode=layaway",
    "/account", "/account/orders/o1", "/account/orders/o1/pay-card", "/account/layaway/x", "/account/complete-profile",
    "/login", "/login?error=x",
    "/auth", "/auth/callback", "/auth/callback?code=1",
  ]) {
    assert.equal(lenisAllowed(p), false, p);
  }
});

test("a locale prefix is stripped before matching", () => {
  assert.equal(lenisAllowed("/en/checkout"), false);
  assert.equal(lenisAllowed("/ja/account/orders/1"), false);
  assert.equal(lenisAllowed("/en/login"), false);
  assert.equal(lenisAllowed("/en/about"), true);
  assert.equal(lenisAllowed("/english"), true, "only a whole /en segment is a locale");
});
