// CUSTOMER STORIES (owner decision 2026-10-17): approved reviews join the
// testimonials in one slideshow (lib/stories.ts). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { toStories, reviewsToStories, mergeStories } = await import("@/lib/stories");

const review = (over = {}) => ({
  id: "r1",
  rating: 4.6,
  body: "Lovely chain,\n  exactly as pictured.",
  display_name: "Maria S.",
  piece_name: "Kihei chain 50 cm",
  product: { slug: "kihei-chain-50-cm", name: "Kihei chain 50 cm" },
  photos: [],
  approved_at: "2026-09-12T03:00:00+00:00",
  location: null,
  ...over,
});

const testimonial = (over = {}) => ({
  id: "t1",
  quote_en: "Beautiful ring.",
  quote_ja: null,
  customer_name: "Ana",
  item: "Solitaire ring",
  rating: 5,
  location: "Manila",
  testimonial_date: "2026-08-01",
  ...over,
});

test("a review becomes a verified story, its words exactly as held", () => {
  const [s] = reviewsToStories([review()], "en");
  assert.equal(s.id, "review:r1");
  assert.equal(s.quote, "Lovely chain,\n  exactly as pictured.");
  assert.equal(s.qLang, "en");
  assert.equal(s.name, "Maria S.");
  assert.equal(s.item, "Kihei chain 50 cm");
  assert.equal(s.rating, 5);
  assert.equal(s.location, null);
  assert.equal(s.verified, true);
  assert.deepEqual(s.date, { iso: "2026-09-12T03:00:00+00:00", label: "September 2026" });
});

test("a review's location is the Hub's, trimmed, and shown like a testimonial's", () => {
  const [s] = reviewsToStories([review({ location: "  Makati City, Philippines  " })], "en");
  assert.equal(s.location, "Makati City, Philippines");
  const [t] = toStories([testimonial()], "en");
  assert.equal(t.location, "Manila");
});

test("an empty or blank review location is null", () => {
  const out = reviewsToStories([review({ id: "a", location: "" }), review({ id: "b", location: "   " })], "en");
  assert.deepEqual(out.map((s) => s.location), [null, null]);
});

test("a review from an older Hub payload (no location field) has a null location", () => {
  const { location: _omit, ...older } = review();
  assert.equal("location" in older, false);
  const [s] = reviewsToStories([older], "en");
  assert.equal(s.location, null);
});

test("a review's month is Japan time and never shows the day", () => {
  // 23:30 UTC on 31 Aug is 08:30 on 1 Sep in Japan.
  const [en] = reviewsToStories([review({ approved_at: "2026-08-31T23:30:00+00:00" })], "en");
  assert.equal(en.date.label, "September 2026");
  const [ja] = reviewsToStories([review({ approved_at: "2026-08-31T23:30:00+00:00" })], "ja");
  assert.equal(ja.date.label, "2026年9月");
  assert.equal(ja.qLang, "ja");
});

test("a review with no body is dropped; ratings are clamped to 0–5", () => {
  const out = reviewsToStories([review({ id: "a", body: "" }), review({ id: "b", body: null }), review({ id: "c", body: "  " }), review({ id: "d", rating: 9 }), review({ id: "e", rating: -2 })], "en");
  assert.deepEqual(out.map((s) => s.id), ["review:d", "review:e"]);
  assert.deepEqual(out.map((s) => s.rating), [5, 0]);
});

test("a review that mentions layaway is not filtered (the owner's approval is the gate)", () => {
  const out = reviewsToStories([review({ body: "Paid with layaway, so easy." })], "ja");
  assert.equal(out.length, 1);
});

test("testimonials are not verified", () => {
  const out = toStories([testimonial()], "en");
  assert.equal(out.length, 1);
  assert.equal(out[0].verified, false);
  assert.equal(out[0].id, "t1");
});

test("mergeStories: newest first, undated after dated in their own order, nothing capped", () => {
  const ts = toStories([
    testimonial({ id: "t-aug", testimonial_date: "2026-08-01" }),
    testimonial({ id: "t-none1", testimonial_date: null }),
    testimonial({ id: "t-jun", testimonial_date: "2026-06-15" }),
    testimonial({ id: "t-none2", testimonial_date: "not a date" }),
  ], "en");
  const rs = reviewsToStories([
    review({ id: "oct", approved_at: "2026-10-02T00:00:00+00:00" }),
    review({ id: "jul", approved_at: "2026-07-20T00:00:00+00:00" }),
  ], "en");
  assert.deepEqual(mergeStories(ts, rs).map((s) => s.id), ["review:oct", "t-aug", "review:jul", "t-jun", "t-none1", "t-none2"]);
  assert.deepEqual(mergeStories([], rs).map((s) => s.id), ["review:oct", "review:jul"]);
  assert.deepEqual(mergeStories(ts, []).length, 4);
  const many = reviewsToStories(Array.from({ length: 20 }, (_, i) => review({ id: `m${i}` })), "en");
  assert.equal(mergeStories(ts, many).length, 24);
});

// Review photos (2026-10-18): the home review cards showed them; moving reviews
// into the stories had dropped them. They come back on review stories only.
const PHOTO = "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/review-photos/r1/1.jpg";

test("a review story carries its approved photos, captioned in the page's language", () => {
  const [en] = reviewsToStories([review({ photos: [PHOTO] })], "en");
  assert.deepEqual(en.photos, [{ src: PHOTO, alt: "Photo 1 from Maria S." }]);
  const [ja] = reviewsToStories([review({ photos: [PHOTO], display_name: "岩城 ミ." })], "ja");
  assert.deepEqual(ja.photos, [{ src: PHOTO, alt: "岩城 ミ.様のお写真 1" }]);
});

test("review photos keep the Hub's order and stop at four", () => {
  const six = Array.from({ length: 6 }, (_, i) => `${PHOTO}?n=${i + 1}`);
  const [s] = reviewsToStories([review({ photos: six })], "en");
  assert.deepEqual(s.photos.map((p) => p.src), six.slice(0, 4));
  assert.deepEqual(s.photos.map((p) => p.alt), ["Photo 1 from Maria S.", "Photo 2 from Maria S.", "Photo 3 from Maria S.", "Photo 4 from Maria S."]);
});

test("blank, non-string or missing review photos give no photos", () => {
  const [a] = reviewsToStories([review({ photos: ["", "  ", null, 7] })], "en");
  assert.deepEqual(a.photos, []);
  const { photos: _omit, ...older } = review();
  const [b] = reviewsToStories([older], "en");
  assert.deepEqual(b.photos, []);
});

test("a testimonial never has photos", () => {
  const [t] = toStories([testimonial()], "en");
  assert.deepEqual(t.photos, []);
});
