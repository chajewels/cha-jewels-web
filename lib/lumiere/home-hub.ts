import "server-only";
import { hub, SECONDARY_TIMEOUT_MS } from "@/lib/hub-api";
import { buildHeroDeck, inStockVariant, within } from "@/lib/hero-deck";
import { lqip } from "@/lib/lumiere/lqip";
import { categoryName, productName } from "@/lib/catalog-i18n";
import { allImages, fromPrice } from "@/lib/product-facts";
import { cardImage } from "@/lib/product-media";
import { metalLabel, productMetals } from "@/lib/metals";
import { formatMoney } from "@/lib/utils";
import type { Lang } from "@/lib/i18n-core";
import type { Product } from "@/lib/types";

/**
 * THE LUMIÈRE HOME'S IMAGE AND PIECE SLOTS, FROM THE HUB (P5, owner 2026-11-01: "keep Lumière images for now; connect to
 * the Hub as the existing hero does"). One read per render of the home (ISR 60 s, the Hub's revalidation webhook), every
 * part guarded by the same short timeout the other secondary reads use: a slow or failing Hub costs a slot its Hub photo,
 * never the page — the registered placeholder (lib/lumiere/placeholders.ts) stays the fallback.
 *
 *   collections  the Hub's category photograph (`hero_media`, the one the existing menu and category pages use)
 *   hero cards   see "hero pieces" below (P5c replaced the first-photograph cards of P5)
 *   featured     the Hub's featured pieces (GET /catalog/products?featured=1): name as the product page shows it, the yen
 *                price as sent, the metals as stamped, the first photograph; Add to cart is the product page's own action
 *
 * Every figure is the Hub's (scripts/check-money.mjs): the price is `price_jpy` of the in-stock variant, printed, never
 * computed. A slot with NO Hub source today (the frame-3 photograph, the philosophy plates, the why panels, any 3D model)
 * is a Cha Jewels original (lib/lumiere/home-media.ts) and is listed in docs/tasks/lumiere-hub-slots.md; nothing is invented.
 *
 *   hero pieces  (P5c, owner decision a) ONLY pieces with an approved hero cut-out (the original tool; transparent
 *                background), one per piece, round-robin across the deck's category slides, up to nine: the first is the ring's
 *                centre, the next eight are the ring's cards. Never a photograph with its own background. A hero record, so it
 *                only ever reads the hero's own cut-out (scripts/check-cutouts.mjs rule 3 is about lib/hero-deck.ts; this file
 *                never reads a Photoroom `cutout`). Each carries an instant blurred placeholder (lib/lumiere/lqip.ts).
 *   featured     (P5b) also carries `stage`: the piece's cut-out as the product pages show it (lib/product-media.ts —
 *                Photoroom, approved only) or its photograph, for the right-hand stage.
 */
export type HubPhoto = { src: string; alt: string };

/** What the featured right-hand stage draws for a piece; `model` is the future per-product 3D model (none today). */
export type HubStage = { src: string; alt: string; kind: "cut" | "whole"; model: string | null };

/** A cut-out (transparent background) of an available piece, with its natural size and an instant blurred placeholder. */
export type HubHeroPiece = HubPhoto & { width: number; height: number; blur?: string };

export type HubFeaturedPiece = {
  name: string;
  materials: string[];
  /** "¥1,480,000", as the Hub's price prints. */
  price: string;
  photo: HubPhoto;
  stage: HubStage;
  buy: { variantId: string; slug: string; sku: string };
};

export type HomeHubSlots = {
  /** Category slug → the Hub's photograph of it. */
  categoryPhotos: Record<string, HubPhoto>;
  /** Up to nine available pieces that have an approved hero cut-out: [0] is the ring's centre, [1…8] its cards. */
  heroPieces: HubHeroPiece[];
  /** Up to five available featured pieces. */
  featured: HubFeaturedPiece[];
};

const EMPTY: HomeHubSlots = { categoryPhotos: {}, heroPieces: [], featured: [] };

/** A Hub URL a plate may draw: ours (`/…`) or HTTPS. Never `//host`, never a data: or javascript: string. */
const drawable = (src: unknown): src is string =>
  typeof src === "string" && src.length > 1 && (src.startsWith("https://") || (src.startsWith("/") && !src.startsWith("//")));

/** The ring's centre and its eight cards. */
const HERO_PIECES_FROM_HUB = 9;
const FEATURED_FROM_HUB = 5;

export async function homeHubSlots(lang: Lang): Promise<HomeHubSlots> {
  try {
    const categories = await within(hub.categories(), SECONDARY_TIMEOUT_MS).catch(() => []);
    const [deck, featured] = await Promise.all([
      within(buildHeroDeck(lang, categories), SECONDARY_TIMEOUT_MS + 1500).catch(() => []),
      within(hub.featured(12), SECONDARY_TIMEOUT_MS).catch(() => [] as Product[]),
    ]);

    const categoryPhotos: Record<string, HubPhoto> = {};
    for (const c of categories) if (drawable(c.hero_media)) categoryPhotos[c.slug] = { src: c.hero_media, alt: categoryName(c, lang) };

    // Pieces with an approved hero cut-out only (the deck's `cutout` is `heroCutout`: the original tool's, owner-approved):
    // the first cut photograph of each piece, one piece per turn across the category slides, until nine.
    const pools = deck.flatMap((s) =>
      s.kind === "category"
        ? [s.pieces.flatMap((p) => {
            const ph = p.photos.find((x) => x.cutout && drawable(x.cutout.url));
            return ph?.cutout ? [{ src: ph.cutout.url, alt: ph.alt || p.name, width: ph.cutout.width, height: ph.cutout.height }] : [];
          })]
        : [],
    );
    const picked: HubHeroPiece[] = [];
    const seen = new Set<string>();
    for (let round = 0; picked.length < HERO_PIECES_FROM_HUB && pools.some((p) => p.length > round); round++) {
      for (const pool of pools) {
        const piece = pool[round];
        if (piece && !seen.has(piece.src) && picked.length < HERO_PIECES_FROM_HUB) { seen.add(piece.src); picked.push(piece); }
      }
    }
    // The instant placeholders, in parallel and bounded: a slow storage host costs a card its blur, never the page.
    const heroPieces: HubHeroPiece[] = await within(
      Promise.all(picked.map(async (p) => ({ ...p, blur: await lqip(p.src) }))),
      SECONDARY_TIMEOUT_MS,
    ).catch(() => picked);

    const pieces: HubFeaturedPiece[] = [];
    for (const p of featured) {
      if (pieces.length >= FEATURED_FROM_HUB) break;
      const v = inStockVariant(p);
      const photo = allImages(p).find((m) => drawable(m.url));
      if (!v || !photo || fromPrice(p) == null) continue;
      const shown = cardImage(p);
      const name = productName(p, lang);
      pieces.push({
        name,
        materials: productMetals(p).map((m) => metalLabel(m, lang)),
        price: formatMoney(v.price_jpy, "JPY"),
        photo: { src: photo.url, alt: photo.alt ?? name },
        // The stage: the Photoroom cut-out when approved, else the photograph (a `model` arrives with `products.model_glb_url`).
        stage: shown && drawable(shown.src)
          ? { src: shown.src, alt: shown.alt ?? name, kind: shown.kind === "cut" ? "cut" : "whole", model: null }
          : { src: photo.url, alt: photo.alt ?? name, kind: "whole", model: null },
        buy: { variantId: v.id, slug: p.slug, sku: p.sku },
      });
    }
    return { categoryPhotos, heroPieces, featured: pieces };
  } catch {
    return EMPTY;
  }
}
