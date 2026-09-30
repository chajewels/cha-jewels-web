"use server";

import { headers } from "next/headers";
import { submitReview } from "@/lib/hub-api";
import {
  REVIEW_BODY_LIMIT_BYTES, REVIEW_MAX, REVIEW_MAX_PHOTOS, REVIEW_MIN,
  REVIEW_PHOTO_MAX_BYTES, REVIEW_PHOTO_TYPES, type ReviewState,
} from "@/lib/reviews";

/** The Hub's error codes this action passes through as they are. */
const HUB_CODES: ReadonlySet<ReviewState> = new Set<ReviewState>([
  "invalid_rating", "body_too_short", "body_too_long", "too_many_photos",
  "photo_too_large", "photo_type", "not_found", "expired", "already_used", "rate_limited",
]);

/** A token is what the Hub minted: 32 random bytes, base64url. Anything else is not one. */
const TOKEN = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Send one review through its personal link (/review/[token]).
 *
 * A Server Action, like the contact form: HUB_API_KEY is paired with the
 * request on the server and never travels with a browser fetch. The link is
 * the proof of purchase, so there is no customer sign-in here.
 *
 * Every bound the Hub enforces is re-checked first, so an obviously bad submit
 * never spends the customer's rate-limit budget, and the Hub checks them all
 * again anyway. Nothing throws: every outcome is a state the form renders.
 */
export async function reviewAction(formData: FormData): Promise<ReviewState> {
  const token = String(formData.get("token") ?? "");
  if (!TOKEN.test(token)) return "not_found";

  // Honeypot, as on /contact: a bot that fills it is told it succeeded.
  if (String(formData.get("company") ?? "").trim() !== "") return "success";

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return "invalid_rating";

  const body = String(formData.get("body") ?? "").trim();
  if (body.length < REVIEW_MIN) return "body_too_short";
  if (body.length > REVIEW_MAX) return "body_too_long";

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > REVIEW_MAX_PHOTOS) return "too_many_photos";
  let total = 0;
  for (const f of photos) {
    if (!(REVIEW_PHOTO_TYPES as readonly string[]).includes(f.type)) return "photo_type";
    if (f.size > REVIEW_PHOTO_MAX_BYTES) return "photo_too_large";
    total += f.size;
  }
  if (total > REVIEW_BODY_LIMIT_BYTES) return "photo_too_large";

  // A fresh body with only the fields the Hub reads: nothing the browser added
  // (the honeypot, the token) is forwarded.
  const out = new FormData();
  out.set("rating", String(rating));
  out.set("body", body);
  for (const f of photos) out.append("photos", f, f.name || "photo.jpg");

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;

  const res = await submitReview(token, out, ip);
  if (res.ok) return "success";
  if (HUB_CODES.has(res.code as ReviewState)) return res.code as ReviewState;
  if (res.status === 429) return "rate_limited";
  return "error";
}
