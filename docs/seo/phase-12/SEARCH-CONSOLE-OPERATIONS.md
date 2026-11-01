# Phase 12 — Search Console operations: weekly and monthly workflow

**Status:** IMPLEMENTING (updated 2026-10-31). First reads: 2026-10-30 (UI only, `SEARCH-CONSOLE-BASELINE-2026-10-30.md`) and 2026-10-31 (first CSV export: one day of Performance data, initial observation only, `SEARCH-CONSOLE-BASELINE-2026-10-31.md`). Coverage (Page indexing) still processing; no weekly cycle with a comparable baseline has run yet. Raw exports are kept outside this repository.
**Date:** 2026-10-29 · **Plan:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` §19, §20, §29, PHASE 12 · **Findings:** X8 (account access unknown to Claude)

**The one rule:** *no metric is filled in without an export.* A report cell without a matching CSV row says `NO EXPORT`, never an estimate, never a number remembered from the UI.

---

## 1. Prerequisites (owner)

| Item | State |
|---|---|
| Search Console property for `www.chajewelsjp.com` (Domain property preferred; it covers `agreement.` and any future subdomain) | EXISTS (observed 2026-10-30): Domain property `chajewelsjp.com`, ownership verified, readable through the company Google account; the owner's primary Google account has no access. First read: `docs/seo/SEARCH-CONSOLE-BASELINE-2026-10-30.md` (UI-read, no exports; reports still processing) |
| Who has Owner/Full access; whether Claude Code is ever given a read-only export (CSV files dropped into a folder) | Owner decision OD-SC-1 |
| Property for the old domain `chajewelsjapan.com` | NOT NEEDED for redirects: owner decided 2026-10-31 to keep it as the live Page365 shop (no redirect) |
| Merchant Center account (Phase 5) and GBP (Phase 10) for the monthly review | UNKNOWN (X8) |
| Analytics (GA4 or the site's tracking — baseline §11 says "do not disturb") for commercial metrics | Browser tracking in code (verified 2026-10-31): Vercel Web Analytics custom events plus consent-gated Meta Pixel and Google Ads tags; no GA4 tag found. The Hub is authoritative for orders and payments. Consent-gated advertising tags receive purchase-labelled values after order, draft or plan creation; those events do not establish confirmed payment or realized revenue. Organic purchase/revenue attribution is not implemented. Whether any dashboard (Vercel, Meta, Google Ads) actually receives and displays these events is UNVERIFIED |

## 2. Weekly export (plan §19)

From Search Console → Performance → **Search results**, date range **last 28 days** (rolling; weekly comparison uses the "Compare" tab, previous 28 days), Search type **Web**:

| Export | Filter | File name convention |
|---|---|---|
| Queries | none | `YYYY-MM-DD-queries.csv` |
| Pages | none | `YYYY-MM-DD-pages.csv` |
| Countries | none | `YYYY-MM-DD-countries.csv` |
| Devices | none | `YYYY-MM-DD-devices.csv` |
| Queries, question subset | Query matches regex §4.1 | `YYYY-MM-DD-queries-questions.csv` |
| Queries, Filipino subset | Query matches regex §4.2 | `YYYY-MM-DD-queries-fil.csv` |
| Queries, branded subset | Query matches regex §4.3 | `YYYY-MM-DD-queries-brand.csv` |
| Pages, locale split | Page contains `/en/` · Page contains `/ja/` · Page not containing either (legacy bare URLs — should trend to zero after Phase 2E) | `YYYY-MM-DD-pages-en.csv`, `-ja.csv`, `-legacy.csv` |

Fields present in every export (Search Console's own columns): **Query/Page/Country/Device, Clicks, Impressions, CTR, Position** — the eight fields plan §19 asks for, spread over the four tables (Search Console does not export one combined row per query×page×country×device from the UI; that needs the API — see §7).

Store the CSVs outside the repository (they are business data) in a dated folder; the report (markdown) may live in `docs/seo/reports/` if the owner wants history in git. **Decision OD-SC-2.**

Additional weekly reads (no export needed, but record "checked, nothing new" or the issue): **Indexing → Pages** (new "Not indexed" reasons), **Experience → Core Web Vitals** (status), **Enhancements** (Product snippets, Merchant listings, FAQ, Breadcrumbs — counts of valid/invalid), **Security & Manual actions**.

## 3. Opportunity rules (plan §19, made operational)

| # | Signal (from the exports) | Threshold (first pass; tune after 8 weeks of data) | Action | Where the action lands |
|---|---|---|---|---|
| R1 | High impressions, low CTR | Impressions ≥ 200 / 28 d and CTR < 1% and Position ≤ 10 | Rewrite title/meta of the landing page (Hub field or `lib/page-meta.tsx` metadata, per page type) | Phase 6/7/8 content work; metadata change = low-risk PR |
| R2 | Position 5–20 | Position between 5 and 20 and Impressions ≥ 50 | Improve the page (content depth, FAQ block) + add 2–3 internal links from related pages | Content phase; internal-linking (plan §21) |
| R3 | Query exists, no dedicated page | A query cluster with Impressions ≥ 100 whose top landing page is the home page, a collection, or an unrelated page | Brief a landing page or post (Phase 6/7/8/9 briefs) — route changes need approval | Brief first, then approval |
| R4 | Strong page, falling clicks | Clicks down ≥ 30% vs previous 28 d with impressions stable or up | Refresh the page (dates, facts, images), check for SERP feature loss | Content refresh |
| R5 | Target term absent from the export | Any target term from the plan (§30) with no disclosed query row. **Absence is not zero:** the export lists disclosed rows only (anonymised queries and rows beyond the export limit are not in it), so the term's impressions are UNKNOWN | **Do not assume demand, or its lack.** Record; do not build for it | Report only |
| R6 | Legacy URL receiving impressions | `/products/<slug>` etc. without `/en|/ja`, on the canonical host `https://www.chajewelsjp.com` only (another host or scheme of the Domain property is reported as "other-host", never as a site page) | Check the URL's redirect target and the Pages report; after 8 weeks of exports, bring the observed trend to the 307→308 decision (OD-1) — no trend is assumed in advance | Phase 2E |
| R7 | Locale mismatch | `/ja/…` page ranking for an English query (or vice versa), Country split disagrees | Check hreflang on that pair; log for Phase 2 QA | `cha-i18n-seo` |
| R8 | Question query without an answer page | §4.1 regex hit, Impressions ≥ 30, landing page not a guide/FAQ/post | Create or extend an FAQ item (Hub FAQ) or a post | Hub content |
| R9 | Filipino-language query appears | §4.2 regex hit with Impressions > 0 | Evidence for Phase 9 expansion; map to a brief in `docs/seo/phase-9/FILIPINO-CONTENT-BRIEFS.md` | Phase 9 |
| R10 | Branded query growth | §4.3 subset impressions vs previous period | Report only (plan §29 "Authority") | Phase 11 tracking |

Every action goes into the status vocabulary (NOT STARTED → … → OBSERVED IN SEARCH CONSOLE). An "improve page" item is DEPLOYED when merged to `main`, and OBSERVED only when a later export shows it.

## 4. Regexes (RE2 syntax, Search Console "Custom (regex)" filter)

Search Console's regex matching is case-sensitive unless the pattern says otherwise; the `(?i)` prefix is RE2's case-insensitive flag. **Verify once in the UI** that `(?i)` is accepted (UNVERIFIED here).

### 4.1 Question queries (plan §20, extended with Japanese and Filipino question words)
```text
(?i)^(what|where|why|which|how|can|does|do|is|are|who|when|should)\b|^(ano|saan|paano|bakit|magkano|pwede|puwede|kailan|sino)\b|(とは|何|なに|どこ|どう|いくら|なぜ|方法)
```
English words anchored at the start (plan §20 "queries beginning with"); Japanese question markers anywhere, since Japanese queries end with them.

### 4.2 Filipino / Taglish queries
```text
(?i)\b(saan|paano|ano|magkano|bakit|pwede|puwede|tunay|peke|legit|hulugan|hulog|alahas|bili|bumili|makakabili|padala|pilipinas|pinoy|pinay|kabayan|para sa|mura|presyo)\b
```

### 4.3 Branded queries
```text
(?i)cha ?jewels|chajewels|チャジュエルズ|チャ ?ジュエルズ
```

### 4.4 Core territory (plan §30), for the R5 "absent from the export" check
```text
(?i)\b(kihei|喜平|k18|18k|750|layaway|preloved|hallmark|katsushika|tateishi)\b
```

## 5. Monthly review (plan PHASE 12 "Monthly")

| Area | Source | What to record |
|---|---|---|
| Technical health | Search Console Indexing → Pages; `scripts/check-seo-live.mjs https://www.chajewelsjp.com` run (read-only) | Pass/fail counts; new indexing reasons |
| Index coverage | Indexing → Pages, sitemap report (`/sitemap.xml` submitted?) | Discovered/indexed counts per sitemap |
| Content winners / losers | Pages export, compare 28 d vs previous | Top 10 gains / losses by clicks |
| Product indexing | Pages export filtered `/products/`; Enhancements → Product snippets / Merchant listings | Count of product URLs with impressions; valid/invalid items |
| Merchant Center health (Phase 5, once live) | Merchant Center Diagnostics | Active / disapproved / pending counts; top disapproval reasons |
| Rich results | Enhancements reports (Product, FAQ, Breadcrumb when Phase 4 adds it) | Valid / warning / error counts |
| Organic revenue / conversion | Vercel Web Analytics (events) and the Hub (orders); no organic-source join exists in code | Organic sessions, add-to-cart, checkout start, orders, layaway starts (plan §29) — only if the tool reports them |
| Backlink growth | Search Console Links export | Top linking sites count vs last month |
| Local (Phase 10, if a profile exists) | GBP Performance | Views, calls, website clicks — OBSERVED only |

## 6. Report template (markdown; copy per week)

```markdown
# SEO weekly report — <YYYY-MM-DD> (28 days ending <date>) vs previous 28 days

Exports used: <list of CSV file names, or "NO EXPORT — report not produced">
Property: <sc-domain:chajewelsjp.com | https://www.chajewelsjp.com/>  Prepared by: <name>

Comparison: <comparable (n days each) | NOT COMPARABLE — reason | NO PREVIOUS EXPORT>

## Totals
| Metric | Source | This period | Previous | Change |
|---|---|---|---|---|
| Clicks | property total (Chart export) | <n or NO EXPORT> | <n or NO PREVIOUS EXPORT> | <% only when comparable, else —> |
| Impressions | property total (Chart export) | | | |
| CTR | property total (Chart export) | | | |
| Avg position | property (Chart export) | | | <± positions> |
| Clicks | DISCLOSED query rows only (not a property total) | | | |
| Impressions | DISCLOSED query rows only (not a property total) | | | |

Undisclosed share: <impressions and clicks of the property total that are in no disclosed row>

## Locale split (Pages export; site pages = https://www.chajewelsjp.com only)
| Segment | Clicks | Impressions | Note |
|---|---|---|---|
| root | | | the root page (OD-3) |
| /en/ | | | |
| /ja/ | | | |
| legacy (no prefix) | | | R6 |
| other-host | | | other host or scheme of the Domain property — not a site page |
| unparseable | | | check the export |

## Opportunities (rules R1–R10)
| Rule | Query / page | Clicks | Impr. | CTR | Pos. | Proposed action | Status |
|---|---|---|---|---|---|---|---|
| R1 | <query> → <page> | | | | | rewrite title | NOT STARTED |

## Question queries (§4.1) — top 10 by impressions
| Query | Page | Impr. | Pos. | Has answer page? |
|---|---|---|---|---|

## Filipino queries (§4.2)
<rows, or "none in export">

## Branded (§4.3)
| Impressions this period | previous | change |

## Checked, no export needed
- Indexing → Pages: <new reasons or "nothing new">
- Enhancements: <counts or "nothing new">
- Security / manual actions: <none>
- Merchant Center (Phase 5): <N/A until live>

## Actions carried forward
| Item | Owner | Status (vocabulary) |
|---|---|---|

Nothing in this report is marked indexed, ranking or rich-result eligible except as the exports show.
```

## 7. Helper: `scripts/gsc-report.mjs` (WRITTEN 2026-11-01 under the master-plan completion authorization; corrected the same day after review)

**What it does beyond the description below (the corrections):** rejects malformed metrics and rows with the row number instead of coercing them to 0; refuses a folder with two files of one kind or mixed date prefixes; derives each folder's period from Chart.csv and prints period-over-period changes only when the two periods are known, equal in length and non-overlapping (and refuses the same folder twice or a later "previous"); classifies page URLs by host and scheme (only `https://www.chajewelsjp.com` is a site page; other hosts of the Domain property and unparseable values get their own rows); separates property totals (Chart export) from sums of disclosed query rows and flags the two as inconsistent when the rows exceed the total; records absent target terms as ABSENT, never as zero; prefills nothing that was not observed. Tests: `tests/gsc-report.test.mjs` (11) on synthetic fixtures `tests/fixtures/gsc/` (not observations). First real run: the next export (OD-SC-1); the header names it expects are the ones §10 marks UNVERIFIED, and it fails loudly if they differ.

*Original description (kept for the record):*

Purpose: turn a folder of Search Console CSV exports into the §6 report so no number is retyped by hand.

- **Input:** a directory path; the script looks for the §2 file names (`*-queries.csv`, `*-pages.csv`, `*-countries.csv`, `*-devices.csv`, optional `*-queries-questions.csv`, `*-queries-fil.csv`, `*-queries-brand.csv`, and the previous period's folder for comparisons). Column names are read from the header row as Search Console writes them (`Top queries` / `Top pages` / `Country` / `Device`, `Clicks`, `Impressions`, `CTR`, `Position`); the script fails loudly on an unknown header instead of guessing. CTR arrives as a percentage string ("1.23%"); position as a decimal.
- **Processing:** parse CSV (quoted fields, UTF-8 with BOM); normalise numbers; apply R1–R10 with the thresholds in §3 as constants at the top of the file; apply the §4 regexes (compiled once; mirrors the Search Console filters so the subset files are optional); classify pages by locale segment; compute period-over-period deltas only when both periods are present, otherwise print `NO PREVIOUS EXPORT`.
- **Output:** `report-YYYY-MM-DD.md` in the §6 shape, printed to stdout and optionally written next to the inputs. Every cell comes from a row; a missing file yields `NO EXPORT` in that section. No network calls, no Search Console API, no credentials.
- **Guards:** read-only; runs with `node scripts/gsc-report.mjs <dir>`; the inputs are downloaded files, so the script never executes anything from that directory and treats cell text as data (escape pipes in markdown). Unit tests on small fixture CSVs under `tests/` (parsing, each rule, regexes, locale classification, missing-file handling).
- **Out of scope for the first version:** the Search Console API (would give query×page×country×device in one table — a later step needing OAuth credentials, owner decision OD-SC-3), Merchant Center or analytics inputs, charts.
- **Approval:** originally deferred until the first export; written on 2026-11-01 under the owner's "complete all remaining master-plan requirements" authorization (PR #462). The helper reads files only; it changes nothing in Search Console.

## 8. Weekly cycle (plan PHASE 12 "Weekly")

```text
Mon   owner exports §2 CSVs  →  run/fill §6 report
Tue   triage R1–R10; pick ≤3 actions; open briefs or small PRs (metadata)
Wed-Thu  implement approved items (content in the Hub; code via develop)
Fri   add internal links for anything published; request indexing in Search Console
      only for pages that changed materially (URL Inspection → Request indexing)
Next Mon  compare; move statuses; never claim OBSERVED without the export
```

## 9. Owner decisions

| ID | Decision |
|---|---|
| OD-SC-1 | Who exports weekly and whether Claude Code receives the CSVs (read-only, outside the repo). |
| OD-SC-2 | Whether weekly reports (markdown, no customer data) are committed under `docs/seo/reports/` or kept outside git. |
| OD-SC-3 | Whether to pursue Search Console API access later (credentials, a Google Cloud project). |
| OD-SC-4 | Threshold values in §3 after the first 8 weeks. |

## 10. Documentation used

- `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` §19, §20, §29, §30, PHASE 12
- `docs/seo/SEO-IMPLEMENTATION-STATUS.md` (X8; Phase 0 export NOT STARTED; status vocabulary), `docs/seo/SEO-BASELINE.md` §11 (analytics: do not disturb), `scripts/check-seo-live.mjs` (existing read-only probe)
- Search Console UI column names and regex behaviour are from working knowledge, **UNVERIFIED** against a live export on this date; the helper is specified to read headers rather than assume them.

**UNVERIFIED:** Search Console property existence/access (X8); `(?i)` acceptance in the regex filter; exact export column names; the analytics tool and its events; Merchant Center/GBP availability for the monthly review.
