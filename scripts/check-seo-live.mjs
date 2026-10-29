#!/usr/bin/env node
// Read-only SEO route check. Usage: node scripts/check-seo-live.mjs [baseUrl]
// (default https://www.chajewelsjp.com). Not part of CI: it needs a running
// site. Sends plain GET requests with no cookie and no Accept-Language, which
// is how most crawlers arrive (the site then answers in Japanese).
//
// It states the INTENDED policy for each kind of route (lib/seo-policy.ts, the
// Phase 1 route matrix in docs/seo/SEO-BASELINE.md) and reports PASS / FAIL.
// DEFERRED marks a known gap that belongs to a later phase; it does not fail
// the run. Exit code 1 only when a FAIL is reported.
//
// Only real <link>/<meta> elements are counted. Next also repeats the metadata
// inside its RSC payload as escaped JSON, which is not what a crawler reads.

const BASE = (process.argv[2] ?? "https://www.chajewelsjp.com").replace(/\/$/, "");
const results = [];
const record = (status, route, what, detail = "") => results.push({ status, route, what, detail });
const ok = (route, what, cond, detail = "") => record(cond ? "PASS" : "FAIL", route, what, cond ? "" : detail);

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual", headers: { "user-agent": "cha-seo-check/1" } });
  const body = res.status >= 300 && res.status < 400 ? "" : await res.text();
  return { status: res.status, location: res.headers.get("location"), xrobots: res.headers.get("x-robots-tag"), cache: res.headers.get("cache-control"), body };
}

const robotsMeta = (html) => (html.match(/<meta name="robots" content="([^"]*)"/) ?? [])[1] ?? null;
const canonicals = (html) => [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
const alternates = (html) => [...html.matchAll(/<link rel="alternate" hrefLang="([^"]*)" href="([^"]*)"/g)].map((m) => ({ lang: m[1], href: m[2] }));
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));

// ---------------------------------------------------------------- sitemap
const sm = await get("/sitemap.xml");
ok("/sitemap.xml", "answers 200", sm.status === 200, `got ${sm.status}`);
const locs = [...sm.body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
ok("/sitemap.xml", "lists URLs", locs.length > 0, "empty");
const paths = locs.map((l) => new URL(l).pathname);
// Since Phase 2D the sitemap lists locale URLs (/ja/…, /en/…). The samples
// below are taken without the prefix, so every check that follows still names
// a real slug whichever form the sitemap uses.
const bareOf = (p) => p.replace(/^\/(en|ja)(?=\/|$)/, "") || "/";
const find = (re) => paths.map(bareOf).find((p) => re.test(p));
const product = find(/^\/products\//), collection = find(/^\/collections\/./), category = find(/^\/categories\//), post = find(/^\/blog\/./);

const NOINDEX_PREFIX = ["/search", "/cart", "/login", "/auth", "/account", "/checkout", "/loyalty/join", "/already-registered", "/review", "/receipts", "/newsletter/unsubscribe", "/cart-reminders"];
const leaked = paths.filter((p) => NOINDEX_PREFIX.some((n) => bareOf(p) === n || bareOf(p).startsWith(`${n}/`)));
ok("/sitemap.xml", "lists no private or utility route", leaked.length === 0, leaked.join(", "));
// Phase 3: the English layaway page is listed once, at /en/layaway; the bare
// cookie-decided /layaway and the non-existent /ja/layaway never are.
ok("/sitemap.xml", "Phase 3: lists /en/layaway exactly once", paths.filter((p) => p === "/en/layaway").length === 1, paths.filter((p) => /layaway$/.test(p)).join(", ") || "none");
ok("/sitemap.xml", "does not list /layaway or /ja/layaway (cookie-decided / never)", !paths.some((p) => /^\/(ja\/)?layaway$/.test(p)), paths.filter((p) => /layaway$/.test(p)).join(", "));
ok("/sitemap.xml", "every URL is on the checked origin", locs.every((l) => l.startsWith(BASE)), locs.find((l) => !l.startsWith(BASE)) ?? "");
// ---- Phase 2D: locale URLs only, the root `/` kept until OD-3, no hreflang (OD-12).
const bareListed = paths.filter((p) => p !== "/" && !/^\/(en|ja)(\/|$)/.test(p));
ok("/sitemap.xml", "2D: lists no bare legacy URL except the root", bareListed.length === 0, bareListed.slice(0, 5).join(", "));
ok("/sitemap.xml", "2D: lists /, /ja and /en", ["/", "/ja", "/en"].every((p) => paths.includes(p)), paths.slice(0, 3).join(", "));
ok("/sitemap.xml", "2D: no hreflang in the sitemap (OD-12: HTML only)", !/xhtml:link/.test(sm.body));
// Every listed static page and post, and one entry per dynamic family and
// language, must answer 200 itself — never a redirect, never a 404.
const sample = [...new Set(paths.filter((p) => !/^\/(en|ja)\/(products|categories|collections)\/./.test(p)).concat(
  ...["products", "categories", "collections"].flatMap((f) => ["ja", "en"].map((l) => paths.find((p) => p.startsWith(`/${l}/${f}/`)) ?? [])),
))];
const notOk = [];
for (const p of sample) { const r = await get(p); if (r.status !== 200) notOk.push(`${p}:${r.status}`); }
ok("/sitemap.xml", `2D: ${sample.length} sampled entries each answer 200 directly`, notOk.length === 0, notOk.slice(0, 5).join(", "));

// ---------------------------------------------------------------- robots.txt
const rb = await get("/robots.txt");
ok("/robots.txt", "answers 200", rb.status === 200, `got ${rb.status}`);
ok("/robots.txt", "declares the sitemap", /^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m.test(rb.body));
for (const p of ["/search", "/cart", "/login"]) ok("/robots.txt", `does not block ${p} (its noindex must be readable)`, !new RegExp(`^Disallow: ${p}\\b`, "m").test(rb.body));

// ---------------------------------------------------------------- legacy redirects (Phase 2E-stage-1)
// A no-signal request (this script's) to a bare public URL answers a TEMPORARY
// 307 to its /ja page, never cached for someone else; ?lang=en goes to /en.
// The root and /layaway are untouched; a missing slug keeps its 404.
const BARE = ["/jewelry-guide", "/shopping-guide", "/faq", "/about", "/legal/tokusho", "/loyalty", "/sale", product, collection, category].filter(Boolean);
for (const path of BARE) {
  const r = await get(path);
  ok(path, "2E-1: 307 to its /ja page (no signal)", r.status === 307 && (r.location ?? "").replace(BASE, "") === `/ja${path}`, `got ${r.status} ${r.location ?? ""}`);
  ok(path, "2E-1: the redirect is not cacheable for others (private, no-store)", r.status !== 307 || /private/.test(r.cache ?? "") && /no-store/.test(r.cache ?? ""), `cache-control=${r.cache}`);
}
{
  const r = await get("/faq?lang=en&utm_source=check");
  ok("/faq?lang=en&utm_source=check", "2E-1: 307 to /en/faq, lang dropped, other parameters kept", r.status === 307 && (r.location ?? "").replace(BASE, "") === "/en/faq?utm_source=check", `got ${r.status} ${r.location ?? ""}`);
}
for (const [path, want] of [["/layaway", 404], ["/layaway?lang=en", 200], ["/products/nonexistent-seo-check-xyz", 404]]) {
  const r = await get(path);
  ok(path, `2E-1: untouched (${want})`, r.status === want, `got ${r.status} ${r.location ?? ""}`);
}

// ---------------------------------------------------------------- layaway (Phase 3)
// /en/layaway is the one English-only indexable page: 200, self canonical,
// hreflang `en` + x-default (English) and NO `ja` alternate; FAQPage JSON-LD
// for its visible FAQ. /ja/layaway does not exist and says nothing.
{
  const r = await get("/en/layaway");
  ok("/en/layaway", "200", r.status === 200, `got ${r.status} ${r.location ?? ""}`);
  if (r.status === 200) {
    ok("/en/layaway", "no noindex", !/noindex/i.test(robotsMeta(r.body) ?? "") && !/noindex/i.test(r.xrobots ?? ""), `robots=${robotsMeta(r.body)}`);
    const c = canonicals(r.body);
    ok("/en/layaway", "one self canonical", c.length === 1 && c[0] === `${BASE}/en/layaway`, `canonical=${c.join("|") || "none"}`);
    const alts = alternates(r.body);
    ok("/en/layaway", "hreflang en + x-default only (no ja: there is no Japanese layaway page)", alts.some((a) => a.lang === "en") && alts.some((a) => a.lang === "x-default") && !alts.some((a) => a.lang === "ja"), JSON.stringify(alts));
    ok("/en/layaway", "x-default is the English page", alts.find((a) => a.lang === "x-default")?.href === `${BASE}/en/layaway`, JSON.stringify(alts));
    ok("/en/layaway", "one H1", (r.body.match(/<h1[\s>]/g) ?? []).length === 1, `${(r.body.match(/<h1[\s>]/g) ?? []).length} h1`);
    ok("/en/layaway", "JSON-LD: FAQPage", jsonLd(r.body).some((d) => d["@type"] === "FAQPage"), jsonLd(r.body).map((d) => d["@type"]).join(","));
    ok("/en/layaway", "links to the FAQ, the Shopping Guide and the Jewelry Guide", ["/en/faq", "/en/shopping-guide", "/en/jewelry-guide"].every((p) => r.body.includes(`href="${p}`)), "");
  }
  const ja = await get("/ja/layaway");
  ok("/ja/layaway", "404 (no Japanese layaway, ever)", ja.status === 404, `got ${ja.status}`);
  ok("/ja/layaway", "no canonical or hreflang element", canonicals(ja.body).length + alternates(ja.body).length === 0, `canonical=${canonicals(ja.body).length}, alt=${alternates(ja.body).length}`);
}

// ---------------------------------------------------------------- indexable pages
// The root stays bare (OD-3); every other indexable page is checked at its
// locale URLs, where its canonical and hreflang now live.
const LOCALIZED = [product, collection, category, post, "/jewelry-guide", "/shopping-guide", "/faq", "/about", "/legal/tokusho", "/loyalty", "/sale"].filter(Boolean);
const PUBLIC = ["/", ...LOCALIZED.flatMap((p) => [`/ja${p}`, `/en${p}`])];
for (const path of PUBLIC) {
  // An English-only post has no /ja page: that is the sitemap's rule too.
  if (path === `/ja${post}` && !paths.includes(path)) continue;
  const r = await get(path);
  ok(path, "200", r.status === 200, `got ${r.status}`);
  if (r.status !== 200) continue;
  ok(path, "no noindex", !/noindex/i.test(robotsMeta(r.body) ?? "") && !/noindex/i.test(r.xrobots ?? ""), `robots=${robotsMeta(r.body)}`);
  const c = canonicals(r.body);
  const self = `${BASE}${path === "/" ? "/" : path}`;
  ok(path, "one self canonical", c.length === 1 && c[0].replace(/\/$/, "") === self.replace(/\/$/, ""), `canonical=${c.join("|") || "none"}`);
  // A single-language post names only the language it exists in (plus x-default).
  const single = bareOf(path) === post && !(paths.includes(`/ja${post}`) && paths.includes(`/en${post}`));
  const want = single ? [path.slice(1, 3), "x-default"] : ["ja", "en", "x-default"];
  ok(path, `hreflang ${want.join(" / ")} present`, want.every((l) => alternates(r.body).some((a) => a.lang === l)), JSON.stringify(alternates(r.body)));
  const ld = jsonLd(r.body);
  const types = ld.map((d) => d["@type"]);
  if (path === "/") ok(path, "JSON-LD: JewelryStore", types.includes("JewelryStore"), types.join(","));
  if (bareOf(path) === product) {
    const p = ld.find((d) => d["@type"] === "Product");
    ok(path, "JSON-LD: Product with name, sku, offer", !!p && !!p.name && !!p.sku && !!p.offers?.priceCurrency && p.offers.price != null, JSON.stringify(p ?? null).slice(0, 120));
    ok(path, "JSON-LD: availability is InStock or SoldOut", ["https://schema.org/InStock", "https://schema.org/SoldOut"].includes(p?.offers?.availability), p?.offers?.availability);
    ok(path, "JSON-LD: no countryOfOrigin invented", !JSON.stringify(ld).includes("countryOfOrigin"));
  }
  if (bareOf(path) === post) ok(path, "JSON-LD: BlogPosting", types.includes("BlogPosting"), types.join(","));
  if (bareOf(path) === "/faq") ok(path, "JSON-LD: FAQPage", types.includes("FAQPage"), types.join(","));
}

// ---------------------------------------------------------------- noindex pages (200)
const NOINDEX_PAGES = ["/search", "/search?q=kihei", "/cart", "/login", "/login?next=%2Faccount", "/auth/confirm?token_hash=x&type=email", "/already-registered", "/review/abc", "/receipts/verify", "/newsletter/unsubscribe", "/cart-reminders/unsubscribe"];
for (const path of NOINDEX_PAGES) {
  const r = await get(path);
  ok(path, "answers 200 (crawlable, so its noindex can be read)", r.status === 200, `got ${r.status}`);
  if (r.status !== 200) continue;
  ok(path, "robots meta says noindex", /noindex/i.test(robotsMeta(r.body) ?? ""), `robots=${robotsMeta(r.body)}`);
  ok(path, "no canonical", canonicals(r.body).length === 0, canonicals(r.body).join("|"));
  ok(path, "no hreflang alternates", alternates(r.body).length === 0, JSON.stringify(alternates(r.body)));
}

// ---------------------------------------------------------------- gated routes
for (const path of ["/account", "/account/orders", "/checkout", "/checkout/complete", "/loyalty/join", "/cart/restore", "/auth/callback"]) {
  const r = await get(path);
  ok(path, "redirects an anonymous visitor to /login (never 200)", r.status >= 300 && r.status < 400 && /\/login/.test(r.location ?? ""), `got ${r.status} ${r.location ?? ""}`);
}

// ---------------------------------------------------------------- 404
const nf = await get("/nonexistent-seo-check-xyz");
ok("/nonexistent-seo-check-xyz", "404", nf.status === 404, `got ${nf.status}`);
ok("/nonexistent-seo-check-xyz", "noindex", /noindex/i.test(robotsMeta(nf.body) ?? ""), `robots=${robotsMeta(nf.body)}`);
const nfSignals = canonicals(nf.body).length + alternates(nf.body).length;
if (nfSignals === 0) record("PASS", "/nonexistent-seo-check-xyz", "no canonical or hreflang on a 404");
else record("DEFERRED", "/nonexistent-seo-check-xyz", "no canonical or hreflang on a 404", `${nfSignals} tag(s) emitted. Next gives the layout no way to see a not-found render; the fix is the Phase 2 rewrite of <SeoLinks />.`);
for (const path of ["/products/nonexistent-seo-check-xyz", "/collections/nonexistent-seo-check-xyz"]) {
  const r = await get(path);
  ok(path, "404 with noindex, and no canonical or hreflang element", r.status === 404 && /noindex/i.test(robotsMeta(r.body) ?? "") && canonicals(r.body).length + alternates(r.body).length === 0, `status ${r.status}, robots=${robotsMeta(r.body)}, canonical=${canonicals(r.body).length}, alt=${alternates(r.body).length}`);
}

// ---------------------------------------------------------------- report
const w = Math.max(...results.map((r) => r.route.length));
for (const r of results) console.log(`${r.status.padEnd(8)} ${r.route.padEnd(w)}  ${r.what}${r.detail ? `  [${r.detail}]` : ""}`);
const n = (s) => results.filter((r) => r.status === s).length;
console.log(`\n${BASE}: ${n("PASS")} pass, ${n("FAIL")} fail, ${n("DEFERRED")} deferred`);
process.exit(n("FAIL") ? 1 : 0);
