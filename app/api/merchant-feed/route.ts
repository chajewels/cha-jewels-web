import { hub } from "@/lib/hub-api";
import { serveFeed, CATALOG_LIMIT } from "@/lib/merchant-feed-handler";
import { CHA_IDENTIFIER_RULE } from "@/lib/merchant-identifiers";

/**
 * GET /api/merchant-feed?lang=ja  (Phase 5; DP-08, owner-approved 2026-11-02; JAPANESE FEED FIRST, OD-MC-1).
 * All behaviour lives in lib/merchant-feed-handler.ts (injectable, unit-tested). Read-only. The feed is complete or it
 * is not served; only pieces with OWNER-CONFIRMED identifier evidence are included (lib/merchant-confirmed-identifiers.ts,
 * empty until the owner confirms). `?lang=en` answers 404 (OD-MC-2). `x-robots-tag: noindex`.
 */
export const revalidate = 300;

export function GET(req: Request) {
  return serveFeed(req, { readProducts: (limit = CATALOG_LIMIT) => hub.allProducts(limit), readSlugs: () => hub.productSlugs(), rule: CHA_IDENTIFIER_RULE });
}
