import "server-only";

/**
 * FIXTURES MODE — PREVIEW DEPLOYMENTS AND LOCAL BUILDS ONLY (W-04, security
 * batch 2, 2026-11-01).
 *
 * `NEXT_PUBLIC_PREVIEW_FIXTURES=1` swaps the whole Hub for lib/fixtures.ts and
 * makes the signed-agreement gates answer "signed". That is what a preview
 * needs and exactly what production must never do: a production deploy that
 * picked up the variable by mistake would show fake products and wave layaway
 * and card holds through unsigned.
 *
 * So the flag is honoured only when Vercel does NOT say this is the production
 * deployment (same rule as lib/hero-demo.ts). On production it is ignored: the
 * Hub reads throw "not configured" if the real Hub variables are missing, and
 * the agreement gates fail closed.
 *
 * Use this constant wherever the flag ENABLES fake data or a passing gate.
 * Places where the flag only switches something OFF (analytics, the Metricool
 * tag in the layout) keep reading the raw variable — switching analytics off
 * on a misconfigured production is the safe direction.
 *
 * Server-only: never import it from a client component.
 */
export const PREVIEW_FIXTURES: boolean =
  process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1" && process.env.VERCEL_ENV !== "production";
