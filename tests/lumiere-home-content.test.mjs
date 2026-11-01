// Lumière P2 — the home's copy and slots (lib/content/lumiere-home.ts) against
// the approved copy-fit table (docs/tasks/lumiere-p0-report.md §13) and the
// short category names (§14), in both languages; and the root layout's
// home-path switch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const {
  CATEGORY_ORDER,
  CATEGORY_SHORT_NAME,
  lumiereCategories,
  lumiereHero,
  lumiereCollections,
  lumiereFeatured,
  lumierePhilosophy,
  PHILOSOPHY_SOURCES,
  LUMIERE_HOME_STRINGS,
} = await import("@/lib/content/lumiere-home");
const { CATEGORY_BLURB } = await import("@/lib/content/frame");
const { dict } = await import("@/lib/i18n");
const { isHomePath } = await import("@/lib/lumiere/home-path");

const text = (runs) => runs.map((r) => r.text).join("");
const href = (slug) => `/en/categories/${slug}`;

test("five categories, in the Hub's order, with the §14 pill and card names", () => {
  assert.deepEqual([...CATEGORY_ORDER], ["fine-jewelry", "preloved-jewelry", "preloved-branded-jewelry", "preloved-watches", "preloved-designer-accessories"]);
  const en = lumiereCategories("en"), ja = lumiereCategories("ja");
  assert.equal(en.length, 5);
  assert.deepEqual(en.map((c) => c.pill), ["New", "Preloved", "Branded", "Watches", "Accessories"]);
  assert.deepEqual(ja.map((c) => c.pill), ["新品", "プレラブド", "ブランド", "ウォッチ", "小物"]);
  assert.deepEqual(en.map((c) => text(c.title)), ["New Jewelry.", "Preloved Jewelry.", "Branded Jewelry.", "Watches.", "Designer Accessories."]);
  assert.deepEqual(ja.map((c) => text(c.title)), ["新品ジュエリー。", "プレラブド。", "ブランド品。", "ウォッチ。", "デザイナー小物。"]);
  for (const slug of CATEGORY_ORDER) assert.ok(CATEGORY_SHORT_NAME[slug].en.pill.length <= 11, slug);
});

test("D-24: every card's index line is the existing eyebrow, never a number; the four preloved cards say preloved", () => {
  for (const lang of ["en", "ja"]) {
    const cards = lumiereCategories(lang);
    assert.equal(cards[0].index, dict.home.heroCallerFine[lang]);
    assert.equal(cards[1].index, dict.home.heroPrelovedEyebrow[lang]);
    assert.equal(cards[2].index, dict.home.heroCallerBranded[lang]);
    assert.equal(cards[3].index, dict.home.heroCallerWatches[lang]);
    assert.equal(cards[4].index, dict.home.heroCallerAccessories[lang]);
    for (const c of cards) assert.ok(!/^\d+$/.test(c.index), "no numeric index");
    for (const c of cards.slice(1)) assert.match(c.index, lang === "en" ? /Preloved/ : /プレラブド/);
  }
});

test("the card notes are CATEGORY_BLURB, split into the two measured lines", () => {
  for (const lang of ["en", "ja"]) {
    for (const c of lumiereCategories(lang)) {
      assert.equal(c.note.join(lang === "ja" ? "" : " "), CATEGORY_BLURB[c.slug][lang], `${c.slug} ${lang}`);
      assert.equal(c.note.length, 2, "two lines (row 11)");
    }
  }
});

test("hero copy is hero.h1a / h1b broken into the approved lines; the CTA is hero.cta1; five pills with category links", () => {
  const en = lumiereHero("en", href, "/en/collections");
  assert.equal(en.headline.map(text).join(" "), dict.hero.h1a.en, "the three lines are hero.h1a");
  assert.equal(en.headlinePhoto.map(text).join(" "), dict.hero.h1b.en, "the three lines are hero.h1b");
  assert.deepEqual(en.headline.map(text), ["Timeless", "beauty", "to wear."]);
  assert.deepEqual(en.headlinePhoto.map(text), ["Lasting", "value", "to pass on."]);
  assert.equal(en.headline.flat()[0].italic, true, "the italic capital opens the English line");
  assert.equal(text(en.cta.runs).toLowerCase(), dict.hero.cta1.en.toLowerCase());
  assert.equal(en.cta.href, "/en/collections");
  assert.equal(en.categories.length, 5);
  assert.deepEqual(en.categories.map((c) => c.href), CATEGORY_ORDER.map(href));
  assert.equal(en.categoryStripWidth, 85);
  assert.equal(en.taglineWraps, true);
  assert.equal(en.cards.length, 8);
  assert.ok(en.frame3.src.endsWith("card-08.webp"));

  const ja = lumiereHero("ja", (s) => `/ja/categories/${s}`, "/ja/collections");
  assert.deepEqual(ja.headline.map(text), ["身につける、", "時を超える", "美しさ。"]);
  assert.equal(ja.headline.map(text).join(""), dict.hero.h1a.ja);
  assert.deepEqual(ja.headlinePhoto.map(text), ["受け継がれる", "確かな価値。"], "✂ the comma after 受け継がれる");
  assert.equal(text(ja.cta.runs), dict.hero.cta1.ja);
  assert.equal(ja.categoryStripWidth, 100, "§13 row 7: the JA strip is 100 u");
  assert.equal(ja.taglineWraps, false, "JA taglines are named lines (§5.3)");
  assert.equal(ja.tagline.length, 2);
  assert.equal(ja.taglinePhoto.length, 3);
  for (const run of [...ja.headline, ...ja.headlinePhoto, ...ja.tagline, ...ja.taglinePhoto, ja.cta.runs].flat()) assert.ok(!run.italic, "no italic in Japanese");
});

test("collections: the §13 heading and lead, five cards with the fifth full-width (D-8), notes at 9 / 10 em", () => {
  const en = lumiereCollections("en", href);
  assert.deepEqual(en.heading.map(text), ["Shop by Category.", "Carefully Selected."]);
  assert.equal(en.lead, "Every listing shows weight, purity and stones.");
  assert.ok(dict.home.colsP.en.includes(en.lead), "FIX 3: the lead is colsP's second sentence");
  assert.equal(text(en.cta).toLowerCase(), dict.home.colsLink.en.toLowerCase());
  assert.deepEqual(en.cards.map((c) => c.width), ["narrow", "wide", "wide", "narrow", "full"]);
  assert.deepEqual(en.cards.map((c) => c.noteWidth), [126, 126, 126, 126, 126]);
  assert.deepEqual(en.cards.map((c) => c.href), CATEGORY_ORDER.map(href));
  for (const c of en.cards) assert.ok(c.image.src.startsWith("/lumiere/placeholder/collections/"), c.image.src);
  const ja = lumiereCollections("ja", href);
  assert.deepEqual(ja.heading.map(text), ["カテゴリーから選ぶ。", "厳選したジュエリー。"]);
  assert.equal(ja.cards[0].noteWidth, 140);
  assert.equal(text(ja.cta), dict.home.colsLink.ja);
});

test("featured: five placeholder pieces, the price is '¥ —' and never a figure (D-7), the CTA is cart.add", () => {
  for (const lang of ["en", "ja"]) {
    const f = lumiereFeatured(lang);
    assert.equal(f.pieces.length, 5);
    for (const p of f.pieces) {
      assert.equal(p.placeholder, true);
      assert.equal(p.price, "¥ —");
      assert.ok(!/\d/.test(p.price), "no digits in a placeholder price");
      assert.ok(!/\$/.test(p.price), "never dollars");
      assert.ok(p.model.src.endsWith(".glb") && p.poster.src.endsWith(".webp") && p.photo.src.endsWith(".webp"));
    }
    assert.equal(f.cta, dict.cart.add[lang]);
    assert.ok(f.ringLabel.includes("{n}") && f.ringLabel.includes("{total}"), "a template, never a function (client boundary)");
  }
  assert.equal(text(lumiereFeatured("en").pieces[0].nameRuns), "Trinity.");
  assert.equal(lumiereFeatured("en").pieces[0].nameRuns[0].italic, true);
  assert.equal(lumiereFeatured("ja").pieces[0].nameRuns.some((r) => r.italic), false);
});

test("philosophy: the four values of home.valuesP (FIX 4), notes from about.closing / the eyebrow / colsP, 'About us' → /about", () => {
  for (const lang of ["en", "ja"]) {
    const p = lumierePhilosophy(lang, `/${lang}/about`);
    const src = PHILOSOPHY_SOURCES(lang);
    const lines = Object.values(p.lines).map(text).join(" ");
    // every display row is a fragment of valuesP (case-insensitive, punctuation aside)
    for (const row of Object.values(p.lines)) {
      const plain = text(row).replace(/[.。]/g, "").toLowerCase();
      assert.ok(src.valuesP.toLowerCase().includes(plain), `${lang}: "${text(row)}" is in valuesP`);
    }
    assert.ok(lines.length > 0);
    // the notes draw from about.closing[1] (top), the preloved eyebrow (left), colsP (right), about.closing[0] (bottom)
    const closingWords = src.closing.join(" ");
    for (const line of p.notes.top) assert.ok(closingWords.includes(line.replace(/[.。]$/, "")), `${lang} top note "${line}"`);
    assert.equal(p.cta.label, dict.navMenu.about[lang]);
    assert.equal(p.cta.href, `/${lang}/about`);
    assert.ok(p.backdrop.wide.src.endsWith("backdrop-frame.jpg") && p.backdrop.narrow.src.endsWith("backdrop-frame-412.jpg"));
    if (lang === "ja") {
      assert.equal(p.lines.shapes.length, 2, "a centred JA line is two runs so it splits at the 。");
      assert.ok(Object.values(p.lines).flat().every((r) => !r.italic));
    }
  }
});

test("no British spelling and no origin claim in the home copy; strings exist in both languages", () => {
  for (const lang of ["en", "ja"]) {
    // Copy only — the placeholder assets' own alt text is the reference's and exempt (D-22, lib/lumiere/placeholders.ts).
    const hero = lumiereHero(lang, href, "/x"), cols = lumiereCollections(lang, href), phil = lumierePhilosophy(lang, "/x");
    const all = JSON.stringify([
      hero.headline, hero.headlinePhoto, hero.tagline, hero.taglinePhoto, hero.cta.runs, hero.scrollLabel, hero.categories.map((c) => c.label),
      cols.heading, cols.lead, cols.cta, cols.cards.map((c) => [c.category.title, c.category.index, c.category.note]),
      phil.lines, phil.notes, phil.cta.label, LUMIERE_HOME_STRINGS[lang],
    ]);
    assert.ok(!/jeweller/i.test(all), "D-22");
    assert.ok(!/made in japan|日本製/i.test(all), "origin only via origin-badge");
    for (const v of Object.values(LUMIERE_HOME_STRINGS[lang])) assert.ok(v.length > 0);
  }
});

test("isHomePath: /, /en, /ja (trailing slash, query ignored) and nothing else", () => {
  for (const p of ["/", "/en", "/ja", "/en/", "/ja/", "/?lang=en", "/en?x=1", "/ja#top"]) assert.equal(isHomePath(p), true, p);
  for (const p of ["/en/collections", "/about", "/english", "/japan", "/cart", "", null, undefined, "/en/about"]) assert.equal(isHomePath(p), false, String(p));
});

/* ---------------------------------------------------------------- part B (report §7 home row) */
const {
  lumiereWhy,
  lumiereArrivals,
  lumiereStories,
  lumiereLayaway,
  lumiereLoyalty,
  lumiereRecentlyViewedTitle,
} = await import("@/lib/content/lumiere-home");
const { layawayOffered } = await import("@/lib/layaway-availability");

test("why columns: the four values of the old bento, in order, with the why page as the pill", () => {
  for (const lang of ["en", "ja"]) {
    const why = lumiereWhy(lang, `/${lang}/why-cha-jewels`);
    assert.equal(why.columns.length, 4);
    assert.deepEqual(why.columns.map((c) => c.index), ["01", "02", "03", "04"]);
    assert.deepEqual(why.columns.map((c) => c.name), ["Timeless", "Worth", "Craft", "Quality"].map((k) => dict.home[`value${k}H`][lang]));
    assert.deepEqual(why.columns.map((c) => c.title), ["Timeless", "Worth", "Craft", "Quality"].map((k) => dict.home[`value${k}P`][lang]));
    assert.equal(why.eyebrow, dict.home.valuesEyebrow[lang]);
    assert.equal(why.heading, dict.home.valuesH[lang]);
    assert.equal(why.cta.label, dict.navMenu.why[lang]);
    assert.equal(why.cta.href, `/${lang}/why-cha-jewels`);
  }
});

test("new arrivals: the old section's strings, plus the carousel's own labels with their slots", () => {
  for (const lang of ["en", "ja"]) {
    const a = lumiereArrivals(lang);
    assert.equal(a.eyebrow, dict.home.newEyebrow[lang]);
    assert.equal(a.heading, dict.home.newH[lang]);
    assert.equal(a.viewAll, dict.home.viewAll[lang]);
    assert.equal(a.detail, dict.home.newDetail[lang]);
    assert.equal(a.checked, dict.home.trust1H[lang]);
    assert.ok(a.goTo.includes("{name}") && a.count.includes("{n}") && a.count.includes("{total}"));
    for (const v of Object.values(a)) assert.ok(typeof v === "string" && v.length > 0);
  }
});

test("stories: the old heading block, 'Verified buyer' from reviews, every published story on the home (P3 item 4)", () => {
  const section = readFileSync("components/lumiere/stories/stories-section.tsx", "utf8");
  assert.ok(!/STORIES_ON_HOME|\.slice\(0,/.test(section), "no cap on the stack");
  assert.match(section, /limit: REVIEWS_PAGE_MAX/, "every approved review the route can hand over");
  for (const lang of ["en", "ja"]) {
    const s = lumiereStories(lang);
    assert.equal(s.eyebrow, dict.home.testiEyebrow[lang]);
    assert.equal(s.heading, dict.home.testiH[lang]);
    assert.equal(s.lead, dict.home.testiP[lang]);
    assert.equal(s.verified, dict.reviews.verified[lang]);
    assert.ok(s.count.includes("{n}") && s.count.includes("{total}"));
  }
});

test("layaway band: every string is home.lay*, three steps, the CTA goes to the pieces (never /layaway); the band is English-only by the availability rule", () => {
  const en = lumiereLayaway("en", "/en/collections");
  assert.equal(en.pill, dict.home.layPill.en);
  assert.equal(en.heading, dict.home.layH.en);
  assert.equal(en.lead, dict.home.layP.en);
  assert.deepEqual(en.steps.map((s) => s.title), [1, 2, 3].map((n) => dict.home[`layStep${n}H`].en));
  assert.deepEqual(en.steps.map((s) => s.body), [1, 2, 3].map((n) => dict.home[`layStep${n}P`].en));
  assert.deepEqual(en.steps.map((s) => s.index), ["01", "02", "03"]);
  assert.equal(en.calculator.title, dict.home.layCalcH.en);
  assert.equal(en.cta.label, dict.home.layCta.en);
  assert.equal(en.cta.href, "/en/collections");
  assert.ok(!en.cta.href.includes("layaway"));
  // The section itself gates on layawayOffered (components/lumiere/layaway/layaway-section.tsx).
  assert.equal(layawayOffered("en"), true);
  assert.equal(layawayOffered("ja"), false);
});

test("loyalty band (D-21): the programme page's own strings, figures as the lede's words, the pill to /loyalty", () => {
  for (const lang of ["en", "ja"]) {
    const l = lumiereLoyalty(lang, `/${lang}/loyalty`);
    assert.equal(l.eyebrow, dict.nav.loyalty[lang]);
    assert.equal(l.heading, dict.loyalty.h1[lang]);
    assert.equal(l.lead, dict.meta.loyalty.description[lang]);
    assert.deepEqual(l.cells.map((c) => c.value), [dict.loyalty.baseRateValue[lang], dict.loyalty.pointValueValue[lang]]);
    assert.deepEqual(l.cells.map((c) => c.label), [dict.loyalty.baseRate[lang], dict.loyalty.pointValue[lang]]);
    assert.equal(l.note, dict.loyalty.onNextPiece[lang]);
    assert.equal(l.cta.label, dict.loyalty.join[lang]);
    assert.equal(l.cta.href, `/${lang}/loyalty`);
    assert.equal(lumiereRecentlyViewedTitle(lang), dict.pdp.recentlyViewed[lang]);
  }
});

test("part B copy: no British spelling, no origin claim, no invented figures", () => {
  for (const lang of ["en", "ja"]) {
    const all = JSON.stringify([lumiereWhy(lang, "/x"), lumiereArrivals(lang), lumiereStories(lang), lumiereLayaway(lang, "/x"), lumiereLoyalty(lang, "/x")]);
    assert.ok(!/jeweller/i.test(all), "D-22");
    assert.ok(!/made in japan|日本製/i.test(all), "origin only via origin-badge");
  }
});
