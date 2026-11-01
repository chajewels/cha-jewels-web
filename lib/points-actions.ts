"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { pointsLineFrom, type PointsLine } from "@/lib/points-line";
import { PREVIEW_FIXTURES } from "@/lib/fixtures-mode";

/**
 * The product page's loyalty-points line (lib/points-line.ts). The page itself
 * is cached for everyone (ISR), so this per-customer figure is fetched after it
 * loads, with the visitor's own session: the JWT stays on the server, paired
 * with HUB_API_KEY, like every other Hub call.
 *
 * It never throws: signed out, or any Hub error (including a Hub that does not
 * have the route yet) → null, and the page shows no line.
 */
export async function pointsLineAction(variantId: string): Promise<PointsLine> {
  try {
    if (typeof variantId !== "string" || !/^[\w-]{1,64}$/.test(variantId)) return null;
    // Preview stand-in (lib/fixtures.ts): no Hub and no real session there.
    // Never on production (W-04, lib/fixtures-mode.ts).
    if (PREVIEW_FIXTURES) {
      return pointsLineFrom(await hub.pointsPreview("", [variantId]), variantId);
    }
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getSession();
    const jwt = data.session?.access_token;
    if (!jwt) return null;
    return pointsLineFrom(await hub.pointsPreview(jwt, [variantId]), variantId);
  } catch {
    return null;
  }
}
