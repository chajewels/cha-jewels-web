import type { CheckoutMode, Collection, HubLayawayDetail, HubLayawayPayResult, HubLayawayPlan, HubLayawayScheduleRow, HubMe, HubOrder, HubOrderDetail, HubPayResult, HubQuote, HubQuoteItem, HubTier, LayawayQuote, LayawayScheduleRow, LayawayTerm, LiveClaim, OrderType, Product, SettlementCurrency, TransferMethod } from "@/lib/types";
import { tiers as localTiers } from "@/lib/loyalty";
/** Local preview data. Active only when NEXT_PUBLIC_PREVIEW_FIXTURES=1. Never shipped to production. */
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
    quote_id: "quote-fixture", items, subtotal_jpy: subtotal, shipping_jpy: shipping,
    total_jpy: total, requires_manual_quote: false,
    transfer_region: "JP", transfer_methods: fixtureMethods, transfer_available: true,
    order_type: body.order_type,
    expires_at: new Date(Date.now() + 30 * 60e3).toISOString(),
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
  hubOrder({ id: "order-expired", invoice: "19477", status: "expired", payment: null, currency: "JPY", total: 68900 }),
  // THE LATENT CONTRADICTION THIS FIX CLOSES: shipped, then cancelled. With
  // shipped_at tested first, this row showed a gold "Shipped" badge directly
  // above its own cancellation reason and refund decision. No live order is in
  // this state (0 rows), which is exactly why it needed a fixture.
  hubOrder({
    id: "order-shipped-then-cancelled", invoice: "19461", status: "cancelled", payment: "cancelled",
    currency: "JPY", total: 98400, shipped: true,
    cancelled: true, reason: "Returned to us and cancelled after dispatch.", refund: "store_credit_issued",
  }),
];

/** An order in whatever state the Hub has it. Web fields left null as the Hub leaves them. */
function hubOrder(o: {
  id: string; invoice: string; status: HubOrder["status"]; payment: HubOrder["payment_status"];
  currency: SettlementCurrency; total: number;
  shipped?: boolean; cancelled?: boolean; reason?: string; refund?: HubOrder["refund_status"];
}): HubOrder {
  const day = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
  return {
    id: o.id, web_reference: null, invoice_number: o.invoice,
    status: o.status, payment_status: o.payment, payment_method: "transfer",
    order_type: "SELF", currency: o.currency, total_amount: o.total, total_paid: 0,
    remaining_balance: o.total, shipping_fee: null, transfer_due_at: null,
    recipient_name: null, gift_note: null, order_date: day(30).slice(0, 10),
    created_at: day(30), completed_at: null,
    cancelled_at: o.cancelled ? day(3) : null,
    tracking_number: o.shipped ? "JP1234567890" : null,
    shipped_at: o.shipped ? day(10) : null,
    cancellation_reason: o.reason ?? null,
    refund_status: o.refund ?? null,
    refund_note: null,
    expired_at: o.status === "expired" ? day(2) : null,
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
    transfer_region: "JP", transfer_methods: fixtureMethods,
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
},
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
    transfer_methods: fixtureMethods,
  };
}
