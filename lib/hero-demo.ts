import "server-only";
import type { ProductCutout } from "@/lib/types";

/**
 * HERO DEMO MODE — PREVIEW DEPLOYMENTS ONLY (owner request 2026-09-26, after
 * the PR #159 preview). The Hub does not send cut-outs yet, so on a preview
 * every piece falls back to its framed photo and the stage cannot look like
 * the approved comps. `/?hero_demo=1` feeds the stage the cut-outs that were
 * made for the comps (~/Code/reference/hero-comps/slider-v3/cutouts, copied to
 * public/fixtures/cutouts), matched to the live pieces by SKU, so the owner
 * can review the approved look on real Hub data.
 *
 * NEVER IN PRODUCTION. `heroDemoAllowed` is false when Vercel says this is
 * the production deployment (VERCEL_ENV) OR the request is for the shop's own
 * domain, so the query flag does nothing on www.chajewelsjp.com even if both
 * guards were ever to disagree. It is only read on the server; nothing about
 * it reaches the browser unless it is on.
 */
export const HERO_DEMO_PARAM = "hero_demo";

export function heroDemoAllowed(host: string | null | undefined): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  const name = (host ?? "").split(":")[0].toLowerCase();
  if (name === "chajewelsjp.com" || name.endsWith(".chajewelsjp.com")) return false;
  return true;
}

/** The comp cut-outs, by Hub SKU: each was made from that piece's first Hub photo. */
const DEMO: Record<string, [number, number]> = {
  AL112: [900, 693],
  AL123: [623, 773],
  AL3: [427, 900],
  R3341: [867, 900],
  R7828: [811, 900],
  R3110: [339, 204],
  C0983: [690, 900],
  C1395: [900, 832],
};

/** The comp cut-out for a piece's first photo, as if the Hub had sent it approved. */
export function demoCutout(sku: string): ProductCutout | null {
  const k = sku.trim().toUpperCase();
  const d = DEMO[k];
  return d ? { url: `/fixtures/cutouts/${k.toLowerCase()}.webp`, width: d[0], height: d[1], status: "approved" } : null;
}
