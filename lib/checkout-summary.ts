import type { HubQuote, SettlementCurrency } from "@/lib/types";

/**
 * The Hub's peso figures for this basket BEFORE a checkout quote exists
 * (pesoEstimateAction). Every number is the Hub's: `total` is its own
 * conversion of the yen subtotal at the day's rate, and `deposit` / `monthly`
 * its peso layaway schedule for that amount. Nothing here is converted.
 */
export type PesoEstimate = { total: number; deposit: number | null; monthly: number | null };

/** Where the peso estimate stands: asked, answered, or refused (no rate, or any failure). */
export type PesoEstimateState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; estimate: PesoEstimate }
  | { status: "unavailable" };

export type CheckoutSummary = {
  /** The currency `subtotal` / `shipping` / `total` are in. */
  currency: SettlementCurrency;
  subtotal: number | null;
  shipping: number | null;
  total: number | null;
  /** True when the peso figures are the pre-quote estimate: shown as "≈ ₱…" with the "converted once" note. */
  estimate: boolean;
  /** The yen total shown beside a peso total, so the customer sees both. Null in yen. */
  yenTotal: number | null;
  /** Peso layaway figures from the estimate (pre-quote, layaway only). */
  deposit: number | null;
  monthly: number | null;
  /** Pesos chosen but no figure could be had: yen is shown, with "the peso amount is shown at the next step". */
  pesoPending: boolean;
};

/**
 * THE ORDER SUMMARY'S FIGURES, and the currency they are genuinely in.
 *
 * Pure (imports only types) so the unit test loads it directly.
 *
 * EVERY MONEY FIGURE A CUSTOMER SEES COMES FROM THE HUB (owner rule
 * 2026-09-25): nothing is converted or multiplied here, only chosen.
 *
 * - A quote in the chosen currency: its figures, exactly (in pesos, with its
 *   own yen total beside them).
 * - Yen, no quote yet: the cart's yen figures.
 * - Pesos, no quote yet (Step 1, or the toggle moved since the quote): the
 *   Hub's peso estimate, marked as an estimate, with the yen beside it. While
 *   it loads, and if it cannot be had, the yen figures stand — never a bare
 *   dash for the total — and on failure the "shown at the next step" note.
 */
export function checkoutSummary({ quote, intended, subtotal, mode, peso }: {
  quote: HubQuote | null;
  intended: SettlementCurrency;
  /** The cart's yen subtotal (re-read from the Hub on this render). */
  subtotal: number;
  mode: "full" | "layaway";
  peso: PesoEstimateState;
}): CheckoutSummary {
  const none = { estimate: false, yenTotal: null, deposit: null, monthly: null, pesoPending: false };
  const quoteCurrency: SettlementCurrency | null = quote === null ? null : quote.settlement_currency ?? "JPY";

  if (quote !== null && quoteCurrency === intended) {
    return {
      ...none,
      currency: intended,
      subtotal: quote.subtotal_settlement ?? quote.subtotal_jpy,
      shipping: quote.shipping_settlement ?? quote.shipping_jpy,
      total: quote.total_settlement ?? quote.total_jpy,
      yenTotal: intended === "PHP" ? quote.total_jpy : null,
    };
  }

  // Yen is the cart's own currency, so the cart's own figures already stand.
  if (intended === "JPY") return { ...none, currency: "JPY", subtotal, shipping: null, total: subtotal };

  if (peso.status === "ok") {
    const layaway = mode === "layaway";
    return {
      ...none,
      currency: "PHP",
      subtotal: peso.estimate.total,
      shipping: null,
      total: peso.estimate.total,
      estimate: true,
      yenTotal: subtotal,
      deposit: layaway ? peso.estimate.deposit : null,
      monthly: layaway ? peso.estimate.monthly : null,
    };
  }

  // Loading or refused: the yen figures, never a dash for the total.
  return { ...none, currency: "JPY", subtotal, shipping: null, total: subtotal, pesoPending: peso.status === "unavailable" };
}

/**
 * WHAT THE CUSTOMER PAYS once checkout points are chosen (owner live check
 * 2026-10-05, F1). On a full payment the headline figure — the summary's big
 * total, the phone's top bar and sticky bar — is the Hub's
 * `totals.total_after_points`, labelled "Amount to pay"; the order total stays
 * as an ordinary row above it, like the emails. Null = no points in play (or a
 * layaway, whose headline stays the plan total: points pay the deposit, shown
 * as its own row). Nothing is computed here, only chosen.
 */
export function amountToPayAfterPoints({ mode, quoteShown, pointsChosen, totalAfterPoints }: {
  mode: "full" | "layaway";
  /** The quote on screen is in the summary's currency. */
  quoteShown: boolean;
  pointsChosen: number;
  /** The Hub's `totals.total_after_points`, or null when the Hub sent no choice block. */
  totalAfterPoints: number | null;
}): number | null {
  if (mode !== "full" || !quoteShown || !(pointsChosen > 0)) return null;
  if (typeof totalAfterPoints !== "number" || !Number.isFinite(totalAfterPoints)) return null;
  return totalAfterPoints;
}
