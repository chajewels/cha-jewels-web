import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, LANG_PARAM, PATH_HEADER, asLang, detectLang, type Lang } from "@/lib/i18n";

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
 */

/** Paths that render customer data and therefore need a signed-in user. */
const GATED = ["/account", "/checkout"];

const isGated = (pathname: string) =>
  GATED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

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

  const gated = isGated(req.nextUrl.pathname);
  const res = NextResponse.next({ request: { headers: fwd } });

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
      setAll: (all: { name: string; value: string; options: CookieOptions }[]) =>
        all.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });

  // getUser (not getSession) so an expired token is actually revalidated —
  // which means a network call, which means it can fail. A Supabase outage or a
  // DNS blip must not take the whole site down with it, so a throw is read as
  // "we cannot prove who this is": public pages carry on, gated pages ask for a
  // sign-in. Failing closed on the gate, open on everything else.
  let signedIn = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    signedIn = !error && !!data?.user;
  } catch {
    signedIn = false;
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
