// /layaway PIECE PICKER (owner 2026-10-18): the picker's search and the
// ?piece= fallback (lib/layaway-picker.ts). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { filterPieces, initialPieceSlug } = await import("@/lib/layaway-picker");

const pieces = [
  { slug: "k18-chain", name: "K18 Gold Chain Necklace", sku: "CJ-N-0012", price_jpy: 128000, image: null },
  { slug: "pt-ring", name: "Pt900 Diamond Ring", sku: "CJ-R-0450", price_jpy: 96000, image: { kind: "whole", src: "https://x/a.jpg" } },
  { slug: "k18-bangle", name: "K18 Bangle", sku: "BR-7781", price_jpy: 210000, image: { kind: "cut", src: "https://x/b.png" } },
];
const slugs = (list) => list.map((p) => p.slug);

test("a blank or whitespace query returns every piece, in the pool's order", () => {
  assert.deepEqual(slugs(filterPieces(pieces, "")), ["k18-chain", "pt-ring", "k18-bangle"]);
  assert.deepEqual(slugs(filterPieces(pieces, "   ")), ["k18-chain", "pt-ring", "k18-bangle"]);
});

test("matches the name, case-insensitive, and keeps the pool's order", () => {
  assert.deepEqual(slugs(filterPieces(pieces, "k18")), ["k18-chain", "k18-bangle"]);
  assert.deepEqual(slugs(filterPieces(pieces, "DIAMOND")), ["pt-ring"]);
  assert.deepEqual(slugs(filterPieces(pieces, "  bangle ")), ["k18-bangle"]);
});

test("matches the SKU, case-insensitive", () => {
  assert.deepEqual(slugs(filterPieces(pieces, "cj-r-0450")), ["pt-ring"]);
  assert.deepEqual(slugs(filterPieces(pieces, "br-77")), ["k18-bangle"]);
  assert.deepEqual(slugs(filterPieces(pieces, "cj-")), ["k18-chain", "pt-ring"]);
});

test("no match is an empty list, never a fallback", () => {
  assert.deepEqual(filterPieces(pieces, "sapphire"), []);
});

test("returns a copy: the caller's pool is never mutated", () => {
  const out = filterPieces(pieces, "");
  out.pop();
  assert.equal(pieces.length, 3);
});

test("?piece= opens that piece only when it is in the pool", () => {
  assert.equal(initialPieceSlug(pieces, "pt-ring", "k18-chain"), "pt-ring");
  assert.equal(initialPieceSlug(pieces, "not-reservable", "k18-chain"), "k18-chain");
  assert.equal(initialPieceSlug(pieces, "", "k18-chain"), "k18-chain");
  assert.equal(initialPieceSlug(pieces, null, "k18-chain"), "k18-chain");
  assert.equal(initialPieceSlug(pieces, undefined, "k18-chain"), "k18-chain");
});
