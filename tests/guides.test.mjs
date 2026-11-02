// Phases 6-8 preparation (agreed mocks; no guide is published): the registry's publication guard, the English-only
// not-yet-live family, the route's refusal shape and the internal-linking logic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const R = await import("@/lib/guides/registry");
const { learnMoreLinks } = await import("@/lib/guides/links");
const { FAMILY_RULES, createLocaleRules, localePath, isLocalizable, siblingPath } = await import("@/lib/locale");

const mockPublished = (over = {}) => ({
  slug: "kihei", status: "published", title: "Kihei chains explained", description: "What kihei means, the cuts and how to read them.",
  h1: "Kihei chains", intro: "Intro.", sections: [{ h2: "Cuts", paragraphs: ["Text."] }], faq: [{ q: "What is it?", a: "A chain." }],
  approval: { by: "Owner", date: "2026-11-05" }, evidence: ["source note"], updated: "2026-11-05", ...over,
});

test("shipped state: both guides are DRAFT with no copy; nothing is published or routable", () => {
  assert.deepEqual(R.GUIDES.map((g) => [g.slug, g.status]), [["kihei", "draft"], ["k18-gold-japan", "draft"]]);
  for (const g of R.GUIDES) { assert.equal("sections" in g, false); assert.equal("title" in g, false); }
  assert.deepEqual(R.publishedGuides(), []);
  assert.equal(R.publishedGuide("kihei"), undefined);
});
test("the publication guard: a complete mock passes; each missing requirement blocks publication", () => {
  assert.deepEqual(R.guideProblems(mockPublished()), []);
  const cases = { approval: undefined, evidence: [], title: "x".repeat(71), description: "", sections: [], faq: [{ q: "q", a: "" }], updated: "yesterday", slug: "Bad Slug" };
  for (const [k, v] of Object.entries(cases)) assert.ok(R.guideProblems(mockPublished({ [k]: v })).length > 0, k);
  assert.ok(R.guideProblems(mockPublished({ approval: { by: " ", date: "2026-11-05" } })).length > 0, "a blank approver is not an approval");
});
test("an invalid 'published' entry is NOT routable, listed or linked", () => {
  const bad = [mockPublished({ evidence: [] })];
  assert.deepEqual(R.publishedGuides(bad), []);
  assert.equal(R.publishedGuide("kihei", bad), undefined);
  assert.equal(R.publishedGuides([mockPublished()]).length, 1);
});

test("the guides family is English-only and NOT LIVE: no link can be minted, no Japanese sibling exists", () => {
  const rule = FAMILY_RULES.get("guides");
  assert.deepEqual(rule, { shape: "children", locales: ["en"], live: false });
  assert.equal(localePath("/guides/kihei", "en"), "/guides/kihei", "unchanged while not live");
  assert.equal(isLocalizable("/guides/kihei"), false);
  assert.equal(localePath("/guides/kihei", "ja"), "/guides/kihei");
});
test("when a guide is published the family goes live in English only (proved on a rule table)", () => {
  const live = createLocaleRules(new Map([...FAMILY_RULES, ["guides", { shape: "children", locales: ["en"], live: true }]]));
  assert.equal(live.localePath("/guides/kihei", "en"), "/en/guides/kihei");
  assert.equal(live.localePath("/guides/kihei", "ja"), "/guides/kihei", "never /ja/guides");
  assert.equal(live.siblingPath("/en/guides/kihei", "ja"), null, "no Japanese sibling");
  assert.equal(live.isLocalizable("/ja/guides/kihei"), false);
});
test("GUARD: a published guide requires the family to be live (vacuous today, binding at first publication)", () => {
  assert.ok(R.publishedGuides().length === 0 || FAMILY_RULES.get("guides").live === true);
});

test("route source guards: English only, published only, 404 says nothing, alternates en + x-default only", () => {
  const src = readFileSync("app/[lang]/guides/[slug]/page.tsx", "utf8");
  assert.match(src, /if \(lang !== "en"\) notFound\(\)/);
  assert.match(src, /publishedGuide\(slug\)/);
  assert.match(src, /ja: false/);
  assert.doesNotMatch(src, /export const revalidate|generateStaticParams/, "like every [lang] page: rendered per request");
  const comp = readFileSync("components/guides/guide-article.tsx", "utf8");
  assert.equal((comp.match(/<h1>/g) ?? []).length, 1, "exactly one h1");
  assert.match(comp, /guide\.faq\.length > 0 && <JsonLd type="faq"/, "FAQ JSON-LD only from rendered entries");
  const sm = readFileSync("app/sitemap.ts", "utf8");
  assert.match(sm, /publishedGuides\(\)\.map/);
});

// ---- internal linking (mocked published guides)
const PUB = [mockPublished(), mockPublished({ slug: "k18-gold-japan", title: "K18 gold in Japan" })];
test("links: with NO guide published every link is the existing page that serves the intent", () => {
  const l = learnMoreLinks({ lang: "en", material: "K18 gold", collectionSlugs: ["kihei"], weightG: 12.5, condition: "Preloved" });
  assert.deepEqual(l.map((x) => [x.id, x.href, x.kind]), [["k18", "/en/jewelry-guide#metals", "fallback"], ["kihei", "/en/collections/necklaces", "fallback"], ["preloved", "/en/faq", "fallback"]]);
});
test("links: a PUBLISHED guide is linked in English; Japanese pages never link a guide", () => {
  const en = learnMoreLinks({ lang: "en", material: "K18", collectionSlugs: ["kihei"] }, PUB);
  assert.deepEqual(en.map((x) => [x.id, x.href, x.kind]), [["k18", "/en/guides/k18-gold-japan", "guide"], ["kihei", "/en/guides/kihei", "guide"]]);
  const ja = learnMoreLinks({ lang: "ja", material: "K18", collectionSlugs: ["kihei"] }, PUB);
  assert.deepEqual(ja.map((x) => [x.href, x.kind]), [["/ja/jewelry-guide#metals", "fallback"], ["/ja/collections/necklaces", "fallback"]]);
});
test("links: decided from Hub data only; none without it; deduped; capped at three; never layaway", () => {
  assert.deepEqual(learnMoreLinks({ lang: "en" }), []);
  assert.deepEqual(learnMoreLinks({ lang: "en", material: "Platinum PT900", weightG: 0, collectionSlugs: ["rings"], condition: "New" }), []);
  const all = learnMoreLinks({ lang: "en", material: "k 18", collectionSlugs: ["kihei"], weightG: 30, condition: "Preloved" });
  assert.ok(all.length <= 3);
  assert.equal(new Set(all.map((x) => x.href)).size, all.length, "k18 and weight share a fallback: deduped");
  for (const x of all) assert.ok(!/layaway/i.test(x.href + x.label));
  assert.ok(learnMoreLinks({ lang: "ja", condition: "Preloved" })[0].label.includes("プレラブド"));
});
