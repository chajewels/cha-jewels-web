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
- **hasMerchantReturnPolicy** (own commit `aacb81e`, owner decision — see §3).
- **shippingDetails** (own commit `f324135`, owner decision — see §3).

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

## 3. Owner decisions (each in its own commit so it can be dropped with one `git revert`)

**A. Return policy — commit `aacb81e`.** Encodes the published policy (`/legal/returns`, restated in the shopping guide: "We do not accept change-of-mind returns or exchanges"; defects reported within 5 days) as `MerchantReturnPolicy { applicableCountry: "JP", returnPolicyCategory: MerchantReturnNotPermitted, merchantReturnLink: ${base}${prefix}/legal/returns }`. schema.org has no "defects-only remedy" category. **Google may display this as "no returns"** on product results. Google's return-policy documentation (developers.google.com/search/docs/appearance/structured-data/return-policy, read 2026-10-29) confirms `MerchantReturnNotPermitted` is a valid category and that `applicableCountry` + `returnPolicyCategory` are the required pair; `merchantReturnLink` is documented as the alternative "Option B", included here as well so the nuance is one click away. Decision needed: keep, or drop the commit.

**B. Shipping rate card — commit `f324135`.** `OfferShippingDetails` for JP only: `shippingRate 0` when the offer price ≥ ¥8,000, else `800` (a comparison with the threshold, never arithmetic); `handlingTime 0–5 DAY`. The two figures now live **once** as `JP_FREE_SHIPPING_FROM_JPY` / `JP_SHIPPING_FEE_JPY` in `lib/content/shopping-guide.ts`, and the guide's Shipping line is built from them (rendered words byte-identical, pinned in both languages by a test). Decision needed: **confirm the rate card is current** (the file's header says it mirrors the Hub's shipping rate card, JP 0 → ¥800, ¥8,000 → free). If the Hub later serves the rate card by API, this should read it instead.

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
- **Google's rendering** of `MerchantReturnNotPermitted` and of the shipping rate: cannot be known before the Rich Results Test and Search Console.

## 6. Rich Results Test — TODO (READY FOR QA)
Cannot run locally (needs a public URL). On the branch preview, then on production after release, run https://search.google.com/test/rich-results on:
1. `/en/products/<slug with reviews>` and `/ja/products/<same>` — expect Product (with Offer, return policy, shipping, rating) + BreadcrumbList, zero errors.
2. `/en/collections/<slug>`, `/en/categories/<slug>` — BreadcrumbList.
3. `/en/blog/<slug>` — BlogPosting + BreadcrumbList.
4. `/` — JewelryStore (LocalBusiness) with logo / telephone / address / sameAs.
5. Re-run `node scripts/check-seo-live.mjs https://<preview-or-prod>` — expect 0 FAIL.
Record results in `docs/seo/SEO-QA-REPORT.md` and move this phase to VERIFIED → DEPLOYED → SEARCH ENGINE RECRAWL PENDING in `docs/seo/SEO-IMPLEMENTATION-STATUS.md` (orchestrator-owned; not edited on this branch).
