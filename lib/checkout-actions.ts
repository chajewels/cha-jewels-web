"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { hub, HubError } from "@/lib/hub-api";
import { TERM_NOT_LAUNCHED, termLaunched, LAYAWAY_UNAVAILABLE } from "@/lib/layaway-availability";
import { layawayOfferedNow } from "@/lib/layaway-availability-server";
import { AGREEMENT_REQUIRED, AGREEMENT_UNVERIFIED } from "@/lib/layaway-agreement";
import { agreementStatus, type AgreementStatus } from "@/lib/agreement-lookup";
import { readCart, hydrateCart } from "@/lib/cart";
import { writeCart } from "@/lib/cart";
import type { CheckoutMode, HubAddress, HubQuote, HubLayawayPayResult, HubPayResult, OrderType, SettlementCurrency } from "@/lib/types";

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
export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string; requestId?: string | null };

async function jwtOrNull(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Maps a Hub failure to a code the UI has copy for. The Hub's own error string
 * decides — not the HTTP status alone, because 409 covers "the quote aged out",
 * "someone bought it first" and "we cannot be paid for that destination", and
 * each needs different words and a different next step. Anything unknown is
 * "failed", and carries the Hub's request id so the screen can show it.
 */
const EXPIRED = new Set(["quote_expired", "quote_already_used", "quote_not_found"]);
const SOLD_OUT = new Set(["out_of_stock", "variant_missing"]);

function toCode(err: unknown): string {
  if (err instanceof HubError) {
    if (err.code && EXPIRED.has(err.code)) return "expired";
    if (err.code && SOLD_OUT.has(err.code)) return "sold_out";
    if (err.code === "transfer_unavailable") return "transfer_unavailable";
    // Layaway refusals. below_plan_minimum covers both "no term is sellable at
    // this amount" and "the term chosen is out of reach" — the customer picks
    // again from the terms the Hub sent, so one message serves both.
    if (err.code === "below_plan_minimum") return "below_plan_minimum";
    // Retired by the Hub on 2026-09-25 (pesos are offered for a full payment
    // too); kept so a Hub rollback shows a neutral message, not "failed".
    if (err.code === "currency_not_supported_for_full") return "currency_unsupported";
    // No peso figure without a rate: fx_unavailable is the quote's refusal,
    // fx_rate_missing the order writer's. Both are "try again or choose yen".
    if (err.code === "fx_unavailable" || err.code === "fx_rate_missing") return "rate_unavailable";
    if (err.status === 409) return "sold_out";
    if (err.status === 401 || err.status === 403) return "signed_out";
  }
  return "failed";
}

function fail<T>(err: unknown): ActionResult<T> {
  return { ok: false, code: toCode(err), requestId: err instanceof HubError ? err.requestId : null };
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
    return fail(err);
  }
}

export async function quoteAction(input: {
  ship_to_address_id: string;
  order_type: OrderType;
  recipient_name?: string;
  recipient_phone?: string;
  gift_note?: string;
  /** Absent means full payment, the behaviour before step 4. */
  mode?: CheckoutMode;
  term_months?: number;
  settlement_currency?: SettlementCurrency;
}): Promise<ActionResult<HubQuote>> {
  const jwt = await jwtOrNull();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (!input.ship_to_address_id) return { ok: false, code: "address_required" };

  // LAYAWAY IS ENGLISH-ONLY (owner decision 2026-09-15). Hiding the toggle is
  // not enough: `mode` is client state that survives a language switch, and
  // this action is reachable directly. Refused here rather than sent to the
  // Hub, so a Japanese session cannot hold a piece on a plan whose agreement
  // exists only in English and Tagalog. One rule — lib/layaway-availability.
  if (input.mode === "layaway" && !(await layawayOfferedNow())) {
    return { ok: false, code: LAYAWAY_UNAVAILABLE };
  }

  // 10M AND 12M ARE NOT LAUNCHED (owner decision 2026-09-16). Disabling the
  // buttons is not enough for the same reason the language rule needed this:
  // `term_months` is client state and this action is reachable directly. The
  // Hub would accept the term — plan_configurations still has it active — so
  // refusing here is what keeps the storefront from booking a plan the terms of
  // service do not describe. One rule: lib/layaway-availability.
  if (input.mode === "layaway" && input.term_months !== undefined && !termLaunched(input.term_months)) {
    return { ok: false, code: TERM_NOT_LAUNCHED };
  }

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
      mode: input.mode ?? "full",
      term_months: input.mode === "layaway" ? input.term_months : undefined,
      settlement_currency: input.settlement_currency,
    });
    return { ok: true, data: quote };
  } catch (err) {
    return fail(err);
  }
}

export async function payAction(quoteId: string): Promise<ActionResult<HubPayResult>> {
  const jwt = await jwtOrNull();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (!quoteId) return { ok: false, code: "failed" };

  try {
    // The language cookie decides which language the Hub writes the order
    // emails in — read server-side, never trusted from the client component.
    const result = await hub.pay(jwt, quoteId, await getLang());
    // The order exists and holds the stock; the cart has served its purpose.
    // Emptied only on success, so a failed payment leaves the basket intact.
    await writeCart([]);
    return { ok: true, data: result };
  } catch (err) {
    // expired / sold_out / transfer_unavailable / failed — decided by the
    // Hub's error code in toCode(); the request id rides along for "Ref: …".
    return fail(err);
  }
}

/**
 * Turns a layaway quote into a plan. Same endpoint as payAction, different
 * answer: the Hub reads the mode off the quote, so the two are separate actions
 * rather than one with a union return the caller has to narrow.
 *
 * No money moves here. The plan is created, the piece comes off the shelf, and
 * the customer is told where to send the deposit and by when.
 */
export async function payLayawayAction(quoteId: string): Promise<ActionResult<HubLayawayPayResult>> {
  const jwt = await jwtOrNull();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (!quoteId) return { ok: false, code: "failed" };

  // The backstop for a language switch between taking the quote and paying.
  // Nothing has moved yet — no money, no stock — so refusing here is clean:
  // the cart is untouched and the shopper can pay in full or switch back.
  if (!(await layawayOfferedNow())) return { ok: false, code: LAYAWAY_UNAVAILABLE };

  // NO UNSIGNED PLAN MAY EVER EXIST (owner decision). The refusal lives HERE,
  // not only in the checkout step machine, for the same reason the two above
  // do: this action is reachable directly, and a future claim-driven checkout
  // (POST /claims/:code/checkout, 501 today) would never touch
  // checkout-flow.tsx at all. A gate that only a React component enforces is
  // invisible to the next caller.
  //
  // Checked again here even though the step machine already checked it — the
  // client's "I have signed" is a claim, and this is the last point before the
  // piece leaves the shelf.
  const agreement = await agreementStatus(quoteId);
  if (!agreement.ok) {
    // WE DO NOT KNOW. Fail CLOSED, and say so with its own code: a Sheets
    // outage is not the customer failing to sign, and the two need different
    // words on screen. The reason is logged, never shown.
    console.error("[payLayawayAction] agreement lookup failed:", agreement.reason);
    return { ok: false, code: AGREEMENT_UNVERIFIED };
  }
  if (!agreement.signed) return { ok: false, code: AGREEMENT_REQUIRED };

  try {
    const result = await hub.payLayaway(jwt, quoteId, await getLang(), {
      version: agreement.version,
      signed_at: agreement.signedAt,
    });
    // The plan holds the stock now, so the basket has served its purpose.
    // Cleared only on success — a refused plan leaves the cart intact.
    await writeCart([]);
    return { ok: true, data: result };
  } catch (err) {
    return fail(err);
  }
}

/**
 * Has this customer signed the agreement for this quote?
 *
 * The checkout step machine calls this to decide whether to show the signing
 * step or the Review step, and again when the customer comes back and says
 * they have signed. It is a SERVER action: the Apps Script URL and its token
 * live in server-only env vars read inside lib/agreement-lookup.ts, and
 * neither value is in this return.
 *
 * WHAT THIS IS NOT. It is not the gate. payLayawayAction re-checks before the
 * plan is created, because anything a client component knows is a claim. This
 * exists so the customer is shown the right screen, not so the plan is safe.
 *
 * Ownership is not verified against the Hub, deliberately. The storefront may
 * not read `checkout_quotes` (CLAUDE.md: the Website API is the only door), and
 * the alternative — a Hub round trip — would double the latency of a gate that
 * already sits on the critical path. What a caller could learn by presenting
 * someone else's quote id is one boolean about an unguessable v4 uuid, while a
 * signed-in session is still required; and nothing can be CREATED that way,
 * because create_web_layaway_atomic answers quote_not_found when the quote
 * belongs to another customer.
 */
export async function agreementStatusAction(
  quoteId: string,
): Promise<ActionResult<{ signed: boolean; version: string | null; signed_at: string | null }>> {
  const jwt = await jwtOrNull();
  if (!jwt) return { ok: false, code: "signed_out" };
  if (!quoteId) return { ok: false, code: "failed" };

  const status: AgreementStatus = await agreementStatus(quoteId);
  if (!status.ok) {
    console.error("[agreementStatusAction] agreement lookup failed:", status.reason);
    return { ok: false, code: AGREEMENT_UNVERIFIED };
  }
  return status.signed
    ? { ok: true, data: { signed: true, version: status.version, signed_at: status.signedAt } }
    : { ok: true, data: { signed: false, version: null, signed_at: null } };
}
