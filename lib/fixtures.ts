import type { Collection, HubMe, HubOrder, HubOrderDetail, HubPayResult, HubQuote, HubQuoteItem, HubTier, LayawayQuote, LiveClaim, OrderType, Product, TransferInstructions } from "@/lib/types";
import { tiers as localTiers } from "@/lib/loyalty";
/** Local preview data. Active only when NEXT_PUBLIC_PREVIEW_FIXTURES=1. Never shipped to production. */
export const collections: Collection[] = [
  { id: "c1", slug: "necklaces", name: "Necklaces", hero_media: null, description: "Chains and strands in K18 and pearl, sized for daily wear." },
  { id: "c2", slug: "pendants", name: "Pendants", hero_media: null, description: "Diamond, pearl and gold pendants to hang on your own chain or ours." },
  { id: "c3", slug: "earrings", name: "Earrings", hero_media: null, description: "Hoops, studs and drops in K18 and platinum." },
  { id: "c4", slug: "bracelets", name: "Bracelets", hero_media: null, description: "Bangles and chain bracelets, weight stated on every piece." },
  { id: "c5", slug: "rings", name: "Rings", hero_media: null, description: "Solitaires, bands and statement rings, resizable in Japan." },
  { id: "c6", slug: "anklets", name: "Anklets", hero_media: null, description: "Fine K18 anklets for everyday wear." },
]; 
const mk = (i: number, name: string, karat: Product["karat"], w: number, jpy: number, stone: string | null, col: string): Product & { col: string } => ({
  id: `p${i}`, sku: `CJ-${1000 + i}`, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, karat, weight_g: w, status: "active", col,
  // Rings are the preloved line in preview data; everything else is New.
  condition: col === "rings" ? "Preloved" : "New",
  description_en: `${name}. ${karat} ${stone ? "with " + stone + ", " : ""}crafted in Japan and priced by weight.`, description_ja: null, description_tl: null,
  product_variants: [{ id: `v${i}`, size: null, stone, price_jpy: jpy, price_php: Math.round(jpy * 0.39), stock_qty: i % 5 === 0 ? 0 : 3, product_media: [] }],
});
export const products = [
  mk(1, "Double-sided diamond pendant", "PT900", 16.9, 1480000, "2.62 ct diamonds", "pendants"),
  mk(2, "Kihei chain 50 cm", "K18", 20.4, 398000, null, "necklaces"),
  mk(3, "Twist bangle", "K18", 12.1, 236000, null, "bracelets"),
  mk(4, "Akoya strand 7.5 mm", "K18", 4.2, 168000, "Akoya pearls", "earrings"),
  mk(5, "Solitaire ring", "PT950", 3.8, 312000, "0.5 ct diamond", "rings"),
  mk(6, "Hoop earrings", "K18", 5.6, 118000, null, "necklaces"),
  mk(7, "Baby bangle", "K18", 6.3, 124000, null, "bracelets"),
  mk(8, "Freshwater drop earrings", "K18", 3.1, 62000, "freshwater pearls", "earrings"),
];
export const claims: LiveClaim[] = [{ id: "l1", code: "CJ-4821", price_locked: 236000, status: "held", expires_at: new Date(Date.now() + 36e5 * 6).toISOString(), product_variant_id: "v3" }];
export function quote(price: number, term: number, currency: "JPY" | "PHP"): LayawayQuote {
  const threshold = currency === "PHP" ? 300000 * 0.39 : 300000;
  const max = price >= threshold ? 8 : 6;
  const t = Math.min(Math.max(term, 3), max);
  const dp = Math.round(price * 0.3);
  return { down_payment: dp, monthly: Math.round((price - dp) / t), term_months: t, total: price, max_term_months: max, currency };
}
export const tiers: HubTier[] = localTiers.map((t) => ({ slug: t.slug, name: t.name, threshold_jpy: t.thresholdJpy, requalify_spend: t.requalifyJpy, multiplier: t.multiplier, hold_minutes: t.holdMinutes, benefits_ja: t.perks.ja, benefits_en: t.perks.en }));

/** Preview-mode account data. Obvious placeholders — never real customer data. */
export const meFixture: HubMe = {
  customer: { id: "cust-fixture", customer_code: "CJ-2026-00008", full_name: "Preview Customer", email: "preview@example.com", mobile_number: null },
  addresses: [{ id: "addr-1", label: "home", recipient_name: "Preview Customer", line1: "1-2-3 Tateishi", city: "Katsushika-ku", region: "Tokyo", postal_code: "124-0012", country: "JP", phone: null, is_default: true }],
  loyalty: { enrolled: true, points: 1200, tier: "Glimmer", multiplier: 1 },
  saved_card: false,
};

/**
 * Preview-mode checkout. Lets the Vercel preview walk the whole flow with no
 * Hub behind it. Prices are made up; the deadline is a real 72 hours out so the
 * countdown copy renders the way it will in production.
 */
const FIXTURE_ORDER_ID = "order-fixture";
const FIXTURE_REFERENCE = "CJ-W-000001";
// Obviously fake account values — this fixture only ever renders in preview
// mode, and a realistic-looking account number is exactly what must never
// appear on a page. Real details live only in the Hub.
const fixtureInstructions: TransferInstructions = {
  country: "JP",
  method_label_ja: "銀行振込",
  method_label_en: "Bank transfer",
  bank: {
    name: "PREVIEW BANK (not a real bank)",
    branch: "PREVIEW BRANCH",
    account_type: "普通",
    account_number: "0000000",
    account_holder: "PREVIEW ACCOUNT",
  },
  gcash: null,
  note_ja: "【プレビュー表示】実際のお振込先はHubで管理されています。",
  note_en: "[Preview] Real transfer details are managed in the Hub.",
  updated_at: null,
};

export function quoteFixture(body: { items: { variant_id: string; qty: number }[]; order_type: OrderType }): HubQuote {
  const items: HubQuoteItem[] = body.items.map((line) => {
    const product = products.find((p) => p.product_variants.some((v) => v.id === line.variant_id)) ?? products[0];
    const unit = product.product_variants[0].price_jpy;
    return {
      variant_id: line.variant_id, product_id: product.id, sku: product.sku, slug: product.slug,
      name: product.name, qty: line.qty, unit_price_jpy: unit, line_total_jpy: unit * line.qty,
    };
  });
  const subtotal = items.reduce((n, i) => n + i.line_total_jpy, 0);
  const shipping = subtotal >= 50000 ? 0 : 800;
  return {
    quote_id: "quote-fixture", items, subtotal_jpy: subtotal, shipping_jpy: shipping,
    total_jpy: subtotal + shipping, requires_manual_quote: false, transfer_available: true,
    order_type: body.order_type,
    expires_at: new Date(Date.now() + 30 * 60e3).toISOString(),
  };
}

export function payFixture(): HubPayResult {
  return {
    order_id: FIXTURE_ORDER_ID, web_reference: FIXTURE_REFERENCE, total_jpy: 236800,
    transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
    transfer_instructions: fixtureInstructions,
  };
}

export const ordersFixture: HubOrder[] = [{
  id: FIXTURE_ORDER_ID, web_reference: FIXTURE_REFERENCE, invoice_number: "900001",
  status: "pending", payment_status: "pending_transfer", payment_method: "transfer",
  order_type: "SELF", currency: "JPY", total_amount: 236800, total_paid: 0,
  remaining_balance: 236800, shipping_fee: 800,
  transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
  recipient_name: null, gift_note: null, order_date: new Date().toISOString().slice(0, 10),
  created_at: new Date().toISOString(), completed_at: null, cancelled_at: null,
  tracking_number: null, shipped_at: null,
}];

export function orderFixture(id: string): HubOrderDetail | null {
  const order = ordersFixture.find((o) => o.id === id);
  if (!order) return null;
  return {
    order: { ...order, ship_to_address: meFixture.addresses[0] },
    items: [{
      id: "item-1", variant_id: "v3", product_id: "3", title: "Twist bangle",
      sku: "CJ-0003", quantity: 1, unit_price_jpy: 236000, line_total_jpy: 236000, image_url: null,
    }],
    transfer_instructions: fixtureInstructions,
  };
}
