export type Karat = "K18" | "PT900" | "PT950";
export type ProductStatus = "draft" | "active" | "archived";
export type ProductMedia = { url: string; alt: string | null; sort: number };
export type ProductVariant = { id: string; size: string | null; stone: string | null; price_jpy: number; price_php: number | null; stock_qty: number; product_media: ProductMedia[] };
export type Product = { id: string; sku: string; slug: string; name: string; karat: Karat | null; weight_g: number | null; description_en: string | null; description_ja: string | null; description_tl: string | null; status: ProductStatus; product_variants: ProductVariant[] };
export type Collection = { id: string; slug: string; name: string; hero_media: string | null; description: string | null };
export type LiveClaim = { id: string; code: string; price_locked: number; status: "held" | "paid" | "layaway" | "expired" | "released"; expires_at: string; product_variant_id: string };
export type LayawayQuote = { down_payment: number; monthly: number; term_months: number; total: number; max_term_months: number; currency: "JPY" | "PHP" };
