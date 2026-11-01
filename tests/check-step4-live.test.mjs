// scripts/check-step4-live.mjs: the checklist parser (against the real checklist file), the page evaluation rules
// (synthetic HTML), the article rule and the report. No network. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { parseChecklist, evaluateListing, evaluateArticle, readHtml, classify, renderReport, CHECKLIST, DEFAULT_BASE } = await import("../scripts/check-step4-live.mjs");
const md = readFileSync(join(process.cwd(), CHECKLIST), "utf8");
const parsed = parseChecklist(md);
const neck = parsed.listings.find((r) => /Necklaces/.test(r.name));
const page = ({ desc, body, canonical = neck.urls.en, hreflang = ["en", "ja", "x-default"], links = 3 }) =>
  `<html><head><meta name="description" content="${desc}"/><meta property="og:description" content="${desc}"/><link rel="canonical" href="${canonical}"/>${hreflang.map((l) => `<link rel="alternate" hrefLang="${l}" href="${canonical}"/>`).join("")}</head><body><p>${body}</p>${Array.from({ length: links }, (_, i) => `<a href="/en/products/p${i}">p</a>`).join("")}</body></html>`;
const ok = (html) => ({ status: 200, redirected: false, location: null, html });

test("parseChecklist reads the six listing records and the article from the real checklist, never retyping a word", () => {
  assert.equal(parsed.listings.length, 6);
  assert.deepEqual(parsed.listings.map((r) => r.name), ["Necklaces collection", "Rings collection", "Other Accessories collection", "Pendants collection", "Fine Jewelry category", "Preloved Jewelry category"]);
  for (const r of parsed.listings) { for (const l of ["en", "ja"]) { assert.match(r.urls[l], new RegExp(`^${DEFAULT_BASE}/${l}/`)); assert.ok(r.existing[l].length > 10); assert.ok(r.approved[l].length > 10); assert.notEqual(r.existing[l], r.approved[l]); } }
  assert.equal(neck.approved.en, "Gold, platinum and sterling silver chains and necklaces, including pearl and gemstone styles. Each piece lists its metal and length.");
  assert.equal(parsed.article.approvedParagraphs.en.length, 2);
  assert.equal(parsed.article.approvedParagraphs.ja.length, 2);
  assert.deepEqual(parsed.article.removedEn, ["Japan-made "]);
  assert.match(parsed.article.approvedParagraphs.en[0], /^Our collections include K18 gold jewelry/);
  assert.match(parsed.article.approvedParagraphs.ja[0], /^チャジュエルズでは、K18ゴールドジュエリー/);
  assert.match(parsed.article.urls.en, /\/en\/blog\/why-cha-jewels-care-behind-every-piece$/);
  assert.throws(() => parseChecklist(md.replace("**Approved JA:**", "**Approved XX:**")), /missing approved JA/);
  assert.throws(() => parseChecklist(md.replace("## 7. Preloved Jewelry category", "## 9. Preloved Jewelry category")), /expected 6 listing records/);
});

test("classify and readHtml: APPLIED / OLD / OTHER by exact normalised text; entities and curly apostrophes normalised; product links counted once", () => {
  assert.equal(classify(neck.approved.en, neck.existing.en, neck.approved.en), "APPLIED");
  assert.equal(classify(neck.existing.en, neck.existing.en, neck.approved.en), "OLD");
  assert.equal(classify("something else", neck.existing.en, neck.approved.en), "OTHER");
  assert.equal(classify(null, neck.existing.en, neck.approved.en), "NONE");
  const d = readHtml(`<head><meta name="description" content="a &amp; b&#39;s"/></head><body><script>var x="<p>no</p>"</script><a href="/en/products/x">1</a><a href="/en/products/x?v=2">1</a><a href="/en/products/y/extra">d</a></body>`);
  assert.equal(d.metaDesc, "a & b's");
  assert.equal(d.productLinks, 1, "the same slug twice is one link; a deeper path is not a product link");
  assert.doesNotMatch(d.body, /var x|<p>/, "script content and tags are stripped from the body text");
});

test("evaluateListing: the approved text live = APPLIED; the old text = OLD; a third text = OTHER; a redirect, a wrong canonical, a missing hreflang, a changed membership count or a forbidden claim are problems", () => {
  const applied = evaluateListing(ok(page({ desc: neck.approved.en, body: neck.approved.en })), neck, "en");
  assert.equal(applied.verdict, "APPLIED"); assert.deepEqual(applied.problems, []);
  const old = evaluateListing(ok(page({ desc: neck.existing.en, body: neck.existing.en })), neck, "en");
  assert.equal(old.verdict, "OLD");
  const other = evaluateListing(ok(page({ desc: "Necklaces for everyone.", body: "Necklaces for everyone." })), neck, "en");
  assert.equal(other.verdict, "OTHER"); assert.match(other.problems.join(";"), /meta=OTHER/);
  const mixed = evaluateListing(ok(page({ desc: neck.approved.en, body: neck.existing.en })), neck, "en");
  assert.equal(mixed.verdict, "OTHER", "meta approved but the body still shows the old text is not APPLIED");
  assert.equal(evaluateListing({ status: 307, redirected: true, location: "/en/collections/necklaces/", html: "" }, neck, "en").verdict, "FAIL");
  assert.equal(evaluateListing({ status: 0, redirected: false, location: null, html: "", error: "timeout" }, neck, "en").verdict, "FAIL");
  const badCanon = evaluateListing(ok(page({ desc: neck.approved.en, body: neck.approved.en, canonical: `${DEFAULT_BASE}/en/collections/necklaces?x=1` })), neck, "en");
  assert.equal(badCanon.verdict, "APPLIED WITH PROBLEMS"); assert.match(badCanon.problems.join(";"), /canonical/);
  const noHl = evaluateListing(ok(page({ desc: neck.approved.en, body: neck.approved.en, hreflang: ["en", "ja"] })), neck, "en");
  assert.match(noHl.problems.join(";"), /hreflang en,ja/);
  const count = evaluateListing(ok(page({ desc: neck.approved.en, body: neck.approved.en, links: 5 })), neck, "en", { baselineCount: 7 });
  assert.match(count.problems.join(";"), /product links 5 ≠ baseline 7/);
  const claim = evaluateListing(ok(page({ desc: "Made in Japan chains and necklaces.", body: "x" })), neck, "en");
  assert.match(claim.problems.join(";"), /origin or country-branded-metal claim/);
  const ja = evaluateListing(ok(page({ desc: neck.approved.ja, body: neck.approved.ja, canonical: neck.urls.ja })), neck, "ja");
  assert.equal(ja.verdict, "APPLIED");
});

test("evaluateArticle: APPLIED only when every approved paragraph is present and, in English, the removed phrase is gone", () => {
  const a = parsed.article;
  const bodyOk = `<body><p>${a.approvedParagraphs.en[0]}</p><p>${a.approvedParagraphs.en[1]}</p></body>`;
  assert.equal(evaluateArticle(ok(bodyOk), a, "en").verdict, "APPLIED");
  const bodyOld = `<body><p>Our collections include Japan-made K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces.</p><p>${a.approvedParagraphs.en[1]}</p></body>`;
  const r = evaluateArticle(ok(bodyOld), a, "en");
  assert.equal(r.verdict, "NOT APPLIED"); assert.match(r.problems.join(";"), /approved paragraph not found/); assert.match(r.problems.join(";"), /removed phrase still present/);
  const jaOk = `<body><p>${a.approvedParagraphs.ja[0]}</p><p>${a.approvedParagraphs.ja[1]}</p></body>`;
  assert.equal(evaluateArticle(ok(jaOk), a, "ja").verdict, "APPLIED");
  assert.equal(evaluateArticle(ok("<body></body>"), a, "ja").facts.paragraphsFound, 0);
});

test("renderReport: one row per page, the article labelled as a content task, BUG-03 rule stated", () => {
  const rows = [{ kind: "SEO", record: "Necklaces collection", lang: "en", url: neck.urls.en, verdict: "OLD", problems: [], facts: { productLinks: 12 } }, { kind: "CONTENT (not an SEO status item)", record: "Article", lang: "ja", url: "u", verdict: "NOT APPLIED", problems: ["x"], facts: {} }];
  const md = renderReport(rows, { base: DEFAULT_BASE, when: "2026-11-01T00:00:00Z" });
  assert.match(md, /\| SEO \| Necklaces collection \| EN \| \*\*OLD\*\* \| — \| 12 \|/);
  assert.match(md, /Listing texts applied: 0 of 1\. Article: JA NOT APPLIED\. BUG-03 closes only when both article languages are APPLIED/);
});
