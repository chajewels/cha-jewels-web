import { hubBrand, type IdentifierRule } from "@/lib/merchant-feed";

/**
 * THE OWNER'S IDENTIFIER RULE AS CODE (DP-08 / OD-MC-4 / OD-MC-11, owner-approved 2026-11-02).
 *
 * Two axes, never guessed:
 *  - BRAND: the Hub's evidence always wins. A piece the Hub names a brand for is sent with that brand.
 *    `origin === "BRAND"` with a blank name is "branded, name unknown" -> unknown -> EXCLUDED (never "no brand").
 *  - CODES (GTIN/MPN): they exist nowhere in the Website API. The ONLY confirmed code evidence is the owner's
 *    approved class "own-made new piece": brand "Cha Jewels" + MPN = the piece's own SKU (Google's stated path for a
 *    merchant who is also the maker). It applies only to a piece that the Hub explicitly marks `condition: "New"`,
 *    that has no Hub brand evidence at all, and that has a SKU.
 *  - EVERYTHING ELSE IS UNKNOWN AND EXCLUDED: a branded piece (no MPN is recorded anywhere), a preloved piece
 *    without a brand (the owner has not stated whether an identifier exists), a piece whose condition the Hub
 *    does not state. Nothing is ever sent as `identifier_exists=no`.
 *
 * ASSUMPTION FOR THE OWNER TO CONFIRM (docs/seo/phase-5/MERCHANT-FEED-IMPLEMENTATION-PROPOSAL.md): "own-made" is
 * encoded as "condition New and no Hub brand evidence", because the Hub has no explicit own-made field.
 */
export const OWN_MADE_BRAND = "Cha Jewels";

export const CHA_IDENTIFIER_RULE: IdentifierRule = (p) => {
  const hb = hubBrand(p);
  if (hb.kind === "named") return { brand: { kind: "brand", name: hb.name }, codes: null }; // brand confirmed; no MPN recorded -> code axis unknown
  if (hb.kind === "branded_unnamed") return { brand: null, codes: null };
  const sku = typeof p.sku === "string" ? p.sku.trim() : "";
  if (p.condition === "New" && sku) return { brand: { kind: "brand", name: OWN_MADE_BRAND }, codes: { kind: "codes", mpn: sku } };
  return { brand: null, codes: null };
};
