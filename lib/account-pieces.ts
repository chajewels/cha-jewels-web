import "server-only";
import { hub } from "@/lib/hub-api";
import { orderLineTitle } from "@/lib/catalog-i18n";
import type { Lang } from "@/lib/i18n";
import type { PieceImage } from "@/lib/product-media";
import type { HubDraft, HubOrder } from "@/lib/types";

/**
 * WHAT PIECE AN ORDER IS FOR, for the account lists (build step 4; comp
 * page-comps/account-signin "Orders" and "Account home"): the first line's
 * exact Hub name and photo, and how many more lines there are.
 *
 * `GET /orders` and `GET /drafts` carry no lines, so this reads each one's
 * detail — the same reads the detail pages make — for the newest `cap` rows
 * only, in parallel. A read that fails, a row past the cap, and an order
 * arranged with us directly (its pieces are on the invoice, no lines) all
 * come back without an entry, and the row shows its reference alone. The
 * lasting fix is the first line on the list responses (Lovable API item).
 */
export type PieceSummary = { name: string; image: PieceImage | null; more: number };

/** The newest rows the lists look up. */
export const PIECE_LOOKUPS = 12;

const picture = (url: string | null, alt: string): PieceImage | null =>
  url ? { kind: "whole", src: url, original: url, alt } : null;

function summary(items: { title: string; title_ja?: string | null; image_url: string | null }[], lang: Lang): PieceSummary | null {
  const first = items[0];
  if (!first) return null;
  const name = orderLineTitle(first, lang);
  return { name, image: picture(first.image_url, name), more: items.length - 1 };
}

export async function orderPieces(jwt: string, orders: HubOrder[], lang: Lang, cap = PIECE_LOOKUPS): Promise<Map<string, PieceSummary>> {
  const out = new Map<string, PieceSummary>();
  await Promise.all(orders.slice(0, cap).map(async (o) => {
    const d = await hub.order(jwt, o.id).catch(() => null);
    const s = d ? summary(d.items, lang) : null;
    if (s) out.set(o.id, s);
  }));
  return out;
}

export async function draftPieces(jwt: string, drafts: HubDraft[], lang: Lang, cap = PIECE_LOOKUPS): Promise<Map<string, PieceSummary>> {
  const out = new Map<string, PieceSummary>();
  await Promise.all(drafts.slice(0, cap).map(async (dr) => {
    const d = await hub.draft(jwt, dr.id).catch(() => null);
    const s = d ? summary(d.items, lang) : null;
    if (s) out.set(dr.id, s);
  }));
  return out;
}
