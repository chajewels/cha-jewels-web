# SEO requirements register (2026-10-31)

One readable register of every requirement in `CHA-JEWELS-SEO-MASTER-PLAN.md` (§1–§33 and the Final Recommendation), with its approval, owner, implementation and release evidence, verification, gaps, acceptance criteria and next action. It is the reconciled form of the 2026-10-31 audit matrix, kept beside the code that changes it. It replaces no record: `SEO-IMPLEMENTATION-STATUS.md` stays the dated log, `OUTSTANDING-ISSUES-REGISTER.md` the issue list, `SEO-QA-REPORT.md` the test evidence. Where they disagree with this file, fix the disagreement; do not average them.

**Status words** (governance vocabulary): NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE. Plus CLOSED and OWNER DECISION PENDING. Nothing here claims a page is indexed, ranking or eligible for rich results except the three URLs named in R-02.
**Owners:** *Site* = Claude Code, this repository (`app/`, `components/`, `lib/`). *Hub* = Lovable (Hub code, `supabase/functions/`, migrations) and the owner's Hub content edits. *Owner* = Cynthia (decisions, Google/DNS accounts, all SQL). *External* = Google, directories, press.
**Evidence tags:** [V] verified on a date by the method named; [O] owner-reported; [U] unverified. A [V] is a sample, never a crawl of every URL.

---

## 1. Decisions applied in this revision

| Decision | Source | Applied as |
|---|---|---|
| BUG-03 (origin wording in the article) is **out of SEO scope**: a brand-rule content task, Option A decided, Hub edit owner-operated | PR #450, owner 2026-10-31 | R-24; no SEO status item, no SEO blocker; its live check stays in the Step 4 checklist §8 as a content check |
| `chajewelsjapan.com` is **kept** as the live Page365 shop; **no redirect** | PR #451, owner 2026-10-31 | R-35 CLOSED; Master Plan §18 superseded; Gate 0 "old domain" closed |
| The 404 and unknown-path metadata correction has **one owner**: the SEO foundation batch | this batch | R-06; removed from the later locale-308 batch (R-10) |
| Omitting `lastmod` where no trustworthy modification date exists is **intended behaviour**, not a defect and not a limitation | Master Plan §33.3 Step 1(e) (owner-approved rule: never use deploy time or today's date) | R-07 |
| The three priority URLs `/en`, `/ja`, `/en/layaway` stay recorded as **OBSERVED IN SEARCH CONSOLE (indexed), 2026-10-30**, and only those three | `SEARCH-CONSOLE-BASELINE-2026-10-30.md` | R-02 |
| No performance or redirect work waits on a calendar date. Each is gated on **scoping and measured need** (and, for redirects, on populated Search Console data plus an owner decision) | owner, this batch | R-10, R-21, R-22 |

---

## 2. Where every Master Plan section lives

| Plan § | Topic | Register rows |
|---|---|---|
| 1 Executive summary · 31 Strategic goal · Final Recommendation | framing | whole register |
| 2 Current audit · 26 Roadmap · 27 Priority matrix · 32 Immediate next actions · 33 Oct 29 audit integration | status and ordering | R-01 and the phase rows below |
| 3 Multilingual URL architecture · 4 Safe migration procedure · 22 Target information architecture | locale routes | R-08, R-09, R-10, R-26 |
| 5 Homepage SEO | title/description testing | R-13 (testing direction NOT STARTED) |
| 6 Product SEO · 8 Breadcrumbs · 16 Entity (JewelryStore) | product metadata, schema | R-13, R-14, R-17 |
| 7 Product review schema | rating branch | R-17 |
| 9 Jewelry guide strategy | guides | R-30 |
| 10 Kihei · 11 K18 · 13 Filipino | authority content | R-27, R-28, R-29 |
| 12 Layaway SEO | English layaway | R-12 |
| 14 Collection and category SEO | listings and Hub fields | R-16, R-23, R-26 |
| 15 Merchant Center | feed | R-25, section 4 |
| 17 Google Business Profile | local | R-33 |
| 18 Old domain migration | superseded | R-35 |
| 19 Search Console operating system · 29 Success metrics | reporting | R-02, R-03, R-04 |
| 20 Question-query strategy · 25 Content quality rule | content method | R-32 |
| 21 Internal linking system | links | R-20 |
| 23 Product image SEO | images | R-18 |
| 24 Authenticity and trust content | trust | R-31 |
| 28 Systems that should not be rebuilt | rule | applies to every row |
| 30 Core search territory | targets | R-26 to R-29 |
| Video schema/content (P3, §27) | video | R-19 |

---

## 3. Requirements

### Measurement and Search Console
**R-01 Baseline (code and live probe).** Approval: plan Phase 0. Owner: Site. Evidence: `SEO-BASELINE.md`. Verification: [V] 2026-10-28, extended by the 2026-10-31 production run of `scripts/check-seo-live.mjs` (432 pass, 0 fail, 0 deferred, before this batch). Gap: none. Acceptance: the checker stays at 0 fail. Next: re-run after each release.

**R-02 Search Console property, sitemap and priority URLs.** Approval: owner. Owner: Owner. Evidence: Domain property verified, sitemap `sitemap.xml` Success with 976 discovered pages [V 2026-10-30, UI]. **`/en`, `/ja` and `/en/layaway` are OBSERVED INDEXED, per Google's stored URL status, 2026-10-30 (requested by the owner on 2026-10-29).** Not representative of the rest of the site. Of 8 sampled deeper URLs, 6 were "Discovered – currently not indexed" and 2 "URL is unknown to Google". Gap: no page beyond the three is observed indexed. Acceptance: any further indexed claim cites a dated Search Console observation. Next: owner-run re-inspection of the same 8 URLs (no indexing request).

**R-03 Search Console reporting and weekly operations (Phase 12; plan §19, §29).** Approval: OD-SC-1..4 pending. Owner: Owner (account, exports), Site (records). Evidence: Page indexing "Processing data" and Performance one date (2026-10-28, 5 impressions, 1 click) on 2026-10-31 [V, UI and CSV export, originals stored outside the repository]; `SEARCH-CONSOLE-BASELINE-2026-10-31.md`. Gap: no meaningful baseline; disclosed queries are branded; undisclosed unknown; 28 October data cannot evaluate later releases. Acceptance: a Performance export with enough days to compare releases; Page indexing exported once populated. Next: owner-run reads as monitoring; these are not release gates for other work.

**R-04 Organic purchase and revenue attribution (plan §29 Commercial).** Approval: none. Owner: Site + Hub + Owner. Evidence: [V 2026-10-31, code] Vercel Web Analytics events plus consent-gated Meta Pixel and Google Ads tags that receive purchase-labelled values after order, draft or plan creation; no GA4 tag; no source or UTM capture; the Hub is authoritative for orders and payments. Those tag events do not establish confirmed payment or realized revenue. Gap: **organic attribution is not implemented**; whether any dashboard receives the events is [U]. Acceptance: an owner-approved design (tool, consent, Hub join, privacy) before any tracking change. Next: design document only.

### Crawl and index controls
**R-05 robots.txt and private/utility noindex.** Approval: Release 0. Owner: Site. Evidence: DEPLOYED (PR #397; BUG-05 in #426); `seo-policy.ts`. [V 2026-10-31] live robots matches policy (disallows `/account`, `/checkout`, `/api`, `/review/`, names the sitemap); 0 fail. Gap: signed-in renders of `/account`, `/checkout`, `/loyalty/join` not rendered-checked (X6/X7). Acceptance: private routes say noindex, name no canonical. Next: manual QA with a test account (owner-run).

**R-06 404 and unknown-path metadata hygiene (finding X1).** Approval: batch authorized 2026-10-31. **Batch owner: the SEO foundation batch (this PR). Not part of R-10.** Owner: Site. Evidence: **READY FOR QA.** Production before: `/foo/bar` returned a real 404 with noindex yet emitted a canonical, three hreflang links and og:url naming itself; single-segment, locale-prefixed and missing-resource 404s were already clean [V 2026-10-31]. Fix: `seoLinkPlan` (`lib/seo-policy.ts`) makes `<SeoLinks />` say nothing for an unknown path. Verification: unit tests, rendered checker (`FOUNDATION` rows), browser. Gap: none known; production confirmation after release. Acceptance: every 404 shape is a real 404 with noindex and no canonical, hreflang or og:url. Next: QA, then release.

**R-07 Sitemap.** Approval: OD-12; D3 (sold products stay for now). Owner: Site. Evidence: DEPLOYED (Phase 2D; Step 1). [V 2026-10-31] 976 URLs, 906 image entries, no hreflang in the sitemap (HTML only, by decision), `/en/layaway` once, no `/ja/layaway`. **`lastmod` appears on only 8 entries by design: product `lastmod` was removed because the Hub's `updated_at` does not track price, stock or media, and the approved rule forbids deploy time or today's date as a proxy. This is intended behaviour, not a defect and not a limitation to fix.** Gap: sold-product policy X10 is a later review. Acceptance: no `lastmod` without a trustworthy source. Next: add `lastmod` only if the Hub supplies a real content-modified timestamp.

### Locale architecture
**R-08 Locale routes `/en` and `/ja`.** Approval: OD-2, 3, 8, 9, 10, 15 (2026-10-28). Owner: Site. Evidence: 2A–2E-stage-1 DEPLOYED (temporary 307s), production-verified; SEARCH ENGINE RECRAWL PENDING. Gap: permanent redirects not started (R-10). Acceptance: locale URLs 200, self-canonical. Next: none until R-10 is approved.

**R-09 Canonical and hreflang.** Approval: OD-2 (x-default English), OD-12. Owner: Site. Evidence: DEPLOYED, [V 2026-10-31] 571 checks pass on a local build; production 432 pass. Gap: none. Acceptance: one self canonical, en/ja/x-default only for existing, eligible languages. Next: preserved unchanged by this batch (valid-page canonical and hreflang diff: none).

**R-10 Permanent redirects, root, `?lang=`, bare `/layaway`, and `/gold-guide` (BUG-06).** Approval: **OWNER DECISION PENDING** (OD-1, OD-3, OD-4, OD-6; route-change rule). Owner: Owner decides; Site implements on a dedicated branch (high-risk phase). Evidence: NOT STARTED. Observed [V 2026-10-31]: `/` and `/ja` answer 200 with the same title and content; `/gold-guide` takes two hops; bare `/layaway` answers 200 for English browsers and 404 for Japanese or crawler-default requests. Gap: no approval; **the 404 hygiene is no longer in this batch's scope here (see R-06).** Gate: an owner decision plus populated Search Console Pages data; **no calendar date**. Acceptance: redirect matrix tests, no loops, canonical and hreflang unchanged, layaway rules intact. Next: owner decision.

**R-11 `/gold-guide` two-hop redirect (BUG-06).** Folded into R-10 (same files, same approval). Status OPEN, deferred.

**R-12 English layaway indexability (Phase 3; plan §12).** Approval: Phase 3. Owner: Site. Evidence: DEPLOYED (PR #421); `/en/layaway` is one of the three observed indexed URLs (R-02). [V 2026-10-31] `/ja/layaway` returns 404 by design. Gap: layaway guides deferred (OD-P6-7). Acceptance: no Japanese layaway anywhere. Next: none.

### Metadata, sharing and structured data
**R-13 Titles and descriptions (Step 1; plan §5, §6).** Approval: Step 1. Owner: Site. Evidence: DEPLOYED, production-verified. Gap: homepage title testing NOT STARTED; `/` and `/ja` duplicate (R-10). Acceptance: one title per page. Next: none now.

**R-14 Product sharing metadata (OG-PRODUCT).** Evidence: CLOSED, DEPLOYED AND VERIFIED LIVE (PR #441, release #442). Preserved by this batch (the product block is unchanged; its og:url already equals the canonical).

**R-15 Sharing identity on the locale tree: `og:url` and `fb:app_id`.** Approval: owner request 2026-10-01 (`og:url`, the Facebook App); batch authorized 2026-10-31. Owner: Site. Evidence: **READY FOR QA.** Before: neither tag appeared on any non-product locale page, because `<SeoLinks />` emits nothing under a locale prefix (observed on every sampled EN template and `/ja` [V 2026-10-31], recorded in the register since 2026-10-30). Fix: `localizedMeta` adds `og:url` from the canonical; the root layout emits `fb:app_id` once from the approved existing id (`lib/og-meta.ts`); **restoration is included, with no new ID, no external setup and no configuration change.** The brand share image, including its content-hash URL, is preserved. Gap: none known. Acceptance: exactly one `og:url` equal to the canonical on every successful locale page, exactly one `fb:app_id`, `og:image` and Twitter tags unchanged. Next: QA, release.

**R-16 Listing SEO (Step 2).** Approval: Step 2. Evidence: DEPLOYED (ItemList, hero OpenGraph). This batch adds only `og:url` to those pages.

**R-17 Structured data (Phase 4; plan §7, §8, §16).** Approval: Phase 4. Owner: Site. Evidence: DEPLOYED (PR #421); JewelryStore, Product, BreadcrumbList, FAQPage, BlogPosting; BUG-02 `sameAs` fix in #426. No shipping or returns markup by owner decision; the rating branch emits only when a genuine approved review exists. Gap: no approved product review yet. Acceptance: structured data reflects visible content and real Hub data. Next: none.

**R-18 Image SEO (plan §23).** Owner: Site + Hub. Evidence: PARTIAL. Alt text present on sampled images and the blog cover alt done (audit and Step 1); 906 image entries in the sitemap [V 2026-10-31]. Gap: the Hub image-metadata part (alt, captions from the Hub) has no recorded completion evidence. Acceptance: image alt comes from Hub data where it exists, never invented. Next: owner decision on Hub image fields (with R-26).

**R-19 Video schema and content (P3).** NOT STARTED, no tracker row existed before this register. Owner: Site + Hub. Acceptance: no video markup without a real, visible video. Next: none until a video exists.

**R-20 Internal linking and crawlable navigation (Step 1(a); plan §21).** Evidence: DEPLOYED, production-verified (PR #429 to #430); five categories had weak inbound links in the audit. Gap: reverse linking and cluster links belong to R-26 to R-28. Acceptance: category and company links in the initial HTML. Next: with R-26.

### Performance and mobile UX
**R-21 Step 3a (Japanese heading font after load).** Evidence: DEPLOYED (#436, #439); no production gain confirmed. Gap: mobile numbers not re-measured since. Acceptance: measured, comparable runs before any claim. Next: none.

**R-22 Steps 3b and 3c (large listings; root-layout rendering and caching).** Approval: none. Owner: Owner scopes; Site implements. Evidence: AUDITED (`PERF-STEP3-FINDINGS.md`, high risk). Gap: no scope. **Gate: owner scoping and a measured need (field data when it exists); no calendar date.** Acceptance: matched before/after mobile runs; cart, account, Hub freshness and order/payment boundaries unaffected. Next: owner scoping.

### Hub content
**R-23 Step 4 Hub-managed content (plan §14; `STEP-4-*`).** Approval: OD-S4-2..10 recorded (2026-10-30). Owner: Owner edits in the Hub; Site verifies. Evidence: AUDITED — OWNER APPROVAL PENDING. [V 2026-10-31] the six listing records (four collections, two categories; EN and JA) show the previous text on both languages, with no drift; none published. Gap: conditional items (8C100 wording, OD-S4-7 preservation, OD-S4-9 spelling, ten-product pilot) need evidence; **Hub-side risk HUB-S1 (section 4)**. Acceptance: checklist §8. Next: owner publishes; Site verifies on the owner's word.

**R-24 BUG-03 article wording.** Out of SEO scope (PR #450). Owner: Owner (Hub edit). Evidence: Option A decided; not yet applied [V 2026-10-31]. The approved footer clarifier is on every page and is not part of the article body. Acceptance (content task): both language bodies verified live without the four phrases.

### Commercial and authority
**R-25 Merchant Center (Phase 5; plan §15).** Approval: none; OD-MC-1..10. Owner: Owner (account), Site (feed route), Hub (data). Evidence: AUDITED; no feed route exists. Gap: see section 4 (MC-G1..G6). Acceptance: per `MERCHANT-CENTER-READINESS.md` §7 (monitoring) and §9 (implementation outline). Next: owner answers X8 and OD-MC.

**R-26 Commercial landing pages and Hub SEO fields (Phase 6; plan §14, §22, §30).** Approval: none; OD-P6-1..9. Owner: Owner decides; Hub implements the fields; Site renders. Evidence: AUDITED, no route created, Hub SEO fields a contract draft. Gap: no `kihei` or `diamonds` collection in the Hub (live: 12 collections [V 2026-10-31]). Acceptance: no invented collections; approved Hub fields. Next: owner decisions.

**R-27 Kihei authority (Phase 7).** AUDITED, draft only; route `/en/guides/kihei` needs the route-family approval (OD-P6-5) and editorial approval. **R-28 K18 authority (Phase 8):** same gates; `/en/guides/k18-gold-japan`. Wording rule X9 applies.

**R-29 Filipino search (Phase 9; plan §13).** AUDITED, briefs only; a Filipino locale or route is Phase-2-class and needs owner approval; `description_tl` is not rendered anywhere. Acceptance: no machine-generated translation published.

**R-30 Jewelry and shopping guides (plan §9).** Evidence: the guides exist and are in the sitemap [V 2026-10-31]. Gap: no tracker row existed before this register; no recorded review against §9. Acceptance: guide copy follows the terminology rules. Next: review with R-27/R-28.

**R-31 Authenticity and trust content (plan §24).** Gap: no tracker row existed; covered in part by the approved origin clarifier (on every page via the Hub footer tagline) and the About/Why pages. Acceptance: trust claims match evidence; no fabricated reviews or ratings.

**R-32 Question-query strategy and content quality rule (plan §20, §25).** A method, not a deliverable. Gap: no tracker row existed. Acceptance: content briefs cite a query source; blocked on Search Console query data (R-03).

**R-33 Google Business Profile (Phase 10).** AUDITED; eligibility OD-GBP-1; profile state [U]. Owner: Owner / External. **R-34 Authority and backlinks (Phase 11):** documentation only; OD-AUTH-1..3 (OD-AUTH-4 withdrawn by PR #451).

**R-35 Old domain `chajewelsjapan.com` (plan §18).** CLOSED — owner decision KEEP, no redirect (PR #451). Master Plan §18 is superseded. Nothing to implement.

**R-36 Public subdomains `portal.` and `paymenthub.` (GSC-09).** Approval: none. Owner: Owner decides; Hub / Firebase implements (not this repository). Evidence: public crawlability observations only [V 2026-10-31], recorded in `SEARCH-CONSOLE-BASELINE-2026-10-31.md` §5. Gap: policy undecided; `paymenthub.` code owner not identified; nothing known about authenticated routes. Acceptance: an owner-defined policy, verified with public requests only. Next: owner decision.

---

## 4. Gaps recorded with owners and acceptance criteria

### Merchant Center proposal gaps (R-25)
| ID | Gap | Owner | Acceptance |
|---|---|---|---|
| MC-G1 | The readiness doc names the feed URL `/api/merchant-feed.xml` but plans the file `app/api/merchant-feed/route.ts`, which serves `/api/merchant-feed`. OD-MC-7 repeats the second form. The two disagree. | Owner decides the URL; Site implements | One agreed URL; the route folder produces exactly it; `/api/` being disallowed in `robots.txt` does not block Merchant Center's fetch (checked on the first fetch) |
| MC-G2 | The readiness doc (§3, "Not recommended") says Product JSON-LD "uses `description_en` on both locales (X5)". In the code, `lib/json-ld.ts` uses `description_ja` on `/ja` when it is non-empty; X5 was closed in Phase 4. The statement is stale. | Site (docs) | The sentence corrected, with the code reference, before Phase 5 starts |
| MC-G3 | External prerequisites are unanswered: account and verification state (X8), image-host access for Googlebot, the `free_shipping_threshold` attribute (spec page not read), and the `google_product_category` map against the live collection slugs. | Owner (account); Site (image host, mapping) | Each answered Y/N with a date; the map covers every live collection slug or names the exception |
| MC-G4 | Counts are stale: the doc cites 449 products and 120 sold (Phase 1). The live sitemap lists 453 English product URLs on 2026-10-31, and the sold count was not recomputed. | Site | Counts re-read from the Website API at implementation and dated |
| MC-G5 | OD-MC-9 (sold pieces sent as `out_of_stock`) depends on D3/X10. If sold products later leave the sitemap, the feed rule must be decided again. | Owner | The rule restated whenever D3 or X10 changes |
| MC-G6 | The doc says `item_type` is "not sent yet"; the Product type allows it, and the watch category mapping (201) depends on it. Whether production sends it is unverified. | Hub (data); Site (check) | Production Website API checked read-only and recorded |

### Separate finding: Hub-derived facts in the SEO documents are stale or unverified (HUB-S1)
The SEO documents cite Hub-derived facts dated 2026-10-28 to 2026-10-29 that have moved or were never re-read: product counts (449 against 453 live), the Kihei "3 pieces, 1 sold" and "156 diamond slugs" figures (Phase 6), the collection list (live: 12 collections, no `kihei`, no `diamonds`), and the Step 4 sample numbers. The Hub has also gained capabilities since 2026-10-30 that the Step 4 documents do not mention: a Japanese descriptions editor (Hub #680) and a "Write description (AI)" action in the product editor (Hub #686 and #687). **Risk, UNVERIFIED:** whether saving or generating a description can overwrite owner-approved Step 4 product text. Hub internals are not readable from this repository.
- **Owners:** Site re-reads what the public site and Website API show; Hub (Lovable) and Owner confirm Hub-internal behaviour.
- **Acceptance:** every cited Hub fact is either re-read and dated or tagged [U]; the Hub editor's effect on approved Step 4 text is assessed read-only before any product-description publication (R-23).

---

## 5. Batch ownership (one owner per item)

| Batch | Owns | State |
|---|---|---|
| **SEO foundation (this PR)** | R-06, R-15 (og:url, `fb:app_id`), the regression tests and rendered checks, this register, the delivery rule | READY FOR QA |
| Locale permanent redirects | R-10, R-11 | OWNER DECISION PENDING |
| Measurement design | R-04 | design only; needs approval |
| Performance | R-22 | owner scoping |
| Step 4 content | R-23, R-24 | owner-operated; Site verifies |
| Merchant Center | R-25, MC-G1..G6 | needs OD-MC and X8 |
| Commercial pages, Hub SEO fields, authority content | R-26 to R-32 | needs OD-P6 and editorial approval |
| Subdomain crawl policy | R-36 | owner decision; Hub / Firebase |
| External (GBP, backlinks) | R-33, R-34 | owner-led |
