/**
 * The customer's optional Messenger link (profile step), checked before it is
 * sent to the Hub.
 *
 * Why (security audit 2026-10-31, H-07): the link was sent as typed, and the
 * Hub shows it to staff as a clickable link on the customer card. A value like
 * "javascript:..." would run in the staff member's signed-in Hub session when
 * clicked. The Hub applies the SAME rule on every save path
 * (supabase/functions/_shared/profile-messenger-link.ts in the Hub repo) — the Hub is
 * the authority; this copy only lets the form say what is wrong.
 *
 * Rule:
 *  - empty after trimming → no link (null);
 *  - written with a scheme → only http: or https: is accepted;
 *  - written without one (the form's own hint is "m.me/username") → https:// is
 *    added, exactly as a person typing it means;
 *  - the result must parse as a URL with a dotted host and no user/password,
 *    contain no whitespace or control character, and be at most 200 characters.
 * Anything else is refused (`ok: false`), never silently dropped. A valid
 * link is stored in the parsed URL's canonical form (url.href), e.g.
 * "https:m.me/x" → "https://m.me/x".
 * Pure and dependency-free (client-safe).
 */
export const MESSENGER_LINK_MAX = 200;

export type MessengerLinkResult = { ok: true; value: string | null } | { ok: false };

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const BAD_CHARS = /[\s\u0000-\u001f\u007f]/;

export function normalizeMessengerLink(raw: unknown): MessengerLinkResult {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== "string") return { ok: false };
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  if (BAD_CHARS.test(trimmed) || trimmed.includes("\\")) return { ok: false };
  const candidate = HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
  if (candidate.length > MESSENGER_LINK_MAX) return { ok: false };
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false };
  if (url.username || url.password) return { ok: false };
  if (!url.hostname.includes(".") || url.hostname.startsWith(".") || url.hostname.endsWith(".")) return { ok: false };
  if (url.href.length > MESSENGER_LINK_MAX) return { ok: false };
  return { ok: true, value: url.href };
}
