import type { HubQuote, ReservationFlags } from "@/lib/types";

/**
 * RESERVE FIRST, PAY AFTER STAFF CONFIRM (Hub A2, 2026-09-24).
 *
 * With the Hub's `system_settings.web_reservation_mode` on, checkout creates a
 * reservation: the piece is held, staff confirm they can supply it, and only
 * then does the customer get the bank details and a deadline. With it off,
 * nothing here changes a thing — every helper below answers exactly as the
 * page did before.
 *
 * THE SWITCH IS NEVER READ ON THIS SIDE. Each answer comes from the Hub's
 * response for the thing being rendered — the quote, the order, the plan — so
 * the storefront flips at the same moment the Hub does, and an order placed
 * before the switch keeps the state it was written in.
 *
 * Owner rule: no bank details anywhere before staff confirm.
 */

/** The quote was taken in reservation mode: no bank details, no deadline yet. */
export const quoteIsReservation = (quote: HubQuote | null | undefined) =>
  quote?.reservation_mode === true;

/** A live, unconfirmed reservation. The Hub's flag, already live-only. */
export const isAwaitingConfirmation = (row: ReservationFlags) =>
  row.awaiting_confirmation === true;

/**
 * Whether the Hub says this can be paid now.
 *
 * `!== false`, not `=== true`: a Hub deploy older than A2 sends no flag, and
 * that means today's rules decide, not a refusal. The page's own checks
 * (pending_transfer, a live plan, a web plan) still apply on top of this one.
 */
export const isReadyForPayment = (row: ReservationFlags) =>
  row.ready_for_payment !== false && !isAwaitingConfirmation(row);

/** The Hub's refusal on every payment path before staff confirm. */
export const NOT_READY_FOR_PAYMENT = "not_ready_for_payment";
