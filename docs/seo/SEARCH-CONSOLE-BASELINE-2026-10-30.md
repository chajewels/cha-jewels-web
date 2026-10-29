# Search Console baseline and indexing audit — 2026-10-30

**Audit date:** 2026-10-30, about 00:55–01:45 JST. **Property:** Domain property `chajewelsjp.com` (`sc-domain:chajewelsjp.com`). **Method:** read-only, through the owner's signed-in Chrome; values were **read from Search Console's own screens** (no CSV export was downloaded, so every figure below is "UI-read, no export" under the rule in `docs/seo/phase-12/SEARCH-CONSOLE-OPERATIONS.md`). No Search Console setting was changed and **no indexing was requested** (the "Request indexing" and "Test live URL" buttons were not used). No website code was touched.
**Headline:** the property is verified and the sitemap is read, but Google's **Page indexing and Performance reports are still "Processing data"**, so there is **no indexed/not-indexed count, no exclusion breakdown and NO PERFORMANCE BASELINE AVAILABLE YET.** Only URL-level inspection gives data today, and it shows the three priority URLs indexed and the sampled deeper URLs not yet crawled. **BUG-09 stays open.**

## 1. Access and property

| Item | Observed |
|---|---|
| Account first signed in to this Chrome (the owner's primary Google account) | opens Search Console with **no properties** ("No matching property"; the domain property shows "you don't have access"). It cannot read this property |
| Account used (owner's choice: another signed-in account) | the company account (`sales@chajewelsjp.com`, "Cha Jewels Co., Ltd."), second signed-in account |
| Property | `chajewelsjp.com`, Domain property; opens normally under the company account |
| Settings → Ownership verification | **"You are a verified owner"** |
| Settings → Users and permissions | lists "Cha Jewels Co., Ltd." |
| Settings → Crawling | robots.txt: "No robots.txt file"; Crawl stats: "No data available yet" (see GSC-06) |

## 2. Sitemap (Sitemaps report, UI-read)
`https://www.chajewelsjp.com/sitemap.xml` — type Sitemap, **submitted 29 Oct 2026, last read 29 Oct 2026, status Success, discovered pages 976, discovered videos 0.** Only one sitemap is submitted. **Discovered is not indexed.**
Live sitemap now (fetched 2026-10-30): HTTP 200, `application/xml`, 337,609 bytes, **976 distinct URLs** — the same number Google reports. 488 English + 487 Japanese + the bare `/`; products 453 + 453, collections 12 + 12, categories 5 + 5, blog articles 1 + 1 (and a blog index each), 34 other pages (including `/en/layaway`, English only). 906 `<image:image>` entries (products); only 8 `<lastmod>` entries (by design: product `lastmod` was removed in SEO Step 1 because the Hub's `updated_at` does not track price/stock/media). No `xhtml:link` alternates in the sitemap (hreflang is in each page's head, Phase 2D decision OD-12).

## 3. Page indexing report
**"Processing data, please check again in a day or so"** on both the indexed/not-indexed chart and the "Why pages aren't indexed" table. **Total indexed: not available. Total not indexed: not available. Exclusion categories (crawled-not-indexed, discovered-not-indexed, duplicates, alternates, redirects, 404, noindex, robots-blocked, 5xx): none reported — no counts exist yet.** The Overview page says the same for Indexing. Nothing is estimated here, and no URL is classified as a defect from this report.

## 4. Priority URL inspection (Google's **stored** status; live testing not used)

| URL | Stored status | Sitemap / referring page | Last crawl | Crawl / index allowed | User-declared canonical | Google-selected canonical |
|---|---|---|---|---|---|---|
| `https://www.chajewelsjp.com/en` | **URL is on Google; Page is indexed** | `sitemap.xml` / `/ja` | 29 Oct 2026 22:05:52, Googlebot smartphone, fetch Successful | Yes / Yes | `https://www.chajewelsjp.com/en` | Inspected URL (same) |
| `https://www.chajewelsjp.com/ja` | **URL is on Google; Page is indexed** | sitemap field shows "Temporary processing error" / none detected | 29 Oct 2026 21:47:58, Googlebot smartphone, fetch Successful | Yes / Yes | `https://www.chajewelsjp.com/ja` | Inspected URL (same) |
| `https://www.chajewelsjp.com/en/layaway` | **URL is on Google; Page is indexed** | `sitemap.xml` / none detected | 29 Oct 2026 22:03:16, Googlebot smartphone, fetch Successful | Yes / Yes | `https://www.chajewelsjp.com/en/layaway` | Inspected URL (same) |

All three were requested for indexing by the owner on 29 Oct and crawled minutes before the inspection data shows; they are **not representative of the rest of the site.** Live fetch of the same URLs on 2026-10-30 (our own request, not Google data): HTTP 200, one self-referencing canonical, no `robots` meta. HTTPS: "Page is served over HTTPS" on each. Video indexing: no video indexed.

## 5. Representative sample (stored status; **no indexing was requested for any of them**)
Sampled from the live sitemap: one matched English/Japanese pair each of a product (R2715), a collection (Rings), a category (Fine Jewelry) and the only blog article.

| URL | Stored status | Discovery | Last crawl / canonicals |
|---|---|---|---|
| `/en/products/r2715-ring-k18wg-12-80g-diamond-2-50ct-sz-15-5-preloved` | Not indexed: **Discovered – currently not indexed** | `sitemap.xml`; no referring page | N/A (never crawled); canonicals N/A |
| `/ja/products/r2715-ring-k18wg-12-80g-diamond-2-50ct-sz-15-5-preloved` | Not indexed: **URL is unknown to Google** | "No referring sitemaps detected"; no referring page | N/A; N/A |
| `/en/collections/rings` | Not indexed: Discovered – currently not indexed | `sitemap.xml`; none | N/A; N/A |
| `/ja/collections/rings` | Not indexed: Discovered – currently not indexed | `sitemap.xml`; none | N/A; N/A |
| `/en/categories/fine-jewelry` | Not indexed: **URL is unknown to Google** | "No referring sitemaps detected"; none | N/A; N/A |
| `/ja/categories/fine-jewelry` | Not indexed: Discovered – currently not indexed | `sitemap.xml`; none | N/A; N/A |
| `/en/blog/why-cha-jewels-care-behind-every-piece` | Not indexed: Discovered – currently not indexed | `sitemap.xml` (also as referring page) | N/A; N/A |
| `/ja/blog/why-cha-jewels-care-behind-every-piece` | Not indexed: Discovered – currently not indexed | `sitemap.xml` (also as referring page) | N/A; N/A |

Result: 6 of 8 "Discovered – currently not indexed", 2 of 8 "URL is unknown to Google"; none has been crawled, so Google has no canonical, language-alternate or restriction data for them yet. Our own live checks of the same kind of pages (not Google data): one self canonical, three hreflang entries, no `noindex`, HTTP 200. A successful sitemap read or a live test is not evidence of indexing and is not used as such.

## 6. Search performance
Performance → Search results, Web, last 3 months: **"Processing data, please check again in a day or so" / "No data"; "Last update: 4.5 hours ago".** The Overview page says the same. **NO PERFORMANCE BASELINE AVAILABLE YET.** No clicks, impressions, CTR, position, queries, pages, country or device figures exist to record, and none is estimated.

## 7. Sitemap and crawl consistency (our fetches, 2026-10-30)
- Sitemap and Google agree on the count (976 listed, 976 discovered).
- All 70 non-product sitemap URLs plus 31 products spread through the product list (101 fetched, including `/`): every one HTTP 200, exactly one self-referencing canonical, no `noindex`. The other 875 product URLs were not fetched in this audit.
- No sitemap URL in the checked set returns 404 or redirects. `/ja/layaway` returns 404 on purpose and is not in the sitemap.
- `robots.txt`: HTTP 200, `text/plain`, 146 bytes, disallows `/account`, `/checkout`, `/api`, `/review/` and names the sitemap. The bare domain `chajewelsjp.com` answers 308 to `https://www.chajewelsjp.com/` for `/`, `/robots.txt` and `/sitemap.xml`.
- Differences between sitemap discovery and Google's reports: the sitemap lists every URL, while per-URL Google status ranges from "indexed" (3 requested) to "discovered" (6 sampled) to "unknown" (2 sampled).

## 8. Findings

| ID | Evidence | Affected | Google-reported | Expected? | Impact | Confidence | Class | Recommended action | Owner approval | Monitor or intervene |
|---|---|---|---|---|---|---|---|---|---|---|
| GSC-01 | Pages report, Overview | whole site | "Processing data" | Yes (young property) | None yet | High | PENDING | Re-read in a few days; record counts and categories when they appear | none | Monitor |
| GSC-02 | Performance report | whole site | "No data" | Yes | None yet | High | PENDING | Take the first baseline when data appears; export the CSV set per `phase-12` | none | Monitor |
| GSC-03 | URL inspection | `/en`, `/ja`, `/en/layaway` | Indexed; Google canonical = declared | Yes (indexing was requested) | Positive; not representative | High | EXPECTED | None | none | Monitor |
| GSC-04 | URL inspection | 6 sampled product/collection/category/blog URLs | Discovered – currently not indexed | Yes for a sitemap read one day earlier | Possible slow indexing of the catalogue | Medium | P2 | None now. Do **not** request indexing. Re-inspect the same 8 URLs in 7 and 14 days | none | Monitor |
| GSC-05 | URL inspection | `/ja/products/r2715…`, `/en/categories/fine-jewelry` (and `/ja`'s sitemap field) | URL unknown to Google / no referring sitemap / "Temporary processing error" | Probably (per-URL sitemap association still processing) but unproven | If it persisted, those pages would not be found through the sitemap | Low | P2 | Re-inspect in 7 and 14 days; only if still "unknown" while the Pages report is populated, then check sitemap fetch details and resubmit as an owner decision | Owner decides any resubmission | Monitor |
| GSC-06 | Settings → Crawling | robots.txt report | "No robots.txt file", crawl stats "No data available yet" | Probably (no crawl data yet) | None known: live robots.txt is 200 and permits crawling | Medium | P2 | Re-check the robots.txt report once crawl stats exist | none | Monitor |
| GSC-07 | Live checks | `/ja/layaway` | not in sitemap | Yes (no Japanese layaway) | None | High | EXPECTED | None | none | — |

**No P0 and no P1 finding.** Nothing here justifies a website change: the data is a day old.

## 9. Limits and evidence gaps
- Page indexing and Performance reports have no data yet; no indexed count exists and none is estimated.
- Exports (CSV) were not downloaded: values are UI-read. Exports should be taken when data appears.
- The sample is 8 URLs plus the 3 priority URLs, not the 976. Sitemap fetch checks covered 101 URLs.
- Google's per-URL status can lag the actual state; "Test live URL" was deliberately not used.
- The owner's primary Google account cannot see the property; Claude can read it only through the company account (owner decision OD-SC-1 in the operations doc: whether to add a read-only user or use exports instead).
- No ranking, traffic or indexing improvement is claimed.
