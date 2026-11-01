# SEO master plan — requirements-to-delivery matrix (2026-11-01)

**Batch:** SEO master-plan completion, branch `seo/master-plan-completion` (worktree `../cha-jewels-web-seo-complete`), base `develop` `47ffc77` (= PR #460 merged; production `main` `9518974`). **Scope:** every phase, priority, §33.3 step, requirement and outstanding issue of `CHA-JEWELS-SEO-MASTER-PLAN.md`, reconciled against the source tree, production and the records on 2026-11-01. One row per requirement; the register `SEO-REQUIREMENTS-REGISTER.md` keeps the long form (R-xx ids are its rows).

**Status words:** NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE · CLOSED · OWNER DECISION PENDING. **Kind:** *source* (this repository), *content* (Hub text, owner-operated), *external* (owner, Google, third parties). **Evidence tags:** [V] verified by the method named on 2026-11-01; [O] owner-reported; [U] unverified.

**Preflight facts [V 2026-11-01]:** no open PR; `develop` `47ffc77` carries #452 (foundation), #455/#456 (security batch 1), #458 (React #418 fix) and #460 (loader hardening + records); `main` `9518974` (OG-PRODUCT release) has none of them; the develop preview is SSO-gated (302) and no automation bypass secret or Hub API key exists in this session (`.env.local` fixtures mode); the live sitemap lists 976 URLs (453 products × 2, 12 collections × 2, 5 categories × 2, 1 post × 2, statics, `/en/layaway`, `/`), 906 image entries, 8 `lastmod`; the four Step 4 collection descriptions and the two category descriptions are still the pre-approval text live; the Notion connector is unauthenticated (manifest instead: `NOTION-SEO-UPDATE-MANIFEST-2026-11-01.md`).

**Correction batch (2026-11-01, review of `d0b3b5f`, same PR #462):** (1) Search Console helper: malformed metrics refused instead of zeroed, absent terms ABSENT not zero, property totals separated from disclosed-row sums, hosts classified (only `https://www.chajewelsjp.com` is a site page), export selection and comparison context validated, no unobserved finding prefilled — 11 tests, 8 failing on `d0b3b5f`. (2) Merchant builder: identifiers are evidence from an explicit rule (with no rule the feed is empty), unknown status/condition/slug/duplicates are recorded exclusions, reconciliation is exact membership, the Website API's completeness limit is stated (OD-MC-12); the route stays PROPOSED — 12 tests, 4 failing on `d0b3b5f`. (3) `llms.txt`: the recorded contract "every link returns 200 and is indexable" is now checked by FETCHING every advertised link in both checkers (`llms-links` rows), not by sitemap membership — 2 core tests failing on `d0b3b5f`. (4) R-30/R-31 guide and trust reviews performed (`GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md`, OD-CT-1..6); R-19 product-video inventory kept UNKNOWN; statuses reconciled below. (5) Attribution design: consent classification withdrawn and stated as undecided (default consent-gated), metrics defined exactly, two marked NOT MEASURABLE. (6) How the exact head obtains a deployment: runbook §2 step 2 (a bypass secret opens a deployment, it does not create one; Vercel builds only `develop` and `main`). Results on the corrected head: QA §17.

## A. Foundation and final technical acceptance

| Ref | Requirement | Current state | Remaining | Owner / kind | Evidence |
|---|---|---|---|---|---|
| R-01 | Baseline checker at 0 fail | Local build of this head: raw **671/0**, DOM **685/0** (desktop + phone-375, 0 hydration events) [V]; production `main`: 555/110 — the 109 pre-#452 rows plus the not-yet-deployed `/llms.txt` row, exactly as expected before the release [V] | re-run on the pinned candidate and after release | source | `SEO-QA-REPORT.md` §16 |
| R-06 / R-15 | 404 hygiene, og:url, fb:app_id (foundation batch) | Merged in `develop` (#452) and re-verified on this head; **not released** | release of `develop` → `main` (owner); post-release production run | source | QA §15, §16 |
| A-1 | Redirect status codes and chains, canonical/hreflang/og:url consistency, robots meta and x-robots-tag, cache no-store on 307s, language routing without cookies, sitemap validity/eligibility/duplicates/origin, raw HTML vs hydrated DOM, readiness and failed-request accounting, desktop and actual 375 px, client navigation, missing resources | All covered by the two checkers on the local build of the corrected head (QA §17) [V]. **On a deployment: NOT RUN** — no deployment of this head exists (Vercel builds only `develop` and `main`; the PR's Vercel comment: "1 Skipped Deployment — Ignored") and no bypass secret is in the environment | a deployment of the exact head per runbook §2 step 2 (merge while `develop` is still `47ffc77`, tree equality proved; or owner CLI deploy), then one credentialed run | source + owner (deployment, access) | §17 |
| A-2 | Real-Hub data acceptance on a deployment | BLOCKED (two external facts): no deployment of this head can exist before the owner merges or deploys it (runbook §2 step 2), and no `VERCEL_AUTOMATION_BYPASS_SECRET` or `HUB_API_KEY` is in the session. The owner-approved equivalent method was last run on `2e83545` (`PREVIEW-ACCEPTANCE-2026-10-31.md` §6); `47ffc77` is a new runtime | owner: deployment (O-2a) then the secret in the environment once per candidate (never in chat), or re-approval of the equivalent method | external | Owner actions O-1, O-2 |
| R-37 | Rollback-mode duplicate og:url on a bare product page | **CLOSED in this batch**: the product OpenGraph block no longer names a URL; the locale wrapper adds og:url from the canonical (identical output on `/en` and `/ja`); rollback checker **10/0/0 deferred** [V] | release | source | `lib/product-seo.ts`, `scripts/check-seo-rollback.mjs` |
| D1 (React #418) | Hydration error | Fix merged (#458, #460) and 0 events on this head's local DOM run [V]; **not verified on a deployment** | verify on the pinned candidate, then retire OD-F1 | source + owner | acceptance record §6.9 |

## B. Crawlability, indexing and URL governance

| Ref | Requirement | Current state | Remaining | Owner / kind |
|---|---|---|---|---|
| R-05 | robots.txt and private/utility noindex | DEPLOYED; live robots matches policy [V] | signed-in renders of `/account`, `/checkout`, `/loyalty/join` (X6) — manual, owner test account | source (done) / external |
| R-07 | Sitemap coverage and truthful `lastmod` | DEPLOYED; 976 URLs, 8 `lastmod` by design (no deploy-time proxy) [V] | none; `lastmod` only if the Hub supplies a content-modified timestamp | source (done) |
| R-08 / R-09 | Locale routes, canonical, reciprocal hreflang | DEPLOYED, re-verified [V] | none | source (done) |
| R-10 / R-11 / BUG-06 | Permanent redirects (308 promotion), root `/` vs `/ja` duplicate (OD-3), `?lang=`, bare `/layaway` (OD-6), `/gold-guide` two hops | OWNER DECISION PENDING; gated on populated Search Console Pages data (processing) | owner decision, then a dedicated high-risk branch with the redirect matrix test | external then source |
| R-12 | `/en/layaway` indexable; `/ja/layaway` never | DEPLOYED; OBSERVED IN SEARCH CONSOLE (2026-10-30) [V earlier] | none | done |
| B-1 | Valid, missing, unavailable-language and malformed routes | 132 404 shapes × 2 contexts clean on this head [V] | release | source (done) |
| X10 / OD-MC-9 | Sold-product sitemap and feed policy | KEEP (D3); feed sends `out_of_stock` by design | per-product review needs Search Console page data (not yet populated) | owner decision later |
| R-36 / GSC-09 | `portal.` and `paymenthub.` subdomains crawlable | OWNER DECISION PENDING (Hub / Firebase workstream, not this repository) | owner policy | external |

## C. Structured data and sharing

| Ref | Requirement | Current state | Remaining | Owner / kind |
|---|---|---|---|---|
| R-17 | JewelryStore, Product, BreadcrumbList, FAQPage, BlogPosting, ItemList | DEPLOYED; live samples re-read [V] | — | done |
| C-1 | **Product Offer = visible content** (price, availability, variant) | **Verified code-level defect, fixed in this batch:** the Offer named the lowest variant price and the whole product's stock while the page renders `product_variants[0]`; now the Offer is the displayed variant's price (sale price while on sale) and availability through the page's own `variantAvailability` rule. Tests fail against the old builder. Prevalence of multi-variant pieces in the live catalog: [U] (needs the Hub API) | release; SEARCH ENGINE RECRAWL PENDING after | source |
| C-2 | Deferred JewelryStore / OnlineStore / Organization type review | **AUDITED in this batch** (`phase-4/STRUCTURED-DATA-REVIEW-2026-11-01.md` §1): Google recommends `OnlineStore` for an ecommerce site and reserves `LocalBusiness` subtypes for a physical store; the office receives no customers (OD-GBP-1 = No). Recommendation prepared; **no change made** (protected asset; owner decision OD-SD-1) | owner decision; then a one-line builder change with tests | source after decision |
| C-3 | aggregateRating / review | Builder emits only approved, visible reviews; no approved product review exists yet [V] | none | done |
| C-4 | shippingDetails / hasMerchantReturnPolicy | Not emitted by owner decision (R-1/S-1); unchanged | revisit only with Merchant Center (MC-G13) | owner |
| R-14 / R-15 | OG/Twitter identity, actual shared images | Products DEPLOYED (#441); locale tree in `develop` (#452) | release | source (done) |
| R-19 | Video metadata and eligibility | **ASSESSED for the three inventoried site videos** (hero film, About logo film, artisan tile: decorative loops, not eligible; review §3). **Product-video inventory UNKNOWN** — count and content unreadable without the Hub API; not assessed, not closed | read-only API count and a per-video look when a key is available; `VideoObject` only if a video is a page's main watchable content | source (open, Hub access) |
| R-18 | Image SEO (Hub alt/captions) | PARTIAL: image sitemap 906 entries; alt from Hub `product_media.alt` where present | Hub image fields: owner decision with R-26 | content |
| C-5 | EN/JA template consistency | Checker parity on every template in both languages [V] | — | done |

## D. Performance and Core Web Vitals

| Ref | Requirement | Current state | Remaining | Owner / kind |
|---|---|---|---|---|
| R-21 | Step 3a (Japanese heading font) | DEPLOYED; no production gain confirmed | — | done |
| R-22 | Steps 3b (large listings) and 3c (root-layout caching) | AUDITED; **no owner scoping** (gate: scoping + measured need) | owner scopes; then a dedicated branch with matched before/after mobile runs | owner then source |
| D-1 | Reproducible lab baseline for before/after | Lighthouse 13.6 mobile single runs on four production pages taken 2026-11-01 (QA §16 table); lab only, single run, not field data | repeat as the "before" of any approved step; 3 runs median | source (done) |
| D-2 | Real-user measurement readiness | Vercel Speed Insights mounted (`SpeedInsightsProvider`) [V]; Search Console Core Web Vitals report still processing [V earlier] | owner reads CWV in Search Console on the planned dates | external |
| D-3 | Responsive image sizing and priority, fonts, hydration, third-party loading | Covered by Steps 1 and 3a; no new defect found by the DOM checker (0 failed requests, 0 console errors) | — | done |

## E. Collections, categories, products and content

| Ref | Requirement | Current state | Remaining | Owner / kind |
|---|---|---|---|---|
| R-23 | Step 4 Hub-managed content (OD-S4-3/4 texts, OD-S4-6/7/9, pilot) | AUDITED — OWNER APPROVAL PENDING; **live re-check 2026-11-01: none of the six listing texts applied** (necklaces, rings, other-accessories, pendants, preloved-jewelry, fine-jewelry still show the old descriptions) [V] | owner publishes per `STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md` (complete package: fields, backups, steps, verification, rollback); Site verifies after | content |
| R-24 | BUG-03 article wording | Out of SEO scope (owner); not applied [V earlier] | owner | content |
| R-26 | Phase 6 commercial landing pages and Hub SEO fields | AUDITED; OD-P6-1..9 pending (no `kihei`/`diamonds` collection; Hub SEO fields a draft) | owner decisions; Hub implements fields; Site renders in a later batch | external / content / source later |
| R-26 add-on | **`llms.txt`** | **IMPLEMENTED → READY FOR QA:** `app/llms.txt/route.ts` + `lib/llms-txt.ts`; text/plain; links drawn from the sitemap sources (shared static list `lib/sitemap-pages.ts`, Hub collections and categories); no product list, no figure; Japanese section never links layaway. **Contract verification (corrected):** both checkers FETCH every advertised link and require 200, `text/html`, no noindex (header or meta) and one self canonical (`llms-links`, one row per link) — on the local fixtures build every link passes (QA §17) [V]; **on real data and on a deployment: NOT RUN** (the collection and category links are real Hub rows only there). Sitemap membership is checked separately and is not acceptance. Stated deviations from the recorded rules: "static file" is met as a prerendered, 60 s-revalidated response rather than a file in `public/` (so a renamed collection follows the sitemap); "built after the Phase 6 URLs are final" is not met — Phase 6 routes do not exist (OD-P6 pending), the file follows the sitemap source and must be re-verified when they land | release; credentialed run with real data; re-verify after any Phase 6 route | source |
| R-27 / R-28 | Kihei and K18 pillars and clusters | AUDITED, drafts only; route family `/en/guides/*` needs OD-P6-5 + editorial approval | owner approvals; then implement the family in a dedicated batch | external then source |
| R-29 | Filipino / Taglish | AUDITED; options open (Taglish Hub posts recommended, no route) | owner chooses after Search Console evidence (R9 rule) | external |
| R-30 / R-31 / R-32 | Guides, trust content, question-query method | **R-30, R-31 AUDITED in the correction batch** (`GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md`): terminology PASS with four un-guarded near-misses; no fabricated review, rating or count; two universal claims and one offer claim exceed the evidence in the repository; the plan §24 trust pages do not exist (Phase 6 content). R-32: a method; `scripts/gsc-report.mjs` operationalises §20 and R1–R10 (corrected) | owner wording decisions OD-CT-1..6 (no copy changed); §24 pages with Phase 6 | content (owner) |
| R-20 / E-1 | Internal links, breadcrumbs, navigation discoverability; product reverse-linking block | Step 1 DEPLOYED. The reverse-linking "Learn more" block (`phase-6/INTERNAL-LINKING-MAP.md` §3) is **proposed copy** and is not shipped: owner approval of the link texts (OD-P6-10, proposed in the approval list) | owner approves wording; Site implements with a test per condition | content then source |
| E-2 | Approved origin clarifier and placements | Footer tagline (Hub) unchanged; 8C100 description still carries a made-in-country phrase (OD-S4-6 conditional item) [V] | owner (Hub text) | content |

## F. Merchant Center and feed (Phase 5)

| Ref | Requirement | Current state | Remaining | Owner / kind |
|---|---|---|---|---|
| R-25 | Feed implementation | **Pure builder implemented and corrected** (`lib/merchant-feed.ts`, 12 tests): one item per product = the displayed variant; identifiers only from an explicit `IdentifierRule` (none exists → every piece `identifier_unknown`, feed empty); unknown status/condition/slug and duplicate rows recorded as exclusions; exact-membership `reconcile()` with an optional authoritative total. **No route** (OD-MC-7 not given); the route code in `phase-5/MERCHANT-FEED-IMPLEMENTATION-PROPOSAL.md` §3 is PROPOSED, not behaviour that exists | owner: X8, OD-MC-1..11 incl. the identifier rule, OD-MC-12 (Hub total); then the route lands with the builder (one small batch) | source (builder done) / external |
| MC-G1 | Feed URL naming disagreement | Resolved in the proposal: `/api/merchant-feed/route.ts` serving `/api/merchant-feed` with `?lang=ja\|en` (one URL form, one route folder); OD-MC-7 confirms | owner confirms | external |
| MC-G2 | Stale X5 sentence in the readiness doc | **Corrected in this batch** (readiness §3) | — | done |
| MC-G3 | Account state, image-host crawl, `free_shipping_threshold`, category map | Account: [U] (X8). Image host: the Hub's Supabase public storage `pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/…` [V from live JSON-LD]; its robots policy [U]. Category map: 12 live collection slugs read [V]; jewelry ones mapped, non-jewelry left unmapped by design | owner: X8; Site: first-fetch Diagnostics | external |
| MC-G4 | Stale counts | Re-read 2026-11-01: 453 products in the sitemap (906 URLs); sold count [U] (needs the Hub API) | re-read at implementation with the API | source |
| MC-G5 | Sold-piece rule vs D3/X10 | `out_of_stock` while D3 stands (builder) | restate if D3 changes | owner |
| MC-G6 | `item_type` sent by production? | [U] in this session (no Hub API key); the builder maps `item_type === "Watch"` and the `preloved-watches` category to 201 either way | read-only API check when a key is available | source |
| MC-G7 | Identifier evidence per class | **Builder has no default:** the owner's rule (OD-MC-11) is a required input; without it nothing is sent; a rule answer that contradicts the Hub (no identifier for a branded piece, MPN without brand) is a recorded conflict, never sent | owner rule, then its code with a test per piece class | external then source |
| MC-G8 | Variant / price / landing-page agreement | **Closed by design:** one item per product describing `product_variants[0]`, the variant the page renders (same rule as the corrected JSON-LD Offer); test proves it | per-variant mode only after a variant-selectable page (owner) | done |
| MC-G9 | Freshness | Proposal: daily fetch 03:00 JST + the route's 60 s catalog cache; a sold piece is `out_of_stock` within one fetch; owner states the acceptable maximum age (OD-MC-8) | owner | external |
| MC-G10 | Full-catalog retrieval | **PARTIAL:** `reconcile()` enforces exact membership between two reads of the Website API (items + exclusions = slug list; nothing missing, extra, repeated or blank; no slugless row). **Not authoritative:** both reads share one table and one `limit=5000`, so a truncated read would agree with itself; the API exposes no total | **OD-MC-12** (Hub work item): a total count on the catalog read; `reconcile` already accepts `authoritativeTotal` | source (partial) + Hub |
| MC-G11 | Fetch failures | Proposal: 503 on any Hub failure or reconciliation problem, never an empty 200; cache only a complete feed (route code in the proposal, unit-testable with a mocked Hub) | route | source later |
| MC-G12 | Feed URL under `/api` (robots Disallow) | Google's crawl guidance page could not be read in this session (help id 404); recorded [U]; proposal keeps `/api/merchant-feed` and verifies on the first Merchant Center fetch, with the allow-list change as the fallback | first fetch | external + source |
| MC-G13 | Shipping and returns agreement | Published text re-read [V]: Japan ¥800 under ¥8,000 of pieces, free from ¥8,000 (`lib/content/shopping-guide.ts`); no change-of-mind returns, defects within five days (`lib/content/legal.ts`). The proposal's account-side package quotes exactly these; outside-Japan rates unpublished → no non-JP target | owner enters settings | external |
| F-1 | Account-side submission and setup | Complete owner package in the proposal §5 (what to enter, in what order, how to verify, how to roll back) | owner | external |

## G. Remaining content and growth phases

| Phase | Current state | Remaining | Owner / kind |
|---|---|---|---|
| 6 landing pages | AUDITED; `llms.txt` READY FOR QA (above) | OD-P6-1..9 | external |
| 7 Kihei | DRAFT | OD-P6-5 + editorial approval | external |
| 8 K18 | DRAFT | same | external |
| 9 Filipino | AUDITED; `description_tl` rendered nowhere (unchanged, needs a decision) | owner option after R9 evidence | external |
| 10 Local / Business Profile | CLOSED — NOT ELIGIBLE (OD-GBP-1 = No); entity signals via Phase 4/5/11 | — | closed |
| 11 Backlinks | AUDITED; execution materials added in this batch (`phase-11/AUTHORITY-OPPORTUNITIES.md` §8: pitch drafts and a tracking log template); no outreach sent | OD-AUTH-1..3; owner sends | external |

## H. Search Console and measurement

| Ref | Requirement | Current state | Remaining | Owner / kind |
|---|---|---|---|---|
| R-02 / BUG-09 | Property, sitemap, priority URLs | Verified; 3 URLs OBSERVED IN SEARCH CONSOLE (2026-10-30); coverage processing (2026-10-31) | **next read ~5 Nov and ~12 Nov (owner-run, read-only); not re-read today by design** (one day since the last read, report still processing) | external |
| R-03 | Weekly operations and the report helper | **`scripts/gsc-report.mjs` written and corrected in this PR** (11 tests on synthetic fixtures, which are not observations): Search Console's own CSV names and headers (fail loudly on a mismatch; the exact header names stay UNVERIFIED until the first real export), malformed metrics refused, absent terms ABSENT not zero, property totals (Chart) separated from disclosed-row sums, host-aware page classification, validated export selection and comparison context, R1–R10 on export rows only | owner: OD-SC-1..4; first real run on the next export | source (done) / external |
| H-1 | Branded vs disclosed non-brand vs undisclosed | Recorded in the 2026-10-31 baseline; the helper separates brand (§4.3) from the rest and never labels undisclosed rows | — | done |
| R-04 | Organic purchase/revenue attribution | **Design written and corrected** (`phase-12/ORGANIC-ATTRIBUTION-DESIGN.md`): first-touch source class joined to Hub-confirmed payments; metrics defined exactly in §2 (paid orders only, per currency, refunds netted as the Hub records them, layaway as starts, repeat within 365 days); organic add-to-cart and checkout start marked NOT MEASURABLE without a further tracking change (OD-ATTR-5); the consent classification is UNDECIDED and stated as the owner's/counsel's call, default consent-gated (OD-ATTR-3) | owner decisions OD-ATTR-1..5 before any tracking, Hub or policy change | external then source + Hub |
| H-2 | Analytics docs vs implementation | Reconciled: Vercel events, consent-gated Meta/Google Ads tags, no GA4, no source capture [V]; order creation ≠ payment (Hub authoritative) | — | done |

## I. Operations and documentation

| Ref | Requirement | Current state | Remaining |
|---|---|---|---|
| I-1 | Monitoring and regression checks | Two checkers + rollback checker + unit suite (652) + 7 guards; `SEO-OPERATIONS-RUNBOOK.md` written in this batch (cadence, commands, acceptance criteria) | run per cadence |
| I-2 | Release and rollback checklist | Runbook §2–3 (exact commands, pin the deployment, post-release checks, revert order) | owner release |
| I-3 | Temporary implementation removal criteria | Runbook §4: React #418 loader (remove when Next bundles react-dom ≥ 19.3; test turns red), `SEO_LEGACY_REDIRECTS` kill switch (remove at the 308 promotion), the root `/` sitemap exception (OD-3), the `single-language-posts` optional coverage | as each criterion is met |
| I-4 | Documentation consistency | Register, status, QA report, outstanding issues, readiness docs, master plan status lines updated in this batch | — |
| I-5 | Notion SEO records | Connector unauthenticated → `NOTION-SEO-UPDATE-MANIFEST-2026-11-01.md` for Codex | Codex applies |

## J. Consolidated owner / external actions (the ONE list)

Decisions and actions that only the owner (or an external party) can take. Nothing below is unfinished implementation; each is gated on the named person.

| # | Decision / action | What it unblocks | Recommendation |
|---|---|---|---|
| O-1 | Access for the fixed checkers on a deployment of the exact head: set `VERCEL_AUTOMATION_BYPASS_SECRET` in the session environment (never in chat) for the pinned deployment, or re-approve the equivalent method. A secret opens a deployment; it does not create one (see O-2a) | A-1/A-2 exact-deployment acceptance incl. phone-375 and real-data `llms-links` rows | supply once per candidate |
| O-2 | (a) **Create the deployment of this head:** approve merging PR #462 into `develop` while `develop` is still `47ffc77` (then the merge commit's tree equals the head's tree; proof command in runbook §2 step 2), or run `vercel deploy` of the checked-out head under the owner's login, or enable branch builds in the project settings; (b) after O-1 passes on that deployment, approve the release `develop` → `main` | everything READY FOR QA above; retires OD-F1 if #418 verifies on the candidate | (a) merge now, (b) release after the credentialed run |
| O-3 | OD-SD-1: keep `JewelryStore` or change the entity type to `OnlineStore` (review §1) | C-2 | `OnlineStore` (Google's recommendation for an ecommerce site without a visitable store) |
| O-4 | Step 4: publish the six listing texts per the checklist; confirm 8C100 wording, OD-S4-7, OD-S4-9, the pilot | R-23 | publish |
| O-5 | Merchant Center: answer X8 (account, verification, free listings); decide OD-MC-1..10; approve the route (OD-MC-7); **write the identifier rule per piece class (OD-MC-11) — without it the feed has no items**; confirm the shipping rate card and returns text (MC-G13, and the guide figures flagged in OD-CT-4) | Phase 5 route batch | JA-first, Option B route, account-level shipping |
| O-6 | Phase 6: OD-P6-1..9 (Kihei/diamonds collections, watches primary URL, Hub SEO fields, `/en/guides/*` family, no `/shop/*`, layaway guides deferred, Search Console query export, wholesale title) and OD-P6-10 (product "Learn more" link texts) | Phases 6–8 implementation | approve the field draft and the guides family |
| O-7 | Redirect stage: OD-1/3/4/6 (308 promotion, root, bare `/layaway`, `/gold-guide` one hop) once Search Console Pages data is populated | R-10/R-11/BUG-06 | decide after the 12 Nov read |
| O-8 | Search Console: OD-SC-1..4 (who exports, where reports live, API access later, thresholds); run the ~5 Nov and ~12 Nov reads; no indexing requests | R-03, R-02 | owner exports weekly; Site runs `scripts/gsc-report.mjs` |
| O-9 | Organic attribution: OD-ATTR-1..5 (design §6), including the consent decision with counsel (OD-ATTR-3) and whether add-to-cart / checkout-start metrics are wanted at all (OD-ATTR-5) | R-04 | decide the consent classification first; default consent-gated |
| O-10 | Performance: scope Steps 3b/3c or defer (R-22) | D | defer until field data exists |
| O-11 | Phase 9 option (Taglish Hub posts vs none) after R9 evidence; Phase 11 OD-AUTH-1..3; subdomain policy (R-36) | G, R-36 | as recorded |
| O-12 | Notion: Codex applies the manifest (corrected rows included) | I-5 | — |
| O-13 | Hub work item (Lovable): a total count on the catalog read (OD-MC-12) so the feed's completeness can be authoritative | MC-G10 | request with the Phase 5 route batch |
| O-14 | Content wording decisions from the guide/trust review: OD-CT-1..6 (`GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md` §5); no copy changes until decided | R-30, R-31 | decide with the Step 4 publication |
