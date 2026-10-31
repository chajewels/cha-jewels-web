import { isSitePath } from "@/lib/locale";

/**
 * The ONE validator for a post-sign-in redirect target (`next`), used by every
 * place that reads it: /auth/callback, /auth/confirm, confirmSignInAction, the
 * login form and the profile step (lib/profile.ts safeNext delegates here).
 *
 * Why it exists (security audit 2026-10-31, W-02): the five copies each checked
 * `startsWith("/") && !startsWith("//")`, which accepts "/\evil.com". Browsers
 * and the WHATWG URL parser read a backslash like a slash, so
 * new URL("/\\evil.com", site) is https://evil.com/ and a crafted sign-in link
 * landed the customer on another site after the code was exchanged.
 *
 * Accepted only when ALL of these hold:
 *  - a string of at most 2048 characters;
 *  - lib/locale isSitePath: one leading slash, no control character, no
 *    backslash and no empty segment in the path part;
 *  - no backslash anywhere (a real `next` never carries one);
 *  - resolving it against a probe origin keeps that origin, so no future
 *    parser quirk can turn it into another host.
 * Anything else becomes `fallback`. Pure and dependency-free (client-safe).
 */
const PROBE_ORIGIN = "https://cj-next.invalid";
const MAX_LENGTH = 2048;

export function safeNext(raw: unknown, fallback = "/account"): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_LENGTH) return fallback;
  if (raw.includes("\\")) return fallback;
  if (!isSitePath(raw)) return fallback;
  try {
    if (new URL(raw, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return fallback;
  } catch {
    return fallback;
  }
  return raw;
}
