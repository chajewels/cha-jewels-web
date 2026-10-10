import { AGREEMENT_REQUIRED } from "@/lib/layaway-agreement";

/**
 * Maps a Hub checkout failure to a code the UI has copy for (pure; the server
 * action passes the HubError's status and code). The Hub's own error string
 * decides — not the HTTP status alone, because 409 covers "the quote aged out",
 * "someone bought it first" and "we cannot be paid for that destination", and
 * each needs different words and a different next step.
 *
 * QC P3-8 (task S5): only a genuine STOCK refusal is "sold_out". An unlisted
 * 409 (e.g. checkout_mode_not_draft) is "failed" and carries the Hub's request
 * id — telling her a piece sold out when it did not would be wrong.
 */
const EXPIRED = new Set(["quote_expired", "quote_already_used", "quote_not_found"]);
/** The Hub's stock refusals at /checkout/*: bought by someone else, or taken off sale. */
const SOLD_OUT = new Set(["out_of_stock", "variant_missing", "product_unavailable"]);
// Cash on delivery (Hub 2026-10-10): over_cod_limit / cod_nothing_to_collect are the
// Hub re-judging COD with the figures it now holds — she picks again.
const METHOD_REFUSED = new Set(["bad_method", "method_unavailable", "method_full_payment_only", "method_requires_yen", "over_cod_limit", "cod_nothing_to_collect"]);
const POINTS_REFUSED = new Set(["bad_points", "points_unavailable", "points_not_enrolled", "points_insufficient", "points_exceed_subtotal", "points_exceed_deposit", "points_exceed_max"]);

export function checkoutErrorCode(err: { status?: number | null; code?: string | null } | null | undefined): string {
  if (!err) return "failed";
  const code = err.code ?? null;
  if (code && EXPIRED.has(code)) return "expired";
  if (code && SOLD_OUT.has(code)) return "sold_out";
  if (code === "transfer_unavailable") return "transfer_unavailable";
  // Layaway refusals. below_plan_minimum covers both "no term is sellable at
  // this amount" and "the term chosen is out of reach" — the customer picks
  // again from the terms the Hub sent, so one message serves both.
  if (code === "below_plan_minimum") return "below_plan_minimum";
  // Retired by the Hub on 2026-09-25 (pesos are offered for a full payment
  // too); kept so a Hub rollback shows a neutral message, not "failed".
  if (code === "currency_not_supported_for_full") return "currency_unsupported";
  // No peso figure without a rate: fx_unavailable is the quote's refusal,
  // fx_rate_missing the order writer's. Both are "try again or choose yen".
  if (code === "fx_unavailable" || code === "fx_rate_missing") return "rate_unavailable";
  // Website orders (Hub PR 6). A quote taken before the destination needed a
  // manual shipping quote, or a draft writer that saw the agreement missing.
  if (code === "shipping_quote_required") return "manual_quote";
  if (code === "agreement_missing") return AGREEMENT_REQUIRED;
  // Payment choice + points (Hub 2026-10-05). The Hub re-checks what the
  // review screen offered: a method no longer offered, or points she can no
  // longer use (spent elsewhere, more than the order takes).
  if (code && METHOD_REFUSED.has(code)) return "method_unavailable";
  if (code && POINTS_REFUSED.has(code)) return "points_unavailable";
  if (err.status === 401 || err.status === 403) return "signed_out";
  return "failed";
}
