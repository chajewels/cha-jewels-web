"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError, uploadProof } from "@/lib/hub-api";
import type { ActionResult } from "@/lib/checkout-actions";
import { NOT_READY_FOR_PAYMENT } from "@/lib/reservation";

/**
 * Reporting a transfer against a layaway plan.
 *
 * What this does NOT do is record a payment. It uploads the proof and creates a
 * submission; the money reaches the plan only when a Cha Jewels reviewer
 * confirms it in the Hub. That is the same route every staff-entered and
 * portal-entered payment takes, and the reason the plan's balance does not move
 * the moment this returns.
 *
 * The file never touches the Hub API key path: `uploadProof` goes to the Hub's
 * own upload function, which re-checks that this customer owns this plan before
 * writing anything.
 *
 * NOT GATED ON LANGUAGE, deliberately. Layaway is offered in English only
 * (owner decision 2026-09-15, lib/layaway-availability), but that governs
 * whether a NEW plan can be started — never whether an existing one can be
 * paid. A plan-holder browsing in Japanese must be able to report a transfer;
 * refusing here would strand someone mid-plan with a payment they have already
 * sent and no way to tell us. Same reason /account/layaway is not gated.
 */

const MAX_PROOF_BYTES = 10 * 1024 * 1024;

export async function submitLayawayPaymentAction(
  accountId: string,
  form: FormData,
): Promise<ActionResult<{ isDeposit: boolean }>> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) return { ok: false, code: "signed_out" };

  const amount = Math.round(Number(form.get("amount") ?? 0));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, code: "bad_amount" };

  const paymentDate = String(form.get("payment_date") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return { ok: false, code: "bad_payment_date" };

  const paymentMethod = String(form.get("payment_method") ?? "").trim();
  if (!paymentMethod) return { ok: false, code: "payment_method_required" };

  const file = form.get("proof");
  if (!(file instanceof File) || file.size === 0) return { ok: false, code: "proof_required" };
  if (file.size > MAX_PROOF_BYTES) return { ok: false, code: "proof_too_large" };

  try {
    const proofUrl = await uploadProof(jwt, accountId, file);
    const result = await hub.layawayPay(jwt, accountId, {
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      reference_number: String(form.get("reference_number") ?? "").trim() || undefined,
      proof_url: proofUrl,
    });
    // The page must now show the pending submission it did not have before.
    revalidatePath(`/account/layaway/${accountId}`);
    return { ok: true, data: { isDeposit: result.is_deposit } };
  } catch (err) {
    return { ok: false, code: submitCode(err), requestId: err instanceof HubError ? err.requestId : null };
  }
}

/** The Hub's own refusal decides the words, not the HTTP status alone. */
function submitCode(err: unknown): string {
  if (err instanceof HubError) {
    if (err.code === "upload_failed") return "proof_upload_failed";
    if (err.code === "too_many_submissions" || err.status === 429) return "too_many_submissions";
    if (err.code === "exceeds_balance") return "exceeds_balance";
    if (err.code === "plan_not_live") return "plan_not_live";
    // 409 before staff confirm a reservation (Hub A2). The page does not offer
    // the form then, so this is a tab left open across the switch or a
    // confirmation that has not landed yet — said plainly, never "failed".
    if (err.code === NOT_READY_FOR_PAYMENT) return NOT_READY_FOR_PAYMENT;
    if (err.code === "proof_required") return "proof_required";
    if (err.status === 401 || err.status === 403) return "signed_out";
  }
  return "failed";
}
