# Cha Jewels SEO Implementation Status

**Last updated:** 2026-10-28
**Plan:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` · **Evidence:** `docs/seo/SEO-BASELINE.md`

Statuses: NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE

Nothing in this file is marked indexed, ranking or rich-result eligible. No code has been changed for SEO yet.

---

## Phase status

| Phase | Item | Status | Note |
|---|---|---|---|
| 0 | SEO baseline (code + live probe) | AUDITED | `SEO-BASELINE.md` written 2026-10-28 |
| 0 | Search Console Day-0 export | NOT STARTED | Needs the owner; not available to this session |
| 1 | Technical SEO hardening | AUDITED | Plan below; awaiting review |
| 1 | Old-domain redirect (`chajewelsjapan.com`) | BLOCKED | Domain serves a third-party JSON page, not a redirect. Outside the repo; owner decision needed |
| 1 | Preview/staging noindex | NOT STARTED | UNVERIFIED; needs a real preview URL |
| 2 | `/en` and `/ja` URL architecture | NOT STARTED | High risk; design first, dedicated branch |
| 3 | `/en/layaway` | BLOCKED | Depends on Phase 2 |
| 4 | BreadcrumbList | NOT STARTED | Can be built independently of Phase 2 but URLs will change in Phase 2 |
| 4 | Review / rating schema | NOT STARTED | Hub review fields not yet read |
| 4 | gtin / mpn / shippingDetails / return policy | NOT STARTED | Needs real Hub data and verified business policy |
| 4 | JewelryStore additions | NOT STARTED | Needs verified business facts from the owner |
| 5 | Category/collection SEO fields | NOT STARTED | Needs Hub schema (Lovable owns migrations; Claude drafts SQL only) |
| 6 | Merchant Center | NOT STARTED | Existence outside the repo UNVERIFIED |
| 7-10 | Landing pages, Kihei, K18, Filipino | NOT STARTED | Need Search Console demand data first |

---

## Audit findings

Codes: C = confirmed in code and live output; U = unverified.

| # | Finding | Evidence | Severity | Phase |
|---|---|---|---|---|
| F1 | English has no indexable URL; every `?lang=en` URL canonicalizes to the Japanese render | C: `SeoLinks`, live HTML | Critical | 2 |
| F2 | hreflang `en` alternate points at a URL whose canonical is the `ja` URL; no valid reciprocal pair | C: live HTML for `/` and a product | High | 2 |
| F3 | `/layaway` 404s for crawlers; `?lang=en` canonicalizes to the 404; not in sitemap | C: live status, `sitemap.ts` comments | Critical | 3 |
| F4 | `/cart` and `/login` are 200, indexable, self-canonical, not disallowed | C: live HTML | Medium | 1 |
| F5 | Canonical, hreflang and `og:url` are emitted on unknown paths and on 404 pages | C: `/nonexistent-xyz` | Low | 1 |
| F6 | Old domain does not redirect (JSON 200 on apex, 404 on www paths) | C: live probe | High, external | 1 |
| F7 | `http://chajewelsjp.com/path` takes two 308 hops to reach www | C: live probe | Low | 1 |
| F8 | Sitemap has no hreflang alternates and no `lastmod` on static pages | C | Low | 2 |
| F9 | Sold products may be listed in the sitemap | U | Unknown | 1 |
| F10 | Product JSON-LD uses `description_en` on the Japanese page | C: `json-ld.tsx` | Low | 4 |
| F11 | No BreadcrumbList, aggregateRating/review, gtin/mpn, shipping or return data in JSON-LD | C | Medium | 4 |
| F12 | JewelryStore is on the home page only and lacks logo, contact, sameAs, hours, street address | C | Low-Medium | 4 |
| F13 | Category/collection pages: title and description only, no OG, no SEO fields | C | Medium | 5 |
| F14 | No automated test covers robots, sitemap, canonical, hreflang, JSON-LD or status codes | C | High (blocks safe change) | 1 |
| F15 | Preview deployments' indexing protection not shown in the repo | U | Unknown | 1 |

Already implemented and to be preserved (verified live): dynamic sitemap with products, collections, categories and posts; robots.txt; per-path canonical (not homepage-only); Product, BlogPosting, FAQPage and JewelryStore JSON-LD; product and blog OG metadata; image optimization (AVIF/WebP); `/gold-guide` 308; noindex on search, review and unsubscribe pages; layaway-only posts excluded from the sitemap.

Obsolete or inaccurate in the master plan: none found. Section 2.2's "Layaway crawlable English URL" and "`/en/`, `/ja/` missing" are confirmed.

---

## Proposed Phase 1 plan (technical SEO hardening)

Principle: Phase 1 does **not** touch routing, language resolution, canonical strategy, sitemap architecture or JSON-LD architecture. Those belong to Phase 2 and Phase 4. Phase 1 adds safety nets and fixes low-risk leaks.

Branch: `seo/phase-1-technical-hardening` from `develop`. One PR into `develop`. Not auto-merged.

### 1A. Regression tests first (no behaviour change)

- Add `tests/seo-*.test.mjs` unit tests (Node test runner, same style as `tests/meta-text.test.mjs`) for:
  - `app/robots.ts` output: exact disallow list, sitemap URL.
  - `app/sitemap.ts` with a stubbed Hub: excludes `/layaway`, excludes layaway-only posts, includes products/collections/categories, no private routes.
  - `SeoLinks` output for a path (canonical, `og:url`, three alternates).
  - `JsonLd` output parsed as JSON for store, product, post and FAQ (required fields; no `countryOfOrigin`; brand only when recorded).
- Add `scripts/check-seo-live.mjs` (not part of CI): given a base URL, fetches the route matrix from the `cha-seo-qa` skill and prints status, redirects, title, canonical, hreflang, robots meta, JSON-LD types. Read-only. Used to prove nothing regressed before and after each phase.
- These tests lock today's behaviour, so any later phase has to change them deliberately.

### 1B. Keep utility pages out of the index

- Add `robots: { index: false, follow: true }` metadata to `/cart` and `/login` (same pattern as `/search`). Do **not** add them to `robots.txt` (a `Disallow` would stop crawlers from seeing the `noindex`).
- Probe and cover `/cart/restore`, `/auth/*`, `/loyalty/join` (currently UNVERIFIED) the same way if they render HTML.
- Risk: low. `/cart` and `/login` are not in the sitemap; no public link relies on them being indexed.

### 1C. Stop emitting canonical/hreflang where they are wrong (small, low risk)

- Skip `SeoLinks` output for `noindex` utility pages (cart, login, search, review, unsubscribe, receipts) and for not-found renders.
- Needs a design check first: `SeoLinks` is driven only by the path header and cannot see `notFound()`. Options are a route allow-list in `lib/page-meta.tsx` or setting a header from the not-found boundary. Choose after reading how Next renders `not-found.tsx`. If neither is clean, defer to Phase 2 where `SeoLinks` is rewritten anyway.

### 1D. Verify, do not change

- Sold products in the sitemap (F9): fetch and count against the Hub; decide with the owner whether sold pieces should remain listed (policy decision, not a code fix).
- Preview noindex (F15): request a preview URL's headers and robots; if it is indexable, add `X-Robots-Tag: noindex` for non-production hosts in the middleware (one condition on `VERCEL_ENV`).
- Two-hop redirect (F7): this is Vercel domain configuration (apex http), not repo code; record only.

### 1E. External actions for the owner (cannot be done from this repo)

- Old domain `chajewelsjapan.com`: decide where it should point, and whether the third-party host can serve redirects at all. Export old indexed URLs and backlinks from Search Console or a backlink tool before any mapping.
- Search Console Day-0 export (master plan Phase 0 list).
- Confirm Merchant Center and Google Business Profile status.

### Test plan

`npm run typecheck`, `npm run lint`, `npm run test:unit`, `check:terms`, `check:money`, `check:i18n`; then run `scripts/check-seo-live.mjs` against the Vercel preview and compare with the baseline in `SEO-BASELINE.md` for: `/`, a product, a sold product, a collection, a category, a blog post, `/jewelry-guide`, `/faq`, `/about`, `/legal/tokusho`, `/cart`, `/login`, `/search`, `/layaway`, `/layaway?lang=en`, an unknown route. Expect only `/cart` and `/login` to gain `noindex`.

### Rollback

Each change is metadata-only or test-only; revert the PR. No data, routing or Hub contract is touched.

### Out of Phase 1

Locale paths, redirects of legacy URLs, hreflang redesign, `/en/layaway`, any JSON-LD addition, category/collection SEO fields, Merchant Center. The `check:money`, `check:layaway-ja` and terminology rules apply to all later work.

---

## Change log

- 2026-10-28: Baseline and this file created. No application code changed.
