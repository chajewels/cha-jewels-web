// OG-PRODUCT (docs/seo/OUTSTANDING-ISSUES-REGISTER.md §5): a product page's OpenGraph block.
// Pure-function and source-level guards, in the repo's style; the rendered HTML is
// checked by scripts/check-seo-live.mjs ("OG-PRODUCT" block). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { productOpenGraph, productCanonicalUrl, productOgImageUrl, BRAND_OG_IMAGE } = await import("@/lib/product-seo");
const { localeAlternates, localizedMeta } = await import("@/lib/locale-meta");
const { primaryImage, allImages } = await import("@/lib/product-facts");
const { siteUrl } = await import("@/lib/site");
const read = (f) => readFileSync(join(process.cwd(), f), "utf8");
const BASE = siteUrl();
const SLUG = "r2715-ring-k18wg-12-80g-diamond-2-50ct-sz-15-5-preloved";
const PHOTO = "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/product-media/example/photo-a.jpg";

test("English product with a photo: the product's own image and alt, plus every site-wide field", () => {
  const og = productOpenGraph({ name: "Ring K18WG", lang: "en", slug: SLUG, imageUrl: PHOTO });
  assert.equal(og.type, "website");
  assert.equal(og.siteName, "Cha Jewels");
  assert.equal(og.locale, "en_US");
  assert.deepEqual(og.alternateLocale, ["ja_JP"]);
  assert.equal(og.url, undefined, "R-37: og:url is the locale wrapper's, not this block's (see the wrapper test below)");
  assert.deepEqual(og.images, [{ url: PHOTO, alt: "Ring K18WG" }]);
});

test("Japanese product with a photo: Japanese locale first, English as the alternate, Japanese URL", () => {
  const og = productOpenGraph({ name: "リング K18WG", lang: "ja", slug: SLUG, imageUrl: PHOTO });
  assert.equal(og.locale, "ja_JP");
  assert.deepEqual(og.alternateLocale, ["en_US"]);
  assert.equal(og.url, undefined);
  assert.deepEqual(og.images, [{ url: PHOTO, alt: "リング K18WG" }]);
});

test("a product with several photos uses the primary one only (lowest Hub sort, each URL once), never another", () => {
  const m = (url, sort) => ({ url, alt: null, sort });
  const p = { product_variants: [{ product_media: [m("https://x.test/c.jpg", 3), m("https://x.test/a.jpg", 1)] }, { product_media: [m("https://x.test/b.jpg", 2), m("https://x.test/a.jpg", 1)] }] };
  assert.deepEqual(allImages(p).map((i) => i.url), ["https://x.test/a.jpg", "https://x.test/b.jpg", "https://x.test/c.jpg"]);
  const url = productOgImageUrl(primaryImage(p));
  assert.equal(url, "https://x.test/a.jpg");
  const og = productOpenGraph({ name: "N", lang: "en", slug: "s", imageUrl: url });
  assert.equal(og.images.length, 1);
  assert.equal(og.images[0].url, "https://x.test/a.jpg");
});

test("simulated product WITHOUT a photo: the full site fields and the brand image, absolute, never empty", () => {
  for (const imageUrl of [null, productOgImageUrl(null), productOgImageUrl({ url: "" }), productOgImageUrl({ url: "   " }), productOgImageUrl({ url: undefined }), productOgImageUrl({ url: 42 })]) {
    const og = productOpenGraph({ name: "Ring", lang: "en", slug: "s", imageUrl });
    assert.equal(og.siteName, "Cha Jewels");
    assert.equal(og.type, "website");
    assert.equal(og.url, undefined, "R-37: the locale wrapper adds og:url");
    assert.equal(og.images.length, 1);
    const img = og.images[0];
    assert.equal(img.url, `${BASE}${BRAND_OG_IMAGE.path}`);
    assert.match(img.url, /^https?:\/\/\S+\/opengraph-image\.png$/);
    assert.deepEqual([img.width, img.height, img.type, img.alt], [1200, 630, "image/png", "Cha Jewels"]);
  }
});

test("a photo never loses its place to the brand image", () => {
  const og = productOpenGraph({ name: "Ring", lang: "ja", slug: "s", imageUrl: PHOTO });
  assert.equal(og.images[0].url, PHOTO);
  assert.equal(JSON.stringify(og).includes("opengraph-image"), false);
});

test("the brand image the fallback names exists, at its real size, with its alt", () => {
  const png = readFileSync(join(process.cwd(), "app/opengraph-image.png"));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), BRAND_OG_IMAGE.width);
  assert.equal(png.readUInt32BE(20), BRAND_OG_IMAGE.height);
  assert.equal(read("app/opengraph-image.alt.txt").trim(), BRAND_OG_IMAGE.alt);
});

test("og:url equals the canonical the locale wrapper writes, in both languages, through the real wrapper", async () => {
  const wrapper = localizedMeta((p) => `/products/${p.slug}`, async () => ({ title: "t", openGraph: productOpenGraph({ name: "N", lang: "en", slug: SLUG, imageUrl: null }) }));
  const md = await wrapper({ params: Promise.resolve({ lang: "en", slug: SLUG }) });
  assert.equal(md.alternates.canonical, md.openGraph.url);
  for (const lang of ["en", "ja"]) {
    assert.equal(productCanonicalUrl(lang, SLUG), localeAlternates(lang, `/products/${SLUG}`).alternates.canonical);
    assert.equal(localeAlternates(lang, `/products/${SLUG}`).alternates.canonical, `${BASE}/${lang}/products/${SLUG}`);
  }
});

test("canonical and hreflang come only from the locale wrapper; the product block adds none (unchanged)", () => {
  const og = productOpenGraph({ name: "N", lang: "en", slug: "s", imageUrl: null });
  assert.equal("alternates" in og, false);
  const alt = localeAlternates("en", "/products/s").alternates;
  assert.deepEqual(Object.keys(alt.languages).sort(), ["en", "ja", "x-default"]);
  assert.equal(alt.languages["x-default"], `${BASE}/en/products/s`);
});

test("missing product or invalid language: no OpenGraph, no canonical (a 404 says nothing)", async () => {
  const wrapper = localizedMeta((p) => `/products/${p.slug}`, async () => ({}));
  assert.deepEqual(await wrapper({ params: Promise.resolve({ lang: "xx", slug: "s" }) }), {});
  const src = read("app/products/[slug]/page.tsx");
  assert.match(src, /if \(!p\) return \{\};/);
});

test("product page source: the block comes from productOpenGraph, no `openGraph: undefined`, no own twitter key, JSON-LD still emitted", () => {
  const src = read("app/products/[slug]/page.tsx");
  const meta = src.slice(src.indexOf("export async function generateMetadata"), src.indexOf("The page's own rules"));
  assert.match(meta, /openGraph: productOpenGraph\(\{ name, lang, slug, imageUrl: productOgImageUrl\(primaryImage\(p\)\) \}\)/);
  assert.equal(/openGraph:\s*img\b/.test(meta), false);
  assert.equal(/openGraph:\s*undefined/.test(meta), false);
  assert.equal(/\btwitter\s*:/.test(meta), false, "Twitter metadata keeps following the OpenGraph block");
  assert.match(meta, /title: productTitle\(name, p\.sku\)/);
  assert.match(meta, /description: productMetaDescription\(name, productDescription\(p, lang\), lang\)/);
  assert.match(src, /<JsonLd type="product"/);
  assert.match(src, /<Breadcrumbs /, "the BreadcrumbList is emitted by the Breadcrumbs component, as before");
});

test("the product block never states title or description of its own (they follow the page's, as before)", () => {
  const og = productOpenGraph({ name: "N", lang: "en", slug: "s", imageUrl: PHOTO });
  assert.equal("title" in og, false);
  assert.equal("description" in og, false);
});

test("lib/json-ld.ts is not touched by this fix: the BreadcrumbList builder still produces its usual output", async () => {
  const { buildJsonLd } = await import("@/lib/json-ld");
  const ld = buildJsonLd({ type: "breadcrumb", items: [{ name: "Collections", path: "/collections" }, { name: "Rings", path: "/collections/rings" }] }, BASE, "/en");
  assert.equal(ld["@type"], "BreadcrumbList");
  assert.equal(ld.itemListElement.length, 2);
  assert.equal(ld.itemListElement[1].item, `${BASE}/en/collections/rings`);
});
