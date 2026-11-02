import "server-only";
import { hub, SECONDARY_TIMEOUT_MS } from "@/lib/hub-api";
import { buildHeroDeck, inStockVariant, within } from "@/lib/hero-deck";
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
 *   hero cards   real pieces from the existing hero deck (lib/hero-deck.ts: only active, in-stock, never sold; the same
 *                photos in the same order) — cards 1–7; card 8, the frame-3 hand photograph, has no Hub source
 *   featured     the Hub's featured pieces (GET /catalog/products?featured=1): name as the product page shows it, the yen
 *                price as sent, the metals as stamped, the first photograph; Add to cart is the product page's own action
 *
 * Every figure is the Hub's (scripts/check-money.mjs): the price is `price_jpy` of the in-stock variant, printed, never
 * computed. A slot with NO Hub source today (the frame-3 photograph, the philosophy plates, the why panels, any 3D model)
 * is a Cha Jewels original (lib/lumiere/home-media.ts) and is listed in docs/tasks/lumiere-hub-slots.md; nothing is invented.
 *
 *   hero centre  (P5b) the best real piece of the hero deck, drawn in the ring's middle: its hero cut-out (the original
 *                tool, approved) when one exists, else the first deck photograph. A hero record, so it only ever reads the
 *                hero's own cut-out (scripts/check-cutouts.mjs rule 3 is about lib/hero-deck.ts; this file never reads a
 *                Photoroom `cutout`).
 *   featured     (P5b) also carries `stage`: the piece's cut-out as the product pages show it (lib/product-media.ts —
 *                Photoroom, approved only) or its photograph, for the right-hand stage.
 */
export type HubPhoto = { src: string; alt: string };

/** What the featured right-hand stage draws for a piece; `model` is the future per-product 3D model (none today). */
export type HubStage = { src: string; alt: string; kind: "cut" | "whole"; model: string | null };

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
  /** Up to seven photographs of real, available pieces, in the hero deck's order. */
  heroPhotos: HubPhoto[];
  /** The best real piece of the hero deck for the ring's centre; null when the deck has none. */
  heroPiece: { image: HubPhoto; kind: "cut" | "whole" } | null;
  /** Up to five available featured pieces. */
  featured: HubFeaturedPiece[];
};

const EMPTY: HomeHubSlots = { categoryPhotos: {}, heroPhotos: [], heroPiece: null, featured: [] };

/** A Hub URL a plate may draw: ours (`/…`) or HTTPS. Never `//host`, never a data: or javascript: string. */
const drawable = (src: unknown): src is string =>
  typeof src === "string" && src.length > 1 && (src.startsWith("https://") || (src.startsWith("/") && !src.startsWith("//")));

const HERO_CARDS_FROM_HUB = 7;
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

    // The first photograph of each piece the hero deck chose, one piece per turn across the category slides, until seven.
    const pools = deck.flatMap((s) => (s.kind === "category" ? [s.pieces.flatMap((p) => (drawable(p.photos[0]?.url) ? [{ src: p.photos[0].url, alt: p.name }] : []))] : []));
    const heroPhotos: HubPhoto[] = [];
    for (let round = 0; heroPhotos.length < HERO_CARDS_FROM_HUB && pools.some((p) => p.length > round); round++) {
      for (const pool of pools) if (pool[round] && heroPhotos.length < HERO_CARDS_FROM_HUB) heroPhotos.push(pool[round]);
    }

    // The ring's centre: the first deck photograph that has an approved hero cut-out; otherwise the first deck photograph.
    const deckPhotos = deck.flatMap((s) => (s.kind === "category" ? s.pieces.flatMap((p) => p.photos.map((ph) => ({ ph, name: p.name }))) : []));
    const cut = deckPhotos.find(({ ph }) => ph.cutout && drawable(ph.cutout.url));
    const whole = deckPhotos.find(({ ph }) => drawable(ph.url));
    const heroPiece: HomeHubSlots["heroPiece"] = cut?.ph.cutout
      ? { image: { src: cut.ph.cutout.url, alt: cut.ph.alt || cut.name }, kind: "cut" }
      : whole
        ? { image: { src: whole.ph.url, alt: whole.ph.alt || whole.name }, kind: "whole" }
        : null;

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
    return { categoryPhotos, heroPhotos, heroPiece, featured: pieces };
  } catch {
    return EMPTY;
  }
}
