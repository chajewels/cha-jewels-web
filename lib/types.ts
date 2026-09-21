export type { Metal as Karat } from "./metals";
export type ProductStatus = "draft" | "active" | "archived";
export type ProductMedia = { url: string; alt: string | null; sort: number };
export type ProductVariant = { id: string; size: string | null; stone: string | null; price_jpy: number; price_php?: number | null; stock_qty: number; product_media: ProductMedia[] };
export type Condition = "New" | "Preloved";
/** `condition` is optional so fixtures and any pre-condition Hub response still typecheck; absent is treated as New. */
/**
 * Origin is DATA from the Hub, never inferred here. JAPAN is the only value
 * that renders the origin badge; BRAND shows `brand` and claims no origin;
 * OTHER and UNKNOWN show nothing. Optional because an older API
 * response may omit it — and an absent origin renders as UNKNOWN, not Japan.
 */
export type Origin = "JAPAN" | "BRAND" | "OTHER" | "UNKNOWN";
/**
 * Bilingual copy: `name_en` / `name_ja` / `description_en` / `description_ja`.
 * `name` is the Hub's English alias and stays for older responses. Pick the
 * field for the current lang through lib/catalog-i18n — never read one
 * language's column directly in a component.
 */
/** `metals`: every stamp on the piece in the Hub's order (PT900/K18); `karat` is the one-release bridge (= metals[0]) kept until the Hub drops it. */
export type Product = { id: string; sku: string; slug: string; name: string; name_en?: string | null; name_ja?: string | null; karat: string | null; metals?: string[]; weight_g: number | null; description_en: string | null; description_ja: string | null; description_tl: string | null; status: ProductStatus; condition?: Condition; origin?: Origin; brand?: string | null; category_slugs?: string[]; product_variants: ProductVariant[] };
/** A published customer testimonial from the Hub (GET /testimonials). Quotes are per language; either may be null. */
export type Testimonial = { id: string; customer_name: string; location: string | null; quote_en: string | null; quote_ja: string | null; item: string | null; rating: number | null };
/**
 * A merchandising category — the top level the homepage hero and /categories
 * are built from. Categories are the Hub's, like everything else in the
 * catalog: the slugs, the order and the button label are DATA, not a list in
 * this repo, so adding one is a Hub edit and not a deploy.
 *
 * `sort_order` is the order the Hub wants them shown in; the hero and any
 * listing sort by it rather than inventing a rule of their own (the old deck
 * hardcoded "preloved lines first", which is exactly the kind of merchandising
 * decision that belongs to the owner).
 *
 * `cta_label` / `cta_label_ja` let a category carry its own button wording
 * ("Shop watches" reads better than a generic label). Both may be null, and the
 * caller falls back to the dictionary.
 *
 * Bilingual fields follow the Collection pattern: `name` is the base/English
 * column and `name_ja` the Japanese. Read them through lib/catalog-i18n, never
 * directly.
 */
export type Category = {
  id: string; slug: string;
  name: string; name_ja: string | null;
  description: string | null; description_ja: string | null;
  hero_media: string | null;
  cta_label: string | null; cta_label_ja: string | null;
  sort_order: number;
};
export type Collection = { id: string; slug: string; name: string; name_en?: string | null; name_ja?: string | null; hero_media: string | null; description: string | null; description_en?: string | null; description_ja?: string | null };
/**
 * What the shared SQL function returns. `allowed_terms` is the business's real
 * term list with this amount's eligibility already decided, so the calculator
 * never has to carry a hardcoded array that drifts from what is sellable.
 * Optional because an older Hub deploy does not send it.
 */
export type LayawayQuote = {
  down_payment: number; monthly: number; term_months: number; total: number;
  max_term_months: number; currency: "JPY" | "PHP";
  last_month?: number;
  allowed_terms?: LayawayTerm[];
  /** true when the term asked for was out of reach and a shorter one was quoted. */
  term_downgraded?: boolean;
  requested_term_months?: number;
};
export type HubTier = { slug: string; name: string; threshold_jpy: number; requalify_spend: number | null; multiplier: number | null; hold_minutes: number; benefits_ja: string[]; benefits_en: string[] };
export type FxRate = { jpy_php: number; as_of: string };

/** Phase 2 step 1 — customer account. */
export type HubCustomer = { id: string; customer_code: string | null; full_name: string | null; email: string | null; mobile_number: string | null };
export type HubAddress = { id?: string; label?: string | null; recipient_name?: string | null; line1: string; line2?: string | null; city?: string | null; region?: string | null; postal_code?: string | null; country?: string | null; phone?: string | null; is_default?: boolean };
/**
 * Loyalty snapshot from the Hub. `reduced` = the level is temporarily one step
 * down after 180 days without a purchase; `earned_tier` is the level the
 * member earned and `regain_jpy` the spend still needed to get it back. All
 * three are absent on older Hub deploys — read them defensively.
 */
export type HubLoyalty = {
  enrolled: boolean;
  points: number;
  tier: string | null;
  multiplier: number | null;
  reduced?: boolean;
  earned_tier?: string | null;
  regain_jpy?: number | null;
};
export type HubMe = {
  customer: HubCustomer;
  addresses: HubAddress[];
  loyalty: HubLoyalty;
  saved_card: boolean;
  /**
   * How many orders and plans this customer record actually holds. Lets the
   * account page tell "you have not bought from us yet" apart from "this
   * sign-in reached a record with nothing on it", which are different
   * sentences and only one of them is true. Optional: an older Hub deploy
   * does not send it.
   */
  records?: { layaway: number; orders: number };
  /** True when another customer record carries this same email address. */
  shares_email?: boolean;
  /** Where every action lives. Built by the Hub, never assembled here. */
  portal_url?: string | null;
};

/** Phase 2 step 2 — cart, checkout and orders. */
export type OrderType = "SELF" | "GIFT" | "PROXY";
export type HubQuoteItem = { variant_id: string; product_id: string | null; sku: string | null; slug: string | null; name: string; name_en?: string | null; name_ja?: string | null; qty: number; unit_price_jpy: number; line_total_jpy: number };
export type HubQuote = {
  quote_id: string;
  items: HubQuoteItem[];
  subtotal_jpy: number;
  /** null means we publish no rate for that country — ask, never ship free. */
  shipping_jpy: number | null;
  total_jpy: number;
  requires_manual_quote: boolean;
  /** Which set of accounts this destination is paid into. Japan, or everywhere else. */
  transfer_region: TransferRegion;
  /** Active, complete methods for `transfer_region`, in the Hub's own order. */
  transfer_methods: TransferMethod[];
  /** false when that region has no complete, active method in the Hub. */
  transfer_available: boolean;
  order_type: OrderType;
  expires_at: string;
  /**
   * The plan's invoice number, reserved on the Hub the moment a LAYAWAY quote
   * is created (checkout_quotes.reserved_invoice_seq) and carried through
   * create_web_layaway_atomic unchanged — so the agreement can be signed
   * against the number the plan will actually get. Both null for a
   * full-payment quote. web_reference is 'CJ-W-' + the number, 6-digit padded.
   */
  invoice_number: string | null;
  web_reference: string | null;
  /** Phase 2 step 4. Absent on an older Hub deploy — read defensively. */
  mode?: CheckoutMode;
  settlement_currency?: SettlementCurrency;
  /** Pesos per yen, and the day that rate was published. null on a yen plan. */
  fx_rate?: number | null;
  fx_rate_date?: string | null;
  /** The same three totals in the settlement currency. */
  subtotal_settlement?: number;
  shipping_settlement?: number | null;
  total_settlement?: number;
  layaway?: HubQuoteLayaway | null;
  /**
   * Hours the customer will have to send the deposit — 24 on a first order, 72
   * when they have ordered before. Decided by the Hub's
   * web_deposit_deadline_hours(), the same function the creation RPC defaults
   * from, so the number shown at checkout is the number that gets stored.
   *
   * null or absent on an older Hub deploy, and that is not a 72: the copy drops
   * the number entirely rather than naming one it cannot stand behind.
   */
  deposit_deadline_hours?: number | null;
};
/**
 * Transfer methods, built by the Hub from its own rows at request time — so a
 * correction an admin makes shows on the site with no deploy.
 *
 * The Hub sends one region's methods and only that region's: JP for an order
 * shipping inside Japan, OVERSEAS for everywhere else. The other region's
 * account details never reach the browser, so there is nothing here to filter
 * and no way for the wrong account to leak into the page.
 *
 * An EMPTY array means no usable method — the page must say so plainly and
 * never fall back to placeholder prose.
 */
export type TransferRegion = "JP" | "OVERSEAS";
export type TransferMethodType = "bank" | "gcash" | "maya" | "other";
export type TransferBank = {
  name: string; branch: string | null; account_type: string | null;
  account_number: string | null; account_holder: string | null;
};
export type TransferWallet = { number: string; name: string | null };
export type TransferMethod = {
  id: string;
  method_type: TransferMethodType;
  label_ja: string; label_en: string;
  /** Present on bank methods; some `other` methods carry one too. */
  bank: TransferBank | null;
  /** Present on GCash / Maya methods. */
  wallet: TransferWallet | null;
  note_ja: string | null; note_en: string | null;
};
export type HubPayResult = {
  order_id: string; web_reference: string; total_jpy: number; transfer_due_at: string;
  transfer_region: TransferRegion; transfer_methods: TransferMethod[];
};
/** `status` is the Hub's cash_order_status; `payment_status` is the web-facing one. */
export type HubOrder = {
  id: string; web_reference: string | null; invoice_number: string | null;
  status: "pending" | "completed" | "cancelled" | "expired";
  payment_status: "pending_transfer" | "paid" | "failed" | "refunded" | "cancelled" | null;
  payment_method: string | null; order_type: OrderType | null;
  /**
   * JPY or PHP — the Hub's `account_currency` enum has no third value, and
   * 73 of the orders arranged with us directly are in pesos. Typed narrowly so
   * a figure cannot be rendered without saying which currency it is in.
   */
  currency: SettlementCurrency;
  total_amount: number; total_paid: number; remaining_balance: number; shipping_fee: number | null;
  transfer_due_at: string | null; recipient_name: string | null; gift_note: string | null;
  order_date: string | null; created_at: string; completed_at: string | null; cancelled_at: string | null;
  tracking_number: string | null; shipped_at: string | null;
  /**
   * Where the order was created. "web" started here; "hub_manual" was arranged
   * with Cha Jewels directly and is shown here read-only.
   */
  source_channel?: string | null;
  /** Set by the Hub when the order is cancelled; the refund decision is the Hub's, this side only renders it. */
  cancellation_reason: string | null;
  refund_status: "refund_issued" | "refund_pending" | "store_credit_issued" | "no_refund" | null;
  refund_note: string | null;
  /** When a transfer order ran past its 72-hour hold and the Hub released the stock. */
  expired_at: string | null;
  ship_to_address?: HubAddress | null;
};
/** `title` is the English line title frozen at order time; `title_ja` is derived by the Hub from the product's current Japanese name and may be null. */
export type HubOrderItem = { id: string; variant_id: string | null; product_id: string | null; title: string; title_ja?: string | null; sku: string | null; quantity: number; unit_price_jpy: number; line_total_jpy: number; image_url: string | null };
export type HubOrderDetail = { order: HubOrder; items: HubOrderItem[]; transfer_region: TransferRegion; transfer_methods: TransferMethod[] };
/** The Hub answers checkout failures with a code, not an HTTP body we should guess at. */
export type HubCheckoutError = { error: string; variant_id?: string; available?: number; request_id?: string };

/**
 * Phase 2 step 4 — web layaway.
 *
 * A plan is an ordinary Hub layaway account that happens to have started on
 * this site. Every figure here comes from the Hub: the deposit, the schedule
 * and the per-row remaining are computed there and only rendered here.
 *
 * The settlement currency is the customer's choice at checkout. A yen plan is
 * quoted and settled in yen; a peso plan is converted once, at the rate stored
 * on the plan, and every figure in it is already in pesos. The two are never
 * mixed and nothing is converted on this side.
 */
export type SettlementCurrency = "JPY" | "PHP";
export type CheckoutMode = "full" | "layaway";

/** One row of `allowed_terms`: what the Hub sells and what this basket reaches. */
export type LayawayTerm = {
  months: number;
  label: string;
  min_amount: number;
  dp_percentage: number;
  /** false when this basket's total is under the term's minimum. */
  eligible: boolean;
};
export type LayawayScheduleRow = { installment_number: number; due_date: string; amount: number };

/** The plan attached to a layaway quote, in the settlement currency. */
export type HubQuoteLayaway = {
  term_months: number;
  deposit: number;
  monthly: number;
  last_month: number;
  schedule: LayawayScheduleRow[];
  allowed_terms: LayawayTerm[];
};

export type HubLayawayPayResult = {
  mode: "layaway";
  account_id: string;
  web_reference: string;
  currency: SettlementCurrency;
  total: number;
  deposit: number;
  term_months: number;
  schedule: LayawayScheduleRow[];
  transfer_due_at: string;
  transfer_region: TransferRegion;
  transfer_methods: TransferMethod[];
};

/** A plan as the list sees it. `status` is the Hub's account_status. */
export type HubLayawayPlan = {
  id: string;
  web_reference: string | null;
  invoice_number: string | null;
  status: string;
  currency: SettlementCurrency;
  total_amount: number;
  total_paid: number;
  remaining_balance: number;
  downpayment_amount: number;
  payment_plan_months: number;
  shipping_fee: number | null;
  order_date: string | null;
  end_date: string | null;
  /** When the deposit must arrive. A field the Hub's staff can move, not a rule. */
  transfer_due_at: string | null;
  settlement_due_at: string | null;
  /** Set when the deposit never arrived and the Hub released the hold. */
  expired_at: string | null;
  created_at: string;
  completed_at: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  /**
   * Where the plan was created. "web" started at this checkout; "hub_manual"
   * was arranged with Cha Jewels directly — the great majority, and every plan
   * older than this site. A hub_manual plan is READ-ONLY here: payment is
   * reported in the customer portal, so the payment form is not offered for it.
   */
  source_channel?: string | null;
};

/**
 * DISPLAY RULES: `actual_remaining`, `allocated` and `computed_status` are the
 * only fields to render. `total_due_amount` is a write-only cache on the Hub's
 * side and is carried here for completeness, never shown.
 */
export type HubLayawayScheduleRow = {
  id: string;
  installment_number: number;
  due_date: string;
  base_installment_amount: number;
  penalty_amount: number;
  carried_amount: number;
  total_due_amount: number;
  allocated: number;
  actual_remaining: number;
  computed_status: "pending" | "partially_paid" | "paid" | "overdue" | "cancelled";
};
export type HubLayawayPayment = {
  id: string; amount_paid: number; currency: string; date_paid: string;
  payment_method: string | null; reference_number: string | null; created_at: string;
};
/** A report of a transfer the Hub has not confirmed yet. Not money on the books. */
export type HubLayawaySubmission = {
  id: string; submitted_amount: number; payment_date: string;
  payment_method: string | null; status: string; created_at: string;
};
export type HubLayawayDetail = {
  plan: HubLayawayPlan;
  schedule: HubLayawayScheduleRow[];
  items: HubOrderItem[];
  payments: HubLayawayPayment[];
  pending_submissions: HubLayawaySubmission[];
  deposit_paid: boolean;
  transfer_region: TransferRegion;
  transfer_methods: TransferMethod[];
  /** This customer's portal link, from the Hub's own builder. */
  portal_url?: string | null;
};

/**
 * SERVICE REQUESTS. A customer asks for work on a piece they bought — a resize,
 * a cleaning, a repair, an appraisal — from the order or the plan it came with.
 * It is a REQUEST, not a booking: the Hub's staff read it and answer through
 * `status` and `customer_note`. The Hub's `staff_note` is internal and never
 * crosses this API. Exactly one of `cash_order_id` / `layaway_plan_id` is set.
 */
export type ServiceRequestKind = "resize" | "cleaning" | "repair" | "appraisal" | "other";
export type ServiceRequestStatus = "requested" | "received" | "in_progress" | "completed" | "declined";
export type ServiceRequest = {
  id: string;
  cash_order_id: string | null;
  layaway_plan_id: string | null;
  /** The order line it concerns, as the English title frozen at order time; null for the whole order. */
  item_title: string | null;
  kind: ServiceRequestKind;
  details: string | null;
  ring_size: string | null;
  status: ServiceRequestStatus;
  /** What staff wrote back to the customer. Null until they do. */
  customer_note: string | null;
  created_at: string;
  updated_at: string;
};
/** What the customer sends. Optional fields are omitted, never sent as "". */
export type ServiceRequestInput = {
  cash_order_id?: string;
  layaway_plan_id?: string;
  item_title?: string;
  kind: ServiceRequestKind;
  details: string;
  ring_size?: string;
  /** The language the customer wrote in, so staff can answer in it. */
  lang: "ja" | "en";
};

/** POST /newsletter. `already_subscribed` is a success — see hub.subscribe. */
export type NewsletterSubscribeResult = { status: "subscribed" | "already_subscribed" };
/** GET /newsletter/unsubscribe. Always `unsubscribed`, whatever the token was. */
export type NewsletterUnsubscribeResult = { status: "unsubscribed" };
