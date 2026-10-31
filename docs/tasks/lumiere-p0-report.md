# Lumière redesign — P0 scan & report (rev. 2, owner-reviewed)

Status: AUDITED · rev. 2 (correction batch, 2026-11-01) · Branch `redesign/lumiere-p0-report` → PR #459 into `redesign/lumiere` · No website code written.
Rev. 1 (2026-10-31) was the scan; this revision records the owner's review: facts corrected (§1a), decisions marked APPROVED / RESOLVED / AWAITING OWNER (§12), and the missing pieces added — sync rule (§0), copy-fit table (§13), short category names (§14), placeholder-guard scope (§9), asset error banner (§9a), QA plan (§15), measured performance baselines (§10, `docs/perf-baseline.md`).

Sources: this repo at `ea469c4` (merged with `origin/develop` `2d7579d`, PR #458 included), `~/Downloads/lumi-re` (read-only), the master prompt, npm registry metadata and tarballs, Next.js and Lenis docs (Context7), live production HTML/headers, Lighthouse 13.6 CLI runs (production and a temporary build of the reference), and browser measurements of every proposed line in the real fonts (§13).

**All items are APPROVED or RESOLVED.** The owner approved the copy-fit table (§13) and the short category display names (§14) on 2026-11-01 ("Approve all recommended" = the reviewer's five fixes plus the rest as proposed; this revision corrects commit `a7640a6`, which had recorded the pre-review wording), including the smaller Japanese sizes (headline 56 u, collections heading 56 u / 28 px phone, card titles 44 u, pill strip 100 u) and the wider card-note widths (9 em EN / 10 em JA). P1 may start on the owner's word.

---

## 0. Sync rule (owner, 2026-11-01)

`redesign/lumiere` was 5 commits behind `origin/develop` (PR #458, the React #418 hydration-replay fix). Merged `origin/develop` into `redesign/lumiere` (merge commit `5aa346f`, no conflicts, 7 files: 5 docs + `scripts/react-hydration-replay-fix.cjs` + `tests/react-hydration-replay-fix.test.mjs`), pushed; then merged `redesign/lumiere` into `redesign/lumiere-p0-report` (`ea469c4`), pushed, so PR #459 is current.

**Rule for every phase:** before creating `redesign/lumiere-pN-<slug>`: `git fetch`; on `redesign/lumiere` merge `origin/develop` (merge commit, never squash or rebase); any conflict is reported and the phase waits — nothing is resolved by guessing; push `redesign/lumiere`; then branch. The SEO/acceptance session (`cha-jewels-web-bd`) works on `develop` in parallel and touches header, footer and home files; the redesign never edits `develop` and absorbs its changes at each sync.

Files most at risk of conflict (changed on `develop` in the last 21 days, most-touched first): `lib/i18n.ts` (23 commits), `app/layout.tsx` (12), `app/globals.css` (8), `components/site/header.tsx` (5), `components/site/footer.tsx` (4), `components/home/hero-slide-views.tsx` (4), `components/home/story-show.tsx` (4), `components/catalog/catalog-section.tsx` (7), `components/catalog/catalog-grid.tsx` (5), `app/products/[slug]/page.tsx` (10), `app/blog/[slug]/page.tsx` (9), `app/categories/[slug]/page.tsx` (6), `app/collections/[slug]/page.tsx` (5), `app/jewelry-guide/page.tsx` (6), `app/shopping-guide/page.tsx` (4), `lib/locale.ts`, `lib/hub-api.ts`, `lib/types.ts`, `lib/markdown.ts`, `lib/page-meta.tsx`, `lib/seo-policy.ts`, `scripts/check-contrast.mjs`, `tests/**`. SEO-owned files (`app/sitemap.ts`, `lib/json-ld.ts`, `scripts/check-seo-*.mjs`) are never edited by the redesign, so they only flow one way. Mitigation in P3/P4: the redesign puts new chrome in new files (`components/lumiere/**`, `app/lumiere/*.css`) and changes the existing header/footer/home files only at the import line, so a `develop` edit to those files merges with at most one small conflict.

## 1. Library compatibility — Next 15.5.28 / React 19.2.8 / Tailwind 3.4.19 (unchanged from rev. 1)

| Package | Pin | Peer deps (npm registry) | Verdict |
|---|---|---|---|
| `three` | `0.186.1` | none; `type: module`, exports `.`, `./addons/*`, `./examples/jsm/*` | OK on webpack 5 (this repo's `next dev`/`next build` do not use Turbopack). |
| `three-mesh-bvh` | `0.9.17` | `three >= 0.159.0` | OK. |
| `@types/three` | `0.186.0` | — | OK (dev). |
| `lenis` | `1.3.23` | `react >=17` (optional, `lenis/react` only) | OK. `autoRaf` default `false` (Lumière's own rAF is correct); `respectReducedMotion` default `true`. |
| `@react-spring/web` | `10.0.3` | `react ^16.8 \|\| ^17 \|\| ^18 \|\| ^19` | OK. |
| `spring-text-engine` | `0.1.5` | `@react-spring/web >=9`, `react >=17`; dep `resize-observer-polyfill` | OK. `"use client"`; letters split by `split("")` (UTF-16 code units), words by ASCII space — see §5. |
| `zustand` | `5.0.16` | `react >=18` | OK (scroll/preload stores). |
| `resize-observer-polyfill` | — | — | Never imported in Lumière `src/`; not added. |

EXR worker = same-origin bundled module worker (`new Worker(new URL(…, import.meta.url))`, documented webpack 5 support); Meshopt decoder instantiates inline WASM (`WebAssembly.instantiate`, confirmed in the tarball) → CSP `'wasm-unsafe-eval'` (§4). Nothing needs Next 16, React Compiler, `images.qualities` or `proxy.ts`. **No framework upgrade; no STOP condition.**

### 1a. Fact corrections (owner review)
- **Company name — RESOLVED.** The registered name is the one in `lib/content/legal.ts`: `COMPANY_NAME` = `Ｃｈａ　Ｊｅｗｅｌｓ株式会社` (fullwidth Latin, never normalised), `COMPANY_NAME_DISPLAY.en` = "Cha Jewels Co., Ltd. (Ｃｈａ　Ｊｅｗｅｌｓ株式会社)". The spec's 株式会社チャジュエルズ was an error; `docs/tasks/lumiere-redesign.md` §5 is corrected in this PR.
- **Corporate number — RESOLVED.** 法人番号 **7011801044120** (the invoice registration number `T7011801044120` is "T" + the corporate number). P3 adds `CORPORATE_NO = "7011801044120"` to `lib/content/legal.ts` and the footer company block shows it (JA 法人番号 / EN "Corporate number") next to the invoice registration and the secondhand-dealer permit.
- **Hero headlines are existing copy, not new.** "Timeless beauty to wear." / 「身につける、時を超える美しさ。」 and "Lasting value to pass on." / 「受け継がれる、確かな価値。」 are `hero.h1a` / `hero.h1b` in `lib/i18n.ts`. Only their line breaks (and the dropped comma in the JA photo line) are new — §13.
- **Sign-in on the preview — no action.** The Supabase redirect allow-list wildcard `https://cha-jewels-web-*-cha-jewels.vercel.app/**` already covers the branch alias `https://cha-jewels-web-git-redesign-lumiere-cha-jewels.vercel.app`. Sign-in is tested only from that alias (CLAUDE-DETAILS "Sign-in"). Nothing is added to the allow-list.

## 2. Lumière tokens → Tailwind 3.4 translation plan (unchanged from rev. 1)

Lumière is CSS-first Tailwind 4; ~2,600 of its 3,402 CSS lines are plain BEM (`.collections*`, `.featured*`, `.philosophy*`, `.footer*`) that port verbatim. Translation table:

| Lumière construct | Tailwind 3.4 equivalent |
|---|---|
| Tier-1 `--raw-*` + Tier-2 semantic vars with all breakpoint overrides | `app/lumiere/tokens.css` verbatim (media-block order preserved; `--raw-unit-design` floors identical to `hero.config.ts`). |
| `@theme inline` colours / fonts / paired type tokens / radii / tracking / easings | `theme.extend` (`colors`, `fontFamily`, `fontSize` tuples `[var(--type-x), var(--type-x-leading)]`, `borderRadius`, `letterSpacing`, `transitionTimingFunction`, `lineHeight.display`). |
| `--spacing: var(--step)` rebind (`left-40`, `top-29`, `w-350`, `gap-48`…) | Cannot rebind globally. Prefixed design-unit scale generated in `tailwind.config.ts` (`left-u-40` = `calc(40 * var(--raw-unit-design))`). |
| `@utility inset-safe`, `min-h-stage` | `@layer utilities` in `app/lumiere/utilities.css` (`snap-strip` unused, dropped). |
| `block!`, `inline-block!` | `!block`, `!inline-block`. |
| `min-[930px]:`, `size-*`, `h-svh`, `min-h-lvh` | Valid in 3.4 as is. |
| `text-wrap: pretty`, container queries (`cqh`), `color-mix()` | Plain CSS, unchanged. |
| `prefers-color-scheme: dark` override | Dropped (D-12 APPROVED). |
| `next/font/local` | Same API in Next 15 (`src[]`, `variable`, `display`, `preload`, `adjustFontFallback`, `declarations`). |
| `html { font-size: …vw }` rem grid + `<AdaptiveGrid>` | Not ported (D-11 APPROVED; §3.1). |

## 3. Coexistence: rem grid, Lenis, existing pages, dialogs, checkout, Paidy (unchanged from rev. 1, decisions applied)

**3.1 Rem grid — not ported (D-11).** Lumière's five sections size from `--raw-unit-design`, not rem; this repo mixes px literals and rem utilities, so a vw root font-size would shrink rem utilities to 78 % at 800 px and jump to 178 % at 640 px. `--raw-text-display-fluid`'s `2.25rem` floor becomes `36px`.

**3.2 Lenis.** Window-scrolling instance (`smoothWheel: true, wheelMultiplier: 0.65`), own rAF on the shared ticker, native scroll position still moves so `scrollY`, `getBoundingClientRect`, IntersectionObserver, sticky and `scrollIntoView` keep working. Actions: remove `html { scroll-behavior: smooth }` (`app/globals.css:6`), route anchors through `lenis.scrollTo`; one `lib/scroll-lock.ts` (`lenis.stop()` + overflow hidden) for the four `body.style.overflow` lockers (`mobile-nav`, `search-box`, `layaway-piece-picker`, `catalog-grid` filter sheet); `data-lenis-prevent` on every inner scroll container (drawer body, search sheet, picker, filter sheet, mega-menu panels, product-gallery strip, faq-nav list, gallery viewer, Paidy widget wrapper); HeaderShell's `--hdr-h` contract kept so sticky consumers keep working. **Scope (D-13 APPROVED): Lenis is not mounted on `/checkout/**`, `/account/**`, `/login`, `/auth/**`.** Reduced motion: Lenis is not created at all; springs rest; posters shown.

**3.3 Preloader vs the existing LCP rule (`fx/boot-marker.tsx`).** Home only, first visit per session, **hard cap 4 s** (D-9 APPROVED); 3D keeps loading behind the posters after the curtain lifts (the scenes' `fade` springs already do this). Inner pages keep the "nothing above the fold starts hidden" marker.

## 4. Exact CSP change (`lib/csp.ts`, report-only policy only)

```
script-src  'self' 'unsafe-inline' 'wasm-unsafe-eval' [existing hosts…]
worker-src  'self'
```
`'wasm-unsafe-eval'` for the Meshopt decoder; `worker-src 'self'` names the same-origin EXR worker explicitly (today it would pass through the `script-src 'self'` fallback). `connect-src 'self'` already covers `.exr`/`.glb` fetches; `img-src blob:` covers any object-URL textures; shaders are inline strings. **Pay-card enforced policy untouched** (no 3D, no Lenis there). Tests: `tests/csp.test.mjs` gains three assertions (both tokens present in report-only, `'wasm-unsafe-eval'` absent from pay-card). No third-party origin is added. Live check note: `curl` saw no CSP headers on `/` on 2026-10-31 (UNVERIFIED cause; `tests/csp.test.mjs` asserts they are set) — re-check on the preview in P1.

## 5. Japanese typography plan (unchanged, with measurements from §13)

1. EN display = Instrument Serif; JA display = **Noto Serif JP 500** (Mincho, already loaded as `--font-jp`) with Latin fragments falling to Instrument Serif via font-family order. D-14 APPROVED: Playfair Display + Inter are replaced by Instrument Serif + Manrope (+ Inter Tight) at P3; Noto Serif JP stays.
2. No italics on JA (`runsFor(lang)` strips `italic`); JA lines open on a roman glyph.
3. Letter reveals: JA strings are one "word" to the engine, animated per code unit; guard surrogate pairs through `Intl.Segmenter` (reuse `fx/split-text.tsx`'s segmenter); every JA display line is a named `LetterReveal`; `wrap` mode is EN-only, so JA taglines are named lines (§13). Centre-direction lines split at a run boundary (the `。`) for JA, not at the letter midpoint, so phones never show 「確かな素材。明 / 確な情報。」.
4. `:lang(ja)` rules: `text-transform: none; letter-spacing: 0` on Lumière's uppercase utility labels; JA labels from `lib/i18n.ts` only (`check:i18n`).
5. JA font deferral stays on `/ja` until P5 (D-15 APPROVED).
6. Inter Tight subset to Latin (`pyftsubset`, ≈105 KB → ≈25 KB).
7. Cap-trim ratio 0.88 for JA display lines; leading ≥ 1.1.
8. **JA display sizes (from §13 measurements):** hero headline 56u (EN 82u), collections heading 56u (EN 64u; phone 28 px), card titles 44u (EN 48u), card index line 18u (14 px on phones), philosophy lines stay 64u (all JA lines fit at 64u). Category pill strip 100u for JA (EN 85u).

## 6. File-by-file port list (unchanged from rev. 1)

Legend: P = port verbatim, A = adapt, N = not ported, R = replaced by ours.

| Lumière | → | Mode |
|---|---|---|
| `src/app/fonts.ts` + woff2 | `app/fonts.ts`, `public/lumiere/shared/fonts/` | A (Inter Tight subset) |
| `globals.css` tokens / BEM blocks / `@utility` | `app/lumiere/{tokens,blocks,utilities}.css` | P |
| `globals.css` rem grid, `components/common/grid/*`, `use-adaptive-grid` | — | N |
| `layout.tsx` (`ScrollLayout`, `ReducedMotion` only) | `app/layout.tsx` merge | A |
| `proxy.ts`, `robot-view/*`, `bot-ua.ts`, `robot-view.tsx`, `robot-text.tsx` robot branch, `types/robot-view.d.ts` | — | N |
| `robots.ts`, `sitemap.ts`, `lib/site.ts`, `utils/seo/*`, `privacy-policy/*`, `views/legal/*`, `mocks/legal.ts`, `api/contact`, `lib/api`, `env.ts`, `cookie/*` | — | N / R |
| `utils/design-unit.ts` | `lib/lumiere/design-unit.ts` | P |
| `layouts/scroll-layout.tsx`, `use-scroll.ts` | `components/lumiere/scroll-layout.tsx`, `lib/lumiere/scroll-store.ts` | A (path allow-list, reduced-motion skip, scroll-lock bridge) |
| `lib/animation/{ticker,doc-box,smooth-scroll-y}` | `lib/animation/*` | P |
| `hooks/animation/*`, `use-scroll-progress`, `use-in-view`, `use-window-size` | `hooks/**` | P (`use-scroll-progress` onto doc-box in P5) |
| `stores/preload-store.ts` | `lib/lumiere/preload-store.ts` | P |
| `common/{letter-reveal,text-swap,preloader,reduced-motion,warm-below-fold}` | `components/lumiere/common/*` | A (session-once 4 s cap, Cha logo plate, JA segmenter) |
| `utils/scroll-to.ts` | `lib/lumiere/scroll-to.ts` | A (`lenis.scrollTo`) |
| `lib/scene/**` (device, presets, ready gates, gem material, pendant scene, studio env, HDRI, EXR worker, rings scene) | `lib/scene/**` | P (shaders and presets character for character; URLs → `/lumiere/**`) |
| `views/home/hero/*` (20 files) | `components/lumiere/hero/*` | P geometry/motion + A content; `hero-header.tsx` replaced by the P3 site header |
| `views/home/collections/*` | `components/lumiere/collections/*` | P + A (5 cards, D-8) |
| `views/home/featured/*` | `components/lumiere/featured/*` | P + A (placeholders, "¥ —", disabled Add to cart) |
| `views/home/philosophy/*` | `components/lumiere/philosophy/*` | P + A (§13 lines) |
| `views/home/footer/*` | `components/site/footer.tsx` rebuilt | A / R (`subscribe-form` → our `newsletter-form`) |
| `data/mocks/*` | `lib/lumiere/placeholders.ts` + `lib/content/lumiere-home.ts` | A |
| `public/assets/**`, `models/**`, `env/hotel-room.exr` | `public/lumiere/placeholder/**` and `public/lumiere/shared/**` (§9) | P (PNG masters re-encoded) |
| `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.cursorrules`, `obsidian/`, `assets-source/`, root `hero-*.jpg`, `yarn.lock`, `.vercel/`, configs | — | N |

## 7. Route-by-route restyle list (unchanged from rev. 1; decisions applied)

| Route(s) | Phase | Reference | Notes |
|---|---|---|---|
| `/`, `/[lang]` | P2 | Lumière home + Cards Almanac (layaway steps, testimonials), Carousel Spotlight (new arrivals), Colonnade (why/services), Brewns (calculator digits) | Order: preloader → hero → collections (2×2 + full-width fifth, D-8) → featured → philosophy → new arrivals → testimonials → layaway band + calculator (EN) → **loyalty band (new, D-21 APPROVED)** → footer. Values copy folds into philosophy/why columns. |
| every page (header, footer, announcement bar, Messenger FAB, consent banner, mobile tab bar, flash notice) | P3 | Lumière header/footer; Halden recolouring header + giant footer wordmark | Desktop labels left of the logo: **Collections · Blog · About · Layaway (EN) / Jewelry Guide (JA)** (D-18 APPROVED); everything else in the Collections/Company panels and the full phone menu. **Mobile tab bar kept, restyled (D-19 APPROVED).** |
| `/collections`, `/collections/[slug]`, `/categories/[slug]`, `/sale`, `/search` | P4 | Halden | Filter sheet → pills; `/search` stays noindex; JSON-LD/breadcrumbs untouched. |
| `/products/[slug]` | P4 | Herbier Blanc + Brewns card lean; Aerra turntable later | All commerce components kept; **3D-free** (D-4). |
| `/about`, `/why-cha-jewels`, `/affiliations` | P4 | Aerra + Colonnade | |
| `/blog`, `/blog/[slug]` | P4 | Lumière type | Comments, share bar, BlogPosting JSON-LD kept. |
| `/faq`, `/jewelry-guide`, `/shopping-guide` | P4 | Lumière type; Colonnade | Sizers and FAQ JSON-LD kept. |
| `/layaway` (EN), `/loyalty`, `/loyalty/join` (gated), `/wholesale` | P4 | Cards Almanac, Brewns, Colonnade | Tier medallions kept (D-20). |
| `/legal/*` | P4 | Restrained Lumière type | Company block per §1a. |
| `/contact` | P4 | Lumière forms | |
| `/cart`, `/cart/restore` | P4 | Lumière + Brewns | |
| `/checkout/**` | P4 | Lumière forms, no Lenis | Agreement gates, 501 card contract unchanged. |
| `/account/**` | P4 | Lumière forms/tables, no Lenis | Pay-card CSP untouched. |
| `/login`, `/auth/*`, `/already-registered`, `/review/[token]`, `/receipts/verify`, unsubscribe pages | P4 | Lumière forms | noindex flags kept. |
| `not-found`, `error` | P4 | — | |
| `robots.ts`, `sitemap.ts`, `opengraph-image`, `app/api/*` | never | — | |

## 8. Where every Cha Jewels detail lands (rev. 1 table with the owner's decisions applied)

| Detail | Lands in Lumière |
|---|---|
| Logo | **D-3 APPROVED:** `public/images/brand/logo-badge-{96,192,512}.webp` badge + "Cha Jewels" in Instrument Serif in the header, preloader and footer wordmark slots; the inverted/footer state uses the same `brightness-0 invert` filter. Owner may supply an SVG later (drop-in). |
| JA/EN toggle | Header right group, JA first, roll-hover label; same `lang-switcher.tsx` logic. |
| Nav | Desktop left labels per D-18; Collections (Hub collections + 5 categories + MenuStory) and Company panels restyled as cream Lumière panels; phone burger menu lists every existing link; mobile tab bar kept (D-19). |
| Sign-in, cart count | Server-side as today; "Cart (n)" live; `CartBump` kept. |
| Search | Halden full-screen overlay on the existing combobox (`/api/search`, `/search`). |
| Announcement bar | Thin ink band above the fixed header; `--announcement-h` kept. |
| Messenger button | Same paths, Lumière pill. |
| Hero copy | §13 rows 1–6 (existing `hero.h1a/h1b`, `hero.lede`, `home.valuesP`, `hero.cta1`). |
| Category index + collections block | 5 pills (`categoryStops` `[0, .096, .192, .288, .384]`, pitch 42) with §14 short names; 2×2 cards + full-width fifth (D-8); notes = `CATEGORY_BLURB`. |
| Featured | Stage and 3D unchanged; placeholders with **"¥ —" price pills, Add to cart disabled while placeholder** (D-7 APPROVED). |
| Philosophy | §13 rows 17–27 from `about.ts` / `why` / `valuesP` / `colsP`; "About us" pill → `/about`. |
| Testimonials / New arrivals / Layaway band + calculator / Loyalty band | Cards Almanac / Carousel Spotlight / Cards Almanac + Brewns digits (`layawayQuote` unchanged, `layawayOffered(lang)`) / new band → `/loyalty` (D-21). |
| Footer | Hub `social.follow` (FB, Messenger, WhatsApp, LINE, email), `footer.tagline`, company column (§1a incl. 法人番号), payment marks, existing newsletter action, legal links, "© {year} Cha Jewels Co., Ltd. / Ｃｈａ　Ｊｅｗｅｌｓ株式会社", Cookie settings. |
| Consent banner | Logic untouched, Lumière card styling. |

## 9. Placeholder guard (scope made explicit)

1. **Registry** `lib/lumiere/placeholders.ts`: `PLACEHOLDER_ROOT = "/lumiere/placeholder/"`; typed, `placeholder: true as const` objects for **every** Lumière asset that must leave before production:
   - hero: `card-01…08`, **the emerald pendant `pendant-emerald.glb` and its two posters `pendant-emerald.webp` / `pendant-emerald-compact.webp`**;
   - collections: `rings/necklaces/earrings/bracelets` photos (used until the five categories get Cha photos);
   - featured: **the five ring models `ring-01…05.glb`, their five posters `ring-01…05.webp`, the five product photos `photo-ring-01…05`**, the names Trinity/Solace/Aurum/Verdant/Tidal, the materials rows and the "¥ —" price state;
   - philosophy: `backdrop-frame`, `backdrop-frame-412`, `hand-with-ring`.
   **Shared, non-placeholder** (stay in production): fonts, `paper` texture, `env/hotel-room.exr` (the studio the stones reflect — it is not visible as an image), under `public/lumiere/shared/**`.
2. **`scripts/check-placeholders.mjs`** (`npm run check:placeholders`): scans `app/ components/ lib/ public/` for imports of `lib/lumiere/placeholders` and the literal `/lumiere/placeholder/`; lenient by default (count + pass), **strict** (fail on any hit) when `VERCEL_ENV === "production"` or `--strict`; self-tests `MUST_CATCH` / `MUST_PASS` like `check-money.mjs`.
3. **Runtime belt**: `placeholders.ts` throws at import when `process.env.VERCEL_ENV === "production"`, so a production build that still references it fails in `next build`.
4. **CI (D-17 APPROVED)**: `ci.yml` `pull_request.branches` gains `redesign/**` (lenient); a `check:placeholders --strict` step runs when `github.base_ref` is `develop` or `main`.
5. `prebuild` runs the strict check only when `VERCEL_ENV=production`; previews never block.

### 9a. Asset error banner
The master prompt's fixed red banner that names each failed asset URL (model, EXR, image) is ported as `components/lumiere/common/asset-banner.tsx` and **renders only when `process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"`** (preview and local). In production a failed asset fails silently to its poster: the scene `catch` marks the ready gate, the poster stays, nothing is drawn, one `console.error` line.

## 10. Performance plan and measured baselines

Full tables and method in `docs/perf-baseline.md` ("2026-11-01 — Lumière redesign P0"). Lighthouse 13.6 CLI, mobile, simulated Slow 4G, three runs, median (range).

| Production page (mobile) | Perf | LCP | TBT | CLS |
|---|---|---|---|---|
| `/ja` | 81 (42–82) | 4.31 s | 45 ms | 0 |
| `/en` | 82 (57–83) | 4.29 s | 91 ms | 0 |
| `/en/collections/rings` | 83 (77–87) | 4.40 s | 52 ms | 0 |
| `/en/products/p2926-pendant-pt900-…` | 86 (84–87) | 3.94 s | 39 ms | 0 |

| Production page (desktop, `--preset=desktop`) | Perf | LCP | TBT | CLS |
|---|---|---|---|---|
| `/ja` | 97 (95–97) | 0.92 s | 0 ms | 0 |
| `/en` | 98 (97–98) | 0.91 s | 0 ms | 0 |
| `/en/collections/rings` | 99 | 0.93 s | 0 ms | 0 |
| `/en/products/p2926-pendant-pt900-…` | 99 (98–99) | 0.89 s | 0 ms | 0.015 |

Lumière reference, real-visitor view (normal UA, preloader on, local `next start`, isolated runs): **mobile 72, LCP 5.94 s, TBT 255 ms, max-potential FID 288 ms, CLS 0**; desktop 92, LCP 1.40 s, TBT 128 ms — already behind production's desktop bar (LCP < 1 s, TBT 0), so the gate applies to both form factors. The owner's "310 ms input delay" reproduces (280–303 ms). Lumière's vault figure (85–87 / 2.15 s) is not what a visitor gets with the curtain and the PNG masters.

**The bar:** each redesigned route must match the production rows above, mobile and desktop (lab), and, at P5, Speed Insights INP. Plan, in order: (1) re-encode the 28 MB of PNG masters to ≤ 6 MB of WebP/JPG sources at ≥ 1440 px long side (card-08 2.65 MB → ~250 KB; `logo.png` and `paper.png` 2.4 / 2.0 MB → < 100 KB), `quality={82}` on the two full-bleed photos, one `fetchPriority="high"`; (2) zero layout reads in the rAF: all per-frame geometry from `doc-box`, HeaderShell and `use-scroll-progress` on the shared ticker; (3) pendant build after the curtain's fonts/images settle, `yieldTask()` between PMREM / BVH / compile like the rings, rings 4 s after the curtain; **phones keep the live 3D on Lumière's mobile budget (D-10 APPROVED)**, posters only when `navigator.connection.saveData`, `navigator.deviceMemory ≤ 4`, no WebGL2, or reduced motion; (4) Inter Tight subset; (5) one rAF for ticker + Lenis + springs, `set()` for scroll stages; (6) preloader session-once, 4 s cap; (7) P5 gate = same four URLs, same method, three runs, plus INP field data; revisit D-10 only if the gate fails.

## 11. Risks (updated)

1. **DESIGN.md supersession (D-4 APPROVED)** — resolved by `DESIGN-LUMIERE.md` written in P1: replaces DESIGN.md's visual rules on this branch (Lumière palette with **no orange accent**; pill buttons; frosted panels; pinned/scrubbed sequences allowed), keeps its accessibility, contrast-ledger, terminology and layout-safety rules, and is referenced from `CLAUDE.md` so future sessions do not flag the redesign as violations. Product pages and cards stay 3D-free until Cha Jewels originals have models; the home featured stage is the one 3D exception.
2. Scroll regressions in transactional flows — Lenis off there (D-13); `lib/scroll-lock.ts`; dialog keyboard/scroll tests in P4.
3. Japanese in a Latin engine — §5 and §13; JA fidelity reviewed at 375 px on every PR.
4. Mobile TBT/INP with live 3D on phones (D-10) — the reference measures 255 ms TBT / 288 ms max-FID; the plan's steps (1)–(3) must bring it under production's 45–91 ms TBT, else D-10 is revisited at P5.
5. Repo weight — re-encode before P1 commit.
6. CI gap until D-17 lands in P1.
7. Terminology: `jewellery` forbidden in Cha copy files (D-22 APPROVED; placeholders file exempt).
8. Fidelity drift from the spacing translation — pixel-diff at 1440 and 375 in P2 QA (§15).
9. Preloader vs LCP — session-once; documented trade-off.
10. Future Hub product names overflow the featured name slot (§13 row 13) — needs a short display name field at the Hub phase.

## 12. Owner decisions — status

| # | Decision | Status | Final value |
|---|---|---|---|
| D-1 | Registered company name | **RESOLVED** | `COMPANY_NAME` / `COMPANY_NAME_DISPLAY` from `lib/content/legal.ts` (`Ｃｈａ　Ｊｅｗｅｌｓ株式会社` / "Cha Jewels Co., Ltd."); spec §5 corrected. |
| D-2 | Corporate number | **RESOLVED** | 法人番号 7011801044120; `CORPORATE_NO` constant in P3; shown in the footer company block. |
| D-3 | Logo | **APPROVED** | Existing transparent badge `logo-badge-*.webp` + "Cha Jewels" in Instrument Serif in header, preloader, footer; SVG may come later. |
| D-4 | DESIGN.md vs Lumière | **APPROVED** | Lumière supersedes DESIGN.md's visual rules on this branch: pinned/scrubbed scroll, pill buttons, frosted panels, no orange accent (Orange-means-buy retired on this branch). Product pages and cards 3D-free until originals have models; home featured stage allowed. `DESIGN-LUMIERE.md` in P1, referenced from `CLAUDE.md`. |
| D-5 | Hero headline placements | **RESOLVED + APPROVED** | Existing `hero.h1a/h1b`; line breaks per §13 rows 1–2 approved 2026-11-01. |
| D-6 | Philosophy lines | **APPROVED** | Wording per §13 rows 17–27, approved 2026-11-01. |
| D-7 | Featured placeholder prices | **APPROVED** | "¥ —" pills, never $; Add to cart disabled while placeholder. |
| D-8 | Five-card collections | **APPROVED** | Lumière's 2×2 + one full-width fifth card. |
| D-9 | Preloader | **APPROVED** | Home only, first visit per session, hard cap 4 s; 3D continues behind posters after the curtain. |
| D-10 | Phones and 3D | **APPROVED** | Live 3D on phones with Lumière's mobile budget; posters only on Save-Data, `deviceMemory ≤ 4`, no WebGL2, or reduced motion. Revisit only if the P5 gate fails. |
| D-11 | Rem grid | **APPROVED** | Not ported. |
| D-12 | Dark mode | **APPROVED** | Dropped; light only. |
| D-13 | Lenis scope | **APPROVED** | Off on `/checkout/**`, `/account/**`, `/login`, `/auth/**`. |
| D-14 | Fonts | **APPROVED** | Instrument Serif + Manrope (+ Inter Tight) replace Playfair + Inter at P3; Noto Serif JP 500 stays. |
| D-15 | JA font deferral | **APPROVED** | `/ja` only until P5. |
| D-16 | Photos / models | **APPROVED** | Lumière's images, pendant and five ring models stay as interim; slots data-driven for the Hub swap. |
| D-17 | CI | **APPROVED** | `redesign/**` in `ci.yml`; strict placeholder check on `develop`/`main` bases. |
| D-18 | Desktop header labels | **APPROVED** | Collections · Blog · About · Layaway (EN) / Jewelry Guide (JA). |
| D-19 | Mobile tab bar | **APPROVED** | Kept, restyled. |
| D-20 | fx primitives | **APPROVED** | Retired at P5; tier medallions kept. |
| D-21 | Loyalty on home | **APPROVED** | New band added. |
| D-22 | Spelling guard | **APPROVED** | "jewellery" forbidden in `check:terms` (placeholders file exempt). |
| D-23 | Copy-fit table (§13) | **APPROVED** | The reviewer's five fixes (index line = eyebrow; New / 新品; lead from `colsP`'s second sentence; philosophy = the four values of `valuesP`; heading "Shop by Category.") plus every other line as proposed; JA sizes 56 / 56 / 44 u and pill strip 100 u; card notes 9 / 10 em; JA phone index 14 px (2026-11-01, corrected in commit after `a7640a6`). |
| D-24 | Short category display names (§14) | **APPROVED** | New / 新品, Preloved / プレラブド, Branded / ブランド, Watches / ウォッチ, Accessories / 小物; index line = existing eyebrow on every card; `CATEGORY_SHORT_NAME` in `lib/content/frame.ts` (P2). |

## 13. Copy-fit table (APPROVED 2026-11-01)

**Method.** Every proposed line was rendered in a headless Chromium at the slot's font and size and measured with `getBoundingClientRect` — Instrument Serif Regular, Manrope Medium and Inter Tight Regular loaded from Lumière's own woff2 files (`document.fonts.check` true). Japanese was measured in the system Mincho because Noto Serif JP did not load from Google in the headless run; every CJK glyph in both faces has a 1 em advance, so the JA widths are the same. Desktop = 1440 px (1 u = 1 px); phone = 375 × 812 (u = 0.6452 px; display fluid size 52.9 px; collections heading 33.6 px; card title 36 px; philosophy 32 px; featured name 28 px). "Measure" is the Lumière slot's real clearance, not its nominal box: e.g. the collections heading box is 377 u but the line may run to the lead column (~1000 u), which Lumière's own "Four Collections." (359 u at 64 u) relies on; the philosophy bottom row is two lines plus a 252 u note in 1067 u, so each line ≤ 407 u. Lumière's own copy is shown as the reference width. All proposals are drawn from existing site copy (`lib/i18n.ts`, `lib/content/about.ts`, `lib/content/frame.ts`); shortenings are marked ✂.

| # | Slot | Lumière measure (width, chars) and its copy | Proposed EN | Proposed JA | 1440 | 375 |
|---|---|---|---|---|---|---|
| 1 | Hero headline, rest (82 u serif, 3 named lines, ≤ 350 u beside the card ring; phone 52.9 px ≤ 323) | "Jewellery / for everyday / rituals." 249 / 343 / 196 u (≤ 12 chars) | **Timeless / beauty / to wear.** — `hero.h1a`, 3 lines (241 / 188 / 219). "Timeless beauty" on one line = 442 u ✗ | **身につける、 / 時を超える / 美しさ。** — `hero.h1a` at **56 u** (335 / 280 / 222); at 64 u the photo lines overflow, so JA headline = 56 u | ✓ | ✓ (155 / 121 / 141; JA 36 px 215 / 180 / 143) |
| 2 | Hero headline, photo (same slot) | "Made by hand, / worn every / day." 415 / 308 / — | **Lasting / value / to pass on.** — `hero.h1b` (203 / 148 / 292). "Lasting value" = 365 u ✗ | **受け継がれる / 確かな価値。** — `hero.h1b` at 56 u (336 / 336); ✂ the comma after 受け継がれる (with it 392 u ✗) | ✓ | ✓ |
| 3 | Hero tagline, rest (18 u Manrope, wraps in 281 u; phone 297 u; Lumière 57 chars / 2 lines) | "Crafted jewellery designed to accompany everyday rituals" | **Every piece chosen for quality, elegance and enduring worth.** ✂ from `hero.lede` ("every piece is chosen for its quality, elegance, and enduring worth"), 60 chars → 3 lines (254 / 251) | **品質、気品、変わらない価値。 / その基準で選んだジュエリー。** ✂ from `hero.lede`, 2 named lines (252 / 251) | ✓ | ✓ |
| 4 | Hero tagline, photo (same slot; Lumière 64 chars / 3 lines) | "Shaped and finished by hand, in small batches, in our own studio" | **Beauty beyond trends, careful workmanship, quality you can trust.** ✂ from `home.valuesP`, 65 chars → 3 lines | **流行を超える美しさ。 / 丁寧な仕立て。 / 信頼できる品質。** ✂ from `home.valuesP`, 3 named lines (179 / 126 / 144) | ✓ | ✓ |
| 5 | Hero CTA (16 u serif uppercase, hairline rule) | "EXPLORE COLLECTIONS" 134 u | **shop the collections** — `hero.cta1` (139) | **コレクションを見る** — `hero.cta1` (144, no uppercase) | ✓ | ✓ |
| 6 | Scroll cue (13 u) | "scroll" 29 u | scroll | スクロール (64) | ✓ | ✓ |
| 7 | Category index pills (strip 85 u, pill text ≤ 65 u at 16 u serif) | Rings / Necklaces / Earrings / Bracelets ≤ 52 u | **New / Preloved / Branded / Watches / Accessories** (24 / 47 / 47 / 44 / 59) | **新品 / プレラブド / ブランド / ウォッチ / 小物** (32 / **80 ✗** / 64 / 64 / 32) → JA strip width **100 u** (one `CATEGORY.width` override), then ✓ | ✓ EN; JA ✓ at 100 u | same |
| 8 | Collections heading (64 u serif, 2 named lines, clearance ≈ 1000 u to the lead; phone 33.6 px ≤ 343) | "Four Collections. / Endless Stories." 359 / 335 | **Shop by Category. / Carefully Selected.** — `home.colsEyebrow` ("Browse by category" → category wording, FIX 5) + ✂ `hero.lede` ("carefully selected") (389 / 398) | **カテゴリーから選ぶ。 / 厳選したジュエリー。** — `home.colsEyebrow` + ✂ `hero.lede` at **56 u** (559 / 557); phone **28 px** (279 / 278) | ✓ | ✓ (204 / 209) |
| 9 | Collections lead (16 u Inter Tight, wraps in 275 u) | "Each piece is thoughtfully designed and meticulously crafted in small batches." | **Every listing shows weight, purity and stones.** — `home.colsP` second sentence (FIX 3; the K18/hallmark sentence is dropped: the catalogue also carries K24/K14/K10 and "hallmark checked" is not the approved claim). Wraps to 2 lines (185 / 122) | **すべての商品に重量・純度・石の情報を表示しています。** — `home.colsP` (wraps to 2 lines, 206 / 205) | ✓ | ✓ |
| 10 | Collection card titles (48 u serif nowrap; narrow card ≤ 383 u, wide ≤ 611 u; phone 36 px ≤ 303) | "Necklaces." 167 u | **New Jewelry. / Preloved Jewelry. / Branded Jewelry. / Watches. / Designer Accessories.** (205 / 276 / 274 / 141 / 338) — `home.heroCallerFine` for the first (FIX 2) | **新品ジュエリー。 / プレラブド。 / ブランド品。 / ウォッチ。 / デザイナー小物。** at JA card title **44 u** (349 / 259 / 264 / 215 / 349) | ✓ | ✓ (EN 154–254; JA 36 px 286 / 211 / 216 / 176 / 285) |
| 11 | Collection card **index line** (Lumière shows 01–04 here: 18 u serif italic underline, full card width: narrow 512 u, wide 740 u, fifth 1336 u; phone 16 px ≤ 303, always visible on phones) **and** card notes (14 u Inter Tight, `--note-w`, hidden on phones) | "01" … "04"; notes "Forms that stay close to you." | **Index = the existing eyebrow, never a number (FIX 1, secondhand-dealer rule):** `home.heroCallerFine` **New jewelry** (77) · `home.heroPrelovedEyebrow` **Preloved · Authenticated in Japan** (213) · `home.heroCallerBranded` **Preloved branded · Authenticated in Japan** (271) · `home.heroCallerWatches` **Preloved watches · Authenticated in Japan** (267) · `home.heroCallerAccessories` **Preloved accessories · Authenticated in Japan** (285). Notes = `CATEGORY_BLURB` as 2 lines, EN `--note-w` **9 em** (126 u): New gold, pearl / and diamond (94 / 78) · Unbranded gold / and platinum (97 / 77) · Signature pieces / from jewelry houses (100 / 120) · Selected branded / watches · Wallets, card / cases, belts | Index (roman, no italic): **新品ジュエリー** (126) · **プレラブド・日本で真贋鑑定済み** (269) · **プレラブド ブランド・日本で真贋鑑定済み** (346) · **プレラブド ウォッチ・日本で真贋鑑定済み** (345) · **プレラブド 小物・日本で真贋鑑定済み** (310). Notes JA `--note-w` **10 em** (140 u): 新作のゴールド・ / パール・ダイヤモンド (111 / 137) · ノンブランドの / ゴールド・プラチナ (98 / 125) · ジュエリーハウスの / シグネチャー (123 / 84) · 厳選したブランド / ウォッチ · 財布、カード / ケース、ベルト | ✓ (index ≤ 346 ≤ 512) | Index EN ✓ at 16 px (68–254); **JA at 16 px: 307 / 307 ✗ on the branded and watches cards → JA index 14 px on phones (269 / 268 / 241 ✓)** |
| 12 | Card CTA (16 u serif uppercase) | "explore collection" | **view collection** — `home.colsLink` | **コレクションを見る** | ✓ | ✓ |
| 13 | Featured piece name (40 u serif nowrap, 218 u content width; phone 28 px ≤ 284) | "Trinity." … "Verdant." ≤ 115 u | Placeholders unchanged (Trinity. / Solace. / Aurum. / Verdant. / Tidal.). Hub phase: EN names like "Akoya strand." fit (186) but JA 「喜平チェーン。」 = 273 ✗, 「一粒ダイヤ。」 = 230 ✗ → **Hub short display name ≤ 5 JA chars, or JA name at 32 u** | — | ✓ now | ✓ |
| 14 | Featured materials row (18 u Inter Tight nowrap; ≤ 600 u box; phone wraps) | "Rose gold • Diamonds • Handmade" 274 u | Placeholder rows unchanged now. **"Authenticated in Japan" is never fixed text (ADD 6):** at the Hub phase the row is built per product from its data — preloved → the authentication statement; new → origin only through `origin-badge.tsx` rules (`origin === "JAPAN"`), otherwise metal and stones only. Width probe "K18 gold • Diamond • Authenticated in Japan" 346 | Probe **K18ゴールド • ダイヤモンド • 日本で鑑定済み** 363 | ✓ | ✓ |
| 15 | Featured pills (16 u Inter Tight uppercase) | "Add to cart", "$2,450" | **Add to cart** — `cart.add` · price **¥ —** (D-7) | **カートに入れる** (91) · **¥ —** | ✓ | ✓ |
| 16 | Featured cue (13 u) | "Scroll to explore" 123 u | Scroll to explore | スクロールして見る (116) | ✓ | ✓ |
| 17 | Philosophy line 1 (64 u serif, top row beside the note: ≤ 580 u; phone 32 px ≤ 311) | "Jewellery Doesn`t" 377 u | **Beauty Beyond** — `home.valuesP` (FIX 4: the four values as one continuous statement; the `about.questions` lines are dropped) (324); runs `B`eauty `B`eyond with italic capitals | **流行を超える** — `home.valuesP` (384) | ✓ | ✓ (162 / 192) |
| 18 | Philosophy line 2 (top row, after the note, ≤ 580 u) | "Need To Be Quite." | **Trends.** (162) | **美しさ。** (253) | ✓ | ✓ |
| 19 | Philosophy line 3 (centre, two halves, ≤ 1066 u; halves wrap on phones) | "We Like Unusual Shapes" 517 u | **Value You Can Understand.** — `home.valuesP` (588) | **分かりやすい価値。** — `home.valuesP` (576; phone 288 fits as one line) | ✓ | ✓ (294 / 288) |
| 20 | Philosophy line 4 (bottom row left; two lines + 252 u note ≤ 1067 u → each ≤ 407 u) | "The Longer You" 336 u | **Careful** — `home.valuesP` (159) | **丁寧な** — `home.valuesP` (192) | ✓ | ✓ |
| 21 | Philosophy line 5 (bottom row right) | "Look At Them." 315 u | **Workmanship.** (317; pair 476) | **仕立て。** (255; pair 447) | ✓ | ✓ |
| 22 | Philosophy line 6 (keep, centre) | "Keep It Interesting." | **Quality You Can Trust.** — `home.valuesP` (483) | **信頼できる品質。** — `home.valuesP` (512; phone 256) | ✓ | ✓ (242 / 256) |
| 23 | Philosophy top note (18 u Inter Tight, 10.44 em = 188 u, 2 lines) | "Some pieces blend in. / Ours don't always try to." 169 / 188 | **Real materials. / Clear details.** — `about.closing[1]` (111 / 99); the 11.5 em widening is no longer needed | **確かな素材。 / 明確な情報。** — `about.closing[1]` (108 / 108) | ✓ | ✓ |
| 24 | Philosophy left aside (18 u, 8.39 em = 151 u, wraps, right-aligned) | "rough edges, unexpected details" | **authenticated / in Japan** — `home.heroPrelovedEyebrow` (107 / 65) | **日本で / 真贋鑑定済み** — `home.heroPrelovedEyebrow` (54 / 108; one line would be 162 ✗, so two) | ✓ | ✓ |
| 25 | Philosophy right aside (2 lines) | "and things / that get better" | **every listing / shows weight** — `home.colsP` (92 / 107) | **すべての商品に / 重量を表示** ✂ `home.colsP` (124 / 90) | ✓ | ✓ |
| 26 | Philosophy bottom note (14 em = 252 u, 2 lines) | "the kind of details that become more / interesting the longer you look" | **selected for authenticity, / quality and lasting value** ✂ `about.closing[0]` (190 / 184) — no longer repeats the lead (FIX 3) | **真贋と品質、永く続く価値に / 目を配って選んでいます。** ✂ `about.closing[0]` (234 / 212) | ✓ | ✓ |
| 27 | Philosophy pill (13 u uppercase) | "Our story" 69 u | **About us** — `navMenu.about` (62) → `/about` | **ブランドについて** (103) | ✓ | ✓ |
| 28 | Footer note (12 u Manrope, 331 u, wraps) | "Notes on new pieces, collections & things worth keeping." | **New pieces, member previews. Unsubscribe any time.** — existing footer newsletter note (299) | **新着・会員向け先行案内。いつでも解除できます。** (275) | ✓ | ✓ wraps |
| 29 | Footer link labels (14 u Manrope nowrap; four columns + subscribe must fit 686 u) | ≤ "Shipping & Returns" | All existing labels fit except **"Legal notice (Specified Commercial Transactions Act)"** (~360 u column) → display label **"Legal notice"** in the footer only (page title unchanged) ✂ | 特定商取引法に基づく表記 (168) fits | ✓ with ✂ | ✓ (stacked) |
| 30 | Header labels (14 u Manrope uppercase, gap 48 u, left of the centred wordmark) | Shop · Collections · Blog · About | **Collections · Blog · About · Layaway** (D-18) ≈ 420 u | **コレクション · ブログ · ブランドについて · ジュエリーガイド** ≈ 480 u (no uppercase) | ✓ (< 680 u) | n/a (burger) |
| 31 | Phone menu items (clamp(28px, 8vw, 34px) serif) | 5 links | All existing header/tab links | same | n/a | ✓ |

Owner decision 2026-11-01 ("Approve all recommended" = the reviewer's five fixes plus the rest as proposed; recorded correctly in this revision): every line above, the four size deviations (JA headline 56 u, JA collections heading 56 u / 28 px phone, JA card title 44 u, JA pill strip 100 u), the two note-width deviations (card notes 9 em EN / 10 em JA) and the phone JA index at 14 px are APPROVED. The 11.5 em top-note widening is withdrawn (not needed with the FIX 4 notes). These are the strings P2 puts into `lib/content/lumiere-home.ts`; any later edit is a content change, not a design change. Reviewer fixes applied and re-measured: FIX 1 index line = eyebrow (row 11), FIX 2 New / 新品 (rows 7, 10, §14), FIX 3 lead (row 9) and a non-repeating bottom note (row 26), FIX 4 philosophy = the four values (rows 17–26), FIX 5 heading (row 8); ADD 6 materials row (row 14).

## 14. Short category display names (APPROVED 2026-11-01)

Display-only. Hub names, slugs, SEO titles, breadcrumbs and JSON-LD keep the Hub values unchanged.

| Hub slug | Hub name (unchanged in data/SEO) | Pill (hero index, ≤ 65 u) | Card title (collections) | Card note (`CATEGORY_BLURB`, unchanged) |
|---|---|---|---|---|
| `fine-jewelry` | Fine Jewelry / ファインジュエリー | **New** / **新品** | **New Jewelry.** / **新品ジュエリー。** | New gold, pearl and diamond / 新作のゴールド・パール・ダイヤモンド |
| `preloved-jewelry` | Preloved Jewelry / プレラブドジュエリー | **Preloved** / **プレラブド** | **Preloved Jewelry.** / **プレラブド。** | Unbranded gold and platinum / ノンブランドのゴールド・プラチナ |
| `preloved-branded-jewelry` | Preloved Branded Jewelry / プレラブド ブランドジュエリー | **Branded** / **ブランド** | **Branded Jewelry.** / **ブランド品。** | Signature pieces from jewelry houses / ジュエリーハウスのシグネチャー |
| `preloved-watches` | Preloved Watches / プレラブドウォッチ | **Watches** / **ウォッチ** | **Watches.** / **ウォッチ。** | Selected branded watches / 厳選したブランドウォッチ |
| `preloved-designer-accessories` | Preloved Designer Accessories / プレラブド デザイナーアクセサリー | **Accessories** / **小物** | **Designer Accessories.** / **デザイナー小物。** | Wallets, card cases, belts / 財布、カードケース、ベルト |

Rules (owner, FIX 1 and FIX 2): EN and JA match for the first category ("New" / 新品, "New Jewelry." / 新品ジュエリー。, from `home.heroCallerFine`); 「小物」 mirrors `home.heroCallerAccessories`. **"Preloved" is always visible**: the card's index line (Lumière's 01–05) is the existing eyebrow on every card — `home.heroCallerFine` on the first, `home.heroPrelovedEyebrow` / `heroCallerBranded` / `heroCallerWatches` / `heroCallerAccessories` on the four preloved cards (measured in §13 row 11; JA index 14 px on phones). A preloved piece never reads as new (secondhand-dealer rule). Names live in `lib/content/frame.ts` beside `CATEGORY_BLURB` (`CATEGORY_SHORT_NAME`), JA/EN, no CJK in `.tsx`.

## 15. QA plan (every phase PR; adds to spec §8)

1. **Analytics on every restyled CTA**: add to cart, checkout steps, contact, Messenger, newsletter keep their `lib/analytics.ts` events; `check:analytics` gate 9 (only `ads-tags.tsx` names the pixel/gtag URLs) stays green; a P2/P3 test asserts the Lumière "Add to cart" pill and hero/collection CTAs fire the same event names as today.
2. **Contrast ledger**: Lumière puts white text over photographs and darkens card photos **only on tablet** (`.collections__card::after` scrim at 768–1439.98). Every breakpoint gets a `scripts/check-contrast.mjs` row for: card titles/notes/CTA over the four collection photos at 1440 and 375 (no scrim), featured title/materials over `photo-ring-0N` (foot/head shades 0.62/0.32), hero chrome over `card-08` after the invert, footer dim text (50 % white) — add scrims where a row fails rather than lightening type.
3. **Keyboard path**: Tab through header (labels, wordmark, lang toggle, account, cart, search), the pinned hero (category pills, CTA), featured dots and Add to cart, philosophy pill, footer; search overlay and drawer focus traps; cart → checkout → agreement → confirm with Lenis on/off; pay-card unchanged. Pinned sections must not trap focus or scroll.
4. **`e2e:signup`** (Playwright) keeps passing against the branch alias; sign-in only from `https://cha-jewels-web-git-redesign-lumiere-cha-jewels.vercel.app`.
5. **Fidelity**: full-page screenshots at 1440 × 800 and 375 × 812 of the preview against the GetLayers Lumière preview (`https://www.getlayers.ai/?layer=lumi-re`) at matched scroll positions (p = 0, 0.24, 0.48, 0.6, 0.72, 0.85, 1 of the hero; featured states 0–4; philosophy entry 1) — pixel-diff on geometry, timing checked by frame capture of the intro (0, 340, 520, 620, 1150 ms).
6. Repo checks on every PR: `typecheck`, `lint`, `test:unit`, `check:terms`, `check:money`, `check:i18n` (+ `check:layaway-ja`), `check:contrast`, `check:analytics`, `check:placeholders`, `check:cutouts`, `check:lastmod`; CI on `redesign/**` after D-17.
7. Reduced motion, JA/EN per page, no layaway on JA, performance gate (§10), accessibility (one `<h1>`, landmarks, alt text), behaviour regressions (sign-in, cart, checkout, layaway, loyalty, receipts, newsletter, contact, search) — as spec §8.

---
Appendix A — Master prompt vs Next source: every named constant matches (`DESIGN`, `TABLET`, `CARD`, `CLUSTER`, `FRAME_2`, `TIMELINE`, `CATEGORY`, `CATEGORY_SCALE`, `PENDANT*`, `PENDANT_FOG`, `TEXT_SWAP`, `HERO_INTRO`, `HERO_TILT`, `SLOTS`, `F_TIMELINE`, `SPREAD`, `RING_3D`, `PIECE_SWITCH`, `LETTER_REVEAL`, `REVEAL`, spring configs, `M_presets`). Differences are delivery-only (hotlinked WebP, import map, Blob worker vs. local PNG/JPG, `next/font/local`, bundled worker). Source wins for the port; prompt is the fidelity checklist.

Appendix B — UNVERIFIED items carried into P1: live CSP headers on `/`; Paidy widget iframe internals; Hub-side newsletter double opt-in; Lenis resync after native `scrollIntoView`; `block!` necessity against the engine's inline flex; Noto Serif JP glyph widths assumed 1 em (measured with the system Mincho).
