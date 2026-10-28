# Cha Jewels SEO Implementation Status

**Last updated:** 2026-10-28 (Phase 1 on branch `seo/phase-1-technical-hardening`, not pushed, not merged)
**Plan:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` · **Evidence:** `docs/seo/SEO-BASELINE.md` (Day 0 and the Phase 1 addendum, §14-17)

Statuses: NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE

Nothing in this file is marked indexed, ranking or rich-result eligible. Nothing from Phase 1 is deployed.
"Locally verified" means: unit tests pass, and the changed pages were rendered by a local build (fixtures mode) and checked with `scripts/check-seo-live.mjs`. Production has not been re-checked because it does not have the change.

---

## Phase status

| Phase | Item | Status | Note |
|---|---|---|---|
| 0 | SEO baseline (code + live probe) | VERIFIED | `SEO-BASELINE.md` |
| 0 | Search Console Day-0 export | NOT STARTED | Needs the owner |
| 1 | Private/utility route matrix | VERIFIED | Baseline §14. Signed-in renders not checked (see below) |
| 1 | Search-page indexing policy | VERIFIED | Baseline §15: `noindex, follow`, not in sitemap, not blocked |
| 1 | SEO regression tests | READY FOR QA | 20 new unit tests + `scripts/check-seo-live.mjs` |
| 1 | Private/utility noindex | READY FOR QA | Locally verified; not deployed |
| 1 | 404 metadata cleanup | PARTIAL: page-level 404s already correct; unmatched-route 404 DEFERRED to Phase 2 | Baseline §16 |
| 1 | Verification-only checks | VERIFIED | Sold products, preview, HTTPS, www: baseline §17 |
| 1 | Non-production `X-Robots-Tag` | NOT NEEDED | Preview is behind Vercel Authentication and already sends `x-robots-tag: noindex` |
| 1 | Old-domain redirect (`chajewelsjapan.com`) | BLOCKED — EXTERNAL DOMAIN/DNS/HOST CONFIGURATION | Decided (D2). No repository change in Phase 1 |
| 1 | Sold products in the sitemap | KEEP IN SITEMAP FOR NOW | Decided (D3). No sitemap change in Phase 1. Later policy review: X10 |
| 2 | `/en` and `/ja` URL architecture | NOT STARTED | Unchanged. Next |
| 3 | `/en/layaway` | BLOCKED | Depends on Phase 2 |
| 4-10 | Structured data, Merchant Center, SEO fields, content hubs | NOT STARTED | Untouched |

---

## Phase 1 item evidence

### 1. Route matrix and search policy
Baseline §14 (15 route rows, status/robots/canonical/hreflang/sitemap/private data/policy) and §15. Source: anonymous GETs to production on 2026-10-28, and reading `app/{cart,login,auth,account,checkout,loyalty/join,search}` and the middleware gate.

### 2. Tests (written before the fix)
- `tests/seo-index-policy.test.mjs` (8): states the intended policy: 22 private/utility paths are noindex; 22 curated paths stay indexable with no directive; match by path segment (`/cartography`, `/loyalty-program` are not caught; `/loyalty` is public, `/loyalty/join` is not); trailing slash; a Phase 1-managed private/utility noindex path emits no canonical or alternates.
- `tests/seo-robots.test.mjs` (5): crawl rules. Account/checkout/API/review stay disallowed; `/search`, `/cart`, `/login` must **not** be disallowed, so their noindex can be read; no public path is blocked.
- `tests/seo-sitemap.test.mjs` (7): absolute, query-free, same-origin, unique; no noindex route listed (checked against the policy module); curated pages listed; `/layaway` absent; layaway-only, unpublished and blank-slug posts absent; post `lastModified`; survives a Hub outage.
- **Red first:** before `lib/seo-policy.ts` existed, all three files failed with `ERR_MODULE_NOT_FOUND`. Behaviour that was already correct (robots, sitemap eligibility) is preserved by tests 2 and 3; the policy tests encode the intended state, not the old one.
- `scripts/check-seo-live.mjs <baseUrl>`: read-only; 120 checks over the route matrix, sitemap, robots.txt and JSON-LD (JewelryStore, Product incl. offer fields and availability value, BlogPosting, FAQPage; no `countryOfOrigin`).
  - Production before the change: **92 pass, 27 fail, 1 deferred**. All 27 failures are the indexing defects below.
  - This branch locally: **119 pass, 0 fail, 1 deferred**.
- **Not covered by unit tests: JSON-LD output.** `components/site/json-ld.tsx` is TSX and the unit harness (`--experimental-strip-types`) cannot import JSX. JSON-LD is checked rendered, through the route script. A pure builder with unit tests belongs with the Phase 4 structured-data work.

### 3. Implementation (`lib/seo-policy.ts`, `app/layout.tsx`, `lib/page-meta.tsx`)
- One pure list of private/utility routes (matched by whole path segment) with the right `follow` value for each.
- Root layout `generateMetadata` adds `robots: { index: false, follow }` for those paths (read from the existing `x-cj-path` header, the same way `<SeoLinks />` does). A page that sets its own `robots` still wins: `/search`, `/review`, `/receipts/verify` and the unsubscribe pages keep theirs.
- `<SeoLinks />` omits the canonical and the three language alternates on those paths. `og:url` and `fb:app_id` stay.
- **Scope of that statement:** Phase 1-managed private/utility noindex pages do not emit canonical or hreflang. It does **not** cover every noindex page on the site. The known exception: an unmatched generic 404 route (e.g. `/nonexistent-xyz`) is `noindex` (added by Next) but still inherits the canonical and hreflang from the global `<SeoLinks />`. That is X1, deferred to Phase 2; no workaround was added. A missing product, collection, category or post slug already emits no real canonical or hreflang element (Next serves its error shell), and is unchanged.
- `robots.txt`, the sitemap, middleware, language logic, canonical rules for indexable pages and every JSON-LD block are unchanged.

### 4. Before / after (anonymous requests)

| Page | Robots before | Robots after | canonical + hreflang before | after |
|---|---|---|---|---|
| `/cart` | none (indexable) | `noindex, follow` | 4 | 0 |
| `/login` | none (indexable) | `noindex, follow` | 4 | 0 |
| `/auth/confirm?token_hash=…` | none (indexable) | `noindex, nofollow` | 4 | 0 |
| `/already-registered` | none (indexable) | `noindex, nofollow` | 4 | 0 |
| `/search…` | `noindex, follow` | same | 4 | 0 |
| `/review/…`, `/receipts/verify`, unsubscribe pages | `noindex, nofollow` | same | 4 | 0 |
| `/`, product, collection, category, post, guides, FAQ, about, tokusho, `/loyalty`, `/sale` | indexable | indexable, **unchanged** | 4 | 4 |
| `/nonexistent-xyz` (unmatched) | `noindex` | `noindex` | 4 | 4 (DEFERRED) |

### 5. Test results
`npm run test:unit` 342/342 pass (322 existing + 20 new) · `npm run typecheck` clean · `npm run lint` exit 0 (only existing `<img>` warnings in files not touched) · `check:money` OK · `check:i18n` OK (incl. `check:layaway-ja`) · **`check:terms` FAILS, see D1.**

---

## Decisions needed from the owner

| # | Decision | Why it matters | Recommendation |
|---|---|---|---|
| D1 | **RESOLVED (wording).** `check:terms` failed on 6 lines of the master plan that used the banned "country + gold" phrasing as search targets. The setup commit introduced it; the check had not been run before that commit. | The terminology rule bans "`<country>` gold" in any repo text, docs included. | The 6 lines were reworded to K18 phrasing ("K18 hallmarks used in Japan", "K18 jewelry online in Japan", and so on); the guard script was not touched. **Content phases (8-10) must use the same K18 wording on the site.** |
| D2 | **DECIDED: BLOCKED — EXTERNAL DOMAIN/DNS/HOST CONFIGURATION.** Domain `chajewelsjapan.com`. Finding: it does not redirect to the current Cha Jewels site (the apex serves a third-party JSON page; `www.chajewelsjapan.com/about` is a 404). Desired destination: `https://www.chajewelsjp.com/`. **Phase 1 action: none; no repository or application change, and no domain routing is changed.** | Possible lost link equity from the old brand domain | Deferred external work, before any domain-routing change: verify registrar and domain ownership; inspect DNS; identify the current host; inspect indexed old URLs; inspect backlinks; determine whether page-to-page permanent redirects can be configured; write a redirect migration plan first |
| D3 | **DECIDED: KEEP IN SITEMAP FOR NOW.** 120 of 449 sitemap product URLs (27%) are sold products. Decision: keep sold product URLs in the sitemap during Phase 1; sitemap behaviour is not altered. | The pages return HTTP 200, show the SoldOut state, keep useful product content, and may hold existing search equity | The longer-term policy is recorded as X10 and is **not approved**. Merchant Center (Phase 6) must still mark sold items out of stock |
| D4 | `http://chajewelsjp.com/…` takes two 308 hops | Cosmetic; Vercel domain setting | Leave |

---

## Deferred findings

| # | Finding | Goes to |
|---|---|---|
| X1 | Unmatched-route 404 emits canonical + hreflang (noindex already present) | Phase 2: `<SeoLinks />` rewrite |
| X2 | English has no indexable URL; hreflang `en` points at a non-canonical URL | Phase 2 |
| X3 | `/layaway` unindexable | Phase 3 |
| X4 | JSON-LD unit tests (needs a pure builder) | Phase 4 |
| X5 | Product JSON-LD uses `description_en` on the Japanese page | Phase 4 |
| X6 | Signed-in render of `/account`, `/checkout`, `/loyalty/join` not rendered-checked | Manual QA on the preview with a test account |
| X7 | Branch-alias preview URLs' protection assumed equal to the one sampled | Confirm in Vercel project settings |
| X8 | Search Console, Merchant Center and Google Business Profile status | Owner |
| X9 | Wording rule for every later phase (owner, 2026-10-28): no country-branded gold wording and no generic made-in or from-Japan phrasing; use "K18 jewelry in Japan", "K18 hallmarks used in Japan", "K18 jewelry authentication in Japan", "buy K18 jewelry in Japan"; origin claims only from verified product data/badges (`check:terms` enforces both) | Phases 5, 7-10 |
| X10 | **Sold Product Indexation Policy.** Sold products stay in the sitemap for now (D3). The later Product SEO review evaluates, per product: Search Console impressions, clicks, backlinks, organic entrances, related-product interactions, product uniqueness, time since sold, content quality. Policies it may weigh: keep permanently; remove from the sitemap after a defined period; redirect selected commodity products; retain unique/preloved historical products; noindex weak obsolete pages. **No such change is approved.** Any redirect or route change needs approval under the route-change rule first | Phase 5 (Product SEO review) |

---

## Rollback

All Phase 1 behaviour changes sit in two small edits (`app/layout.tsx`, `lib/page-meta.tsx`) plus one new pure module. `git revert` of the Phase 1 commit restores today's output exactly; no data, route, redirect, cookie, Hub call or sitemap entry changed. After deployment, `noindex` takes effect only when a crawler next fetches each URL; reverting is equally gradual.

## Change log

- 2026-10-28: Baseline and this file created (Phase 0). No application code changed.
- 2026-10-28: Phase 1: route matrix, search policy, noindex for private/utility routes, canonical/hreflang removed on those routes, 20 unit tests, `scripts/check-seo-live.mjs`. 404 cleanup partly deferred. Branch not pushed.
