# Cha Jewels SEO Implementation Status

**Last updated:** 2026-10-29. **Current state:** Phases 1, 2 (2A-2E-stage-1), **3 and 4 are DEPLOYED**. Phases 3 and 4 shipped in release PR #421 (`main` `82effab`, Vercel production Ready, production-verified 288/0/0 — `SEO-QA-REPORT.md` §7) and are **SEARCH ENGINE RECRAWL PENDING**: no Google indexing, ranking or rich result is claimed until Search Console shows it. Phases 6-8 are AUDITED with content drafts (PR #417, merged to `develop` and released with #421 as documentation); Phases 5, 9-12 are AUDITED (PR #418, same). OD-6 (bare `/layaway` redirect) and the 308 promotion are NOT STARTED. Historical "not merged" / "not deployed" wording further down this file describes the moment it was written and is superseded by this line and the change log.
**Plan:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` · **Evidence:** `docs/seo/SEO-BASELINE.md` (Day 0 and the Phase 1 addendum, §14-17)

Statuses: NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE

Nothing in this file is marked indexed, ranking or rich-result eligible. Release 0 (PR #397, merge `5fc238a`) deployed Phases 1 and 2A to production on 2026-10-28; verification evidence is in the Release 0 section below.
"Locally verified" means: unit tests pass, and the changed pages were rendered by a local build (fixtures mode) and checked with `scripts/check-seo-live.mjs`. Production has not been re-checked because it does not have the change.

---

## Phase status

| Phase | Item | Status | Note |
|---|---|---|---|
| 0 | SEO baseline (code + live probe) | VERIFIED | `SEO-BASELINE.md` |
| 0 | Search Console Day-0 export | NOT STARTED | Needs the owner |
| 1 | Private/utility route matrix | VERIFIED | Baseline §14. Signed-in renders not checked (see below) |
| 1 | Search-page indexing policy | VERIFIED | Baseline §15: `noindex, follow`, not in sitemap, not blocked |
| 1 | SEO regression tests | DEPLOYED (Release 0) | 20 new unit tests + `scripts/check-seo-live.mjs` |
| 1 | Private/utility noindex | DEPLOYED; production verified 2026-10-28; SEARCH ENGINE RECRAWL PENDING | Release 0 (PR #397, `5fc238a`); verifier 119/0/1 on production |
| 1 | 404 metadata cleanup | PARTIAL: page-level 404s already correct; unmatched-route 404 DEFERRED to Phase 2 | Baseline §16 |
| 1 | Verification-only checks | VERIFIED | Sold products, preview, HTTPS, www: baseline §17 |
| 1 | Non-production `X-Robots-Tag` | NOT NEEDED | Preview is behind Vercel Authentication and already sends `x-robots-tag: noindex` |
| 1 | Old-domain redirect (`chajewelsjapan.com`) | BLOCKED — EXTERNAL DOMAIN/DNS/HOST CONFIGURATION | Decided (D2). No repository change in Phase 1 |
| 1 | Sold products in the sitemap | KEEP IN SITEMAP FOR NOW | Decided (D3). No sitemap change in Phase 1. Later policy review: X10 |
| 2 | `/en` and `/ja` URL architecture | 2A DEPLOYED; **2B DEPLOYED — PRODUCTION VERIFIED (`bd28cc6`)**; **2C (PR #405, #406), 2D (PR #407), 2E-stage-1 temporary 307s (PR #408/#409) and fixes #410, #411: DEPLOYED in Release PR #412 (`main` `7aac136`, 2026-10-29), production-verified; SEARCH ENGINE RECRAWL PENDING**; 308 stage NOT STARTED | Release record: "Phase 2C + 2D + 2E-stage-1 release" below. Planning in `SEO-MIGRATION-MAP.md`. Japanese Hub article corrected (VERIFIED 2026-10-29) and 2026-10-28 incident reconciled (no discrepancies): see "Phase 2 closeout" below. `main` CI rerun succeeded. Not observed in Search Console |
| 3 | `/en/layaway` | **DEPLOYED — PRODUCTION VERIFIED (PR #421, `main` `82effab`, 2026-10-29); SEARCH ENGINE RECRAWL PENDING** (QA §7) | QA §1: 10 PASS, 1 BLOCKED (branch preview), 0 FAIL. Route created, English-only metadata, FAQ + FAQPage JSON-LD, links repointed, sitemap entry; bare `/layaway` unchanged (OD-6 not approved). Record: `phase-3/PHASE-3-REPORT.md` and "Master-plan sweep" below |
| 4 | Structured data | **DEPLOYED — PRODUCTION VERIFIED (PR #421, `main` `82effab`, 2026-10-29); SEARCH ENGINE RECRAWL PENDING** (QA §7; no return/shipping fields; rating branch awaits the first approved product review) | QA §2-3: checker 277/0 at matched origin; RRT code-mode valid (Product, Merchant listing, Breadcrumbs); real-Hub data BLOCKED until the `develop` preview. Visible breadcrumbs added on every BreadcrumbList template (`a51e2b2`…`a0b851f`). BreadcrumbList, JewelryStore fields, X5, aggregateRating/review; Record: `phase-4/PHASE-4-REPORT.md` |
| 5 | Merchant Center | AUDITED (PR #418) | `phase-5/MERCHANT-CENTER-READINESS.md`; account state UNKNOWN (X8); feed route needs owner approval |
| 6 | Commercial landing pages | AUDITED — READY FOR OWNER REVIEW (PR #417) | `phase-6/COMMERCIAL-LANDING-ARCHITECTURE.md`, `INTERNAL-LINKING-MAP.md`; no route created; Hub SEO fields are a contract DRAFT |
| 7 | Kihei authority | AUDITED — content DRAFT (PR #417) | `phase-7/KIHEI-PILLAR-DRAFT.md`, `KIHEI-CLUSTER-PLAN.md`; route `/en/guides/kihei` NOT created (approval needed); no Kihei collection exists in the Hub |
| 8 | K18 authority | AUDITED — content DRAFT (PR #417) | `phase-8/K18-PILLAR-DRAFT.md`, `K18-CLUSTER-PLAN.md`; route `/en/guides/k18-gold-japan` NOT created |
| 9 | Filipino search moat | AUDITED — briefs + one DRAFT (PR #418) | `phase-9/FILIPINO-CONTENT-BRIEFS.md`; nothing published; no `/fil/` route |
| 10 | Local SEO / Business Profile | AUDITED (PR #418) | `phase-10/LOCAL-SEO-GBP-READINESS.md`; eligibility is OD-GBP-1; profile state UNKNOWN |
| 11 | Authority / backlinks | AUDITED, documentation only (PR #418) | `phase-11/AUTHORITY-OPPORTUNITIES.md`; no outreach |
| 12 | Weekly Search Console operations | AUDITED (PR #418) | `phase-12/SEARCH-CONSOLE-OPERATIONS.md`; no export exists yet (owner) |

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

## Phase 2 planning (AUDITED / PLANNING)

- Plan: `docs/seo/SEO-MIGRATION-MAP.md` (route-family map, redirect/canonical/hreflang/sitemap/switcher design, internal-link map, test matrix, risk report, owner decisions, implementation gates 2A-2E).
- New skill: `.claude/skills/cha-i18n-seo/SKILL.md`.
- Status of implementation: **none**. No file under `app/`, `components/`, `lib/`, `middleware.ts`, `next.config.ts` or `tests/` was changed for Phase 2.
- Route-change rule in force: any change to a public route, redirect, canonical or hreflang target, sitemap route set or internal-link destination needs approval first.
- Findings that feed the deferred list: X1 (resolved by design in the locale tree), X2 (the whole phase), X3 (Phase 3). New planning findings recorded in the map: uncached public pages (E5), cookie-gated layaway server actions (E7), per-language blog post existence and sitemap listing (E8, E10), compliance gates keyed on `/legal/*` paths (E12).
- Resolved without the owner (technical conventions): **OD-13** locale homes are `/en` and `/ja` (existing `trailingSlash: false` kept); **OD-14** Phase 2 migrates the existing route families under locale prefixes, and master-plan §22's `/shop/*` and `/guides/*` tree stays future-phase architecture.
- **Owner decisions** (map §14). OWNER APPROVED 2026-10-28: OD-10 = A, OD-2 = English x-default, OD-3 = root unchanged until 2E, OD-8 = eligible existing language versions only, OD-9 = content-eligibility policy (neutral-text rule), OD-15 = URL-authoritative language with security requirements, C0/H0 = legacy canonical+hreflang unchanged **for 2B only** (expires at the 2C gate). **Still open:** OD-1, OD-4, OD-6 (2E); OD-7, OD-11 and the C0/H0 reconsideration (2C); OD-12 (2D).
- Gates: **2A** locale infrastructure only, **2B** locale routes and metadata, **2C** links, switcher and application behaviour, **2D** sitemap and full validation, **2E** legacy redirects (last, staged 307 then 308). None started.
- Verified findings F1-F5 the design must honour (map §2.1): stale-cookie layaway refusal, single-language blog posts, `/legal/*`-keyed consent, advertising and **announcement-bar** (`bannerAllowed`) checks, relative links in Hub content, and (observation only, out of scope) no-store public responses.
- **Interim canonical AND hreflang behaviour of bare legacy URLs:** C0 + H0 **OWNER APPROVED 2026-10-28 for the Phase 2B dark launch only** (map §7, §14); the approval expires at the Phase 2C gate, where the legacy strategy must be reconsidered and separately approved.
- **Planning corrections (follow-up to PR #394, documentation only):** (B1) layaway links stay on the legacy `/layaway` through Phase 2C (Option ii) and nothing points to `/en/layaway` until Phase 3 validates it; 2C exit adds "No internal navigation link may resolve to HTTP 404"; Japanese layaway stays unavailable. (B2) `bannerAllowed` announcement-bar suppression on `/legal/*` is added to F3, the file inventory, the Phase 2A files and tests, and the test matrix. (N1) legacy hreflang and x-default added to the owner-approval block. (N2) locale-correct JSON-LD URLs moved to Phase 2B. (N3) Phase 2A may be verified with a local build; a deployed preview is required before 2B. (N4) a refreshed cookie alone does not close the stale-cookie case; the language-authoritative layaway gating correction must be merged and verified before localized links are activated (2C).
- Work is on branch `seo/phase-2-planning-corrections`.

## Phase 2A: locale infrastructure (merged to `develop` as PR #396; local evidence only; not in production)

Branch `seo/phase-2a-locale-infrastructure`, from `develop` at `7646282`. Not deployed. Phase 2B-2E are NOT STARTED. At that time all 12 owner decisions (OD-1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 15) were unresolved; OD-2, OD-3, OD-8 and OD-10 have since been approved (see the prerequisite review below). Nothing here says anything is indexed or ranking.

**What was built**
- `lib/locale.ts`: `LOCALES`, `isLocale`, `isSitePath`, `splitPath`, `localeOf`, `stripLocale`, `familyOf`, `isLocalizable`, `localePath`, `siblingPath`, plus `FAMILY_RULES` and `createLocaleRules()`. Whole-segment prefix match; no trailing slash (existing convention); query and fragment preserved.
- `lib/statutory-path.ts`: `isStatutoryPath` and `announcementBarAllowed`, one rule for `/legal` and `/legal/*` that looks past `/en` and `/ja`. Used by the cookie banner (`components/site/consent-banner.tsx`) and the announcement bar (`app/layout.tsx`).
- `lib/seo-policy.ts`: prefix-aware `classifyPath` (private / public / unknown). The live `isNoindexPath`, `indexingFor` and `emitsCanonical` are unchanged for every input; the classifier is not wired to any output until Phase 2B.

**Defects found in final code review and fixed (all inside Batch A)**
1. `stripLocale("/en//evil.com")` returned `"//evil.com"` (a protocol-relative URL made from a prefixed path; an open-redirect hazard for any later redirect).
2. Backslashes and control characters (CR/LF) were accepted as site paths.
3. `announcementBarAllowed("/en//legal/tokusho")`, `"/en/\\legal"` and `"/legal\n"` returned `true`, so a path that could not be classified could enable the bar.
4. `classifyPath("/ja/layaway")` called a Japanese layaway route "public", and the family model had no notion of an English-only family.
Fix: `isSitePath` is strict (single leading slash, no backslash, no control character, no empty segment in the path part); every helper returns an unsafe input unchanged and never treats it as localised, private, statutory or public; the bar fails safe on any of them. Families are data (`shape`, `locales`, `live`).

**Forward compatibility with Phase 3 (Option ii preserved).** `layaway` is `{ locales: ["en"], live: false }`. While not live, `localePath("/layaway", ...)` returns the bare `/layaway` (so Phase 2C keeps the existing English links) and `/en/layaway` cannot be produced. Phase 3 flips the one `live` flag after creating and validating the route; because the family is English-only, `/ja/layaway` cannot be produced before or after. Proven by test with an injected table (`createLocaleRules`), so no second implementation or workaround is needed. No route was created and no link changed.

**Statutory-page behaviour (production behaviour preserved).** The consent banner never asks by itself on `/legal` and `/legal/*`; the announcement bar is not rendered there. The advertising tags have **no `/legal` rule** (`adsLoadsOn` excludes only `/account/*`; `tests/consent-ads.test.mjs` already asserted ads load on `/legal/privacy`). No new ad suppression was added; parity for prefixed legal paths is tested. Whether to suppress advertising on the statutory pages is an owner/legal decision, recorded and not taken. The planning documents' earlier claim that ad tags are off on `/legal` was wrong and is corrected.

**Verification (local; no production verification is claimed)**
- `npm run test:unit` 383 pass, 0 fail (342 existing + 41 new); `typecheck` clean; `lint` exit 0 with the same 12 existing warnings, none in touched files; `check:terms`, `check:money`, `check:i18n` (incl. `check:layaway-ja`) pass.
- Local **production build** (`next build`, fixtures mode) succeeds; its route table has no `/en`, `/ja` or `[lang]` route. 35 routes snapshotted on the production server against the pre-change baseline (status, redirect, `<html lang>`, robots, canonical, hreflang, `og:url`, JSON-LD hash, internal-link hash, layaway links, sitemap, robots.txt): **0 differ**. `scripts/check-seo-live.mjs`: 119 pass, 0 fail, 1 deferred (X1).
- Real renders with an active announcement: the bar shows on `/` and `/en/products/x`; absent on `/legal/tokusho`, `/legal/privacy`, `/en/legal/tokusho`, `/ja/legal`. `/en//legal/tokusho` is normalised by Next with a 308. In a real browser, cookie banner and bar show on `/` and neither on `/legal/tokusho` or `/en/legal/tokusho`.

**Content-language audit** (public site, 2026-10-28; map §16). Confidence: VERIFIED = observed directly; INFERRED = follows from verified facts; UNVERIFIED = needs an authenticated Hub read.
- Products: 447 sitemap URLs; all answer 200 in Japanese with a Japanese name; 446 of 447 meta descriptions contain Japanese (the exception is a Latin-named luxury item). VERIFIED. The earlier 449 is not a defect: the count differs by two and the cause (inventory change) is INFERRED, not shown.
- Collections 12/12 and categories 5/5: both languages 200, Japanese names present. VERIFIED.
- Blog: 1 sitemap post. `how-cha-jewels-began` is English-only (200 English, 404 Japanese, not in the Japanese list). VERIFIED. It is absent from the sitemap although published, and the sitemap omits only blank-slug, `layaway_only` and unpublished posts (`app/sitemap.ts:33`, identical to the deployed release), so it is **intentionally English-only through the layaway rule, not missing Japanese content**. INFERRED, high confidence. Whether it also lacks Japanese text: UNVERIFIED and moot.
- FAQ: Japanese 31 items, English 45 (JSON-LD); 14 English-only: 8 in `payments-and-layaway`, 2 in `orders-and-live-selling-claims`, 2 in `shipping`, 1 in `loyalty-points-and-store-credit`, 1 in `trade-program-and-wholesale`. VERIFIED counts. The 8 layaway-section items are layaway-only: INFERRED. For the other 6, layaway-only versus untranslated general question cannot be told from the public page: UNVERIFIED. The Japanese FAQ mentions no layaway term (VERIFIED, matches policy).
- 16 static public pages: 200 in both languages, correct `<html lang>`, Japanese H1 in Japanese. VERIFIED.

**Hub dependency (blog).** No Hub change is needed for 2A or 2B. For Phase 2D the smallest reliable approach is **website-only detail reads**: for each post the list returns, read the detail (`hub.post(slug)`, already cached on the `content` tag). The proposed Hub fields `has_en_content` / `has_ja_content` on `GET /content/posts` rows (true only when that language's title **and** body are non-empty after trimming) become justified only if posts grow beyond a few dozen or the sitemap build time suffers; proposal only, no Hub contract change in this batch. **Phase 2D rule:** a localized article URL, its sitemap entry and any hreflang naming it exist only if that language's title and body are both present on the detail row **and** the layaway rule allows that language; a Japanese sibling URL that would 404 is never generated. UNVERIFIED: whether the list route returns bodies (the contract at `api.md:110` lists `body_*` on `Post`; a 2026-10-02 comment in `lib/posts.ts` says the list omits it). One authenticated read of `GET /content/posts` settles it; not made here.

**Collections index.** `/collections` (and any `/en/collections`, `/ja/collections`) is **not** added to the sitemap in Batch A and `app/sitemap.ts` is untouched; the existing collection detail entries are unchanged. Inclusion is a Phase 2D review item, recommended only after checking indexability, content quality, canonical behaviour and customer value.

**Phase numbering (record only; the master plan §26 numbering stands).** Phases 2A-2E subdivide master-plan Phase 2. Older references that use a different numbering, for final cleanup: `SEO-MIGRATION-MAP.md:16` (says content hubs are Phases 8-10 and landing pages Phase 7; master plan: landing pages 6, Kihei 7, K18 8, Filipino 9), `SEO-BASELINE.md:203` ("landing pages (Phase 7)"), the phase-table row `4-10` and rows X9/X10 ("Phases 5, 7-10", "Phase 5 Product SEO review"; master plan Phase 5 is Merchant Center and has no Product SEO phase), and the orchestrator skill's 11-step "Phase Order" list (a different grouping than master-plan Phases 0-12). Phases 2, 3 and 4 agree everywhere.

**Not done, by design:** no route, redirect, canonical, hreflang, sitemap URL or internal link change; no checkout, payment, Hub or `layawayOffered` change; no Japanese layaway.

**Phase 2B readiness: NOT READY.** See the prerequisite review below.

## Phase 2B prerequisite review (2026-10-28)

No implementation. `develop` is `ccb8917`, `main` is `f963f2c`, no PR is open, and no route, redirect, canonical, hreflang, sitemap entry, checkout or Hub contract changed.

**Owner decisions recorded (OWNER APPROVED, map §14):** OD-10 = A, OD-2 = English, OD-3 = redirect later, OD-8 = yes. They authorize no route.

**Still needed before Phase 2B can start**

| Item | State |
|---|---|
| OD-9 fallback-language policy | Audit done and quality-corrected (map §16.1): all 447 products reached in both languages; **0 genuine fallback pages**; five product evidence categories (355 verified localized, 75 correctly localized with short Japanese descriptions, 16 with no description body in either language, 1 proper-name echo, 0 fallback); 14 English-only FAQ items consistent with the layaway rule. Policy proposed with a neutral-text rule instead of word-count language detection; **OWNER APPROVED 2026-10-28** (map §14) |
| OD-15 URL, cookie and layaway-gating authority | Implementation-ready design plus a security review in map §17 (presentation gates vs server-enforced business rules; explicit `lang` creates no new authorization or payment bypass; `x-cj-lang` must be middleware-owned; private, payment-return and confirmation routes unchanged); **OWNER APPROVED 2026-10-28 with security requirements** (map §14, §17) |
| Interim legacy canonical and hreflang (C0/H0) | Risk assessment in map §7: safe for the 2B dark launch; **proposed for 2B ONLY** (legacy URLs fully unchanged, locale URLs unlinked and unlisted, mandatory reconsideration at the 2C gate because of the conflicting hreflang clusters); **OWNER APPROVED 2026-10-28 FOR PHASE 2B ONLY; expires at the 2C gate** |
| Written route-change approval | **Gate A still required**: approval of the exact route inventory (map §18.1) and written authorization to implement |
| Release 0 | **DONE.** PR #397 merged by the owner (`5fc238a`), Production deployment success, production verified (below) |
| A deployed preview | Available only through the `develop` branch alias (below) |

**Vercel preview facts**
- The Ignored Build Step cancels every non-`develop` branch regardless of content: of 18 recent PR heads, all `develop` heads built and every feature or SEO branch was cancelled, including heads with 15 and 17 code files. The exact ignore command lives in the Vercel dashboard (UNVERIFIED). `docs/CLAUDE-DETAILS.md:9` ("Vercel posts a preview URL on every PR") is stale; recorded for cleanup.
- The usable preview is the `develop` deployment, host `https://cha-jewels-web-git-develop-cha-jewels.vercel.app`: Vercel Authentication (302 to SSO) and `x-robots-tag: noindex`. No production setting needs to change. Merged code reaches it only after merge to `develop`, so **merged is not verified**: nothing goes to `main` until it is.
- UNVERIFIED (dashboard): whether Preview environment variables point at the live Hub or at fixtures.
- Automation access: the Vercel CLI is not installed or linked here and no bypass secret exists (none was created). Scripts therefore run against a local production build; the preview gets a manual smoke test unless the owner approves an automation bypass (a setting change, secret passed only by environment variable).
- **No `next build` runs in CI**, and Vercel skips feature branches, so a route-structure change like `app/[lang]` can reach `develop` unbuilt. A **local production build is a mandatory pre-merge gate**; a CI build step is recommended and needs approval (`.github/workflows/ci.yml`).
- Sign-in: the `develop` alias is covered by the Supabase redirect allow-list wildcard in `docs/CLAUDE-DETAILS.md:48`; per-deployment hosts are not guaranteed; test from the alias only; never add a bare `https://*.vercel.app/**`. The allow-list itself is a Hub-side setting (UNVERIFIED from here).
- Isolated testing: quotes only. No order, draft or payment may be created from any preview; a test customer account is needed if the preview uses the live Hub.
- Rollback: revert the merge on `develop`; production is unaffected until a release PR.

**Separate observation (not Phase 2).** One product page returned HTTP 500 in 2 of 4 early audit passes. Two later instrumented passes (every fetch attempt logged, 894 fetches each) and a status-only sweep reproduced nothing: 0 non-200 responses. Recorded as an unreproduced transient, cause UNVERIFIED until server logs are checked (owner/Vercel dashboard).

**Remaining owner actions for Phase 2B:** approve or amend OD-9 and OD-15; decide C0/H0 for 2B; give the written route-change approval; merge Release 0 and have Phase 1 verified on production; confirm the Preview data source; decide the optional automation bypass and CI build step; supply a test customer account if the preview uses the live Hub. Phase 2C additionally needs OD-7 and OD-11 and Opus for `lib/checkout-actions.ts`; 2D needs OD-12; 2E needs OD-1, OD-4 and OD-6.

## Release 0 preflight (2026-10-28): develop → main inventory

**No release PR was created; nothing was merged or deployed.** `develop` = `ccb8917`, `main` = `f963f2c`, and `main` is an ancestor of `develop` (a release PR is a clean fast-forward-shaped merge with no conflicts).

**Exact content a release would introduce** — 11 commits, 4 merged PRs (#393 Phase 1, #394 Phase 2 planning, #395 planning corrections, #396 Phase 2A), 21 files, +3,995/−8. It is **all SEO-programme work; no unrelated changes are present**, so releasing the whole branch IS releasing Phase 1 + 2A and nothing else:

| Area | Files |
|---|---|
| Application runtime (6) | `app/layout.tsx` (+17/−8: private-route robots via `indexingFor`, shared `announcementBarAllowed`), `lib/page-meta.tsx` (canonical/hreflang omitted on noindex pages), `lib/seo-policy.ts`, `lib/locale.ts`, `lib/statutory-path.ts` (new, pure), `components/site/consent-banner.tsx` (shared statutory rule) |
| Tests and scripts (6) | 5 test files, `scripts/check-seo-live.mjs` |
| Docs, skills, governance (9) | 4 SEO docs, 4 skills, `CLAUDE.md` governance section |

**Behaviour changes in production after release** (all verified locally, Phase 1 §14 and Phase 2A records): `/cart`, `/login`, `/auth/confirm`, `/already-registered` gain `noindex`; every noindex private/utility page stops emitting canonical/hreflang; nothing else — indexable pages byte-identical on the 35-route snapshot; sitemap and robots.txt unchanged.

**Dependency checks:** no migrations and no `supabase/` changes; no edge-function dependency; no payment or checkout file touched (`lib/checkout-actions.ts`, `middleware.ts`, `next.config.ts` untouched); no new environment variable or runtime configuration; no Hub contract change.

**Verification evidence:** CI green on `develop` head `ccb8917` (and on every merge in the range); local production build succeeded on a tree byte-identical to `origin/develop` (verified: the merged tree equals PR #396's head); route checker 119 pass / 0 fail / 1 deferred on that build; 35-route before/after snapshot zero-diff. CI runs no `next build` — the local build stands in for it.

**Safety verdict: SAFE to release as one PR.** Phase 1 + 2A can be released together; nothing pending on `develop` is unrelated. Rollback: revert the release merge on `main`; `noindex` effects on crawlers are gradual in both directions.

**Production deployment prerequisites (owner):** create the release PR `develop` → `main` (Cynthia merges per the project workflow); after deploy, run `scripts/check-seo-live.mjs` against production expecting 119/0/1 (it reads 92 pass / 27 fail / 1 deferred on today's production); spot-check `/legal/tokusho` (banner absent, bar absent) and `/cart`,`/login` (noindex); then mark Phase 1 rows DEPLOYED and the noindex items SEARCH ENGINE RECRAWL PENDING — never "indexed".

## Release 0: DEPLOYED and production-verified (2026-10-28)

- PR #397 (`develop` → `main`) merged by the owner at 06:46Z; merge `5fc238a`; `main`'s tree byte-identical to pre-merge `develop` (`ccb8917`); 21 files, all Phase 1 + 2A; zero payment/checkout/middleware/config/migration files. PR #398 (Phase 2B prerequisites docs) merged to `develop` (`4c5c19a`).
- GitHub Production deployment `7379037269` for `5fc238a`: **success** (06:48Z); production confirmed serving the release (`/cart` carries `noindex, follow`).
- **Actual production verification (recorded output):** `scripts/check-seo-live.mjs https://www.chajewelsjp.com` → **119 pass, 0 fail, 1 deferred** (X1, deferred to Phase 2B's locale tree; the unprefixed-tree case remains by design until then). Pre-release production read 92/27/1.
- Spot-checks: `/cart`, `/login` 200 + `noindex, follow`, no canonical/hreflang; `/auth/confirm`, `/already-registered` `noindex, nofollow`; `/legal/tokusho` indexable with no announcement bar and no consent banner; indexable pages' canonical/hreflang unchanged; sitemap 481 URLs with zero locale entries; robots.txt unchanged; `/en`, `/ja`, `/en/layaway`, `/ja/layaway` all 404 + noindex; no layaway link or term on the Japanese surfaces; apex→www one 308. The one anomaly chased (`/collections/kihei` 404) is a fixtures-only slug that was never a live collection — not a regression.
- Status vocabulary: Phase 1 and 2A are **DEPLOYED**; the noindex changes are **SEARCH ENGINE RECRAWL PENDING**. Nothing is INDEXED or RANKING.

## Phase 2B gate status (2026-10-28)

**All owner decisions needed for 2B are now approved** (OD-2, OD-3, OD-8, OD-9, OD-10, OD-15, C0/H0-for-2B — map §14). The execution specification, route inventory, design A-M, preview/build safety and release gates A-K are in **map §18**. **The single remaining gate is Gate A: owner approval of the §18.1 route inventory and written authorization to implement Phase 2B.** Still UNVERIFIED on the owner side: Preview environment-variable targets (live Hub vs fixtures) and a safe test customer account; optional: CI build step, automation bypass. Still open for later phases: OD-7, OD-11 and the C0/H0 reconsideration (2C); OD-12 and the collections-index review (2D); OD-1, OD-4, OD-6 (2E); Phase 3 layaway.

## Phase 2C: merged to develop (PR #405); deployed-preview QA VERIFIED; NOT DEPLOYED

**Update 2026-10-28 (supersedes the "uncommitted" and Opus wording below, which is kept as the record):** PR #405 merged into `develop` (`0c213dd`); Vercel Preview deployment of `0c213dd` succeeded (SSO-protected, `x-robots-tag: noindex`); deployed-preview QA VERIFIED through an authenticated browser (127/127 internal links resolve, 0 broken, 0 bare public links beyond the `/layaway` exception, 0 `?lang=` links; locale metadata, switcher, FAQ anchors, statutory suppression and negatives as specified); sign-out on the preview NOT TESTED. **Opus review COMPLETED 2026-10-28 on Opus 5.5 (read-only)** of the merged OD-15 diff and its call sites: no defects; one LOW pre-existing observation outside 2C scope (`writeCart([])` after a successful plan or order sits inside the outer `try`, so a failure of that cookie write would report an error after success; `lib/checkout-actions.ts` `payAction` and `payLayawayAction`) — recorded, not changed. The activation blocker below still stands: 2C ships only in the coordinated 2C + 2D + 2E-stage-1 release (map §20).


Branch `seo/phase-2c-locale-navigation` from `develop` `6d80bc9` (which already carried the unrelated #403 legal fix and the #402 closeout). **Uncommitted by instruction.** Nothing is DEPLOYED or production-verified; no indexing or ranking is claimed; master-plan numbering unchanged.

**Implemented (map §19.5, all areas):** OD-15 language gating completed first — the four gates (`quoteAction`, `payLayawayAction`, `pesoEstimateAction`, `layawayQuote`) take a server-validated explicit `lang` with cookie fallback, callers pass the page language, and `payLayawayAction` syncs the cookie after a successful plan (pt 6); OD-7 switcher as real crawlable links (`lib/locale-nav.ts switchTargets`: sibling page, destination home when none exists, cookie-toggle preserved on private routes); all desktop/mobile navigation, tab bar and active states (`stripLocale`); search, catalogue, breadcrumbs, related, home, content pages, FAQ anchors, legal cross-links and in-article links; OD-11 render-time localization of Hub markdown and announcement links (`renderMarkdown(source, lang)`; stored Hub data untouched); share URLs now locale URLs (no new `?lang=en`); sign-out lands on the locale home; revalidation refreshes bare + `/en` + `/ja` variants (`localeVariants`).

**Safety:** authentication, agreement gates, term restrictions, payment validation, Hub money calls and payment-provider contracts untouched (source-guard tested); explicit `ja` always refused; no `/en/layaway` or `/ja/layaway`; English layaway links stay on bare `/layaway` (Option ii; resolve 200 under the customer's synced cookie); statutory suppressions re-verified. **Opus limitation recorded:** this session cannot switch models itself, so the required high-rigor Opus review of the `lib/checkout-actions.ts` diff HAS NOT occurred — the owner runs `/model` and reviews that diff at the PR stage; all available checks (tests, source guards, money-guard, full regression) were performed.

**Verification evidence (local production build, fixtures):** unit **421 pass / 0 fail** (16 new 2C tests; 3 existing tests updated for approved behaviour changes: share URLs ×2 files, one source-regex); typecheck/lint(0 errors)/terms/money/i18n/analytics/cutouts green; build with 21 `[lang]` routes; **legacy METADATA snapshot: 0 diffs** beyond the documented X1 case (26 legacy pages' link sets changed, as 2C intends; sitemap and robots byte-identical); locale matrix **332/332**; route checker **120/0/0**; **full crawl: 139 pages, 104 unique internal links — 0 resolve to 404, 0 bare legacy public links beyond the `/layaway` exception, 0 new `?lang=` links**; two-tab and spoofed-header cases green; browser pass clean (desktop + 375px, 0 console errors; JA product page's EN switcher is a crawlable sibling link; EN-only post's JA switcher goes to `/ja`).

**EXPLICIT RELEASE BLOCKER:** "Phase 2C production activation requires separate approval of the coordinated legacy SEO transition and its applicable Phase 2D/2E dependencies."

**Checkout safety review (2026-10-28):** performed at high rigor on the exact diffs of `lib/checkout-actions.ts` (+29/−6 after hardening), `lib/layaway.ts`, `lib/layaway-availability-server.ts` and every call site; **performed on Fable 5 — this was NOT an Opus review**, and the owner may still request one at the PR. Verified: strict `asLang` validation (no injection; `lang` is only ever the enum), gates run after authentication and before nothing they used to follow, agreement/term/payment validation byte-untouched, zero money arithmetic in the diff, Hub request shapes unchanged (only the language value of `hub.payLayaway`), pre-2C behaviour for absent/invalid language, explicit `ja` always refused, session-isolated cookie write. One defect found and fixed in review: the post-payment cookie sync could have failed a successful reservation; it is now caught and logged, never failing the plan. Pre-existing and out of scope: `payAction` (full payment) still passes the cookie language to the Hub for its result; noted, not changed.

**Release dependencies (unchanged by this work):** Option C is a coordination strategy only — **no 307/308 exists in this code**, OD-1/OD-4 remain unresolved, root `/` unchanged (OD-3), and **public activation of 2C must be held until the legacy canonical/hreflang transition (§19.3) is separately approved and operationally coordinated with the redirect stage**; C0/H0 was Phase-2B-only and is not silently extended by this implementation. The existing gates stand: owner review/commit/PR, preview validation, and a separate owner production-release approval.

## Phase 2D: implemented locally (READY FOR QA; development and local testing only)

Owner approvals of 2026-10-28 recorded in map §20 (OD-1 L2-exact 307 stage, OD-4 307 stage, missing-sibling policy, OD-12 HTML only, caching policy); **the root sitemap policy was approved separately in the three-PR review batch** (map §20.3: preserve the existing `/` entry; root routing and metadata unchanged; OD-3 still gated; root hreflang consistency must be resolved before any 308 promotion). Branch `seo/phase-2d-locale-sitemap` from `develop` `0c213dd`. Not merged, NOT DEPLOYED; no indexing claimed.

**Implemented (map §20.1):** `app/sitemap.ts` lists every public page at `/ja` and `/en` (Japanese first), never at its bare legacy URL; `/` kept beside `/ja` and `/en` until OD-3; posts only in the languages whose page answers 200 (`postLanguages`; a failed read lists neither; the Hub's list route sends no bodies, so the list alone cannot say); layaway-only posts and every layaway URL unlisted; all URLs built with `localePath`; no hreflang in the sitemap (OD-12). The advertised page set is unchanged (the never-listed `/collections` index stays unlisted). `scripts/check-seo-live.mjs` samples slugs locale-agnostically and gains the 2D sitemap checks.

**Verification evidence (local production build):** unit **426 pass / 0 fail** (sitemap tests rewritten for 2D: locale-only, both languages, per-language posts, failed reads, layaway, no alternates, static list held to the `app/[lang]` route files); typecheck, lint (fresh cache, 0 errors), terms/money/i18n/layaway-ja/analytics/cutouts green; build clean; generated sitemap: 91 URLs (`/`, 45 `/ja`, 45 `/en`), 0 bare non-root, 0 layaway, 0 `xhtml:link`; route checker **124/0/0** (41 sampled sitemap entries each answer 200 directly); locale matrix 331/332 — the one failure is the 2B dark-launch assertion "sitemap: zero locale URLs", which 2D reverses by approval; **legacy snapshot vs the 2C baseline: 35 routes, 0 differences except `/sitemap.xml`** (robots.txt, canonicals, hreflang, JSON-LD, links, statuses byte-identical). Against production (pre-2D) the updated checker reports 122/2/0: only the two new 2D sitemap checks fail, as expected before release.

**Release rule:** 2D ships only together with 2C and 2E-stage-1 (map §20); 2E-stage-1 must never ship without 2D, or the old sitemap would list redirecting URLs.

## Phase 2E-stage-1: implemented locally (READY FOR QA; development and local testing only)

Branch `seo/phase-2e1-legacy-redirects`, stacked on the 2D branch (2E-stage-1 must never ship without 2D). Temporary 307s only, per map §20.2; not merged, NOT DEPLOYED; no indexing claimed.

**Implemented:** `lib/legacy-redirect.ts` (pure decision table: target language from the middleware's own `langDecision`, the 16 static pages, single-slug dynamic resources, `lang` parameters dropped byte-for-byte, GET/HEAD only, never a Server Action, kill switch `SEO_LEGACY_REDIRECTS=off`); `middleware.ts` redirects static pages itself (`Cache-Control: private, no-store`, `Vary: Cookie, Accept-Language`) and hands dynamic targets to the page in a middleware-owned header (`x-cj-legacy-redirect`; a client-sent value is always deleted); `lib/legacy-redirect-server.ts` + the four dynamic legacy pages redirect only after their own `notFound()` check, so a missing slug, a post not written in that language or a Hub failure keeps today's response. Root `/`, `/layaway`, `/gold-guide`'s existing 308, private and locale routes untouched. `scripts/check-seo-live.mjs` now expects the 307s and checks indexable pages at their locale URLs.

**Verification evidence (local production build):** unit **439 pass / 0 fail** (13 new: every §20.2 row through the real `langDecision`, hostile paths, kill switch, the static list held to the `app/[lang]` route files, source guards — middleware-owned header, approved cache headers, redirect after `notFound()`, no 308, no `loading.tsx` above the pages); typecheck, lint (0 errors) and all repo guards green; **HTTP redirect matrix 489 pass / 0 fail** (16 static pages + 4 dynamic kinds × 8 signal combinations: one hop, final 200 in the right language; `?lang=` rows; missing siblings and slugs stay 404; untouched rows; HEAD; Server Action and plain POST not redirected; spoofed header ignored; page-level redirects are real HTTP 307s, never a meta refresh; all 91 sitemap URLs answer 200 directly); route checker **197/0/0**; client-side navigation from an old tab to a bare URL follows the 307 (query kept).

**Measured header gap (owner to accept or reject):** the 307s issued by the pages (products, categories, collections, posts) carry `private, no-cache, no-store` but Next sets their `Vary` itself (`rsc, next-router-…`), without `Cookie, Accept-Language`. Because `no-store` forbids every cache from storing them, `Vary` has nothing to act on; the middleware's static-page 307s carry both headers. Vercel's behaviour is still to be measured on the preview.

**BLOCKER FOUND DURING THIS QA — now fixed locally, see "Coordinated release QA" below:** prefetching the language switcher's other-language link ran the middleware's cookie sync (defect 1). Fixed, with three further browser defects found while verifying it, on `fix/locale-prefetch-cookie`.

## Coordinated release QA (2026-10-28): 2C fixes + 2D + 2E-stage-1 (local; READY FOR QA — NOT DEPLOYED)

Everything below is local evidence on production builds (`next build` + `next start`, fixture data). Nothing is pushed, merged or deployed; no indexing is claimed. **Release dependency:** 2C activation, 2D and 2E-stage-1 ship together in one coordinated `develop` → `main` release, and 2E-stage-1 never without 2D (map §19.3, §20).

**Browser defects found in Phase 2C (all on `develop`, none in production) and their fixes** — root cause for 1-4: the root layout (`<html lang>`, header, footer, drawer, tab bar, switcher, announcement bar) is rendered once per document and is not re-rendered by a client-side navigation.
1. **Prefetch cookie mutation (FIXED).** The switcher's other-language `<Link>` was prefetched; the prefetch ran the middleware's locale cookie sync (Next 15.5.25 strips the router's prefetch headers before middleware, measured, so middleware cannot tell a prefetch from a visit). Viewing `/en/faq` set `cj-lang=ja`; the English `/layaway` link then 404'd and `/cart` rendered Japanese. Fix: switcher options are plain `<a>` (never prefetched, same crawlable hrefs). No other component links into a fixed language (guard test).
2. **Stale language frame (FIXED).** A soft switch `/en/faq` → `/ja/faq` rendered the Japanese page under the English frame, Layaway link included, `<html lang="en">`. Fix: a language switch loads a new document.
3. **Stale switcher destinations (FIXED).** After an in-site client navigation the switcher still targeted the first page's sibling. Fix: `useSwitchTargets` re-asks `GET /api/switch-targets` (the layout's own `switchTargets` rule) for the page on screen; the props describe the document's page only (also covers the phone drawer, which mounts its switcher late); an answer for a path no longer on screen is dropped; while pending, each option offers its language home (never a 404).
4. **Announcement bar on the legal notice after client navigation (FIXED).** The not-on-`/legal/*` rule ran only in the layout. Fix: the bar applies the shared `announcementBarAllowed` rule to the path on screen (as the consent banner already did); a legal page's server HTML still holds no bar.

**Endpoint security review (`GET /api/switch-targets`):** read-only (POST → 405); pathname only (≤ 512 chars, `isSitePath`, any query/fragment dropped; otherwise 400); answers are same-site paths, language homes or null — never another host, never a private route (private paths return the cookie-toggle null), never `/ja/layaway` or `/en/layaway` as a destination; English-only and layaway-only posts fall back to `/ja`; no cookie read or written; no visitor data; `Cache-Control: private, max-age=60` (400/503: `no-store`). Race: with page B's answer held back 2.5 s, A → B → C left C's target correct before and after B's answer arrived; back/forward correct.

**Redirect caching (measured locally; Vercel still to be measured):** static-page 307s (middleware): `Cache-Control: private, no-store`, `Vary: Cookie, Accept-Language`. Page-level 307s (products, categories, collections, posts): `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`, `Vary` set by Next itself (`rsc, next-router-…, Accept-Encoding`) — the middleware cannot change it and no workaround was added. Safe outcome verified in a real browser: switching the cookie en → ja → en between visits to the same bare URL re-evaluated the 307 every time (no cached redirect reused). Kill switch verified over HTTP: with `SEO_LEGACY_REDIRECTS=off` the same URLs answer 200. **Header decision (three-PR review batch): PROVISIONALLY ACCEPTED FOR PR REVIEW, NOT FINAL PRODUCTION APPROVAL.** **DEPLOYMENT GATE (map §20.4): the production release is BLOCKED unless the actual Vercel Preview shows real 307s, correct `Location` and `Cache-Control`, no reuse across language cookies, correct targets across Accept-Language variants, 404 kept for missing siblings, no loops and no meta-refresh substitution.** The kill switch's behaviour there (an env change needs a redeploy) is also not yet verified.

**Verification evidence (final integration of fix `70de531` + 2E-stage-1 `634e533` incl. 2D `bf3c6c4`, on `develop` `0c213dd`):** unit **450/450**; typecheck; lint 0 errors (12 pre-existing warnings); terms, contrast, i18n, analytics, money, cutouts, layaway-ja green; clean build (21 `[lang]` routes); redirect matrix **502/502** (adds duplicate cookies, weighted Accept-Language, invalid cookies, endpoint over HTTP); route checker **197/0/0**; locale matrix **335/335** (332 rows, three rewritten to assert the approved behaviour: bare product → real 307 to its locale page with one hop and no double prefix; the spoofed-header check proven through the redirect and its destination; the old "no locale URLs in the sitemap" row replaced by four 2D checks — eligible locale URLs only, missing-language posts excluded and their URLs 404, zero entries 404, zero entries redirect); crawl 275 pages / 104 unique links — 0 resolve to 404, 0 bare public links, 0 `?lang=` links; legacy regression vs the 2C baseline: 15 routes byte-identical (root `/`, `/layaway`, private, 404, locale homes, both locale tokusho, robots.txt), 19 bare public routes now 307 to the right locale, sitemap changed; real-browser journeys at 1280 px and 375 px with initial `en` and `ja` cookies (A-R, EN→JA, JA→EN, EN→EN, JA→JA, back/forward across and within documents, drawer, legal suppression after client and full navigation, production-like no-announcement case): all pass, 0 unexpected 4xx, 0 console errors (one isolated `/favicon.ico` 404, which production also answers today, was not reproducible in three reruns).

**Checkout review:** the Opus review of the OD-15 diff was COMPLETED 2026-10-28 on Opus 5.5 (read-only, no defects; see the Phase 2C section). No money, payment or Hub contract code changed in this work.

**Remaining limitation — NOT fixed (bare `/layaway` across tabs):** English layaway links stay on bare `/layaway` until Phase 3 (Option ii), which decides by the cookie. Verified: tab A reads English, tab B switches to Japanese → tab A's Layaway link shows not-found; any English page load (or reload) resyncs the cookie and it answers 200. It fails closed (a Japanese session never sees layaway). Phase 2C makes it somewhat more likely than before, because an English tab now stays English across its own client navigations while another tab changes the cookie (defect 1 had made it near-certain; that is fixed). Going back across a language switch is not a trigger (the page reloads and resyncs). The structural fix is Phase 3 (`/en/layaway`). **Before production approval the owner must choose: (A) a separately reviewed interim mitigation that changes no payment or layaway money logic, or (B) an explicitly approved deferral to Phase 3 with this customer impact documented.** No mitigation is implemented.

**Root sitemap:** `/` stays listed (unchanged) — OWNER APPROVED in the three-PR review batch (map §20.3); root legacy hreflang consistency must be resolved before any 308 promotion.

## Phase 2C + 2D + 2E-stage-1 release (PR #412): DEPLOYED — PRODUCTION VERIFIED; SEARCH ENGINE RECRAWL PENDING (2026-10-29)

**Release identity.** PR #412 (`develop` → `main`) merged 2026-10-28 15:25:37 UTC (00:25 JST 10-29) by the `chajewels` account, **before the final gate report was delivered** (owner to confirm the merge was intended). Merge commit `7aac136bdbd7e5488864cf6c3b349734d619adeb`. Its tree is identical to the QA'd `develop` head `809bc7f` (`git diff` empty). Included: #405, #406, #407, #409 (carrying #408), #410, #411. Vercel production deployment `cha-jewels-8c1h7g79r-cha-jewels.vercel.app` (`7aac136`), Ready, assigned to `www.chajewelsjp.com` and `cha-jewels-web.vercel.app`; no later production deployment (Vercel dashboard and GitHub deployments, 2026-10-29 00:42 JST). Previous production: `c2f14aa` (Phase 2B).

**CI.** Pre-merge CI on `809bc7f` succeeded (run 40684894288). The push run on `main` (40715837192) concluded **cancelled**. Annotation: "The run was canceled by @chajewels." The cancel landed after all 12 steps had finished green (terms, i18n incl. layaway-ja, analytics, money, cutouts, unit, typecheck, lint). `ci.yml` has no `concurrency` group, and no newer run replaced it. The first attempt is **not** counted as CI success. **Rerun (attempt 2, owner-authorised, 2026-10-29 00:48 JST): conclusion `success`, all 8 check steps green on `7aac136`. It created no deployment.** CI never runs `next build`, which is covered only by the Vercel build (Ready).

**Production evidence (curl, sequential, 1 s spacing, 2026-10-29 00:28–00:30 and 00:41 JST):**
- Static-page 307 (middleware), e.g. `/faq`: cookie `en` → `/en/faq`; cookie `ja` → `/ja/faq`; no cookie → by `Accept-Language`; `?lang=` beats the cookie and is dropped from `Location`. Headers: `Cache-Control: private, no-store`, `Vary: Cookie, Accept-Language`.
- Page-level 307, e.g. bare product: cookie `en`/`ja` → `/en/products/…` / `/ja/products/…`; en → ja → en re-evaluated each time. Headers: `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`, `x-vercel-cache: MISS`, `age: 0`, `Vary` set by Next (`rsc, next-router-…`).
- One hop then 200; no loops; no new 308 (only the pre-existing `/gold-guide`); missing slug 404.
- **Page-level `Vary` gap analysis.** Vercel's CDN does not store responses carrying `private`, `no-cache` or `no-store`, and `Vary` has no effect without a caching directive (vercel.com/docs/caching/cdn-cache, cache-control-headers). `no-store` also forbids browser storage. Measured `MISS`/`age: 0` on every page-level 307, and the redirect followed each cookie change. **Cache isolation is correct; no defect.** Classification as closed is for the owner to confirm; it is not recorded as an accepted risk.
- `/`, `/en`, `/ja`, EN/JA product, `/ja/why-cha-jewels`: 200, correct `lang`, self-canonical. Locale pages carry `en`/`ja`/`x-default`→EN hreflang. Root `/` unchanged (canonical `/`, hreflang `ja=/`, `en=/?lang=en`, `x-default=/`).
- `sitemap.xml` 963 URLs = 481 `/en` + 481 `/ja` + `/`; 0 bare; 0 layaway; no `/ja/blog/how-cha-jewels-began`. `robots.txt` unchanged.
- Japanese pages: 0 レイアウェイ/分割予約 in site UI (code), 0 layaway hrefs. Hub article bodies are not covered by the code guard: the Japanese body of `why-cha-jewels-care-behind-every-piece` still rendered レイアウェイ until its 2026-10-29 correction (closeout below). `/layaway`: cookie `en` 200, cookie `ja` 404.
- Signed-out `/account`, `/checkout`, `/account/layaway` → 307 `/login?next=…` (pre-existing middleware code, unchanged by the release).
- Runtime logs, production, past hour at 00:42 and 00:49 JST: 0 error, 0 fatal. Warnings (75, then 91) are all `/api/csp-report`; `lib/csp.ts` is unchanged by the release.
- **CSP warning classification (no policy change made).** `lib/csp.ts` enforces a policy only on `/account/orders/[id]/pay-card`; every other page is **report-only**, so these reports are would-block notices, not failed requests. Every logged report came from report-only pages (collections, products, loyalty, search, about).

  | Blocked host | Directive | Classification | Evidence |
  |---|---|---|---|
  | `ping.paidy.com/promotional-messaging/3pay` | connect-src | Required production integration (Paidy upsell widget telemetry) | Referenced in Paidy's own `cdn.paidy.com/promotional-messaging/general/paidy-upsell-widget.js`; product pages only |
  | `googleads.g.doubleclick.net/pagead/viewthroughconversion/…` | script-src-elem | Optional advertising (Google Ads tag, after cookie Accept) | Host is in `ADS_CONNECT` but not `ADS_SCRIPT` |
  | `ad.doubleclick.net/ccm/s/collect` | connect-src | Optional advertising (Google Ads conversion measurement) | Not listed |
  | `mpc2-prod-24-is5qnl632q-uw.a.run.app/events` | connect-src | **Unknown** | Not in first-party code, Metricool's `be.js`, Meta's `fbevents.js` or Paidy's widget; seen site-wide. Do not allowlist until identified |

  Before any future enforcement, the first three need listing or a deliberate decision; the fourth needs identification.
- **Previously affected sitemap URLs (Hub incident 2026-10-28).** 26 products × `/en` + `/ja` = 52 URLs rechecked on the Preview after the incident (22:25–22:50 JST, sequential, no retries): **52/52 HTTP 200**. Production spot checks today (`p2926` EN/JA) are 200.

**Rollback (not executed).**
- **Full Instant Rollback to `c2f14aa`.** Eligible (previously production-aliased, Ready, retained); operator `chajewels` is a team Owner.
  - Keeps the Phase 2B `/en` and `/ja` routes: 21 `app/[lang]` pages at `c2f14aa`, still 200.
  - Reverts 2C navigation and switcher, #406 fixes, OD-15 page-language gating (incl. agreement-language propagation and post-reservation cookie sync), the 2D sitemap (back to bare URLs only), 2E 307s (bare URLs serve 200 again), #410 and #411.
  - Domains: Vercel re-points them instantly and turns off production auto-assignment until "Undo rollback".
- **`SEO_LEGACY_REDIRECTS=off` + a new production deployment.** Removes only the 307s; env changes apply only to new deployments.

**Known limitations (unchanged by design).**
- English layaway links stay on bare `/layaway` until Phase 3.
- #410 resyncs `cj-lang=en` when an English layaway link is clicked. A typed or pasted `/layaway` under a `ja` cookie still 404s (fails closed).
- No layaway on the Japanese site.

**Open items from the release (both closed 2026-10-29; details in "Phase 2 closeout" below):**
- (1) Hub article `why-cha-jewels-care-behind-every-piece` (Japanese body): layaway passages (¶28–¶32) and the 404 founding-story link (¶49). **Corrected and VERIFIED.**
- (2) Incident-window transactions (2026-10-28 13:30 JST onward): **Reconciled, no discrepancies.**
- (3) `main` CI: **resolved** by the rerun above.

**Phase 3 handoff.** Prerequisites now in production: locale routes, localized navigation, localized sitemap, temporary 307s, `gateLang`/OD-15. Phase 3 creates and validates `/en/layaway`, repoints English layaway links, then removes the bare-`/layaway` cookie dependency. A 308 promotion stays separately gated: root legacy hreflang (`en=/?lang=en`) must be resolved first (map §20.3), and Search Console observation is required.

## Phase 2 closeout (2026-10-29): Japanese content corrected; 2026-10-28 incident reconciled

**Japanese article — VERIFIED (published 2026-10-29, checked 02:26 JST).**
- **Owner approval:** exact wording approved in session.
- **Edit:** made in the Hub (app.chajewelsjp.com → Website → Content). Only `body_ja` and `excerpt_ja` of `why-cha-jewels-care-behind-every-piece` changed.
  - Before the edit, the stored source matched the approved "before" text: each paragraph exactly once; ¶49 stored as `[チャジュエルズの創業ストーリー](/blog/how-cha-jewels-began)`.
  - After saving, a fresh reload showed the six new paragraphs and the new excerpt stored exactly. 6 of 99 body lines changed.
- **¶28–¶32:** neutral shopping guidance; no layaway, deposit, schedule, calculator or plan wording.
  - ¶29 reads 「…商品ページでは価格に加えて、商品に応じて素材や重量などの情報をご案内しています。中古の商品には「プレラブド」と表示しています。」.
  - This matches `app/products/[slug]/page.tsx` (素材/重量 rows show "—" when empty) and `components/catalog/condition-badge.tsx`.
- **¶49:** 「チャジュエルズの創業やこれまでの歩みについては、「[Cha Jewelsが選ばれる理由](/ja/why-cha-jewels)」のページでもご紹介しています。」. Only the page title is linked.
- **Excerpt (meta, og and twitter descriptions):** 「お支払いの計画」 → 「お支払い方法」.
- **Live QA (one request each):**
  - Article 200, `lang="ja"`, self-canonical; changed blocks exactly ¶28–¶32 and ¶49, each equal to the approved text.
  - 0 レイアウェイ/分割予約/頭金/毎月の支払額/計算機 and 0 layaway hrefs in the article.
  - ¶4–¶9, ¶42 and ¶50 identical; the ¶49 link points to `/ja/why-cha-jewels` (200).
  - Meta, og and twitter descriptions updated.
  - Both English articles identical to their pre-change snapshots; `/ja/blog/how-cha-jewels-began` still 404, so the founding article stays English-only.

**2026-10-28 incident — reconciled, no discrepancies (read-only; window 2026-10-28 13:30 JST → 2026-10-29 ~02:25 JST).**

*Outage timeline (corrected; read-only evidence).*
- Episode 1, ~14:30–14:45 JST: storefront 500s on product pages at 14:39; the Hub's `auto-expire-cash-orders` has no 14:40 run.
- Episode 2: storefront product-page 500/504 from ≤ 21:09 JST.
  - Hub cron runs failed with "job startup timeout" from 21:20 JST (12:20 UTC), including the 21:40 expiry run.
  - Database restarted ~22:03 JST; sign-in recovered 22:07:38 JST.
  - The "21:44" in the Hub's first diagnosis was its log-retention start, not the outage start.
- No 5xx on cart, checkout, account or API routes.

*Hub queries.* Lovable Cloud SQL editor; each query wrapped in `SET TRANSACTION READ ONLY`; role `postgres`, bypasses RLS.

| Check | Result |
|---|---|
| Orders | 211 visible, 0 pending, newest created 2026-10-26 |
| Checkout drafts since the window start | 0 |
| Expired/cancelled orders since the window start | 0 |
| Order audit entries | 0 |
| Paidy webhook inbox | 0 events |
| Square webhook inbox | 0 events |
| Payment rows changed | 4 Square captures, all from 2026-10-04 to 10-11, recorded in the Hub, re-stamped by the `square-reconcile` sweep |
| Square sync checkpoint | Current (last OK = last run, 16:53 UTC) |

`auto-expire-cash-orders` is Active, hourly at :40 UTC (cron TZ GMT). With 0 pending orders it had nothing to expire, so no pause was needed.

*Providers.*
- **Square production:** 0 transactions of any status, and 0 webhook deliveries or failures, after 2026-10-26 13:49 JST.
- **Paidy:** 0 payments after 2026-10-05.
- **Matching:** 0 provider records vs 0 Hub records in the window. Nothing unmatched; no failed or pending deliveries.

**Follow-ups (separate, not Phase 2 blockers):**
- **P3 (deferred, observability only):** pg_net calls from the Hub's cron jobs time out at the observed 5 s default (`page365-inventory-schedule`, `page365-invoice-check`); the functions complete within their own budgets and record completion themselves, so no schedule, timeout or function change is proposed. The pg_net response IDs restarted around 16:47 UTC (unexplained, low priority).
- **TEST-900080 — VERIFIED, CLOSED (2026-10-29):** the ¥8,570 production Square capture (2026-10-11) and its full refund the same day are both recorded in the Hub and match Square.
- **Paidy test authorizations — CLOSED (2026-10-29):** both unused ¥20,000 test-tagged authorizations from 2026-10-03 were closed in Paidy without capture (¥0 captured, ¥0 refunded); the captured payment and order CJ-W-900060 are unchanged.
- **Paidy M5 source recognition — DEPLOYED; live check NOT TESTED:** la-tracking PRs #668/#669 merged and the corrected `paidy-webhook` Edge Function deployed 2026-10-29 (the Cloudflare-set `cf-connecting-ip` now decides; Supabase's gateway hop in `x-forwarded-for` no longer rejects Paidy). The next genuine Paidy delivery requires a read-only verification (`source_recognised = true` from a Paidy IP, processed without error). `PAIDY_WEBHOOK_RATE_CAP` remains OFF until then.
- **Docs:** the Japanese layaway guard (`layawayOffered`, `check:layaway-ja`) does not scan Hub article bodies.

## Master-plan sweep (2026-10-29): Phases 3-12 — record of the sweep session (SUPERSEDED: Phases 3-4 were since DEPLOYED in PR #421, `main` `82effab`; see the opening line and the change log)

One coordinated session, four branches from `develop` `4dc3c23`, four draft PRs against `develop`. At the time of writing production was unchanged; the table below is the local evidence recorded then, kept as history. No indexing, ranking or rich result is claimed. Merge order: #416 then #419 (they share only `scripts/check-seo-live.mjs`; a trial merge is clean), then the two docs PRs in any order.

| Batch | Phase | PR | Commits | Classification | Evidence / blockers |
|---|---|---|---|---|---|
| A | 3 Layaway indexing | #416 `seo/phase-3-layaway-indexing` | `e186b5f` route + links, `ce1e8c8` sitemap, `1592afd` report | **IMPLEMENTED AND TESTED locally → READY FOR OWNER REVIEW** | unit 478/478; `check-seo-live` 208/0/0 on a local build; browser 1280/375 px, 0 console errors; `/ja/layaway` 404 tagless; Japanese pages 0 layaway links. Owner decisions P3-1..P3-5 in `phase-3/PHASE-3-REPORT.md` (route approval; wording; OD-6 still unapproved; layaway-only posts; Messenger-button locale fix). Deployment: preview QA on the branch alias, release, then Rich Results Test and Search Console request (owner) |
| B | 4 Structured data | #419 `seo/phase-4-structured-data` | `07d0e30` breadcrumbs, `103b436` store entity, `b7fe6ed` X5 + ratings, return policy and shipping commits REMOVED (owner decision 2026-10-29), `456c77f` live check, `5cbf4ee` report, `21d7d91` `8cbea05` `ccb53ee` `0c898aa` visible breadcrumbs, `ecd3b4f` absence pinned (rebased SHAs) | **IMPLEMENTED AND TESTED locally → AWAITING OWNER MERGE AUTHORIZATION** | unit 501/501; build clean; 70/70 JSON-LD assertions over 11 rendered pages; `check:money` green (the shipping rate is a threshold comparison, constants defined once in `lib/content/shopping-guide.ts`). Not verifiable locally: live review data (fixtures have none), Japanese descriptions (fixtures null), Hub social/email values, Google rendering; Rich Results Test after deployment. Owner decisions: keep/drop `aacb81e` ("no returns" may display), confirm the rate card before keeping `f324135` |
| C | 6 Commercial landing architecture | #417 `seo/phase-6-8-commercial-authority-prep` | `8b87889` | **READY FOR OWNER REVIEW** (no route created) | 7 of 9 themes already served by existing collection/category pages; `luxury-watches` collection and `preloved-watches` category duplicate each other; no Kihei collection exists; search-volume metrics UNVERIFIED (SERP observations only). Decisions OD-P6-1..9 (Kihei Hub collection, preloved-watch primary URL, Hub SEO-field contract, `/en/guides/*` family, no `/en/shop/*`) |
| D | 7 Kihei authority | #417 | `a51dc70` | **PARTIALLY COMPLETE** (draft content; route not created, editorial approval required) | Pillar draft ~1,900 words, 12-topic cluster plan, sources cited; "Shop Kihei" has no destination until a Hub collection exists |
| D | 8 K18 authority | #417 | `15db7ec` | **PARTIALLY COMPLETE** (draft content; route not created, editorial approval required) | Pillar draft ~1,540 words linking the Jewelry Guide's metals section rather than duplicating it; cluster plan |
| E | 5 Merchant Center | #418 `seo/phase-5-9-12-readiness` | `798dcd0` | **BLOCKED** on owner (account state, feed route approval, rate card) — readiness AUDITED | Recommends a storefront feed route reading the Website API (needs route approval) over a Hub endpoint; sold → out_of_stock per D3/X10; no GTIN/MPN |
| E | 9 Filipino content | #418 | `0d38c96`, `ee5d3fb` | **PARTIALLY COMPLETE** (8 briefs + one Taglish draft; nothing published) | Publish as English-site Hub posts (`layaway_only: true`); links swap to `/en/layaway` once Phase 3 is deployed |
| E | 10 Local SEO | #418 | `4350d5f` | **BLOCKED** on OD-GBP-1 (visitable office or not) — audit AUDITED | NAP consistent across the site's legal constants; G1 (entity fields) is addressed by #419 |
| E | 11 Authority | #418 | `ddec8e3` | **AUDITED** (documentation only, by design) | No outreach; D2 old-domain redirect is the first zero-outreach asset |
| E | 12 Search Console ops | #418 | `ee02ffa` | **BLOCKED** on the first export (owner) — workflow AUDITED | Report template, opportunity rules, helper described (not written) |

**Not done anywhere in this sweep (approval-gated, on purpose):** no new public route other than `/en/layaway`; no redirect or canonical policy change (OD-6, 308 promotion untouched); no customer-facing content published; no Google account touched; no payment or database change; no merge; no deployment.

**Cross-PR notes:** #416 removes `lib/layaway-language-sync.ts` and its component/test (the PR #410 mitigation) and fixes the Messenger button's locale-prefix matching. #419 adds exported constants to `lib/content/shopping-guide.ts` and new `JsonLd` props on the product and home pages. The Phase 9 brief in #418 still writes `/layaway` as the working link until #416 is deployed.

**This session's model:** the sweep ran on Fable 5.1 (the owner's decision rule prefers Opus for architecture and money-adjacent logic; no money logic changed, and `check:money` is green on both code branches). The owner may request an Opus review of #419's `lib/json-ld.ts` shipping/return commits at the PR.

## Step 1 — Crawlability and metadata (Master Plan §33.3): DEPLOYED — PRODUCTION VERIFIED; SEARCH ENGINE RECRAWL PENDING (2026-10-29)

Release: PR #430 (develop `c6bec5c` → main `2e18bcc64d3d36798c6ca8b00d0ef1d9fc19e409`, merge commit). Work: PR #429. Production deployment `7407795774` Ready. Live QA record: SEO-QA-REPORT.md §9.

| Item | Status | What changed |
|---|---|---|
| A. Crawlable navigation | DEPLOYED | Closed Collections/Company menus and the phone drawer render a `hidden` link list (`components/site/crawl-links.tsx`), removed while the menu is open. Five category pages that were reachable only through the menus are now linked from every page's HTML. |
| B. Tokusho descriptions | DEPLOYED | Own EN and JA `description` in `dict.meta.tokusho`; no layaway wording in JA; legal text untouched. |
| C. Titles | DEPLOYED | Product `<title>` moves the SKU last only when the Hub name starts with the product's own SKU; EN titles lengthened for the seven jewelry-type collections and Fine Jewelry only. H1, slug and Hub name unchanged. |
| D. Blog alt | DEPLOYED | Article lead image `alt` = article title; list thumbnails stay `alt=""`. |
| E. Sitemap | DEPLOYED | `lastmod` only from a Hub post's `updated_at` (editor edit), the blog index's newest post, and the Git date of the dedicated content file for `/about` and `/jewelry-guide` (`scripts/gen-page-lastmod.mjs`). Everything else has none. Product `images` entries from the Hub's absolute https primary photo. URL set unchanged. |
| F. Breadcrumb tap target | DEPLOYED | Invisible `::after` grows the tap area to about 45px; layout unchanged. |

PR #429 review fixes (2026-10-29): (A) `/collections` now shows a visible, 44px-tall list of every category (previously the five category pages were visibly linked from the home page only); the hidden menu lists stay as a supplement. (B) The product-photo read is time-boxed (10 s), tolerant of malformed rows, and de-duplicates slugs; a failure never removes a URL. (C) Product `lastmod` REMOVED: the Hub's `website_products.updated_at` is a row-level trigger that moves on Page365-sync and admin writes and does not move on price, stock or photo changes (separate variant/media tables), so it is not a public-content time. Posts keep theirs. `npm run check:lastmod` (CI, full history) fails when `/about` or `/jewelry-guide` content is committed without regenerating `lib/page-lastmod.generated.ts`.

Not claimed: indexing, rich results or ranking effects. Product image entries are covered by unit tests only; the local build runs on fixtures with relative image URLs, so no live image entry was produced. Recheck after deployment against the real Hub.

## Step 2 — Collection and category SEO (Master Plan §33.3): DEPLOYED; SEARCH ENGINE RECRAWL PENDING (2026-10-29; PR #432 → develop `5533801`, released via PR #433 → main `49c0fd6`)

| Item | Status | What changed |
|---|---|---|
| ItemList JSON-LD | DEPLOYED | One `ItemList` per collection/category page with at least two pieces: the grid's own `products` array, in its order (sold pieces included, as the grid shows them), each distinct product URL once, positions 1..n, locale-correct canonical URLs. Only `position` and `url` per item: no name, price, availability or rating (each product page carries its own Product markup). No list for an empty or one-piece page. |
| Hero OpenGraph image | DEPLOYED | The Hub's own `hero_media`, only when an absolute https URL. Bundled placeholders, category-stage product photos and relative or http values are never used; those pages keep today's brand image. OG title/description unchanged; Twitter image follows. |

Evidence baseline (production, 2026-10-29): 5 of 12 collections have a real Hub `hero_media` (earrings, luxury-bags, luxury-wallet, luxury-watches, other-accessories; images are 0.1-1.8 MB); no category has one yet, so category OG stays the brand image until the owner uploads a hero. Google's carousel rich result supports only Course, Movie, Recipe and Restaurant lists, so this ItemList is valid schema.org markup that describes the page and is NOT expected to produce a rich result. No claim is made about rich results, indexing or ranking.

The ItemList describes the initial server-rendered grid (the Hub's order, "Newest"), not a visitor's later client-side sort or filter. Size on real production listings, measured by running the builder over their real slugs: 0.3-1.7% of the page (largest 28.9 KB on `/categories/preloved-jewelry`, 194 pieces). `scripts/check-seo-live.mjs` now reads the rendered HTML of 10 listing pages (og/twitter inheritance, hero-or-brand image, ItemList = rendered grid) so the same checks run against production after release.

## Change log

- 2026-10-29: Stabilization release PR #426 → `main` `97a6e76` (BUG-02 sameAs chat-link exclusion, BUG-05 robots/noindex on `/already-registered`, BUG-08 docs, defect review). Production-verified: checker 289/0/0, sameAs Facebook only, Messenger links intact, private routes unchanged (QA §8). No Hub, payment or Google change; OD-6 not implemented.
- 2026-10-29: PRODUCTION RELEASE: PR #421 merged (`main` `82effab`), Vercel production Ready (`cha-jewels-dzlgl93u3`), `main` CI success; production QA 13/13 PASS, checker 288/0/0 (QA §7). Phases 3 and 4 DEPLOYED, SEARCH ENGINE RECRAWL PENDING; no indexing claimed. OD-6 not implemented.
- 2026-10-29: Post-merge integration QA on the `develop` preview (`675a7c3`, Vercel Ready, real Hub): 23 checks PASS, 0 FAIL (QA §6); release scope = `develop` `675a7c3`; STOPPED for owner authorization; OD-6 not implemented.
- 2026-10-29: Controlled integration stage: #419 rebased without `aacb81e`/`f324135` (unit 502/502, checker 277/0, build clean); #416 unchanged on `develop` head; #416, #417, #419 marked ready for review; no merge performed — explicit owner authorization requested (`SEO-QA-REPORT.md` §5). OD-6 not implemented.
- 2026-10-29: Final QA of #416 and #419 recorded in `SEO-QA-REPORT.md` (new): #416 all checks PASS locally incl. the two-tab case, branch preview BLOCKED by Vercel settings (previews build on `develop` only); #419 checker 277/0, RRT valid, visible breadcrumbs added, return-policy and shipping commits found not to represent the published cart-based shipping rule and the complete return/store-credit policy → held, owner decisions R-1/S-1; real-Hub validation BLOCKED locally (no credentials). Merge order: #416 → #419 (without the two commits) → docs → release.
- 2026-10-29: Master-plan sweep (docs + two code branches, none merged): Phase 3 READY FOR QA (#416), Phase 4 READY FOR QA (#419), Phases 6-8 AUDITED with drafts (#417), Phases 5, 9-12 AUDITED (#418). Phase-status table rows 3-12 rewritten. No production change; SEARCH ENGINE RECRAWL PENDING unchanged; no indexing claimed.
- 2026-10-28: Baseline and this file created (Phase 0). No application code changed.
- 2026-10-28: Phase 1: route matrix, search policy, noindex for private/utility routes, canonical/hreflang removed on those routes, 20 unit tests, `scripts/check-seo-live.mjs`. 404 cleanup partly deferred. Branch not pushed.
- 2026-10-28: Phase 2 planning only: SEO-MIGRATION-MAP.md and skill cha-i18n-seo created; status set to AUDITED / PLANNING. No route or application change.
- 2026-10-28: Phase 2 planning refined: OD-13 and OD-14 resolved as technical conventions; remaining owner decisions detailed with recommendations; findings F1-F5 recorded; implementation gates 2A-2E defined. Moved to branch `seo/phase-2-multilingual-planning`. No route or application change.
- 2026-10-28: Phase 2 planning finalized for commit: the interim canonical behaviour of bare legacy URLs is reclassified PROPOSED — OWNER APPROVAL REQUIRED (it is not approved architecture); all remaining owner decisions stay unresolved. No route or application change.
- 2026-10-28: Phase 2 planning corrections (docs only, follow-up to merged PR #394): layaway link sequencing (Option ii), `bannerAllowed` compliance coverage, legacy hreflang in the owner-approval block, JSON-LD timing, Phase 2A local verification, stale-cookie wording. All 12 remaining owner decisions stay unresolved; OD-13 and OD-14 stay resolved. No route or application change.
- 2026-10-28: Phase 2A implemented locally (READY FOR QA, uncommitted): `lib/locale.ts`, `lib/statutory-path.ts`, `classifyPath`, two behaviour-preserving call-site changes, 30 tests, content-completeness audit (map §16), correction of the ad-tag claim in the planning documents. No route or output change.
- 2026-10-28: Phase 2A final QA (READY FOR QA, local): four defects in the new helpers fixed (protocol-relative output from a prefixed path, backslash and control characters, fail-safe holes in the bar rule, Japanese layaway classed public), family rules made data-driven for Phase 3, 41 new tests (383 total), production build and 35-route comparison clean, content-language audit validated with confidence labels, phase-numbering conflicts recorded. No route or output change.
- 2026-10-28: Phase 2B prerequisite review (documentation only): OD-10, OD-2, OD-3 and OD-8 recorded as OWNER APPROVED; OD-9 content audit completed (map §16.1, policy proposed, not approved); OD-15 design written (map §17, not approved); C0/H0 risk assessed (map §7, not approved); Release 0 identified as a prerequisite; preview readiness documented. No route or application change.
- 2026-10-28: Final Phase 2B prerequisites (documentation only): OD-9 audit quality-corrected into five evidence categories (0 fallback pages; neutral-text rule replaces word-count detection; the intermittent 500 unreproduced in instrumented passes); OD-15 security review added (no new authorization or payment bypass; middleware-owned x-cj-lang); C0/H0 explicitly scoped to the 2B dark launch only, unapproved; Release 0 preflight recorded (safe, one PR, not created). No route or application change.
- 2026-10-28: Release 0 verified in production (119/0/1 recorded); Phase 1 and 2A marked DEPLOYED, recrawl pending; OD-9, OD-15 (with security requirements) and C0/H0 (2B only, expires at the 2C gate) recorded OWNER APPROVED; Phase 2B execution specification added (map §18). No application change; Phase 2B not started.
- 2026-10-28: Owner approved OD-1 (L2-exact, 307 stage), OD-4 (307 stage), the missing-sibling policy, OD-12 (HTML only) and the caching policy (map §20); root sitemap policy recorded PENDING OWNER CONFIRMATION (map §20.3), then OWNER APPROVED in the three-PR review batch (preserve `/`); Phase 2D implemented locally (READY FOR QA); Phase 2C record updated (merged as #405, preview QA verified, Opus review completed with no defects).
- 2026-10-28: Phase 2E-stage-1 implemented locally (READY FOR QA): 307-only legacy redirects per map §20.2; page-level `Vary` gap measured and recorded; Phase 2C prefetch cookie defect found and recorded as a release blocker.
- 2026-10-28: Coordinated release QA (local): Phase 2C browser defects 1-4 recorded with their fixes on `fix/locale-prefetch-cookie`; switch-targets endpoint security review; redirect cache findings (Vercel Preview headers remain a deployment gate); locale matrix 335/335, redirect matrix 502/502, unit 450/450; bare `/layaway` cross-tab limitation recorded as not fixed; root sitemap pending owner confirmation.
- 2026-10-28: Three-PR review batch: root sitemap policy OWNER APPROVED (preserve `/`); redirect headers provisionally accepted for PR review only, with the Vercel Preview release gate recorded (map §20.4); two-tab layaway decision (interim mitigation or approved Phase 3 deferral) required before production approval.
- 2026-10-29: Release PR #412 merged (`7aac136`, identical tree to `809bc7f`) and deployed (`cha-jewels-8c1h7g79r`) ahead of the final gate report. Production-verified: real 307 headers, cache isolation (page-level `Vary` gap analysed: no defect), locale navigation, canonical/hreflang, sitemap, robots, Japanese layaway exclusion, auth boundaries, 0 runtime errors. SEARCH ENGINE RECRAWL PENDING. `main` CI first attempt cancelled by the account after all steps passed; rerun attempt 2 succeeded. CSP report-only warnings classified (no policy change). Open: Japanese Hub article revision (owner approval), incident-window reconciliation (BLOCKED). No indexing claimed.
- 2026-10-29: Phase 2 closeout. Japanese article `why-cha-jewels-care-behind-every-piece` corrected in the Hub (owner-approved ¶28–¶32, ¶49, excerpt) and VERIFIED live. 2026-10-28 incident reconciled read-only across Hub, Square and Paidy: no discrepancies. Outage timeline corrected. Follow-ups P2/P3 recorded. Code deployment unchanged; SEARCH ENGINE RECRAWL PENDING; no indexing claimed.
- 2026-10-29: Follow-ups updated (docs only). TEST-900080 refund synchronisation VERIFIED and closed; the two unused Paidy test authorizations closed without capture; Paidy M5 source-recognition fix (la-tracking PRs #668/#669) deployed to `paidy-webhook`, live verification NOT TESTED pending the next genuine delivery, rate cap OFF; pg_net timeout corrected to the observed 5 s default and kept deferred. No application, payment or SEO change.

## Phase 2B: DEPLOYED — PRODUCTION VERIFIED (2026-10-28)

- Release: PR #400 (implementation, Gate G CI pass after one lint fix) → release PR #401, merge `bd28cc6`, Vercel Production deployment `7380054782` success. Gate H passed by the owner on the SSO-protected preview; gates were never skipped or combined.
- **Gate J recorded production evidence:** `scripts/check-seo-live.mjs https://www.chajewelsjp.com` → **120 pass / 0 fail / 0 deferred**; production locale matrix on real slugs → **284 pass / 0 fail** (R1-R18 ×2 locales; canonical/hreflang/x-default; locale-correct JSON-LD with legacy JSON-LD unchanged; 12 negative-route shapes tagless; statutory suppressions; spoof/cookie/`?lang=` precedence; dark-launch isolation).
- **X1 RESOLVED:** no 404 in production now emits canonical or hreflang (locale-tree 404s by design; the legacy unknown-single-segment case is the documented behaviour change accepted at the #400/#401 merges; multi-segment unmatched paths unchanged). Existing routes otherwise preserved byte-identically.
- **C0/H0 remains approved for Phase 2B only** — the locale pages are live but **unlinked and unlisted**: zero locale sitemap entries, zero locale navigation links, root `/` unchanged, bare `/layaway` behaviour preserved, no Japanese layaway anywhere.
- Indexing status of the locale URLs: **nothing is claimed** — they are deliberately uncrawlable-by-omission (no links, no sitemap) until Phases 2C/2D; the Phase 1 noindex items remain SEARCH ENGINE RECRAWL PENDING.
- Phase 2C NOT STARTED. Master-plan numbering unchanged.

## OWNER REVIEW ITEM (Phase 2B PR): legacy single-segment 404 metadata

One legacy behaviour changed and it is **not pre-approved; it needs the owner's disposition at the Phase 2B PR review**. With `app/[lang]` present, an unknown single-segment URL (e.g. `/nonexistent-snapshot`) and an unknown-prefix URL over a wrapped family (e.g. `/foo/about`) now route into the locale segment and 404 through Next's error shell: status 404, `noindex` and title unchanged, the branded 404 still hydrates, but the previous (misleading) canonical, hreflang and `og:url` are no longer emitted, and the branded content moves from the initial HTML to the hydration payload. Every legacy **200** page is byte-identical (35-route snapshot), legacy missing-slug 404s were already tagless, and a multi-segment unmatched path (`/foo/bar`) keeps the old full-layout 404 (pinned by test). Restoring the old output is **not achievable with supported App Router mechanics** while `app/[lang]` exists (`dynamicParams = false` was tried and renders the same shell). This is the direction finding X1 prescribed and map §18.2 G describes for unknown locales, but C0/H0's "legacy output unchanged" wording makes it the owner's call: accept as the X1 closure (recommended), or require an alternative architecture. Merge of the 2B PR decides it.

- 2026-10-28: Phase 2B implemented under Gate A authorization (development and testing only), branch `seo/phase-2b-locale-routes`. 21 locale routes as thin wrappers over the legacy pages (`app/[lang]`), URL-authoritative `getLang` via middleware-owned `x-cj-lang`, cookie sync, SeoLinks locale skip, pure JSON-LD builder (`lib/json-ld.ts`), locale metadata helper, per-post language eligibility. Gates B-F evidence: 405 unit tests pass (22 new); typecheck/lint/terms/money/i18n green; production build with 21 `[lang]` routes; legacy snapshot 28/29 byte-identical (the 29th, an unknown single-segment 404, only lost its misleading canonical/hreflang — the approved design G / X1 closure; branded 404 still hydrates); Gate F matrix 310/310; legacy route checker 120 pass / 0 fail / **0 deferred** (X1 closed); browser pass clean (console, 375px, statutory suppressions, Option ii layaway links to bare `/layaway`, no Japanese layaway). Not pushed, not merged, not deployed; Phase 2C untouched (`lib/checkout-actions.ts` unchanged).
- 2026-10-28: Phase 2B closed as DEPLOYED — PRODUCTION VERIFIED (PR #401 / `bd28cc6`; checker 120/0/0; matrix 284/0). X1 resolved. Phase 2C approval package added (map §19). No route, navigation, sitemap, redirect, checkout or Hub change in this closeout.
- 2026-10-28: Phase 2C implemented locally under the development-and-testing authorization (uncommitted): OD-15 gating completion, OD-7 switcher links, OD-11 Hub-link localization, full locale-aware navigation, share/sign-out/revalidation, 16 new tests. Crawl 0×404 / 0 bare-public; legacy metadata unchanged. Opus review of checkout-actions pending at PR. Not committed, not deployed.
- 2026-10-29: SEO Step 1 (Master Plan §33.3) implemented (PR #429, develop `c6bec5c`) and released to production via PR #430 (main `2e18bcc`); production-verified, recrawl pending. No redirect, canonical, hreflang, route or Hub change.
- 2026-10-29: SEO Step 2 (Master Plan §33.3) merged (PR #432, develop `5533801`) and released to production via PR #433 (main `49c0fd6`); production-verified, recrawl pending. No redirect, canonical, hreflang, route, payment or Hub change.

## Step 3 — Performance (Master Plan §33.3): 3a DEPLOYED (benefit NOT confirmed in production lab runs); 3b and 3c AUDITED (2026-10-29; PR #435 → develop `04bf8c9`, released via PR #436 → main `81f9aa0`)

| Item | Status | Note |
|---|---|---|
| 3a Japanese heading font after load | DEPLOYED (scoped to `/ja` by PR #438, released via PR #439, main `59ad3b7`) | Noto Serif JP slices (37, 568 KB) no longer compete with the hero during load; mobile `/ja` 77 → 84, LCP 6.6 → 4.4 s (local A/B, 7 runs); CLS 0; English untouched. See `docs/seo/PERF-STEP3-FINDINGS.md`. |
| 3b Large collection payloads | AUDITED | 1.26 MB raw / 48 KB brotli (Rings); not the measured bottleneck; no change; options in the findings doc. |
| 3c Root-layout dynamic rendering and caching | AUDITED | Every public page is `private, no-store`; proposal only, high risk, own phase. |
- 2026-10-29: SEO Step 3a (Japanese heading font after load) merged (PR #435, develop `04bf8c9`) and released to production via PR #436 (main `81f9aa0`). Behaviour verified live; the lab performance gain seen on local builds was NOT reproduced in matched production Lighthouse runs; a tiny desktop-only font-induced re-wrap is recorded in QA report §11. No redirect, canonical, hreflang, route, payment or Hub change.
- 2026-10-29: Step 3a follow-up (branch `perf/step-3a-scope-jp-font-gate`, READY FOR QA, NOT DEPLOYED): the Japanese font gate is scoped to the Japanese home page to remove the desktop product-title re-wrap on listing pages; evidence in `docs/seo/PERF-STEP3-FINDINGS.md` §8.

## Step 3a final release (2026-10-29): scoped to the Japanese home page — DEPLOYED
PR #438 (develop `284b6dd`) released via PR #439 → `main` `59ad3b7`; Vercel production deployment `7415291347`. Only `/ja` carries `data-jp-defer` and the font gate; every other page loads the font as before Step 3a. Live QA and measurements: `docs/seo/SEO-QA-REPORT.md` §12. No performance gain is claimed (matched Lighthouse runs overlap); the 22 px desktop caption movement on Japanese Rings is gone (0 shifts in 24 fresh loads). Status: DEPLOYED; real-user effect NOT observed.

## Outstanding issues register
Five workstreams are tracked in `docs/seo/OUTSTANDING-ISSUES-REGISTER.md`; four are open and OG-PRODUCT is closed: BUG-03 article wording (OPEN — owner A/B decision pending), HUB-CATALOG catalog delete (LIVE — FIRST REAL DELETE PENDING: function and index deployed per the owner, no deletion yet), BUG-09 Search Console (OPEN — domain verified, sitemap Success with 976 discovered pages and the 3 priority URLs observed indexed on 2026-10-30; Page indexing and Performance reports still processing, so coverage counts and the performance baseline are pending), BUG-06 `/gold-guide` two-hop redirect (OPEN — deferred until owner-approved redirect work), OG-PRODUCT product sharing metadata (CLOSED — DEPLOYED AND VERIFIED LIVE 2026-10-30: PR #441 released via PR #442, main `95189746d`).

## OG-PRODUCT product-page OpenGraph (2026-10-30): CLOSED — DEPLOYED AND VERIFIED LIVE
**Current status (2026-10-30):**
- PR #441 (`fix/og-product-metadata`, code commit `c4791fd`) was merged into `develop` (merge commit `5f40f6b2f4718958d014e76fb1f24abce0ab5c92`).
- Release PR #442 (`develop` → `main`) was merged; production `main` is `95189746d18ef97a17b5d98dbe2c8a952330ddc0`.
- The Vercel production deployment (`7416880444`) was verified Ready.
- Twelve real product URLs (six products, English and Japanese) passed the live metadata checks.
- Twelve non-product pages passed the regression comparison (unchanged).
- Production SEO checker: 432 pass, 0 fail.
- Facebook Sharing Debugger (English and Japanese R2715): correct previews, one advisory warning (`fb:app_id` missing, a site-wide observation recorded in the register). A Messenger preview was not tested.
- **OG-PRODUCT: CLOSED — DEPLOYED AND VERIFIED LIVE.** Evidence: `docs/seo/SEO-QA-REPORT.md` §13 and §14.

**Pre-release status (kept for the record; superseded by the current status above):** PR #441 restored the site name, type, locale pair and canonical-equal `og:url` on product pages, kept the product's own title, description, photo and Twitter metadata, and added a brand-image fallback for a product with no usable photo (simulated; no such real product is known). At that time it was not merged and not deployed, and a real-Hub preview comparison was not yet possible: Vercel builds no preview for a feature branch and develop previews are SSO-protected. That limitation applied before the merge only and is not a current blocker; once PR #441 was merged into `develop`, the develop preview was checked through the owner's signed-in session (QA report §13 records the limits at that time).
- 2026-10-30: OG-PRODUCT released (PR #442, `develop` → `main`, merge `95189746d`, Vercel production deployment `7416880444`) and verified live on production: 12 of 12 baseline product URLs pass every check, 12 of 12 non-product sample pages unchanged, production SEO checker 432 pass / 0 fail. Closed. A separate observation (fb:app_id and og:url absent on other locale pages) is recorded in the register, not acted on.
- 2026-10-30: First Search Console baseline read (Domain property `chajewelsjp.com`, UI-read, read-only, no indexing requested): verified owner; sitemap `sitemap.xml` Success, 976 discovered pages (equals the 976 URLs the live sitemap lists); `/en`, `/ja`, `/en/layaway` indexed per Google's stored status; 8 sampled deeper URLs not yet indexed (6 discovered, 2 unknown); Page indexing and Performance reports "Processing data" — **NO PERFORMANCE BASELINE AVAILABLE YET**; no P0/P1 finding. Report: `docs/seo/SEARCH-CONSOLE-BASELINE-2026-10-30.md`. BUG-09 stays open.
- 2026-10-30: Step 4 (Hub-managed content) AUDITED — OWNER APPROVAL PENDING; not implemented. Read-only audit of 12 collections, 5 categories (EN+JA), all 453 English products, 16 products in both languages [originally written as "14 sampled"; corrected in the 2026-10-30 correction entry below] and the BUG-03 article; report `docs/seo/STEP-4-CONTENT-AUDIT.md` (one P0 product-condition finding, P1/P2/P3 content findings, exact bilingual A/B sheet for BUG-03, Hub field map, owner decisions OD-S4-1..10). No Hub write, no code change, no content edited. BUG-03 stays OPEN; all other statuses unchanged.
- 2026-10-30: Step 4 correction pass (PR #445 follow-up, docs only). Sample count corrected: the audit script made 14 picks but N1616 matched two rules, so 13 unique class samples plus 6 evidence extras = 19 individually inspected products; 16 verified in both EN and JA (3 extras were English-only); the 453-page English crawl is unchanged. The owner manually set C0853 and W0531 to Preloved in the Hub; live EN+JA re-fetch confirmed HTTP 200, unchanged slugs/canonical/hreflang, Preloved badge and `UsedCondition` JSON-LD, so audit finding P-01 (originally P0) is RESOLVED BY OWNER; VERIFIED LIVE. Step 4 remains AUDITED — OWNER APPROVAL PENDING (all other findings and OD-S4-2..10 open); BUG-03 stays OPEN; no Hub/code/content change by this pass; all other statuses unchanged.
- 2026-10-30: Step 4 owner decision package prepared (`docs/seo/STEP-4-OWNER-DECISIONS.md`, docs only): OD-S4-2..10 plus the 10-piece pilot as approval sheets with exact EN/JA text and evidence tags; two proposed metal lists from the audit (C-06, C-07) corrected against product names. Nothing approved or implemented; Step 4 remains AUDITED — OWNER APPROVAL PENDING; BUG-03 stays OPEN; all other statuses unchanged.
