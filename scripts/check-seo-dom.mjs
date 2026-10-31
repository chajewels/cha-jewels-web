#!/usr/bin/env node
// Rendered-DOM SEO check, in a real browser. Usage: node scripts/check-seo-dom.mjs [baseUrl]
// (default https://www.chajewelsjp.com). Read-only: it only loads public pages. Needs the Playwright
// browsers that `@playwright/test` (already a devDependency) uses; set VERCEL_AUTOMATION_BYPASS_SECRET
// to run against a preview behind Vercel SSO (sent as the documented header, never printed).
//
// WHY THIS EXISTS next to scripts/check-seo-live.mjs. That script reads the raw HTML response. A
// browser applies more: Next streams page metadata and React hoists <link>/<meta> into <head> on
// the client, so a page that 404s can show a canonical, hreflang or og:url in the LIVE DOM that the
// raw HTML never contained (found 2026-10-31 on a missing product, collection and category, on
// `develop` too). Search engines that run JavaScript read the DOM. This checks the DOM.
//
// For EACH of two browser contexts (desktop 1280x800, phone 375x812):
//  1. Known valid templates (both languages): after hydration exactly one og:url equal to the
//     canonical and to the page's own URL, one fb:app_id, the primary AND alternate og:locale, one og:image.
//  2. Every 404 shape, bare and localized, malformed and missing-resource alike: a real 404 status,
//     noindex, NO canonical, hreflang or og:url in the DOM, and the useful 404 page (a heading, a way
//     on to the collections, a search box, at least one piece).
//  3. Client-side navigation (same document, no reload): the single og:url follows the new page.
//  4. Every console error and page error is captured IN FULL (message, route, browser context, stack)
//     and reported; any such error is a FAIL (an unexplained hydration error is never ignored).
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] ?? "https://www.chajewelsjp.com").replace(/\/$/, "");
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
const FB_ID = "812262777044447";
const results = [];
const ok = (ctx, route, what, cond, detail = "") => results.push({ status: cond ? "PASS" : "FAIL", ctx, route, what, detail: cond ? "" : detail });

const headers = BYPASS ? { "x-vercel-protection-bypass": BYPASS } : {};
const sm = await fetch(`${BASE}/sitemap.xml`, { headers });
const paths = [...(await sm.text()).matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const bareOf = (p) => p.replace(/^\/(en|ja)(?=\/|$)/, "") || "/";
const find = (re) => paths.map(bareOf).find((p) => re.test(p));
const dynamic = [find(/^\/products\//), find(/^\/collections\/./), find(/^\/categories\//), find(/^\/blog\/./)].filter(Boolean);
const valid = ["/ja", "/en", ...["/faq", "/about", "/legal/tokusho", "/jewelry-guide", ...dynamic].flatMap((p) => [`/ja${p}`, `/en${p}`]), "/en/layaway"].filter((p) => p.startsWith("/en") || paths.includes(p));
const X = "nonexistent-seo-check-xyz";
const missing = [`/products/${X}`, `/collections/${X}`, `/categories/${X}`, `/blog/${X}`];
const notFound = [
  "/foo/bar", "/foo/bar/baz", `/${X}`, "/products/x/y", "/collections/x/y", "/categories/x/y", "/blog/x/y", "/legal/missing", "/legal/missing/deeper", "/legal", "/categories", "/faq/x", "/cart/zzz",
  ...missing, ...missing.flatMap((p) => [`/en${p}`, `/ja${p}`]),
  ...["/products/x/y", "/collections/x/y", "/categories/x/y", "/blog/x/y", "/legal/missing", "/legal/missing/deeper"].flatMap((p) => [`/en${p}`, `/ja${p}`]),
  "/ja/layaway", "/en/cart", "/fr/about",
];

const contexts = [["desktop-1280", { viewport: { width: 1280, height: 800 } }], ["phone-375", { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }]];
const browser = await chromium.launch();
const readDom = () => {
  const q = (s) => [...document.querySelectorAll(s)].map((e) => e.getAttribute("content") ?? e.getAttribute("href"));
  return {
    ogUrl: q('meta[property="og:url"]'), canonical: q('link[rel="canonical"]'), hreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
    fb: q('meta[property="fb:app_id"]'), robots: q('meta[name="robots"]'), loc: q('meta[property="og:locale"]'), locAlt: q('meta[property="og:locale:alternate"]'), ogImage: q('meta[property="og:image"]').length,
    h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim())[0] ?? null,
    wayOn: [...document.querySelectorAll('a[href*="/collections"]')].length > 0,
    search: !!document.querySelector('form[action*="search"], input[type="search"], input[name="q"]'),
    pieces: document.querySelectorAll('a[href*="/products/"]').length,
  };
};

for (const [ctxName, opts] of contexts) {
  const context = await browser.newContext({ ...opts, extraHTTPHeaders: headers });
  const page = await context.newPage();
  const errors = [];
  const route = () => page.url().replace(BASE, "") || "/";
  page.on("console", (m) => { if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push({ kind: "console.error", route: route(), text: m.text(), location: m.location() }); });
  page.on("pageerror", (e) => errors.push({ kind: "pageerror", route: route(), text: e.message, stack: (e.stack ?? "").split("\n").slice(0, 8).join(" | ") }));
  const go = async (path) => { const r = await page.goto(BASE + path, { waitUntil: "load" }); await page.waitForTimeout(1000); return r; };

  for (const path of valid) {
    const r = await go(path);
    if (r.status() !== 200) { ok(ctxName, path, "a known template answers HTTP 200", false, `got ${r.status()}`); continue; }
    const d = await page.evaluate(readDom), lang = path.startsWith("/ja") ? "ja" : "en", self = `${BASE}${path}`;
    ok(ctxName, path, "one og:url = the canonical = the page URL; one fb:app_id; primary and alternate og:locale; one og:image", d.ogUrl.length === 1 && d.canonical.length === 1 && d.ogUrl[0] === self && d.canonical[0] === self && d.fb.length === 1 && d.fb[0] === FB_ID && d.loc[0] === (lang === "ja" ? "ja_JP" : "en_US") && d.loc.length === 1 && d.locAlt.length === 1 && d.locAlt[0] === (lang === "ja" ? "en_US" : "ja_JP") && d.ogImage === 1, JSON.stringify({ ogUrl: d.ogUrl, canonical: d.canonical, fb: d.fb, loc: d.loc, locAlt: d.locAlt, ogImage: d.ogImage }));
  }

  for (const path of notFound) {
    const r = await go(path);
    const d = await page.evaluate(readDom);
    ok(ctxName, path, "a real 404 with noindex and NO canonical, hreflang or og:url in the live DOM", r.status() === 404 && /noindex/.test(d.robots.join(",")) && d.canonical.length === 0 && d.hreflang === 0 && d.ogUrl.length === 0 && d.fb.length <= 1, `status ${r.status()} robots=${d.robots} canonical=${d.canonical.length} hreflang=${d.hreflang} og:url=${d.ogUrl.length} fb=${d.fb.length}`);
    ok(ctxName, path, "the 404 page is still the useful one (heading, a way on, search, a piece)", !!d.h1 && d.wayOn && d.search && d.pieces >= 1, `h1=${d.h1} wayOn=${d.wayOn} search=${d.search} pieces=${d.pieces}`);
  }

  // client-side navigation: same document, the identity follows the page
  await go("/en/faq");
  await page.evaluate(() => { window.__sameDocument = true; });
  for (const href of ["/en/collections", "/en/about"]) {
    const clicked = await page.evaluate((h) => { const a = [...document.querySelectorAll("a[href]")].find((x) => x.getAttribute("href") === h); a?.click(); return !!a; }, href);
    await page.waitForTimeout(1500);
    const d = await page.evaluate(() => ({ same: window.__sameDocument === true, path: location.pathname, ...(() => { const q = (s) => [...document.querySelectorAll(s)].map((e) => e.getAttribute("content") ?? e.getAttribute("href")); return { ogUrl: q('meta[property="og:url"]'), canonical: q('link[rel="canonical"]'), fb: q('meta[property="fb:app_id"]') }; })() }));
    ok(ctxName, `/en/faq -> ${href}`, "client-side navigation: same document, one og:url and canonical for the new page, one fb:app_id", clicked && d.same && d.path === href && d.ogUrl.length === 1 && d.ogUrl[0] === `${BASE}${href}` && d.canonical[0] === `${BASE}${href}` && d.fb.length === 1, JSON.stringify({ clicked, ...d }));
  }

  ok(ctxName, "(console)", "no console error or page error (hydration included) on any page above", errors.length === 0, JSON.stringify(errors));
  await context.close();
}
await browser.close();

const w = Math.max(...results.map((r) => r.route.length));
for (const r of results) console.log(`${r.status.padEnd(5)} ${r.ctx.padEnd(13)} ${r.route.padEnd(w)}  ${r.what}${r.detail ? `  [${r.detail}]` : ""}`);
const n = (s) => results.filter((r) => r.status === s).length;
console.log(`\n${BASE} (DOM): ${n("PASS")} pass, ${n("FAIL")} fail`);
process.exit(n("FAIL") ? 1 : 0);
