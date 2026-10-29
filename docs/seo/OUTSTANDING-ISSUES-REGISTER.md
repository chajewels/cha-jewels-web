# Outstanding issues register (2026-10-29)

Five distinct workstreams that are **open**, tracked here so none is lost or marked done early. Status vocabulary is the SEO governance one (NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE) plus OWNER APPROVAL PENDING, LIVE and CONFIRMED DEFECT. Nothing below is completed. Each item says what evidence exists, what is owner-reported rather than observed, and what "done" means.

| # | Item | Repository / workstream | Status |
|---|---|---|---|
| 1 | BUG-03 article wording | Hub article content (website repo holds the proposal) | OWNER APPROVAL PENDING |
| 2 | HUB-CATALOG catalog delete of unused products | Hub repository `chajewels/la-tracking` | LIVE — FIRST REAL DELETE PENDING |
| 3 | BUG-09 Search Console | Google Search Console (owner account) | PROPERTY VERIFIED (owner-reported); INDEXING AND BASELINE PENDING |
| 4 | BUG-06 `/gold-guide` redirect chain | Website repository, routing | OPEN — deferred until owner-approved redirect work |
| 5 | OG-PRODUCT product-page sharing metadata | Website repository, metadata | CONFIRMED PRODUCTION METADATA DEFECT — CODE FIX REQUIRED |

## 1. BUG-03 — article wording A/B
- **Current status:** OPEN — owner A/B article wording decision pending (confirmed defect). Nothing has been edited.
- **Repository / workstream:** content lives in the Hub (Website → Content, `body_en` / `body_ja` of the article `why-cha-jewels-care-behind-every-piece`). The proposal lives in this repository.
- **Reference:** `docs/seo/SEO-DEFECTS-2026-10-29.md` §BUG-03 (four sentences, two options).
- **Existing evidence:** the live article was fetched on 2026-10-29 and carries four sentences with origin wording outside the approved surfaces (`origin-badge.tsx` for a piece whose Hub `origin === "JAPAN"`, or the exact approved clarifier). Option A removes the origin word; Option B replaces the sentence with the approved clarifier. `check:terms` does not scan Hub bodies.
- **Remaining action:** owner chooses A or B (per sentence if desired); the owner edits the two Hub fields.
- **Owner approval:** required. Claude must not edit the published text.
- **Definition of done:** the owner has approved an option; the live EN and JA article bodies were re-fetched afterwards and contain none of the four sentences; the result is recorded in the defects file with the date.

## 2. HUB-CATALOG — catalog delete of unused products
- **Current status:** LIVE — FIRST REAL DELETE PENDING. The function is deployed; no product has been deleted yet. (Corrected 2026-10-29: the first version of this entry said "live migration and deletion behaviour verification pending", which the owner's confirmation below supersedes.)
- **Repository / workstream:** Hub, `chajewels/la-tracking` (Page365 inventory follow and catalog delete). Not a website repository change.
- **Evidence, kept in three separate classes:**
  1. **GitHub merge evidence (observed by Claude through the read-only GitHub API, 2026-10-29):**
     - #670 `feat/page365-follow-and-delete` → Hub `develop`, merged 05:26:12Z (merge `05c55a77e`): migration `20270220100000_page365_follow_and_catalog_delete.sql`, `page365-inventory-fetch` function change, local-test SQL.
     - #671 release `develop` → Hub `main`, merged 05:26:19Z (`0da2a1f24`).
     - #672 `fix/page365-follow-simultaneous-code-name` → Hub `develop`, merged 12:05:11Z (`9c50be627`): migration `20270221100000_page365_follow_recode_name.sql`.
     - Release PR #673 `develop` → Hub `main`, merged 12:05:29Z (`5092a880b`); all three merge commits are contained in Hub `main`.
  2. **Owner-confirmed database deployment (reported by the owner; NOT observed by Claude, which has no database access):** the Catalog Delete database function is deployed; the required database index is present; the database apply happened on 2026-10-29 at about 14:38 JST. The owner's confirmation concerns the Catalog Delete function and index; it did not state whether the `20270221100000_page365_follow_recode_name.sql` migration from #672 was applied, so that stays unstated here.
  3. **Actual operational usage (owner-reported):** none. No deletion has been performed; zero deletes are recorded; the products B2200 and 8C100 are still present.
- **Not evidenced:** any successful deletion, the live function checksum as read by Claude, and the apply status of the #672 migration. This register does not claim a deletion has succeeded.
- **Remaining action:** the owner decides when to perform the first deletion, and authorises it; Claude only verifies afterwards. Nothing is deleted for testing; no migration is run or modified from this repository.
- **Owner approval:** required for every deletion, including the first.
- **Definition of done:** the first legitimate, owner-authorised product deletion is observed and verified, and:
  - only the intended product is deleted;
  - associated records are handled according to the approved deletion design;
  - active claims and protected transactions remain safe;
  - audit records are correct;
  - the website catalog, sitemap and ItemList reflect the expected result;
  - no unrelated product or inventory change occurred.

## 3. BUG-09 — Search Console
- **Current status:** property VERIFIED and sitemap processing SUCCESS (owner-reported); actual indexing and the performance baseline are PENDING. The earlier status "BLOCKED (access)" is superseded.
- **Repository / workstream:** Google Search Console, owner account. This repository records evidence only.
- **Reference:** `docs/seo/SEO-DEFECTS-2026-10-29.md` §BUG-09.
- **Existing evidence:** historical (kept unchanged): on 2026-10-29 the Google account signed in on the Claude machine owned no property, so no coverage evidence was available to Claude; Rich Results Test by URL: a product page valid for Product snippets, Merchant listings and Breadcrumbs, `/en` valid for Organisation and Local business, `/en/layaway` no items (expected). **Owner-reported later the same day (not observed by Claude):** Domain property verified; sitemap status Success with 976 discovered URLs; priority indexing requests for `/en`, `/ja` and `/en/layaway` accepted.
- **Remaining action:** owner exports index coverage, URL inspection for the three priority URLs and the Performance report as a dated baseline; later compare after recrawl.
- **Owner approval:** access and any Search Console setting change are the owner's; Claude changes none.
- **Definition of done:** coverage and URL-inspection results for the priority URLs are saved with dates (OBSERVED IN SEARCH CONSOLE), a performance baseline exists for comparison, and no page is described as indexed or ranking before that.
- **Rule:** discovered URLs, a successful sitemap read and accepted requests are not indexing. Do not claim indexed pages without Search Console evidence.

## 4. BUG-06 — `/gold-guide` redirect chain
- **Current status:** OPEN — the two-hop redirect is deferred until owner-approved redirect work (confirmed, proposal only). No redirect was changed.
- **Repository / workstream:** website, `next.config.ts` and the legacy-redirect table (`lib/legacy-redirect.ts`); routing is high-risk under SEO governance.
- **Reference:** `docs/seo/SEO-DEFECTS-2026-10-29.md` §BUG-06.
- **Existing evidence:** production, 2026-10-29: `/gold-guide` → 308 `/jewelry-guide#metals` (`next.config.ts`) → 307 `/ja/jewelry-guide` or `/en/jewelry-guide` by language: two hops; the one-hop target is `/{lang}/jewelry-guide#metals`.
- **Remaining action:** owner decides whether to fold it into the middleware's legacy-redirect table as one 307 and remove the 308, in a dedicated redirect branch.
- **Owner approval:** required (route-change rule). No redirect change is authorised by this register.
- **Definition of done:** an approved redirect change merged and released with tests; `/gold-guide` reaches `/{lang}/jewelry-guide#metals` in one hop in both languages; other legacy redirects, canonical and hreflang unchanged; recorded in the QA report.

## 5. OG-PRODUCT — product-page sharing metadata
- **Current status:** CONFIRMED PRODUCTION METADATA DEFECT — CODE FIX REQUIRED. Not implemented: no code change is made by this tracking PR. (Corrected 2026-10-29: the first version said "AUDITED; QA PENDING".)
- **Repository / workstream:** website, `app/products/[slug]/page.tsx` `generateMetadata`.
- **Root cause (code, observed):** `openGraph: img ? { images: [img.url] } : undefined`. A page-level `openGraph` object replaces the inherited site-wide one (the same mechanism fixed for collection and category pages in Step 2 with a conditional spread; product pages were not touched).
- **Evidence:**
  - **Owner-provided audit evidence (not an exhaustive crawl):** 453 products appear in English and Japanese, giving 906 product URLs in the reported sitemap (906 is the sitemap count, not a crawl). Twenty-one sampled live product pages consistently lacked the relevant OpenGraph fields. Product pages share one metadata generator.
  - **Observed by Claude (production, 2026-10-29, product R2715, EN and JA):** product-specific `og:title`, `og:description` and `og:image` and the Twitter title, description, card and image are present; `og:site_name`, `og:type`, `og:locale`, `og:locale:alternate` and `og:url` are absent, as are image alt and size.
- **What is wrong:** the product's own title, description and image survive, but the site-wide fields (site name, page type, language and alternate language) and `og:url` are missing from every sampled product page.
- **Required future fix (separate, owner-approved PR; NOT part of PR #440):**
  - preserve each product's title, description and authentic product image;
  - restore the site name, an appropriate OpenGraph page type, and the language and alternate-language fields;
  - verify `og:url`;
  - keep canonical and hreflang unchanged;
  - keep the existing Twitter sharing metadata;
  - add automated regression coverage.
  - Open design points for the owner before implementation: which OpenGraph type a product page should declare (the site-wide value today is `website`; whether a product-specific type is supported by the installed Next.js metadata types has not been checked here — UNVERIFIED, to be confirmed against the Next.js documentation first), and what `og:url` should equal (the locale canonical URL).
- **No-photo edge case (not a confirmed defect):** no active product without a photo was observed, so this is not classed as a production defect. The same code path would emit no `openGraph` at all for such a product. **Expected behaviour to be agreed before implementation:** the page keeps its title and description, keeps the full site-wide OpenGraph fields, and uses the site brand image as the share image (the existing fallback used by collection and category pages), never an empty or broken image. The regression tests must include a simulated product without a photo.
- **Not evidenced:** how Facebook and Messenger render a shared product link. The Facebook Sharing Debugger can add verification but is not a prerequisite for classifying the metadata issue as confirmed.
- **Owner approval:** required before the code correction is implemented (metadata change). No new share tags are added by this work.
- **Definition of done:** the focused code correction is approved, merged, deployed and verified against actual English and Japanese product pages, with automated tests (including the simulated no-photo product) and live metadata evidence showing the title, description, image, site name, type, locale pair and `og:url`, with canonical, hreflang, Twitter metadata, and the `Product` and `BreadcrumbList` schema unchanged.
