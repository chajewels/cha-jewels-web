"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { contactAction, type ContactState } from "@/app/actions/contact";
import { MESSAGE_MAX, MESSAGE_MIN } from "@/lib/contact";
import { trackContactSubmit } from "@/lib/analytics";
import { dict, type Lang } from "@/lib/i18n";
import { alertLight, inputLight, labelLight } from "@/lib/form-classes";

/**
 * The contact form.
 *
 * On success the form is REPLACED by the confirmation rather than cleared and
 * left standing. A blank form under a "thank you" reads as an invitation to
 * send it again, and the second message is one a person then has to work out
 * is a duplicate.
 *
 * Every outcome is inline. No redirect and no toast: the sender is looking at
 * the thing they just filled in, and that is where the answer belongs.
 *
 * The message counter is live and the textarea is capped by `maxLength`, so
 * the bound is visible before it is hit rather than reported afterwards. The
 * server re-checks both bounds regardless — the browser is not the authority
 * on anything here.
 */
export function ContactForm({ lang }: { lang: Lang }) {
  const c = dict.contact;
  const t = (k: keyof typeof c, vars?: Record<string, string>) => {
    // Annotated: c[k][lang] is a literal union, and the replace below assigns a
    // plain string back into it.
    let v: string = c[k][lang];
    if (vars) for (const [key, val] of Object.entries(vars)) v = v.replace(`{${key}}`, val);
    return v;
  };

  const [state, action, pending] = useActionState<ContactState, FormData>(contactAction, "idle");
  const [length, setLength] = useState(0);
  const counted = useRef<ContactState>("idle");
  const pathname = usePathname();
  const id = useId();

  // Count the attempt once per outcome, successes and failures alike — a form
  // that only reports its successes cannot tell you it has stopped working.
  useEffect(() => {
    if (state === "idle" || counted.current === state) return;
    counted.current = state;
    trackContactSubmit(state === "success" ? "sent" : state);
  }, [state]);

  if (state === "success") {
    return (
      <p role="status" className="text-[17px] leading-relaxed text-charcoal-deep">
        {t("sent")}
      </p>
    );
  }

  const message = state === "invalid" ? t("invalid")
    : state === "rate_limited" ? t("rateLimited")
    : state === "error" ? t("error")
    : null;

  const field = `min-h-11 w-full rounded-sm px-3 text-sm ${inputLight} disabled:cursor-not-allowed disabled:opacity-60`;
  const label = `block text-xs font-semibold uppercase tracking-[0.14em] ${labelLight}`;

  return (
    <form action={action} className="space-y-5">
      {/* The path the message was written on, so a reply has the context. */}
      <input type="hidden" name="page" value={pathname} />

      {/* Honeypot. Hidden from sight AND from the accessibility tree, so no
          screen-reader user is ever asked to fill in a trap. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden">
        <label htmlFor={`${id}-company`}>Company</label>
        <input id={`${id}-company`} type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor={`${id}-name`} className={label}>{t("fullName")}</label>
        <input id={`${id}-name`} name="full_name" type="text" required maxLength={120} autoComplete="name" disabled={pending} className={`mt-1.5 ${field}`} />
      </div>

      <div>
        <label htmlFor={`${id}-email`} className={label}>{t("email")}</label>
        <input id={`${id}-email`} name="email" type="email" required maxLength={254} autoComplete="email" disabled={pending} className={`mt-1.5 ${field}`} />
      </div>

      <div>
        <label htmlFor={`${id}-phone`} className={label}>{t("phoneOptional")}</label>
        <input id={`${id}-phone`} name="phone" type="tel" maxLength={40} autoComplete="tel" disabled={pending} className={`mt-1.5 ${field}`} />
      </div>

      <div>
        <label htmlFor={`${id}-message`} className={label}>{t("message")}</label>
        <textarea
          id={`${id}-message`}
          name="message"
          required
          rows={5}
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          disabled={pending}
          onChange={(e) => setLength(e.target.value.length)}
          aria-describedby={`${id}-count`}
          className={`mt-1.5 ${field} py-2`}
        />
        {/* Not a live region: it changes on every keystroke, and announcing
            each one would talk over the person typing. */}
        <p id={`${id}-count`} className="mt-1 text-right text-xs text-charcoal/70">
          {t("messageCount", { n: String(length), max: String(MESSAGE_MAX) })}
        </p>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-charcoal-deep">
        <input type="checkbox" name="newsletter" value="1" disabled={pending} className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-charcoal/60 text-gold-dark focus:ring-2 focus:ring-gold-dark" />
        <span>{t("newsletterOptIn")}</span>
      </label>

      {message && (
        <p role="alert" className={`rounded-sm px-3 py-2 text-sm ${alertLight}`}>{message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-sm bg-orange px-5 text-sm font-semibold text-charcoal-deep transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
