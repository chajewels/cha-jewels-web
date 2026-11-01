# SEO documentation inventory — part B (18 of 36 documents), 2026-11-01

**What this is:** the read-only, row-by-row inventory of every actionable requirement, decision, dependency, gate and defect in 18 SEO documents, produced on 2026-11-01 from the working tree of PR #462 at `1b654f7` (with the reconciliation batch's uncommitted edits; documents are quoted, not interpreted). It is the source-to-matrix mapping evidence for `SEO-REQUIREMENTS-MATRIX-2026-11-01.md` §K–§L. `CONFLICT:` notes mark where two documents disagreed at the time; §L of the matrix records how each was resolved or labelled. Nothing here is a status of its own.

---

# Inventory B — actionable items in 18 SEO documents (read 2026-11-01, worktree `cha-jewels-web-seo-complete`)

Read-only inventory. Every row copies what the document says; nothing is interpreted or recommended. Column legend: ID (as written, or `none — "<quote>"`) · What it requires · Owner · Approval / decision state as stated · Dependencies / gates named · Evidence named · Current state word used · Remaining action per the document. `CONFLICT:` notes where two documents state different states for the same item. `UNVERIFIED` marks what I could not confirm from the documents themselves.

---

## 1. `docs/seo/SEO-REQUIREMENTS-MATRIX-2026-11-01.md`

(a) Requirements-to-delivery matrix for the SEO master-plan completion batch (branch `seo/master-plan-completion`, PR #462, base `develop` `47ffc77`, production `main` `9518974`). Date: 2026-11-01 (correction batch same day, review of `d0b3b5f`). Status words carried: NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE · CLOSED · OWNER DECISION PENDING; evidence tags [V]/[O]/[U].

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| R-01 | Baseline checker at 0 fail | source | — | release | local raw 671/0, DOM 685/0 [V]; production 555/110 [V]; `SEO-QA-REPORT.md` §16 | verified locally (not a status word) | re-run on pinned candidate and after release. CONFLICT: Manifest row "SEO foundation batch" says raw 728/0 on the corrected head; Matrix R-01 and §2 summary say raw 671/0 |
| R-06 / R-15 | 404 hygiene, og:url, fb:app_id (foundation batch) | source; owner (release) | merged in `develop` | release `develop`→`main` | #452; QA §15, §16 | merged, **not released** | release; post-release production run |
| A-1 | Full technical acceptance on a deployment (redirects, canonical/hreflang/og:url, robots, 307 cache, routing, sitemap, raw vs DOM, 375 px, client nav) | source + owner (deployment, access) | — | deployment of exact head (runbook §2 step 2); bypass secret | QA §17 [V] local; Vercel "1 Skipped Deployment" | covered locally; **on a deployment: NOT RUN** | deployment of exact head, then one credentialed run |
| A-2 | Real-Hub data acceptance on a deployment | external | — | O-1, O-2a; `VERCEL_AUTOMATION_BYPASS_SECRET`, `HUB_API_KEY` | `PREVIEW-ACCEPTANCE-2026-10-31.md` §6 (last run on `2e83545`) | BLOCKED | owner deployment then secret in environment, or re-approval of equivalent method |
| R-37 | Rollback-mode duplicate og:url on bare product page | source | — | release | `lib/product-seo.ts`, `scripts/check-seo-rollback.mjs`, rollback checker 10/0/0 [V] | **CLOSED** in this batch | release |
| D1 (React #418) | Hydration error fix | source + owner | — | pinned candidate | #458, #460; 0 events local DOM run [V]; acceptance record §6.9 | fixed, **not verified on a deployment** | verify on pinned candidate, then retire OD-F1 |
| R-05 | robots.txt and private/utility noindex | source (done) / external | — | owner test account | live robots matches policy [V] | DEPLOYED | signed-in renders of `/account`, `/checkout`, `/loyalty/join` (X6) — manual |
| R-07 | Sitemap coverage and truthful `lastmod` | source (done) | — | Hub content-modified timestamp (if ever) | 976 URLs, 8 `lastmod` [V] | DEPLOYED | none |
| R-08 / R-09 | Locale routes, canonical, reciprocal hreflang | source (done) | — | — | re-verified [V] | DEPLOYED | none |
| R-10 / R-11 / BUG-06 | 308 promotion, root `/` vs `/ja` (OD-3), `?lang=`, bare `/layaway` (OD-6), `/gold-guide` two hops | external then source | OWNER DECISION PENDING | populated Search Console Pages data | — | OWNER DECISION PENDING | owner decision, then dedicated high-risk branch with redirect matrix test |
| R-12 | `/en/layaway` indexable; `/ja/layaway` never | done | — | — | OBSERVED IN SEARCH CONSOLE 2026-10-30 [V earlier] | DEPLOYED; OBSERVED IN SEARCH CONSOLE | none. CONFLICT: Phase 3 report says READY FOR QA (not merged, not deployed); Phase 9 briefs say Phase 3 READY FOR QA in draft PR #416 (not deployed); Internal linking map says `/en/layaway` PROPOSED (Phase 3, X3); Commercial landing architecture says `/en/layaway` 404 + noindex on 2026-10-29 |
| B-1 | Valid, missing, unavailable-language and malformed routes | source (done) | — | release | 132 404 shapes × 2 contexts clean [V] | clean on this head | release |
| X10 / OD-MC-9 | Sold-product sitemap and feed policy | owner decision later | KEEP (D3) | Search Console page data | — | KEEP; feed `out_of_stock` by design | per-product review needs Search Console page data |
| R-36 / GSC-09 | `portal.` and `paymenthub.` subdomains crawlable | external | OWNER DECISION PENDING | Hub / Firebase workstream | — | OWNER DECISION PENDING | owner policy |
| R-17 | JewelryStore, Product, BreadcrumbList, FAQPage, BlogPosting, ItemList | done | — | — | live samples re-read [V] | DEPLOYED | —. CONFLICT: Phase 4 report status says READY FOR QA (branch not merged at its date) |
| C-1 | Product Offer = visible content (price, availability, variant) | source | — | release | `phase-4/STRUCTURED-DATA-REVIEW-2026-11-01.md` §2; tests fail on old builder; prevalence [U] | verified defect, fixed in this batch | release; SEARCH ENGINE RECRAWL PENDING after |
| C-2 | JewelryStore / OnlineStore / Organization type review | source after decision | owner decision OD-SD-1 pending | OD-GBP-1 = No (given) | review §1 | AUDITED; **no change made** | owner decision; then one-line builder change with tests |
| C-3 | aggregateRating / review | done | — | — | builder emits only approved, visible reviews [V] | done | none |
| C-4 | shippingDetails / hasMerchantReturnPolicy | owner | not emitted by owner decision (R-1/S-1) | MC-G13 | — | unchanged | revisit only with Merchant Center |
| R-14 / R-15 | OG/Twitter identity, actual shared images | source (done) | — | release | products #441 DEPLOYED; locale tree #452 in `develop` | products DEPLOYED; locale tree in `develop` | release |
| R-19 | Video metadata and eligibility | source (open, Hub access) | — | Hub API key | review §3 | ASSESSED for three site videos (not eligible); **product-video inventory UNKNOWN** | read-only API count and per-video look when a key is available |
| R-18 | Image SEO (Hub alt/captions) | content | owner decision with R-26 | — | image sitemap 906 entries | PARTIAL | Hub image fields: owner decision |
| C-5 | EN/JA template consistency | done | — | — | checker parity [V] | done | — |
| R-21 | Step 3a (Japanese heading font) | done | — | — | — | DEPLOYED; no production gain confirmed | — |
| R-22 | Steps 3b (large listings) and 3c (root-layout caching) | owner then source | **no owner scoping** | scoping + measured need | — | AUDITED | owner scopes; then dedicated branch with before/after mobile runs |
| D-1 | Reproducible lab baseline | source (done) | — | — | Lighthouse 13.6 mobile single runs 2026-11-01 (QA §16) | lab only, single run | repeat as "before" of any approved step; 3 runs median |
| D-2 | Real-user measurement readiness | external | — | planned dates | `SpeedInsightsProvider` [V]; Search Console CWV processing [V earlier] | mounted / processing | owner reads CWV in Search Console |
| D-3 | Responsive images, fonts, hydration, third-party loading | done | — | — | 0 failed requests, 0 console errors | done | — |
| R-23 | Step 4 Hub-managed content (OD-S4-3/4 texts, OD-S4-6/7/9, pilot) | content | AUDITED — OWNER APPROVAL PENDING | — | live re-check 2026-11-01: none of six listing texts applied [V]; `STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md` | OWNER APPROVAL PENDING | owner publishes per checklist; Site verifies |
| R-24 | BUG-03 article wording | content (owner) | out of SEO scope | — | not applied [V earlier] | out of scope | owner |
| R-26 | Phase 6 commercial landing pages and Hub SEO fields | external / content / source later | OD-P6-1..9 pending | no `kihei`/`diamonds` collection; Hub SEO fields a draft | — | AUDITED | owner decisions; Hub implements fields; Site renders later |
| R-26 add-on | `llms.txt` | source | — | release; real-data run; Phase 6 routes | `app/llms.txt/route.ts`, `lib/llms-txt.ts`, `lib/sitemap-pages.ts`; `llms-links` checker rows; QA §17 [V] fixtures | IMPLEMENTED → READY FOR QA; **on real data/deployment NOT RUN** | release; credentialed run with real data; re-verify after any Phase 6 route |
| R-27 / R-28 | Kihei and K18 pillars and clusters | external then source | needs OD-P6-5 + editorial approval | `/en/guides/*` approval | — | AUDITED, drafts only | owner approvals; implement family in dedicated batch |
| R-29 | Filipino / Taglish | external | options open | Search Console evidence (R9) | — | AUDITED | owner chooses after R9 evidence |
| R-30 / R-31 / R-32 | Guides, trust content, question-query method | content (owner) | OD-CT-1..6 pending | §24 pages with Phase 6 | `GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md`; `scripts/gsc-report.mjs` | R-30, R-31 AUDITED; R-32 a method (corrected) | owner wording decisions OD-CT-1..6 (no copy changed) |
| R-20 / E-1 | Internal links, breadcrumbs, nav; product reverse-linking "Learn more" block | content then source | OD-P6-10 proposed | owner approval of link texts | `phase-6/INTERNAL-LINKING-MAP.md` §3 | Step 1 DEPLOYED; block is **proposed copy**, not shipped | owner approves wording; Site implements with test per condition |
| E-2 | Approved origin clarifier and placements | content | OD-S4-6 conditional item | — | footer tagline unchanged; 8C100 made-in phrase [V] | unchanged | owner (Hub text) |
| R-25 | Merchant feed implementation | source (builder done) / external | OD-MC-7 not given; OD-MC-1..11, OD-MC-12 pending | X8, identifier rule, Hub total | `lib/merchant-feed.ts`, 12 tests; proposal §3 route PROPOSED | builder implemented and corrected; **no route** | owner decisions; then route lands with builder (one small batch) |
| MC-G1 | Feed URL naming disagreement | external | OD-MC-7 confirms | — | proposal | resolved in proposal (`/api/merchant-feed?lang=`) | owner confirms |
| MC-G2 | Stale X5 sentence in readiness doc | — | — | — | readiness §3 | corrected in this batch | — |
| MC-G3 | Account state, image-host crawl, `free_shipping_threshold`, category map | external | — | X8 | image host [V from live JSON-LD], robots [U]; 12 slugs [V] | account [U] | owner X8; Site first-fetch Diagnostics |
| MC-G4 | Stale counts | source | — | Hub API | 453 products (906 URLs) 2026-11-01; sold count [U] | re-read | re-read at implementation with API |
| MC-G5 | Sold-piece rule vs D3/X10 | owner | — | D3 | builder | `out_of_stock` while D3 stands | restate if D3 changes |
| MC-G6 | `item_type` sent by production? | source | — | Hub API key | builder maps Watch/preloved-watches → 201 | [U] | read-only API check |
| MC-G7 | Identifier evidence per class | external then source | OD-MC-11 rule required | owner rule | builder has no default | no rule → nothing sent | owner rule, then code with test per class |
| MC-G8 | Variant / price / landing-page agreement | done | — | variant-selectable page (future) | test proves displayed variant | **closed by design** | per-variant mode only after variant-selectable page |
| MC-G9 | Freshness | external | OD-MC-8 pending | — | proposal: daily 03:00 JST + 60 s cache | proposal | owner states acceptable max age |
| MC-G10 | Full-catalog retrieval | source (partial) + Hub | OD-MC-12 pending | Hub total count | `reconcile()` exact membership; `authoritativeTotal` accepted | PARTIAL | OD-MC-12 Hub work item |
| MC-G11 | Fetch failures | source later | — | route | proposal: 503, never empty 200 | proposal | route |
| MC-G12 | Feed URL under `/api` (robots Disallow) | external + source | — | first MC fetch | Google help page 404 [U] | [U] | first fetch; fallback allow-list change |
| MC-G13 | Shipping and returns agreement | external | — | — | `lib/content/shopping-guide.ts`, `lib/content/legal.ts` re-read [V] | published text re-read | owner enters settings |
| F-1 | Account-side submission and setup | external | — | — | proposal §5 package | package complete | owner |
| none — "Phase 6 landing pages" | Phase 6 landing pages | external | OD-P6-1..9 | — | — | AUDITED; `llms.txt` READY FOR QA | OD-P6-1..9 |
| none — "Phase 7 Kihei" | Kihei pillar/cluster | external | OD-P6-5 + editorial | — | — | DRAFT | approvals |
| none — "Phase 8 K18" | K18 pillar/cluster | external | same | — | — | DRAFT | approvals |
| none — "Phase 9 Filipino" | Filipino content option; `description_tl` rendered nowhere | external | needs a decision | R9 evidence | — | AUDITED | owner option after R9 evidence |
| none — "Phase 10 Local / Business Profile" | Business Profile | closed | OD-GBP-1 = No | — | — | **CLOSED — NOT ELIGIBLE** | —. CONFLICT (status word): GBP readiness doc header says AUDITED with the OD-GBP-1 = No update; Matrix and Manifest say CLOSED — NOT ELIGIBLE |
| none — "Phase 11 Backlinks" | Authority outreach | external | OD-AUTH-1..3 | — | `phase-11/AUTHORITY-OPPORTUNITIES.md` §8 | AUDITED; execution materials added; no outreach sent | owner sends |
| R-02 / BUG-09 | Search Console property, sitemap, priority URLs | external | — | — | 3 URLs OBSERVED IN SEARCH CONSOLE 2026-10-30; coverage processing 2026-10-31 | verified; processing | next read ~5 Nov and ~12 Nov (owner, read-only) |
| R-03 | Weekly operations and report helper | source (done) / external | OD-SC-1..4 pending | first real export | `scripts/gsc-report.mjs`, 11 tests (synthetic); header names UNVERIFIED | written and corrected | owner OD-SC-1..4; first real run on next export |
| H-1 | Branded vs disclosed non-brand vs undisclosed | done | — | — | 2026-10-31 baseline | done | — |
| R-04 | Organic purchase/revenue attribution | external then source + Hub | OD-ATTR-1..5 pending; consent UNDECIDED | — | `phase-12/ORGANIC-ATTRIBUTION-DESIGN.md` | design written and corrected | owner decisions before any tracking/Hub/policy change |
| H-2 | Analytics docs vs implementation | done | — | — | reconciled [V] | done | — |
| I-1 | Monitoring and regression checks | source | — | — | two checkers + rollback + unit 652 + 7 guards; `SEO-OPERATIONS-RUNBOOK.md` | written | run per cadence |
| I-2 | Release and rollback checklist | owner | — | — | runbook §2–3 | written | owner release |
| I-3 | Temporary implementation removal criteria | source | — | each criterion | runbook §4 | written | as each criterion is met |
| I-4 | Documentation consistency | — | — | — | updated in this batch | done | — |
| I-5 | Notion SEO records | Codex | — | connector unauthenticated | `NOTION-SEO-UPDATE-MANIFEST-2026-11-01.md` | manifest produced | Codex applies |
| O-1 | Set `VERCEL_AUTOMATION_BYPASS_SECRET` for pinned deployment or re-approve equivalent | owner | pending | O-2a | — | pending | supply once per candidate |
| O-2 | (a) create deployment (merge PR #462 while `develop` is `47ffc77`, CLI deploy, or branch builds); (b) approve release `develop`→`main` | owner | pending | O-1 | runbook §2 step 2 | pending | (a) merge now, (b) release after credentialed run |
| O-3 | OD-SD-1 keep `JewelryStore` or change to `OnlineStore` | owner | pending | — | review §1 | pending | decide (recommendation `OnlineStore`) |
| O-4 | Step 4: publish six listing texts; confirm 8C100, OD-S4-7, OD-S4-9, pilot | owner | pending | — | checklist | pending | publish |
| O-5 | Merchant Center: X8, OD-MC-1..10, OD-MC-7, OD-MC-11 identifier rule, MC-G13 rate card/returns, OD-CT-4 figures | owner | pending | — | — | pending | decide (JA-first, Option B, account-level shipping) |
| O-6 | Phase 6: OD-P6-1..9 and OD-P6-10 | owner | pending | — | — | pending | approve field draft and guides family |
| O-7 | Redirect stage OD-1/3/4/6 | owner | pending | Search Console Pages data | — | pending | decide after 12 Nov read |
| O-8 | Search Console OD-SC-1..4; ~5 Nov and ~12 Nov reads; no indexing requests | owner | pending | — | — | pending | owner exports weekly; Site runs helper |
| O-9 | Organic attribution OD-ATTR-1..5 incl. consent with counsel | owner | pending | — | design §6 | pending | decide consent first; default consent-gated |
| O-10 | Performance: scope Steps 3b/3c or defer (R-22) | owner | pending | field data | — | pending | defer until field data exists |
| O-11 | Phase 9 option; Phase 11 OD-AUTH-1..3; subdomain policy (R-36) | owner | pending | R9 evidence | — | pending | as recorded |
| O-12 | Notion: Codex applies manifest | Codex | — | — | manifest | pending | — |
| O-13 | Hub work item (Lovable): total count on catalog read (OD-MC-12) | Lovable | pending | — | — | pending | request with Phase 5 route batch |
| O-14 | Content wording decisions OD-CT-1..6 | owner | pending | — | `GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md` §5 | pending | decide with Step 4 publication |

---

## 2. `docs/seo/NOTION-SEO-UPDATE-MANIFEST-2026-11-01.md`

(a) Manifest of Notion card property updates for Codex to apply (connector unauthenticated); PR #462, head `d0b3b5f` corrected same day. Date: 2026-11-01. Status words carried: READY FOR QA, DEPLOYED, CLOSED, AUDITED, IMPLEMENTED, PROPOSED ONLY, OWNER DECISION PENDING, IMPLEMENTING, OWNER APPROVAL PENDING, DOCUMENTED, HOLD.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| R-06, R-15 (card "SEO foundation batch") | og:url, 404 hygiene, fb:app_id released | owner O-2a, O-1, O-2b | pending | deployment of exact head; credentialed run; release | `SEO-QA-REPORT.md` §17; raw 728/0 | READY FOR QA (in `develop` since #452; not released) | deployment, credentialed run, release. CONFLICT: see Matrix R-01 (671/0 vs 728/0) |
| none — card "Phase 4 structured data" | Offer = displayed variant; type review; video eligibility | owner O-3 | OD-SD-1 pending | release | `phase-4/STRUCTURED-DATA-REVIEW-2026-11-01.md` | DEPLOYED + one correction READY FOR QA | release; OD-SD-1; product-video inventory (R-19 open) |
| R-37 (card) | rollback duplicate og:url | — | — | — | `scripts/check-seo-rollback.mjs`; 10/0/0 | CLOSED | — |
| none — card "Phase 5 Merchant Center" | builder, route approval, account setup | owner O-5, O-13 | X8, OD-MC-1..11, OD-MC-7, OD-MC-12 pending | — | `phase-5/MERCHANT-FEED-IMPLEMENTATION-PROPOSAL.md` | AUDITED → builder IMPLEMENTED and corrected (READY FOR QA); route PROPOSED ONLY; account OWNER DECISION PENDING | owner decisions; MC-G10 PARTIAL; MC-G12 unverified |
| none — card "Phase 6 commercial landing pages" | `llms.txt`; Phase 6 decisions | owner O-6 | OD-P6-1..10 pending | release; real-data link verification | matrix §E; `app/llms.txt/route.ts`, `lib/llms-txt.ts`, `lib/sitemap-pages.ts`; 4 tests | AUDITED; `llms.txt` READY FOR QA | OD-P6-1..10; release; real-data verification |
| none — card "Phase 7 Kihei / Phase 8 K18" | pillar/cluster approval | owner O-6 | OD-P6-5 + editorial approval | — | `phase-7/*`, `phase-8/*` | AUDITED (drafts) | approvals |
| none — card "Phase 9 Filipino" | option choice | owner O-11 | pending | R9 evidence | `phase-9/FILIPINO-CONTENT-BRIEFS.md` | AUDITED | option choice after R9 evidence |
| none — card "Phase 10 Business Profile" | — | — | OD-GBP-1 = No | — | OD-GBP-1 | CLOSED — NOT ELIGIBLE | — |
| none — card "Phase 11 authority" | outreach materials | owner O-11 | OD-AUTH-1..3 pending | — | `phase-11/AUTHORITY-OPPORTUNITIES.md` §8 | AUDITED + execution materials; nothing sent | owner sends |
| BUG-09 (card "Phase 12 / BUG-09 Search Console") | helper corrected; attribution design corrected | owner O-8, O-9 | OD-SC-1..4, OD-ATTR-1..5 pending | ~5 Nov and ~12 Nov reads | `phase-12/ORGANIC-ATTRIBUTION-DESIGN.md`, `phase-12/SEARCH-CONSOLE-OPERATIONS.md` §7, `SEO-OPERATIONS-RUNBOOK.md` | IMPLEMENTING | reads; decisions; header names unverified until first export |
| none — card "Step 3 performance (3b/3c)" | owner scoping | owner O-10 | pending | — | `SEO-QA-REPORT.md` §16 | AUDITED | owner scoping |
| R-30, R-31 (card "Guides and trust content") | wording decisions | owner O-14 | OD-CT-1..6 pending | §24 trust pages with Phase 6 | `GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md` | AUDITED (review performed 2026-11-01) | OD-CT-1..6 |
| none — card "Step 4 Hub content" | publish six listing texts | owner O-4 | OWNER APPROVAL PENDING | — | `STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md`; live re-check 2026-11-01 unapplied | AUDITED — OWNER APPROVAL PENDING | owner publishes per checklist |
| R-10/R-11/BUG-06, OD-1/3/4/6 (card "Redirect stage") | redirect decisions | owner O-7 | OWNER DECISION PENDING | Search Console Pages data | matrix §B | OWNER DECISION PENDING | decision after Pages data |
| I-1..I-5 (card "Operations") | runbook | — | — | — | `SEO-OPERATIONS-RUNBOOK.md` | DOCUMENTED | — |
| none — "Parent SEO summary (replace the status paragraph)" | Codex replaces the parent summary paragraph | Codex | — | O-1, O-2 | unit 652/652; raw 671/0; DOM 685/0; rollback 10/0/0; production 555/110 | release HOLD | apply; nothing claimed indexed beyond three URLs observed 2026-10-30 |

---

## 3. `docs/seo/phase-3/PHASE-3-REPORT.md`

(a) Phase 3 layaway indexing report (`/en/layaway`), branch `seo/phase-3-layaway-indexing` from `develop` `4dc3c23`. Date of checks: 2026-10-29. Status words carried: READY FOR QA (implemented and locally verified; not merged, not deployed; nothing claimed indexed); SEARCH ENGINE RECRAWL PENDING (future).

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — "Crawlable permanent URL `/en/layaway`, HTTP 200" | route exists, 200 | source | P3-1 route approval needed | — | `app/[lang]/layaway/page.tsx` | Done: Yes | owner review; deploy. CONFLICT: Matrix R-12 says DEPLOYED / OBSERVED IN SEARCH CONSOLE |
| none — "Self canonical" | self canonical | source | — | — | `localizedMeta(() => "/layaway", ownMeta, () => LAYAWAY_ELIGIBILITY)` | Done: Yes | — |
| none — "Correct hreflang: `en` + x-default, no `ja`" | hreflang rule | source | — | — | `LAYAWAY_ELIGIBILITY` in `lib/layaway-availability.ts` | Done: Yes | — |
| none — "English SEO title and description" | title/description | source | P3-2 wording | `check:layaway-ja` | `dict.meta.layaway` | Done: Yes | owner may reword |
| none — "Unique H1" | distinct H1 | source | — | — | `dict.layawayPage.h1` | Done: Yes | — |
| none — "Layaway explanation and current terms" | preserved | source | — | no figure computed | `home.lay*` | Unchanged, preserved | — |
| none — "Working calculator" | preserved | source | — | Hub quote | `LayawayPiecePicker` / `LayawayCalculator` | Unchanged, preserved | — |
| none — "FAQ" | Hub FAQ section narrowed + FAQPage JSON-LD | source | — | — | `getFaq()` | Done: Yes | — |
| none — "Internal links" | links to FAQ, guides, collections, product cards | source | — | — | — | Done: Yes | — |
| none — "Product examples" | reservable pieces with Hub down payments | source | — | — | "Pieces you can reserve today" | Unchanged, preserved | — |
| none — "Sitemap inclusion after route validation" | `/en/layaway` listed once | source | P3-1 | — | `app/sitemap.ts`, `LAYAWAY_LANGS` × `localePath` (second commit) | Done: Yes | — |
| none — "Repoint the Option ii exception links" | header, tab bar, account, Why page, Hub links → `/en/layaway` | source | — | — | `L("/layaway")`, `localePath`, `localizeAuthoredHref` | Done: Yes | — |
| none — "Remove the bare-`/layaway` cookie dependency" | remove PR #410 mitigation | source | — | — | `lib/layaway-language-sync.ts`, component and test removed | Done: Yes | — |
| OD-6 (P3-3) | Bare `/layaway` → 308 `/en/layaway` | owner | **NOT approved and NOT implemented** | `/en/layaway` production-verified and observed in Search Console | redirect test pins `/layaway` absent from `STATIC_PAGES` | not in this PR | recommend (a) from the map after observation |
| none — "No `/ja/layaway`" | wrapper cannot produce it | source | — | — | verified 404, no canonical/hreflang | verified | — |
| OD-7 | Language switcher on `/en/layaway` offers `/ja` home, never JA layaway | source | — | — | verified in browser | verified | — |
| P3-4 | Layaway-only blog posts listed at `/en/blog/…`? | owner | not in this PR | — | none exist in production | separate decision | not in this PR |
| P3-5 | Messenger-button locale side fix (`stripLocale(path)`) | owner | accept or separate PR | — | `components/site/messenger-button.tsx`; verified visually on `/en/layaway` | behaviour restoration | owner confirms on a product page in preview |
| none — "Not run: production Rich Results Test, Search Console submission" | Rich Results Test; Search Console submission | owner | — | deployed URL | — | not run | after deployment |
| P3-1 | Approve new public route `/en/layaway` and sitemap entry | owner | pending | route-change rule | — | pending | approve |
| P3-2 | Title/H1/description wording | owner | pending | 150-char limit; no computed figures | — | pending | reword freely |
| none — "Deployment requirements 1" | Owner review; Vercel preview QA on branch alias | owner | pending | — | — | pending | QA checks listed |
| none — "Deployment requirements 2" | Merge to `develop`, release to `main` | owner | pending | — | — | pending | merge, release |
| none — "Deployment requirements 3" | post-deploy `check-seo-live`, Rich Results Test, request indexing | owner | pending | deployment | — | pending → SEARCH ENGINE RECRAWL PENDING | run checks |
| none — "Tests and checks (2026-10-29)" | typecheck, lint, unit 478/0, guards, build, live check 208/0/0, Playwright, JA pages 0 layaway hrefs | source | — | — | `tests/seo-layaway-route.test.mjs` (9) | all pass | — |
| none — "Prerequisites in production (Phase 2 handoff)" | locale routes, nav, sitemap, 307s, `gateLang`/OD-15 | — | — | — | `main` `7aac136` | present | — |
| none — "Layaway terms, Hub money calls, checkout untouched" | no money files changed | source | — | `check:money` | green | untouched | — |

---

## 4. `docs/seo/phase-4/PHASE-4-REPORT.md`

(a) Phase 4 structured-data upgrade implementation report; branch `seo/phase-4-structured-data` from `develop` `4dc3c23`; evidence at `54cc316` (2026-10-29) and QA addendum commits `a51e2b2`, `6e264b9`, `7d26130`. Status words carried: READY FOR QA; RESOLVED (owner decisions); future VERIFIED → DEPLOYED → SEARCH ENGINE RECRAWL PENDING.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — "BreadcrumbList (§8)" | new `JsonLd` breadcrumb variant on six templates | source | — | — | `lib/json-ld.ts`; `tests/json-ld.test.mjs` +9 | added | Rich Results Test (§6). CONFLICT: Matrix R-17 says DEPLOYED; this report says READY FOR QA |
| none — "JewelryStore (§16)" | append `address` street/postal, `logo`, `telephone`, `email`, `sameAs` | source | — | Hub `contact.email`, `social.follow` | `app/page.tsx` | added | — |
| BUG-02 | `sameAs` excludes `m.me/…` Messenger link (not a profile) | source | — | — | `isProfileUrl` | handled 2026-10-29 | — |
| X5 | Product `description` = `description_ja` on `/ja` when non-empty | source | — | — | — | **closed** | real-data check (§5) |
| none — "aggregateRating / review" | emit only when page renders reviews | source | — | — | builder condition `count > 0` | implemented | preview check on product with reviews (§5) |
| R-1 / S-1 | hasMerchantReturnPolicy / shippingDetails encoding | owner | **RESOLVED 2026-10-29: both commits REMOVED**; R-1, S-1 stay open with owner | faithful encoding approval; rate card confirm | `aacb81e`, `f324135` removed; `SEO-QA-REPORT.md` §2.4-2.5; test pins absence | not emitted | nothing emitted until approved |
| none — "`gtin`, `mpn` not emitted" | never invent | source | — | — | test pins absence | not emitted | — |
| none — "`countryOfOrigin` not emitted" | origin only via badge | source | owner rule | — | test pins absence | not emitted | — |
| none — "`openingHours` not emitted" | support hours ≠ shop hours | source | — | — | test pins absence | not emitted | — |
| none — "`transitTime` not emitted" | carrier time not published | source | — | — | — | not emitted | — |
| none — "Shipping outside Japan not emitted" | no published rate | source | — | — | — | not emitted | — |
| none — "`aggregateRating` when no reviews shown" | not emitted | source | — | — | — | not emitted | — |
| none — "`Organization` / `WebSite` entities, `priceValidUntil`" | out of Phase 4 scope | — | — | — | — | not in scope | — |
| R-1 | Return policy encoding (`MerchantReturnNotPermitted` + `merchantReturnLink`) | owner | removed; do not substitute `merchantReturnLink` alone without verifying Google requirements | — | Google return-policy doc read 2026-10-29 | open with owner | decide |
| S-1 | Shipping rate card encoding (`OfferShippingDetails` JP) | owner | removed; **confirm rate card is current** | Hub rate card | constants removed; `lib/content/shopping-guide.ts` unchanged | open with owner | confirm rate card |
| none — "UNVERIFIED: aggregateRating / review live output" | preview check on product with approved reviews | source | — | branch preview | fixture mode no reviews | UNVERIFIED | preview check |
| none — "UNVERIFIED: X5 on real data" | Japanese branch seen live | source | — | real data | fixtures `description_ja: null` | UNVERIFIED | real-data check |
| none — "UNVERIFIED: `email` / `sameAs` from the real Hub" | production Hub values | source | — | Hub | `settingsFixture` | UNVERIFIED | — |
| none — "Rich Results Test — TODO (§6)" | run on preview then production on five page types | owner/source | — | public URL | — | READY FOR QA | run; record in `SEO-QA-REPORT.md` |
| none — "Re-run `scripts/check-seo-live.mjs` on preview/prod — expect 0 FAIL" | live check | source | — | preview/prod | local 189/40 (origin artefact), later 277/0/0 | pending on preview | re-run |
| none — "move this phase to VERIFIED → DEPLOYED → SEARCH ENGINE RECRAWL PENDING" | status update in `SEO-IMPLEMENTATION-STATUS.md` | orchestrator | — | Rich Results Test | — | pending | update status doc |
| none — "Visible breadcrumbs (§7)" | shared `components/site/breadcrumbs.tsx` renders nav + JSON-LD from same items | source | — | governance rule 11 | `a51e2b2`, `6e264b9`, `7d26130`; unit 507/0; live 277/0/0; Playwright | fixed | Rich Results Test |
| none — "UNVERIFIED: name with `&`/`<`" | HTML-escape handling with real Hub names | source | — | — | no fixture has one | UNVERIFIED | — |

---

## 5. `docs/seo/phase-4/STRUCTURED-DATA-REVIEW-2026-11-01.md`

(a) Structured-data review: entity type, Offer consistency, sharing identity, video eligibility; corrected 2026-11-01 (review of `d0b3b5f`). Date: 2026-11-01. Status words carried: AUDITED (§1, §3, §4); IMPLEMENTED → READY FOR QA (§2); SEARCH ENGINE RECRAWL PENDING (after release); UNKNOWN; VERIFIED DEFECT, FIXED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| OD-SD-1 | Keep `JewelryStore` or change to `OnlineStore` (recommended) / `Organization` | owner | owner decision pending; **not changed here** (protected asset) | OD-GBP-1 = No (given 2026-10-31) | live `/en` JSON-LD read 2026-11-01; Google Organization/Local business docs; schema.org | AUDITED | if (b): one-line change in `lib/json-ld.ts` + tests; raw checker; Rich Results Test; QA record. CONFLICT: GBP readiness §1 says JewelryStore JSON-LD has **no** `telephone`, `email`, `sameAs`, `logo`; this review (and Phase 4 report) say they are emitted live |
| none — "Product `Offer` = the visible content" | Offer price/availability = `product_variants[0]` via `displayedVariant` + `variantAvailability` | source | — | release | 3 new tests in `tests/json-ld.test.mjs` + source guard; unit 652/652; raw 671/0; DOM 685/0; samples 8C100, N1616 | VERIFIED DEFECT, FIXED (READY FOR QA) | release; Rich Results Test on one multi-variant piece after release. CONFLICT: MC readiness §6 still says JSON-LD `offers.price` is `fromPrice(product)` (lowest variant) and expects "price mismatch" warnings |
| none — "Prevalence [U]" | number of live multi-variant pieces | — | — | Hub API key | — | [U] | owner names one, or first MC Diagnostics |
| R-19 (site videos) | Video markup for hero film, About logo film, artisan tile | source | — | — | `public/videos`, `components/site/hero*` [V code] | ASSESSED — not eligible; no markup added | none for these three |
| R-19 (product videos) | Inventory of Hub `video_url` + `video_poster_url` pieces | source (Hub access) | — | Hub API key | — | **UNKNOWN — not assessed**; R-19 not closed | read-only API count and per-video look when a key is available |
| none — "Sharing identity (OG/Twitter) — re-verified" | og:url = canonical, fb:app_id, og:locale, og:site_name, og:type, og:image on every locale template | source | — | — | checkers §A, raw HTML and live DOM | re-verified, no change | — |
| R-37 | rollback-only duplicate og:url on bare product page | source | — | — | matrix §A | closed | — |
| none — "UNVERIFIED (§5)" | prevalence of multi-variant pieces; product-video inventory; Google video eligibility page not re-read | — | — | Hub API | — | UNVERIFIED / UNKNOWN | — |

---

## 6. `docs/seo/phase-5/MERCHANT-CENTER-READINESS.md`

(a) Phase 5 Google Merchant Center readiness audit (plan §15); findings carried X8, X10, D3. Date: 2026-10-29 (builder note and MC-G2 correction 2026-11-01). Status words carried: AUDITED; builder IMPLEMENTED 2026-11-01; IMPLEMENTING (gate); DEPLOYED (Phase 2 prerequisite); SEARCH ENGINE RECRAWL PENDING; OBSERVED IN MERCHANT CENTER; UNKNOWN; UNVERIFIED; BLOCKED (PH feed).

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| X8 (§1 item 1) | Sign in to merchants.google.com; record account, ID, verified website, claim method, free listings, disapprovals | owner | unanswered | — | — | UNKNOWN | record |
| X8 (§1 item 2) | Confirm Search Console property for `www.chajewelsjp.com` and who owns it | owner | unanswered | — | — | UNKNOWN. CONFLICT: Search Console ops §1 (updated 2026-10-31) says Domain property `chajewelsjp.com` EXISTS, ownership verified, observed 2026-10-30 | confirm |
| none — "§1 item 3: business information matches published legal identity" | NAP from `phase-10/LOCAL-SEO-GBP-READINESS.md` §3 | owner | — | — | — | pending | confirm |
| none — "§1 item 4: decide target country/language (OD-MC-1 to OD-MC-3)" | decide which feed first | owner | pending | — | — | pending | decide |
| none — "Until these are recorded, this phase stays AUDITED" | gate for Phase 5 → IMPLEMENTING | owner | — | §1 items 1–4 | — | AUDITED (header also says builder IMPLEMENTED 2026-11-01) | record items |
| OD-MC-7 (§3 recommendation) | Option B storefront route `app/api/merchant-feed/route.ts`, builder in `lib/merchant-feed.ts`; new route needs owner approval before code | owner / Claude | route **not approved**; builder implemented | route-change rule | — | recommendation | approve route |
| none — "Not recommended: automatic feed from your website" | do not use MC website crawl; automatic item updates optional later | owner | — | — | Google product-data page 2026-10-29; MC-G2 correction | not recommended | owner may enable automatic updates later |
| none — "Either option is IMPLEMENTING only after X8, OD-MC-1..3, route approved" | gate | owner | — | X8; OD-MC-1..3; route approval | — | gate | — |
| none — "One feed item per variant; variants share `item_group_id`" | field mapping rule | source | — | — | §4 | rule. CONFLICT: Proposal MC-G8 and Matrix MC-G8 say one item per product = displayed variant (`product_variants[0]`) | — |
| none — "`description`: omit the item if chosen language has no description" | no cross-language fallback | source | — | Google language rule | §4 | rule | — |
| none — "`link`: locale URL via `localePath`, never bare, never `?lang=`" | landing URL rule | source | — | Phase 2B | §4 | rule | — |
| none — "`image_link`: crawlable absolute URL; image host robots UNVERIFIED" | image host crawlability; min 500×500 from 2027-01-31 | owner / source | — | first-fetch Diagnostics | §4 | UNVERIFIED | check host robots and MC image crawl diagnostics |
| none — "`availability`: sold → `out_of_stock`, never dropped" | D3 / X10 rule | source | — | D3 | §4 | rule | — |
| none — "`price` / `sale_price` copied, no conversion anywhere" | money rule | source | — | `check:money` | §4 | rule | — |
| none — "`brand` only when `origin === BRAND`" | mirrors JSON-LD rule; no "Cha Jewels" unless OD-MC-4 | source | OD-MC-4 | — | `lib/json-ld.ts:58` | rule | — |
| none — "`gtin` / `mpn` never sent" | no such data | source | — | — | §1 | rule | — |
| none — "`identifier_exists` = `no` on every item" | truthful for unique/hallmarked jewelry | source | — | — | §4 | rule. CONFLICT: Proposal MC-G7 says the builder has **no identifier default**; identifiers only from an owner rule (OD-MC-11); no rule → feed empty | — |
| none — "`google_product_category` mapping by collection slug; live slugs UNVERIFIED" | mapping table; unmapped → 188 | source / owner | — | Hub slug export | taxonomy fetched 2026-10-29 | UNVERIFIED slugs (Proposal MC-G3 says 12 live slugs read) | owner/Hub exports slug list |
| OD-MC-5 (shipping attribute) | prefer account-level; `free_shipping_threshold` UNVERIFIED | owner | pending | rate card confirm | `/shopping-guide` | UNVERIFIED | owner confirms rate card |
| OD-MC-6 (`shipping_weight`) | probably omit | owner | pending | — | — | pending | decide |
| none — "Items excluded from the feed" | non-active, zero variants, no `price_jpy`, no image, no description in language | source | — | — | §4 | rule | — |
| none — "Never in the feed" | `down_payment_*`, `price_php` in JPY feed, `hero_place`, `cutout`, account/customer/order data | source | — | — | §4 | rule | — |
| none — "Feed URL `/api/merchant-feed.xml` (+ `?lang=ja` or second path)" | feed URL | owner | decide with OD-MC-1 | — | §5 | draft. CONFLICT: Proposal MC-G1 drops `.xml` → `/api/merchant-feed?lang=ja|en` | — |
| OD-MC-8 (fetch method) | scheduled fetch daily 03:00 JST; UI options UNVERIFIED | owner | pending | — | §5 | draft | set what the UI offers |
| none — "Freshness between fetches: accept up to 24 h lag" | follow-ups (second fetch / Merchant API push) only on evidence | owner / Lovable | — | evidence | §5 | draft | — |
| none — "Sold pieces: `out_of_stock` while page live; `lib/seo-policy.ts` drives exclusion if X10 changes" | page/sitemap/feed agreement | source | — | D3 / X10 | §5 | draft | — |
| none — "Failed fetch: MC keeps last good data; expiry window UNVERIFIED; email alerts on" | owner visibility | owner | — | — | §5 | UNVERIFIED window | enable alerts |
| none — "Hub outage during fetch: route must answer non-200, never empty feed" | route rule | source | — | — | §5 | draft | route |
| none — "Daily owner check (2 minutes): MC Diagnostics" | daily triage recorded in Phase 12 report | owner | — | — | §5 | draft | — |
| none — "§6: Product JSON-LD `offers.price` is lowest variant; Phase 4 should emit per-variant / AggregateOffer" | price agreement page vs feed | source (Phase 4) | — | — | §6 | noted for Phase 4, no change here. CONFLICT: see SDR §2 (fixed to displayed variant) | — |
| none — "§6: Return policy in MC settings exactly as published; never invent a window" | returns settings | owner | — | rule 11 | `/legal/returns` | rule | enter exactly |
| none — "§7 Monitoring checklist (weekly, Merchant Center)" | nine Diagnostics/account checks into Phase 12 report | owner or delegate | — | feed live | §7 | checklist | weekly once live; OBSERVED IN MERCHANT CENTER only from Diagnostics |
| OD-MC-1 | Which feed first (JA-first recommended) | owner | pending | — | Google supported countries page 2026-10-29; EN-for-Japan UNVERIFIED | pending | decide |
| OD-MC-2 | English feed target: JP or PH or none | owner | pending; PH BLOCKED on rate card | OD-MC-1; PH shipping rate card | — | pending | decide after OD-MC-1 |
| OD-MC-3 | Account structure (one account, one data source per language) | owner | pending | — | — | pending | decide |
| OD-MC-4 | `brand` for unbranded new pieces (omit recommended) | owner | pending | mirror in JSON-LD if "Cha Jewels" | — | pending | decide |
| OD-MC-5 | Shipping representation (account-level recommended); confirm rate card | owner | pending | — | — | pending | confirm |
| OD-MC-6 | Send `shipping_weight`? (No recommended) | owner | pending | — | — | pending | decide |
| OD-MC-7 | Where the feed lives (Option B; approve route) | owner | pending | route-change rule | — | pending | approve |
| OD-MC-8 | Fetch time and frequency (daily 03:00 JST) | owner | pending | — | — | pending | decide; review after four weeks |
| OD-MC-9 | Sold pieces in feed (`out_of_stock` while D3 stands) | owner | pending | D3 / X10 | — | pending | decide |
| OD-MC-10 | Returns policy text in MC (copy verbatim) | owner | pending | rule 11 | — | pending | copy |
| none — "Approval table: Phase 5 → IMPLEMENTING" | owner fills approval table (X8, OD-MC-1, 2, 4, 5, 7, Phase 5 → IMPLEMENTING) | owner | blank | — | §8 | blank | fill |
| none — "§9 step 1: `lib/merchant-feed.ts` pure builder" | `feedItems`, `renderRss`, category map | source | — | — | — | outline (Proposal §1 says implemented) | — |
| none — "§9 step 2: `app/api/merchant-feed/route.ts`" | route with `hub.allProducts(5000)`, non-200 on failure, `catalog` tag cache | source | OD-MC-7 | — | — | outline; not built | after approval |
| none — "§9 step 3: tests `tests/merchant-feed.test.mjs`" | mapping tests; guards unchanged | source | — | — | — | outline (Proposal says 12 tests exist) | — |
| none — "§9 step 4: live check / feed probe" | extend `scripts/check-seo-live.mjs` | source | — | route | — | outline | later |
| none — "§9 step 5: owner creates data source, manual fetch, Diagnostics" | account side | owner | — | route live | — | outline | later |
| none — "§9 step 6: status row and QA entry" | `SEO-IMPLEMENTATION-STATUS.md`, `SEO-QA-REPORT.md` | orchestrator | — | — | — | outline | later |
| none — "§10 Contract DRAFT (Option A)" | Hub-side feed contract for Lovable, only if OD-MC-7 chooses A | Claude drafts / Lovable | conditional on OD-MC-7 | — | — | draft, kept here | only if Option A |
| none — "UNVERIFIED (summary)" | X8 state; EN-feed acceptance for Japan; `free_shipping_threshold`; fetch frequency/expiry; image-host crawl; live slug list; `/api/` robots treatment | — | — | — | §11 | UNVERIFIED | — |

---

## 7. `docs/seo/phase-5/MERCHANT-FEED-IMPLEMENTATION-PROPOSAL.md`

(a) Merchant Center feed implementation proposal and owner package; corrected 2026-11-01 (review of `d0b3b5f`). Date: 2026-11-01. Status words carried: builder IMPLEMENTED → READY FOR QA; route NOT CREATED — PROPOSED ONLY; account OWNER DECISION PENDING; PARTIAL; IMPLEMENTING → DEPLOYED → OBSERVED IN MERCHANT CENTER (future).

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — "`lib/merchant-feed.ts` — implemented, pure, no route" | builder functions `feedItem`, `buildFeed`, `feedPrice`, `googleCategory`, `identifierFields`, `reconcile`, `renderRss`, `IDENTIFIERS_UNDECIDED` | source | — | — | 12 unit tests incl. source guard that no route exists | implemented (READY FOR QA) | — |
| none — "Route `app/api/merchant-feed/route.ts` — not created" | route only after OD-MC-7; guard test fails if file appears | source | OD-MC-7 not given | approval + test update | §3 code | not created — PROPOSED ONLY | approve |
| none — "Account-side setup — not started" | §5 package | owner | — | — | — | not started | owner |
| MC-G1 | URL naming: `/api/merchant-feed?lang=ja|en`, `.xml` dropped | owner | confirm with OD-MC-7 | — | — | one form chosen | confirm |
| MC-G2 | Stale X5 sentence | — | — | — | readiness §3 corrected | corrected | — |
| MC-G3 | Image host identified (`pfoicalpzdcmyxzvwyhz.supabase.co/...`), crawl policy [U]; 12 slugs mapped/unmapped; `free_shipping_threshold` not used | owner | X8 pending | first fetch | live JSON-LD | partially resolved | X8; image-host check on first fetch |
| MC-G4 | Counts: 453 products live; sold count [U] | source | — | Hub API | sitemap 2026-11-01 | partial | re-read at route time |
| MC-G5 | Sold rule `out_of_stock` while D3 stands | owner | — | D3 / X10 | builder | done | restate if D3/X10 changes |
| MC-G6 | `item_type` [U]; builder maps Watch / `preloved-watches` / `luxury-watches` → 201 | source | — | Hub API key | builder | [U] | read-only API check |
| MC-G7 | Builder has no identifier opinion; `IdentifierRule` required; `IDENTIFIERS_UNDECIDED` → every piece `identifier_unknown`, feed empty; conflicts `identifier_conflict` | owner | **OD-MC-11 required** | owner's written rule per piece class | builder + tests | no rule → empty feed | owner writes rule; Hub contract change if real MPN/GTIN |
| MC-G8 | One item per product = displayed variant, same as corrected JSON-LD Offer | — | — | variant-selectable page (future) | test proves | closed by design | per-variant feed only with variant-selectable page |
| MC-G9 | Daily fetch 03:00 JST; 60 s catalog cache; worst case one fetch interval | owner | OD-MC-8 pending | — | — | proposed | owner states acceptable max age |
| MC-G10 | Full catalog: `reconcile()` exact membership; not authoritative (same table, same `limit=5000`) | source + Hub | OD-MC-12 pending | Hub total count | `reconcile(build, slugs, { authoritativeTotal })` | PARTIAL | OD-MC-12 Hub work item (Lovable) |
| MC-G11 | 503 on any Hub failure or reconciliation problem; `no-store` on errors; complete feed cached 300 s | source | — | route | §3 code | proposed | route |
| MC-G12 | Robots `/api` treatment [U] (help page 404); keep path, first fetch, fallback `Allow: /api/merchant-feed` in `app/robots.ts` with test | owner / source | — | first fetch | — | [U] | first fetch |
| MC-G13 | Shipping/returns published text quoted verbatim in §5; no non-JP target | owner | — | — | re-read 2026-11-01 | done (text) | owner enters exactly §5 |
| OD-MC-7 (§3 route code) | Exact route code for approval: `IDENTIFIER_RULE` placeholder (503 "feed incomplete" until OD-MC-11), 400 bad lang, 503 on failure, headers `x-feed-items`, `x-feed-excluded`, `x-feed-completeness` | owner | PROPOSED — needs OD-MC-7 | OD-MC-11, OD-MC-12 | §3 | not written to `app/` | approve |
| none — "Tests to add with the route" | 503 rejected read; 503 reconciliation; 400 bad lang; 200 XML + count header; `no-store` on errors; raw checker `merchant-feed` row; remove "no route exists" assertion | source | — | route approval | — | planned | with route |
| none — "Risk and rollback" | read-only GET; rollback = delete route, remove data source | source / owner | — | — | — | stated | — |
| none — "§4.1 curl + xmllint well-formed + raw checker row" | validation after route live | source | — | route live | — | planned | after release |
| none — "§4.2 Owner: MC data source, scheduled fetch, fetch now, Diagnostics; record item count vs `x-feed-items`" | account validation | owner | — | route live | — | planned | after release |
| none — "§4.3 First-week Diagnostics triage into Phase 12 report" | triage per readiness §7 | owner | — | — | — | planned | first week |
| none — "§4.4 Status words IMPLEMENTING → DEPLOYED → OBSERVED IN MERCHANT CENTER" | status progression | orchestrator | — | — | — | planned | — |
| X8 (§5 step 1) | Account sign-in; record account, id, business name, verified website, free listings | owner | pending | — | — | not started | do |
| none — "§5 step 2 Business information (NAP from Phase 10 §3)" | enter one NAP set | owner | pending | — | — | not started | enter |
| none — "§5 step 3 Website claim/verification via Search Console Domain property" | claim | owner | pending | — | — | not started | claim |
| OD-MC-5 / MC-G13 (§5 step 4) | Shipping: Japan ¥800 under ¥8,000, free from ¥8,000; no other country | owner | pending | — | `/en/shopping-guide` | not started | enter exactly |
| OD-MC-10 (§5 step 5) | Returns policy as published at `/en/legal/returns`; link policy URL; no invented window | owner | pending | — | — | not started | enter |
| none — "§5 step 6 Tax: tax-inclusive setting" | select Japan tax-included | owner | pending | — | tokusho | not started | select |
| OD-MC-1 / OD-MC-2 (§5 step 7) | Data source: `?lang=ja` daily 03:00 JST, Japanese, Japan, JPY; `?lang=en` only after OD-MC-2 | owner | pending | OD-MC-7 and route release | — | not started | create after release |
| none — "§5 step 8 Verification: fetch now → Diagnostics; items ≈ `x-feed-items`; image crawl OK" | verification | owner | — | data source | — | not started | record in Phase 12 report; OBSERVED IN MERCHANT CENTER only from Diagnostics |
| OD-MC-11 / OD-MC-12 (§5 step 9 decision log) | Fill decision log X8, OD-MC-1..12 (OD-MC-11 identifier rule — without it feed has NO items; OD-MC-12 Hub total) | owner | pending | — | — | not started | fill |
| none — "§5 step 10 Exclusions the owner must expect" | `identifier_unknown`, `identifier_conflict`, `condition_unknown`, `status_unknown`, `not_active`, `no_slug`, `duplicate_slug`, `no_variant`, `no_price`, `no_description`, `no_image` | owner | — | — | — | stated | fix in Hub or write rule |
| none — "UNVERIFIED (§6)" | robots-disallowed feed path; EN-feed acceptance for Japan; image host crawl policy; live sold count and `item_type` | — | — | Hub API | — | UNVERIFIED | — |

---

## 8. `docs/seo/phase-6/COMMERCIAL-LANDING-ARCHITECTURE.md`

(a) Phase 6 commercial landing architecture: nine themes, Hub SEO field draft, owner decisions; `llms.txt` added 2026-10-31. Prepared 2026-10-29 (branch `seo/phase-6-8-commercial-authority-prep`); §6b dated 2026-11-01. Status words carried: AUDITED / READY FOR OWNER REVIEW; NEEDS APPROVAL; NOT proposed; IMPLEMENTING / VERIFIED (future); IMPLEMENTED 2026-11-01 — READY FOR QA (`llms.txt`).

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — "T1 — K18 gold jewelry (Japan)" | Hub SEO fields on `/en/categories/fine-jewelry`; no `/en/shop/k18-gold` | Hub (Lovable) / owner | OD-P6-4 | §4 fields | sitemap 2026-10-29 | proposal | approve fields |
| none — "T2 — Kihei (Japan)" | `kihei` Hub collection (OD-P6-1) + `/en/guides/kihei` pillar (OD-P6-5); structured Kihei attributes (Hub ask); not in sitemap until ≥ 6 pieces | owner / Hub | OD-P6-1, OD-P6-5 pending; NEEDS APPROVAL | — | 3 live Kihei pages | proposal | decide |
| none — "T3 — Gold necklaces and bracelets" | titles/descriptions via Hub SEO fields | Hub / owner | OD-P6-4 | — | — | proposal | — |
| none — "T4 — Akoya pearls" | Hub SEO fields; optional `pearl_mm` attribute | Hub / owner | OD-P6-4 | — | — | proposal | — |
| none — "T5 — Diamond jewelry" | optional `diamonds` collection (OD-P6-2); SEO fields; `carat` attribute | owner / Hub | OD-P6-2 pending | — | 156 diamond slugs | proposal | decide |
| none — "T6 — Preloved fine jewelry" | category SEO fields incl. `faq` from live Hub FAQ rows | Hub / owner | OD-P6-4 | — | — | proposal | — |
| none — "T7 — Preloved luxury" | SEO fields; primary URL decision luxury-watches vs preloved-watches, **no redirect** | owner | OD-P6-3 pending | — | — | proposal; MEDIUM overlap | decide |
| none — "T8 — Jewelry layaway" | none in Phase 6; `/en/layaway` is Phase 3's; layaway guides deferred | Phase 3 / owner | OD-P6-7 | `/en/layaway` live + Search Console layaway queries | `/en/layaway` 404 + noindex on 2026-10-29 (X3) | deferred. CONFLICT: Matrix R-12 says `/en/layaway` DEPLOYED / OBSERVED IN SEARCH CONSOLE | confirm |
| none — "T9 — Wholesale K18 jewelry" | title change via `pageMeta("wholesale")` | source | OD-P6-9 | — | `lib/content/wholesale.ts` | proposal | approve wording; one-line edit later |
| OD-P6-8 (§2 metrics) | Owner confirms intent readings against Search Console queries; all volume/CPC/difficulty UNVERIFIED | owner | pending | X8 access | WebSearch 2026-10-29 | UNVERIFIED | export queries for nine themes |
| OD-P6-4 (§4 Hub contract extension) | Additive nullable SEO fields on `Collection` and `Category` (`seo_title_*`, `seo_description_*`, `h1_*`, `intro_*`, `seo_copy_*`, keywords, `hero_alt_*`, `faq`, `noindex`); terminology, no money, FAQ JSON-LD only from rendered `faq`, `notify_website` revalidation | Hub (Lovable) | DRAFT; nothing applied | — | `lib/types.ts:113–121`; `api.md` §601 | DRAFT | approve for Hub implementation |
| none — "Storefront follow-up (a later implementation PR)" | read new fields in `lib/types.ts`, collection/category `generateMetadata`, below-grid copy, FAQ blocks, sitemap `noindex` filter, fallback tests, fixtures | source | after Hub fields exist | OD-P6-4 | — | not started | later PR |
| none — "§5 Regression and QA expectations" | typecheck/unit/guards green; legacy metadata snapshot; no new route without approval; no redirect; live checks; status vocabulary | source | — | — | — | expectations | apply at implementation |
| OD-P6-1 | Create `kihei` collection in Hub ((a) create, `noindex` until ≥ 6 pieces) | owner | pending | — | 3 pieces, 1 sold | pending | decide |
| OD-P6-2 | Create `diamonds` collection in Hub | owner | pending | Hub effort | 156 slugs | pending | decide |
| OD-P6-3 | Primary URL for preloved watches; no redirect | owner | pending | — | — | pending | pick one |
| OD-P6-4 | Approve Hub SEO fields draft (§4) as Hub work item | owner | pending | — | — | pending | approve / amend / reject |
| OD-P6-5 | Approve `/en/guides/*` route family (first `/en/guides/kihei`, second `/en/guides/k18-gold-japan`), English-only | owner | pending (OD-14 requires own approval) | — | — | pending | approve family / per page / reject |
| OD-P6-6 | Confirm no `/en/shop/*` pages in Phase 6 | owner | pending | — | — | pending | confirm |
| OD-P6-7 | Layaway content stays with Phase 3; layaway guides deferred until Search Console shows demand | owner | pending | — | — | pending | confirm |
| OD-P6-8 | Search Console validation of §2 intent readings (16-month export) | owner | pending | X8 | — | pending | before titles are final |
| OD-P6-9 | Wholesale title change | owner | pending | — | — | pending | approve wording |
| none — "§6b `llms.txt`" | `app/llms.txt/route.ts`, `lib/llms-txt.ts`; checkers fetch every advertised link (200, HTML, no noindex, self canonical); 200 `text/plain`; 4 unit tests; "built after Phase 6 URLs final" is a stated deviation | source | owner decision 2026-10-31 (added to Phase 6) | re-verify when any Phase 6 route lands | master plan PHASE 6 add-on | IMPLEMENTED 2026-11-01 — READY FOR QA | same regression checks as §5 plus link checks |
| none — "UNVERIFIED (§7)" | search-volume metrics; Search Console query mix; Kihei stock state | — | — | — | — | UNVERIFIED | — |

---

## 9. `docs/seo/phase-6/INTERNAL-LINKING-MAP.md`

(a) Phase 6–8 internal linking map (plan §21), real routes only; documentation only. Verified 2026-10-29. Status words carried: AUDITED / READY FOR OWNER REVIEW; LIVE; PROPOSED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| OD-P6-1 (node "Kihei collection") | `/en/collections/kihei`; fallback `/en/collections/necklaces` | owner / Hub | PROPOSED (Hub taxonomy) | — | — | PROPOSED | decide |
| X3 (node "Layaway") | `/en/layaway`; fallback legacy `/layaway` via `localePath` (Option ii) | Phase 3 | — | Phase 3 | — | PROPOSED. CONFLICT: Matrix R-12 says DEPLOYED / OBSERVED IN SEARCH CONSOLE | — |
| none — node "Kihei pillar" | `/en/guides/kihei`; fallback `/en/jewelry-guide#metals` | owner | OD-P6-5 | — | — | PROPOSED (Phase 7) | approve |
| none — node "K18 pillar" | `/en/guides/k18-gold-japan`; fallback `#metals` | owner | OD-P6-5 | — | — | PROPOSED (Phase 8) | approve |
| none — node "Kihei cluster pages" | `/en/guides/kihei-*`; fallback pillar else `#metals` | owner | OD-P6-5 | — | `phase-7/KIHEI-CLUSTER-PLAN.md` | PROPOSED | approve |
| none — node "K18 cluster pages" | `/en/guides/k18-*`; fallback pillar else `#metals` | owner | OD-P6-5 | — | `phase-8/K18-CLUSTER-PLAN.md` | PROPOSED | approve |
| none — "Path A — Kihei (education → commerce)" | cluster → pillar → cluster → Kihei collection (fallback necklaces) → product; linking rules | content / source | — | OD-P6-1, OD-P6-5 | — | mapped | implement when routes exist |
| none — "Path B — K18 purity and hallmarks" | cluster → pillar → hallmarks cluster → `#metals` (LIVE) → fine-jewelry → product | content / source | — | OD-P6-5 | — | mapped | — |
| none — "Path C — Weight" | one weight explainer (K18 cluster), Kihei weight page links to it; no near-duplicate (§25) | content | — | — | — | mapped | — |
| none — "Path D — Authentication and preloved" | authentication cluster → FAQ → preloved category → product | content | — | — | — | mapped | — |
| none — "Path E — Layaway (English only; activate after Phase 3)" | pillars → `/en/layaway` → calculator → product; wrapped in `layawayOffered(lang)`; never on `ja` | source | — | Phase 3 | — | mapped | activate after Phase 3 |
| none — "Path F — Trade" | K18 pillar and FAQ wholesale Q&As → `/en/wholesale` | content | — | — | — | mapped | — |
| none — "§3 Product reverse-linking 'Learn more' block" | conditional links by Hub data (`material` K18, `kihei` collection, `weight_g`, preloved category, layaway); storefront-owned; unit test per condition | source | out of scope for this PR (Matrix: OD-P6-10 proposed) | — | `api.md` §718 | proposed | later implementation |
| none — "`weight_g` field name UNVERIFIED — confirm in `api.md`" | confirm field name | source | — | — | — | UNVERIFIED | confirm before implementing |
| none — "§4 Collection and category → guide links" | each `seo_copy` ends with one "Learn more" sentence per table | Hub content | — | Hub SEO fields (OD-P6-4) | — | planned | once fields exist |
| none — "No link may resolve to HTTP 404" | fallback contract until route live and verified | source | — | Phase 2C exit criterion | — | guardrail | — |
| none — "No orphan" | every new guide linked from pillar, one collection/category copy block, one sibling | content | — | — | — | guardrail | — |
| none — "Anchor text never says `<country> gold` or makes an origin claim" | X9 wording | content | — | — | — | guardrail | — |
| none — "Japanese pages never link to anything layaway-related" | layaway gate | source | — | `layawayOffered` | — | guardrail | — |

---

## 10. `docs/seo/phase-7/KIHEI-CLUSTER-PLAN.md`

(a) Phase 7 Kihei cluster plan (plan §10): 12 topics, slugs, titles, links, priorities. Date: not stated in file (UNVERIFIED; Phase 6 batch prepared 2026-10-29). Status words carried: DRAFT — NOT PUBLISHED — EDITORIAL APPROVAL REQUIRED; SEARCH ENGINE RECRAWL PENDING → OBSERVED IN SEARCH CONSOLE (sequencing gate); UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| OD-P6-5 (header) | `/en/guides/*` route-change approval before any route | owner | required, not given | — | — | no route exists | approve |
| none — "Thin-content guard (§25)" | cluster page only with a real Cha Jewels example or owner photo and one sourced fact beyond pillar | editorial | — | — | — | rule | — |
| none — topic 1 `what-is-kihei-chain` | P1 informational page | editorial | editorial approval | pillar live | — | DRAFT | after pillar |
| none — topic 2 `kihei-cuts-explained` | P1; Kihei collection link (fallback necklaces) | editorial | editorial approval | OD-P6-1 | — | DRAFT | after pillar |
| none — topic 3 `double-vs-triple-kihei` | P2 | editorial | editorial approval | OD-P6-1; Search Console impressions | — | DRAFT | after P1 |
| none — topic 4 `kihei-weight-classes` | P1; links K18 "how weighed" | editorial | editorial approval | OD-P6-1 | — | DRAFT | after pillar |
| none — topic 5 `how-kihei-is-weighed` | P3; may fold into topic 4 | editorial | editorial approval | owner photographs, new stock | — | DRAFT | P3 |
| none — topic 6 `kihei-hallmarks-japan` | P2 | editorial | editorial approval | Search Console impressions | — | DRAFT | P2 |
| none — topic 7 `k18-vs-k24-kihei` | P2 | editorial | editorial approval | — | — | DRAFT | P2 |
| none — topic 8 `kihei-necklace-lengths` | P2 | editorial | editorial approval | — | — | DRAFT | P2 |
| none — topic 9 `kihei-for-men-and-women` | P3 shared page (topics 9+10) | editorial | editorial approval | owner photographs | — | DRAFT | P3 |
| none — topic 10 "Kihei for women" | same page as 9 (second H2) | editorial | — | — | — | merged | — |
| none — topic 11 `k18-authentication-japan` | P1; canonical home in K18 cluster | editorial | editorial approval | — | — | DRAFT | after pillar |
| none — topic 12 `kihei-care` | P3 | editorial | editorial approval | — | — | DRAFT | P3 |
| none — "Linking rules" | pillar in first screen, one commerce target, Jewelry Guide anchor; layaway only inside `layawayOffered(lang)` | content | — | `phase-6/INTERNAL-LINKING-MAP.md` | — | rule | — |
| none — "Sequencing" | P1 after pillar approved and live; P2 after SEARCH ENGINE RECRAWL PENDING → OBSERVED IN SEARCH CONSOLE; P3 with photos and stock | owner / editorial | — | pillar live; Search Console | — | sequencing | — |
| OD-P6-1 (Hub dependency) | `kihei` collection for topics 2, 3, 4 "Shop" links; written either way with fallback | owner / Hub | pending | — | — | pending | decide |
| OD-P6-8 (metrics) | no search volumes until owner exports Search Console queries | owner | pending | — | — | UNVERIFIED | export |

---

## 11. `docs/seo/phase-7/KIHEI-PILLAR-DRAFT.md`

(a) Phase 7 Kihei pillar page draft (proposed `/en/guides/kihei`), ~1,850 words, sources S1–S10. Sources fetched 2026-10-29. Status words carried: DRAFT — NOT PUBLISHED — EDITORIAL APPROVAL REQUIRED; PROPOSED; LIVE; UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| OD-P6-5 | Route `/en/guides/kihei` NOT created; needs route-change approval | owner | not given | — | — | PROPOSED | approve before any `app/` file |
| none — "hreflang `en` only; `x-default` → `en` — confirm with the i18n skill" | hreflang convention | source | — | — | — | proposed | confirm before implementation |
| none — "Structured data: `Article`/`BlogPosting` + `FAQPage` from visible FAQ only; `BreadcrumbList`" | structured data plan | source | — | governance §11 | — | proposed | implement with route |
| none — anchor "Reserve with layaway" → `/en/layaway` | until live `localePath("/layaway")`; only inside `layawayOffered(lang)` | source | — | Phase 3 | — | PROPOSED | swap when live |
| OD-P6-1 (anchor "Kihei collection") | `/en/collections/kihei` → fallback Necklaces | owner / Hub | pending | — | — | PROPOSED | — |
| none — anchor "K18 guide (weight, hallmarks)" → `/en/guides/k18-gold-japan` | fallback `#metals` | owner | OD-P6-5 | Phase 8 | — | PROPOSED | — |
| none — checklist "Owner confirms the three product examples and their live availability" | N1616, 8C100, R7813 (R7813 SoldOut 2026-10-29) | owner | unchecked | — | — | open | confirm |
| none — checklist "Owner supplies photographs of a 2-cut, a 6-cut and a triple chain" | real pieces (§25), alt text cut and weight only | owner | unchecked | — | — | open | supply |
| none — checklist "Confirm 'M-cut / 16-sided' wording with the N1616 maker's documentation" | or mark as maker's term | owner / editorial | unchecked | — | — | UNVERIFIED | confirm |
| none — checklist "`npm run check:terms` on the content file" | no `<country> gold`, no origin phrasing | source | unchecked | — | — | open | run |
| none — checklist "No price, deposit, percentage or currency in the body" | money rule; layaway sentence in `layawayOffered` | editorial / source | unchecked | — | — | open | verify |
| none — checklist "FAQ JSON-LD only from the rendered FAQ block; `Article` dates real" | structured data truth | source | unchecked | — | — | open | verify |
| none — checklist "Route-change approval recorded (OD-P6-5) before any file under `app/`" | approval record | owner | unchecked | — | — | open | record |
| none — "Not usable / UNVERIFIED: JJA metal-labelling guide; M-cut/16-sided geometry; search volumes" | sources not readable | — | — | — | https://jja.ne.jp/lib/rules/pdf/metalguide.pdf | UNVERIFIED | — |

---

## 12. `docs/seo/phase-8/K18-CLUSTER-PLAN.md`

(a) Phase 8 K18 cluster plan (plan §11): 10 topics (3 folded), slugs, titles, priorities; `/en/jewelry-guide#metals` is the existing asset. Date: not stated (UNVERIFIED; Phase 6–8 batch 2026-10-29). Status words carried: DRAFT — NOT PUBLISHED — EDITORIAL APPROVAL REQUIRED; UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| OD-P6-5 (header) | `/en/guides/*` approval; no route exists | owner | not given | — | — | no route | approve |
| none — topic 1 `what-is-k18-gold` | P1 (topic 2 folded in as second H2) | editorial | editorial approval | pillar live | — | DRAFT | after pillar |
| none — topic 2 "What does K18 mean in Japan?" | folded into topic 1 | — | — | — | — | folded | — |
| none — topic 3 `k18-vs-18k` | P2 | editorial | editorial approval | Search Console impressions | — | DRAFT | P2 |
| none — topic 4 `k18-vs-k24` | P1 | editorial | editorial approval | pillar live | — | DRAFT | after pillar |
| none — topic 5 `k18-hallmarks-japan` | P1 | editorial | editorial approval | pillar live | Japan Mint pages; `n1616-…` | DRAFT | after pillar |
| none — topic 6 `how-gold-jewelry-is-weighed` | P1 (topic 7 folded) | editorial | editorial approval | pillar live | `8c100-…`, `b4618-…` | DRAFT | after pillar |
| none — topic 7 "Why gram weight matters" | folded into topic 6 | — | — | — | — | folded | — |
| none — topic 8 `k18-authentication-japan` | P1; canonical home (shared with Kihei topic 11) | editorial | editorial approval | pillar live | — | DRAFT | after pillar |
| none — topic 9 `buy-k18-jewelry-in-japan` | P2; `/en/layaway` inside `layawayOffered` | editorial | editorial approval | Search Console impressions | — | DRAFT | P2 |
| none — topic 10 "How to care for K18 jewelry" | not a separate page; `#care` covers it | — | — | — | — | not separate | — |
| none — "Wording" | X9 forms only; no investment/appreciation claim; link FAQ "future value" answer | editorial | — | — | — | rule | — |
| none — "Sequencing" | P1 after pillar live; P2 after question-query impressions; topics 2, 7, 10 not separate URLs | owner / editorial | — | Search Console | — | sequencing | — |
| OD-P6-8 (metrics) | UNVERIFIED until Search Console export | owner | pending | — | — | UNVERIFIED | export |

---

## 13. `docs/seo/phase-8/K18-PILLAR-DRAFT.md`

(a) Phase 8 K18 pillar page draft (proposed `/en/guides/k18-gold-japan`), ~1,500 words, sources S1–S10; links to `#metals` rather than repeating it. Sources fetched 2026-10-29. Status words carried: DRAFT — NOT PUBLISHED — EDITORIAL APPROVAL REQUIRED; PROPOSED; LIVE; UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| OD-P6-5 | Route `/en/guides/k18-gold-japan` NOT created; needs route-change approval | owner | not given | — | — | PROPOSED | approve before any `app/` file |
| none — "hreflang `en` only; `x-default` → `en` (confirm with the i18n skill)" | hreflang convention | source | — | — | — | proposed | confirm |
| none — "Structured data: `Article` + `FAQPage` from visible FAQ only; `BreadcrumbList`" | structured data plan | source | — | governance §11 | — | proposed | with route |
| none — anchor "Reserve with layaway" → `/en/layaway` | until live `localePath("/layaway")`; inside `layawayOffered(lang)` | source | — | Phase 3 | — | PROPOSED | swap when live |
| none — anchor "Kihei guide" → `/en/guides/kihei` | fallback Necklaces | owner | OD-P6-5 | Phase 7 | — | PROPOSED | — |
| none — checklist "Owner confirms the five product examples (N1616, 8C100, B4618, N8550, R7813)" | examples and live availability | owner | unchecked | — | — | open | confirm |
| none — checklist "Owner supplies a photograph of a Mint hallmark on one of our own pieces" | real example (§25) | owner | unchecked | — | — | open | supply |
| none — checklist "Confirm the 'weight includes stones and findings' sentence against the Hub's weighing practice" | procedure claim | owner | unchecked | — | — | UNVERIFIED | confirm |
| none — checklist "`npm run check:terms`" | wording guard | source | unchecked | — | — | open | run |
| none — checklist "No price, rate, deposit or percentage of price in the body; layaway sentence inside `layawayOffered`" | money rule | editorial / source | unchecked | — | — | open | verify |
| none — checklist "Confirm nothing here duplicates `#metals` beyond the one summary paragraph" | no duplication | editorial | unchecked | — | — | open | verify |
| none — checklist "Route-change approval (OD-P6-5) before any file under `app/`" | approval record | owner | unchecked | — | — | open | record |
| none — "UNVERIFIED: JJA labelling guide; weights include stones/findings; search volumes" | — | — | — | — | — | UNVERIFIED | — |

---

## 14. `docs/seo/phase-9/FILIPINO-CONTENT-BRIEFS.md`

(a) Phase 9 Filipino/Taglish search content: 8 briefs (B1–B8) and one full draft (B4); recommends Hub blog posts, no new route. Date: 2026-10-29. Status words carried: AUDITED (documentation only); DRAFT — EDITORIAL APPROVAL REQUIRED (B4); per-post NOT STARTED → AUDITED → IMPLEMENTING → READY FOR QA → DEPLOYED → SEARCH ENGINE RECRAWL PENDING → OBSERVED IN SEARCH CONSOLE; UNKNOWN; UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — "no `/fil/` or `/tl/` route; adding a Filipino locale needs owner approval, Phase 2-class, high-risk" | not proposed | owner | not proposed | route-change rule | `SEO-MIGRATION-MAP.md:16,56` | not proposed | — |
| none — "Option recommended: publish each brief as a Hub blog post, Taglish in `*_en`, `title_ja`/`body_ja` empty; layaway post `layaway_only: true`" | Hub posts option | owner / Hub | recommendation; owner chooses (Matrix: after R9 evidence) | — | `api.md` posts; F2 | recommended | owner decides |
| none — "owner/Phase 4 question: per-post language field in the Hub" | `inLanguage` would say `en` for Taglish text | owner / Phase 4 | open question; not needed to start | — | — | open | decide later |
| none — "`description_tl` null in every fixture, not rendered anywhere; Hub population UNVERIFIED" | separate owner decision, not Phase 9 | owner | not Phase 9 | — | `lib/types.ts:82` | UNVERIFIED | separate decision |
| none — "Measurement baseline UNKNOWN; plan §13 step 1 Search Console check is an owner action" | check Filipino/Tagalog queries | owner | — | Search Console export | Phase 0 export NOT STARTED | UNKNOWN | owner exports; regex §5 |
| none — "Layaway page link: `/layaway` until Phase 3 (PR #416) deployed, then `/en/layaway`" | editor swaps link | editorial | — | Phase 3 deploy | — | Phase 3 READY FOR QA in draft PR #416 (not deployed). CONFLICT: Matrix R-12 says DEPLOYED / OBSERVED IN SEARCH CONSOLE | swap link |
| none — "Confirm live slugs in `GET /catalog/collections` before linking" | slug confirmation | editorial | — | — | fixtures only | UNVERIFIED | confirm |
| B1 | "Saan makakabili ng K18 gold sa Japan?" post; links; regex `saan|makakabili|bili|k18`; review 8 weeks | owner / editorial | brief (not approved) | — | — | AUDITED (brief) | approve, write |
| B2 | "Ano ang Kihei?" post; regex `kihei|喜平|kehei`; watch cannibalisation with Phase 7 | owner / editorial | brief | — | — | AUDITED (brief) | approve, write |
| B3 | "Paano malaman kung tunay ang K18 jewelry sa Japan?" post; no origin claim | owner / editorial | brief | — | — | AUDITED (brief) | approve, write |
| B4 | "Paano gumagana ang jewelry layaway sa Japan?" — FULL DRAFT §6; `layaway_only: true`; layaway-start event UNVERIFIED | owner / editorial | DRAFT — EDITORIAL APPROVAL REQUIRED | Phase 3 link swap; analytics event confirm | §6 | DRAFT | editorial checklist |
| B5 | "Ano ang ibig sabihin ng K18 at 750 sa alahas?" post | owner / editorial | brief | — | — | AUDITED (brief) | approve, write |
| B6 | "Preloved branded jewelry sa Japan" post; returns policy copied exactly | owner / editorial | brief | — | — | AUDITED (brief) | approve, write |
| B7 | "Paano umorder at magpa-ship sa Pilipinas?" post; payment list via "see the shopping guide" | owner / editorial | brief | — | `paymentMethodsText` | AUDITED (brief) | approve, write |
| B8 | "Wholesale K18 para sa live sellers" post; form submissions by referrer UNVERIFIED | owner / editorial | brief | — | — | AUDITED (brief) | approve, write |
| none — "§5 Measurement plan: Search Console page filter + regex; weekly CSV into Phase 12; no metric without export" | measurement | owner | — | `phase-12/SEARCH-CONSOLE-OPERATIONS.md` | — | plan | weekly export |
| none — "Decision rule (plan §13 step 5): expand beyond 8 only if Filipino queries show impressions after 8–12 weeks" | expansion gate | owner | — | export | — | rule | — |
| none — "Statuses per post recorded in `SEO-IMPLEMENTATION-STATUS.md` (orchestrator)" | status tracking | orchestrator | — | — | — | NOT STARTED per post | record |
| none — B4 checklist "Owner confirms the Taglish register and that 'layaway' stays untranslated" | register decision | owner | unchecked | — | — | open | confirm |
| none — B4 checklist "Every figure matches live `/layaway` and `/shopping-guide` on publication day" | 30%, 0%, 3/6/8, ¥300,000, ¥8,000/¥800 | editorial | unchecked | — | — | open | verify |
| none — B4 checklist "Coupon statement matches `checkout.couponLayawayNotAllowed`" | consistency | editorial | unchecked | — | `lib/i18n.ts` | matches today | verify |
| none — B4 checklist "Cancellation paragraph names no number" | agreement governs | editorial | unchecked | — | — | open | verify |
| none — B4 checklist "`layaway_only: true`; `title_ja` / `body_ja` empty" | Hub post settings | Hub editor | unchecked | — | — | open | set |
| none — B4 checklist "Links: swap `/layaway` → `/en/layaway` when Phase 3 is DEPLOYED" | link swap | editorial | unchecked | Phase 3 | — | open | swap |
| none — B4 checklist "`npm run check:terms` passes; no origin claim" | wording guard | source | unchecked | — | — | open | run |
| none — B4 checklist "FAQ Q&A reused for FAQ JSON-LD only if Phase 4 adds per-post FAQ mechanism (not today)" | gate | Phase 4 | — | — | — | not today | — |
| none — "UNVERIFIED (§7)" | live slugs; `description_tl` population; Filipino query demand; layaway-start event; regex case-sensitivity | — | — | — | — | UNVERIFIED | — |

---

## 15. `docs/seo/phase-10/LOCAL-SEO-GBP-READINESS.md`

(a) Phase 10 local SEO and Google Business Profile readiness: published-NAP audit, gaps G1–G5, eligibility test, OD-GBP-1. Date: 2026-10-29; update 2026-10-31 (OD-GBP-1 = No). Status words carried: AUDITED (documentation only); UNKNOWN (X8); not eligible / do not create a profile; OBSERVED (only with screenshot); UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| X8 (GBP) | Does a profile exist? Verified? Category? Who manages it? | owner | unanswered in this doc (§4 answer says "no Business Profile exists") | — | — | UNKNOWN (§1) / none exists (§4, 2026-10-31) | screenshot Info tab if any |
| G1 | `JewelryStore` JSON-LD lacks street, postal code, telephone, email, opening hours, `sameAs`, logo; add from visible data; no `openingHoursSpecification` unless visitable | Phase 4 | — | OD-GBP-1 | baseline §8 | gap recorded. CONFLICT: Phase 4 report and Structured-data review state these fields (address, logo, telephone, email, sameAs) are now emitted live | hand to Phase 4 |
| G2 | Possible email drift: legal pages hardcode `sales@chajewelsjp.com`; `/contact` reads Hub `contact.email` | owner | — | — | `lib/settings.ts contactEmail` | UNVERIFIED | owner confirms both equal; Hub setting edit if not |
| G3 | Site never says whether customers may visit the office | owner | OD-GBP-1 answered No 2026-10-31 | — | — | resolved by OD-GBP-1 | — |
| G4 | Registered-name form "to be confirmed against the registration certificate" | owner (compliance) | pending | — | `legal.ts` comment | pending | confirm |
| G5 | Old-domain Messenger handle vs new domain; every external listing must use `www.chajewelsjp.com` | owner | — | D2 | — | noted | Phase 10 action list |
| none — "§3 The one NAP set" | exact strings for every external surface (name EN/JA, address, pin, phones, email, website, hours, permit, invoice reg.) | owner | G2, G4 to confirm | — | `lib/content/legal.ts` | defined | use everywhere external |
| OD-GBP-1 | Can a customer visit Time Mansion 301 during stated hours and be received? | owner | **Answered No (2026-10-31)** | — | Google GBP guidelines 2026-10-29 | not eligible; **do not create a profile**; §5 does not apply | revisit only if customers are received in person. CONFLICT (status word): Matrix/Manifest say Phase 10 CLOSED — NOT ELIGIBLE; this doc header says AUDITED |
| none — "Follow-up: check whether `JewelryStore` should stay or `OnlineStore`/`Organization` fits" | structured-data batch review; protected asset | Phase 4 / owner | — | own audit | — | follow-up (done as OD-SD-1 in SDR) | — |
| none — "If a profile already exists (X8): read it and bring it to §3, or hide/remove if not eligible" | correct a misleading listing | owner | — | — | — | conditional | — |
| none — "§5 What the Business Profile should contain (if OD-GBP-1 = yes, or a profile exists)" | field values | owner | **does not apply** (OD-GBP-1 = No) | — | — | not applicable | — |
| none — "§6 NAP consistency checklist (external surfaces)" | record Name/Address/Phone/Website/hours per surface; fix at source | owner | — | — | — | checklist blank | run once, then quarterly |
| none — "§7 action 1: Answer X8 for GBP; screenshot Info tab" | owner check | owner | — | — | — | pending | do |
| none — "§7 action 2: Decide OD-GBP-1; record in `SEO-IMPLEMENTATION-STATUS.md`" | decision record | owner / orchestrator | answered No | — | — | answered | record |
| none — "§7 action 3: Confirm G2 and G4" | email and registered-name form | owner | pending | — | — | pending | confirm |
| none — "§7 action 4: If eligible and no profile: create it; verify; run §6" | create profile | owner | not eligible | OD-GBP-1 | — | not applicable | — |
| none — "§7 action 5: If a profile exists but not eligible: correct/remove; do not leave a misleading listing" | correction | owner | — | X8 | — | conditional | — |
| none — "§7 action 6: Run §6 checklist once; then quarterly" | NAP checks | owner | — | — | — | pending | run |
| none — "§7 action 7: Hand the Phase 4 team G1" | JSON-LD fields from visible data; no opening hours | Phase 4 | — | — | — | pending (per this doc) | — |
| none — "§7 action 8: Report any local result only as OBSERVED with a screenshot" | claim rule | owner | — | — | — | rule | — |
| none — "UNVERIFIED (§8)" | GBP existence; office visitors; Hub `contact.email`; Hub `social.follow`; GBP category labels; registered-name form | — | — | — | — | UNVERIFIED | — |

---

## 16. `docs/seo/phase-11/AUTHORITY-OPPORTUNITIES.md`

(a) Phase 11 backlinks and authority: rules, zero-outreach wins, opportunity categories, evaluation criteria, tracking, OD-AUTH-1..4, execution materials (§8 added 2026-11-01). Date: 2026-10-29; §8 2026-11-01. Status words carried: AUDITED (documentation only); WITHDRAWN (OD-AUTH-4); nothing sent; UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — rule 1 "No purchased links" | no paid placements; real sponsorships marked `rel="sponsored"` | owner | non-negotiable | — | — | rule | — |
| none — rule 2 "No automated outreach" | person-to-person contact only | owner | non-negotiable | — | — | rule | — |
| none — rule 3 "No fabricated relationships" | document names no partner as agreed/contacted | — | non-negotiable | — | — | rule | — |
| none — rule 4 "Wording" | X9 forms; no country-branded gold; no made-in claims | owner | non-negotiable | — | — | rule | — |
| none — rule 5 "Truth in bios" | permit, invoice registration, memberships, dates exactly as published | owner | non-negotiable | — | `/about`, `/affiliations`, `/legal/tokusho` | rule | — |
| none — rule 6 "Measurement before claims" | referring domains only from Search Console Links export or named tool export | owner | non-negotiable | — | — | rule | — |
| D2 (asset "Old domain `chajewelsjapan.com`") | keep as live Page365 shop; **no redirect**; optional link in Page365 about text | owner | decided KEEP 2026-10-31 | Hub Page365 inventory fetch and invoice import | — | decided | optional link |
| none — asset "`agreement.chajewelsjp.com`" | footer link back; not indexable for customer-specific pages | owner | — | — | — | UNVERIFIED | verify |
| none — asset "Facebook page / Messenger" | website field = `https://www.chajewelsjp.com/`; About text uses §3 NAP | owner | — | Phase 10 §3 | — | pending | set |
| none — asset "Tokyo Chamber of Commerce and Industry membership" | check member directory entry with website field | owner | — | — | `/about` | pending | check, complete |
| none — asset "Tokyo Katsushika Central Rotary Club membership" | same check | owner | — | — | `/about` | pending | check |
| none — asset "Payment providers' merchant directories (Paidy, Square)" | confirm public merchant page URL | owner | — | — | — | pending | check |
| none — asset "Supplier / brand relationships" | only where a supplier publicly lists stockists | owner | — | — | Hub data | pending | — |
| none — "§3 Opportunity categories (8 categories; candidates not contacted, fit not verified)" | jewelry industry sites, Japan–Philippines publications, Tokyo business orgs, exhibitions, suppliers/partners, interviews, community orgs, trade publications | owner | not contacted | OD-AUTH-1..3 | one WebSearch 2026-10-29 | candidates UNVERIFIED | evaluate per §4 before contact |
| none — "§4 Evaluation criteria (score before any contact)" | relevance, realness, editorial control, no payment, fit with rules, no reciprocity, audience language, destination page | owner | — | — | — | criteria | apply |
| none — "§5 Tracking" | monthly Search Console Links export; optional tool export (none known); branded regex; per-mention log only when real | owner | — | Phase 12 | — | no numbers without export | monthly |
| OD-AUTH-1 | Who speaks for the company in interviews and pitches | owner | pending | — | — | pending | decide |
| OD-AUTH-2 | Whether Filipino-community-press coverage is wanted | owner | pending | — | — | pending | decide |
| OD-AUTH-3 | Budget for real sponsorships, if any | owner | pending | `sponsored` rule | — | pending | decide |
| OD-AUTH-4 | (old domain redirect) | owner | **WITHDRAWN 2026-10-31** | — | — | WITHDRAWN | — |
| none — "§8.1 Short company boilerplate (EN)" | verbatim text for directories, listings, bios | owner | usable verbatim or edited | — | published facts only | draft | use |
| none — "§8.2 Short company boilerplate (JA)" | verbatim JA text | owner | usable | — | — | draft | use |
| none — "§8.3 Pitch draft — Filipino-community publication" | founder-story pitch; no link request; follow-up once after two weeks | owner | **OD-AUTH-1/2 required before sending** | OD-AUTH-1, OD-AUTH-2 | — | draft, nothing sent | decide, then send |
| none — "§8.4 Membership-directory check script (TCCI, Rotary)" | sign in, set website and boilerplate, record link type | owner | — | — | — | script | 10 minutes each |
| none — "§8.5 Tracking log (template)" | fill only with real events | owner | — | — | — | empty template | fill when real |
| none — "Monthly: Search Console Links export; branded-query impressions from `scripts/gsc-report.mjs` (§4.3)" | monthly measurement | owner | — | Phase 12 | — | rule | monthly |
| none — "UNVERIFIED (§7)" | candidate status/fit; TCCI/Rotary directories; `agreement.` footer/indexing; backlink profile | — | — | — | — | UNVERIFIED | — |

---

## 17. `docs/seo/phase-12/ORGANIC-ATTRIBUTION-DESIGN.md`

(a) Phase 12 organic purchase/revenue attribution design for owner decision (R-04); corrected 2026-11-01 (review of `d0b3b5f`). Date: 2026-11-01. Status words carried: DESIGN ONLY; NOT MEASURABLE / NOT MEASURED; UNDECIDED (consent); NOT STARTED (metrics without decision); UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — "Gaps: no GA4; no source capture; no session–order join; ad 'purchase' fires at creation not payment" | what is missing today | — | — | — | `lib/analytics.ts`, `lib/ads.ts`, `docs/measurement-log.md` [V code] | gap recorded | — |
| none — metric "Organic purchase (count)" | Hub orders with `acquisition_source = organic_search` AND paid; cancelled/expired/failed/refunded excluded | Hub report | OD-ATTR-4 | Hub stores source | §2 | measurable once Hub stores source | — |
| none — metric "Organic revenue" | sum of `total` of paid organic orders per currency, net of Hub-recorded refunds | Hub report | OD-ATTR-4 | — | §2 | measurable | — |
| none — metric "Average order value (organic)" | revenue ÷ count per currency in Hub report; "n/a" when 0 | Hub report | — | — | §2 | measurable | — |
| none — metric "Layaway starts from organic" | plans created with source class; reported as starts, never revenue | Hub report | — | — | §2 | measurable | — |
| none — metric "Repeat customers from organic" | first paid order organic and a second paid order within 365 days | Hub report | — | customer link in Hub | §2 | measurable | — |
| OD-ATTR-5 (metric "Organic checkout start") | source dimension on browser event | owner | needs own approval | tracking change | §2 | **NOT measurable** under Option A | report NOT MEASURED unless approved |
| OD-ATTR-5 (metric "Organic add-to-cart") | as above | owner | needs own approval | tracking change | §2 | **NOT measurable** | report NOT MEASURED |
| OD-ATTR-1 (Option A) | First-touch source stamp: `cj-src` cookie (class + search host, 30 days), one checkout field, Hub columns `acquisition_source`/`acquisition_host`, Hub report | owner / source / Lovable | recommended; pending | OD-ATTR-1..3; Hub contract change | §3 | option | decide |
| none — "Option B. GA4 with Enhanced Ecommerce" | rejected unless privacy stance changes (order reference would leave the site; creation ≠ payment) | owner | rejected unless owner changes privacy stance | — | §3 | rejected | — |
| none — "Option C. Search Console only" | no attribution; "organic traffic" only | owner | option | — | §3 | option | — |
| OD-ATTR-3 (§4 consent) | Consent status UNDECIDED; "strictly functional" withdrawn; default consent-gated; under-count stated in every report | owner / counsel | UNDECIDED | counsel | EU ePrivacy, APPI, PH DPA notes all [U] | UNDECIDED; default consent-gated | decide with counsel |
| none — "§5 step 1 Storefront: `lib/acquisition.ts`, client component, `lib/checkout-actions.ts` passes `acquisition`" | storefront change | source | after approval | OD-ATTR-1 | — | not started | after approval |
| none — "§5 step 2 Hub (Lovable): nullable columns on drafts/orders/plans; report" | Hub change; Claude drafts contract | Lovable / Claude | OD-ATTR-4 | — | `supabase/contracts/api.md` | not started | after approval |
| none — "§5 step 3 Reporting: monthly from Hub report with §2 definitions and consent gate stated" | reporting rule | owner | — | — | — | not started | after approval |
| none — "§5 step 4 Tests: classifier; Server Action sends field only when cookie valid; Hub contract test" | tests | source | — | — | — | not started | after approval |
| OD-ATTR-1 | Adopt Option A, B or C | owner | pending (recommend A) | — | — | pending | decide |
| OD-ATTR-2 | Privacy policy: add `cj-src` cookie to cookie section (EN/JA) | owner | pending (recommend yes) | OD-ATTR-1 | `lib/content/legal.ts` | pending | draft on approval |
| OD-ATTR-3 | Consent: gate behind banner Accept, or notice-only on counsel's advice | owner / counsel | pending (recommend consent-gated) | — | — | pending | decide |
| OD-ATTR-4 | Hub work item for Lovable; authorise Claude to draft contract | owner | pending (recommend yes) | — | — | pending | authorise |
| OD-ATTR-5 | Whether organic add-to-cart / checkout start are wanted (tracking change + consent review) | owner | pending (recommend report NOT MEASURED) | — | — | pending | decide |
| none — "No decision = nothing changes; the plan's commercial metrics stay NOT STARTED" | default | — | — | — | — | NOT STARTED | — |
| none — "UNVERIFIED: every legal classification in §4; whether any dashboard receives the existing advertising events" | — | — | — | — | — | UNVERIFIED | — |

---

## 18. `docs/seo/phase-12/SEARCH-CONSOLE-OPERATIONS.md`

(a) Phase 12 Search Console weekly/monthly workflow, opportunity rules R1–R10, regexes, report template, helper `scripts/gsc-report.mjs`, OD-SC-1..4. Date: 2026-10-29; status updated 2026-10-31; helper written/corrected 2026-11-01. Status words carried: IMPLEMENTING; EXISTS (property); NOT NEEDED; UNKNOWN (X8); NOT STARTED → … → OBSERVED IN SEARCH CONSOLE; DEPLOYED / OBSERVED (rule); NO EXPORT; UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — prerequisite "Search Console property for `www.chajewelsjp.com`" | Domain property `chajewelsjp.com`, ownership verified, readable via company Google account; owner's primary account has no access | owner | — | — | `SEARCH-CONSOLE-BASELINE-2026-10-30.md` | EXISTS (observed 2026-10-30). CONFLICT: MC readiness §1 (2026-10-29) says Search Console property verified = UNKNOWN (X8) | — |
| OD-SC-1 (prerequisite "Who has Owner/Full access; read-only export to Claude") | access and CSV handoff | owner | pending | — | — | owner decision | decide |
| none — prerequisite "Property for the old domain `chajewelsjapan.com`" | not needed (no redirect) | owner | decided 2026-10-31 | D2 | — | NOT NEEDED | — |
| X8 (prerequisite "Merchant Center account and GBP for the monthly review") | account availability | owner | unanswered | — | — | UNKNOWN | — |
| none — prerequisite "Analytics for commercial metrics" | Vercel Web Analytics + consent-gated Meta/Google Ads; no GA4; Hub authoritative; attribution not implemented; dashboards UNVERIFIED | — | — | — | verified 2026-10-31 code | verified in code; dashboards UNVERIFIED | — |
| none — "§2 Weekly export: eight CSVs (queries, pages, countries, devices, question/Filipino/branded subsets, locale split)" | last 28 days, Web, Compare previous 28 | owner | — | — | — | workflow | weekly |
| OD-SC-2 (§2 storage) | CSVs outside the repo; markdown reports in `docs/seo/reports/` or outside git | owner | pending | — | — | pending | decide |
| none — "Additional weekly reads: Indexing → Pages, Core Web Vitals, Enhancements, Security & Manual actions" | record "checked, nothing new" or the issue | owner | — | — | — | workflow | weekly |
| R1 | High impressions, low CTR (≥ 200 impr, CTR < 1%, pos ≤ 10) → rewrite title/meta | owner / source | thresholds first pass (OD-SC-4) | 8 weeks data | — | rule | apply weekly |
| R2 | Position 5–20, impr ≥ 50 → improve page + 2–3 internal links | content | — | — | — | rule | apply |
| R3 | Query exists, no dedicated page (impr ≥ 100) → brief a landing page; route changes need approval | content / owner | — | route approval | — | rule | brief first |
| R4 | Strong page, falling clicks (≥ 30% down, impressions stable) → refresh | content | — | — | — | rule | apply |
| R5 | Target term absent from export: **absence is not zero**; record, do not build | — | — | — | — | rule | report only |
| R6 | Legacy URL receiving impressions on canonical host only; after 8 weeks bring trend to 307→308 decision (OD-1) | owner | OD-1 pending | 8 weeks of exports | — | rule | Phase 2E |
| R7 | Locale mismatch → check hreflang; log for Phase 2 QA | source | — | — | — | rule | `cha-i18n-seo` |
| R8 | Question query without answer page (impr ≥ 30) → FAQ item or post | Hub content | — | — | — | rule | Hub content |
| R9 | Filipino-language query with impressions > 0 → evidence for Phase 9 | owner | — | — | `phase-9/FILIPINO-CONTENT-BRIEFS.md` | rule | map to brief |
| R10 | Branded query growth → report only | — | — | — | — | rule | Phase 11 tracking |
| none — "§4 Verify once in the UI that `(?i)` is accepted" | regex flag check | owner | — | — | — | UNVERIFIED | verify once |
| none — "§5 Monthly review (nine areas)" | technical health, index coverage, winners/losers, product indexing, MC health, rich results, organic revenue, backlinks, local | owner | — | Phase 5 live; GBP (not eligible) | — | workflow | monthly |
| none — "§6 Report template" | weekly markdown with property totals vs disclosed rows, locale split incl. other-host, R1–R10, question/Filipino/branded, checked items | owner / helper | — | exports | — | template | copy per week |
| none — "§7 Helper `scripts/gsc-report.mjs` WRITTEN 2026-11-01, corrected same day" | malformed metrics rejected; folder validation; comparison only when comparable; host classification; totals vs disclosed; ABSENT not zero; no prefill | source | written under PR #462 authorization | — | `tests/gsc-report.test.mjs` (11), `tests/fixtures/gsc/` | written and corrected | — |
| none — "First real run: the next export (OD-SC-1); header names UNVERIFIED; fails loudly if they differ" | first real run | owner / source | — | OD-SC-1 export | — | UNVERIFIED headers | run on next export |
| OD-SC-3 (§7 out of scope) | Search Console API later (OAuth credentials) | owner | pending | — | — | out of scope v1 | decide later |
| none — "§8 Weekly cycle Mon–Fri–Next Mon" | export, triage ≤ 3 actions, implement, internal links, request indexing only for material changes, compare | owner / source | — | — | — | cycle | run weekly; never claim OBSERVED without export |
| OD-SC-1 | Who exports weekly; whether Claude receives CSVs | owner | pending | — | — | pending | decide |
| OD-SC-2 | Reports in `docs/seo/reports/` or outside git | owner | pending | — | — | pending | decide |
| OD-SC-3 | Pursue Search Console API access later | owner | pending | — | — | pending | decide |
| OD-SC-4 | Threshold values in §3 after first 8 weeks | owner | pending | 8 weeks data | — | pending | tune |
| none — "UNVERIFIED (§10)" | property access (X8); `(?i)` acceptance; export column names; analytics tool/events; MC/GBP availability | — | — | — | — | UNVERIFIED | — |

---

## IDs seen (distinct ID strings encountered across the 18 documents)

Requirement / register ids: R-01, R-02, R-03, R-04, R-05, R-06, R-07, R-08, R-09, R-10, R-11, R-12, R-14, R-15, R-17, R-18, R-19, R-20, R-21, R-22, R-23, R-24, R-25, R-26, R-26 add-on, R-27, R-28, R-29, R-30, R-31, R-32, R-36, R-37.
Matrix section ids: A-1, A-2, B-1, C-1, C-2, C-3, C-4, C-5, D-1, D-2, D-3, E-1, E-2, F-1, H-1, H-2, I-1, I-2, I-3, I-4, I-5.
Owner action list: O-1, O-2, O-2a, O-2b, O-3, O-4, O-5, O-6, O-7, O-8, O-9, O-10, O-11, O-12, O-13, O-14.
Bugs / findings / decisions carried: BUG-02, BUG-03, BUG-06, BUG-09, D1, D2, D3, G1, G2, G3, G4, G5, GSC-09, X3, X4, X5, X6, X8, X9, X10, F2, R-1, S-1, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, T1, T2, T3, T4, T5, T6, T7, T8, T9, B1, B2, B3, B4, B5, B6, B7, B8, S1–S10 (source tags), C0/H0 (key-order rule), #418 (React issue).
Owner decisions: OD-1, OD-3, OD-4, OD-6, OD-7, OD-11 (test name only), OD-14, OD-15, OD-F1, OD-SD-1, OD-S4-3, OD-S4-4, OD-S4-6, OD-S4-7, OD-S4-9, OD-CT-1..6, OD-MC-1, OD-MC-2, OD-MC-3, OD-MC-4, OD-MC-5, OD-MC-6, OD-MC-7, OD-MC-8, OD-MC-9, OD-MC-10, OD-MC-11, OD-MC-12, OD-P6-1, OD-P6-2, OD-P6-3, OD-P6-4, OD-P6-5, OD-P6-6, OD-P6-7, OD-P6-8, OD-P6-9, OD-P6-10, OD-GBP-1, OD-AUTH-1, OD-AUTH-2, OD-AUTH-3, OD-AUTH-4, OD-ATTR-1, OD-ATTR-2, OD-ATTR-3, OD-ATTR-4, OD-ATTR-5, OD-SC-1, OD-SC-2, OD-SC-3, OD-SC-4, P3-1, P3-2, P3-3, P3-4, P3-5.
Merchant Center gaps: MC-G1, MC-G2, MC-G3, MC-G4, MC-G5, MC-G6, MC-G7, MC-G8, MC-G9, MC-G10, MC-G11, MC-G12, MC-G13.
PRs / commits named: #410, #416, #418, #436, #437, #438, #439, #441, #452, #454, #455, #456, #458, #460, #462; `4dc3c23`, `7aac136`, `54cc316`, `aacb81e`, `f324135`, `a51e2b2`, `6e264b9`, `7d26130`, `2e83545`, `47ffc77`, `9518974`, `d0b3b5f`, `81f9aa0`.

## Items without an ID (rows whose ID cell starts with `none`), per document

| Document | Rows | Items without an ID |
|---|---|---|
| 1. `docs/seo/SEO-REQUIREMENTS-MATRIX-2026-11-01.md` | 82 | 6 |
| 2. `docs/seo/NOTION-SEO-UPDATE-MANIFEST-2026-11-01.md` | 16 | 10 |
| 3. `docs/seo/phase-3/PHASE-3-REPORT.md` | 27 | 21 |
| 4. `docs/seo/phase-4/PHASE-4-REPORT.md` | 23 | 18 |
| 5. `docs/seo/phase-4/STRUCTURED-DATA-REVIEW-2026-11-01.md` | 8 | 4 |
| 6. `docs/seo/phase-5/MERCHANT-CENTER-READINESS.md` | 51 | 35 |
| 7. `docs/seo/phase-5/MERCHANT-FEED-IMPLEMENTATION-PROPOSAL.md` | 34 | 15 |
| 8. `docs/seo/phase-6/COMMERCIAL-LANDING-ARCHITECTURE.md` | 24 | 13 |
| 9. `docs/seo/phase-6/INTERNAL-LINKING-MAP.md` | 19 | 17 |
| 10. `docs/seo/phase-7/KIHEI-CLUSTER-PLAN.md` | 18 | 15 |
| 11. `docs/seo/phase-7/KIHEI-PILLAR-DRAFT.md` | 14 | 12 |
| 12. `docs/seo/phase-8/K18-CLUSTER-PLAN.md` | 14 | 12 |
| 13. `docs/seo/phase-8/K18-PILLAR-DRAFT.md` | 13 | 12 |
| 14. `docs/seo/phase-9/FILIPINO-CONTENT-BRIEFS.md` | 27 | 19 |
| 15. `docs/seo/phase-10/LOCAL-SEO-GBP-READINESS.md` | 21 | 14 |
| 16. `docs/seo/phase-11/AUTHORITY-OPPORTUNITIES.md` | 27 | 22 |
| 17. `docs/seo/phase-12/ORGANIC-ATTRIBUTION-DESIGN.md` | 23 | 14 |
| 18. `docs/seo/phase-12/SEARCH-CONSOLE-OPERATIONS.md` | 30 | 12 |
| **Total** | **471** | **271** |

