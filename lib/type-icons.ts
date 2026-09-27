import { COLLECTION_PLACEHOLDER } from "@/lib/collection-placeholders";
import type { Collection } from "@/lib/types";

/**
 * WHAT A PRODUCT TYPE ("Shop by type", the Hub's website_collections) SHOWS,
 * the same everywhere a type is a tile or a card: the home section, the
 * Collections page, the Collections menu, the phone drawer and the empty-shelf
 * suggestions. In this order:
 *
 *   photo   the Hub's hero_media, when the owner has uploaded one
 *           else the bundled stand-in photo for that slug (lib/collection-placeholders)
 *   icon    else a gold line icon for the kind of type (components/catalog/type-icon.tsx)
 *
 * so a type the owner adds in the Hub never shows an empty tile.
 */
export type TypeIconName = "watch" | "wallet" | "belt" | "bag" | "accessory";
export type TypeVisual = { kind: "photo"; url: string } | { kind: "icon"; icon: TypeIconName };

/**
 * The icon per Hub slug (slugs as live on 2026-09-27). A slug that is not
 * here — Other Accessories, or any type added later — gets the generic
 * accessory icon.
 */
export const TYPE_ICON: Record<string, TypeIconName> = {
  "luxury-watches": "watch",
  "luxury-wallet": "wallet",
  "luxury-belt": "belt",
  "luxury-bags": "bag",
  "other-accessories": "accessory",
};

export function typeIcon(slug: string): TypeIconName {
  return TYPE_ICON[slug] ?? "accessory";
}

export function typeVisual(c: Pick<Collection, "slug" | "hero_media">): TypeVisual {
  const url = c.hero_media ?? COLLECTION_PLACEHOLDER[c.slug] ?? null;
  return url ? { kind: "photo", url } : { kind: "icon", icon: typeIcon(c.slug) };
}
