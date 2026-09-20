"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { hub, HubError } from "@/lib/hub-api";
import type { ActionResult } from "@/lib/checkout-actions";
import { DETAILS_MAX, RING_SIZE_MAX, isServiceKind, needsRingSize } from "@/lib/service-requests";
import type { ServiceRequest, ServiceRequestInput } from "@/lib/types";

/**
 * Raising a service request from an order or a plan.
 *
 * A Server Action, like every other customer write: the customer's JWT is
 * paired with HUB_API_KEY on the server and never travels with a browser fetch.
 * The Hub checks that the order or plan belongs to this customer before it
 * stores anything — this side validates shape, the Hub validates ownership.
 *
 * Returns the stored row so the page can show it at once, then revalidates the
 * page it was raised from and the all-requests page so a reload agrees.
 */
const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function createServiceRequestAction(form: FormData): Promise<ActionResult<ServiceRequest>> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) return { ok: false, code: "signed_out" };

  const orderId = str(form, "cash_order_id");
  const planId = str(form, "layaway_plan_id");
  if ((orderId ? 1 : 0) + (planId ? 1 : 0) !== 1) return { ok: false, code: "bad_target" };

  const kind = str(form, "kind");
  if (!isServiceKind(kind)) return { ok: false, code: "bad_kind" };

  const details = str(form, "details");
  if (!details) return { ok: false, code: "details_required" };
  if (details.length > DETAILS_MAX) return { ok: false, code: "details_too_long" };

  const ringSize = str(form, "ring_size");
  if (needsRingSize(kind) && !ringSize) return { ok: false, code: "ring_size_required" };
  if (ringSize.length > RING_SIZE_MAX) return { ok: false, code: "ring_size_too_long" };

  const itemTitle = str(form, "item_title");

  const body: ServiceRequestInput = {
    kind,
    details,
    lang: await getLang(),
    ...(orderId ? { cash_order_id: orderId } : { layaway_plan_id: planId }),
    ...(itemTitle ? { item_title: itemTitle } : {}),
    // Dropped unless the kind asks for it, so a size typed and then a kind
    // changed never reaches the Hub as noise.
    ...(needsRingSize(kind) && ringSize ? { ring_size: ringSize } : {}),
  };

  try {
    const created = await hub.createServiceRequest(jwt, body);
    revalidatePath(orderId ? `/account/orders/${orderId}` : `/account/layaway/${planId}`);
    revalidatePath("/account/service-requests");
    return { ok: true, data: created };
  } catch (e) {
    if (e instanceof HubError) return { ok: false, code: e.code ?? `http_${e.status}`, requestId: e.requestId };
    return { ok: false, code: "failed" };
  }
}
