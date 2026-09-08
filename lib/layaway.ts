"use server";
import { supabaseServer } from "@/lib/supabase/server";
import type { LayawayQuote } from "@/lib/types";
import { quote as fixtureQuote } from "@/lib/fixtures";
/**
 * The ONLY entry point for layaway numbers on the website.
 * Delegates to the shared `layaway_quote` RPC (owned by Lovable) so the site and the Hub can never disagree.
 */
export async function layawayQuote(price: number, termMonths: number, currency: "JPY" | "PHP"): Promise<LayawayQuote> {
  if (process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1") return fixtureQuote(price, termMonths, currency);
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("layaway_quote", { p_price: price, p_term_months: termMonths, p_currency: currency });
  if (error) throw new Error(error.message);
  return data as LayawayQuote;
}
