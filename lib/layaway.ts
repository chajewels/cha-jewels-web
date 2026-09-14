"use server";
import { hub } from "@/lib/hub-api";

/**
 * The ONLY entry point for layaway numbers on the website. Delegates to the
 * Hub's layaway_quote, which is also what writes the real schedule at checkout
 * — so the figures a shopper sees here and the plan they end up with come from
 * one expression, not two that have to be kept in step.
 */
export async function layawayQuote(price: number, termMonths: number) {
  return hub.layawayQuote(price, termMonths);
}
