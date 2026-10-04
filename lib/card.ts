import type { HubOrderCard, HubOrderDetail } from "@/lib/types";

/**
 * Card payment (Square) on a confirmed order (S3, 2026-10-04): which Hub
 * answers the page acts on. The Hub decides whether a card is offered; this
 * file only refuses to render an answer that is not whole — a card form
 * without an Application ID or a Location ID could never tokenise — and it
 * never computes or adjusts a figure. Twin of lib/paidy.ts.
 */

/** The terms line the customer ticks on the pay-card page; sent to the Hub with the token, recorded on the hold. */
export const CARD_TERMS_VERSION = "card-terms-v1";

/** Where the Card Purchase Agreement is signed (owner D9). Public — the customer navigates to it. */
export const CARD_AGREEMENT_SIGN_BASE = "https://agreement.chajewelsjp.com/card.html";

/**
 * Square's Application IDs name their environment: sandbox ids start with
 * `sandbox-sq0idb-`, production ids with `sq0idp-`. The Hub already refuses a
 * mismatch; checked again here so a wrong family never loads the wrong SDK.
 */
export function squareAppFamily(appId: string): "sandbox" | "production" | null {
  if (/^sandbox-sq0idb-[A-Za-z0-9_-]{6,}$/.test(appId)) return "sandbox";
  if (/^sq0idp-[A-Za-z0-9_-]{6,}$/.test(appId)) return "production";
  return null;
}

/** The card block the page renders, or null when there is nothing whole to render. */
export function cardOffer(detail: Pick<HubOrderDetail, "card" | "order">): HubOrderCard | null {
  const c = detail.card;
  if (!c || c.offered !== true) return null;
  if (typeof c.app_id !== "string" || typeof c.location_id !== "string" || !c.location_id.trim()) return null;
  const family = squareAppFamily(c.app_id);
  if (!family) return null;
  // The id's family must agree with the mode the Hub reports: a production id
  // under test (or the reverse) would tokenise against the wrong Square.
  if ((family === "sandbox") !== (c.test === true)) return null;
  if (!Number.isInteger(c.amount_jpy) || c.amount_jpy <= 0) return null;
  if (detail.order.currency !== "JPY") return null;
  return c;
}

/** The Web Payments SDK for the environment the Hub's ids belong to. */
export function squareSdkSrc(test: boolean): string {
  return test ? "https://sandbox.web.squarecdn.com/v1/square.js" : "https://web.squarecdn.com/v1/square.js";
}

/**
 * Where this customer signs the Card Purchase Agreement, for THIS order.
 * `order` (the cash_orders id) is the key the signature is looked up by —
 * card.html refuses to open without it. `invoice` and `amount` only prefill
 * the order box on the page (the Hub's figures, passed through); `lang` picks
 * the page language (English governs; Japanese is a translation).
 */
export function cardSignUrl(orderId: string, invoice: string | null, amountJpy: number, lang: "en" | "ja"): string {
  const u = new URL(CARD_AGREEMENT_SIGN_BASE);
  u.searchParams.set("order", orderId);
  const inv = (invoice ?? "").trim();
  if (inv) u.searchParams.set("invoice", inv);
  if (Number.isInteger(amountJpy) && amountJpy > 0) u.searchParams.set("amount", String(amountJpy));
  u.searchParams.set("lang", lang === "ja" ? "ja" : "en");
  return u.toString();
}

/**
 * A one-time Square card token (`cnon:…` in both environments) — the ONLY
 * thing this page can produce. A card-on-file id (`ccof:`) is refused here so
 * a forged one never reaches the Hub from this surface. Checked before any
 * round trip.
 */
export function isSquareSourceId(v: unknown): v is string {
  return typeof v === "string" && /^cnon:[A-Za-z0-9_-]{8,200}$/.test(v);
}
