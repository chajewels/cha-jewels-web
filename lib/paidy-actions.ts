"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import type { ActionResult } from "@/lib/checkout-actions";
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
