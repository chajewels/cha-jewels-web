# SEO QA Report

Final release-readiness QA for the 2026-10-29 master-plan sweep. Scope: draft PR #416 (Phase 3, `/en/layaway`) and draft PR #419 (Phase 4, structured data). Nothing was merged, deployed or changed in the Hub, Google accounts or payment systems during this QA.

Statuses: PASS · FAIL · BLOCKED (cannot be run from this repository) · UNVERIFIED (not observable with the data available).

## 0. Environment facts that shape this QA

| Fact | Evidence | Consequence |
|---|---|---|
| Vercel builds only `develop` and `main`. A push to a feature branch produces a cancelled deployment ("Deployment was cancelled" on the branch alias); the project's deployment list contains only "Merge pull request …" deployments. | Vercel dashboard, 2026-10-29; `https://cha-jewels-web-git-seo-phase-3-layaway-indexing-cha-jewels.vercel.app` | **No PR-branch preview exists for #416 or #419.** A deployed preview appears only after a merge into `develop` (which is not production). Preview QA is therefore the first step after merging to `develop`, before the `develop` → `main` release. |
| The local `.env.local` carries no Hub credentials (`HUB_API_URL` / `HUB_API_KEY` are empty; they exist only in Vercel). | `awk` over `.env.local`; a real-Hub local build fails with "HUB_API_URL / HUB_API_KEY not configured" | **Real-Hub validation of JSON-LD is BLOCKED locally.** It must be done on the `develop` preview. Everything below marked "local" ran on a production build in fixtures mode. |
| Google's Rich Results Test (RRT) cannot fetch an SSO-protected preview or localhost. | — | RRT was run in **code mode** on the exact JSON-LD blocks the local builds emit (the structured data is validated; page fetchability is not). |

## 1. PR #416 — Phase 3 `/en/layaway`

Build: branch head `1592afd`, `next build` (fixtures), `next start -p 3000` (origin matches `NEXT_PUBLIC_SITE_URL`).

| # | Required check | Result | Evidence |
|---|---|---|---|
| 1.1 | Vercel preview QA | **BLOCKED** (no feature-branch preview; see §0). Substitute: full local production-build QA below. | Re-run on the `develop` preview after merge: `/en/layaway` 200 self-canonical; `/ja/layaway` 404; bare `/layaway` unchanged; two-tab case |
| 1.2 | `/en/layaway` | PASS | 200; `<html lang="en">`; one H1 "Jewelry layaway in Japan: reserve now, pay monthly at 0% interest"; canonical `/en/layaway`; hreflang `en` + `x-default` only; no `noindex`; FAQPage JSON-LD (6 Q&A = the 6 visible questions); links to `/en/faq#payments-and-layaway`, `/en/shopping-guide`, `/en/jewelry-guide`, `/en/why-cha-jewels`, `/en/collections` |
| 1.3 | `/ja/layaway` | PASS | 404, `noindex`, no canonical/hreflang element, site default title |
| 1.4 | Legacy `/layaway` behaviour | PASS (unchanged) | no signal → 404; `?lang=en` → 200; cookie `en` → 200; never redirected (`STATIC_PAGES` excludes it, pinned by test) |
| 1.5 | Two-tab language/cookie scenario (Chrome, two tabs on the local build) | PASS | Tab A on `/en/products/kihei-chain-50-cm`; tab B opened `/ja/faq` (cookie → `ja`); tab A's header "Layaway" link → `/en/layaway`, 200, English, calculator quote rendered (Hub quote via explicit page language), "Reserve this piece with layaway" present. No 404, no `LAYAWAY_UNAVAILABLE` |
| 1.6 | Every repointed customer-facing layaway link | PASS | `/en`, `/en/why-cha-jewels`, `/en/faq`, `/en/shopping-guide`, `/en/collections/necklaces`, `/en/products/…`: the only layaway hrefs are `/en/layaway` and `/en/faq#payments-and-layaway`; phone tab bar `/en/layaway`; `/account/layaway` link via `localePath`; language switcher on `/en/layaway` → `/ja` (home), `GET /api/switch-targets?path=/en/layaway` = `{"en":"/en/layaway","ja":"/ja"}` |
| 1.7 | Messenger button on localized product pages | PASS (and a restoration) | Rendered on `/en/products/…`, `/ja/products/…`, `/en/collections/…`, `/ja/categories/…`, `/en/layaway`; not on `/en/faq` (not in its allow-list). Production today renders it on **none** of the locale product/collection pages (regression since Phase 2C, fixed by this PR) |
| 1.8 | No Japanese layaway exposure | PASS | `/ja`, `/ja/why-cha-jewels`, `/ja/faq`, `/ja/shopping-guide`, `/ja/products/…`, `/ja/legal/tokusho`, `/ja/collections/…`: 0 layaway hrefs, 0 レイアウェイ/分割予約; `check:layaway-ja` green (31 gated keys) |
| 1.9 | No checkout/payment regression | PASS | No file under `lib/checkout-actions.ts`, `lib/layaway.ts`, `lib/card*.ts`, `lib/paidy*.ts` changed; anonymous `/checkout?mode=layaway`, `/checkout`, `/account/layaway` → 307 `/login?next=…` (unchanged middleware); POST `/checkout/pay` anonymous → 307 (unchanged); `check:money` green |
| 1.10 | Automated checks | PASS | unit 478/478; `check-seo-live` 208/0/0 at matched origin; typecheck; lint 0 errors; terms/money/i18n/analytics/cutouts |
| 1.11 | Rich Results Test (code mode) on the `/en/layaway` FAQPage block | UNVERIFIED-BY-DESIGN | RRT answers "No items detected": Google removed FAQ rich results for non-government/health sites in 2023, so FAQPage markup yields no rich result anywhere on this site (the existing `/faq` has the same status). The markup is syntactically valid JSON-LD and mirrors visible content; it is kept for consistency with `/faq`, not for a rich result |

**Corrections needed for #416:** none found. Owner decisions unchanged (P3-1 route approval; P3-2 wording; P3-3 OD-6 not in this PR; P3-4 layaway-only posts; P3-5 Messenger locale fix).

## 2. PR #419 — Phase 4 structured data

Build: commit `a2eb929` (the seven original commits) rebuilt with `NEXT_PUBLIC_SITE_URL=http://localhost:3041`, served on 3041 (matched origin). The breadcrumb addendum commits are covered in §3.

| # | Required check | Result | Evidence |
|---|---|---|---|
| 2.1 | SEO checker with a matched build origin | PASS | `scripts/check-seo-live.mjs http://localhost:3041`: **229 pass / 0 fail / 0 deferred** (the earlier 40 "failures" were the 3000-vs-3041 origin artefact, now gone) |
| 2.2 | JSON-LD with real Hub data: approved reviews, Japanese descriptions, contact email, social links | **BLOCKED** (no Hub credentials locally; no branch preview) | Unit-tested branches only: `aggregateRating`/`review` emitted only when the page shows reviews; `description_ja` on `/ja` when non-empty; `email`/`sameAs` from `contactEmail()`/`follow()`. **Must be observed on the `develop` preview:** a product with approved reviews, a `/ja/products/…` with a Japanese description, `/` store block with the Hub's email and social hrefs |
| 2.3 | RRT (code mode) on the product page block (Product + BreadcrumbList, incl. the two owner-decision commits) | PASS with optional warnings | "3 valid items detected": Product snippets (optional `aggregateRating`, `review` missing — fixtures have no reviews), Merchant listings (optional `transitTime` missing), Breadcrumbs valid |
| 2.4 | MerchantReturnPolicy vs the complete published policy | **FAIL as written** (see analysis) | Keep `aacb81e` unapproved; do not merge as-is |
| 2.5 | Japanese shipping eligibility: item-based or cart-based? | **Cart-based.** The offer-level rate is only partly representative | Keep `f324135` unapproved; do not merge as-is |
| 2.6 | Automated checks (a2eb929) | PASS | unit 501/501; `check:money` OK (366 files); typecheck; lint 0 errors; build clean |

### 2.4 Return-policy analysis (`aacb81e`)

The complete published policy (`lib/content/legal.ts` `returnsArticles`, rendered at `/legal/returns`, and the Shopping Guide "Returns and exchanges" / "Cancellation" sections) says:

1. Change-of-mind returns, exchanges and cash refunds are **not** accepted (summary; article 4). Exceptions at Cha Jewels' discretion, as store credit.
2. Incorrect, damaged or materially misdescribed items (article 1): contact within five calendar days; remedies include repair, replacement, price reduction, store credit (if accepted) or cancellation with a refund to the original payment method where required by law; **Cha Jewels pays the reasonable return cost when it confirms the problem**; a late report does not remove non-excludable legal rights.
3. Paid-in-full cancellations (article 5): same day (JST) → 100 % store credit valid one year; later → 30 % charge, 70 % store credit; card payments refunded to the card only.
4. Layaway cancellations (article 6), exclusions (article 7), the authorised-return process (article 8), store credit rules (article 9).

What the commit emits: `MerchantReturnPolicy { applicableCountry: "JP", returnPolicyCategory: MerchantReturnNotPermitted, merchantReturnLink: /legal/returns }`.

Findings:
- `MerchantReturnNotPermitted` ("Returns aren't permitted", Google's definition) states only point 1. Google has **no category for "returns only for defective or misdescribed items"**; its model carries the defect path in separate properties (`itemDefectReturnFees`, `itemDefectReturnLabelSource`). As emitted, the structured data omits the defect remedy and the free return shipping that the policy and Japanese law guarantee, and Google may surface it as a flat "no returns" signal on merchant listings.
- `applicableCountry: "JP"` narrows the policy to Japan, but the policy applies to every retail purchase, including customers abroad (the Philippines is a stated market). Listing only JP misstates scope.
- The store-credit cancellation scheme (point 3) is a pre-delivery cancellation rule, not a return; it has no representation and none is claimed, which is acceptable.
- RRT accepts the block (valid), which is exactly why schema validity is not sufficient grounds to keep it.

**Recommendation:** do not merge `aacb81e`. Preferred replacement (owner decision R-1): **Option B from Google's return-policy documentation, `merchantReturnLink` only**, pointing at the localized `/legal/returns`. It makes no category claim, cannot be read as "no returns", and sends the reader to the complete policy. Alternative (R-2): keep `MerchantReturnNotPermitted` and add `itemDefectReturnFees: https://schema.org/FreeReturn` plus every country the shop ships to in `applicableCountry` — only if the owner accepts the "no returns" display. Alternative (R-3): omit the return policy entirely.

### 2.5 Shipping analysis (`f324135`)

The published policy is **cart-based**: "Japan: free shipping on pieces **totalling** ¥8,000 or more; otherwise ¥800" (Shopping Guide; Hub shipping rate card "JP 0 → ¥800, ¥8,000 → free" by order total). Outside Japan the fee is shown at checkout. Dispatch within five business days of payment clearing. Google's structured-data documentation expresses order-value conditions only at the **organization** level (`hasShippingService` → `ShippingConditions.orderValue.minValue` with `shippingRate.value: 0`); offer-level `OfferShippingDetails` has one `shippingRate` per entry and no documented order-value condition, and when several conditions apply Google "uses the lowest shipping cost for the product".

What the commit emits per offer: `shippingRate.value = 0` when the offer price ≥ ¥8,000, else `800`; destination JP; `handlingTime` 0–5 DAY; no `transitTime`.

Findings:
- Price ≥ ¥8,000 → `0`: **always true** (the cart total is at least the item price). Correct.
- Price < ¥8,000 → `800`: the **worst case**, not the rule — the same piece ships free inside a qualifying cart. Over-states the fee for those offers.
- International customers: no destination is emitted, which is correct (the fee is not published).
- `handlingTime` 0–5 DAY matches "within five business days"; RRT flags only the optional `transitTime`.

**Recommendation:** do not merge `f324135` as written. Owner decision S-1, two faithful options: (a) emit `shippingDetails` **only for offers priced at or above ¥8,000** (`value: 0`, JP, handling 0–5) and omit it below the threshold — never over-states, simplest, offer-level; or (b) move the rule to the organization block as `hasShippingService` with `ShippingConditions` `orderValue.minValue: 8000 → 0` and a base `800` (Google's documented pattern for order-value thresholds; needs an RRT pass and a Merchant Center check before relying on it). Either way the owner must first confirm the rate card (¥800 / ¥8,000 / five business days) is current and applies to every product (including layaway pieces).

**Corrections needed for #419 (as of commit `a2eb929`):** (i) `aacb81e` and `f324135` stay unmerged pending R-1/S-1; the PR should be merged without them, or they should be rewritten per the chosen option; (ii) real-data validation on the `develop` preview before release (2.2).

## 3. PR #419 addendum — visible breadcrumbs (required by the independent review)

Commits `a51e2b2` (shared `components/site/breadcrumbs.tsx` + pure `lib/breadcrumbs.ts`, 4 unit tests), `6e264b9` (product, post, collection, category, jewelry guide, shopping guide mount `<Breadcrumbs>`; bare breadcrumb JSON-LD removed everywhere), `7d26130` (live check: visible crumb hrefs must equal the BreadcrumbList items, in order; `aria-current` text equals the last item), `a0b851f` (report §7).

| # | Check | Result | Evidence |
|---|---|---|---|
| 3.1 | One array feeds both the visible `<nav aria-label>` + `<ol>` and the BreadcrumbList | PASS | Component source; `tests/json-ld-pages.test.mjs` (11 source guards: no bare breadcrumb JsonLd, no hand-drawn crumb nav, items pinned per page); `tests/breadcrumbs.test.mjs` |
| 3.2 | Every template with a BreadcrumbList now shows it visibly | PASS | product (Collections / collection-or-category / SKU, unchanged markup), post (Blog / title, replaces the "back" link), collection (Collections / name), category (Home / name), jewelry guide and shopping guide (Home / title). No template dropped its BreadcrumbList |
| 3.3 | English and Japanese labels, locale destination URLs | PASS | nav label `t("pdp","breadcrumb")` ("Breadcrumb" / "パンくずリスト"); names from the same Hub/i18n helpers as the page; `localePath` hrefs (`/ja/collections`, `/en`, …); JSON-LD URLs carry the page's own locale prefix |
| 3.4 | Canonical consistency | PASS | BreadcrumbList item URLs are the locale canonical URLs of the pages; `check-seo-live` compares them to the rendered hrefs |
| 3.5 | Mobile layout and accessibility | PASS | 375 px and 1280 px screenshots (14, in the worktree's `.playwright-mcp/`): crumb above the hero/heading, wraps, no layout shift to the luxury head; accessibility snapshot shows a `navigation "Breadcrumb"` landmark with a list; 0 console errors |
| 3.6 | Regression | PASS (independent rebuild at `a0b851f`, matched origin 3041) | `check-seo-live` **277 pass / 0 fail** (36 crumb assertions); unit **507/507**; typecheck; lint 0 errors; terms/i18n/money/analytics/cutouts; build clean |
| 3.7 | Rich Results Test on a crumb page (code mode) | PASS | Breadcrumbs "1 valid item" in the product block test (§2.3); live URL test still pending the `develop` preview |

## 4. Summary

**Ready to leave draft:** #416 (no corrections), #417 and #418 (docs). **#419: ready to leave draft only without `aacb81e` and `f324135`** (or with them rewritten per R-1 / S-1), and with the real-data check (2.2) scheduled on the `develop` preview.

**Exact owner decisions still open**
- P3-1 approve `/en/layaway` as a public route and sitemap entry (route-change rule). P3-2 wording of its title/H1/description. P3-3 OD-6 (bare `/layaway` → 308) stays unapproved and out of scope. P3-5 accept the Messenger-button locale fix as part of #416.
- R-1 return policy: replace `aacb81e` with `merchantReturnLink` only (recommended), or accept the "no returns" display with the defect properties (R-2), or omit (R-3).
- S-1 shipping: confirm the rate card (¥800 under ¥8,000 cart total, free from ¥8,000, dispatch within five business days) is current for every product, then choose (a) offer-level free-shipping only for pieces ≥ ¥8,000 or (b) organization-level `ShippingService` with an order-value condition; `f324135` is not merged as written.
- D-1 Vercel: feature-branch previews are not built; either accept "preview on `develop`" as the QA path (recommended; matches the repo's release flow) or change the project's deployment settings (owner action, not done here).

**Safe merge and release order**
1. Merge #416 into `develop` → Vercel builds the `develop` preview → run the §1 checks there (`scripts/check-seo-live.mjs <preview>` through an authenticated browser session, two-tab case, `/ja/layaway` 404).
2. Decide R-1 and S-1. Rebase #419 so that `aacb81e` and `f324135` are dropped or replaced; merge #419 into `develop` → on the `develop` preview run §2.2 (a product with approved reviews, a `/ja` product with a Japanese description, the home store block with the Hub's email and social links) and `check-seo-live`; Rich Results Test by URL is still impossible on the SSO-protected preview, so re-run it on production after release.
3. Merge #417 and #418 (docs) in any order.
4. Release `develop` → `main` as one PR; after deployment: `check-seo-live https://www.chajewelsjp.com`, Rich Results Test on `/en/layaway` (no FAQ rich result expected) and a product URL, Search Console "request indexing" for `/en/layaway` (owner). Status then: SEARCH ENGINE RECRAWL PENDING.
5. OD-6 (bare `/layaway` 308) only after `/en/layaway` is observed in Search Console, as a separate PR.

## 5. Controlled integration stage (2026-10-29) — owner decisions applied; merge authorization requested

| Item | State |
|---|---|
| #416 Phase 3 | Unchanged, already on `develop` head `4dc3c23`; mergeable; marked ready for review. `/ja/layaway` 404 and bare `/layaway` behaviour preserved; Messenger locale fix retained; OD-6 not implemented. **Awaiting explicit owner merge authorization.** |
| #419 Phase 4 | Rebased on `develop` `4dc3c23` with `aacb81e` (return policy) and `f324135` (shipping) **removed**; `merchantReturnLink` was **not** substituted (its offer-level support is undocumented; R-1 stays open); `lib/content/shopping-guide.ts` untouched. New head: `ecd3b4f` (absence of both fields pinned in `check-seo-live`; report updated). Kept: BreadcrumbList + visible breadcrumbs, JewelryStore fields, X5, aggregateRating/review. Full suite on the rebased head: typecheck 0, lint 0 errors, **unit 502/502**, terms/money/i18n/analytics/cutouts pass, build clean, **`check-seo-live` 277/0/0** at a matched origin; product offer keys `@type, price, priceCurrency, itemCondition, availability, url`. Trial merge with #416: clean. Marked ready for review. **Awaiting explicit owner merge authorization.** |
| #417, #418 | Docs only; marked ready for their normal documentation merges. |

### Integration QA to run on the `develop` preview (after the authorized merges; cannot run before)
1. `scripts/check-seo-live.mjs https://<develop preview>` through an authenticated session (SSO) — target 0 unexplained failures.
2. English layaway: `/en/layaway` 200, self canonical, `en`+`x-default`, one H1, calculator quote on a real piece, picker, FAQ from the Hub; `/ja/layaway` 404; bare `/layaway` 404 without signal; two-tab case.
3. Japanese restrictions: `/ja`, `/ja/faq`, `/ja/shopping-guide`, `/ja/why-cha-jewels`, a `/ja` product: 0 layaway words/links.
4. Product and collection navigation: visible crumbs on product / collection / category / post / guides in EN and JA, hrefs equal the BreadcrumbList items.
5. Canonical, hreflang, sitemap: locale pages self-canonical with `en`/`ja`/`x-default`; `/sitemap.xml` lists `/en/layaway` once, no `/ja/layaway`.
6. Product JSON-LD with genuine Hub data: a product with approved reviews → `aggregateRating.reviewCount` equals the shown count and one `review` per card; a `/ja/products/…` with Japanese text → `description` is the Japanese text; a product without reviews → no `aggregateRating`; no `gtin`/`mpn`/`countryOfOrigin`/return policy/shipping.
7. Store block on `/`: `telephone +81-3-6657-6129`, `email` = the Hub's `contact.email`, `sameAs` = the Hub's social hrefs, full address, logo URL resolves.
8. Checkout/payment: `/checkout?mode=layaway` and `/checkout` gate to `/login`; sign-in test from the branch alias; one layaway quote and one card HOLD page render (no capture); Paidy widget unchanged.
9. Rich Results Test by URL stays impossible on the SSO preview; run on production after release.

### Exact `develop` → `main` release scope (proposed; not executed)
- #416 (3 commits: `e186b5f`, `ce1e8c8`, `1592afd`) — `/en/layaway` route, repointed links, sitemap entry, Messenger locale fix, removal of the bare-`/layaway` cookie mitigation.
- #419 (10 commits after rebase: `07d0e30`, `103b436`, `b7fe6ed`, `456c77f`, `5cbf4ee`, `21d7d91`, `8cbea05`, `ccb53ee`, `0c898aa`, `ecd3b4f`) — BreadcrumbList + visible breadcrumbs, JewelryStore fields, Japanese product descriptions, aggregateRating/review; no return policy, no shipping.
- #417, #418 — documentation only (no runtime change).
- Not in scope: OD-6 bare `/layaway` redirect; any return-policy or shipping structured data; Hub data; payment systems; Google accounts; secrets.

## 6. Post-merge `develop` integration QA (2026-10-29) — real-Hub preview

**Verified state.** `origin/develop` HEAD = `675a7c3554fe9af1af448edea8d3c914e9dfab80` (merges #416 `e61de1f`, #419 `ad42fe8`, #417 `f421f11`, #418 `675a7c3`). Vercel: deployment for `675a7c3` **Ready** (Preview, `develop`, 48 s), per-deployment host `cha-jewels-jeczc2wrn-cha-jewels.vercel.app` (GitHub deployment 7404858877, status `success`); the `develop` branch alias is SSO-protected (302 to `vercel.com/sso-api`), so every check below ran through an authenticated browser session against the SHA-pinned host, with in-page `fetch` for the route matrix. Production `main` is still `7aac136`. Every preview response carries `x-robots-tag: noindex` (Vercel preview protection) — expected and not a finding. Real Hub data (not fixtures).

| # | Check | Result | Evidence |
|---|---|---|---|
| P3-1 | `/en/layaway` 200, indexable | PASS | 200; `lang=en`; one H1; canonical `https://www.chajewelsjp.com/en/layaway`; hreflang `en` + `x-default`; no `robots` meta; FAQPage JSON-LD with **7** real Hub Q&As (the questions shown) |
| P3-2 | `/ja/layaway` 404, no canonical/hreflang | PASS | 404, `noindex`, 0 canonical, 0 hreflang |
| P3-3 | Bare `/layaway` preserved | PASS | no signal → 404 `noindex`; `?lang=en` → 200 with the legacy canonical/hreflang (unchanged behaviour); never redirected |
| P3-4 | English navigation and account links reach `/en/layaway` | PASS | header, phone tab bar (`/en`, `/en/collections`, `/en/layaway`, `/en/loyalty`, `/account`), `/en`, `/en/faq`, `/en/collections/…`, `/en/categories/…`, guides, blog post, product pages: the only layaway hrefs are `/en/layaway` and `/en/faq#payments-and-layaway`; `/account/layaway` gates to `/login` (link is behind sign-in) |
| P3-5 | Calculator shows a valid Hub quote | PASS | real piece **P2926 Pendant PT900 2.0g Ruby Diamond 0.14ct [Preloved] ¥39,980** → down payment ¥11,994, monthly ¥4,664, total ¥39,980 (the Hub's `layaway_quote`; nothing computed on the site); "Reserve this piece with layaway" present |
| P3-6 | Two-tab Japanese-cookie scenario | PASS | tab A `/en/products/8c100-…`; tab B loaded `/ja/faq` (cookie → `ja`); tab A's header "Layaway" → `/en/layaway` 200, English, same real quote rendered; switcher → `/ja` |
| P3-7 | No Japanese layaway exposure | PASS | `/ja`, `/ja/faq`, `/ja/why-cha-jewels`, `/ja/shopping-guide`, `/ja/legal/tokusho`, `/ja/collections/necklaces`, `/ja/products/…` ×4: 0 layaway hrefs, 0 レイアウェイ/分割予約 |
| P3-8 | Messenger button on localized product pages | PASS | present on `/en` + `/ja` product pages (3 pieces), `/en` + `/ja` collections, categories, `/en/layaway`, `/cart` |
| P4-1 | Breadcrumbs visible and equal to JSON-LD | PASS | 7 pages (EN/JA collection, category, guides, post) + 6 product pages: visible hrefs = BreadcrumbList items (order, count), `aria-current` text = last item name; JA labels コレクション / ネックレス / ホーム / ショッピングガイド |
| P4-2 | Real approved reviews and ratings | PASS (no-review branch); rating branch UNVERIFIED by absence of data | 60 sampled products + 19 home-linked pieces + 6 inspected: **no product page shows approved reviews yet**, and **no `aggregateRating`/`review` is emitted anywhere** (correct: nothing claimed). The home "Customer stories" are testimonials, not product reviews. The rating branch remains unit-tested only until the first approved product review exists |
| P4-3 | Japanese product descriptions | PASS | `/ja/products/n1616-…` → 「新品 K18 喜平ネックレス、Mカット、男女兼用（16.65g、40cm）…」; `/ja/products/r2715-…` → 「K18WG 12.80g、ダイヤモンド 2.50ct…プレラブドジュエリーです。」; `/ja/products/wh571-…` → 「ブランド: Hermes 型番: CL5.210…」; `inLanguage: ja-JP`; EN pages keep `description_en` |
| P4-4 | JewelryStore contact and social match the Hub | PASS | `/` and `/en`: `telephone +81-3-6657-6129`, `email sales@chajewelsjp.com` (= the Hub `contact.email` rendered on `/en/contact`), `sameAs` = exactly the footer's Hub social row (`facebook.com/chajewelsjapan`, `m.me/chajewelsjapan`), full postal address, logo URL on the production origin |
| P4-5 | No MerchantReturnPolicy / shippingDetails | PASS | 60 sampled + 6 inspected products: 0 hits; offer keys `@type, price, priceCurrency, itemCondition, availability, url` |
| P4-6 | No invented origin, GTIN, MPN; brand only when branded | PASS | 0 `gtin`/`mpn`/`countryOfOrigin` in 66 products; `brand` present only on branded pieces (e.g. Hermès WH571), absent on N1616/R2715; 20 of 60 sampled carry a brand |
| S-1 | Canonical and hreflang consistency | PASS | locale pages self-canonical on `https://www.chajewelsjp.com`, `en`/`ja`/`x-default` reciprocal (products, collections, guides, FAQ, tokusho); `/en/layaway` `en`+`x-default` only; root `/` unchanged (OD-3) |
| S-2 | Sitemap | PASS | 974 URLs, all on the production origin; `/en/layaway` exactly once; no `/ja/layaway`; 0 bare non-root URLs |
| S-3 | No broken internal links | PASS | 340 unique internal hrefs collected from 8 seed pages; 140 fetched: 0 non-200 (private routes answer redirects, as designed) |
| S-4 | SEO checker | PASS by in-page equivalent | the Node script cannot pass Vercel SSO; the same route/metadata/JSON-LD/sitemap assertions were run in-page (fetch on the pinned host): 0 unexplained failures. The only systematic difference from production is the preview's `x-robots-tag: noindex` |
| S-5 | Rich Results Test | PASS (code mode) | real N1616 product block + its BreadcrumbList: **3 valid items** (Product snippets, Merchant listings, Breadcrumbs), only optional-field notices; URL mode impossible on the SSO preview — re-run on production after release. FAQPage (`/en/layaway`): "No items detected" (Google removed FAQ rich results for shops in 2023; same as `/faq`) |
| C-1 | Checkout/account/payment routes | PASS | anonymous `/checkout?mode=layaway` → `/login?next=%2Fcheckout%3Fmode%3Dlayaway`; `/checkout`, `/account`, `/account/orders`, `/account/layaway`, `/cart/restore` → redirects; `/cart` 200 `noindex, follow`; `/api/switch-targets` answers `{en:/en/layaway, ja:/ja}` |
| C-2 | No payment or layaway-money logic change | PASS | merged diff vs `7aac136` touches no `lib/checkout-actions.ts`, `lib/layaway.ts`, `lib/card*.ts`, `lib/paidy*.ts`; `check:money` green on both code PRs; every figure on the preview is a Hub quote or Hub price |
| C-3 | No new private-data exposure | PASS | rendered product/collection HTML contains no cart cookie, API key, bearer token, customer id or non-public email; private routes redirect; preview `noindex` |
| C-4 | Console | PASS | 0 site errors on `/en/layaway` and the product page after reload (one exception from a third-party browser extension, not the site) |

**Remaining risks**
1. `aggregateRating`/`review` have never rendered with real data (no approved product review exists yet); first real review → verify on production that the count equals the cards shown.
2. Rich Results Test by URL and Search Console observation only after the production release.
3. The bare `/layaway?lang=en` still emits the legacy canonical (`/layaway`) and legacy hreflang — pre-existing, unchanged, resolved by OD-6 later (not implemented).
4. Vercel feature-branch previews are not built; QA of future branches happens on `develop`.

**Proposed exact `develop` → `main` release scope:** `origin/develop` `675a7c3` (= `main` `7aac136` + the four merges `e61de1f`, `ad42fe8`, `f421f11`, `675a7c3`): Phase 3 `/en/layaway` (+ links, sitemap, Messenger locale fix, mitigation removal), Phase 4 BreadcrumbList + visible breadcrumbs, JewelryStore fields, Japanese descriptions, review-backed ratings (no return policy, no shipping), and the Phase 5-12 documentation. Nothing else is on `develop`. Excluded: OD-6, any return/shipping structured data, Hub data, payment systems, Google accounts, secrets. **STOPPED for owner authorization before the production release.**
