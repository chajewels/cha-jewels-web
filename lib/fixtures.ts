import type { Category, CheckoutMode, Collection, HubLayawayDetail, HubLayawayPayResult, HubLayawayPlan, HubLayawayScheduleRow, HubMe, HubOrder, HubOrderDetail, HubPayResult, HubQuote, HubQuoteItem, HubTier, LayawayQuote, LayawayScheduleRow, LayawayTerm, OrderType, Product, ServiceRequest, ServiceRequestInput, SettlementCurrency, SiteSettings, HubFaqSection, HubPost, TransferMethod } from "@/lib/types";
import { tiers as localTiers } from "@/lib/loyalty";
import { faqSections } from "@/lib/content/faq";
import { blocksToMarkdown, sectionSlug } from "@/lib/content/faq-markdown";
/** Local preview data. Active only when NEXT_PUBLIC_PREVIEW_FIXTURES=1. Never shipped to production. */
/**
 * RESERVE FIRST (Hub A2) in preview. `NEXT_PUBLIC_PREVIEW_RESERVATION=1`, with
 * fixtures on, plays the Hub with `web_reservation_mode` switched ON: the quote
 * comes back with `reservation_mode`, checkout lands on a reservation, and the
 * account gains one reserved order and one reserved plan. Unset, every fixture
 * is exactly what it was — the switch-off world.
 */
const PREVIEW_RESERVATION = process.env.NEXT_PUBLIC_PREVIEW_RESERVATION === "1";
const RESERVED_ORDER_ID = "order-reserved";
const RESERVED_ORDER_REFERENCE = "CJ-W-000003";
const RESERVED_PLAN_ID = "plan-reserved";
const RESERVED_PLAN_REFERENCE = "CJ-W-900004";

/** Plans in `layawayPlansFixture`, stated here because `meFixture` is declared first. */
const layawayPlansFixtureCount = 7;
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
  // Category membership mirrors that: the preloved ring sits under the preloved
  // line, the branded piece under the branded one, the rest under fine jewelry.
  category_slugs: col === "rings" ? ["preloved-jewelry"] : i === 3 ? ["preloved-branded-jewelry"] : ["fine-jewelry"],
  description_en: `${name}. ${karat} ${stone ? "with " + stone + ", " : ""}hallmark checked in Japan and priced by weight.`, description_ja: null, description_tl: null,
  // Preview origins: p2 is confirmed Japanese, p3 is a branded piece, the rest
  // are UNKNOWN — so the preview exercises every OriginBadge branch honestly.
  origin: i === 2 ? "JAPAN" : i === 3 ? "BRAND" : "UNKNOWN",
  brand: i === 3 ? "Tiffany & Co." : null,
  product_variants: [{ id: `v${i}`, size: null, stone, price_jpy: jpy, price_php: Math.round(jpy * 0.39), stock_qty: i % 5 === 0 ? 0 : 3, product_media: [] }],
});
/**
 * Preview categories, in sort_order. hero_media is null throughout so the
 * preview exercises the placeholder path (lib/category-placeholders.ts) — the
 * Hub's own media always wins over it, and that branch is covered the moment a
 * real category carries a photo.
 */
export const categories: Category[] = [
  { id: "cat1", slug: "fine-jewelry", name: "Fine Jewelry", name_ja: "ファインジュエリー", description: "K18 gold, pearls and diamonds, hallmark checked in Japan and priced by weight.", description_ja: "K18ゴールド、パール、ダイヤモンド。日本で刻印を確認し、重量に基づいた価格でご案内します。", hero_media: null, cta_label: "Shop fine jewelry", cta_label_ja: "ファインジュエリーを見る", sort_order: 1 },
  { id: "cat2", slug: "preloved-jewelry", name: "Preloved Jewelry", name_ja: "プレラブドジュエリー", description: "Carefully chosen second-hand pieces, each one checked before it is offered.", description_ja: "丁寧に選んだ中古ジュエリー。一点ずつ確認したうえでご紹介しています。", hero_media: null, cta_label: "Shop preloved", cta_label_ja: "プレラブドを見る", sort_order: 2 },
  { id: "cat3", slug: "preloved-branded-jewelry", name: "Preloved Branded Jewelry", name_ja: "プレラブド ブランドジュエリー", description: "Pieces from iconic houses, with the brand stated and the origin left to the listing.", description_ja: "著名ブランドのジュエリー。ブランド名を明記し、由来は各商品ページに記載しています。", hero_media: null, cta_label: "Shop branded", cta_label_ja: "ブランドジュエリーを見る", sort_order: 3 },
  { id: "cat4", slug: "preloved-watches", name: "Preloved Watches", name_ja: "プレラブドウォッチ", description: "Second-hand watches, movement and condition described on every listing.", description_ja: "中古時計。ムーブメントと状態を各商品ページに記載しています。", hero_media: null, cta_label: "Shop watches", cta_label_ja: "ウォッチを見る", sort_order: 4 },
  { id: "cat5", slug: "preloved-designer-accessories", name: "Preloved Designer Accessories", name_ja: "プレラブド デザイナーアクセサリー", description: "Bags and small leather goods from the houses our customers ask for.", description_ja: "お客様からご要望の多いブランドのバッグや革小物。", hero_media: null, cta_label: "Shop accessories", cta_label_ja: "アクセサリーを見る", sort_order: 5 },
];
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
/**
 * The calculator's preview answer, in the shape the real SQL function returns:
 * the configured terms with this amount's eligibility already decided, the
 * Hub's floor-and-remainder rounding, and the downgrade flag a write path
 * refuses on. Keeping the shape honest here is what stops preview mode from
 * hiding a field the production page depends on.
 */
export function quote(price: number, term: number, currency: "JPY" | "PHP"): LayawayQuote {
  const rate = currency === "PHP" ? 0.39 : 1;
  const terms: LayawayTerm[] = PLAN_MINIMUMS.map(([months, minJpy]) => ({
    months, label: `${months} Months`,
    min_amount: Math.round(minJpy * rate),
    dp_percentage: 0.3,
    eligible: price >= Math.round(minJpy * rate),
  }));
  const eligible = terms.filter((t) => t.eligible);
  const wanted = eligible.find((t) => t.months === term);
  const chosen = wanted ?? eligible[eligible.length - 1] ?? terms[0];
  const max = eligible.length ? eligible[eligible.length - 1].months : 3;
  const dp = Math.round(price * 0.3);
  const base = Math.floor((price - dp) / chosen.months);
  const remainder = price - dp - base * chosen.months;
  return {
    down_payment: dp, monthly: base, last_month: base + remainder,
    term_months: chosen.months, total: price, max_term_months: max, currency,
    allowed_terms: terms,
    requested_term_months: term,
    term_downgraded: chosen.months !== term,
  };
}

/** plan_configurations as it stands: months and the yen minimum. */
const PLAN_MINIMUMS: [number, number][] = [[3, 0], [6, 25000], [8, 300000], [10, 600000], [12, 1000000]];
export const tiers: HubTier[] = localTiers.map((t) => ({ slug: t.slug, name: t.name, threshold_jpy: t.thresholdJpy, requalify_spend: t.requalifyJpy, multiplier: t.multiplier, hold_minutes: t.holdMinutes, benefits_ja: t.perks.ja, benefits_en: t.perks.en }));

/** Preview-mode account data. Obvious placeholders — never real customer data. */
export const meFixture: HubMe = {
  customer: { id: "cust-fixture", customer_code: "CJ-2026-00008", full_name: "Preview Customer", email: "preview@example.com", mobile_number: null },
  addresses: [{ id: "addr-1", label: "home", recipient_name: "Preview Customer", line1: "1-2-3 Tateishi", city: "Katsushika-ku", region: "Tokyo", postal_code: "124-0012", country: "JP", phone: null, is_default: true }],
  loyalty: { enrolled: true, points: 1200, tier: "Glimmer", multiplier: 1, reduced: true, earned_tier: "Radiant", regain_jpy: 397418 },
  saved_card: false,
  records: { layaway: layawayPlansFixtureCount, orders: 1 },
  shares_email: false,
  portal_url: "https://portal.chajewelsjp.com/portal",
};

/**
 * The blank-record case, which is the one that used to render as an empty page:
 * a customer whose sign-in reached a record carrying nothing, while a second
 * record holds the same email. Reachable in preview at /account?fixture=blank.
 */
export const meBlankFixture: HubMe = {
  ...meFixture,
  customer: { ...meFixture.customer, full_name: "Preview Twin", customer_code: "CJ-2026-06256" },
  records: { layaway: 0, orders: 0 },
  shares_email: true,
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

export function quoteFixture(body: { items: { variant_id: string; qty: number }[]; order_type: OrderType; mode?: CheckoutMode; term_months?: number; settlement_currency?: SettlementCurrency }): HubQuote {
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
  const total = subtotal + shipping;
  const mode: CheckoutMode = body.mode ?? "full";
  const settlement: SettlementCurrency = body.settlement_currency ?? "JPY";
  const rate = settlement === "PHP" ? 0.39 : null;
  const inSettlement = (jpy: number) => (rate === null ? jpy : Math.round(jpy * rate));
  return {
    quote_id: "quote-fixture",
    // Reserved on the Hub at quote time for a layaway; nothing for full payment.
    invoice_number: mode === "layaway" ? "900123" : null,
    web_reference: mode === "layaway" ? "CJ-W-900123" : null,
    items, subtotal_jpy: subtotal, shipping_jpy: shipping,
    total_jpy: total, requires_manual_quote: false,
    // In reservation mode the Hub withholds the methods and says why.
    transfer_region: "JP", transfer_methods: PREVIEW_RESERVATION ? [] : fixtureMethods, transfer_available: true,
    ...(PREVIEW_RESERVATION ? { reservation_mode: true } : {}),
    order_type: body.order_type,
    expires_at: new Date(Date.now() + 30 * 60e3).toISOString(),
    // Preview shows the FIRST-ORDER deadline, because that is the case the copy
    // used to get wrong. A returning customer gets 72 from the live Hub.
    deposit_deadline_hours: 24,
    mode,
    settlement_currency: settlement,
    fx_rate: rate,
    fx_rate_date: rate === null ? null : "2026-09-08",
    // Shipping is converted and the subtotal is the remainder, so the parts
    // always sum to the settlement total exactly — the same rule the Hub uses.
    shipping_settlement: inSettlement(shipping),
    total_settlement: inSettlement(total),
    subtotal_settlement: inSettlement(total) - inSettlement(shipping),
    layaway: mode === "layaway" ? layawayPlanOf(inSettlement(total), body.term_months ?? 6) : null,
  };
}

/** The same floor-and-remainder rule the Hub uses, so preview figures add up. */
function layawayPlanOf(total: number, termMonths: number) {
  const term = fixtureTerms.some((t) => t.months === termMonths && t.eligible) ? termMonths : 3;
  const deposit = Math.round(total * 0.3);
  const base = Math.floor((total - deposit) / term);
  const remainder = total - deposit - base * term;
  const start = new Date();
  const schedule: LayawayScheduleRow[] = Array.from({ length: term }, (_, i) => {
    const due = new Date(start);
    due.setMonth(due.getMonth() + i + 1);
    return {
      installment_number: i + 1,
      due_date: due.toISOString().slice(0, 10),
      amount: base + (i === term - 1 ? remainder : 0),
    };
  });
  return { term_months: term, deposit, monthly: base, last_month: base + remainder, schedule, allowed_terms: fixtureTerms };
}

const fixtureTerms: LayawayTerm[] = [
  { months: 3, label: "3 Months", min_amount: 0, dp_percentage: 0.3, eligible: true },
  { months: 6, label: "6 Months", min_amount: 25000, dp_percentage: 0.3, eligible: true },
  { months: 8, label: "8 Months", min_amount: 300000, dp_percentage: 0.3, eligible: false },
  { months: 10, label: "10 Months", min_amount: 600000, dp_percentage: 0.3, eligible: false },
  { months: 12, label: "12 Months", min_amount: 1000000, dp_percentage: 0.3, eligible: false },
];

export function payFixture(): HubPayResult {
  if (PREVIEW_RESERVATION) {
    return {
      reservation_mode: true, awaiting_confirmation: true,
      order_id: RESERVED_ORDER_ID, web_reference: RESERVED_ORDER_REFERENCE, currency: "JPY", total: 236800, total_jpy: 236800,
      transfer_due_at: null, transfer_region: "JP", transfer_methods: [],
    };
  }
  return {
    order_id: FIXTURE_ORDER_ID, web_reference: FIXTURE_REFERENCE, currency: "JPY", total: 236800, total_jpy: 236800,
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
  // Confirmed (with the switch off, the Hub stamps every web order confirmed at
  // creation): this is also what a reservation looks like after staff confirm
  // it — bank details and the deadline on the order page.
  awaiting_confirmation: false, ready_for_payment: true,
},
  // The ended states, added 2026-09-15 so the badge-versus-caption rule on this
  // page can actually be LOOKED at. Before this there was one pending order in
  // the fixture set, so no closed order had ever been rendered here.
  hubOrder({
    id: "order-cancelled", invoice: "19502", status: "cancelled", payment: "cancelled",
    currency: "PHP", total: 84200,
    cancelled: true, reason: "Customer asked to cancel before the transfer arrived.",
    refund: "no_refund",
  }),
  hubOrder({
    id: "order-refunded", invoice: "19488", status: "completed", payment: "refunded",
    currency: "JPY", total: 152300,
    cancelled: true, reason: "Piece arrived damaged in transit.", refund: "refund_issued",
  }),
  // Paid and not yet shipped: nothing due, so the page keeps its usual order
  // and no "How to pay" card leads it (2026-09-24).
  hubOrder({ id: "order-paid", invoice: "19520", status: "pending", payment: "paid", currency: "JPY", total: 112400, paid: true }),
  hubOrder({ id: "order-expired", invoice: "19477", status: "expired", payment: null, currency: "JPY", total: 68900 }),
  // A web order settled in pesos (2026-09-25), confirmed and awaiting the
  // transfer: ₱ total and shipping, its yen lines listed without a price.
  // 236,800 yen at 0.39, half-up; shipping 800 yen converted on its own.
  {
    id: "order-peso", web_reference: "CJ-W-000005", invoice_number: "900005",
    status: "pending", payment_status: "pending_transfer", payment_method: "transfer",
    order_type: "SELF", currency: "PHP", total_amount: 92352, total_paid: 0,
    remaining_balance: 92352, shipping_fee: 312,
    transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
    recipient_name: null, gift_note: null, order_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(), completed_at: null, cancelled_at: null,
    tracking_number: null, shipped_at: null, source_channel: "web",
    cancellation_reason: null, refund_status: null, refund_note: null, expired_at: null,
    awaiting_confirmation: false, ready_for_payment: true,
  },
  // THE LATENT CONTRADICTION THIS FIX CLOSES: shipped, then cancelled. With
  // shipped_at tested first, this row showed a gold "Shipped" badge directly
  // above its own cancellation reason and refund decision. No live order is in
  // this state (0 rows), which is exactly why it needed a fixture.
  hubOrder({
    id: "order-shipped-then-cancelled", invoice: "19461", status: "cancelled", payment: "cancelled",
    currency: "JPY", total: 98400, shipped: true,
    cancelled: true, reason: "Returned to us and cancelled after dispatch.", refund: "store_credit_issued",
  }),
  // A reservation staff have not confirmed: held, no deadline, no methods.
  ...(PREVIEW_RESERVATION ? [{
    id: RESERVED_ORDER_ID, web_reference: RESERVED_ORDER_REFERENCE, invoice_number: "900003",
    status: "pending" as const, payment_status: "awaiting_confirmation" as const, payment_method: "transfer",
    order_type: "SELF" as const, currency: "JPY" as const, total_amount: 236800, total_paid: 0,
    remaining_balance: 236800, shipping_fee: 800, transfer_due_at: null,
    recipient_name: null, gift_note: null, order_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(), completed_at: null, cancelled_at: null,
    tracking_number: null, shipped_at: null, source_channel: "web",
    cancellation_reason: null, refund_status: null, refund_note: null, expired_at: null,
    awaiting_confirmation: true, ready_for_payment: false,
  }] : []),
];

/** An order in whatever state the Hub has it. Web fields left null as the Hub leaves them. */
function hubOrder(o: {
  id: string; invoice: string; status: HubOrder["status"]; payment: HubOrder["payment_status"];
  currency: SettlementCurrency; total: number;
  shipped?: boolean; cancelled?: boolean; reason?: string; refund?: HubOrder["refund_status"];
  paid?: boolean;
}): HubOrder {
  const day = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
  return {
    id: o.id, web_reference: null, invoice_number: o.invoice,
    status: o.status, payment_status: o.payment, payment_method: "transfer",
    order_type: "SELF", currency: o.currency, total_amount: o.total, total_paid: o.paid ? o.total : 0,
    remaining_balance: o.paid ? 0 : o.total, shipping_fee: null, transfer_due_at: null,
    recipient_name: null, gift_note: null, order_date: day(30).slice(0, 10),
    created_at: day(30), completed_at: null,
    cancelled_at: o.cancelled ? day(3) : null,
    tracking_number: o.shipped ? "JP1234567890" : null,
    shipped_at: o.shipped ? day(10) : null,
    cancellation_reason: o.reason ?? null,
    refund_status: o.refund ?? null,
    refund_note: null,
    expired_at: o.status === "expired" ? day(2) : null,
    // Every one of these is ended or settled: nothing awaits, nothing to pay.
    awaiting_confirmation: false, ready_for_payment: false,
  };
}

export function orderFixture(id: string): HubOrderDetail | null {
  const order = ordersFixture.find((o) => o.id === id);
  if (!order) return null;
  return {
    order: { ...order, ship_to_address: meFixture.addresses[0] },
    items: [{
      id: "item-1", variant_id: "v3", product_id: "3", title: "Twist bangle", title_ja: "ツイストバングル",
      sku: "CJ-0003", quantity: 1, unit_price_jpy: 236000, line_total_jpy: 236000, image_url: null,
    }],
    // The Hub's own rule: methods only while the transfer is outstanding and
    // never before staff confirm the piece.
    transfer_region: order.currency === "PHP" ? "OVERSEAS" : "JP",
    transfer_methods: order.payment_status === "pending_transfer" && order.ready_for_payment !== false ? fixtureMethods : [],
  };
}

/** Phase 2 step 4 — layaway preview data. */
const FIXTURE_PLAN_ID = "plan-fixture";
const FIXTURE_PLAN_REFERENCE = "CJ-W-900002";
const fixturePlanTotal = 236800;
const fixturePlanDeposit = Math.round(fixturePlanTotal * 0.3);
const fixturePlanTerm = 6;
const fixturePlanBase = Math.floor((fixturePlanTotal - fixturePlanDeposit) / fixturePlanTerm);
const fixturePlanRemainder = fixturePlanTotal - fixturePlanDeposit - fixturePlanBase * fixturePlanTerm;

function fixtureDueDate(monthsAhead: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toISOString().slice(0, 10);
}

export function layawayPayFixture(): HubLayawayPayResult {
  if (PREVIEW_RESERVATION) {
    return {
      mode: "layaway", reservation_mode: true, awaiting_confirmation: true,
      account_id: RESERVED_PLAN_ID, web_reference: RESERVED_PLAN_REFERENCE,
      currency: "JPY", total: fixturePlanTotal, deposit: fixturePlanDeposit, term_months: fixturePlanTerm,
      // Re-dated by the Hub at confirmation, so none is sent before it.
      schedule: [], transfer_due_at: null, transfer_region: "JP", transfer_methods: [],
    };
  }
  return {
    mode: "layaway",
    account_id: FIXTURE_PLAN_ID,
    web_reference: FIXTURE_PLAN_REFERENCE,
    currency: "JPY",
    total: fixturePlanTotal,
    deposit: fixturePlanDeposit,
    term_months: fixturePlanTerm,
    schedule: Array.from({ length: fixturePlanTerm }, (_, i) => ({
      installment_number: i + 1,
      due_date: fixtureDueDate(i + 1),
      amount: fixturePlanBase + (i === fixturePlanTerm - 1 ? fixturePlanRemainder : 0),
    })),
    transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
    transfer_region: "JP",
    transfer_methods: fixtureMethods,
  };
}

/**
 * A plan arranged with Cha Jewels directly, in whatever state the Hub has it.
 *
 * Modelled on the live data rather than invented: no item lines (0 of 1,448
 * Hub plans carry any), a real currency split (792 of them are in pesos), and
 * a positive remaining_balance on the closed ones, which is what the Hub
 * actually stores and what makes the labelling on this page matter.
 */
function hubPlan(o: {
  id: string; invoice: string; status: string; currency: SettlementCurrency;
  total: number; paid: number; remaining: number; months: number;
}): HubLayawayPlan {
  return {
    id: o.id, web_reference: null, invoice_number: o.invoice,
    status: o.status, currency: o.currency,
    total_amount: o.total, total_paid: o.paid, remaining_balance: o.remaining,
    downpayment_amount: Math.round(o.total * 0.3), payment_plan_months: o.months,
    shipping_fee: null, order_date: fixtureDueDate(-o.months), end_date: fixtureDueDate(0),
    transfer_due_at: null, settlement_due_at: null, expired_at: null,
    created_at: new Date(Date.now() - 200 * 864e5).toISOString(),
    completed_at: o.status === "completed" ? new Date(Date.now() - 20 * 864e5).toISOString() : null,
    tracking_number: null, shipped_at: null,
    source_channel: "hub_manual",
    // Never a reservation: the Hub checks the channel first.
    awaiting_confirmation: false,
    ready_for_payment: ["active", "overdue", "extension_active", "reactivated"].includes(o.status),
  };
}

export const layawayPlansFixture: HubLayawayPlan[] = [{
  id: FIXTURE_PLAN_ID, web_reference: FIXTURE_PLAN_REFERENCE, invoice_number: "900002",
  status: "active", currency: "JPY", total_amount: fixturePlanTotal, total_paid: 0,
  remaining_balance: fixturePlanTotal, downpayment_amount: fixturePlanDeposit,
  payment_plan_months: fixturePlanTerm, shipping_fee: 800,
  order_date: new Date().toISOString().slice(0, 10), end_date: fixtureDueDate(fixturePlanTerm),
  transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
  settlement_due_at: null, expired_at: null,
  created_at: new Date().toISOString(), completed_at: null,
  tracking_number: null, shipped_at: null,
  source_channel: "web",
  // Confirmed — the switch-off shape, and a reservation after staff confirm.
  awaiting_confirmation: false, ready_for_payment: true,
},
  // A reservation staff have not confirmed: active in the Hub, but no deposit
  // deadline, no methods, and a schedule still dated from checkout.
  ...(PREVIEW_RESERVATION ? [{
    id: RESERVED_PLAN_ID, web_reference: RESERVED_PLAN_REFERENCE, invoice_number: "900004",
    status: "active", currency: "JPY" as const, total_amount: fixturePlanTotal, total_paid: 0,
    remaining_balance: fixturePlanTotal, downpayment_amount: fixturePlanDeposit,
    payment_plan_months: fixturePlanTerm, shipping_fee: 800,
    order_date: new Date().toISOString().slice(0, 10), end_date: fixtureDueDate(fixturePlanTerm),
    transfer_due_at: null, settlement_due_at: null, expired_at: null,
    created_at: new Date().toISOString(), completed_at: null,
    tracking_number: null, shipped_at: null,
    source_channel: "web",
    awaiting_confirmation: true, ready_for_payment: false,
  }] : []),
  // EVERY state a Hub plan reaches that a web plan never did. Figures are taken
  // from the real extremes so the layout is checked against them.
  //
  // `cancelled` and `final_forfeited` were added 2026-09-15: without them the
  // closed set could not actually be rendered, so two of the five closed states
  // had never been looked at. Every closed state now has a row.
  hubPlan({ id: "hub-active", invoice: "19311", status: "active", currency: "PHP", total: 523712, paid: 209484, remaining: 314228, months: 6 }),
  hubPlan({ id: "hub-overdue", invoice: "19207", status: "overdue", currency: "JPY", total: 73780, paid: 26314, remaining: 47466, months: 6 }),
  hubPlan({ id: "hub-extension", invoice: "19188", status: "extension_active", currency: "JPY", total: 92035, paid: 73628, remaining: 18407, months: 6 }),
  hubPlan({ id: "hub-forfeited", invoice: "18904", status: "forfeited", currency: "PHP", total: 612300, paid: 133744, remaining: 478556, months: 10 }),
  hubPlan({ id: "hub-final-forfeited", invoice: "18760", status: "final_forfeited", currency: "JPY", total: 128400, paid: 32100, remaining: 96300, months: 8 }),
  hubPlan({ id: "hub-settlement", invoice: "18877", status: "final_settlement", currency: "JPY", total: 64200, paid: 45634, remaining: 18566, months: 8 }),
  hubPlan({ id: "hub-cancelled", invoice: "18655", status: "cancelled", currency: "PHP", total: 41500, paid: 0, remaining: 41500, months: 6 }),
  // THE ROW THIS FIX EXISTS FOR. Paid off and closed: remaining_balance is
  // exactly 0, and 902 of the 954 closed real plans look like this. Before the
  // fix it rendered "Paid in full" above "Unpaid when it closed ₱0".
  hubPlan({ id: "hub-completed", invoice: "18102", status: "completed", currency: "PHP", total: 83311, paid: 83311, remaining: 0, months: 3 }),
  // Paid MORE than the total, which the Hub floors to remaining 0 — TEST-004
  // really did take ₱17,500 against a ₱15,000 plan. Same branch as above, kept
  // separate so an overpaid plan is never silently assumed to match.
  hubPlan({ id: "hub-overpaid", invoice: "18044", status: "completed", currency: "PHP", total: 15000, paid: 17500, remaining: 0, months: 3 }),
];

export function layawayPlanFixture(id: string): HubLayawayDetail | null {
  const plan = layawayPlansFixture.find((p) => p.id === id);
  if (!plan) return null;

  // A Hub-arranged plan: no item lines, a schedule part paid, and a portal link
  // rather than a payment form.
  if (plan.source_channel !== "web") {
    const closed = ["completed", "forfeited", "final_forfeited", "final_settlement", "cancelled"].includes(plan.status);
    const per = Math.round((plan.total_amount - plan.downpayment_amount) / plan.payment_plan_months);
    const paidRows = Math.min(plan.payment_plan_months, Math.floor(plan.total_paid / Math.max(per, 1)));
    return {
      plan,
      schedule: Array.from({ length: plan.payment_plan_months }, (_, i) => {
        const done = i < paidRows;
        // Forfeiture cancels the unpaid rows; settlement leaves them overdue.
        const state = done ? "paid"
          : plan.status === "forfeited" ? "cancelled"
          : plan.status === "completed" ? "paid"
          : i === paidRows ? "overdue" : "pending";
        return {
          id: `${plan.id}-row-${i + 1}`, installment_number: i + 1, due_date: fixtureDueDate(i + 1 - plan.payment_plan_months),
          base_installment_amount: per, penalty_amount: state === "overdue" ? 1000 : 0, carried_amount: 0,
          total_due_amount: per, allocated: done ? per : 0, actual_remaining: done ? 0 : per,
          computed_status: state as HubLayawayScheduleRow["computed_status"],
        };
      }),
      items: [],
      payments: paidRows > 0
        ? [{ id: `${plan.id}-p1`, amount_paid: plan.total_paid, currency: plan.currency, date_paid: fixtureDueDate(-1), payment_method: "Bank transfer", reference_number: null, created_at: new Date().toISOString() }]
        : [],
      pending_submissions: [],
      deposit_paid: plan.total_paid > 0,
      transfer_region: plan.currency === "PHP" ? "OVERSEAS" : "JP",
      transfer_methods: closed ? [] : fixtureMethods,
      portal_url: "https://portal.chajewelsjp.com/portal",
    };
  }

  return {
    plan,
    schedule: Array.from({ length: fixturePlanTerm }, (_, i) => {
      const amount = fixturePlanBase + (i === fixturePlanTerm - 1 ? fixturePlanRemainder : 0);
      return {
        id: `row-${i + 1}`, installment_number: i + 1, due_date: fixtureDueDate(i + 1),
        base_installment_amount: amount, penalty_amount: 0, carried_amount: 0,
        total_due_amount: amount, allocated: 0, actual_remaining: amount,
        computed_status: "pending" as const,
      };
    }),
    items: [{
      id: "item-1", variant_id: "v3", product_id: "3", title: "Twist bangle", title_ja: "ツイストバングル",
      sku: "CJ-0003", quantity: 1, unit_price_jpy: 236000, line_total_jpy: 236000, image_url: null,
    }],
    payments: [],
    pending_submissions: [],
    deposit_paid: false,
    transfer_region: "JP",
    // No bank details before staff confirm (Hub A2).
    transfer_methods: plan.awaiting_confirmation ? [] : fixtureMethods,
  };
}

/**
 * Service requests: one answered request on each fixture record, plus whatever
 * the preview raises. Module state, so a request made in the preview shows up
 * in the list on the next render the way a real one would.
 */
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const serviceRequestsStore: ServiceRequest[] = [
  {
    id: "sr-1", cash_order_id: FIXTURE_ORDER_ID, layaway_plan_id: null, item_title: "Twist bangle", kind: "cleaning",
    details: "The clasp has dulled. Please clean it and check the hinge.", ring_size: null, status: "in_progress",
    customer_note: "Received on Tuesday. It will be back with you within the week.", created_at: daysAgo(6), updated_at: daysAgo(2),
  },
  {
    id: "sr-2", cash_order_id: null, layaway_plan_id: FIXTURE_PLAN_ID, item_title: null, kind: "resize",
    details: "Please size the ring down before it ships.", ring_size: "11", status: "completed",
    customer_note: null, created_at: daysAgo(20), updated_at: daysAgo(12),
  },
];
export function serviceRequestsFixture(): ServiceRequest[] {
  return [...serviceRequestsStore].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export function createServiceRequestFixture(body: ServiceRequestInput): ServiceRequest {
  const now = new Date().toISOString();
  const row: ServiceRequest = {
    id: `sr-${Date.now()}`, cash_order_id: body.cash_order_id ?? null, layaway_plan_id: body.layaway_plan_id ?? null,
    item_title: body.item_title ?? null, kind: body.kind, details: body.details, ring_size: body.ring_size ?? null,
    status: "requested", customer_note: null, created_at: now, updated_at: now,
  };
  serviceRequestsStore.unshift(row);
  return row;
}

/**
 * Preview newsletter memory: the first sign-up for an address is "subscribed",
 * a second is "already_subscribed", so both branches of the form can be seen
 * without a Hub. Module-scope, so it resets whenever the server does — which
 * is the right lifetime for a fixture.
 */
const subscribers = new Set<string>();
export function rememberSubscriber(email: string): boolean {
  const key = email.trim().toLowerCase();
  if (subscribers.has(key)) return true;
  subscribers.add(key);
  return false;
}

/**
 * The seeded site settings — what the Hub's `website_settings` rows hold on the
 * day this shipped, so the preview exercises the SETTINGS path rather than the
 * fallback path. The values are deliberately today's values: a preview that
 * looks different from production would be testing the fixture, not the code.
 *
 * The one exception is `announcement`, which is seeded ACTIVE with no end date.
 * Nothing in production is announcing anything yet, and a bar that cannot be
 * seen cannot be reviewed — this is the flag the accessibility pass and the
 * screenshots are taken against (`NEXT_PUBLIC_PREVIEW_FIXTURES=1`).
 */
export const settingsFixture: SiteSettings = {
  // Not published by the Hub yet (see reservationMode in lib/settings.ts);
  // present here so the reservation-mode hold note on /loyalty can be seen.
  ...(PREVIEW_RESERVATION ? { web_reservation_mode: true } : {}),
  "social.follow": [
    { key: "email", href: "mailto:sales@chajewelsjp.com" },
    { key: "facebook", href: "https://www.facebook.com/chajewelsjapan" },
    { key: "messenger", href: "https://m.me/chajewelsjapan" },
  ],
  "social.loyalty_groups": [
    { key: "whatsapp", href: "https://chat.whatsapp.com/ENdMNvF8N3jB3iG963f6EF" },
    { key: "line", href: "https://line.me/ti/g/5fb8KyBCCJ" },
    { key: "messenger", href: "https://m.me/ch/AbYF1EaEkypQc5Jk/?send_source=cm:copy_invite_link" },
  ],
  "contact.email": "sales@chajewelsjp.com",
  "footer.tagline": {
    ja: "日本で真贋確認済みのK18ゴールド、パール、ダイヤモンドジュエリーと、厳選したプレラブド・ラグジュアリー。東京のお客様と、世界中のフィリピン人ファミリーのために。",
    en: "K18 gold, pearl and diamond jewelry, hallmark checked in Japan, and curated preloved luxury. For our neighbours in Tokyo and Filipino families everywhere.",
  },
  announcement: {
    active: true,
    text: {
      ja: "年末年始の発送スケジュールについてのお知らせ。",
      en: "Holiday shipping dates for Japan and the Philippines.",
    },
    href: "/faq",
    until: null,
  },
};

/**
 * Preview editorial. TWO ROWS, chosen so the preview exercises every branch of
 * lib/posts.ts rather than just the happy one:
 *
 *  - `what-k18-means` carries a cover, so the list thumbnail and the article
 *    header image are both exercised. It is the slug the static post used to
 *    hold, which is now seeded into the Hub (docs/posts-seed.sql).
 *  - `eight-month-layaway-now-open` is `news` and `layaway_only`, so it covers
 *    the ?type=news filter and the Japanese hiding rule at once — and leaves
 *    /blog?type=news EMPTY on Japanese, which is the state the list has to
 *    render rather than crash on.
 *
 * Bodies are MARKDOWN, as the Hub's will be: a heading, a list, a link and
 * emphasis between them, so lib/markdown.ts is exercised by looking at a page.
 */
export const postsFixture: HubPost[] = [
  {
    id: "post-1",
    slug: "what-k18-means",
    type: "article",
    published_at: "2026-09-18",
    cover_url: "/fixtures/pendant-1.svg",
    layaway_only: false,
    title_en: "What K18 means, and how to read the stamp",
    title_ja: "K18の意味と、刻印の読み方",
    excerpt_en: "Seventy-five per cent gold, twenty-five per cent alloy, and what that trade-off buys you in a piece worn every day.",
    excerpt_ja: "金75%、合金25%。毎日身につけるジュエリーにとって、その配合が何を意味するのか。",
    body_en: [
      "K18 means the metal is **75% gold**. The remaining quarter is an alloy of silver and copper, and it is what decides hardness and colour.",
      "## Why not K24",
      "Pure gold is soft. As a ring or a chain it bends out of shape and picks up scratches from ordinary wear, which is why it is kept for bars rather than jewelry.",
      "## Reading the stamp",
      ["- **K18** — the Japanese mark", "- **AU750** — the same purity, written the European way", "- A maker's mark, often beside it"].join("\n"),
      "Any jeweler can read these. If you are not sure what is on a piece you already own, [send us a photo](/contact) and we will tell you.",
    ].join("\n\n"),
    body_ja: [
      "K18は金の含有率が**75%**であることを示します。残りの25%は銀や銅などの合金で、これが硬さと色を決めます。",
      "## K24ではない理由",
      "純金は柔らかく、指輪やチェーンでは日常の着用で曲がり、傷がつきます。インゴットには向いていても、ジュエリーには向きません。",
      "## 刻印の読み方",
      ["- **K18** — 日本の表記", "- **AU750** — 同じ純度のヨーロッパ式の表記", "- メーカーの刻印が並ぶこともあります"].join("\n"),
      "どの宝飾店でも読み取れます。お手持ちの品の刻印がわからない場合は、[写真をお送りください](/contact)。",
    ].join("\n\n"),
  },
  {
    id: "post-2",
    slug: "eight-month-layaway-now-open",
    type: "news",
    published_at: "2026-09-12",
    cover_url: null,
    layaway_only: true,
    title_en: "Eight-month layaway is now open on orders of ¥300,000 and above",
    title_ja: null,
    excerpt_en: "The longer plan is live, with the same 30% deposit and the same 0% interest.",
    excerpt_ja: null,
    body_en: [
      "Orders of ¥300,000 and above can now be spread over *eight* months instead of six.",
      "Everything else is unchanged: 30% on the day, no interest, and a reminder three days before each due date.",
      "See the [layaway terms](/layaway) for the full schedule.",
    ].join("\n\n"),
    body_ja: null,
  },
];

/**
 * The preview FAQ: today's answers, put through the SAME conversion that
 * generated docs/faq-seed.sql. So the preview exercises the Hub path — the
 * markdown renderer, the language filter, the layaway rule — against the real
 * thirty-nine answers rather than against two invented ones, and a conversion
 * that mangles an answer is visible on the page and not only in a gate.
 *
 * `layaway_only` comes from the entry's `layaway: true` in lib/content/faq.ts
 * (owner decision 2026-09-25: nothing layaway-related on the Japanese site).
 *
 * ONE PREVIEW-ONLY DEVIATION: the first question under "Payments and Layaway"
 * is flagged `layaway_only` whatever lib/content/faq.ts says. The flag
 * is a column the owner sets in the Hub, and a rule that cannot be seen cannot
 * be reviewed — this is what the Japanese preview is checked against. Production
 * seeds every row false.
 */
export function faqFixture(): HubFaqSection[] {
  return faqSections.map((section, si) => {
    const slug = sectionSlug(section.h.en);
    return {
      id: `faq-${slug}`,
      slug,
      title_en: section.h.en,
      title_ja: section.h.ja,
      sort_order: (si + 1) * 10,
      items: section.items.map((item, ii) => ({
        id: `faq-${slug}-${ii + 1}`,
        question_en: item.q.en,
        question_ja: item.q.ja,
        answer_en: blocksToMarkdown(item.a, "en"),
        answer_ja: blocksToMarkdown(item.a, "ja"),
        layaway_only: item.layaway === true || (slug === "payments-and-layaway" && ii === 0),
        sort_order: (ii + 1) * 10,
      })),
    };
  });
}
