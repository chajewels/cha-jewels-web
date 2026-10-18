// SALE LISTING (owner decisions 2026-10-18): one rule for "is this piece in
// the Sale grid?" — lib/sale.ts saleListed — shared by the grid's Sale chip
// (components/catalog/catalog-section.tsx), the /sale page and the header's
// Sale link, so the three can never disagree. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { saleListed, struckFullPrice } = await import("@/lib/sale");
const { fromVariant } = await import("@/lib/product-facts");
const { isBuyable, productAvailability } = await import("@/lib/availability");
const fx = await import("@/lib/fixtures");

const variant = (o) => ({ id: "v", price_jpy: 100000, stock_qty: 1, full_price_jpy: null, on_sale: false, product_media: [], ...o });
const piece = (variants, o = {}) => ({ id: "p", slug: "p", sku: "S", name: "P", status: "active", product_variants: variants, ...o });

test("on sale, with a Hub full price, and buyable: listed", () => {
  assert.equal(saleListed(piece([variant({ on_sale: true, full_price_jpy: 150000 })])), true);
});

test("sold (no stock, or archived): never listed, even if the Hub still marks it on sale", () => {
  assert.equal(saleListed(piece([variant({ on_sale: true, full_price_jpy: 150000, stock_qty: 0 })])), false);
  assert.equal(saleListed(piece([variant({ on_sale: true, full_price_jpy: 150000 })], { status: "archived" })), false);
});

test("not on sale, or no full price: not listed", () => {
  assert.equal(saleListed(piece([variant({ on_sale: false, full_price_jpy: 150000 })])), false);
  assert.equal(saleListed(piece([variant({ on_sale: true, full_price_jpy: null })])), false);
  assert.equal(saleListed(piece([variant({ on_sale: true })])), false, "an older Hub without full_price_jpy");
  assert.equal(saleListed(piece([])), false, "no variants at all");
});

test("decided on the variant the card prices (the cheapest), like the card's Sale tag", () => {
  const cheapOnSale = piece([variant({ id: "a", price_jpy: 200000 }), variant({ id: "b", price_jpy: 90000, on_sale: true, full_price_jpy: 120000 })]);
  assert.equal(saleListed(cheapOnSale), true);
  const dearOnSale = piece([variant({ id: "a", price_jpy: 200000, on_sale: true, full_price_jpy: 260000 }), variant({ id: "b", price_jpy: 90000 })]);
  assert.equal(saleListed(dearOnSale), false, "a sale on a variant the card does not price is not this card's sale");
});

test("identical to the grid chip's previous inline rule on every fixture piece", () => {
  for (const p of fx.products) {
    const v = fromVariant(p);
    const sold = !isBuyable(productAvailability(p));
    const before = struckFullPrice({ full: v?.full_price_jpy, onSale: v?.on_sale, sold }) != null;
    assert.equal(saleListed(p), before, p.slug);
  }
  assert.ok(fx.products.some(saleListed), "the preview catalogue has sale pieces to show");
});

test("the chip, the /sale page and the header link all decide through saleListed", () => {
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const grid = strip(readFileSync("components/catalog/catalog-section.tsx", "utf8"));
  assert.match(grid, /sale: saleListed\(p\)/, "grid chip");
  assert.doesNotMatch(grid, /struckFullPrice/, "the chip no longer carries its own copy of the rule");
  assert.match(strip(readFileSync("app/sale/page.tsx", "utf8")), /\.filter\(saleListed\)/, "/sale page");
  const header = strip(readFileSync("components/site/header.tsx", "utf8"));
  assert.match(header, /\.filter\(saleListed\)\.length/, "header count");
  assert.match(header, /saleCount > 0 \? \[\{ href: "\/sale", label: t\("nav", "sale"\) \}\]/, "link only while something is on sale");
});
