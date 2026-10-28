// Statutory-page compliance: the one shared path rule (lib/statutory-path.ts).
// Phase 2A of docs/seo/SEO-MIGRATION-MAP.md, finding F3. Run: npm run test:unit.
//
// The legal pages (/legal, /legal/*) keep three behaviours, and a locale prefix
// must not lose any of them: (1) the cookie banner never asks by itself,
// (2) the announcement bar is not rendered, (3) the advertising tags behave as
// they do everywhere else except /account/*. The third is NOT a /legal rule
// today; these tests pin it so a prefixed legal path behaves identically.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const S = await import("@/lib/statutory-path");
const ads = await import("@/lib/ads");
const csp = await import("@/lib/csp");
const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

const LEGAL = ["/legal", "/legal/", "/legal/privacy", "/legal/terms", "/legal/returns", "/legal/tokusho"];
const prefixed = (loc, p) => `/${loc}${p}`;
const NOT_LEGAL = ["/", "/en", "/ja", "/products/x", "/en/products/x", "/ja/blog/post", "/legalx", "/legalese/x", "/en/legalx", "/ja/legalese", "/about", "/layaway", "/account", "/checkout", "/faq"];

test("unprefixed legal paths are statutory, as before", () => {
  for (const p of LEGAL) assert.equal(S.isStatutoryPath(p), true, p);
});

test("the same paths under /en and /ja are statutory too", () => {
  for (const loc of ["en", "ja"]) for (const p of LEGAL) assert.equal(S.isStatutoryPath(prefixed(loc, p)), true, prefixed(loc, p));
  for (const p of ["/en/legal", "/en/legal/tokusho", "/ja/legal", "/ja/legal/tokusho"]) assert.equal(S.isStatutoryPath(p), true, p);
});

test("a query or fragment does not change the answer", () => {
  assert.equal(S.isStatutoryPath("/en/legal/tokusho?lang=ja#x"), true);
  assert.equal(S.isStatutoryPath("/legal/privacy?utm_source=x"), true);
  assert.equal(S.isStatutoryPath("/en/products/x?next=/legal"), false);
});

test("nothing else is statutory", () => {
  for (const p of NOT_LEGAL) assert.equal(S.isStatutoryPath(p), false, p);
  for (const p of [null, undefined, "", "legal", "//legal/x", "https://x.example/legal", 7]) assert.equal(S.isStatutoryPath(p), false, String(p));
});

test("announcement bar: suppressed on every statutory path, prefixed or not", () => {
  for (const loc of [null, "en", "ja"]) for (const p of LEGAL) {
    const path = loc ? prefixed(loc, p) : p;
    assert.equal(S.announcementBarAllowed(path), false, `${path} must not carry the announcement bar`);
  }
});

test("announcement bar: allowed on ordinary pages, prefixed or not", () => {
  for (const p of ["/", "/en", "/ja", "/products/x", "/en/products/x", "/ja/collections/kihei", "/faq", "/en/faq", "/legalx", "/en/legalx", "/layaway"]) {
    assert.equal(S.announcementBarAllowed(p), true, p);
  }
});

test("announcement bar FAILS SAFE: no header, or a header that is not a site path, means no bar", () => {
  for (const p of [null, undefined, "", "legal", "legal/tokusho", "//legal/tokusho", "//example.com", "https://x.example/", "   ", 0, "/en//legal/tokusho", "/ja//legal", "/legal//tokusho", "/en/\\legal/tokusho", "/legal\\tokusho", "/legal\n", "/en/legal/tokusho\r", "/en/legal\u0000", "///"]) {
    assert.equal(S.announcementBarAllowed(p), false, `${JSON.stringify(p)} must never enable the bar`);
  }
});

test("the unprefixed answers are exactly what the old layout rule gave", () => {
  const old = (path) => !!path && path.startsWith("/") && path !== "/legal" && !path.startsWith("/legal/");
  for (const p of ["/", "/legal", "/legal/", "/legal/tokusho", "/legalx", "/products/x", "/about", "/en-routes", "/account", "/cart", "/checkout/complete/1", "/search"]) {
    assert.equal(S.announcementBarAllowed(p), old(p), p);
  }
  for (const p of [null, undefined, "", "x"]) assert.equal(S.announcementBarAllowed(p), old(p), String(p));
});

test("cookie banner: quiet on statutory and pay-card pages, prefixed or not", () => {
  const quietHere = (path) => S.isStatutoryPath(path) || csp.isPayCardPath(path);
  for (const p of ["/legal/tokusho", "/en/legal/tokusho", "/ja/legal/tokusho", "/legal", "/en/legal", "/account/orders/abc/pay-card"]) assert.equal(quietHere(p), true, p);
  for (const p of ["/", "/en", "/products/x", "/en/products/x", "/ja/faq", "/account/orders/abc", "/cart"]) assert.equal(quietHere(p), false, p);
});

test("advertising tags: a localized legal path behaves exactly like its unprefixed twin", () => {
  for (const p of LEGAL) {
    for (const loc of ["en", "ja"]) assert.equal(ads.adsLoadsOn(prefixed(loc, p)), ads.adsLoadsOn(p), `${prefixed(loc, p)} vs ${p}`);
  }
  // Today's rule, unchanged: customer pages are excluded; /legal is not.
  assert.equal(ads.adsLoadsOn("/legal/tokusho"), true);
  assert.equal(ads.adsLoadsOn("/account/orders/abc/pay-card"), false);
  assert.equal(ads.adsLoadsOn("/account"), false);
});

test("the live call sites use the shared rule and no longer spell /legal out", () => {
  const banner = read("components/site/consent-banner.tsx");
  const layout = read("app/layout.tsx");
  const bar = read("components/site/announcement-bar.tsx");
  assert.match(banner, /from "@\/lib\/statutory-path"/);
  assert.match(banner, /isStatutoryPath\(path\)/);
  assert.doesNotMatch(banner, /path\s*===\s*"\/legal"|startsWith\("\/legal\/"\)/, "consent banner must not carry its own /legal literal");
  assert.doesNotMatch(layout, /path\s*!==\s*"\/legal"|startsWith\("\/legal\/"\)/, "root layout must not carry its own /legal literal");
  // Since 2026-10-28 the BAR applies the shared rule to the path on screen (the
  // root layout is not re-rendered by a client-side navigation, so a layout-only
  // gate left the bar on the 特定商取引法 page after a click). It fails safe
  // through the same rule: a path it cannot classify shows no bar.
  assert.match(bar, /from "@\/lib\/statutory-path"/);
  assert.match(bar, /const allowed = announcementBarAllowed\(usePathname\(\)\)/);
  assert.match(bar, /if \(dismissed \|\| !allowed\) return null;/);
  assert.doesNotMatch(bar, /startsWith\("\/legal\/"\)|"\/legal"/, "the bar must not carry its own /legal literal");
});

test("a malformed or unsafe path is never statutory and never enables the bar (the fail-safe holds for every shape)", () => {
  for (const p of ["/en//legal/tokusho", "/ja//legal", "/legal//tokusho", "/en/\\legal", "/legal\n", "/en/legal/tokusho\r", "//legal/tokusho"]) {
    assert.equal(S.isStatutoryPath(p), false, `${JSON.stringify(p)} is not a classifiable statutory path`);
    assert.equal(S.announcementBarAllowed(p), false, `${JSON.stringify(p)} must not enable the bar`);
  }
});

test("a well-formed prefixed legal path keeps both suppressions, with and without a trailing slash or query", () => {
  for (const p of ["/en/legal/", "/ja/legal/privacy/", "/en/legal/tokusho?utm_source=x", "/ja/legal#top"]) {
    assert.equal(S.isStatutoryPath(p), true, p);
    assert.equal(S.announcementBarAllowed(p), false, p);
  }
});

