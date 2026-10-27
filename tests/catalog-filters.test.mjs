// CATALOG FILTER URLS (owner report 2026-10-17: filters not carried in shared
// collection links): the toolbar's filters read from and written to the
// query string (lib/catalog-filters.ts). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { DEFAULT_FILTERS, parseCatalogFilters, catalogFiltersToSearch } = await import("@/lib/catalog-filters");

const ALL = { types: ["Jewelry", "Watch", "Accessory"], metals: ["K18", "PT900", "SILVER925"] };

test("empty string → defaults", () => {
  assert.deepEqual(parseCatalogFilters("", ALL), DEFAULT_FILTERS);
  assert.deepEqual(parseCatalogFilters("?", ALL), DEFAULT_FILTERS);
});

test("cond and metal; metal matched case-insensitively, returned in the allowed spelling", () => {
  const f = parseCatalogFilters("?cond=preloved&metal=k18", { types: [], metals: ["K18", "PT900"] });
  assert.equal(f.cond, "preloved");
  assert.equal(f.metal, "K18");
});

test("cond=sale (owner 2026-10-17: Sale in the Condition filter)", () => {
  assert.equal(parseCatalogFilters("?cond=sale", ALL).cond, "sale");
  assert.equal(catalogFiltersToSearch("?lang=en", { ...DEFAULT_FILTERS, cond: "sale" }), "?lang=en&cond=sale");
  const f = { ...DEFAULT_FILTERS, cond: "sale", metal: "K18" };
  assert.deepEqual(parseCatalogFilters(catalogFiltersToSearch("", f), ALL), f);
});

test("a type the page does not show is ignored", () => {
  assert.equal(parseCatalogFilters("?type=watch", { types: [], metals: [] }).type, null);
  assert.equal(parseCatalogFilters("type=WATCH", ALL).type, "Watch", "without '?', any case");
});

test("stock=1 and sort", () => {
  const f = parseCatalogFilters("?stock=1&sort=high", ALL);
  assert.equal(f.availOnly, true);
  assert.equal(f.sort, "high");
  assert.equal(parseCatalogFilters("?sort=low", ALL).sort, "low");
});

test("invalid values → defaults", () => {
  assert.deepEqual(parseCatalogFilters("?cond=used&type=ring&metal=GOLD&stock=yes&sort=price", ALL), DEFAULT_FILTERS);
  assert.deepEqual(parseCatalogFilters("?%E0%A4%A=1&cond", ALL), DEFAULT_FILTERS, "malformed input never throws");
});

test("writing: other params kept in place, new keys appended", () => {
  assert.equal(catalogFiltersToSearch("?lang=en", { ...DEFAULT_FILTERS, cond: "new" }), "?lang=en&cond=new");
  assert.equal(catalogFiltersToSearch("lang=en", { ...DEFAULT_FILTERS, availOnly: true, sort: "low" }), "?lang=en&stock=1&sort=low");
});

test("writing: defaults remove their keys", () => {
  assert.equal(catalogFiltersToSearch("?lang=en&cond=new&metal=K18", DEFAULT_FILTERS), "?lang=en");
  assert.equal(catalogFiltersToSearch("?cond=new", DEFAULT_FILTERS), "");
  assert.equal(catalogFiltersToSearch("", DEFAULT_FILTERS), "");
});

test("writing: type lowercase, metal as the Hub stamp", () => {
  assert.equal(catalogFiltersToSearch("", { ...DEFAULT_FILTERS, type: "Jewelry" }), "?type=jewelry");
  assert.equal(catalogFiltersToSearch("", { ...DEFAULT_FILTERS, metal: "SILVER925" }), "?metal=SILVER925");
});

test("round trip", () => {
  const f = { cond: "preloved", type: "Watch", kind: null, brand: null, metal: "PT900", availOnly: true, sort: "high" };
  assert.deepEqual(parseCatalogFilters(catalogFiltersToSearch("?lang=ja", f), ALL), f);
});

// KIND, BRAND AND OLDEST (owner decisions 2026-10-27).
const PAGE = { ...ALL, kinds: ["necklaces", "rings", "pendants"], brands: ["Tiffany & Co.", "BVLGARI", "Cartier", "CARTIER"] };

test("kind: a collection slug the page shows, any case, returned as the slug", () => {
  assert.equal(parseCatalogFilters("?kind=rings", PAGE).kind, "rings");
  assert.equal(parseCatalogFilters("?kind=RINGS", PAGE).kind, "rings");
  assert.equal(parseCatalogFilters("?kind=anklets", PAGE).kind, null, "not on this page → ignored");
  assert.equal(parseCatalogFilters("?kind=rings", ALL).kind, null, "a page with no kinds ignores it");
});

test("brand: exactly as the Hub writes it; two spellings stay two brands", () => {
  assert.equal(parseCatalogFilters("?brand=Tiffany+%26+Co.", PAGE).brand, "Tiffany & Co.");
  assert.equal(parseCatalogFilters("?brand=Cartier", PAGE).brand, "Cartier");
  assert.equal(parseCatalogFilters("?brand=CARTIER", PAGE).brand, "CARTIER");
  assert.equal(parseCatalogFilters("?brand=cartier", PAGE).brand, null, "no case folding, no merging");
  assert.equal(parseCatalogFilters("?brand=Hermès", PAGE).brand, null, "not on this page → ignored");
  assert.equal(parseCatalogFilters("?brand=Cartier", ALL).brand, null, "a page with no brands ignores it");
});

test("sort=oldest", () => {
  assert.equal(parseCatalogFilters("?sort=oldest", ALL).sort, "oldest");
  assert.equal(catalogFiltersToSearch("", { ...DEFAULT_FILTERS, sort: "oldest" }), "?sort=oldest");
  assert.equal(parseCatalogFilters("?sort=newest", ALL).sort, "newest", "the default is never written, but reads fine");
  assert.equal(parseCatalogFilters("?sort=OLDEST", ALL).sort, "newest", "sort values are exact");
});

test("writing kind and brand: set, encoded, removed at default", () => {
  assert.equal(catalogFiltersToSearch("?lang=ja", { ...DEFAULT_FILTERS, kind: "rings" }), "?lang=ja&kind=rings");
  assert.equal(catalogFiltersToSearch("", { ...DEFAULT_FILTERS, brand: "Tiffany & Co." }), "?brand=Tiffany+%26+Co.");
  assert.equal(catalogFiltersToSearch("?kind=rings&brand=BVLGARI&lang=en", DEFAULT_FILTERS), "?lang=en");
});

test("round trip with kind, brand and oldest", () => {
  const f = { cond: "preloved", type: null, kind: "pendants", brand: "Tiffany & Co.", metal: "K18", availOnly: true, sort: "oldest" };
  assert.deepEqual(parseCatalogFilters(catalogFiltersToSearch("?lang=en", f), PAGE), f);
});
