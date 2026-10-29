// SEO Step 1 (Master Plan §33.3): title / description / crawlable-nav rules.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { productTitle, listingTitle } = await import(pathToFileURL(join(process.cwd(), "lib/meta-text.ts")).href);
const { dict } = await import("@/lib/i18n");
const read = (f) => readFileSync(join(process.cwd(), f), "utf8");

test("product title: the SKU moves to the end; name, case and punctuation are kept", () => {
  assert.equal(productTitle("R1013 Ring K18WG", "R1013"), "Ring K18WG (R1013)");
  assert.equal(productTitle("r1013 Ring K18WG", "R1013"), "Ring K18WG (r1013)", "the SKU is shown as the Hub wrote it in the name");
});

test("product title: unchanged when the name does not start with its own SKU, or there is no SKU", () => {
  assert.equal(productTitle("Pearl Necklace", "N9140"), "Pearl Necklace");
  assert.equal(productTitle("R1013 Ring", undefined), "R1013 Ring");
  assert.equal(productTitle("R1013 Ring", ""), "R1013 Ring");
  assert.equal(productTitle("R10130 Ring", "R1013"), "R10130 Ring", "a longer code is not this SKU");
  assert.equal(productTitle("R1013", "R1013"), "R1013");
  assert.equal(productTitle("R1013 ", "R1013"), "R1013");
});

test("product title: a long name is still shown alone, SKU last, never truncated by us", () => {
  const t = productTitle("W1154 Watch Louis Vuitton Tambour Quartz Stainless Steel Shell 15-17.5cm [Preloved]", "W1154");
  assert.deepEqual(t, { absolute: "Watch Louis Vuitton Tambour Quartz Stainless Steel Shell 15-17.5cm [Preloved] (W1154)" });
});

test("listing titles: only English jewelry-type collections and Fine Jewelry are lengthened", () => {
  assert.equal(listingTitle("collection", "rings", "Rings", "en"), "Rings: Jewelry Collection from Tokyo");
  assert.equal(listingTitle("category", "fine-jewelry", "Fine Jewelry", "en"), "Fine Jewelry: Gold, Pearl, Diamond and Gemstone");
  assert.equal(listingTitle("collection", "rings", "リング", "ja"), "リング", "Japanese is untouched");
  assert.equal(listingTitle("collection", "luxury-bags", "Luxury Bags", "en"), "Luxury Bags", "not jewelry: no jewelry claim");
  assert.equal(listingTitle("category", "preloved-watches", "Preloved Branded Watches", "en"), "Preloved Branded Watches");
  assert.equal(listingTitle("collection", "handmade-gemstone-bracelets", "Handmade Gemstone Bracelets", "en"), "Handmade Gemstone Bracelets");
  for (const [k, s, n] of [["collection", "rings", "Rings"], ["collection", "necklaces", "Necklaces"], ["collection", "pendants", "Pendants"], ["category", "fine-jewelry", "Fine Jewelry"]]) {
    assert.ok(`${listingTitle(k, s, n, "en")} | Cha Jewels`.length <= 62, s);
  }
});

test("tokusho: distinct, non-empty, own descriptions in both languages; no layaway wording in Japanese", () => {
  const m = dict.meta;
  assert.ok(m.tokusho.description.en.length > 60 && m.tokusho.description.en.length <= 160);
  assert.ok(m.tokusho.description.ja.length > 40 && m.tokusho.description.ja.length <= 160);
  for (const l of ["ja", "en"]) {
    assert.notEqual(m.tokusho.description[l], m.site.description[l], "not the home description");
    for (const k of Object.keys(m)) if (k !== "tokusho" && m[k].description) assert.notEqual(m.tokusho.description[l], m[k].description[l]);
  }
  assert.ok(!/レイアウェイ|分割予約|layaway/i.test(m.tokusho.description.ja));
  assert.ok(m.tokusho.description.ja !== m.tokusho.description.en);
});

test("crawlable nav: both the desktop menus and the phone drawer render a hidden link list while closed", () => {
  const crawl = read("components/site/crawl-links.tsx");
  assert.match(crawl, /<ul hidden/, "display:none: out of Tab order and the accessibility tree");
  assert.match(crawl, /tabIndex=\{-1\}/);
  const menu = read("components/site/nav-menu.tsx");
  assert.match(menu, /\{!open && <CrawlLinks links=\{crawlLinks\} \/>\}/);
  assert.match(menu, /\{open && \(/, "the real panel still mounts on open only (story typing, focus, arrow keys)");
  assert.match(read("components/site/mobile-nav.tsx"), /\{!open && <CrawlLinks /);
  const header = read("components/site/header.tsx");
  assert.equal((header.match(/crawlLinks=\{/g) ?? []).length, 2, "Collections and Company");
});

test("blog: the article's lead image alt is its title; list thumbnails stay decorative", () => {
  assert.match(read("app/blog/[slug]/page.tsx"), /<img src=\{p\.cover\} alt=\{p\.title\}/);
  assert.match(read("app/blog/page.tsx"), /<img src=\{p\.cover\} alt=""/);
});

test("FINDING A: /collections visibly links every category, from the Hub list, in the page's language", () => {
  const src = read("app/collections/page.tsx");
  assert.match(src, /hub\.categories\(\)\.catch\(\(\) => \[\]\)/);
  assert.match(src, /localePath\(`\/categories\/\$\{c\.slug\}`, lang\)/);
  assert.match(src, /categories\.length > 0/, "no empty heading when the Hub has none");
  assert.match(src, /min-h-11/, "44px tap target");
  const block = src.slice(src.indexOf("categories.length > 0"));
  assert.ok(!/\bhidden\b|sr-only/.test(block.replace(/overflow-hidden/g, "")), "visible, not hidden");
});
