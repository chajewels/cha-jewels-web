import type { Product } from "@/lib/queries/products";
import { siteUrl } from "@/lib/site";
import { fromPrice, primaryImage } from "@/lib/queries/products";
type Props = { type: "store" } | { type: "product"; product: Product; region: "JP" | "PH" };
export function JsonLd(props: Props) {
  const base = siteUrl();
  const data = props.type === "store"
    ? { "@context": "https://schema.org", "@type": "JewelryStore", name: "Cha Jewels", legalName: "Cha Jewels Co., Ltd.", url: base, address: { "@type": "PostalAddress", addressLocality: "Katsushika-ku", addressRegion: "Tokyo", addressCountry: "JP" }, areaServed: ["JP", "PH"], priceRange: "¥¥¥" }
    : { "@context": "https://schema.org", "@type": "Product", name: props.product.name, sku: props.product.sku, image: primaryImage(props.product)?.url, material: props.product.karat ?? undefined, description: props.product.description_en ?? undefined,
        offers: { "@type": "Offer", price: fromPrice(props.product, props.region) ?? undefined, priceCurrency: props.region === "PH" ? "PHP" : "JPY", availability: props.product.product_variants.some((v) => v.stock_qty > 0) ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${base}/products/${props.product.slug}` } };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
