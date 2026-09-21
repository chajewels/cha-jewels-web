/**
 * Contact-form bounds, in one place because both sides need them and they must
 * agree: the browser shows the message counter and caps the textarea, and the
 * Server Action re-checks the same numbers because the browser is not the
 * authority on anything.
 *
 * A separate module rather than exports from app/actions/contact.ts: a
 * "use server" file may export nothing but async functions, so a constant
 * living there fails the build.
 */

/** Short enough to be a real name, long enough for a long one. */
export const MAX_NAME = 120;
/** RFC 5321 path limit; longer is not an address. */
export const MAX_EMAIL = 254;
/** Generous: international numbers with country codes and separators. */
export const MAX_PHONE = 40;

/** Below this is not a message; above it is a document, and email is better. */
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

/**
 * Deliberately loose, the same rule as the newsletter action: this is not the
 * authority on whether an address exists — only the Hub and the eventual
 * bounce know that — and a strict pattern's only real achievement is rejecting
 * the unusual-but-valid. It catches the typo and the empty box.
 */
export const LOOKS_LIKE_EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
