// HERO ORDER, TICKS MODE (hero order PART 4, 2026-09-29; supabase/contracts/api.md
// in la-tracking, `hero_place` and `picked_at`). While the Hub's switch is
// `product_ticks` a slide shows only ticked pieces, in the Hub's running order.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { hub } = await import("@/lib/hub-api");
const { buildHeroDeck, stagePieces, ticksMode } = await import("@/lib/hero-deck");

const DER = "https://hub.example/storage/v1/object/public/promotions/website/derived";
const photo = (n) => `https://hub.example/photos/${n}.jpeg`;
// A ticked photo: its PRODUCT cut-out, with the tick time.
const tick = (n, at) => ({ status: "approved", url: `${DER}/${"a".repeat(32)}/r${n}/cutout.webp`, width: 700, height: 900, picked_at: at });

let seq = 0;
/** A piece: `media` = [hero_cutout | undefined, …] in gallery order; `place` = hero_place (omit for none). */
function piece({ slug = `p${++seq}`, media = [undefined], place, stock = 1, status = "active" } = {}) {
  const p = {
    slug, name: slug, name_en: slug, name_ja: slug, status,
    product_variants: [{ id: `${slug}-v`, price_jpy: 1000, stock_qty: stock, product_media: media.map((h, i) => ({ url: photo(`${slug}-${i + 1}`), alt: null, sort: i, hero_cutout: h ?? null })) }],
  };
  if (place !== undefined) p.hero_place = place;
  return p;
}
const slugs = (ps) => ps.map((p) => p.slug);

test("mode: a response with hero_place (even all null) or a picked_at is ticks mode; otherwise hero-record mode", () => {
  assert.equal(ticksMode([piece({ place: null })]), true);
  assert.equal(ticksMode([piece({ media: [tick(1, "2026-09-20T00:00:00Z")] })]), true);
  assert.equal(ticksMode([piece({ media: [{ status: "approved", url: `${DER}/hero/x/cutout.webp`, width: 1, height: 1 }] })]), false);
  assert.equal(ticksMode([piece()]), false);
});

test("ticks: ordered by hero_place; a piece with a null place is not shown", () => {
  const ps = [
    piece({ slug: "c", place: 3, media: [tick(1, "2026-09-01T00:00:00Z")] }),
    piece({ slug: "a", place: 1, media: [tick(1, "2026-09-03T00:00:00Z")] }),
    piece({ slug: "x", place: null, media: [tick(1, "2026-08-01T00:00:00Z")] }),
    piece({ slug: "b", place: 2, media: [tick(1, "2026-09-02T00:00:00Z")] }),
  ];
  assert.deepEqual(slugs(stagePieces(ps, "en")), ["a", "b", "c"]);
});

test("ticks: every hero_place null (Hub order unreadable) → earliest picked_at, oldest first, ties in response order", () => {
  const ps = [
    piece({ slug: "late", place: null, media: [tick(1, "2026-09-05T00:00:00Z")] }),
    // Its earliest tick is on photo 2: that one counts.
    piece({ slug: "early", place: null, media: [tick(1, "2026-09-09T00:00:00Z"), tick(2, "2026-09-01T00:00:00Z")] }),
    piece({ slug: "tie1", place: null, media: [tick(1, "2026-09-03T00:00:00Z")] }),
    piece({ slug: "tie2", place: null, media: [tick(1, "2026-09-03T00:00:00Z")] }),
  ];
  assert.deepEqual(slugs(stagePieces(ps, "en")), ["early", "tie1", "tie2"]);
});

test("ticks: at most 3 pieces; place 4 waits and is not shown", () => {
  const ps = [1, 2, 3, 4, 5].map((n) => piece({ slug: `n${n}`, place: n, media: [tick(1, `2026-09-0${n}T00:00:00Z`)] }));
  assert.deepEqual(slugs(stagePieces(ps, "en")), ["n1", "n2", "n3"]);
});

test("ticks: a waiting piece (place 4) stays off even when a placed piece sold", () => {
  const ps = [
    piece({ slug: "a", place: 1, media: [tick(1, "2026-09-01T00:00:00Z")] }),
    piece({ slug: "sold", place: 2, stock: 0, media: [tick(1, "2026-09-02T00:00:00Z")] }),
    piece({ slug: "b", place: 3, media: [tick(1, "2026-09-03T00:00:00Z")] }),
    piece({ slug: "c", place: 4, media: [tick(1, "2026-09-04T00:00:00Z")] }),
  ];
  // The Hub renumbers on its next read; with a stale place the sold piece is
  // still never shown (inStockVariant), and the order stays the Hub's.
  assert.deepEqual(slugs(stagePieces(ps, "en")), ["a", "b", "c"]);
});

test("ticks: never filled with an untagged piece", () => {
  const ps = [
    piece({ slug: "plain1", place: null }),
    piece({ slug: "ticked", place: 1, media: [tick(1, "2026-09-01T00:00:00Z")] }),
    piece({ slug: "plain2", place: null, media: [{ status: "approved", url: `${DER}/hero/x/cutout.webp`, width: 1, height: 1 }] }),
    piece({ slug: "plain3", place: null }),
  ];
  assert.deepEqual(slugs(stagePieces(ps, "en")), ["ticked"]);
  // And with no tick at all, nothing — not the first three in stock.
  assert.deepEqual(slugs(stagePieces([piece({ place: null }), piece({ place: null })], "en")), []);
});

test("ticks: a ticked sold or inactive piece is never shown", () => {
  const ps = [
    piece({ slug: "sold", place: null, stock: 0, media: [tick(1, "2026-09-01T00:00:00Z")] }),
    piece({ slug: "draft", place: null, status: "draft", media: [tick(1, "2026-09-01T00:00:00Z")] }),
    piece({ slug: "ok", place: null, media: [tick(1, "2026-09-02T00:00:00Z")] }),
  ];
  assert.deepEqual(slugs(stagePieces(ps, "en")), ["ok"]);
});

test("ticks: a piece shows only its ticked photos, as cut-outs, in gallery order — a ticked photo 5+ included", () => {
  const media = [tick(1, "2026-09-09T00:00:00Z"), undefined, undefined, undefined, tick(5, "2026-09-01T00:00:00Z"), undefined, tick(7, "2026-09-02T00:00:00Z")];
  const [p] = stagePieces([piece({ slug: "w", place: 1, media })], "en");
  assert.deepEqual(p.photos.map((ph) => ph.url), [photo("w-1"), photo("w-5"), photo("w-7")]);
  assert.deepEqual(p.photos.map((ph) => ph.cutout.url), [media[0].url, media[4].url, media[6].url]);
  assert.ok(p.photos.every((ph) => ph.cutout), "never framed");
});

test("ticks: at most 4 ticked photos cycle, the earliest in the gallery first", () => {
  const media = [1, 2, 3, 4, 5, 6].map((n) => tick(n, `2026-09-0${7 - n}T00:00:00Z`));
  const [p] = stagePieces([piece({ slug: "g", place: 1, media })], "en");
  assert.deepEqual(p.photos.map((ph) => ph.url), [1, 2, 3, 4].map((n) => photo(`g-${n}`)));
});

test("ticks: a ticked photo with an unusable file is left out, never framed", () => {
  const bad = { ...tick(1, "2026-09-01T00:00:00Z"), url: "", width: 0 };
  assert.deepEqual(slugs(stagePieces([piece({ slug: "bad", place: 1, media: [bad] })], "en")), []);
  const [p] = stagePieces([piece({ slug: "mix", place: 1, media: [bad, tick(2, "2026-09-02T00:00:00Z")] })], "en");
  assert.deepEqual(p.photos.map((ph) => ph.url), [photo("mix-2")]);
});

// The deck: the same rules per slide, the Index counts unchanged, and a slide
// with no ticked piece behaves as a slide with nothing in stock.
const CATS = [
  { id: "1", slug: "fine-jewelry", name: "Fine Jewelry", name_ja: null, description: null, description_ja: null, hero_media: null, cta_label: null, cta_label_ja: null, sort_order: 1 },
  { id: "2", slug: "preloved-designer-accessories", name: "Preloved Designer Accessories", name_ja: null, description: null, description_ja: null, hero_media: null, cta_label: null, cta_label_ja: null, sort_order: 2 },
];
async function deck(reads, hide) {
  hub.category = async (slug) => ({ ...CATS.find((c) => c.slug === slug), products: reads[slug] });
  process.env.HERO_HIDE_EMPTY_CATEGORIES = hide ? "1" : "";
  try { return await buildHeroDeck("en", CATS); } finally { delete process.env.HERO_HIDE_EMPTY_CATEGORIES; }
}

test("deck (ticks): slides show ticked pieces only; the accessories Index still counts every piece in stock", async () => {
  const reads = {
    "fine-jewelry": [piece({ slug: "u1", place: null }), piece({ slug: "t2", place: 2, media: [tick(1, "2026-09-02T00:00:00Z")] }), piece({ slug: "t1", place: 1, media: [tick(1, "2026-09-01T00:00:00Z")] })],
    "preloved-designer-accessories": [piece({ slug: "Wallet A", place: null }), piece({ slug: "Belt B", place: null }), piece({ slug: "Card C", place: null, stock: 0 })],
  };
  const [, fine, acc] = await deck(reads, false);
  assert.deepEqual(slugs(fine.pieces), ["t1", "t2"]);
  assert.equal(fine.action, "reserve");
  assert.deepEqual(acc.pieces, []);
  assert.equal(acc.action, "ask");
  assert.deepEqual(acc.counts, [1, 0, 1, 0]);
});

test("deck (ticks): with the empty switch on, a slide with no ticked piece in stock is hidden; a failed read never is", async () => {
  const reads = {
    "fine-jewelry": [piece({ place: null }), piece({ place: null })],
    "preloved-designer-accessories": [piece({ slug: "t", place: 1, media: [tick(1, "2026-09-01T00:00:00Z")] })],
  };
  assert.deepEqual((await deck(reads, true)).map((s) => s.key), ["film", "preloved-designer-accessories"]);
  assert.deepEqual((await deck(reads, false)).map((s) => s.key), ["film", "fine-jewelry", "preloved-designer-accessories"]);
  hub.category = async () => { throw new Error("down"); };
  process.env.HERO_HIDE_EMPTY_CATEGORIES = "1";
  assert.equal((await buildHeroDeck("en", CATS)).length, 3);
  delete process.env.HERO_HIDE_EMPTY_CATEGORIES;
});
