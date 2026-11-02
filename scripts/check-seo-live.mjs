#!/usr/bin/env node
// Read-only SEO route check. Usage: node scripts/check-seo-live.mjs [baseUrl]
// (default https://www.chajewelsjp.com). Not part of CI: it needs a running
// site. Sends plain GET requests with no cookie and no Accept-Language, which
// is how most crawlers arrive (the site then answers in Japanese).
//
// It states the INTENDED policy for each kind of route (lib/seo-policy.ts, the
// Phase 1 route matrix in docs/seo/SEO-BASELINE.md) and reports PASS / FAIL.
// DEFERRED marks a known gap that belongs to a later phase; it does not fail
// the run. Exit code 1 only when a FAIL is reported. Set VERCEL_AUTOMATION_BYPASS_SECRET to run
// against a preview behind Vercel SSO (see the "develop-preview acceptance gate" in docs/seo/SEO-QA-REPORT.md §15).
//
// Only real <link>/<meta> elements are counted. Next also repeats the metadata
// inside its RSC payload as escaped JSON, which is not what a crawler reads.

import { existsSync, readFileSync } from "node:fs";
import { resolveOrigins, authorizeCredentials, makeGet, redactConsole, Coverage, validateSitemap, llmsTxtProblems, llmsTxtLinks, llmsLinkProblems, FOUNDATION_MATRIX as M } from "./lib/seo-check-core.mjs";

// BASE is where requests GO. PUBLIC_ORIGIN is what the pages DECLARE (canonical, hreflang, og:url, sitemap):
// the same for production and a local build, different for a preview, which is requested on its own
// host but declares the production origin (set SEO_CHECK_PUBLIC_ORIGIN). Expected canonical values are
// compared with PUBLIC_ORIGIN; only fetching and redirect Locations use BASE.
const BASE = (process.argv[2] ?? "https://www.chajewelsjp.com").replace(/\/$/, "");
let ORIGINS, AUTH;
try {
  ORIGINS = resolveOrigins(BASE);
  // OPTIONAL preview-bypass secret (VERCEL_AUTOMATION_BYPASS_SECRET). It is used ONLY for the exact origin
  // named in SEO_CHECK_BYPASS_ORIGIN, which must equal BASE; redirects are never followed; it is never
  // printed. Any other combination refuses to run. See scripts/lib/seo-check-core.mjs.
  AUTH = authorizeCredentials(ORIGINS.requestOrigin);
} catch (e) { console.error(`check-seo-live: ${e.message}`); process.exit(2); }
redactConsole(AUTH);                       // nothing printed, thrown or rejected can carry a credential
const PUBLIC_ORIGIN = ORIGINS.publicOrigin;
const get = makeGet(ORIGINS.requestOrigin, AUTH);   // bounded timeout; a network failure is { status: 0, error } (redacted), never a throw
const stripOrigins = (u) => String(u ?? "").replace(BASE, "").replace(PUBLIC_ORIGIN, "");
const results = [];
const record = (status, route, what, detail = "") => results.push({ status, route, what, detail });
const ok = (route, what, cond, detail = "") => record(cond ? "PASS" : "FAIL", route, what, cond ? "" : detail);
const cov = new Coverage();
// /llms.txt is DEFERRED to the Phase 6 batch under the owner's approved requirements of 2026-10-31 ("static file",
// "after the Phase 6 URLs and titles are final"; record docs/seo/phase-6/LLMS-TXT-DECISION-2026-11-01.md). No decision is
// pending: the route returns with the Phase 6 batch. While the route file is absent, a 404 is the expected state and the
// two llms rows are optional (skipped with that reason); the moment the route exists they are required.
const MERCHANT_ROUTE_PRESENT = existsSync(new URL("../app/api/merchant-feed/route.ts", import.meta.url));
// DP-08: the 200/XML success path is REQUIRED once the owner has confirmed identifiers (non-empty registry); until then a truthful 503 is reported as SKIPPED — UNVERIFIED SUCCESS COVERAGE, never as a feed pass.
const MERCHANT_EXPECT_ITEMS = MERCHANT_ROUTE_PRESENT && !/CONFIRMED_IDENTIFIERS[^=]*=\s*\{\s*\}\s*;/.test(readFileSync(new URL("../lib/merchant-confirmed-identifiers.ts", import.meta.url), "utf8"));
const LLMS_ROUTE_PRESENT = existsSync(new URL("../app/llms.txt/route.ts", import.meta.url));

const robotsMeta = (html) => (html.match(/<meta name="robots" content="([^"]*)"/) ?? [])[1] ?? null;
const canonicals = (html) => [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
const alternates = (html) => [...html.matchAll(/<link rel="alternate" hrefLang="([^"]*)" href="([^"]*)"/g)].map((m) => ({ lang: m[1], href: m[2] }));
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
// The visible breadcrumb <nav> (components/site/breadcrumbs.tsx), by its
// accessible name in either language (lib/i18n.ts pdp.breadcrumb); its inner
// HTML, or null when the page draws none.
const crumbNav = (html) => html.match(/<nav aria-label="(?:Breadcrumb|パンくずリスト)"[^>]*>(.*?)<\/nav>/s)?.[1] ?? null;
const unescapeHtml = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;/g, "'").replace(/&#39;/g, "'");

// ---------------------------------------------------------------- sitemap
const sm = await get("/sitemap.xml");
const smv = validateSitemap(sm, { publicOrigin: PUBLIC_ORIGIN });
ok("/sitemap.xml", "valid: status 200, XML, a urlset, enough URLs, none duplicated, every URL on the public origin", smv.problems.length === 0, smv.problems.join("; "));
const locs = smv.locs;
const paths = smv.paths;
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
// (every URL on the public origin is part of the validation above)
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
for (const p of ["/search", "/cart", "/login", "/already-registered"]) ok("/robots.txt", `does not block ${p} (its noindex must be readable)`, !new RegExp(`^Disallow: ${p}\\b`, "m").test(rb.body));

// ---------------------------------------------------------------- legacy redirects (Phase 2E-stage-1)
// A no-signal request (this script's) to a bare public URL answers a TEMPORARY
// 307 to its /ja page, never cached for someone else; ?lang=en goes to /en.
// The root and /layaway are untouched; a missing slug keeps its 404.
const BARE = ["/jewelry-guide", "/shopping-guide", "/faq", "/about", "/legal/tokusho", "/loyalty", "/sale", product, collection, category].filter(Boolean);
for (const path of BARE) {
  const r = await get(path);
  ok(path, "2E-1: 307 to its /ja page (no signal)", r.status === 307 && stripOrigins(r.location) === `/ja${path}`, `got ${r.status} ${r.location ?? ""}`);
  ok(path, "2E-1: the redirect is not cacheable for others (private, no-store)", r.status !== 307 || /private/.test(r.cache ?? "") && /no-store/.test(r.cache ?? ""), `cache-control=${r.cache}`);
}
{
  const r = await get("/faq?lang=en&utm_source=check");
  ok("/faq?lang=en&utm_source=check", "2E-1: 307 to /en/faq, lang dropped, other parameters kept", r.status === 307 && stripOrigins(r.location) === "/en/faq?utm_source=check", `got ${r.status} ${r.location ?? ""}`);
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
    ok("/en/layaway", "one self canonical", c.length === 1 && c[0] === `${PUBLIC_ORIGIN}/en/layaway`, `canonical=${c.join("|") || "none"}`);
    const alts = alternates(r.body);
    ok("/en/layaway", "hreflang en + x-default only (no ja: there is no Japanese layaway page)", alts.some((a) => a.lang === "en") && alts.some((a) => a.lang === "x-default") && !alts.some((a) => a.lang === "ja"), JSON.stringify(alts));
    ok("/en/layaway", "x-default is the English page", alts.find((a) => a.lang === "x-default")?.href === `${PUBLIC_ORIGIN}/en/layaway`, JSON.stringify(alts));
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
  const self = `${PUBLIC_ORIGIN}${path === "/" ? "/" : path}`;
  ok(path, "one self canonical", c.length === 1 && c[0].replace(/\/$/, "") === self.replace(/\/$/, ""), `canonical=${c.join("|") || "none"}`);
  // A single-language post names only the language it exists in (plus x-default).
  const single = bareOf(path) === post && !(paths.includes(`/ja${post}`) && paths.includes(`/en${post}`));
  const want = single ? [path.slice(1, 3), "x-default"] : ["ja", "en", "x-default"];
  ok(path, `hreflang ${want.join(" / ")} present`, want.every((l) => alternates(r.body).some((a) => a.lang === l)), JSON.stringify(alternates(r.body)));
  const ld = jsonLd(r.body);
  const types = ld.map((d) => d["@type"]);
  if (path === "/") {
    const s = ld.find((d) => d["@type"] === "OnlineStore");
    ok(path, "JSON-LD: OnlineStore", !!s, types.join(","));
    // Phase 4 §16: the entity facts, and the address with its street and postcode.
    ok(path, "JSON-LD: P4 store has logo, telephone, streetAddress, postalCode", !!s?.logo && !!s?.telephone && !!s?.address?.streetAddress && !!s?.address?.postalCode, JSON.stringify(s?.address ?? null));
    ok(path, "JSON-LD: P4 store declares no openingHours (customer-service hours are not shop hours)", !("openingHours" in (s ?? {})));
  }
  if (bareOf(path) === product) {
    const p = ld.find((d) => d["@type"] === "Product");
    ok(path, "JSON-LD: Product with name, sku, offer", !!p && !!p.name && !!p.sku && !!p.offers?.priceCurrency && p.offers.price != null, JSON.stringify(p ?? null).slice(0, 120));
    ok(path, "JSON-LD: availability is InStock or SoldOut", ["https://schema.org/InStock", "https://schema.org/SoldOut"].includes(p?.offers?.availability), p?.offers?.availability);
    ok(path, "JSON-LD: no countryOfOrigin invented", !JSON.stringify(ld).includes("countryOfOrigin"));
    // Phase 4 §6/§7: nothing invented — identifiers never; a rating only with reviews behind it.
    ok(path, "JSON-LD: P4 no gtin / mpn invented", !/"(gtin|mpn)/.test(JSON.stringify(ld)));
    ok(path, "JSON-LD: P4 aggregateRating, if present, has a count > 0 and matches the review count shown", !p?.aggregateRating || (p.aggregateRating.reviewCount > 0 && (!p.review || p.review.length <= p.aggregateRating.reviewCount)), JSON.stringify(p?.aggregateRating ?? null));
    // Owner decision 2026-10-29 (final QA): no return policy and no shipping
    // rate are emitted — the published rules are cart-based / defect-aware and
    // the offer-level fields misrepresented them. Pinned until a faithful
    // encoding is approved (R-1 / S-1 in docs/seo/SEO-QA-REPORT.md).
    ok(path, "JSON-LD: no offer-level return policy or shipping rate (R-1 / S-1 pending)", !p?.offers?.hasMerchantReturnPolicy && !p?.offers?.shippingDetails, JSON.stringify({ r: p?.offers?.hasMerchantReturnPolicy ?? null, s: p?.offers?.shippingDetails ?? null }));
  }
  // Phase 4 §8: a BreadcrumbList on every product, collection, category, post
  // and guide page, every item an absolute URL on this origin, the trail's last
  // item being the page itself — and a VISIBLE crumb (<nav aria-label=
  // "Breadcrumb" / 「パンくずリスト」) whose links are the same URLs in the same
  // order, its current item the same name: structured data must reflect real
  // visible content (components/site/breadcrumbs.tsx draws both from one array).
  if ([product, collection, category, post, "/jewelry-guide", "/shopping-guide"].includes(bareOf(path))) {
    const bc = ld.find((d) => d["@type"] === "BreadcrumbList");
    ok(path, "JSON-LD: P4 BreadcrumbList", !!bc, types.join(","));
    const items = bc?.itemListElement ?? [];
    ok(path, "JSON-LD: P4 breadcrumb items are absolute URLs on this origin", items.length >= 2 && items.every((i) => typeof i.item === "string" && i.item.startsWith(PUBLIC_ORIGIN)), items.map((i) => i.item).join(" | "));
    ok(path, "JSON-LD: P4 breadcrumb ends at this page", (items.at(-1)?.item ?? "").replace(/\/$/, "") === `${PUBLIC_ORIGIN}${path}`.replace(/\/$/, ""), items.at(-1)?.item);
    const nav = crumbNav(r.body);
    ok(path, "P4 visible breadcrumb nav (aria-label Breadcrumb / パンくずリスト) with a list", !!nav && /<ol\b/.test(nav), nav ? "no <ol>" : "no <nav aria-label=\"Breadcrumb\">");
    const hrefs = nav ? [...nav.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => new URL(unescapeHtml(m[1]), PUBLIC_ORIGIN).href.replace(/\/$/, "")) : [];
    const current = nav ? unescapeHtml((nav.match(/<li aria-current="page"[^>]*>(.*?)<\/li>/s)?.[1] ?? "").replace(/<[^>]+>/g, "")) : "";
    const ldUrls = items.map((i) => String(i.item).replace(/\/$/, ""));
    ok(path, "P4 visible crumb links = BreadcrumbList items (same order, same count; the last item is the page, not a link)", hrefs.length === items.length - 1 && hrefs.every((h, i) => h === ldUrls[i]), `links ${hrefs.join(" | ")} vs items ${ldUrls.join(" | ")}`);
    ok(path, "P4 visible current crumb = BreadcrumbList last name", current !== "" && current === String(items.at(-1)?.name ?? ""), `"${current}" vs "${items.at(-1)?.name}"`);
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

// ---------------------------------------------------------------- Step 2: collection / category listings
// SEO Step 2 (Master Plan §33.3). Reads the RENDERED HTML of listing pages, the
// way a crawler or a link-preview scraper does: the OpenGraph / Twitter block
// must still follow the page's own title and description (a page-level
// `openGraph` replaces the root's block, and an explicit `openGraph: undefined`
// erases it), the image is the owner's hero or the brand image and nothing
// else, and the ItemList equals the grid the server rendered.
{
  const listingPaths = ["ja", "en"].flatMap((l) => [
    ...paths.filter((p) => p.startsWith(`/${l}/collections/`)).slice(0, 3),
    ...paths.filter((p) => p.startsWith(`/${l}/categories/`)).slice(0, 2),
  ]);
  const metaContent = (html, attr, name) => { const m = html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`)); return m ? unescapeHtml(m[1]) : null; };
  for (const path of listingPaths) {
    const r = await get(path);
    if (r.status !== 200) { ok(path, "Step 2: listing answers 200", false, `got ${r.status}`); continue; }
    const h = r.body, lang = path.slice(1, 3);
    const title = unescapeHtml((h.match(/<title>(.*?)<\/title>/s) ?? [])[1] ?? ""), desc = metaContent(h, "name", "description");
    ok(path, "Step 2: og:title and twitter:title follow the <title>", title !== "" && metaContent(h, "property", "og:title") === title && metaContent(h, "name", "twitter:title") === title, `title=${title} og=${metaContent(h, "property", "og:title")}`);
    ok(path, "Step 2: og:description and twitter:description follow the description", metaContent(h, "property", "og:description") === desc && metaContent(h, "name", "twitter:description") === desc, `desc=${desc} og=${metaContent(h, "property", "og:description")}`);
    ok(path, "Step 2: og:site_name, og:type and the locale pair are the root's", metaContent(h, "property", "og:site_name") === "Cha Jewels" && metaContent(h, "property", "og:type") === "website" && metaContent(h, "property", "og:locale") === (lang === "ja" ? "ja_JP" : "en_US") && metaContent(h, "property", "og:locale:alternate") === (lang === "ja" ? "en_US" : "ja_JP"), `site=${metaContent(h, "property", "og:site_name")} type=${metaContent(h, "property", "og:type")} locale=${metaContent(h, "property", "og:locale")}`);
    const og = metaContent(h, "property", "og:image"), tw = metaContent(h, "name", "twitter:image");
    const brand = og?.startsWith(`${PUBLIC_ORIGIN}/opengraph-image`);
    ok(path, "Step 2: og:image is the brand image or an absolute https hero, and twitter:image is the same", !!og && (brand || /^https:\/\/\S+$/.test(og)) && tw === og, `og=${og} twitter=${tw}`);
    ok(path, "Step 2: a hero image carries the page's name as its alt; the brand image keeps its own", brand ? metaContent(h, "property", "og:image:alt") === "Cha Jewels" : !!metaContent(h, "property", "og:image:alt"), `alt=${metaContent(h, "property", "og:image:alt")}`);
    ok(path, "Step 2: exactly one canonical, self-referencing, and the ja/en/x-default alternates are still present", canonicals(h).length === 1 && canonicals(h)[0] === `${PUBLIC_ORIGIN}${path}` && alternates(h).length === 3, `canonical=${canonicals(h).join("|")} alternates=${alternates(h).length}`);
    // The grid the server rendered: product links in <main>, outside the hidden crawl lists,
    // in last-occurrence order (a category's stage repeats a piece above the grid).
    const main = (h.replace(/<ul hidden[^>]*>.*?<\/ul>/gs, "").match(/<main\b.*?<\/main>/s) ?? [h])[0];
    const links = [...main.matchAll(new RegExp(`href="(/${lang}/products/[^"#?]+)"`, "g"))].map((m) => `${PUBLIC_ORIGIN}${m[1]}`);
    const grid = []; for (const l of [...links].reverse()) if (!grid.includes(l)) grid.push(l); grid.reverse();
    const lists = jsonLd(h).filter((x) => x["@type"] === "ItemList");
    if (grid.length < 2) { ok(path, `Step 2: ${grid.length}-piece listing emits no ItemList`, lists.length === 0, `${lists.length} ItemList(s)`); continue; }
    ok(path, "Step 2: exactly one ItemList", lists.length === 1, `${lists.length}`);
    const il = lists[0]; if (!il) continue;
    const items = il.itemListElement ?? [], urls = items.map((i) => i.url);
    ok(path, `Step 2: ItemList equals the rendered grid (${grid.length} pieces, same order, no duplicates, positions 1..n)`, urls.length === grid.length && urls.every((u, i) => u === grid[i]) && new Set(urls).size === urls.length && items.every((it, i) => it.position === i + 1) && il.numberOfItems === items.length, `items ${urls.length} vs grid ${grid.length}`);
    ok(path, "Step 2: ItemList entries are locale product URLs with only @type, position and url (no price, availability or rating)", items.every((it) => Object.keys(it).join() === "@type,position,url" && it.url.startsWith(`${PUBLIC_ORIGIN}/${lang}/products/`)) && !/offers|price|availability|rating|review/i.test(JSON.stringify(il)), JSON.stringify(items[0]));
    ok(path, "Step 2: BreadcrumbList is still emitted", jsonLd(h).some((x) => x["@type"] === "BreadcrumbList"));
  }
}

// ---------------------------------------------------------------- OG-PRODUCT: product pages
// docs/seo/OUTSTANDING-ISSUES-REGISTER.md §5. Reads the RENDERED HTML of product
// pages in both languages, the way a link-preview scraper does. A page-level
// `openGraph` replaces the root's block, so the product block restates the site
// fields (lib/product-seo.ts); og:url must equal the canonical, a photo is the
// product's own and nothing else, a product with no photo shows the brand image,
// and the Product / BreadcrumbList JSON-LD is untouched. A sample of the
// sitemap's product URLs (up to 3 per language), NOT a crawl of all of them.
{
  const sample = (lang) => { const all = paths.filter((p) => p.startsWith(`/${lang}/products/`)); return all.filter((_, i) => i % Math.max(1, Math.floor(all.length / 3)) === 0).slice(0, 3); };
  const productPaths = [...sample("ja"), ...sample("en")];
  ok("/sitemap.xml", "OG-PRODUCT: the sitemap lists product URLs to sample", productPaths.length > 0, "none");
  const metaContent = (html, attr, name) => { const m = html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`)); return m ? unescapeHtml(m[1]) : null; };
  for (const path of productPaths) {
    const r = await get(path);
    if (r.status !== 200) { ok(path, "OG-PRODUCT: product answers 200", false, `got ${r.status}`); continue; }
    const h = r.body, lang = path.slice(1, 3);
    const title = unescapeHtml((h.match(/<title>(.*?)<\/title>/s) ?? [])[1] ?? ""), desc = metaContent(h, "name", "description");
    ok(path, "OG-PRODUCT: og:title and twitter:title follow the <title>", title !== "" && metaContent(h, "property", "og:title") === title && metaContent(h, "name", "twitter:title") === title, `title=${title} og=${metaContent(h, "property", "og:title")}`);
    ok(path, "OG-PRODUCT: og:description and twitter:description follow the description", !!desc && metaContent(h, "property", "og:description") === desc && metaContent(h, "name", "twitter:description") === desc, `desc=${desc} og=${metaContent(h, "property", "og:description")}`);
    ok(path, "OG-PRODUCT: og:site_name, og:type and the locale pair are present", metaContent(h, "property", "og:site_name") === "Cha Jewels" && metaContent(h, "property", "og:type") === "website" && metaContent(h, "property", "og:locale") === (lang === "ja" ? "ja_JP" : "en_US") && metaContent(h, "property", "og:locale:alternate") === (lang === "ja" ? "en_US" : "ja_JP"), `site=${metaContent(h, "property", "og:site_name")} type=${metaContent(h, "property", "og:type")} locale=${metaContent(h, "property", "og:locale")} alt=${metaContent(h, "property", "og:locale:alternate")}`);
    ok(path, "OG-PRODUCT: og:url is the page's own absolute locale URL and equals the canonical", metaContent(h, "property", "og:url") === `${PUBLIC_ORIGIN}${path}` && canonicals(h)[0] === metaContent(h, "property", "og:url"), `og:url=${metaContent(h, "property", "og:url")} canonical=${canonicals(h)[0]}`);
    const og = metaContent(h, "property", "og:image"), tw = metaContent(h, "name", "twitter:image");
    const brand = !!og?.startsWith(`${PUBLIC_ORIGIN}/opengraph-image`);
    ok(path, "OG-PRODUCT: og:image is the product's photo or the brand image, absolute, and twitter:image and the large card follow", !!og && /^https?:\/\/\S+$/.test(og) && tw === og && metaContent(h, "name", "twitter:card") === "summary_large_image", `og=${og} twitter=${tw} card=${metaContent(h, "name", "twitter:card")}`);
    ok(path, "OG-PRODUCT: the image has an alt (the product's name, or the brand's own)", brand ? metaContent(h, "property", "og:image:alt") === "Cha Jewels" : metaContent(h, "property", "og:image:alt") === metaContent(h, "property", "og:title") || !!metaContent(h, "property", "og:image:alt"), `alt=${metaContent(h, "property", "og:image:alt")}`);
    ok(path, "OG-PRODUCT: exactly one self canonical and the three alternates are unchanged", canonicals(h).length === 1 && canonicals(h)[0] === `${PUBLIC_ORIGIN}${path}` && alternates(h).length === 3, `canonical=${canonicals(h).join("|")} alternates=${alternates(h).length}`);
    const types = jsonLd(h).map((x) => x["@type"]);
    ok(path, "OG-PRODUCT: exactly one Product and one BreadcrumbList JSON-LD", types.filter((t) => t === "Product").length === 1 && types.filter((t) => t === "BreadcrumbList").length === 1, types.join(","));
  }
}

// ---------------------------------------------------------------- FOUNDATION: og:url, 404 hygiene, fb:app_id
// SEO foundation batch. Reads the RENDERED HTML the way a link scraper and a crawler do. FAILS CLOSED:
// every requirement below is registered with how many checks it needs; anything not actually checked is
// reported as MISSING coverage and fails the run (see the inventory printed at the end).
//  1. Every known public locale template: HTTP 200 (always required), exactly one og:url equal to the
//     canonical (public origin), no query or fragment, exactly one fb:app_id, the primary AND the
//     alternate og:locale, and an og:image. The dynamic families (product, collection, category) must
//     exist in BOTH languages; a blog post in at least one.
//  2. Unavailable siblings, tested explicitly: a language the sitemap does not list is a clean 404 AND the
//     language that exists names no hreflang for it; /ja/layaway never exists and /en/layaway names no
//     `ja` alternate. Single-language posts are tested wherever the deployment has them.
//  3. Every 404 shape: real 404, noindex, NO canonical, hreflang or og:url, at most one fb:app_id.
//  4. Private/utility pages: og:url only (no canonical, no alternates), one fb:app_id; gated descendants
//     redirect to /login and render nothing.
//  5. Query handling.
// A sample of templates and of 404 shapes, NOT a crawl of every URL. (That the 404 page is still the
// useful one, and everything the DOM shows, is checked by scripts/check-seo-dom.mjs.)
{
  const FB_ID = M.FB_ID;
  const ogUrls = (html) => [...html.matchAll(/<meta property="og:url" content="([^"]*)"/g)].map((m) => unescapeHtml(m[1]));
  const fbIds = (html) => [...html.matchAll(/<meta property="fb:app_id" content="([^"]*)"/g)].map((m) => m[1]);
  const propAll = (html, name) => [...html.matchAll(new RegExp(`<meta property="${name}" content="([^"]*)"`, "g"))].map((m) => unescapeHtml(m[1]));
  const prop = (html, name) => propAll(html, name)[0] ?? null;
  const inSitemap = (p) => paths.includes(p);
  const clean404 = (r) => r.status === 404 && /noindex/i.test(robotsMeta(r.body) ?? "") && canonicals(r.body).length === 0 && alternates(r.body).length === 0 && ogUrls(r.body).length === 0 && fbIds(r.body).length <= 1;
  const why404 = (r) => `status ${r.status}, robots=${robotsMeta(r.body)}, canonical=${canonicals(r.body).length}, hreflang=${alternates(r.body).length}, og:url=${ogUrls(r.body).length}, fb:app_id=${fbIds(r.body).length}`;

  const staticTemplates = M.staticTemplates;
  const unlistedByPolicy = new Set(M.unlistedByPolicy);   // a real page the sitemap deliberately never lists
  const families = { product, collection, category, post };

  cov.expect("sitemap", "a valid sitemap was read", 1);
  cov.expect("locale-homes", "/ja and /en answer 200 with the tags", 2);
  cov.expect("static-templates", "every known static template, both languages, answers 200 with the tags", staticTemplates.length * 2);
  cov.expect("dynamic-both-languages", "product, collection and category each checked in BOTH languages", 6);
  cov.expect("blog-post", "a blog post checked in every language the sitemap lists (at least one)", 1);
  cov.expect("layaway", "/en/layaway answers 200 with the tags", 1);
  cov.expect("unavailable-sibling", "an unavailable sibling is a clean 404 and the existing language names no hreflang for it (at least one instance)", 1);
  cov.expect("single-language-posts", "every single-language post in the sitemap has its missing sibling tested", 1, { optional: true });
  const shapes = M.notFoundShapes, gatedMalformed = M.gatedDescendants;
  cov.expect("404-shapes", "every 404 shape is a real 404 with no canonical, hreflang or og:url", shapes.length);
  cov.expect("gated-descendants", "malformed descendants of gated private routes redirect to /login", gatedMalformed.length);
  cov.expect("private-pages", "real private pages keep og:url only", 3);
  cov.expect("query-handling", "og:url and the canonical ignore the request query", 2);
  cov.expect("merchant-feed", "/api/merchant-feed?lang=ja is 200 application/xml (RSS with the g: namespace), noindex, with x-feed-items > 0 and the English feed refused (404)", 1, { optional: !MERCHANT_EXPECT_ITEMS });
  cov.expect("llms-txt", "/llms.txt is 200 text/plain and every link is a public sitemap page (no product, private, Japanese-layaway or figure)", 1, { optional: !LLMS_ROUTE_PRESENT });
  cov.expect("llms-links", "every link /llms.txt advertises is FETCHED and answers 200 text/html, no noindex (header or meta) and one self canonical — the recorded contract, not sitemap membership (one row per link)", 30, { optional: !LLMS_ROUTE_PRESENT });
  if (smv.problems.length === 0) cov.hit("sitemap");

  // 1. known templates. A template that is not 200 is a FAIL; a known static template missing from the sitemap is a FAIL.
  const checkTemplate = async (path, key) => {
    const r = await get(path);
    cov.hit(key);
    if (r.status !== 200) { ok(path, "FOUNDATION: a known template answers HTTP 200", false, r.error ? `request failed: ${r.error}` : `got ${r.status}`); return null; }
    const h = r.body, self = `${PUBLIC_ORIGIN}${path}`, lang = path.slice(1, 3);
    ok(path, "FOUNDATION: exactly one og:url, equal to the canonical and to the page's own absolute locale URL (no query, no fragment)", ogUrls(h).length === 1 && ogUrls(h)[0] === self && canonicals(h).length === 1 && canonicals(h)[0] === self, `og:url=${ogUrls(h).join("|")} canonical=${canonicals(h).join("|")}`);
    ok(path, "FOUNDATION: exactly one fb:app_id, the approved id", fbIds(h).length === 1 && fbIds(h)[0] === FB_ID, `fb:app_id=${fbIds(h).join("|")}`);
    const primary = lang === "ja" ? "ja_JP" : "en_US", alt = lang === "ja" ? "en_US" : "ja_JP";
    ok(path, "FOUNDATION: og:site_name, og:type, the primary og:locale AND the alternate og:locale are present, and an og:image", prop(h, "og:site_name") === "Cha Jewels" && !!prop(h, "og:type") && propAll(h, "og:locale").length === 1 && prop(h, "og:locale") === primary && propAll(h, "og:locale:alternate").length === 1 && prop(h, "og:locale:alternate") === alt && !!prop(h, "og:image"), `site=${prop(h, "og:site_name")} type=${prop(h, "og:type")} locale=${propAll(h, "og:locale")} alternate=${propAll(h, "og:locale:alternate")} image=${prop(h, "og:image")}`);
    return r;
  };
  for (const root of ["/ja", "/en"]) await checkTemplate(root, "locale-homes");
  for (const t of staticTemplates) {
    for (const l of ["ja", "en"]) {
      if (!unlistedByPolicy.has(t)) ok(`/${l}${t}`, "FOUNDATION: a known static template is listed in the sitemap in this language", inSitemap(`/${l}${t}`), "not in the sitemap");
      await checkTemplate(`/${l}${t}`, "static-templates");
    }
  }
  for (const [name, bare] of Object.entries(families)) {
    if (!bare) { ok(`(${name})`, "FOUNDATION: the sitemap offers a sample of this family", false, "no URL of this family in the sitemap"); continue; }
    const listed = ["ja", "en"].filter((l) => inSitemap(`/${l}${bare}`));
    if (name !== "post") {
      // products, collections and categories exist in both languages: both must be listed, both must pass.
      for (const l of ["ja", "en"]) {
        ok(`/${l}${bare}`, "FOUNDATION: a product, collection or category is listed in BOTH languages", listed.includes(l), "not in the sitemap in this language");
        if (listed.includes(l)) await checkTemplate(`/${l}${bare}`, "dynamic-both-languages");
      }
      continue;
    }
    ok(bare, "FOUNDATION: a blog post is listed in at least one language", listed.length > 0, "not in the sitemap in either language");
    for (const l of listed) await checkTemplate(`/${l}${bare}`, "blog-post");
  }

  // 2. unavailable siblings, explicit on BOTH sides.
  const checkSibling = async (bare, existing, absent, key) => {
    const r = await get(`/${absent}${bare}`);
    ok(`/${absent}${bare}`, "FOUNDATION: an unavailable sibling is a clean 404 (noindex; no canonical, hreflang or og:url)", clean404(r), why404(r));
    const other = await get(`/${existing}${bare}`);
    const langs = alternates(other.body).map((a) => a.lang);
    ok(`/${existing}${bare}`, `FOUNDATION: the language that exists names no hreflang for the unavailable one (${absent}), and is itself 200`, other.status === 200 && !langs.includes(absent), `status ${other.status}, hreflang=${langs.join(",") || "none"}`);
    cov.hit(key);
  };
  await checkSibling(M.layaway.bare, M.layaway.existing, M.layaway.absent, "unavailable-sibling");   // never exists, by policy
  await checkTemplate("/en/layaway", "layaway");
  const postLangs = new Map();
  for (const p of paths) { const m = p.match(/^\/(en|ja)(\/blog\/.+)$/); if (m) postLangs.set(m[2], [...(postLangs.get(m[2]) ?? []), m[1]]); }
  const single = [...postLangs].filter(([, ls]) => ls.length === 1);
  for (const [bare, [only]] of single) { await checkSibling(bare, only, only === "en" ? "ja" : "en", "single-language-posts"); cov.hit("unavailable-sibling"); }
  if (single.length === 0) cov.skip("single-language-posts", `no single-language post in this deployment's sitemap (${postLangs.size} post(s), all in both languages); the layaway sibling covers the rule`);

  // 3. every 404 shape
  for (const path of shapes) {
    const r = await get(path);
    cov.hit("404-shapes");
    ok(path, "FOUNDATION: a real 404 with noindex, and no canonical, hreflang or og:url", clean404(r), why404(r));
  }
  for (const path of gatedMalformed) {
    const r = await get(path);
    cov.hit("gated-descendants");
    ok(path, "FOUNDATION: a malformed descendant of a gated private route redirects an anonymous visitor to /login and renders nothing", r.status >= 300 && r.status < 400 && /\/login/.test(r.location ?? "") && ogUrls(r.body).length === 0 && canonicals(r.body).length === 0, `got ${r.status} ${r.location ?? ""}`);
  }

  // 4. real private/utility pages keep og:url only
  for (const path of M.privatePages) {
    const r = await get(path);
    cov.hit("private-pages");
    if (r.status !== 200) { ok(path, "FOUNDATION: a private page answers 200", false, `got ${r.status}`); continue; }
    const h = r.body;
    ok(path, "FOUNDATION: a private route says noindex, names no canonical or alternates, keeps one og:url and one fb:app_id", /noindex/i.test(robotsMeta(h) ?? "") && canonicals(h).length === 0 && alternates(h).length === 0 && ogUrls(h).length === 1 && ogUrls(h)[0] === `${PUBLIC_ORIGIN}${path}` && fbIds(h).length === 1, `robots=${robotsMeta(h)} canon=${canonicals(h).length} hreflang=${alternates(h).length} og:url=${ogUrls(h).join("|")} fb=${fbIds(h).length}`);
  }

  // 5b. Merchant feed (DP-08): present route -> required; absent route -> skipped with the reason.
  // A truthful 503 "no items" (no owner-confirmed identifier evidence yet, or a fixtures catalog) is NOT a feed pass:
  // the success path is reported as SKIPPED — UNVERIFIED SUCCESS COVERAGE — and only the verified refusal shape is a pass.
  {
    if (!MERCHANT_ROUTE_PRESENT) cov.skip("merchant-feed", "route not present in this checkout");
    else {
      const r = await get("/api/merchant-feed?lang=ja");
      const en = await get("/api/merchant-feed?lang=en");
      const items = (String(r.body ?? "").match(/<item>/g) ?? []).length;
      const noItems = r.status === 503 && /feed incomplete: the feed has no items/.test(String(r.body ?? ""));
      if (noItems) {
        cov.skip("merchant-feed", "UNVERIFIED SUCCESS COVERAGE: the feed answered the truthful 503 'no items' (no owner-confirmed identifier evidence, or a fixtures catalog); the 200/XML path was NOT exercised, so this is not a feed pass");
        ok("/api/merchant-feed", "MERCHANT refusal shape (not a feed pass): the 503 is noindex and no-store, and ?lang=en answers 404", /noindex/i.test(String(r.xrobots ?? "")) && /no-store/.test(String(r.cache ?? "")) && en.status === 404, `status ${r.status}, xrobots ${r.xrobots}, cache ${r.cache}, en ${en.status}`);
      } else {
        cov.hit("merchant-feed");
        ok("/api/merchant-feed", "MERCHANT: 200 application/xml RSS (g: namespace), noindex, at least one <item>; ?lang=en answers 404", r.status === 200 && /application\/xml/.test(String(r.contentType ?? "")) && /xmlns:g=/.test(String(r.body ?? "")) && items > 0 && /noindex/i.test(String(r.xrobots ?? "")) && en.status === 404, `status ${r.status}, items ${items}, noindex ${/noindex/i.test(String(r.xrobots ?? ""))}, en ${en.status}`);
      }
    }
  }

  // 6. llms.txt (Master Plan PHASE 6 add-on): the shared rule in scripts/lib/seo-check-core.mjs
  {
    const r = await get("/llms.txt");
    if (!LLMS_ROUTE_PRESENT && r.status === 404) {
      cov.skip("llms-txt", "route deferred to the Phase 6 batch under the approved requirements of 2026-10-31 (record OD-LLMS-1; not an open decision): /llms.txt answers 404 as expected while app/llms.txt/route.ts is absent");
      cov.skip("llms-links", "route deferred to the Phase 6 batch under the approved requirements of 2026-10-31 (record OD-LLMS-1; not an open decision): no file to read links from");
      ok("/llms.txt", "LLMS: route deferred to the Phase 6 batch (approved requirements; record OD-LLMS-1) — 404 recorded as the expected state, not judged", true, "");
    } else {
    cov.hit("llms-txt");
    const problems = llmsTxtProblems(r, { publicOrigin: PUBLIC_ORIGIN, sitemapPaths: paths });
    ok("/llms.txt", "LLMS: 200 text/plain; every link is a public sitemap page on the public origin; no product, private or Japanese-layaway link; no figure", problems.length === 0, r.error ? `request failed: ${r.error}` : problems.join("; "));
    // Each advertised link, fetched: the contract says "every link returns 200 and is indexable". A link off the
    // public origin is already a failure above and is not fetched (the checker never leaves its origin).
    for (const link of [...new Set(llmsTxtLinks(r.body))]) {
      let u; try { u = new URL(link); } catch { continue; }
      if (u.origin !== PUBLIC_ORIGIN) continue;
      const lr = await get(u.pathname);
      cov.hit("llms-links");
      const lp = llmsLinkProblems(link, lr);
      ok(u.pathname, "LLMS-LINK: advertised in /llms.txt → fetched 200 text/html, no noindex, one self canonical", lp.length === 0, lp.join("; "));
    }
    }
  }

  // 5. query handling: the identity never follows the query
  for (const { path, query } of M.queryCases) {
    const r = await get(`${path}${query}`);
    cov.hit("query-handling");
    if (r.status !== 200) { ok(path, "FOUNDATION: a page with a query answers 200", false, `got ${r.status}`); continue; }
    ok(`${path}?utm_source=…`, "FOUNDATION: og:url and the canonical stay the bare locale URL when the request carries a query", ogUrls(r.body).length === 1 && ogUrls(r.body)[0] === `${PUBLIC_ORIGIN}${path}` && canonicals(r.body)[0] === `${PUBLIC_ORIGIN}${path}`, `og:url=${ogUrls(r.body).join("|")} canonical=${canonicals(r.body).join("|")}`);
  }
}

// ---------------------------------------------------------------- report
for (const f of cov.failures()) record("FAIL", "(coverage)", `coverage missing: ${f.key} - ${f.description}`, `expected ${f.expected}, checked ${f.checked}${f.skipped.length ? `, skipped: ${f.skipped.join("; ")}` : ""}`);
const w = Math.max(...results.map((r) => r.route.length));
for (const r of results) console.log(`${r.status.padEnd(8)} ${r.route.padEnd(w)}  ${r.what}${r.detail ? `  [${r.detail}]` : ""}`);
const n = (s) => results.filter((r) => r.status === s).length;
console.log(`\ncoverage inventory (requests to ${BASE}; canonical origin expected ${PUBLIC_ORIGIN}):\n${cov.inventory()}`);
console.log(`\n${BASE}: ${n("PASS")} pass, ${n("FAIL")} fail, ${n("DEFERRED")} deferred`);
process.exitCode = n("FAIL") ? 1 : 0;      // not process.exit(): a long report written to a pipe must be flushed first
