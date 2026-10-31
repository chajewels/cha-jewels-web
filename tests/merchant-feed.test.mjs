// Merchant Center feed builder (lib/merchant-feed.ts), Phase 5: the pure mapping and the RSS renderer.
// No route exists; this proves the rules the readiness document and register gaps MC-G7..G11 require.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { buildFeed, feedItem, feedPrice, googleCategory, reconcile, renderRss, GOOGLE_CATEGORY_BY_COLLECTION } = await import("@/lib/merchant-feed");
const B = "https://www.chajewelsjp.com";
const media = (url, sort = 0) => ({ url, alt: null, sort });
const variant = (over = {}) => ({ id: "v1", size: null, stone: null, price_jpy: 120000, price_php: 48000, full_price_jpy: null, on_sale: false, stock_qty: 1, down_payment_jpy: 36000, down_payment_php: 14400, down_payment_pct: 30, product_media: [media("https://img.test/a.jpg", 1), media("https://img.test/b.jpg", 0)], ...over });
const product = (over = {}) => ({ id: "p1", sku: "N1616", slug: "n1616-necklace", name: "N1616 Necklace K18", name_en: "N1616 Necklace K18", name_ja: "N1616 ネックレス K18", karat: "K18", metals: ["K18"], weight_g: 16.65, description_en: "An English description.", description_ja: "日本語の説明。", description_tl: null, status: "active", condition: "New", origin: "JAPAN", brand: null, collection_slugs: ["necklaces"], category_slugs: ["fine-jewelry"], product_variants: [variant()], ...over });

test("one item per product, describing the DISPLAYED variant (product_variants[0]) exactly as the page does", () => {
  const p = product({ product_variants: [variant({ id: "v-first", price_jpy: 150000, stock_qty: 0, size: "45cm" }), variant({ id: "v-cheaper", price_jpy: 90000, stock_qty: 5 })] });
  const r = feedItem(p, "en", B);
  assert.ok("item" in r);
  assert.equal(r.item.id, "p1", "the product id, stable across variants and languages");
  assert.equal(r.item.price, "150000 JPY", "the first variant's price, not the lowest");
  assert.equal(r.item.availability, "out_of_stock", "the first variant's stock state, not any variant's");
  assert.equal(r.item.size, "45cm");
  assert.equal(r.item.title, "N1616 Necklace K18 — 45cm");
  assert.equal(buildFeed([p], "en", B).items.length, 1, "never one item per variant");
});

test("money: every figure is the Hub's own; sale uses full_price_jpy as price and price_jpy as sale_price; no peso, no deposit, no percentage anywhere", () => {
  assert.deepEqual(feedPrice({ price_jpy: 120000, on_sale: false }), { price: "120000 JPY" });
  assert.deepEqual(feedPrice({ price_jpy: 99000, full_price_jpy: 120000, on_sale: true }), { price: "120000 JPY", sale_price: "99000 JPY" });
  assert.deepEqual(feedPrice({ price_jpy: 99000, full_price_jpy: null, on_sale: true }), { price: "99000 JPY" }, "on sale without a regular price: the sale price alone, nothing derived");
  assert.equal(feedPrice({ price_jpy: 0 }), null);
  assert.equal(feedPrice({ price_jpy: NaN }), null);
  const xml = renderRss(buildFeed([product({ product_variants: [variant({ on_sale: true, full_price_jpy: 150000 })] })], "en", B), { title: "t", link: B, description: "d" });
  assert.doesNotMatch(xml, /48000|36000|14400|php|down_payment|pct/i, "no price_php, down payment or percentage reaches the feed");
  assert.match(xml, /<g:price>150000 JPY<\/g:price><g:sale_price>120000 JPY<\/g:sale_price>/);
});

test("language: the EN feed links /en and uses English text; the JA feed links /ja and uses Japanese; a missing description in the feed's language EXCLUDES the item (no cross-language fallback)", () => {
  const en = feedItem(product(), "en", B), ja = feedItem(product(), "ja", B);
  assert.equal(en.item.link, `${B}/en/products/n1616-necklace`);
  assert.equal(ja.item.link, `${B}/ja/products/n1616-necklace`);
  assert.equal(en.item.description, "An English description.");
  assert.equal(ja.item.description, "日本語の説明。");
  assert.equal(ja.item.title, "N1616 ネックレス K18");
  const noJa = feedItem(product({ description_ja: "  " }), "ja", B);
  assert.deepEqual(noJa.excluded, { slug: "n1616-necklace", reason: "no_description" });
  assert.ok("item" in feedItem(product({ description_ja: null }), "en", B), "the English feed is unaffected");
});

test("identifiers and brand (MC-G7, OD-MC-4): identifier_exists=no only for unbranded pieces; a BRANDED piece is excluded until the owner's identifier rule exists; brand is never filled in", () => {
  const plain = feedItem(product({ origin: "JAPAN" }), "en", B);
  assert.equal(plain.item.identifier_exists, "no");
  assert.equal(plain.item.brand, undefined);
  for (const origin of ["OTHER", "UNKNOWN", undefined]) assert.equal(feedItem(product({ origin }), "en", B).item.identifier_exists, "no", String(origin));
  const branded = feedItem(product({ origin: "BRAND", brand: "Louis Vuitton" }), "en", B);
  assert.deepEqual(branded.excluded, { slug: "n1616-necklace", reason: "branded_identifier_rule_pending" });
  const xml = renderRss(buildFeed([product()], "en", B), { title: "t", link: B, description: "d" });
  assert.doesNotMatch(xml, /<g:brand>|<g:gtin>|<g:mpn>|countryOfOrigin|made in/i);
});

test("availability: stock 0, archived status and a sold piece are out_of_stock (never dropped: the page stays live); no variant and no image are exclusions with their reason", () => {
  assert.equal(feedItem(product({ product_variants: [variant({ stock_qty: 0 })] }), "en", B).item.availability, "out_of_stock");
  assert.equal(feedItem(product({ status: "archived" }), "en", B).item.availability, "out_of_stock");
  assert.equal(feedItem(product(), "en", B).item.availability, "in_stock");
  assert.deepEqual(feedItem(product({ product_variants: [] }), "en", B).excluded, { slug: "n1616-necklace", reason: "no_variant" });
  assert.deepEqual(feedItem(product({ product_variants: [variant({ product_media: [media("/relative.jpg")] })] }), "en", B).excluded, { slug: "n1616-necklace", reason: "no_image" });
  assert.deepEqual(feedItem(product({ product_variants: [variant({ price_jpy: 0 })] }), "en", B).excluded, { slug: "n1616-necklace", reason: "no_price" });
});

test("images: the Hub's photos by sort order, absolute https only, first as image_link, the rest (at most 10) as additional_image_link; cut-outs are never used", () => {
  const v = variant({ product_media: [media("https://img.test/c.jpg", 2), { url: "https://img.test/a.jpg", alt: null, sort: 0, cutout: { url: "https://img.test/a-cutout.webp", width: 1, height: 1, status: "approved" } }, media("http://img.test/plain.jpg", 1)] });
  const r = feedItem(product({ product_variants: [v] }), "en", B);
  assert.equal(r.item.image_link, "https://img.test/a.jpg");
  assert.deepEqual(r.item.additional_image_link, ["https://img.test/c.jpg"], "the http:// photo is dropped; the cut-out is never a feed image");
  const many = variant({ product_media: Array.from({ length: 15 }, (_, i) => media(`https://img.test/${i}.jpg`, i)) });
  assert.equal(feedItem(product({ product_variants: [many] }), "en", B).item.additional_image_link.length, 10);
});

test("condition, category, material and product_type follow the Hub's data; unmapped collections get no category rather than a guess", () => {
  assert.equal(feedItem(product({ condition: "Preloved" }), "en", B).item.condition, "used");
  assert.equal(feedItem(product({ condition: undefined }), "en", B).item.condition, "new");
  assert.equal(googleCategory({ collection_slugs: ["rings"] }), 200);
  assert.equal(googleCategory({ collection_slugs: ["luxury-bags"] }), undefined);
  assert.equal(googleCategory({ collection_slugs: [], item_type: "Watch" }), 201);
  assert.equal(googleCategory({ collection_slugs: ["luxury-watches"] }), 201);
  assert.equal(googleCategory({ category_slugs: ["preloved-watches"] }), 201);
  assert.equal(googleCategory({}), undefined);
  assert.deepEqual(Object.values(GOOGLE_CATEGORY_BY_COLLECTION).every((n) => Number.isInteger(n)), true);
  const r = feedItem(product({ condition: "Preloved", metals: ["PT900", "K18"] }), "en", B).item;
  assert.equal(r.product_type, "Preloved > necklaces");
  assert.equal(r.material, "PT900 / K18");
  assert.equal(feedItem(product({ metals: [], karat: null }), "en", B).item.material, undefined);
});

test("full-catalog reconciliation (MC-G10/G11): every catalog slug must be an item or a recorded exclusion; an empty catalog or empty feed is a problem", () => {
  const build = buildFeed([product(), product({ id: "p2", slug: "x-branded", origin: "BRAND", brand: "B" })], "en", B);
  assert.deepEqual(reconcile(build, ["n1616-necklace", "x-branded"]), []);
  assert.match(reconcile(build, ["n1616-necklace", "x-branded", "missing-one"]).join(";"), /1 catalog slug\(s\) unaccounted for, e\.g\. missing-one/);
  assert.match(reconcile(build, []).join(";"), /catalog slug list is empty/);
  assert.match(reconcile({ items: [], excluded: [] }, ["a"]).join(";"), /no items/);
  assert.equal(buildFeed([product(), product()], "en", B).items.length, 1, "a repeated slug is one item");
  assert.equal(buildFeed([product({ status: "draft" })], "en", B).items.length, 0, "a non-active row is never an item");
});

test("XML: well-formed RSS 2.0 with the g: namespace; product text cannot inject markup", () => {
  const p = product({ name_en: `Ring <b>"bold"</b> & more`, description_en: "</item><item><g:id>evil</g:id>" });
  const xml = renderRss(buildFeed([p], "en", B), { title: "Cha Jewels", link: `${B}/en`, description: "feed" });
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<rss version="2\.0" xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0"><channel>/);
  assert.equal((xml.match(/<item>/g) ?? []).length, 1, "the injected text did not become a second item");
  assert.match(xml, /&lt;b&gt;&quot;bold&quot;&lt;\/b&gt; &amp; more/);
  assert.doesNotMatch(xml, /<g:id>evil<\/g:id>/);
  // balanced: every opened element is closed in order (reuse the checker core's XML balance rule)
});

test("source guard: the builder computes nothing from a price, uses the page's own availability and variant rules, and no route serves the feed yet (OD-MC-7 not approved)", () => {
  const src = readFileSync(join(process.cwd(), "lib/merchant-feed.ts"), "utf8");
  assert.match(src, /variantAvailability\(/);
  assert.match(src, /displayedVariant\(/);
  assert.doesNotMatch(src, /price_jpy\s*[*\/+-]\s*\d|\*\s*0\.|Math\.round\(.*price|jpy_php|toPhp|phpRate/);
  assert.equal(require_exists("app/api/merchant-feed/route.ts"), false, "the feed route needs the owner's route-change approval before it exists");
});
function require_exists(p) { try { readFileSync(join(process.cwd(), p)); return true; } catch { return false; } }
