import type { Metadata } from "next";
import { localeAlternates } from "@/lib/locale-meta";
import { siteUrl } from "@/lib/site";
import { BRAND_OG_IMAGE, siteOpenGraph } from "@/lib/og-meta";
import type { Lang } from "@/lib/i18n";

export { BRAND_OG_IMAGE };

/**
 * OG-PRODUCT (docs/seo/OUTSTANDING-ISSUES-REGISTER.md §5): a product page's
 * OpenGraph block, complete.
 *
 * WHY IT IS RESTATED IN FULL. A page-level `openGraph` object REPLACES the root
 * layout's whole block (Next merges metadata shallowly), so the old
 * `openGraph: img ? { images: [url] } : undefined` kept the product's own title,
 * description and image but lost the site name, the page type, the locale pair
 * and og:url — and, with no photo, erased every OpenGraph tag. Collection and
 * category pages got the same repair in Step 2 (lib/listing-seo.ts).
 *
 * TYPE. "website", the value the whole site already declares. Next's installed
 * OpenGraph types (15.5) have no product type, and "article"/"book"/"profile"
 * would say something untrue about a jewellery listing.
 *
 * og:title and og:description are NOT restated: Next derives them from the page's
 * own <title> and description (they stay equal to those, as before). Twitter's
 * title, description and image follow from this block, as before.
 *
 * URL. og:url is NOT set here (register R-37, closed 2026-11-01). The locale
 * wrapper (lib/locale-meta.ts localizedMeta → localeOpenGraph) adds og:url from
 * the canonical it writes, so on /en and /ja product pages the two are one
 * value by construction, exactly as before. The bare legacy page renders only
 * in rollback mode (SEO_LEGACY_REDIRECTS=off), where <SeoLinks /> already emits
 * the bare og:url; setting a locale URL here as well gave that page TWO og:url
 * values. `productCanonicalUrl` stays for callers that need the canonical.
 *
 * NO PHOTO. Checked in a build: an explicit `openGraph` block with no `images`
 * key does NOT get the brand image (the file-based app/opengraph-image.png only
 * fills the slot when the page sets no `openGraph` at all), and the Twitter card
 * falls back to "summary" with no image. So the fallback names the brand image
 * itself: the same 1200x630 PNG and alt the root layout emits, at its stable
 * route /opengraph-image.png (the hash the root adds is only a cache-buster).
 * A photo with no usable URL counts as no photo: an empty og:image is worse than
 * the brand image. A product that has a photo never gets another image.
 */
export function productCanonicalUrl(lang: Lang, slug: string): string {
  return String(localeAlternates(lang, `/products/${slug}`).alternates?.canonical);
}

/** The product's primary photo URL when it is a usable string, else null. */
export function productOgImageUrl(image: { url?: unknown } | null | undefined): string | null {
  const url = typeof image?.url === "string" ? image.url.trim() : "";
  return url || null;
}

export function productOpenGraph(args: { name: string; lang: Lang; slug: string; imageUrl: string | null }): NonNullable<Metadata["openGraph"]> {
  const { name, lang, slug, imageUrl } = args;
  void slug; // the URL is the locale wrapper's (see above); the slug stays in the signature for the callers and the tests
  return {
    ...siteOpenGraph(lang),
    images: imageUrl
      ? [{ url: imageUrl, alt: name }]
      : [{ url: `${siteUrl()}${BRAND_OG_IMAGE.path}`, width: BRAND_OG_IMAGE.width, height: BRAND_OG_IMAGE.height, type: BRAND_OG_IMAGE.type, alt: BRAND_OG_IMAGE.alt }],
  };
}
