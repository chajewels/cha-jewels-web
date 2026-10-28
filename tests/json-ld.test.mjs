// The pure JSON-LD builder (lib/json-ld.ts), Phase 2B design H. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { buildJsonLd } = await import("@/lib/json-ld");
const B = "https://www.chajewelsjp.com";
// The fixture shape mirrors lib/fixtures.ts: variants carry the media and price.
const product = {
  name: "P1 Ring K18", sku: "P1", slug: "p1-ring-k18", description_en: "A ring.",
  origin: "JAPAN", brand: null, condition: "Preloved", status: "active",
  product_variants: [{ id: "v1", price_jpy: 10000, stock: 1, product_media: [{ url: "https://img.example/1.jpg", sort: 0 }] }],
  metals: [],
};

test("legacy product output is byte-stable: same fields, no inLanguage, no countryOfOrigin", () => {
  const d = buildJsonLd({ type: "product", product }, B, "");
  assert.equal(d["@type"], "Product");
  assert.equal(d.offers.url, `${B}/products/p1-ring-k18`);
  assert.equal(d.offers.itemCondition, "https://schema.org/UsedCondition");
  assert.equal("inLanguage" in d, false, "a legacy page must not gain fields");
  assert.equal(JSON.stringify(d).includes("countryOfOrigin"), false);
  assert.equal(d.brand, undefined, "brand only when the Hub says BRAND");
});

test("a locale page's product URLs carry the prefix and the page language", () => {
  for (const [prefix, lang] of [["/en", "en"], ["/ja", "ja-JP"]]) {
    const d = buildJsonLd({ type: "product", product }, B, prefix);
    assert.equal(d.offers.url, `${B}${prefix}/products/p1-ring-k18`, prefix);
    assert.equal(d.inLanguage, lang, prefix);
  }
});

test("the store: legacy url is the origin; locale url is the locale home", () => {
  assert.equal(buildJsonLd({ type: "store" }, B, "").url, B);
  assert.equal("inLanguage" in buildJsonLd({ type: "store" }, B, ""), false);
  assert.equal(buildJsonLd({ type: "store" }, B, "/ja").url, `${B}/ja`);
  assert.equal(buildJsonLd({ type: "store" }, B, "/ja").inLanguage, "ja-JP");
});

test("a post's @id follows the page, and its inLanguage is the post's own", () => {
  const post = { slug: "what-is-k18", title: "T", excerpt: "E", date: "2026-01-01", cover: null, lang: "en" };
  assert.equal(buildJsonLd({ type: "post", post }, B, "").mainEntityOfPage["@id"], `${B}/blog/what-is-k18`);
  assert.equal(buildJsonLd({ type: "post", post }, B, "/en").mainEntityOfPage["@id"], `${B}/en/blog/what-is-k18`);
  assert.equal(buildJsonLd({ type: "post", post }, B, "/en").inLanguage, "en");
});

test("the FAQ builder is unchanged by a prefix", () => {
  const items = [{ q: "Q?", a: "A." }];
  assert.deepEqual(buildJsonLd({ type: "faq", items }, B, "/en"), buildJsonLd({ type: "faq", items }, B, ""));
});
