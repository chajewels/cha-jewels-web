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
  featured: [
    { name: "K18 Twist bangle", materials: ["K18", "PT900"], price: "￥236,800", photo: { src: "https://hub.example/f/1.webp", alt: "Twist bangle" }, buy: { variantId: "v1", slug: "twist-bangle", sku: "SKU-1" } },
  ],
};

test("B — collections: the Hub's category photograph where there is one, the placeholder elsewhere", () => {
  const withHub = lumiereCollections("en", href, slots);
  const first = withHub.cards.find((c) => c.category.slug === "fine-jewelry");
  assert.equal(first.image.src, "https://hub.example/cat/fine.webp");
  assert.equal(first.image.placeholder, undefined, "a Hub photograph is not a placeholder");
  const rest = withHub.cards.filter((c) => c.category.slug !== "fine-jewelry");
  assert.ok(rest.every((c) => c.image.src.startsWith("/lumiere/placeholder/")), "no Hub photo → the placeholder");
  assert.ok(lumiereCollections("en", href).cards.every((c) => c.image.src.startsWith("/lumiere/placeholder/")), "no slots at all → all placeholders");
});

test("B — hero: cards 1–7 take real pieces in order, card 8 (the frame-3 hand photograph) has no Hub source", () => {
  const hero = lumiereHero("en", href, "/collections", slots);
  assert.deepEqual(hero.cards.slice(0, 3).map((c) => c.image.src), slots.heroPhotos.map((p) => p.src));
  assert.ok(hero.cards.slice(3).every((c) => c.image.src.startsWith("/lumiere/placeholder/")), "a card the Hub cannot fill keeps its placeholder");
  assert.ok(hero.frame3.src.startsWith("/lumiere/placeholder/"));
});

test("B — featured: a real piece carries the Hub's name, price and metals and can be bought; the others stay disabled placeholders", () => {
  const f = lumiereFeatured("en", slots);
  const [a, ...others] = f.pieces;
  assert.equal(a.placeholder, false);
  assert.equal(a.name, "K18 Twist bangle");
  assert.equal(a.price, "￥236,800", "the Hub's price as printed, never computed");
  assert.deepEqual([...a.materials], ["K18", "PT900"]);
  assert.deepEqual(a.buy, { variantId: "v1", slug: "twist-bangle", sku: "SKU-1" });
  assert.equal(a.photo.src, "https://hub.example/f/1.webp");
  assert.ok(others.every((p) => p.placeholder === true && p.buy === null && p.price === "¥ —"), "D-7: a placeholder has nothing to buy");
  assert.ok(lumiereFeatured("en").pieces.every((p) => p.placeholder && p.buy === null), "no Hub slots → all placeholders");
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
  assert.match(stage, /disabled=\{activePiece\.placeholder \|\| !buy \|\| pending\}/);
});

test("B — check:placeholders reports every remaining placeholder with its reason and fails on an unclassified file", () => {
  const s = read("scripts/check-placeholders.mjs");
  assert.match(s, /const MANIFEST = \[/);
  assert.match(s, /status: "none"/);
  assert.match(s, /not in the manifest/);
  assert.match(read("docs/tasks/lumiere-hub-slots.md"), /DRAFT for the owner and Lovable/);
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
