#!/usr/bin/env node
// Rendered check of the legacy-redirect ROLLBACK mode. Usage: node scripts/check-seo-rollback.mjs <baseUrl>
// Run it against a server started with SEO_LEGACY_REDIRECTS=off (the kill switch, lib/legacy-redirect.ts).
// With the switch off, bare legacy URLs render again instead of redirecting, and they must keep the tags the
// legacy pages always had (canonical, hreflang, og:url, one fb:app_id). Fails closed: the sitemap is
// validated, the samples must exist, and the coverage inventory is printed. (Default mode, redirects ON, is
// covered by scripts/check-seo-live.mjs and scripts/check-seo-dom.mjs.)
//
// A KNOWN, DOCUMENTED LIMIT of rollback mode: a bare dynamic URL for a resource that does not exist is a 404
// that still carries those tags (the layout cannot know the resource is missing). This check records it as
// the documented rollback behaviour; it is why rollback is an emergency switch, not a state to stay in.
import { resolveOrigins, authorizeCredentials, makeGet, redactConsole, Coverage, validateSitemap } from "./lib/seo-check-core.mjs";

const BASE = (process.argv[2] ?? "").replace(/\/$/, "");
if (!BASE) { console.error("usage: node scripts/check-seo-rollback.mjs <baseUrl of a server started with SEO_LEGACY_REDIRECTS=off>"); process.exit(2); }
let O, AUTH;
try { O = resolveOrigins(BASE); AUTH = authorizeCredentials(O.requestOrigin); } catch (e) { console.error(`check-seo-rollback: ${e.message}`); process.exit(2); }
redactConsole(AUTH);
const get = makeGet(O.requestOrigin, AUTH);
const PUB = O.publicOrigin;
const rows = [];
const ok = (route, what, cond, detail = "") => rows.push({ s: cond ? "PASS" : "FAIL", route, what, detail: cond ? "" : detail });
const cov = new Coverage();
const canon = (h) => [...h.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
const alts = (h) => [...h.matchAll(/<link rel="alternate" hrefLang="([^"]*)" href="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
const ogu = (h) => [...h.matchAll(/<meta property="og:url" content="([^"]*)"/g)].map((m) => m[1]);
const fb = (h) => [...h.matchAll(/<meta property="fb:app_id" content="([^"]*)"/g)].length;
const robots = (h) => (h.match(/<meta name="robots" content="([^"]*)"/) ?? [])[1] ?? null;

const sm = await get("/sitemap.xml");
const v = validateSitemap(sm, { publicOrigin: PUB });
ok("/sitemap.xml", "valid sitemap", v.problems.length === 0, v.problems.join("; "));
const bareOf = (p) => p.replace(/^\/(en|ja)(?=\/|$)/, "") || "/";
const first = (re) => v.paths.map(bareOf).find((p) => re.test(p));
const dynamic = [first(/^\/products\//), first(/^\/collections\/./), first(/^\/categories\//), first(/^\/blog\/./)];
const staticPaths = ["/faq", "/about", "/jewelry-guide"];
cov.expect("bare-static", "bare static pages render (200, no redirect) with the legacy tags", staticPaths.length);
cov.expect("bare-dynamic", "bare product, collection, category and post render (200, no redirect) with the legacy tags", 4);
cov.expect("bare-missing", "a bare missing resource is a 404 (rollback behaviour recorded)", 1);
cov.expect("locale-unchanged", "a locale page is unchanged by the switch (one og:url = canonical)", 1);

for (const [i, bare] of [...staticPaths, ...dynamic].entries()) {
  const dyn = i >= staticPaths.length;
  if (!bare) { ok(`(sample ${i})`, "the sitemap offers a sample", false, "missing"); continue; }
  const r = await get(bare);
  cov.hit(dyn ? "bare-dynamic" : "bare-static");
  const self = `${PUB}${bare}`;
  const what = "rollback: the bare URL renders (200, not a redirect) with canonical, hreflang, og:url and one fb:app_id";
  const detail = `status ${r.status} location=${r.location} canonical=${canon(r.body)} og:url=${ogu(r.body)} hreflang=${alts(r.body).length} fb=${fb(r.body)}`;
  const base = r.status === 200 && canon(r.body).join() === self && alts(r.body).length === 3 && fb(r.body) === 1;
  // R-37 (closed 2026-11-01): a bare product page carries exactly ONE og:url, the bare one from <SeoLinks />; the product
  // OpenGraph block no longer names the locale URL (lib/product-seo.ts). The DEFERRED branch that accepted the duplicate is gone.
  ok(bare, what, base && ogu(r.body).join() === self, detail);
}
{
  const r = await get("/products/nonexistent-seo-check-xyz");
  cov.hit("bare-missing");
  ok("/products/nonexistent-seo-check-xyz", "rollback: a bare missing resource is a real 404 with noindex (it still carries the legacy tags: the documented limit of rollback mode)", r.status === 404 && /noindex/.test(robots(r.body) ?? ""), `status ${r.status}`);
  const l = await get("/en/faq");
  cov.hit("locale-unchanged");
  ok("/en/faq", "a locale page is unchanged by the switch: one og:url equal to the canonical", l.status === 200 && ogu(l.body).join() === `${PUB}/en/faq` && canon(l.body).join() === `${PUB}/en/faq`, `status ${l.status}`);
}
for (const f of cov.failures()) rows.push({ s: "FAIL", route: "(coverage)", what: `coverage missing: ${f.key} - ${f.description}`, detail: `expected ${f.expected}, checked ${f.checked}` });
const w = Math.max(...rows.map((r) => r.route.length));
for (const r of rows) console.log(`${r.s.padEnd(5)} ${r.route.padEnd(w)}  ${r.what}${r.detail ? `  [${r.detail}]` : ""}`);
console.log(`\ncoverage inventory:\n${cov.inventory()}`);
const fails = rows.filter((r) => r.s === "FAIL").length, deferred = rows.filter((r) => r.s === "DEFERRED").length;
console.log(`\n${BASE} (rollback mode): ${rows.length - fails - deferred} pass, ${fails} fail, ${deferred} deferred (documented, owner-tracked)`);
process.exitCode = fails ? 1 : 0;      // not process.exit(): a long report written to a pipe must be flushed first
