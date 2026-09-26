import "server-only";
import { hub, SECONDARY_TIMEOUT_MS } from "@/lib/hub-api";
import { categoryCta, categoryDescription, categoryName, productName } from "@/lib/catalog-i18n";
import { primaryImage, usableCutout } from "@/lib/queries/products";
import { tr, type Lang } from "@/lib/i18n";
import type { Category, Product, ProductVariant } from "@/lib/types";

/**
 * THE HERO DECK, DECIDED ON THE SERVER, IN ONE PLACE (hero v3, owner
 * approvals 2026-09-26; comps in ~/Code/reference/hero-comps/slider-v3).
 *
 * Slide 1 is the gold film ALONE: no piece, no panel. Then one slide per Hub
 * category in the Hub's sort_order, each an image-led dark stage with up to
 * three pieces. The pieces are CHOSEN HERE, from the Hub's catalogue, on every
 * render (ISR 60 s, and the Hub's revalidation webhook): only an active piece
 * with a variant in stock, never a sold one. When a piece sells it drops out
 * of the next render and the next available piece takes its place; with fewer
 * than three in stock the slide shows only those. Slide 1 has no piece, so a
 * category's slide draws freely from its whole pool. There is no SKU in this
 * file and none may be added.
 *
 * Every figure is the Hub's: the name is the product page's (productName) and
 * the price is the in-stock variant's `price_jpy`, shown as sent. Nothing is
 * computed from a price (scripts/check-money.mjs).
 *
 * PHOTOS. Each piece carries its first Hub photo and, when the Hub has one
 * that may be shown, that photo's cut-out (`usableCutout`: status ok,
 * auto_fixed or approved). Without one the stage shows the WHOLE photo in a
 * framed well, never cropped. Nothing is processed here or in the browser.
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
   * (productName, lib/catalog-i18n): never shortened, reordered or stripped;
   * "750" stays 750 and "K18WG" stays K18WG (owner corrections 2026-09-26).
   */
  name: string;
  /** The in-stock variant's yen price, exactly as the Hub sent it. */
  priceJpy: number;
  /** The piece's first Hub photo, whole. */
  photo: { url: string; alt: string } | null;
  /** That photo's cut-out, only when the Hub marked it fit to show. */
  cutout: { url: string; width: number; height: number } | null;
  /** Accessories only: which Index row the piece belongs to (0–3, ACC_TYPES). */
  type: number | null;
};

/**
 * What a category slide's stage holds. `stage` is the dark stage with its gold
 * floor; `clock` stands the watches on the live Tokyo ruler; `index` adds the
 * approved accessories Index (and is the stage itself when nothing is in stock).
 */
export type HeroLayout = "stage" | "clock" | "index";

const LAYOUT: Record<string, HeroLayout> = {
  "preloved-watches": "clock",
  "preloved-designer-accessories": "index",
};

/**
 * Where the one orange action is "Reserve this piece" (for the featured
 * piece): the two lines whose pieces are reserved from the slide. Branded,
 * watches and accessories keep "Ask about availability", as approved. An
 * unknown category with pieces reserves; any slide without a piece asks.
 */
const ASKS = new Set(["preloved-branded-jewelry", "preloved-watches", "preloved-designer-accessories"]);

/** At most three pieces on a stage (owner approval 2026-09-26). */
const PIECES = 3;

/**
 * The Index rows of the accessories slide, in the approved order: 財布,
 * カードケース, ベルト, 小物レザー (lib/i18n heroAcc1–4). The Hub has no
 * accessory type yet (supabase/contracts/api.md proposes one), so a piece's
 * row is read from its Hub name; anything unrecognised is small leather.
 */
const ACC_TYPES: RegExp[] = [/wallet|財布|ウォレット/i, /card|カード/i, /belt|ベルト/i];
export function accessoryType(name: string): number {
  // Card before wallet: "card wallet" / "カードケース" is a cardholder.
  if (ACC_TYPES[1].test(name)) return 1;
  if (ACC_TYPES[0].test(name)) return 0;
  if (ACC_TYPES[2].test(name)) return 2;
  return 3;
}

export type HeroFilmSlide = { kind: "film"; key: "film"; name: string; short: string };
export type HeroCategorySlide = {
  kind: "category";
  key: string;
  slug: string;
  layout: HeroLayout;
  name: string;
  /**
   * The caller line above the title (owner-approved, lib/i18n "home.heroCaller*"),
   * chosen by slug here; a slug with no approved line gets the generic
   * 「カテゴリー」 / "Category".
   */
  caller: string;
  /** The name in the controls cluster: the Hub name without a leading "Preloved " / "プレラブド ". */
  short: string;
  description: string | null;
  cta: string;
  /** The orange action: reserve the featured piece, or ask about availability. */
  action: "reserve" | "ask";
  pieces: HeroPiece[];
  /** `index` only: in-stock pieces per Index row, counted over the whole category. */
  counts: number[] | null;
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

function piece(p: Product, v: ProductVariant, lang: Lang, layout: HeroLayout): HeroPiece {
  // The same first photo and the same name the product card shows.
  const img = primaryImage(p);
  const name = productName(p, lang);
  return {
    slug: p.slug,
    name,
    priceJpy: v.price_jpy,
    photo: img ? { url: img.url, alt: img.alt ?? name } : null,
    cutout: usableCutout(img),
    type: layout === "index" ? accessoryType(`${p.name} ${p.name_en ?? ""} ${p.name_ja ?? ""}`) : null,
  };
}

/** The available pieces of one category, in the Hub's order. */
function available(products: Product[], lang: Lang, layout: HeroLayout): HeroPiece[] {
  const out: HeroPiece[] = [];
  for (const p of products) {
    const v = inStockVariant(p);
    if (v) out.push(piece(p, v, lang, layout));
  }
  return out;
}

/** "Preloved Watches" → "Watches", "プレラブド ウォッチ" → "ウォッチ". A name without that prefix, or with nothing after it, is kept. */
export function segmentName(name: string): string {
  const m = name.match(/^(?:preloved|プレラブド)\s+(.+)$/i);
  // "Jewelry" alone would read as the fine jewelry line: keep the full name.
  return m && !/^(jewelry|ジュエリー)$/i.test(m[1]) ? m[1] : name;
}

/** The approved caller line for each category; anything else is "Category". */
function callerLine(slug: string, t: ReturnType<typeof tr>): string {
  switch (slug) {
    case "fine-jewelry": return t("home", "heroCallerFine");
    case "preloved-jewelry": return t("home", "heroPrelovedEyebrow");
    case "preloved-branded-jewelry": return t("home", "heroCallerBranded");
    case "preloved-watches": return t("home", "heroCallerWatches");
    case "preloved-designer-accessories": return t("home", "heroCallerAccessories");
    default: return t("home", "slideEyebrow");
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

export async function buildHeroDeck(lang: Lang, categories: Category[]): Promise<HeroSlide[]> {
  const t = tr(lang);
  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const layouts = sorted.map((c) => LAYOUT[c.slug] ?? "stage");
  // One read per category, in parallel, under the same 60 s cache the
  // category pages use (same URL, same entry). null = the read failed.
  const reads = await Promise.all(
    sorted.map((c) => within(hub.category(c.slug), SECONDARY_TIMEOUT_MS).then((r) => r?.products ?? [], () => null)),
  );
  const pools = reads.map((r, i) => (r ? available(r, lang, layouts[i]) : null));

  const hide = hideEmptyCategories();
  const slides: HeroSlide[] = [{ kind: "film", key: "film", name: t("home", "heroFilmName"), short: t("home", "heroFilmName") }];
  sorted.forEach((c, i) => {
    const pool = pools[i];
    // Hidden only when the switch is on AND the read answered AND nothing is available.
    if (hide && pool !== null && pool.length === 0) return;
    const layout = layouts[i];
    const name = categoryName(c, lang);
    // The stage is image-led: a piece with no Hub photo at all would stand as
    // an empty well, so it is left off the stage (it still counts in the
    // accessories Index, and it is still on its category page).
    const pieces = (pool ?? []).filter((p) => p.photo).slice(0, PIECES);
    let counts: number[] | null = null;
    if (layout === "index") {
      counts = [0, 0, 0, 0];
      for (const p of pool ?? []) counts[p.type ?? 3] += 1;
    }
    slides.push({
      kind: "category",
      key: c.slug,
      slug: c.slug,
      layout,
      name,
      short: segmentName(name),
      caller: callerLine(c.slug, t),
      description: categoryDescription(c, lang),
      cta: categoryCta(c, lang) ?? t("home", "slideShop", { name }),
      action: pieces.length && !ASKS.has(c.slug) ? "reserve" : "ask",
      pieces,
      counts,
    });
  });
  return slides;
}
