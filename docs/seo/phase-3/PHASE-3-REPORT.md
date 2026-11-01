# SEO Phase 3 — Layaway indexing (`/en/layaway`)

**Status:** READY FOR QA (implemented and locally verified on a production build; not merged, not deployed; nothing is claimed indexed).

> **Record label (2026-11-01 reconciliation):** this is the implementation report as of 2026-10-29. The phase was later released: `/en/layaway` is DEPLOYED and OBSERVED IN SEARCH CONSOLE (2026-10-30) per `SEO-IMPLEMENTATION-STATUS.md` and the register (R-12). Nothing below is edited.
**Plan:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` §12 and "PHASE 3"; `docs/seo/SEO-MIGRATION-MAP.md` §6 (layaway rule), §9 F (the Option ii link exception this phase ends), OD-6, OD-7.
**Branch:** `seo/phase-3-layaway-indexing` (from `develop` `4dc3c23`).
**Prerequisites in production (Phase 2 handoff, STATUS.md):** locale routes, localized navigation, localized sitemap, temporary 307s, `gateLang`/OD-15. All present in `main` `7aac136`.

## What the plan required and what exists now

| Requirement (plan §12 / Step 2) | Done | Where |
|---|---|---|
| Crawlable permanent URL `/en/layaway`, HTTP 200 | Yes | `app/[lang]/layaway/page.tsx` (thin wrapper, same pattern as every locale route) |
| Self canonical | Yes | `localizedMeta(() => "/layaway", ownMeta, () => LAYAWAY_ELIGIBILITY)` |
| Correct hreflang: `en` + x-default (English), **no `ja`** | Yes | `LAYAWAY_ELIGIBILITY` in `lib/layaway-availability.ts`, derived from `layawayOffered` |
| English SEO title and description | Yes | `dict.meta.layaway` (title "Jewelry layaway in Japan: 30% deposit, 0% interest"; description 150 chars). The `ja` strings exist for key parity only and are gated (`check:layaway-ja`) |
| Unique H1 (not the homepage band's heading) | Yes | `dict.layawayPage.h1`; the homepage band keeps `home.layH` |
| Layaway explanation and current terms | Unchanged, preserved | The three-step stage and the owner's published terms copy (`home.lay*`). No figure is computed here |
| Working calculator | Unchanged, preserved | `LayawayPiecePicker` / `LayawayCalculator`, every figure a Hub quote |
| FAQ | Yes | The Hub FAQ's `payments-and-layaway` section, narrowed to questions that mention layaway, through the same `getFaq()` the `/faq` page uses (one source); FAQPage JSON-LD for exactly the questions shown; link to the full section |
| Internal links | Yes | FAQ section, Shopping Guide, Jewelry Guide, Why Cha Jewels, Collections, product cards |
| Product examples | Unchanged, preserved | "Pieces you can reserve today" (real reservable pieces with Hub down payments) |
| Sitemap inclusion after route validation | Yes (second commit) | `app/sitemap.ts` lists `/en/layaway` once, built from `LAYAWAY_LANGS` × `localePath`, so a Japanese entry is impossible by construction |
| Repoint the Option ii exception links | Yes | header (`L("/layaway")` → now `/en/layaway` because the family is live), phone tab bar (`localePath`), `/account/layaway` link (`localePath`), Why Cha Jewels (already `localePath`), Hub-authored `/layaway` links (`localizeAuthoredHref`) |
| Remove the bare-`/layaway` cookie dependency | Yes | `lib/layaway-language-sync.ts`, `components/site/layaway-language-sync.tsx` and their test removed (PR #410's interim mitigation; nothing links to the bare URL any more) |

## What is deliberately unchanged

- **Bare `/layaway`:** still cookie-decided (200 for an English request, 404 otherwise), still excluded from `lib/legacy-redirect.ts`. **OD-6 (redirect the bare URL to `/en/layaway`) is NOT approved and NOT implemented.** The redirect test now pins that `/layaway` is the one `app/[lang]` page absent from `STATIC_PAGES`.
- **No `/ja/layaway`:** the wrapper cannot produce one (`localizedMeta` returns `{}` for `ja`; the page itself `notFound()`s). Verified 404 with no canonical/hreflang element.
- Layaway terms, Hub money calls, checkout and payment logic: untouched (no file under `lib/checkout-actions.ts`, `lib/layaway.ts`, `lib/card*.ts` changed). `check:money` green.
- Layaway-only blog posts remain unlisted in the sitemap (a separate decision; none exist in production today).
- The language switcher on `/en/layaway` offers `/ja` (home), never a Japanese layaway page (OD-7, verified in the browser).

## Side fix (needed by this phase, affects other pages)

`components/site/messenger-button.tsx` compared the raw `usePathname()` with bare paths, so under the Phase 2C locale URLs (`/en/products/…`, `/ja/collections/…`) the Messenger button never matched its allow-list. It now compares `stripLocale(path)`. This restores the button on locale product/collection/category/cart/checkout/loyalty/wholesale pages and makes it appear on `/en/layaway`. Owner note: this is a behaviour restoration, verified visually on `/en/layaway`; please confirm it on a product page in the preview.

## Tests and checks (run on this branch, 2026-10-29)

| Check | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | 0 errors (pre-existing `errorLight` warnings only) |
| `npm run test:unit` | **478 pass / 0 fail** (new `tests/seo-layaway-route.test.mjs`: 9 tests; updated: locale, locale-nav, switch-targets-route, legacy-redirect, seo-sitemap, od11-authored-links; removed: layaway-language-sync) |
| `check:terms`, `check:money`, `check:i18n` (incl. `check:layaway-ja`, 31 gated keys), `check:analytics`, `check:cutouts` | all pass |
| `npm run build` (fixtures) | clean; `ƒ /[lang]/layaway` route present |
| `scripts/check-seo-live.mjs http://localhost:3000` | **208 pass / 0 fail / 0 deferred** (new layaway block: 200, no noindex, self canonical, `en`+`x-default` only, one H1, FAQPage, links; `/ja/layaway` 404 tagless; sitemap lists `/en/layaway` exactly once) |
| HTTP matrix | `/en/layaway` 200 (also with a `ja` cookie: URL-authoritative); `/ja/layaway` 404; `/layaway` 404 (no signal) / 200 (`?lang=en` or `en` cookie) — unchanged |
| Browser (Playwright, 1280 px and 375 px) | renders; H1 once; calculator, picker, FAQ accordion, link block, Messenger button, Layaway tab active; switcher → `/ja`; 0 console errors (one pre-existing site-wide logo-preload warning) |
| Japanese pages (`/ja`, `/ja/faq`, `/ja/why-cha-jewels`, `/ja/shopping-guide`) | 0 layaway hrefs (the one `#payments-and-layaway` on `/ja/faq` is the Hub section's anchor slug, pre-existing) |

Not run: production Rich Results Test (needs the deployed URL), Search Console submission (owner, after deployment).

## Owner decisions

| # | Decision | Recommendation |
|---|---|---|
| P3-1 | Approve the new public route `/en/layaway` and the sitemap entry (route-change rule) | Approve: it is the master plan's §12 first goal |
| P3-2 | Title/H1/description wording (`dict.meta.layaway`, `dict.layawayPage.h1`) | Reword freely; the 150-char limit and "no computed figures" rule should stay |
| P3-3 | OD-6: bare `/layaway` → 308 `/en/layaway` | Not in this PR. Recommend (a) from the map after `/en/layaway` is production-verified and observed in Search Console |
| P3-4 | Whether layaway-only blog posts should be listed at `/en/blog/…` | Not in this PR |
| P3-5 | Messenger-button locale fix (side effect above) | Accept, or ask for it as a separate PR |

## Deployment requirements

1. Owner review of this PR; Vercel preview QA on the `-git-seo-phase-3-layaway-indexing-` branch alias: `/en/layaway` 200 + self canonical; `/ja/layaway` 404; every English chrome "Layaway" link → `/en/layaway`; the two-tab case (English tab, cookie switched to `ja` in another tab) now resolves because the URL decides.
2. Merge to `develop`, then release `develop` → `main`.
3. After deployment: `node scripts/check-seo-live.mjs https://www.chajewelsjp.com`; Rich Results Test on `/en/layaway` (FAQPage); request indexing in Search Console (owner). Status then becomes SEARCH ENGINE RECRAWL PENDING.
