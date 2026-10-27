"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import type { ActionResult } from "@/lib/checkout-actions";
import { cleanReceiptDetails } from "@/lib/receipts";

/**
 * Saving the addressee (宛名) and purpose line (但し書き) of a receipt.
 * A Server Action like every customer write: the JWT stays on the server and
 * the Hub checks the receipt is hers and still issued. Shape is checked here
 * too, so a mistake is named before the round trip.
 */
export async function updateReceiptDetailsAction(form: FormData): Promise<ActionResult<{ addressee: string | null; purpose: string }>> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) return { ok: false, code: "signed_out" };

  const id = String(form.get("receipt_id") ?? "");
  if (!id) return { ok: false, code: "not_found" };
  const clean = cleanReceiptDetails(form.get("addressee"), form.get("purpose"));
  if (!clean.ok) return { ok: false, code: clean.code };

  try {
    const out = await hub.updateReceipt(jwt, id, { addressee: clean.addressee, purpose: clean.purpose });
    revalidatePath("/account/receipts");
    const orderPath = String(form.get("order_path") ?? "");
    if (orderPath.startsWith("/account/")) revalidatePath(orderPath);
    return { ok: true, data: { addressee: out.addressee ?? null, purpose: out.purpose } };
  } catch (e) {
    if (e instanceof HubError) return { ok: false, code: e.code ?? `http_${e.status}`, requestId: e.requestId };
    return { ok: false, code: "failed" };
  }
}
