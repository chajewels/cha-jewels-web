# Cha Jewels Website API — implementation spec for Lovable

The public website (`chajewels/cha-jewels-web`, Next.js on Vercel) talks to the Hub **only** through these endpoints. Implement them as Supabase edge functions in the Hub project under a single function named `website` that routes on path. The website never reads tables directly.

## Auth and conventions
- Header `x-api-key: <HUB_API_KEY>` on every request. Compare against secret `WEBSITE_API_KEY` (Cloud → Secrets). Return 401 otherwise.
- JSON in, JSON out. `404 {"error":"not_found"}` for missing records. Never return `cost_basis`, margin, or commission fields.
- CORS not required (server-to-server), but allow `OPTIONS` for safety.
- All prices are integers in JPY. `price_php` is optional and, if present, is the Hub's own conversion at the day's rate (half-up to a whole peso, the same integer maths the peso checkout stores); the website does not require it.
- **Every customer-facing money figure comes from the Hub** (owner rule 2026-09-25). The website renders `down_payment_jpy` / `down_payment_php` and `layaway_quote`'s figures; it never applies a percentage, converts a currency or falls back to a rate of its own. Guarded by `npm run check:money` (CI).

## Types
```ts
Collection = { id, slug, name, hero_media: string|null, description: string|null }
Product = { id, sku, slug, name, karat: "K18"|"K14"|"K10"|"PT1000"|"PT950"|"PT900"|"SILVER925"|null, weight_g: number|null,
            description_en, description_ja, description_tl: string|null, status: "active",
            condition: "New"|"Preloved", origin: "JAPAN"|"BRAND"|"OTHER"|"UNKNOWN", brand: string|null,
            product_variants: Variant[] }
Variant = { id, size: string|null, stone: string|null, price_jpy: number, price_php: number|null,
            stock_qty: number, down_payment_jpy?: number, down_payment_php?: number, down_payment_pct?: number,
            product_media: { url, alt: string|null, sort: number }[] }
LayawayQuote = { down_payment, deposit, monthly, last_month, term_months, total, max_term_months, currency,
                 allowed_terms: { months, label, min_amount, dp_percentage, eligible }[],
                 term_downgraded, requested_term_months,
                 price_jpy?, fx_rate?, fx_as_of? }   // the last three on a `price_jpy` quote
LiveClaim = { id, code, price_locked, status: "held"|"paid"|"layaway"|"expired"|"released", expires_at, product_variant_id }
```

**Down payments** (Hub, 2026-09-25). Per variant, for the **piece alone** (no
shipping, owner decision D1), on the shortest active term:
- `down_payment_jpy` = `layaway_quote(price_jpy, term, 'JPY').deposit`
- `down_payment_php` = `layaway_quote(price_php, term, 'PHP').deposit` — convert
  first, then the percentage, both half-up to a whole unit. With ₱0 shipping
  this is exactly the deposit a peso layaway checkout stores for the piece; with
  shipping the checkout deposit also covers shipping, and the checkout shows
  that binding figure.
- `down_payment_pct` — that term's `dp_percentage` (0.30 today).
- All three come from one `website_down_payments` call per request. A field the
  Hub cannot produce is **omitted, never null and never estimated**: no rate →
  no `down_payment_php`; lookup failure → none of the three. Present on every
  product-shaped response; never on the `?fields=` slug list.
- **Site use:** the product card (`components/catalog/product-card.tsx`, the
  variant whose price `fromPrice` shows) and the product page's price block
  (`components/commerce/price-block.tsx`) render "¥21,894 (₱8,699)" (owner
  format D3), English only (`layawayOffered`), and only when **both**
  `down_payment_jpy` and `down_payment_php` are present. Otherwise no reserve
  line at all.

`condition` is returned on every product. The site treats an absent value as
`"New"`, and only `"Preloved"` renders a badge — so a Hub response predating the
field degrades safely rather than mislabelling stock.

`origin` and `brand` are returned on every product and are the ONLY source of
an origin claim on the site. `"JAPAN"` renders the origin badge for that
piece; `"BRAND"` renders `brand` (name only, never a logo) and claims no origin;
`"OTHER"`, `"UNKNOWN"` and an absent value render nothing. The site never infers
an origin from metal, name or description, and site-wide copy may only say
"authenticated in Japan" / "hallmark checked in Japan".

## Endpoints
| Method & path | Returns | Notes |
|---|---|---|
| `GET /catalog/collections` | `Collection[]` | ordered by name |
| `GET /catalog/collections/:slug` | `Collection & { products: Product[] }` | active products only, ordered by collection sort |
| `GET /catalog/products?featured=1&limit=8` | `Product[]` | newest active first; `featured=1` may later use a flag |
| `GET /catalog/products?fields=slug,updated_at&limit=5000` | `{slug, updated_at}[]` | for the sitemap |
| `GET /catalog/products/:slug` | `Product` | 404 if not active |
| `POST /layaway/quote` body `{price_jpy, term_months, currency}` | `LayawayQuote` | **Single source of layaway math for site AND Hub.** `price_jpy` is the piece's **yen** price whatever `currency` is (the website sends the catalog price and never converts). `JPY` → `layaway_quote(price_jpy, term, 'JPY')`. `PHP` → the Hub converts `price_php = HU(price_jpy × rate)` at the latest `fx_rates` row, then `layaway_quote(price_php, term, 'PHP')`: every figure (`deposit`, `monthly`, `last_month`, `total`, `schedule`) is computed in pesos; no rate → **503 `fx_unavailable`**. The answer adds `price_jpy`, `fx_rate`, `fx_as_of` (`null` for yen). **Term minimums are per currency:** `allowed_terms[].min_amount` / `eligible` use `min_amount_jpy` for yen and the fixed `min_amount_php` for pesos (6M ₱10,500, 8M ₱126,000, …), never the yen minimum converted — so ₱ mode shows the peso quote's terms. Clamp term to max instead of erroring; 0% interest. A non-integer or negative `price_jpy` → 400 `invalid_price`. Legacy body `{price, term_months, currency}` (`price` read in `currency`) is unchanged on the Hub; the website no longer sends it. Site: `lib/layaway.ts` → `hub.layawayQuote(price_jpy, term, currency)`; `components/commerce/layaway-calculator.tsx` asks again on every ¥/₱ switch and shows the 503 as the checkout's rate-unavailable message. |
| `GET /claims/:code` | `LiveClaim` | code uppercased; 404 if unknown |
| `POST /claims/:code/checkout` (Phase 2) | order or plan | requires customer JWT in `Authorization`; idempotent |
| `GET /loyalty/tiers` | `HubTier[]` | Hub loyalty_tiers ordered by rank: `{slug,name,threshold_jpy,requalify_spend,multiplier,hold_minutes,benefits_ja[],benefits_en[]}` |
| `GET /fx` | `{ jpy_php: number, as_of: "YYYY-MM-DD" }` | Daily JPY→PHP rate; refreshed by cron; 404 when none is on file. The website no longer reads it for any customer figure (the calculator asks for a peso quote instead; the old `0.39` fallbacks are gone). |
| `POST /loyalty/join` body `{name, contact, region, lang}` | `{ok:true}` | Failure fallback only: records a storefront enrollment that did NOT complete and raises Hub staff bell `loyalty_join_failed`. Never enrolls. Real enrollment = direct call to `join-loyalty-program` with the customer JWT and body `{ source: "storefront_checkout" \| "storefront_join" }`. |
| `POST /auth/customer` body `{}` or `{full_name, location, facebook_name?, messenger_link?, mobile_number?}` | `{ customer: HubCustomer, created: boolean }` | Customer JWT required. Links the signed-in customer to the Hub customer that holds her verified email; with a profile, creates one from it. `location` is stored like the Hub: `Japan`, `Philippines`, or the country name (International). Empty optional fields are omitted. **422 `profile_required`** — no customer holds the email and no profile was sent; nothing created (Hub side ships with the next Hub deploy; until then `{}` still creates a customer named from the email). **409 `already_registered`** `{error, message}` — the details match an existing customer on full name, Facebook name, mobile or email; nothing created, staff notified. 409 `email_already_linked` — another login owns that email. Site handling: `lib/profile.ts` (422 → `/account/complete-profile?next=…`, 409 already_registered → `/already-registered`, which signs her out). |
| `GET /me` | `HubMe` | Customer JWT required. **404** before the customer is linked; `/account` and `/account/addresses` send that to the profile step. |
| `GET /me/service-requests` | `ServiceRequest[]` | **Hub route pending.** Customer JWT required. The signed-in customer's own requests, newest first. `ServiceRequest = { id, cash_order_id, layaway_plan_id, item_title, kind, details, ring_size, status, customer_note, created_at, updated_at }`; `kind` `resize\|cleaning\|repair\|appraisal\|other`; `status` `requested\|received\|in_progress\|completed\|declined`. `staff_note` is internal and is never returned. |
| `POST /me/service-requests` body `{cash_order_id? \| layaway_plan_id?, item_title?, kind, details, ring_size?, lang}` | `ServiceRequest` | **Hub route pending.** Customer JWT required; exactly one reference, which must belong to the caller (404 otherwise). Inserts with `status = requested`. Optional fields are omitted, never sent as `""`. |
| `GET /content/settings` | `SiteSettings` | **Hub route pending.** Owner-editable strings and links, as a FLAT MAP of key → value. No key is required and unknown keys are ignored, so neither side has to deploy in step with the other. Keys read today: `social.follow` and `social.loyalty_groups` (`{key,href}[]`, `key` one of `email\|facebook\|messenger\|whatsapp\|line`), `contact.email` (string), `footer.tagline` (`{ja,en}`), `announcement` (`{active: boolean, text: {ja,en}, href: string\|null, until: "YYYY-MM-DD"\|null}` — `until` is an INCLUSIVE end date compared against today in Asia/Tokyo). Cached on tag `content`, 60 s backstop. Every key has a fallback on the site (`lib/settings.ts`), so an absent key, a malformed value or a failed fetch renders what the site renders today and never errors. |
| `GET /content/faq` | `FaqSection[]` | **Hub route pending.** The FAQ, sections in `sort_order` with their items nested in theirs. `FaqSection = { id, slug, title_en, title_ja, sort_order, items: FaqItem[] }`; `FaqItem = { id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order }`. `answer_*` is **Markdown**, same dialect as `posts.body_*`, plus hard breaks (a trailing backslash). `layaway_only` hides an item on Japanese, the site-wide layaway rule. **Seed: `docs/faq-seed.sql` in the website repo — 8 sections, 39 items, generated from the content the site renders today and idempotent.** The site uses the Hub's FAQ **entirely** as soon as it returns one section, and its own **entirely** otherwise; it never mixes the two, so a partial import is worse than none. Cached on tag `content`. |
| `GET /content/posts?type=` | `Post[]` | **Hub route pending.** Editorial, newest first; `type` is `article\|news` and narrows the list. `Post = { id, slug, type, published_at, updated_at: string\|null, published: boolean, cover_url: string\|null, layaway_only: boolean, title_en, title_ja, excerpt_en, excerpt_ja, body_en, body_ja }`. `updated_at` is the last edit and is what the sitemap reports as `lastModified`, falling back to `published_at`. The list route returns published rows only; `published` is read defensively so an explicit `false` is never advertised. **Seed: `docs/posts-seed.sql` — the two posts this repo used to hardcode.** Per-language fields may be null — the site drops a post from a language it has no title AND body in, rather than rendering an empty page. `body_*` is **Markdown**, not HTML: the site renders paragraphs, `##`/`###`, lists, `[text](href)` and bold/italic, escapes everything first and emits no raw HTML under any input. `layaway_only` mirrors the storefront's language rule — such a post is listed and readable on English only. Cached on tag `content`. |
| `GET /content/posts/:slug` | `Post` | **Hub route pending.** 404 if unknown or unpublished. |
| `POST /wholesale/inquiry` body `{name, business, email, phone?, market, volume, notes?, lang}` | `{ok:true}` | insert into `wholesale_inquiries`. `market` `JP\|PH\|BOTH\|OTHER`; `volume` `TEST\|20_50\|50_200\|200_PLUS`; `lang` `ja\|en`. Optional fields are omitted, never sent as `""`. |

## Checkout — currency, peso totals, errors (synced with the Hub contract, 2026-09-25)

Customer JWT required on every route. The site calls them from Server Actions
only (`lib/checkout-actions.ts`), so the JWT is paired with `HUB_API_KEY` on the
server. Nothing on this side computes, converts or rounds an amount.

- `POST /checkout/quote` — prices a cart (and, for a layaway, reserves its invoice number).
- `GET /checkout/quote/:id` — re-reads a saved quote, same shape.
- `POST /checkout/pay` — creates the order (`create_web_order_atomic` / `create_web_layaway_atomic`).

**Settlement currency.** `settlement_currency` is `JPY` (default) or `PHP`, for
**both** modes — a full (one-time) payment and a layaway alike (peso full
payment, owner decision 2026-09-25; layaway since 2026-09-13). Offered on both
languages for a full payment; layaway stays English-only. Yen is the price of
record: every `*_jpy` field stays yen whatever the customer chose.

`POST /checkout/quote` body: `{ items: [{ variant_id, qty }], mode: "full" |
"layaway", settlement_currency?, term_months? (layaway), ship_to_address_id,
order_type?, recipient_name?, recipient_phone?, gift_note? }`.

Quote response (POST and GET) — currency fields:
- `subtotal_jpy`, `shipping_jpy` (null = no published rate), `total_jpy` — yen.
- `settlement_currency` — as requested.
- `fx_rate`, `fx_rate_date` — the `fx_rates.jpy_php` rate (PHP per 1 JPY)
  captured on the quote, `null` for yen. **Never shown to customers** (owner
  decision 2026-09-18); the order is charged at this rate, not today's.
- `subtotal_settlement`, `shipping_settlement`, `total_settlement` — in the
  settlement currency. For yen they equal the `*_jpy` figures.
- `transfer_region` / `transfer_methods` / `transfer_available` — keyed on the
  settlement currency (PHP → the Philippine accounts). Methods are `[]` while
  reserve-first is on.

**Peso rounding.** Converted once, `PHP = JPY × fx_rate`, rounded **half-up to a
whole peso** (Postgres `round(numeric)`). Shipping is converted on its own and
the items subtotal is the remainder (`subtotal = total − shipping`), so the
three always sum. For a **full payment** the quote uses integer maths that
matches `create_web_order_atomic` exactly, so `total_settlement` is the order's
`total_amount` to the peso. A **layaway** uses the same integer half-up since
2026-09-25 (Hub H3), matching `create_web_layaway_atomic`'s `round(total_jpy *
fx_rate)`; its peso deposit and schedule then come from `layaway_quote`.

**Pay response** (`POST /checkout/pay`, full payment): `order_id`,
`web_reference`, `currency` (`JPY` | `PHP`), `total` (in `currency`),
`total_jpy` (kept for older storefront builds — yen, not what a peso order
owes), `transfer_due_at` (null while a reservation awaits staff),
`transfer_region`, `transfer_methods` (`[]` for a reservation), plus
`reservation_mode` / `awaiting_confirmation` on a reservation. A layaway answers
`mode: "layaway"`, `account_id`, `currency`, `total`, `deposit`, `term_months`,
`schedule`, … as before.

**`GET /orders/:id`**: `currency` is the order's settlement currency;
`total_amount`, `total_paid`, `remaining_balance`, `shipping_fee` are in it.
Item `unit_price_jpy` / `line_total_jpy` are **always yen** — on a peso order
the site shows the pieces without a per-line price and the totals in ₱ (owner
decision D1), on checkout Review, `/checkout/complete/:id` and
`/account/orders/:id` alike. The stored rate is not returned.

**Error codes** (`{ error, … }`; `request_id` on RPC refusals), and what the
site shows (`toCode` in `lib/checkout-actions.ts`):

| code | status | where | meaning | site |
|---|---|---|---|---|
| `customer_auth_required` | 401 | all | no/invalid customer JWT | failed (`signed_out` code) |
| `email_unverified` | 403 | all | customer email not verified | failed (`signed_out` code) |
| `email_required_for_account` | 422 | all | auth user has no email | failed |
| `not_linked` | 404 | all | no customer row for this user | failed (`/checkout` sends an unlinked customer to the profile step first) |
| `bad_mode` | 400 | quote | `mode` not `full` / `layaway` | failed |
| `bad_currency` | 400 | quote | `settlement_currency` not `JPY` / `PHP` | failed |
| `term_required` | 400 | quote | layaway without `term_months` | failed |
| `empty_cart` | 400 | quote | no items | failed |
| `too_many_items` | 400 | quote | over the line limit | failed |
| `bad_order_type` | 400 | quote | not `SELF` / `GIFT` / `PROXY` | failed |
| `address_required` | 400 | quote | no `ship_to_address_id` | failed |
| `address_not_found` | 404 | quote | not one of this customer's addresses | failed |
| `variant_id_required` | 400 | quote | a line without `variant_id` | failed |
| `bad_quantity` | 400 | quote | qty < 1 or not a number | failed |
| `variant_not_found` | 404 | quote | `variant_id` included | failed |
| `product_unavailable` | 409 | quote | product not active; `variant_id` | sold out |
| `out_of_stock` | 409 | quote, pay | `variant_id` (+ `available` on quote) | sold out |
| `fx_unavailable` | 503 | quote | PHP requested but no usable `fx_rates` row. Retry later or choose yen; a peso figure is never guessed. | rate unavailable |
| `shipping_quote_required` | 400 | quote (layaway), pay | no published shipping rate for the address | failed |
| `below_plan_minimum` | 409 | quote, pay | layaway: amount/term not allowed; `allowed_terms`, `max_term_months` | below minimum |
| `quote_id_required` | 400 | GET quote, pay | | failed |
| `quote_already_used` | 409 | GET quote, pay | quote consumed — re-quote | expired (re-quotes) |
| `quote_expired` | 409 | GET quote, pay | 30-minute life passed — re-quote (the new quote takes the current rate) | expired (re-quotes) |
| `quote_not_found` | 404 | pay | not this customer's quote (GET answers a plain 404) | expired (re-quotes) |
| `not_yet` | 501 | pay | `method: "square"` | failed |
| `bad_method` | 400 | pay | anything but `transfer` | failed |
| `unsupported_method` | 400 | pay | RPC refusal, same meaning | failed |
| `transfer_unavailable` | 409 | pay | no active account for the quote's currency; `currency`, `region` | transfer unavailable |
| `fx_rate_missing` | 503 | pay | a PHP quote carries no rate (should not happen: the quote refuses first) | rate unavailable |
| `empty_quote` | 400 | pay | total ≤ 0 | failed |
| `variant_missing` | 409 | pay | a quoted variant no longer exists | sold out |
| `layaway_not_yet` / `not_a_layaway_quote` / `full_not_layaway` | 501 / 400 / 400 | pay | mode mismatch between quote and writer | failed |

**Retired:** `currency_not_supported_for_full` (400) — was returned for a PHP
full-payment quote until 2026-09-25. The Hub no longer sends it; the site keeps
mapping it (to a neutral "this currency isn't available right now" message) only
as a rollback safety net.

## Hub → website
On any change to `products`, `product_variants`, `product_media`, or `collection_products`, a DB trigger calls edge function `notify_website` which POSTs `{productSlug?, collectionSlug?}` to `${WEBSITE_URL}/api/revalidate` with header `x-revalidate-secret: <REVALIDATE_SECRET>`.

`/api/revalidate` also accepts `{tag}` — `"catalog"` or `"content"`, an allow-list — and revalidates that cache tag. On any change to the website settings rows, POST `{"tag":"content"}` so the footer, the social rows and the announcement bar update without waiting out the 60 s backstop. `tag` and the slug fields may be sent together or apart; the same secret header applies. It also accepts `{postSlug}`, which revalidates `/blog` and `/blog/<slug>`; send it alongside `{"tag":"content"}` when a post is published, edited or unpublished. A `postSlug` that is not lowercase letters, digits and hyphens is ignored. It also accepts `{path}` from the allow-list `["/faq"]`; send `{"tag":"content","path":"/faq"}` when an FAQ section or item changes. An unrecognised tag, slug or path comes back in the response as `ignoredTag` / `ignoredPostSlug` / `ignoredPath` rather than being silently dropped.

## Secrets to create in Lovable Cloud
`WEBSITE_API_KEY` (generate 32+ random chars), `WEBSITE_URL`, `REVALIDATE_SECRET`. Send the first and third to Cynthia for Vercel; never paste them in chat or GitHub.

## Prerequisites
Apply `supabase/migrations/0001_website_catalog.sql` and `0002_loyalty_signups.sql` first (review against existing Hub tables; do not recreate `customers`, `orders`, `layaway_*`, `loyalty_ledger`).

## Acceptance test
1. `curl -H "x-api-key: …" $HUB_API_URL/catalog/collections` returns the four collections.
2. `POST /layaway/quote {"price_jpy":150000,"term_months":6,"currency":"JPY"}` → `{down_payment:45000, monthly:17500, term_months:6, total:150000, max_term_months:6}`.
3. `POST /layaway/quote {"price_jpy":300000,"term_months":8,"currency":"JPY"}` → `max_term_months: 8`, `monthly: 26250`.
4. `POST /layaway/quote {"price_jpy":200000,"term_months":8,"currency":"JPY"}` → clamps to `term_months: 6`.
4b. `POST /layaway/quote {"price_jpy":72980,"term_months":6,"currency":"PHP"}` → `currency: "PHP"`, `total` = the catalog's `price_php`, `deposit` = HU(`total` × 0.30), `allowed_terms[6].min_amount: 10500`.
4c. `GET /catalog/products/:slug` → each variant carries `down_payment_jpy`, `down_payment_php`, `down_payment_pct`.
5. Response bodies contain no `cost_basis` key anywhere.

## Proposed (not built in the Hub): hero slider photo slots and counts (2026-09-26)

Drafted by the storefront for Lovable; nothing here is live. The storefront already reads these fields if they appear and ignores them while absent (`lib/hero-deck.ts`).

- **`Category.gallery_media: string[] | null`** on `GET /catalog/categories`, in upload order. Owner photos for the hero's multi-photo layouts: the Preloved Branded vitrine uses items 1–3 for arches that have no available piece, and the Preloved Designer Accessories index uses items 1–4 for 財布 / カードケース / ベルト / 小物レザー, in that order. It is edited beside `hero_media` in the Hub's category editor. Until it exists, those slots show an empty dark stone ground.
- **`Category.available_count: number`** on `GET /catalog/categories`: the number of products with `status = 'active'` and at least one variant with `stock_qty > 0`. With it, `HERO_HIDE_EMPTY_CATEGORIES` needs no per-category read. Today the storefront reads `GET /catalog/categories/:slug` for each category (60 s cache) and applies the same rule itself.
