# Phase 12 — organic purchase and revenue attribution: design for owner decision (2026-11-01)

**Status:** DESIGN ONLY (R-04). Nothing is implemented; no tracking, consent, Hub or payment change was made. The Hub stays authoritative for orders and payments; payment logic is not touched by this design.

## 1. What exists today [V 2026-11-01, code]

| Layer | What it records | Source of truth for | Consent |
|---|---|---|---|
| Vercel Web Analytics (`lib/analytics.ts`) | page views; custom events `product_view`, `add_to_cart`, `search`, `hero_slide_cta`, `service_request`, `share` with at most two properties each; production only | browser behaviour (aggregates) | cookieless, no consent gate |
| Meta Pixel + Google Ads tag (`lib/ads.ts`, `components/analytics/ads-tags.tsx`) | page views (clean URLs only), product view, add to cart, search, checkout start, a purchase-labelled value after order/draft/plan creation (`purchaseFromPayResult`: the Hub's `total` and `currency`) — never a name, email, address or order reference | advertising platforms | only after Accept on the cookie banner (`lib/consent.ts`) |
| Vercel Speed Insights | Core Web Vitals field samples | performance | cookieless |
| The Hub | `cash_orders`, `cash_payments`, drafts, layaway plans; `web_reference` (`CJ-W-000123`) | **orders and payments** | n/a |
| Search Console | queries, pages, clicks, impressions | organic search visibility | n/a |

**Gaps:** no GA4; no capture of the visit's source (referrer, `utm_*`, `gclid`); no join between a browser session and a Hub order; the advertising "purchase" events fire at order/draft/plan **creation**, which is not a confirmed payment (reserve-first checkout: staff confirm, then the customer pays). `docs/measurement-log.md` records the deliberate decision not to join the two sides.

## 2. What the plan asks for (§29 Commercial)
organic add-to-cart · organic checkout start · organic purchase · organic revenue · average order value · layaway starts from organic · repeat customers from organic.

Each needs (a) a per-visit **source classification** (organic search vs other), (b) a link from that visit to a Hub record, and (c) the Hub's **confirmed payment** state, read in the Hub, never in the browser.

## 3. Design options

| Option | How | Pros | Cons / decisions it needs |
|---|---|---|---|
| A. **First-touch source stamp on the checkout record (recommended)** | On the first page view of a visit, the storefront derives a source class from `document.referrer` and `utm_*`/`gclid`/`fbclid` only (`organic_search` when the referrer host is a known search engine and no paid parameter is present; `paid`, `social`, `direct`, `referral`, `email` otherwise), stores **only the class and the search-engine host** in a first-party cookie (`cj-src`, 30 days, no identifier), and sends it with the existing checkout Server Action as one new field on the quote/draft creation call. The Hub stores it on the draft/order (`acquisition_source`, `acquisition_host`). Reporting = a Hub query: orders/plans by source × payment state × `total`. | truthful (a payment is counted only when the Hub marks it paid); no third-party tool; no personal data (a class, not a URL or id); works with the reserve-first flow; AOV, layaway starts and repeat customers come from the same join | needs: one storefront change (cookie + one field), one Hub contract change (Lovable; a nullable column and the field on `POST /checkout/quote` or `/checkout/pay`), a Hub report. Decisions OD-ATTR-1..3 below |
| B. GA4 with Enhanced Ecommerce | add GA4; send `purchase` at creation; join by `transaction_id` | industry standard dashboards | the order reference would leave the site (the privacy policy promises it never does); creation ≠ payment; a new consent-gated tag; cross-system id sharing with Google — rejected unless the owner changes the privacy stance |
| C. Search Console only | treat Search Console clicks to product/checkout-adjacent pages as "organic demand", read Hub totals separately | zero change | no attribution; answers only "organic traffic", not organic revenue |

## 4. Privacy and consent assessment for Option A
- **Data stored:** a source class (one of six words) and, for organic search, the engine's hostname (e.g. `www.google.com`). No URL, query, click id, IP, name or email. Not personal data on its own; it becomes attached to the customer's order in the Hub, where the customer's data already lives under the existing privacy policy.
- **Consent:** the cookie is strictly functional for the site's own measurement of a transaction the customer initiates (comparable to the existing cookieless Vercel analytics). It is still a new cookie: the privacy policy's cookie section must list it (OD-ATTR-2), and the owner may choose to gate it behind the existing Accept (OD-ATTR-3), which would under-count organic orders from customers who decline.
- **Retention:** 30-day cookie; the Hub column lives as long as the order.
- **Cross-system:** nothing is sent to a third party; the Hub receives one field from the storefront it already trusts (`HUB_API_KEY` + customer JWT).

## 5. Implementation outline (after approval; not started)
1. Storefront: `lib/acquisition.ts` (pure classifier, unit-tested with referrer/parameter cases), a tiny client component that sets `cj-src` on first view when absent, `lib/checkout-actions.ts` passes `acquisition` on quote creation. `check:analytics` and `check:money` unchanged (no figure, no tag).
2. Hub (Lovable; Claude drafts the contract in `supabase/contracts/api.md`): nullable `acquisition_source`/`acquisition_host` on drafts, orders and plans; copied from the draft at confirmation; one report "orders by acquisition × payment state × month".
3. Reporting: monthly, in the Phase 12 report, from the Hub report only; "organic revenue" = sum of `total` of **paid** orders with `acquisition_source = organic_search`; layaway starts = plans created with that source; repeat = a second paid order by the same customer whose first was organic.
4. Tests: classifier cases; Server Action sends the field only when the cookie is valid; Hub contract test with a mocked Hub.

## 6. Owner decisions (consolidated)
| ID | Decision | Recommendation |
|---|---|---|
| OD-ATTR-1 | Adopt Option A (first-touch source stamp joined in the Hub), B (GA4) or C (none) | A |
| OD-ATTR-2 | Privacy policy: add the `cj-src` cookie to the cookie section (EN/JA wording to be drafted on approval) | yes |
| OD-ATTR-3 | Gate the cookie behind the cookie banner's Accept (fewer counted orders) or treat it as functional (no gate) | functional (no personal data) |
| OD-ATTR-4 | Hub work item for Lovable (columns, field, report) — authorise Claude to draft the contract | yes |

No decision = nothing changes; the plan's commercial metrics stay NOT STARTED.
