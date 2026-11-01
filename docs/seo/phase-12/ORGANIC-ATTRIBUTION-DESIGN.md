# Phase 12 — organic purchase and revenue attribution: design for owner decision (2026-11-01)

**Status:** DESIGN ONLY (R-04). Nothing is implemented; no tracking, consent, Hub or payment change was made. **Corrected 2026-11-01 (review of `d0b3b5f`):** the consent classification is no longer asserted (§4 states the assumptions and defaults to consent-gated); the commercial metrics are defined exactly (§2), and two of them are marked NOT MEASURABLE under this design. The Hub stays authoritative for orders and payments; payment logic is not touched by this design.

## 1. What exists today [V 2026-11-01, code]

| Layer | What it records | Source of truth for | Consent |
|---|---|---|---|
| Vercel Web Analytics (`lib/analytics.ts`) | page views; custom events `product_view`, `add_to_cart`, `search`, `hero_slide_cta`, `service_request`, `share` with at most two properties each; production only | browser behaviour (aggregates) | cookieless, no consent gate |
| Meta Pixel + Google Ads tag (`lib/ads.ts`, `components/analytics/ads-tags.tsx`) | page views (clean URLs only), product view, add to cart, search, checkout start, a purchase-labelled value after order/draft/plan creation (`purchaseFromPayResult`: the Hub's `total` and `currency`) — never a name, email, address or order reference | advertising platforms | only after Accept on the cookie banner (`lib/consent.ts`) |
| Vercel Speed Insights | Core Web Vitals field samples | performance | cookieless |
| The Hub | `cash_orders`, `cash_payments`, drafts, layaway plans; `web_reference` (`CJ-W-000123`) | **orders and payments** | n/a |
| Search Console | queries, pages, clicks, impressions | organic search visibility | n/a |

**Gaps:** no GA4; no capture of the visit's source (referrer, `utm_*`, `gclid`); no join between a browser session and a Hub order; the advertising "purchase" events fire at order/draft/plan **creation**, which is not a confirmed payment (reserve-first checkout: staff confirm, then the customer pays). `docs/measurement-log.md` records the deliberate decision not to join the two sides.

## 2. What the plan asks for (§29 Commercial) — defined exactly

The plan names: organic add-to-cart · organic checkout start · organic purchase · organic revenue · average order value · layaway starts from organic · repeat customers from organic. Each is defined below so that no number is reported under a looser meaning. "Organic" throughout = the visit's FIRST-TOUCH source class is `organic_search` (a known search-engine referrer host, no paid click parameter), within the 30-day attribution window of §3 Option A. Money is reported **per settlement currency** (JPY and PHP separately, the Hub's `total` and `currency`); nothing is converted or summed across currencies (money rule).

| Metric | Definition | Source of truth | Measurable under Option A without a tracking change? |
|---|---|---|---|
| Organic purchase (count) | Hub orders whose `acquisition_source = organic_search` AND whose payment state is **paid** (`payment_status = paid`; `completed` cash orders), counted at the time the Hub marks them paid, not at creation; cancelled, expired, failed and refunded orders excluded; a store-credit or partial refund keeps the order but is reported separately | Hub report | yes, once the Hub stores the source (OD-ATTR-4) |
| Organic revenue | Sum of `total` of those paid orders, per currency, net of refunds the Hub records (`refund_status = refund_issued` subtracts the refunded amount the Hub holds; the storefront computes nothing) | Hub report | yes, same condition |
| Average order value (organic) | Organic revenue ÷ organic purchase count, per currency, computed in the Hub report; undefined (print "n/a") when the count is 0 | Hub report | yes |
| Layaway starts from organic | Layaway **plans created** with the source class; reported as starts, never as revenue (a plan is paid in instalments; revenue counts only when the Hub marks the plan paid in full) | Hub report | yes |
| Repeat customers from organic | Customers whose FIRST paid order carried `organic_search` and who have a SECOND paid order (any source) within 365 days of the first; reported as a count and as a share of first-time organic buyers | Hub report | yes, needs the customer link the Hub already has |
| Organic checkout start | A checkout started by a visit whose first touch was organic | browser event | **NOT measurable** under Option A as designed: the storefront's `checkout_start` advertising event carries no source dimension and the Vercel Web Analytics events carry at most two properties; adding the class to an event is a tracking change that needs its own approval (OD-ATTR-5) |
| Organic add-to-cart | As above for `add_to_cart` | browser event | **NOT measurable** under Option A; same condition (OD-ATTR-5) |

What the existing tags CANNOT supply for any of these: the advertising "purchase" value fires at order, draft or plan **creation** (`purchaseFromPayResult`), which is not a confirmed payment, and no event carries a source; those figures must not be reported as organic revenue.

## 3. Design options

| Option | How | Pros | Cons / decisions it needs |
|---|---|---|---|
| A. **First-touch source stamp on the checkout record (recommended)** | On the first page view of a visit, the storefront derives a source class from `document.referrer` and `utm_*`/`gclid`/`fbclid` only (`organic_search` when the referrer host is a known search engine and no paid parameter is present; `paid`, `social`, `direct`, `referral`, `email` otherwise), stores **only the class and the search-engine host** in a first-party cookie (`cj-src`, 30 days, no identifier), and sends it with the existing checkout Server Action as one new field on the quote/draft creation call. The Hub stores it on the draft/order (`acquisition_source`, `acquisition_host`). Reporting = a Hub query: orders/plans by source × payment state × `total`. | truthful (a payment is counted only when the Hub marks it paid); no third-party tool; no personal data (a class, not a URL or id); works with the reserve-first flow; AOV, layaway starts and repeat customers come from the same join | needs: one storefront change (cookie + one field), one Hub contract change (Lovable; a nullable column and the field on `POST /checkout/quote` or `/checkout/pay`), a Hub report. Decisions OD-ATTR-1..3 below |
| B. GA4 with Enhanced Ecommerce | add GA4; send `purchase` at creation; join by `transaction_id` | industry standard dashboards | the order reference would leave the site (the privacy policy promises it never does); creation ≠ payment; a new consent-gated tag; cross-system id sharing with Google — rejected unless the owner changes the privacy stance |
| C. Search Console only | treat Search Console clicks to product/checkout-adjacent pages as "organic demand", read Hub totals separately | zero change | no attribution; answers only "organic traffic", not organic revenue |

## 4. Privacy and consent — assessment with its assumptions stated

What is stored under Option A: a source class (one of six words) and, for organic search, the search engine's hostname (e.g. `www.google.com`); no URL, query, click id, IP, name or email; a first-party cookie for 30 days; the class is later attached to the customer's order in the Hub, where the customer's data already lives under the existing privacy policy.

**Consent status: UNDECIDED — this is a legal classification the owner (or counsel) makes, not the design.** The earlier draft called the cookie "strictly functional"; that was an assumption, and it is withdrawn. The facts a decision needs:

- The cookie exists only to measure where a customer came from; it is not needed to deliver any page, cart, checkout or payment. Under the EU ePrivacy rules as commonly applied, measurement cookies are not "strictly necessary" and need consent; the site serves customers worldwide, and the existing cookie banner already gates the advertising tags (`lib/consent.ts`), so EU visitors are a real case. [U] as a legal conclusion for this site.
- Under Japan's rules (APPI as amended 2022; the Telecommunications Business Act external-transmission rules in force since 2023), a first-party cookie read by the site itself for its own measurement is generally treated differently from transmission to a third party, and nothing here is transmitted to a third party; whether notice alone suffices is counsel's call. [U]
- The Philippines Data Privacy Act applies to Filipino customers; a source class with no identifier is unlikely to be personal information on its own, but it is linked to an identified order in the Hub. [U]
- The cookie is linked to a person at checkout: from that moment it is part of the customer's order record. The privacy policy's cookie section lists no such cookie today (OD-ATTR-2 adds it in EN and JA).

**Design consequence:** the recommendation is **consent-gated by default** (the cookie is set only after Accept on the existing banner, exactly like the advertising tags), with an explicit owner option to treat it as notice-only if counsel says so. Consent-gating under-counts organic orders from customers who decline; the report must state the gate and that under-count every time it is read. Without a decision, nothing is set and the metrics stay NOT STARTED.

**Retention:** 30-day cookie; the Hub column lives as long as the order. **Cross-system:** nothing is sent to a third party; the Hub receives one field from the storefront it already trusts (`HUB_API_KEY` + customer JWT).

## 5. Implementation outline (after approval; not started)
1. Storefront: `lib/acquisition.ts` (pure classifier, unit-tested with referrer/parameter cases), a tiny client component that sets `cj-src` on first view when absent, `lib/checkout-actions.ts` passes `acquisition` on quote creation. `check:analytics` and `check:money` unchanged (no figure, no tag).
2. Hub (Lovable; Claude drafts the contract in `supabase/contracts/api.md`): nullable `acquisition_source`/`acquisition_host` on drafts, orders and plans; copied from the draft at confirmation; one report "orders by acquisition × payment state × month".
3. Reporting: monthly, in the Phase 12 report, from the Hub report only, with the §2 definitions verbatim (paid orders only, per currency, refunds netted as the Hub records them, layaway as starts, repeat within 365 days) and the consent gate and its under-count stated in every report.
4. Tests: classifier cases; Server Action sends the field only when the cookie is valid; Hub contract test with a mocked Hub.

## 6. Owner decisions (consolidated)
| ID | Decision | Recommendation |
|---|---|---|
| OD-ATTR-1 | Adopt Option A (first-touch source stamp joined in the Hub), B (GA4) or C (none) | A |
| OD-ATTR-2 | Privacy policy: add the `cj-src` cookie to the cookie section (EN/JA wording to be drafted on approval) | yes |
| OD-ATTR-3 | Consent: gate the cookie behind the cookie banner's Accept (fewer counted orders, every report states the under-count) or, on counsel's advice, set it on notice alone | **consent-gated** until counsel says otherwise (the "functional" classification is not established; §4) |
| OD-ATTR-4 | Hub work item for Lovable (columns, field, report) — authorise Claude to draft the contract | yes |
| OD-ATTR-5 | Whether "organic add-to-cart" and "organic checkout start" are wanted at all: they need the source class on a browser event (a tracking change with its own approval and consent review); otherwise they are reported as NOT MEASURED, never estimated | report NOT MEASURED |

No decision = nothing changes; the plan's commercial metrics stay NOT STARTED. **Documentation used:** `lib/analytics.ts`, `lib/ads.ts`, `lib/consent.ts`, `lib/checkout-actions.ts`, `supabase/contracts/api.md` (order and payment states), `docs/measurement-log.md`, `lib/content/legal.ts` (cookie section). **UNVERIFIED:** every legal classification in §4 (the owner's counsel decides); whether any dashboard receives the existing advertising events.
