/**
 * HOW LONG A SIGN-IN LINK LASTS — READ, NOT GUESSED.
 *
 * The number lives in the HUB'S Supabase project, under Auth → Email OTP
 * Expiration. It is a Lovable Cloud setting and there is no file in this repo
 * that holds it (CLAUDE.md says the same about the redirect allow-list), so a
 * literal here would be a guess dressed as a fact — and the fact is one a
 * customer acts on: told "one hour" when it is fifteen minutes, they go back to
 * a dead link and conclude sign-in is broken.
 *
 * So it is CONFIGURATION. Set NEXT_PUBLIC_AUTH_LINK_EXPIRY_MINUTES to whatever
 * that setting says, and the sign-in screen states it. Leave it unset and the
 * screen says the link works once and says nothing about time — true either
 * way, and the only honest thing to render when nobody has told us.
 */
export function authLinkExpiryMinutes(): number | null {
  const raw = process.env.NEXT_PUBLIC_AUTH_LINK_EXPIRY_MINUTES?.trim();
  if (!raw) return null;
  const minutes = Number(raw);
  return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null;
}
