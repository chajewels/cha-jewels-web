/**
 * THE LAYAWAY AGREEMENT GATE — its two refusal codes, in one place.
 *
 * ONE RULE, ONE PLACE, the same convention as lib/layaway-availability.ts. The
 * server action refuses with these; the checkout UI has copy for these; nobody
 * re-spells them inline.
 *
 * TWO CODES, NOT ONE, and the distinction is the point. "You have not signed
 * yet" and "we could not check whether you signed" lead to different next
 * steps, so they must never collapse into one message. A customer who has
 * signed and hits a Sheets outage must not be told they did not sign.
 *
 * NOT A SECURITY BOUNDARY BY ITSELF. These are labels. The boundary is
 * `payLayawayAction` in lib/checkout-actions.ts, which calls the signing
 * record server-side and fails CLOSED. This file must stay importable from a
 * client component, so it holds no secret and calls nothing.
 */

/** The lookup answered, and the customer has not signed. */
export const AGREEMENT_REQUIRED = "agreement_required";

/**
 * The lookup did not answer, or answered something we cannot act on: a
 * timeout, a non-200, a malformed body, a missing token, or a row that says
 * signed but carries no version or no timestamp. All of it means the same
 * thing — we do not know — and the gate refuses rather than guessing.
 */
export const AGREEMENT_UNVERIFIED = "agreement_unverified";

/** The agreement is Tagalog only (owner decision). There is no other version. */
export const AGREEMENT_LANG = "tl";
