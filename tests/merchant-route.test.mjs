// DP-08: the identifier rule as code and the Japanese-first feed route (mocked Hub, no network).
import { test } from "node:test";
import assert from "node:assert/strict";

const { hub } = await import("@/lib/hub-api");
const { CHA_IDENTIFIER_RULE } = await import("@/lib/merchant-identifiers");
const { identifierFields } = await import("@/lib/merchant-feed");
const { GET } = await import("../app/api/merchant-feed/route.ts");

const media = [{ url: "https://img.example.com/a.jpg", alt: null, sort: 0 }];
const variant = { id: "v", size: null, stone: null, price_jpy: 120000, full_price_jpy: null, on_sale: false, stock_qty: 1, product_media: media };
const P = (over = {}) => ({ id: "id-1", sku: "N1616", slug: "n1616", name: "N1616", name_ja: "N1616 ネックレス", karat: "K18", metals: ["K18"], status: "active", condition: "New", description_ja: "説明", description_en: "desc", product_variants: [variant], collection_slugs: ["necklaces"], origin: "JAPAN", brand: null, ...over });
const call = (url = "http://x/api/merchant-feed") => GET(new Request(url));

test("rule: own-made new piece -> brand Cha Jewels + MPN = SKU", () => {
  const r = identifierFields(P(), CHA_IDENTIFIER_RULE);
  assert.deepEqual(r, { fields: { brand: "Cha Jewels", mpn: "N1616" } });
});
test("rule: Hub brand always wins and, with no recorded MPN, the piece is EXCLUDED (never invented)", () => {
  assert.deepEqual(identifierFields(P({ origin: "BRAND", brand: "Louis Vuitton", condition: "Preloved" }), CHA_IDENTIFIER_RULE), { reason: "identifier_unknown" });
  assert.deepEqual(identifierFields(P({ origin: "BRAND", brand: "  ", condition: "New" }), CHA_IDENTIFIER_RULE), { reason: "identifier_unknown" }, "branded, name unknown: excluded, never identifier_exists=no");
});
test("rule: unbranded preloved, missing condition, blank SKU -> unknown/excluded, never identifier_exists=no", () => {
  for (const p of [P({ condition: "Preloved" }), P({ condition: undefined }), P({ sku: "  " })]) assert.deepEqual(identifierFields(p, CHA_IDENTIFIER_RULE), { reason: "identifier_unknown" });
});

const stub = (products, slugs = products.map((p) => ({ slug: p.slug }))) => Object.assign(hub, { allProducts: async () => products, productSlugs: async () => slugs });

test("route: 200 application/xml with counts, noindex, exclusions counted by reason; unsupported records excluded", async () => {
  stub([P(), P({ id: "id-2", slug: "lv-ring", sku: "R2595", origin: "BRAND", brand: "Louis Vuitton", condition: "Preloved" })]);
  const r = await call();
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /^application\/xml/);
  assert.equal(r.headers.get("x-feed-items"), "1");
  assert.equal(r.headers.get("x-feed-excluded"), "1");
  assert.equal(r.headers.get("x-feed-excluded-reasons"), "identifier_unknown=1");
  assert.equal(r.headers.get("x-robots-tag"), "noindex");
  const xml = await r.text();
  assert.ok(xml.includes("<g:brand>Cha Jewels</g:brand>") && xml.includes("<g:mpn>N1616</g:mpn>") && !xml.includes("identifier_exists"));
  assert.ok(xml.includes("/ja/products/n1616"), "Japanese links");
  assert.ok(!xml.includes("lv-ring"), "the excluded piece is not in the feed");
});
test("route: 503 no-store on a failed Hub read, a non-reconciling catalog, or a feed with no items", async () => {
  Object.assign(hub, { allProducts: async () => { throw new Error("down"); }, productSlugs: async () => [] });
  let r = await call(); assert.equal(r.status, 503); assert.equal(r.headers.get("cache-control"), "no-store");
  stub([P()], [{ slug: "n1616" }, { slug: "missing-slug" }]);
  r = await call(); assert.equal(r.status, 503); assert.match(await r.text(), /unaccounted/);
  stub([P({ condition: "Preloved" })]);
  r = await call(); assert.equal(r.status, 503); assert.match(await r.text(), /no items/);
  Object.assign(hub, { allProducts: async () => ({}), productSlugs: async () => [] });
  r = await call(); assert.equal(r.status, 503);
});
test("route: the English feed is not enabled (404); an invalid lang is 400; both no-store", async () => {
  stub([P()]);
  let r = await call("http://x/api/merchant-feed?lang=en"); assert.equal(r.status, 404); assert.equal(r.headers.get("cache-control"), "no-store");
  r = await call("http://x/api/merchant-feed?lang=fr"); assert.equal(r.status, 400);
});
