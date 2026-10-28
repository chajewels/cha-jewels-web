# Cha Jewels SEO Implementation Status

**Last updated:** 2026-10-28 (Phase 2B DEPLOYED — PRODUCTION VERIFIED via PR #401 / `bd28cc6`; Phase 2C awaiting owner approvals)
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
| 2 | `/en` and `/ja` URL architecture | 2A DEPLOYED (Release 0); **2B DEPLOYED — PRODUCTION VERIFIED (PR #400 → release PR #401, merge `bd28cc6`, 2026-10-28)**; 2C NOT STARTED (approval package below); 2D-2E NOT STARTED | Planning in `SEO-MIGRATION-MAP.md`; Phase 2A record below. **No route, redirect, canonical target, hreflang target, sitemap route or internal-link destination has been changed.** Not IMPLEMENTING. Gates 2A-2E defined (map §15). OD-13 and OD-14 resolved as technical conventions; OD-5 merged into OD-1; the remaining owner decisions are in map §14 |
| 3 | `/en/layaway` | BLOCKED | Depends on Phase 2B and 2C; bare `/layaway` unchanged. Phase 3 creates and validates `/en/layaway`, then repoints the English layaway links (Phase 2C leaves them on `/layaway`, Option ii) |
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

## Change log

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
