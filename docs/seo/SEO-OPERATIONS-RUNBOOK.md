# SEO operations runbook (2026-11-01)

The recurring procedures, the release and rollback checklist, acceptance criteria per check, and the removal criteria for temporary SEO implementation. Status vocabulary: CLAUDE.md governance §8. Everything here is read-only unless the step says "owner".

## 1. Monitoring and regression checks

| Cadence | Check | Command / place | Pass criterion | Owner |
|---|---|---|---|---|
| every PR (CI) | unit suite, typecheck, lint, guards (`check:terms`, `check:money`, `check:i18n` → `check:layaway-ja`, `check:analytics`, `check:contrast`, `check:cutouts`, `check:lastmod`) | `npm run test:unit` … | all green | CI |
| every SEO batch, before PR | raw checker and DOM checker on a local production build (fixtures) | `NEXT_PUBLIC_SITE_URL=http://localhost:3131 npm run build && npx next start -p 3131`; `node scripts/check-seo-live.mjs http://localhost:3131`; `node scripts/check-seo-dom.mjs http://localhost:3131` | 0 fail, inventory complete, 0 hydration events | Site |
| every batch that touches metadata or redirects | rollback mode | server started with `SEO_LEGACY_REDIRECTS=off` on another port; `SEO_CHECK_PUBLIC_ORIGIN=<build origin> node scripts/check-seo-rollback.mjs <that port>` | 0 fail, 0 deferred | Site |
| every release candidate | both checkers on the pinned preview with real Hub data | `SEO_CHECK_BYPASS_ORIGIN=<exact preview origin> SEO_CHECK_PUBLIC_ORIGIN=https://www.chajewelsjp.com VERCEL_AUTOMATION_BYPASS_SECRET=… node scripts/check-seo-live.mjs <preview>` and `…check-seo-dom.mjs <preview>` | 0 fail; every `(errors)` row passes | owner supplies the secret in the environment; Site runs |
| after every production release | raw checker on production; Facebook Sharing Debugger one page per template class; Rich Results Test one page per schema | `node scripts/check-seo-live.mjs https://www.chajewelsjp.com` | 0 fail | Site (checker), owner (Google/Facebook tools) |
| weekly (Mon) | Search Console exports → report | owner downloads the CSVs (Queries, Pages, Countries, Devices, Chart); `node scripts/gsc-report.mjs <dir> [<previous dir>] --out report.md` | every cell from a row; `NO EXPORT` where a file is missing | owner exports; Site runs |
| monthly | Indexing → Pages, Enhancements, Core Web Vitals, Links exports; `check-seo-live` on production; sampled link health (the DOM checker's failed-request accounting) | Search Console UI + the commands above | recorded with dates; no claim without an export | owner + Site |
| on the planned dates (~5 Nov, ~12 Nov 2026) | re-read the Page indexing report and the 8-URL sample; no indexing request | Search Console UI | OBSERVED IN SEARCH CONSOLE only from the stored status | owner |
| Merchant Center (once live) | Diagnostics weekly | merchants.google.com | per `phase-5/MERCHANT-CENTER-READINESS.md` §7 | owner |

Acceptance criteria per route family are the checkers' own rows (FOUNDATION, OG-PRODUCT, Phase 3, 2E-1, LLMS); a new SEO surface adds a coverage key to **both** checkers (the parity test enforces it).

## 2. Release checklist (owner approves each gate)
1. PR into `develop`: CI green; the batch's exact-head results in the PR body (unit, typecheck, lint, guards, build, raw, DOM, rollback).
2. **Obtain a deployment of the EXACT head (a bypass secret only opens a deployment; it does not create one).** Vercel builds only `develop` and `main` for this project: a push to a feature branch produces an ignored/cancelled deployment (QA report §1, 2026-10-29; confirmed again on PR #462, whose Vercel comment reads "1 Skipped Deployment — Ignored"). So a PR-branch head never has a preview of its own. The ways to get a deployment whose tree is the reviewed head, in order of preference:
   a. **Merge into `develop` while `develop` is still the PR's base** (owner approves the merge, which is already gate O-2). A merge commit whose first parent is an ancestor of the head has the head's tree exactly; prove it before testing: `git rev-parse origin/develop^{tree}` must equal `git rev-parse <head>^{tree}`. If `develop` moved in the meantime the trees differ and the deployment is of the merged tree, which is then the candidate to test (state that in the record).
   b. **Owner-run `vercel deploy` of the checked-out head** (Vercel CLI under the owner's own login; none is installed or authenticated in the Claude environment): a preview deployment of that exact commit without touching `develop`. Record its `dpl_…` id and the commit it reports.
   c. **Owner changes the project's Git settings** (ignored build step / branch list) so that this branch builds; the branch alias `cha-jewels-web-git-<branch>-cha-jewels.vercel.app` then serves it. A project-settings change; the owner's call.
   Then pin the deployment (GitHub deployment id, Vercel `dpl_…`, asset hash) in the acceptance record, and verify the served build is the pinned commit (asset hash in the HTML vs the local build of that commit).
   **Integration dependency (recorded 2026-11-01):** other work merges into `develop` on its own schedule (at the time of writing, `redesign/lumiere` is 18 commits ahead of `develop` — PR #463 merged into it, not into `develop` — and rewrites the home page, the root layout, `lib/hub-api.ts` fixtures and one comment line of `lib/product-seo.ts`). Exact-head acceptance of an SEO batch is acceptance of THAT tree only. If `develop` moves before or after the SEO merge, the deployed candidate is a different tree: pin it, prove which commits it contains (`git log --oneline <base>..<candidate>`), and run the acceptance on it; never carry an earlier head's runtime results forward to a candidate that contains other work.
3. *(SEO gate boundary: steps 2–4 are the only gates this batch waits on; login, Messenger and security work in the same candidate has its own records and is neither verified nor waived here.)* Credentialed run of both checkers on that deployment (§1 row 4; `VERCEL_AUTOMATION_BYPASS_SECRET` + `SEO_CHECK_BYPASS_ORIGIN` set in the environment for that deployment, never in chat) + the 36-URL real-data metadata comparison against production (only the intended diffs). Both checkers now also fetch every link `/llms.txt` advertises (`llms-links` rows): on real data that is the first time the collection and category links are verified as 200 and indexable.
4. Hydration: `(errors)` rows pass on the deployment; OD-F1 retired only then.
5. Owner approves `develop` → `main`; merge; wait for Vercel Ready; record the production deployment id.
6. Post-release: raw checker on production 0 fail; Sharing Debugger; Rich Results Test; `/llms.txt` 200 text/plain; `/sitemap.xml` count unchanged (976 ± real catalog change); Search Console: SEARCH ENGINE RECRAWL PENDING.
7. Update `SEO-IMPLEMENTATION-STATUS.md` (change log + rows), `SEO-QA-REPORT.md` (release section), the register and the Notion SEO cards.

## 3. Rollback
- **Code:** revert the release merge on `main` (`git revert -m 1 <merge>`), push, wait for Ready, run the raw checker. No data, migration, Hub, environment or Google change is involved in any SEO batch to date.
- **Legacy redirects only:** set `SEO_LEGACY_REDIRECTS=off` in Vercel (bare URLs render again, 307s stop); verify with `scripts/check-seo-rollback.mjs`; this is an emergency switch, not a state to stay in (a bare missing resource then carries the legacy tags).
- **React #418 loader:** revert #458 and #460 together; the next build ships the unpatched bundled React.
- **llms.txt (once integrated by the Phase 6 batch):** delete `app/llms.txt/route.ts` (the builder `lib/llms-txt.ts` and the shared `lib/sitemap-pages.ts` may stay: the sitemap reads the latter). Today no route exists.
- **Product Offer rule:** revert the `lib/json-ld.ts` hunk and its three tests (the markup returns to the lowest-price rule).
- **Merchant feed (once live):** delete the route; remove the data source in Merchant Center.

## 4. Temporary implementation — maintenance and removal criteria

| Item | Why it exists | Remove when | How it tells you |
|---|---|---|---|
| `scripts/react-hydration-replay-fix.cjs` + the webpack rule in `next.config.ts` | Next 15.5 bundles react-dom 19.2 without React's replay fix (react/react#37584) | Next bundles react-dom ≥ 19.3 | `tests/react-hydration-replay-fix.test.mjs` removal-criterion test turns red with the instruction; the loader is already a no-op then |
| `SEO_LEGACY_REDIRECTS` kill switch and the 307 stage (Phase 2E-stage-1) | temporary redirects until the owner approves the permanent stage | OD-1/OD-4 308 promotion approved and released | `scripts/check-seo-rollback.mjs` and the 2E-1 rows in the raw checker are retired in the same batch |
| Root `/` listed beside `/ja` and `/en` in the sitemap | OD-3 pending | OD-3 decided (root redirect or canonical) | `tests/seo-sitemap.test.mjs` "2D: lists /, /ja and /en" is rewritten in that batch |
| `single-language-posts` optional coverage | no single-language post exists on real data | first single-language post is published | the checkers stop skipping it (inventory shows it checked) |
| Branded pieces excluded from the Merchant feed | no identifier rule (MC-G7) | OD-MC-11 written | the exclusion reason disappears from the route's `x-feed-excluded` count |
| Lighthouse single-run lab table (QA §16) | baseline for a future approved performance step | that step's matched before/after is recorded | superseded by the step's own table |

## 5. Measurement procedures
- Lab performance: Lighthouse 13.x, `--preset=perf --form-factor=mobile --screenEmulation.mobile`, three runs, median, same hour, recorded in `PERF-STEP3-FINDINGS.md` or the step's record; never compared across Lighthouse major versions without saying so; never presented as field data.
- Field: Vercel Speed Insights (dashboard, owner) and Search Console Core Web Vitals (once populated); the only CWV claims are from those.
- Search Console: `scripts/gsc-report.mjs`; branded vs disclosed non-brand vs undisclosed kept separate; no number without an export.
- Commercial: Hub reports only (`docs/measurement-log.md`); organic attribution only after `phase-12/ORGANIC-ATTRIBUTION-DESIGN.md` is approved.
