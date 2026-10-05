import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, LANG_PARAM, PATH_HEADER, asLang, detectLang, type Lang } from "@/lib/i18n";
import { cspForPath, FRAME_OPTIONS } from "@/lib/csp";

/**
 * Language resolution + session refresh + the render-time gate on /account/*
 * and /checkout/*.
 *
 * The gate here is convenience, not security: it decides what to RENDER. Every
 * piece of customer data comes from the Hub, which independently requires the
 * customer's JWT alongside the server API key. A forged cookie gets an empty
 * account page, not someone else's data.
 *
 * THREE HARDENING RULES, the first two learned the hard way:
 *
 * 1. This middleware must NEVER throw. Middleware runs before the page, so an
 *    exception here is not a broken account page — it is a 500 on whatever the
 *    visitor asked for. Missing env vars and a failing auth call are both
 *    treated as "signed out", never as a crash.
 *
 * 2. The SUPABASE CALL runs on as few paths as possible. A public product page
 *    has no session to refresh, and making it wait on an auth round trip taxed
 *    every uncached request for nothing. `GATED` below, not the matcher, is
 *    what keeps that win: the matcher is wide because the language rule has to
 *    reach every page, but the auth call still fires only where it is needed.
 *
 * 3. The language decision is READ from lib/i18n and never re-expressed here.
 *    `detectLang` is the one rule (`getLang` on the server side calls it
 *    through `resolveLang`); this file only persists what it returns.
 *
 * CONTENT SECURITY POLICY (owner 6A, SQ19, 2026-10-04; lib/csp.ts). ENFORCED
 * on /account/orders/[id]/pay-card only, with a fresh nonce per request:
 * the nonce goes on the REQUEST as `x-nonce` and inside the request's own
 * `Content-Security-Policy` header (Next.js reads it there and nonces its
 * scripts), and the same policy goes on the response. Every other page gets
 * `Content-Security-Policy-Report-Only` on the response — it can never break
 * a page — plus an ENFORCED `frame-ancestors 'none'` and `X-Frame-Options:
 * DENY` (QC P3-5: no page may be framed). If the pay-card policy cannot be
 * built, that page fails CLOSED (lib/csp.ts PAY_CARD_FAILSAFE_CSP).
 */

/** Paths that render customer data and therefore need a signed-in user. */
const GATED = ["/account", "/checkout", "/loyalty/join"];

const isGated = (pathname: string) =>
  GATED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** How long the sign-in check may take before the session is treated as unverifiable. */
const AUTH_TIMEOUT_MS = 6000;

/** Send an anonymous (or unverifiable) visitor to sign in, remembering where they were. */
function toLogin(req: NextRequest, reason?: string) {
  const to = req.nextUrl.clone();
  to.pathname = "/login";
  to.search = "";
  // Keep the query string with the path. "Reserve with layaway" sends a shopper
  // to /checkout?mode=layaway; a signed-out one who lost the mode here would
  // sign in and land on full payment instead of what they pressed. Still a
  // relative path, so the login form's relative-only check is unaffected.
  to.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`);
  if (reason) to.searchParams.set("reason", reason);
  return NextResponse.redirect(to);
}

export async function middleware(req: NextRequest) {
  // ---------------------------------------------------------------- language
  //
  // An explicit choice wins and is never overridden: the cookie (toggle) first,
  // then ?lang= on the URL, which is how a shareable English link works. Only a
  // visitor with neither is measured against their browser.
  //
  // `decided` is set only when we need to WRITE the cookie — either the visitor
  // just made a choice via ?lang=, or this is a first visit and we detected one.
  // A returning visitor with a cookie is left alone entirely.
  const cookieLang = asLang(req.cookies.get(LANG_COOKIE)?.value);
  const paramLang = asLang(req.nextUrl.searchParams.get(LANG_PARAM));
  let decided: Lang | null = paramLang;
  if (!decided && !cookieLang) decided = detectLang(req.headers.get("accept-language"));

  // Set it on the REQUEST as well as the response. Without this the page
  // rendering *this* request still reads the old (absent) cookie, so a
  // first-time visitor would be served Japanese once and English only from
  // their second navigation — which reads as a broken toggle.
  if (decided) req.cookies.set(LANG_COOKIE, decided);

  // ---------------------------------------------------------------- pathname
  //
  // Forward the path so a server render can name itself. `generateMetadata`
  // is never told the pathname, and metadata set in the root layout is what
  // every page inherits — which is why every URL on the site used to declare
  // rel=canonical pointing at the home page. Snapshotted AFTER the cookie
  // write above so the language decision travels with it.
  const fwd = new Headers(req.headers);
  fwd.set(PATH_HEADER, req.nextUrl.pathname);

  // ---------------------------------------------------------------- CSP
  //
  // Computed before the pass-through response is built, so the request
  // headers carry the nonce on every path below (including the rebuilt
  // response in the Supabase cookie refresh).
  const csp = cspForPath(req.nextUrl.pathname, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    dev: process.env.NODE_ENV === "development",
  });
  if (csp.nonce) {
    fwd.set("x-nonce", csp.nonce);
    fwd.set("Content-Security-Policy", csp.enforced);
  }

  const gated = isGated(req.nextUrl.pathname);
  let res = NextResponse.next({ request: { headers: fwd } });

  /**
   * Persist the decision (if any) on whatever response we end up returning.
   *
   * No `Vary: Accept-Language` here: Next replaces the Vary header after the
   * middleware returns (measured — the value set here never reaches the wire),
   * so writing one would be a line that looks like protection and is not. It is
   * also not needed. A detected response is a dynamic render, which Next sends
   * as `private, no-cache, no-store`, so no shared cache holds it; and the
   * cookie set on this very response means the NEXT request no longer depends
   * on the header at all.
   */
  const withLang = (response: NextResponse) => {
    // Enforced everywhere: the pay-card policy (or its fail-closed twin) on
    // pay-card, frame-ancestors 'none' alone elsewhere (QC P3-5).
    response.headers.set("Content-Security-Policy", csp.enforced);
    if (csp.reportOnly) response.headers.set("Content-Security-Policy-Report-Only", csp.reportOnly);
    response.headers.set("X-Frame-Options", FRAME_OPTIONS);
    if (decided) {
      response.cookies.set(LANG_COOKIE, decided, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Nothing below concerns a public page: skip the auth work entirely. This is
  // the performance rule above, and it is why widening the matcher is safe.
  if (!gated) return withLang(res);

  // No credentials: do not construct a client at all. createServerClient throws
  // on an empty URL, and the old `!` assertions turned a missing Vercel env var
  // into a 500 on every matched route rather than a page anyone could read.
  if (!url || !anonKey) return withLang(toLogin(req, "config"));

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      // A REFRESHED SESSION GOES TO THE PAGE AS WELL AS THE BROWSER (launch
      // pass 2026-10-02). Writing the new cookies only on the response left the
      // page rendering THIS request holding the expired token, so its own
      // getUser() refreshed again with a refresh token the middleware had just
      // spent. Supabase's documented middleware pattern: set them on the
      // request, rebuild the pass-through response from it, then on the response.
      setAll: (all: { name: string; value: string; options: CookieOptions }[]) => {
        all.forEach(({ name, value }) => req.cookies.set(name, value));
        fwd.set("cookie", req.cookies.toString());
        res = NextResponse.next({ request: { headers: fwd } });
        all.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  // getUser (not getSession) so an expired token is actually revalidated —
  // which means a network call, which means it can fail. A Supabase outage or a
  // DNS blip must not take the whole site down with it, so a throw is read as
  // "we cannot prove who this is": public pages carry on, gated pages ask for a
  // sign-in. Failing closed on the gate, open on everything else.
  //
  // AND IT MUST NOT HANG (launch pass 2026-10-02): a customer whose access token
  // had expired got "504 MIDDLEWARE_INVOCATION_TIMEOUT" on /account and
  // /checkout. Refreshing a session retries a failing call for up to ~30 s
  // inside auth-js, past Vercel's 25 s limit for an initial response. Past
  // AUTH_TIMEOUT_MS the session cannot be verified: the stale auth cookies are
  // cleared, so the next visit starts clean, and the customer signs in again.
  let signedIn = false;
  let timedOut = false;
  try {
    const outcome = await Promise.race([
      supabase.auth.getUser(),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), AUTH_TIMEOUT_MS)),
    ]);
    if (outcome === "timeout") timedOut = true;
    else signedIn = !outcome.error && !!outcome.data?.user;
  } catch {
    signedIn = false;
  }

  if (timedOut) {
    console.error(`[middleware] auth check timed out after ${AUTH_TIMEOUT_MS} ms on ${req.nextUrl.pathname}`);
    const out = toLogin(req, "session");
    for (const c of req.cookies.getAll()) {
      if (/^sb-.+-auth-token/.test(c.name)) out.cookies.set(c.name, "", { path: "/", maxAge: 0 });
    }
    return withLang(out);
  }

  if (!signedIn) return withLang(toLogin(req));
  return withLang(res);
}

export const config = {
  // Wide by necessity: the language rule has to reach every page a visitor can
  // land on, and a first visit is exactly the request that needs it. What this
  // does NOT do is run the Supabase auth call everywhere — see `GATED` and the
  // early return above. Middleware itself is a cookie read and a header parse.
  //
  // Excluded: /api (route handlers set their own cookies; /api/lang is the
  // toggle itself), Next's build output and image optimiser, /sitemap.xml and
  // /robots.txt (no language, and prerendered — nothing should attach a
  // Set-Cookie to them), and anything with a file extension (/favicon.ico,
  // /og.png, fonts).
  matcher: [
    "/((?!api/|_next/static/|_next/image|sitemap\\.xml$|robots\\.txt$|.*\\.[^/]+$).*)",
  ],
};
