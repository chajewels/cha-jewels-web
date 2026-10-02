// Hero and product cut-outs stay separate (owner rule 2026-09-28):
// hero = the original tool only (the Hub's approved hero_cutout, else the whole
// photo in its framed well; the bundled set was removed in PR 5); product pages
// and cards = the Hub's Photoroom cutout, else the normal photo.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { heroCutout, stagePieces } = await import("@/lib/hero-deck");
const { pieceImages, cardImage } = await import("@/lib/product-media");

const HUB = "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/";
// AL112 photo 1 and C0983 photo 2: both were in the bundled set (removed, PR 5).
const AL112 = `${HUB}promotions/website/page365/81333344/462264810-1773219921.jpeg`;
const C0983_2 = `${HUB}promotions/website/page365/80288104/450588975-1758211904.jpeg`;
// N3940 / W1451-like photo: no bundled cut-out, no larger photo.
const PLAIN = `${HUB}promotions/website/page365/99999999/000000000-0000000000.jpeg`;

const photoroom = { url: "https://hub.example/derived/abc/cutout.webp", width: 800, height: 800, status: "approved" }; // approval first: only approved is shown
const heroRec = { status: "approved", url: "https://hub.example/derived/hero/abc/cutout.webp", width: 700, height: 900 };

const product = (media) => ({
  slug: "p", name: "P", name_en: "P", name_ja: "P", status: "active",
  product_variants: [{ id: "v", price_jpy: 1000, stock_qty: 1, product_media: media.map((m, i) => ({ alt: null, sort: i, ...m })) }],
});

// (a) product media never returns a hero cut-out
test("product page and card: a bundled piece shows its normal photo, not the hero cut-out", () => {
  const p = product([{ url: AL112 }, { url: C0983_2 }]);
  assert.deepEqual(pieceImages(p).map((i) => [i.kind, i.src]), [["whole", AL112], ["whole", C0983_2]]);
  assert.deepEqual([cardImage(p).kind, cardImage(p).src], ["whole", AL112]);
});

test("product page and card: the Hub's hero record is never shown", () => {
  const p = product([{ url: AL112, hero_cutout: heroRec }]);
  assert.equal(cardImage(p).kind, "whole");
  assert.equal(cardImage(p).src, AL112);
});

test("product page and card: the Photoroom cut-out still shows where the product logic used one", () => {
  const p = product([{ url: AL112, cutout: photoroom }, { url: PLAIN, cutout: { ...photoroom, status: "needs_review" } }]);
  assert.deepEqual(pieceImages(p).map((i) => [i.kind, i.src]), [["cut", photoroom.url], ["whole", PLAIN]]);
  // Approval first (owner 2026-10-02): a cut-out that only passed the checks is not shown.
  for (const status of ["ok", "auto_fixed"]) {
    const q = product([{ url: AL112, cutout: { ...photoroom, status } }]);
    assert.deepEqual(pieceImages(q).map((i) => [i.kind, i.src]), [["whole", AL112]]);
  }
});

// (b) the hero ignores Photoroom
test("hero: ignores a Photoroom cut-out even when one is present and shown", () => {
  assert.equal(heroCutout({ url: PLAIN, alt: null, sort: 0, cutout: photoroom }), null);
  const [piece] = stagePieces([product([{ url: PLAIN, cutout: photoroom }])], "en");
  assert.equal(piece.photos[0].cutout, null);
});

test("hero: a formerly bundled photo shows whole, even when Photoroom sent a cut-out (PR 5)", () => {
  assert.equal(heroCutout({ url: AL112, alt: null, sort: 0, cutout: photoroom }), null);
});

test("hero: a held Photoroom cut-out does not skip a hero photo", () => {
  const [piece] = stagePieces([product([{ url: AL112 }, { url: PLAIN, cutout: { ...photoroom, status: "needs_review" } }])], "en");
  assert.equal(piece.photos.length, 2);
});

// (c) the approved Hub hero cut-out, framed well otherwise — the bundled set is gone (PR 5)
test("hero: a formerly bundled photo with no Hub record stands whole in its well", () => {
  const [piece] = stagePieces([product([{ url: AL112 }, { url: C0983_2 }])], "en");
  assert.deepEqual(piece.photos.map((ph) => ph.cutout), [null, null]);
});

test("hero: the owner-approved Hub hero cut-out is shown", () => {
  const [piece] = stagePieces([product([{ url: AL112, hero_cutout: heroRec }])], "en");
  assert.equal(piece.photos[0].cutout.url, heroRec.url);
});

test("hero: the whole photo in the framed well otherwise (N3940 / W1451)", () => {
  const [piece] = stagePieces([product([{ url: PLAIN }, { url: `${PLAIN}?2` }])], "en");
  assert.deepEqual(piece.photos.map((ph) => [ph.url, ph.cutout]), [[PLAIN, null], [`${PLAIN}?2`, null]]);
});

test("hero: a rejected or waiting Hub hero cut-out leaves the whole photo", () => {
  assert.equal(heroCutout({ url: AL112, alt: null, sort: 0, hero_cutout: { status: "rejected" } }), null);
  assert.equal(heroCutout({ url: AL112, alt: null, sort: 0, hero_cutout: null }), null);
});

test("hero: a held Hub hero cut-out skips a later photo; the first stays, whole", () => {
  const [piece] = stagePieces([product([{ url: PLAIN }, { url: `${PLAIN}?2`, hero_cutout: { status: "held" } }])], "en");
  assert.equal(piece.photos.length, 1);
  const [first] = stagePieces([product([{ url: PLAIN, hero_cutout: { status: "held" } }])], "en");
  assert.deepEqual(first.photos.map((ph) => ph.cutout), [null]);
});

test("hero: a malformed approved record is not shown", () => {
  assert.equal(heroCutout({ url: PLAIN, alt: null, sort: 0, hero_cutout: { status: "approved", url: "", width: 0, height: 0 } }), null);
});

// The cut window (2026-09-28): the hero shows photos from the first
// HERO_PHOTOS (4) only — the photos scripts/hero-cutouts/run.py cuts.
const { allImages } = await import("@/lib/queries/products");
const cutRec = (n) => ({ status: "approved", url: `https://hub.example/derived/hero/${n}/cutout.webp`, width: 700, height: 900 });
const gallery = (n) => Array.from({ length: n }, (_, i) => `${PLAIN}?g${i + 1}`);

test("hero window: at most the first 4 photos, never photo 5", () => {
  const urls = gallery(6);
  const [piece] = stagePieces([product(urls.map((url, i) => ({ url, hero_cutout: cutRec(i + 1) })))], "en");
  assert.deepEqual(piece.photos.map((ph) => ph.url), urls.slice(0, 4));
});

test("hero window: a held photo inside the window is skipped, not replaced by photo 5 (C0853 / W2527)", () => {
  const urls = gallery(5);
  const media = urls.map((url, i) => ({ url, hero_cutout: i === 1 ? { status: "held" } : i === 4 ? null : cutRec(i + 1) }));
  const [piece] = stagePieces([product(media)], "en");
  assert.deepEqual(piece.photos.map((ph) => ph.url), [urls[0], urls[2], urls[3]]);
  assert.ok(piece.photos.every((ph) => ph.cutout), "every photo shown is a cut-out; none framed");
});

test("hero window: a repeated URL counts once, exactly as run.py all_images", () => {
  const urls = gallery(5);
  // Photo 1 appears again on a second variant: without de-duplication it would
  // take a window slot and push photo 4 out.
  const p = product([{ url: urls[0] }, { url: urls[1] }, { url: urls[2] }, { url: urls[3] }, { url: urls[4] }]);
  p.product_variants.push({ id: "v2", price_jpy: 2000, stock_qty: 1, product_media: [{ url: urls[0], alt: null, sort: 1 }] });
  const [piece] = stagePieces([p], "en");
  assert.deepEqual(piece.photos.map((ph) => ph.url), urls.slice(0, 4));
});

test("allImages: each URL once, first place kept, Hub sort order", () => {
  const p = product([{ url: "a" }, { url: "b" }, { url: "c" }]);
  p.product_variants.push({ id: "v2", price_jpy: 2000, stock_qty: 1, product_media: [{ url: "b", alt: null, sort: 0 }, { url: "d", alt: null, sort: 5 }] });
  assert.deepEqual(allImages(p).map((m) => m.url), ["a", "b", "c", "d"]);
});

test("hero window: a photo without a URL takes no slot (run.py drops it too)", () => {
  const urls = gallery(5);
  const [piece] = stagePieces([product([{ url: "" }, ...urls.map((url) => ({ url }))])], "en");
  assert.deepEqual(piece.photos.map((ph) => ph.url), urls.slice(0, 4));
});
