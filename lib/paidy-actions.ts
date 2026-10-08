"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import type { ActionResult } from "@/lib/checkout-actions";
import type { PaidyCheckoutPayload } from "@/lib/types";
import { NOT_READY_FOR_PAYMENT } from "@/lib/reservation";

/**
 * Paidy ato-barai on a confirmed order (2026-10-03).
 *
 * Paidy's window runs in the browser and ends with an authorisation id. That
 * id is all the browser hands over: the Hub reads the authorisation back from
 * Paidy with its secret key, checks it is for this order and this amount, and
 * files it as a payment submission — exactly where a transfer slip goes. The
 * money moves only when a Cha Jewels reviewer confirms; Reject releases it
 * and the customer is never charged.
 *
 * The customer JWT stays on the server, paired with HUB_API_KEY, like every
 * other Hub call. Nothing about money is decided here.
 */
const PAIDY_ID = /^pay_[A-Za-z0-9_-]{6,80}$/;
const ATTEMPT_ID = /^[0-9a-f-]{36}$/i;

async function customerJwt(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Owner rule 2026-10-04: the Hub records the customer's Paidy window BEFORE
 * Paidy opens, so no other payment (a second tab, the card page, the bank
 * details) can be started while it runs. Answers the Hub's fresh payload.
 */
export async function paidyStartAction(orderId: string): Promise<ActionResult<{ attemptId: string; checkout: PaidyCheckoutPayload }>> {
  const jwt = await customerJwt();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (typeof orderId !== "string" || !/^[\w-]{1,64}$/.test(orderId)) return { ok: false, code: "failed" };
  try {
    const r = await hub.paidyStart(jwt, orderId);
    return { ok: true, data: { attemptId: r.attempt_id, checkout: r.checkout } };
  } catch (err) {
    if (err instanceof HubError && err.code === "order_cannot_take_payment") {
      revalidatePath(`/account/orders/${orderId}`);
      return { ok: false, code: "paidy_not_offered", requestId: err.requestId };
    }
    if (err instanceof HubError && err.code === "payment_in_progress") {
      revalidatePath(`/account/orders/${orderId}`);
      return { ok: false, code: "payment_in_progress", requestId: err.requestId };
    }
    return { ok: false, code: paidyCode(err), requestId: err instanceof HubError ? err.requestId : null };
  }
}

/** Paidy reported the window closed / declined (no authorisation): end the window so the other options return. */
export async function paidyAbandonAction(orderId: string, attemptId: string, reason: "closed" | "rejected" | "error", paidyPaymentId?: unknown): Promise<ActionResult<null>> {
  const jwt = await customerJwt();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (typeof orderId !== "string" || !/^[\w-]{1,64}$/.test(orderId) || typeof attemptId !== "string" || !ATTEMPT_ID.test(attemptId)) return { ok: false, code: "failed" };
  // Server-action arguments are untrusted: only the three reasons the Hub knows.
  if (reason !== "closed" && reason !== "rejected" && reason !== "error") return { ok: false, code: "failed" };
  // PA04 (2026-10-08): the id Paidy's callback named for a rejected / closed
  // window, if it looks like one — the Hub verifies it with Paidy itself.
  const noted = typeof paidyPaymentId === "string" && PAIDY_ID.test(paidyPaymentId) ? paidyPaymentId : null;
  try {
    try {
      await hub.paidyAbandon(jwt, orderId, attemptId, reason, noted);
    } catch {
      // One retry: a lost abandon keeps the order on hold for up to 30 minutes.
      await hub.paidyAbandon(jwt, orderId, attemptId, reason, noted);
    }
    revalidatePath(`/account/orders/${orderId}`);
    return { ok: true, data: null };
  } catch (err) {
    // Not fatal: the Hub times the window out after 30 minutes by itself.
    return { ok: false, code: paidyCode(err), requestId: err instanceof HubError ? err.requestId : null };
  }
}

export async function paidyAuthorizedAction(orderId: string, paidyPaymentId: string): Promise<ActionResult<null>> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) return { ok: false, code: "signed_out" };
  if (typeof orderId !== "string" || !/^[\w-]{1,64}$/.test(orderId)) return { ok: false, code: "failed" };
  if (typeof paidyPaymentId !== "string" || !PAIDY_ID.test(paidyPaymentId)) return { ok: false, code: "paidy_mismatch" };

  try {
    await hub.orderPaidy(jwt, orderId, paidyPaymentId);
    // The page must now show the pending submission instead of the button.
    revalidatePath(`/account/orders/${orderId}`);
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, code: paidyCode(err), requestId: err instanceof HubError ? err.requestId : null };
  }
}

/** The Hub's own refusal decides the words, not the HTTP status alone. */
function paidyCode(err: unknown): string {
  if (err instanceof HubError) {
    // The authorisation did not match the order (amount, reference, status):
    // the Hub has closed it and nothing was filed.
    if (err.code === "paidy_mismatch") return "paidy_mismatch";
    if (err.code === "paidy_not_offered") return "paidy_not_offered";
    if (err.code === "submission_pending") return "submission_pending";
    if (err.code === "too_many_submissions" || err.status === 429) return "too_many_submissions";
    if (err.code === NOT_READY_FOR_PAYMENT) return NOT_READY_FOR_PAYMENT;
    if (err.status === 401 || err.status === 403) return "signed_out";
  }
  return "failed";
}

/**
 * P05 (owner 2026-10-08): the buyer's own family name, given name and
 * Japanese mobile number — what Paidy needs and the Hub checks. Validation
 * is the Hub's (`PUT /me/paidy-profile`, 400 names the field); here only the
 * obvious blanks are refused so the form can mark them before a round trip.
 */
export async function paidyProfileAction(form: FormData): Promise<ActionResult<null>> {
  const jwt = await customerJwt();
  if (!jwt) return { ok: false, code: "signed_out" };
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const input = { family_name: str("family_name"), given_name: str("given_name"), mobile_number: str("mobile_number") };
  if (!input.family_name) return { ok: false, code: "family_name_required" };
  if (!input.given_name) return { ok: false, code: "given_name_required" };
  if (!input.mobile_number) return { ok: false, code: "jp_mobile_required" };
  const orderId = str("order_id");
  try {
    await hub.paidyProfile(jwt, input);
    if (ATTEMPT_ID.test(orderId) || /^[0-9a-f-]{36}$/i.test(orderId)) revalidatePath(`/account/orders/${orderId}`);
    return { ok: true, data: null };
  } catch (err) {
    if (err instanceof HubError) return { ok: false, code: err.code ?? `http_${err.status}`, requestId: err.requestId };
    return { ok: false, code: "failed" };
  }
}
