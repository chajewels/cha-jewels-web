# SEO Phase 4 — Structured data upgrade: implementation report

Branch `seo/phase-4-structured-data` (from `origin/develop` at `4dc3c23`), draft PR against `develop`.
Status: **READY FOR QA** (Rich Results Test and Search Console cannot be run locally; see the TODO at the end).

Scope: master plan §6, §7, §8, §16 and "PHASE 4"; baseline §8 "Not present" list; deferred findings X4 (closed by the pure builder in Phase 2B, now extended) and X5 (closed here). Everything is a pure builder branch in `lib/json-ld.ts`, rendered by the unchanged `components/site/json-ld.tsx`, which decides the locale prefix from the path header. Locale wrappers under `app/[lang]/*` re-export the legacy pages, so every change below applies to `/`, `/en/...` and `/ja/...` alike. `app/layaway/page.tsx` was not touched (another branch owns it).

## 1. What was added, per template

### BreadcrumbList (§8) — new `JsonLd` variant `{ type: "breadcrumb", items: { name, path }[] }`
The page passes the names it renders and each crumb's **bare** path; the builder makes them absolute with the page's own prefix (`${base}${prefix}${path}`; `/` is the locale home `${base}${prefix}`, the bare origin on a legacy page). The last item is the page itself.

| Page | Trail (EN / JA labels from the same i18n helpers the page uses) | Visible breadcrumb? |
|---|---|---|
| Product `app/products/[slug]/page.tsx` | Collections › [collection, else category] › SKU — the same `crumb` object and `t("nav","collections")` the visible `<nav>` renders | yes, mirrored exactly |
| Collection `app/collections/[slug]/page.tsx` | Collections › collectionName | **no visible breadcrumb** on this page; trail is the product page's, one level up |
| Category `app/categories/[slug]/page.tsx` | Home › categoryName | **no visible breadcrumb** on this page |
| Blog post `app/blog/[slug]/page.tsx` | Blog › post title | the back link ("Blog") is the visible first step |
| Jewelry guide `app/jewelry-guide/page.tsx` | Home › `dict.meta.jewelryGuide.title` (the page's `<title>`) | **no visible breadcrumb** |
| Shopping guide `app/shopping-guide/page.tsx` | Home › `dict.meta.shoppingGuide.title` | **no visible breadcrumb** |

### JewelryStore (§16) — home page, `app/page.tsx`
Legacy key order untouched; new fields appended (`logo`, `telephone`, then `email` / `sameAs` only when the Hub answered).
- `address`: `streetAddress "6-5-1 Tateishi, Time Mansion 301"`, `postalCode "124-0012"` appended behind the original locality / region / country (the parts `COMPANY_ADDRESS.en` prints).
- `logo`: `${base}/images/brand/logo-badge-512.webp` (static asset, never locale-prefixed).
- `telephone`: `COMPANY_PHONE.office` converted to E.164 → `+81-3-6657-6129` (derived from the one place the digits live, not retyped).
- `email`: `contactEmail()` from `lib/settings.ts` (the Hub's `contact.email`), omitted when null.
- `sameAs`: the `href`s of `follow()` (the Hub's `social.follow` row), filtered to `http(s)` — `mailto:` links are not profiles. Both reads are caught in `app/page.tsx` like the other chrome reads: a failed read omits the field, never the page.

### Product (§6, §7) — `app/products/[slug]/page.tsx`
- **X5 closed**: `description` = `description_ja` on a `/ja` page when the Hub's Japanese text is non-empty, else `description_en`. Legacy and `/en` unchanged.
- **aggregateRating / review**: the page passes `{ count, average, reviews }` from `hub.reviews` **under the same condition it renders the summary and the review section** (`reviews.length > 0 && reviewAverage != null`); otherwise `null`. The builder emits `aggregateRating { ratingValue: average, reviewCount: count }` only when `count > 0` and `average` is a number, and one `Review` per card rendered (`author.name = display_name`, `reviewRating.ratingValue = rating`, `reviewBody = body` when present, `datePublished = approved_at`). Nothing is computed or padded here.
- **hasMerchantReturnPolicy and shippingDetails: NOT emitted.** Both were proposed as separate commits (`aacb81e`, `f324135`) and **removed from this PR by owner decision after the final QA** (`docs/seo/SEO-QA-REPORT.md` §2.4-2.5): the published shipping rule is cart-based (free when pieces total ¥8,000 or more) and the published return policy carries defect remedies and store-credit cancellation rules that the offer-level fields could not represent. A test now pins their absence until a faithful encoding is approved (R-1 / S-1). See §3.

### Unchanged
BlogPosting, FAQPage, availability / condition logic, `inLanguage` behaviour, legacy ("" prefix) byte-stability of fields that existed before (new fields only appended).

## 2. Deliberately not emitted, and why
| Field | Why not |
|---|---|
| `gtin`, `mpn` | None exist for these pieces; master plan §6 "never invent". Test pins their absence. |
| `countryOfOrigin` | Owner rule: origin is a per-piece badge (`origin-badge.tsx`), never structured data. Test pins absence. |
| `openingHours` | The site publishes customer-service hours, not shop hours; the two are different claims. Test pins absence. |
| `transitTime` | The carrier's time is not something the site publishes; only the handling window ("we ship within five business days") is. |
| Shipping outside Japan | The guide says the fee "is shown at checkout" — no published rate to encode. |
| `aggregateRating` when no reviews are shown | Would claim a rating the page does not display. |
| `Organization` / `WebSite` entities, `priceValidUntil` | Out of Phase 4's named scope; not in the master plan's Phase 4 list. |

## 3. Owner decisions — RESOLVED 2026-10-29: both commits REMOVED (branch rebased without them)

**Final QA finding** (`SEO-QA-REPORT.md` §2.4-2.5): `MerchantReturnNotPermitted` + `applicableCountry: JP` omitted the policy's defect remedies (free return shipping when Cha Jewels confirms the problem) and wrongly limited the policy to Japan; the per-offer ¥800 rate over-stated the fee for pieces under ¥8,000 because the published rule is cart-based. **Owner decision:** remove both; do not substitute `merchantReturnLink` alone as a claimed return-policy implementation without first verifying Google's requirements for it (its offer-level support is not documented). Open decisions R-1 (return policy encoding) and S-1 (shipping encoding; confirm the rate card first) stay with the owner; nothing is emitted until one is approved. The original proposals are kept below for the record.

**A. Return policy — commit `aacb81e` (REMOVED).** Encodes the published policy (`/legal/returns`, restated in the shopping guide: "We do not accept change-of-mind returns or exchanges"; defects reported within 5 days) as `MerchantReturnPolicy { applicableCountry: "JP", returnPolicyCategory: MerchantReturnNotPermitted, merchantReturnLink: ${base}${prefix}/legal/returns }`. schema.org has no "defects-only remedy" category. **Google may display this as "no returns"** on product results. Google's return-policy documentation (developers.google.com/search/docs/appearance/structured-data/return-policy, read 2026-10-29) confirms `MerchantReturnNotPermitted` is a valid category and that `applicableCountry` + `returnPolicyCategory` are the required pair; `merchantReturnLink` is documented as the alternative "Option B", included here as well so the nuance is one click away. Decision needed: keep, or drop the commit.

**B. Shipping rate card — commit `f324135` (REMOVED; the `JP_FREE_SHIPPING_FROM_JPY` / `JP_SHIPPING_FEE_JPY` constants went with it, so `lib/content/shopping-guide.ts` is unchanged by this PR).** `OfferShippingDetails` for JP only: `shippingRate 0` when the offer price ≥ ¥8,000, else `800` (a comparison with the threshold, never arithmetic); `handlingTime 0–5 DAY`. The two figures now live **once** as `JP_FREE_SHIPPING_FROM_JPY` / `JP_SHIPPING_FEE_JPY` in `lib/content/shopping-guide.ts`, and the guide's Shipping line is built from them (rendered words byte-identical, pinned in both languages by a test). Decision needed: **confirm the rate card is current** (the file's header says it mirrors the Hub's shipping rate card, JP 0 → ¥800, ¥8,000 → free). If the Hub later serves the rate card by API, this should read it instead.

## 4. Test and build evidence (all run on this branch at `54cc316`, 2026-10-29)

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0; 12 warnings, all pre-existing on `develop` (unused imports, `<img>` hints) — none in Phase 4 code |
| `npm run test:unit` | **501 tests, 501 pass, 0 fail** (was 487 before this branch: +9 in `tests/json-ld.test.mjs` for breadcrumb/store, +8 for product/returns/shipping, and the new `tests/json-ld-pages.test.mjs` source guard, 9 tests) |
| `npm run check:terms` | pass |
| `npm run check:money` | pass — 366 files, no browser-side money maths |
| `npm run check:i18n` (incl. `check:layaway-ja`) | pass |
| `npm run check:analytics` | pass |
| `npm run check:cutouts` | pass |
| `npm run build` (`NEXT_PUBLIC_PREVIEW_FIXTURES=1`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000` from `.env.local`) | exit 0; only the same 12 pre-existing lint warnings |

**Local render check** — `next start -p 3041`, a node script parsing every `<script type="application/ld+json">` on 11 pages (`/`, `/en` + `/ja` product, `/en` + `/ja` collection, category, post, both guides, FAQ): **70 assertions PASS, 0 FAIL**. Every block parses; `@type` sets as expected; breadcrumb items are absolute URLs on the built origin with the page's prefix and end at the page; trails rendered as e.g. `Collections › Necklaces › CJ-1002` and `コレクション › ネックレス › CJ-1002`; store keys `@context,@type,name,legalName,url,address,areaServed,priceRange,logo,telephone,email,sameAs`; product offers carry the return policy and `shippingRate 0` (every fixture piece is ≥ ¥8,000; the ¥800 branch is unit-tested at ¥7,999); no `gtin`/`mpn`/`countryOfOrigin`.

**`scripts/check-seo-live.mjs http://localhost:3041`** — 189 PASS, 40 FAIL. **Every FAIL is the same environment artefact**: the build baked `NEXT_PUBLIC_SITE_URL=http://localhost:3000` while the server listened on 3041, so every origin comparison (the pre-existing sitemap and canonical checks as well as the new breadcrumb-origin checks) mismatched; there are zero failures that do not mention `localhost:3000`. All non-origin Phase 4 lines pass (BreadcrumbList present on product / collection / category / post in both languages; store fields; no gtin/mpn; shipping JP-only). The script must be re-run against the branch preview and, after release, production.

Documentation used: Google "Merchant listing" and "Return policy" structured-data pages (developers.google.com/search/docs/appearance/structured-data/merchant-listing, .../return-policy) for property names and the `MerchantReturnNotPermitted` category. No new library APIs were introduced; the Next.js/React usage is the existing `JsonLd` server component pattern.

## 5. UNVERIFIED
- **aggregateRating / review live output**: fixture mode returns no reviews, so the rating branch was verified by unit tests only; needs a branch-preview check on a product with approved reviews.
- **X5 on real data**: fixtures have `description_ja: null`, so the local `/ja` product showed the English fallback (correct per rule); the Japanese branch is unit-tested, not seen live.
- **`email` / `sameAs` from the real Hub**: local values came from `settingsFixture`; the production Hub's `contact.email` and `social.follow` rows decide what appears.
- ~~Google's rendering of `MerchantReturnNotPermitted` and of the shipping rate~~ — moot: neither is emitted (§3).

## 4b. Evidence after the rebase without `aacb81e` / `f324135` (2026-10-29)
See the "Integration" section of `docs/seo/SEO-QA-REPORT.md` for the full-suite results on the rebased branch; the Rich Results Test (code mode) on the previous product block reported Product snippets, Merchant listings and Breadcrumbs valid, with only optional-field notices (`aggregateRating`, `review`, `transitTime`).

## 6. Rich Results Test — TODO (READY FOR QA)
Cannot run locally (needs a public URL). On the branch preview, then on production after release, run https://search.google.com/test/rich-results on:
1. `/en/products/<slug with reviews>` and `/ja/products/<same>` — expect Product (with Offer and rating; no return policy, no shipping) + BreadcrumbList, zero errors.
2. `/en/collections/<slug>`, `/en/categories/<slug>` — BreadcrumbList.
3. `/en/blog/<slug>` — BlogPosting + BreadcrumbList.
4. `/` — JewelryStore (LocalBusiness) with logo / telephone / address / sameAs.
5. Re-run `node scripts/check-seo-live.mjs https://<preview-or-prod>` — expect 0 FAIL.
Record results in `docs/seo/SEO-QA-REPORT.md` and move this phase to VERIFIED → DEPLOYED → SEARCH ENGINE RECRAWL PENDING in `docs/seo/SEO-IMPLEMENTATION-STATUS.md` (orchestrator-owned; not edited on this branch).

## 7. Visible breadcrumbs (QA addendum, 2026-10-29, commits `a51e2b2`, `6e264b9`, `7d26130`)

**Finding (independent review):** the collection, category, jewelry-guide and shopping-guide pages emitted a `BreadcrumbList` with no visible breadcrumb; the blog post had an underlined "back" link, not a trail. Structured data must reflect real visible content (governance rule 11).

**Fix:** one shared server component, `components/site/breadcrumbs.tsx` (`<Breadcrumbs lang items label className? />`), renders BOTH the visible `<nav aria-label="Breadcrumb">` + `<ol>` (the product page's original markup and classes: "/" separators in gold, every crumb but the last a locale link via `localePath`, the last `aria-current="page"` and not a link) AND `<JsonLd type="breadcrumb">` from the **same `items` array**, so the two cannot diverge. The pure mapping lives in `lib/breadcrumbs.ts` (`crumbRows`) and is unit-tested against `buildJsonLd`: row *i*'s href is item *i*'s URL minus the origin, same order, same count, `/` → `/en` or `/ja`. The nav label is `t("pdp", "breadcrumb")` ("Breadcrumb" / 「パンくずリスト」). Every name comes from `lib/i18n` (`nav.home`, `nav.collections`, `nav.blog`, `dict.meta.<guide>.title`) or the Hub data the page already renders (`collectionName`, `categoryName`, `p.sku`, `p.title`). **No template was dropped** — every one hosts the crumb at the top of its `.wrap`, above the head/heading, so all six keep their BreadcrumbList.

| Template | Visible trail (EN) | Visible trail (JA) | Placement |
|---|---|---|---|
| Product (`/products/[slug]`) | Collections / Pendants / CJ-1001 | コレクション / ペンダント / CJ-1001 | unchanged position; now produced by the component (nav HTML byte-identical to before) |
| Blog post (`/blog/[slug]`) | Blog / What K18 means, and how to read the stamp | ブログ / (title) | replaces the underlined "back" link (the "Blog" crumb is that link); no extra padding, the article's own `py-[clamp(48px,7vw,96px)]` frames it |
| Collection (`/collections/[slug]`) | Collections / Necklaces | コレクション / ネックレス | `.wrap` strip between the header and the dark `CollectionHead` band |
| Category (`/categories/[slug]`) | Home / Fine Jewelry | ホーム / ファインジュエリー | `.wrap` strip above the head (hero photo or `CategoryStage`); Home links to `/en` or `/ja` |
| Jewelry guide | Home / Jewelry guide | ホーム / ジュエリーガイド | first child of the intro section's `.wrap`; the section's top padding moved onto the eyebrow so the heading keeps its height |
| Shopping guide | Home / Shopping guide | ホーム / ショッピングガイド | same as the jewelry guide |

**Evidence (this worktree, build `NEXT_PUBLIC_SITE_URL=http://localhost:3042`, `next start -p 3042` — port 3000 was held by another worktree's server, so the origin was baked for 3042 instead):**
- `npm run typecheck` exit 0; `npm run lint` exit 0 (12 warnings, all pre-existing, none in touched files); `npm run test:unit` **507 pass, 0 fail** (was 501: `tests/json-ld-pages.test.mjs` now 11 source guards — every listed page must render `<Breadcrumbs …>` and may NOT mount a bare `<JsonLd type="breadcrumb">` or a hand-drawn crumb nav; new `tests/breadcrumbs.test.mjs`, 4 tests); `check:terms`, `check:i18n` (+`check:layaway-ja`), `check:money` (368 files), `check:analytics`, `check:cutouts` all pass; `npm run build` exit 0.
- `node scripts/check-seo-live.mjs http://localhost:3042`: **277 pass, 0 fail, 0 deferred.** New per-page lines on `/en` + `/ja` product, collection, category, post, jewelry guide, shopping guide (36 assertions): the visible nav exists with an `<ol>`; its link hrefs equal the BreadcrumbList item URLs (same order, count = items − 1); the `aria-current` text equals the last item's name.
- Playwright (1280 px and 375 px, `.playwright-mcp/crumb-{en-collection,ja-collection,en-category,en-jewelry-guide,ja-shopping-guide,en-product,en-post}-{1280,375}.png`): the accessibility tree shows `navigation "Breadcrumb"` / `navigation "パンくずリスト"` → `list` → links with `/en/…` or `/ja/…` URLs and the current page as plain text; labels in the page language; **0 console errors** on every page (the only console entry is the pre-existing `logo-badge-96.webp` preload warning). At 375 px the trail is one 16 px line (the post's long title wraps inside the flex-wrap list).

**UNVERIFIED:** a Hub category or collection whose name contains `&`/`<` (HTML-escaped in the nav, raw in the JSON) is handled by the live check's unescape, but no fixture has one; Google's rendering of the breadcrumb rich result still needs the Rich Results Test (§6).
