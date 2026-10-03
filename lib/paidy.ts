import type { HubLayawaySubmission, HubOrderDetail, HubOrderPaidy } from "@/lib/types";

/**
 * Paidy ato-barai on a confirmed order (2026-10-03): which Hub answers the
 * page acts on. The Hub decides whether Paidy is offered; this file only
 * refuses to render an answer that is not whole — a button without a public
 * key or a payload would open a window that cannot work. It never computes
 * or adjusts a figure.
 */

/** The Paidy block the page renders, or null when there is nothing whole to render. */
export function paidyOffer(detail: Pick<HubOrderDetail, "paidy" | "order">): HubOrderPaidy | null {
  const p = detail.paidy;
  if (!p || p.offered !== true) return null;
  if (typeof p.public_key !== "string" || !/^pk_(test|live)_/.test(p.public_key)) return null;
  const c = p.checkout;
  if (!c || c.currency !== "JPY" || !(Number(c.amount) > 0)) return null;
  if (detail.order.currency !== "JPY") return null;
  if (!c.shipping_address?.zip || !c.buyer?.name1) return null;
  return p;
}

/** Submissions a reviewer has not decided yet — the only ones that mean "being checked". */
export function pendingSubmissions(detail: Pick<HubOrderDetail, "pending_submissions">): HubLayawaySubmission[] {
  return (detail.pending_submissions ?? []).filter((s) => s.status === "submitted" || s.status === "under_review");
}

/**
 * Paidy Checkout's closed-callback status, compared case-insensitively. The
 * reference documents AUTHORIZED | REJECTED | CLOSED; the live Checkout sent
 * "authorized" in lower case (test run 2026-10-03, pay_asDHekoAAEkAmsmA) and an
 * exact compare dropped a real authorisation as "window closed". Anything that
 * is not AUTHORIZED / REJECTED is CLOSED (the customer left).
 */
export function paidyStatus(raw: unknown): "AUTHORIZED" | "REJECTED" | "CLOSED" {
  const s = String(raw ?? "").trim().toUpperCase();
  return s === "AUTHORIZED" || s === "REJECTED" ? s : "CLOSED";
}
