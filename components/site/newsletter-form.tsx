"use client";

import { useActionState, useEffect, useRef } from "react";
import { subscribeAction, type NewsletterState } from "@/app/actions/newsletter";
import { trackNewsletterSubscribe } from "@/lib/analytics";
import { dict, type Lang } from "@/lib/i18n";
import { inputLight, labelLight } from "@/lib/form-classes";

/**
 * The newsletter sign-up, one input and one button.
 *
 * `tone` is the surface it sits on, because this form has to work in two
 * places at once. The light rule (lib/form-classes) is right on a page; in the
 * footer its white fill and charcoal border would be a hole in the band.
 *
 * The focus ring follows the surface for MARGIN, not validity: gold-dark
 * measures 3.18 on charcoal-deep, which clears the 3:1 a ring needs by 0.18,
 * while gold-pale is 10.62. Both are in scripts/check-contrast.mjs. (An
 * earlier draft of this comment said gold-dark was 1.55 there — that is
 * garnet's figure, and the gate's sanity check is what caught it.)
 *
 * Every outcome is an inline message. No redirect, no toast: the person is at
 * the bottom of a page they were reading, and moving them somewhere else to
 * say one sentence would lose their place.
 */
export function NewsletterForm({ lang, tone = "light" }: { lang: Lang; tone?: "light" | "dark" }) {
  const c = dict.newsletter;
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeAction, "idle");
  const formRef = useRef<HTMLFormElement>(null);
  const counted = useRef<NewsletterState>("idle");

  // Count the attempt once per outcome, successes and failures alike — a form
  // that only reports its successes cannot tell you it has stopped working.
  useEffect(() => {
    if (state === "idle" || counted.current === state) return;
    counted.current = state;
    trackNewsletterSubscribe(state === "success" ? "subscribed" : state, lang);
    if (state === "success" || state === "already") formRef.current?.reset();
  }, [state, lang]);

  const dark = tone === "dark";
  const field = dark
    // The footer's own field styling, as it was before this form was removed:
    // chalk text on the band (14.57), a chalk/40 edge (3.50), gold-pale ring.
    // Site frame (2026-09-27): the field and Sign up are one inline control,
    // 48px, chalk/40 edges; the ring is the dark surface's gold-pale.
    ? "min-h-12 w-full min-w-0 flex-1 rounded-l-sm rounded-r-none border border-chalk/40 bg-transparent px-3 text-sm text-chalk placeholder:text-chalk/70 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-pale disabled:cursor-not-allowed disabled:opacity-60"
    : `min-h-10 min-w-0 flex-1 basis-[12rem] rounded-sm px-3 text-sm ${inputLight} disabled:cursor-not-allowed disabled:opacity-60`;

  const message = state === "success" ? c.success[lang]
    : state === "already" ? c.already[lang]
    : state === "invalid" ? c.invalid[lang]
    : state === "rate_limited" ? c.rateLimited[lang]
    : state === "error" ? c.error[lang]
    : null;

  // `invalid`, `rate_limited` and `error` are the ones a screen reader should
  // be interrupted for; the two good outcomes are announced politely.
  const bad = state === "invalid" || state === "rate_limited" || state === "error";

  return (
    <form ref={formRef} action={action} className="mt-4">
      <label htmlFor="newsletter-email" className={dark ? "sr-only" : `mb-1.5 block ${labelLight}`}>
        {c.placeholder[lang]}
      </label>
      {/* WRAPS. In the footer this sits in a 2-of-12 column — 164px at 1280 —
          and side by side with an 82px button the field was 74px wide, which
          held 48px of text and clipped a 92px placeholder to "Email add". The
          field takes a full row of its own until there is room for both, so
          the placeholder is readable at every width rather than at wide ones.
          `basis-full` on the input is what forces the break; the button then
          sits under it at its natural width. */}
      <div className={dark ? "flex" : "flex flex-wrap gap-2"}>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={pending}
          placeholder={c.placeholder[lang]}
          className={field}
        />
        <button
          type="submit"
          disabled={pending}
          // NOT ORANGE ON THE FOOTER (owner decision D1-2, 2026-09-27, the
          // recommended option): signing up is not a buy or contact action.
          // A chalk-edged button joined to the field, gold-pale label (10.62).
          className={dark
            ? "min-h-12 shrink-0 rounded-r-sm border border-l-0 border-chalk/40 px-4 text-sm font-medium text-gold-pale hover:bg-charcoal hover:text-chalk disabled:cursor-not-allowed disabled:opacity-60"
            : "min-h-10 shrink-0 rounded-sm bg-orange px-4 text-sm font-medium text-charcoal-deep hover:bg-orange-hover disabled:cursor-not-allowed disabled:opacity-60"}
        >
          {c.submit[lang]}
        </button>
      </div>

      {/* Honeypot. Hidden from sight and from the accessibility tree, and left
          out of the tab order — a human never meets it, so anything that fills
          it is not one. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="newsletter-company">Company</label>
        <input id="newsletter-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {message && (
        <p
          role={bad ? "alert" : "status"}
          aria-live={bad ? "assertive" : "polite"}
          className={`mt-2 text-xs ${dark ? "text-chalk" : "text-charcoal"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
