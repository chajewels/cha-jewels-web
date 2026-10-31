// W-02 (security audit 2026-10-31): the post-sign-in redirect target `next`.
// lib/safe-next.ts is the one validator; lib/profile.ts safeNext delegates to it.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { safeNext } = await import("@/lib/safe-next");

const SITE = "https://www.chajewelsjp.com";

test("real same-site targets pass through unchanged", () => {
  for (const p of [
    "/account",
    "/checkout",
    "/checkout?step=delivery",
    "/account/orders/abc-123",
    "/account/complete-profile?next=%2Fcheckout",
    "/en/products/k18-ring?ref=x#gallery",
    "/ja/loyalty/join",
    "/login?next=//x",
    "/",
  ]) {
    assert.equal(safeNext(p), p, p);
    assert.equal(new URL(p, SITE).origin, SITE, `${p} stays on the site`);
  }
});

test("anything a browser could read as another host falls back to /account", () => {
  const UNSAFE = [
    "/\\evil.com", // the reported case: new URL resolves it to https://evil.com/
    "/\\/evil.com",
    "\\\\evil.com",
    "/a\\b",
    "/account?x=\\",
    "//evil.com",
    "///evil.com",
    "https://evil.com",
    "http:/evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    "/\tevil.com",
    "/\nevil.com",
    "/\r\n//evil.com",
    "/\u0000",
    "/a//b",
    "/" + "a".repeat(2048),
  ];
  for (const p of UNSAFE) assert.equal(safeNext(p), "/account", JSON.stringify(p));
  for (const p of [null, undefined, 7, {}, [], ["/account"]]) assert.equal(safeNext(p), "/account", String(p));
});

test("the fallback can be chosen", () => {
  assert.equal(safeNext("/\\evil.com", "/"), "/");
  assert.equal(safeNext("/cart", "/"), "/cart");
});

test("percent-encoded backslash stays a path on this site", () => {
  // Not decoded by browsers in a Location header path: it remains /%5Cevil.com here.
  const p = "/%5Cevil.com";
  assert.equal(safeNext(p), p);
  assert.equal(new URL(p, SITE).origin, SITE);
});

test("every reader of `next` uses the shared helper, none keeps its own check", () => {
  const readers = [
    "app/auth/callback/route.ts",
    "app/auth/confirm/page.tsx",
    "lib/auth-actions.ts",
    "components/account/login-form.tsx",
    "lib/profile.ts",
  ];
  for (const f of readers) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
    assert.match(src, /from "@\/lib\/safe-next"/, `${f} imports lib/safe-next`);
    assert.doesNotMatch(src, /startsWith\("\/"\)\s*&&\s*!\s*\w+\.startsWith\("\/\/"\)/, `${f} has no hand-rolled check`);
  }
});
