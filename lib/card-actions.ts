"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import type { ActionResult } from "@/lib/checkout-actions";
import { NOT_READY_FOR_PAYMENT } from "@/lib/reservation";
import { AGREEMENT_REQUIRED, AGREEMENT_UNVERIFIED } from "@/lib/layaway-agreement";
import { agreementStatus } from "@/lib/agreement-lookup";
import { CARD_TERMS_VERSION, cardOffer, isSquareSourceId } from "@/lib/card";

/**
 * Card payment (Square) on a confirmed order (S3, 2026-10-04).
 *
 * Square's Web Payments SDK runs in the browser and ends with a one-time card
 * token (`cnon:…`); 3-D Secure has already happened inside it. That token is
 * all the browser hands over: the Hub places a HOLD with its own access token
 * (nothing is charged), checks the answer is for this order and this amount,
 * and files it as a payment submission — exactly where a transfer slip goes.
 * The money moves only when a Cha Jewels reviewer confirms; Reject voids the
 * hold and the customer is never charged.
 *
 * THE AGREEMENT GATE RUNS HERE, server-side, and fails CLOSED (owner D9): the
 * page already checked it before showing the form, but a token can be posted
 * without the page, and the Hub's own refusal (`agreement_missing`) must never
 * be the only line of defence. Two codes, never one — "not signed" and "we
 * could not check" need different words (lib/layaway-agreement.ts).
 *
 * The customer JWT stays on the server, paired with HUB_API_KEY, like every
 * other Hub call. Nothing about money is decided here.
 */
export type CardAuthorizeInput = {
  sourceId: string;
  /** Square's separate verification token, when the SDK issued one; null with the tokenize(verificationDetails) flow. */
  verificationToken: string | null;
  /** When the customer ticked the terms line (the browser's clock; the Hub stamps its own too). */
  termsAcceptedAt: string;
};

export async function cardAuthorizeAction(orderId: string, input: CardAuthorizeInput): Promise<ActionResult<{ brand: string | null; last4: string | null }>> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) return { ok: false, code: "signed_out" };
  if (typeof orderId !== "string" || !/^[\w-]{1,64}$/.test(orderId)) return { ok: false, code: "failed" };
  if (!input || !isSquareSourceId(input.sourceId)) return { ok: false, code: "card_mismatch" };
  const verificationToken = typeof input.verificationToken === "string" && input.verificationToken.trim() ? input.verificationToken.trim().slice(0, 500) : null;
  const acceptedAt = typeof input.termsAcceptedAt === "string" && Number.isFinite(Date.parse(input.termsAcceptedAt)) ? new Date(input.termsAcceptedAt).toISOString() : null;
  if (!acceptedAt) return { ok: false, code: "terms_required" };

  // The offer is re-read from the Hub now, not trusted from the page: the
  // switch, the ids and the amount may have moved since the form was drawn.
  let detail;
  try {
    detail = await hub.order(jwt, orderId);
  } catch (err) {
    return { ok: false, code: cardCode(err), requestId: err instanceof HubError ? err.requestId : null };
  }
  if (!detail) return { ok: false, code: "failed" };
  const offer = cardOffer(detail);
  if (!offer) return { ok: false, code: "card_not_offered" };

  let agreement: { version: string; signed_at: string } | null = null;
  if (offer.agreement_required) {
    const status = await agreementStatus({ doc: "card", order: orderId });
    if (!status.ok) {
      // WE DO NOT KNOW. Fail CLOSED with its own code; the reason is logged, never shown.
      console.error("[cardAuthorizeAction] agreement lookup failed:", status.reason);
      return { ok: false, code: AGREEMENT_UNVERIFIED };
    }
    if (!status.signed) return { ok: false, code: AGREEMENT_REQUIRED };
    agreement = { version: status.version, signed_at: status.signedAt };
  }

  // Evidence of the tick, as the Hub records it on the hold (docs/SQUARE.md):
  // the customer's address and browser, from the request that carried it.
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || undefined;
  const userAgent = (h.get("user-agent") ?? "").slice(0, 300) || undefined;

  try {
    const result = await hub.orderCard(jwt, orderId, {
      source_id: input.sourceId,
      verification_token: verificationToken,
      terms: { accepted_at: acceptedAt, version: CARD_TERMS_VERSION, ip, user_agent: userAgent },
      agreement,
    });
    // The order page must now show the pending submission instead of the button.
    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath(`/account/orders/${orderId}/pay-card`);
    return { ok: true, data: { brand: result.card?.brand ?? null, last4: result.card?.last4 ?? null } };
  } catch (err) {
    return { ok: false, code: cardCode(err), requestId: err instanceof HubError ? err.requestId : null };
  }
}

/** The Hub's own refusal decides the words, not the HTTP status alone. */
function cardCode(err: unknown): string {
  if (err instanceof HubError) {
    switch (err.code) {
      // The bank said no (402, Square's code in err.detail): nothing was held.
      case "card_declined": return "card_declined";
      // The hold did not match the order, or Square refused the token: nothing was held.
      case "card_mismatch": return "card_mismatch";
      case "card_not_offered": return "card_not_offered";
      case "verification_required": return "verification_required";
      case "terms_required": return "terms_required";
      case "agreement_missing": return AGREEMENT_REQUIRED;
      case "submission_pending":
      // Paidy holds the order (owner rule 2026-10-04): no card payment until it is settled.
      case "paidy_in_progress":
      case "payment_in_progress": return "submission_pending";
      case "too_many_submissions": return "too_many_submissions";
      case "too_many_attempts": return "too_many_attempts";
      case "card_unavailable": return "card_unavailable";
      case NOT_READY_FOR_PAYMENT: return NOT_READY_FOR_PAYMENT;
    }
    if (err.status === 429) return "too_many_attempts";
    if (err.status === 401 || err.status === 403) return "signed_out";
  }
  return "failed";
}
