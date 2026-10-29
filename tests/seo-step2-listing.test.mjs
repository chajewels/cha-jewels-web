// SEO Step 2 (Master Plan §33.3): collection/category ItemList + hero OpenGraph image.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { listingProductSlugs, heroOgImage, listingOpenGraph, ogFor } = await import("@/lib/listing-seo");
const { buildJsonLd } = await import("@/lib/json-ld");
const read = (f) => readFileSync(join(process.cwd(), f), "utf8");
const BASE = "https://www.chajewelsjp.com";
const P = (...slugs) => slugs.map((slug) => ({ slug }));

test("ItemList: positions start at 1, follow the grid order, URLs are the locale product URLs", () => {
  const slugs = listingProductSlugs(P("c-ring", "a-ring", "b-ring"));
  assert.deepEqual(slugs, ["c-ring", "a-ring", "b-ring"], "never re-sorted");
  for (const [prefix, lang] of [["/en", "en"], ["/ja", "ja"]]) {
    const ld = buildJsonLd({ type: "itemlist", slugs }, BASE, prefix);
    assert.equal(ld["@type"], "ItemList");
    assert.equal(ld.numberOfItems, 3);
    assert.deepEqual(ld.itemListElement.map((i) => i.position), [1, 2, 3]);
    assert.deepEqual(ld.itemListElement.map((i) => i.url), slugs.map((s) => `${BASE}/${lang}/products/${s}`));
  }
});

test("ItemList: only position and url per item - no name, price, availability, rating, review or offer", () => {
  const ld = buildJsonLd({ type: "itemlist", slugs: ["a", "b"] }, BASE, "/en");
  for (const i of ld.itemListElement) assert.deepEqual(Object.keys(i), ["@type", "position", "url"]);
  const s = JSON.stringify(ld);
  for (const bad of ["offers", "price", "availability", "rating", "review", "name", "item\""]) assert.ok(!s.includes(bad), bad);
});

test("ItemList: empty, single-piece and blank-only listings produce no list", () => {
  assert.deepEqual(listingProductSlugs([]), []);
  assert.deepEqual(listingProductSlugs(P("only-one")), []);
  assert.deepEqual(listingProductSlugs([{ slug: "" }, { slug: "  " }, { slug: null }, {}]), []);
});

test("ItemList: a repeated or blank slug never repeats a URL; positions stay consecutive", () => {
  const slugs = listingProductSlugs([{ slug: "a" }, { slug: "" }, { slug: "b" }, { slug: "a" }, { slug: " c " }]);
  assert.deepEqual(slugs, ["a", "b", "c"]);
  const ld = buildJsonLd({ type: "itemlist", slugs }, BASE, "/en");
  assert.deepEqual(ld.itemListElement.map((i) => i.position), [1, 2, 3]);
  assert.equal(new Set(ld.itemListElement.map((i) => i.url)).size, 3);
});

test("ItemList: a large listing keeps every piece (the page renders every card; no pagination)", () => {
  const ld = buildJsonLd({ type: "itemlist", slugs: listingProductSlugs(Array.from({ length: 200 }, (_, i) => ({ slug: `p${i}` }))) }, BASE, "/en");
  assert.equal(ld.itemListElement.length, 200);
  assert.equal(ld.itemListElement[199].position, 200);
  assert.ok(JSON.stringify(ld).length < 30000, "about 130 bytes per item");
});

test("existing schema types are byte-identical: breadcrumb and product builders untouched", () => {
  const bc = buildJsonLd({ type: "breadcrumb", items: [{ name: "Collections", path: "/collections" }] }, BASE, "/en");
  assert.deepEqual(bc, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Collections", item: `${BASE}/en/collections` }] });
});

test("hero image: only the Hub's absolute https photo qualifies", () => {
  const ok = "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/collections/x.png";
  assert.equal(heroOgImage(ok), ok);
  assert.equal(heroOgImage(`  ${ok}  `), ok);
  for (const bad of [null, undefined, "", "   ", "/images/collections/rings.webp", "images/x.webp", "http://img.example.com/a.jpg", "//img.example.com/a.jpg", "javascript:alert(1)", "data:image/png;base64,AAAA", "https://user:pw@img.example.com/a.jpg", "https://", "not a url", "https://img.example.com/has space.jpg"]) {
    assert.equal(heroOgImage(bad), null, String(bad));
  }
});

test("hero openGraph: restates the root's fields (a page block replaces the root's), alt is the visible name; none without a hero", () => {
  const og = listingOpenGraph("https://img.example.com/h.jpg", "Earrings", "en");
  assert.equal(og.type, "website"); assert.equal(og.siteName, "Cha Jewels"); assert.equal(og.locale, "en_US"); assert.deepEqual(og.alternateLocale, ["ja_JP"]);
  assert.deepEqual(og.images, [{ url: "https://img.example.com/h.jpg", alt: "Earrings" }]);
  const ja = listingOpenGraph("https://img.example.com/h.jpg", "イヤリング", "ja");
  assert.equal(ja.locale, "ja_JP"); assert.deepEqual(ja.alternateLocale, ["en_US"]);
  assert.equal(listingOpenGraph(null, "Rings", "en"), undefined, "brand-image fallback preserved");
  assert.equal(listingOpenGraph("/images/collections/rings.webp", "Rings", "en"), undefined, "bundled placeholder is not the owner's image");
});

test("pages: ItemList and OG are fed by the grid's own array and the page's own hero field; placeholders are not used for OG", () => {
  for (const [f, arr, hero] of [["app/collections/[slug]/page.tsx", "col.products", "col.hero_media"], ["app/categories/[slug]/page.tsx", "cat.products", "cat.hero_media"]]) {
    const src = read(f);
    assert.ok(src.includes(`listingProductSlugs(${arr})`), f);
    assert.ok(src.includes(`<CatalogSection products={${arr}}`), `${f}: the grid gets the same array`);
    assert.ok(src.includes(`...ogFor(listingOpenGraph(${hero},`), f);
    assert.ok(!/openGraph:\s*listingOpenGraph/.test(src), `${f}: an explicit openGraph key (even undefined) would erase the root's og tags`);
    assert.match(src, /itemSlugs\.length > 0 && <JsonLd type="itemlist"/);
  }
  assert.ok(!/COLLECTION_PLACEHOLDER/.test(read("lib/listing-seo.ts")));
});

test("ogFor: no hero adds no openGraph key at all (an undefined key erases the root's og tags); a hero adds the block", () => {
  assert.deepEqual(ogFor(undefined), {});
  assert.ok(!("openGraph" in ogFor(listingOpenGraph(null, "Rings", "en"))));
  const og = listingOpenGraph("https://img.example.com/h.jpg", "Rings", "en");
  assert.deepEqual(ogFor(og), { openGraph: og });
});
