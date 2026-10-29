// SEO PHASE 4 — the pages that must render a BreadcrumbList (master plan §8:
// products, categories, collections, blog articles, guides). A source guard,
// because the pages are JSX the test harness cannot render: each listed page
// must mount `<JsonLd type="breadcrumb"`, and the locale wrappers under
// app/[lang] re-export these legacy pages, so one tag covers both URLs. The
// layaway page is deliberately NOT listed: another branch owns it.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const PAGES = {
  product: "app/products/[slug]/page.tsx",
  collection: "app/collections/[slug]/page.tsx",
  category: "app/categories/[slug]/page.tsx",
  post: "app/blog/[slug]/page.tsx",
  jewelryGuide: "app/jewelry-guide/page.tsx",
  shoppingGuide: "app/shopping-guide/page.tsx",
};
const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

for (const [name, file] of Object.entries(PAGES)) {
  test(`${name} page renders <JsonLd type="breadcrumb">`, () => {
    assert.match(src(file), /<JsonLd type="breadcrumb"/, file);
  });
}

test("the product page's structured trail is the visible one: Collections label, the crumb, the SKU", () => {
  const s = src(PAGES.product);
  // The visible <nav> and the JSON-LD both start from t("nav", "collections")
  // and end at p.sku; the middle crumb is the same `crumb` object.
  assert.match(s, /<JsonLd type="breadcrumb" items=\{\[\{ name: t\("nav", "collections"\), path: "\/collections" \}, \.\.\.\(crumb \? \[\{ name: crumb\.name, path: crumb\.path \}\] : \[\]\), \{ name: p\.sku,/);
  assert.match(s, /<li><Link href=\{localePath\("\/collections", lang\)\}[^\n]*\{t\("nav", "collections"\)\}<\/Link><\/li>/);
  assert.match(s, /<li aria-current="page"[^\n]*\{p\.sku\}<\/li>/);
});

test("a crumb path is a bare route — the builder adds the locale, the page never does", () => {
  for (const file of Object.values(PAGES)) {
    const tag = src(file).match(/<JsonLd type="breadcrumb" items=\{\[(.*?)\]\} \/>/s)?.[1] ?? "";
    assert.ok(tag, `${file}: breadcrumb tag found`);
    assert.doesNotMatch(tag, /localePath\(/, `${file}: no localePath inside the breadcrumb items`);
    assert.doesNotMatch(tag, /path: ["`]\/(en|ja)\//, `${file}: no hardcoded locale in a path`);
  }
});

test("the layaway page is untouched by Phase 4 (owned by another branch)", () => {
  assert.doesNotMatch(src("app/layaway/page.tsx"), /type="breadcrumb"/);
});
