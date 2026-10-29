# Outstanding issues register (2026-10-29)

Five distinct workstreams that are **open**, tracked here so none is lost or marked done early. Status vocabulary is the SEO governance one (NOT STARTED · AUDITED · IMPLEMENTING · BLOCKED · READY FOR QA · VERIFIED · DEPLOYED · SEARCH ENGINE RECRAWL PENDING · OBSERVED IN SEARCH CONSOLE) plus OWNER APPROVAL PENDING and VERIFICATION PENDING. Nothing below is completed. Each item says what evidence exists, what is owner-reported rather than observed, and what "done" means.

| # | Item | Repository / workstream | Status |
|---|---|---|---|
| 1 | BUG-03 article wording | Hub article content (website repo holds the proposal) | OWNER APPROVAL PENDING |
| 2 | HUB-CATALOG catalog delete of unused products | Hub repository `chajewels/la-tracking` | MERGED IN GIT; LIVE VERIFICATION PENDING |
| 3 | BUG-09 Search Console | Google Search Console (owner account) | PROPERTY VERIFIED (owner-reported); INDEXING AND BASELINE PENDING |
| 4 | BUG-06 `/gold-guide` redirect chain | Website repository, routing | OWNER APPROVAL PENDING |
| 5 | OG-PRODUCT product-page sharing metadata | Website repository, metadata | AUDITED; QA PENDING |

## 1. BUG-03 — article wording A/B
- **Current status:** CONFIRMED defect, OWNER APPROVAL PENDING. Nothing has been edited.
- **Repository / workstream:** content lives in the Hub (Website → Content, `body_en` / `body_ja` of the article `why-cha-jewels-care-behind-every-piece`). The proposal lives in this repository.
- **Reference:** `docs/seo/SEO-DEFECTS-2026-10-29.md` §BUG-03 (four sentences, two options).
- **Existing evidence:** the live article was fetched on 2026-10-29 and carries four sentences with origin wording outside the approved surfaces (`origin-badge.tsx` for a piece whose Hub `origin === "JAPAN"`, or the exact approved clarifier). Option A removes the origin word; Option B replaces the sentence with the approved clarifier. `check:terms` does not scan Hub bodies.
- **Remaining action:** owner chooses A or B (per sentence if desired); the owner edits the two Hub fields.
- **Owner approval:** required. Claude must not edit the published text.
- **Definition of done:** the owner has approved an option; the live EN and JA article bodies were re-fetched afterwards and contain none of the four sentences; the result is recorded in the defects file with the date.

## 2. HUB-CATALOG — catalog delete of unused products
- **Current status:** merged in Git; live migration and deletion behaviour VERIFICATION PENDING. No deletion or migration was run or requested by this work.
- **Repository / workstream:** Hub, `chajewels/la-tracking` (Page365 inventory follow and catalog delete). Not a website repository change.
- **Related PRs (read-only GitHub state, 2026-10-29):**
  - #670 `feat/page365-follow-and-delete` → Hub `develop`, merged 2026-10-29 05:26:12Z (merge `05c55a77e`): migration `20270220100000_page365_follow_and_catalog_delete.sql`, `page365-inventory-fetch` function change, local-test SQL.
  - #671 release `develop` → Hub `main`, merged 05:26:19Z (`0da2a1f24`).
  - #672 `fix/page365-follow-simultaneous-code-name` → Hub `develop`, merged 12:05:11Z (`9c50be627`): migration `20270221100000_page365_follow_recode_name.sql`.
  - Release PR #673 `develop` → Hub `main`, merged 12:05:29Z (`5092a880b`); `git compare` shows all three merge commits are contained in Hub `main`.
- **Existing evidence:** the merge states above (observed through the GitHub API). This repository's earlier statement that #672 "remains subject to its own migration review" described the time before it merged and is superseded as to merge state only.
- **Not evidenced:** that either migration was executed on the live database, the live function checksums, the read-only list of products a delete would affect, and any actual deletion. Cynthia runs all SQL; no run has been recorded here.
- **Remaining action:** owner confirms, from the Hub side, which migrations were run and when; read-only impact list of the products the delete would touch; verify function checksums; only then any deletion, by the owner.
- **Owner approval:** required before any live migration run or deletion.
- **Definition of done:** a dated record that both migrations ran (or were deliberately not run), the live function checksums match the merged code, the impact list was reviewed, and, if a deletion was chosen, its result is verified against the live catalog and the website's product, sitemap and ItemList output.

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
- **Current status:** CONFIRMED, proposal only, OWNER APPROVAL PENDING. No redirect was changed.
- **Repository / workstream:** website, `next.config.ts` and the legacy-redirect table (`lib/legacy-redirect.ts`); routing is high-risk under SEO governance.
- **Reference:** `docs/seo/SEO-DEFECTS-2026-10-29.md` §BUG-06.
- **Existing evidence:** production, 2026-10-29: `/gold-guide` → 308 `/jewelry-guide#metals` (`next.config.ts`) → 307 `/ja/jewelry-guide` or `/en/jewelry-guide` by language: two hops; the one-hop target is `/{lang}/jewelry-guide#metals`.
- **Remaining action:** owner decides whether to fold it into the middleware's legacy-redirect table as one 307 and remove the 308, in a dedicated redirect branch.
- **Owner approval:** required (route-change rule). No redirect change is authorised by this register.
- **Definition of done:** an approved redirect change merged and released with tests; `/gold-guide` reaches `/{lang}/jewelry-guide#metals` in one hop in both languages; other legacy redirects, canonical and hreflang unchanged; recorded in the QA report.

## 5. OG-PRODUCT — product-page sharing metadata
- **Current status:** AUDITED; preview behaviour and the no-image case QA PENDING. Nothing was implemented.
- **Repository / workstream:** website, `app/products/[slug]/page.tsx` `generateMetadata`.
- **Existing evidence:** the code sets `openGraph: img ? { images: [img.url] } : undefined`. Observed on production (2026-10-29, product R2715, EN and JA): `og:title`, `og:description`, `og:image` and the Twitter title, description, card and image are present; `og:site_name`, `og:type`, `og:locale`, `og:locale:alternate`, `og:url` and image alt/size are not (a page-level `openGraph` replaces the root block; collection and category pages were corrected in Step 2 with a conditional spread, product pages were not touched). A product without an image would emit no `openGraph` at all by the same rule; no such real product was observed.
- **Not evidenced:** how Facebook and Messenger actually render a shared product link (no sharing-debugger run), and the behaviour for a real product with no image.
- **Remaining action:** run the Facebook sharing debugger and a Messenger share on real products; find or simulate a product without an image; owner decides whether to add the missing tags.
- **Owner approval:** required before new share tags are added (metadata change). Not implemented here.
- **Definition of done:** previews verified on real products (with and without images), a decision recorded, and if tags are added, a regression test and a live check that the product `Product` and `BreadcrumbList` schema are unchanged.
