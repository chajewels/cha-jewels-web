"use server";
import { hub } from "@/lib/hub-api";
import { layawayOfferedNow } from "@/lib/layaway-availability-server";

/**
 * The ONLY entry point for layaway numbers on the website. Delegates to the
 * Hub's layaway_quote, which is also what writes the real schedule at checkout
 * — so the figures a shopper sees here and the plan they end up with come from
 * one expression, not two that have to be kept in step.
 */
export async function layawayQuote(price: number, termMonths: number) {
  // Defence in depth. The calculator does not render in Japanese, so this
  // should be unreachable there — but it is an exported server action, and an
  // unreachable path that still answers is one that quietly becomes reachable
  // the next time a component moves. Returning null rather than throwing keeps
  // the calculator's existing "could not get a quote" path.
  if (!(await layawayOfferedNow())) return null;
  return hub.layawayQuote(price, termMonths);
}
