import "server-only";
import { hub, SECONDARY_TIMEOUT_MS } from "@/lib/hub-api";
import { categoryCta, categoryDescription, categoryName, productName } from "@/lib/catalog-i18n";
import { primaryImage } from "@/lib/queries/products";
import { CATEGORY_PLACEHOLDER } from "@/lib/category-placeholders";
import { metalsLabel, productMetals } from "@/lib/metals";
import { tr, type Lang } from "@/lib/i18n";
import type { Category, Product, ProductVariant } from "@/lib/types";

/**
 * THE HERO DECK, DECIDED ON THE SERVER, IN ONE PLACE (hero slider v2,
 * owner approvals 2026-09-26; comps in ~/Code/reference/hero-comps/slider-after-v2).
 *
 * Slide 1 is the brand film with one real piece beside it. Then one slide per
 * Hub category in the Hub's sort_order, each with its own layout. The pieces
 * on the slides are CHOSEN HERE, from the Hub's catalogue, on every render
 * (ISR 60 s, and the Hub's revalidation webhook): only an active piece with a
 * variant in stock, never a sold one. When a piece sells it drops out of the
 * next render and the next available piece takes its place. There is no SKU
 * in this file and none may be added.
 *
 * Every figure is the Hub's: the price is the in-stock variant's `price_jpy`,
 * shown as sent; purity, weight, stone and size are the Hub's fields. Nothing
 * is computed from a price (scripts/check-money.mjs).
 *
 * EMPTY CATEGORIES. `HERO_HIDE_EMPTY_CATEGORIES=1` (server-only, read here and
 * nowhere else) hides a category slide whose catalogue read SUCCEEDED and holds
 * no available piece. Unset, the default, every slide shows, which is how
 * Development and every Vercel Preview stay. A read that fails or times out is
 * never "empty": a Hub hiccup must not blank the deck. Slide 1 is never hidden.
 */

/** A piece as a slide shows it. Display strings are resolved for `lang` here. */
export type HeroPiece = {
  slug: string;
  /**
   * The Hub name exactly as the product card and product page show it
   * (productName, lib/catalog-i18n): never shortened, reordered or stripped
   * (owner correction 2026-09-26).
   */
  name: string;
  sku: string;
  /** Every stamp exactly as the Hub sends it ("750" stays "750", "K18" stays "K18"), as the rest of the site shows it. */
  purity: string | null;
  /** "2.65g" (JA) / "2.65 g" (EN), or null when the Hub sent no weight. */
  weight: string | null;
  /** The Hub's stone text for the variant, as sent. */
  stone: string | null;
  /** "18号" (JA) / "Size 18" (EN) for a numeric size; anything else as sent. */
  size: string | null;
  /** The in-stock variant's yen price, exactly as the Hub sent it. */
  priceJpy: number;
  image: { url: string; alt: string } | null;
  /** The Hub's `brand`, shown as text only (never a logo). */
  brand: string | null;
  preloved: boolean;
};

/** Which comp a category slide is drawn from. Keyed by slug; an unknown slug gets the ledger. */
export type HeroLayout = "ledger" | "loupe" | "vitrine" | "clock" | "index";

const LAYOUT: Record<string, HeroLayout> = {
  "fine-jewelry": "ledger",
  "preloved-jewelry": "loupe",
  "preloved-branded-jewelry": "vitrine",
  "preloved-watches": "clock",
  "preloved-designer-accessories": "index",
};

/**
 * The category photo a slide may show as its DEFAULT, before the owner
 * uploads her own to the category in the Hub (`hero_media`, which always wins).
 * Only the two whole-photo slides take the repo placeholder. The placeholders
 * for branded jewelry, watches and accessories show brand marks (a BVLGARI
 * engraving, AP / Rolex / Patek dials, YSL / GG / Prada hardware), and no brand
 * logo is used as decoration, so those slides wait for an owner photo and show
 * the dark stone ground until then.
 */
const PLACEHOLDER_OK = new Set<HeroLayout>(["ledger", "loupe"]);

/** How many pieces each layout shows. */
const PIECES: Record<HeroLayout, number> = { ledger: 2, loupe: 1, vitrine: 3, clock: 0, index: 0 };

export type HeroFilmSlide = { kind: "film"; key: "film"; name: string; short: string; piece: HeroPiece | null };
export type HeroCategorySlide = {
  kind: "category";
  key: string;
  slug: string;
  layout: HeroLayout;
  name: string;
  /**
   * The caller line above the title (owner-approved, lib/i18n "home.heroCaller*"),
   * chosen by layout here; a slug with no approved line gets the generic
   * 「カテゴリー」 / "Category".
   */
  caller: string;
  /** The name in the controls cluster: the Hub name without a leading "Preloved " / "プレラブド ". */
  short: string;
  description: string | null;
  cta: string;
  /** The category's Hub photo, else the placeholder where one is allowed, else null. */
  image: string | null;
  /**
   * Extra owner photos for the multi-photo layouts (vitrine niches, index
   * stage), from the category's `gallery_media` once the Hub sends it
   * (supabase/contracts/api.md, "Proposed"). Empty today.
   */
  gallery: string[];
  pieces: HeroPiece[];
};
export type HeroSlide = HeroFilmSlide | HeroCategorySlide;

/** An active piece with at least one variant in stock. Never a sold one. */
export function inStockVariant(p: Pick<Product, "status" | "product_variants">): ProductVariant | null {
  if (p.status !== "active") return null;
  let best: ProductVariant | null = null;
  for (const v of p.product_variants ?? []) {
    if (!Number.isFinite(v.stock_qty) || v.stock_qty <= 0) continue;
    if (!Number.isFinite(v.price_jpy)) continue;
    // The cheapest variant still in stock is the one whose price is shown —
    // a comparison, not arithmetic.
    if (!best || v.price_jpy < best.price_jpy) best = v;
  }
  return best;
}

const NUMBER = /^#?\d+(\.\d+)?$/;

/**
 * The piece's stamps exactly as the Hub sends them, through the site's one
 * metal label (lib/metals.ts). Never normalised: "750" stays "750" and "K18"
 * stays "K18" (owner correction 2026-09-26). null when the Hub sent none.
 */
export function heroPurity(p: Pick<Product, "metals" | "karat">, lang: Lang): string | null {
  const list = productMetals(p);
  return list.length ? metalsLabel(list, lang) : null;
}

function piece(p: Product, v: ProductVariant, lang: Lang): HeroPiece {
  // The same first photo and the same name the product card shows.
  const img = primaryImage(p);
  const name = productName(p, lang);
  const size = v.size?.trim() || null;
  return {
    slug: p.slug,
    name,
    sku: p.sku,
    purity: heroPurity(p, lang),
    weight: p.weight_g != null && Number.isFinite(p.weight_g) ? `${p.weight_g.toFixed(2)}${lang === "ja" ? "g" : " g"}` : null,
    stone: v.stone?.trim() || null,
    size: size && NUMBER.test(size) ? tr(lang)("home", "heroSize", { n: size.replace(/^#/, "") }) : size,
    priceJpy: v.price_jpy,
    image: img ? { url: img.url, alt: img.alt ?? name } : null,
    brand: p.brand?.trim() || null,
    preloved: p.condition === "Preloved",
  };
}

/** The available pieces of one category, in the Hub's order. */
function available(products: Product[], lang: Lang): HeroPiece[] {
  const out: HeroPiece[] = [];
  for (const p of products) {
    const v = inStockVariant(p);
    if (v) out.push(piece(p, v, lang));
  }
  return out;
}

function withoutLead(pool: HeroPiece[], lead: HeroPiece | null): HeroPiece[] {
  const rest = pool.filter((p) => p.slug !== lead?.slug);
  return rest.length ? rest : pool;
}

/** "Preloved Watches" → "Watches", "プレラブド ウォッチ" → "ウォッチ". A name without that prefix, or with nothing after it, is kept. */
export function segmentName(name: string): string {
  const m = name.match(/^(?:preloved|プレラブド)\s+(.+)$/i);
  // "Jewelry" alone would read as the fine jewelry line: keep the full name.
  return m && !/^(jewelry|ジュエリー)$/i.test(m[1]) ? m[1] : name;
}

/** The approved caller line for each layout; anything else is "Category". */
function callerLine(layout: HeroLayout, slug: string, t: ReturnType<typeof tr>): string {
  if (!(slug in LAYOUT)) return t("home", "slideEyebrow");
  switch (layout) {
    case "ledger": return t("home", "heroCallerFine");
    case "loupe": return t("home", "heroPrelovedEyebrow");
    case "vitrine": return t("home", "heroCallerBranded");
    case "clock": return t("home", "heroCallerWatches");
    case "index": return t("home", "heroCallerAccessories");
  }
}

/** A Hub read that gives up after `ms`. A timeout is a failure, and a failure is "not empty". */
function within<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/** The switch. Anything but "1" / "true" is off. */
export function hideEmptyCategories(): boolean {
  const v = process.env.HERO_HIDE_EMPTY_CATEGORIES?.trim().toLowerCase();
  return v === "1" || v === "true";
}

type CategoryWithGallery = Category & { gallery_media?: string[] | null };

export async function buildHeroDeck(lang: Lang, categories: Category[]): Promise<HeroSlide[]> {
  const t = tr(lang);
  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  // One read per category, in parallel, under the same 60 s cache the
  // category pages use (same URL, same entry). null = the read failed.
  const reads = await Promise.all(
    sorted.map((c) => within(hub.category(c.slug), SECONDARY_TIMEOUT_MS).then((r) => r?.products ?? [], () => null)),
  );
  const pools = reads.map((r) => (r ? available(r, lang) : null));

  // Slide 1's piece: the first available piece with a photo, in category
  // order; else the first available piece at all.
  const all = pools.flatMap((p) => p ?? []);
  const lead = all.find((p) => p.image) ?? all[0] ?? null;

  const hide = hideEmptyCategories();
  const slides: HeroSlide[] = [{ kind: "film", key: "film", name: t("home", "heroFilmName"), short: t("home", "heroFilmName"), piece: lead }];
  sorted.forEach((c, i) => {
    const pool = pools[i];
    // Hidden only when the switch is on AND the read answered AND nothing is available.
    if (hide && pool !== null && pool.length === 0) return;
    const layout = LAYOUT[c.slug] ?? "ledger";
    const name = categoryName(c, lang);
    const gallery = ((c as CategoryWithGallery).gallery_media ?? []).filter((u): u is string => typeof u === "string" && !!u.trim());
    slides.push({
      kind: "category",
      key: c.slug,
      slug: c.slug,
      layout,
      name,
      short: segmentName(name),
      caller: callerLine(layout, c.slug, t),
      description: categoryDescription(c, lang),
      cta: categoryCta(c, lang) ?? t("home", "slideShop", { name }),
      image: c.hero_media ?? (PLACEHOLDER_OK.has(layout) ? CATEGORY_PLACEHOLDER[c.slug] ?? null : null),
      gallery,
      // The film's piece is not repeated on its own category's slide, unless
      // it is the only piece that category has left.
      pieces: withoutLead(pool ?? [], lead).slice(0, PIECES[layout]),
    });
  });
  return slides;
}
