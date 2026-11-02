import { type IdentifierRule } from "@/lib/merchant-feed";
import { CONFIRMED_IDENTIFIERS, type ConfirmedIdentifier } from "@/lib/merchant-confirmed-identifiers";

/**
 * THE IDENTIFIER RULE AS CODE (DP-08, corrected 2026-11-02): CONFIRMED EVIDENCE ONLY.
 *
 * A piece is described to Google only when an identifier is CONFIRMED for it in the registry
 * (`lib/merchant-confirmed-identifiers.ts`, keyed by SKU, empty by default). There is NO inference: not from
 * `condition`, not from the absence of a Hub brand, not from the SKU's shape, not from `origin`. The builder
 * (`lib/merchant-feed.ts`) still lets the Hub's brand evidence win over the rule and turns any contradiction into
 * `identifier_conflict`.
 *
 * Everything not in the registry answers "unknown on both axes" and is EXCLUDED with the reason
 * `identifier_unknown` ("no owner-confirmed identifier evidence for this SKU"); it is never sent as
 * `identifier_exists=no`. With an empty registry the feed has no items and the route answers 503: the truthful state.
 */
export const makeIdentifierRule = (registry: Readonly<Record<string, ConfirmedIdentifier>>): IdentifierRule => (p) => {
  const sku = typeof p.sku === "string" ? p.sku.trim() : "";
  const e = sku && Object.prototype.hasOwnProperty.call(registry, sku) ? registry[sku] : undefined;
  if (!e || !e.brand?.trim() || !e.note?.trim() || !(e.mpn?.trim() || e.gtin?.trim())) return { brand: null, codes: null };
  return { brand: { kind: "brand", name: e.brand.trim() }, codes: { kind: "codes", ...(e.gtin?.trim() ? { gtin: e.gtin.trim() } : {}), ...(e.mpn?.trim() ? { mpn: e.mpn.trim() } : {}) } };
};

export const CHA_IDENTIFIER_RULE: IdentifierRule = makeIdentifierRule(CONFIRMED_IDENTIFIERS);
