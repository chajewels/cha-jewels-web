/**
 * CONTENT SECURITY POLICY (owner 6A, review SQ19, 2026-10-04).
 *
 * ENFORCED ON ONE PAGE ONLY: /account/orders/[id]/pay-card, the page that
 * draws Square's card form. Every other page gets a REPORT-ONLY policy, which
 * can never break a page — it only tells us (through /api/csp-report) what an
 * enforced policy would have blocked, so the rest of the site can be tightened
 * later on evidence rather than guesses.
 *
 * Pure, and safe in the Edge runtime: middleware.ts imports it, and so does a
 * unit test (tests/csp.test.mjs). No node: imports, no env reads beyond the
 * one optional Supabase origin passed in by the caller.
 *
 * THE ENFORCED POLICY follows Square's documented list for the Web Payments
 * SDK (developer.squareup.com/docs/web-payments/content-security-policy):
 * the SDK script hosts, Square's fonts, the PCI connect hosts and Square's
 * Sentry. Scripts are allowed by NONCE with 'strict-dynamic' — Next.js nonces
 * its own scripts when it finds the nonce in the request's CSP header, and
 * every script those load (next/script for Square, Vercel Analytics, Metricool)
 * inherits the trust. The host entries stay for CSP2 browsers that ignore
 * 'strict-dynamic'. frame-src allows https: because a 3-D Secure challenge is
 * framed from the CARD ISSUER's own domain, which Square says cannot be
 * listed in advance.
 */

/** Where violation reports go (app/api/csp-report/route.ts). */
export const CSP_REPORT_PATH = "/api/csp-report";

const SQUARE_SCRIPT = ["https://sandbox.web.squarecdn.com", "https://web.squarecdn.com"];
const SQUARE_FONTS = ["https://square-fonts-production-f.squarecdn.com", "https://d1g145x70srn7h.cloudfront.net"];
const SQUARE_CONNECT = [
  "https://pci-connect.squareup.com",
  "https://pci-connect.squareupsandbox.com",
  "https://web.squarecdn.com",
  "https://sandbox.web.squarecdn.com",
  "https://web.squareup.com",
  "https://o160250.ingest.sentry.io",
];
/** Metricool's tracker (production only, components/analytics/metricool-tracker.tsx): its script and its 1×1 beacon. */
const METRICOOL = "https://tracker.metricool.com";
/** Paidy: the checkout (apps.paidy.com), the product-page widget (cdn.paidy.com) and its API. Report-only pages only. */
const PAIDY = ["https://apps.paidy.com", "https://cdn.paidy.com", "https://api.paidy.com"];
/** Vercel's preview toolbar (preview deployments only). Report-only pages only. */
const VERCEL_LIVE = "https://vercel.live";

/**
 * The pay-card path, with or without a trailing slash. The site has no locale
 * prefix (the language is a cookie / ?lang=, lib/i18n), so there is exactly
 * one shape to match.
 */
const PAY_CARD = /^\/account\/orders\/[^/]+\/pay-card\/?$/;

export function isPayCardPath(pathname: string): boolean {
  return PAY_CARD.test(pathname);
}

/** A per-request nonce: 128 random bits, base64. Edge-safe (Web Crypto + btoa). */
export function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/** The origin of a URL, or null when it is not one (an unset env var, a typo). */
function originOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.origin : null;
  } catch {
    return null;
  }
}

type Directives = [string, ...string[]][];
const serialize = (d: Directives) => d.map(([k, ...v]) => [k, ...v].join(" ")).join("; ");

export type CspOptions = {
  /** NEXT_PUBLIC_SUPABASE_URL: the browser's Supabase client talks to it (sign-in pages). */
  supabaseUrl?: string | null;
  /** next dev evaluates code with eval() for fast refresh; never true in a build. */
  dev?: boolean;
};

/** THE ENFORCED POLICY, for the pay-card page only. */
export function payCardCsp(nonce: string, opts: CspOptions = {}): string {
  if (!/^[A-Za-z0-9+/=_-]{16,}$/.test(nonce)) throw new Error("csp: bad nonce");
  const supabase = originOf(opts.supabaseUrl);
  const d: Directives = [
    ["default-src", "'self'"],
    ["script-src", "'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...SQUARE_SCRIPT, ...(opts.dev ? ["'unsafe-eval'"] : [])],
    ["style-src", "'self'", "'unsafe-inline'", ...SQUARE_SCRIPT],
    ["font-src", "'self'", "data:", ...SQUARE_FONTS],
    ["img-src", "'self'", "data:", "blob:", "https:"],
    ["media-src", "'self'", "blob:", "https:"],
    ["connect-src", "'self'", ...SQUARE_CONNECT, METRICOOL, ...(supabase ? [supabase] : []), ...(opts.dev ? ["ws:"] : [])],
    ["frame-src", "https:"],
    ["frame-ancestors", "'none'"],
    ["form-action", "'self'"],
    ["base-uri", "'self'"],
    ["object-src", "'none'"],
    ...(opts.dev ? [] : [["upgrade-insecure-requests"] as [string]]),
    ["report-uri", CSP_REPORT_PATH],
  ];
  return serialize(d);
}

/**
 * THE REPORT-ONLY POLICY, for every other page. Broad on purpose: inline
 * scripts are allowed (the announcement bar's pre-paint script, JSON-LD), and
 * every host the site is known to load is listed. Its job is to surface what
 * is NOT on this list, never to block.
 */
export function reportOnlyCsp(opts: CspOptions = {}): string {
  const supabase = originOf(opts.supabaseUrl);
  const supabaseWs = supabase ? supabase.replace(/^http/, "ws") : null;
  const d: Directives = [
    ["default-src", "'self'"],
    ["script-src", "'self'", "'unsafe-inline'", ...(opts.dev ? ["'unsafe-eval'"] : []), ...SQUARE_SCRIPT, ...PAIDY, METRICOOL, VERCEL_LIVE],
    ["style-src", "'self'", "'unsafe-inline'", "https:"],
    ["font-src", "'self'", "data:", "https:"],
    ["img-src", "'self'", "data:", "blob:", "https:"],
    ["media-src", "'self'", "blob:", "https:"],
    ["connect-src", "'self'", ...SQUARE_CONNECT, ...PAIDY, METRICOOL, VERCEL_LIVE, ...(supabase ? [supabase] : []), ...(supabaseWs ? [supabaseWs] : []), ...(opts.dev ? ["ws:"] : [])],
    ["frame-src", "https:"],
    ["frame-ancestors", "'none'"],
    ["form-action", "'self'"],
    ["base-uri", "'self'"],
    ["object-src", "'none'"],
    ["report-uri", CSP_REPORT_PATH],
  ];
  return serialize(d);
}
