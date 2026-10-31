# Search Console follow-up and first Performance export — 2026-10-31

**Retrieved:** 2026-10-31 11:07 JST. **Property:** Domain property `chajewelsjp.com` (`sc-domain:chajewelsjp.com`), opened through the company Google account (account details are deliberately not recorded here). **Method:** read-only. Performance was read in the Search Console UI and then exported with the report's own "Download CSV". Nothing was changed: no setting, no indexing request, no sitemap resubmission, no live URL test. No website code was touched.
**Follows:** [`SEARCH-CONSOLE-BASELINE-2026-10-30.md`](SEARCH-CONSOLE-BASELINE-2026-10-30.md), which stays unchanged as the first record.
**Headline:** Performance now shows its first rows, **one day only (2026-10-28), 5 impressions and 1 click**. That is an initial observation, not a performance result. **Page indexing is still "Processing data"** and no coverage numbers exist. **BUG-09 stays open.**

Evidence tags: **[X]** from the exported CSV files; **[UI]** read on screen only; **[L]** read from the repository or a public response on 2026-10-31.

## 1. Export inventory (originals are NOT in this repository)
The original zip and its extracted CSVs are stored in a dated folder on the owner's machine, outside the repository and outside GitHub. Nothing from that folder is committed. The complete file checksums are kept in a private evidence inventory in that same folder, not in this repository.

| File | Contents | Rows | Status |
|---|---|---|---|
| `Chart.csv` | Daily clicks, impressions, CTR, position | 1 (2026-10-28) | Exported |
| `Queries.csv` | Top queries | 2 | Exported |
| `Pages.csv` | Top pages | 4 | Exported |
| `Countries.csv` | Countries | 3 | Exported |
| `Devices.csv` | Devices | 2 | Exported |
| `Search appearance.csv` | Search appearance | header only | Exported (empty) |
| `Filters.csv` | Filters applied | 2 | Exported |
| Page indexing export | — | — | **NOT TAKEN** — the report is still "Processing data" (§4) |

Filters used (from `Filters.csv` [X]): Search type = Web (text-based); Date = Last 3 months. No page, query, country or device filter. The on-screen figures [UI] and the exported figures [X] agree on every value.
**Reporting range:** last 3 months as of 2026-10-31. **Latest date containing data:** 2026-10-28 (the only date in `Chart.csv`). The screen said "Last update: 4.5 hours ago" [UI]; that is Google's wording and is recorded as shown, not interpreted.

## 2. Performance figures [X]
| Scope | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|
| **Property total** (Chart.csv, 2026-10-28) | 1 | 5 | 20% | 3.4 |

| Query | Clicks | Impr. | Position |
|---|---|---|---|
| cha jewels japan | 0 | 1 | 4 |
| cha jewels | 0 | 1 | 5 |

| Page | Clicks | Impr. | Position |
|---|---|---|---|
| `https://www.chajewelsjp.com/` | 1 | 4 | 3.75 |
| `https://www.chajewelsjp.com/en` | 0 | 1 | 2 |
| `https://portal.chajewelsjp.com/` | 0 | 1 | 7 |
| `https://paymenthub.chajewelsjp.com/` | 0 | 1 | 8 |

| Country | Clicks | Impr. | Position |  | Device | Clicks | Impr. | Position |
|---|---|---|---|---|---|---|---|---|
| United States | 1 | 2 | 3 |  | Mobile | 1 | 4 | 3 |
| Japan | 0 | 2 | 3 |  | Desktop | 0 | 1 | 5 |
| Hong Kong | 0 | 1 | 5 |  |  |  |  |  |

## 3. What these numbers do and do not show
- **Disclosed queries are branded; undisclosed queries are unknown.** The two listed queries both contain the brand name. They account for 2 of the 5 impressions and none of the 1 click. The other 3 impressions and the click belong to queries Google did not disclose; nothing is known about them, and they are not assumed to be branded or non-brand.
- **No non-brand visibility is demonstrated by this sample.**
- **These are initial observations, not meaningful performance results.** Five impressions on one day cannot support a trend, a ranking claim or a comparison.
- **The 2026-10-28 data cannot evaluate later deployments.** It predates the 2026-10-29 releases (Step 2, Step 3a and its follow-up, OG-PRODUCT per the register), the 2026-10-29 sitemap submission, and Step 4. No effect of any of them can be read from it.
- **Property totals and page totals are kept separate.** The property total is 5 impressions; the four page rows add up to 7; the two query rows add up to 2; the country rows and the device rows each add up to 5. The country and device rows reproduce the property average position of 3.4 when weighted by impressions; the page rows do not (they weight to about 4.6). **This is an unexplained aggregation difference, not a confirmed defect, and the cause is not determined.** No correction is applied and neither number is adjusted to match the other.
- No indexed-page claim is made from Performance. Appearing for a query is not evidence that a given URL is indexed beyond the three priority URLs recorded on 2026-10-30.

## 4. Page indexing
Still **"Processing data, please check again in a day or so"** on the chart and on the "Why pages aren't indexed" table [UI, read once on 2026-10-31]. No total indexed, no total not indexed, no exclusion categories. Nothing is estimated. It was not re-probed. **Export it only after a later check shows populated data.** The 8-URL sample and the three priority URLs were not re-inspected in this pass; the plan stays "re-inspect in 7 and 14 days, do not request indexing" (`SEARCH-CONSOLE-BASELINE-2026-10-30.md` GSC-04/05).

## 5. Separate investigation: `portal.` and `paymenthub.` subdomains show in Search
Two other hosts of the Domain property each had 1 impression and 0 clicks on 2026-10-28 (§2). They are **not** part of the storefront. The observations below are **public crawlability observations** only, taken from the repository, DNS and the public responses to anonymous requests for the home page and `robots.txt`. They say nothing about what is behind sign-in: no authenticated route was visited, no login was attempted, and no customer record was read. **No action is taken or proposed here without the owner.**

| | `portal.chajewelsjp.com` | `paymenthub.chajewelsjp.com` |
|---|---|---|
| DNS [L] | CNAME `chajewelslayaway.web.app` | CNAME `cha-jewels-payment-hub.web.app` |
| Hosting [L] | Firebase Hosting (not Vercel, unlike `www.`) | Firebase Hosting (not Vercel) |
| Repository [L] | Hub repo `chajewels/la-tracking`: `.firebaserc` target `chajewelslayaway`, project `cha-jewels-la-tracking`, single-page app (`firebase.json` rewrites everything to `index.html`) | **Not identified.** It is not the `la-tracking` hosting target; ownership of the site `cha-jewels-payment-hub` is UNVERIFIED |
| Public response [L] | `/` 200, page title "Cha Jewels Hub — Customer Portal & Account Management"; no robots meta tag in the served HTML | `/` 200, page title "Cha Jewels Payment Hub"; no robots meta tag in the served HTML |
| `robots.txt` [L] | Present, allows all crawlers, **names `https://portal.chajewelsjp.com/sitemap.xml`** (the file is also in the Hub repo `public/`) | **None** (Firebase "Page Not Found" page) |
| Public crawl policy | Crawlers are allowed by `robots.txt`; a sitemap is advertised; no noindex in the served home page | No `robots.txt`; no noindex in the served home page |
| Website repo mentions [L] | Only fixture data (`portal_url`) | None |

**What is not known:** whether either host should be indexed; what the search results actually showed (the export has no query for them); whether any authenticated route is protected, indexed or exposed (not checked; this note implies neither exposure nor protection); who owns the `paymenthub` site's code. **Owner decision needed** (class: P2, investigate): whether these hosts should be left discoverable, given that hosts named for a customer portal and a payment hub appear in Google results. Any change (robots, noindex, authentication, DNS, Search Console removal) belongs to the Hub / Firebase workstream, not this repository. This note makes none.

## 6. Findings
| ID | Evidence | Class | Action | Owner approval |
|---|---|---|---|---|
| GSC-02 (update) | First Performance rows, 1 day, 5 impressions | PENDING → INITIAL OBSERVATION | Re-export on a later date for a real baseline; do not compare to releases | none |
| GSC-01 (unchanged) | Page indexing still processing | PENDING | Check again later; export when populated | none |
| GSC-08 | Unexplained aggregation difference: page rows add to 7 impressions, property total is 5 (not a confirmed defect) | OBSERVATION | Record only; revisit with a larger export | none |
| GSC-09 | `portal.` and `paymenthub.` impressions; public home pages crawlable, no noindex seen | P2, owner decision | Owner decides; Hub/Firebase workstream implements | **Required** |

No P0 or P1 finding. Nothing here justifies a website change.

## 7. Limits
Exports cover Web search type, last 3 months, one day of data. The Page indexing and Links reports were not exported. The search-appearance export is empty. No ranking, traffic, indexing or revenue improvement is claimed.
