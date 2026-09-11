export type { Metal as Karat } from "./metals";
export type ProductStatus = "draft" | "active" | "archived";
export type ProductMedia = { url: string; alt: string | null; sort: number };
export type ProductVariant = { id: string; size: string | null; stone: string | null; price_jpy: number; price_php?: number | null; stock_qty: number; product_media: ProductMedia[] };
export type Condition = "New" | "Preloved";
/** `condition` is optional so fixtures and any pre-condition Hub response still typecheck; absent is treated as New. */
export type Product = { id: string; sku: string; slug: string; name: string; karat: string | null; weight_g: number | null; description_en: string | null; description_ja: string | null; description_tl: string | null; status: ProductStatus; condition?: Condition; product_variants: ProductVariant[] };
export type Collection = { id: string; slug: string; name: string; hero_media: string | null; description: string | null };
export type LiveClaim = { id: string; code: string; price_locked: number; status: "held" | "paid" | "layaway" | "expired" | "released"; expires_at: string; product_variant_id: string };
export type LayawayQuote = { down_payment: number; monthly: number; term_months: number; total: number; max_term_months: number; currency: "JPY" | "PHP" };
export type HubTier = { slug: string; name: string; threshold_jpy: number; requalify_spend: number | null; multiplier: number | null; hold_minutes: number; benefits_ja: string[]; benefits_en: string[] };
export type FxRate = { jpy_php: number; as_of: string };

/** Phase 2 step 1 — customer account. */
export type HubCustomer = { id: string; customer_code: string | null; full_name: string | null; email: string | null; mobile_number: string | null };
export type HubAddress = { id?: string; label?: string | null; recipient_name?: string | null; line1: string; line2?: string | null; city?: string | null; region?: string | null; postal_code?: string | null; country?: string | null; phone?: string | null; is_default?: boolean };
export type HubLoyalty = { enrolled: boolean; points: number; tier: string | null; multiplier: number | null };
export type HubMe = { customer: HubCustomer; addresses: HubAddress[]; loyalty: HubLoyalty; saved_card: boolean };
