# SEO Step 3 — performance findings and architecture proposals (2026-10-29)

Status: Step 3a **READY FOR QA** (PR below). Step 3b and 3c are **AUDITED**, proposals only, nothing implemented.
Not deployed. No claim is made about real-user Core Web Vitals (no field data is available yet).

## 1. Method

- Lighthouse 13.5.0 CLI, performance category, default **mobile** (Moto G Power emulation, simulated Slow 4G, 4x CPU) and `--preset=desktop`; headless Chrome on a MacBook; 3 runs per page and form factor.
- Production baseline taken against `https://www.chajewelsjp.com` (main `49c0fd6`). A/B runs were against local `next start` builds of `develop` (control) and this branch (variant), **interleaved, 7 runs each**.
- Lab numbers are simulated and noisy: production mobile scores varied by up to 15 points between runs of the same page, so medians and ranges are quoted, never single runs. Local runs are not comparable with production runs; they are only compared with each other.
- INP: no field data is available (Search Console not yet connected), and Lighthouse reports no INP; TBT is the lab proxy.

## 2. Production baseline (median of 3; range in brackets for mobile score)

| Page | Mobile score | LCP | FCP | TBT | Desktop score | Document (gz) | JS transferred |
|---|---|---|---|---|---|---|---|
| `/ja` | 61 (60–65) | 7.4 s | 5.2 s | 62 ms | 95 | 46 KB | 242 KB |
| `/en` | 86 (76–88) | 4.1 s | 1.5 s | 28 ms | 99 | 47 KB | 242 KB |
| `/en/categories/preloved-jewelry` | 88 (73–90) | 3.7 s | 1.7 s | 13 ms | 99 | 90 KB | 225 KB |
| `/en/collections/rings` | 88 (74–94) | 3.7 s | 1.9 s | 35 ms | 100 | 73 KB | 225 KB |
| product (R2715) | 78 (78) | 4.6 s | 2.6 s | 4 ms | 100 | 34 KB | 240 KB |

CLS 0.000 on every page. The Master Plan's TBT of 1.2–1.85 s was **not reproduced**; measured TBT is 4–62 ms.

## 3. Root causes, ranked by measured impact

1. **Japanese heading font slices (measured, fixed in 3a).** `/ja` makes 110 requests against 67 for `/en`; the difference is 37 Noto Serif JP unicode-range slices (568 KB) fetched during load, competing with the hero image. Blocking them on production: median LCP 6.2 s → 4.5 s, FCP 4.0 s → 2.2 s (n = 5 each, control range 61–82, so strong but noisy).
2. **Every public page is rendered per request** (3c below): `Cache-Control: private, no-cache, no-store`, `x-vercel-cache: MISS`, TTFB 0.25–0.7 s from the QA client, despite `revalidate = 60`. Not measured in Lighthouse (its server-response audit read 10–40 ms from this network); not changed.
3. **Large listing HTML (3b below):** large in raw bytes, small on the wire; measured effect on scores is small. Not changed.
4. Hero poster discovery and render delay on the home page: the poster is already preloaded with `fetchpriority=high` and the video is not fetched; the residual 0.8–1.2 s "render delay" is simulation of render-blocking CSS (3 stylesheets, 57 KB) and was not attributable to one cause. Not changed.

## 4. Step 3a — what changed (the one code change)

`components/site/jp-font-gate.tsx` (new, renders null), `app/globals.css` (one unlayered rule), `app/layout.tsx` (renders the gate when `lang === "ja"`), `tests/perf-step3-jp-font.test.mjs`.
Until window load, `--font-jp` names next/font's own metric-adjusted `Noto Serif JP Fallback`, so no slice is requested; at load the gate sets `data-jp-font` on `<html>` and the headings switch to Noto Serif JP exactly as before. The same 20 slices end up loaded in both builds (21 font requests in total); only their timing moves, to after load. English pages never render the gate. No script: headings stay in the system serif, the stack's existing fallback.

Rejected first attempt: pointing `--font-jp` at `"Hiragino Mincho ProN"` before load gave the same LCP gain but a CLS of 0.002–0.004 at the swap; the metric-adjusted fallback measured CLS 0.0000 on `/ja`, `/ja/collections/rings` and `/ja/about` (390 px, with a scroll down and back).

### Before and after (local, interleaved, 7 runs each, mobile)

| Page | Score control → variant (range) | LCP | FCP | TBT | CLS |
|---|---|---|---|---|---|
| `/ja` | 77 (67–78) → 84 (84–87) | 6.6 → 4.4 s | 1.5 → 1.5 s | 19 → 19 ms | 0 → 0 |
| `/ja/collections/rings` | 80 (79–83) → 87 (82–89) | 5.3 → 4.0 s | 1.5 → 1.5 s | 13 → 12 ms | 0 → 0 |
| `/en` (regression check) | 82 (80–84) → 82 (81–84) | 4.9 → 4.9 s | 1.5 → 1.5 s | 11 → 16 ms | 0 → 0 |

Trade-off for the owner: on a slow connection the Japanese headings are drawn in the system serif for the first moments and become Noto Serif JP when the page has loaded (previously the same swap happened, only earlier). The final typography is unchanged.

## 5. Step 3c — caching architecture findings (proposal only)

Findings (all verified in code or on production):

- Each public page, including `/en`, `/ja`, collections, categories and products, answers `private, no-cache, no-store` on production, although `app/page.tsx`, `app/products/[slug]/page.tsx` and others export `revalidate`.
- The root layout calls `headers()` twice (`generateMetadata`, `RootLayout`) and, through `getLang()` (`lib/i18n-server.ts`), `cookies()` and `headers()`. Each opts the whole tree into dynamic rendering.
- What the layout takes from them: `PATH_HEADER` (set by `middleware.ts`) drives per-path robots (`indexingFor`), the language-switcher targets (`switchTargets`) and legal-page chrome; `LANG_HEADER` (middleware-owned) and the language cookie decide the language; `x-nonce` is read for the announcement bar (only pay-card gets a nonce).
- The middleware also refreshes the Supabase session cookie, writes the language cookie, forwards the legacy-redirect header and sets the CSP; static legacy redirects are explicitly `private, no-store`, `Vary: Cookie, Accept-Language`.
- Account, cart and checkout depend on `cookies()` in their own modules (`lib/cart.ts`, `lib/session.ts`, `lib/checkout-actions.ts`); they are separate from the public pages' needs.

Why this is not in the Step 3 PR: removing the dynamic APIs from the root layout changes locale selection, robots/noindex decisions, canonical/hreflang rendering (`<SeoLinks />` is request-rendered by design), the cart-aware header and the announcement bar for every page and session state. None of that was demonstrated per page and session state here.

Proposed separate phase (own branch, owner approval first):
1. Move locale routes to `app/[lang]` params for language and path (the URL already carries both), so a locale page needs neither header nor cookie.
2. Compute robots/switch targets/legal chrome from route params in the page or layout instead of `PATH_HEADER`.
3. Move cart count, session and account state to a small client or `Suspense`-wrapped dynamic island, so the page shell can be ISR-cached.
4. Keep `private, no-store` for `/account`, `/checkout`, `/cart`, pay-card and any redirect that depends on cookie or Accept-Language.
5. Prove each step with the SEO checker, a cookie/session matrix (signed out, signed in, cart present, language cookie `en` on a `/ja` URL), CSP checks and a staged preview before production.

## 6. Step 3b — large-collection recommendation (no change in this PR)

Measured: Rings 1,260 KB raw, 83 KB gzip, 48 KB brotli; Preloved Jewelry 1,742 KB raw, 104 KB gzip, 57 KB brotli. About 53% of the raw bytes are the streamed page data (`self.__next_f`), 20–29 KB is the ItemList, 138 of 145 (Rings) product images are `loading="lazy"`. Mobile TBT is 13–35 ms and the scores are 88. The large grid is therefore **not** the measured bottleneck; the wire cost is small.

Options, against SEO and UX:
- *Do nothing now (recommended).* Every product stays server-rendered and crawlable, the ItemList equals the visible grid, sort/filter stay client-side. Re-evaluate with real-user data.
- *Slim the streamed data:* pass the grid's client component only the fields it renders (the same product list is serialized into the page twice). Same markup and ItemList; roughly halves raw HTML. Medium effort, needs a rendering-equivalence test. First candidate if a change is wanted.
- *Progressive rendering / "load more":* hides products from crawlers unless backed by crawlable URLs, and conflicts with client filters over the whole set.
- *Pagination:* creates new indexable URLs (canonical, sitemap and hreflang work, a high-risk phase), splits the ItemList, and breaks "sort whole catalog". Not recommended without a dedicated phase.
- *Virtualized grid:* removes products from the DOM and from the crawlable HTML. Not recommended.

## 7. Remaining observations
- axe (WCAG 2a/2aa, 390 px) reports `definition-list` (1) and `dlitem` (10) on `/ja`, `/en`, a collection and a category; it also appears on `/en` pages, which this change does not touch, so it predates Step 3. Not addressed here.
- Hero PNGs (collections) remain 1.3–1.8 MB; not changed.

## 8. Production follow-up (2026-10-29): scope the gate to the Japanese home page

Trigger: after the release (PR #436) matched production Lighthouse runs showed no gain, and the Japanese Rings page showed a font-induced re-wrap on desktop.

**Re-wrap, reproduced on production.** At 1440 and 1920 px the product title (`H2.pcard-name`) wraps to 3 lines in the fallback and 2 in Noto Serif JP (67 px to 45 px), moving the caption below by 22 px (CLS 0.000048, 8 of 8 loads at 1920 px; not at 1024 or 390 px). Cause measured on that title: the fallback's Latin letters (+8 px), digits (+14 px) and spaces (+5 px) are about 10% wider than Noto's, kana equal; next/font sized the fallback (`size-adjust: 121.11%`) from average character width.

**Retuning the fallback does not fix it.** Across 1,136 headings and titles (6 pages, 390 and 1440 px), mismatching wraps: 100 at 121%, 43 at 111%, 45 at 114%, 68 at 109%, 105 at 103%. 111% halves the total but makes the home page worse (0 to 9 at 1440 px, 1 to 7 at 390 px). No size-adjust removes it, so no retune was applied.

**Where the gate pays off (production, real CDP throttling 1.6 Mbps / 150 ms / 4x CPU, fresh context per load, 8 interleaved loads per arm; the "no gate" arm sets `data-jp-font` at document start, which is the pre-release behaviour):**

| Page | LCP gate (range) | LCP no gate (range) | Hero poster finished | Load event |
|---|---|---|---|---|
| `/ja` | 3.44 s (3.24–3.60) | 6.18 s (2.16–7.79) | 3.4 s vs 6.1 s | 3.4 s vs 7.0 s |
| `/ja/collections/rings` | 3.08 s (2.81–3.22) | 3.02 s (2.89–3.69) | n/a (heading is the LCP) | 3.7 s vs 5.2 s |

The Lighthouse runs on production did not show this (its simulated throttling does not model the poster competing with the font slices), and variance in the no-gate arm is large (one run 2.2 s), so the home figure is a median of 8, not a promise. On the home page the fallback matches the final font (0 of 52 headings wrap differently at 1440 px) and there was no layout shift in 16 of 16 desktop loads.

**Change.** The gate now applies to the Japanese home page only: `lib/jp-font-defer.ts` (`deferJpFont`) decides, `app/layout.tsx` puts `data-jp-defer` on `<html>` and renders the gate only then, and the CSS rule is `html[data-jp-defer]:not([data-jp-font])`. Every other page loads the font exactly as before the gate (no deferral state).

**Before and after on real Hub data (production, 1920 px; the "after" arm sets the gate attribute at document start, equal to the fix on non-home pages):** Rings 8 of 8 loads with a shift (CLS 0.000048) before, 0 of 8 after; Preloved Jewelry 0 of 5 both. Regression coverage: `tests/perf-step3-jp-font.test.mjs` and `scripts/check-jp-font-live.mjs` (`npm run check:jp-font`, real browser, 390/1440/1920 px; 35 checks pass on the fix build with fixtures). The listing-page layout-shift checks only fail against real Hub titles, so run the script against a real-Hub deployment after release.

**Language switcher (checked, no change).** 36 of 36 scenarios pass on production (mobile and desktop, clean and returning-cookie sessions, home, collection, category, product and English layaway): the link goes to the sibling URL, `html lang`, canonical and the `cj-lang` cookie follow, hreflang has 3 entries, English layaway switches to the Japanese home page (no Japanese layaway). The desktop control is the visible "EN" / "日本語" link; the aria-labelled "言語" link is the mobile one and is hidden on desktop, which is why an earlier automation click on it timed out.

**Not verified.** Android and Windows system fonts (only Mac available); the fallback widths measured here are for Hiragino Mincho and Times New Roman. Real-user data.
