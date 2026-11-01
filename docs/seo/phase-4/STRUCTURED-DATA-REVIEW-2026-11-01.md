# Phase 4 — structured-data review (2026-11-01): entity type, Offer consistency, sharing identity, video eligibility

**Corrected 2026-11-01 (review of `d0b3b5f`):** §3 no longer states "none eligible" for the whole inventory; the product-video inventory is UNKNOWN and recorded as open.

**Status:** AUDITED (§1, §3, §4: no change made) and IMPLEMENTED → READY FOR QA (§2: one builder change with tests). Protected assets (CLAUDE.md governance §4) were modified only where §2 records a verified defect. No fabricated review, rating, identifier, policy or origin; every value read from the live site on 2026-11-01 is cited as the page rendered it.

## 1. `JewelryStore` vs `OnlineStore` / `Organization` (the review deferred by PR #454) — AUDITED, owner decision OD-SD-1

**What the site emits today [V 2026-11-01, `https://www.chajewelsjp.com/en`]:** `@type: JewelryStore` with `name`, `legalName`, `url`, a full `PostalAddress` (6-5-1 Tateishi, Time Mansion 301, Katsushika-ku, Tokyo 124-0012, JP), `areaServed: ["JP","PH"]`, `priceRange`, `inLanguage`, `logo`, `telephone: +81-3-6657-6129`, `email: sales@chajewelsjp.com`, `sameAs: [the Facebook page]`. No opening hours (by design: support hours are not shop hours). Rich Results Test on 2026-10-29 read it as valid "Organisation" and "Local business" items.

**Authoritative guidance (read 2026-11-01):**
- schema.org: `JewelryStore` is `Thing > Organization > LocalBusiness > Store > JewelryStore` (and `Place > LocalBusiness > …`), "A jewelry store". `OnlineStore` is `Thing > Organization > OnlineBusiness > OnlineStore`, "An eCommerce site" (https://schema.org/OnlineStore, https://schema.org/JewelryStore).
- Google, Organization structured data (https://developers.google.com/search/docs/appearance/structured-data/organization): "we recommend using the most specific schema.org subtype of Organization that matches your organization. For example, if you have an ecommerce site, then we recommend using the OnlineStore subtype instead of OnlineBusiness." and "if your site is about a local business, for example a restaurant or a physical store, then we recommend providing your administrative details using the most specific subtype(s) of LocalBusiness." No required properties; `address` is "The address (physical or mailing) of your organization, if applicable."; `logo`, `sameAs`, `telephone`, `email`, `legalName`, `url` are listed.
- Google, Local business (https://developers.google.com/search/docs/appearance/structured-data/local-business): `address` is required and described as "The physical location of the business."; `openingHoursSpecification` are "Hours during which the business location is open."

**Facts that decide it:** the owner answered OD-GBP-1 = No on 2026-10-31 (customers are not received at the office; no Business Profile; not eligible). The published copy describes an online business with a registered office (`phase-10/LOCAL-SEO-GBP-READINESS.md` §1). Google's own wording therefore points at `OnlineStore` (an ecommerce site) rather than a `LocalBusiness` subtype (a physical store customers visit).

**Options:**

| Option | Change | Effect | Risk |
|---|---|---|---|
| (a) keep `JewelryStore` | none | Rich Results Test keeps reporting "Local business"; the markup implies a visitable store | a local-business entity for a non-visitable address is the same mismatch the Business Profile decision avoided; low direct ranking effect either way |
| (b) **`OnlineStore`** (recommended) | `"@type": "OnlineStore"` in `lib/json-ld.ts` (one literal), every other field kept (address as the registered mailing address, `legalName`, `logo`, `telephone`, `email`, `sameAs`, `areaServed`, `priceRange`); `inLanguage` kept; tests updated (`tests/json-ld.test.mjs` store tests name the type) | matches Google's recommendation for an ecommerce site; the Rich Results Test then reports "Organisation" only; nothing about products, breadcrumbs, FAQ or posts changes | key order unchanged (C0/H0 rule); the registered address stays as a mailing address, which Google allows; a later Business Profile (if customers are ever received) would need the type re-decided |
| (c) plain `Organization` | type only | valid but less specific than (b) | loses the "store" meaning |

**Not changed here.** `JewelryStore` is a protected asset and the type is a business-identity statement; the decision is the owner's (**OD-SD-1**). If (b) is chosen it is a one-line change plus tests, verified by the raw checker's JSON-LD rows and the Rich Results Test, and recorded in the QA report; recrawl is SEARCH ENGINE RECRAWL PENDING after release.

## 2. Product `Offer` = the visible content — VERIFIED DEFECT, FIXED (READY FOR QA)

**Finding [V, code]:** `app/products/[slug]/page.tsx` renders exactly one variant, `product_variants[0]` (its price in the price band, its stock state on the buy buttons, its size and stone in the specification), while `lib/json-ld.ts` emitted `offers.price = fromPrice(product)` (the LOWEST variant price) and `offers.availability = productAvailability(product)` (InStock if ANY variant has stock). On a multi-variant piece whose first variant is not the cheapest, or is sold while another is not, the markup named a price and a state the page does not show. Governance §11 (structured data reflects visible content) and Merchant Center's page-crawl comparison (readiness §6) both require agreement. The MC readiness document had already recorded the price half as a known mismatch "noted for Phase 4".

**Prevalence [U]:** the number of live multi-variant pieces cannot be read in this session (no Hub API key; the public pages show one variant). The defect is verified at code level; the fix is correct for every product (single-variant pieces produce identical output).

**Fix (this batch):** `displayedVariant(product)` (= `product_variants[0]`, exported from `lib/json-ld.ts` and reused by the feed builder) drives the Offer: `price = displayedVariant.price_jpy` (the Hub's figure; the sale price while on sale, which is the figure printed in the price band) and `availability = variantAvailability(displayedVariant, status)` (the page's own rule). No variant → no price and `SoldOut` (the page shows the piece as sold); archived → `SoldOut`. No arithmetic. Tests: three new tests in `tests/json-ld.test.mjs` (they fail against the previous builder: 90000/InStock vs 150000/SoldOut) plus a source guard that the page and the builder read the same variant rule.

**Verification:** unit 652/652; raw checker 671/0 and DOM checker 685/0 on the local build (JSON-LD parses on every product template); production samples re-read (8C100, N1616: single-variant, unchanged values). Release: with the batch. After release: Rich Results Test on one multi-variant piece (owner names one, or the first-fetch Merchant Center Diagnostics shows none).

## 3. Video eligibility (R-19) — ASSESSED for the inventoried site videos; product-video inventory UNKNOWN

**Inventory, stated exactly.** Three videos are inventoried from the source tree [V, code]: the home hero film, the About page logo film and the artisan tile (`public/videos`, rendered by `components/site/hero*` and the About page). Product videos exist as a Hub capability (`video_url` + `video_poster_url` on the product contract) but **their inventory is UNKNOWN in this session**: no Hub API key is available, so neither the number of live pieces carrying a video nor what those videos show could be read. The assessment below therefore covers the three site videos; the product-video line is a conditional, not a finding.

| Video | Where | Role on the page | Hosted | Eligible for video markup / indexing? |
|---|---|---|---|---|
| Home hero film | `/en`, `/ja` (`components/site/hero*`; `public/videos`) | decorative background loop, muted, autoplay, no controls, no title or description of its own | the site's own `public/videos` (Vercel) | **No** for this video: Google's video eligibility needs the video to be the main content of a page (or a clearly identifiable element) with a thumbnail, a title and a watchable player; a muted decorative loop is none of these. Marking it up would be a false "video page". |
| About page logo film | `/en/about`, `/ja/about` | brand animation beside the story; decorative | `public/videos` | **No** (same reason). |
| Artisan tile video | About page tile | illustrative, short, no narration or title | `public/videos` | **No**. |
| Product gallery video (`video_url` + `video_poster_url` from the Hub) | product pages that carry one | by contract one gallery item among photos; the page's main content is the product listing, which already carries `Product` markup | the Hub's storage | **UNKNOWN — not assessed.** How many live pieces carry one, and whether any is presented as the page's main watchable content, cannot be read without the Hub API. The conditional view: a supplementary gallery clip with no title, description or duration of its own would not be eligible, and Google's supported Product fields carry no `video` property; a product video that IS the main content would need its own audit. |

**Conclusion:** no video markup is added. The three inventoried site videos are not eligible. The product-video inventory stays **UNKNOWN** (this is a genuine dependency on the Hub API, recorded in the matrix as R-19 open: "read-only API count and a per-video look when a key is available"); R-19 is not closed. If an editorial video page is ever built (a guide with a titled, captioned video as its main content), `VideoObject` with `name`, `description`, `thumbnailUrl`, `uploadDate` and `contentUrl` becomes applicable and gets its own audit. Search Console's video report is expected empty for the site videos; nothing is claimed for product videos.

## 4. Sharing identity (OG/Twitter) — re-verified, no change

Every successful locale template carries one `og:url` = canonical, one `fb:app_id` (the approved id), primary and alternate `og:locale`, `og:site_name`, `og:type` and an `og:image` (real product photo, listing hero, post cover or the brand image) in the raw HTML and the live DOM on this head (checkers §A). Twitter tags follow from the OpenGraph block as before. The rollback-only duplicate og:url on a bare product page (R-37) is closed (§A of the matrix).

## 5. Documentation used
- https://developers.google.com/search/docs/appearance/structured-data/organization, https://developers.google.com/search/docs/appearance/structured-data/local-business, https://developers.google.com/search/docs/appearance/structured-data/merchant-listing, https://schema.org/OnlineStore, https://schema.org/JewelryStore (all read 2026-11-01 through a fetch agent; quotes verbatim where shown).
- Repository: `lib/json-ld.ts`, `app/products/[slug]/page.tsx`, `lib/availability.ts`, `lib/product-seo.ts`, `lib/locale-meta.ts`, `lib/og-meta.ts`, `docs/seo/phase-10/LOCAL-SEO-GBP-READINESS.md`, `docs/seo/phase-5/MERCHANT-CENTER-READINESS.md` §6.
- **UNVERIFIED:** prevalence of multi-variant pieces in the live catalog; the product-video inventory (count and content) — UNKNOWN, not assessed; Google's video eligibility page was not re-read in this session (the assessment of the three site videos follows the long-standing rule that the video must be the page's main, watchable content).
