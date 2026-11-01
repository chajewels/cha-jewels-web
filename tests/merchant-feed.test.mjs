// Merchant Center feed builder (lib/merchant-feed.ts), Phase 5: the pure mapping and the RSS renderer.
// No route exists; this proves the rules the readiness document and register gaps MC-G7..G11 require, and the
// 2026-11-01 corrections: identifiers are evidence from an explicit rule (never a default), unknown states are
// exclusions (never assumptions), nothing is silently skipped, and reconciliation is exact membership.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { buildFeed, feedItem, feedPrice, googleCategory, identifierFields, hubBrand, reconcile, renderRss, GOOGLE_CATEGORY_BY_COLLECTION, IDENTIFIERS_UNDECIDED } = await import("@/lib/merchant-feed");
const B = "https://www.chajewelsjp.com";
/** A TEST rule standing in for the owner's OD-MC-11 rule: "no brand, no code" for every piece. Not a product decision. */
const NONE = () => ({ brand: { kind: "none" }, codes: { kind: "none" } });
const EV = (brand, codes) => () => ({ brand, codes });
const media = (url, sort = 0) => ({ url, alt: null, sort });
const variant = (over = {}) => ({ id: "v1", size: null, stone: null, price_jpy: 120000, price_php: 48000, full_price_jpy: null, on_sale: false, stock_qty: 1, down_payment_jpy: 36000, down_payment_php: 14400, down_payment_pct: 30, product_media: [media("https://img.test/a.jpg", 1), media("https://img.test/b.jpg", 0)], ...over });
const product = (over = {}) => ({ id: "p1", sku: "N1616", slug: "n1616-necklace", name: "N1616 Necklace K18", name_en: "N1616 Necklace K18", name_ja: "N1616 ネックレス K18", karat: "K18", metals: ["K18"], weight_g: 16.65, description_en: "An English description.", description_ja: "日本語の説明。", description_tl: null, status: "active", condition: "New", origin: "JAPAN", brand: null, collection_slugs: ["necklaces"], category_slugs: ["fine-jewelry"], product_variants: [variant()], ...over });

test("one item per product, describing the DISPLAYED variant (product_variants[0]) exactly as the page does", () => {
  const p = product({ product_variants: [variant({ id: "v-first", price_jpy: 150000, stock_qty: 0, size: "45cm" }), variant({ id: "v-cheaper", price_jpy: 90000, stock_qty: 5 })] });
  const r = feedItem(p, "en", B, NONE);
  assert.ok("item" in r);
  assert.equal(r.item.id, "p1", "the product id, stable across variants and languages");
  assert.equal(r.item.price, "150000 JPY", "the first variant's price, not the lowest");
  assert.equal(r.item.availability, "out_of_stock", "the first variant's stock state, not any variant's");
  assert.equal(r.item.size, "45cm");
  assert.equal(r.item.title, "N1616 Necklace K18 — 45cm");
  assert.equal(buildFeed([p], "en", B, NONE).items.length, 1, "never one item per variant");
});

test("money: every figure is the Hub's own; sale uses full_price_jpy as price and price_jpy as sale_price; no peso, no deposit, no percentage anywhere", () => {
  assert.deepEqual(feedPrice({ price_jpy: 120000, on_sale: false }), { price: "120000 JPY" });
  assert.deepEqual(feedPrice({ price_jpy: 99000, full_price_jpy: 120000, on_sale: true }), { price: "120000 JPY", sale_price: "99000 JPY" });
  assert.deepEqual(feedPrice({ price_jpy: 99000, full_price_jpy: null, on_sale: true }), { price: "99000 JPY" }, "on sale without a regular price: the sale price alone, nothing derived");
  assert.equal(feedPrice({ price_jpy: 0 }), null);
  assert.equal(feedPrice({ price_jpy: NaN }), null);
  const xml = renderRss(buildFeed([product({ product_variants: [variant({ on_sale: true, full_price_jpy: 150000 })] })], "en", B, NONE), { title: "t", link: B, description: "d" });
  assert.doesNotMatch(xml, /48000|36000|14400|php|down_payment|pct/i, "no price_php, down payment or percentage reaches the feed");
  assert.match(xml, /<g:price>150000 JPY<\/g:price><g:sale_price>120000 JPY<\/g:sale_price>/);
});

test("language: the EN feed links /en and uses English text; the JA feed links /ja and uses Japanese; a missing description in the feed's language EXCLUDES the item (no cross-language fallback)", () => {
  const en = feedItem(product(), "en", B, NONE), ja = feedItem(product(), "ja", B, NONE);
  assert.equal(en.item.link, `${B}/en/products/n1616-necklace`);
  assert.equal(ja.item.link, `${B}/ja/products/n1616-necklace`);
  assert.equal(en.item.description, "An English description.");
  assert.equal(ja.item.description, "日本語の説明。");
  assert.equal(ja.item.title, "N1616 ネックレス K18");
  const noJa = feedItem(product({ description_ja: "  " }), "ja", B, NONE);
  assert.deepEqual(noJa.excluded, { slug: "n1616-necklace", reason: "no_description" });
  assert.ok("item" in feedItem(product({ description_ja: null }), "en", B, NONE), "the English feed is unaffected");
});

test("identifiers are EVIDENCE from an explicit rule, never a default (reproduced: identifier_exists=no was hard-coded): with no rule every product is UNKNOWN and excluded; the feed is empty", () => {
  assert.deepEqual(IDENTIFIERS_UNDECIDED(product()), { brand: null, codes: null });
  const b = buildFeed([product(), product({ id: "p2", slug: "r-1" })], "en", B, IDENTIFIERS_UNDECIDED);
  assert.equal(b.items.length, 0);
  assert.deepEqual(b.excluded.map((e) => e.reason), ["identifier_unknown", "identifier_unknown"]);
  assert.match(reconcile(b, ["n1616-necklace", "r-1"]).join(";"), /no items/, "an empty feed is never served");
  assert.throws(() => feedItem(product(), "en", B), /not a function/, "a rule is required; there is no implicit one");
});

test("brand evidence and code evidence are two axes (reproduced on 1b654f7: one 'none' answer covered both): UNKNOWN on either axis excludes; the Hub's brand always wins", () => {
  // unknown on one axis only
  assert.deepEqual(identifierFields(product(), EV({ kind: "none" }, null)), { reason: "identifier_unknown" }, "codes unknown");
  assert.deepEqual(identifierFields(product(), EV(null, { kind: "none" })), { reason: "identifier_unknown" }, "brand unknown");
  // no brand, no code → identifier_exists=no (Google: only when certain no identifier is assigned)
  assert.deepEqual(identifierFields(product({ origin: "JAPAN" }), NONE), { fields: { identifier_exists: "no" } });
  for (const origin of ["OTHER", "UNKNOWN", undefined]) assert.deepEqual(identifierFields(product({ origin }), NONE), { fields: { identifier_exists: "no" } }, String(origin));
  // the Hub's brand is evidence: the rule may leave brand unknown (Hub wins) or confirm it; "none" or another name is a conflict
  const lv = product({ origin: "BRAND", brand: "Louis Vuitton" });
  assert.deepEqual(identifierFields(lv, EV(null, { kind: "codes", mpn: "M62631" })), { fields: { brand: "Louis Vuitton", mpn: "M62631" } }, "brand from the Hub, MPN from the rule");
  assert.deepEqual(identifierFields(lv, EV({ kind: "brand", name: "Louis Vuitton" }, { kind: "codes", mpn: "M62631" })), { fields: { brand: "Louis Vuitton", mpn: "M62631" } });
  assert.deepEqual(identifierFields(lv, NONE), { reason: "identifier_conflict" }, "'no brand' for a Hub-branded piece");
  assert.deepEqual(identifierFields(lv, EV({ kind: "brand", name: "Dior" }, { kind: "none" })), { reason: "identifier_conflict" }, "a different brand than the Hub's");
  assert.deepEqual(identifierFields(product({ origin: "JAPAN", brand: "Mikimoto" }), NONE), { reason: "identifier_conflict" }, "any non-empty Hub brand is brand evidence");
  assert.deepEqual(identifierFields(lv, EV(null, null)), { reason: "identifier_unknown" }, "a Hub brand with unknown codes is still unknown (a branded piece may carry a manufacturer MPN)");
  assert.deepEqual(identifierFields(lv, EV(null, { kind: "none" })), { fields: { brand: "Louis Vuitton" } }, "brand with no code: brand alone (Google: MPN optional only when none is clearly associated; the owner's rule asserts that)");
  // own-made pieces: Google's path is the store name as brand plus an MPN of the merchant's choosing (e.g. the SKU)
  assert.deepEqual(identifierFields(product(), EV({ kind: "brand", name: "Cha Jewels" }, { kind: "codes", mpn: "N1616" })), { fields: { brand: "Cha Jewels", mpn: "N1616" } });
  // code-axis conflicts
  assert.deepEqual(identifierFields(product(), EV({ kind: "none" }, { kind: "codes", mpn: "M-1" })), { reason: "identifier_conflict" }, "an MPN needs a brand");
  assert.deepEqual(identifierFields(product(), EV({ kind: "none" }, { kind: "codes" })), { reason: "identifier_conflict" }, "'codes' with no code is not evidence");
  assert.deepEqual(identifierFields(product(), EV({ kind: "brand", name: " " }, { kind: "none" })), { reason: "identifier_conflict" }, "a blank brand name is not evidence");
  assert.deepEqual(identifierFields(product(), EV({ kind: "none" }, { kind: "codes", gtin: "4901234567894" })), { fields: { gtin: "4901234567894" } }, "a GTIN alone is a valid identifier");
  // rendered
  const branded = feedItem(lv, "en", B, NONE);
  assert.deepEqual(branded.excluded, { slug: "n1616-necklace", reason: "identifier_conflict" });
  const xmlNone = renderRss(buildFeed([product()], "en", B, NONE), { title: "t", link: B, description: "d" });
  assert.match(xmlNone, /<g:identifier_exists>no<\/g:identifier_exists>/);
  assert.doesNotMatch(xmlNone, /<g:brand>|<g:gtin>|<g:mpn>|countryOfOrigin|made in/i);
  const xmlIds = renderRss(buildFeed([lv], "en", B, EV(null, { kind: "codes", mpn: "M1" })), { title: "t", link: B, description: "d" });
  assert.match(xmlIds, /<g:brand>Louis Vuitton<\/g:brand><g:mpn>M1<\/g:mpn>/);
  assert.doesNotMatch(xmlIds, /identifier_exists/);
});

test("unknown is excluded, not assumed (reproduced: a missing condition became 'new'; a non-active row vanished without a record): status, condition, slug and repeats are recorded exclusions", () => {
  assert.deepEqual(feedItem(product({ condition: undefined }), "en", B, NONE).excluded, { slug: "n1616-necklace", reason: "condition_unknown" });
  assert.deepEqual(feedItem(product({ condition: "Mint" }), "en", B, NONE).excluded, { slug: "n1616-necklace", reason: "condition_unknown" });
  assert.deepEqual(feedItem(product({ status: undefined }), "en", B, NONE).excluded, { slug: "n1616-necklace", reason: "status_unknown" });
  assert.deepEqual(feedItem(product({ status: "draft" }), "en", B, NONE).excluded, { slug: "n1616-necklace", reason: "not_active" });
  assert.deepEqual(feedItem(product({ status: "archived" }), "en", B, NONE).excluded, { slug: "n1616-necklace", reason: "not_active" });
  assert.deepEqual(feedItem(product({ slug: " " }), "en", B, NONE).excluded, { slug: "N1616", reason: "no_slug" });
  const b = buildFeed([product(), product({ id: "p-dupe" }), product({ status: "draft", id: "p3", slug: "d-1" })], "en", B, NONE);
  assert.equal(b.items.length, 1);
  assert.deepEqual(b.excluded, [{ slug: "n1616-necklace", reason: "duplicate_slug" }, { slug: "d-1", reason: "not_active" }]);
  assert.deepEqual(b.membership, [{ slug: "n1616-necklace", outcome: "item" }, { slug: "n1616-necklace", outcome: "duplicate_slug" }, { slug: "d-1", outcome: "not_active" }], "every input row is accounted for, in order");
});

test("availability: stock 0 and a sold piece are out_of_stock (never dropped: the page stays live); no variant, no image and no price are exclusions with their reason", () => {
  assert.equal(feedItem(product({ product_variants: [variant({ stock_qty: 0 })] }), "en", B, NONE).item.availability, "out_of_stock");
  assert.equal(feedItem(product(), "en", B, NONE).item.availability, "in_stock");
  assert.deepEqual(feedItem(product({ product_variants: [] }), "en", B, NONE).excluded, { slug: "n1616-necklace", reason: "no_variant" });
  assert.deepEqual(feedItem(product({ product_variants: [variant({ product_media: [media("/relative.jpg")] })] }), "en", B, NONE).excluded, { slug: "n1616-necklace", reason: "no_image" });
  assert.deepEqual(feedItem(product({ product_variants: [variant({ price_jpy: 0 })] }), "en", B, NONE).excluded, { slug: "n1616-necklace", reason: "no_price" });
});

test("images: the Hub's photos by sort order, absolute https only, first as image_link, the rest (at most 10) as additional_image_link; cut-outs are never used", () => {
  const v = variant({ product_media: [media("https://img.test/c.jpg", 2), { url: "https://img.test/a.jpg", alt: null, sort: 0, cutout: { url: "https://img.test/a-cutout.webp", width: 1, height: 1, status: "approved" } }, media("http://img.test/plain.jpg", 1)] });
  const r = feedItem(product({ product_variants: [v] }), "en", B, NONE);
  assert.equal(r.item.image_link, "https://img.test/a.jpg");
  assert.deepEqual(r.item.additional_image_link, ["https://img.test/c.jpg"], "the http:// photo is dropped; the cut-out is never a feed image");
  const many = variant({ product_media: Array.from({ length: 15 }, (_, i) => media(`https://img.test/${i}.jpg`, i)) });
  assert.equal(feedItem(product({ product_variants: [many] }), "en", B, NONE).item.additional_image_link.length, 10);
});

test("condition, category, material and product_type follow the Hub's data; unmapped collections get no category rather than a guess", () => {
  assert.equal(feedItem(product({ condition: "Preloved" }), "en", B, NONE).item.condition, "used");
  assert.equal(feedItem(product({ condition: "New" }), "en", B, NONE).item.condition, "new");
  assert.equal(googleCategory({ collection_slugs: ["rings"] }), 200);
  assert.equal(googleCategory({ collection_slugs: ["luxury-bags"] }), undefined);
  assert.equal(googleCategory({ collection_slugs: [], item_type: "Watch" }), 201);
  assert.equal(googleCategory({ collection_slugs: ["luxury-watches"] }), 201);
  assert.equal(googleCategory({ category_slugs: ["preloved-watches"] }), 201);
  assert.equal(googleCategory({}), undefined);
  assert.deepEqual(Object.values(GOOGLE_CATEGORY_BY_COLLECTION).every((n) => Number.isInteger(n)), true);
  const r = feedItem(product({ condition: "Preloved", metals: ["PT900", "K18"] }), "en", B, NONE).item;
  assert.equal(r.product_type, "Preloved > necklaces");
  assert.equal(r.material, "PT900 / K18");
  assert.equal(feedItem(product({ metals: [], karat: null }), "en", B, NONE).item.material, undefined);
});

test("reconciliation is EXACT membership (MC-G10/G11): missing, extra, repeated and blank slugs, rows without a slug, duplicate rows, an empty catalog or empty feed, and an authoritative-total mismatch are each a problem", () => {
  const build = buildFeed([product(), product({ id: "p2", slug: "x-branded", origin: "BRAND", brand: "B" })], "en", B, NONE);
  assert.deepEqual(reconcile(build, ["n1616-necklace", "x-branded"]), [], "an excluded slug still counts as accounted for");
  assert.match(reconcile(build, ["n1616-necklace", "x-branded", "missing-one"]).join(";"), /1 catalog slug\(s\) unaccounted for, e\.g\. missing-one/);
  assert.match(reconcile(build, ["n1616-necklace"]).join(";"), /1 slug\(s\) in the feed read but not in the catalog list, e\.g\. x-branded/, "reproduced: an extra slug used to pass");
  assert.match(reconcile(build, ["n1616-necklace", "x-branded", "x-branded"]).join(";"), /1 repeated slug\(s\) in the catalog list/);
  assert.match(reconcile(build, ["n1616-necklace", "x-branded", " "]).join(";"), /1 blank slug\(s\) in the catalog list/);
  assert.match(reconcile(build, []).join(";"), /catalog slug list is empty/);
  assert.match(reconcile({ items: [], excluded: [], membership: [] }, ["a"]).join(";"), /no items/);
  assert.match(reconcile(build, ["n1616-necklace", "x-branded"], { authoritativeTotal: 453 }).join(";"), /catalog list has 2 slug\(s\) but the authoritative total is 453/);
  assert.deepEqual(reconcile(build, ["n1616-necklace", "x-branded"], { authoritativeTotal: 2 }), []);
  assert.deepEqual(reconcile(build, ["n1616-necklace", "x-branded"], { authoritativeTotal: null }), [], "no authoritative total today (OD-MC-12): the check is skipped, not faked");
  const dupes = buildFeed([product(), product({ id: "p-dupe" })], "en", B, NONE);
  assert.match(reconcile(dupes, ["n1616-necklace"]).join(";"), /1 repeated slug\(s\) in the catalog read, e\.g\. n1616-necklace/, "reproduced: a repeated row was silently dropped and the feed served");
  const noSlug = buildFeed([product(), product({ id: "p-x", slug: "" })], "en", B, NONE);
  assert.match(reconcile(noSlug, ["n1616-necklace"]).join(";"), /1 input row\(s\) without a slug/);
});

test("XML: well-formed RSS 2.0 with the g: namespace; product text cannot inject markup", () => {
  const p = product({ name_en: `Ring <b>"bold"</b> & more`, description_en: "</item><item><g:id>evil</g:id>" });
  const xml = renderRss(buildFeed([p], "en", B, NONE), { title: "Cha Jewels", link: `${B}/en`, description: "feed" });
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<rss version="2\.0" xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0"><channel>/);
  assert.equal((xml.match(/<item>/g) ?? []).length, 1, "the injected text did not become a second item");
  assert.match(xml, /&lt;b&gt;&quot;bold&quot;&lt;\/b&gt; &amp; more/);
  assert.doesNotMatch(xml, /<g:id>evil<\/g:id>/);
});

test("source guard: the builder computes nothing from a price, uses the page's own availability and variant rules, ships no identifier default, and no route serves the feed (OD-MC-7 not approved)", () => {
  const src = readFileSync(join(process.cwd(), "lib/merchant-feed.ts"), "utf8");
  assert.match(src, /variantAvailability\(/);
  assert.match(src, /displayedVariant\(/);
  assert.doesNotMatch(src, /price_jpy\s*[*\/+-]\s*\d|\*\s*0\.|Math\.round\(.*price|jpy_php|toPhp|phpRate/);
  assert.doesNotMatch(src, /identifiers\s*:\s*IdentifierRule\s*=|identifiers\s*=\s*IDENTIFIERS_UNDECIDED/, "no default identifier rule parameter");
  assert.equal(hubBrand({ origin: "BRAND", brand: " Louis Vuitton " }), "Louis Vuitton");
  assert.equal(hubBrand({ origin: "JAPAN", brand: null }), undefined);
  assert.doesNotMatch(src, /condition === "Preloved" \? "used" : "new"[^;]*\?\?/, "no condition fallback");
  assert.equal(require_exists("app/api/merchant-feed/route.ts"), false, "the feed route needs the owner's route-change approval before it exists");
});
function require_exists(p) { try { readFileSync(join(process.cwd(), p)); return true; } catch { return false; } }
