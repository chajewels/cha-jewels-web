import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on navigation and gates /account/*.
 *
 * The gate here is convenience, not security: it decides what to RENDER. Every
 * piece of customer data comes from the Hub, which independently requires the
 * customer's JWT alongside the server API key. A forged cookie gets an empty
 * account page, not someone else's data.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (all: { name: string; value: string; options: CookieOptions }[]) =>
          all.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );

  // getUser (not getSession) so an expired token is actually revalidated.
  const { data } = await supabase.auth.getUser();

  if (!data?.user && req.nextUrl.pathname.startsWith("/account")) {
    const to = req.nextUrl.clone();
    to.pathname = "/login";
    to.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = {
  // Skip static assets and the callback route, which manages its own session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|auth/callback).*)"],
};
