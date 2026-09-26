import "server-only";
import type { CutoutStatus, ProductCutout } from "@/lib/types";

/**
 * HERO DEMO MODE — PREVIEW DEPLOYMENTS ONLY (owner request 2026-09-26, after
 * the PR #159 preview). The Hub does not send cut-outs yet, so on a preview
 * every piece falls back to its framed photo and the stage cannot look like
 * the approved comps. `/?hero_demo=1` feeds the stage cut-outs of the live
 * pieces' photos (public/fixtures/cutouts, see DEMO), matched by SKU and
 * gallery position — so each piece also cycles its own photos — and the owner
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

/**
 * The demo cut-outs, by Hub SKU and gallery position (the Hub's photo order,
 * as the product page shows it), for the live pieces the hero shows, up to 4
 * photos each. Photo 1 is the cut-out made for the approved comps; photos 2–4
 * were made the same way on 2026-09-26 (BiRefNet-general via rembg, with the
 * comps' automatic checks: extra objects and coverage hold a photo as
 * needs_review, a piece touching the frame has that edge faded and is
 * auto_fixed). Each is [width, height, status]; a held one is skipped by
 * lib/hero-deck.ts exactly as a held Hub cut-out would be. AL112 and R3110
 * have one photo in the Hub. QA: ~/Code/reference/hero-comps/build-check/
 * v3-slideshow/demo-cutouts-qa.json and demo-cutouts-qa-board.jpg.
 */
const DEMO: Record<string, [number, number, CutoutStatus][]> = {
  AL112: [[900, 693, "approved"]],
  AL123: [[623, 773, "approved"], [759, 900, "ok"]],
  AL3: [[427, 900, "approved"], [422, 900, "ok"]],
  R3341: [[867, 900, "approved"], [900, 813, "ok"], [869, 900, "ok"], [900, 779, "ok"]],
  R7828: [[811, 900, "approved"], [900, 715, "ok"], [900, 729, "ok"], [811, 900, "ok"]],
  R3110: [[339, 204, "approved"]],
  C0983: [[690, 900, "approved"], [900, 676, "auto_fixed"], [900, 739, "auto_fixed"], [641, 900, "ok"]],
  C1395: [[900, 832, "approved"], [900, 804, "auto_fixed"], [754, 900, "auto_fixed"], [678, 900, "ok"]],
};

/** The demo cut-out of a piece's photo `i` (0 = first), as if the Hub had sent it. */
export function demoCutout(sku: string, i = 0): ProductCutout | null {
  const k = sku.trim().toUpperCase();
  const d = DEMO[k]?.[i];
  if (!d) return null;
  return { url: `/fixtures/cutouts/${k.toLowerCase()}${i ? `-${i}` : ""}.webp`, width: d[0], height: d[1], status: d[2] };
}
