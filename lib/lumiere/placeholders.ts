/**
 * THE PLACEHOLDER REGISTRY (docs/tasks/lumiere-p0-report.md §9; owner
 * decision 2026-10-31, docs/tasks/lumiere-redesign.md §4).
 *
 * Every Lumière asset that must leave before the redesign reaches production
 * is named here, and ONLY here: the hero cards, the emerald pendant and its
 * posters, the four collection photographs, the five ring models with their
 * posters and photographs, the three philosophy plates, and the featured
 * names, materials rows and the "¥ —" price state (D-7). Everything is typed
 * `placeholder: true as const`, so a component can refuse a placeholder where
 * a real piece is required, and the files live under
 * public/lumiere/placeholder/** — one directory to delete.
 *
 * TWO BELTS keep them off the live site:
 *  1. `npm run check:placeholders` (scripts/check-placeholders.mjs) scans
 *     app/, components/, lib/ and public/ for a reference to this module or to
 *     the literal path; lenient (count) on previews, STRICT (fail) when
 *     VERCEL_ENV is "production" or on a PR whose base is develop or main
 *     (D-17, .github/workflows/ci.yml).
 *  2. This module THROWS at import in a production build, so a page that
 *     still imports it fails `next build` on Vercel production before it can
 *     deploy.
 *
 * What is NOT a placeholder (shared, stays in production, under
 * public/lumiere/shared/**): the fonts, the paper texture and the studio EXR
 * the stones reflect — it is never visible as an image.
 *
 * Business text is never a placeholder: names, company details, prices of
 * real products, policies, contact and settings come from the existing site
 * or the Hub. The spelling "jewellery" in the Lumière copy is the reference's
 * own; this file is the one place check:terms allows it (D-22).
 */

if (process.env.VERCEL_ENV === "production") {
  throw new Error(
    "lib/lumiere/placeholders: Lumière placeholder content is still referenced in a production build. " +
      "Replace every placeholder with Hub data / Cha Jewels originals before merging to develop or main (npm run check:placeholders --strict).",
  );
}

export const PLACEHOLDER_ROOT = "/lumiere/placeholder/" as const;

/** A file under public/lumiere/placeholder/**. */
export interface PlaceholderAsset {
  readonly placeholder: true;
  readonly src: `${typeof PLACEHOLDER_ROOT}${string}`;
  readonly width: number;
  readonly height: number;
  /** The reference's own alt text, kept so the slot reads as it did in Lumière. */
  readonly alt: string;
}

/** A model (.glb) under public/lumiere/placeholder/models/**. */
export interface PlaceholderModel {
  readonly placeholder: true;
  readonly src: `${typeof PLACEHOLDER_ROOT}models/${string}`;
}

const asset = (file: string, width: number, height: number, alt: string): PlaceholderAsset => ({
  placeholder: true,
  src: `${PLACEHOLDER_ROOT}${file}`,
  width,
  height,
  alt,
});

const model = (file: string): PlaceholderModel => ({ placeholder: true, src: `${PLACEHOLDER_ROOT}models/${file}` });

/* --- Hero (block 1): the card ring and the emerald pendant -------------------- */
export const HERO_CARDS: readonly PlaceholderAsset[] = [
  asset("hero/card-01.webp", 964, 1024, "Jewellery still life, card one"),
  asset("hero/card-02.webp", 1024, 1525, "Jewellery still life, card two"),
  asset("hero/card-03.webp", 944, 1115, "Jewellery still life, card three"),
  asset("hero/card-04.webp", 787, 1024, "Jewellery still life, card four"),
  asset("hero/card-05.webp", 964, 1024, "Jewellery still life, card five"),
  asset("hero/card-06.webp", 683, 1024, "Jewellery still life, card six"),
  asset("hero/card-07.webp", 964, 1024, "Jewellery still life, card seven"),
  asset("hero/card-08.webp", 1024, 1514, "A hand wearing a ring, the hero photograph"),
];

export const PENDANT = {
  model: model("pendant-emerald.glb"),
  poster: asset("hero/pendant-emerald.webp", 842, 1112, "Emerald pendant on a chain"),
  posterCompact: asset("hero/pendant-emerald-compact.webp", 1024, 1536, "Emerald pendant on a long chain"),
} as const;

/* --- Collections (block 2): the four category photographs, until the five
       Cha Jewels categories get their own ------------------------------------- */
export const COLLECTION_PHOTOS = {
  rings: asset("collections/rings.webp", 1024, 682, "Rings"),
  necklaces: asset("collections/necklaces.webp", 1596, 850, "Necklaces"),
  earrings: asset("collections/earrings.webp", 768, 512, "Earrings"),
  bracelets: asset("collections/bracelets.webp", 768, 512, "Bracelets"),
} as const;

/* --- Featured (block 3): five rings — model, poster, photograph, name,
       materials row; the price is the "¥ —" state (D-7) --------------------- */
export interface PlaceholderPiece {
  readonly placeholder: true;
  readonly name: string;
  readonly materials: readonly string[];
  readonly model: PlaceholderModel;
  readonly poster: PlaceholderAsset;
  readonly photo: PlaceholderAsset;
  /** Never a figure: the placeholder price renders as "¥ —" and Add to cart stays disabled (D-7). */
  readonly price: "¥ —";
}

const piece = (n: string, name: string, materials: readonly string[]): PlaceholderPiece => ({
  placeholder: true,
  name,
  materials,
  model: model(`rings/ring-${n}.glb`),
  poster: asset(`featured/ring-${n}.webp`, 490, 530, `${name} ring`),
  photo: asset(`featured/photo-ring-${n}.webp`, 2000, 2000, `${name} ring, worn`),
  price: "¥ —",
});

export const FEATURED_PIECES: readonly PlaceholderPiece[] = [
  piece("01", "Trinity", ["Rose gold", "Diamonds", "Handmade"]),
  piece("02", "Solace", ["Yellow gold", "Sapphire", "Handmade"]),
  piece("03", "Aurum", ["Yellow gold", "Handmade"]),
  piece("04", "Verdant", ["White gold", "Emerald", "Handmade"]),
  piece("05", "Tidal", ["Platinum", "Diamonds", "Handmade"]),
];

/* --- Philosophy (block 4): the pre-stretched backdrop plates and the hand ---- */
export const PHILOSOPHY = {
  /** Pre-stretched for frames ≥ 1024 px (the reference's invariant; aspect 0.81). */
  backdrop: asset("philosophy/backdrop-frame.jpg", 1440, 1768, ""),
  /** Pre-stretched for the 412 px frame (aspect 0.2847). */
  backdropNarrow: asset("philosophy/backdrop-frame-412.jpg", 720, 2529, ""),
  hand: asset("philosophy/hand-with-ring.webp", 1164, 1316, "A hand wearing a ring"),
} as const;

/** Every placeholder file, for the guard's existence check and for QA. */
export const ALL_PLACEHOLDER_ASSETS: readonly (PlaceholderAsset | PlaceholderModel)[] = [
  ...HERO_CARDS,
  PENDANT.model,
  PENDANT.poster,
  PENDANT.posterCompact,
  ...Object.values(COLLECTION_PHOTOS),
  ...FEATURED_PIECES.flatMap((p) => [p.model, p.poster, p.photo]),
  PHILOSOPHY.backdrop,
  PHILOSOPHY.backdropNarrow,
  PHILOSOPHY.hand,
];

export const isPlaceholder = (value: unknown): value is { placeholder: true } =>
  typeof value === "object" && value !== null && (value as { placeholder?: unknown }).placeholder === true;
