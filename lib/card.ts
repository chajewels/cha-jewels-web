import type { HubAddress, HubCardBilling, HubOrderCard, HubOrderDetail } from "@/lib/types";
import { billingCountryCode } from "@/lib/billing-countries";

/**
 * Card payment (Square) on a confirmed order (S3, 2026-10-04): which Hub
 * answers the page acts on. The Hub decides whether a card is offered; this
 * file only refuses to render an answer that is not whole — a card form
 * without an Application ID or a Location ID could never tokenise — and it
 * never computes or adjusts a figure. Twin of lib/paidy.ts.
 */

/** The terms line the customer ticks on the pay-card page; sent to the Hub with the token, recorded on the hold. */
export const CARD_TERMS_VERSION = "card-terms-v1";

/**
 * What the storefront can truthfully say about 3-D Secure (SQ18): the card was
 * tokenised by Square's SDK with verification details — never "verified",
 * which only the issuer knows. Sent to the Hub as `verification`.
 */
export const CARD_VERIFICATION = "sdk_tokenize_with_verification" as const;

/**
 * The agreement was signed, but not for THIS customer and THIS amount (owner
 * 5A): the amount changed since, or it is a legacy signature without the
 * signed link. She signs again; the copy says why. Twin of the two codes in
 * lib/layaway-agreement.ts.
 */
export const CARD_AGREEMENT_RESIGN = "agreement_resign";

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
 * the page language (English governs; Japanese is a translation). `ctx` is
 * the signed context (lib/card-agreement-link.ts, server-only) that binds the
 * signature to this customer and this amount (owner 5A) — the caller builds
 * it on the server and passes it in; without one there is no link.
 */
export function cardSignUrl(orderId: string, invoice: string | null, amountJpy: number, lang: "en" | "ja", ctx: string): string {
  const u = new URL(CARD_AGREEMENT_SIGN_BASE);
  u.searchParams.set("order", orderId);
  const inv = (invoice ?? "").trim();
  if (inv) u.searchParams.set("invoice", inv);
  if (Number.isInteger(amountJpy) && amountJpy > 0) u.searchParams.set("amount", String(amountJpy));
  u.searchParams.set("lang", lang === "ja" ? "ja" : "en");
  u.searchParams.set("ctx", ctx);
  return u.toString();
}

/** The lookup's answer (lib/agreement-lookup.ts), as far as the gate reads it. Structural, so this file stays client-safe. */
export type CardAgreementAnswer =
  | { ok: false }
  | { ok: true; signed: false }
  | { ok: true; signed: true; version: string; signedAt: string; bound: boolean; customerId: string | null; amountJpy: number | null };

/** What the Hub receives as `agreement` (POST /orders/:id/card). */
export type CardAgreementEvidence = { version: string; signed_at: string; customer_id: string | null; amount_jpy: number | null; bound: boolean };

export type CardAgreementGate =
  | { gate: "form"; agreement: CardAgreementEvidence }
  | { gate: "sign" }
  | { gate: "resign"; reason: "amount" | "unbound" }
  | { gate: "unverified" };

/**
 * THE AGREEMENT GATE (owner D9 + 5A), one rule for the page and the server
 * action. It passes only when the lookup says signed AND bound AND names this
 * customer AND this exact amount — strict equality on the Hub's figures, no
 * arithmetic. A signature for another amount, another customer or none at all
 * (a legacy, unbound one) asks her to sign again. "We could not check" stays
 * its own answer, never "not signed". An older Hub that does not name the
 * customer cannot be bound, so it fails closed as "could not check".
 */
export function cardAgreementGate(status: CardAgreementAnswer, card: Pick<HubOrderCard, "amount_jpy" | "customer_id">): CardAgreementGate {
  if (!status.ok) return { gate: "unverified" };
  if (!status.signed) return { gate: "sign" };
  if (typeof card.customer_id !== "string" || !card.customer_id) return { gate: "unverified" };
  if (status.bound !== true || status.customerId !== card.customer_id) return { gate: "resign", reason: "unbound" };
  if (status.amountJpy !== card.amount_jpy) return { gate: "resign", reason: "amount" };
  return {
    gate: "form",
    agreement: { version: status.version, signed_at: status.signedAt, customer_id: status.customerId, amount_jpy: status.amountJpy, bound: true },
  };
}

/** What the cardholder typed on the pay-card form (owner 4A). */
export type CardBillingForm = {
  name: string;
  sameAsDelivery: boolean;
  country: string;
  postalCode: string;
  state: string;
  city: string;
  line1: string;
  line2: string;
};

/** Square's `billingContact` for `card.tokenize(verificationDetails)`. The whole name in one field — names are never split. */
export type SquareBillingContact = {
  givenName: string;
  addressLines?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
};

type Delivery = Pick<HubAddress, "line1" | "line2" | "city" | "region" | "postal_code" | "country"> | null | undefined;

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/**
 * THE CARDHOLDER'S BILLING CONTACT (owner 4A, SQ17). The NAME is always the
 * cardholder-name field — never the delivery recipient, never a gift
 * recipient. The ADDRESS is the order's delivery address while "same as
 * delivery" is ticked, otherwise what she typed. One builder for both ends:
 * the browser hands `square` to Square's buyer verification, the server hands
 * `hub` to the Hub (rebuilding the delivery half from the Hub's own address,
 * never the browser's copy). Nothing is computed; empty fields are left out.
 */
export function cardBilling(form: CardBillingForm, delivery: Delivery):
  | { ok: true; hub: HubCardBilling; square: SquareBillingContact }
  | { ok: false; code: "billing_name_required" | "billing_address_required" } {
  const name = clip(form.name, 120);
  if (!name) return { ok: false, code: "billing_name_required" };
  const same = form.sameAsDelivery === true;
  const addr = same
    ? (delivery && clip(delivery.line1, 200)
      ? { line1: clip(delivery.line1, 200), line2: clip(delivery.line2, 200), city: clip(delivery.city, 100), state: clip(delivery.region, 100), postal: clip(delivery.postal_code, 20), country: billingCountryCode(delivery.country) }
      : null)
    : { line1: clip(form.line1, 200), line2: clip(form.line2, 200), city: clip(form.city, 100), state: clip(form.state, 100), postal: clip(form.postalCode, 20), country: billingCountryCode(form.country) };
  if (!addr) return { ok: false, code: "billing_address_required" };
  // A typed address needs its country, first line and city; the delivery
  // address is whatever the Hub holds (an older one may lack a part).
  if (!same && (!addr.country || !addr.line1 || !addr.city)) return { ok: false, code: "billing_address_required" };
  const hub: HubCardBilling = {
    name,
    same_as_delivery: same,
    ...(addr.country ? { country: addr.country } : {}),
    ...(addr.line1 ? { address_line_1: addr.line1 } : {}),
    ...(addr.line2 ? { address_line_2: addr.line2 } : {}),
    ...(addr.city ? { locality: addr.city } : {}),
    ...(addr.state ? { administrative_district_level_1: addr.state } : {}),
    ...(addr.postal ? { postal_code: addr.postal } : {}),
  };
  const lines = [addr.line1, addr.line2].filter(Boolean);
  const square: SquareBillingContact = {
    givenName: name,
    ...(lines.length ? { addressLines: lines } : {}),
    ...(addr.city ? { city: addr.city } : {}),
    ...(addr.state ? { state: addr.state } : {}),
    ...(addr.postal ? { postalCode: addr.postal } : {}),
    ...(addr.country ? { countryCode: addr.country } : {}),
  };
  return { ok: true, hub, square };
}

/**
 * HOW A CARD REFUSAL IS WORDED (SQ22). The Hub's answer to POST
 * /orders/:id/card, turned into the one code the page has copy for. The rule
 * that matters: "nothing was charged" is said ONLY where it is established —
 * a decline, a mismatch whose hold is already voided, a changed amount, the
 * attempt caps, a terms/agreement refusal, not offered, and a 502 (Square
 * refused a configuration/auth request, which proves no hold was made).
 * Anything that may have reached Square without a clear answer — a 5xx, an
 * unrecognised refusal, a thrown request — is "unconfirmed": do not pay again
 * yet, refresh in a minute.
 */
export function cardRefusalCode(err: { status: number; code: string | null; body?: Record<string, unknown> | null }): string {
  const body = err.body ?? null;
  switch (err.code) {
    case "card_declined": return body?.order_cancelled === true ? "card_declined_cancelled" : "card_declined";
    case "card_mismatch": return body?.hold === "void_pending" ? "card_mismatch_void_pending" : "card_mismatch";
    case "card_attempt_pending": return "card_attempt_pending";
    case "card_hold_unfiled": return "card_hold_unfiled";
    case "amount_changed": return "amount_changed";
    case "agreement_missing": return "agreement_required";
    case "agreement_resign": return CARD_AGREEMENT_RESIGN;
    case "terms_required": return "terms_required";
    case "card_not_offered": return "card_not_offered";
    case "not_ready_for_payment": return "not_ready_for_payment";
    case "submission_pending": return "submission_pending";
    case "too_many_attempts": return "too_many_attempts";
    case "too_many_submissions": return "too_many_submissions";
    case "verification_required": return "verification_required";
    case "card_unavailable": return "card_unavailable";
  }
  if (err.status === 401 || err.status === 403) return "signed_out";
  if (err.status === 404) return "card_not_offered";
  if (err.status === 429) return "too_many_attempts";
  return "unconfirmed";
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
