import type { ReservationFlags } from "@/lib/types";

/**
 * RESERVE FIRST, PAY AFTER STAFF CONFIRM (Hub A2, 2026-09-24; the only path
 * since Hub website orders PR 10, 2026-10-01).
 *
 * Every checkout is a draft: the piece is held, staff confirm they can supply
 * it, and only then does the customer get the bank details and a deadline. The
 * Hub's reserve-first switch is retired, so the checkout no longer reads a
 * mode off the quote. The per-order flags below still come from the Hub's
 * response for the thing being rendered — the order, the plan — so an order
 * keeps the state it was written in.
 *
 * Owner rule: no bank details anywhere before staff confirm.
 */

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
