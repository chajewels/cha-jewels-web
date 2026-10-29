// The visible trail's rows (lib/breadcrumbs.ts) against the BreadcrumbList the
// same items build (lib/json-ld.ts): components/site/breadcrumbs.tsx passes one
// array to both, and this pins that row i's href IS item i's URL minus the
// origin, with the last row the page itself and not a link. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { crumbRows } = await import("@/lib/breadcrumbs");
const { buildJsonLd } = await import("@/lib/json-ld");
const B = "https://www.chajewelsjp.com";
const trail = [{ name: "Collections", path: "/collections" }, { name: "Necklaces", path: "/collections/necklaces" }, { name: "CJ-1002", path: "/products/cj-1002" }];
const home = [{ name: "ホーム", path: "/" }, { name: "ファインジュエリー", path: "/categories/fine-jewelry" }];

test("every row but the last is a link to the locale page; the last names the page and is not a link", () => {
  assert.deepEqual(crumbRows(trail, "en"), [
    { name: "Collections", href: "/en/collections" },
    { name: "Necklaces", href: "/en/collections/necklaces" },
    { name: "CJ-1002", href: null },
  ]);
  assert.deepEqual(crumbRows(home, "ja"), [{ name: "ホーム", href: "/ja" }, { name: "ファインジュエリー", href: null }]);
});

test("a Home crumb's path '/' renders as the locale home (/en or /ja), never a bare '/'", () => {
  assert.equal(crumbRows(home, "en")[0].href, "/en");
  assert.equal(crumbRows(home, "ja")[0].href, "/ja");
});

test("the visible hrefs equal the BreadcrumbList item URLs, same order and count, in both languages", () => {
  for (const lang of ["en", "ja"]) {
    for (const items of [trail, home]) {
      const rows = crumbRows(items, lang);
      const ld = buildJsonLd({ type: "breadcrumb", items }, B, `/${lang}`).itemListElement;
      assert.equal(rows.length, ld.length);
      rows.forEach((r, i) => {
        assert.equal(r.name, ld[i].name);
        if (r.href !== null) assert.equal(`${B}${r.href}`, ld[i].item, `${lang} row ${i}`);
        else assert.equal(i, rows.length - 1, "only the last row has no link");
      });
      assert.equal(ld.at(-1).item, `${B}/${lang}${items.at(-1).path}`);
    }
  }
});

test("names pass through verbatim — no trimming, casing or escaping in the mapping", () => {
  assert.equal(crumbRows([{ name: " Tiffany & Co. ", path: "/categories/x" }], "en")[0].name, " Tiffany & Co. ");
});
