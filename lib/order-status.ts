import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";
import type { CheckoutMethod, HubOrder } from "@/lib/types";

/**
 * The three states a status badge can be in, and the only place this union is
 * spelled out. It was written inline in four signatures across two modules
 * before the badge needed it as a prop, which would have made five.
 *
 * `pending` is waiting on someone, `good` is settled in the customer's favour,
 * `dead` is ended without one — cancelled, expired, refunded, forfeited.
 */
export type Tone = "pending" | "good" | "dead";

/**
 * One label for the two status columns the Hub keeps.
 *
 * `status` is the Hub's own cash_order_status, which every internal surface
 * reads; `payment_status` is the web-facing state. The customer should see one
 * plain sentence, so shipped beats paid, and a cancelled order says cancelled
 * whichever column recorded it.
 */
export function orderStatusLabel(order: HubOrder, lang: Lang, chosenMethod?: CheckoutMethod | null): { text: string; tone: Tone } {
  const { key, tone } = orderStatusKey(order, chosenMethod);
  return { text: dict.orders[key][lang], tone };
}

/**
 * The dictionary key behind orderStatusLabel. `chosenMethod` (payment
 * lifecycle S1): an order she chose to pay with Paidy or a card is waiting for
 * a PAYMENT, not a transfer, so it reads "Awaiting payment" where a transfer
 * order reads "Awaiting transfer". Cash on delivery reads "Ships soon — pay on
 * delivery" (statusPendingCod). Absent or transfer (an older Hub) reads as
 * before.
 */
export function orderStatusKey(order: HubOrder, chosenMethod?: CheckoutMethod | null): { key: keyof typeof dict.orders; tone: Tone } {
  // Cash on delivery (Hub 2026-10-10): nothing to pay before the parcel
  // arrives — the order is getting ready to ship, never "awaiting transfer".
  const awaiting = chosenMethod === "cod" ? "statusPendingCod"
    : chosenMethod === "paidy" || chosenMethod === "card" ? "statusPendingPayment" : "statusPendingTransfer";

  // EVERY ENDED STATE IS TESTED BEFORE `shipped_at`, fixed 2026-09-15 alongside
  // the closed-plan caption. `shipped_at` used to be checked first, so an order
  // cancelled or refunded AFTER dispatch would have carried a good-tone
  // "Shipped" badge directly above its own cancellation reason and refund
  // decision — the badge and the line beneath it disagreeing on one row, the
  // same defect the layaway rows had. No live order is in that state today
  // (0 rows: no order has shipped_at set together with a cancelled, expired or
  // cancelled-payment status), so this is closing the path, not repairing
  // damage. A cancelled order is cancelled whether or not it shipped first.
  if (order.status === "cancelled" || order.payment_status === "cancelled") {
    return { key: "statusCancelled", tone: "dead" };
  }
  if (order.status === "expired") return { key: "statusExpired", tone: "dead" };
  if (order.payment_status === "refunded") return { key: "statusRefunded", tone: "dead" };
  if (order.payment_status === "failed") return { key: "statusFailed", tone: "dead" };

  // RESERVE FIRST (Hub A2): held, not yet confirmed, nothing to pay yet. After
  // every ended state, because a cancelled reservation keeps payment_status
  // "awaiting_confirmation" in the Hub — the ended checks above catch it first.
  // The Hub's live-only flag is the primary signal; the raw payment_status is
  // the fallback for a row that carries no flag.
  if (order.awaiting_confirmation === true || order.payment_status === "awaiting_confirmation") {
    return { key: "statusReserved", tone: "pending" };
  }

  if (order.shipped_at) return { key: "statusShipped", tone: "good" };

  switch (order.payment_status) {
    case "paid": return { key: "statusPaid", tone: "good" };
    case "pending_transfer": return { key: awaiting, tone: "pending" };
    default:
      return order.status === "completed"
        ? { key: "statusPaid", tone: "good" }
        : { key: awaiting, tone: "pending" };
  }
}

/**
 * The Hub's refund decision on a cancelled order, as one customer-facing
 * phrase. `null` (no decision recorded, or the order is not cancelled) renders
 * nothing — never a guessed default.
 */
export function refundLabel(status: HubOrder["refund_status"], lang: Lang): string | null {
  switch (status) {
    case "refund_issued": return dict.orders.refundIssued[lang];
    case "refund_pending": return dict.orders.refundPending[lang];
    case "store_credit_issued": return dict.orders.storeCredit[lang];
    case "no_refund": return dict.orders.noRefund[lang];
    default: return null;
  }
}

/** Cancelled or expired — the states that carry a reason / refund decision. */
export const isClosedOrder = (order: HubOrder) =>
  order.status === "cancelled" || order.status === "expired" || order.payment_status === "cancelled";

/**
 * The badge's classes. There is ONE set: the body is light from Phase 4 Group
 * E, and the dark pair it used to carry (gold-pale on a gold border) was
 * 1.37:1 on chalk with nowhere left to render, so it went with the dark button
 * variants. A badge inside a `.band-dark` would need its own set again; none
 * exists today.
 *
 * `good` is gold-dark (4.59:1 on chalk), `pending` borrows the charcoal border
 * rather than a hue, and `dead` is the grey hairline with charcoal/70 text
 * (4.74:1) — the quietest of the three.
 */
export const toneClass = (tone: Tone) =>
  tone === "good" ? "border-gold-dark text-gold-dark"
  : tone === "dead" ? "border-hairline text-charcoal/70"
  : "border-charcoal/60 text-charcoal-deep";
