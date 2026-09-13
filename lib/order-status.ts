import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";
import type { HubOrder } from "@/lib/types";

/**
 * One label for the two status columns the Hub keeps.
 *
 * `status` is the Hub's own cash_order_status, which every internal surface
 * reads; `payment_status` is the web-facing state. The customer should see one
 * plain sentence, so shipped beats paid, and a cancelled order says cancelled
 * whichever column recorded it.
 */
export function orderStatusLabel(order: HubOrder, lang: Lang): { text: string; tone: "pending" | "good" | "dead" } {
  const k = (key: keyof typeof dict.orders) => dict.orders[key][lang];
  if (order.shipped_at) return { text: k("statusShipped"), tone: "good" };
  if (order.status === "cancelled") return { text: k("statusCancelled"), tone: "dead" };
  if (order.status === "expired") return { text: k("statusExpired"), tone: "dead" };
  switch (order.payment_status) {
    case "paid": return { text: k("statusPaid"), tone: "good" };
    case "refunded": return { text: k("statusRefunded"), tone: "dead" };
    case "failed": return { text: k("statusFailed"), tone: "dead" };
    case "cancelled": return { text: k("statusCancelled"), tone: "dead" };
    case "pending_transfer": return { text: k("statusPendingTransfer"), tone: "pending" };
    default:
      return order.status === "completed"
        ? { text: k("statusPaid"), tone: "good" }
        : { text: k("statusPendingTransfer"), tone: "pending" };
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
    case "no_refund": return dict.orders.noRefund[lang];
    default: return null;
  }
}

/** Cancelled or expired — the states that carry a reason / refund decision. */
export const isClosedOrder = (order: HubOrder) =>
  order.status === "cancelled" || order.status === "expired" || order.payment_status === "cancelled";

export const toneClass = (tone: "pending" | "good" | "dead") =>
  tone === "good" ? "border-gold text-gold-pale"
  : tone === "dead" ? "border-rule text-champagne/45"
  : "border-gold/60 text-champagne/80";
