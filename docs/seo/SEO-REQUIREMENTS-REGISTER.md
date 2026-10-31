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

**R-06 404 and unknown-path metadata hygiene (finding X1).** Approval: batch authorized 2026-10-31. **Batch owner: the SEO foundation batch (this PR). Not part of R-10.** Owner: Site. Evidence: **READY FOR QA, after a first correction.** Production before: `/foo/bar` returned a real 404 with noindex yet emitted a canonical, three hreflang links and og:url naming itself [V 2026-10-31]. The first head of this PR (`94b0b75`) still did the same on `/products/x/y`, `/collections/x/y`, `/categories/x/y`, `/blog/x/y`, `/legal/missing` and `/legal/missing/deeper`, because it accepted every descendant of a public family (independent QA reproduced it). Fix: `<SeoLinks />` now describes a path only when it has the **exact shape of a real page route** (`routeShapeOf`/`seoLinkPlan`, `lib/seo-policy.ts`; the table is compared with the `page.tsx` files under `app/` by a unit test). The shared locale-family rules in `lib/locale.ts` are untouched, so routing and navigation are unchanged. **Covered by rendered checks (`FOUNDATION` rows):** unknown single-, two- and three-segment paths; malformed children and deeper descendants of every public family (products, collections, categories, blog, legal, jewelry-guide, shopping-guide, faq, about, loyalty, sale, wholesale, layaway) and family roots that are not pages (`/legal`, `/categories`); malformed children of private routes (`/cart/…`, `/search/…`, `/login/…`, `/account/…`, `/checkout/…`); `/en` and `/ja` forms of the main malformed shapes; missing resources (one real shape, nothing behind it) bare and localized; a language the sitemap does not list; `/ja/layaway`; `/en/cart`; an invalid locale. Known valid templates must return HTTP 200 in both languages. **Not covered:** every possible URL; signed-in pages; real-Hub data (the develop-preview gate in `SEO-QA-REPORT.md` §15 covers it). **Second class found while correcting (2026-10-31): the live DOM, not the raw HTML.** In a real browser a **missing resource with a real route shape** (a product, collection or category slug that does not exist) showed a canonical, three hreflang links and (bare form) og:url in the DOM although its raw HTML had none; `develop` does the same, and the first corrected head added og:url to the locale form. Search engines that run JavaScript read the DOM. Fixed by two rules: a locale page whose own metadata function returns no title (the resource does not exist) describes nothing (`localizedMeta`), and a bare dynamic public URL describes nothing while the legacy redirects are on (it only ever 404s or 307s; with `SEO_LEGACY_REDIRECTS=off` the rollback keeps its tags). The new `scripts/check-seo-dom.mjs` checks the live DOM in desktop and phone browser contexts for valid templates, every 404 shape, the 404 page's real UI, client-side navigation, and every console or page error. Both checkers (`check-seo-live.mjs` raw HTML, `check-seo-dom.mjs` live DOM) fail closed (the sitemap is validated; expected template families and both eligible languages are required; unavailable siblings and their hreflang exclusion are tested explicitly; an inventory of expected, checked, missing and skipped coverage is printed), separate the request origin from the public origin (`SEO_CHECK_PUBLIC_ORIGIN`), and send a preview credential only to the one exact origin named in `SEO_CHECK_BYPASS_ORIGIN`. Gap: none known; production confirmation after release. Acceptance: each covered shape is a real 404 with noindex and no canonical, hreflang or og:url in both the raw HTML and the live DOM, and every valid route keeps its output. Next: QA, then release.

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

**R-15 Sharing identity on the locale tree: `og:url` and `fb:app_id`.** Approval: owner request 2026-10-01 (`og:url`, the Facebook App); batch authorized 2026-10-31. Owner: Site. Evidence: **READY FOR QA.** Before: neither tag appeared on any non-product locale page, because `<SeoLinks />` emits nothing under a locale prefix (observed on every sampled EN template and `/ja` [V 2026-10-31], recorded in the register since 2026-10-30). Fix: `localizedMeta` adds `og:url` from the canonical; the root layout emits `fb:app_id` once from the approved existing id (`lib/og-meta.ts`); **restoration is included, with no new ID, no external setup and no configuration change.** The brand share image, including its content-hash URL, is preserved. Gap: none known. Acceptance: exactly one `og:url` equal to the canonical on every successful locale page, exactly one `fb:app_id`, the primary and the alternate `og:locale` correct, `og:image` and Twitter tags unchanged. Next: QA, release.

**R-16 Listing SEO (Step 2).** Approval: Step 2. Evidence: DEPLOYED (ItemList, hero OpenGraph). This batch adds only `og:url` to those pages.

**R-17 Structured data (Phase 4; plan §7, §8, §16).** Approval: Phase 4. Owner: Site. Evidence: DEPLOYED (PR #421); JewelryStore, Product, BreadcrumbList, FAQPage, BlogPosting; BUG-02 `sameAs` fix in #426. No shipping or returns markup by owner decision; the rating branch emits only when a genuine approved review exists. Gap: no approved product review yet. Acceptance: structured data reflects visible content and real Hub data. Next: none.

**R-18 Image SEO (plan §23).** Owner: Site + Hub. Evidence: PARTIAL. Alt text present on sampled images and the blog cover alt done (audit and Step 1); 906 image entries in the sitemap [V 2026-10-31]. Gap: the Hub image-metadata part (alt, captions from the Hub) has no recorded completion evidence. Acceptance: image alt comes from Hub data where it exists, never invented. Next: owner decision on Hub image fields (with R-26).

**R-19 Video schema and content (P3).** Approval: none. Owner: Site + Hub. Evidence: videos already exist in the product: the home page hero video, the About page logo video, an artisan tile video, and the product-gallery video (`video_url`, `video_poster_url` from the Hub) [V 2026-10-31, code]; Search Console reported no indexed video on 2026-10-30 [V, UI]. **Eligibility for video markup or video indexing is UNVERIFIED until each existing video is assessed** (is it the primary content of a crawlable page, with a thumbnail, a stable URL and a duration, or a muted decorative loop; where is it hosted; can Google fetch it). No tracker row existed before this register. Acceptance: an assessment per video, dated; no `VideoObject` unless it reflects a real, visible, eligible video. Next: assessment only.

**R-20 Internal linking and crawlable navigation (Step 1(a); plan §21).** Evidence: DEPLOYED, production-verified (PR #429 to #430); five categories had weak inbound links in the audit. Gap: reverse linking and cluster links belong to R-26 to R-28. Acceptance: category and company links in the initial HTML. Next: with R-26.

### Performance and mobile UX
**R-21 Step 3a (Japanese heading font after load).** Evidence: DEPLOYED (#436, #439); no production gain confirmed. Gap: mobile numbers not re-measured since. Acceptance: measured, comparable runs before any claim. Next: none.

**R-22 Steps 3b and 3c (large listings; root-layout rendering and caching).** Approval: none. Owner: Owner scopes; Site implements. Evidence: AUDITED (`PERF-STEP3-FINDINGS.md`, high risk). Gap: no scope. **Gate: owner scoping and a measured need (field data when it exists); no calendar date.** Acceptance: matched before/after mobile runs; cart, account, Hub freshness and order/payment boundaries unaffected. Next: owner scoping.

### Hub content
**R-23 Step 4 Hub-managed content (plan §14; `STEP-4-*`).** Approval: OD-S4-2..10 recorded (2026-10-30). Owner: Owner edits in the Hub; Site verifies. Evidence: AUDITED — OWNER APPROVAL PENDING. [V 2026-10-31] the six listing records (four collections, two categories; EN and JA) show the previous text on both languages, with no drift; none published. Gap: conditional items (8C100 wording, OD-S4-7 preservation, OD-S4-9 spelling, ten-product pilot) need evidence; **Hub-side risk HUB-S1 (section 4)**. Acceptance: checklist §8. Next: owner publishes; Site verifies on the owner's word.

**R-24 BUG-03 article wording.** Out of SEO scope (PR #450). Owner: Owner (Hub edit). Evidence: Option A decided; not yet applied [V 2026-10-31]. The approved footer clarifier is on every page and is not part of the article body. Acceptance (content task): both language bodies verified live without the four phrases.

### Commercial and authority
**R-25 Merchant Center (Phase 5; plan §15).** Approval: none; OD-MC-1..10. Owner: Owner (account), Site (feed route), Hub (data). Evidence: AUDITED; no feed route exists. Gap: see section 4 (MC-G1 to MC-G13, each with an owner and acceptance criteria). Acceptance: per `MERCHANT-CENTER-READINESS.md` §7 (monitoring) and §9 (implementation outline). Next: owner answers X8 and OD-MC.

**R-26 Commercial landing pages and Hub SEO fields (Phase 6; plan §14, §22, §30).** Approval: none; OD-P6-1..9. Owner: Owner decides; Hub implements the fields; Site renders. Evidence: AUDITED, no route created, Hub SEO fields a contract draft. Gap: no `kihei` or `diamonds` collection in the Hub (live: 12 collections [V 2026-10-31]). Acceptance: no invented collections; approved Hub fields. Next: owner decisions.

**R-27 Kihei authority (Phase 7).** AUDITED, draft only; route `/en/guides/kihei` needs the route-family approval (OD-P6-5) and editorial approval. **R-28 K18 authority (Phase 8):** same gates; `/en/guides/k18-gold-japan`. Wording rule X9 applies.

**R-29 Filipino search (Phase 9; plan §13).** Approval: none. Owner: Owner decides; Site/Hub publish. Evidence: AUDITED, briefs and one draft (`phase-9/FILIPINO-CONTENT-BRIEFS.md`). **Options kept open, none chosen:** (a) the **Taglish blog option**, recommended in the Phase 9 document: each brief published as a Hub blog post at `/en/blog/<slug>`, written in Taglish in the English columns with the Japanese columns left empty so the post is English-site-only, **no route change**; (b) a Filipino locale or `/fil/` route, **not proposed**, which is Phase-2-class and needs owner approval under the route-change rule. **Evidence-based research options (plan §13 procedure), none run:** Search Console Filipino/Tagalog queries; Google autocomplete and related searches; build 5 to 10 pages; measure impressions and clicks; expand only if demand appears. Gap: `description_tl` exists in the Product type but is rendered nowhere; no demand evidence yet. Acceptance: no machine-generated translation published; wording rules X9 apply in Taglish. Next: owner chooses the option after evidence.

**R-30 Jewelry and shopping guides (plan §9).** Evidence: the guides exist and are in the sitemap [V 2026-10-31]. Gap: no tracker row existed before this register; no recorded review against §9. Acceptance: guide copy follows the terminology rules. Next: review with R-27/R-28.

**R-31 Authenticity and trust content (plan §24).** Gap: no tracker row existed; covered in part by the approved origin clarifier (on every page via the Hub footer tagline) and the About/Why pages. Acceptance: trust claims match evidence; no fabricated reviews or ratings.

**R-32 Question-query strategy and content quality rule (plan §20, §25).** A method, not a deliverable. Gap: no tracker row existed. **Evidence-based research options kept open (all from the plan and its phase documents):** the Search Console question-query regex (queries beginning what, where, why, which, how, can, does, is; plan §20), a Search Console query export for the nine themes over 16 months (OD-P6-8), and Google autocomplete and related searches (plan §13). Each is recorded with its date and limits. Acceptance: content briefs cite a query source. Next: choose sources when Search Console query data exists (R-03); no content waits on a calendar date.

**R-33 Google Business Profile (Phase 10).** AUDITED; eligibility OD-GBP-1; profile state [U]. Owner: Owner / External. **R-34 Authority and backlinks (Phase 11):** documentation only; OD-AUTH-1..3 (OD-AUTH-4 withdrawn by PR #451).

**R-35 Old domain `chajewelsjapan.com` (plan §18).** CLOSED — owner decision KEEP, no redirect (PR #451). Master Plan §18 is superseded. Nothing to implement.

**R-36 Public subdomains `portal.` and `paymenthub.` (GSC-09).** Approval: none. Owner: Owner decides; Hub / Firebase implements (not this repository). Evidence: public crawlability observations only [V 2026-10-31], recorded in `SEARCH-CONSOLE-BASELINE-2026-10-31.md` §5. Gap: policy undecided; `paymenthub.` code owner not identified; nothing known about authenticated routes. Acceptance: an owner-defined policy, verified with public requests only. Next: owner decision.

**R-37 Rollback mode: duplicate `og:url` on a bare product page (pre-existing, rollback-only).** Found while covering the `SEO_LEGACY_REDIRECTS` switch (2026-10-31). With the switch `off`, a bare `/products/<slug>` renders again and carries TWO `og:url` values: the bare URL from `<SeoLinks />` and the locale URL from the product OpenGraph block added by OG-PRODUCT (#441). It is the same on untouched `develop`; the default mode (redirects on) never renders a bare product page, so production is not affected. Owner: Site. Verification: `scripts/check-seo-rollback.mjs` against a server started with the switch off (the known pattern is reported DEFERRED, any other pattern fails). Acceptance: in rollback mode a bare product page emits exactly one `og:url`, equal to its canonical, with the locale pages and the product block unchanged (for example by omitting the block's `url` when the route is not a locale route). Not fixed here: it is outside this batch and OG-PRODUCT is closed; it should ride with the next batch that touches product metadata or with the locale permanent-redirect phase (R-10). Also recorded for rollback mode: a bare dynamic URL for a resource that does not exist is a 404 that still carries the legacy tags.

---

## 4. Gaps recorded with owners and acceptance criteria

### Merchant Center proposal gaps (R-25)
Owners: *Owner* answers decisions and account questions; *Site* (Claude Code) writes the feed route, builder and tests in this repository when approved; *Hub* (Lovable) owns anything in the Hub backend. Nothing here is implemented; the feed does not exist.

| ID | Gap | Owner | Acceptance |
|---|---|---|---|
| MC-G1 | The readiness doc names the feed URL `/api/merchant-feed.xml` but plans the file `app/api/merchant-feed/route.ts`, which serves `/api/merchant-feed`. OD-MC-7 repeats the second form. The two disagree. | Owner decides the URL; Site implements | One agreed URL; the route folder produces exactly it; `/api/` being disallowed in `robots.txt` does not block Merchant Center's fetch (checked on the first fetch) |
| MC-G2 | The readiness doc (§3, "Not recommended") says Product JSON-LD "uses `description_en` on both locales (X5)". In the code, `lib/json-ld.ts` uses `description_ja` on `/ja` when it is non-empty; X5 was closed in Phase 4. The statement is stale. | Site (docs) | The sentence corrected, with the code reference, before Phase 5 starts |
| MC-G3 | External prerequisites are unanswered: account and verification state (X8), image-host access for Googlebot, the `free_shipping_threshold` attribute (spec page not read), and the `google_product_category` map against the live collection slugs. | Owner (account); Site (image host, mapping) | Each answered Y/N with a date; the map covers every live collection slug or names the exception |
| MC-G4 | Counts are stale: the doc cites 449 products and 120 sold (Phase 1). The live sitemap lists 453 English product URLs on 2026-10-31, and the sold count was not recomputed. | Site | Counts re-read from the Website API at implementation and dated |
| MC-G5 | OD-MC-9 (sold pieces sent as `out_of_stock`) depends on D3/X10. If sold products later leave the sitemap, the feed rule must be decided again. | Owner | The rule restated whenever D3 or X10 changes |
| MC-G6 | The doc says `item_type` is "not sent yet"; the Product type allows it, and the watch category mapping (201) depends on it. Whether production sends it is unverified. | Hub (data); Site (check) | Production Website API checked read-only and recorded |
| MC-G7 | **Identifier evidence.** The proposal sends `identifier_exists=no` on every item because no GTIN or MPN exists in the Website API. That is truthful only with evidence per class of piece: unique or hallmarked pieces plausibly have none, but branded pieces (for example the Louis Vuitton Mosaic rings) may carry a manufacturer model or part number that Google expects. No evidence is recorded either way. | Owner (evidence of what identifiers exist); Site (rule in the builder) | A written rule per piece class (unique, hallmarked, branded) saying which identifiers exist and where they come from; `identifier_exists=no` only where that rule says none exist; nothing invented |
| MC-G8 | **Variant, price and landing-page consistency.** The proposal sends one item per variant with `item_group_id`, all linking to the product URL. The product page renders only the **first** variant (`product_variants[0]`, `app/products/[slug]/page.tsx`), so the price, size and stone of every other variant's item would disagree with its landing page, which Merchant Center treats as a mismatch. | Owner decides (one item per product vs per variant, or a variant-selectable page); Site implements | Each feed item's price, availability and key attributes equal what its landing URL shows; a test fails when they differ; the decision is recorded before any code |
| MC-G9 | **Freshness.** Storefront catalog reads are cached for 60 seconds and the Hub busts them on change, but Merchant Center fetches on its own schedule (daily proposed), so a price or stock change between fetches shows a stale item and a possible mismatch. The proposal states no freshness target or reaction to a sold piece. | Owner (target); Site (cache and schedule) | A stated maximum age; sold pieces become `out_of_stock` within it; Diagnostics reviewed after the first fetches |
| MC-G10 | **Full-catalog retrieval.** The proposed read is a single `allProducts(5000)` call (`GET /catalog/products?limit=5000`, `lib/hub-api.ts`), with no paging and no check that the answer is complete. If the Hub or the limit truncates the answer, items vanish silently. | Site (guard and test); Hub (confirm any server-side cap) | The feed item count is reconciled with the Hub's product count (the sitemap lists 453 English product URLs on 2026-10-31); a truncated or short answer fails the build of the feed rather than shipping a partial one |
| MC-G11 | **Fetch failures.** Other cached Hub reads are written to tolerate failure (an empty menu is acceptable). A feed must not: an empty or partial feed delists products. The proposal does not say what the route returns when the Hub is slow, down or returns an error. | Site | On any Hub failure the route returns a non-success status or the last good feed, never an empty or partial 200; the failure and the empty-answer cases are unit-tested with a mocked Hub; an empty feed is never cached |
| MC-G12 | **Feed URL and crawl handling.** `robots.txt` disallows `/api` (live, 2026-10-31), and the proposed feed lives under `/api/`. Whether Google's fetcher honours that for a feed file is unverified; the image host's crawl policy is also unverified (MC-G3). MC-G1's naming choice decides the exact URL. | Owner (URL, MC-G1); Site (robots, headers) | The first Merchant Center fetch succeeds with `/api` disallowed, or the feed is moved or allow-listed by an owner-approved, tested change; the feed URL and robots behaviour recorded with a date |
| MC-G13 | **Published shipping and returns agreement.** Merchant Center needs shipping and returns settings, but the site publishes them in prose (`/shopping-guide`: Japan ¥800 under ¥8,000 of pieces, free from ¥8,000; `/legal/returns`) and, by owner decision, emits no shipping or returns structured data. Anything entered in Merchant Center must equal the published pages (rule 11: nothing fabricated). Outside-Japan rates are not published. | Owner (settings and any change to published terms); Site (a check that page text and settings agree) | Merchant Center shipping and returns equal the published text, line by line, recorded with a date; no region is configured that the site does not publish |

### Separate Hub findings (R-23, R-25)
**HUB-S1 — Hub-derived facts cited in the SEO documents are stale or unverified.** The SEO documents cite Hub-derived facts dated 2026-10-28 to 2026-10-29 that have moved or were never re-read: product counts (449 against 453 live), the Kihei "3 pieces, 1 sold" and "156 diamond slugs" figures (Phase 6), the collection list (live: 12 collections, no `kihei`, no `diamonds`), and the Step 4 sample numbers. Hub internals are not readable from this repository.
- **Owners:** Site re-reads what the public site and Website API show; Hub (Lovable) and Owner confirm Hub-internal facts.
- **Acceptance:** every cited Hub fact is either re-read and dated or tagged [U].

**HUB-S2 — "Write description (AI)" checks session and product identity, not complete input or photo staleness.** *(Replaces the earlier speculative "may overwrite approved text" note, which the source disproves.)* Read from Hub `main` on 2026-10-31 (`src/components/website/ai-styling.ts`, `ai-styling-client.ts`, `ProductDialog.tsx`; Hub #686 and #687):
- **What the Hub does correctly [V]:** an accepted suggestion is placed ABOVE the existing English description, which is never changed; the Japanese description is never touched; nothing is saved until the normal Save; a business-rule check rejects forbidden wording (layaway, a made-in-country claim, country-named gold, authenticity claims, prices, invented numbers) before staff see the text; a suggestion is discarded when the editor **session** or the **product id** differs (`stylingStillApplies`).
- **The gap [V]:** the request is built from the product name, weight, metals, brand (Branded only), condition, sizes, stones, the English description and the **first photo** (`stylingProduct`, `requestStyling`). Nothing compares those inputs, or the first photo, with their state when the suggestion is accepted. If staff change the name, stones, English text or the first photo while the request is in flight, a suggestion about the old state can be accepted for the same product and session.
- **SEO relevance:** accepted text is published to the product page on Save, so a stale description could contradict the product's current facts. It cannot silently replace owner-approved English.
- **Owners:** *Site (Claude Code)* — source development and tests (the Hub is read-only from this repository; the change is a Hub-repository task, not made here); *Hub (Lovable)* — the authorized integrated-backend deployment; *Owner* — approves the change and the deployment.
- **Acceptance:** a suggestion is discarded, or clearly flagged and not addable, when any input sent (name, weight, metals, brand, condition, sizes, stones, English description) or the first photo (URL and content) differs from the request; a test per input and one for the photo; existing English still preserved above; Japanese still untouched; still no auto-save; deployed only through the authorized step.
- **Not done here:** no Hub code, deployment or write.

---

## 5. Batch ownership (one owner per item)

| Batch | Owns | State |
|---|---|---|
| **SEO foundation (this PR)** | R-06, R-15 (og:url, `fb:app_id`), the regression tests and rendered checks, this register, the delivery rule | READY FOR QA |
| Locale permanent redirects | R-10, R-11 | OWNER DECISION PENDING |
| Measurement design | R-04 | design only; needs approval |
| Performance | R-22 | owner scoping |
| Step 4 content | R-23, R-24 | owner-operated; Site verifies |
| Merchant Center | R-25, MC-G1 to MC-G13 | needs OD-MC and X8 |
| Commercial pages, Hub SEO fields, authority content | R-26 to R-32 | needs OD-P6 and editorial approval |
| Subdomain crawl policy | R-36 | owner decision; Hub / Firebase |
| External (GBP, backlinks) | R-33, R-34 | owner-led |
