# SEO documentation inventory — part A (18 of 36 documents), 2026-11-01

**What this is:** the read-only, row-by-row inventory of every actionable requirement, decision, dependency, gate and defect in 18 SEO documents, produced on 2026-11-01 from the working tree of PR #462 at `1b654f7` (with the reconciliation batch's uncommitted edits; documents are quoted, not interpreted). It is the source-to-matrix mapping evidence for `SEO-REQUIREMENTS-MATRIX-2026-11-01.md` §K–§L. `CONFLICT:` notes mark where two documents disagreed at the time; §L of the matrix records how each was resolved or labelled. Nothing here is a status of its own.

---

# Inventory A — actionable items in 18 SEO documents

Source worktree: `/Users/aprillargo/Code/cha-jewels-web-seo-complete` at `1b654f7` (read-only; 2026-11-01). Rows copy what each document states; no interpretation. "CLOSED"/"DONE" rows are included and marked. Where two documents disagree a `CONFLICT:` note is placed in the row. Anything not checkable from the documents is marked UNVERIFIED.

Column key: ID · What it requires · Owner · Approval/decision state (as stated) · Dependencies/gates named · Evidence named · Current state word · Remaining action per the document.

---

## 1. docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md

(a) Strategic plan §1–§33 and Final Recommendation; prepared 2026-10-28, §33 addendum 2026-10-29, later edits 2026-10-31 and 2026-11-01. Status words carried: ✅ Built / ⚠️ / ❌ Missing (audit tables); P0–P3; IMPLEMENTING, DEPLOYED, NOT STARTED, AUDITED, OBSERVED IN SEARCH CONSOLE, READY FOR QA, CLOSED — NOT ELIGIBLE, SUPERSEDED, LIVE — FIRST REAL DELETE PENDING, OPEN, CLOSED, MOVED OUT OF SEO SCOPE.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — "Fixing multilingual URL architecture" (§1 item 1) | Move EN/JA to dedicated `/en/`, `/ja/` URLs | Site | plan priority P0 (§2.2, §27) | Phase 2; §4 Phases A–F | §33.1: 2A–2E stage 1 DEPLOYED | DEPLOYED (stage 1); 308 promotion NOT STARTED | 308 promotion only when explicitly approved; do not implement OD-6 from the audit |
| none — "Making layaway fully indexable" (§1 item 2; §3, §12) | Create `/en/layaway`, no `/ja/layaway` | Site | plan P0 | Phase 3 | §33.1: DEPLOYED in #421 | DEPLOYED; Search Console recrawl pending | none stated beyond recrawl |
| none — "Expanding structured data" (§1 item 3; §6–§8, §16) | Add BreadcrumbList, rating/review, shipping/returns, Organization fields only when real | Site | P1 | Phase 4 | §33.1 DEPLOYED in #421; no shipping/returns by owner decision | DEPLOYED | rating only when genuine approved review exists |
| none — "Building Google Merchant Center integration" (§1 item 4; §15) | Verify/create Merchant Center; Hub → feed → Merchant Center; sold → out_of_stock; GTIN/MPN only when real | Owner (account), Site (feed) | P1; not found in repo; verify externally | Phase 5 | §33.1: feed builder implemented (route gated) | AUDITED / builder implemented | owner account verification; feed route approval |
| none — "Building high-intent commercial landing pages" (§1 item 5; §14, §22, Phase 6) | Landing pages for 10 themes; keyword validation before URLs/titles; Hub SEO fields | Owner, Hub, Site | P1 | Phase 6 | §33.1: AUDITED | AUDITED | keyword validation; owner decisions |
| Phase 6 add-on `llms.txt` | Plain-text `/llms.txt`; static; sitemap pages only; no figures; JA never links layaway; test every link 200 and indexable | Site | owner decision 2026-10-31 (added to Phase 6) | Phase 6 URLs/titles final; `check:terms`, `check:money`, `check:i18n` | `app/llms.txt/route.ts`, `lib/llms-txt.ts`; branch `seo/master-plan-completion` | IMPLEMENTED 2026-11-01 — READY FOR QA | real-data and deployment runs pending |
| none — "Creating Kihei and K18 topical authority hubs" (§1 items 6; §10, §11) | `/en/guides/kihei/`, `/en/guides/k18-gold-japan/` pillars and clusters | Site/Owner editorial | P1 | Phases 7, 8; route approval | §33.1: AUDITED / drafts | AUDITED | editorial and route approval; "No Kihei collection should be invented when Hub has none" |
| none — "Building selected Filipino/Taglish SEO content" (§1 item 7; §13) | 5–10 high-intent pages after Search Console / autocomplete research; expand only on demand | Owner/Site | P2 | Phase 9 | §33.1 AUDITED | AUDITED | research steps 1–5 of §13 |
| none — "Improving local SEO and Google Business Profile" (§1 item 8; §17) | Verify/optimize GBP; align identity | Owner | OD-GBP-1 = No (2026-10-31) | Phase 10 | §Phase 10 text | CLOSED — NOT ELIGIBLE (Business Profile part) | revisit only if customers received in person; identity via Phases 4, 5, 11 |
| none — "Building external authority and backlinks" (§1 item 9; Phase 11) | Earn links from listed source classes; avoid purchased spam | Owner | P2 | Phase 11 | §33.1 AUDITED | AUDITED | none stated |
| none — "Running SEO from real Search Console data" (§1 item 10; §19, §20, §29, Phase 12) | Weekly export; opportunity rules; question regex; monthly review | Owner, Site | — | Search Console property | §33.1 IMPLEMENTING | IMPLEMENTING | re-read about 5 and 12 Nov |
| none — §2.1 "Search Console ⚠️ No verified property observed in 2026-10-29 audit" | Owner must verify Domain property and establish Day-0 export | Owner | — | — | §33.1 corrected: verified, OBSERVED for 3 URLs | IMPLEMENTING (per §33.1) | coverage report; first export |
| none — §2.1 "Redirect support — Verify old-domain redirects" / §2.2 "Old-domain redirect verification P0" | Verify `chajewelsjapan.com` redirect | Owner | superseded by owner decision KEEP, NO REDIRECT (2026-10-31) | — | §18 banner; §33.4; `SEO-IMPLEMENTATION-STATUS.md` D2 | SUPERSEDED / CLOSED | nothing to implement |
| none — §2.2 "Filipino/Tagalog SEO locale ❌ Missing P2" | `/fil/` locale | Owner | not proposed (see register) | route-change rule | §22 IA shows `/fil/` | NOT STARTED (UNVERIFIED word; plan gives only "Missing") | — |
| none — §2.2 "BreadcrumbList schema ❌ P1" | Add BreadcrumbList JSON-LD on products, categories, collections, blog, guides; validate with RRT | Site | — | Phase 4 | §33.1 DEPLOYED | DEPLOYED | — |
| none — §2.2 "AggregateRating / Review schema ❌ P1" (§7) | Output only approved visible reviews, count > 0, synced with Hub; RRT test | Site/Hub | — | real review data | §33.1 "rating only when genuine approved review exists" | DEPLOYED (branch), awaiting data | re-test after first real review |
| none — §2.2 "Merchant shipping/returns structured data ❌ P1" | Add `shippingDetails`, `hasMerchantReturnPolicy` when real | Site/Owner | §33.1: "no merchant shipping/returns by owner decision" | — | — | not added by owner decision | — |
| none — §2.2 "SEO fields in Hub for category/collection pages ⚠️ P1" (§14) | Hub stores SEO title, description, H1, intro, long copy, keywords, hero, alt, FAQ | Hub/Owner | — | Phase 6 | Status: contract DRAFT | AUDITED (draft) | owner decision |
| none — §2.2 "Image SEO metadata in Hub ⚠️ P3" (§23) | Hub stores alt, image type, primary, angle, detail, hallmark, certificate | Hub/Owner | — | — | — | P3 (no status word) | — |
| none — §2.2 "Video structured data ❌ P3" | Video schema | Site/Hub | — | — | — | P3 (no status word) | — |
| none — §5 "Recommended testing direction" (homepage title) | Review GSC impressions; finalize title; measure CTR 4–8 weeks | Owner/Site | — | Search Console data | — | not started (UNVERIFIED word; plan text only) | steps 1–6 |
| none — §6 "Never invent" rules | Structured data never invents reviews, ratings, GTIN, MPN, shipping, returns, brand, origin | Site | rule | — | — | rule | — |
| none — §9 supporting guide pages | `/en/guides/japanese-gold-hallmarks`, `k18-vs-k24-gold`, `kihei-chain`, `diamond-4cs`, `akoya-pearl-guide` | Site/Owner | — | Phase 6 `/en/guides/*` family (per register) | — | not created (UNVERIFIED word) | — |
| none — §12 layaway supporting pages | `/en/guides/jewelry-layaway-japan`, `how-jewelry-layaway-works`, `kihei-installment-japan` | Site/Owner | — | OD-P6-7 (per register) | — | deferred | — |
| none — §24 trust pages | Six trust pages (How we check, hallmarks, certificates, preloved condition, gram weight, photography) | Owner/Site | — | Phase 6 (per guide review) | — | not created | — |
| none — §25 Content quality rule | No mass-produced AI articles, city pages, duplicates | all | rule | — | — | rule | — |
| none — §28 Systems not to rebuild | Do not rebuild sitemap, robots, JSON-LD foundation, OG, metadata, related products, images, Jewelry Guide, Search Console tracking | all | rule | — | — | rule | — |
| Phase 0 (§26) | Baseline: indexed pages, exclusions, queries, CTR, revenue, organic conversion | Owner/Site | — | — | §33.1 | IMPLEMENTING (Search Console); organic sales measurement NOT STARTED | re-read ~5 and ~12 Nov |
| Phase 1 (§26) | Verify live robots, sitemap, canonical, hreflang, 404, redirects, www/https, old domain, staging noindex, indexing | Site | — | baseline documented first | §33.1 VERIFIED at audit level | VERIFIED; "mobile speed and crawlable navigation are outstanding work" | — |
| Phase 2 (§26) | `/en/`, `/ja/`: migrate families; update canonical, hreflang, sitemap, redirects, links, switcher | Site | — | §4 A–F | §33.1 | 2A–2E stage 1 DEPLOYED; 308 NOT STARTED | explicit approval for 308 |
| Phase 3 (§26) | `/en/layaway` with URL, canonical, metadata, H1, calculator, FAQ, links; submit for indexing | Site/Owner | — | — | §33.1 DEPLOYED #421 | DEPLOYED | recrawl pending |
| Phase 4 (§26) | BreadcrumbList, AggregateRating, Review, shipping, returns, Organization fields, sameAs, logo; validate every template | Site | shipping/returns excluded by owner | — | §33.1 DEPLOYED #421 | DEPLOYED | — |
| Phase 5 (§26) | Verify/create Merchant Center; Hub → feed; monitor rejections, identifiers, mismatches | Owner/Site/Hub | — | — | §33.1 feed builder implemented | AUDITED / builder implemented | account; route |
| Phase 6 (§26) | Commercial landing pages for 10 themes; keyword validation first; llms.txt add-on | Owner/Site/Hub | — | — | §33.1 | AUDITED; llms.txt READY FOR QA | — |
| Phase 7 (§26) | Kihei pillar + cluster with real pieces | Site/Owner | — | — | §33.1 | AUDITED | — |
| Phase 8 (§26) | K18 cluster (hallmarks, purity, weight, authentication, buying, care) | Site/Owner | — | — | §33.1 | AUDITED | — |
| Phase 9 (§26) | Publish 5–10 Filipino/Taglish pages; measure; expand on evidence | Owner/Site | — | — | §33.1 | AUDITED | — |
| Phase 10 (§26) | Verify/optimize GBP; align identity | Owner | OD-GBP-1 = No, 2026-10-31 | — | Phase 10 text | CLOSED — NOT ELIGIBLE | revisit only if in-person customers |
| Phase 11 (§26) | Earn links (industry, Japan–Philippines, Tokyo orgs, exhibitions, suppliers, interviews, community, trade) | Owner | — | — | §33.1 | AUDITED | — |
| Phase 12 (§26) | Weekly Search Console loop; monthly review list | Owner/Site | — | Search Console data | §33.1 | IMPLEMENTING | — |
| P0 Search Console baseline (§27) | — | Owner | — | — | — | IMPLEMENTING (per §33.1) | — |
| P0 Production canonical/indexing audit (§27) | — | Site | — | — | — | VERIFIED (per §33.1) | — |
| P0 EN/JA URL architecture (§27) | — | Site | — | — | — | DEPLOYED stage 1 | — |
| P0 Fix Layaway indexability (§27) | — | Site | — | — | — | DEPLOYED | — |
| P0 Verify old-domain redirects (§27) | — | Owner | KEEP, NO REDIRECT | — | §33.4 | CLOSED/SUPERSEDED | — |
| P1 Merchant Center / Breadcrumb schema / rating schema / Collection SEO fields / Kihei hub / K18 hub (§27) | — | — | — | — | — | see phase rows | — |
| P2 Filipino SEO pages / GBP / Authority (§27) | — | — | — | — | — | see phase rows | — |
| P3 Image SEO metadata / Video schema (§27) | — | — | — | — | — | no status word | — |
| none — §32 Immediate next actions 1–20 | Ordered list: export baseline … begin backlink program | Owner/Site | — | — | — | partly done (see phases) | items 13–20 remain per phase rows |
| Gate 0 — Owners and releases (§33.3) | #423–#425 DONE via #426; owner verifies GSC Domain property via DNS TXT, submits sitemap, records reports; written decision on old-domain shop | Owner | old-domain decided KEEP 2026-10-31 | — | release #426; owner-reported live checks | DONE (fixes); IMPLEMENTING (GSC); CLOSED (old domain) | GSC coverage reports when available |
| Step 1 — Crawlability and metadata (a)–(f) (§33.3) | Crawlable menu links; Tokusho descriptions; title SKU placement; blog cover alt; truthful `lastmod`; breadcrumb tap area | Site | — | — | Status: PR #429 → #430 | DEPLOYED (per Status) | — |
| Step 2 — Collection SEO (§33.3) | ItemList for visible items; Hub hero image as OG | Site | — | — | Status: PR #432 → #433 | DEPLOYED (per Status) | — |
| Step 3 — Performance 3a/3b/3c (§33.3) | 3a phone home animations/layout; 3b large listing payloads; 3c caching/root-layout dependencies; comparable Lighthouse before/after | Owner scopes; Site | — | "Do not apply root caching simply to satisfy a synthetic score" | `PERF-STEP3-FINDINGS.md` | 3a DEPLOYED; 3b, 3c AUDITED | owner scoping |
| Step 4 — Hub-managed content (§33.3) | Accurate SEO text for collections/categories; improve descriptions with verified facts; correct "Japan-made" claims only after owner-approved exact text | Owner (Hub edits) | owner decisions recorded 2026-10-30 | owner edit gate | `STEP-4-OWNER-APPROVAL-RECORD.md` | AUDITED — OWNER APPROVAL PENDING | collection/category texts not yet applied in Hub (live re-check 2026-10-31) |
| Step 5 — Resume roadmap (§33.3) | Phase 2 permanent redirects (not automatic OD-6); Phases 5–12 | Owner/Site | — | data and decisions | — | NOT STARTED (per Status) | — |
| none — §33.2 "Titles: root `/` and `/ja` duplicate" | Defer root duplicate to approved Phase 2 redirect stage | Site | — | OD-3 | — | deferred | — |
| none — §33.2 "Performance: mobile `/ja` 36 …" | Dedicated performance phase; verify root cause before caching edits | Owner/Site | — | — | auditor-reported Lighthouse v12 | not reproduced (PERF doc) | — |
| none — §33.2 "Sitemap: add truthful modification dates; image entries" | lastmod only when backed by real timestamp; product image entries | Site | — | — | Step 1(e) | DEPLOYED (per Status) | — |
| none — §33.2 "Crawling under load: one transient 500, four timeouts" | Investigate during performance phase | Site | — | — | — | open | — |
| none — §33.2 "Mobile UX: breadcrumb tap ~15 px; labels ~11.5 px" | Improve tap target/readability | Site | — | — | Step 1(f) | DEPLOYED (tap area) | labels UNVERIFIED |
| D3 (§33.2 "Existing policy") | Sold products remain in sitemap; `/ja/layaway` absent | Owner | decided | — | — | preserved | — |
| OD-GBP-1 (Phase 10) | Business Profile eligibility | Owner | No (2026-10-31) | — | — | CLOSED — NOT ELIGIBLE | — |
| none — §33.4 exclusions | Do not: redirect old domain; create `/ja/layaway`, permanent legacy redirect, unsupported markup, rating, GTIN, origin claims; rename slugs; HSTS includeSubDomains; standalone link checker | all | decisions | — | — | rules | — |
| HUB-CATALOG (§33.4) | First owner-authorised deletion observed and verified; #672 migration apply status unstated | Owner/Hub | — | — | Hub PRs #670–#672; apply ~14:38 JST 2026-10-29 | LIVE — FIRST REAL DELETE PENDING | observe first deletion |
| BUG-03 (§33.5) | Article origin wording | Owner (Hub edit) | Option A decided | — | `OUTSTANDING-ISSUES-REGISTER.md` §1 | MOVED OUT OF SEO SCOPE | content task |
| BUG-09 (§33.5) | Search Console coverage and performance baseline | Owner | — | — | `SEARCH-CONSOLE-BASELINE-2026-10-30.md` | OPEN | coverage; baseline |
| BUG-06 (§33.5) | `/gold-guide` redirect chain | Owner/Site | route-change rule | redirect work approval | — | OPEN — deferred | — |
| OG-PRODUCT (§33.5) | Product sharing metadata | Site | — | — | PR #441 via #442 | CLOSED — DEPLOYED AND VERIFIED LIVE 2026-10-30 (CLOSED) | — |
| BUG-02 / BUG-05 / BUG-08 (§33.1) | Stabilization fixes | Site | — | — | #423–#425 → #426 `97a6e76` | DEPLOYED | — |

---

## 2. docs/seo/SEO-REQUIREMENTS-REGISTER.md

(a) One readable register of every requirement in the Master Plan with approval, owner, evidence, gaps, acceptance and next action; dated 2026-10-31, revised 2026-11-01. Status words: NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE · CLOSED · OWNER DECISION PENDING; evidence tags [V]/[O]/[U]. States "the complete matrix is `SEO-REQUIREMENTS-MATRIX-2026-11-01.md`" (not in this inventory's 18 files; UNVERIFIED here).

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| R-01 Baseline | Code and live probe; checker stays at 0 fail | Site | plan Phase 0 | — | `SEO-BASELINE.md`; [V] 2026-10-28; 2026-10-31 432/0; 2026-11-01 local 671/0, DOM 685/0; production 555/110 | VERIFIED (gap: none) | re-run on pinned candidate and after release |
| R-02 Search Console property, sitemap, priority URLs | Property verified; `/en`, `/ja`, `/en/layaway` observed indexed; 8 sampled deeper URLs not indexed | Owner | owner | — | [V 2026-10-30, UI]; `SEARCH-CONSOLE-BASELINE-2026-10-30.md` | OBSERVED IN SEARCH CONSOLE (3 URLs only) | owner re-inspection of same 8 URLs, no indexing request |
| R-03 Search Console reporting and weekly ops | Performance export with enough days; Page indexing export once populated; `scripts/gsc-report.mjs` | Owner (exports), Site (records) | OD-SC-1..4 pending | — | `SEARCH-CONSOLE-BASELINE-2026-10-31.md`; helper 11 tests | IMPLEMENTING (UNVERIFIED word; register text: "Gap: no meaningful baseline") | owner reads ~5 and ~12 Nov; first real run on next export (OD-SC-1); header names UNVERIFIED |
| R-04 Organic purchase/revenue attribution | Owner-approved design before any tracking change | Site + Hub + Owner | none; OD-ATTR-1..5; consent UNDECIDED | — | `phase-12/ORGANIC-ATTRIBUTION-DESIGN.md` (2026-11-01, corrected) | design written; "organic attribution is not implemented" | owner decision, consent first. CONFLICT: Status Phase 12 row says "OD-ATTR-1..4"; register and QA §17 say OD-ATTR-1..5 |
| R-05 robots.txt and private/utility noindex | Private routes noindex, no canonical | Site | Release 0 | — | PR #397; BUG-05 in #426; [V 2026-10-31] | DEPLOYED | manual QA with test account (X6/X7, owner-run) |
| R-06 404 and unknown-path metadata hygiene (X1) | Each covered 404 shape: noindex, no canonical/hreflang/og:url in raw HTML and live DOM; valid routes unchanged | Site (SEO foundation batch, PR #452) | batch authorized 2026-10-31; "Not part of R-10" | develop-preview real-Hub gate (QA §15) | `lib/seo-policy.ts` `routeShapeOf`/`seoLinkPlan`; `scripts/check-seo-dom.mjs`; `FOUNDATION_MATRIX` | READY FOR QA | QA, then release; production confirmation after release |
| R-07 Sitemap | 976 URLs; `lastmod` only from trustworthy source (8 entries by design) | Site | OD-12; D3 | X10 later review | [V 2026-10-31] | DEPLOYED | add `lastmod` only if Hub supplies real content-modified timestamp |
| R-08 Locale routes `/en`, `/ja` | Locale URLs 200, self canonical | Site | OD-2, 3, 8, 9, 10, 15 (2026-10-28) | R-10 for permanent redirects | 2A–2E-stage-1 production-verified | DEPLOYED; SEARCH ENGINE RECRAWL PENDING | none until R-10 approved |
| R-09 Canonical and hreflang | One self canonical; en/ja/x-default only for existing eligible languages | Site | OD-2, OD-12 | — | [V 2026-10-31] 571 local / 432 production | DEPLOYED | preserved unchanged |
| R-10 Permanent redirects, root, `?lang=`, bare `/layaway`, `/gold-guide` | Redirect matrix tests, no loops, canonical/hreflang unchanged, layaway rules intact | Owner decides; Site implements (dedicated branch) | OWNER DECISION PENDING (OD-1, OD-3, OD-4, OD-6; route-change rule) | owner decision + populated Search Console Pages data; no calendar date | [V 2026-10-31] observations | NOT STARTED | owner decision |
| R-11 `/gold-guide` two-hop (BUG-06) | Folded into R-10 | Owner/Site | same as R-10 | R-10 | — | OPEN, deferred | — |
| R-12 English layaway indexability | No Japanese layaway anywhere | Site | Phase 3 | — | PR #421; R-02 | DEPLOYED | none (layaway guides deferred, OD-P6-7) |
| R-13 Titles and descriptions | One title per page | Site | Step 1 | R-10 for `/` vs `/ja` duplicate | production-verified | DEPLOYED; homepage title testing NOT STARTED | none now |
| R-14 Product sharing metadata (OG-PRODUCT) | — | Site | — | — | PR #441, release #442 | CLOSED, DEPLOYED AND VERIFIED LIVE (CLOSED) | — |
| R-15 Sharing identity: `og:url`, `fb:app_id` on locale tree | Exactly one og:url = canonical; exactly one fb:app_id; og:locale pair correct | Site | owner request 2026-10-01; batch authorized 2026-10-31 | release gate (QA §15) | `lib/og-meta.ts`; `localizedMeta` | READY FOR QA | QA, release |
| R-16 Listing SEO (Step 2) | ItemList, hero OG | Site | Step 2 | — | DEPLOYED | DEPLOYED | batch adds only og:url |
| R-17 Structured data | JewelryStore/Product/BreadcrumbList/FAQPage/BlogPosting; Offer = displayed variant; OnlineStore question | Site | Phase 4; OD-SD-1 open | — | PR #421; #426; `phase-4/STRUCTURED-DATA-REVIEW-2026-11-01.md` | DEPLOYED; Offer fix READY FOR QA; OD-SD-1 "no change made" | OD-SD-1; release |
| R-18 Image SEO | Alt from Hub data where exists, never invented | Site + Hub | — | with R-26 | 906 image entries [V 2026-10-31] | PARTIAL | owner decision on Hub image fields |
| R-19 Video schema and content | Per-video assessment; `VideoObject` only for eligible video | Site + Hub | none | Hub API key for product-video count | review §3 (2026-11-01) | three site videos not eligible; product-video inventory UNKNOWN; "Not closed". CONFLICT: Status Phase 4 row says "video eligibility ASSESSED (none)" | read-only API count; per-video look |
| R-20 Internal linking and crawlable navigation | Category and company links in initial HTML | Site | Step 1(a) | R-26 for cluster links | PR #429 → #430 | DEPLOYED | with R-26 |
| R-21 Step 3a | Measured comparable runs before any claim | Site | — | — | #436, #439 | DEPLOYED; no production gain confirmed | none |
| R-22 Steps 3b and 3c | Matched before/after mobile runs; cart/account/Hub freshness unaffected | Owner scopes; Site | none | owner scoping + measured need; no calendar date | `PERF-STEP3-FINDINGS.md` | AUDITED | owner scoping |
| R-23 Step 4 Hub-managed content | Checklist §8 acceptance | Owner edits; Site verifies | OD-S4-2..10 recorded 2026-10-30 | HUB-S1 | [V 2026-10-31] six listing records unchanged | AUDITED — OWNER APPROVAL PENDING | owner publishes; Site verifies |
| R-24 BUG-03 article wording | Both language bodies verified live without the four phrases | Owner (Hub edit) | Option A decided; out of SEO scope (PR #450) | — | [V 2026-10-31] not yet applied | out of SEO scope; not applied | owner applies Option A |
| R-25 Merchant Center | Feed per readiness §7/§9; builder implemented; route PROPOSED | Owner (account), Site (route), Hub (data) | none; OD-MC-1..11; OD-MC-12 Hub item | X8; MC-G1..G13 | `lib/merchant-feed.ts` 12 tests; `phase-5/MERCHANT-FEED-IMPLEMENTATION-PROPOSAL.md` | AUDITED; builder implemented | owner answers X8 and OD-MC |
| R-26 Commercial landing pages and Hub SEO fields; `llms.txt` | No invented collections; approved Hub fields; llms.txt links fetched 200/indexable | Owner decides; Hub fields; Site renders | none; OD-P6-1..10 | — | `app/llms.txt/route.ts`, `lib/llms-txt.ts`, `lib/sitemap-pages.ts`; QA §17 | AUDITED (pages); llms.txt IMPLEMENTED 2026-11-01, READY FOR QA. CONFLICT: this register's §1 and §2 tables say llms.txt "NOT STARTED" while R-26 says READY FOR QA | OD-P6-1..10; llms-links NOT RUN on real data |
| R-27 Kihei authority (Phase 7) | Route `/en/guides/kihei` needs OD-P6-5 and editorial approval | Site/Owner | — | OD-P6-5 | draft | AUDITED, draft only | approvals |
| R-28 K18 authority (Phase 8) | `/en/guides/k18-gold-japan`; wording rule X9 | Site/Owner | — | OD-P6-5 | draft | AUDITED | approvals |
| R-29 Filipino search (Phase 9) | Options open: Taglish blog (no route change) vs `/fil/` (not proposed); research options none run; no machine translation | Owner decides; Site/Hub publish | none | route-change rule for `/fil/` | `phase-9/FILIPINO-CONTENT-BRIEFS.md` | AUDITED | owner chooses after evidence |
| R-30 Jewelry and shopping guides | Terminology PASS; near-misses OD-CT-1..4 | Site/Owner | OD-CT-1..4 open | — | `GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md` §1 | AUDITED | OD-CT-1..4 |
| R-31 Authenticity and trust content | No fabricated review/rating; claims vs evidence | Site/Owner | OD-CT-5, OD-CT-6 open | Phase 6 for trust pages | review §2 | AUDITED | OD-CT-5/6 |
| R-32 Question-query strategy / content quality rule | Content briefs cite a query source | Site/Owner | — | R-03 query data | — | method; no calendar date | choose sources when GSC query data exists |
| R-33 Google Business Profile | Do not create a profile | Owner / External | OD-GBP-1 = No (2026-10-31, PR #454) | — | — | CLOSED — NOT ELIGIBLE (CLOSED) | revisit only if in-person customers |
| R-34 Authority and backlinks (Phase 11) | Documentation only | Owner | OD-AUTH-1..3 (OD-AUTH-4 withdrawn, PR #451) | — | — | documentation only | owner-led |
| R-35 Old domain `chajewelsjapan.com` | Nothing to implement | Owner | KEEP, no redirect (PR #451) | — | — | CLOSED (CLOSED) | — |
| R-36 Public subdomains `portal.`, `paymenthub.` (GSC-09) | Owner-defined policy verified with public requests only | Owner decides; Hub / Firebase | none | — | `SEARCH-CONSOLE-BASELINE-2026-10-31.md` §5 | policy undecided | owner decision |
| R-37 Rollback-mode duplicate og:url | Exactly one og:url in rollback mode | Site | — | — | `scripts/check-seo-rollback.mjs` 10/0/0 | CLOSED 2026-11-01 (CLOSED) | note: bare missing resource still carries legacy tags in rollback mode |
| MC-G1 | One agreed feed URL; route produces it; `/api/` robots disallow checked on first fetch | Owner decides URL; Site | agreed form `/api/merchant-feed?lang=ja|en` (2026-11-01) | — | — | open (URL agreed) | first fetch check |
| MC-G2 | Stale X5 sentence corrected | Site (docs) | — | — | readiness §3 | done (CLOSED) | — |
| MC-G3 | External prerequisites: account/verification (X8), image-host access, `free_shipping_threshold`, category map | Owner; Site | — | X8 | — | open | each answered Y/N with date |
| MC-G4 | Counts re-read from Website API at route implementation | Site | — | API key | 453 products 2026-11-01; sold count [U] | open | re-read and date |
| MC-G5 | OD-MC-9 rule restated whenever D3/X10 changes | Owner | — | D3, X10 | — | open | — |
| MC-G6 | `item_type` presence in production checked read-only | Hub (data); Site (check) | — | — | — | unverified | check |
| MC-G7 | Written identifier rule per piece class; builder excludes branded pieces until OD-MC-11 | Owner (evidence); Site (rule) | OD-MC-11 pending | — | builder rule 2026-11-01 | open | OD-MC-11 |
| MC-G8 | Feed item equals landing page; one item per product = `product_variants[0]` | Owner; Site | closed by design 2026-11-01 | — | — | CLOSED (by design) | per-variant feed only with variant-selectable page |
| MC-G9 | Stated maximum age; sold → out_of_stock within it | Owner (target); Site | — | — | — | open | — |
| MC-G10 | `reconcile()` exact membership; truncated answer fails build | Site; Hub (cap) | — | OD-MC-12 (authoritative total) | builder 2026-11-01 | PARTIAL (per QA §17) | Hub total |
| MC-G11 | Non-success or last-good feed on Hub failure; never empty/partial 200 | Site | — | — | proposal 2026-11-01: 503 + `no-store` | PROPOSED | route code |
| MC-G12 | Feed URL and crawl handling under `/api` disallow | Owner (URL); Site | — | MC-G1 | Google help page 404 to fetch agent | [U] | record first fetch |
| MC-G13 | Merchant Center shipping/returns equal published text | Owner; Site | — | OD-CT-4 (per guide review) | proposal §5 steps 4–5 | open | owner enters settings |
| HUB-S1 | Every cited Hub fact re-read and dated or tagged [U] | Site; Hub; Owner | — | — | — | open | re-read |
| HUB-S2 | "Write description (AI)" discards suggestion when inputs/photo change; tests per input | Site (source); Hub (deploy); Owner (approve) | not done here | — | Hub `main` 2026-10-31 read | gap [V]; Hub-repository task | Hub change |
| OD-F1 | Whether to release foundation batch with React #418 open; record impact assessment, reproduction evidence, acceptance in writing | Owner | default: no release | real-Hub gate | QA §15 | in force; "Status: BLOCKED, not waived" | retire only after (a) verifies on re-accepted candidate |
| D1 (§5, "owner decides D1 — adopt the fix") | Adopt React #418 fix | Owner | superseded by merge of #458 (per Preview Acceptance) | — | PR #457 closeout list | — | — |
| none — §6 batch "SEO foundation (PR #452)" | R-06, R-15, tests, register, delivery rule | Site | — | — | #452 | in `develop`; release HOLD | — |
| none — §6 batch "Master-plan completion (PR #462)" | llms.txt, Offer fix, R-19 review, R-37, feed builder, gsc helper, attribution design, guide/trust reviews, runbook, matrix | Site | — | — | #462 | READY FOR QA | — |
| none — §6 "Locale permanent redirects" | R-10, R-11 | Owner | OWNER DECISION PENDING | — | — | OWNER DECISION PENDING | — |
| none — §6 "Measurement design" | R-04 | Owner | needs approval | — | — | design only | — |
| none — §6 "Performance" | R-22 | Owner | — | — | — | owner scoping | — |
| none — §6 "Step 4 content" | R-23, R-24 | Owner; Site verifies | — | — | — | owner-operated | — |
| none — §6 "Merchant Center" | R-25, MC-G1..G13 | Owner/Site/Hub | needs OD-MC and X8 | — | — | — | — |
| none — §6 "Commercial pages, Hub SEO fields, authority content" | R-26..R-32 | Owner | needs OD-P6 and editorial approval | — | — | — | — |
| none — §6 "Subdomain crawl policy" | R-36 | Owner; Hub/Firebase | owner decision | — | — | — | — |
| none — §6 "External" | R-33 (CLOSED), R-34 | Owner | — | — | — | owner-led | — |
| X8 (§1) | Search Console / Merchant Center account status | Owner | GBP part answered No | — | — | open (MC part) | — |
| OD-SD-1 (R-17) | `JewelryStore` vs `OnlineStore` | Owner | open; no change made | — | review §1 | OWNER DECISION PENDING (UNVERIFIED word; register says "owner decision OD-SD-1") | decide |
| OD-SC-1..4 (R-03) | Search Console account/export route and operations | Owner | pending | — | `phase-12/SEARCH-CONSOLE-OPERATIONS.md` | pending | — |
| OD-ATTR-1..5 (R-04) | Attribution design decisions; consent first | Owner | undecided | — | design doc | undecided | — |
| OD-MC-1..12 (R-25) | Merchant Center decisions; OD-MC-12 Hub authoritative total | Owner; Hub | pending | — | — | pending | — |
| OD-P6-1..10 (R-26) | Phase 6 decisions | Owner | pending | — | — | pending | — |
| OD-P6-5 (R-27/R-28) | `/en/guides/*` route-family approval | Owner | pending | — | — | pending | — |
| OD-P6-7 (R-12) | Layaway guides | Owner | deferred | — | — | deferred | — |
| OD-CT-1..6 (R-30/R-31) | Content wording decisions | Owner | open | — | guide review §5 | open | — |
| OD-AUTH-1..3 (R-34) | Authority decisions (OD-AUTH-4 withdrawn) | Owner | open | — | — | open | — |
| OD-GBP-1 (R-33) | GBP eligibility | Owner | No | — | PR #454 | CLOSED | — |
| X1, X6, X7, X9, X10 (referenced) | see Status doc | — | — | — | — | — | — |

---

## 3. docs/seo/SEO-IMPLEMENTATION-STATUS.md

(a) Dated status log of every phase and step; last updated 2026-11-01. Status words: NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE; plus CLOSED, NOT NEEDED, KEEP IN SITEMAP FOR NOW, HOLD, PARTIAL, RESOLVED, DECIDED, OWNER APPROVAL PENDING, READY FOR OWNER REVIEW, PARTIALLY COMPLETE, LIVE — FIRST REAL DELETE PENDING, NOT TESTED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| Phase 0 — SEO baseline | code + live probe | Site | — | — | `SEO-BASELINE.md` | VERIFIED | — |
| Phase 0 — Search Console Day-0 export | property, coverage, performance export | Owner | — | — | baselines 10-30, 10-31 | IMPLEMENTING; 3 URLs OBSERVED IN SEARCH CONSOLE | next reads ~5 and ~12 Nov |
| Phase 0 — Organic sales measurement | design and owner decision; no GA4; no attribution | Site/Hub/Owner | needs decision | — | `SEARCH-CONSOLE-BASELINE-2026-10-31.md` | NOT STARTED | design + owner decision |
| Phase 1 — Private/utility route matrix | — | Site | — | — | Baseline §14 | VERIFIED | signed-in renders not checked (X6) |
| Phase 1 — Search-page indexing policy | `noindex, follow`, not in sitemap, not blocked | Site | decided | — | Baseline §15 | VERIFIED | — |
| Phase 1 — SEO regression tests | 20 unit tests + `scripts/check-seo-live.mjs` | Site | — | — | Release 0 | DEPLOYED | — |
| Phase 1 — Private/utility noindex | — | Site | — | — | PR #397 `5fc238a`; verifier 119/0/1 | DEPLOYED; SEARCH ENGINE RECRAWL PENDING | — |
| Phase 1 — 404 metadata cleanup | `/foo/bar` no canonical/hreflang/og:url | Site | — | — | Baseline §16; register R-06; QA §15 | READY FOR QA (SEO foundation batch) | not deployed. CONFLICT: Phase 2B section says "X1 RESOLVED" while this row keeps 404 cleanup READY FOR QA (multi-segment case) |
| Phase 1 — Verification-only checks | sold products, preview, HTTPS, www | Site | — | — | Baseline §17 | VERIFIED | — |
| Phase 1 — Non-production `X-Robots-Tag` | — | Site | — | — | preview sends `x-robots-tag: noindex` | NOT NEEDED | — |
| Phase 1 — Old-domain redirect (D2) | none | Owner | KEEP, NO REDIRECT (2026-10-31) | — | D2 | CLOSED (CLOSED) | optional: link to new site in Page365 about text |
| Phase 1 — Sold products in sitemap (D3) | keep | Owner | DECIDED | X10 later | — | KEEP IN SITEMAP FOR NOW | X10 review |
| Phase 2 — `/en` and `/ja` URL architecture | 2A, 2B, 2C, 2D, 2E-stage-1 | Site | OD-1 (307), OD-2, 3, 4 (307), 7, 8, 9, 10, 11, 12, 15 approved | 308 stage needs OD-1/OD-4 308 approval; root hreflang resolved | Release PRs #401 `bd28cc6`, #412 `7aac136` | DEPLOYED; SEARCH ENGINE RECRAWL PENDING; 308 stage NOT STARTED | not observed in Search Console |
| Phase 3 — `/en/layaway` | route, FAQ, links, sitemap entry | Site | P3-1..P3-5 | OD-6 not approved | PR #421 `82effab`; QA §7 | DEPLOYED — PRODUCTION VERIFIED; RECRAWL PENDING | — |
| Phase 4 — Structured data | BreadcrumbList, JewelryStore fields, X5, rating branch; Offer = displayed variant; OD-SD-1 | Site | shipping/returns excluded | OD-SD-1 | PR #421; `phase-4/STRUCTURED-DATA-REVIEW-2026-11-01.md` | DEPLOYED; Offer READY FOR QA; OnlineStore review AUDITED; video "ASSESSED (none)" | OD-SD-1 |
| Phase 5 — Merchant Center | builder; route; account | Owner/Site/Hub | OD-MC-7 for route; account OWNER DECISION PENDING | X8 | PR #418; `phase-5/*` | AUDITED; builder IMPLEMENTED (READY FOR QA); route NOT CREATED | — |
| Phase 6 — Commercial landing pages | no route created; Hub SEO fields DRAFT; llms.txt | Owner/Hub/Site | — | — | PR #417; `app/llms.txt/route.ts` | AUDITED — READY FOR OWNER REVIEW; llms.txt IMPLEMENTED (READY FOR QA) | — |
| Phase 7 — Kihei authority | route `/en/guides/kihei` not created; no Kihei collection | Site/Owner | approval needed | — | PR #417 | AUDITED — content DRAFT | — |
| Phase 8 — K18 authority | route not created | Site/Owner | — | — | PR #417 | AUDITED — content DRAFT | — |
| Phase 9 — Filipino search moat | nothing published; no `/fil/` | Owner | — | — | PR #418 | AUDITED — briefs + one DRAFT | — |
| Phase 10 — Local SEO / GBP | do not create profile | Owner | OD-GBP-1 = No | — | `phase-10/LOCAL-SEO-GBP-READINESS.md` | CLOSED — NOT ELIGIBLE (CLOSED) | — |
| Phase 11 — Authority / backlinks | no outreach sent | Owner | — | — | PR #418; §8 execution materials 2026-11-01 | AUDITED, documentation only | — |
| Phase 12 — Weekly Search Console ops | `scripts/gsc-report.mjs`; attribution design | Owner/Site | OD-SC-1 owner's; OD-ATTR-1..4 (CONFLICT: register says 1..5) | — | `phase-12/*`, runbook | IMPLEMENTING | next reads ~5 and ~12 Nov |
| Gate 0 — Stabilization BUG-02, BUG-05, BUG-08 | — | Site | — | — | Release PR #426 | DEPLOYED | — |
| Gate 0 — Search Console set-up | — | Owner | — | — | baselines | IMPLEMENTING | — |
| Gate 0 — Old domain | — | Owner | KEEP, NO REDIRECT | — | D2; §33.4 | CLOSED | — |
| Step 1 — Crawlability and metadata (A–F) | A crawlable nav; B Tokusho descriptions; C titles; D blog alt; E sitemap lastmod/images; F breadcrumb tap | Site | — | — | PR #429 → #430 `2e18bcc`; QA §9 | DEPLOYED — PRODUCTION VERIFIED; RECRAWL PENDING | recheck product image entries after deployment against real Hub |
| Step 2 — ItemList + hero OG | — | Site | — | — | PR #432 → #433 `49c0fd6`; QA §10 | DEPLOYED; RECRAWL PENDING | category OG stays brand image until owner uploads hero |
| Step 3a — Japanese heading font | scoped to `/ja` | Site | — | — | #435/#438 → #436/#439 `59ad3b7`; QA §11–§12 | DEPLOYED; production gain NOT confirmed; real-user effect NOT observed | owner to decide keep vs revert (QA §11) |
| Foundation — og:url, fb:app_id, 404 hygiene, register | — | Site | — | OD-F1; real-Hub gate | #452, #458, #460; QA §15, §16 | in `develop`; release HOLD | credentialed run on pinned candidate; owner approval |
| Completion — llms.txt, Offer, R-37, feed builder, report helper, attribution design, audits, runbook, matrix | — | Site | — | O-1..O-14 owner actions (matrix §J, not in these 18 files — UNVERIFIED) | QA §16–§17; PR #462 | READY FOR QA (2026-11-01, corrected same day; not deployed) | deployment of exact head (runbook §2 step 2) |
| Step 3b — Large collection payloads | — | Owner scopes | — | — | `PERF-STEP3-FINDINGS.md` | AUDITED | — |
| Step 3c — Root-layout rendering / caching | — | Owner scopes | — | own phase, high risk | `PERF-STEP3-FINDINGS.md` | AUDITED | — |
| Step 4 — Hub-managed content | texts owner-operated | Owner | OD-S4-2 Option A, OD-S4-3, OD-S4-4, OD-S4-6 … recorded | — | `STEP-4-OWNER-APPROVAL-RECORD.md`, H1 checklist | AUDITED — OWNER APPROVAL PENDING; NOT yet applied in Hub (2026-10-31) | owner applies |
| Step 5 — Resume Phases 2-final (308, OD-6), 5–12 | — | Owner/Site | — | — | — | NOT STARTED (Phase 12 reads under way) | — |
| D1 (Decisions table) | `check:terms` wording on master plan; content phases use K18 wording | Site | RESOLVED (wording) | — | 6 lines reworded | RESOLVED (CLOSED) | content phases must use K18 wording |
| D2 | Old domain `chajewelsjapan.com` | Owner | CLOSED — KEEP, NO REDIRECT 2026-10-31 (earlier: BLOCKED — EXTERNAL) | — | Page365 facts; Hub functions depend on it | CLOSED | optional link in Page365 about text. CONFLICT: `SEO-BASELINE.md` §6/§17 still states D2 "BLOCKED — EXTERNAL DOMAIN/DNS/HOST CONFIGURATION" |
| D3 | Sold products in sitemap | Owner | DECIDED: KEEP IN SITEMAP FOR NOW | X10 not approved | 120 of 449 sold | DECIDED | Merchant Center must mark sold out of stock |
| D4 | `http://chajewelsjp.com/…` two 308 hops | Owner | Leave | — | Vercel domain setting | Leave (cosmetic) | — |
| X1 | Unmatched-route 404 emits canonical + hreflang | Site | — | Phase 2 | — | deferred → "X1 RESOLVED" (2B) for single-segment; multi-segment in foundation batch | see R-06 |
| X2 | English has no indexable URL; hreflang `en` non-canonical | Site | — | Phase 2 | — | deferred (closed by Phase 2, UNVERIFIED wording) | — |
| X3 | `/layaway` unindexable | Site | — | Phase 3 | — | deferred (closed by Phase 3, UNVERIFIED wording) | — |
| X4 | JSON-LD unit tests need pure builder | Site | — | Phase 4 | `lib/json-ld.ts` (2B) | deferred (done in 2B per text) | — |
| X5 | Product JSON-LD uses `description_en` on JA page | Site | — | Phase 4 | #419 `b7fe6ed` | deferred → in Phase 4 release | — |
| X6 | Signed-in render of `/account`, `/checkout`, `/loyalty/join` not rendered-checked | Owner (manual QA) | — | test account | — | open | manual QA on preview |
| X7 | Branch-alias preview protection assumed equal | Owner | — | — | — | open | confirm in Vercel settings |
| X8 | Search Console and Merchant Center status | Owner | GBP part answered 2026-10-31 | — | — | open (MC part) | — |
| X9 | Wording rule: no country-branded gold, no generic made-in phrasing; origin only from verified data | all (Phases 5, 7–10) | owner 2026-10-28 | — | `check:terms` | rule | — |
| X10 | Sold Product Indexation Policy: per-product evaluation; "No such change is approved" | Owner | not approved | route-change rule | — | deferred (Phase 5 Product SEO review) | — |
| OD-13 | locale homes `/en`, `/ja`, no trailing slash | Site | resolved (technical convention) | — | map | resolved | — |
| OD-14 | migrate existing families under prefixes; §22 tree future | Site | resolved | — | map | resolved | — |
| OD-10 | mechanism A `app/[lang]` | Owner | APPROVED 2026-10-28 | — | map §14 | approved | — |
| OD-2 | x-default English | Owner | APPROVED 2026-10-28 | — | map §14 | approved | — |
| OD-3 | root `/` unchanged until 2E | Owner | APPROVED 2026-10-28 (redirect later) | 2E | map §14 | approved; still gated for 2E | decide at 2E |
| OD-8 | eligible existing language versions only | Owner | APPROVED | — | map | approved | — |
| OD-9 | content-eligibility (neutral-text rule) | Owner | APPROVED 2026-10-28 | — | map §16.1 | approved | re-run audit after imports |
| OD-15 | URL-authoritative language with security requirements | Owner | APPROVED 2026-10-28 | Opus review (completed on Opus 5.5) | map §17 | approved, implemented in 2C | — |
| C0/H0 | legacy canonical+hreflang unchanged for 2B only | Owner | APPROVED for 2B only; expires at 2C gate | — | map §7 | expired/superseded by Option C (307s) | — |
| OD-1 | destination of bare legacy URLs | Owner | APPROVED L2-exact 307 stage (2026-10-28); 308 separate | 2E; Search Console data | map §20 | 307 stage DEPLOYED; 308 NOT STARTED | — |
| OD-4 | `?lang=` URLs | Owner | APPROVED 307 stage | 2E | map §20 | 307 DEPLOYED; 308 open | — |
| OD-6 | bare `/layaway` → `/en/layaway` 308 | Owner | not approved | after `/en/layaway` observed in Search Console | — | NOT STARTED | owner decision |
| OD-7 | switcher no-sibling | Owner | implemented in 2C ("OD-7 switcher as real crawlable links") | — | PR #405 | implemented | — |
| OD-11 | Hub relative links localized at render time | Owner | implemented in 2C | — | PR #405 | implemented | — |
| OD-12 | hreflang HTML only | Owner | APPROVED | — | map §20 | approved | — |
| Gate A (2B) | owner approval of route inventory + written authorization | Owner | given ("implemented under Gate A authorization") | — | — | done | — |
| none — "Phase 2B: OWNER REVIEW ITEM legacy single-segment 404 metadata" | accept as X1 closure or require alternative | Owner | "Merge of the 2B PR decides it" (merged #400/#401) | — | — | accepted at merge (CLOSED) | — |
| none — "Vercel preview facts: CI build step recommended, needs approval" | add `next build` to CI | Owner | needs approval | — | `.github/workflows/ci.yml` | recommendation | — |
| none — "Automation bypass" | optional bypass secret for preview crawls | Owner | not created | — | — | open (O-1 per QA) | — |
| none — "One product page returned HTTP 500 in 2 of 4 early audit passes" | check server logs | Owner/Vercel | — | — | — | unreproduced transient, cause UNVERIFIED | — |
| none — Phase 2C "EXPLICIT RELEASE BLOCKER" | activation only in coordinated 2C+2D+2E-1 release | Owner | released #412 | — | — | superseded (released) | — |
| none — Phase 2C "Opus review of checkout-actions" | — | Owner | COMPLETED 2026-10-28 on Opus 5.5, no defects; LOW observation `writeCart([])` | — | — | done (CLOSED) | — |
| none — 2E-stage-1 "Measured header gap (owner to accept or reject)" | page-level 307 `Vary` without Cookie/Accept-Language | Owner | "PROVISIONALLY ACCEPTED FOR PR REVIEW"; production analysis "no defect; classification as closed is for the owner to confirm" | — | §20.4 | not recorded as accepted risk | owner confirmation |
| none — Coordinated QA "bare `/layaway` across tabs: owner must choose (A) interim mitigation or (B) approved deferral to Phase 3" | — | Owner | superseded: Phase 3 deployed | — | — | resolved by Phase 3 (UNVERIFIED wording) | — |
| none — Release #412 "owner to confirm the merge was intended" | — | Owner | — | — | merged before gate report | open (UNVERIFIED) | — |
| none — CSP report-only warnings (4 hosts) | list or decide first three; identify `mpc2-prod…run.app` | Site/Owner | no policy change | before any enforcement | `lib/csp.ts` | classified; open | identify unknown host |
| none — "Japanese article corrected" (Phase 2 closeout) | — | Owner | approved in session | — | live QA 2026-10-29 | VERIFIED (CLOSED) | — |
| none — "2026-10-28 incident reconciled" | — | Site | — | — | Hub/Square/Paidy queries | reconciled, no discrepancies (CLOSED) | — |
| P3 (closeout follow-up) — pg_net timeouts | observability only | Hub | deferred | — | — | deferred | — |
| TEST-900080 | Square capture/refund match | Hub | — | — | — | VERIFIED, CLOSED | — |
| none — "Paidy test authorizations" | closed without capture | Owner | — | — | — | CLOSED | — |
| none — "Paidy M5 source recognition — DEPLOYED; live check NOT TESTED" | read-only verification on next genuine delivery; `PAIDY_WEBHOOK_RATE_CAP` OFF until then | Hub/Site | — | next Paidy delivery | la-tracking #668/#669 | DEPLOYED; NOT TESTED | verify |
| none — "Docs: layaway guard does not scan Hub article bodies" | — | — | — | — | — | recorded | — |
| P3-1..P3-5 (sweep batch A) | Phase 3 owner decisions | Owner | — | — | `phase-3/PHASE-3-REPORT.md` | superseded by release | — |
| OD-P6-1..9 (sweep batch C) | Kihei Hub collection, preloved-watch primary URL, Hub SEO-field contract, `/en/guides/*`, no `/en/shop/*` | Owner | open | — | #417 | READY FOR OWNER REVIEW | — |
| OD-GBP-1 (sweep batch E) | — | Owner | answered No | — | — | CLOSED | — |
| HUB-CATALOG | first owner-authorised delete | Owner | — | — | — | LIVE — FIRST REAL DELETE PENDING | — |
| BUG-09 | — | Owner | — | — | — | OPEN | — |
| BUG-06 | — | Owner | — | — | — | OPEN — deferred | — |
| BUG-03 | — | Owner | Option A | — | — | MOVED OUT OF SEO SCOPE | — |
| OG-PRODUCT | — | Site | — | — | #441/#442 `95189746d`; checker 432/0 | CLOSED — DEPLOYED AND VERIFIED LIVE (CLOSED) | — |
| none — "fb:app_id and og:url absent on other locale pages" observation | — | Site | addressed in foundation batch | — | register R-15 | READY FOR QA | — |
| OD-S4-1 … OD-S4-10 (change log) | Step 4 decisions | Owner | OD-S4-2 A, 3, 4, 6 approved; 7, 9, pilot conditional; 5, 8 unchanged; 10 deferred | — | approval record | recorded; not applied | — |
| W-01, W-02, W-03, H-07, W-12, W-13 (security batch, change log) | Next 15.5.28; `safe-next`; JSON-LD `<` escape; messenger_link; postcss pin/zod 4; `/\host` refusal | Site | — | — | `docs/security/SECURITY-HARDENING-2026-10-31.md` | in `develop` (#455/#456); not deployed | — |
| D1–D7 (closeout, change log) | React #418 decisions | Owner | D1 superseded (merged #458); D7 resolved; D2 optional; D3–D6 folded into §6.8 | — | `PREVIEW-ACCEPTANCE-2026-10-31.md` | release HOLD | §6.8 approval request |
| O-1, O-2a, O-13, O-14 (change log) | bypass secret; create deployment; OD-MC-12 Hub total; OD-CT-1..6 wording | Owner | open | — | matrix §J (UNVERIFIED here) | open | — |

---

## 4. docs/seo/SEO-QA-REPORT.md

(a) Test-evidence record §0–§17 for the 2026-10-29 sweep, releases #421, #426, #430, #433, #436, #439, #442, the foundation batch (§15), the completion batch (§16) and the correction batch (§17). Status words: PASS · FAIL · BLOCKED · UNVERIFIED · UNVERIFIED-BY-DESIGN · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · READY FOR QA · HOLD · PARTIAL · NOT RUN · NOT CONFIRMED · CLOSED · IMPLEMENTED — PRODUCTION VERIFICATION PENDING.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — §0 "Vercel builds only `develop` and `main`" | preview QA happens after merge to `develop` | Owner | D-1 | — | dashboard 2026-10-29 | fact | accept or change settings |
| none — §0 "Real-Hub validation BLOCKED locally" | run on develop preview | Site | — | preview | `.env.local` | BLOCKED (local) | — |
| 1.1 Vercel preview QA (#416) | re-run on develop preview | Site | — | merge | — | BLOCKED → later PASS (§6) | — |
| 1.2–1.10 (#416 checks) | `/en/layaway`, `/ja/layaway` 404, legacy, two-tab, links, Messenger, JA exposure, checkout, automated | Site | — | — | local build | PASS | — |
| 1.11 RRT on FAQPage | — | — | — | — | RRT | UNVERIFIED-BY-DESIGN | — |
| 2.1 SEO checker matched origin (#419) | — | Site | — | — | 229/0/0 | PASS | — |
| 2.2 JSON-LD with real Hub data | observe on develop preview | Site | — | preview | — | BLOCKED → PASS (§6 P4-2..P4-4) | first real review verification |
| 2.3 RRT code mode | — | — | — | — | 3 valid items | PASS | — |
| 2.4 MerchantReturnPolicy (`aacb81e`) | do not merge as written | Owner | R-1 open | — | analysis | FAIL as written; commit removed | R-1 |
| 2.5 Shipping (`f324135`) | do not merge as written | Owner | S-1 open | rate card confirmation | analysis | removed | S-1 |
| R-1 return policy | `merchantReturnLink` only (recommended) / R-2 / R-3 | Owner | open; "R-1 stays open" | — | §2.4, §5 | open | decide. Note: ID collides with register R-01 and map R1 |
| S-1 shipping | confirm rate card; option (a) or (b) | Owner | open | — | §2.5 | open | decide. Note: ID collides with §6 S-1 (canonical consistency check) |
| P3-1 `/en/layaway` route approval | — | Owner | — | — | — | met (released #421) | — |
| P3-2 wording | — | Owner | — | — | — | met | — |
| P3-3 OD-6 | not in this PR | Owner | unapproved | — | — | out of scope | — |
| P3-4 layaway-only posts | — | Owner | — | — | — | — | — |
| P3-5 Messenger locale fix | accept as part of #416 | Owner | — | — | — | met | — |
| D-1 Vercel previews | accept preview-on-develop or change settings | Owner | recommended accept | — | — | open (UNVERIFIED) | — |
| none — §4 "Safe merge and release order" 1–5 | — | Owner/Site | — | — | — | steps 1–4 done (§6–§7); step 5 (OD-6) open | OD-6 |
| none — §5 "Awaiting explicit owner merge authorization" | #416, #419 | Owner | given (merged) | — | — | done | — |
| none — §5 Integration QA 1–9 | — | Site | — | develop preview | §6 | done (§6) | RRT by URL on production (done §7) |
| P3-1..P3-8 (§6) | preview checks | Site | — | — | `675a7c3` | PASS | — |
| P4-1..P4-6 (§6) | breadcrumbs, reviews, JA descriptions, store, no return/shipping, no origin | Site | — | — | — | PASS (P4-2 rating branch UNVERIFIED by absence of data) | verify on first real review |
| S-1..S-5 (§6) | canonical, sitemap, links, checker, RRT | Site | — | — | — | PASS | — |
| C-1..C-4 (§6) | checkout routes, money logic, private data, console | Site | — | — | — | PASS. Note: IDs collide with Step 4 C-01.. and guide review C-1.. | — |
| none — §6 "Remaining risks" 1–4 | first real review verify; RRT by URL after release; bare `/layaway?lang=en` legacy canonical (OD-6); feature-branch previews | Site/Owner | — | — | — | risks | — |
| none — §7 Production QA 1–13 | — | Site | — | — | `82effab`; 288/0/0 | PASS; exceptions none | owner: request indexing `/en/layaway`; RRT by URL |
| none — §8 Stabilization release QA | — | Site | — | — | `97a6e76`; 289/0/0 | PASS | — |
| none — §9 Step 1 release QA | — | Site | — | — | `2e18bcc`; 289/0/0 | DEPLOYED; RECRAWL PENDING | Vercel logs/Hub durations UNVERIFIED |
| none — §10 Step 2 release QA | — | Site | — | — | `49c0fd6`; 289/0/0 | DEPLOYED; RECRAWL PENDING | hero PNGs 1.3–1.8 MB uncompressed (limitation) |
| none — §11 Step 3a release: "owner to decide between keeping it and reverting PR #436" | — | Owner | open | — | `81f9aa0`; Lighthouse noise | DEPLOYED; benefit not confirmed | decide keep/revert (superseded by #439 scope?) UNVERIFIED |
| none — §11 "Desktop re-wrap (new finding)" | — | Site | — | — | CLS 0.0000478 | OBSERVED → fixed by #439 (§12) | — |
| none — §11/§12 "Android / Windows typography NOT TESTED" | — | — | — | — | — | NOT TESTED | — |
| none — §12 `check:jp-font` 34 of 35 | threshold tighter than noise | Site | — | — | 0.00012 | 34/35 | — |
| none — §13 OG-PRODUCT pre-release | — | Site | — | — | PR #441 | superseded by §14 | — |
| OG-PRODUCT (§14) | — | Site | — | — | #442 `95189746d`; 432/0/0; 12/12 | CLOSED — DEPLOYED AND VERIFIED LIVE (CLOSED) | re-read 12 URLs after any later change (limitation) |
| none — §14 "`fb:app_id` missing" warning | — | Site | addressed in §15 batch | — | Sharing Debugger | READY FOR QA (foundation) | — |
| none — §15 foundation batch scope (1)–(5) | og:url, 404 hygiene, fb:app_id, checkers, register | Site | batch authorized 2026-10-31 | real-Hub gate | PR #452; raw 670/0; DOM 682/1, 681/2 | READY FOR QA; RELEASE DECISION: BLOCKED | real-Hub acceptance (1)–(4) |
| none — §15 "Real-Hub acceptance (mandatory; not run)" (1)–(4) | both checkers on develop preview; 20-URL comparison; missing-resource checks; production hydration comparison | Site/Owner (access) | — | bypass secret | — | NOT RUN | run |
| OD-F1 (§15) | owner decision to release with #418 open | Owner | default no release | — | — | in force | — |
| none — §15 "React #418 — cause found and fix proposed" | loader `scripts/react-hydration-replay-fix.cjs`; remove when Next bundles react-dom ≥ 19.3 | Site | D1 (owner) | — | branch `fix/react-418-hydration-replay`; 20/1,008 → 0/984 | READY FOR QA → merged #458 (per update) | verify on release candidate |
| none — §15 Preview acceptance 2026-10-31 | — | Site | owner-approved equivalent method | — | `PREVIEW-ACCEPTANCE-2026-10-31.md` | PARTIAL; BLOCKED | Node checkers on preview NOT RUN |
| none — §15 Closeout acceptance `2e83545` | — | Site | — | — | `dpl_8A4V…` | PARTIAL; HOLD / BLOCKED. CONFLICT: register §5 says "BLOCKED, not waived"; Preview Acceptance §6.5 says "HOLD" (both words used in QA) | — |
| none — §15 Update 2026-11-01 source reconciliation | correction PR; pin deployment; one combined acceptance pass | Owner/Site | §6.8 approval request | — | #458 `2d7579d` | BLOCKED / HOLD | owner approval; pin; pass |
| none — §16 completion batch scope (1)–(6) | llms.txt; Offer; R-37; feed builder; gsc-report; docs | Site | — | — | unit 652/652; raw 671/0; DOM 685/0; rollback 10/0/0; production 555/110 | READY FOR QA; RELEASE: HOLD | — |
| none — §16 Lighthouse 13.6 single-run baseline | "before" for Step 3b/3c; three-run medians required | Site | — | — | table | baseline (lab only) | — |
| O-1 (§16) | bypass secret in environment for pinned candidate, or re-approval of equivalent method | Owner | open | — | — | open | — |
| none — §16 Not run (a)–(e) | fixed checkers on preview; real-Hub local; Search Console; Notion; MC-G12 help page | — | — | — | — | NOT RUN | — |
| none — §17 correction batch (1)–(4) | gsc-report refusals; feed IdentifierRule/reconcile; `llms-links` fetch; records | Site | — | — | unit 659/659; raw 728/0; DOM 799/0; rollback 10/0/0; production 555/111 | READY FOR QA; RELEASE: HOLD | — |
| O-2a (§17) | create the deployment of the exact head | Owner | open | runbook §2 step 2 | — | open | then O-1 |
| none — §17 "Missing assertions for the gate" | both checkers on pinned deployment with real data incl. llms-links; 36-URL comparison; phone-375 real build; hydration matched protocol | Site | — | O-2a, O-1 | — | NOT RUN | run |

---

## 5. docs/seo/SEO-BASELINE.md

(a) Phase 0 read-only baseline (2026-10-28) with Phase 1 addendum §14–§17; code `f963f2c`. Status words: CONFIRMED · UNVERIFIED · DEFERRED · DECIDED · BLOCKED — EXTERNAL DOMAIN/DNS/HOST CONFIGURATION · KEEP IN SITEMAP FOR NOW.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — §2 "English content has no indexable URL of its own" | locale URLs | Site | — | Phase 2 | code comments | CONFIRMED defect (X2) | — |
| none — §3 hreflang `en` non-reciprocal; tags on unknown paths, `/cart`, `/login`, `/search` | fix in Phase 1/2 | Site | — | — | live output | defects CONFIRMED (X1, X2) | — |
| none — §3 "`Metadata.alternates` deliberately not used" | keep in mind for `/` | Site | — | — | comment | note | — |
| none — §4 "`/cart` and `/login` return 200 … no noindex" | noindex | Site | — | Phase 1 | live | CONFIRMED gap → fixed §14 | — |
| none — §4 "`/cart/restore`, `/auth/*`, `/loyalty/join`: UNVERIFIED" | probe | Site | — | — | — | UNVERIFIED → §14 covers | — |
| none — §4 "`/search` must stay crawlable; do not add to robots.txt" | rule | Site | — | — | — | rule | — |
| none — §5 "sitemap 483 URLs; lastmod for products" | — | Site | — | — | live | CONFIRMED (historical) | — |
| none — §5 "freshness after Hub change not tested" | — | Site | — | — | — | not tested | — |
| D3 (§5, §17) | sold products stay in sitemap | Owner | DECIDED: KEEP IN SITEMAP FOR NOW | X10 | 120 of 449 | DECIDED | X10 later |
| none — §6 `/gold-guide` 308 to `/jewelry-guide#metals` | — | — | — | — | live | CONFIRMED (later BUG-06) | — |
| none — §6 "Old domain not redirected" / D2 | — | Owner | "Decided (D2): BLOCKED — EXTERNAL DOMAIN/DNS/HOST CONFIGURATION" | — | §17 | BLOCKED. CONFLICT: Status/Register say D2 CLOSED — KEEP, NO REDIRECT (2026-10-31) | — |
| none — §6 "Preview/staging noindex: UNVERIFIED" | confirm on real preview | Site | — | — | §17: 302 SSO + x-robots-tag noindex | resolved §17 (one deployment sampled; aliases UNVERIFIED → X7) | — |
| none — §8 structured data not present list | BreadcrumbList, rating, gtin, shipping, returns, logo, telephone, email, sameAs, openingHours | Site | — | Phase 4 | — | CONFIRMED (historical) | — |
| none — §9 "Layaway indexability CONFIRMED defect" | — | Site | owner policy 2026-09-25 | Phase 3 | — | CONFIRMED (X3) | — |
| none — §10 "Hub image metadata not inspected yet" | — | Site/Hub | — | — | — | not inspected | — |
| none — §11 "Search Console use: UNVERIFIED from repository" | — | Owner | — | — | — | UNVERIFIED (historical) | — |
| none — §12 "No test covers robots, sitemap, canonical, hreflang, JSON-LD, HTTP status" | tests | Site | — | Phase 1 | — | CONFIRMED gap → fixed | — |
| none — §13 "Not read" list | `supabase/contracts/api.md`, Hub fields, header/footer link generation | Site | — | Phase 2 | — | not read (at Day 0) | — |
| none — §14 route matrix (15 rows) | policies per route | Site | — | — | before/after | VERIFIED locally; unknown route DEFERRED to Phase 2 | signed-in renders not verified (X6) |
| none — §15 search-page policy | `noindex, follow`, not in sitemap, no Disallow | Site | decided before implementation | — | production | decided | — |
| none — §16 404 metadata: unmatched route deferred | — | Site | — | Phase 2 | checker reports DEFERRED | DEFERRED (X1) | — |
| none — §17 preview deployment indexing | no `X-Robots-Tag` code added | Site | — | — | 302 to SSO + noindex | verified; aliases UNVERIFIED (X7) | — |
| none — §17 HTTP→HTTPS, apex→www | one 308; http apex two hops (D4) | Owner | leave | — | — | verified | — |

---

## 6. docs/seo/SEO-MIGRATION-MAP.md

(a) Phase 2 EN/JA locale-URL planning map (2026-10-28; code `b431fc8`) with §14 owner decisions, §15 gates 2A–2E, §16 content audit, §17 OD-15 design, §18 2B spec, §19 2C package, §20 2D/2E-1 approved spec. Status words: AUDITED / PLANNING · CONFIRMED · UNVERIFIED · OWNER DECISION REQUIRED · OWNER APPROVED · RECOMMENDED · READY FOR GATE A · PROVISIONALLY ACCEPTED FOR PR REVIEW, NOT FINAL PRODUCTION APPROVAL · BLOCKED · PENDING OWNER CONFIRMATION. Note: the map header says "Nothing in this document is implemented" (historical; Status records 2A–2E-1 DEPLOYED).

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| E1–E15 (§2) | Current-state facts | — | — | — | file citations | CONFIRMED (E15 version behaviour UNVERIFIED) | — |
| F1 Locale/cookie mismatch affects layaway | URL language authoritative; OD-15 | Site | OD-15 approved | 2C | — | requirement | — |
| F2 Blog posts may exist in one language | no invented sibling; title and body required | Site | — | 2D | — | requirement | — |
| F3 Consent-banner and announcement-bar `/legal/*` checks | shared rule `lib/statutory-path.ts`; done in 2A | Site | — | — | — | done in 2A | — |
| F4 Hub relative links | OD-11 | Site | — | 2C | — | requirement | — |
| F5 Public responses no-store | observation only; separate proposal | Owner | — | — | — | recorded only (→ Step 3c) | — |
| R1–R19 route families (§4) | proposed EN/JA routes; sitemap counts | Site | Gate A | — | — | proposed (later DEPLOYED per Status) | — |
| R20 `/gold-guide` | retarget in one hop | Site | follows OD-1 | — | — | proposed (later BUG-06) | — |
| R21 non-localized files | unchanged | — | — | — | — | unchanged | — |
| none — §5 private/utility routes stay unprefixed; `safeNext` must accept prefixed path (UNVERIFIED) | — | Site | — | — | `lib/profile.ts:35` | UNVERIFIED | — |
| none — §6 Layaway rule; "Option ii" temporary link exception | links stay bare `/layaway` through 2C; no `/ja/layaway` | Site | owner direction 2026-10-28 | Phase 3 | — | documented (Phase 3 since done) | — |
| none — §7 legacy redirect design rows | `?lang=` 308 (OD-4); bare (OD-1); `/layaway` (OD-6); `/` (OD-3); `/gold-guide`; missing slug 404 | Owner | OD-1/OD-4 307 stage approved; OD-3/OD-6 open | 2E | — | design | — |
| C0 / C1 / C2 (§7) | interim canonical options | Owner | C0 approved 2B only | — | — | C0 for 2B; expired at 2C gate | — |
| H0 / H1 / H2 (§7) | interim hreflang options | Owner | H0 approved 2B only | — | — | expired at 2C gate | — |
| none — §7 (c) root sitemap entry preserved | list `/`, `/en`, `/ja` | Owner | OWNER APPROVED 2026-10-28 (three-PR batch) | OD-3 | §20.3 | approved | resolve root hreflang before 308 |
| none — §8 canonical/hreflang rules; "Replaces `SeoLinks`" | per-page metadata; X1 closed in locale tree | Site | — | 2B | — | design (implemented) | — |
| none — §9 A–F link groups | locale-aware links; compliance path checks; uncertain files; layaway exception | Site | — | 2C | file lists | design (implemented) | — |
| none — §9 "External places that link to current URLs (UNVERIFIED)" | covered by legacy redirects | — | — | — | — | UNVERIFIED | — |
| none — §10 sitemap design; "New in the list: `/collections` (UNVERIFIED reason)" | review in 2D | Site | — | 2D | — | `/collections` stays unlisted (per Status) | — |
| none — §11 switcher/cookie design | crawlable links; cookie as mirror | Site | — | 2C | — | design (implemented) | — |
| none — §12 test matrix | expected behaviours incl. OD-dependent cases | Site | — | — | — | defined | — |
| K1–K14 (§13) | risks with mitigations | Site | — | — | — | recorded | — |
| none — §13 "Before 2E, record the full legacy-to-locale URL map in this file" | — | Site | — | 2E | — | UNVERIFIED whether recorded | — |
| OD-13 | trailing slash | — | resolved | — | — | resolved | — |
| OD-14 | path structure | — | resolved | — | — | resolved | — |
| OD-5 | merged into OD-1 | — | merged | — | — | merged | — |
| OD-10 | mechanism A | Owner | OWNER APPROVED 2026-10-28 | — | — | approved | — |
| OD-2 | x-default English | Owner | OWNER APPROVED 2026-10-28 | — | — | approved | — |
| OD-3 | `/` redirect later | Owner | OWNER APPROVED (redirect later); 2E decision pending | 2E; OD-1 | — | approved for 2B–2D; open for 2E | decide at 2E |
| OD-9 | content eligibility | Owner | OWNER APPROVED | — | §16.1 | approved | — |
| OD-15 | URL/cookie/layaway authority | Owner | OWNER APPROVED with security requirements | Opus review | §17 | approved | — |
| C0/H0 | 2B only | Owner | OWNER APPROVED FOR PHASE 2B ONLY | 2C gate | §7 | expired | — |
| OD-8 | single-language pages | Owner | OWNER APPROVED | OD-9 | — | approved | — |
| OD-1 | bare legacy URL destination | Owner | OWNER APPROVED L2-exact 307 stage (binding §20); 308 separate | 2E | §20 | 307 approved. CONFLICT: §14 "still open: OD-1, OD-4, OD-6, OD-7, OD-11, OD-12" line lists OD-1/OD-4/OD-12 as open while their own headings say OWNER APPROVED | 308 approval |
| OD-4 | `?lang=` URLs | Owner | OWNER APPROVED 307 stage | 2E | §20 | 307 approved | 308 later |
| OD-6 | legacy `/layaway` | Owner | open; recommended (a) 308 after Phase 3; policy check needed | Phase 3 / 2E | — | OWNER DECISION REQUIRED | decide |
| OD-7 | switcher no sibling | Owner | recommended link to other home (§19.1 "RECOMMENDATION, not approval") | 2C | — | open in map. CONFLICT: Status says OD-7 implemented in 2C (PR #405) | — |
| OD-11 | Hub relative links | Owner | recommended localize at render (§19.2) | 2C | — | open in map. CONFLICT: Status says OD-11 implemented in 2C | — |
| OD-12 | hreflang in sitemap | Owner | OWNER APPROVED — HTML only | 2D | — | approved | — |
| Phase 2A gate (§15) | helpers only; exit via local build | Owner | — | — | — | done (per Status) | — |
| Phase 2B gate (§15, §18) | routes R1–R18; Gate A; gates A–K | Owner | Gate A given (per Status) | OD-2,3,8,9,10,15, C0/H0 | §18.4 | READY FOR GATE A → DEPLOYED (per Status) | — |
| Gate A–K (§18.4) | owner approval; branch; checks; build; snapshot; matrix; PR review; preview; release authorization; production verification; no links/sitemap until 2C/2D | Owner/Site | — | — | — | passed (per Status "gates were never skipped or combined") | — |
| Phase 2C gate (§15, §19) | locale links; OD-7, OD-11; §19.3 transition decision; OD-15 first; Opus | Owner | approvals 1–6 (§19.6) | 2B deployed | — | DEPLOYED (per Status) | — |
| none — §19.3 Option A / B / C | legacy canonical/hreflang for 2C–2D window | Owner | Option C RECOMMENDED; (per Status) adopted as 307 stage | OD-1, OD-4 at 2D gate | — | Option C (DEPLOYED #412) | — |
| Phase 2D gate (§15, §20.1) | locale-only sitemap; `/` kept; posts per language; OD-12 | Owner | approved 2026-10-28 | 2C | — | DEPLOYED (per Status) | — |
| Phase 2E gate (§15) | 307 then 308; OD-1, OD-3, OD-4, OD-6 in writing; URL map | Owner | stage 1 approved; 308 not authorized | 2D observation period | §20.2 | stage 1 DEPLOYED; 308 NOT STARTED | OD-3, OD-6, 308 approval |
| none — §16 "Is a Hub enhancement needed? No for 2A/2B; options for 2D" | website-only detail reads vs Hub `has_en_content`/`has_ja_content` | Site/Hub | not implemented | — | — | website-only chosen (per Status 2D) | confirm `GET /content/posts` body question (UNVERIFIED) |
| none — §16 "`/collections` index sitemap review item" | — | Site | — | 2D | — | stays unlisted | — |
| none — §16.1 "intermittent HTTP 500 UNVERIFIED" | check server logs | Owner | — | — | — | unreproduced | — |
| none — §16.1 OD-9 policy "audit script re-run after each catalogue import and before every release" | — | Site | approved | — | — | rule | — |
| none — §17 OD-15 design points 1–7; tests; "run that change on Opus" | — | Site/Owner | approved | — | — | implemented (per Status) | — |
| none — §18.3 "CI runs no build (recommendation to add one stands, needs approval)" | — | Owner | needs approval | — | — | open | — |
| none — §18.3 "UNVERIFIED: Preview env targets; safe test customer account" | — | Owner | — | — | — | UNVERIFIED | — |
| none — §19.6 approvals 1–6 for 2C | OD-7, OD-11, §19.3, written authorization, `/model` Opus, preview data-source/bypass | Owner | (given per Status) | — | — | done except standing bypass item | — |
| none — §20 "Not authorized: any 308, root `/` (OD-3), `/layaway` (OD-6), production release" | — | Owner | — | — | — | 308/OD-3/OD-6 still not authorized | — |
| none — §20.2 redirect table and safeguards; kill switch | — | Site | approved | — | — | DEPLOYED (per Status) | — |
| none — §20.3 root hreflang "must be resolved before any 308 promotion" | via OD-3 | Owner | gate | 308 | — | gate open | — |
| none — §20.4 production release gate 1–8 for 307 stage | verify on actual Vercel Preview | Owner | PROVISIONALLY ACCEPTED FOR PR REVIEW, NOT FINAL PRODUCTION APPROVAL | — | — | (released #412; production evidence per Status) | owner to confirm header-gap classification |
---

## 7. docs/seo/SEO-DEFECTS-2026-10-29.md

(a) Website-side review of the 2026-10-29 monitoring findings (BUG-02…BUG-09; BUG-01/BUG-04 are Hub items in `chajewels/la-tracking`). Status words: CONFIRMED · FIXED LOCALLY · READY FOR QA · BLOCKED · NOT A BUG · SUPERSEDED · OPEN · MOVED OUT OF SEO SCOPE · SEARCH ENGINE RECRAWL PENDING · UNVERIFIED.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| BUG-02 | Drop chat hosts from JewelryStore `sameAs` (`isProfileUrl`) | Site | normal release | — | PR #423; unit 508/508; checker 288/0 | FIXED LOCALLY → READY FOR QA. CONFLICT: Status/Master Plan §33.1 say DEPLOYED (release #426 `97a6e76`) | — |
| BUG-05 | Remove `/already-registered` Disallow; keep noindex | Site | — | — | PR #424; 289/0 | FIXED LOCALLY → READY FOR QA. CONFLICT: Status says DEPLOYED (#426) | — |
| BUG-08 | Status doc opening corrected | Site | — | — | PR #425 | FIXED LOCALLY → READY FOR QA. CONFLICT: Status says DEPLOYED (#426) | — |
| BUG-03 | Owner approves A or B, edits `body_en`/`body_ja` in Hub; verify live afterwards | Owner | Option A decided; moved out of SEO scope (PR #450, 2026-10-31) | — | live article 2026-10-29 | CONFIRMED — MOVED OUT OF SEO SCOPE | owner edits Hub; verify live |
| BUG-06 | Fold `/gold-guide` into middleware legacy table as 307 (or two 308 cookie rules) | Owner approves; Site | proposal only; route-change rule | redirect work approval | production 2026-10-29 | CONFIRMED — proposal only | owner decision |
| BUG-07 | `#payments-and-layaway` anchor on JA FAQ | — | — | — | `lib/faq.ts`; `check:layaway-ja` green | NOT A BUG (CLOSED) | — |
| BUG-09 | Search Console property; coverage; performance baseline; rich-result eligibility | Owner | — | — | RRT 2026-10-29: product 3 valid items; `/en` 2 valid; `/en/layaway` none | OPEN (historical BLOCKED superseded); indexing of `/en/layaway` "UNVERIFIED" in body vs "observed indexed" in header note (time difference) | coverage report; performance baseline |
| BUG-01, BUG-04 (referenced) | Hub items | Hub | — | — | `chajewels/la-tracking` | tracked elsewhere (UNVERIFIED here) | — |

---

## 8. docs/seo/OUTSTANDING-ISSUES-REGISTER.md

(a) Five workstreams tracked with evidence, owner-approval requirement and definition of done (2026-10-29; updates to 2026-11-01). Status words: governance vocabulary plus OWNER APPROVAL PENDING, LIVE, IMPLEMENTED, CONFIRMED DEFECT, CLOSED, OPEN, CLOSED FOR SEO — MOVED OUT OF SEO SCOPE, LIVE — FIRST REAL DELETE PENDING, OWNER DECISION PENDING.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| 1 / BUG-03 | Owner applies Option A in Hub; live EN+JA re-fetch; record dated in defects file | Owner (Claude must not edit) | Option A (OD-S4-2, 2026-10-30) | — | re-fetched 2026-10-31 still carries wording | CLOSED FOR SEO — MOVED OUT OF SEO SCOPE (table) / "Current status: OPEN" (§1). CONFLICT within document: table says CLOSED FOR SEO, §1 says OPEN (content task) | owner applies; re-fetch |
| 2 / HUB-CATALOG | First owner-authorised deletion observed and verified (7 DoD bullets); #672 migration apply status unstated | Owner/Hub | required for every deletion | — | Hub PRs #670–#673; owner-confirmed DB apply ~14:38 JST 2026-10-29 | LIVE — FIRST REAL DELETE PENDING | owner decides first deletion; Claude verifies |
| 3 / BUG-09 | Coverage and URL-inspection saved with dates; performance baseline; re-read ~7 and ~14 days; OD-SC-1 | Owner | access and settings owner's | — | baselines 10-30, 10-31; `phase-12/SEARCH-CONSOLE-OPERATIONS.md` | OPEN | re-reads ~5 and ~12 Nov; re-inspect 8 URLs; OD-SC-1 |
| 4 / BUG-06 | Approved redirect change merged with tests; one hop both languages; recorded in QA report | Owner (route-change rule) | required; none authorised | dedicated redirect branch | production 2026-10-29 | OPEN — deferred; 2026-11-01 note: OWNER DECISION PENDING | owner decides |
| 5 / OG-PRODUCT | DoD met 2026-10-30 | Site | met | — | PR #441 `c4791fd`, #442 `95189746d`; Vercel `7416880444`; QA §13–§14 | CLOSED — DEPLOYED AND VERIFIED LIVE (CLOSED) | — |
| none — "`fb:app_id` and `og:url` on other locale pages" observation | separate owner-approved metadata change | Site | addressed in SEO foundation batch | — | register R-15; QA §15 | READY FOR QA, not deployed | — |
| GSC-09 (§3 update) | `portal.`/`paymenthub.` crawlability policy | Owner; Hub/Firebase | owner decides | — | `SEARCH-CONSOLE-BASELINE-2026-10-31.md` | open investigation | — |
| R-37 (2026-11-01 note) | rollback-only duplicate og:url | Site | — | — | — | CLOSED in the batch (CLOSED) | — |
| none — 2026-11-01 note "Step 4 live re-check: six listing texts still pre-approval text" | — | Owner | — | — | — | owner-operated; not applied | — |

---

## 9. docs/seo/PERF-STEP3-FINDINGS.md

(a) Step 3 performance findings and architecture proposals (2026-10-29, with §8 production follow-up). Status words: READY FOR QA (Step 3a, header), AUDITED (3b, 3c), "Not deployed", NOT TESTED / Not verified. CONFLICT: header says "Step 3a READY FOR QA … Not deployed" while Status/Register/QA §11–§12 record Step 3a DEPLOYED (#436, #439).

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| Step 3a | Defer Noto Serif JP slices until load (`jp-font-gate.tsx`); §8: scoped to `/ja` home only (`lib/jp-font-defer.ts`) | Site | PR #436 released; #438/#439 scope | — | A/B 7 runs: `/ja` 77→84, LCP 6.6→4.4 s; §8 CDP 3.44 s vs 6.18 s | READY FOR QA (header; stale) / DEPLOYED per other docs | run `scripts/check-jp-font-live.mjs` against real-Hub deployment after release |
| none — §4 "Trade-off for the owner" (system serif first moments) | owner accepts | Owner | — | — | — | stated | — |
| Step 3c | Caching architecture: move locale to `app/[lang]` params; compute robots/switch targets from params; client islands for cart/session; keep `private, no-store` for private routes; prove each step | Owner approval first; Site | proposal only, own branch | SEO checker, cookie/session matrix, CSP, staged preview | §5 findings (verified in code/production) | AUDITED (proposal only) | owner scoping |
| Step 3b | Large-collection options: do nothing (recommended); slim streamed data (first candidate); progressive/pagination/virtualized not recommended | Owner | no change | real-user data | §6 measurements | AUDITED | re-evaluate with real-user data |
| none — §7 axe `definition-list`/`dlitem` findings | pre-existing; not addressed | Site | — | — | — | not addressed | — |
| none — §7 "Hero PNGs 1.3–1.8 MB; not changed" | — | Site | — | — | — | not changed | — |
| none — §8 "Retuning the fallback does not fix it" | no size-adjust retune applied | Site | — | — | 1,136 headings measured | no retune | — |
| none — §8 "Language switcher (checked, no change)" | — | Site | — | — | 36/36 | PASS | — |
| none — §8 "Not verified: Android/Windows fonts; real-user data" | — | — | — | — | — | NOT VERIFIED | — |
| none — §3 root cause 4 "Hero poster render delay … not attributable; not changed" | — | Site | — | — | — | not changed | — |

---

## 10. docs/seo/PREVIEW-ACCEPTANCE-2026-10-31.md

(a) Preview and closeout acceptance records for `develop` `6dc71df` (#452), security batch (#455/#456), candidate `2e83545`, React #418 fix evidence (§6.6), decision register D1–D7 (§6.7), current approval request (§6.8), source reconciliation (§6.9). Status words: BLOCKED, not waived · HOLD · PARTIAL · DONE · PASS · NOT RUN · NOT CONFIRMED · NOT TESTED · Superseded · RESOLVED · carried.

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — §1 "Release candidate: None yet" | merge of #455 becomes candidate | Owner | not authorized by this record | — | — | superseded by §6 (`2e83545`) | — |
| none — §2 "owner-approved equivalent method" | same-origin fetch under owner session as substitute | Owner | approved 2026-10-31 in chat | — | — | substitute, never the fixed run | — |
| none — §3a FOUNDATION matrix preview 232/235 | — | Site | — | — | 3 gated rows artefact | PASS (artefact) | — |
| none — §3c Hydration 0/0 preview and production; local 1–4 | — | Site | — | — | — | causality unresolved; OD-F1 stands | — |
| W-01, W-02, W-03, H-07 (§3d) | PR #455 scope verified | Site | — | — | `99a68c3`, `c1ea320`, `1ac667f` | verified; #452 preserved | — |
| none — §3d observation "`lib/markdown.ts`/`lib/settings.ts` `safeHref` treat `/\host` as relative" | tracker item (later W-13) | Site | — | — | — | outside scope (fixed in #456 per Status) | — |
| none — §4 failures/limitations 1–5 | Node checkers not on preview; 3 gated rows; #418; production fails pre-#452 rows by design; sign-in/reviews not exercised | — | — | — | — | limitations | — |
| none — §5 "What remains before production" | OD-F1; merge #455 decision; owner-run checkers; `develop`→`main`; Sharing Debugger; RECRAWL PENDING | Owner | — | — | — | open | — |
| none — §6.2 row 1 Product-page 500s | cause: Hub Website API 503; no retry in `lib/hub-api.ts`; Hub logs NOT read | Site/Hub | — | — | Vercel logs; `docs/security/SECURITY-HARDENING-2026-10-31.md` | DONE — upstream 503 observed, Hub-side cause unproven | D2 optional retry; Hub boot-error review |
| none — §6.2 rows 2a–2e | raw 238/0; 36-URL identical; rendered DOM PASS; client nav PASS; fixed checkers local 670/0, DOM 681/2 | Site | — | — | `dpl_8A4VMjSPeV6xpYRVpbDy66M4pMyk` | PASS / NOT RUN on preview | bypass secret |
| none — §6.2 row 3 375 px | not run on candidate host; substitutes (local build, production); Codex 6 pages partial | Owner approval of deviation | deviation to be approved | — | Notion "PR #457 consolidated independent review", "SEO-P1b Proof" | Desktop PASS; 375 px NOT RUN on candidate | D3 |
| none — §6.2 row 4 #456 delta | Zod 4 contracts, links/images, audit 0 | Site | — | — | security doc | DONE | — |
| none — §6.2 row 5 Sign-in / Messenger | emailed round trip not confirmed; Messenger field not testable with linked account | Owner | — | — | `tests/profile-messenger-link.test.mjs`; Hub #691 | NOT CONFIRMED / NOT TESTED | D5, D6 |
| none — §6.2 row 6 Hydration | candidate 0, production 0, local 5 events | Site | — | — | — | causality unresolved; OD-F1 stands; not waived | — |
| none — §6.3 limitations 1–7 | — | — | — | — | — | listed | — |
| none — §6.4 "supported defect React #418" | fix candidate `4c8fdf0` unapproved | Owner | OD-F1 | — | react/react#37584; PR #35494 | supported defect | D1 |
| none — §6.4 "pre-existing: Hub 503 → customer 500; proposed one bounded retry (not implemented)" | — | Owner approval | outside read-only scope | security session | — | proposed | D2 |
| none — §6.5 Release recommendation | HOLD; correction PR integrated; pinned deployment; ONE combined acceptance pass; OD-F1 retired only if #418 verifies | Owner | — | — | — | HOLD | — |
| none — §6.6 React #418 fix table | loader, provenance, variants, build proof, negative tests, matched reproduction, hardening `63ae762`, removal criteria | Site | PR #458 merged by owner → `develop` `2d7579d`; hardening NOT in develop | — | 683/0 ×2 vs 681/2 | merged (base) / hardening pending correction PR | integrate hardening; verify on pinned deployment |
| none — §6.6 "Fixed upstream for Next 16.2+: UNVERIFIED" | — | — | — | — | — | UNVERIFIED | — |
| none — §6.8 approval request items 1, 2(a)(b)(c), 3 | approve correction PR merge; bypass access or accept equivalent + Codex evidence; "send" sign-in link; test customer or accept unit+Hub coverage; optional retry scope | Owner | open ("One reply covers everything") | — | — | open | owner reply |
| D1 — React #418 | adopt fix | Owner | Superseded: #458 merged | — | — | superseded (CLOSED as decision); follow-ups open | integrate `63ae762`; verify before OD-F1 retired |
| D2 — Catalog read retry | exact scope: `lib/hub-api.ts` `call()`, catalog GETs only, one retry on 502/503/504 or connection failure, 250 ms, deadlines span all attempts; proof list | Owner | not implemented; approve for later batch or decline | after D1 | — | optional, open | decide |
| D3 — 375 px on exact deployment | (a) accept Codex 6 pages + local + production; (b) supply bypass | Owner | recommendation (a) now, (b) next | — | — | open (folded into §6.8) | decide |
| D4 — Fixed checkers on a preview | supply bypass once per candidate or accept equivalent | Owner | recommendation: supply | — | — | open (folded into §6.8) | — |
| D5 — Sign-in e-mail round trip | (a) owner clicks fresh link; (b) authorise mailbox read (not done) | Owner | recommendation (a) | — | — | open | — |
| D6 — Messenger field on preview | create unlinked test customer or accept unit + Hub #691 | Owner | recommendation accept for this release | — | — | open | — |
| D7 — Notion | — | Codex/Owner | RESOLVED 2026-11-01 | — | — | RESOLVED (CLOSED) | — |
| none — §6.9 correction PR `fix/react-418-loader-hardening` | cherry-pick `63ae762` + #457 docs; #457 closed as superseded; exact-head verification list | Site | owner approval (§6.8 item 1) | — | — | pending merge | owner merges; pin; acceptance pass |
| none — §6.9 "Evidence carry-forward rule" | only byte-identical code rows carried; hydration/DOM/console re-run on pinned deployment | Site | — | — | — | rule | — |

---

## 11. docs/seo/SEARCH-CONSOLE-BASELINE-2026-10-30.md

(a) First Search Console read (2026-10-30, UI-read, no export, no indexing requested). Status words: PENDING · EXPECTED · P2 · Monitor · "NO PERFORMANCE BASELINE AVAILABLE YET" · OBSERVED (indexed for 3 URLs) · "BUG-09 stays open".

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| GSC-01 | Page indexing "Processing data" | Owner | none | — | Pages report | PENDING | re-read in a few days; record counts |
| GSC-02 | Performance "No data" | Owner | none | — | Performance report | PENDING | take first baseline; export CSV set per phase-12 |
| GSC-03 | `/en`, `/ja`, `/en/layaway` indexed | — | none | — | URL inspection | EXPECTED (OBSERVED IN SEARCH CONSOLE) | none; monitor |
| GSC-04 | 6 sampled URLs "Discovered – currently not indexed" | Owner | none; do NOT request indexing | — | URL inspection | P2 — Monitor | re-inspect same 8 URLs in 7 and 14 days |
| GSC-05 | 2 URLs "unknown to Google"; `/ja` sitemap field "Temporary processing error" | Owner decides any resubmission | — | — | URL inspection | P2 — Monitor | re-inspect 7 and 14 days; resubmit only if persists |
| GSC-06 | robots.txt report "No robots.txt file"; crawl stats no data | — | none | — | Settings → Crawling | P2 — Monitor | re-check once crawl stats exist |
| GSC-07 | `/ja/layaway` not in sitemap | — | none | — | live | EXPECTED | — |
| none — §9 "owner's primary Google account cannot see the property" / OD-SC-1 | add read-only user or use exports | Owner | OD-SC-1 open | — | — | open | decide |
| none — §9 "Exports should be taken when data appears" | — | Owner | — | — | — | open (first export 10-31) | — |

---

## 12. docs/seo/SEARCH-CONSOLE-BASELINE-2026-10-31.md

(a) Follow-up read and first Performance CSV export (2026-10-31 11:07 JST; one day of data, 5 impressions, 1 click). Status words: PENDING · INITIAL OBSERVATION · OBSERVATION · P2, owner decision · NOT TAKEN · "BUG-09 stays open"; evidence tags [X]/[UI]/[L].

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| GSC-02 (update) | Re-export on a later date for a real baseline; do not compare to releases | Owner | none | — | `Chart.csv` etc. (outside repo) | PENDING → INITIAL OBSERVATION | later export |
| GSC-01 (unchanged) | Page indexing still processing; export when populated | Owner | none | — | [UI] | PENDING | check later |
| GSC-08 | Aggregation difference: page rows 7 vs property 5 impressions | — | none | — | [X] | OBSERVATION (not a confirmed defect) | revisit with larger export |
| GSC-09 | `portal.`/`paymenthub.` discoverable; owner decides policy; Hub/Firebase implements | Owner | REQUIRED (owner approval) | — | DNS, Firebase, public responses [L] | P2, owner decision | owner decision; `paymenthub` code owner UNVERIFIED |
| none — §1 "Page indexing export NOT TAKEN" | export only after populated | Owner | — | — | — | NOT TAKEN | — |
| none — §4 "8-URL sample and three priority URLs not re-inspected in this pass" | re-inspect in 7 and 14 days; no indexing request | Owner | — | — | GSC-04/05 | plan stands | — |

---

## 13. docs/seo/SEO-OPERATIONS-RUNBOOK.md

(a) Recurring procedures, release/rollback checklist, acceptance criteria per check, removal criteria for temporary implementation (2026-11-01). Status words: CLAUDE.md governance §8 vocabulary referenced; OBSERVED IN SEARCH CONSOLE; SEARCH ENGINE RECRAWL PENDING; "owner approves each gate".

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — §1 row "every PR (CI)" | unit, typecheck, lint, guards all green | CI | — | — | — | procedure | — |
| none — §1 row "every SEO batch, before PR" | raw + DOM checker on local build: 0 fail, inventory complete, 0 hydration | Site | — | — | commands | procedure | — |
| none — §1 row "every batch touching metadata/redirects" | rollback mode 0 fail, 0 deferred | Site | — | — | `check-seo-rollback.mjs` | procedure | — |
| none — §1 row "every release candidate" | both checkers on pinned preview with real Hub data; every `(errors)` row passes | owner supplies secret; Site runs | — | bypass secret | — | procedure | — |
| none — §1 row "after every production release" | raw checker 0 fail; Sharing Debugger; RRT | Site; owner (Google/Facebook tools) | — | — | — | procedure | — |
| none — §1 row "weekly (Mon)" | GSC CSV exports → `scripts/gsc-report.mjs`; `NO EXPORT` where missing | owner exports; Site runs | — | — | — | procedure | — |
| none — §1 row "monthly" | Indexing, Enhancements, CWV, Links exports; production checker; sampled link health | owner + Site | — | — | — | procedure | — |
| none — §1 row "planned dates ~5 Nov, ~12 Nov 2026" | re-read Page indexing and 8-URL sample; no indexing request | Owner | — | — | — | scheduled | — |
| none — §1 row "Merchant Center (once live)" | Diagnostics weekly | Owner | — | feed live | readiness §7 | future | — |
| none — §1 "new SEO surface adds a coverage key to both checkers" | parity test | Site | rule | — | — | rule | — |
| none — §2 release checklist steps 1–7 | CI; obtain exact-head deployment (a/b/c); credentialed checkers + 36-URL comparison + llms-links; hydration `(errors)` rows pass (OD-F1 retired only then); owner approves `develop`→`main`; post-release checks; update docs and Notion | Owner approves each gate | — | — | PR #462 Vercel "1 Skipped Deployment — Ignored" | procedure | — |
| none — §2 step 2 "Vercel builds only `develop` and `main`" | deployment of exact head via merge / owner `vercel deploy` / project settings change | Owner | owner's call | — | QA §1 2026-10-29 | fact | — |
| none — §3 Rollback: code revert; `SEO_LEGACY_REDIRECTS=off` emergency; React #418 loader revert #458+#460; llms.txt deletion; Product Offer revert; Merchant feed removal | — | Site | — | — | — | procedures | — |
| none — §4 `scripts/react-hydration-replay-fix.cjs` + webpack rule | remove when Next bundles react-dom ≥ 19.3 | Site | — | — | `tests/react-hydration-replay-fix.test.mjs` removal-criterion test | temporary | remove on criterion |
| none — §4 `SEO_LEGACY_REDIRECTS` kill switch + 307 stage | remove when OD-1/OD-4 308 promotion approved and released | Owner/Site | OD-1/OD-4 308 pending | — | `check-seo-rollback.mjs`, 2E-1 rows | temporary | — |
| none — §4 root `/` in sitemap beside `/ja`, `/en` | remove when OD-3 decided | Owner | OD-3 pending | — | `tests/seo-sitemap.test.mjs` "2D: lists /, /ja and /en" | temporary | — |
| none — §4 `single-language-posts` optional coverage | until first single-language post exists | Site | — | — | checkers skip | temporary | — |
| none — §4 Branded pieces excluded from Merchant feed | until OD-MC-11 written | Owner | OD-MC-11 pending | MC-G7 | `x-feed-excluded` count | temporary | — |
| none — §4 Lighthouse single-run lab table (QA §16) | superseded by step's own matched table | Site | — | approved performance step | — | temporary | — |
| none — §5 measurement procedures | Lighthouse 13.x three-run medians; field only from Speed Insights/GSC CWV; `gsc-report.mjs`; commercial via Hub reports; attribution only after design approved | Site/Owner | — | `phase-12/ORGANIC-ATTRIBUTION-DESIGN.md` approval | `docs/measurement-log.md` | procedure | — |
---

## 14. docs/seo/STEP-4-CONTENT-AUDIT.md

(a) Step 4 Hub-managed content audit and owner approval package (audit 2026-10-30; correction pass 2026-10-30, PR #445). Status words: AUDITED — OWNER APPROVAL PENDING · Not implemented · P0/P1/P2/P3 · Evidenced / Inferred / UNVERIFIED · RESOLVED BY OWNER; VERIFIED LIVE · OPEN (BUG-03).

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| C-01 Necklaces (P1) | Rewrite description (metal mix incl. silver) EN/JA | Owner (Hub text) | → OD-S4-3 (approved per record) | — | 66 of 138 SV925 | proposed | owner publishes |
| C-02 Rings (P1) | Remove "resizable on request"; conditional resizing wording or shorter alternative | Owner | → OD-S4-3 (owner Choice 2 per record) | resizing policy fact | Jewelry Guide wording | proposed | — |
| C-04 Other Accessories (P1) | (a) move jewelry out (membership) or (b) rewrite | Owner | → OD-S4-3 (text approved per record) | — | 37 of 51 necklaces | proposed | — |
| C-06 Pendants (P1) | Drop unevidenced chain/charm claim; owner states chain policy if any | Owner | → OD-S4-3 (text corrected in decisions §1.3) | — | no "charm" in names | proposed (UNVERIFIED chain pairing) | — |
| C-09 Handmade Gemstone Bracelets (P1) | Decision: leave empty collection or add description; no indexing/sitemap change | Owner | → OD-S4-5 (leave unchanged) | separate high-risk phase for indexing | 0 pieces; 2 sitemap URLs | decision | — |
| C-03 Pearls (P2) | Broaden wording | Owner | not approved (record) | H3 after GSC data | 54/63 | proposed | — |
| C-05 Earrings (P2) | Drop "secure posts and backs" | Owner | not approved | — | — | proposed | — |
| C-07 Bracelets (P2) | Evidence-backed wording (metal list corrected to "gold and silver" in decisions §1.3) | Owner | not approved | — | 0/25 adjustable | proposed | — |
| C-10 Bags/Wallet/Watches (P2) | Add "preloved branded" + approved "authenticated in Japan"; no origin | Owner | not approved | — | 6/6, 27/27, 29/31 preloved | proposed | — |
| C-11 (P3) | Optional editorial tightening (puffery) | Owner | optional | — | — | optional | — |
| C-08 Anklets (P3) | Optional wording | Owner | optional | — | one piece | optional | — |
| C-12 (P2, website code) | Japanese listing titles in `listingTitle` (`lib/meta-text.ts`); JA wording needs approval | Site | → OD-S4-10 (deferred) | separate PR, unit tests, `check:terms` | — | not implemented | — |
| K-01 Fine Jewelry (P1) | Remove 3 preloved pieces or drop "new" from text | Owner | → OD-S4-4 (text approved) | — | R3438, N6430, N7040 | proposed | — |
| K-02 Preloved Jewelry (P1) | Move R3435 or drop "unbranded" | Owner | → OD-S4-4 (text approved) | — | R3435 Tiffany | proposed | — |
| K-03 (P2) | Correct misspelled brand in product names; owner checks `brand` field | Owner | → P-08/OD-S4-9 | — | "Tiifany" | proposed | — |
| K-04 (P3) | Observation: two watch URLs nearly identical; canonical consolidation out of scope | — | none | — | — | observation | — |
| K-05 (P3) | Optional "jewelry and accessories" wording | Owner | optional | — | — | optional | — |
| none — §4 "Internal-linking opportunities (website code, P2, not implemented)" | Preloved Jewelry ↔ Preloved Branded; Pearls → guide pearl section | Site | → OD-S4-10 | destination exists | — | not implemented | — |
| none — §5.1 "No men's collection is proposed (do not invent)" | — | — | rule | — | — | rule | — |
| P-01 (P0 historical) | True condition of C0853, W0531 set in Hub | Owner | decided (Preloved) | — | 5.3a live re-fetch 2026-10-30 | RESOLVED BY OWNER; VERIFIED LIVE (CLOSED) | no rollback unless New is factual |
| P-02 (P1) | 340 spec-string descriptions; pilot 10 pieces first | Owner | → Pilot (approved in principle, conditional) | — | — | proposed | — |
| P-03 (P1) | 16 empty descriptions: add Hub description; optionally improve fallback (W1) | Owner / Site | → Pilot/H2; OD-S4-10 | — | — | proposed | — |
| P-04 (P1) | N1616, 8C100 in-text origin: keep or badge-only | Owner | → OD-S4-6 (remove; 8C100 conditional) | basis of Hub `origin` | — | proposed | — |
| P-05 (P1) | 8C100 Markdown asterisks: remove in Hub or strip in code (P2) | Owner / Site | not approved (record: "P-05 is not approved") | — | 28 occurrences | proposed | — |
| P-06 (P1) | "Product rank" and serial numbers: explain scale or replace; keep or remove serials | Owner | → OD-S4-7 (approved conditional; BLOCKED) | preservation verified | 77 rank, 54 serial | proposed | — |
| P-07 (P1) | Meaning of "Natural" in 5 pearl names | Owner | → OD-S4-8 (keep; classification outstanding) | supplier/gemmological confirmation | — | UNVERIFIED | — |
| P-08 (P2) | Name typos corrected; slug must not change; test on one product | Owner | → OD-S4-9 (spelling only, conditional) | one-product slug test | — | proposed; slug regeneration UNVERIFIED | — |
| P-09 (P2) | Add missing type word in 16 names | Owner | NOT APPROVED (record) | — | — | proposed | — |
| P-10 (P2) | 285 titles > 60 chars; shorter only with name unchanged (code) | Site | → OD-S4-10 (keep out) | — | — | observation | — |
| P-11 (P2) | First 150 chars of rewritten descriptions so cut falls at sentence | Owner | content tip | — | 24 meta end in "…" | tip | — |
| P-12 (P2) | English inside JA text (B1318) | Owner | — | — | — | language quality | — |
| P-13 (P2) | Basis for preloved Japan flags (310 badges, 182 preloved) | Owner | — | — | Hub `origin` | UNVERIFIED by audit | owner confirms |
| P-14 (P3) | Identical descriptions on identical specs: leave | — | — | — | — | acceptable | — |
| P-15 (P3) | E8330 as structural template | Owner | editorial | — | — | editorial | — |
| A-01 / BUG-03 (P1) | Option A or B per paragraph; owner edits; live re-fetch; record dated | Owner | → OD-S4-2 Option A | — | §7 sheet | OPEN (per this doc) | owner edits; verify |
| A-02 (P2) | 天然石 vs 宝石 in JA article | Owner | not approved (record: 天然石 stays) | — | — | UNVERIFIED | — |
| A-03 (P2) | Article names handmade bracelets while collection empty; decide with C-09 | Owner | → OD-S4-5 | — | — | open | — |
| OD-S4-1 (§10) | P-01 condition | Owner | decided; verified live | — | — | closed (CLOSED) | — |
| OD-S4-2 … OD-S4-10 (§10) | decisions 2–10 as listed | Owner | (see approval record) | — | — | OWNER APPROVAL PENDING (at this doc's date) | — |
| H1 (§12) | P-01 (done), BUG-03 edit, C-01/C-02/C-04/C-06, K-01/K-02 | Owner (Hub) | gate: OD-S4-1…5, then live re-fetch | — | — | batch defined. CONFLICT: `STEP-4-OWNER-APPROVAL-RECORD.md` §4 defines H2–H5 differently (H2 = N1616/8C100; H3 = rank/serial; H4 = pilot; H5 = spelling) than this §12 (H2 = pilot/P-03/P-05/P-07/P-08/P-09; H3 = C-03/C-05/C-07/C-10) | — |
| H2 (§12) | 10-piece pilot, P-03, P-05, P-07, P-08/P-09 | Owner | pilot reviewed; slug test passed | — | — | batch defined | — |
| H3 (§12) | C-03/C-05/C-07/C-10 refinements | Owner | after 4 weeks of GSC data | — | — | batch defined | — |
| W1 (§12) | JA listing titles (C-12), fallback, Markdown strip, cross-links | Site | owner approval; tests §13 | own branch/PR | — | → OD-S4-10 deferred | — |
| none — §12 "Out of scope" | indexing of empty collection, redirects, hreflang, sitemap, Merchant Center, OD-6, Step 3b/3c | — | — | — | — | separate phases | — |
| none — §13 testing requirements | Hub edits: re-fetch EN/JA, meta ≤ 160, H1, JSON-LD, ItemList, `check-seo-live`; W1: unit tests, guards, 375 px, console | Site | — | — | — | requirements | — |
| none — §15 evidence gaps | JA coverage; Hub fields not read; snapshot; revalidation and slug regeneration UNVERIFIED; no assay | — | — | — | — | gaps | — |

---

## 15. docs/seo/STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md

(a) Owner-operated checklist for seven Hub records (prepared 2026-10-30; article moved out of SEO scope 2026-10-31). Status words: "Owner decisions recorded. No Hub implementation authorized or performed." · AUDITED — OWNER APPROVAL PENDING · SUPERSEDED (first Rings text) · Unverified (deployed Hub UI).

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| none — §0 "Do NOT click Regenerate Japanese / translate" | — | Owner | rule | — | Hub source | rule | — |
| none — §0 "Backups outside GitHub before editing each field" | — | Owner | rule | — | — | rule | — |
| none — §0 "Unverified: deployed Hub interface matches source; permission names" | — | — | — | — | — | UNVERIFIED | — |
| §1 Article (OD-S4-2, Option A) | four deletions in `body_en`/`body_ja`; keep 天然石; Save post once | Owner | approved; content task (PR #450) | — | live URLs | not applied (per Status 2026-10-31) | owner edits; live check (§8) |
| §2 Necklaces | replace EN/JA description with approved text | Owner | approved (OD-S4-3) | — | — | not applied | owner Save |
| §3 Rings — Choice 2 | approved text; earlier text SUPERSEDED | Owner | approved (OD-S4-3, Choice 2) | — | record §7 | not applied | owner Save |
| §4 Other Accessories | approved text | Owner | approved | — | — | not applied | owner Save |
| §5 Pendants | approved text | Owner | approved | — | — | not applied | owner Save |
| §6 Fine Jewelry category | approved text; Published on | Owner | approved (OD-S4-4) | — | — | not applied | owner Save |
| §7 Preloved Jewelry category | approved text | Owner | approved (OD-S4-4) | — | — | not applied | owner Save |
| none — §8 "After you publish (14 pages)" | HTTP 200, approved text, meta, canonical/hreflang unchanged, counts unchanged, no new origin claim; article reported as CONTENT task | Site verifies | — | owner tells which records saved | — | pending owner publish | verify |
| none — §9 facts (N5140, R1866, R2595, R2598) | no product change authorised | — | recorded | — | record §7 | recorded | — |

---

## 16. docs/seo/STEP-4-OWNER-APPROVAL-RECORD.md

(a) Owner approval record and implementation-readiness plan (recorded 2026-10-30; §7 second pass same day; BUG-03 moved out of SEO scope 2026-10-31). Status words: AUDITED — OWNER APPROVAL PENDING · APPROVED — PENDING IMPLEMENTATION · CONDITIONAL / EVIDENCE REQUIRED · DECIDED — LEAVE UNCHANGED · DEFERRED · APPROVED IN PRINCIPLE · BLOCKED · READY FOR QA → VERIFIED (vocabulary rule); tags [V]/[A]/[O]/[U].

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| OD-S4-2 | BUG-03 Option A both paragraphs EN/JA; 天然石 stays; Option B not used | Owner | APPROVED — PENDING IMPLEMENTATION | — | §2.1 | pending implementation; BUG-03 stays OPEN (per doc) | owner edits Hub |
| OD-S4-3 | Four collection texts; Rings Choice 2 supersedes; no resizing/chain promise; C-03/05/07/08/10/11 NOT APPROVED | Owner | APPROVED — PENDING IMPLEMENTATION | — | §2.2 | pending | owner Save |
| OD-S4-4 | Two category texts; no membership change | Owner | APPROVED — PENDING IMPLEMENTATION | — | §2.2 | pending | owner Save |
| OD-S4-5 | Handmade Gemstone Bracelets unchanged | Owner | DECIDED — LEAVE UNCHANGED (CLOSED) | — | — | decided | — |
| OD-S4-6 | N1616 remove origin phrase (pure deletion); 8C100 CONDITIONAL on exact replacement sentence | Owner | APPROVED — PENDING IMPLEMENTATION (N1616); CONDITIONAL (8C100) | owner approves 8C100 sentence (§3.1 proposal not approved) | §3.1 | pending; origin-documentation gaps [U] flagged | owner wording |
| OD-S4-7 | Remove rank lines and serials; BLOCKED until preservation verified; unblock conditions (1)–(3) | Owner | APPROVED — CONDITIONAL / EVIDENCE REQUIRED; implementation BLOCKED | preservation verification; secured export; row list approval | §3.2: 77 products (differs from audit 78/77/54) | BLOCKED | owner confirms where values are kept |
| OD-S4-8 | Keep "Natural" in 5 pearl names; classification verification outstanding | Owner | DECIDED — LEAVE UNCHANGED; verification outstanding | supplier/gemmological confirmation per piece | §3.3 | decided; [U] treatment status | evidence task (kept apart) |
| OD-S4-9 | Spelling corrections only (SB094, N1767, N2004, N0484, N1999); type words NOT APPROVED; slugs unchanged; no live test now | Owner | APPROVED — CONDITIONAL / EVIDENCE REQUIRED | full Hub list; intended spelling per product; controlled-test design (H5) approved; invoice/customer-view answers | §3.4 | conditional | owner supplies list; approve test |
| OD-S4-10 | Optional website code (JA titles, fallback, Markdown, links) | Owner | DEFERRED | after Hub corrections verified | — | DEFERRED | — |
| Pilot | Ten description pairs (decisions §6) | Owner | APPROVED IN PRINCIPLE — CONDITIONAL / EVIDENCE REQUIRED | re-check against Hub record at edit time | §3.5: no mismatch of fact; flags (B1318 spacing, Sz#, per-pair weight) | conditional | confirm against Hub record |
| H1 | BUG-03 + six listing texts | Owner | owner final go | drift check; copies | §4 | not authorised to run | owner go |
| H2 | N1616 and 8C100 origin text | Owner | owner approves 8C100 sentence | pre-edit copies | §4 | not authorised | — |
| H3 | Rank/serial removal | Owner | BLOCKED | §3.2 preconditions all mandatory | §4 | BLOCKED | — |
| H4 | Ten-product pilot | Owner | pairs re-checked against Hub record | — | §4 | not authorised | — |
| H5 | Spelling corrections; controlled-test design (one low-traffic product) | Owner | test design for approval, not executed | complete list; intended spelling; answers on invoices | §4 | not authorised | owner approves design |
| none — §4 "Natural pearl verification is its own evidence task" | supplier/gemmological confirmation per piece | Owner | — | — | — | kept apart; blocks any pearl name change | — |
| none — §5 unresolved facts | counts differ from audit; JA rank/serial coverage; live Hub rows; pilot Hub record; category revalidation timing; pearl classification; `origin` basis; invoice effects | — | — | — | — | unresolved | — |
| none — §7 Rings Choice 2 | final approved EN/JA | Owner | decision recorded | — | fit check [V] 135 rings | recorded; never implemented first text | owner Save |
| none — §7 N5140 | name updated with "40cm" by owner; no further H1 edit required | Owner | done [O] | — | [V] live pages | done (CLOSED) | — |
| none — §7 R1866 "PM is platinum" | — | Owner | [O] not independently read | — | — | recorded | — |
| none — §7 R2595 / R2598 | no material assigned without verified evidence; no correction authorised | Owner | — | — | [V] category/stock; [U] material | recorded | — |

---

## 17. docs/seo/STEP-4-OWNER-DECISIONS.md

(a) Owner decision package OD-S4-2 … OD-S4-10 plus the ten-piece pilot (prepared 2026-10-30; PR #446). Status words: "AUDITED — OWNER APPROVAL PENDING. Nothing in this document is approved, implemented or scheduled." · BUG-03 OPEN · tags [V]/[A]/[O]/[U]/[P]. (Superseded in part by `STEP-4-OWNER-APPROVAL-RECORD.md`, which "controls" where they disagree.)

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| OD-S4-2 (P1) | BUG-03 article: Option A (recommended) or B per paragraph; A-02 optional | Owner | recommended A; (record: APPROVED A) | none for A; for B: Japan-flag confirmation | §2 | open in this doc | tick box |
| OD-S4-3 (P1) | Collections C-01, C-02, C-04, C-06 (+C-03, C-05, C-07, C-10); do not move products | Owner | recommended rewrite; C-02/C-06 need policy statement | resizing policy; chain policy | §4 | open in this doc | tick boxes |
| OD-S4-4 (P1) | K-01, K-02: change text, not membership | Owner | recommended (a) | — | §5 | open | tick |
| OD-S4-5 (P1) | C-09 empty collection: leave as is, no text | Owner | recommended leave | — | §5 | open | tick |
| OD-S4-6 (P1) | P-04 remove in-text origin phrase; keep badge; no replacement sentence written | Owner | recommended remove | Hub `origin` basis; N1616 hallmark remark confirmation [U] | §6 | open | tick |
| OD-S4-7 (P1) | P-06 remove rank and serials; copy serials first; keep "Product condition" | Owner | recommended remove | supplier scale definition (only if keeping rank) | §6 | open | tick |
| OD-S4-8 (P1) | P-07 drop "Natural" until meaning confirmed (default) / natural colour / document | Owner | recommended drop. Note: approval record decided KEEP (owner decision supersedes) | owner/supplier meaning; slug precaution (OD-S4-9) | §6 | open | tick |
| OD-S4-9 (P2) | P-08/P-09 typos and missing type words; one-product slug test first | Owner | approve typos; type words only where certain | Hub name list; slug test (explicit go-ahead) | §6 | open | tick |
| OD-S4-10 (P2) | Website-code batch W1 (C-12, P-03, P-05, P-10, links): recommended defer | Owner | recommended defer | after Hub batches; GSC data | §7 | open | tick |
| Pilot (P1) | Ten drafts AL112, AL510, B4618, E1J33, A8523, ND45S, N1105, R0047, E1010, B1318 | Owner | approve all/some/edit/reject | — | §6 | open | tick |
| none — §1.3 corrections C-06 "gold and platinum"; C-07 "gold and silver" | corrected texts are the ones to approve | — | — | — | name counts [V] | corrected | — |
| none — §1.2 "Suggested order" 1–10 | OD-S4-2 → 8 → 3 → 4 → 7 → 6 → pilot → 9 → 5 → 10 | Owner | suggestion | — | — | suggestion | — |
| A-02 | 天然石 → 宝石 unless natural stones confirmed | Owner | optional; (record: not approved) | — | — | open | — |
| A-03 | article names handmade bracelets; decide with OD-S4-5 | Owner | — | — | — | open | — |
| C-01 … C-11 (§4) | per-collection texts and refinements | Owner | per tick boxes | — | — | open | — |
| K-01, K-02 (§5) | category texts (a) recommended | Owner | — | — | — | open | — |
| C-09 (§5) | leave as is; alternatives | Owner | — | — | — | open | — |
| none — §9 exclusions | no Hub edit, no membership, no code, no migration, no routing, no GSC, no payment, no Step 3b/3c, no OD-6, no merge | — | — | — | — | rules | — |
| none — §10 evidence gaps | metal words from names only; `brand`/`origin` not read; policies owner/supplier facts; P-08/P-09 lists need Hub query; order-line effects unverified | — | — | — | — | gaps | — |

---

## 18. docs/seo/GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md

(a) Read-only review for R-30 (guide terminology) and R-31 (trust claims vs evidence), 2026-11-01. Status words: AUDITED (no copy changed) · PASS · near-miss · contradiction · [V]/[O]/[U] · OD-CT-1..6 "nothing changes until decided".

| ID | What it requires | Owner | Approval / decision state | Dependencies / gates | Evidence named | Current state word | Remaining action |
|---|---|---|---|---|---|---|---|
| T-1 | Terminology guarded rules | — | — | — | `check:terms` | PASS [V] | — |
| T-2 | "sourced in Japan" on About — approved wording? | Owner | → OD-CT-1 | — | `about.ts:139`, `:73` | near-miss [U] | decide |
| T-3 | "Certified diamond jewelry" vs FAQ "only when listing states it" | Owner | → OD-CT-2 | — | `about.ts:149,153`, `:83`; `faq.ts:86` | contradiction | decide |
| T-4 | Layaway gating on JA site | — | — | — | `check:layaway-ja` | PASS [V] | — |
| T-5 | Unsourced platinum-market claim | Owner | → OD-CT-3 | — | `jewelry-guide.ts:390` | [U] | source or soften |
| none — figures table "¥8,000 / ¥800 wording mismatch with FAQ" | — | Owner | → OD-CT-4 | MC-G13 quotes the guide | `shopping-guide.ts:115`; `faq.ts:271` | mismatch [O] | decide |
| none — "10% consumption tax, no revenue stamp" | — | Owner | → OD-CT-4 | — | `shopping-guide.ts:105` | [U] | confirm |
| none — "coupon comes off first" | — | Owner | → OD-CT-4 | — | `shopping-guide.ts:90` | [U] | confirm |
| C-1 | Founded 2021; incorporated 2024; Tateishi | — | — | — | GBP readiness doc; G4 registered-name form to confirm | [O] | — |
| C-2 | Permit and invoice numbers | — | — | — | `legal.ts:116-123` | [O] | — |
| C-3 | Chamber and Rotary memberships | — | — | — | `phase-11/AUTHORITY-OPPORTUNITIES.md:24-25` | [O]; externally [U] | — |
| C-4 | "Every preloved piece is authenticated…" universal claim | Owner | → OD-CT-5 | — | `shopping-guide.ts:51`; `i18n.ts:202,352` | universal claim [U] | confirm or soften |
| C-5 | "What every listing states" label overstates (nullable `karat`, `weight_g`) | Owner | → OD-CT-5 | — | `about.ts:179-180`; `api.md:15-17` | overstates | confirm or soften |
| C-6 | "interest-free layaway" EN | — | — | — | `legal.ts:1194` | consistent [V] | — |
| C-7 | "preloved watches" offered | Owner | → OD-CT-6 | — | `i18n.ts:227` | [U] | confirm or remove |
| C-8 | unquantified community/worldwide claims | — | — | — | — | acceptable as written | — |
| C-9 | Founder name | — | — | — | `legal.ts:105-108` | consistent [V] | — |
| C-10 | No "100 %", award, press, rating, review count | — | — | — | — | PASS [V] | — |
| none — "Reviews, ratings, testimonials (fabrication check)" | Hub-only testimonials/reviews; `aggregateRating` only with count > 0 | — | — | — | `components/home/testimonials.tsx`; `lib/json-ld.ts:55-62,164` | PASS [V] | — |
| none — §3 "Plan §9 supporting pages do not exist; Akoya no guide section" | Phase 6 `/en/guides/*` (OD-P6-5); Phase 6/8 brief item | Owner/Site | — | OD-P6-5 | — | gap recorded | — |
| none — §3 "Plan §24 six trust pages do not exist" | Phase 6 content | Owner/Site | — | — | — | gap recorded | — |
| none — §3 "Sources on page: comments only; nothing attributes" | optional E-E-A-T | Site | — | — | `jewelry-guide.ts` comments | recorded | — |
| OD-CT-1 | Keep "sourced in Japan" or replace with permitted phrasing | Owner | undecided (default unchanged) | — | — | open | decide |
| OD-CT-2 | Resolve certified-diamond wording vs FAQ | Owner | undecided (default unchanged; FAQ narrower) | — | — | open | decide |
| OD-CT-3 | Source or soften platinum claim | Owner | undecided | — | — | open | decide |
| OD-CT-4 | Confirm shopping-guide figures and free-shipping wording | Owner | undecided; flagged in Merchant package (MC-G13) | — | — | open | decide |
| OD-CT-5 | Confirm universal authentication claim and "every listing" label | Owner | undecided | — | — | open | decide |
| OD-CT-6 | Confirm preloved watches category or remove | Owner | undecided | — | — | open | decide |
| R-30 (§4 verdict) | — | — | — | — | — | AUDITED; terminology PASS; near-misses open until OD-CT-1..4 | — |
| R-31 (§4 verdict) | — | — | — | — | — | AUDITED; fabrication PASS; OD-CT-5/6 open; §24 trust pages Phase 6 | — |
| none — §6 "UNVERIFIED: every [U] item; external existence of memberships and permits" | — | — | — | — | — | UNVERIFIED | — |

---

## IDs seen

Every distinct ID string encountered across the 18 documents (as written; IDs that collide across documents with different meanings are flagged):

- Requirements register: R-01, R-02, R-03, R-04, R-05, R-06, R-07, R-08, R-09, R-10, R-11, R-12, R-13, R-14, R-15, R-16, R-17, R-18, R-19, R-20, R-21, R-22, R-23, R-24, R-25, R-26, R-27, R-28, R-29, R-30, R-31, R-32, R-33, R-34, R-35, R-36, R-37
- Merchant Center gaps: MC-G1, MC-G2, MC-G3, MC-G4, MC-G5, MC-G6, MC-G7, MC-G8, MC-G9, MC-G10, MC-G11, MC-G12, MC-G13
- Hub findings: HUB-S1, HUB-S2, HUB-CATALOG
- Bugs / workstreams: BUG-01 (referenced), BUG-02, BUG-03, BUG-04 (referenced), BUG-05, BUG-06, BUG-07, BUG-08, BUG-09, OG-PRODUCT, TEST-900080
- Status-doc decisions and deferred findings: D1, D2, D3, D4 (Status meanings: terms wording / old domain / sold products / two 308 hops); X1, X2, X3, X4, X5, X6, X7, X8, X9, X10
- Preview-acceptance decisions (ID COLLISION with Status D1–D4): D1 (React #418), D2 (catalog retry), D3 (375 px), D4 (fixed checkers), D5, D6, D7
- QA-report decisions: R-1, R-2, R-3 (return policy; collide with R-01 and map R1), S-1 (shipping; collides with §6 S-1 check), D-1 (Vercel previews), P3-1, P3-2, P3-3, P3-4, P3-5, P3-6, P3-7, P3-8, P4-1, P4-2, P4-3, P4-4, P4-5, P4-6, S-2, S-3, S-4, S-5, C-1, C-2, C-3, C-4 (QA §6 checks; collide with guide-review C-1…C-10 and Step 4 C-01…), O-1, O-2a, O-13, O-14 (owner actions; O-1..O-12 referenced via matrix, UNVERIFIED), 1.1–1.11, 2.1–2.6, 3.1–3.7
- Migration-map: E1–E15, F1, F2, F3, F4, F5, R1–R21 (route families), C0, C1, C2, H0, H1, H2, K1–K14, OD-1, OD-2, OD-3, OD-4, OD-5, OD-6, OD-7, OD-8, OD-9, OD-10, OD-11, OD-12, OD-13, OD-14, OD-15, Gate A, Gate B, Gate C, Gate D, Gate E, Gate F, Gate G, Gate H, Gate I, Gate J, Gate K, L1, L2, L3, N1, N2, N3, N4, B1, B2 (Status planning corrections), Phase 2A, 2B, 2C, 2D, 2E, 2E-stage-1
- Master plan / roadmap: Phase 0–12, Phase A–F (§4), Gate 0, Step 1 (a)–(f), Step 2, Step 3, Step 3a, Step 3b, Step 3c, Step 4, Step 5, P0, P1, P2, P3 (priority), OD-GBP-1, Release 0
- Other owner decisions: OD-F1, OD-SD-1, OD-SC-1, OD-SC-2, OD-SC-3, OD-SC-4, OD-ATTR-1, OD-ATTR-2, OD-ATTR-3, OD-ATTR-4, OD-ATTR-5, OD-MC-1 … OD-MC-12 (OD-MC-7, OD-MC-9, OD-MC-11, OD-MC-12 named individually), OD-P6-1 … OD-P6-10 (OD-P6-5, OD-P6-7, OD-P6-8 named individually), OD-CT-1, OD-CT-2, OD-CT-3, OD-CT-4, OD-CT-5, OD-CT-6, OD-AUTH-1, OD-AUTH-2, OD-AUTH-3, OD-AUTH-4 (withdrawn)
- Search Console: GSC-01, GSC-02, GSC-03, GSC-04, GSC-05, GSC-06, GSC-07, GSC-08, GSC-09
- Step 4: OD-S4-1, OD-S4-2, OD-S4-3, OD-S4-4, OD-S4-5, OD-S4-6, OD-S4-7, OD-S4-8, OD-S4-9, OD-S4-10, Pilot, A-01, A-02, A-03, C-01, C-02, C-03, C-04, C-05, C-06, C-07, C-08, C-09, C-10, C-11, C-12, K-01, K-02, K-03, K-04, K-05, P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-11, P-12, P-13, P-14, P-15, H1, H2, H3, H4, H5 (H2/H3 differ between audit §12 and approval record §4), W1
- Guide/trust review: T-1, T-2, T-3, T-4, T-5, C-1, C-2, C-3, C-4, C-5, C-6, C-7, C-8, C-9, C-10, G4 (referenced)
- Security batch: W-01, W-02, W-03, W-12, W-13, H-07, H-01 (referenced)
- Step 3 follow-up: P2, P3 (closeout follow-ups in Status; collide with priority words)

## Items without an ID

Rows whose ID column reads "none — …" (counted per document):

| Document | Rows without an ID |
|---|---|
| 1 CHA-JEWELS-SEO-MASTER-PLAN.md | 33 |
| 2 SEO-REQUIREMENTS-REGISTER.md | 10 |
| 3 SEO-IMPLEMENTATION-STATUS.md | 16 |
| 4 SEO-QA-REPORT.md | 27 |
| 5 SEO-BASELINE.md | 22 |
| 6 SEO-MIGRATION-MAP.md | 24 |
| 7 SEO-DEFECTS-2026-10-29.md | 0 |
| 8 OUTSTANDING-ISSUES-REGISTER.md | 2 |
| 9 PERF-STEP3-FINDINGS.md | 7 |
| 10 PREVIEW-ACCEPTANCE-2026-10-31.md | 22 |
| 11 SEARCH-CONSOLE-BASELINE-2026-10-30.md | 2 |
| 12 SEARCH-CONSOLE-BASELINE-2026-10-31.md | 2 |
| 13 SEO-OPERATIONS-RUNBOOK.md | 20 |
| 14 STEP-4-CONTENT-AUDIT.md | 5 |
| 15 STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md | 5 |
| 16 STEP-4-OWNER-APPROVAL-RECORD.md | 6 |
| 17 STEP-4-OWNER-DECISIONS.md | 4 |
| 18 GUIDE-TRUST-CONTENT-REVIEW-2026-11-01.md | 8 |
| **Total** | **215** |
