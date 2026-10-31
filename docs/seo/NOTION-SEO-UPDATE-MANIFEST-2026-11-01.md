# Notion SEO update manifest (2026-11-01) — for Codex

**Why a manifest:** this session's Notion connector is unauthenticated (only the OAuth entry points are exposed); no authorization was requested, per the standing instruction. Codex applies the updates below to **Cha Jewels — Security Hardening Plan + SEO Master Plan Tracker → Security + SEO Tracker → SEO master plan / SEO views**, changing card **properties** (Status, Completed, Pending, Evidence/PR, Next action, Limitations/Owner decision), not comments. Security cards are not touched. Visible IDs stay literal text. The parent SEO summary is updated last (§2).

Branch: `seo/master-plan-completion`; PR: (number to be filled when opened); base `develop` `47ffc77`; production `main` `9518974`.

## 1. Card updates

| Card (visible ID / title) | Status | Completed | Pending | Evidence / PR | Next action | Limitations / owner decision |
|---|---|---|---|---|---|---|
| SEO foundation batch (R-06, R-15; og:url, 404 hygiene, fb:app_id) | READY FOR QA (in `develop` since #452; not released) | re-verified on `47ffc77` + this batch: raw 671/0, DOM 685/0, 0 hydration | credentialed preview run; release | `SEO-QA-REPORT.md` §16 | owner O-1 (bypass secret), O-2 (release) | no real-Hub preview run this session (access) |
| Phase 4 structured data | DEPLOYED + one correction READY FOR QA | Product Offer = displayed variant (verified defect fixed, 3 tests); JewelryStore type review AUDITED; video eligibility ASSESSED (none eligible) | release; OD-SD-1 | `phase-4/STRUCTURED-DATA-REVIEW-2026-11-01.md` | owner O-3 | prevalence of multi-variant pieces unverified (no Hub API key) |
| R-37 rollback duplicate og:url | CLOSED | product block no longer names a URL; rollback checker 10/0/0 | — | `scripts/check-seo-rollback.mjs` | — | — |
| Phase 5 Merchant Center | AUDITED → builder IMPLEMENTED (READY FOR QA); route NOT CREATED; account OWNER DECISION PENDING | `lib/merchant-feed.ts` + 10 tests; MC-G2/G4/G7/G8/G10/G11 dispositions; owner package | X8, OD-MC-1..11, OD-MC-7 route approval | `phase-5/MERCHANT-FEED-IMPLEMENTATION-PROPOSAL.md` | owner O-5 | MC-G12 robots treatment unverified (Google help page 404) |
| Phase 6 commercial landing pages | AUDITED; `llms.txt` add-on READY FOR QA | `app/llms.txt/route.ts`, `lib/llms-txt.ts`, shared `lib/sitemap-pages.ts`, checker coverage `llms-txt`, 4 tests | OD-P6-1..10; release | matrix §E | owner O-6 | built on existing URLs; follows the sitemap source if Phase 6 adds pages |
| Phase 7 Kihei / Phase 8 K18 | AUDITED (drafts) | — | OD-P6-5 + editorial approval | `phase-7/*`, `phase-8/*` | owner O-6 | — |
| Phase 9 Filipino | AUDITED | — | option choice after R9 evidence | `phase-9/FILIPINO-CONTENT-BRIEFS.md` | owner O-11 | — |
| Phase 10 Business Profile | CLOSED — NOT ELIGIBLE | — | — | OD-GBP-1 | — | — |
| Phase 11 authority | AUDITED + execution materials | boilerplates EN/JA, pitch draft, directory script, tracking log (§8) | OD-AUTH-1..3; owner sends | `phase-11/AUTHORITY-OPPORTUNITIES.md` §8 | owner O-11 | nothing sent |
| Phase 12 / BUG-09 Search Console | IMPLEMENTING | `scripts/gsc-report.mjs` + 7 tests (synthetic fixtures); organic-attribution DESIGN written | ~5 Nov and ~12 Nov reads (owner, read-only); OD-SC-1..4; OD-ATTR-1..4 | `phase-12/ORGANIC-ATTRIBUTION-DESIGN.md`, `SEO-OPERATIONS-RUNBOOK.md` | owner O-8, O-9 | not re-read today by design (report still processing on 10-31) |
| Step 3 performance (3b/3c) | AUDITED | Lighthouse 13.6 mobile single-run lab table (QA §16) as a future "before" | owner scoping | `SEO-QA-REPORT.md` §16 | owner O-10 | single runs, lab only |
| Step 4 Hub content | AUDITED — OWNER APPROVAL PENDING | live re-check 2026-11-01: six listing texts still unapplied | owner publishes per checklist | `STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md` | owner O-4 | — |
| Redirect stage (R-10/R-11/BUG-06, OD-1/3/4/6) | OWNER DECISION PENDING | — | decision after Search Console Pages data | matrix §B | owner O-7 | — |
| Operations (I-1..I-5) | DOCUMENTED | runbook: cadence, release/rollback checklist, removal criteria | — | `SEO-OPERATIONS-RUNBOOK.md` | — | — |

## 2. Parent SEO summary (replace the status paragraph)
> 2026-11-01: SEO master-plan completion batch on `seo/master-plan-completion` (base `develop` `47ffc77`). Source work complete for everything not gated on an owner decision: `llms.txt` (Phase 6 add-on), the Product Offer corrected to the displayed variant, R-37 closed, the Merchant Center feed builder with tests (route awaits OD-MC-7), the Search Console report helper, the organic-attribution design, the entity-type and video audits, the operations runbook, and the complete requirements matrix (`SEO-REQUIREMENTS-MATRIX-2026-11-01.md`). Verification on the exact head: unit 652/652, typecheck, lint (0 errors), 8 guards, production build, raw 671/0, DOM 685/0 (desktop + 375, 0 hydration), rollback 10/0/0; production raw 555/110 = the pre-release rows. Release of `develop` → `main` remains HOLD until the credentialed preview run (O-1) and the owner's approval (O-2). Twelve owner actions are consolidated in the matrix §J. Nothing is claimed indexed beyond the three URLs observed on 2026-10-30.
