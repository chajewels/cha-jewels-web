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
- `lastmod` is present for products (449 entries) and posts; static pages have none.
- No `xhtml:link` alternates (0 found).
- Whether sold products are listed: unverified at Day 0; **resolved in Phase 1 (§17): 120 of 449 are sold and stay listed for now (decision D3, later policy X10).** `hub.productSlugs()` returns slug and `updated_at` only; the product page answers 200 with `SoldOut` for sold pieces.
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

**Old domain (`chajewelsjapan.com`): not redirected.** The apex answers 200 with a JSON document that names the business (`"name":"Cha Jewels Japan"`, shop and Messenger fields), apparently a third-party shop host. `www.chajewelsjapan.com/about` answers 404. Neither redirects to `chajewelsjp.com`. This cannot be fixed from this repository (DNS or hosting at the old domain). **Decided (D2): BLOCKED — EXTERNAL DOMAIN/DNS/HOST CONFIGURATION**, see the Phase 1 addendum (§17) and `SEO-IMPLEMENTATION-STATUS.md`.

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

---

# Phase 1 addendum (2026-10-28): private and utility routes

**Before** = production `https://www.chajewelsjp.com`, anonymous requests, before any Phase 1 change.
**After** = this branch built locally in fixtures mode (`NEXT_PUBLIC_PREVIEW_FIXTURES=1`), same requests, checked with `scripts/check-seo-live.mjs`.
Production does not have these changes yet. Nothing here says a page is or is not indexed.

## 14. Route matrix

The "Tags: → 0" results below apply to the Phase 1-managed private/utility noindex pages. They are not a claim about every noindex page: an unmatched generic 404 route is `noindex` but still inherits the canonical and hreflang from `<SeoLinks />` (X1, deferred to Phase 2).

"Robots" is the `<meta name="robots">` of the served HTML. "Tags" counts the real `<link rel="canonical">` plus `hreflang` alternates (not the escaped copies Next repeats inside its RSC payload).

| Route | Status | Robots before → after | Tags before → after | In sitemap | Private data can appear? | Policy |
|---|---|---|---|---|---|---|
| `/cart` | 200 | none → `noindex, follow` | 4 → 0 | no | Only the visitor's own cart, read per request; none for a crawler | noindex, follow |
| `/cart/restore` | 307 to `/login?next=%2Fcart%2Frestore` | n/a (route handler, no HTML) | n/a | no | Restores a signed-in customer's saved cart; redirect only | Not a page. Its redirect target is noindex |
| `/login`, `/login?next=…` | 200 | none → `noindex, follow` | 4 → 0 | no | No. A form; `next` is echoed only as a relative path | noindex, follow |
| `/auth/callback` | 307 to `/login?error=missing_code…` | n/a (route handler) | n/a | no | Exchanges a one-use code and sets session cookies; no HTML | Not a page |
| `/auth/confirm` | 307 without params; 200 with `token_hash` | none → `noindex, nofollow` | 4 → 0 | no | The URL carries a one-use token | noindex, nofollow |
| `/account`, `/account/*` | 307 to `/login?next=…` | n/a for crawlers; layout now also says `noindex, nofollow` | n/a | no | Yes when signed in: orders, addresses, plans | Disallowed in robots.txt, gated by middleware, noindex as defence in depth |
| `/checkout`, `/checkout/complete` | 307 to `/login?next=…` | same as account | n/a | no | Yes when signed in | Same as account |
| `/loyalty` | 200 | none (unchanged) | 4 (unchanged) | **yes** | No | Public, indexable |
| `/loyalty/join` | 307 to `/login?next=%2Floyalty%2Fjoin` | n/a; layout now says `noindex, nofollow` | n/a | no | Yes when signed in (membership link) | noindex, nofollow |
| `/search`, `/search?q=…`, `?stock=1` | 200 | `noindex, follow` (unchanged) | 4 → 0 | no | No; lists public products | noindex, follow (see §15) |
| `/already-registered` | 200 | none → `noindex, nofollow` | 4 → 0 | no | A notice shown after sign-in; nothing seen anonymously | noindex, nofollow |
| `/review/[token]`, `/receipts/verify`, `/newsletter/unsubscribe`, `/cart-reminders/unsubscribe` | 200 | `noindex, nofollow` (unchanged, set per page) | 4 → 0 | no | Token links; one-use | noindex, nofollow |
| `/api/search?q=…` | 200 JSON | n/a | n/a | no | No | Blocked by `Disallow: /api`; not HTML |
| Unknown route, e.g. `/nonexistent-xyz` | 404 | `noindex` (Next adds it) | 4 → 4 | no | No | **DEFERRED to Phase 2** (§16) |
| Missing slug, e.g. `/products/nonexistent-xyz` | 404 | `noindex` | 0 real tags (Next serves an error shell) | no | No | Already correct |

What was **not** verified: a signed-in render of `/account`, `/checkout` and `/loyalty/join` (no session in this audit). The rule that adds `noindex` to them lives in the root layout and is covered by unit tests on `lib/seo-policy.ts`, not by a rendered check.

## 15. Search-page indexing policy (decided before implementation)

How it works (`app/search/page.tsx`): `/search?q=<text>` runs the visitor's text against the catalogue; `?stock=1` filters to in-stock pieces; a chip opens a matching collection. Any text produces a distinct URL, so the set of URLs is unbounded and every result list is a re-ordering of products and collections that already have their own pages.

Decision: **`noindex, follow`, not in the sitemap, not blocked in `robots.txt`.**

- `noindex` because these are thin, unbounded duplicates of the curated pages. The page already said so (its own comment); production confirms `noindex, follow` on `/search`, `/search?q=kihei` and `/search?q=`.
- `follow` so the product and collection links on a result list stay crawlable.
- No `Disallow`: a crawler that cannot fetch the page cannot read the `noindex`.
- Curated categories, collections and, later, dedicated landing pages (Phase 7) are the indexable alternatives.
- What changed: the canonical and language alternates on search URLs are gone. A noindex page that also names a canonical sends a mixed signal, and there is nothing to consolidate.

## 16. 404 metadata: what is fixed and what is deferred

- A missing product, collection, category or post (`notFound()` thrown by a page): Next serves its error shell, `noindex`, and **no** real canonical or hreflang element. Already correct.
- An **unmatched route** (`/nonexistent-xyz`): Next renders the normal root layout around `not-found.tsx`, so `<SeoLinks />` emits a canonical and three alternates for a URL that does not exist. It is `noindex`, so the practical harm is small, but the signal is wrong.
- No framework-supported way to fix it in Phase 1 was found. Context7 (Next.js 15 docs) shows `notFound()` injecting `noindex` and nothing that lets a layout detect a not-found render. The options are a hand-kept allow-list of known route patterns (a second copy of the routing table that breaks silently when a route is added) or a catch-all route (changes how every unknown URL renders, from full server HTML to the error shell). Neither is safe enough.
- **Deferred to Phase 2**, where `<SeoLinks />` is rewritten around locale paths and can sit under route-specific layouts. `scripts/check-seo-live.mjs` reports it as DEFERRED, not as a pass.

## 17. Verification-only results

| Check | Result |
|---|---|
| Sold products in the sitemap | **120 of 449** product URLs (27%) are sold. Each answers 200 with `availability: SoldOut`; none is a 404 or redirect. `hub.productSlugs()` returns no status field, so the sitemap cannot filter them. **Decision D3: KEEP IN SITEMAP FOR NOW.** Sitemap behaviour is unchanged in Phase 1; the longer-term policy is deferred item X10 and nothing is approved (`SEO-IMPLEMENTATION-STATUS.md`). |
| Preview deployment indexing | Checked `https://cha-jewels-botnb5g4x-cha-jewels.vercel.app` (latest Preview deployment of `f963f2c`). Every request, including `/robots.txt`, answers **302 to Vercel SSO** with `x-robots-tag: noindex`. Not publicly indexable, so **no `X-Robots-Tag` code was added**. One deployment sampled; branch-alias previews are assumed to share the project's protection setting (UNVERIFIED for them). |
| HTTP to HTTPS | `http://www.chajewelsjp.com/…` is one 308 to `https://www…`. Path and query survive. |
| Apex to www | `https://chajewelsjp.com/…` is one 308 to `https://www…`. `http://chajewelsjp.com/about?x=1` takes **two** 308 hops (http apex, https apex, https www) and lands correctly with the query intact. Vercel domain setting; not repo code. Left unchanged. |
| Old domain | Unchanged from §6. **Decision D2: BLOCKED — EXTERNAL DOMAIN/DNS/HOST CONFIGURATION.** Desired destination `https://www.chajewelsjp.com/`; no repository change and no domain-routing change in Phase 1. Deferred external work is listed under D2 in `SEO-IMPLEMENTATION-STATUS.md`. |
