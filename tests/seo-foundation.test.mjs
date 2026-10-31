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
const { seoLinkPlan, indexingFor, isNoindexPath } = await import("@/lib/seo-policy");
const { productOpenGraph } = await import("@/lib/product-seo");
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

test("product sharing is unchanged: same block, same url, a single og:url value", async () => {
  const slug = "r2715-ring";
  const own = productOpenGraph({ name: "Ring", lang: "en", slug, imageUrl: "https://x.test/p.jpg" });
  assert.equal(own.url, `${B}/en/products/${slug}`);
  const gen = localizedMeta((p) => `/products/${p.slug}`, async () => ({ title: "T", openGraph: own }));
  const m = await gen({ params: params({ lang: "en", slug }) }, PARENT);
  assert.deepEqual(m.openGraph, { ...siteOpenGraph("en"), ...own, url: own.url });
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
  const gen = localizedMeta((p) => `/blog/${p.slug}`, async () => ({}));
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
test("seoLinkPlan: an unknown path (single or multi-segment) names nothing — the 404 of /foo/bar carries no canonical, hreflang or og:url", () => {
  for (const p of ["/foo/bar", "/foo/bar/baz", "/foo", "/zzz", "/wp-admin/setup.php", "/.env", "/jewelry-guide/extra", "/faq/x/y", "/not-a-family/products/x"]) {
    assert.equal(seoLinkPlan(p), null, `${p} must say nothing`);
  }
});

test("seoLinkPlan: a children-shaped family is public BY STRUCTURE (its missing resources 404 in the page itself and emit nothing there)", () => {
  for (const p of ["/products/x/y", "/collections/a/b", "/legal"]) assert.deepEqual(seoLinkPlan(p), { canonical: true, ogUrl: true, alternates: true }, p);
});

test("seoLinkPlan: locale-prefixed paths are never described by <SeoLinks /> (the locale tree owns its metadata)", () => {
  for (const p of ["/en", "/ja", "/en/faq", "/ja/products/x", "/en/foo/bar", "/ja/foo/bar", "/en/layaway", "/ja/layaway", "/en/cart", "/fr/about"]) assert.equal(seoLinkPlan(p), null, p);
});

test("seoLinkPlan: private and utility routes keep og:url only — no canonical, no alternates (unchanged policy)", () => {
  for (const p of ["/cart", "/login", "/search", "/account", "/account/orders/1", "/checkout", "/checkout/complete/9", "/auth/confirm", "/review/tok", "/receipts/verify", "/loyalty/join", "/already-registered", "/newsletter/unsubscribe", "/cart-reminders/unsubscribe"]) {
    assert.deepEqual(seoLinkPlan(p), { canonical: false, ogUrl: true, alternates: false }, p);
    assert.ok(isNoindexPath(p), p);
  }
});

test("seoLinkPlan: a public family on a legacy path keeps its canonical, og:url and alternates", () => {
  for (const p of ["/", "/about", "/faq", "/products/r2715", "/collections/rings", "/blog/post", "/legal/privacy", "/layaway", "/jewelry-guide", "/loyalty"]) {
    assert.deepEqual(seoLinkPlan(p), { canonical: true, ogUrl: true, alternates: true }, p);
  }
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
  assert.match(src, /seoLinkPlan\(path\)/);
  assert.doesNotMatch(src, /fb:app_id" content=/, "the id is not rendered here any more");
  assert.doesNotMatch(src, /812262777044447/);
  assert.match(src, /plan\.ogUrl &&/);
  assert.match(src, /plan\.canonical &&/);
  assert.match(src, /plan\.alternates &&/);
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
