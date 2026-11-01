"use client";

import { useActionState, useEffect, useRef } from "react";

import { subscribeAction, type NewsletterState } from "@/app/actions/newsletter";
import { trackNewsletterSubscribe } from "@/lib/analytics";
import { dict, type Lang } from "@/lib/i18n";
import { capTrim } from "@/components/lumiere/collections/cap-trim";

import { SubmitArrow } from "./footer-icons";
import { CAP_RATIO_MANROPE, TYPE } from "./footer.config";

const label = capTrim(
  TYPE.link.size,
  TYPE.link.leading,
  CAP_RATIO_MANROPE * TYPE.link.size,
);

/**
 * The e-mail line — the reference's field (one `input[type=email]`, the
 * browser's own validation, an arrow to submit) over THIS SITE'S newsletter
 * action: `subscribeAction` (app/actions/newsletter.ts), the same Server
 * Action, honeypot, outcomes and `trackNewsletterSubscribe` event the site's
 * NewsletterForm uses (components/site/newsletter-form.tsx). Only the surface
 * is Lumière's.
 */
export const SubscribeForm = ({ lang }: { lang: Lang }) => {
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

  const message = state === "success" ? c.success[lang]
    : state === "already" ? c.already[lang]
    : state === "invalid" ? c.invalid[lang]
    : state === "rate_limited" ? c.rateLimited[lang]
    : state === "error" ? c.error[lang]
    : null;
  const bad = state === "invalid" || state === "rate_limited" || state === "error";

  return (
    <form ref={formRef} action={action} className="footer__field-form">
      <div className="footer__field">
        <label htmlFor="lumiere-newsletter-email" className="sr-only">{c.placeholder[lang]}</label>
        <input
          id="lumiere-newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          disabled={pending}
          placeholder={c.placeholder[lang]}
          className="footer__input"
          style={label}
        />
        <button type="submit" className="footer__submit" disabled={pending} data-analytics="newsletter-subscribe">
          <span className="sr-only">{c.submit[lang]}</span>
          <SubmitArrow />
        </button>
      </div>

      {/* Honeypot. Hidden from sight and from the accessibility tree, and left
          out of the tab order — a human never meets it, so anything that fills
          it is not one. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="lumiere-newsletter-company">Company</label>
        <input id="lumiere-newsletter-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {message && (
        <p role={bad ? "alert" : "status"} aria-live={bad ? "assertive" : "polite"} className="footer__message">
          {message}
        </p>
      )}
    </form>
  );
};
