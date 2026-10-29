import type { Product } from "@/lib/queries/products";
import { productAvailability } from "@/lib/availability";
import { COMPANY_NAME, COMPANY_PHONE } from "@/lib/content/legal";
import { allImages, fromPrice } from "@/lib/queries/products";
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
 */
export type PostLd = { slug: string; title: string; excerpt: string; date: string; cover: string | null; lang: "ja" | "en" };
export type Crumb = { name: string; path: string };
/**
 * The store's owner-editable contact facts, read by the home page from the
 * Hub (lib/settings.ts) and passed in: `email` is contactEmail() or null,
 * `sameAs` the hrefs of the public social row (follow()). Both are omitted from
 * the output when absent — nothing here is a fallback. Only http(s) hrefs
 * become `sameAs`: the row also carries mailto: links, which are not profiles.
 */
export type StoreLd = { email?: string | null; sameAs?: string[] };
export type JsonLdProps =
  | ({ type: "store" } & StoreLd)
  | { type: "product"; product: Product }
  | { type: "faq"; items: { q: string; a: string }[] }
  | { type: "post"; post: PostLd }
  | { type: "breadcrumb"; items: Crumb[] };

const pageLanguage = (prefix: string) => (prefix === "/ja" ? "ja-JP" : "en");
const crumbUrl = (base: string, prefix: string, path: string) => (path === "/" ? `${base}${prefix}` : `${base}${prefix}${path}`);
/** "03-6657-6129" → "+81-3-6657-6129": the domestic trunk 0 becomes the country code. */
const e164Jp = (domestic: string) => `+81-${domestic.replace(/^0/, "")}`;
const isWebUrl = (href: string) => /^https?:\/\//.test(href);

export function buildJsonLd(props: JsonLdProps, base: string, prefix: "" | "/en" | "/ja" = ""): object {
  return props.type === "breadcrumb"
    ? { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: props.items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: crumbUrl(base, prefix, c.path) })) }
    : props.type === "store"
    ? { "@context": "https://schema.org", "@type": "JewelryStore", name: "Cha Jewels", legalName: COMPANY_NAME, url: `${base}${prefix}`,
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
        ...(props.sameAs?.some(isWebUrl) ? { sameAs: props.sameAs.filter(isWebUrl) } : {}) }
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
    : { "@context": "https://schema.org", "@type": "Product", name: props.product.name, sku: props.product.sku, image: allImages(props.product).map((m) => m.url), material: productMetals(props.product).length ? metalsLabel(productMetals(props.product), "en") : undefined, description: props.product.description_en ?? undefined,
        // A brand only when the Hub says the piece is branded. No countryOfOrigin
        // is ever emitted here — origin is a per-piece badge, not structured data.
        brand: props.product.origin === "BRAND" && props.product.brand?.trim() ? { "@type": "Brand", name: props.product.brand.trim() } : undefined,
        offers: { "@type": "Offer", price: fromPrice(props.product) ?? undefined, priceCurrency: "JPY",
          // Absent condition is New — matches ConditionBadge, which only renders for Preloved.
          itemCondition: props.product.condition === "Preloved" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
          // The same status the page shows (lib/availability.ts): in stock, or
          // SoldOut. There is no held/BackOrder state (owner decision 2026-09-23).
          availability: productAvailability(props.product) === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${base}${prefix}/products/${props.product.slug}` },
        ...(prefix ? { inLanguage: pageLanguage(prefix) } : {}) };
}
