/**
 * PLACEHOLDER category thumbnails for the Collections menu (components/site/
 * header.tsx). A category's `hero_media` from the Hub always wins; these
 * render only while it is null, so uploading a photo in the Hub replaces one
 * with no deploy. The category PAGE no longer uses them: without a Hub photo
 * its banner is the category's own pieces (components/catalog/category-stage.tsx).
 *
 * Keyed by slug rather than listed in order: a category the Hub adds that has
 * no entry here simply has no placeholder, which is the honest outcome — better
 * than borrowing another category's photo for it.
 *
 * NO BRAND LOGOS (owner rule 2026-09-26: brand names in text only, never a
 * logo as decoration). The photos for Preloved Branded Jewelry, Preloved
 * Watches and Preloved Designer Accessories showed Bvlgari, Cartier, Audemars
 * Piguet, Patek Philippe, Rolex, A. Lange & Söhne, YSL, Gucci, Louis Vuitton
 * and Prada marks; they and their files were removed, and must not come back.
 * Those three lines have no placeholder until the owner uploads a photo in the Hub.
 */
export const CATEGORY_PLACEHOLDER: Record<string, string> = {
  "fine-jewelry": "/images/categories/fine-jewelry.webp",
  "preloved-jewelry": "/images/categories/preloved-jewelry.webp",
};
