# Phases 6–8 and 9/11 materials — execution pack (DP-06, DP-07, DP-13; owner-approved 2026-11-02)

**What the approval covers:** the commercial architecture (`COMMERCIAL-LANDING-ARCHITECTURE.md`), the English guides (`/en/guides/*`, English only), the internal-linking map, and `llms.txt` — in dependency order, with the approved rules kept: `llms.txt` is a **static file built after the Phase 6 URLs are final**, and **publication needs approved, fact-supported copy**. Hub implementation (collections, SEO fields) stays with the Hub owner.

## Dependency order and state
| # | Step | Owner | State 2026-11-02 |
|---|---|---|---|
| 1 | Hub: create collection `kihei` (kept noindex until ≥ 6 available pieces) and `diamonds`; add the Hub SEO fields for collections/categories (`seo_title`, `seo_description`, `h1`, `intro`, `seo_copy`, `faq`; spec: architecture §4) | **Hub owner** | not done; nothing is sent to Lovable or any agent by SEO. Work-item text is the architecture §4 table |
| 2 | Storefront: read the new Hub fields with fallbacks to today's text; wholesale title (T9); "Learn more" blocks conditional on Hub data (K18 material, kihei collection, gram weight, preloved) per `INTERNAL-LINKING-MAP.md` §3–§4 | SEO | blocked on step 1 (fields must exist to read); link targets must exist (step 4) |
| 3 | Editorial: Kihei and K18 pillar copy approved and every claim evidenced | Owner | drafts `phase-7/KIHEI-PILLAR-DRAFT.md` and `phase-8/K18-PILLAR-DRAFT.md` carry source tags `[S#]` and a few UNVERIFIED claims (4 and 3); marked "DRAFT — NOT PUBLISHED — EDITORIAL APPROVAL REQUIRED". **No approved copy was supplied**, so nothing is published |
| 4 | Storefront: the English-only route family `/en/guides/[slug]` (self canonical, hreflang `en` + `x-default` only, JSON-LD for the page and FAQ only where the FAQ is visible, sitemap entries only for published guides, no `ja` sibling) | SEO | **not built in this batch**: a new route family is a high-risk routing change (governance rule 7: dedicated phase and branch, with the redirect/canonical/hreflang matrix tests), and with no approved copy it would ship an empty family. It is built in that dedicated branch the moment step 3 delivers approved copy for the first guide |
| 5 | `llms.txt` as a static file listing the final Phase 6 URLs and published guides | SEO | after steps 1–4, by the approved timing rule; the decision record is `LLMS-TXT-DECISION-2026-11-01.md`; the checker rows become required when the file exists |

## Missing facts and access (bundled in matrix §U.3)
Hub work (step 1) and its schedule; approved, evidenced pillar copy (step 3); for each UNVERIFIED claim in the drafts, a source or its removal.

## Phase 9 and Phase 11 materials (DP-13) — prepared, nothing sent or published
- **Phase 9:** eight Taglish briefs (B1–B8) in `phase-9/FILIPINO-CONTENT-BRIEFS.md`, written for English-site-only Hub posts. They are briefs, not publishable posts; publishing is a Hub action by the owner after final text approval.
- **Phase 11:** pitch drafts and the opportunity list in `phase-11/AUTHORITY-OPPORTUNITIES.md` (§8, including the Filipino-community publication pitch). **Sending any outreach, changing another system's settings, or naming a spokesperson is separately authorized** and requires OD-AUTH-1 (who speaks for the company), OD-AUTH-2 and OD-AUTH-3 answers; none was supplied, so none was sent.
