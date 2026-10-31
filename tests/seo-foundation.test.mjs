// SEO foundation batch: og:url on every successful locale template, no canonical/hreflang/og:url
// on unknown multi-segment 404s, and the Facebook app id emitted once. Run: npm run test:unit.
//
// The rendered HTML is checked by scripts/check-seo-live.mjs ("FOUNDATION" block) against a build.
// These tests state the rules on the pure pieces and guard the wiring at source level, in the
// repo's style. Written to FAIL on the pre-batch code: it has no og:url under /en and /ja, renders
// canonical + hreflang + og:url for "/foo/bar", and keeps the Facebook id inside <SeoLinks />.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

process.env.NEXT_PUBLIC_SITE_URL = "https://www.chajewelsjp.com";
const { localeOpenGraph, siteOpenGraph, FACEBOOK_APP_ID, BRAND_OG_IMAGE } = await import("@/lib/og-meta");
const { localizedMeta, localeAlternates } = await import("@/lib/locale-meta");
const { seoLinkPlan, routeShapeOf, isDynamicPublicRoute, ROUTE_SHAPES, indexingFor, isNoindexPath } = await import("@/lib/seo-policy");
const { productOpenGraph } = await import("@/lib/product-seo");
const { legacyRedirectsEnabled } = await import("@/lib/legacy-redirect");
const { listingOpenGraph } = await import("@/lib/listing-seo");
const B = "https://www.chajewelsjp.com";
const read = (f) => readFileSync(join(process.cwd(), f), "utf8");

// What Next hands a wrapper as `parent`: the root block with the file-based brand image,
// whose URL carries a content-hash cache-buster that must survive untouched.
const HASHED = `${B}/opengraph-image.png?383dab197f2c0fd9`;
const parentWith = (images) => Promise.resolve({ openGraph: { type: "website", siteName: "Cha Jewels", images } });
const PARENT = parentWith([{ url: HASHED, width: 1200, height: 630, type: "image/png", alt: "Cha Jewels" }]);
const params = (o) => Promise.resolve(o);

// ---------------------------------------------------------------- og:url on locale pages
test("a page with no OpenGraph of its own: site fields, og:url = the canonical, and the inherited brand image untouched (hash included)", async () => {
  const gen = localizedMeta((p) => `/legal/${p.slug}`, async () => ({ title: "T" }));
  for (const lang of ["en", "ja"]) {
    const m = await gen({ params: params({ lang, slug: "privacy" }) }, PARENT);
    assert.equal(m.alternates.canonical, `${B}/${lang}/legal/privacy`);
    assert.equal(m.openGraph.url, m.alternates.canonical, "og:url and the canonical are one value");
    assert.equal(m.openGraph.type, "website");
    assert.equal(m.openGraph.siteName, "Cha Jewels");
    assert.equal(m.openGraph.locale, lang === "ja" ? "ja_JP" : "en_US");
    assert.deepEqual(m.openGraph.alternateLocale, [lang === "ja" ? "en_US" : "ja_JP"]);
    assert.equal(m.openGraph.images[0].url, HASHED, "the page keeps exactly the image it had before");
  }
});

test("with no resolved parent image the brand image is named by its stable route (never an empty slot)", () => {
  for (const parent of [undefined, null, {}, { images: [] }]) {
    const og = localeOpenGraph({ own: undefined, parent, lang: "en", url: `${B}/en/faq` });
    assert.equal(og.images.length, 1);
    assert.deepEqual(og.images[0], { url: `${B}${BRAND_OG_IMAGE.path}`, width: 1200, height: 630, type: "image/png", alt: "Cha Jewels" });
  }
});

test("a page that set its own OpenGraph keeps every field it set, gains only og:url", () => {
  const own = { type: "article", siteName: "Cha Jewels", locale: "en_US", alternateLocale: ["ja_JP"], title: "Post", description: "D", publishedTime: "2026-01-01", images: [{ url: "https://x.test/cover.jpg" }] };
  const og = localeOpenGraph({ own, parent: { images: [{ url: HASHED }] }, lang: "en", url: `${B}/en/blog/p` });
  assert.deepEqual(og, { ...own, url: `${B}/en/blog/p` });
  assert.equal(og.type, "article", "the article type is not overwritten by the site's 'website'");
  assert.deepEqual(og.images, [{ url: "https://x.test/cover.jpg" }], "its own image is never replaced by the inherited one");
});

test("a block that left out site-wide fields gets them restated (a page-level block REPLACES the root's)", () => {
  const og = localeOpenGraph({ own: { images: [{ url: "https://x.test/h.jpg", alt: "Rings" }] }, parent: null, lang: "ja", url: `${B}/ja/collections/rings` });
  assert.equal(og.siteName, "Cha Jewels");
  assert.equal(og.locale, "ja_JP");
  assert.deepEqual(og.alternateLocale, ["en_US"]);
  assert.equal(og.url, `${B}/ja/collections/rings`);
});

test("product sharing is unchanged on the locale pages: same block, og:url = the canonical, a single og:url value; the product block itself names no url (R-37, closed 2026-11-01)", async () => {
  const slug = "r2715-ring";
  const own = productOpenGraph({ name: "Ring", lang: "en", slug, imageUrl: "https://x.test/p.jpg" });
  assert.equal(own.url, undefined, "the bare product page in rollback mode must carry only <SeoLinks />'s og:url");
  const gen = localizedMeta((p) => `/products/${p.slug}`, async () => ({ title: "T", openGraph: own }));
  const m = await gen({ params: params({ lang: "en", slug }) }, PARENT);
  assert.deepEqual(m.openGraph, { ...siteOpenGraph("en"), ...own, url: `${B}/en/products/${slug}` });
  assert.equal(m.openGraph.url, m.alternates.canonical);
  assert.deepEqual(m.openGraph.images, [{ url: "https://x.test/p.jpg", alt: "Ring" }]);
});

test("a listing hero block keeps its image and alt, and gains og:url", async () => {
  const hero = listingOpenGraph("https://x.test/hero.jpg", "Rings", "en");
  const gen = localizedMeta((p) => `/collections/${p.slug}`, async () => ({ title: "Rings", openGraph: hero }));
  const m = await gen({ params: params({ lang: "en", slug: "rings" }) }, PARENT);
  assert.deepEqual(m.openGraph.images, [{ url: "https://x.test/hero.jpg", alt: "Rings" }]);
  assert.equal(m.openGraph.url, `${B}/en/collections/rings`);
});

test("og:url never carries a query or a fragment, for any path parameters a route can produce", async () => {
  const gen = localizedMeta((p) => `/blog/${p.slug}`, async () => ({ title: "T" }));
  for (const slug of ["what-k18-means", "a%20b", "k18-gold-faq"]) {
    for (const lang of ["en", "ja"]) {
      const m = await gen({ params: params({ lang, slug }) }, PARENT);
      assert.ok(!/[?#]/.test(m.openGraph.url), m.openGraph.url);
      assert.equal(m.openGraph.url, m.alternates.canonical);
    }
  }
  assert.equal(localeAlternates("en", "/").alternates.canonical, `${B}/en`, "the locale home has no slash");
});

test("EN-only pages and missing language siblings say NOTHING for the missing language (no og:url on a 404)", async () => {
  const layaway = localizedMeta(() => "/layaway", async () => ({ title: "L" }), () => ({ en: true, ja: false }));
  assert.deepEqual(await layaway({ params: params({ lang: "ja" }) }, PARENT), {}, "/ja/layaway: nothing");
  const en = await layaway({ params: params({ lang: "en" }) }, PARENT);
  assert.equal(en.openGraph.url, `${B}/en/layaway`);
  const post = localizedMeta((p) => `/blog/${p.slug}`, async () => ({ title: "P" }), () => ({ en: true, ja: false }));
  assert.deepEqual(await post({ params: params({ lang: "ja", slug: "english-only" }) }, PARENT), {});
  assert.ok((await post({ params: params({ lang: "en", slug: "english-only" }) }, PARENT)).openGraph.url);
});

test("an invalid locale (/fr/…) and a missing resource (the page throws before metadata matters) emit no OpenGraph block", async () => {
  const gen = localizedMeta(() => "/faq", async () => ({ title: "T" }));
  const m = await gen({ params: params({ lang: "fr" }) }, PARENT);
  assert.deepEqual(m, {});
  assert.equal(m.openGraph, undefined);
});

test("EVERY locale page goes through localizedMeta, so no template can skip og:url", () => {
  const files = [];
  const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : n === "page.tsx" && files.push(p); } };
  walk(join(process.cwd(), "app/[lang]"));
  assert.ok(files.length >= 22, `expected the 22 locale pages, found ${files.length}`);
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    assert.match(src, /generateMetadata = localizedMeta\(/, `${relative(process.cwd(), f)} must use localizedMeta`);
  }
});

// ---------------------------------------------------------------- unknown multi-segment 404s
const PUBLIC_PLAN = { canonical: true, ogUrl: true, alternates: true };
const PRIVATE_PLAN = { canonical: false, ogUrl: true, alternates: false };

test("seoLinkPlan: a path that is not the exact shape of a real page names NOTHING (the 404s of /foo/bar, /products/x/y, /legal/missing, …)", () => {
  const malformed = [
    // unknown paths
    "/foo/bar", "/foo/bar/baz", "/foo", "/zzz", "/wp-admin/setup.php", "/.env", "/not-a-family/products/x",
    // the paths independent QA reproduced on the previous head
    "/products/x/y", "/collections/x/y", "/categories/x/y", "/blog/x/y", "/legal/missing", "/legal/missing/deeper",
    // more descendants of every public family, exact and children-shaped alike
    "/products/x/y/z", "/collections/x/y/z", "/categories/x/y/z", "/blog/x/y/z", "/legal", "/legal/", "/legal/privacy/extra", "/legal/tokusho/x",
    "/categories", "/faq/x", "/faq/x/y", "/about/x", "/about/x/y", "/jewelry-guide/x", "/shopping-guide/x", "/loyalty/x", "/loyalty/x/y",
    "/sale/x", "/wholesale/x", "/why-cha-jewels/x", "/contact/x", "/affiliations/x", "/layaway/x", "/layaway/x/y", "/blog/x/y/z/w",
    // descendants of private routes that are not real pages
    "/cart/zzz", "/cart/zzz/yyy", "/search/zzz", "/login/zzz", "/account/missing", "/account/orders/1/missing", "/checkout/missing",
    "/checkout/complete", "/review", "/review/tok/extra", "/receipts", "/receipts/verify/x", "/newsletter/unsubscribe/x", "/auth/zzz",
  ];
  for (const p of malformed) assert.equal(seoLinkPlan(p), null, `${p} must say nothing`);
  for (const p of malformed) assert.equal(routeShapeOf(p), null, `${p} has no real route shape`);
});

test("seoLinkPlan: every known valid public page keeps its canonical, og:url and alternates (single dynamic segment only)", () => {
  const valid = ["/", "/about", "/affiliations", "/blog", "/blog/some-post", "/categories/fine-jewelry", "/collections", "/collections/rings", "/contact", "/faq",
    "/jewelry-guide", "/layaway", "/legal/privacy", "/legal/returns", "/legal/terms", "/legal/tokusho", "/loyalty", "/products/r2715-ring", "/sale", "/shopping-guide", "/wholesale", "/why-cha-jewels",
    "/legal/tokusho/", "/products/a%20b"];
  for (const p of valid) assert.deepEqual(seoLinkPlan(p), PUBLIC_PLAN, p);
});

test("the route-shape table equals the page routes in app/ (a new, renamed or removed route cannot drift out of it)", () => {
  const found = [];
  const walk = (dir, rel) => {
    for (const n of readdirSync(dir)) {
      const full = join(dir, n);
      if (statSync(full).isDirectory()) { if (rel === "" && n === "[lang]") continue; walk(full, `${rel}/${n}`); }
      else if (n === "page.tsx") found.push(rel === "" ? "/" : rel.replace(/\[([^\]]+)\]/g, ":$1"));
    }
  };
  walk(join(process.cwd(), "app"), "");
  // Dynamic segment NAMES are not significant: compare by shape.
  const shape = (r) => r.replace(/:[^/]+/g, ":");
  const have = [...ROUTE_SHAPES.public, ...ROUTE_SHAPES.private].map(shape).sort();
  assert.deepEqual(have, found.map(shape).sort(), "update ROUTE_SHAPES in lib/seo-policy.ts to match the page routes under app/");
  assert.equal(new Set(have).size, have.length, "no route is listed twice");
});

test("seoLinkPlan: locale-prefixed paths are never described by <SeoLinks /> (the locale tree owns its metadata)", () => {
  for (const p of ["/en", "/ja", "/en/faq", "/ja/products/x", "/en/foo/bar", "/ja/foo/bar", "/en/layaway", "/ja/layaway", "/en/cart", "/fr/about",
    "/en/products/x/y", "/ja/products/x/y", "/en/collections/x/y", "/en/categories/x/y", "/en/blog/x/y", "/ja/blog/x/y", "/en/legal/missing", "/ja/legal/missing/deeper"]) assert.equal(seoLinkPlan(p), null, p);
});

test("seoLinkPlan: real private and utility pages keep og:url only — no canonical, no alternates (unchanged policy), dynamic ones included", () => {
  for (const p of ["/cart", "/login", "/search", "/account", "/account/addresses", "/account/layaway/7", "/account/orders/1", "/account/orders/1/pay-card", "/checkout", "/checkout/complete/9", "/checkout/complete/d/9", "/auth/confirm", "/review/tok", "/receipts/verify", "/loyalty/join", "/already-registered", "/newsletter/unsubscribe", "/cart-reminders/unsubscribe"]) {
    assert.deepEqual(seoLinkPlan(p), PRIVATE_PLAN, p);
    assert.ok(isNoindexPath(p), p);
  }
});

test("the robots directive still covers every DESCENDANT of a private prefix (only the og:url rule became exact)", () => {
  for (const p of ["/cart/zzz", "/account/orders/1/missing", "/search/x", "/checkout/missing", "/review/tok/extra"]) assert.ok(isNoindexPath(p), p);
  assert.deepEqual(indexingFor("/account/missing"), { index: false, follow: false });
});

test("seoLinkPlan: not a site path (empty, relative, protocol-relative, backslash) says nothing", () => {
  for (const p of ["", "foo", "//evil.test/x", "/\\evil", "http://x.test/a"]) assert.equal(seoLinkPlan(p), null, JSON.stringify(p));
});

test("the robots directive of every private path is exactly what it was", () => {
  assert.deepEqual(indexingFor("/cart"), { index: false, follow: true });
  assert.deepEqual(indexingFor("/account/orders"), { index: false, follow: false });
  assert.equal(indexingFor("/faq"), null);
});

test("<SeoLinks /> is driven by the plan and no longer hard-codes the Facebook id or an unconditional og:url", () => {
  const src = read("lib/page-meta.tsx");
  assert.match(src, /seoLinkPlan\(path, /);
  assert.doesNotMatch(src, /fb:app_id" content=/, "the id is not rendered here any more");
  assert.doesNotMatch(src, /812262777044447/);
  assert.match(src, /plan\.ogUrl &&/);
  assert.match(src, /plan\.canonical &&/);
  assert.match(src, /plan\.alternates &&/);
});

test("a missing resource describes NOTHING: the legacy metadata function returns no title, so no canonical, hreflang or og:url (a browser DOM applies metadata even when the page 404s)", async () => {
  // The legacy product, collection and category generateMetadata return {} for a slug that does not exist.
  const missing = localizedMeta((p) => `/products/${p.slug}`, async () => ({}));
  for (const lang of ["en", "ja"]) assert.deepEqual(await missing({ params: params({ lang, slug: "nonexistent" }) }, PARENT), {}, lang);
  const present = localizedMeta((p) => `/products/${p.slug}`, async () => ({ title: "Ring" }));
  const m = await present({ params: params({ lang: "en", slug: "real" }) }, PARENT);
  assert.equal(m.alternates.canonical, `${B}/en/products/real`);
  assert.equal(m.openGraph.url, m.alternates.canonical);
});

test("while the legacy redirects are ON a bare dynamic public URL says nothing (it only ever 404s or 307s); OFF keeps today's tags; static pages and private routes are unchanged", () => {
  for (const p of ["/products/x", "/collections/rings", "/categories/fine-jewelry", "/blog/a-post"]) {
    assert.equal(isDynamicPublicRoute(p), true, p);
    assert.equal(seoLinkPlan(p, true), null, `${p} with redirects on`);
    assert.deepEqual(seoLinkPlan(p, false), PUBLIC_PLAN, `${p} with redirects off (rollback)`);
    assert.deepEqual(seoLinkPlan(p), PUBLIC_PLAN, `${p} default argument keeps the previous behaviour`);
  }
  for (const p of ["/", "/faq", "/about", "/legal/tokusho", "/layaway", "/collections", "/blog"]) {
    assert.equal(isDynamicPublicRoute(p), false, p);
    assert.deepEqual(seoLinkPlan(p, true), PUBLIC_PLAN, p);
  }
  for (const p of ["/cart", "/account/orders/1", "/review/tok"]) assert.deepEqual(seoLinkPlan(p, true), PRIVATE_PLAN, p);
  assert.equal(isDynamicPublicRoute("/en/products/x"), false, "a locale path is not this rule's business");
});

test("<SeoLinks /> passes the legacy-redirect switch to the plan", () => {
  const src = read("lib/page-meta.tsx");
  assert.match(src, /seoLinkPlan\(path, legacyRedirectsEnabled\(process\.env\.SEO_LEGACY_REDIRECTS\)\)/);
});

test("the SEO_LEGACY_REDIRECTS switch drives the tag decision end to end, for every value it can take", () => {
  // The exact expression <SeoLinks /> uses: seoLinkPlan(path, legacyRedirectsEnabled(process.env.SEO_LEGACY_REDIRECTS)).
  const cases = [[undefined, null], ["", null], ["on", null], ["ON", null], ["0", null], ["false", null], ["no", null], ["off", PUBLIC_PLAN], ["OFF", PUBLIC_PLAN], [" Off ", PUBLIC_PLAN]];
  for (const [value, expected] of cases) {
    for (const path of ["/products/x", "/collections/rings", "/categories/fine-jewelry", "/blog/a-post"]) {
      assert.deepEqual(seoLinkPlan(path, legacyRedirectsEnabled(value)), expected, `${JSON.stringify(value)} ${path}`);
    }
    // static public pages and private routes do not depend on the switch
    assert.deepEqual(seoLinkPlan("/faq", legacyRedirectsEnabled(value)), PUBLIC_PLAN, `${JSON.stringify(value)} /faq`);
    assert.deepEqual(seoLinkPlan("/cart", legacyRedirectsEnabled(value)), PRIVATE_PLAN, `${JSON.stringify(value)} /cart`);
  }
});

// ---------------------------------------------------------------- Facebook app id
test("the Facebook app id is the existing approved value, defined once and emitted once by the root layout", () => {
  assert.equal(FACEBOOK_APP_ID, "812262777044447", "NOT a new id: the value <SeoLinks /> has always rendered");
  const layout = read("app/layout.tsx");
  assert.equal((layout.match(/facebook:\s*\{\s*appId:\s*FACEBOOK_APP_ID\s*\}/g) ?? []).length, 1);
  // The literal exists in exactly one source file.
  const hits = [];
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === "node_modules" || n === ".next" || n.startsWith(".")) continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|mjs)$/.test(n) && !p.includes("/tests/") && readFileSync(p, "utf8").includes("812262777044447")) hits.push(relative(process.cwd(), p)); } };
  for (const d of ["app", "lib", "components"]) walk(join(process.cwd(), d));
  assert.deepEqual(hits, ["lib/og-meta.ts"]);
});

test("the root layout takes its OpenGraph fields from the shared definition", () => {
  assert.match(read("app/layout.tsx"), /openGraph: siteOpenGraph\(lang\)/);
  const og = siteOpenGraph("ja");
  assert.deepEqual(og, { type: "website", siteName: "Cha Jewels", locale: "ja_JP", alternateLocale: ["en_US"] });
  assert.deepEqual(siteOpenGraph("en"), { type: "website", siteName: "Cha Jewels", locale: "en_US", alternateLocale: ["ja_JP"] });
});
