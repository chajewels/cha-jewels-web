import type { Product } from "@/lib/queries/products";
import { productAvailability } from "@/lib/availability";
import { siteUrl } from "@/lib/site";
import { allImages, fromPrice } from "@/lib/queries/products";
import { metalsLabel, productMetals } from "@/lib/metals";
/**
 * `post` is a BlogPosting for one editorial page. `image` is absolute because a
 * relative one is not resolvable by a crawler reading the JSON on its own, and
 * `inLanguage` is stated because the same slug is published in two languages
 * from one URL — the toggle decides which, and a crawler should be told which
 * it was served rather than left to guess from the prose.
 */
type PostLd = { slug: string; title: string; excerpt: string; date: string; cover: string | null; lang: "ja" | "en" };
type Props = { type: "store" } | { type: "product"; product: Product } | { type: "faq"; items: { q: string; a: string }[] } | { type: "post"; post: PostLd };
export function JsonLd(props: Props) {
  const base = siteUrl();
  const data = props.type === "store"
    ? { "@context": "https://schema.org", "@type": "JewelryStore", name: "Cha Jewels", legalName: "Cha Jewels Co., Ltd.", url: base, address: { "@type": "PostalAddress", addressLocality: "Katsushika-ku", addressRegion: "Tokyo", addressCountry: "JP" }, areaServed: ["JP", "PH"], priceRange: "¥¥¥" }
    : props.type === "post"
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: props.post.title,
        description: props.post.excerpt || undefined,
        datePublished: props.post.date,
        inLanguage: props.post.lang === "ja" ? "ja-JP" : "en",
        image: props.post.cover ? [new URL(props.post.cover, base).toString()] : undefined,
        mainEntityOfPage: { "@type": "WebPage", "@id": `${base}/blog/${props.post.slug}` },
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
          availability: productAvailability(props.product) === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${base}/products/${props.product.slug}` } };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
