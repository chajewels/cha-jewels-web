"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { dict, type Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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
  const [state, setState] = useState<"idle" | "sending" | "sent" | "err">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const email = String(new FormData(form).get("email") ?? "").trim();
    setState("sending");
    // Relative-only redirect target: `next` comes from the query string, so it
    // is never allowed to send the customer off-site.
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
    });
    setState(error ? "err" : "sent");
  }

  if (state === "sent") {
    return <div className="border border-gold bg-velvet-deep p-6 text-gold-pale">{c.sent[lang]}</div>;
  }
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 border border-gold bg-velvet-deep p-6 text-sm">
      <label className="grid gap-1.5 text-champagne/75">
        {c.email[lang]}
        <input name="email" type="email" required autoComplete="email" className="min-h-11 w-full rounded-sm border border-rule bg-velvet px-3 text-champagne" />
      </label>
      <Button type="submit" disabled={state === "sending"}>{c.sendLink[lang]}</Button>
      {state === "err" && <p className="text-garnet">{c.err[lang]}</p>}
      <p className="text-xs text-champagne/55">{c.note[lang]}</p>
    </form>
  );
}
