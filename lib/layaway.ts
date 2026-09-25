"use server";
import { hub, HubError } from "@/lib/hub-api";
import { layawayOfferedNow } from "@/lib/layaway-availability-server";
import type { LayawayQuote } from "@/lib/types";

/**
 * What the calculator gets back. A refusal is returned, never thrown: Next
 * redacts a server action's thrown error in production, so a thrown
 * fx_unavailable would arrive as an anonymous failure and the customer would
 * read "could not get a quote" where the truth is "no rate today".
 */
export type LayawayQuoteResult =
  | { ok: true; quote: LayawayQuote }
  | { ok: false; code: "rate_unavailable" | "failed" };

/**
 * The ONLY entry point for layaway numbers on the website. Delegates to the
 * Hub's layaway_quote, which is also what writes the real schedule at checkout
 * — so the figures a shopper sees here and the plan they end up with come from
 * one expression, not two that have to be kept in step.
 *
 * `priceJpy` is the yen price whatever `currency` is. A peso quote is the
 * Hub's conversion and the Hub's peso schedule; nothing is converted here.
 */
export async function layawayQuote(priceJpy: number, termMonths: number, currency: "JPY" | "PHP"): Promise<LayawayQuoteResult> {
  // Defence in depth. The calculator does not render in Japanese, so this
  // should be unreachable there — but it is an exported server action, and an
  // unreachable path that still answers is one that quietly becomes reachable
  // the next time a component moves. Refusing rather than throwing keeps the
  // calculator's existing "could not get a quote" path.
  if (!(await layawayOfferedNow())) return { ok: false, code: "failed" };
  try {
    return { ok: true, quote: await hub.layawayQuote(priceJpy, termMonths, currency) };
  } catch (err) {
    // No usable rate: the Hub never guesses a peso figure, and neither do we.
    if (err instanceof HubError && err.code === "fx_unavailable") return { ok: false, code: "rate_unavailable" };
    return { ok: false, code: "failed" };
  }
}
