import "server-only";
import { hub, SECONDARY_TIMEOUT_MS } from "@/lib/hub-api";
import { inStockVariant, within } from "@/lib/hero-deck";
import type { Collection, Product } from "@/lib/types";

/**
 * THE COLLECTIONS MENU'S STOCK COUNTS (site frame, build step 1): in-stock
 * pieces per collection — active, a variant with stock > 0 (`inStockVariant`,
 * the hero's own rule). A count is a tally of pieces, never a figure derived
 * from a price. The menu prints one only when it is above zero (D1-6): an
 * empty collection keeps its photo and its name.
 *
 * Each read is the collection page's own cached one (60 s, tag "catalog") and
 * gives up after SECONDARY_TIMEOUT_MS: a slow Hub costs the menu a number,
 * never the header.
 */
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
