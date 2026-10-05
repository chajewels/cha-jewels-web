"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import type { ActionResult } from "@/lib/checkout-actions";
import type { CheckoutMethod } from "@/lib/types";
import { isSwitchMethod } from "@/lib/switch-method-copy";

/**
 * WEBSITE PAYMENT LIFECYCLE (task S3, 2026-10-05). "Pay another way": after a
 * reviewer rejected her Paidy or card payment she may move the order to one of
 * the methods the Hub lists in `switch_methods`. The Hub re-checks everything
 * (rejected, nothing in progress, payable, offered, one switch per rejection)
 * and refuses with a code; nothing is decided here. The customer JWT stays on
 * the server, paired with HUB_API_KEY, like every other Hub call.
 */
async function customerJwt(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function switchMethodAction(orderId: string, method: CheckoutMethod): Promise<ActionResult<{ payment_method: CheckoutMethod }>> {
  const jwt = await customerJwt();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (typeof orderId !== "string" || !/^[\w-]{1,64}$/.test(orderId)) return { ok: false, code: "failed" };
  if (!isSwitchMethod(method)) return { ok: false, code: "failed" };
  try {
    const r = await hub.orderPaymentMethod(jwt, orderId, method);
    revalidatePath(`/account/orders/${orderId}`);
    return { ok: true, data: { payment_method: r.payment_method } };
  } catch (err) {
    if (err instanceof HubError) {
      // The order moved on (a payment started, the switch was used): the page must re-read it.
      if (err.status === 409) revalidatePath(`/account/orders/${orderId}`);
      return { ok: false, code: err.code ?? "failed", requestId: err.requestId };
    }
    return { ok: false, code: "failed" };
  }
}
