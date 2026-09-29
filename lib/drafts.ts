import type { HubDraft, HubDraftPayResult } from "@/lib/types";

/**
 * WEBSITE ORDERS (Hub PR 6 / storefront PR 7) — the storefront's rules for a
 * DRAFT: a checkout the Hub holds for staff to confirm before any payment.
 * Pure functions, unit-tested (tests/drafts.test.mjs).
 */

/** /checkout/pay answered with a draft (Hub web_checkout_mode = 'draft'). */
export const isDraftPayResult = (r: unknown): r is HubDraftPayResult =>
  !!r && typeof (r as { draft_id?: unknown }).draft_id === "string";

/** Where the customer lands after paying with a draft result. */
export const draftCompletePath = (draftId: string) => `/checkout/complete/d/${encodeURIComponent(draftId)}`;

/**
 * Once staff confirm, the draft points at the real order or plan and every old
 * link (reserved email, bookmark) goes there instead (W2-9). null = stay on
 * the draft page.
 */
export function confirmedDestination(d: Pick<HubDraft, "order_id" | "account_id">): string | null {
  if (d.account_id) return `/account/layaway/${encodeURIComponent(d.account_id)}`;
  if (d.order_id) return `/account/orders/${encodeURIComponent(d.order_id)}`;
  return null;
}

/**
 * Drafts the account lists show: waiting ones, and ones that ended without an
 * order (declined / expired) so the customer can see what happened. A
 * confirmed draft is not listed — its order or plan is.
 */
export const listableDraft = (d: Pick<HubDraft, "status">) => d.status !== "confirmed";
