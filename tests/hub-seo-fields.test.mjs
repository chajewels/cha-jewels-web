// DP-06 storefront side: Hub SEO fields with fallbacks (agreed mocks; the Hub fields do not exist yet).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const F = await import("@/lib/hub-seo-fields");

test("no Hub fields -> nothing changes: every accessor is null / [] / false", () => {
  for (const e of [undefined, null, {}, { name: "x" }]) {
    for (const k of ["seoTitle", "seoDescription", "seoH1", "seoIntro", "seoCopy", "heroAlt"]) for (const l of ["en", "ja"]) assert.equal(F[k](e, l), null, `${k}/${l}`);
    assert.equal(F.isNoindex(e), false); assert.deepEqual(F.faqEntries(e, "en"), []);
  }
});
test("values are per language and never cross languages", () => {
  const e = { seo_title_en: "K18 Kihei Chains | Cha Jewels", seo_description_ja: "日本語の説明" };
  assert.equal(F.seoTitle(e, "en"), "K18 Kihei Chains | Cha Jewels"); assert.equal(F.seoTitle(e, "ja"), null);
  assert.equal(F.seoDescription(e, "ja"), "日本語の説明"); assert.equal(F.seoDescription(e, "en"), null);
});
test("blank, wrong-type and over-limit values are ignored (fall back), not truncated", () => {
  assert.equal(F.seoTitle({ seo_title_en: "   " }, "en"), null);
  assert.equal(F.seoTitle({ seo_title_en: 5 }, "en"), null);
  assert.equal(F.seoTitle({ seo_title_en: "x".repeat(70) }, "en")?.length, 70);
  assert.equal(F.seoTitle({ seo_title_en: "x".repeat(71) }, "en"), null);
  assert.equal(F.seoDescription({ seo_description_en: "y".repeat(161) }, "en"), null);
  assert.equal(F.seoCopy({ seo_copy_ja: "z".repeat(4001) }, "ja"), null);
});
test("noindex hides a page only on an explicit true", () => {
  assert.equal(F.isNoindex({ noindex: true }), true);
  for (const v of [false, null, undefined, "true", 1]) assert.equal(F.isNoindex({ noindex: v }), false, String(v));
});
test("FAQ: at most 6, both q and a in the page language, junk skipped; empty = no block", () => {
  const faq = [{ q_en: "Q1", a_en: "A1", q_ja: "質問", a_ja: "答え" }, { q_en: "Q2", a_en: "" }, null, "x", { q_en: "Q3", a_en: "A3" }, ...Array.from({ length: 8 }, (_, i) => ({ q_en: `E${i}`, a_en: `a${i}` }))];
  const en = F.faqEntries({ faq }, "en");
  assert.equal(en.length, 6); assert.deepEqual(en[0], { q: "Q1", a: "A1" }); assert.equal(en[1].q, "Q3");
  assert.deepEqual(F.faqEntries({ faq }, "ja"), [{ q: "質問", a: "答え" }]);
  assert.deepEqual(F.faqEntries({ faq: "nope" }, "en"), []);
});
test("the collection page uses the Hub fields with today's text as the fallback (source guard)", () => {
  const src = readFileSync("app/collections/[slug]/page.tsx", "utf8");
  assert.match(src, /seoTitle\(col, lang\) \? \{ absolute/);
  assert.match(src, /seoDescription\(col, lang\) \?\? collectionDescription\(col, lang\)/);
  assert.match(src, /listingTitle\("collection"/, "the existing title remains the fallback");
});
