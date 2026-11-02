// A collection the Hub marks noindex: ONE policy in three places (robots meta, sitemap, locale alternates).
// Explicit-true only; every other value, and the absence of the field, leaves today's behaviour unchanged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { hub } = await import("@/lib/hub-api");
const { hubListingMeta } = await import("@/lib/hub-seo-fields");
const { localizedMeta, isNoindexRobots } = await import("@/lib/locale-meta");
const { default: sitemap } = await import("../app/sitemap.ts");

test("hubListingMeta: explicit noindex -> robots {index:false}; absent / false / odd values -> no robots key", () => {
  assert.deepEqual(hubListingMeta({ noindex: true }, "en").robots, { index: false, follow: true });
  for (const v of [false, null, undefined, "true", 1, "yes"]) assert.equal("robots" in hubListingMeta({ noindex: v }, "en"), false, String(v));
  assert.deepEqual(hubListingMeta({}, "en"), {}, "no Hub fields: nothing overrides the page's own text");
  assert.deepEqual(hubListingMeta({ seo_title_en: "T | Cha Jewels", seo_description_en: "D" }, "en"), { title: { absolute: "T | Cha Jewels" }, description: "D" });
});
test("isNoindexRobots reads the object and string forms and nothing else", () => {
  assert.equal(isNoindexRobots({ index: false, follow: true }), true);
  assert.equal(isNoindexRobots("noindex, follow"), true);
  for (const r of [undefined, null, "index, follow", { index: true }, {}]) assert.equal(isNoindexRobots(r), false);
});

const meta = (own) => localizedMeta((p) => `/collections/${p.slug}`, async () => own);
const run = (own, lang = "en") => meta(own)({ params: Promise.resolve({ lang, slug: "x" }) }, undefined);
test("locale alternates: a noindex page names NO canonical and NO alternates but keeps og:url; unchanged otherwise", async () => {
  const ni = await run({ title: "T", robots: { index: false, follow: true } });
  assert.equal(ni.alternates, undefined, "no canonical, no hreflang");
  assert.deepEqual(ni.robots, { index: false, follow: true });
  assert.equal(ni.openGraph?.url, "https://www.chajewelsjp.com/en/collections/x", "og:url kept");
  const normal = await run({ title: "T" });
  assert.equal(normal.alternates.canonical, "https://www.chajewelsjp.com/en/collections/x");
  assert.deepEqual(Object.keys(normal.alternates.languages).sort(), ["en", "ja", "x-default"]);
  const empty = await run({});
  assert.deepEqual(empty, {}, "no resource behind it: says nothing (unchanged)");
});

const stub = (cols) => Object.assign(hub, {
  collections: async () => cols, categories: async () => [{ slug: "necklaces" }], productSlugs: async () => [{ slug: "p1" }], posts: async () => [],
  post: async () => null, allProducts: async () => [],
});
const paths = async () => (await sitemap()).map((e) => new URL(e.url).pathname);
test("sitemap: an explicit-noindex collection is left out (both languages); everything else is listed", async () => {
  stub([{ slug: "keep" }, { slug: "thin", noindex: true }, { slug: "false-flag", noindex: false }, { slug: "string-flag", noindex: "true" }]);
  const p = await paths();
  assert.ok(!p.includes("/ja/collections/thin") && !p.includes("/en/collections/thin"));
  for (const s of ["keep", "false-flag", "string-flag"]) assert.ok(p.includes(`/ja/collections/${s}`) && p.includes(`/en/collections/${s}`), s);
});
test("categories stay INERT for noindex (their page is not wired yet): a flagged category is still listed", async () => {
  Object.assign(hub, { collections: async () => [], categories: async () => [{ slug: "necklaces", noindex: true }], productSlugs: async () => [], posts: async () => [], post: async () => null, allProducts: async () => [] });
  assert.ok((await paths()).includes("/en/categories/necklaces"));
  assert.match(readFileSync("app/sitemap.ts", "utf8"), /cols\.filter\(\(c\) => !isNoindex\(c\)\)/);
  assert.doesNotMatch(readFileSync("app/sitemap.ts", "utf8"), /cats\.filter/);
});
test("the collection page spreads the one function (source guard)", () => {
  const src = readFileSync("app/collections/[slug]/page.tsx", "utf8");
  assert.match(src, /hubListingMeta\(col, lang\)/);
  assert.match(src, /listingTitle\("collection"/, "today's title remains the fallback");
});
