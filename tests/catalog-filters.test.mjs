// CATALOG FILTER URLS (owner report 2026-10-17: filters not carried in shared
// collection links): the toolbar's filters read from and written to the
// query string (lib/catalog-filters.ts). Multi-select since the compact
// toolbar (owner 2026-10-27): comma-separated values, OR within a group.
// Type = collection slugs since the rename (owner 2026-10-27, "kind is type"):
// written as type=, the old kind= still read.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { DEFAULT_FILTERS, parseCatalogFilters, catalogFiltersToSearch } = await import("@/lib/catalog-filters");

const ALL = { types: [], metals: ["K18", "PT900", "SILVER925"] };
const PAGE = { ...ALL, types: ["necklaces", "rings", "pendants", "earrings"], brands: ["Tiffany & Co.", "BVLGARI", "Cartier", "CARTIER", "Van Cleef, Arpels"] };
const F = (o) => ({ ...DEFAULT_FILTERS, ...o });

test("empty string → defaults", () => {
  assert.deepEqual(parseCatalogFilters("", ALL), DEFAULT_FILTERS);
  assert.deepEqual(parseCatalogFilters("?", ALL), DEFAULT_FILTERS);
});

// ONE-VALUE LINKS FROM BEFORE MULTI-SELECT (PR #359, PR #381) STILL OPEN.
test("one-value links: cond and metal; metal matched case-insensitively, returned in the allowed spelling", () => {
  const f = parseCatalogFilters("?cond=preloved&metal=k18", { types: [], metals: ["K18", "PT900"] });
  assert.deepEqual(f.cond, ["preloved"]);
  assert.deepEqual(f.metal, ["K18"]);
});

test("one-value links: cond=sale", () => {
  assert.deepEqual(parseCatalogFilters("?cond=sale", ALL).cond, ["sale"]);
  assert.equal(catalogFiltersToSearch("?lang=en", F({ cond: ["sale"] })), "?lang=en&cond=sale");
  const f = F({ cond: ["sale"], metal: ["K18"] });
  assert.deepEqual(parseCatalogFilters(catalogFiltersToSearch("", f), ALL), f);
});

test("one-value links: type, brand", () => {
  assert.deepEqual(parseCatalogFilters("?type=rings", PAGE).type, ["rings"]);
  assert.deepEqual(parseCatalogFilters("type=RINGS", PAGE).type, ["rings"], "without '?', any case");
  assert.deepEqual(parseCatalogFilters("?brand=Tiffany+%26+Co.", PAGE).brand, ["Tiffany & Co."]);
});

// TYPE RENAME (owner 2026-10-27, "kind is type").
test("kind= (PR #381 / #382 links) is read as type=", () => {
  assert.deepEqual(parseCatalogFilters("?kind=rings", PAGE).type, ["rings"]);
  assert.deepEqual(parseCatalogFilters("?kind=rings,earrings", PAGE).type, ["rings", "earrings"]);
  assert.deepEqual(parseCatalogFilters("?kind=rings&type=necklaces", PAGE).type, ["rings", "necklaces"], "both keys: one list, link order");
  assert.deepEqual(parseCatalogFilters("?kind=anklets", PAGE).type, [], "an unknown slug is still ignored");
});

test("kind= is rewritten as type= in its own place on the next write", () => {
  assert.equal(catalogFiltersToSearch("?kind=rings&lang=ja", F({ type: ["rings", "earrings"] })), "?type=rings,earrings&lang=ja");
  assert.equal(catalogFiltersToSearch("?kind=rings&type=necklaces&lang=en", F({ type: ["rings"] })), "?type=rings&lang=en", "one key, written once");
  assert.equal(catalogFiltersToSearch("?kind=rings&lang=en", DEFAULT_FILTERS), "?lang=en", "removed at default");
  assert.equal(catalogFiltersToSearch("", F({ type: ["rings"] })), "?type=rings", "kind= is never written");
});

test("legacy item-type values (type=Jewelry|Watch|Accessory) are ignored", () => {
  assert.deepEqual(parseCatalogFilters("?type=Jewelry", PAGE), DEFAULT_FILTERS);
  assert.deepEqual(parseCatalogFilters("?type=jewelry,watch,accessory", PAGE).type, []);
  assert.deepEqual(parseCatalogFilters("?type=Watch,rings", PAGE).type, ["rings"], "a collection slug beside it still counts");
  assert.deepEqual(parseCatalogFilters("?type=Jewelry", ALL), DEFAULT_FILTERS, "a page with no types");
});

test("a value the page does not show is ignored", () => {
  assert.deepEqual(parseCatalogFilters("?type=rings", { types: [], metals: [] }).type, []);
  assert.deepEqual(parseCatalogFilters("?type=anklets", PAGE).type, []);
  assert.deepEqual(parseCatalogFilters("?brand=Hermès", PAGE).brand, []);
});

test("brand: exactly as the Hub writes it; two spellings stay two brands", () => {
  assert.deepEqual(parseCatalogFilters("?brand=Cartier", PAGE).brand, ["Cartier"]);
  assert.deepEqual(parseCatalogFilters("?brand=CARTIER", PAGE).brand, ["CARTIER"]);
  assert.deepEqual(parseCatalogFilters("?brand=cartier", PAGE).brand, [], "no case folding, no merging");
});

test("stock=1 and sort", () => {
  const f = parseCatalogFilters("?stock=1&sort=high", ALL);
  assert.equal(f.availOnly, true);
  assert.equal(f.sort, "high");
  assert.equal(parseCatalogFilters("?sort=low", ALL).sort, "low");
  assert.equal(parseCatalogFilters("?sort=oldest", ALL).sort, "oldest");
  assert.equal(parseCatalogFilters("?sort=OLDEST", ALL).sort, "newest", "sort values are exact");
});

test("invalid values → defaults", () => {
  assert.deepEqual(parseCatalogFilters("?cond=used&type=ring&metal=GOLD&stock=yes&sort=price", ALL), DEFAULT_FILTERS);
  assert.deepEqual(parseCatalogFilters("?%E0%A4%A=1&cond", ALL), DEFAULT_FILTERS, "malformed input never throws");
  assert.deepEqual(parseCatalogFilters("?cond=all", ALL).cond, [], "All is nothing ticked, never a value");
});

// MULTI-VALUE (owner 2026-10-27).
test("multi: comma-separated values, in link order, unknowns and repeats dropped", () => {
  const f = parseCatalogFilters("?type=rings,earrings&brand=Cartier,BVLGARI&cond=new,sale&metal=pt900,k18", PAGE);
  assert.deepEqual(f.type, ["rings", "earrings"]);
  assert.deepEqual(f.brand, ["Cartier", "BVLGARI"]);
  assert.deepEqual(f.cond, ["new", "sale"]);
  assert.deepEqual(f.metal, ["PT900", "K18"]);
  assert.deepEqual(parseCatalogFilters("?type=rings,anklets,RINGS,,earrings", PAGE).type, ["rings", "earrings"]);
  assert.deepEqual(parseCatalogFilters("?brand=Cartier,cartier,Hermès", PAGE).brand, ["Cartier"]);
});

test("multi: a list whose commas were escaped on the way still opens", () => {
  assert.deepEqual(parseCatalogFilters("?type=rings%2Cearrings", PAGE).type, ["rings", "earrings"]);
  assert.deepEqual(parseCatalogFilters("?brand=Cartier%2CBVLGARI", PAGE).brand, ["Cartier", "BVLGARI"]);
});

test("multi: a brand holding a comma travels as %2C and stays one brand", () => {
  const f = F({ brand: ["Van Cleef, Arpels", "Cartier"] });
  const s = catalogFiltersToSearch("", f);
  assert.equal(s, "?brand=Van+Cleef%2C+Arpels,Cartier");
  assert.deepEqual(parseCatalogFilters(s, PAGE).brand, ["Van Cleef, Arpels", "Cartier"]);
});

test("multi: a repeated key adds its values", () => {
  assert.deepEqual(parseCatalogFilters("?type=rings&type=earrings", PAGE).type, ["rings", "earrings"]);
});

test("writing: other params kept in place and as written, new keys appended", () => {
  assert.equal(catalogFiltersToSearch("?lang=en", F({ cond: ["new"] })), "?lang=en&cond=new");
  assert.equal(catalogFiltersToSearch("lang=en", F({ availOnly: true, sort: "low" })), "?lang=en&stock=1&sort=low");
  assert.equal(catalogFiltersToSearch("?utm=a%20b&flag", F({ type: ["rings"] })), "?utm=a%20b&flag&type=rings");
  assert.equal(catalogFiltersToSearch("?type=rings&lang=ja", F({ type: ["rings", "earrings"] })), "?type=rings,earrings&lang=ja", "an existing key keeps its place");
});

test("writing: defaults remove their keys", () => {
  assert.equal(catalogFiltersToSearch("?lang=en&cond=new&metal=K18", DEFAULT_FILTERS), "?lang=en");
  assert.equal(catalogFiltersToSearch("?cond=new", DEFAULT_FILTERS), "");
  assert.equal(catalogFiltersToSearch("", DEFAULT_FILTERS), "");
  assert.equal(catalogFiltersToSearch("?type=rings&type=earrings&lang=en", DEFAULT_FILTERS), "?lang=en", "repeated keys all go");
});

test("writing: literal commas, metal as the Hub stamp, brand encoded", () => {
  assert.equal(catalogFiltersToSearch("", F({ type: ["rings", "earrings"], brand: ["Cartier", "BVLGARI"] })), "?type=rings,earrings&brand=Cartier,BVLGARI");
  assert.equal(catalogFiltersToSearch("", F({ metal: ["SILVER925"] })), "?metal=SILVER925");
  assert.equal(catalogFiltersToSearch("", F({ brand: ["Tiffany & Co."] })), "?brand=Tiffany+%26+Co.");
  assert.equal(catalogFiltersToSearch("", F({ sort: "oldest" })), "?sort=oldest");
});

test("round trip", () => {
  const a = { cond: ["preloved"], type: [], brand: [], metal: ["PT900"], availOnly: true, sort: "high" };
  assert.deepEqual(parseCatalogFilters(catalogFiltersToSearch("?lang=ja", a), ALL), a);
  const b = { cond: ["new", "sale"], type: ["pendants", "rings"], brand: ["Tiffany & Co.", "Van Cleef, Arpels"], metal: ["K18", "SILVER925"], availOnly: false, sort: "oldest" };
  assert.deepEqual(parseCatalogFilters(catalogFiltersToSearch("?lang=en", b), PAGE), b);
});
