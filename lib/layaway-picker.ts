/**
 * /layaway PIECE PICKER (owner decisions 2026-10-18). The chosen piece beside
 * the calculator can be swapped without leaving the page. The list is the
 * page's own `reservable` pool, cut down on the server to the few fields the
 * picker draws; nothing here fetches, prices or computes a figure.
 */
export type PickerPiece = {
  slug: string;
  name: string;
  sku: string;
  /** The variant's price exactly as the Hub sends it (the panel's figure). */
  price_jpy: number;
  image: { kind: "cut" | "whole"; src: string } | null;
};

/**
 * Pieces whose name or SKU contains the query, case-insensitive, in the
 * pool's own order. A blank query returns every piece.
 */
export function filterPieces(pieces: readonly PickerPiece[], query: string): PickerPiece[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [...pieces];
  return pieces.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
}

/** The slug to open on: the requested one when it is in the pool, else the default. */
export function initialPieceSlug(pieces: readonly PickerPiece[], requested: string | null | undefined, fallback: string): string {
  return requested && pieces.some((p) => p.slug === requested) ? requested : fallback;
}
