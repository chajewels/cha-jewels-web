// SALE PRICE (owner decisions 2026-10-15). The Hub sends the sale price AS
// price_jpy, plus full_price_jpy and on_sale. D2-5 (revised): a strike means a
// sale and only a sale; a sold piece is muted, never struck. The decision is
// lib/sale.ts (struckFullPrice); components/commerce/sale-price.tsx draws it.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { struckFullPrice } = await import("@/lib/sale");
const fx = await import("@/lib/fixtures");

test("on sale: the Hub's full price is struck, exactly as sent", () => {
  assert.equal(struckFullPrice({ full: 799800, onSale: true, sold: false }), 799800);
  assert.equal(struckFullPrice({ full: 799800, onSale: true }), 799800);
});

test("sold: never struck, even when the Hub still marks the piece on sale", () => {
  assert.equal(struckFullPrice({ full: 799800, onSale: true, sold: true }), null);
});

test("no full price, or not on sale: the plain price", () => {
  assert.equal(struckFullPrice({ full: null, onSale: true }), null);
  assert.equal(struckFullPrice({ full: undefined, onSale: true }), null);
  assert.equal(struckFullPrice({ full: Number.NaN, onSale: true }), null);
  assert.equal(struckFullPrice({ full: 799800, onSale: false }), null);
  assert.equal(struckFullPrice({ full: 799800 }), null, "an older Hub without on_sale");
  assert.equal(struckFullPrice({}), null);
});

test("SalePrice: the strike and the tag render only from struckFullPrice; otherwise the price alone", () => {
  const src = readFileSync("components/commerce/sale-price.tsx", "utf8");
  assert.match(src, /const struck = struckFullPrice\(\{ full, onSale, sold \}\);/);
  assert.match(src, /if \(struck == null\) return <>\{formatMoney\(price\)\}<\/>;/, "no sale → the formatted price, nothing else");
  assert.equal((src.match(/<s[\s>]/g) ?? []).length, 1, "one strike element");
  assert.match(src, /t\("product", "sale"\)/, "the Sale tag");
  assert.match(src, /t\("product", "wasPrice"\)/, "the struck figure is labelled for screen readers");
  assert.match(src, /formatMoney\(struck\)/, "the struck figure is the Hub's full_price_jpy, formatted as sent");
  assert.doesNotMatch(src, /%|percent|off\b/i, "no \"% off\" figure");
});

test("every listed surface renders its price through SalePrice", () => {
  for (const f of [
    "components/commerce/price-block.tsx",
    "components/catalog/product-card.tsx",
    "components/home/arrival-card.tsx",
    "components/catalog/sold-card.tsx",
    "components/lumiere/site/search-overlay.tsx",
  ]) assert.match(readFileSync(f, "utf8"), /<SalePrice /, f);
  // Cart, checkout and order pages show what the customer pays: untouched.
  for (const f of ["components/commerce/checkout-flow.tsx"]) assert.doesNotMatch(readFileSync(f, "utf8"), /SalePrice|full_price_jpy/, f);
});

test("preview fixtures: one piece on sale, one sold piece carrying a sale", () => {
  const variants = fx.products.map((p) => ({ p, v: p.product_variants[0] }));
  const onSale = variants.filter(({ v }) => v.on_sale === true && v.stock_qty > 0);
  assert.ok(onSale.length >= 1, "a buyable piece on sale");
  for (const { v } of onSale) assert.equal(typeof v.full_price_jpy, "number");
  const soldSale = variants.filter(({ v }) => v.on_sale === true && v.stock_qty === 0);
  assert.ok(soldSale.length >= 1, "a sold piece the Hub still marks on sale");
  for (const { v } of soldSale) assert.equal(struckFullPrice({ full: v.full_price_jpy, onSale: v.on_sale, sold: true }), null);
});
