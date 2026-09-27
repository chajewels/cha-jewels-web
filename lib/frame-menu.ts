import "server-only";
import { hub, SECONDARY_TIMEOUT_MS } from "@/lib/hub-api";
import { inStockVariant, stagePieces, within, type HeroPhoto } from "@/lib/hero-deck";
import { loadIndex } from "@/lib/search";
import { isFigure } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";
import type { Collection, Product } from "@/lib/types";

/**
 * WHAT THE COLLECTIONS MENU SHOWS BESIDES NAMES (site frame, build step 1).
 *
 *   counts         in-stock pieces per collection: active, a variant with
 *                  stock > 0 (`inStockVariant`, the hero's own rule). A count
 *                  is a tally of pieces, never a figure derived from a price.
 *                  The menu prints a count only when it is above zero (D1-6):
 *                  an empty collection keeps its photo and its name.
 *   pieceOfMonth   one real, available piece with a photo. There is no Hub
 *                  field for it yet, so the rule is: the highest-priced
 *                  available piece in the catalogue (a comparison, not
 *                  arithmetic). When it sells, the next one takes its place on
 *                  the next render. Its reserve line (EN only) is the variant's
 *                  own Hub `down_payment_jpy` / `down_payment_php`, shown only
 *                  when both are present — never computed here.
 *
 * Every read is the catalogue's own cached one (60 s, tag "catalog") and gives
 * up after SECONDARY_TIMEOUT_MS: a slow Hub costs the menu a number or the
 * feature tile, never the header.
 */
export type PieceOfMonth = {
  slug: string;
  name: string;
  priceJpy: number;
  photo: HeroPhoto;
  downPayment: { jpy: number; php: number } | null;
};

const inStock = (products: Product[]) => products.filter((p) => inStockVariant(p) !== null).length;

export async function collectionCounts(collections: Collection[]): Promise<Record<string, number>> {
  const entries = await Promise.all(
    collections.map(async (c): Promise<[string, number]> => {
      const products = await within(hub.collection(c.slug), SECONDARY_TIMEOUT_MS).then((r) => r?.products ?? [], () => []);
      return [c.slug, inStock(products)];
    }),
  );
  return Object.fromEntries(entries);
}

export async function pieceOfMonth(lang: Lang): Promise<PieceOfMonth | null> {
  const index = await within(loadIndex(), SECONDARY_TIMEOUT_MS).catch(() => []);
  const candidates = index
    .map(({ product }) => ({ p: product, v: inStockVariant(product) }))
    .filter((c): c is { p: Product; v: NonNullable<ReturnType<typeof inStockVariant>> } => c.v !== null)
    .sort((a, b) => (a.v.price_jpy === b.v.price_jpy ? 0 : a.v.price_jpy < b.v.price_jpy ? 1 : -1));
  // The first one with a photo: a feature tile without a picture is not one.
  for (const { p, v } of candidates) {
    const piece = stagePieces([p], lang)[0];
    if (!piece) continue;
    return {
      slug: piece.slug,
      name: piece.name,
      priceJpy: piece.priceJpy,
      photo: piece.photos[0],
      downPayment: isFigure(v.down_payment_jpy) && isFigure(v.down_payment_php) ? { jpy: v.down_payment_jpy, php: v.down_payment_php } : null,
    };
  }
  return null;
}
