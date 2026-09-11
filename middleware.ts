import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh + the render-time gate on /account/* and /checkout/*.
 *
 * The gate here is convenience, not security: it decides what to RENDER. Every
 * piece of customer data comes from the Hub, which independently requires the
 * customer's JWT alongside the server API key. A forged cookie gets an empty
 * account page, not someone else's data.
 *
 * TWO HARDENING RULES, both learned the hard way:
 *
 * 1. This middleware must NEVER throw. Middleware runs before the page, so an
 *    exception here is not a broken account page — it is a 500 on whatever the
 *    visitor asked for. Missing env vars and a failing auth call are both
 *    treated as "signed out", never as a crash.
 *
 * 2. It runs on as few paths as possible. The matcher below is an allow-list,
 *    not the old "everything except static assets" pattern: a public product
 *    page has no session to refresh, and making it wait on a Supabase auth
 *    round trip taxed every uncached request for nothing.
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
  to.searchParams.set("next", req.nextUrl.pathname);
  if (reason) to.searchParams.set("reason", reason);
  return NextResponse.redirect(to);
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const gated = isGated(req.nextUrl.pathname);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No credentials: do not construct a client at all. createServerClient throws
  // on an empty URL, and the old `!` assertions turned a missing Vercel env var
  // into a 500 on every matched route rather than a page anyone could read.
  if (!url || !anonKey) {
    // /login is matched but not gated, so this cannot loop: an unconfigured
    // deployment still renders the sign-in page, which explains itself.
    return gated ? toLogin(req, "config") : res;
  }

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

  if (!signedIn && gated) return toLogin(req);
  return res;
}

export const config = {
  // Allow-list, deliberately narrow. /account and /checkout need the gate;
  // /login needs the session cookie refreshed so a returning visitor with a
  // live session is not asked to sign in again. Everything else — the whole
  // catalogue, /cart, /auth/callback (which manages its own session) — never
  // touches Supabase auth.
  //
  // `:path*` matches zero segments too, so "/account" and "/checkout" are
  // covered as well as everything beneath them.
  matcher: ["/account/:path*", "/checkout/:path*", "/login"],
};
