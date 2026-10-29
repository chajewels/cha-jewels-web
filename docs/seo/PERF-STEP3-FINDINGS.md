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
