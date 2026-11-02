import type { Product } from "@/lib/queries/products";
import { variantAvailability } from "@/lib/availability";
import { COMPANY_NAME, COMPANY_PHONE } from "@/lib/content/legal";
import { allImages } from "@/lib/queries/products";
import { metalsLabel, productMetals } from "@/lib/metals";

/**
 * THE JSON-LD BUILDER, pure (Phase 2B design H). Extracted from
 * components/site/json-ld.tsx so the structured data can be unit-tested — the
 * component is JSX, which the test harness cannot import, and that gap (X4,
 * partially) is what this closes. The component renders what this returns.
 *
 * `prefix` is the page's locale prefix: "" on a legacy page, "/en" or "/ja" on
 * a locale page. Every URL in the data carries it, so `url`, `@id` and
 * `offers.url` equal the page's own canonical URL (never a bare legacy URL from
 * a locale page, never a locale URL from a legacy page). `inLanguage` is added
 * to the store and product ONLY on a locale page: a legacy page's output must
 * stay byte-identical (C0/H0), and key order is insertion order, so nothing
 * here may be reordered and new fields go behind a `prefix` guard. The known
 * X5 caveat stands: a product's `description` field is `description_en` even
 * on a Japanese page until Phase 4; `inLanguage` describes the page.
 *
 * `post` is a BlogPosting for one editorial page. `image` is absolute because a
 * relative one is not resolvable by a crawler reading the JSON on its own, and
 * `inLanguage` is stated because the same slug is published per language — a
 * crawler should be told which it was served rather than left to guess.
 *
 * `breadcrumb` (Phase 4, master plan §8) is a BreadcrumbList that MIRRORS THE
 * PAGE'S VISIBLE TRAIL: the caller passes the same names it renders and each
 * crumb's BARE path ("/collections/rings", never a locale-prefixed href); the
 * builder makes them absolute with the page's own prefix, so a trail on /en
 * points at /en pages and a legacy page's at legacy ones. A path of "/" is the
 * locale home (`${base}${prefix}`, or the bare origin on a legacy page).
 *
 * `itemlist` (SEO Step 2) is the ItemList of a collection or category page: one
 * ListItem per piece the page's grid shows, in the grid's order, with only the
 * position and the piece's own canonical URL (`${base}${prefix}/products/slug`,
 * the same URL as its Product offer). No name, price, availability or rating:
 * each product page already carries those in its own Product markup, and
 * repeating them here would be a second copy to keep true. The caller passes the
 * slugs from `listingProductSlugs` (lib/listing-seo.ts).
 */
export type PostLd = { slug: string; title: string; excerpt: string; date: string; cover: string | null; lang: "ja" | "en" };
export type Crumb = { name: string; path: string };
/**
 * The store's owner-editable contact facts, read by the home page from the
 * Hub (lib/settings.ts) and passed in: `email` is contactEmail() or null,
 * `sameAs` the hrefs of the public social row (follow()). Both are omitted from
 * the output when absent — nothing here is a fallback. Only http(s) PROFILE
 * hrefs become `sameAs` (`isProfileUrl`): the row also carries mailto: links
 * and chat entry points (m.me), which are not profiles.
 */
export type StoreLd = { email?: string | null; sameAs?: string[] };
/**
 * The reviews THE PAGE SHOWS (Phase 4 §7): the product page passes the Hub's
 * count and average and the approved reviews it renders, only when it renders
 * them; otherwise null, and the Product carries no rating at all. The builder
 * emits aggregateRating only when count > 0 and the average is a number, and
 * one Review per review passed — never computed, never padded.
 */
export type ReviewLd = { display_name: string; rating: number; body: string | null; approved_at: string };
export type ProductRatingLd = { count: number; average: number | null; reviews: ReviewLd[] };
export type JsonLdProps =
  | ({ type: "store" } & StoreLd)
  | { type: "product"; product: Product; rating?: ProductRatingLd | null }
  | { type: "faq"; items: { q: string; a: string }[] }
  | { type: "post"; post: PostLd }
  | { type: "breadcrumb"; items: Crumb[] }
  | { type: "itemlist"; slugs: string[] };

/** The variant the product page renders: the first one (app/products/[slug]/page.tsx), or null for a product with none. */
export const displayedVariant = (p: Pick<Product, "product_variants">) => p.product_variants?.[0] ?? null;
const pageLanguage = (prefix: string) => (prefix === "/ja" ? "ja-JP" : "en");
const crumbUrl = (base: string, prefix: string, path: string) => (path === "/" ? `${base}${prefix}` : `${base}${prefix}${path}`);
/** "03-6657-6129" → "+81-3-6657-6129": the domestic trunk 0 becomes the country code. */
const e164Jp = (domestic: string) => `+81-${domestic.replace(/^0/, "")}`;
/**
 * WHICH SOCIAL-ROW LINKS ARE `sameAs` PROFILES (BUG-02, 2026-10-29). schema.org
 * `sameAs` names a page that unambiguously identifies the business — a social
 * profile. A CHAT entry point (Messenger `m.me/…`, `messenger.com/t/…`, WhatsApp
 * `wa.me` / `api.whatsapp.com`, LINE `line.me/ti/…`, Telegram `t.me`, Viber) is a
 * conversation URL, not an identity page, so it does not belong in `sameAs`
 * (Google's Rich Results Test does not report it as an error; the exclusion
 * is about meaning, not validation). Those links stay in the visible footer
 * and the Messenger button; only this structured-data field drops them.
 * mailto: links were already out. This is a filter of KNOWN chat endpoints,
 * not a validator of social-profile URLs: an http(s) URL on any other host
 * passes through unchanged.
 */
const CHAT_HOSTS = /^(?:www\.)?(?:m\.me|messenger\.com|wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|line\.me|lin\.ee|t\.me|telegram\.me|viber\.com)$/i;
export function isProfileUrl(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return !CHAT_HOSTS.test(new URL(href).hostname);
  } catch {
    return false;
  }
}

export function buildJsonLd(props: JsonLdProps, base: string, prefix: "" | "/en" | "/ja" = ""): object {
  return props.type === "itemlist"
    ? { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: props.slugs.length, itemListElement: props.slugs.map((slug, i) => ({ "@type": "ListItem", position: i + 1, url: `${base}${prefix}/products/${slug}` })) }
    : props.type === "breadcrumb"
    ? { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: props.items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: crumbUrl(base, prefix, c.path) })) }
    // OnlineStore (DP-05, owner-approved 2026-11-02; phase-4/STRUCTURED-DATA-REVIEW §1): the business is online-only (OD-GBP-1 = No).
    // The address is the registered mailing address; NO openingHours, geo, hasMap or any visitable-shop claim.
    : props.type === "store"
    ? { "@context": "https://schema.org", "@type": "OnlineStore", name: "Cha Jewels", legalName: COMPANY_NAME, url: `${base}${prefix}`,
        // Phase 4 (§16): the full registered address — the same parts
        // COMPANY_ADDRESS.en prints, appended behind the three original keys so
        // the legacy output only grows (C0/H0: never reordered).
        address: { "@type": "PostalAddress", addressLocality: "Katsushika-ku", addressRegion: "Tokyo", addressCountry: "JP", streetAddress: "6-5-1 Tateishi, Time Mansion 301", postalCode: "124-0012" },
        areaServed: ["JP", "PH"], priceRange: "¥¥¥", ...(prefix ? { inLanguage: pageLanguage(prefix) } : {}),
        // Phase 4 (§16), appended: the badge logo as an absolute URL (a static
        // asset, so never locale-prefixed); the office line in E.164 from the one
        // place the digits live; email and sameAs only when the Hub answered.
        // No openingHours: the site publishes customer-service hours, not shop
        // hours, and the two are not the same claim.
        logo: `${base}/images/brand/logo-badge-512.webp`, telephone: e164Jp(COMPANY_PHONE.office),
        ...(props.email ? { email: props.email } : {}),
        ...(props.sameAs?.some(isProfileUrl) ? { sameAs: props.sameAs.filter(isProfileUrl) } : {}) }
    : props.type === "post"
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: props.post.title,
        description: props.post.excerpt || undefined,
        datePublished: props.post.date,
        inLanguage: props.post.lang === "ja" ? "ja-JP" : "en",
        image: props.post.cover ? [new URL(props.post.cover, base).toString()] : undefined,
        mainEntityOfPage: { "@type": "WebPage", "@id": `${base}${prefix}/blog/${props.post.slug}` },
        author: { "@type": "Organization", name: "Cha Jewels" },
        publisher: { "@type": "Organization", name: "Cha Jewels" },
      }
    : props.type === "faq"
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: props.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) }
    : { "@context": "https://schema.org", "@type": "Product", name: props.product.name, sku: props.product.sku, image: allImages(props.product).map((m) => m.url), material: productMetals(props.product).length ? metalsLabel(productMetals(props.product), "en") : undefined,
        // X5 (Phase 4): the Japanese page describes the piece in Japanese when
        // the Hub has that text; otherwise, and on every other page, English.
        description: (prefix === "/ja" && props.product.description_ja?.trim() ? props.product.description_ja : props.product.description_en) ?? undefined,
        // A brand only when the Hub says the piece is branded. No countryOfOrigin
        // is ever emitted here — origin is a per-piece badge, not structured data.
        brand: props.product.origin === "BRAND" && props.product.brand?.trim() ? { "@type": "Brand", name: props.product.brand.trim() } : undefined,
        // THE OFFER IS THE ONE THE PAGE SHOWS (structured-data review, 2026-11-01;
        // CLAUDE.md governance §11: structured data reflects visible content).
        // The product page renders exactly one variant, `product_variants[0]`
        // (app/products/[slug]/page.tsx: its price, its stock state, its size
        // and stone), so the Offer describes that variant: its price (the Hub's
        // `price_jpy`, the sale price while on sale — the figure printed in the
        // price band) and its availability through the SAME `variantAvailability`
        // call the buy buttons use. It used to be the LOWEST variant price with
        // the WHOLE product's availability, which could name a price and a
        // state the page does not show on a multi-variant piece. No arithmetic,
        // no fallback figure: a product with no variant has no price (the page
        // shows it as sold) and says SoldOut.
        offers: { "@type": "Offer", price: displayedVariant(props.product)?.price_jpy ?? undefined, priceCurrency: "JPY",
          // Absent condition is New — matches ConditionBadge, which only renders for Preloved.
          itemCondition: props.product.condition === "Preloved" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
          // The same status the page shows (lib/availability.ts): in stock, or
          // SoldOut. There is no held/BackOrder state (owner decision 2026-09-23).
          availability: variantAvailability(displayedVariant(props.product), props.product.status) === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${base}${prefix}/products/${props.product.slug}` },
        ...(prefix ? { inLanguage: pageLanguage(prefix) } : {}),
        // Phase 4 (§7): only what the page shows. The Hub's count and average
        // (the figures ReviewSummary prints), and one Review per card rendered.
        ...(props.rating && props.rating.count > 0 && typeof props.rating.average === "number"
          ? { aggregateRating: { "@type": "AggregateRating", ratingValue: props.rating.average, reviewCount: props.rating.count },
              ...(props.rating.reviews.length
                ? { review: props.rating.reviews.map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.display_name }, reviewRating: { "@type": "Rating", ratingValue: r.rating }, ...(r.body ? { reviewBody: r.body } : {}), datePublished: r.approved_at })) }
                : {}) }
          : {}) };
}
