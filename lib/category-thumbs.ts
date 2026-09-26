import "server-only";
import { hub, SECONDARY_TIMEOUT_MS } from "@/lib/hub-api";
import { stagePieces, within } from "@/lib/hero-deck";
import type { Lang } from "@/lib/i18n";
import type { Category } from "@/lib/types";

/**
 * THE COLLECTIONS MENU'S CATEGORY THUMBNAILS (owner feedback on PR #166,
 * 2026-09-26: no brand logos as decoration; the owner's own photos or real
 * pieces). For EVERY category, in this order:
 *
 *   photo   the owner's Hub category photo (`hero_media`), when uploaded
 *   piece   else one real in-stock piece of that category, chosen by
 *           `stagePieces` (lib/hero-deck.ts) exactly as the hero and the
 *           category banner choose: active, stock > 0, never sold, and
 *           replaced by the next one when it sells. Its usable cut-out if it
 *           has one (Hub, else the interim bundled set), else its whole photo
 *   icon    else — nothing in stock, or the read failed or timed out — a line
 *           icon for the kind of category (components/site/category-thumb.tsx)
 *
 * No photo is bundled with the site for any category any more.
 *
 * The reads are the category pages' own (`hub.category`, same URL, same 60 s
 * cache and catalog tag as the hero deck), so the header adds no new Hub
 * traffic beyond that cache; each one gives up after SECONDARY_TIMEOUT_MS so
 * a slow Hub costs a thumbnail, never the header.
 */
export type CategoryThumb =
  | { kind: "photo"; url: string }
  | { kind: "piece"; url: string; cutout: boolean }
  | { kind: "icon" };

export async function categoryThumbs(categories: Category[], lang: Lang): Promise<Record<string, CategoryThumb>> {
  const entries = await Promise.all(
    categories.map(async (c): Promise<[string, CategoryThumb]> => {
      if (c.hero_media) return [c.slug, { kind: "photo", url: c.hero_media }];
      const products = await within(hub.category(c.slug), SECONDARY_TIMEOUT_MS).then((r) => r?.products ?? [], () => []);
      const photo = stagePieces(products, lang)[0]?.photos[0];
      if (!photo) return [c.slug, { kind: "icon" }];
      return [c.slug, photo.cutout ? { kind: "piece", url: photo.cutout.url, cutout: true } : { kind: "piece", url: photo.url, cutout: false }];
    }),
  );
  return Object.fromEntries(entries);
}
