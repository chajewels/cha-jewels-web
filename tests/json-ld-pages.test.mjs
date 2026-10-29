// SEO PHASE 4 — the pages that must render a BreadcrumbList (master plan §8:
// products, categories, collections, blog articles, guides), and render it
// through the ONE shared <Breadcrumbs> (components/site/breadcrumbs.tsx), which
// draws the visible <nav> and the JSON-LD from the same `items` array so the
// structured data can never claim a trail the page does not show. A source
// guard, because the pages are JSX the test harness cannot render; the locale
// wrappers under app/[lang] re-export these legacy pages, so one tag covers
// both URLs. The layaway page is deliberately NOT listed: another branch owns
// it. The component's own markup is pinned here too; its items → rows mapping
// is unit-tested in tests/breadcrumbs.test.mjs. Run: npm run test:unit.
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
const COMPONENT = "components/site/breadcrumbs.tsx";
const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const crumbTag = (file) => src(file).match(/<Breadcrumbs lang=\{lang\} label=\{(?:t|tr\(lang\))\("pdp", "breadcrumb"\)\}[^\n]*? items=\{\[(.*?)\]\} \/>/s);

for (const [name, file] of Object.entries(PAGES)) {
  test(`${name} page renders the shared <Breadcrumbs> (visible trail + BreadcrumbList), never a bare breadcrumb JSON-LD`, () => {
    const s = src(file);
    assert.match(s, /import \{ Breadcrumbs \} from "@\/components\/site\/breadcrumbs";/, file);
    assert.ok(crumbTag(file), `${file}: <Breadcrumbs lang={lang} label={t("pdp", "breadcrumb")} … items={[…]} /> found`);
    assert.doesNotMatch(s, /<JsonLd type="breadcrumb"/, `${file}: the BreadcrumbList comes only from <Breadcrumbs>`);
    assert.doesNotMatch(s, /<nav aria-label=\{t\("pdp", "breadcrumb"\)\}/, `${file}: no hand-drawn crumb beside the component`);
  });
}

test("the product page's trail is Collections › [collection or category] › SKU", () => {
  assert.match(crumbTag(PAGES.product)[1], /^\{ name: t\("nav", "collections"\), path: "\/collections" \}, \.\.\.\(crumb \? \[\{ name: crumb\.name, path: crumb\.path \}\] : \[\]\), \{ name: p\.sku, path: `\/products\/\$\{p\.slug\}` \}$/);
});

test("the trails the other pages show: Collections › collection; Home › category; Blog › post; Home › guide title", () => {
  assert.match(crumbTag(PAGES.collection)[1], /^\{ name: t\("nav", "collections"\), path: "\/collections" \}, \{ name: collectionName\(col, lang\), path: `\/collections\/\$\{col\.slug\}` \}$/);
  assert.match(crumbTag(PAGES.category)[1], /^\{ name: t\("nav", "home"\), path: "\/" \}, \{ name, path: `\/categories\/\$\{slug\}` \}$/);
  assert.match(crumbTag(PAGES.post)[1], /^\{ name: t\("nav", "blog"\), path: "\/blog" \}, \{ name: p\.title, path: `\/blog\/\$\{p\.slug\}` \}$/);
  assert.match(crumbTag(PAGES.jewelryGuide)[1], /^\{ name: t\("nav", "home"\), path: "\/" \}, \{ name: dict\.meta\.jewelryGuide\.title\[lang\], path: "\/jewelry-guide" \}$/);
  assert.match(crumbTag(PAGES.shoppingGuide)[1], /^\{ name: tr\(lang\)\("nav", "home"\), path: "\/" \}, \{ name: dict\.meta\.shoppingGuide\.title\[lang\], path: "\/shopping-guide" \}$/);
});

test("a crumb path is a bare route — the component adds the locale, the page never does", () => {
  for (const file of Object.values(PAGES)) {
    const tag = crumbTag(file)?.[1] ?? "";
    assert.ok(tag, `${file}: breadcrumb tag found`);
    assert.doesNotMatch(tag, /localePath\(/, `${file}: no localePath inside the breadcrumb items`);
    assert.doesNotMatch(tag, /path: ["`]\/(en|ja)\//, `${file}: no hardcoded locale in a path`);
  }
});

test("the shared component: one items array feeds the JSON-LD and the visible <nav>; the product page's original markup", () => {
  const s = src(COMPONENT);
  assert.match(s, /<JsonLd type="breadcrumb" items=\{items\} \/>/);
  assert.match(s, /const rows = crumbRows\(items, lang\);/);
  assert.match(s, /<nav aria-label=\{label\} className=\{className \?\? "py-3\.5 text-xs text-charcoal\/70 sm:pb-\[18px\] sm:pt-\[22px\] sm:text-\[13px\]"\}>/);
  assert.match(s, /<ol className="flex flex-wrap items-center gap-2">/);
  assert.match(s, /<li aria-hidden="true" className="text-gold-dark">\/<\/li>/);
  assert.match(s, /<li aria-current="page" className="text-charcoal-deep">\{r\.name\}<\/li>/);
  // SEO Step 1: the same classes plus an invisible ::after that enlarges the tap area (no layout change).
  assert.match(s, /<li><Link href=\{r\.href\} className="relative text-charcoal\/80 hover:text-gold-dark after:absolute after:-inset-x-1 after:-inset-y-\[15px\] after:content-\[\x27\x27\]">\{r\.name\}<\/Link><\/li>/);
  assert.doesNotMatch(s, /"use client"/, "a server component, like the JsonLd it mounts");
});

test("the layaway page is untouched by Phase 4 (owned by another branch)", () => {
  assert.doesNotMatch(src("app/layaway/page.tsx"), /type="breadcrumb"|<Breadcrumbs/);
});
