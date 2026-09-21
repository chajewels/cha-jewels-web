# Cha Jewels Website API — implementation spec for Lovable

The public website (`chajewels/cha-jewels-web`, Next.js on Vercel) talks to the Hub **only** through these endpoints. Implement them as Supabase edge functions in the Hub project under a single function named `website` that routes on path. The website never reads tables directly.

## Auth and conventions
- Header `x-api-key: <HUB_API_KEY>` on every request. Compare against secret `WEBSITE_API_KEY` (Cloud → Secrets). Return 401 otherwise.
- JSON in, JSON out. `404 {"error":"not_found"}` for missing records. Never return `cost_basis`, margin, or commission fields.
- CORS not required (server-to-server), but allow `OPTIONS` for safety.
- All prices are integers in JPY. `price_php` is optional and, if present, is the Hub's own conversion at the day's rate; the website does not require it.

## Types
```ts
Collection = { id, slug, name, hero_media: string|null, description: string|null }
Product = { id, sku, slug, name, karat: "K18"|"K14"|"K10"|"PT1000"|"PT950"|"PT900"|"SILVER925"|null, weight_g: number|null,
            description_en, description_ja, description_tl: string|null, status: "active",
            condition: "New"|"Preloved", origin: "JAPAN"|"BRAND"|"OTHER"|"UNKNOWN", brand: string|null,
            product_variants: Variant[] }
Variant = { id, size: string|null, stone: string|null, price_jpy: number, price_php: number|null,
            stock_qty: number, product_media: { url, alt: string|null, sort: number }[] }
LayawayQuote = { down_payment, monthly, term_months, total, max_term_months, currency }
LiveClaim = { id, code, price_locked, status: "held"|"paid"|"layaway"|"expired"|"released", expires_at, product_variant_id }
```

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
| `POST /layaway/quote` body `{price, term_months, currency}` | `LayawayQuote` | **Single source of layaway math for site AND Hub.** 30% down; equal monthly; terms 3–6, up to 8 when price ≥ ¥300,000 (PHP: same threshold at day's rate); clamp term to max instead of erroring; 0% interest. |
| `GET /claims/:code` | `LiveClaim` | code uppercased; 404 if unknown |
| `POST /claims/:code/checkout` (Phase 2) | order or plan | requires customer JWT in `Authorization`; idempotent |
| `GET /loyalty/tiers` | `HubTier[]` | Hub loyalty_tiers ordered by rank: `{slug,name,threshold_jpy,requalify_spend,multiplier,hold_minutes,benefits_ja[],benefits_en[]}` |
| `GET /fx` | `{ jpy_php: number, as_of: "YYYY-MM-DD" }` | Daily JPY→PHP rate; refreshed by cron. Website uses it for display only. |
| `POST /loyalty/join` body `{name, contact, region, lang}` | `{ok:true}` | Failure fallback only: records a storefront enrollment that did NOT complete and raises Hub staff bell `loyalty_join_failed`. Never enrolls. Real enrollment = direct call to `join-loyalty-program` with the customer JWT and body `{ source: "storefront_checkout" \| "storefront_join" }`. |
| `GET /me/service-requests` | `ServiceRequest[]` | **Hub route pending.** Customer JWT required. The signed-in customer's own requests, newest first. `ServiceRequest = { id, cash_order_id, layaway_plan_id, item_title, kind, details, ring_size, status, customer_note, created_at, updated_at }`; `kind` `resize\|cleaning\|repair\|appraisal\|other`; `status` `requested\|received\|in_progress\|completed\|declined`. `staff_note` is internal and is never returned. |
| `POST /me/service-requests` body `{cash_order_id? \| layaway_plan_id?, item_title?, kind, details, ring_size?, lang}` | `ServiceRequest` | **Hub route pending.** Customer JWT required; exactly one reference, which must belong to the caller (404 otherwise). Inserts with `status = requested`. Optional fields are omitted, never sent as `""`. |
| `GET /content/settings` | `SiteSettings` | **Hub route pending.** Owner-editable strings and links, as a FLAT MAP of key → value. No key is required and unknown keys are ignored, so neither side has to deploy in step with the other. Keys read today: `social.follow` and `social.loyalty_groups` (`{key,href}[]`, `key` one of `email\|facebook\|messenger\|whatsapp\|line`), `contact.email` (string), `footer.tagline` (`{ja,en}`), `announcement` (`{active: boolean, text: {ja,en}, href: string\|null, until: "YYYY-MM-DD"\|null}` — `until` is an INCLUSIVE end date compared against today in Asia/Tokyo). Cached on tag `content`, 60 s backstop. Every key has a fallback on the site (`lib/settings.ts`), so an absent key, a malformed value or a failed fetch renders what the site renders today and never errors. |
| `POST /wholesale/inquiry` body `{name, business, email, phone?, market, volume, notes?, lang}` | `{ok:true}` | insert into `wholesale_inquiries`. `market` `JP\|PH\|BOTH\|OTHER`; `volume` `TEST\|20_50\|50_200\|200_PLUS`; `lang` `ja\|en`. Optional fields are omitted, never sent as `""`. |

## Hub → website
On any change to `products`, `product_variants`, `product_media`, or `collection_products`, a DB trigger calls edge function `notify_website` which POSTs `{productSlug?, collectionSlug?}` to `${WEBSITE_URL}/api/revalidate` with header `x-revalidate-secret: <REVALIDATE_SECRET>`.

`/api/revalidate` also accepts `{tag}` — `"catalog"` or `"content"`, an allow-list — and revalidates that cache tag. On any change to the website settings rows, POST `{"tag":"content"}` so the footer, the social rows and the announcement bar update without waiting out the 60 s backstop. `tag` and the slug fields may be sent together or apart; the same secret header applies.

## Secrets to create in Lovable Cloud
`WEBSITE_API_KEY` (generate 32+ random chars), `WEBSITE_URL`, `REVALIDATE_SECRET`. Send the first and third to Cynthia for Vercel; never paste them in chat or GitHub.

## Prerequisites
Apply `supabase/migrations/0001_website_catalog.sql` and `0002_loyalty_signups.sql` first (review against existing Hub tables; do not recreate `customers`, `orders`, `layaway_*`, `loyalty_ledger`).

## Acceptance test
1. `curl -H "x-api-key: …" $HUB_API_URL/catalog/collections` returns the four collections.
2. `POST /layaway/quote {"price":150000,"term_months":6,"currency":"JPY"}` → `{down_payment:45000, monthly:17500, term_months:6, total:150000, max_term_months:6}`.
3. `POST /layaway/quote {"price":300000,"term_months":8,"currency":"JPY"}` → `max_term_months: 8`, `monthly: 26250`.
4. `POST /layaway/quote {"price":200000,"term_months":8,"currency":"JPY"}` → clamps to `term_months: 6`.
5. Response bodies contain no `cost_basis` key anywhere.
