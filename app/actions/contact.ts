"use server";

import { hub, HubError } from "@/lib/hub-api";
import { getLang } from "@/lib/i18n-server";
import { LOOKS_LIKE_EMAIL, MAX_EMAIL, MAX_NAME, MAX_PHONE, MESSAGE_MAX, MESSAGE_MIN } from "@/lib/contact";

/**
 * The outcome of one contact attempt, as one word the form renders and the
 * analytics event counts.
 *
 * There is no `already`-style middle state here: unlike the newsletter, sending
 * the same message twice is simply sending it twice, and nothing about that is
 * worth telling the sender.
 */
export type ContactState = "idle" | "success" | "invalid" | "rate_limited" | "error";

/**
 * Send a message from /contact.
 *
 * A Server Action rather than a route handler, so `HUB_API_KEY` is paired with
 * the request on the server and never travels with a browser fetch — the same
 * rule the cart, checkout and newsletter actions follow.
 *
 * Every failure comes back as a state. Nothing throws to the caller: a contact
 * form that explodes leaves someone with a message they cannot send and no
 * idea why.
 */
export async function contactAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot: a field no human sees and no human fills. A bot that fills it is
  // answered with the success it wanted, and nothing reaches the Hub.
  if (String(formData.get("company") ?? "").trim() !== "") return "success";

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const newsletter = String(formData.get("newsletter") ?? "") !== "";
  // Where they were when they wrote it, so a reply has the context. Read from
  // the form rather than headers(): the path the person saw is the one the
  // page rendered, and a proxy's idea of it can differ.
  const page = String(formData.get("page") ?? "/contact").slice(0, 200);

  if (!full_name || full_name.length > MAX_NAME) return "invalid";
  if (!email || email.length > MAX_EMAIL || !LOOKS_LIKE_EMAIL.test(email)) return "invalid";
  if (phone.length > MAX_PHONE) return "invalid";
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) return "invalid";

  try {
    const lang = await getLang();
    await hub.contact({ full_name, email, phone: phone || undefined, message, lang, page, newsletter });
    return "success";
  } catch (e) {
    if (e instanceof HubError && e.status === 429) return "rate_limited";
    return "error";
  }
}
