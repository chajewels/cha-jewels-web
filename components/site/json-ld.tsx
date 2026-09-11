import type { Product } from "@/lib/queries/products";
import { siteUrl } from "@/lib/site";
import { fromPrice, primaryImage } from "@/lib/queries/products";
type Props = { type: "store" } | { type: "product"; product: Product } | { type: "faq"; items: { q: string; a: string }[] };
export function JsonLd(props: Props) {
  const base = siteUrl();
  const data = props.type === "store"
    ? { "@context": "https://schema.org", "@type": "JewelryStore", name: "Cha Jewels", legalName: "Cha Jewels Co., Ltd.", url: base, address: { "@type": "PostalAddress", addressLocality: "Katsushika-ku", addressRegion: "Tokyo", addressCountry: "JP" }, areaServed: ["JP", "PH"], priceRange: "¥¥¥" }
    : props.type === "faq"
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: props.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) }
    : { "@context": "https://schema.org", "@type": "Product", name: props.product.name, sku: props.product.sku, image: primaryImage(props.product)?.url, material: props.product.karat ?? undefined, description: props.product.description_en ?? undefined,
        // A brand only when the Hub says the piece is branded. No countryOfOrigin
        // is ever emitted here — origin is a per-piece badge, not structured data.
        brand: props.product.origin === "BRAND" && props.product.brand?.trim() ? { "@type": "Brand", name: props.product.brand.trim() } : undefined,
        offers: { "@type": "Offer", price: fromPrice(props.product) ?? undefined, priceCurrency: "JPY",
          // Absent condition is New — matches ConditionBadge, which only renders for Preloved.
          itemCondition: props.product.condition === "Preloved" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
          availability: props.product.product_variants.some((v) => v.stock_qty > 0) ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${base}/products/${props.product.slug}` } };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
