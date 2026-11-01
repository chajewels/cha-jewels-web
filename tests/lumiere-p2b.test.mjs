// P2b (redesign/lumiere-p2b-home-fixes): the review's fixed points, pinned.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const { dict } = await import("@/lib/i18n");
const { lumiereHero, lumiereCollections } = await import("@/lib/content/lumiere-home");
const { mergeStories, toStories } = await import("@/lib/stories");
const { testimonials: fixtureTestimonials } = await import("@/lib/fixtures");

test("item 1 — the card's index line (the Preloved eyebrow, D-24) is content, never a hover reveal", () => {
  const card = read("components/lumiere/collections/collection-card.tsx");
  const index = card.slice(card.indexOf("<span\n          data-card-index"), card.indexOf("{card.category.index}"));
  assert.ok(index.includes("data-card-index"), "marked as the index line");
  assert.ok(!index.includes("data-card-reveal"), "not a hover-revealed element");
  assert.ok(!index.includes("aria-hidden"), "not hidden from assistive tech");
  const css = read("app/lumiere/blocks.css");
  assert.match(css, /\.collections \[data-card-index\] \{\s*opacity: 1;\s*\}/, "an explicit rest rule: visible at every width");
});

test("item 2 — the h1 is hero.h1a once, as plain text; the engine's copies are aria-hidden beside it", () => {
  for (const lang of ["en", "ja"]) {
    const hero = lumiereHero(lang, (s) => `/${lang}/categories/${s}`, `/${lang}/collections`);
    assert.equal(hero.headlineText, dict.hero.h1a[lang]);
    const cols = lumiereCollections(lang, (s) => `/${lang}/categories/${s}`);
    assert.equal(cols.headingText, lang === "en" ? "Shop by Category. Carefully Selected." : "カテゴリーから選ぶ。厳選したジュエリー。");
  }
  const stage = read("components/lumiere/hero/hero-stage.tsx");
  assert.match(stage, /<h1 id="hero-headline" className="sr-only">\s*\{content\.headlineText\}\s*<\/h1>/);
  assert.ok(stage.includes('aria-hidden="true"\n          data-hero-headline-art'), "the animated copy is aria-hidden and outside the h1");
  const featured = read("components/lumiere/featured/featured-stage.tsx");
  assert.match(featured, /<h2 id="featured-title" className="sr-only">/);
  const collections = read("components/lumiere/collections/collections-reveal.tsx");
  assert.match(collections, /<h2 id="collections-heading" className="sr-only">/);
});

test("item 3 — the badge artwork is never inverted into a white disc", () => {
  for (const p of ["components/lumiere/hero/hero-header.tsx", "components/lumiere/common/preloader.tsx", "components/lumiere/footer/footer-section.tsx", "app/lumiere/sections.css"]) {
    const src = read(p);
    assert.ok(!/brightness-0 invert|brightness\(0\) invert|invert\(1\)/.test(src.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")), p);
  }
  // blocks.css keeps the reference's `.footer__mark` plate rule (its wordmark
  // PNG, unused here); our badge is `.footer__badge` and must carry no filter.
  const blocks = read("app/lumiere/blocks.css");
  const badgeRule = blocks.slice(blocks.indexOf(".footer--cha .footer__badge {"), blocks.indexOf("}", blocks.indexOf(".footer--cha .footer__badge {")));
  assert.ok(!badgeRule.includes("filter"), "the badge rule has no filter");
  assert.ok(!/footer__mark(?!s)/.test(read("components/lumiere/footer/footer-section.tsx")), "our footer never uses the reference's inverted plate class");
});

test("item 4 — the Messenger button is not shown on the home; the cookie banner is a bar there", () => {
  const messenger = read("components/site/messenger-button.tsx");
  const shown = messenger.match(/const SHOWN_ON = \[([^\]]*)\]/)[1];
  assert.ok(!/"\/"/.test(shown), "SHOWN_ON names shopping paths only, never /");
  // P3: the bar on every page (the home switch is gone).
  const consent = read("components/site/consent-banner.tsx");
  assert.ok(!consent.includes("isHomePath") && consent.includes("consent-banner consent-banner--bar"));
  const css = read("app/lumiere/sections.css");
  assert.ok(css.includes(".hero-band {\n  bottom: var(--lm-bottom-bar, 0px);"), "the hero band lifts above the bars");
});

test("item 11 — the loyalty band reads the Hub's tiers and sets the ledger figures as plain text", () => {
  const src = read("components/lumiere/loyalty/loyalty-section.tsx");
  assert.ok(src.includes("hub.loyaltyTiers()"), "tiers from the Hub");
  assert.ok(src.includes('t("loyalty", "times", { n: String(tier.multiplier) })'), "multipliers through the existing string");
  assert.ok(!src.includes("DigitRoll"), "no digit roll on the base rate or the point value");
});

test("item 12 — fixture testimonials exist only in fixture mode; an empty list hides the section", () => {
  const hubApi = read("lib/hub-api.ts");
  assert.match(hubApi, /testimonials: \(\): Promise<Testimonial\[\]> =>\s*FIXTURES \? Promise\.resolve\(fx\.testimonials\) : call\("\/testimonials"/);
  for (const t of fixtureTestimonials) {
    assert.match(t.id, /^fx-t-/);
    assert.match(t.customer_name, /^Fixture customer/);
  }
  assert.deepEqual(mergeStories(toStories([], "en"), []), []);
  const section = read("components/lumiere/stories/stories-section.tsx");
  assert.ok(section.includes("if (stories.length === 0) return null;"));
});
