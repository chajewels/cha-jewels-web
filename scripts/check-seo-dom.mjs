#!/usr/bin/env node
// Rendered-DOM SEO check, in a real browser. Usage: node scripts/check-seo-dom.mjs [baseUrl]
// (default https://www.chajewelsjp.com). Read-only: it only loads public pages. Needs the Playwright
// browsers that `@playwright/test` (already a devDependency) uses.
//
// ORIGINS. Requests go to BASE. The pages DECLARE their public origin (canonical, og:url, sitemap): the same
// as BASE for production or a local build, different for a preview. Set SEO_CHECK_PUBLIC_ORIGIN to the origin
// the preview declares (the production origin); expected values are compared with that.
//
// CREDENTIALS (optional, for a preview behind Vercel protection). VERCEL_AUTOMATION_BYPASS_SECRET is used only
// if SEO_CHECK_BYPASS_ORIGIN names the exact checked origin; anything else refuses to run before any request.
// The BROWSER NEVER SEES THE SECRET: one Node request to the authorized origin (no redirect followed, bounded
// timeout) obtains Vercel's bypass cookie, which is installed in the browser context pinned to that host. No
// request interception, no extra headers: redirects, subresources and client navigations behave exactly as for
// a signed-in person, and the browser's own host scoping keeps the cookie off every other origin. Without a
// Set-Cookie answer the run refuses (fails closed). Every printed line is redacted of the secret and the cookie
// values. See scripts/lib/seo-check-core.mjs, tests/seo-check-core.test.mjs, scripts/test-seo-check-isolation.mjs.
//
// WHY THIS EXISTS next to scripts/check-seo-live.mjs. That script reads the raw HTML response. A browser applies
// more: Next streams page metadata and React hoists <link>/<meta> into <head> on the client, so a page that 404s
// can show a canonical, hreflang or og:url in the LIVE DOM that the raw HTML never contained. Search engines that
// run JavaScript read the DOM. Both checkers are required by the release gate; they share ONE route matrix
// (FOUNDATION_MATRIX) and a test enforces parity of their coverage keys.
//
// FAILS CLOSED. The sitemap is validated before anything is sampled; every requirement declares how many checks
// it needs; anything unchecked is MISSING and fails the run; the inventory is printed at the end.
//
// For EACH of two browser contexts (desktop 1280x800, phone 375x812):
//  1. Known templates, both languages: after the page SETTLES, exactly one og:url equal to the canonical and to
//     the page's public URL, one fb:app_id, the primary AND alternate og:locale, one og:image.
//  2. Unavailable siblings, explicitly: a clean 404 AND the existing language names no hreflang for it.
//  3. Every 404 shape: real 404 status, noindex, NO canonical, hreflang or og:url in the DOM, and the useful page.
//  4. Private pages (og:url only), gated descendants (the browser lands on /login), query handling.
//  5. Client-side navigation (same document): the single og:url follows the new page.
//  6. Every console error, page error, unexpected HTTP status, failed request and navigation failure, captured
//     IN FULL and redacted. Not counted, and counted in the output: the browser's own "Failed to load resource
//     ... 404" line for a document this checker EXPECTED to be a 404 (exact URL), and, only while this checker
//     is itself navigating, a same-origin Next link prefetch (`RSC: 1`), Server Action call or <video>/<audio>
//     media stream cancelled by that navigation. Anything else fails.
//  "Settled" = bounded readiness (max 10 s): document complete, the EXPECTED path reached, nothing of the current
//  navigation in flight (streaming media, websocket and eventsource requests excepted), and the metadata VALUES
//  (canonical href, og:url, hreflang pairs, fb:app_id, robots, og:locale, title, h1) unchanged for 600 ms. A page
//  that never settles is a FAIL that names what blocked it, not a pass.
import { chromium } from "@playwright/test";
import { resolveOrigins, authorizeCredentials, makeGet, redactConsole, describeFailure, bootstrapBrowserCredentials, installBrowserCredentials, Coverage, validateSitemap, llmsTxtProblems, FOUNDATION_MATRIX as M } from "./lib/seo-check-core.mjs";

const BASE = (process.argv[2] ?? "https://www.chajewelsjp.com").replace(/\/$/, "");
let ORIGINS, AUTH;
try { ORIGINS = resolveOrigins(BASE); AUTH = authorizeCredentials(ORIGINS.requestOrigin); } catch (e) { console.error(`check-seo-dom: ${e.message}`); process.exit(2); }
redactConsole(AUTH);
const PUBLIC_ORIGIN = ORIGINS.publicOrigin;
const FB_ID = M.FB_ID;
const SETTLE_MS = 10000;
const results = [];
const ok = (ctx, route, what, cond, detail = "") => results.push({ status: cond ? "PASS" : "FAIL", ctx, route, what, detail: cond ? "" : detail });
const cov = new Coverage();
const get = makeGet(ORIGINS.requestOrigin, AUTH);

// ---- credentials for the browser: a cookie, obtained once, or nothing at all
let COOKIES = [];
if (AUTH.enabled) {
  try { COOKIES = await bootstrapBrowserCredentials(AUTH); } catch (e) { console.error(`check-seo-dom: ${describeFailure(e, AUTH)}`); process.exit(2); }
}

const contexts = [["desktop-1280", { viewport: { width: 1280, height: 800 } }], ["phone-375", { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }]];
const C = contexts.length;

// ---- sitemap, validated before anything is sampled from it
const sm = await get("/sitemap.xml");
const smv = validateSitemap(sm, { publicOrigin: PUBLIC_ORIGIN });
ok("-", "/sitemap.xml", "valid: status 200, XML, well-formed urlset, enough URLs, none duplicated, every URL on the public origin", smv.problems.length === 0, smv.problems.join("; "));
const paths = smv.paths;
const inSitemap = (p) => paths.includes(p);
const bareOf = (p) => p.replace(/^\/(en|ja)(?=\/|$)/, "") || "/";
const find = (re) => paths.map(bareOf).find((p) => re.test(p));
const families = { product: find(/^\/products\//), collection: find(/^\/collections\/./), category: find(/^\/categories\//), post: find(/^\/blog\/./) };
const staticTemplates = M.staticTemplates;
const unlistedByPolicy = new Set(M.unlistedByPolicy);

cov.expect("sitemap", "a valid sitemap was read", 1);
cov.expect("locale-homes", "/ja and /en settle with the tags (per context)", 2 * C);
cov.expect("static-templates", "every known static template, both languages (per context)", staticTemplates.length * 2 * C);
cov.expect("dynamic-both-languages", "product, collection and category in BOTH languages (per context)", 6 * C);
cov.expect("blog-post", "a blog post in every language the sitemap lists, at least one (per context)", 1 * C);
cov.expect("layaway", "/en/layaway settles with the tags (per context)", 1 * C);
cov.expect("unavailable-sibling", "an unavailable sibling is a clean 404 and the existing language names no hreflang for it (per context)", 1 * C);
cov.expect("single-language-posts", "every single-language post has its missing sibling tested (per context)", 1 * C, { optional: true });
cov.expect("404-shapes", "every 404 shape is a real 404 with nothing in the DOM and the useful page (per context)", M.notFoundShapes.length * C);
cov.expect("gated-descendants", "malformed descendants of gated private routes land on /login (per context)", M.gatedDescendants.length * C);
cov.expect("private-pages", "real private pages keep og:url only (per context)", M.privatePages.length * C);
cov.expect("query-handling", "og:url and the canonical ignore the request query (per context)", M.queryCases.length * C);
cov.expect("client-navigation", "client-side navigations keep one og:url (per context)", M.navTargets.length * C);
cov.expect("llms-txt", "/llms.txt is 200 text/plain and every link is a public sitemap page, fetched with the browser context's own credentials (per context)", 1 * C);
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
// The settle signature: metadata VALUES, not counts, plus the heading and title.
const signature = () => {
  const q = (s) => [...document.querySelectorAll(s)].map((e) => e.getAttribute("content") ?? e.getAttribute("href"));
  return JSON.stringify({ ready: document.readyState, path: location.pathname, canonical: q('link[rel="canonical"]'), og: q('meta[property="og:url"]'), hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((e) => `${e.getAttribute("hreflang")}=${e.getAttribute("href")}`), fb: q('meta[property="fb:app_id"]'), robots: q('meta[name="robots"]'), loc: q('meta[property="og:locale"]'), title: document.title, h1: document.querySelector("h1")?.textContent?.trim() ?? null });
};

// bounded readiness: complete, the EXPECTED path, nothing of the CURRENT navigation in flight, and the signature
// unchanged for `stableMs`. In-flight tracking is reset at every navigation this checker starts (a request from an
// earlier document is irrelevant to the page under test) and ignores streaming resource types that legitimately stay
// open (media, websocket, eventsource); a failure names what blocked it.
const STREAMING = new Set(["media", "websocket", "eventsource"]);
const blocking = (page) => [...(page.__inflight ?? [])].filter((r) => !STREAMING.has(r.resourceType()));
async function settle(page, { expectPath, stableMs = 600 }) {
  const t0 = Date.now();
  let last = null, since = 0, changes = 0;
  while (Date.now() - t0 < SETTLE_MS) {
    const sig = await page.evaluate(signature).catch(() => null);
    const s = sig ? JSON.parse(sig) : null;
    if (s && s.ready === "complete" && s.path === expectPath && blocking(page).length === 0) {
      if (sig === last) { if (Date.now() - since >= stableMs) return { settled: true, ms: Date.now() - t0, path: s.path }; }
      else { if (last !== null) changes++; last = sig; since = Date.now(); }
    } else last = null;
    await page.waitForTimeout(100);
  }
  const s = await page.evaluate(signature).then((x) => JSON.parse(x)).catch(() => null);
  const open = blocking(page);
  return { settled: false, ms: Date.now() - t0, path: s?.path ?? "(unreadable)", why: `ready=${s?.ready ?? "?"} path=${s?.path ?? "?"} expected=${expectPath} inflight=${open.length}${open.length ? ` [${[...new Set(open.map((r) => `${r.resourceType()} ${new URL(r.url()).pathname}`))].slice(0, 4).join(", ")}]` : ""} signatureChanges=${changes}` };
}

for (const [ctxName, opts] of contexts) {
  const context = await browser.newContext(opts);          // no extraHTTPHeaders, no routes: the browser is untouched
  await installBrowserCredentials(context, COOKIES);
  const page = await context.newPage();
  page.__inflight = new Set();
  page.on("request", (r) => page.__inflight.add(r));
  page.on("requestfinished", (r) => page.__inflight.delete(r));
  page.on("requestfailed", (r) => page.__inflight.delete(r));
  const errors = [];
  const expected404 = new Set();
  let expected404Logged = 0, abortedPrefetches = 0, abortedActions = 0, abortedMedia = 0;
  let navigating = false;
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
    if (req.resourceType() === "document" && r.status() === 404 && expected404.has(r.url())) return;
    errors.push({ kind: "unexpected-response", route: route(), status: r.status(), url: r.url(), resourceType: req.resourceType() });
  });
  page.on("requestfailed", (req) => {
    const failure = req.failure()?.errorText ?? "";
    let origin = req;
    while (origin.redirectedFrom()) origin = origin.redirectedFrom();
    if (navigating && failure === "net::ERR_ABORTED" && req.url().startsWith(`${ORIGINS.requestOrigin}/`)) {
      if (req.resourceType() === "fetch" && origin.headers()["rsc"] === "1") { abortedPrefetches++; return; }
      if (req.resourceType() === "fetch" && origin.headers()["next-action"]) { abortedActions++; return; }
      // a <video> or <audio> element streams its file; the browser cancels that stream when the page is left (the sign-in page's logo film)
      if (req.resourceType() === "media") { abortedMedia++; return; }
    }
    errors.push({ kind: "request-failed", route: route(), url: req.url(), resourceType: req.resourceType(), failure });
  });

  // One load: the navigation itself may fail (refused, timed out, aborted); that is a recorded failure, never a crash.
  const go = async (path, { expect404 = false, expectPath = null } = {}) => {
    const url = `${ORIGINS.requestOrigin}${path}`;
    if (expect404) expected404.add(url);
    navigating = true;
    page.__inflight.clear();                              // only the navigation about to start counts
    let r = null, err = null;
    try { r = await page.goto(url, { waitUntil: "load", timeout: SETTLE_MS * 3 }); } catch (e) { err = describeFailure(e, AUTH); }
    const s = err ? { settled: false, ms: 0, path: "(navigation failed)" } : await settle(page, { expectPath: expectPath ?? path.split("?")[0] });
    navigating = false;
    if (err) errors.push({ kind: "navigation-failed", route: path, text: err });
    return { status: err ? 0 : r.status(), finalUrl: page.url(), s, err };
  };
  const settledOk = (label, s) => ok(ctxName, label, `the page settled on the expected path within ${SETTLE_MS / 1000} s (bounded readiness)`, s.settled, `did not settle in ${s.ms} ms: ${s.why ?? `path ${s.path}`}`);
  const dom = () => page.evaluate(readDom).catch(() => ({ ogUrl: [], canonical: [], hreflangs: [], fb: [], robots: [], loc: [], locAlt: [], ogImage: 0, h1: null, wayOn: false, search: false, pieces: 0 }));

  const checkTemplate = async (path, key) => {
    const { status, s, err } = await go(path);
    cov.hit(key);
    settledOk(path, s);
    if (status !== 200) { ok(ctxName, path, "a known template answers HTTP 200", false, err ? `navigation failed: ${err}` : `got ${status}`); return false; }
    const d = await dom(), lang = path.startsWith("/ja") ? "ja" : "en", self = `${PUBLIC_ORIGIN}${path}`;
    ok(ctxName, path, "one og:url = the canonical = the page's public URL; one fb:app_id; primary and alternate og:locale; one og:image", d.ogUrl.length === 1 && d.canonical.length === 1 && d.ogUrl[0] === self && d.canonical[0] === self && d.fb.length === 1 && d.fb[0] === FB_ID && d.loc[0] === (lang === "ja" ? "ja_JP" : "en_US") && d.loc.length === 1 && d.locAlt.length === 1 && d.locAlt[0] === (lang === "ja" ? "en_US" : "ja_JP") && d.ogImage === 1, JSON.stringify({ ogUrl: d.ogUrl, canonical: d.canonical, fb: d.fb, loc: d.loc, locAlt: d.locAlt, ogImage: d.ogImage }));
    return true;
  };
  const clean404 = async (path) => {
    const { status, s, err } = await go(path, { expect404: true });
    settledOk(path, s);
    const d = await dom();
    ok(ctxName, path, "a real 404 with noindex and NO canonical, hreflang or og:url in the live DOM", status === 404 && /noindex/.test(d.robots.join(",")) && d.canonical.length === 0 && d.hreflangs.length === 0 && d.ogUrl.length === 0 && d.fb.length <= 1, err ? `navigation failed: ${err}` : `status ${status} robots=${d.robots} canonical=${d.canonical.length} hreflang=${d.hreflangs.length} og:url=${d.ogUrl.length} fb=${d.fb.length}`);
    ok(ctxName, path, "the 404 page is still the useful one (heading, a way on, search, a piece)", !!d.h1 && d.wayOn && d.search && d.pieces >= 1, `h1=${d.h1} wayOn=${d.wayOn} search=${d.search} pieces=${d.pieces}`);
  };
  const checkSibling = async (bare, existing, absent, key) => {
    await clean404(`/${absent}${bare}`);
    const { status, s } = await go(`/${existing}${bare}`);
    const d = await dom();
    settledOk(`/${existing}${bare}`, s);
    ok(ctxName, `/${existing}${bare}`, `the language that exists is 200 and names no hreflang for the unavailable one (${absent})`, status === 200 && !d.hreflangs.includes(absent), `status ${status} hreflang=${d.hreflangs.join(",") || "none"}`);
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
  await checkSibling(M.layaway.bare, M.layaway.existing, M.layaway.absent, "unavailable-sibling");
  await checkTemplate("/en/layaway", "layaway");
  const postLangs = new Map();
  for (const p of paths) { const m = p.match(/^\/(en|ja)(\/blog\/.+)$/); if (m) postLangs.set(m[2], [...(postLangs.get(m[2]) ?? []), m[1]]); }
  const single = [...postLangs].filter(([, ls]) => ls.length === 1);
  for (const [bare, [only]] of single) { await checkSibling(bare, only, only === "en" ? "ja" : "en", "single-language-posts"); cov.hit("unavailable-sibling"); }
  if (single.length === 0) cov.skip("single-language-posts", `no single-language post in this deployment's sitemap (${postLangs.size} post(s), all in both languages); the layaway sibling covers the rule`);

  // 3. every 404 shape
  for (const path of M.notFoundShapes) { await clean404(path); cov.hit("404-shapes"); }

  // 4. private pages, gated descendants, query handling
  for (const path of M.privatePages) {
    const { status, s, err } = await go(path);
    cov.hit("private-pages");
    settledOk(path, s);
    const d = await dom();
    ok(ctxName, path, "a private page: 200, noindex, no canonical or alternates, one og:url for its own URL, one fb:app_id", status === 200 && /noindex/.test(d.robots.join(",")) && d.canonical.length === 0 && d.hreflangs.length === 0 && d.ogUrl.length === 1 && d.ogUrl[0] === `${PUBLIC_ORIGIN}${path}` && d.fb.length === 1, err ? `navigation failed: ${err}` : `status ${status} robots=${d.robots} canonical=${d.canonical.length} hreflang=${d.hreflangs.length} og:url=${d.ogUrl.join("|")} fb=${d.fb.length}`);
  }
  for (const path of M.gatedDescendants) {
    // Intentional difference from the raw checker: a browser follows the 307, so the check is the FINAL URL.
    const { status, finalUrl, s, err } = await go(path, { expectPath: "/login" });
    cov.hit("gated-descendants");
    settledOk(path, s);
    const d = await dom();
    ok(ctxName, path, "a malformed descendant of a gated route lands an anonymous visitor on /login (final URL), a noindex page", !err && new URL(finalUrl).pathname === "/login" && status === 200 && /noindex/.test(d.robots.join(",")), err ? `navigation failed: ${err}` : `final ${finalUrl} status ${status} robots=${d.robots}`);
  }
  for (const { path, query } of M.queryCases) {
    const { status, s, err } = await go(`${path}${query}`, { expectPath: path });
    cov.hit("query-handling");
    settledOk(`${path}?…`, s);
    const d = await dom();
    ok(ctxName, `${path}?utm_source=…`, "og:url and the canonical stay the bare locale URL when the request carries a query", status === 200 && d.ogUrl.length === 1 && d.ogUrl[0] === `${PUBLIC_ORIGIN}${path}` && d.canonical[0] === `${PUBLIC_ORIGIN}${path}`, err ? `navigation failed: ${err}` : `status ${status} og:url=${d.ogUrl.join("|")} canonical=${d.canonical.join("|")}`);
  }

  // 5. client-side navigation: same document, the identity follows the page
  await go("/en/faq");
  await page.evaluate(() => { window.__sameDocument = true; }).catch(() => {});
  for (const href of M.navTargets) {
    navigating = true;
    page.__inflight.clear();
    const clicked = await page.evaluate((h) => { const a = [...document.querySelectorAll("a[href]")].find((x) => x.getAttribute("href") === h); a?.click(); return !!a; }, href).catch(() => false);
    const s = await settle(page, { expectPath: href });
    navigating = false;
    cov.hit("client-navigation");
    settledOk(`/en/faq -> ${href}`, s);
    const d = await page.evaluate(() => ({ same: window.__sameDocument === true, path: location.pathname, ...(() => { const q = (x) => [...document.querySelectorAll(x)].map((e) => e.getAttribute("content") ?? e.getAttribute("href")); return { ogUrl: q('meta[property="og:url"]'), canonical: q('link[rel="canonical"]'), fb: q('meta[property="fb:app_id"]') }; })() })).catch(() => ({ same: false, path: "(unreadable)", ogUrl: [], canonical: [], fb: [] }));
    ok(ctxName, `/en/faq -> ${href}`, "client-side navigation: same document, one og:url and canonical for the new page, one fb:app_id", clicked && d.same && d.path === href && d.ogUrl.length === 1 && d.ogUrl[0] === `${PUBLIC_ORIGIN}${href}` && d.canonical[0] === `${PUBLIC_ORIGIN}${href}` && d.fb.length === 1, JSON.stringify({ clicked, ...d }));
  }

  // 6. llms.txt: the browser context's own request (same cookies as its pages), judged by the shared rule.
  {
    let r;
    try {
      const res = await context.request.get(`${ORIGINS.requestOrigin}/llms.txt`, { maxRedirects: 0, timeout: SETTLE_MS });
      r = { status: res.status(), contentType: res.headers()["content-type"] ?? null, body: await res.text() };
    } catch (e) { r = { status: 0, contentType: null, body: "", error: describeFailure(e, AUTH) }; }
    cov.hit("llms-txt");
    const problems = llmsTxtProblems(r, { publicOrigin: PUBLIC_ORIGIN, sitemapPaths: paths });
    ok(ctxName, "/llms.txt", "200 text/plain; every link is a public sitemap page on the public origin; no product, private or Japanese-layaway link; no figure", problems.length === 0, r.error ? `request failed: ${r.error}` : problems.join("; "));
  }

  ok(ctxName, "(errors)", `no console error, page error (hydration included), unexpected HTTP status, failed request or failed navigation on any page above (not counted: ${expected404Logged} console line(s) for documents this checker expected to be 404; ${abortedPrefetches} RSC prefetch(es), ${abortedActions} Server Action call(s) and ${abortedMedia} media stream(s) cancelled by this checker's own navigation)`, errors.length === 0, JSON.stringify(errors));
  await context.close();
}
await browser.close();

for (const f of cov.failures()) results.push({ status: "FAIL", ctx: "-", route: "(coverage)", what: `coverage missing: ${f.key} - ${f.description}`, detail: `expected ${f.expected}, checked ${f.checked}${f.skipped.length ? `, skipped: ${f.skipped.join("; ")}` : ""}` });
const w = Math.max(...results.map((r) => r.route.length));
for (const r of results) console.log(`${r.status.padEnd(5)} ${r.ctx.padEnd(13)} ${r.route.padEnd(w)}  ${r.what}${r.detail ? `  [${r.detail}]` : ""}`);
const n = (s) => results.filter((r) => r.status === s).length;
console.log(`\ncoverage inventory (requests to ${BASE}; canonical origin expected ${PUBLIC_ORIGIN}; ${C} browser contexts; credentials: ${AUTH.enabled ? `bypass cookie pinned to ${AUTH.host}` : "none"}):\n${cov.inventory()}`);
console.log(`\n${BASE} (DOM): ${n("PASS")} pass, ${n("FAIL")} fail`);
process.exitCode = n("FAIL") ? 1 : 0;      // not process.exit(): a long report written to a pipe must be flushed first
