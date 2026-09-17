"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { hub, loyaltyEnrol, type EnrolSource } from "@/lib/hub-api";

/**
 * Enrolment from the storefront — at checkout, and on the /loyalty/join page.
 *
 * Both entry points call the SAME Hub function (join-loyalty-program) and differ
 * only in the `source` they declare, so what the Hub records is where the
 * customer actually joined from rather than a guess made later.
 *
 * WHEN THE CHECKOUT ONE RUNS: after the order or plan has been created, never before. The
 * money and the stock are already committed by the time this is called, which is
 * what makes the "enrolment must never fail the order" rule easy to keep rather
 * than delicate — there is no path from here back to the order.
 *
 * WHAT IT ENROLS: the customer who is already signed in. There is no guest
 * checkout on this site — /checkout redirects to /login, and the checkout page
 * calls POST /auth/customer before it renders — so by the time anyone can tick
 * the box, a `customers` row exists, carries their verified email, and is linked
 * to their auth user. Enrolment attaches to THAT row. It never creates a second
 * one, and it cannot split anyone's history.
 *
 * IT NEVER THROWS. Every failure is a recorded outcome. A caller that ignores
 * the return value still leaves the order intact.
 */
export type EnrolOutcome =
  | { state: "enrolled" }
  | { state: "already" }
  | { state: "recorded" }
  | { state: "lost" };

const REGIONS = new Set(["JP", "PH"]);

async function enrol(source: EnrolSource, countryCode?: string): Promise<EnrolOutcome> {
  try {
    const supabase = await supabaseServer();
    const { data: sessionData } = await supabase.auth.getSession();
    const jwt = sessionData.session?.access_token;
    // Signed out between placing the order and this call. Nothing to enrol
    // against, and nothing to record either — we do not know who they are.
    if (!jwt) return { state: "lost" };

    const result = await loyaltyEnrol(jwt, source);
    if (result.ok) return result.already ? { state: "already" } : { state: "enrolled" };

    // FAILURE PATH. The customer ticked the box, the order went through, and the
    // membership did not. Losing that silently is the one outcome worth work:
    // they asked to join and would have no way to know it did not happen.
    //
    // WHAT THIS RECORDS. `loyalty_signups` is a real table with staff-only RLS
    // and a `converted_customer_id` column, so the row is durable. Since
    // 2026-09-17 the Hub also raises staff bell `loyalty_join_failed` off this
    // same call, so a failed enrolment now REACHES staff rather than merely
    // being findable by someone who thinks to look.
    const { data: userData } = await supabase.auth.getUser();
    const email = (userData?.user?.email ?? "").trim();
    if (!email) return { state: "lost" };
    const meta = (userData?.user?.user_metadata ?? {}) as Record<string, unknown>;
    const metaName = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
    const name = metaName || email.split("@")[0];
    const cc = (countryCode ?? "").trim().toUpperCase();
    const region = REGIONS.has(cc) ? cc : "OTHER";

    try {
      await hub.loyaltyJoin({ name, contact: email, region, lang: await getLang() });
      return { state: "recorded" };
    } catch {
      // Both paths to the Hub are down. The order still stands; that is the
      // whole point of doing this after payment rather than before it.
      return { state: "lost" };
    }
  } catch {
    return { state: "lost" };
  }
}

/** Checkout: the customer ticked the box while placing an order. */
export async function enrolInLoyaltyAction(countryCode?: string): Promise<EnrolOutcome> {
  return enrol("storefront_checkout", countryCode);
}

/** /loyalty/join: the customer came to the page and asked to join. */
export async function joinLoyaltyAction(): Promise<EnrolOutcome> {
  return enrol("storefront_join");
}
