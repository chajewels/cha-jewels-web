"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";

/**
 * Completes an email sign-in link ON CLICK, not on load.
 *
 * The email link lands on /auth/confirm carrying token_hash + type and nothing
 * else happens until the customer presses "Sign in", which submits this action
 * (a POST). Mail scanners GET every link in a message within seconds of
 * delivery; when the link was GoTrue's own verify URL that GET spent the
 * one-time token and the customer's click found it already used. A POST is
 * something a scanner never sends.
 *
 * verifyOtp with token_hash returns the session directly — no PKCE code, no
 * verifier cookie — so a link opened in a different browser (in-app mail
 * clients) works too. Same linking step as /auth/callback afterwards.
 */
const OTP_TYPES: ReadonlySet<string> = new Set(["magiclink", "email", "recovery", "signup", "invite", "email_change"]);

export async function confirmSignInAction(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get("token_hash") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const rawNext = String(formData.get("next") ?? "/account");
  // Relative-only, so a crafted link cannot bounce the customer off-site.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";
  const toLogin = (error: string) => `/login?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`;

  if (!tokenHash || !OTP_TYPES.has(type)) redirect(toLogin("missing_code"));

  let target = next;
  let failure: string | null = null;
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
    if (error || !data.session) {
      failure = error?.code ?? "exchange_failed";
    } else {
      try {
        await hub.authCustomer(data.session.access_token);
      } catch {
        // The session is valid either way; /account reports the linking problem.
        target = "/account?link=failed";
      }
    }
  } catch {
    failure = "callback_failed";
  }
  // redirect() throws, so it stays outside the try/catch above.
  if (failure) redirect(toLogin(failure));
  redirect(target);
}
