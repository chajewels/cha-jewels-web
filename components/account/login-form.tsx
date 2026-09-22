"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { dict, type Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authLinkExpiryMinutes } from "@/lib/auth-link";
import { alertLight, errorLight, inputLight, labelLight } from "@/lib/form-classes";

/**
 * Email sign-in link. EMAIL ONLY, deliberately.
 *
 * The Phase 2 plan names phone OTP as the primary method, but the Hub links a
 * signed-in user to their customer record by VERIFIED EMAIL, and a phone-OTP
 * session carries no email. Shipping a phone tab would take the customer
 * through an OTP they cannot complete — POST /auth/customer answers 422. Phone
 * arrives once mobile_number is normalised to E.164 and made unique; see
 * docs/tasks/phase2-plan.md and the Hub's step-1 migration.
 */
export function LoginForm({ lang }: { lang: Lang }) {
  const c = dict.account;
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";
  // middleware sends ?reason=config when the Supabase env vars are missing on
  // this deployment. Without this notice the redirect is a silent dead end: the
  // form renders normally and every attempt fails for reasons nobody can see.
  const configError = params.get("reason") === "config";
  // /auth/callback sends the customer back here with the reason a link could
  // not be completed. An expired or reused link is the common case and gets
  // its own wording; everything else is "we could not finish — request a new one".
  const linkError = params.get("error");
  const linkErrorCopy = !linkError ? null
    : linkError === "otp_expired" || linkError === "access_denied" ? c.linkExpired[lang]
    : c.linkFailed[lang];
  const [state, setState] = useState<"idle" | "sending" | "sent" | "err">("idle");
  // Kept so the link can be re-sent without asking for it again, and so the
  // confirmation can name the address the customer should go and look in.
  const [sentTo, setSentTo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Relative-only redirect target: `next` comes from the query string, so it is
  // never allowed to send the customer off-site. Computed ONCE and used by the
  // first send and every resend — a resend that dropped it would sign someone
  // in and land them on /account instead of the checkout they came from.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  // One interval, counting down, cleared on unmount. A second link cannot be
  // asked for while it runs, which is what stops a frustrated customer sending
  // themselves five emails and then not knowing which one still works.
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (cooldown <= 0) return;
    timer.current = setInterval(() => setCooldown((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback(async (email: string) => {
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
    });
    if (error) { setState("err"); return; }
    setSentTo(email);
    setState("sent");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }, [safeNext]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    await send(String(new FormData(form).get("email") ?? "").trim());
  }

  if (state === "sent" || (state === "sending" && sentTo)) {
    const expiry = expiryPhrase(c, lang);
    return (
      <div className="grid gap-4 border border-hairline bg-white p-6 text-sm text-charcoal-deep">
        <div>
          <p className="font-display text-xl">{c.sentH[lang]}</p>
          <p className="mt-1.5 text-charcoal">{c.sentTo[lang].replace("{email}", sentTo)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={cooldown > 0 || state === "sending"} onClick={() => send(sentTo)}>
            {cooldown > 0 ? c.resendIn[lang].replace("{s}", String(cooldown)) : c.resend[lang]}
          </Button>
          <button
            type="button"
            // Back to the form with the address cleared. Without this the only
            // way out of a typo was to reload the page, which loses ?next=.
            onClick={() => { setState("idle"); setSentTo(""); setCooldown(0); }}
            className="text-sm text-gold-dark underline underline-offset-4"
          >
            {c.differentEmail[lang]}
          </button>
        </div>
        {/* The expiry is read from configuration, never guessed — when nobody
            has set it this says the link works once and claims nothing about
            time. See lib/auth-link.ts. */}
        <p className="text-xs text-charcoal/70">
          {expiry ? c.linkOnceExpires[lang].replace("{duration}", expiry) : c.linkOnce[lang]}
        </p>
        <p><Link href="/collections" className="text-sm text-gold-dark underline underline-offset-4">{c.continueShopping[lang]}</Link></p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 border border-hairline bg-white p-6 text-sm">
      {configError && (
        <p role="alert" className="border border-garnet/60 p-3 text-charcoal-deep">{c.configErr[lang]}</p>
      )}
      {!configError && linkErrorCopy && (
        <p role="alert" className={`${alertLight} p-3`}>{linkErrorCopy}</p>
      )}
      <label className="grid gap-1.5 text-charcoal">
        {c.email[lang]}
        <input name="email" type="email" required autoComplete="email" className="min-h-11 w-full rounded-sm border border-hairline bg-white px-3 text-charcoal-deep" />
      </label>
      <Button type="submit" disabled={state === "sending"}>{c.sendLink[lang]}</Button>
      {state === "err" && <p className="text-garnet">{c.err[lang]}</p>}
      <p className="text-xs text-charcoal/70">{c.note[lang]}</p>
    </form>
  );
}

/** Long enough that a second email is a decision, short enough not to trap anyone. */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * The configured expiry as a phrase, or null when it is not configured.
 *
 * Whole hours read as hours because that is how the setting is usually written;
 * anything else stays in minutes rather than being rounded into a number that
 * is no longer the one in the dashboard.
 */
function expiryPhrase(c: typeof dict.account, lang: Lang): string | null {
  const minutes = authLinkExpiryMinutes();
  if (minutes == null) return null;
  if (minutes === 60) return c.expiryHour[lang];
  if (minutes % 60 === 0) return c.expiryHours[lang].replace("{n}", String(minutes / 60));
  return c.expiryMinutes[lang].replace("{n}", String(minutes));
}
