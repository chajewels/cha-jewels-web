// llms.txt (lib/llms-txt.ts + app/llms.txt/route.ts), Master Plan PHASE 6 add-on (owner, 2026-10-31).
// Run: npm run test:unit. The served response is checked by scripts/check-seo-live.mjs and check-seo-dom.mjs ("llms-txt").
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

process.env.NEXT_PUBLIC_SITE_URL = "https://www.chajewelsjp.com";
const { buildLlmsTxt, llmsLinks } = await import("@/lib/llms-txt");
const { STATIC_PAGES } = await import("@/lib/sitemap-pages");
const policy = await import("@/lib/seo-policy");
const { hub } = await import("@/lib/hub-api");
const { default: sitemap } = await import("../app/sitemap.ts");
const B = "https://www.chajewelsjp.com";
const collections = [{ slug: "necklaces", name: "Necklaces", name_en: "Necklaces", name_ja: "ネックレス" }, { slug: "rings", name: "Rings", name_en: null, name_ja: null }, { slug: " ", name: "blank" }];
const categories = [{ slug: "fine-jewelry", name: "Fine Jewelry", name_ja: "ファインジュエリー" }];
const links = (txt) => [...txt.matchAll(/\]\((https?:[^)]+)\)/g)].map((m) => m[1]);

test("every link is a public sitemap entry: the same static list, the same Hub rows, the same locale URLs, nothing else", async () => {
  Object.assign(hub, { collections: async () => collections, categories: async () => categories, productSlugs: async () => [{ slug: "p1" }], posts: async () => [], post: async () => null, allProducts: async () => [] });
  const inSitemap = new Set((await sitemap()).map((e) => e.url));
  const txt = buildLlmsTxt({ collections, categories }, B);
  const found = links(txt);
  assert.ok(found.length >= 2 * (STATIC_PAGES.length + 1 + 2 + 1) + 1, `enough links: ${found.length}`);
  for (const u of found) assert.ok(inSitemap.has(u), `${u} is not in the sitemap`);
  for (const u of found) assert.equal(policy.isNoindexPath(new URL(u).pathname), false, `${u} is a private route`);
  assert.equal(new Set(found).size, found.length, "no link twice");
});

test("the Japanese section never links to layaway; the English section links /en/layaway once; no product URL and no figure appears", () => {
  const txt = buildLlmsTxt({ collections, categories }, B);
  const [, enPart, jaPart] = txt.split(/^## /m);
  assert.match(enPart, /\(https:\/\/www\.chajewelsjp\.com\/en\/layaway\)/);
  assert.equal((enPart.match(/layaway\)/g) ?? []).length, 1);
  assert.doesNotMatch(jaPart, /layaway|分割予約|レイアウェイ/);
  assert.doesNotMatch(txt, /\/products\//, "no product list");
  assert.doesNotMatch(txt, /[¥₱$]|\d+%|\bJPY\b|\bPHP\b|(?<![A-Z])\d{2,}/, "no prices, percentages or figures (a metal stamp such as K18 is not a figure)");
  assert.doesNotMatch(txt, /\/ja\/layaway|\/cart|\/login|\/account|\/checkout|sitemap\.xml/);
});

test("collection and category names are the Hub's through catalog-i18n (Japanese name, English fallback); a blank slug is skipped; labels cannot break the link syntax", () => {
  const en = llmsLinks("en", { collections, categories }, B), ja = llmsLinks("ja", { collections, categories }, B);
  assert.deepEqual(en.filter((l) => /collections|categories/.test(l.url)).map((l) => l.label), ["Fine Jewelry", "Necklaces", "Rings"]);
  assert.deepEqual(ja.filter((l) => /collections|categories/.test(l.url)).map((l) => l.label), ["ファインジュエリー", "ネックレス", "Rings"]);
  assert.ok(!en.some((l) => l.url.endsWith("/collections/ ")));
  const txt = buildLlmsTxt({ collections: [{ slug: "x", name: "A [bad] name", name_en: "A [bad] name" }], categories: [] }, B);
  assert.match(txt, /- \[A bad name\]\(https:\/\/www\.chajewelsjp\.com\/en\/collections\/x\)/);
});

test("the route serves text/plain from the cached catalog reads, tolerates a failed read, and the middleware never sees the path", () => {
  const route = readFileSync(join(process.cwd(), "app/llms.txt/route.ts"), "utf8");
  assert.match(route, /text\/plain; charset=utf-8/);
  assert.match(route, /hub\.collections\(\)\.catch\(\(\) => \[\]\)/);
  assert.match(route, /hub\.categories\(\)\.catch\(\(\) => \[\]\)/);
  assert.match(route, /export const revalidate = 60/);
  const mw = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
  assert.match(mw, /\.\*\\\\\.\[\^\/\]\+\$/, "the matcher skips paths with a file extension, so /llms.txt bypasses it");
  const txt = buildLlmsTxt({ collections: [], categories: [] }, B);
  assert.match(txt, /^# Cha Jewels\n/);
  assert.ok(links(txt).length >= 2 * (STATIC_PAGES.length + 1) + 1, "a failed Hub read still lists every static page");
});
