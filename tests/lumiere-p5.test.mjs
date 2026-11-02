// P5 (redesign/lumiere-p5-polish): the reviewer's findings, the Hub wiring of the home slots, and the guard's manifest — pinned.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const { lumiereCollections, lumiereHero, lumiereFeatured } = await import("../lib/content/lumiere-home.ts");

const href = (slug) => `/categories/${slug}`;
const slots = {
  categoryPhotos: { "fine-jewelry": { src: "https://hub.example/cat/fine.webp", alt: "Fine Jewelry" } },
  heroPhotos: [1, 2, 3].map((n) => ({ src: `https://hub.example/p/${n}.webp`, alt: `Piece ${n}` })),
  heroPiece: { image: { src: "https://hub.example/p/cut.webp", alt: "Piece cut" }, kind: "cut" },
  featured: [
    { name: "K18 Twist bangle", materials: ["K18", "PT900"], price: "￥236,800", photo: { src: "https://hub.example/f/1.webp", alt: "Twist bangle" }, stage: { src: "https://hub.example/f/1-cut.webp", alt: "Twist bangle", kind: "cut", model: null }, buy: { variantId: "v1", slug: "twist-bangle", sku: "SKU-1" } },
    { name: "K18 Pearl pendant", materials: ["K18"], price: "￥98,000", photo: { src: "https://hub.example/f/2.webp", alt: "Pearl pendant" }, stage: { src: "https://hub.example/f/2.webp", alt: "Pearl pendant", kind: "whole", model: null }, buy: { variantId: "v2", slug: "pearl-pendant", sku: "SKU-2" } },
  ],
};

test("B — collections: the Hub's category photograph where there is one, a Cha original elsewhere", () => {
  const withHub = lumiereCollections("en", href, slots);
  const first = withHub.cards.find((c) => c.category.slug === "fine-jewelry");
  assert.equal(first.image.src, "https://hub.example/cat/fine.webp");
  const rest = withHub.cards.filter((c) => c.category.slug !== "fine-jewelry");
  assert.ok(rest.every((c) => c.image.src.startsWith("/images/collections/")), "no Hub photo → the Cha original");
  assert.ok(lumiereCollections("en", href).cards.every((c) => c.image.src.startsWith("/images/collections/") && c.image.alt.length > 0), "no slots at all → all Cha originals, with alt");
  assert.ok(lumiereCollections("ja", href).cards.every((c) => /[぀-ヿ一-鿿]/.test(c.image.alt)), "JA alt text");
});

test("B — hero: cards 1–7 take real pieces in order, card 8 (the frame-3 hand photograph) has no Hub source", () => {
  const hero = lumiereHero("en", href, "/collections", slots);
  assert.deepEqual(hero.cards.slice(0, 3).map((c) => c.image.src), slots.heroPhotos.map((p) => p.src));
  assert.ok(hero.cards.slice(3).every((c) => c.image.src.startsWith("/images/collections/")), "a card the Hub cannot fill keeps a Cha original");
  assert.equal(hero.frame3.src, "/images/collections/rings.webp");
  // P5b decision 3: the ring's centre is the Hub's best deck piece (its hero cut-out when approved); no 3D pendant ships.
  assert.deepEqual(hero.centrepiece, { image: slots.heroPiece.image, kind: "cut" });
  assert.equal(hero.pendant3d, null);
  assert.equal(lumiereHero("en", href, "/collections").centrepiece.kind, "whole", "no deck piece → the Cha still life");
});

test("B — featured: real pieces only, each with the stage image of ITS OWN piece (P5b decision 1)", () => {
  const f = lumiereFeatured("en", slots);
  assert.equal(f.pieces.length, 2, "the strip follows the Hub's count");
  const [a, b] = f.pieces;
  assert.equal(a.name, "K18 Twist bangle");
  assert.equal(a.price, "￥236,800", "the Hub's price as printed, never computed");
  assert.deepEqual([...a.materials], ["K18", "PT900"]);
  assert.deepEqual(a.buy, { variantId: "v1", slug: "twist-bangle", sku: "SKU-1" });
  assert.equal(a.photo.src, "https://hub.example/f/1.webp");
  assert.deepEqual(a.stage, { src: "https://hub.example/f/1-cut.webp", alt: "Twist bangle", kind: "cut", model: null });
  assert.equal(b.stage.kind, "whole", "no cut-out → the photograph on a plate");
  assert.equal(b.stage.src, b.photo.src, "the stage shows the piece named on the left");
  assert.equal(lumiereFeatured("en").pieces.length, 0, "no Hub pieces → no block, never a stand-in");
});

test("B — the Hub reader never computes money and the stage buys through the product page's own action", () => {
  const hubSrc = read("lib/lumiere/home-hub.ts");
  assert.ok(!/price_jpy\s*[*/+-]|\*\s*0\.|toPhp|phpRate/.test(hubSrc), "no arithmetic on a price");
  assert.match(hubSrc, /formatMoney\(v\.price_jpy, "JPY"\)/);
  assert.match(hubSrc, /inStockVariant\(p\)/, "only available pieces");
  assert.match(hubSrc, /\(src\.startsWith\("\/"\) && !src\.startsWith\("\/\/"\)\)/, "never a protocol-relative URL");
  const stage = read("components/lumiere/featured/featured-stage.tsx");
  assert.match(stage, /import\("@\/lib\/cart-actions"\)/, "the action loads on the click, not with the home");
  assert.match(stage, /await addToCart\(buy\.variantId, buy\.slug, 1\)/);
  assert.match(read("components/fx/cart-bump.tsx"), /export const CART_ADDED = "cj:cart-added";/);
  assert.match(stage, /const CART_ADDED = "cj:cart-added";/, "the same event name as the header's bump");
  assert.match(stage, /trackAddToCart\(buy\.sku, content\.lang\)/);
  assert.match(stage, /disabled=\{!buy \|\| pending\}/);
});

test("B — the stage turns no placeholder 3D: photographs always, the 3D path only when every piece carries a model", () => {
  const rings = read("components/lumiere/featured/featured-rings.tsx");
  assert.match(rings, /const hasModels = models\.length > 0 && models\.every/);
  assert.match(rings, /if \(!hasModels \|\| !shouldRenderScene\(\)\)/);
  assert.match(rings, /piece\.stage\.model/);
  const home = read("components/lumiere/home/home-view.tsx");
  assert.match(home, /slots\.featured\.length > 0/, "no Hub pieces, no block");
  const cluster = read("components/lumiere/hero/hero-cluster.tsx");
  assert.match(cluster, /has3d \? <HeroPendant tilt=\{tilt\} \/> : <HeroCentrepiece/);
});

test("A1 — the Messenger button steps aside from prices, totals, buttons and fields instead of covering them", () => {
  const m = read("components/site/messenger-button.tsx");
  assert.match(m, /const PROTECTED = "main a:not\(\.pcard\), main button, main input, main select, main textarea, main summary/);
  assert.match(m, /main \.cj-fig/, "prices");
  assert.match(m, /setAttribute\("data-dodge", ""\)/);
  assert.match(m, /document\.activeElement === fab/, "never while it has keyboard focus");
  const css = read("app/lumiere/chrome.css");
  assert.match(css, /\.messenger-fab\[data-dodge\] \{\s*opacity: 0;[\s\S]*visibility: hidden;\s*pointer-events: none;/);
});

test("A2 — the phone tab bar is an opaque bone surface (the opacity modifier on a CSS variable had generated no background)", () => {
  const css = read("app/lumiere/nav.css");
  assert.match(css, /\.lm-tab-bar \{\s*background: var\(--surface, #f4f0ec\) !important;/);
  const ledger = read("scripts/check-contrast.mjs");
  for (const row of ["inactive label", "inactive icon", "current label", "current icon"]) assert.ok(ledger.includes(`nav tab bar: ${row}`), row);
});

test("A3 — the orders ledger is row cards up to 1279 px, the table from 1280", () => {
  const css = read("app/lumiere/inner-account.css");
  assert.match(css, /@media \(max-width: 1279\.98px\) \{\s*\.iac-ledger, \.iac-ledger tbody \{ display: block; \}/);
  assert.match(css, /-webkit-line-clamp: 2/);
});
