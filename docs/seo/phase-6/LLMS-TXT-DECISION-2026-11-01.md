# `llms.txt` — deferral record OD-LLMS-1 (2026-11-01): the route waits for the Phase 6 batch under the approved requirements

**Status:** builder IMPLEMENTED (`lib/llms-txt.ts`, 4 unit tests); **route DEFERRED to the Phase 6 batch — no owner decision requested.** The owner's approved requirements of 2026-10-31 already decide the question ("static file"; "build it inside the Phase 6 batch, after the Phase 6 URLs and titles are final"), so the route is simply not integrated before that batch. This record is a label (OD-LLMS-1), not an approval request; asking again would only re-open what is already decided. The route `app/llms.txt/route.ts` shipped in `d0b3b5f` / `1b654f7` of PR #462 is withdrawn from the tree in this batch; its exact code is §4 below. Documentation of a deviation is not approval: the route returns with the Phase 6 batch, built to the approved requirements.

## 1. The recorded requirements (owner, 2026-10-31, PR #454)

From `CHA-JEWELS-SEO-MASTER-PLAN.md` "Phase 6 add-on — llms.txt" and `SEO-REQUIREMENTS-REGISTER.md` §1 (decision row "llms.txt added to Phase 6 scope"):

1. **"Static file."** No product list, prices, stock, points or any figure.
2. **"Build it inside the Phase 6 batch, after the Phase 6 URLs and titles are final, so its links match the commercial landing pages."**
3. Only public pages that are in the sitemap; no account, cart, checkout, API or Hub URLs; Japanese pages never link to layaway; wording per Terminology; robots, sitemap, canonicals and hreflang untouched.
4. Test: the URL returns 200 with `text/plain`; every link in it returns 200 and is indexable; the three guards pass.
5. Content named by the plan: "links to the main public pages (collections, categories, wholesale, layaway on the English site, guides once approved, contact, policies)".

## 2. What was implemented and where it conflicts

| Requirement | Implementation in `d0b3b5f`/`1b654f7` | Conflict |
|---|---|---|
| 1 Static file | A route handler (`app/llms.txt/route.ts`) prerendered at build and revalidated every 60 s, reading the sitemap's cached Hub rows (collections, categories) | **Deviates from the wording.** The response is static-cached, but it is generated from Hub data, not a file in `public/`. The deviation was documented in the matrix and register, which is not approval. |
| 2 After Phase 6 URLs are final | Built on 2026-11-01 on the existing URLs; Phase 6 routes do not exist (OD-P6-1..10 pending) | **Not met.** The file would be published before the Phase 6 batch it belongs to. |
| 3 Sitemap pages only, no private URL, no JA layaway, terminology | Met by construction (`lib/llms-txt.ts`, tests) | none |
| 4 Every link 200 and indexable | Met on the local fixtures build by both checkers fetching every link (`llms-links`); NOT RUN on real data or a deployment | none in principle; real-data run pending |
| 5 Collections and categories listed | Met through the Hub rows the sitemap uses | **Internal tension in the recorded rules:** a literal static file cannot list Hub collections and categories without going stale when the Hub renames or adds one; the plan asks for both. |

## 3. Why no new decision is requested, and what the Phase 6 batch must settle

| Option | What it is | Meets 1 | Meets 2 | Meets 5 | Cost / risk |
|---|---|---|---|---|---|
| **A. Defer until Phase 6 is final — THE STATE IN FORCE** (what the approved requirements say) | Keep the builder and tests; integrate the route in the Phase 6 batch, after OD-P6-1..10 and the landing-page URLs exist; re-run the `llms-links` rows then | decided then | yes | yes | nothing published until Phase 6; no benefit lost of consequence (plan: "few AI crawlers request it today; expect a small benefit at most") |
| B. Prerendered route now (the withdrawn implementation) — NOT pursued; would need a new owner waiver of two approved rules | Restore §4 as written: static-cached response from the sitemap sources, follows the sitemap when Phase 6 adds pages | by cache, not by file | no (explicit waiver needed) | yes | the owner waives rule 2 and accepts "static" to mean "static-cached response"; re-verify after Phase 6 |
| C. Literal static file now, static pages only — NOT pursued; drops links the plan names | `public/llms.txt` written by hand (or by a build step from `lib/sitemap-pages.ts`), listing the home, static pages and `/en/layaway` only; no collections or categories until a maintained process exists | yes | no | **no** | drops the collection and category links the plan names; a renamed collection is never reflected |

**State in force: A.** Within the Phase 6 batch design (OD-P6-1..10), one open design point is recorded for then, not now: the approved rules ask for both a static file and links to Hub collections and categories, which a literal file cannot keep current — the Phase 6 batch resolves it (build-time generation from the sitemap sources, or static pages only) as part of its own owner review. No route, no file; `/llms.txt` answers the site's 404 (noindex, as every unknown path). Both SEO checkers mark the two llms rows as skipped with the reason "route deferred to the Phase 6 batch" while `app/llms.txt/route.ts` is absent, and require them the moment it exists. The builder, its tests, the shared static list (`lib/sitemap-pages.ts`, which the sitemap reads) and the checker rules stay in the tree so the decision costs one file.

## 4. The route, exactly as withdrawn (for the Phase 6 batch)

```ts
// app/llms.txt/route.ts  (WITHDRAWN 2026-11-01; deferred to the Phase 6 batch — see LLMS-TXT-DECISION-2026-11-01.md)
import { hub } from "@/lib/hub-api";
import { buildLlmsTxt } from "@/lib/llms-txt";

/**
 * GET /llms.txt (Master Plan PHASE 6 add-on; the rules are in lib/llms-txt.ts).
 *
 * Served as text/plain. The two Hub reads are the cached catalog reads the
 * sitemap uses (tag `catalog`, busted by the Hub on any collection change), so
 * the file follows the sitemap within a minute of a Hub edit. A failed read
 * costs that section only — the static pages are always listed — and the
 * route never answers an error page for a crawler that came for this file.
 *
 * The middleware never sees this path (its matcher skips paths with a file
 * extension), so no language cookie, redirect or locale rule applies.
 */
export const revalidate = 60;

export async function GET() {
  const [collections, categories] = await Promise.all([hub.collections().catch(() => []), hub.categories().catch(() => [])]);
  return new Response(buildLlmsTxt({ collections, categories }), {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=3600" },
  });
}
```

Restoring it: add the file, run `npm run test:unit` (the route test in `tests/llms-txt.test.mjs` flips to requiring the file), build, and run both checkers — the `llms-txt` and `llms-links` rows become required automatically.

## 5. Evidence kept from the withdrawn implementation (dated, by head)

- `d0b3b5f` (2026-11-01): raw checker 671/0 incl. the `llms-txt` row; DOM 685/0; route prerendered (ISR 1 m) in the production build.
- `1b654f7` (2026-11-01): raw 728/0 incl. 57 `llms-links` rows (every advertised link fetched: 200, HTML, no noindex, self canonical); DOM 799/0 incl. 114 `llms-links` rows; both on the local fixtures build. Real Hub rows and a deployment: NOT RUN.

## 6. Documentation used
`docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` (Phase 6 add-on), `docs/seo/SEO-REQUIREMENTS-REGISTER.md` §1 and R-26, `docs/seo/phase-6/COMMERCIAL-LANDING-ARCHITECTURE.md` §6b, `lib/llms-txt.ts`, `lib/sitemap-pages.ts`, `scripts/lib/seo-check-core.mjs`. **UNVERIFIED:** whether any AI crawler has requested `/llms.txt` on production (no log access in this session).
