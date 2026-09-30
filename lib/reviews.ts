/**
 * PRODUCT REVIEWS (PR-R2; Hub side PR-R1, owner-approved 2026-09-30).
 *
 * A review belongs to an ORDER. Staff make a personal, one-use review link on a
 * completed order in the Hub ("Copy review message") and send it on Messenger;
 * the link itself proves the purchase, so the review page needs no sign-in.
 * Nothing is public until the owner approves it in the Hub.
 *
 * The bounds below are the Hub's (supabase/functions/website/index.ts,
 * POST /review-invite/:token). Both sides need them: the browser shows the
 * counter and the photo limit before they are hit, and the Server Action
 * re-checks them because the browser is not the authority on anything. A
 * separate module because a "use server" file may export only async functions.
 */

export const REVIEW_MIN = 10;
export const REVIEW_MAX = 2000;
export const REVIEW_MAX_PHOTOS = 4;
/** The Hub refuses anything larger. */
export const REVIEW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const REVIEW_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * Photos are shrunk IN THE BROWSER before they are sent. A phone photo is
 * 3–8 MB, and the whole request (up to four of them) has to pass through the
 * Server Action to the Hub; the hosting platform caps a request body at 4.5 MB.
 * 1600px on the long side is more than a review card or its enlarged view
 * needs, and lands around 300–600 KB as a JPEG.
 */
export const REVIEW_PHOTO_LONG_SIDE = 1600;
export const REVIEW_PHOTO_QUALITY = 0.82;
/** What the Server Action accepts for the whole set, after shrinking. */
export const REVIEW_BODY_LIMIT_BYTES = 4 * 1024 * 1024;

/** GET /review-invite/:token */
export type ReviewInviteStatus = "valid" | "used" | "expired" | "not_found";
export type ReviewInvite = {
  status: ReviewInviteStatus;
  first_name: string | null;
  piece_name: string | null;
  product: { slug: string; name: string; image: string | null } | null;
};

/** One approved review, as GET /reviews returns it for the requested language. */
export type Review = {
  id: string;
  rating: number;
  /** Null only if a translation is missing; such a review is not shown. */
  body: string | null;
  display_name: string;
  piece_name: string;
  product: { slug: string; name: string } | null;
  photos: string[];
  approved_at: string;
};

export type ReviewList = { reviews: Review[]; count: number; average: number | null };

/**
 * The outcome of one submit, as one word the form renders. The error words are
 * the Hub's own codes where one exists, so a failure on screen names its cause.
 */
export type ReviewState =
  | "idle"
  | "success"
  | "invalid_rating"
  | "body_too_short"
  | "body_too_long"
  | "too_many_photos"
  | "photo_too_large"
  | "photo_type"
  | "not_found"
  | "expired"
  | "already_used"
  | "rate_limited"
  | "error";

/** Only reviews that can be shown in this language. */
export function showable(list: Review[]): Review[] {
  return list.filter((r) => typeof r.body === "string" && r.body.trim() !== "");
}
