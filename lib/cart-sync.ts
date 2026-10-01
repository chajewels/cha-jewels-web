import "server-only";
import { after } from "next/server";
import { hub } from "@/lib/hub-api";
import { readCart, type CartLine } from "@/lib/cart";
import { mergeCartLines, sameLines, toHubLines } from "@/lib/cart-merge";
import { getLang } from "@/lib/i18n-server";
import { readSession } from "@/lib/session";

/**
 * The saved cart (cart reminders; the Hub's docs/CART-REMINDERS.md).
 *
 * THE COOKIE STAYS THE CART. These two helpers only keep the Hub's copy in
 * step, and they never make the shopper wait for the Hub:
 *
 *   saveCartLater   — called at the END of every cart mutation (and of the
 *                     two checkout clears). The lines, language and session
 *                     are read NOW, inside the action; the PUT runs in Next's
 *                     after(), once the response is on its way. A Hub outage
 *                     costs nothing here: the cookie was already written.
 *   mergeSavedCart  — at sign-in and on /cart/restore: cookie ∪ saved, the
 *                     larger quantity wins, 20 lines (lib/cart-merge.ts). The
 *                     caller writes the result to the cookie; the PUT back is
 *                     deferred the same way.
 *
 * Signed-out shoppers never reach the Hub: no session, no call. An expired
 * access token is treated the same way — the Hub would answer 401, and the
 * next gated page refreshes the session anyway.
 *
 * What is sent is exactly what the cookie holds — variant, slug, quantity.
 * No price, no stock: the Hub re-reads those itself when it builds a reminder.
 */

/** The JWT to sync with, or null when there is nothing to do. */
async function syncJwt(): Promise<string | null> {
  const session = await readSession();
  return session && !session.expired ? session.jwt : null;
}

export async function saveCartLater(): Promise<void> {
  let jwt: string | null = null;
  let lines: CartLine[] = [];
  let lang = "ja";
  try {
    jwt = await syncJwt();
    if (!jwt) return;
    [lines, lang] = await Promise.all([readCart(), getLang()]);
  } catch {
    return;
  }
  const body = { lines: toHubLines(lines), lang, as_of: new Date().toISOString() };
  const token = jwt;
  after(async () => {
    try { await hub.putCart(token, body); } catch (e) {
      console.warn("[cart-sync] save failed (non-blocking):", (e as Error)?.message ?? e);
    }
  });
}

/**
 * cookie ∪ saved for this JWT. Returns the merged lines, or null when the Hub
 * could not be read (the cookie is left exactly as it was). When the merge
 * changed nothing the caller still gets the lines, so it can decide whether
 * to rewrite the cookie (sameLines).
 */
export async function mergeSavedCart(jwt: string, cookie: CartLine[], lang: string): Promise<CartLine[] | null> {
  let saved;
  try {
    saved = (await hub.getCart(jwt)).lines;
  } catch (e) {
    console.warn("[cart-sync] read failed (non-blocking):", (e as Error)?.message ?? e);
    return null;
  }
  const merged = mergeCartLines(cookie, saved);
  // Push the union back so both sides agree; deferred, never awaited by the
  // sign-in. Skipped when nothing changed on either side — a no-op write would
  // still be a no-op in the Hub (updated_at moves only when the lines change),
  // but there is no reason to make the call.
  const savedAsCookie = mergeCartLines([], saved);
  if (!sameLines(merged, savedAsCookie)) {
    const body = { lines: toHubLines(merged), lang, as_of: new Date().toISOString() };
    after(async () => {
      try { await hub.putCart(jwt, body); } catch (e) {
        console.warn("[cart-sync] merge save failed (non-blocking):", (e as Error)?.message ?? e);
      }
    });
  }
  return merged;
}
