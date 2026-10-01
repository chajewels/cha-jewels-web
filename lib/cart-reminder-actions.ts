"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import { getLang } from "@/lib/i18n-server";
import type { CartReminderSource } from "@/lib/types";
import type { ActionResult } from "@/lib/checkout-actions";
import { CART_REMINDER_TEXT_VERSION } from "@/lib/cart-reminders";

/**
 * Turns cart reminders on or off for the signed-in customer. A Server Action:
 * the JWT is paired with HUB_API_KEY here and never travels with a browser
 * fetch. The Hub writes the current state and one append-only consent event.
 */
export async function setCartRemindersAction(optedIn: boolean, source: CartReminderSource = "account"): Promise<ActionResult<{ opted_in: boolean }>> {
  let jwt: string | undefined;
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getSession();
    jwt = data.session?.access_token;
  } catch {
    return { ok: false, code: "session_unavailable" };
  }
  if (!jwt) return { ok: false, code: "signed_out" };
  try {
    const res = await hub.putCartReminders(jwt, {
      opted_in: optedIn === true,
      source,
      lang: await getLang(),
      text_version: CART_REMINDER_TEXT_VERSION,
    });
    revalidatePath("/account");
    return { ok: true, data: { opted_in: res.opted_in === true } };
  } catch (e) {
    if (e instanceof HubError) return { ok: false, code: e.code ?? `http_${e.status}`, requestId: e.requestId };
    return { ok: false, code: "failed" };
  }
}
