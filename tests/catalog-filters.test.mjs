// CATALOG FILTER URLS (owner report 2026-10-17: filters not carried in shared
// collection links): the toolbar's five filters read from and written to the
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
  const f = { cond: "preloved", type: "Watch", metal: "PT900", availOnly: true, sort: "high" };
  assert.deepEqual(parseCatalogFilters(catalogFiltersToSearch("?lang=ja", f), ALL), f);
});
