"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import { readCart, hydrateCart } from "@/lib/cart";
import { writeCart } from "@/lib/cart";
import type { HubAddress, HubQuote, HubPayResult, OrderType } from "@/lib/types";

/**
 * Checkout runs entirely on the server.
 *
 * The customer's JWT never reaches the browser's fetch calls — the client
 * component calls these actions, and the action pairs the JWT with the server's
 * HUB_API_KEY. Both credentials are required by the Hub, and only one of them
 * exists on this side of the wire.
 *
 * Every money figure returned here comes from the Hub. Nothing is computed
 * locally: the Hub re-prices at /checkout/quote and again inside
 * create_web_order_atomic, so a tampered client cannot move a price.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string };

async function jwtOrNull(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Maps a Hub failure to a code the UI has copy for; anything else is "failed". */
function toCode(err: unknown): string {
  if (err instanceof HubError) {
    if (err.status === 409) return "sold_out";
    if (err.status === 401 || err.status === 403) return "signed_out";
  }
  return "failed";
}

/**
 * Appends an address to the customer's list. PUT /me/addresses replaces the
 * WHOLE list, so the existing ones are sent back with it — dropping them here
 * would silently delete addresses the customer still uses.
 */
export async function saveAddressAction(
  existing: HubAddress[],
  address: HubAddress,
): Promise<ActionResult<HubAddress[]>> {
  const jwt = await jwtOrNull();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (!address.line1?.trim()) return { ok: false, code: "address_required" };

  // A newly added address becomes the default; the Hub enforces one default per
  // customer, so the others must be cleared in the same payload.
  const next: HubAddress[] = [
    ...existing.map((a) => ({ ...a, is_default: false })),
    { ...address, is_default: true },
  ];
  try {
    await hub.putAddresses(jwt, next);
    const me = await hub.me(jwt);
    return { ok: true, data: me.addresses };
  } catch (err) {
    return { ok: false, code: toCode(err) };
  }
}

export async function quoteAction(input: {
  ship_to_address_id: string;
  order_type: OrderType;
  recipient_name?: string;
  recipient_phone?: string;
  gift_note?: string;
}): Promise<ActionResult<HubQuote>> {
  const jwt = await jwtOrNull();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (!input.ship_to_address_id) return { ok: false, code: "address_required" };

  // Price the CART as the server sees it, not a basket posted by the client.
  const { items } = await hydrateCart(await readCart());
  if (items.length === 0) return { ok: false, code: "empty_cart" };

  try {
    const quote = await hub.quote(jwt, {
      items: items.map((i) => ({ variant_id: i.variant_id, qty: i.qty })),
      order_type: input.order_type,
      ship_to_address_id: input.ship_to_address_id,
      recipient_name: input.recipient_name,
      recipient_phone: input.recipient_phone,
      gift_note: input.gift_note,
    });
    return { ok: true, data: quote };
  } catch (err) {
    return { ok: false, code: toCode(err) };
  }
}

export async function payAction(quoteId: string): Promise<ActionResult<HubPayResult>> {
  const jwt = await jwtOrNull();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (!quoteId) return { ok: false, code: "failed" };

  try {
    const result = await hub.pay(jwt, quoteId);
    // The order exists and holds the stock; the cart has served its purpose.
    // Emptied only on success, so a failed payment leaves the basket intact.
    await writeCart([]);
    return { ok: true, data: result };
  } catch (err) {
    // A 409 here is either a quote that aged out or a piece someone else
    // bought first. The Hub distinguishes them in the body, but by this point
    // the advice is the same: go back and re-quote.
    // 409 covers both "the world moved" and "we cannot be paid for that
    // destination". They need different copy, so read the body's code.
    if (err instanceof HubError && err.status === 409) {
      return { ok: false, code: err.code === "transfer_unavailable" ? "transfer_unavailable" : "expired" };
    }
    return { ok: false, code: toCode(err) };
  }
}
