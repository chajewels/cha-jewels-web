"use server";
import { hub } from "@/lib/hub-api";
/** The ONLY entry point for layaway numbers on the website. Delegates to the Hub's /layaway/quote. */
export async function layawayQuote(price: number, termMonths: number) {
  return hub.layawayQuote(price, termMonths);
}
