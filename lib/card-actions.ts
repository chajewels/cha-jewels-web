"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import type { ActionResult } from "@/lib/checkout-actions";
import { AGREEMENT_REQUIRED, AGREEMENT_UNVERIFIED } from "@/lib/layaway-agreement";
import { agreementStatus } from "@/lib/agreement-lookup";
import { CARD_AGREEMENT_RESIGN, CARD_TERMS_VERSION, CARD_VERIFICATION, cardAgreementGate, cardBilling, cardOffer, cardRefusalCode, isSquareSourceId, type CardAgreementEvidence, type CardBillingForm } from "@/lib/card";

/**
 * Card payment (Square) on a confirmed order (S3, 2026-10-04).
 *
 * Square's Web Payments SDK runs in the browser and ends with a one-time card
 * token (`cnon:…`), tokenised WITH buyer verification details (3-D Secure, if
 * the bank asks for it, runs inside that call — this side never claims it was
 * "verified", SQ18). That token is
 * all the browser hands over: the Hub places a HOLD with its own access token
 * (nothing is charged), checks the answer is for this order and this amount,
 * and files it as a payment submission — exactly where a transfer slip goes.
 * The money moves only when a Cha Jewels reviewer confirms; Reject voids the
 * hold and the customer is never charged.
 *
 * THE AGREEMENT GATE RUNS HERE, server-side, and fails CLOSED (owner D9): the
 * page already checked it before showing the form, but a token can be posted
 * without the page, and the Hub's own refusal (`agreement_missing`) must never
 * be the only line of defence. Three codes — "not signed", "signed, but not
 * for this customer and amount, sign again" (owner 5A) and "we could not
 * check" need different words (lib/layaway-agreement.ts, lib/card.ts).
 *
 * TRUTHFUL OUTCOMES (SQ22): 200 is a hold (not a charge), 202 is "being
 * confirmed", and a request that left but did not come back is
 * "unconfirmed" — never "nothing was charged" (lib/card.ts cardRefusalCode).
 *
 * The customer JWT stays on the server, paired with HUB_API_KEY, like every
 * other Hub call. Nothing about money is decided here.
 */
export type CardAuthorizeInput = {
  sourceId: string;
  /** When the customer ticked the terms line (the browser's clock; the Hub stamps its own too). */
  termsAcceptedAt: string;
  /** The cardholder (owner 4A). With sameAsDelivery the address half is rebuilt here from the Hub's own order, never taken from the browser. */
  billing: CardBillingForm;
  /** The card block's `amount_jpy` the page was rendered with — passed through untouched (SQ23). */
  expectedAmountJpy: number;
};

/**
 * held        — the Hub placed and filed a HOLD (200). Not charged yet.
 * processing  — Square's answer is not known yet (202): she must not pay again.
 */
export type CardAuthorizeData =
  | { outcome: "held"; brand: string | null; last4: string | null; captureBy: string | null }
  | { outcome: "processing"; reference: string | null };

export async function cardAuthorizeAction(orderId: string, input: CardAuthorizeInput): Promise<ActionResult<CardAuthorizeData>> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) return { ok: false, code: "signed_out" };
  if (typeof orderId !== "string" || !/^[\w-]{1,64}$/.test(orderId)) return { ok: false, code: "failed" };
  if (!input || !isSquareSourceId(input.sourceId)) return { ok: false, code: "card_mismatch" };
  const acceptedAt = typeof input.termsAcceptedAt === "string" && Number.isFinite(Date.parse(input.termsAcceptedAt)) ? new Date(input.termsAcceptedAt).toISOString() : null;
  if (!acceptedAt) return { ok: false, code: "terms_required" };
  if (!Number.isSafeInteger(input.expectedAmountJpy) || input.expectedAmountJpy <= 0) return { ok: false, code: "amount_changed" };

  // The offer is re-read from the Hub now, not trusted from the page: the
  // switch, the ids and the amount may have moved since the form was drawn.
  // Nothing has reached Square yet, so a failure here is "failed" — nothing charged.
  let detail;
  try {
    detail = await hub.order(jwt, orderId);
  } catch (err) {
    const code = err instanceof HubError && (err.status === 401 || err.status === 403) ? "signed_out" : "failed";
    return { ok: false, code, requestId: err instanceof HubError ? err.requestId : null };
  }
  if (!detail) return { ok: false, code: "card_not_offered" };
  // An unresolved card payment (or anything that hides the card): the order
  // page says what is happening.
  if (detail.card_payment) return { ok: false, code: "card_attempt_pending" };
  const offer = cardOffer(detail);
  if (!offer) return { ok: false, code: "card_not_offered" };
  // The amount she saw is the amount she agreed to pay (SQ23). A plain
  // comparison of the Hub's two figures — the Hub checks it again.
  if (input.expectedAmountJpy !== offer.amount_jpy) return { ok: false, code: "amount_changed" };

  // The cardholder. The name is always hers as typed; with "same as delivery"
  // the address is the Hub's own delivery address for this order.
  const billing = cardBilling(input.billing, detail.order.ship_to_address);
  if (!billing.ok) return { ok: false, code: billing.code };

  let agreement: CardAgreementEvidence | null = null;
  if (offer.agreement_required) {
    const status = await agreementStatus({ doc: "card", order: orderId });
    if (!status.ok) {
      // WE DO NOT KNOW. Fail CLOSED with its own code; the reason is logged, never shown.
      console.error("[cardAuthorizeAction] agreement lookup failed:", status.reason);
      return { ok: false, code: AGREEMENT_UNVERIFIED };
    }
    const gate = cardAgreementGate(status, offer);
    if (gate.gate === "unverified") return { ok: false, code: AGREEMENT_UNVERIFIED };
    if (gate.gate === "sign") return { ok: false, code: AGREEMENT_REQUIRED };
    if (gate.gate === "resign") return { ok: false, code: CARD_AGREEMENT_RESIGN };
    agreement = gate.agreement;
  }

  // Evidence of the tick, as the Hub records it on the hold (docs/SQUARE.md):
  // the customer's address and browser, from the request that carried it.
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || undefined;
  const userAgent = (h.get("user-agent") ?? "").slice(0, 300) || undefined;

  try {
    const result = await hub.orderCard(jwt, orderId, {
      source_id: input.sourceId,
      verification: CARD_VERIFICATION,
      terms: { accepted_at: acceptedAt, version: CARD_TERMS_VERSION, ip, user_agent: userAgent },
      agreement,
      billing: billing.hub,
      expected_amount_jpy: input.expectedAmountJpy,
    });
    // The order page must now show the card payment's state instead of the options.
    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath(`/account/orders/${orderId}/pay-card`);
    if (result.ok) {
      return { ok: true, data: { outcome: "held", brand: result.card?.brand ?? null, last4: result.card?.last4 ?? null, captureBy: result.card?.capture_by ?? null } };
    }
    return { ok: true, data: { outcome: "processing", reference: result.attempt?.reference ?? null } };
  } catch (err) {
    if (err instanceof HubError) {
      return { ok: false, code: cardRefusalCode({ status: err.status, code: err.code, body: err.body }), requestId: err.requestId };
    }
    // A timeout or a dropped connection AFTER the request left: Square may
    // have answered. Never "not charged", never "try again" (SQ22).
    console.error("[cardAuthorizeAction] card request did not complete:", err);
    return { ok: false, code: "unconfirmed" };
  }
}
