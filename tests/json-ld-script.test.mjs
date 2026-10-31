// W-03 (security audit 2026-10-31): JSON-LD is serialised for an inline script
// without letting Hub or customer text close the element. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { serializeJsonLd } = await import("@/lib/json-ld-script");
const { buildJsonLd } = await import("@/lib/json-ld");
const B = "https://www.chajewelsjp.com";

const product = {
  name: "P1 Ring K18", sku: "P1", slug: "p1-ring-k18", description_en: "A ring <b>bold</b>.",
  origin: "JAPAN", brand: null, condition: "Preloved", status: "active",
  product_variants: [{ id: "v1", price_jpy: 10000, stock: 1, product_media: [{ url: "https://img.example/1.jpg", sort: 0 }] }],
  metals: [],
};
const hostileReview = {
  count: 1, average: 5,
  reviews: [{ display_name: "Ana</script><script>alert(1)</script>", rating: 5, body: "Love it </SCRIPT><!-- <img src=x onerror=alert(1)>", approved_at: "2026-10-30" }],
};

test("a customer review cannot end the script element", () => {
  const out = serializeJsonLd(buildJsonLd({ type: "product", product, rating: hostileReview }, B, ""));
  assert.equal(out.includes("<"), false, "no raw < survives, so neither </script nor <!-- can appear");
  assert.doesNotMatch(out, /<\/script/i);
  assert.match(out, /\\u003c\/script>/, "the text is kept, escaped");
});

test("the JSON value is unchanged: parsing the escaped output gives the exact data", () => {
  for (const props of [
    { type: "product", product, rating: hostileReview },
    { type: "product", product },
    { type: "store" },
    { type: "faq", items: [{ q: "Is it <K18>?", a: "Yes & more" }] },
    { type: "breadcrumb", items: [{ name: "Home", path: "/" }, { name: "Rings <new>", path: "/collections/rings" }] },
  ]) {
    const data = buildJsonLd(props, B, "/en");
    // Compared with JSON.stringify's own round trip (it drops undefined fields).
    assert.deepEqual(JSON.parse(serializeJsonLd(data)), JSON.parse(JSON.stringify(data)), props.type);
  }
});

test("output without < is byte-identical to JSON.stringify (no SEO byte churn)", () => {
  const data = buildJsonLd({ type: "product", product: { ...product, description_en: "A ring." } }, B, "");
  assert.equal(serializeJsonLd(data), JSON.stringify(data));
  const amp = { name: "Tiffany & Co." };
  assert.equal(serializeJsonLd(amp), JSON.stringify(amp), "& is left alone");
});

test("the JsonLd component uses the escaping serializer", () => {
  const src = readFileSync(new URL("../components/site/json-ld.tsx", import.meta.url), "utf8");
  assert.match(src, /__html: serializeJsonLd\(data\)/);
  assert.doesNotMatch(src, /__html: JSON\.stringify/);
});
