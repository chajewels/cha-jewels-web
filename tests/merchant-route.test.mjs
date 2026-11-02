// DP-08 (corrected 2026-11-02): confirmed-evidence identifier rule + the Japanese feed handler. Mocked upstream, no network.
import { test } from "node:test";
import assert from "node:assert/strict";

const { hub } = await import("@/lib/hub-api");
const { makeIdentifierRule, CHA_IDENTIFIER_RULE } = await import("@/lib/merchant-identifiers");
const { CONFIRMED_IDENTIFIERS } = await import("@/lib/merchant-confirmed-identifiers");
const { identifierFields } = await import("@/lib/merchant-feed");
const { serveFeed, productRowProblem, CATALOG_LIMIT } = await import("@/lib/merchant-feed-handler");
const { GET } = await import("../app/api/merchant-feed/route.ts");

const media = [{ url: "https://img.example.com/a.jpg", alt: null, sort: 0 }];
const variant = { id: "v", size: null, stone: null, price_jpy: 120000, full_price_jpy: null, on_sale: false, stock_qty: 1, product_media: media };
const P = (over = {}) => ({ id: "id-1", sku: "N1616", slug: "n1616", name: "N1616", name_ja: "N1616 ネックレス", karat: "K18", metals: ["K18"], status: "active", condition: "New", description_ja: "説明", description_en: "desc", product_variants: [variant], collection_slugs: ["necklaces"], origin: "JAPAN", brand: null, ...over });
const REG = { N1616: { brand: "Cha Jewels", mpn: "N1616", note: "test fixture, not an owner confirmation" } };
const rule = makeIdentifierRule(REG);
const req = (q = "") => new Request(`http://x/api/merchant-feed${q}`);
const deps = (products, slugs = Array.isArray(products) ? products.map((p) => ({ slug: p?.slug })) : [], r = rule) => ({ readProducts: async () => products, readSlugs: async () => slugs, rule: r, base: "https://www.chajewelsjp.com" });

// ---- the rule: confirmed evidence only, NO inference
test("the shipped registry is EMPTY: no owner confirmation exists yet", () => { assert.deepEqual(CONFIRMED_IDENTIFIERS, {}); });
test("rule: a SKU in the registry is described with its confirmed brand and MPN", () => {
  assert.deepEqual(identifierFields(P(), rule), { fields: { brand: "Cha Jewels", mpn: "N1616" } });
});
test("rule: NO inference — New + no Hub brand + a SKU is NOT own-made; unconfirmed pieces are unknown", () => {
  for (const p of [P({ sku: "OTHER-1" }), P({ sku: "X", condition: "New", origin: "JAPAN", brand: null }), P({ sku: "Y", condition: "Preloved" }), P({ sku: "Z", origin: "BRAND", brand: "Louis Vuitton" }), P({ sku: "W", origin: "BRAND", brand: "  " })])
    assert.deepEqual(identifierFields(p, rule), { reason: "identifier_unknown" }, p.sku);
  assert.deepEqual(identifierFields(P(), CHA_IDENTIFIER_RULE), { reason: "identifier_unknown" }, "with the shipped empty registry even N1616 is unknown");
});
test("rule: an incomplete registry entry (no note, or no code) confirms nothing; a Hub-brand mismatch is a conflict", () => {
  assert.deepEqual(identifierFields(P(), makeIdentifierRule({ N1616: { brand: "Cha Jewels", mpn: "N1616", note: " " } })), { reason: "identifier_unknown" });
  assert.deepEqual(identifierFields(P(), makeIdentifierRule({ N1616: { brand: "Cha Jewels", note: "x" } })), { reason: "identifier_unknown" });
  assert.deepEqual(identifierFields(P({ origin: "BRAND", brand: "Louis Vuitton" }), rule), { reason: "identifier_conflict" }, "the Hub names another brand");
  assert.deepEqual(identifierFields(P({ sku: "toString" }), rule), { reason: "identifier_unknown" }, "no prototype lookups");
});

// ---- the handler
test("success: 200 application/xml, counts, reasons, noindex; unconfirmed pieces excluded with an explicit reason", async () => {
  const r = await serveFeed(req(), deps([P(), P({ id: "id-2", slug: "lv-ring", sku: "R2595", origin: "BRAND", brand: "Louis Vuitton", condition: "Preloved" })]));
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /^application\/xml/);
  assert.equal(r.headers.get("x-feed-items"), "1");
  assert.equal(r.headers.get("x-feed-excluded"), "1");
  assert.equal(r.headers.get("x-feed-excluded-reasons"), "identifier_unknown=1");
  assert.equal(r.headers.get("x-robots-tag"), "noindex");
  assert.match(r.headers.get("x-feed-completeness"), /read-limit-5000-not-reached/);
  const xml = await r.text();
  assert.ok(xml.includes("<g:brand>Cha Jewels</g:brand>") && xml.includes("<g:mpn>N1616</g:mpn>") && !xml.includes("identifier_exists"));
  assert.ok(xml.includes("/ja/products/n1616") && !xml.includes("lv-ring"));
});
test("other exclusions are counted by their own reason (no description, no price, no image, status, condition)", async () => {
  const reg = makeIdentifierRule(Object.fromEntries(["A", "B", "C", "D", "E", "F"].map((s) => [s, { brand: "Cha Jewels", mpn: s, note: "t" }])));
  const ps = [P({ sku: "A", slug: "a" }), P({ sku: "B", slug: "b", description_ja: null }), P({ sku: "C", slug: "c", product_variants: [] }), P({ sku: "D", slug: "d", product_variants: [{ ...variant, product_media: [] }] }), P({ sku: "E", slug: "e", status: "draft" }), P({ sku: "F", slug: "f", condition: undefined })];
  const r = await serveFeed(req(), deps(ps, undefined, reg));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-feed-items"), "1");
  assert.equal(r.headers.get("x-feed-excluded-reasons"), "condition_unknown=1,no_description=1,no_image=1,no_variant=1,not_active=1");
});
test("malformed upstream data -> controlled 503 no-store; no row data leaked", async () => {
  const bad = [
    ["products not a list", { error: "x" }, undefined],
    ["a row that is a string", ["secret-row"], [{ slug: "x" }]],
    ["row without a slug", [{ sku: "N1616" }], []],
    ["slug of the wrong type", [{ slug: 7 }], []],
    ["description of the wrong type", [P({ description_ja: 5 })], undefined],
    ["variants not a list", [P({ product_variants: "nope" })], undefined],
    ["variant price not a number", [P({ product_variants: [{ ...variant, price_jpy: "120000" }] })], undefined],
    ["media not a list", [P({ product_variants: [{ ...variant, product_media: "x" }] })], undefined],
    ["collection_slugs not strings", [P({ collection_slugs: [1] })], undefined],
  ];
  for (const [label, products, slugs] of bad) {
    const r = await serveFeed(req(), deps(products, slugs ?? []));
    assert.equal(r.status, 503, label); assert.equal(r.headers.get("cache-control"), "no-store", label); assert.equal(r.headers.get("x-robots-tag"), "noindex", label);
    assert.ok(!(await r.text()).includes("secret-row"), label);
  }
  let r = await serveFeed(req(), deps([P()], { not: "a list" })); assert.equal(r.status, 503);
  r = await serveFeed(req(), deps([P()], [{ slug: 3 }])); assert.equal(r.status, 503);
  r = await serveFeed(req(), deps([P()], [null])); assert.equal(r.status, 503);
  assert.equal(productRowProblem(P()), null);
});
test("a throwing builder input is a controlled 503, not a 500", async () => {
  const hostile = P(); Object.defineProperty(hostile, "description_ja", { get() { throw new Error("boom"); }, enumerable: true });
  const r = await serveFeed(req(), deps([hostile], [{ slug: "n1616" }]));
  assert.equal(r.status, 503); assert.equal(r.headers.get("cache-control"), "no-store");
});
test("retrieval failure (either read) -> 503 no-store", async () => {
  for (const d of [{ ...deps([P()]), readProducts: async () => { throw new Error("down"); } }, { ...deps([P()]), readSlugs: async () => { throw new Error("down"); } }]) {
    const r = await serveFeed(req(), d); assert.equal(r.status, 503); assert.equal(r.headers.get("cache-control"), "no-store"); assert.match(await r.text(), /unavailable/);
  }
});
test("completeness: a catalog slug the build did not see, an extra slug, a repeated slug, and a feed with no items are all 503", async () => {
  let r = await serveFeed(req(), deps([P()], [{ slug: "n1616" }, { slug: "missing" }])); assert.equal(r.status, 503); assert.match(await r.text(), /unaccounted/);
  r = await serveFeed(req(), deps([P(), P({ id: "i2", slug: "extra", sku: "Q" })], [{ slug: "n1616" }])); assert.equal(r.status, 503);
  r = await serveFeed(req(), deps([P(), P()], [{ slug: "n1616" }])); assert.equal(r.status, 503);
  r = await serveFeed(req(), deps([P({ sku: "none" })], undefined)); assert.equal(r.status, 503); assert.match(await r.text(), /no items/);
});
test("completeness boundary: below the API read limit is served, AT the limit is refused (the API has no offset or total)", async () => {
  const mk = (n) => Array.from({ length: n }, (_, i) => P({ id: `id${i}`, slug: `s${i}`, sku: `S${i}` }));
  const reg = makeIdentifierRule(Object.fromEntries(Array.from({ length: CATALOG_LIMIT + 1 }, (_, i) => [`S${i}`, { brand: "Cha Jewels", mpn: `S${i}`, note: "t" }])));
  let r = await serveFeed(req(), deps(mk(CATALOG_LIMIT - 1), undefined, reg)); assert.equal(r.status, 200); assert.equal(r.headers.get("x-feed-items"), String(CATALOG_LIMIT - 1));
  r = await serveFeed(req(), deps(mk(CATALOG_LIMIT), undefined, reg)); assert.equal(r.status, 503); assert.match(await r.text(), /reached its limit/);
  r = await serveFeed(req(), deps([P()], Array.from({ length: CATALOG_LIMIT }, (_, i) => ({ slug: `s${i}` })), rule)); assert.equal(r.status, 503);
});
test("lang: English is not enabled (404), an invalid lang is 400; both no-store", async () => {
  let r = await serveFeed(req("?lang=en"), deps([P()])); assert.equal(r.status, 404); assert.equal(r.headers.get("cache-control"), "no-store");
  r = await serveFeed(req("?lang=fr"), deps([P()])); assert.equal(r.status, 400);
});
test("the real route with the shipped (empty) registry answers the truthful 503 'no items' — never an empty 200", async () => {
  Object.assign(hub, { allProducts: async () => [P()], productSlugs: async () => [{ slug: "n1616" }] });
  const r = await GET(req()); assert.equal(r.status, 503); assert.match(await r.text(), /no items/);
});
