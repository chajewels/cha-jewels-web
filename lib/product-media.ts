import { allImages, usableCutout } from "@/lib/queries/products";
import type { Product, ProductMedia } from "@/lib/types";

/**
 * WHAT A PRODUCT PHOTO SHOWS AS (product pages and product cards). For each
 * Hub photo, in the Hub's order:
 *
 *   1. the Hub's Photoroom cut-out (`cutout`), when it may be shown
 *      (`usableCutout`: ok, auto_fixed, approved); the field is absent today
 *   2. otherwise the WHOLE original photo, contained, never cropped
 *
 * PRODUCTS = PHOTOROOM / NORMAL PHOTOS ONLY; HERO = THE ORIGINAL TOOL ONLY
 * (owner rule 2026-09-28). A hero cut-out — the bundled set
 * (lib/hero-cutouts.ts) or the Hub's `hero_cutout` — is never shown here;
 * those belong to the hero (lib/hero-deck.ts `heroCutout`).
 * scripts/check-cutouts.mjs (CI) keeps the two apart.
 *
 * `original` is always the untouched Hub photo: the full-screen viewer shows
 * that, so a reader zooming in sees the real picture. Nothing is processed
 * here or in the browser.
 */
export type PieceImage = {
  kind: "cut" | "whole";
  /** What the frame shows: the cut-out, or the whole photo. */
  src: string;
  /** The Hub photo itself. */
  original: string;
  alt: string | null;
};

export type GalleryItem = PieceImage | { kind: "video"; src: string; poster: string | null };

function resolve(m: ProductMedia): PieceImage {
  const c = usableCutout(m);
  return c ? { kind: "cut", src: c.url, original: m.url, alt: m.alt } : { kind: "whole", src: m.url, original: m.url, alt: m.alt };
}

/** Every photo of the piece, resolved. */
export function pieceImages(p: Product): PieceImage[] {
  return allImages(p).filter((m) => typeof m.url === "string" && m.url).map(resolve);
}

/** The card's picture: the first photo, resolved. */
export function cardImage(p: Product): PieceImage | null {
  const first = allImages(p).find((m) => typeof m.url === "string" && m.url);
  return first ? resolve(first) : null;
}

/** The video's place among the photos (comp: the third slot). */
const VIDEO_AT = 2;

/**
 * The gallery: the photos, with the Hub's video (D2-1, `video_url`, not sent
 * yet) as the third slot, or last when there are fewer photos. No video, no
 * slot — nothing is shown in its place.
 */
export function galleryItems(p: Product): GalleryItem[] {
  const items: GalleryItem[] = pieceImages(p);
  const url = typeof p.video_url === "string" ? p.video_url.trim() : "";
  if (url) items.splice(Math.min(VIDEO_AT, items.length), 0, { kind: "video", src: url, poster: p.video_poster_url?.trim() || null });
  return items;
}
