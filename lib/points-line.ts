import type { HubPointsPreview } from "@/lib/types";

/**
 * The loyalty-points line under the price on the product page (owner request
 * 2026-10-03, L1–L4 approved). Every figure is the Hub's (GET
 * /me/points-preview mirrors its award rule); this file only decides WHICH
 * sentence to show, and never adds, multiplies or rounds a figure.
 *
 *  - member      "Earn 3,000 points with this piece at Radiant (2×)."
 *                (L1) the level is the one this purchase takes her to, when it does
 *                (L2) "+ 600 bonus points" while a promotion runs
 *  - join        a signed-in customer who is not a member: the entry-level
 *                figure and a link to join (L3)
 *  - null        signed out, loyalty switched off, below ¥10,000, sold, or the
 *                Hub could not answer — the line is simply not shown
 */
export type PointsLine =
  | { kind: "member"; points: number; bonus: number; tier: string; multiplier: number; upgraded: boolean }
  | { kind: "join"; points: number }
  | null;

export function pointsLineFrom(preview: HubPointsPreview | null | undefined, variantId: string): PointsLine {
  if (!preview || preview.enabled !== true) return null;
  const item = (preview.items ?? []).find((i) => i.variant_id === variantId);
  if (!item || item.eligible !== true || !(item.base_points > 0)) return null;
  if (!preview.enrolled) return { kind: "join", points: item.base_points };
  if (!item.tier || item.multiplier == null) return null;
  return {
    kind: "member",
    points: item.base_points,
    bonus: item.promo_points > 0 ? item.promo_points : 0,
    tier: item.tier,
    multiplier: item.multiplier,
    upgraded: !!item.upgraded_to,
  };
}

/** Thousands separators only — a count of points, not money. */
export function formatPoints(n: number): string {
  return Math.trunc(n).toLocaleString("en-US");
}
