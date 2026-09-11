import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hub } from "@/lib/hub-api";

/**
 * Completes the email sign-in link, then links the auth user to their customer
 * record in the Hub before the customer ever reaches /account — so the account
 * page never has to handle a "signed in but not linked" state.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/account";
  // Relative-only, so a crafted link cannot bounce the customer off-site.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));

  const store = await cookies();
  const res = NextResponse.redirect(new URL(next, url.origin));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (all: { name: string; value: string; options: CookieOptions }[]) =>
          all.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", url.origin));
  }

  try {
    await hub.authCustomer(data.session.access_token);
  } catch {
    // The session is valid either way. /account reports the linking problem
    // rather than this route silently dropping the customer back to /login.
    return NextResponse.redirect(new URL("/account?link=failed", url.origin));
  }
  return res;
}
