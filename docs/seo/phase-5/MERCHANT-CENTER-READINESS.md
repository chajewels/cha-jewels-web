# Phase 5 — Google Merchant Center readiness

**Status:** AUDITED; **builder IMPLEMENTED 2026-11-01** (`lib/merchant-feed.ts` + tests; no route, no account change) — see `MERCHANT-FEED-IMPLEMENTATION-PROPOSAL.md` for the route code, the MC-G1..G13 dispositions and the owner package. No Merchant Center account was touched, created or inspected.
**Date:** 2026-10-29 · **Plan:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` §15 and PHASE 5 · **Findings carried in:** X8, X10, D3 (`docs/seo/SEO-IMPLEMENTATION-STATUS.md`)
**Prerequisite phases:** Phase 2 (locale URLs, DEPLOYED, recrawl pending) is the only hard dependency: a feed needs a stable, self-canonical landing page per product, which `/en/products/<slug>` and `/ja/products/<slug>` now are. Phase 4 (structured data) is not a dependency but reduces price/availability mismatch warnings (see §7).

---

## 1. What is known and what is not

| Question | Answer | Source |
|---|---|---|
| Is there Merchant Center code in the repository? | No. No feed route, no feed generator, no Merchant Center verification tag. | `find app lib -iname "*merchant*"`, `*feed*` — nothing; baseline §13 |
| Does a Merchant Center account exist? Is `chajewelsjp.com` claimed and verified in it? Are free listings enabled? | **UNKNOWN (finding X8).** Only the owner can answer, by signing in to merchants.google.com. | X8 |
| Is the Search Console property verified (prerequisite for the simplest website claim)? | **UNKNOWN (X8).** | X8 |
| Does the Hub hold GTIN or MPN for any product? | No field for either exists in the Website API `Product` or `Variant` shape. Pieces are one-of-a-kind or hallmark-stamped; no GS1 identifiers are expected. | `supabase/contracts/api.md` Types; `lib/types.ts` |
| What does a product carry that a feed can use? | `id`, `sku`, `slug`, `name` / `name_en` / `name_ja`, `description_en` / `description_ja` / `description_tl`, `karat` / `metals`, `weight_g`, `status`, `condition`, `origin`, `brand`, `collection_slugs`, `category_slugs`, `item_type` (not sent yet), per-variant `price_jpy`, `price_php`, `full_price_jpy`, `on_sale`, `stock_qty`, `size`, `stone`, `product_media[] { url, alt, sort }`. | `lib/types.ts:51,82`; `api.md` Types |
| Which product pages exist for a crawler? | `/en/products/<slug>` and `/ja/products/<slug>` (200, self-canonical, reciprocal hreflang) since Phase 2B/2C; both are in the sitemap (Phase 2D). The bare `/products/<slug>` is a legacy URL under temporary 307 (Phase 2E stage 1). | `app/[lang]/products/[slug]/page.tsx`, `app/sitemap.ts`, status doc |
| Are sold products still live pages? | Yes: 200 with the Sold state, kept in the sitemap (D3). 120 of 449 at Phase 1 (27%). A feed must therefore send them as `out_of_stock` rather than drop them silently, or Merchant Center will crawl a live page whose state disagrees with a missing item. | D3, X10, baseline §17 |
| Shipping rate card | Japan: ¥800 under ¥8,000 of pieces, free from ¥8,000 (published on `/shopping-guide`, from the Hub's rate card). Outside Japan: "shown at checkout"; no published figure. | `lib/content/shopping-guide.ts` shipping block |
| Prices include tax? | Yes: "Shown on each product page, tax included" (tokusho). | `lib/content/legal.ts` tokusho 販売価格 |

### Owner must verify externally before Phase 5 moves to IMPLEMENTING

1. Sign in to merchants.google.com with the business Google account. Record: account exists (Y/N), account ID, business name shown, verified website (must be `https://www.chajewelsjp.com`), claim method, whether "free listings" / "Show products on Google" is already on, any existing products or disapprovals.
2. Confirm the Search Console property for `www.chajewelsjp.com` (URL-prefix or Domain) and who owns it. Merchant Center website verification can reuse it.
3. Confirm the business information Merchant Center asks for matches the published legal identity (see `docs/seo/phase-10/LOCAL-SEO-GBP-READINESS.md` §3 for the one set of strings).
4. Decide the target country/language questions in §8 (OD-MC-1 to OD-MC-3). They determine which feed is built first.

Until these are recorded, this phase stays AUDITED.

---

## 2. Target architecture (plan §15)

```text
Cha Jewels Hub  (products, variants, media, stock, prices — the only source of truth)
      │  Website API (supabase/contracts/api.md) — already the public-safe projection
      ▼
Product feed  (one of the two options in §3)
      │  Merchant Center scheduled fetch (or Merchant API push — later)
      ▼
Google Merchant Center  →  free listings / Shopping tab surfaces
      │
      └── Merchant Center crawls the landing page + image URLs it is given,
          so /en|/ja/products/<slug> and the image host must stay crawlable.
```

Rules the architecture inherits from CLAUDE.md:

- **Money:** every `price`, `sale_price` and shipping figure is the Hub's own number, copied verbatim. The feed computes nothing (no rounding, no conversion, no percentage). `check:money` applies to any storefront code that implements this.
- **No layaway on the Japanese site:** a Japanese feed item (if built) carries no layaway wording in its title or description; `description_ja` is already free of it. Merchant Center has no layaway attribute; nothing is added.
- **Terminology:** titles and descriptions are the Hub's `name_*` / `description_*` text, which `check:terms` already covers for repo content; Hub-authored text is the owner's. Origin claims come only from `origin === "JAPAN"` data, never from feed templating.
- **Cost basis, margin, commission never cross the Website API** — so a storefront-side feed cannot leak them. A Hub-side feed must be field-whitelisted to the same effect (§3, Option A risk).

---

## 3. Where the feed is generated: two options, one recommendation

| | **Option A — Hub-side feed endpoint** (Lovable owns it; `supabase/functions/`) | **Option B — Storefront route** `GET /api/merchant-feed.xml` (Claude owns it; reads the Website API) |
|---|---|---|
| Owner of the code | Lovable (Hub). Claude may only DRAFT the contract (§10). | Claude Code (`app/api/merchant-feed/route.ts`). **A new route needs owner approval under the route-change rule before any code is written.** |
| Data access | Direct DB reads. Risk: internal fields (cost basis, margin, commission, supplier) exist on the same rows; the function must whitelist. | Only what the Website API already exposes (`hub.allProducts(5000)` = `GET /catalog/products?limit=5000`, the same call the search index uses). Nothing private can appear by construction. |
| Freshness | Immediate (reads at request time). | Catalog reads are cached 60 s on tag `catalog`; the Hub's `notify_website` trigger already busts that tag on any product/variant/media change (`api.md` "Hub → website"). So a feed built from the same cache is fresh within seconds of a Hub change, 60 s worst case. |
| Landing-page URL construction | The Hub would have to know the storefront's locale URL scheme (`/en/products/<slug>`), which lives in `lib/locale.ts` (`localePath`). Duplicated knowledge. | `localePath` and `getBaseUrl` are the storefront's own; the feed cannot mint a wrong URL. |
| Availability logic | Would re-implement "sold" from `stock_qty` / `status`. | Reuses `productAvailability` / `variantAvailability` (`lib/availability.ts`) — the one definition the pages use, so feed and page can never disagree. |
| Sale price | Hub has both prices. | Hub sends `price_jpy` (sale) and `full_price_jpy` (regular) + `on_sale`; both copied. |
| Hub load | None extra. | One `limit=5000` catalog call per fetch (cached). Catalog is ~449 products; the 5000 ceiling is not a constraint today. |
| Serving domain | The Hub's host (not the verified storefront domain). Allowed for a fetch URL, but a second host to keep up. | `https://www.chajewelsjp.com/api/merchant-feed.xml` on the verified domain. `/api/` is already `Disallow` in `robots.txt`; Merchant Center scheduled fetch does not need robots access to the feed file itself (**UNVERIFIED** — confirm in Merchant Center diagnostics on first fetch). |
| Testing | Hub repo. | Unit test the pure builder (product → item) in `tests/`; render-check with the fixtures build like `scripts/check-seo-live.mjs` does. Mirrors the existing sitemap pattern (`app/sitemap.ts` is the same shape of work). |
| Deployment coupling | Hub deploy. | Storefront deploy through `develop` → `main`; ISR. |

**Recommendation: Option B (storefront route), with the pure item builder in `lib/merchant-feed.ts` and the route under `app/api/`.** Reasons, in order: it reuses the exact availability, locale-URL, price and origin rules the product page uses (one definition, no second source); the Website API is already the privacy boundary; the cache-bust path already exists; and it is testable in this repo under the existing guards (`check:money`, `check:terms`). Option A stays the fallback if the owner prefers the Hub to own all outbound data, or if a later need (per-variant `updated_at`, product-level GTIN if ever recorded) is not in the Website API — then Claude drafts the contract in §10 and Lovable builds it.

**Not recommended:** Merchant Center's "automatic feed from your website" / website crawl. It would read today's Product JSON-LD, which carries no `gtin`/`mpn`/`shippingDetails` and is opaque to review. (Corrected 2026-11-01, MC-G2: the earlier claim that the JSON-LD "uses `description_en` on both locales (X5)" was stale — `lib/json-ld.ts` uses `description_ja` on `/ja` when the Hub has it; X5 closed in Phase 4.) Automatic item updates **from** structured data (price/availability corrections) are a Merchant Center setting the owner may turn on later; it is documented on Google's product-data page as optional (fetched 2026-10-29).

Either option is **IMPLEMENTING only after**: X8 answered (§1), OD-MC-1..3 (§8) decided, and the route approved.

---

## 4. Field mapping: `Product` / `ProductVariant` → Google product data specification

Source for the attribute rules: Google Merchant Center Help, "Product data specification" (support.google.com/merchants/answer/7052112, fetched 2026-10-29) and "shipping [shipping]" (answer/6324484, fetched 2026-10-29). Limits quoted from there. One feed **item per variant**; variants of one product share `item_group_id`.

| Google attribute | Value | Source field | Notes / rule |
|---|---|---|---|
| `id` (required, ≤50 chars) | `<variant.id>` | `ProductVariant.id` | Stable per variant. Never the slug (slugs can be edited in the Hub). Same `id` for the EN and JA feeds. |
| `item_group_id` | `<product.id>` | `Product.id` | Groups sizes/stones of one piece. |
| `title` (required, ≤150) | EN feed: `name_en ?? name`; JA feed: `name_ja ?? name` | `Product.name_en` / `name_ja` / `name` | Pick through `lib/catalog-i18n` (the rule: never read one language's column directly). Append the variant's `size` / `stone` only when present, e.g. "— size 12". No marketing prefixes, no "K18 gold" injected by template unless `karat`/`metals` says so (then use the Hub's `metalsLabel`). |
| `description` (required, ≤5000) | `description_en` / `description_ja`; **fallback: omit the item** if the chosen language has no description (do not fall back to another language — the landing page must be in the feed's language, Google rule in §8) | `Product.description_*` | Plain text; strip Markdown if the Hub ever sends it. |
| `link` (required) | `https://www.chajewelsjp.com/en/products/<slug>` (EN feed) · `https://www.chajewelsjp.com/ja/products/<slug>` (JA feed) | `Product.slug` + `localePath` | Self-canonical since Phase 2B. Never the bare `/products/<slug>` (307 today, 308 later). Never `?lang=`. |
| `image_link` (required) | First `product_media` by `sort` of the variant; else first image of any variant | `ProductVariant.product_media[0].url` | Must be a crawlable absolute URL. **UNVERIFIED:** whether the image host (Supabase storage / Hub) allows Googlebot — check `robots.txt` of that host and Merchant Center "image crawl" diagnostics. Minimum 500×500 px is announced for enforcement from 2027-01-31 (Google page). Cut-outs: send the original photo (`url`), not `cutout`/`hero_cutout`, which are display assets with approval states. |
| `additional_image_link` | Remaining `product_media[].url`, up to 10 | `product_media[1..]` | Optional. |
| `availability` (required) | `variantAvailability(variant, product.status) === "available"` → `in_stock`; else `out_of_stock` | `stock_qty`, `status` | **D3 / X10 / plan §15:** sold pieces are sent as `out_of_stock`, not dropped, because their pages stay live. `preorder`/`backorder` are never used (no such state exists on the site). |
| `price` (required) | `on_sale ? full_price_jpy : price_jpy`, as `"<integer> JPY"` | `ProductVariant.price_jpy`, `full_price_jpy`, `on_sale` | Hub integer, copied. Tax-inclusive, which matches Google's rule for non-US/CA targets and the tokusho (tax included). Never `price_php` in a JPY feed; a PHP feed (OD-MC-2) would copy `price_php` and omit the item when it is absent. **No conversion anywhere.** |
| `sale_price` | `on_sale ? price_jpy : (omit)` | same | Both numbers are the Hub's. `sale_price_effective_date` is not sent (the Hub has no sale window field in the API). |
| `condition` | `condition === "Preloved"` → `used`; else `new` | `Product.condition` | Absent treated as `New`, the site rule. Never `refurbished`. |
| `brand` | only when `origin === "BRAND"` and `brand.trim()` non-empty → `brand`; otherwise **omitted** | `Product.origin`, `Product.brand` | Mirrors the Product JSON-LD rule (`lib/json-ld.ts:58`). Do **not** fill "Cha Jewels" for unbranded pieces unless the owner decides so (OD-MC-4); the site itself claims no brand there and rule 11 forbids fabricated brand. |
| `gtin` / `mpn` | never sent | — | No such data exists (§1). An invalid GTIN causes disapproval (Google). |
| `identifier_exists` | `no` on every item that has no `gtin` and no `mpn` — today, every item | — | Truthful: unique/hallmarked jewelry without GS1 codes. Google: set `no` only when the product genuinely lacks the identifiers its category requires; "if the product does have valid identifiers, submitting no may cause disapproval" — not our case. |
| `google_product_category` | numeric ID from the Google taxonomy (fetched 2026-10-29, `taxonomy-with-ids.en-US.txt`): `188` Apparel & Accessories > Jewelry (default) · `200` Rings · `196` Necklaces · `191` Bracelets · `194` Earrings · `192` Charms & Pendants · `189` Anklets · `197` Brooches & Lapel Pins · `6463` Jewelry Sets · `201` Watches | `collection_slugs` (first slug mapped), `item_type === "Watch"` → 201 | Mapping table lives in the builder, keyed by Hub collection slug. **UNVERIFIED:** the live Hub collection slugs (baseline counted 12; fixtures show `necklaces`, `earrings`, `bracelets`, `rings`, `pendants`). The owner/Hub exports the slug list before implementation; unmapped slugs fall back to 188. |
| `product_type` | `"<collection name>"` or `"Preloved > <collection name>"` | `collection_slugs` → `collectionName` | Optional, free text, for reporting. |
| `material` | `metalsLabel(metals, lang)` e.g. "K18" / "PT900" | `Product.metals` / `karat` | Optional; the same label the page shows. |
| `size` | `variant.size` when present | `ProductVariant.size` | Optional. |
| `shipping` | Prefer **account-level** shipping settings (Google: use the attribute "as a last resort"). If sent per item: `JP::800 JPY` for the Japan rate; the free-from-¥8,000 rule is expressed by account settings or the `free_shipping_threshold` attribute (**UNVERIFIED** — its own spec page was not read). | `/shopping-guide` rate card (the Hub's) | **Owner confirms** the rate card (OD-MC-5). Outside-Japan rates are not published; a PH feed cannot carry shipping until a rate card exists. |
| `shipping_weight` | `weight_g` as `"<n> g"` | `Product.weight_g` | Optional; piece weight, not parcel weight — probably omit (OD-MC-6). |
| `adult` | not sent | — | — |
| `expiration_date` | not sent | — | Items refresh daily (§5), so no explicit expiry. |

**Items excluded from the feed:** `status !== "active"` (the API already returns active only); a product with zero variants (the page treats it as sold — send nothing rather than an item with no price); a variant with no `price_jpy` (should not occur: `price_jpy: number`); a product with no image; a product with no description in the feed's language.

**Never in the feed:** `down_payment_*` (layaway deposit figures), `price_php` in a JPY feed, `hero_place`, `cutout` states, anything under `/account`, customer or order data.

---

## 5. Draft DAILY sync and inventory policy

Google's product-data page says products whose prices or availability change often must be re-sent so they can keep showing; a stale item is a price/availability mismatch and a disapproval. Cha Jewels' inventory is mostly single-quantity pieces, so a sale flips `in_stock → out_of_stock` for the whole item.

| Element | Policy (draft, owner to approve) |
|---|---|
| Feed URL | Option B: `https://www.chajewelsjp.com/api/merchant-feed.xml` (+ `?lang=ja` or a second path for JA; decide with OD-MC-1). Option A: a Hub URL Lovable provides. |
| Fetch method | Merchant Center **scheduled fetch**, **daily**, at 03:00 JST (after the Hub's evening edits, before the owner's working day). Fetch frequency options and exact UI wording: **UNVERIFIED** (Google's page was not fully readable); set what the UI offers. |
| Freshness between fetches | Storefront cache is busted by the Hub's `notify_website` on every product/variant/media change, so the feed is correct within ~60 s of a Hub change; Merchant Center only sees it at the next fetch. Accept up to 24 h of lag for free listings; if a sold piece being shown for a day is unacceptable, the follow-ups are (a) a second daily fetch or (b) Merchant API push on `notify_website` — a Hub-side change, Lovable's, later and only on evidence. |
| Sold pieces | Sent as `out_of_stock` for as long as the page is live (D3). If X10 later removes a product from the sitemap or noindexes it, the same policy module (`lib/seo-policy.ts`) should drive the feed exclusion so page, sitemap and feed agree. |
| Price changes / sales | Picked up at the next fetch. Sale: `price` = regular, `sale_price` = sale, both the Hub's. |
| New products | Appear at the next fetch; first approval can take time (Google review). |
| Failed fetch | Merchant Center keeps the last good data; items expire if not refreshed within Google's window (**UNVERIFIED** exact window; commonly 30 days). A fetch failure must be visible to the owner (Merchant Center email alerts on). |
| Hub outage during fetch | The route must answer a non-200 (not an empty feed): an empty 200 feed would mark every item missing. (Contrast with `app/sitemap.ts`, where a partial sitemap is acceptable.) |
| Daily owner check (2 minutes) | Merchant Center → Products → Diagnostics: new disapprovals, "price mismatch", "availability mismatch", image errors. Record in the weekly report (`docs/seo/phase-12/SEARCH-CONSOLE-OPERATIONS.md` §6). |

---

## 6. Landing-page requirements the feed depends on (already true or to verify)

- `/en/products/<slug>` and `/ja/products/<slug>` return 200 for a crawler, self-canonical, reciprocal hreflang: Phase 2 DEPLOYED, production-verified (status doc). SEARCH ENGINE RECRAWL PENDING is not a blocker for Merchant Center.
- Price on the page equals the feed `price` (same `price_jpy` from the same API; the page shows the sale price with the regular struck through — `components/commerce/sale-price.tsx`). Merchant Center compares its crawl of the page with the feed; today's Product JSON-LD `offers.price` is `fromPrice(product)` (the lowest variant), which for a multi-variant product differs from a dearer variant's feed price. Phase 4 should emit per-variant offers or `AggregateOffer`; until then expect "price mismatch" warnings on multi-variant pieces (noted for Phase 4, no change here).
- Availability on the page: "Sold" state renders when `productAvailability === "sold"`; JSON-LD says `SoldOut`. Merchant Center accepts `out_of_stock` against a page that says sold.
- Language: the landing page language must equal the feed language (Google, "Supported countries and languages", fetched 2026-10-29). `/ja/` pages are Japanese, `/en/` pages English, so each feed points at its own locale.
- Checkout: Merchant Center policy requires a working purchase path, returns policy and contact information on the site. Present: `/en|/ja/shopping-guide`, `/legal/returns`, `/legal/tokusho`, `/contact`. The Return, Cancellation and Refund Policy is "no change-of-mind returns; defect/wrong item within 5 days" — enter exactly that in Merchant Center's returns settings; never invent a return window (rule 11).

---

## 7. Monitoring checklist (plan PHASE 5 "Monitor")

Weekly, in Merchant Center (owner or delegate; results go into the Phase 12 weekly report, never into this file):

| Check | Where | What to do |
|---|---|---|
| Rejected / disapproved items | Products → Diagnostics → Item issues | Group by reason. "Missing value [brand]" on new unbranded pieces means `identifier_exists` is not being read — check the feed. "Invalid value [availability]" means a typo in the builder. |
| Missing identifiers warnings | Diagnostics | Expected to be informational with `identifier_exists: no`. If they are errors, re-read the current spec; do not add fake GTINs. |
| Price mismatch | Diagnostics → "Mismatched value (page crawl)" → price | Compare the item's `price` with `/en/products/<slug>` and with the Hub. If the Hub changed the price, it is a lag problem (§5); if not, a builder bug. Multi-variant pieces: see §6 (Phase 4). |
| Availability mismatch | Diagnostics → availability | Same triage. A sold piece still `in_stock` for more than a day is a fetch failure. |
| Image issues | Diagnostics → image_link | Too small, not crawlable, text/watermark overlay, placeholder. Fix in the Hub media, not in the feed. |
| Landing page errors | Diagnostics → "Landing page not working" | 404/5xx/robots blocks. Check Vercel status and that `/api/` disallow does not cover product pages (it does not). |
| Policy / account-level issues | Account → Issues | Business information, returns policy, contact info, unverified website. |
| Feed fetch status | Products → Data sources | Last fetch time, item count (should be close to the active variant count from the Hub), fetch errors. |
| Free-listings status | Growth → Manage programs | Enabled / under review / disapproved. |

Any "the product shows on Google" claim is **OBSERVED IN MERCHANT CENTER** only when read from the Diagnostics/Performance tab; nothing here is marked live.

---

## 8. Owner decisions and approvals

| ID | Decision | Options | Recommendation | Why it matters |
|---|---|---|---|---|
| OD-MC-1 | Which feed first: Japanese (JP, JPY, `/ja/` links, `description_ja`) or English (`/en/` links, `description_en`)? | JA-first · EN-first · both | **JA-first for target country Japan**; EN as a second feed once OD-MC-2 is settled. Google's "Supported countries and languages" page (fetched 2026-10-29) lists Japan with JPY and requires the landing page to be in the feed's language; whether an English-language feed is accepted for target country Japan is **UNVERIFIED** and must be checked in the Merchant Center UI (it offers the allowed languages per country when a data source is created). | Determines link, title and description columns. |
| OD-MC-2 | English feed target: Japan (if English is allowed) or the Philippines (PHP, Shopping tab available per Google's page)? | JP · PH · none yet | Decide after OD-MC-1. A PH feed needs `price_php` (Hub-provided, present on variants) and a published PH shipping rate (none today) — so PH is BLOCKED on a rate card, not on code. | A PH listing with no shipping information is disapproved or misleading. |
| OD-MC-3 | Account structure | one account, two data sources | one account (`www.chajewelsjp.com`), one data source per feed language | Verification is per domain. |
| OD-MC-4 | `brand` for unbranded new pieces | omit (recommended) · "Cha Jewels" | **Omit**, matching the site. If the owner wants "Cha Jewels" as a brand, that is a merchandising decision to record here and mirror in Product JSON-LD (Phase 4), not a feed-only tweak. | Rule 11 (no fabricated brand). |
| OD-MC-5 | Shipping representation | account-level JP settings (¥800 under ¥8,000 of pieces, free from ¥8,000) · per-item `shipping` attribute | **Account-level**, owner enters it; confirm the rate card is still the Hub's current one. | Google recommends account-level; the figures are the Hub's. |
| OD-MC-6 | Send `shipping_weight` from `weight_g`? | yes · no | **No** (piece weight ≠ parcel weight). | Avoids a wrong delivery estimate. |
| OD-MC-7 | Where the feed lives | Option B storefront route (recommended) · Option A Hub endpoint | **Option B**; approve the new route `app/api/merchant-feed/route.ts` (route-change rule). | Ownership, testing, privacy boundary (§3). |
| OD-MC-8 | Fetch time and frequency | daily 03:00 JST (recommended) · twice daily | daily, review after four weeks of Diagnostics | §5 |
| OD-MC-9 | Sold pieces in the feed | `out_of_stock` (recommended, D3) · excluded | `out_of_stock` while D3 stands; revisit with X10 | Page/feed agreement |
| OD-MC-10 | Returns policy text in Merchant Center | as published on `/legal/returns` | copy verbatim | Rule 11 |

Approval table (to be filled by the owner; this document records, it does not decide):

| Item | Approved? | Date | Note |
|---|---|---|---|
| X8 answered (account, verification, free listings) | | | |
| OD-MC-1 feed language | | | |
| OD-MC-2 EN target | | | |
| OD-MC-4 brand | | | |
| OD-MC-5 shipping rate card confirmed | | | |
| OD-MC-7 new route `/api/merchant-feed.xml` | | | |
| Phase 5 → IMPLEMENTING | | | |

---

## 9. Implementation outline (for the later IMPLEMENTING step; nothing built here)

1. `lib/merchant-feed.ts`: pure `feedItems(products: Product[], lang: Lang, base: string): FeedItem[]` and `renderRss(items): string` (RSS 2.0 with the `g:` namespace). Imports `variantAvailability`, `localePath`, `metalsLabel`, the catalog-i18n pickers. No arithmetic on any price. Category map by collection slug.
2. `app/api/merchant-feed/route.ts`: `hub.allProducts(5000)` → items → XML; `Content-Type: application/xml`; non-200 on Hub failure; cached with the `catalog` tag like the pages.
3. Tests (`tests/merchant-feed.test.mjs`): availability mapping (`stock_qty` 0 → `out_of_stock`, `archived` → `out_of_stock`), sale mapping, brand only on BRAND, `identifier_exists: no` always, `/en/` vs `/ja/` links, no `down_payment_*` or `price_php` in a JPY feed, omit without description/image, category fallback 188, XML escaping. Regression: `check:money`, `check:terms`, `check:i18n` unchanged.
4. Live check: extend `scripts/check-seo-live.mjs` or add a feed probe: well-formed XML, item count vs `productSlugs()` count, every `link` answers 200.
5. Owner: create the data source in Merchant Center pointing at the URL, run a manual fetch, read Diagnostics, record in the Phase 12 report.
6. Documentation: `SEO-IMPLEMENTATION-STATUS.md` Phase 5 row (orchestrator), `SEO-QA-REPORT.md` entry.

---

## 10. Contract DRAFT (kept here; `supabase/contracts/` is not touched by this phase)

If OD-MC-7 chooses **Option A**, this is the contract Claude would propose to Lovable, written in the style of `supabase/contracts/api.md`:

```text
GET /feeds/merchant.xml?lang=ja|en            (x-api-key or a dedicated feed token)
Returns: RSS 2.0, xmlns:g="http://base.google.com/ns/1.0", one <item> per active variant.
Fields per item (all copied, none computed):
  g:id = variant.id · g:item_group_id = product.id
  g:title = name_<lang> ?? name (+ " — " + size/stone when present)
  g:description = description_<lang>; item omitted when null
  g:link = https://www.chajewelsjp.com/<lang>/products/<slug>
  g:image_link = first product_media.url by sort; g:additional_image_link = the rest (≤10)
  g:availability = stock_qty > 0 and status = active ? in_stock : out_of_stock
  g:price = (on_sale ? full_price_jpy : price_jpy) + " JPY"; g:sale_price = on_sale ? price_jpy + " JPY" : omitted
  g:condition = condition = Preloved ? used : new
  g:brand = brand when origin = BRAND and brand non-empty; else omitted
  g:identifier_exists = no (no gtin/mpn exist)
  g:google_product_category = numeric id by collection slug (188 default; 201 for item_type Watch)
  g:material = metals label; g:size = variant.size when present
Never: cost basis, margin, commission, supplier, down_payment_*, price_php (in the JPY feed), customer or order data.
Errors: 503 when the catalog read fails (never an empty 200).
Cache: public, max-age 300.
```

Option B needs no Hub contract change: it reads `GET /catalog/products?limit=5000` exactly as `lib/search.ts` does today.

---

## 11. Documentation used

- Google Merchant Center Help — Product data specification: https://support.google.com/merchants/answer/7052112 (fetched 2026-10-29; the shipping section of that page was beyond the readable range)
- Google Merchant Center Help — shipping [shipping]: https://support.google.com/merchants/answer/6324484 (fetched 2026-10-29)
- Google Merchant Center Help — Supported countries and languages: https://support.google.com/merchants/answer/160637 (fetched 2026-10-29)
- Google product taxonomy with IDs: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt (fetched 2026-10-29)
- Google Merchant Center Help — About product data / updating: https://support.google.com/merchants/answer/188494 (fetched 2026-10-29; upload-method and fetch-frequency sections were not readable — marked UNVERIFIED above)
- Repository: `supabase/contracts/api.md`, `lib/types.ts`, `lib/hub-api.ts`, `lib/availability.ts`, `lib/json-ld.ts`, `lib/content/shopping-guide.ts`, `lib/content/legal.ts`, `app/sitemap.ts`, `docs/seo/SEO-BASELINE.md`, `docs/seo/SEO-IMPLEMENTATION-STATUS.md`

**UNVERIFIED (summary):** Merchant Center / Search Console account state (X8); English-feed acceptance for target country Japan; `free_shipping_threshold` attribute details; scheduled-fetch frequency options and item expiry window; image-host crawlability; the live Hub collection slug list; whether the feed URL under `/api/` (robots-disallowed) is fetched without issue.
