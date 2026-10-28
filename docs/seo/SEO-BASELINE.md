# Cha Jewels SEO Baseline (Phase 0)

**Date:** 2026-10-28
**Scope:** read-only audit. No application code, routing, canonical, sitemap, structured-data, checkout or Hub contract was changed.
**Code audited:** `origin/develop` at `f963f2c`. The local checkout was 6 commits behind; the only difference in SEO-relevant files is one added sitemap line (`/shopping-guide`). Nothing was pulled.
**Live site probed:** `https://www.chajewelsjp.com` with plain read-only GET/HEAD requests, no cookies and no `Accept-Language` (this is how most crawlers arrive, and the site then serves Japanese).
**Source of truth:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md`

Everything below is marked **CONFIRMED** (seen in code and/or live output), or **UNVERIFIED** (needs a check not possible from this session).
This document does not say anything is indexed. Nothing here is evidence of indexing, ranking or rich-result eligibility.

---

## 1. Route architecture

- Next.js 15 App Router, server-rendered, `revalidate = 60` on products, categories, collections and the home page.
- One URL per page. English and Japanese share the same path. **CONFIRMED**
- Public routes: `/`, `/products/[slug]`, `/categories/[slug]`, `/collections`, `/collections/[slug]`, `/blog`, `/blog/[slug]`, `/jewelry-guide`, `/shopping-guide`, `/layaway`, `/sale`, `/loyalty`, `/wholesale`, `/faq`, `/about`, `/why-cha-jewels`, `/contact`, `/affiliations`, `/legal/{privacy,terms,returns,tokusho}`.
- Private or utility routes: `/account/*`, `/checkout/*`, `/cart`, `/cart/restore`, `/login`, `/auth/*`, `/search`, `/review/[token]`, `/already-registered`, `/loyalty/join`, `/receipts/verify`, `/newsletter/unsubscribe`, `/cart-reminders/unsubscribe`, `/api/*`.
- `/en/` and `/ja/` prefixes do not exist. **CONFIRMED**

## 2. Language resolution

- Order: `cj-lang` cookie, then `?lang=` (middleware writes the cookie), then `Accept-Language` on a first visit, then default `ja` (`lib/i18n.ts`, `middleware.ts`, `lib/i18n-server.ts`). **CONFIRMED**
- A crawler sends no cookie and usually no `Accept-Language`, so it always receives Japanese.
- `?lang=en` is the only way a crawler reaches English. Its canonical strips the parameter, so every English URL canonicalizes to the Japanese render.
- Consequence: **English content has no indexable URL of its own.** **CONFIRMED** (code comments in `lib/page-meta.tsx` and `app/sitemap.ts` state the same).

## 3. Canonical and hreflang

`SeoLinks` (`lib/page-meta.tsx`, rendered from `app/layout.tsx`) emits on every middleware-matched path: `canonical`, `og:url`, `fb:app_id`, and three alternates.

Live output for `/` and a product page (**CONFIRMED**):

```
canonical        https://www.chajewelsjp.com/<path>
hreflang ja      https://www.chajewelsjp.com/<path>
hreflang en      https://www.chajewelsjp.com/<path>?lang=en
hreflang x-default https://www.chajewelsjp.com/<path>
```

Defects:

- The `en` alternate points at a URL whose own canonical is the `ja` URL. Search engines treat that as a non-canonical alternate; the pair is not reciprocal.
- The same canonical, hreflang and `og:url` set is emitted on unknown paths (`/nonexistent-xyz`) and on `/cart`, `/login`, `/search`. Those pages return 404 (noindex) or are utility pages.
- `Metadata.alternates` is deliberately not used. The comment explains why: Next strips the query from a `/` URL. Any locale-path design must keep this in mind for `/`.

## 4. robots

`app/robots.ts` (live output matches, **CONFIRMED**):

```
User-Agent: *
Allow: /
Disallow: /account
Disallow: /checkout
Disallow: /api
Disallow: /already-registered
Disallow: /review/
Sitemap: https://www.chajewelsjp.com/sitemap.xml
```

Page-level `noindex` exists on `/search` (`noindex, follow`), `/review/[token]`, `/newsletter/unsubscribe`, `/cart-reminders/unsubscribe`, `/receipts/verify`, and on Next's own 404 pages. **CONFIRMED**

Gaps:

- `/cart` and `/login` return 200 with a self canonical, no `noindex`, and no `robots.txt` rule. **CONFIRMED live.** They are not in the sitemap.
- `/cart/restore`, `/auth/*`, `/loyalty/join`: **UNVERIFIED** (not probed).
- `/search` must stay crawlable (a `Disallow` would hide its `noindex`). Do not add it to `robots.txt`.
- `/checkout` and `/account` answer 307 to `/login?next=...` for anonymous requests and are also disallowed. Fine.

## 5. Sitemap

`app/sitemap.ts`, live output **CONFIRMED**: 483 URLs.

| Group | Count |
|---|---|
| Products | 449 |
| Collections | 12 |
| Categories | 5 |
| Legal | 4 |
| Blog (index + posts) | 3 |
| Other static pages | 10 |

- Hub fetches are individually `.catch(() => [])`, so a Hub outage gives a partial sitemap, not a 500.
- Layaway-only blog posts are excluded (they 404 in Japanese). `/layaway` is deliberately absent, with a long comment saying why.
- `lastmod` is present for products (450 entries) and posts; static pages have none.
- No `xhtml:link` alternates (0 found).
- Whether sold products are listed: **UNVERIFIED**. `hub.productSlugs()` returns slug and `updated_at` only; the product page answers 200 with `SoldOut` for sold pieces.
- The sitemap is built once per request path through the Hub; its freshness behaviour after a Hub change was not tested.

## 6. HTTP status and redirects

All **CONFIRMED live** unless stated.

| Request | Result |
|---|---|
| `http://www.chajewelsjp.com/` | 308 to `https://www.chajewelsjp.com/` |
| `https://chajewelsjp.com/` | 308 to `https://www.chajewelsjp.com/` |
| `http://chajewelsjp.com/about` | 308 to `https://chajewelsjp.com/about` (then a second 308 to www; two hops) |
| `/gold-guide` | 308 to `/jewelry-guide#metals` (`next.config.ts`) |
| `/layaway` (no cookie) | 404, `noindex` |
| `/layaway?lang=en` | 200, canonical `/layaway` |
| `/nonexistent-xyz` | 404, `noindex` |
| `/checkout`, `/account` | 307 to `/login?next=...` |

**Old domain (`chajewelsjapan.com`): not redirected.** The apex answers 200 with a JSON document that names the business (`"name":"Cha Jewels Japan"`, shop and Messenger fields), apparently a third-party shop host. `www.chajewelsjapan.com/about` answers 404. Neither redirects to `chajewelsjp.com`. This cannot be fixed from this repository (DNS or hosting at the old domain). **Needs external verification and an owner decision.**

Preview/staging noindex: **UNVERIFIED.** No `X-Robots-Tag` or preview rule exists in the repository. Vercel normally adds `noindex` to preview deployments itself; this must be confirmed against a real preview URL.

## 7. Metadata

- Root `generateMetadata` (`app/layout.tsx`): title default and `%s | Cha Jewels` template, site description, `og:type website`, `og:locale` per language, `google: notranslate`, `metadataBase`. **CONFIRMED**
- Static pages use `pageMeta("<key>")` with strings from `dict.meta` in both languages.
- Product: `productTitle` / `productMetaDescription` (`lib/meta-text.ts`, unit-tested in `tests/meta-text.test.mjs`) plus the primary image as `og:image`.
- Category and collection: title is the Hub name, description is the Hub description. No `openGraph`, no dedicated SEO fields. **CONFIRMED**
- Blog posts: own title, `openGraph` and `twitter` blocks, with the cover image.
- Home: JA `Cha Jewels | K18ゴールド・パール・ダイヤモンド`; EN `Cha Jewels | K18 gold, pearls and diamonds`.
- Default OG image is `app/opengraph-image.png`.

## 8. Structured data (`components/site/json-ld.tsx`)

| Type | Where | Content |
|---|---|---|
| `JewelryStore` | home only | name, legalName, url, address (locality, region, country only), areaServed, priceRange |
| `Product` | product page | name, sku, image[], material, description (`description_en` even on the Japanese page), brand (only when origin is BRAND and a brand is recorded), `Offer` (price, JPY, itemCondition, availability, url) |
| `BlogPosting` | blog post | headline, description, datePublished, inLanguage, image, mainEntityOfPage, author/publisher (Organization) |
| `FAQPage` | FAQ page | questions and answers |

Not present: `BreadcrumbList` anywhere; `aggregateRating` / `review`; `gtin` / `mpn`; `shippingDetails`; `hasMerchantReturnPolicy`; `logo`, `telephone`, `email`, `sameAs`, `openingHours`, street address on the store. No `Organization` on the home page or `WebSite` entity. **CONFIRMED**

Deliberate: `countryOfOrigin` is never emitted (comment in the file).

## 9. Layaway indexability

**CONFIRMED defect.** Japanese (and crawler) requests get 404 for `/layaway`. The English page only exists at `/layaway?lang=en`, whose canonical is `/layaway`, the URL that returns 404 to a crawler. It is not in the sitemap. Layaway-only blog posts have the same problem and are excluded from the sitemap. Policy (owner decision 2026-09-25): nothing layaway-related on the Japanese site; `layawayOffered(lang)` is the only gate. Guard: `npm run check:layaway-ja`.

## 10. Images

- `next/image` with `formats: ["image/avif", "image/webp"]` and a tuned `imageSizes` list (`next.config.ts`). **CONFIRMED**
- Remote hosts are an allow-list in `lib/image-hosts.ts`.
- Hub image metadata (alt, type, angle, hallmark/certificate flags): **not inspected yet.**

## 11. Analytics and tracking (do not disturb)

Vercel Analytics and Speed Insights, Metricool (production only), Meta Pixel and Google Ads tags gated behind a consent banner. Search Console use: **UNVERIFIED from the repository** (no verification tag or file was looked for in this pass).

## 12. Existing tests and guards

- `npm run test:unit` runs `tests/**/*.test.mjs` (Node test runner). The only SEO-related one is `tests/meta-text.test.mjs`. No test covers robots, sitemap, canonical, hreflang, JSON-LD or HTTP status. **CONFIRMED** (searched `tests/`, `e2e/`, `scripts/`).
- `e2e/` holds Playwright with a single `signup.spec.ts`.
- Pre-commit checks: `check:terms`, `check:money`, `check:i18n` (includes `check:layaway-ja`).

## 13. Not yet inspected in detail

Read in full: `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/page.tsx`, `components/site/json-ld.tsx`, `lib/page-meta.tsx`, `lib/i18n-server.ts`, `lib/site.ts`, `lib/layaway-availability.ts`, `middleware.ts`, `next.config.ts`, `app/api/lang/route.ts`.
Read in part (metadata, 404 and JSON-LD lines only): the product, category, collection, blog, jewelry-guide and layaway pages; `lib/i18n.ts` (language functions and the `meta` dictionary).
Not read: `supabase/contracts/api.md`, Hub review/rating fields, Hub category/collection field list, `docs/CLAUDE-DETAILS.md` sections beyond the headings, link generation in header/footer/cards (needed for Phase 2).
