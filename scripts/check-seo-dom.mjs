#!/usr/bin/env node
// Rendered-DOM SEO check, in a real browser. Usage: node scripts/check-seo-dom.mjs [baseUrl]
// (default https://www.chajewelsjp.com). Read-only: it only loads public pages. Needs the Playwright
// browsers that `@playwright/test` (already a devDependency) uses.
//
// ORIGINS. Requests go to BASE. The pages DECLARE their public origin (canonical, og:url, sitemap): the
// same as BASE for production or a local build, different for a preview. Set SEO_CHECK_PUBLIC_ORIGIN to
// the origin the preview declares (the production origin); expected values are compared with that.
//
// CREDENTIALS (optional, for a preview behind Vercel SSO). VERCEL_AUTOMATION_BYPASS_SECRET is used only if
// SEO_CHECK_BYPASS_ORIGIN names the exact checked origin; it is sent only to that origin (never as
// context-wide headers, never to a host a page links to, never across a redirect to another origin) and is
// never printed. Anything else refuses to run. See scripts/lib/seo-check-core.mjs and
// tests/seo-check-core.test.mjs; scripts/test-seo-check-isolation.mjs proves it in a real browser.
//
// WHY THIS EXISTS next to scripts/check-seo-live.mjs. That script reads the raw HTML response. A browser
// applies more: Next streams page metadata and React hoists <link>/<meta> into <head> on the client, so a
// page that 404s can show a canonical, hreflang or og:url in the LIVE DOM that the raw HTML never contained
// (found 2026-10-31 on a missing product, collection and category, on `develop` too). Search engines that
// run JavaScript read the DOM. Both checkers are required by the release gate.
//
// FAILS CLOSED. The sitemap is validated before anything is sampled from it; every requirement is
// registered with how many checks it needs, and anything not actually checked is MISSING coverage and
// fails the run. The inventory (expected, checked, missing, skipped) is printed at the end.
//
// For EACH of two browser contexts (desktop 1280x800, phone 375x812):
//  1. Known valid templates (both languages): after the page SETTLES, exactly one og:url equal to the
//     canonical and to the page's public URL, one fb:app_id, the primary AND alternate og:locale, one og:image.
//  2. Unavailable siblings, explicitly: a clean 404 AND the existing language names no hreflang for it.
//  3. Every 404 shape, bare and localized, malformed and missing-resource alike: a real 404 status, noindex,
//     NO canonical, hreflang or og:url in the DOM, and the useful 404 page.
//  4. Client-side navigation (same document, no reload): the single og:url follows the new page.
//  5. Every console error, page error, unexpected HTTP status and failed request, captured IN FULL
//     (message, route, context, URL, status, stack). The ONLY thing not reported is the browser's own
//     "Failed to load resource ... 404" line for a document this checker EXPECTED to be a 404 (matched by
//     exact URL), and, only while THIS checker is navigating, a same-origin Next link-prefetch `fetch` (header
//     `RSC: 1`, or a redirect hop of one) or Server Action call (`next-action`) cancelled by that navigation (both
//     counted in the row text); a 404 anywhere else, any other abort, an abort while the page is idle, or any other
//     failure is reported and fails. A page also counts as settled only with NO request in flight.
//  "Settled" = bounded readiness (max 10 s): the document is complete, the path is the expected one, and the
//  metadata and heading signature has stopped changing; a page that never settles is a FAIL, not a pass.
import { chromium } from "@playwright/test";
import { resolveOrigins, authorizeCredentials, makeGet, installCredentialRouting, Coverage, validateSitemap } from "./lib/seo-check-core.mjs";

const BASE = (process.argv[2] ?? "https://www.chajewelsjp.com").replace(/\/$/, "");
let ORIGINS, AUTH;
try { ORIGINS = resolveOrigins(BASE); AUTH = authorizeCredentials(ORIGINS.requestOrigin); } catch (e) { console.error(`check-seo-dom: ${e.message}`); process.exit(2); }
const PUBLIC_ORIGIN = ORIGINS.publicOrigin;
const FB_ID = "812262777044447";
const SETTLE_MS = 10000;
const results = [];
const ok = (ctx, route, what, cond, detail = "") => results.push({ status: cond ? "PASS" : "FAIL", ctx, route, what, detail: cond ? "" : detail });
const cov = new Coverage();
const get = makeGet(ORIGINS.requestOrigin, AUTH);

const contexts = [["desktop-1280", { viewport: { width: 1280, height: 800 } }], ["phone-375", { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }]];
const C = contexts.length;

// ---- sitemap, validated before anything is sampled from it
const sm = await get("/sitemap.xml");
const smv = validateSitemap(sm, { publicOrigin: PUBLIC_ORIGIN });
ok("-", "/sitemap.xml", "valid: status 200, XML, a urlset, enough URLs, none duplicated, every URL on the public origin", smv.problems.length === 0, smv.problems.join("; "));
const paths = smv.paths;
const inSitemap = (p) => paths.includes(p);
const bareOf = (p) => p.replace(/^\/(en|ja)(?=\/|$)/, "") || "/";
const find = (re) => paths.map(bareOf).find((p) => re.test(p));
const families = { product: find(/^\/products\//), collection: find(/^\/collections\/./), category: find(/^\/categories\//), post: find(/^\/blog\/./) };
const staticTemplates = ["/faq", "/about", "/legal/tokusho", "/jewelry-guide", "/collections", "/blog"];
const unlistedByPolicy = new Set(["/collections"]); // a real page the sitemap deliberately never lists (app/sitemap.ts)
const X = "nonexistent-seo-check-xyz";
const missing = [`/products/${X}`, `/collections/${X}`, `/categories/${X}`, `/blog/${X}`];
const notFound = [
  "/foo/bar", "/foo/bar/baz", `/${X}`, "/products/x/y", "/collections/x/y", "/categories/x/y", "/blog/x/y", "/legal/missing", "/legal/missing/deeper", "/legal", "/categories", "/faq/x", "/cart/zzz",
  ...missing, ...missing.flatMap((p) => [`/en${p}`, `/ja${p}`]),
  ...["/products/x/y", "/collections/x/y", "/categories/x/y", "/blog/x/y", "/legal/missing", "/legal/missing/deeper"].flatMap((p) => [`/en${p}`, `/ja${p}`]),
  "/ja/layaway", "/en/cart", "/fr/about",
];
const navTargets = ["/en/collections", "/en/about"];

cov.expect("sitemap", "a valid sitemap was read", 1);
cov.expect("locale-homes", "/ja and /en settle with the tags (per context)", 2 * C);
cov.expect("static-templates", "known static templates, both languages (per context)", staticTemplates.length * 2 * C);
cov.expect("dynamic-both-languages", "product, collection and category in BOTH languages (per context)", 6 * C);
cov.expect("blog-post", "a blog post in every language the sitemap lists, at least one (per context)", 1 * C);
cov.expect("layaway", "/en/layaway settles with the tags (per context)", 1 * C);
cov.expect("unavailable-sibling", "an unavailable sibling is a clean 404 and the existing language names no hreflang for it (per context)", 1 * C);
cov.expect("single-language-posts", "every single-language post has its missing sibling tested (per context)", 1 * C, { optional: true });
cov.expect("404-shapes", "every 404 shape is a real 404 with nothing in the DOM and the useful page (per context)", notFound.length * C);
cov.expect("client-navigation", "client-side navigations keep one og:url (per context)", navTargets.length * C);
if (smv.problems.length === 0) cov.hit("sitemap");

const browser = await chromium.launch();
const readDom = () => {
  const q = (s) => [...document.querySelectorAll(s)].map((e) => e.getAttribute("content") ?? e.getAttribute("href"));
  return {
    ogUrl: q('meta[property="og:url"]'), canonical: q('link[rel="canonical"]'), hreflangs: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((e) => e.getAttribute("hreflang")),
    fb: q('meta[property="fb:app_id"]'), robots: q('meta[name="robots"]'), loc: q('meta[property="og:locale"]'), locAlt: q('meta[property="og:locale:alternate"]'), ogImage: q('meta[property="og:image"]').length,
    h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim())[0] ?? null,
    wayOn: [...document.querySelectorAll('a[href*="/collections"]')].length > 0,
    search: !!document.querySelector('form[action*="search"], input[type="search"], input[name="q"]'),
    pieces: document.querySelectorAll('a[href*="/products/"]').length,
  };
};

// bounded readiness: complete, expected path, and the signature unchanged for `stableMs`; never a fixed delay alone
async function settle(page, { expectPath = null, stableMs = 600 } = {}) {
  const t0 = Date.now();
  const inflight = page.__inflight;
  let last = null, since = 0;
  while (Date.now() - t0 < SETTLE_MS) {
    const sig = await page.evaluate(() => ({ ready: document.readyState, path: location.pathname, canonical: document.querySelectorAll('link[rel="canonical"]').length, og: document.querySelectorAll('meta[property="og:url"]').length, hreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length, fb: document.querySelectorAll('meta[property="fb:app_id"]').length, h1: !!document.querySelector("h1"), title: document.title, links: document.links.length })).catch(() => null);
    if (sig && sig.ready === "complete" && (expectPath === null || sig.path === expectPath) && (!inflight || inflight.size === 0)) {
      const key = JSON.stringify(sig);
      if (key === last) { if (Date.now() - since >= stableMs) { await page.evaluate(() => new Promise((r) => (window.requestIdleCallback ? window.requestIdleCallback(() => r(), { timeout: 500 }) : setTimeout(r, 0)))).catch(() => {}); return { settled: true, ms: Date.now() - t0 }; } }
      else { last = key; since = Date.now(); }
    } else last = null;
    await page.waitForTimeout(100);
  }
  return { settled: false, ms: Date.now() - t0 };
}

for (const [ctxName, opts] of contexts) {
  const context = await browser.newContext(opts);          // NO extraHTTPHeaders: credentials are routed per origin
  await installCredentialRouting(context, AUTH);
  const page = await context.newPage();
  // requests currently in flight: a page is not "settled" while any is outstanding (so a Server Action or a fetch the
  // page itself started is allowed to finish before the next navigation, instead of being aborted and then tolerated)
  page.__inflight = new Set();
  page.on("request", (r) => page.__inflight.add(r));
  page.on("requestfinished", (r) => page.__inflight.delete(r));
  page.on("requestfailed", (r) => page.__inflight.delete(r));
  const errors = [];
  const expected404 = new Set();
  let expected404Logged = 0;
  let abortedPrefetches = 0, abortedActions = 0;
  let navigating = false;                       // true from the moment THIS checker starts a navigation until the next page has settled
  const route = () => page.url().replace(ORIGINS.requestOrigin, "") || "/";
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const loc = m.location();
    if (/Failed to load resource: the server responded with a status of 404/.test(m.text()) && expected404.has(loc.url)) { expected404Logged++; return; }
    errors.push({ kind: "console.error", route: route(), text: m.text(), location: loc });
  });
  page.on("pageerror", (e) => errors.push({ kind: "pageerror", route: route(), text: e.message, stack: e.stack ?? "" }));
  page.on("response", (r) => {
    if (r.status() < 400) return;
    const req = r.request();
    if (req.resourceType() === "document" && r.status() === 404 && expected404.has(r.url())) return;   // an expected missing-document 404
    errors.push({ kind: "unexpected-response", route: route(), status: r.status(), url: r.url(), resourceType: req.resourceType() });
  });
  page.on("requestfailed", (req) => {
    const failure = req.failure()?.errorText ?? "";
    // The ONE tolerated class, narrow and counted: Next's own link-prefetch `fetch` (the `RSC: 1` request header),
    // to this origin, aborted because navigation left the page. Any other failed request is reported and fails.
    // (A prefetch that redirects, such as a link to a private page that goes to /login, is followed back through
    // redirectedFrom() to the request that carried `RSC: 1`.)
    // Aborted BY OUR OWN NAVIGATION only (an abort while the page is idle is a real failure and is reported), and only these two
    // same-origin classes, each counted: a Next link prefetch (`RSC: 1`) and a Server Action call (`next-action`).
    let origin = req;
    while (origin.redirectedFrom()) origin = origin.redirectedFrom();
    if (navigating && failure === "net::ERR_ABORTED" && req.resourceType() === "fetch" && req.url().startsWith(`${ORIGINS.requestOrigin}/`)) {
      if (origin.headers()["rsc"] === "1") { abortedPrefetches++; return; }
      if (origin.headers()["next-action"]) { abortedActions++; return; }
    }
    errors.push({ kind: "request-failed", route: route(), url: req.url(), resourceType: req.resourceType(), failure, headers: Object.keys(req.headers()).filter((h) => !/cookie|authorization|bypass/i.test(h)) });
  });

  const go = async (path, { expect404 = false } = {}) => {
    const url = `${ORIGINS.requestOrigin}${path}`;
    if (expect404) expected404.add(url);
    navigating = true;
    const r = await page.goto(url, { waitUntil: "load" });
    const s = await settle(page);
    navigating = false;
    return { r, s };
  };
  const unsettled = (path, s) => ok(ctxName, path, `the page settled within ${SETTLE_MS / 1000} s (bounded readiness)`, s.settled, `did not settle in ${s.ms} ms`);

  const checkTemplate = async (path, key) => {
    const { r, s } = await go(path);
    cov.hit(key);
    unsettled(path, s);
    if (r.status() !== 200) { ok(ctxName, path, "a known template answers HTTP 200", false, `got ${r.status()}`); return false; }
    const d = await page.evaluate(readDom), lang = path.startsWith("/ja") ? "ja" : "en", self = `${PUBLIC_ORIGIN}${path}`;
    ok(ctxName, path, "one og:url = the canonical = the page's public URL; one fb:app_id; primary and alternate og:locale; one og:image", d.ogUrl.length === 1 && d.canonical.length === 1 && d.ogUrl[0] === self && d.canonical[0] === self && d.fb.length === 1 && d.fb[0] === FB_ID && d.loc[0] === (lang === "ja" ? "ja_JP" : "en_US") && d.loc.length === 1 && d.locAlt.length === 1 && d.locAlt[0] === (lang === "ja" ? "en_US" : "ja_JP") && d.ogImage === 1, JSON.stringify({ ogUrl: d.ogUrl, canonical: d.canonical, fb: d.fb, loc: d.loc, locAlt: d.locAlt, ogImage: d.ogImage }));
    return true;
  };
  const checkSibling = async (bare, existing, absent, key) => {
    const { r, s } = await go(`/${absent}${bare}`, { expect404: true });
    const d = await page.evaluate(readDom);
    unsettled(`/${absent}${bare}`, s);
    ok(ctxName, `/${absent}${bare}`, "an unavailable sibling is a real 404 with noindex and NOTHING in the live DOM", r.status() === 404 && /noindex/.test(d.robots.join(",")) && d.canonical.length === 0 && d.hreflangs.length === 0 && d.ogUrl.length === 0, `status ${r.status()} robots=${d.robots} canonical=${d.canonical.length} hreflang=${d.hreflangs.length} og:url=${d.ogUrl.length}`);
    const { r: r2, s: s2 } = await go(`/${existing}${bare}`);
    const d2 = await page.evaluate(readDom);
    unsettled(`/${existing}${bare}`, s2);
    ok(ctxName, `/${existing}${bare}`, `the language that exists is 200 and names no hreflang for the unavailable one (${absent})`, r2.status() === 200 && !d2.hreflangs.includes(absent), `status ${r2.status()} hreflang=${d2.hreflangs.join(",") || "none"}`);
    cov.hit(key);
  };

  // 1. known templates
  for (const root of ["/ja", "/en"]) await checkTemplate(root, "locale-homes");
  for (const t of staticTemplates) for (const l of ["ja", "en"]) {
    if (!unlistedByPolicy.has(t)) ok(ctxName, `/${l}${t}`, "a known static template is listed in the sitemap in this language", inSitemap(`/${l}${t}`), "not in the sitemap");
    await checkTemplate(`/${l}${t}`, "static-templates");
  }
  for (const [name, bare] of Object.entries(families)) {
    if (!bare) { ok(ctxName, `(${name})`, "the sitemap offers a sample of this family", false, "no URL of this family in the sitemap"); continue; }
    const listed = ["ja", "en"].filter((l) => inSitemap(`/${l}${bare}`));
    if (name !== "post") {
      for (const l of ["ja", "en"]) {
        ok(ctxName, `/${l}${bare}`, "a product, collection or category is listed in BOTH languages", listed.includes(l), "not in the sitemap in this language");
        if (listed.includes(l)) await checkTemplate(`/${l}${bare}`, "dynamic-both-languages");
      }
    } else {
      ok(ctxName, bare, "a blog post is listed in at least one language", listed.length > 0, "not in the sitemap in either language");
      for (const l of listed) await checkTemplate(`/${l}${bare}`, "blog-post");
    }
  }

  // 2. unavailable siblings
  await checkSibling("/layaway", "en", "ja", "unavailable-sibling");
  await checkTemplate("/en/layaway", "layaway");
  const postLangs = new Map();
  for (const p of paths) { const m = p.match(/^\/(en|ja)(\/blog\/.+)$/); if (m) postLangs.set(m[2], [...(postLangs.get(m[2]) ?? []), m[1]]); }
  const single = [...postLangs].filter(([, ls]) => ls.length === 1);
  for (const [bare, [only]] of single) { await checkSibling(bare, only, only === "en" ? "ja" : "en", "single-language-posts"); cov.hit("unavailable-sibling"); }
  if (single.length === 0) cov.skip("single-language-posts", `no single-language post in this deployment's sitemap (${postLangs.size} post(s), all in both languages); the layaway sibling covers the rule`);

  // 3. 404 shapes
  for (const path of notFound) {
    const { r, s } = await go(path, { expect404: true });
    cov.hit("404-shapes");
    unsettled(path, s);
    const d = await page.evaluate(readDom);
    ok(ctxName, path, "a real 404 with noindex and NO canonical, hreflang or og:url in the live DOM", r.status() === 404 && /noindex/.test(d.robots.join(",")) && d.canonical.length === 0 && d.hreflangs.length === 0 && d.ogUrl.length === 0 && d.fb.length <= 1, `status ${r.status()} robots=${d.robots} canonical=${d.canonical.length} hreflang=${d.hreflangs.length} og:url=${d.ogUrl.length} fb=${d.fb.length}`);
    ok(ctxName, path, "the 404 page is still the useful one (heading, a way on, search, a piece)", !!d.h1 && d.wayOn && d.search && d.pieces >= 1, `h1=${d.h1} wayOn=${d.wayOn} search=${d.search} pieces=${d.pieces}`);
  }

  // 4. client-side navigation: same document, the identity follows the page
  await go("/en/faq");
  await page.evaluate(() => { window.__sameDocument = true; });
  for (const href of navTargets) {
    navigating = true;
    const clicked = await page.evaluate((h) => { const a = [...document.querySelectorAll("a[href]")].find((x) => x.getAttribute("href") === h); a?.click(); return !!a; }, href);
    const s = await settle(page, { expectPath: href });
    navigating = false;
    cov.hit("client-navigation");
    unsettled(`/en/faq -> ${href}`, s);
    const d = await page.evaluate(() => ({ same: window.__sameDocument === true, path: location.pathname, ...(() => { const q = (x) => [...document.querySelectorAll(x)].map((e) => e.getAttribute("content") ?? e.getAttribute("href")); return { ogUrl: q('meta[property="og:url"]'), canonical: q('link[rel="canonical"]'), fb: q('meta[property="fb:app_id"]') }; })() }));
    ok(ctxName, `/en/faq -> ${href}`, "client-side navigation: same document, one og:url and canonical for the new page, one fb:app_id", clicked && d.same && d.path === href && d.ogUrl.length === 1 && d.ogUrl[0] === `${PUBLIC_ORIGIN}${href}` && d.canonical[0] === `${PUBLIC_ORIGIN}${href}` && d.fb.length === 1, JSON.stringify({ clicked, ...d }));
  }

  ok(ctxName, "(errors)", `no console error, page error (hydration included), unexpected HTTP status or failed request on any page above (not counted: ${expected404Logged} console line(s) for documents this checker expected to be 404; ${abortedPrefetches} RSC prefetch(es) and ${abortedActions} Server Action call(s) aborted by this checker's own navigation)`, errors.length === 0, JSON.stringify(errors));
  await context.close();
}
await browser.close();

for (const f of cov.failures()) results.push({ status: "FAIL", ctx: "-", route: "(coverage)", what: `coverage missing: ${f.key} - ${f.description}`, detail: `expected ${f.expected}, checked ${f.checked}${f.skipped.length ? `, skipped: ${f.skipped.join("; ")}` : ""}` });
const w = Math.max(...results.map((r) => r.route.length));
for (const r of results) console.log(`${r.status.padEnd(5)} ${r.ctx.padEnd(13)} ${r.route.padEnd(w)}  ${r.what}${r.detail ? `  [${r.detail}]` : ""}`);
const n = (s) => results.filter((r) => r.status === s).length;
console.log(`\ncoverage inventory (requests to ${BASE}; canonical origin expected ${PUBLIC_ORIGIN}; ${C} browser contexts):\n${cov.inventory()}`);
console.log(`\n${BASE} (DOM): ${n("PASS")} pass, ${n("FAIL")} fail`);
process.exitCode = n("FAIL") ? 1 : 0;      // not process.exit(): a long report written to a pipe must be flushed first
