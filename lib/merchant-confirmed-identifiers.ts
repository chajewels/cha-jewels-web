/**
 * OWNER-CONFIRMED IDENTIFIER EVIDENCE for the Merchant feed (DP-08). KEYED BY SKU. EMPTY BY DEFAULT.
 *
 * The Website API carries no GTIN/MPN, and the Hub has no field that says a piece is "own-made". Nothing is inferred
 * from condition, origin, name or brand (the earlier "New + no brand => own-made" inference is REMOVED). A piece
 * enters the feed only when the owner has confirmed its identifiers HERE (or, later, the Hub supplies them), e.g.
 *
 *   "N1616": { brand: "Cha Jewels", mpn: "N1616", note: "owner-confirmed own-made 2026-11-xx" }
 *
 * `brand` must agree with the Hub's brand evidence when the Hub has any (a mismatch excludes the piece as
 * `identifier_conflict`). Every entry needs a `note` saying who confirmed it and when.
 */
export type ConfirmedIdentifier = { brand: string; mpn?: string; gtin?: string; note: string };
export const CONFIRMED_IDENTIFIERS: Readonly<Record<string, ConfirmedIdentifier>> = {};
