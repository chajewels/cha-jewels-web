import type { Collection, HubMe, HubOrder, HubOrderDetail, HubPayResult, HubQuote, HubQuoteItem, HubTier, LayawayQuote, LiveClaim, OrderType, Product, TransferMethod } from "@/lib/types";
import { tiers as localTiers } from "@/lib/loyalty";
/** Local preview data. Active only when NEXT_PUBLIC_PREVIEW_FIXTURES=1. Never shipped to production. */
export const collections: Collection[] = [
  { id: "c1", slug: "necklaces", name: "Necklaces", name_ja: "ネックレス", hero_media: null, description: "Chains and strands in K18 and pearl, sized for daily wear.", description_ja: "K18とパールのチェーン・ネックレス。毎日身につけやすい長さでご用意しています。" },
  { id: "c2", slug: "pendants", name: "Pendants", name_ja: "ペンダント", hero_media: null, description: "Diamond, pearl and gold pendants to hang on your own chain or ours.", description_ja: "ダイヤモンド、パール、ゴールドのペンダント。お手持ちのチェーンにも、当店のチェーンにも。" },
  { id: "c3", slug: "earrings", name: "Earrings", name_ja: "ピアス・イヤリング", hero_media: null, description: "Hoops, studs and drops in K18 and platinum.", description_ja: "K18とプラチナのフープ、スタッド、ドロップタイプ。" },
  { id: "c4", slug: "bracelets", name: "Bracelets", name_ja: "ブレスレット", hero_media: null, description: "Bangles and chain bracelets, weight stated on every piece.", description_ja: "バングルとチェーンブレスレット。すべての商品に重量を表示しています。" },
  { id: "c5", slug: "rings", name: "Rings", name_ja: "リング", hero_media: null, description: "Solitaires, bands and statement rings, resizable in Japan.", description_ja: "ソリティア、バンド、ステートメントリング。日本国内でサイズ直しを承ります。" },
  { id: "c6", slug: "anklets", name: "Anklets", name_ja: "アンクレット", hero_media: null, description: "Fine K18 anklets for everyday wear.", description_ja: "毎日身につけられる華奢なK18アンクレット。" },
  // One type without Japanese yet: the site must fall back to English, not blank.
  { id: "c7", slug: "sets", name: "Sets", name_ja: null, hero_media: null, description: "Matched pieces sold together at a set price.", description_ja: null },
]; 
const mk = (i: number, name: string, karat: Product["karat"], w: number, jpy: number, stone: string | null, col: string, name_ja: string | null = null): Product & { col: string } => ({
  id: `p${i}`, sku: `CJ-${1000 + i}`, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, name_en: name, name_ja, karat, metals: karat ? [karat] : [], weight_g: w, status: "active", col,
  // Rings are the preloved line in preview data; everything else is New.
  condition: col === "rings" ? "Preloved" : "New",
  description_en: `${name}. ${karat} ${stone ? "with " + stone + ", " : ""}hallmark checked in Japan and priced by weight.`, description_ja: null, description_tl: null,
  // Preview origins: p2 is confirmed Japanese, p3 is a branded piece, the rest
  // are UNKNOWN — so the preview exercises every OriginBadge branch honestly.
  origin: i === 2 ? "JAPAN" : i === 3 ? "BRAND" : "UNKNOWN",
  brand: i === 3 ? "Tiffany & Co." : null,
  product_variants: [{ id: `v${i}`, size: null, stone, price_jpy: jpy, price_php: Math.round(jpy * 0.39), stock_qty: i % 5 === 0 ? 0 : 3, product_media: [] }],
});
export const products = [
  mk(1, "Double-sided diamond pendant", "PT900", 16.9, 1480000, "2.62 ct diamonds", "pendants", "両面ダイヤモンドペンダント"),
  mk(2, "Kihei chain 50 cm", "K18", 20.4, 398000, null, "necklaces", "喜平チェーン 50 cm"),
  mk(3, "Twist bangle", "K18", 12.1, 236000, null, "bracelets", "ツイストバングル"),
  mk(4, "Akoya strand 7.5 mm", "K18", 4.2, 168000, "Akoya pearls", "earrings", "あこや真珠 7.5 mm"),
  // No Japanese name yet — the card must show the English one.
  mk(5, "Solitaire ring", "PT950", 3.8, 312000, "0.5 ct diamond", "rings"),
  mk(6, "Hoop earrings", "K18", 5.6, 118000, null, "necklaces"),
  mk(7, "Baby bangle", "K18", 6.3, 124000, null, "bracelets"),
  mk(8, "Freshwater drop earrings", "K18", 3.1, 62000, "freshwater pearls", "earrings"),
];
// Preview-only photos and a two-stamp piece, so the gallery and "PT900 / K18"
// can be seen without the Hub. The SVGs live in public/fixtures/.
products[0].metals = ["PT900", "K18"];
products[0].product_variants[0].product_media = [1, 2, 3].map((n) => ({ url: `/fixtures/pendant-${n}.svg`, alt: `Double-sided diamond pendant, photo ${n}`, sort: n - 1 }));
products[1].product_variants[0].product_media = [{ url: "/fixtures/chain-1.svg", alt: null, sort: 0 }];
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
  loyalty: { enrolled: true, points: 1200, tier: "Glimmer", multiplier: 1, reduced: true, earned_tier: "Radiant", regain_jpy: 397418 },
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
/**
 * Obviously fake, and deliberately so: these exist to prove the layout renders
 * two methods in order, never to stand in for an account. Real details live
 * only in the Hub and reach the site through the API.
 */
const fixtureMethods: TransferMethod[] = [
  {
    id: "fixture-bank",
    method_type: "bank",
    label_ja: "銀行振込",
    label_en: "Bank transfer",
    bank: {
      name: "PREVIEW BANK (not a real bank)",
      branch: "PREVIEW BRANCH",
      account_type: "普通",
      account_number: "0000000",
      account_holder: "PREVIEW ACCOUNT",
    },
    wallet: null,
    note_ja: "【プレビュー表示】実際のお振込先はHubで管理されています。",
    note_en: "[Preview] Real transfer details are managed in the Hub.",
  },
  {
    id: "fixture-wallet",
    method_type: "gcash",
    label_ja: "GCash",
    label_en: "GCash",
    bank: null,
    wallet: { number: "0000 000 0000", name: "PREVIEW WALLET" },
    note_ja: null,
    note_en: null,
  },
];

export function quoteFixture(body: { items: { variant_id: string; qty: number }[]; order_type: OrderType }): HubQuote {
  const items: HubQuoteItem[] = body.items.map((line) => {
    const product = products.find((p) => p.product_variants.some((v) => v.id === line.variant_id)) ?? products[0];
    const unit = product.product_variants[0].price_jpy;
    return {
      variant_id: line.variant_id, product_id: product.id, sku: product.sku, slug: product.slug,
      name: product.name, name_en: product.name, name_ja: product.name_ja ?? null,
      qty: line.qty, unit_price_jpy: unit, line_total_jpy: unit * line.qty,
    };
  });
  const subtotal = items.reduce((n, i) => n + i.line_total_jpy, 0);
  const shipping = subtotal >= 50000 ? 0 : 800;
  return {
    quote_id: "quote-fixture", items, subtotal_jpy: subtotal, shipping_jpy: shipping,
    total_jpy: subtotal + shipping, requires_manual_quote: false,
    transfer_region: "JP", transfer_methods: fixtureMethods, transfer_available: true,
    order_type: body.order_type,
    expires_at: new Date(Date.now() + 30 * 60e3).toISOString(),
  };
}

export function payFixture(): HubPayResult {
  return {
    order_id: FIXTURE_ORDER_ID, web_reference: FIXTURE_REFERENCE, total_jpy: 236800,
    transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
    transfer_region: "JP", transfer_methods: fixtureMethods,
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
  cancellation_reason: null, refund_status: null, refund_note: null, expired_at: null,
}];

export function orderFixture(id: string): HubOrderDetail | null {
  const order = ordersFixture.find((o) => o.id === id);
  if (!order) return null;
  return {
    order: { ...order, ship_to_address: meFixture.addresses[0] },
    items: [{
      id: "item-1", variant_id: "v3", product_id: "3", title: "Twist bangle", title_ja: "ツイストバングル",
      sku: "CJ-0003", quantity: 1, unit_price_jpy: 236000, line_total_jpy: 236000, image_url: null,
    }],
    transfer_region: "JP", transfer_methods: fixtureMethods,
  };
}
