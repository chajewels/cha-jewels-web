/**
 * PLACEHOLDER category imagery. A category's `hero_media` from the Hub always
 * wins; these render only while it is null, so uploading a photo in the Hub
 * replaces one with no deploy.
 *
 * Keyed by slug rather than listed in order: a category the Hub adds that has
 * no entry here simply has no placeholder, which is the honest outcome — better
 * than borrowing another category's photo for it.
 */
export const CATEGORY_PLACEHOLDER: Record<string, string> = {
  "fine-jewelry": "/images/categories/fine-jewelry.webp",
  "preloved-jewelry": "/images/categories/preloved-jewelry.webp",
  "preloved-branded-jewelry": "/images/categories/preloved-branded-jewelry.webp",
  "preloved-watches": "/images/categories/preloved-watches.webp",
  "preloved-designer-accessories": "/images/categories/preloved-designer-accessories.webp",
};
