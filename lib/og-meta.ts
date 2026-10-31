import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import type { Lang } from "@/lib/i18n";

/**
 * THE SITE-WIDE SHARE IDENTITY, IN ONE PLACE (SEO foundation batch).
 *
 * WHY THIS FILE EXISTS. Next merges metadata shallowly: a page that sets its own
 * `openGraph` REPLACES the root layout's whole block (docs: "Merging"), and the
 * root's file-based app/opengraph-image.png is attached only when no page-level
 * `openGraph` exists. Three places restated the root's fields by hand
 * (lib/product-seo.ts, lib/listing-seo.ts, app/blog/[slug]/page.tsx) and the
 * root layout declared them a fourth time. The locale tree (/en/*, /ja/*) had no
 * og:url at all, because <SeoLinks /> — which renders it for the legacy paths —
 * deliberately emits nothing under a locale prefix. This module is the one
 * definition the root layout and the locale wrapper both read.
 */

/** The approved brand share image (app/opengraph-image.png, 1200x630, alt in app/opengraph-image.alt.txt). */
export const BRAND_OG_IMAGE = { path: "/opengraph-image.png", width: 1200, height: 630, type: "image/png", alt: "Cha Jewels" } as const;

/**
 * The owner's Facebook App ID (developers.facebook.com, "Test"; owner request
 * 2026-10-01 — the value <SeoLinks /> has always rendered). It only ties shares
 * of this site to that app for Facebook's Insights and clears the Sharing
 * Debugger's "missing fb:app_id" warning; it changes nothing in how a link
 * previews. An App ID is public by design (it is in every Facebook SDK call).
 * NOT a new identifier: restoring it on the locale tree reuses this approved
 * value, and it is emitted from exactly one place (the root layout's
 * `facebook.appId`), so no page can carry two.
 */
export const FACEBOOK_APP_ID = "812262777044447";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The root layout's own OpenGraph fields — type, site name and the locale pair. */
export function siteOpenGraph(lang: Lang): OpenGraph {
  return {
    type: "website",
    siteName: "Cha Jewels",
    locale: lang === "ja" ? "ja_JP" : "en_US",
    alternateLocale: [lang === "ja" ? "en_US" : "ja_JP"],
  };
}

/** The only part of the resolved parent block this module reads: its images. */
type ParentOpenGraph = { images?: unknown } | null | undefined;

/**
 * A locale page's OpenGraph block: the page's own (if it has one) plus `og:url`.
 *
 * `url` is the page's canonical, passed in by the caller from the same function
 * that writes the canonical (localeAlternates), so the two cannot differ; it
 * carries no query and no fragment because the canonical never does.
 *
 *  - The page set its own block (product, blog post, listing with a hero): keep
 *    every field it set, restate any site-wide field it left out, add the url.
 *  - The page set none (home, About, FAQ, legal, guides, …): it used to inherit
 *    the root's block, whose image was the file-based brand image. Setting a
 *    block now would drop that image, so the image is taken from the RESOLVED
 *    PARENT metadata — byte for byte what the page showed before, including
 *    Next's content-hash cache-buster — and only if the parent carries none is
 *    the brand image named by its stable route (the product fallback's rule).
 *
 * og:title and og:description are deliberately not restated: Next derives them
 * from the page's own <title> and description, as before.
 */
export function localeOpenGraph(args: { own?: Metadata["openGraph"] | null; parent?: ParentOpenGraph; lang: Lang; url: string }): OpenGraph {
  const { own, parent, lang, url } = args;
  const site = siteOpenGraph(lang);
  if (own) return { ...site, ...own, url } as OpenGraph;
  const inherited = parent?.images;
  const images = (Array.isArray(inherited) ? (inherited.length > 0 ? inherited : null) : inherited ? [inherited] : null) as OpenGraph["images"] | null;
  return {
    ...site,
    url,
    images: images ?? [{ url: `${siteUrl()}${BRAND_OG_IMAGE.path}`, width: BRAND_OG_IMAGE.width, height: BRAND_OG_IMAGE.height, type: BRAND_OG_IMAGE.type, alt: BRAND_OG_IMAGE.alt }],
  } as OpenGraph;
}
