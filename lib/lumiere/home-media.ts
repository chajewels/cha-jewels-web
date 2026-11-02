/**
 * THE LUMIÈRE HOME'S EDITORIAL PHOTOGRAPHS — Cha Jewels originals only (P5b, owner decision 4, 2026-11-02).
 *
 * Every image below is a file the current site already ships under public/images/** (about, collections, company,
 * home). No Lumière reference imagery, no stock, no placeholder remains on any page; the placeholder registry and
 * public/lumiere/placeholder/** are gone and `npm run check:placeholders --strict` keeps them gone.
 *
 * The Hub stays the first source wherever it has one (lib/lumiere/home-hub.ts: category photographs, hero-deck pieces,
 * featured pieces). These are (a) the slots the Hub has NO source for — the hero frame-3 photograph, the philosophy
 * backdrops and hand photograph, the four "why" panels (docs/tasks/lumiere-hub-slots.md §2) — and (b) the fallback of a
 * Hub slot while the Hub returns nothing for it. The file-to-slot table is docs/tasks/lumiere-p5b-media.md.
 *
 * Alt text is written once per language from the copy the site already uses (the category names, `why.imageAlt`);
 * `alt` is "" for a purely decorative plate (the blurred philosophy backdrop).
 */
import type { Lang } from "@/lib/i18n";

/** An image in a home slot: a Cha original (width and height known) or a Hub photograph (drawn with `fill`). */
export interface HomeImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface ChaPhoto {
  src: string;
  width: number;
  height: number;
  alt: Record<Lang, string>;
}

const photo = (src: string, width: number, height: number, en: string, ja: string): ChaPhoto => ({ src, width, height, alt: { en, ja } });

/** public/images/collections/** — 1200 × 900 each. */
const COLLECTION = {
  rings: photo("/images/collections/rings.webp", 1200, 900, "A hand wearing three Cha Jewels gold rings", "Cha Jewelsのゴールドリングを3本着けた手"),
  necklaces: photo("/images/collections/necklaces.webp", 1200, 900, "Pearl and gold necklaces worn together", "パールとゴールドのネックレスの重ね付け"),
  earrings: photo("/images/collections/earrings.webp", 1200, 900, "Gold hoop earrings and pearl earrings", "ゴールドのフープピアスとパールのピアス"),
  bracelets: photo("/images/collections/bracelets.webp", 1200, 900, "Gold and diamond bracelets on the wrist", "ゴールドとダイヤモンドのブレスレットを着けた手首"),
  pendants: photo("/images/collections/pendants.webp", 1200, 900, "Three pendant necklaces: hammered gold, pearl and diamond", "ハンマード加工のゴールド、パール、ダイヤモンドのペンダント"),
  pearls: photo("/images/collections/pearls.webp", 1200, 900, "Pearl necklaces, bracelet, earrings and pendant", "パールのネックレス、ブレスレット、ピアス、ペンダント"),
  gemstoneBracelets: photo("/images/collections/handmade-gemstone-bracelets.webp", 1200, 900, "Handmade gemstone bracelets with gold beads", "ゴールドビーズを添えたハンドメイドの天然石ブレスレット"),
  anklets: photo("/images/collections/anklets.webp", 1200, 900, "A gold anklet", "ゴールドのアンクレット"),
} as const;

/** public/images/company + public/images/home. */
const STUDIO = {
  /** The existing /why-cha-jewels photograph; its alt is that page's own `why.imageAlt`. */
  still: photo("/images/company/why-cha-jewels.webp", 1400, 933, "A Cha Jewels gold necklace, ring and pearl earrings arranged on cream fabric", "クリーム色の布の上に並べたCha Jewelsのゴールドネックレス、リング、パールピアス"),
  gold: photo("/images/home/hero-poster.webp", 1920, 1080, "Grains of gold in a crucible, ready to be cast", "鋳造を待つ、るつぼの中の金の粒"),
  artisan: photo("/images/home/values-artisan.webp", 1376, 768, "An artisan stringing pearls by hand", "パールを手で通す職人"),
  chains: photo("/images/home/pomelli-hero.webp", 1376, 768, "Gold chains resting on green velvet", "緑のベルベットに重ねたゴールドのチェーン"),
} as const;

const draw = (p: ChaPhoto, lang: Lang): HomeImage => ({ src: p.src, alt: p.alt[lang], width: p.width, height: p.height });

/**
 * HERO CARDS 1–7 when the Hub's hero deck cannot fill them (card 8 is the frame-3 photograph, below). In the ring's
 * order; the Hub's real pieces replace them one by one.
 */
export const heroCardFallbacks = (lang: Lang): HomeImage[] =>
  [COLLECTION.necklaces, COLLECTION.earrings, COLLECTION.pendants, COLLECTION.bracelets, COLLECTION.pearls, COLLECTION.gemstoneBracelets, COLLECTION.anklets].map((p) => draw(p, lang));

/**
 * HERO FRAME 3 — the full-screen photograph the hero's last frame ends on (no Hub source). A hand wearing rings, the
 * subject the frame was composed for; the crop keeps the three rings in the portrait window.
 */
export const heroFrame3 = (lang: Lang): HomeImage => draw(COLLECTION.rings, lang);
export const HERO_FRAME_3_POSITION = "56% 50%";

/**
 * THE HERO CENTREPIECE when the Hub's hero deck has no piece: the existing gold-and-pearl still life (the same
 * photograph /why-cha-jewels shows). The Hub's best deck piece replaces it (lib/lumiere/home-hub.ts).
 */
export const heroCentrepieceFallback = (lang: Lang): HomeImage => draw(STUDIO.still, lang);

/** COLLECTIONS cards when the Hub's category has no photograph: one Cha original per category, in the home's order. */
export const collectionFallback = (slug: string, lang: Lang): HomeImage => {
  const p =
    slug === "fine-jewelry" ? COLLECTION.pendants
    : slug === "preloved-jewelry" ? COLLECTION.necklaces
    : slug === "preloved-branded-jewelry" ? COLLECTION.earrings
    : slug === "preloved-watches" ? COLLECTION.bracelets
    : COLLECTION.pearls;
  return draw(p, lang);
};

/** The four "why" panels (Timeless, Value, Craftsmanship, Quality), in the values' order. */
export const whyPanelImages = (lang: Lang): HomeImage[] => [STUDIO.still, STUDIO.gold, STUDIO.artisan, STUDIO.chains].map((p) => draw(p, lang));

/**
 * PHILOSOPHY. The backdrop is a blurred plate stretched over its frame; the two plates are small blurred crops of the
 * existing gold-chains photograph (public/images/home/pomelli-hero.webp), made by scripts/make-lumiere-plates.mjs, one
 * pre-stretched to each frame regime (≥ 1024 px: aspect 0.81; below: 0.2847). The hand photograph is the existing
 * rings photograph.
 */
export const philosophyMedia = (lang: Lang): { backdrop: { wide: HomeImage; narrow: HomeImage }; hand: HomeImage } => ({
  backdrop: {
    wide: { src: "/images/home/philosophy-backdrop.webp", alt: "", width: 480, height: 590 },
    narrow: { src: "/images/home/philosophy-backdrop-narrow.webp", alt: "", width: 240, height: 843 },
  },
  hand: draw(COLLECTION.rings, lang),
});
