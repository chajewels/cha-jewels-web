import "server-only";
import { hub } from "@/lib/hub-api";
import { orderLineTitle } from "@/lib/catalog-i18n";
import type { Lang } from "@/lib/i18n";
import type { PieceImage } from "@/lib/product-media";
import type { HubDraft, HubListItem, HubOrder } from "@/lib/types";

/**
 * WHAT PIECE AN ORDER IS FOR, for the account lists (build step 4; comp
 * page-comps/account-signin "Orders" and "Account home"): the first line's
 * exact Hub name and photo, and how many more lines there are.
 *
 * Since Hub commit 1f26c20 the list rows carry `first_item` and
 * `item_count`, photo and Japanese title already resolved by the Hub, so this
 * is a read of the row. Only a row WITHOUT the field (an older Hub) falls back
 * to reading that one order's detail, for the newest `cap` such rows. An order
 * with no lines (arranged with us directly) comes back without an entry, and
 * the row shows its reference alone.
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

function fromRow(first: HubListItem | null | undefined, count: number | undefined, lang: Lang): PieceSummary | null {
  if (!first || !first.title) return null;
  const s = summary([{ title: first.title, title_ja: first.title_ja ?? null, image_url: first.image_url }], lang);
  return s && { ...s, more: Math.max(0, (count ?? 1) - 1) };
}

export async function orderPieces(jwt: string, orders: HubOrder[], lang: Lang, cap = PIECE_LOOKUPS): Promise<Map<string, PieceSummary>> {
  const out = new Map<string, PieceSummary>();
  for (const o of orders) {
    const s = o.first_item !== undefined ? fromRow(o.first_item, o.item_count, lang) : null;
    if (s) out.set(o.id, s);
  }
  await Promise.all(orders.filter((o) => o.first_item === undefined).slice(0, cap).map(async (o) => {
    const d = await hub.order(jwt, o.id).catch(() => null);
    const s = d ? summary(d.items, lang) : null;
    if (s) out.set(o.id, s);
  }));
  return out;
}

export async function draftPieces(jwt: string, drafts: HubDraft[], lang: Lang, cap = PIECE_LOOKUPS): Promise<Map<string, PieceSummary>> {
  const out = new Map<string, PieceSummary>();
  for (const d of drafts) {
    const s = d.first_item !== undefined ? fromRow(d.first_item, d.item_count, lang) : null;
    if (s) out.set(d.id, s);
  }
  await Promise.all(drafts.filter((d) => d.first_item === undefined).slice(0, cap).map(async (dr) => {
    const d = await hub.draft(jwt, dr.id).catch(() => null);
    const s = d ? summary(d.items, lang) : null;
    if (s) out.set(dr.id, s);
  }));
  return out;
}
