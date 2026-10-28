// PHASE 2E-STAGE-1: bare legacy URLs → 307 to their locale page
// (lib/legacy-redirect.ts; docs/seo/SEO-MIGRATION-MAP.md §20.2, owner-approved
// 2026-10-28). Run: npm run test:unit.
//
// The target language is computed exactly as the middleware computes it:
// lib/i18n `langDecision` with no URL locale. Every row of the binding table
// has a test here; the HTTP behaviour (real 307 status, headers, the page-level
// half) is proved by the redirect matrix against a production build.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const { legacyRedirect, dropLangParam, legacyRedirectsEnabled, STATIC_PAGES, LEGACY_REDIRECT_HEADER } = await import("@/lib/legacy-redirect");
const { langDecision, asLang } = await import("@/lib/i18n");

/** One request, as the middleware sees it. */
function decide(path, { cookie = null, al = null, method = "GET", action = false, enabled = true } = {}) {
  const url = new URL(path, "https://x.test");
  const { lang } = langDecision({ urlLocale: null, cookieLang: asLang(cookie), paramLang: asLang(url.searchParams.get("lang")), acceptLanguage: al });
  return legacyRedirect({ method, isAction: action, pathname: url.pathname, search: url.search, lang, enabled });
}
const to = (path, opts) => decide(path, opts)?.location ?? null;

test("static page: the language the bare URL renders today (?lang=, cookie, Accept-Language, then Japanese)", () => {
  assert.deepEqual(decide("/faq"), { kind: "static", location: "/ja/faq" }, "no signal (a crawler) → /ja");
  assert.equal(to("/faq", { cookie: "en" }), "/en/faq");
  assert.equal(to("/faq", { cookie: "ja", al: "en-US" }), "/ja/faq", "the cookie beats Accept-Language");
  assert.equal(to("/faq", { al: "en-US,en;q=0.9" }), "/en/faq");
  assert.equal(to("/faq", { al: "ja,en;q=0.8" }), "/ja/faq");
  assert.equal(to("/faq", { al: "tl-PH" }), "/en/faq", "an unsupported language gets English (detectLang)");
  assert.equal(to("/faq", { al: "de-DE,fr;q=0.8" }), "/en/faq");
});

test("?lang= sets the language (beats the cookie, as today); every lang dropped, the rest kept in order", () => {
  assert.equal(to("/faq?lang=en", { cookie: "ja" }), "/en/faq");
  assert.equal(to("/faq?lang=ja", { cookie: "en" }), "/ja/faq");
  assert.equal(to("/legal/tokusho?utm_source=x&lang=en&utm_medium=y"), "/en/legal/tokusho?utm_source=x&utm_medium=y");
  assert.equal(to("/faq?lang=en&lang=ja"), "/en/faq", "first value decides (the middleware's reading), both removed");
  assert.equal(to("/sale?q=a%20b&x=1+2&lang=en"), "/en/sale?q=a%20b&x=1+2", "other parameters byte-for-byte");
});

test("an invalid ?lang= is ignored: cookie / Accept-Language / Japanese decide", () => {
  assert.equal(to("/faq?lang=fr"), "/ja/faq");
  assert.equal(to("/faq?lang=EN", { cookie: "en" }), "/en/faq");
  assert.equal(to("/faq?lang=", { al: "en" }), "/en/faq");
});

test("dynamic resources are handed to the page, never redirected blind", () => {
  assert.deepEqual(decide("/products/p1-ring"), { kind: "dynamic", location: "/ja/products/p1-ring" });
  assert.deepEqual(decide("/categories/necklaces", { cookie: "en" }), { kind: "dynamic", location: "/en/categories/necklaces" });
  assert.deepEqual(decide("/collections/kihei?lang=en&ref=ig"), { kind: "dynamic", location: "/en/collections/kihei?ref=ig" });
  assert.deepEqual(decide("/blog/how-cha-jewels-began?lang=ja"), { kind: "dynamic", location: "/ja/blog/how-cha-jewels-began" },
    "an English-only post asked for in Japanese is only a CANDIDATE: its page 404s in Japanese before redirectLegacy runs");
});

test("excluded: root, layaway, already-prefixed, private, utility, unknown, nested and index-less paths", () => {
  for (const p of ["/", "/?lang=en", "/layaway", "/layaway?lang=en", "/en/faq", "/ja/faq?lang=en", "/en", "/ja", "/en/layaway",
    "/cart", "/checkout", "/account", "/account/orders", "/login?next=%2Faccount", "/loyalty/join", "/search?q=kihei",
    "/review/abc", "/newsletter/unsubscribe", "/products", "/categories", "/products/a/b", "/legal/foo", "/legal", "/FAQ",
    "/gold-guide", "/nonexistent", "/api/lang"]) {
    assert.equal(decide(p, { cookie: "en" }), null, p);
  }
});

test("never on a non-GET/HEAD request or a Server Action; HEAD is redirected like GET", () => {
  assert.equal(decide("/faq", { method: "POST" }), null);
  assert.equal(decide("/products/p1-ring", { method: "POST", action: true }), null);
  assert.equal(decide("/faq", { action: true }), null, "a Server Action is never redirected, whatever its method");
  assert.equal(to("/faq", { method: "HEAD" }), "/ja/faq");
});

test("the kill switch turns every redirect off; only the exact value \"off\" does", () => {
  assert.equal(decide("/faq", { enabled: false }), null);
  assert.equal(decide("/products/p1-ring", { enabled: false }), null);
  assert.equal(legacyRedirectsEnabled(undefined), true);
  assert.equal(legacyRedirectsEnabled(""), true);
  assert.equal(legacyRedirectsEnabled("off"), false);
  assert.equal(legacyRedirectsEnabled(" OFF "), false);
  assert.equal(legacyRedirectsEnabled("on"), true);
});

test("hostile paths never produce a redirect, and no Location is ever off-site or double-prefixed", () => {
  for (const p of ["//evil.com", "/\\evil.com", "/products/..%2f..%2fevil", "/en//evil.com", "/products/%0d%0aSet-Cookie:x"]) {
    const r = (() => { try { return decide(p); } catch { return "threw"; } })();
    assert.ok(r === null || (r.location.startsWith("/") && !r.location.startsWith("//") && !/[\r\n\\]/.test(r.location)), `${p} → ${JSON.stringify(r)}`);
  }
  for (const p of ["/faq", "/products/x", "/blog/y?lang=en"]) {
    const r = decide(p);
    assert.ok(/^\/(en|ja)\//.test(r.location) && !/^\/(en|ja)\/(en|ja)(\/|$)/.test(r.location), r.location);
  }
});

test("dropLangParam: only the lang key, decoded, is removed", () => {
  assert.equal(dropLangParam(""), "");
  assert.equal(dropLangParam("?lang=en"), "");
  assert.equal(dropLangParam("?%6Cang=en&a=1"), "?a=1", "an encoded `lang` key is still lang");
  assert.equal(dropLangParam("?language=en&a=1"), "?language=en&a=1");
  assert.equal(dropLangParam("?a=1&&b=2&lang"), "?a=1&b=2");
  assert.equal(dropLangParam("?%E0%A4%A=1"), "?%E0%A4%A=1", "a malformed key is kept as it came");
});

test("STATIC_PAGES is exactly the static app/[lang] pages, root excluded", () => {
  const root = join(process.cwd(), "app", "[lang]");
  const found = [];
  (function walk(dir, rel) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { if (!name.startsWith("[")) walk(full, `${rel}/${name}`); }
      else if (name === "page.tsx" && rel) found.push(rel);
    }
  })(root, "");
  assert.deepEqual([...STATIC_PAGES].sort(), found.sort());
});

// ------------------------------------------------------------------ source guards
const src = (p) => readFileSync(join(process.cwd(), p), "utf8");

test("middleware: header is middleware-owned, the redirect is a 307 with the approved cache headers", () => {
  const m = src("middleware.ts");
  assert.match(m, /fwd\.delete\(LEGACY_REDIRECT_HEADER\)/, "a client-sent header must never survive");
  assert.match(m, /lang: renderLang/, "the target language is the middleware's own language decision");
  assert.match(m, /NextResponse\.redirect\([^)]*\), 307\)/);
  assert.match(m, /"Cache-Control", "private, no-store"/);
  assert.match(m, /"Vary", "Cookie, Accept-Language"/);
  assert.match(m, /legacyRedirectsEnabled\(process\.env\.SEO_LEGACY_REDIRECTS\)/);
  assert.equal(LEGACY_REDIRECT_HEADER, "x-cj-legacy-redirect");
});

test("the four dynamic legacy pages redirect only after their own notFound() check", () => {
  for (const f of ["app/products/[slug]/page.tsx", "app/categories/[slug]/page.tsx", "app/collections/[slug]/page.tsx", "app/blog/[slug]/page.tsx"]) {
    const s = src(f);
    const nf = s.search(/if \(!\w+\) notFound\(\);/), rd = s.indexOf("await redirectLegacy();");
    assert.ok(nf !== -1 && rd > nf, `${f}: redirectLegacy() must follow the notFound() guard`);
  }
});

test("stage 1 is temporary only: no 308 / permanent redirect added, next.config untouched, no streaming boundary above the pages", () => {
  for (const f of ["middleware.ts", "lib/legacy-redirect.ts", "lib/legacy-redirect-server.ts"]) {
    const s = src(f);
    assert.ok(!/permanentRedirect|\b308\b|permanent:\s*true/.test(s.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")), `${f} has a permanent redirect`);
  }
  assert.equal((src("next.config.ts").match(/permanent: true/g) ?? []).length, 1, "only the pre-existing /gold-guide 308");
  // A loading.tsx or template above these pages would start the stream before
  // redirect() runs and turn the 307 into a meta refresh (read as permanent).
  const above = ["app", "app/products", "app/products/[slug]", "app/categories", "app/categories/[slug]", "app/collections", "app/collections/[slug]", "app/blog", "app/blog/[slug]"];
  for (const d of above) for (const f of ["loading.tsx", "loading.jsx", "loading.js"]) {
    assert.throws(() => statSync(join(process.cwd(), d, f)), `${d}/${f} would break the real 307`);
  }
});

// ------------------------------------------------------------------ added 2026-10-28 (final QA)
// Redirect regression coverage for the inputs a real browser sends. The
// language rule is lib/i18n `detectLang` ("Japanese only for a visitor who
// actually asks for Japanese": ja when it ranks above every other tag the site
// understands; unsupported languages get English; no header gets Japanese).

test("multiple and weighted Accept-Language headers", () => {
  const al = (h) => to("/faq", { al: h });
  assert.equal(al("en;q=0.5, ja;q=0.9"), "/ja/faq", "ja ranked first by weight");
  assert.equal(al("ja;q=0.1, en;q=0.9"), "/en/faq", "en ranked first by weight");
  assert.equal(al("ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7"), "/ja/faq", "a typical Japanese browser");
  assert.equal(al("en-US,en;q=0.9,ja;q=0.8"), "/en/faq", "a typical English browser that also reads Japanese");
  assert.equal(al("fil-PH,fil;q=0.9,en;q=0.8"), "/en/faq", "a Filipino browser: English");
  assert.equal(al("zh-CN,zh;q=0.9"), "/en/faq", "an unsupported language: English");
  assert.equal(al(""), "/ja/faq", "an empty header is no preference: Japanese");
});

test("invalid language cookies are ignored, never trusted", () => {
  for (const bad of ["fr", "EN", "ja-JP", "", "en;", "<script>"]) {
    assert.equal(to("/faq", { cookie: bad }), "/ja/faq", `cookie ${JSON.stringify(bad)}, no header`);
    assert.equal(to("/faq", { cookie: bad, al: "en" }), "/en/faq", `cookie ${JSON.stringify(bad)} falls through to Accept-Language`);
  }
});

test("every input together: ?lang= beats the cookie, the cookie beats Accept-Language", () => {
  assert.equal(to("/faq?lang=ja", { cookie: "en", al: "en" }), "/ja/faq");
  assert.equal(to("/faq?lang=en", { cookie: "ja", al: "ja" }), "/en/faq");
  assert.equal(to("/faq?lang=bad", { cookie: "en", al: "ja" }), "/en/faq");
  assert.equal(to("/products/x", { cookie: "ja", al: "en" }), "/ja/products/x");
  assert.equal(to("/products/x?lang=xx", { al: "en" }), "/en/products/x");
});
