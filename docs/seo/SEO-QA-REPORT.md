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

## 7. Production release and verification (2026-10-29)

**Release.** PR #421 `develop` → `main`, merged by the normal merge-commit process under the owner's written authorization. `main` = **`82effabf26332d3278ac1021ffcd7f9dca4a0b6c`** (= `develop` `e7dba20` + merge). Content: #416, #419, #417, #418, #420, plus the three docs-only Phase 2 record merges already on `develop` (#413–#415, one markdown file). Gates before merge: CI on `e7dba20` success (push run 40827488264, PR run 40827777927); local at `e7dba20`: typecheck 0, lint 0 errors, unit 506/506, terms/money/i18n/analytics/cutouts pass, build exit 0. Diff verified: 49 files; `lib/legacy-redirect.ts` identical to `main` (no OD-6); the only `hasMerchantReturnPolicy`/`shippingDetails` mention is the live-check assertion that pins their absence; no `middleware.ts`, config, dependency, workflow, `supabase/`, env or payment/money files.

**Deployment.** GitHub deployment 7405468374 (Production, `82effab`) status `success` 06:14:35 UTC; Vercel production deployment `cha-jewels-dzlgl93u3-cha-jewels.vercel.app`, Ready, assigned to `www.chajewelsjp.com`; `main` CI run 40827915381 success. Previous production: `7aac136`.

**Read-only production QA (anonymous requests to https://www.chajewelsjp.com, 2026-10-29 ~15:20 JST).**

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | `/en/layaway` 200, canonical, hreflang | PASS | 200; canonical `https://www.chajewelsjp.com/en/layaway`; hreflang `en` + `x-default` (no `ja`); no robots meta; title "Jewelry layaway in Japan: 30% deposit, 0% interest"; one H1; FAQPage with 7 Hub questions |
| 2 | `/ja/layaway` 404 | PASS | 404, `noindex`, 0 canonical, 0 hreflang |
| 3 | Bare `/layaway` unchanged | PASS | no signal 404; `?lang=en` 200; cookie `en` 200; no redirect |
| 4 | English layaway navigation and calculator | PASS | header, tab bar (`/en/layaway`), `/en`, `/en/faq`, collections → `/en/layaway`; calculator on a real piece ¥39,980 → ¥11,994 down / ¥4,664 monthly (Hub quote); "Reserve this piece with layaway"; switcher → `/ja`; Messenger button present; 0 console errors |
| 5 | Japanese restrictions | PASS | `/ja`, `/ja/faq`, `/ja/why-cha-jewels`, `/ja/shopping-guide`, `/ja/legal/tokusho`: 0 layaway links, 0 レイアウェイ/分割予約 |
| 6 | Sitemap | PASS | 976 URLs; `/en/layaway` exactly once; no `/ja/layaway`; no bare non-root URL |
| 7 | Product breadcrumbs and JSON-LD | PASS | 40 sampled products: 40/40 visible crumb = BreadcrumbList; collection/category/guide crumbs EN+JA match |
| 8 | Real Hub Japanese descriptions | PASS | N1616 and R2715 `/ja` pages carry the Hub's Japanese text, `inLanguage ja-JP` |
| 9 | Store identity and social | PASS | `+81-3-6657-6129`, `sales@chajewelsjp.com`, `sameAs` = footer social row (facebook; **m.me removed by BUG-02 — chat links are not profiles**), postal code 124-0012, street address, logo |
| 10 | No return-policy or shipping structured data; no GTIN/MPN/origin | PASS | 0 hits in 40 products; offer keys `@type, price, priceCurrency, itemCondition, availability, url`; brand only on 14 branded pieces; no `aggregateRating` (no approved product review exists yet) |
| 11 | Checkout and payment routes | PASS | `/checkout?mode=layaway`, `/checkout`, `/account/layaway` → 307 `/login?next=…`; `/cart` 200; no payment code in the release |
| 12 | Phase 2 behaviour unchanged | PASS | bare `/faq` → 307 `/ja/faq`; `?lang=en` → `/en/faq`; bare product → 307 locale page; `/gold-guide` 308; `robots.txt` unchanged |
| 13 | SEO checker | PASS | `scripts/check-seo-live.mjs https://www.chajewelsjp.com` → **288 pass / 0 fail / 0 deferred** |

**Exceptions:** none. **Not done, by instruction:** OD-6, return/shipping structured data, Hub data, payment systems, Google accounts, secrets. **Next (owner):** Search Console "request indexing" for `/en/layaway`; Rich Results Test by URL on `/en/layaway` and a product URL; status becomes SEARCH ENGINE RECRAWL PENDING.

## 8. Stabilization release (2026-10-29): PR #426 → `main` `97a6e76`

**Scope.** `develop` `9e1d564` → `main`: #423 (BUG-02 sameAs chat-link exclusion), #424 (BUG-05 robots/noindex), #425 (BUG-08 status + defect review), #422 (docs). Nine files; no middleware, config, dependency, workflow, Supabase, env, checkout, layaway-money, card or Paidy file.
**Gates before merge.** CI on `9e1d564` success (develop and PR runs); local: typecheck 0, lint 0 errors, unit 508/508, terms/money/i18n/analytics/cutouts pass, build exit 0, `check-seo-live` 289/0 on the built head. Combined `develop` preview QA PASS (§ above).
**Deployment.** `main` `97a6e76`; `main` CI success; Vercel production deployment Ready and serving (robots change observable live).

**Production QA (anonymous, 2026-10-29).**

| Check | Result |
|---|---|
| JewelryStore `sameAs` on `/en` | PASS — `["https://www.facebook.com/chajewelsjapan"]`; m.me excluded |
| Messenger customer links | PASS — footer `https://m.me/chajewelsjapan` present; resolves (302 to Facebook Messenger); Messenger button on product pages |
| `/already-registered` | PASS — 200, `noindex, nofollow`, no canonical/hreflang; robots.txt no longer disallows it |
| Other private routes | PASS — robots.txt Disallow exactly `/account`, `/checkout`, `/api`, `/review/`; `/account`, `/checkout`, `/checkout?mode=layaway`, `/account/layaway` → 307 `/login?next=…`; `/cart`, `/login`, `/search` 200 with their noindex |
| Layaway, canonical, hreflang, sitemap | PASS — `/en/layaway` 200, `/ja/layaway` 404, bare `/layaway` 404; `check-seo-live https://www.chajewelsjp.com` **289 pass / 0 fail / 0 deferred** |

**Exceptions:** none. Phases 3–4 remain SEARCH ENGINE RECRAWL PENDING.

## 9. SEO Step 1 production release (2026-10-29): PR #430 → `main` `2e18bcc`

Diff reviewed before merge: only PR #429's Step 1 files plus docs PRs #427/#428; no Hub, payment, checkout, database, middleware, redirect, canonical, hreflang or secret change. CI green (unit 529/529, typecheck, lint, terms, money, i18n, layaway-ja, `check:lastmod`). Merged as a merge commit (keeps author dates for `check:lastmod`). Production deployment `7407795774` Ready.

**Live production, `https://www.chajewelsjp.com`:**
- `scripts/check-seo-live.mjs`: **289 pass / 0 fail / 0 deferred**.
- Sitemap: 200, valid XML, 976 URLs (976 unique), 906 product URLs (453 EN/JA pairs), 0 bare product URLs, 0 `/ja/layaway`, 1 `/en/layaway`, 0 product `lastmod`, 906 image entries (all absolute https, host `pfoicalpzdcmyxzvwyhz.supabase.co`). `/about` 2026-10-01, `/jewelry-guide` 2026-10-27, blog index 2026-10-16 (= its one post). Sold products still listed.
- 36 sampled products (20 multi-photo; 10 SoldOut): SKU-last title 36/36, H1 still SKU-first 36/36, sitemap image equals `og:image` and is in Product JSON-LD 36/36, canonical self 36/36; no rating, review, shipping, return-policy, origin or manufacturer schema. JA titles are SKU-last too.
- Titles: Rings/Pearls/Necklaces/Pendants read "X: Jewelry Collection from Tokyo"; Fine Jewelry "Fine Jewelry: Gold, Pearl, Diamond and Gemstone"; Luxury Bags and Preloved Branded Watches unchanged; JA unchanged. Tokusho EN/JA descriptions distinct. Blog lead image alt = article title.
- `/en/collections` and `/ja/collections`: 5 visible category links. Hidden menu lists are `display:none` and unfocusable. 375/390/1440: no overflow, drawer and both desktop menus open/close, focus returns, breadcrumb tap area 45-46 px, 0 console errors.
- `/en/layaway` 200, `/ja/layaway` 404, `/layaway` 404; canonical/hreflang correct; robots has no `/already-registered` disallow; `sameAs` is Facebook only; Messenger link present.
- axe (WCAG 2/2.1 A/AA): `definition-list`/`dlitem` (pre-existing, seen on pre-release production); on product pages Paidy's third-party widget adds `image-alt`/`link-name` (not site code; not part of this release).

**Performance (observable only):** first request after deploy `x-vercel-cache: PRERENDER`, 0.74 s from the QA client; following requests HIT, about 0.3 s; 337,609 bytes (prior baseline 221,727). Vercel function logs, Hub catalog-request duration, Hub payload size and memory were NOT accessible from the QA environment and are UNVERIFIED; no timeout or missing URL was observed.

**Status:** DEPLOYED; SEARCH ENGINE RECRAWL PENDING. Nothing is claimed about indexing, image-search inclusion or ranking.

## 10. SEO Step 2 production release (2026-10-29): PR #433 → `main` `49c0fd6`

**Scope.** `develop` `5533801` → `main` (PR #432 at approved HEAD `d5e169b`, plus docs PR #431). Diff: 8 files (two listing pages, `lib/json-ld.ts`, `lib/listing-seo.ts`, `scripts/check-seo-live.mjs`, `tests/seo-step2-listing.test.mjs`, `docs/seo/*`). No payment, checkout, middleware, redirect, canonical/hreflang, Hub, migration or config change.
**Gates.** CI `check` success on `5533801`; on that commit locally: typecheck, 539/539 unit tests, build, terms, money, i18n, `check:lastmod` pass; lint 0 errors (existing warnings only).
**Deployment.** `main` `49c0fd6`; Vercel production deployment `7411360935` Ready (https://cha-jewels-b5l3vudja-cha-jewels.vercel.app).

**Production QA (anonymous, 2026-10-29).**

| Check | Result |
|---|---|
| SEO checker | PASS — `check-seo-live https://www.chajewelsjp.com` **289 pass / 0 fail / 0 deferred** (live catalog samples fewer pages than the 389 local-fixture run; not a regression) |
| ItemList vs grid, 34 listing pages EN/JA | PASS — exactly one ItemList where the grid has 2+ pieces; URLs, order, positions 1..n, `/en/` or `/ja/` product URLs, `numberOfItems` all equal the rendered grid; entries are `@type, position, url` only |
| Sold pieces | PASS — included where the grid shows them (e.g. Rings 135, Preloved Jewelry 194) |
| Single-product / empty | PASS — Anklets (1 piece) and Handmade Gemstone Bracelets (0 pieces; its 4 cards are "Available now" suggestions) emit no ItemList |
| OpenGraph / Twitter | PASS — all 34 pages: og/twitter title and description equal page title/description, site_name, type, locale pair, `summary_large_image`, twitter:image = og:image |
| Hero images | PASS — earrings (`…562b6aaf72a6.jpg`), luxury-bags, luxury-wallet, luxury-watches, other-accessories (PNG) use their own Hub image with the collection name as alt (EN and JA); all other collections and all categories keep the brand image |
| Canonical / hreflang / robots | PASS — one self canonical, `en`/`ja`/`x-default`, no new robots meta, unchanged |
| Product and BreadcrumbList JSON-LD | PASS — SHA-256 of Product (one product page) and BreadcrumbList (rings, earrings, ja fine-jewelry) identical before and after release |
| Layaway and protections | PASS — `/en/layaway` 200, `/ja/layaway` 404; `/account`, `/checkout` → 307 `/login?next=…` |

**Performance (observable only).** HTML grows by about twice the ItemList, because Next emits it in the page and again in its streamed page data: Rings 1,250 KB → 1,260 KB reported by the live sampler (+~41 KB measured on the preview), Preloved Jewelry 1,726 → 1,742 KB; ItemList itself 0.8–28 KB (≤1.7% of the page). Live response 200–720 ms (first request per page slower, then cached). No extra Hub request: the ItemList reuses the grid's array. Mobile 375/390 px: no horizontal overflow, no console errors on Rings, Luxury Bags, ja Earrings, ja Fine Jewelry, Anklets.

**Limitations.** Vercel runtime logs were not read (no log access used). Hero PNGs are 1.3–1.8 MB, 4:3, so social previews will crop them; no compression added. Product pages still use `openGraph: undefined` for pieces without a photo (pre-existing, untouched). Google lists no rich result for product ItemLists; none is expected.

**Status:** DEPLOYED; SEARCH ENGINE RECRAWL PENDING. Nothing is claimed about indexing, rich results or ranking.

## 11. SEO Step 3a production release (2026-10-29): PR #436 → `main` `81f9aa0`

**Scope.** `develop` `04bf8c9` → `main` (PR #435 at approved HEAD `a1d4676`, plus docs PR #434). Diff: 8 files — `components/site/jp-font-gate.tsx`, one unlayered rule in `app/globals.css`, `{lang === "ja" && <JpFontGate />}` in `app/layout.tsx`, `tests/perf-step3-jp-font.test.mjs`, docs (the Step 3b/3c proposals are documentation only). No Hub, payment, checkout, cart, session, locale-routing, canonical/hreflang, robots, redirect or collection-rendering change.
**Gates.** CI `check` success on the release PR; on the same tree locally: typecheck, lint (0 errors), 543/543 unit tests, build, terms, money, i18n, `check:lastmod`, SEO checker 389/0.
**Deployment.** `main` `81f9aa0`; Vercel production deployment `7413617270` Ready; the live Japanese pages serve the gate and its CSS rule, English pages do not.

**Live QA (anonymous, fresh browser contexts, 375 and 390 px, Slow-4G/4x CPU, 3 loads per page).**

| Check | Result |
|---|---|
| Heading font | PASS — fallback (`Noto Serif JP Fallback`) at DOMContentLoaded and at load; Noto Serif JP after load; `/ja` 3 of 39 font requests before load, `/ja/collections/rings` 3 of 18, `/ja/about` 3 of 13; `/en` 4 of 4 (unchanged) |
| Layout shift on phones | PASS — CLS 0.0000 in 24 of 24 loads; no horizontal scroll, no clipped or invisible headings, 0 console errors |
| Reduced motion / menu / language | PASS — gate fires, final font applies; mobile menu opens and closes; `/ja/collections` loads |
| 106 px first-load movement | NOT OBSERVED — 14 fresh 1920 px production loads (8 direct Rings, 6 `/ja` → Rings in one context), heading fixed at y=266 every time. Not testable on the SSO-protected preview in clean contexts; its cause (seen twice in about 8 signed-in-Chrome preview loads) remains unknown |
| Desktop re-wrap (new finding) | OBSERVED — at 1440 and 1920 px on `/ja/collections/rings`, a first-row product card title re-wraps by one line when Noto Serif JP replaces the fallback after load, moving the caption below it 22 px (`P.pcard-fig`, "K18 · 12.80 g"); CLS 0.0000478 per load, recorded in 14 of 14 loads at 1920 px; none at 1024 px, 390 px or in the 24 phone loads. Gate toggle reproduces it (y 985 ↔ 963). Before the release the same swap happened before first paint, so no shift was recorded |
| Android / Windows typography | NOT TESTED — only Mac system fonts were available |

**Performance (production, mobile Lighthouse 13.5.0, fresh Chrome profile per run, 5 runs each, interleaved; pre-release run immediately before the merge, post-release run immediately after; matched settings, not a controlled A/B).**

| Page | Score pre → post (range) | LCP | FCP | TBT | CLS |
|---|---|---|---|---|---|
| `/ja` | 74 (61–83) → 68 (62–90) | 5.2 → 6.2 s | 2.9 → 3.6 s | 70 → 44 ms | 0 |
| `/ja/collections/rings` | 90 (69–93) → 90 (64–94) | 3.5 → 3.5 s | 1.7 → 1.7 s | 24 → 54 ms | 0 |
| `/en` (control) | 85 (71–87) → 85 (71–89) | 4.1 → 4.0 s | 1.8 → 2.0 s | 73 → 81 ms | 0 |

Variance is as large as any difference, so no improvement and no regression is claimed. The gain measured on local builds (`/ja` 77 → 84) was not reproduced here. Observed requests: the 37 Japanese slices (568 KB) start at about 770 ms before and 750 ms after on `/ja` and finish later after (about 1.2 s before, 1.6 s after); the hero poster loads at the same time (about 0.6 s to 0.7 s). No real-user data; no claim about real-user Core Web Vitals.

**SEO and functional regression.** `check-seo-live https://www.chajewelsjp.com` **383 pass / 0 fail** (live catalog samples fewer pages than the local-fixture 389); `/en/layaway` 200, `/ja/layaway` 404; `/account` and `/checkout` 307 to login; Product and BreadcrumbList JSON-LD hashes identical to before; ItemList and hero OpenGraph checks inside the checker pass.

**Status:** DEPLOYED. Benefit not confirmed in production lab runs; owner to decide between keeping it (monitor field CLS and Search Console) and reverting PR #436.

## 12. SEO Step 3a final release (2026-10-29): PR #439 → `main` `59ad3b7`

**Scope.** `develop` `284b6dd` → `main` (PR #438 at head `7f68b99`, plus docs PR #437). Runtime: `lib/jp-font-defer.ts` (new), `app/layout.tsx`, `app/globals.css`, `components/site/jp-font-gate.tsx` (comment only); tests `tests/perf-step3-jp-font.test.mjs`, `scripts/check-jp-font-live.mjs` and the `check:jp-font` script; docs. No Hub, payment, cart, checkout, locale-routing, canonical/hreflang, robots, caching or collection-rendering change.
**Gates.** CI `check` success on the release PR; on the same tree locally: typecheck, lint (0 errors), 545/545 unit tests, build, terms, money, i18n, `check:lastmod`, SEO checker 389/0.
**Deployment.** `main` `59ad3b7`; Vercel production deployment `7415291347` Ready.

**Production QA (anonymous, fresh contexts).**

| Check | Result |
|---|---|
| Scope | PASS — `data-jp-defer` and the gate only on `/ja` (also `/ja/` after its redirect, and `/ja?x=1`); absent on Rings, Fine Jewelry, About, tokusho, a product page and English pages; CSS rule is `html[data-jp-defer]:not([data-jp-font])` |
| `npm run check:jp-font -- https://www.chajewelsjp.com` | 34 of 35 pass. The one failure: `/ja` at 390 px, CLS 0.00012 (limit in the script 0.0001) |
| That 0.00012 | One of 8 loads at 390 px: a header element (`DIV.flex items-center gap-1`) moves 3 px sideways at about the load event; 0 of 8 with the gate attribute pre-set; 0 of 30 loads on non-deferred pages (Rings, About, `/en`). The same element showed the same size of shift in earlier production runs before the gate existed (5 of 6 throttled mobile loads). Not proven independent of the gate; negligible; the script threshold is tighter than this measurement noise |
| Japanese Rings, real Hub titles | PASS — 6 fresh loads at each of 390, 1024, 1440 and 1920 px: 0 layout shifts, heading steady (y=266 at 1920 px), first-row titles at their final wrapping, no overflow, no clipped title. The previous 22 px caption movement (3 of 3 loads at 1920 px before) is absent |
| Console | no console errors or HTTP errors of 400 or above; aborted Next link-prefetch requests (`?_rsc=`, `net::ERR_ABORTED`) appear when the test context closes |
| Homepage font loading | PASS — fallback at DOMContentLoaded and at load, Noto Serif JP after load, 3 fonts before load, reduced motion still applies the font |
| Language switching | PASS (36 of 36 scenarios earlier the same day on production, no change since; `/ja` and `/en` switch checked again on the real-Hub preview) |
| SEO | `/en/layaway` 200, `/ja/layaway` 404; ItemList, hero OpenGraph, Product and BreadcrumbList checks passed on the preview and the checker; account and checkout redirect to login |

**Lighthouse (production, mobile, 5 runs each, fresh profile, interleaved; before and after the merge, matched settings; NOT a controlled A/B).** `/ja`: score 87 (63–90) → 67 (61–90), LCP 3.6 → 6.5 s; `/ja/collections/rings`: 69 (64–90) → 83 (64–89), LCP 5.9 → 4.4 s. The ranges overlap completely and the home page's code path did not change, so these differences are noise. No improvement or regression is claimed, and no real-user or field data exists.

**Limitations.** Android and Windows fonts untested; the signed-in-Chrome-only preview checks covered 1920 px; real-user Core Web Vitals not observed; the cause of the earlier intermittent 106 px preview movement remains unknown (not reproduced in clean production loads).
**Status:** DEPLOYED.

