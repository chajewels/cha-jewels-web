import "server-only";
import { HubError } from "@/lib/hub-api";

/**
 * "Complete your profile" and "already registered" — the two answers the Hub
 * can now give when a signed-in customer is linked (POST /auth/customer).
 *
 * Until 2026-09-24 the Hub created a customer the moment an unknown email
 * signed in, named after the email. It now creates nobody without a profile:
 *
 *   422 profile_required    no customer holds this email and no profile was
 *                           sent. Nothing was created. → PROFILE_PATH.
 *   409 already_registered  the details match an existing customer (full name,
 *                           Facebook name, mobile or email). Nothing was
 *                           created. → REGISTERED_PATH, which signs her out.
 *
 * Every caller of hub.authCustomer checks both with the helpers below, so the
 * four entry points (callback, confirm action, checkout, loyalty join) and
 * /account cannot disagree about what either answer means.
 */

/** The profile step. Under /account, so middleware's sign-in gate covers it. */
export const PROFILE_PATH = "/account/complete-profile";

/**
 * The already-registered notice. NOT under /account: she is signed out there,
 * and a gated path would bounce her to /login instead of telling her why.
 */
export const REGISTERED_PATH = "/already-registered";

/**
 * `next` validated exactly as /auth/callback validates it: relative only, so a
 * crafted link cannot bounce the customer off-site.
 */
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  const v = raw ?? "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

/**
 * Where the profile step goes afterwards. safeNext, and never the profile
 * step itself — that would redirect a linked customer to the same page forever.
 */
export function profileNext(raw: string | null | undefined): string {
  const next = safeNext(raw);
  return next === PROFILE_PATH || next.startsWith(`${PROFILE_PATH}?`) || next.startsWith(`${PROFILE_PATH}/`) ? "/account" : next;
}

/** The profile step, remembering where she was going. */
export function profileUrl(next: string): string {
  return `${PROFILE_PATH}?next=${encodeURIComponent(profileNext(next))}`;
}

export const isProfileRequired = (e: unknown): boolean =>
  e instanceof HubError && e.status === 422 && e.code === "profile_required";

export const isAlreadyRegistered = (e: unknown): boolean =>
  e instanceof HubError && e.status === 409 && e.code === "already_registered";
