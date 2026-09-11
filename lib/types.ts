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

/** Phase 2 step 2 — cart, checkout and orders. */
export type OrderType = "SELF" | "GIFT" | "PROXY";
export type HubQuoteItem = { variant_id: string; product_id: string | null; sku: string | null; slug: string | null; name: string; qty: number; unit_price_jpy: number; line_total_jpy: number };
export type HubQuote = {
  quote_id: string;
  items: HubQuoteItem[];
  subtotal_jpy: number;
  /** null means we publish no rate for that country — ask, never ship free. */
  shipping_jpy: number | null;
  total_jpy: number;
  requires_manual_quote: boolean;
  /** false when the destination country has no complete bank/GCash details in the Hub. */
  transfer_available: boolean;
  order_type: OrderType;
  expires_at: string;
};
/**
 * Structured transfer details, built by the Hub from its own columns at request
 * time — so a correction an admin makes shows on the site with no deploy.
 * `null` anywhere in the chain means "no usable method for this country": the
 * page must say so, never fall back to placeholder prose.
 */
export type TransferBank = { name: string; branch: string | null; account_type: string | null; account_number: string; account_holder: string };
export type TransferGcash = { number: string; name: string };
export type TransferInstructions = {
  country: string;
  method_label_ja: string; method_label_en: string;
  bank: TransferBank | null;
  gcash: TransferGcash | null;
  note_ja: string | null; note_en: string | null;
  updated_at: string | null;
};
export type HubPayResult = { order_id: string; web_reference: string; total_jpy: number; transfer_due_at: string; transfer_instructions: TransferInstructions | null };
/** `status` is the Hub's cash_order_status; `payment_status` is the web-facing one. */
export type HubOrder = {
  id: string; web_reference: string | null; invoice_number: string | null;
  status: "pending" | "completed" | "cancelled" | "expired";
  payment_status: "pending_transfer" | "paid" | "failed" | "refunded" | "cancelled" | null;
  payment_method: string | null; order_type: OrderType | null; currency: string;
  total_amount: number; total_paid: number; remaining_balance: number; shipping_fee: number | null;
  transfer_due_at: string | null; recipient_name: string | null; gift_note: string | null;
  order_date: string | null; created_at: string; completed_at: string | null; cancelled_at: string | null;
  tracking_number: string | null; shipped_at: string | null;
  ship_to_address?: HubAddress | null;
};
export type HubOrderItem = { id: string; variant_id: string | null; product_id: string | null; title: string; sku: string | null; quantity: number; unit_price_jpy: number; line_total_jpy: number; image_url: string | null };
export type HubOrderDetail = { order: HubOrder; items: HubOrderItem[]; transfer_instructions: TransferInstructions | null };
/** The Hub answers checkout failures with a code, not an HTTP body we should guess at. */
export type HubCheckoutError = { error: string; variant_id?: string; available?: number };
