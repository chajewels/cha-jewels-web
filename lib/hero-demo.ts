import "server-only";

/**
 * HERO DEMO MODE — PREVIEW DEPLOYMENTS ONLY (owner request 2026-09-26). It
 * began as the only way to see the comps' cut-outs on real Hub data; since the
 * owner released those cut-outs to production (lib/hero-cutouts.ts, same
 * day), every deployment shows them, and `/?hero_demo=1` now only puts the
 * teal review label on the hero of a preview.
 *
 * NEVER IN PRODUCTION. `heroDemoAllowed` is false when Vercel says this is
 * the production deployment (VERCEL_ENV) OR the request is for the shop's own
 * domain, so the label can never appear on www.chajewelsjp.com.
 */
export const HERO_DEMO_PARAM = "hero_demo";

export function heroDemoAllowed(host: string | null | undefined): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  const name = (host ?? "").split(":")[0].toLowerCase();
  if (name === "chajewelsjp.com" || name.endsWith(".chajewelsjp.com")) return false;
  return true;
}
