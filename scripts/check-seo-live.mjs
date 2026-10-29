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
// The visible breadcrumb <nav> (components/site/breadcrumbs.tsx), by its
// accessible name in either language (lib/i18n.ts pdp.breadcrumb); its inner
// HTML, or null when the page draws none.
const crumbNav = (html) => html.match(/<nav aria-label="(?:Breadcrumb|パンくずリスト)"[^>]*>(.*?)<\/nav>/s)?.[1] ?? null;
const unescapeHtml = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;/g, "'").replace(/&#39;/g, "'");

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
for (const p of ["/search", "/cart", "/login", "/already-registered"]) ok("/robots.txt", `does not block ${p} (its noindex must be readable)`, !new RegExp(`^Disallow: ${p}\\b`, "m").test(rb.body));

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
  if (path === "/") {
    const s = ld.find((d) => d["@type"] === "JewelryStore");
    ok(path, "JSON-LD: JewelryStore", !!s, types.join(","));
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
    ok(path, "JSON-LD: P4 breadcrumb items are absolute URLs on this origin", items.length >= 2 && items.every((i) => typeof i.item === "string" && i.item.startsWith(BASE)), items.map((i) => i.item).join(" | "));
    ok(path, "JSON-LD: P4 breadcrumb ends at this page", (items.at(-1)?.item ?? "").replace(/\/$/, "") === `${BASE}${path}`.replace(/\/$/, ""), items.at(-1)?.item);
    const nav = crumbNav(r.body);
    ok(path, "P4 visible breadcrumb nav (aria-label Breadcrumb / パンくずリスト) with a list", !!nav && /<ol\b/.test(nav), nav ? "no <ol>" : "no <nav aria-label=\"Breadcrumb\">");
    const hrefs = nav ? [...nav.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => new URL(unescapeHtml(m[1]), BASE).href.replace(/\/$/, "")) : [];
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
    const brand = og?.startsWith(`${BASE}/opengraph-image`);
    ok(path, "Step 2: og:image is the brand image or an absolute https hero, and twitter:image is the same", !!og && (brand || /^https:\/\/\S+$/.test(og)) && tw === og, `og=${og} twitter=${tw}`);
    ok(path, "Step 2: a hero image carries the page's name as its alt; the brand image keeps its own", brand ? metaContent(h, "property", "og:image:alt") === "Cha Jewels" : !!metaContent(h, "property", "og:image:alt"), `alt=${metaContent(h, "property", "og:image:alt")}`);
    ok(path, "Step 2: exactly one canonical, self-referencing, and the ja/en/x-default alternates are still present", canonicals(h).length === 1 && canonicals(h)[0] === `${BASE}${path}` && alternates(h).length === 3, `canonical=${canonicals(h).join("|")} alternates=${alternates(h).length}`);
    // The grid the server rendered: product links in <main>, outside the hidden crawl lists,
    // in last-occurrence order (a category's stage repeats a piece above the grid).
    const main = (h.replace(/<ul hidden[^>]*>.*?<\/ul>/gs, "").match(/<main\b.*?<\/main>/s) ?? [h])[0];
    const links = [...main.matchAll(new RegExp(`href="(/${lang}/products/[^"#?]+)"`, "g"))].map((m) => `${BASE}${m[1]}`);
    const grid = []; for (const l of [...links].reverse()) if (!grid.includes(l)) grid.push(l); grid.reverse();
    const lists = jsonLd(h).filter((x) => x["@type"] === "ItemList");
    if (grid.length < 2) { ok(path, `Step 2: ${grid.length}-piece listing emits no ItemList`, lists.length === 0, `${lists.length} ItemList(s)`); continue; }
    ok(path, "Step 2: exactly one ItemList", lists.length === 1, `${lists.length}`);
    const il = lists[0]; if (!il) continue;
    const items = il.itemListElement ?? [], urls = items.map((i) => i.url);
    ok(path, `Step 2: ItemList equals the rendered grid (${grid.length} pieces, same order, no duplicates, positions 1..n)`, urls.length === grid.length && urls.every((u, i) => u === grid[i]) && new Set(urls).size === urls.length && items.every((it, i) => it.position === i + 1) && il.numberOfItems === items.length, `items ${urls.length} vs grid ${grid.length}`);
    ok(path, "Step 2: ItemList entries are locale product URLs with only @type, position and url (no price, availability or rating)", items.every((it) => Object.keys(it).join() === "@type,position,url" && it.url.startsWith(`${BASE}/${lang}/products/`)) && !/offers|price|availability|rating|review/i.test(JSON.stringify(il)), JSON.stringify(items[0]));
    ok(path, "Step 2: BreadcrumbList is still emitted", jsonLd(h).some((x) => x["@type"] === "BreadcrumbList"));
  }
}

// ---------------------------------------------------------------- report
const w = Math.max(...results.map((r) => r.route.length));
for (const r of results) console.log(`${r.status.padEnd(8)} ${r.route.padEnd(w)}  ${r.what}${r.detail ? `  [${r.detail}]` : ""}`);
const n = (s) => results.filter((r) => r.status === s).length;
console.log(`\n${BASE}: ${n("PASS")} pass, ${n("FAIL")} fail, ${n("DEFERRED")} deferred`);
process.exit(n("FAIL") ? 1 : 0);
