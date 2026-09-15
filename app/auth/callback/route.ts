import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { hub } from "@/lib/hub-api";

/**
 * Completes the email sign-in link, then links the auth user to their customer
 * record in the Hub before the customer ever reaches /account — so the account
 * page never has to handle a "signed in but not linked" state.
 *
 * Three ways a link can arrive here, all handled:
 *   ?code=…                 PKCE — the browser that requested the link holds
 *                           the code verifier cookie; exchangeCodeForSession.
 *   ?token_hash=…&type=…    server-side link — no verifier needed, so a link
 *                           opened in a different browser (in-app mail
 *                           clients) still works; verifyOtp.
 *   ?error=…&error_code=…   GoTrue could not verify (expired, reused). Named,
 *                           not read as "no code".
 * Every outcome is a redirect. This route never renders and never 500s — a
 * blank page here is a customer stuck with no way forward.
 */
const OTP_TYPES: ReadonlySet<string> = new Set(["magiclink", "email", "recovery", "signup", "invite", "email_change"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;
  const rawNext = q.get("next") ?? "/account";
  // Relative-only, so a crafted link cannot bounce the customer off-site.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";
  const toLogin = (error: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`, url.origin));

  const gotrueError = q.get("error_code") ?? q.get("error");
  if (gotrueError) return toLogin(gotrueError);

  const code = q.get("code");
  const tokenHash = q.get("token_hash");
  const type = q.get("type");
  const hasTokenHash = !!tokenHash && !!type && OTP_TYPES.has(type);
  if (!code && !hasTokenHash) return toLogin("missing_code");

  // Cookies the exchange sets are collected, then applied to whichever redirect
  // is returned. They used to be bound to one response object and were lost on
  // the link-failed path — a freshly signed-in customer went straight back to
  // /login with no session.
  const pending: { name: string; value: string; options: CookieOptions }[] = [];
  try {
    const store = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => store.getAll(),
          setAll: (all: { name: string; value: string; options: CookieOptions }[]) => { pending.push(...all); },
        },
      },
    );

    const { data, error } = hasTokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type as EmailOtpType })
      : await supabase.auth.exchangeCodeForSession(code!);
    if (error || !data.session) return toLogin(error?.code ?? "exchange_failed");

    let target = next;
    try {
      await hub.authCustomer(data.session.access_token);
    } catch {
      // The session is valid either way. /account reports the linking problem
      // rather than this route silently dropping the customer back to /login.
      target = "/account?link=failed";
    }
    const res = NextResponse.redirect(new URL(target, url.origin));
    pending.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch {
    // Missing env, a network failure to Auth, anything unexpected: still a
    // redirect with a reason, never a blank page or a 500.
    return toLogin("callback_failed");
  }
}
