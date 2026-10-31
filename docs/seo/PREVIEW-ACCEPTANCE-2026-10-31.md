# Preview acceptance — `develop` `6dc71df` (PR #452 merged) and security batch 1 (PR #455) — 2026-10-31

Status vocabulary: CLAUDE.md "SEO Implementation Governance" §8. **Release decision: BLOCKED, not waived** (QA report §15). No merge or deployment was made for this record beyond the owner-approved merge of #452 into `develop`; `main` is unchanged.

## 1. Commits, deployment, release candidate
| Item | Value |
|---|---|
| `develop` | `6dc71df255491c4ae6066aa915b00c1d81bd0a8b` = merge of PR #452 (head `e5e3674`, pinned) onto `edb9919` (#453, #454 preserved), 2026-10-31 08:52 UTC; CI `check` pass (run 41186374133) |
| `main` (production) | `95189746d18ef97a17b5d98dbe2c8a952330ddc0`, unchanged |
| Deployed preview | GitHub deployment 7456517986 for `6dc71df`, Preview, success. Branch alias `cha-jewels-web-git-develop-cha-jewels.vercel.app` serves the same build as the per-deployment host (identical set of 28 `/_next/static/` asset paths, hash `1ff43a540380`, re-checked at the end of the gate). Both hosts SSO-protected (302 for an anonymous client). |
| Release candidate | **None yet.** PR #455 (`security/critical-fixes`, head `1ac667f` after two correction commits, base `6dc71df`) is open, not merged, and Vercel builds no feature branch. The release candidate will be the `develop` merge commit of #455 once the owner approves that merge; it does not exist at the time of writing. |

## 2. Access and method (owner-approved substitute)
- The fixed gate method, `scripts/check-seo-live.mjs` and `scripts/check-seo-dom.mjs` with `SEO_CHECK_BYPASS_ORIGIN`, **could not run against the preview**: no Protection Bypass for Automation secret exists in this session. No secret was requested, read from the dashboard or created; no browser cookie was extracted; preview protection was not changed; no fixture was substituted for real Hub data.
- **Existing authorized access:** the owner's signed-in Vercel session in Chrome. With the owner's explicit approval (2026-10-31, in chat) the following **equivalent method** was used and is recorded as a substitute, never as the fixed checker run: same-origin `fetch` with credentials from a page on the preview host, parsed with `DOMParser`; the same script run on production for a like-for-like baseline; identical same-tab Chrome page-load sequences on preview and production for hydration.
- Known differences from the fixed method, stated: (a) requests carry the owner's cookies, so **gated routes do not redirect** (the owner is signed in on both hosts) and the three gated-descendant rows cannot be verified this way (they pass in every anonymous Node run: production `6dc71df`-era checker on `main`, and the local builds of `6dc71df` and `99a68c3`; middleware was not touched by #452 or #455); (b) `fetch` follows redirects, so Location headers are not read; (c) the DOM checker's rendered-DOM rows, screenshots and client-navigation rows were not run on the preview.

## 3. Results
### 3a. FOUNDATION matrix (raw HTML, the checker's own matrix, both hosts, same script)
| Host | Rows | Pass | Fail | Failures |
|---|---|---|---|---|
| Preview `6dc71df` (alias) | 235 | **232** | 3 | only the 3 gated-descendant rows (method artefact above). Coverage: locale-homes 2, static-templates 30, dynamic-both-languages 6, blog-post 2, layaway 1, unavailable-sibling 1, 404-shapes 66, gated 3, private 3, query 2; single-language-posts skipped (the one post exists in both languages). |
| Production `main` `9518974` (pre-PR) | 235 | 123 | 112 | 39 og:url rows, 41 fb:app_id rows, 27 404-hygiene rows, 2 query rows (the defects #452 fixes) + the same 3 gated rows. Consistent with the anonymous Node raw run on production (555 pass / 109 fail = 41 + 39 + 27 + 2). |

### 3b. 36-URL real-data baseline (preserved from the first gate run; same deployment, unchanged asset hash)
Homes, layaway, blog index, FAQ, 3 products, 3 collections, 3 categories and the one post in both languages, plus 9 missing-resource shapes. After mapping the preview host to the production host the only differences are the intended ones: `fb:app_id=812262777044447` added on all 27 valid pages; `og:url` added on the 21 pages that lacked it (the 6 product pages already had it); `/foo/bar` loses its canonical, og:url and `?lang=en` hreflang set. og:image (real Supabase photos and listing heroes, hashes included), og:locale, Twitter, JSON-LD block hashes, canonical, hreflang, titles, descriptions and H1 identical on every page. Sitemaps identical (976 URLs, same family counts). No English-only post exists on real data, so the Japanese-sibling-of-an-English-only-post case is not testable (skipped, not missing). The default `opengraph-image.png` URL follows the request host on the preview (expected; production uses its own host).

### 3c. Hydration (React #418), same protocol on both hosts
- Identical same-tab sequences of **48 page loads** per host in the owner's Chrome (valid templates in both languages, 404 shapes, products, collections, categories, posts, login/cart/search, gated descendants), console captured per segment and verified live with a probe message: **preview 0 events, production 0 events**; no console error of any kind on either host.
- Anonymous Node DOM checker on production (`main`), full matrix, 2 contexts, ~680 loads: **0 events**. Same checker on the preview: **not run** (blocker above).
- Local fixtures builds of the same trees still show 1 to 4 events per run (`6dc71df`: 1 to 4; `99a68c3`: 1, desktop `/en/products/x/y`). **Causality remains unresolved**; the 0/0 result under one protocol is not evidence of equivalence or of absence. OD-F1 stands.

### 3d. PR #455 (security batch 1) against its stated scope, on a fresh local build of `99a68c3`
- Scope: owner's "fix first" items W-01, W-02, W-03 and the website half of H-07 (H-01 and the Hub half of H-07 are Hub-only: `chajewels/la-tracking` PR #691, open). The remaining items of the 34 live in the owner's Notion tracker and are not part of this batch.
- W-01: GitHub advisories affecting `next@15.5.25`: GHSA-2464-fhr4-w9xw (critical, patched 15.5.28), GHSA-p3m5-59mp-jv5r (high, 15.5.28), GHSA-4jqv-mc3x-m676 and GHSA-mcj8-r9mp-w47p (medium, 15.5.27). No advisory affects 15.5.28. Lockfile: `next`/`eslint-config-next`/`@next/*` 15.5.28, `sharp` 0.35.5 (+ `@img/*`), `source-map-js` 1.2.2, `brace-expansion` 1.1.21/5.0.12, and two bumps the PR record did not list: `@typescript-eslint/*` 8.69.0 → 8.72.1 and `postcss-selector-parser` 6.1.4 → 6.1.5 (both dev-only, minor/patch). `npm audit --omit=dev`: 0 critical, 2 high (`postcss` bundled in `next`, `zod` 3), 1 moderate; as stated in the PR.
- W-02: one validator `lib/safe-next.ts` used by all five readers (grep: no other `next` reader keeps its own check). Live on the local build: `/auth/callback?next=` `/\evil.com`, `/\/evil.com`, `//evil.com`, `https://evil.com` → `next=/account`; `/checkout?mode=layaway` and `/en/products/x?a=1&b=2` kept. Observation outside the batch's scope, for the tracker: `lib/markdown.ts` and `lib/settings.ts` `safeHref` still treat `/\host` as a relative href (Hub-authored link text; not a redirect).
- W-03: only one inline JSON-LD emitter exists (`components/site/json-ld.tsx`); 6 page types render with no raw `<` and every block parses.
- H-07: `messenger_link` is validated in the form and in the Server Action; no other sender exists.
- Regression on `99a68c3`: unit 615/615, `tsc` 0, lint 0 errors / 12 warnings (same as `develop`), all 8 guards pass, production build OK, raw checker **670 pass / 0 fail**, DOM checker **682 pass / 1 fail** (the one failing row is the desktop `(errors)` row with a single React #418 event on `/en/products/x/y`), coverage complete. **#452 is preserved.**
- The branch then received a correction commit from the other review (`c1ea320`: Messenger link stored as canonical `url.href`, escape text, `422 messenger_link_invalid` in the API contract, lock note; lockfile unchanged). Re-verified at `c1ea320`: unit 615/615, typecheck 0, lint 0 errors / 12 warnings, all 8 guards pass, production build OK, raw checker 670 pass / 0 fail, DOM checker 681 pass / 2 fail (both failing rows are the `(errors)` rows: React #418, 1 desktop event on `/en/layaway`, 2 phone events on `/en/products/x/y` and `/en/sale`; every metadata, 404, private, gated, query and client-navigation row passes; coverage complete). A further one-line commit `1ac667f` (the canonical form's length is what is measured against the 200-character limit, with a test) arrived afterwards: unit 615/615, typecheck 0; it touches no SEO surface, so the checker results above stand.

## 4. Complete failures and limitations
1. Gate item (1) not satisfied as specified: both Node checkers did not run against the preview (access blocker). The substitute covered the raw matrix and the 36-URL baseline; it did not cover the DOM checker's rendered rows.
2. Three gated-descendant rows are unverifiable under a signed-in session (artefact; anonymous runs pass).
3. React #418: unresolved; reproduced on local builds of `6dc71df` and `99a68c3`; 0 observed on the preview and on production under the Chrome protocol and 0 on production under the Node DOM checker. Not waived.
4. Production checkers fail on the pre-#452 rows by design (109 raw, 172 DOM); no unexpected failure.
5. No sign-in link round trip and no product with real reviews were exercised on the preview (requires a real customer session; owner check).

## 5. What remains before production
- Owner: OD-F1 (release with #418 unresolved) or hold for the non-minified reproduction.
- Owner: decide the merge of #455 into `develop` (not authorized by this record); the resulting merge commit becomes the release candidate, to be re-checked with the same gate.
- Owner-run (or owner-supplied automation access): the fixed checkers against the develop preview; then PR `develop` → `main`, both checkers on production, Facebook Sharing Debugger per template class; Search Console: SEARCH ENGINE RECRAWL PENDING.
