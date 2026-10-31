import type { Metadata } from "next";
import { siteOpenGraph } from "@/lib/og-meta";

/**
 * SEO STEP 2 (Master Plan §33.3): the two pure decisions behind a collection /
 * category page's ItemList and its OpenGraph image. Kept pure so the rules are
 * unit-tested; the pages only call them.
 */

/**
 * The slugs a listing page's ItemList names: exactly the pieces its grid renders
 * (CatalogSection is given the same `products` array, sold pieces included —
 * the grid shows them by default), in that array's order, each URL once. A blank
 * slug is skipped and a repeated one keeps its first place, so the positions run
 * 1..n over distinct URLs. The EmptyCatalog "available now" cards are not the
 * listing and are never passed here.
 *
 * Fewer than two pieces: no list (Google's summary-page ItemList needs at least
 * two entries, and one piece is not a list worth marking up).
 */
export function listingProductSlugs(products: readonly { slug?: string | null }[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of products) {
    const s = p.slug?.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out.length >= 2 ? out : [];
}

/**
 * The owner's own photo for a collection or category, as an OpenGraph image —
 * the Hub's `hero_media` and nothing else. Only an absolute https URL with a host
 * and no credentials qualifies. The bundled collection placeholders
 * (/images/collections/*.webp, relative) and the category stage's product
 * photos are deliberately NOT candidates: they are stand-ins, not the owner's
 * image of that collection. null means "use the brand image" (the file-based
 * app/opengraph-image.png the root already provides).
 */
export function heroOgImage(heroMedia: string | null | undefined): string | null {
  const raw = heroMedia?.trim();
  if (!raw || /\s/.test(raw)) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !u.hostname || u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * The `openGraph` block for a listing page WITH a hero image. A page-level
 * `openGraph` replaces the root layout's whole block, so the root's own fields
 * (website, site name, locale pair) are restated here rather than lost; og:title
 * and og:description still follow the page's <title> and description. `alt` is
 * the collection's visible name. Twitter's image follows from this one.
 * Returns undefined with no usable hero, so the brand-image fallback stays
 * exactly as it is today.
 */
export function listingOpenGraph(heroMedia: string | null | undefined, name: string, lang: "ja" | "en"): Metadata["openGraph"] | undefined {
  const url = heroOgImage(heroMedia);
  if (!url) return undefined;
  return {
    ...siteOpenGraph(lang),
    images: [{ url, alt: name }],
  };
}

/**
 * Spread this into a page's metadata, never assign `openGraph: undefined`:
 * Next treats a page-level `openGraph` KEY — even one whose value is undefined —
 * as replacing the root layout's whole block, which removes og:title,
 * og:description, og:site_name and the brand image from the page. With no hero
 * this returns {} so the page inherits exactly what it inherits today.
 */
export const ogFor = (og: Metadata["openGraph"] | undefined): { openGraph?: Metadata["openGraph"] } => (og ? { openGraph: og } : {});
