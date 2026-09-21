"use server";

import { hub, HubError } from "@/lib/hub-api";
import { getLang } from "@/lib/i18n-server";

/**
 * The outcome of one sign-up attempt, as one word the form can render and the
 * analytics event can count.
 *
 * `already` is deliberately NOT an error: re-submitting an address must not
 * tell a stranger whether it is on the list, and must not read as a failure to
 * the person who simply forgot they had signed up.
 */
export type NewsletterState =
  | "idle"
  | "success"
  | "already"
  | "invalid"
  | "rate_limited"
  | "error";

/**
 * Deliberately loose. This is not the authority on whether an address exists —
 * only the Hub and the eventual bounce know that — and a strict pattern's only
 * real achievement is rejecting the unusual-but-valid. It catches the typo and
 * the empty box; the Hub does the rest.
 */
const LOOKS_LIKE_EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
const MAX_EMAIL = 254; // RFC 5321 path limit; longer is not an address.

/**
 * Sign up from the footer.
 *
 * A Server Action rather than a route handler, so `HUB_API_KEY` is paired with
 * the request on the server and never travels with a browser fetch — the same
 * rule the cart and checkout actions follow.
 *
 * Every failure comes back as a state. Nothing throws to the caller, because a
 * newsletter box that explodes takes the footer of every page with it.
 */
export async function subscribeAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  // Honeypot: a field no human sees and no human fills. A bot that fills it is
  // answered with the success it wanted, and nothing is sent to the Hub.
  if (String(formData.get("company") ?? "").trim() !== "") return "success";

  const email = String(formData.get("email") ?? "").trim();
  if (!email || email.length > MAX_EMAIL || !LOOKS_LIKE_EMAIL.test(email)) return "invalid";

  try {
    const lang = await getLang();
    const res = await hub.subscribe({ email, lang, source: "footer" });
    return res.status === "already_subscribed" ? "already" : "success";
  } catch (e) {
    if (e instanceof HubError && e.status === 429) return "rate_limited";
    return "error";
  }
}
