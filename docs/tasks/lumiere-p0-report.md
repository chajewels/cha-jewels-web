# Lumière redesign — P0 scan & report

Status: AUDITED (no code written) · Branch `redesign/lumiere-p0-report` → PR into `redesign/lumiere` · Date 2026-10-31
Scope: everything `docs/tasks/lumiere-redesign.md` §6 P0 asks for, plus the owner's P0 brief (library compatibility, token translation, grid/Lenis coexistence, CSP, Japanese type, port list, route list, detail placement, placeholder guard, performance, risks, owner decisions).

Sources read: this repo at `b47beff` (every file named below), `~/Downloads/lumi-re` (read-only; all `src/**`, `obsidian/**`, `public/**`), the master prompt, npm registry metadata and tarballs for every library, Next.js and Lenis documentation (Context7). Live production HTML/headers of `https://chajewelsjp.com/`. PageSpeed Insights API was quota-blocked today, so the performance baseline below comes from the repo's own recorded Lighthouse runs (dated), not a fresh run — marked where relevant.

Pre-flight: `git fetch` + `gh pr list --state all --limit 20` → no other redesign PR or branch exists (only `redesign/lumiere`, one commit: the spec). `.env.local` copied from `~/Code/cha-jewels-web` (ignored by git, verified with `git check-ignore`).

---

## 1. Library compatibility — Next 15.5.28 / React 19.2.8 / Tailwind 3.4.19

Installed here: `next 15.5.28`, `react 19.2.8`, `react-dom 19.2.8`, `tailwindcss 3.4.19`, `typescript 5.9.3`, `zod 4.6.7`. Lumière (yarn.lock): `next 16.2.0`, `react 19.2.4`, `tailwindcss 4.2.4`.

| Package | Pin | Peer deps (npm registry) | Verdict |
|---|---|---|---|
| `three` | `0.186.1` | none; `type: module`, exports `.`, `./addons/*`, `./examples/jsm/*` | OK. Webpack 5 (Next 15 `next dev`/`next build` default — this repo does not pass `--turbopack`) resolves the `exports` map. |
| `three-mesh-bvh` | `0.9.17` | `three >= 0.159.0` | OK. |
| `@types/three` | `0.186.0` | — | OK (dev). |
| `lenis` | `1.3.23` | `react >=17` (optional, only for `lenis/react`) | OK. Core import `lenis` is framework-free; `lenis/react` export exists if wanted. `autoRaf` default `false` (Lenis types) — Lumière's own rAF loop is correct, no double loop. `respectReducedMotion` default `true` — gives the reduced-motion requirement for free (lerp forced to 1). |
| `@react-spring/web` | `10.0.3` | `react ^16.8 \|\| ^17 \|\| ^18 \|\| ^19` | OK on React 19.2. |
| `spring-text-engine` | `0.1.5` (latest, 2026-04-28) | `@react-spring/web >=9`, `react >=17`, `react-dom >=17`; dep `resize-observer-polyfill ^1.5.1` | OK. Ships `"use client"`, ESM+CJS. **Letter split is `word.split("")`** (UTF-16 code units) and word split is ASCII space — see §5 for Japanese consequences. |
| `zustand` | `5.0.16` (Lumière 5.0.12) | `react >=18` | OK. Only needed for Lumière's scroll/preload stores; could be replaced by two tiny contexts — keep it, it is 1 KB. |
| `resize-observer-polyfill` | — | — | **Not imported anywhere in Lumière `src/`** (only a transitive dep of spring-text-engine). Do not add directly. |

Build-level checks (facts, not assumptions):
- EXR worker: Lumière uses `new Worker(new URL("./exr-decode.worker.ts", import.meta.url), { type: "module" })`. Next.js documents webpack 5 support for exactly this form. Turbopack is not used by this repo. The worker is a same-origin bundle — no `blob:`, no import map, no jsDelivr (the master prompt's Blob worker is its single-file delivery hack and is NOT ported).
- Meshopt: `three/addons/libs/meshopt_decoder.module.js` instantiates an inline base64 module via `WebAssembly.instantiate` (confirmed in the 0.186.1 tarball). No webpack WASM flag is needed (runtime bytes, not an import), but CSP needs `'wasm-unsafe-eval'` (§4).
- EXRLoader depends only on `../libs/fflate.module.js` (bundled). DWAB decode is pure JS.
- Nothing requires React Compiler, `cacheComponents`, `proxy.ts` or Next 16 `images.qualities`. Lumière's `next.config.ts` has `images.qualities: [75, 95]` — Next 15 accepts any `quality` without this key; drop it.
- Zod: Lumière's `src/env.ts` uses zod 4 top-level `z.url()`/`z.email()` — this repo is already on zod 4. Not ported anyway (we keep our env handling).

**No framework upgrade is required. No STOP condition met.**

## 2. Lumière tokens → Tailwind 3.4 translation plan

Lumière is CSS-first Tailwind 4 (`@import "tailwindcss"`, `@theme inline`, `@utility`). Of its 3,402-line `globals.css`, ~2,600 lines are plain BEM CSS (`.collections*`, `.featured*`, `.philosophy*`, `.footer*`) that port verbatim. Only the `@theme` block and a handful of class-name idioms need translation.

| Lumière construct | Tailwind 3.4 equivalent | Notes |
|---|---|---|
| Tier-1 `--raw-*` and Tier-2 semantic vars on `:root` + all breakpoint overrides (`≤1439.98`, `≤929`, `1024–1439.98`, `≤1023.98`, `≤767.98`, landscape phone, `768–1023.98`, collections type ramps) | Copy unchanged into `app/lumiere/tokens.css` (plain CSS, outside Tailwind layers) | Order of the media blocks matters (tablet block is last on purpose). `--raw-unit-design` floors (`0.6452px`, `min(0.6452px, 100svh/1258.5)`, tablet `min(100vw/850, 100vh/1150)`) must stay byte-identical to `hero.config.ts`/`hero-geometry.ts` — same invariant as Lumière. |
| `@theme inline` colours (`--color-background/foreground/surface/content/content-inverse/border-muted/index-active*`) | `theme.extend.colors: { background: 'var(--background)', foreground: 'var(--foreground)', surface: 'var(--surface)', content: 'var(--content)', 'content-inverse': 'var(--content-inverse)', 'border-muted': 'var(--border-muted)', ... }` | Coexist with existing `charcoal/chalk/gold/orange/teal/garnet/hairline` until P5; `check:contrast` ledger rows needed for every new pairing (DESIGN.md rule). |
| `--font-sans/serif/tight` | `theme.extend.fontFamily: { serif: ['var(--font-instrument-serif)', …], sans: ['var(--font-manrope)', …], tight: ['var(--font-inter-tight)', …] }` | Existing `display/jp/sans` keys stay for untouched pages until P3; Lumière's `font-sans` would override Tailwind's default `font-sans` — acceptable because P3 restyles every page. |
| Paired type tokens `--text-<role>` + `--text-<role>--line-height` → `text-display`, `text-body`, `text-nav`, `text-caption`, `text-utility`, `text-collections-heading`, `text-collections-lead`, `text-card-*`, `text-wordmark`, `text-micro` | `theme.extend.fontSize: { display: ['var(--type-display)', 'var(--type-display-leading)'], body: ['var(--type-body)', 'var(--type-body-leading)'], … }` | One-to-one; Tailwind 3 supports `[size, lineHeight]` tuples with CSS vars. |
| `--radius-card/panel/pill` | `theme.extend.borderRadius: { card: 'var(--corner-card)', panel: 'var(--corner-panel)', pill: 'var(--corner-pill)' }` | Lumière's vault notes `rounded-card` is dead (hero radius is inline); keep for parity. |
| `--tracking-*`, `--ease-entrance`, `--ease-hover`, `--leading-display: 1.1` | `letterSpacing`, `transitionTimingFunction`, `lineHeight` extensions | Trivial. |
| **`--spacing: var(--step)`** (rebinds the whole spacing scale to design units: `left-40`, `right-40`, `top-29`, `top-14`, `w-350`, `w-281`, `gap-48`, `gap-24`, `gap-12`, `px-40`, `size-12/16`, `mt-1/3/6/10`, `inset-0`) | **Cannot rebind globally** — it would rescale every existing page. Two options: (a) `theme.extend.spacing` with a prefixed scale generated from the used keys, e.g. `u-29: 'calc(29 * var(--raw-unit-design))'`, and rename classes `left-40` → `left-u-40`; (b) arbitrary values `left-[calc(40*var(--raw-unit-design))]`. | **Plan: (a)**, generated in `tailwind.config.ts` from a `LUMIERE_UNITS` array so the JSX stays readable; `inset-0`, `size-12`, `size-16` keep Tailwind's rem meaning only where Lumière actually meant px (verify per occurrence — `size-12` on the arrow icons is design units in Lumière). |
| `@utility inset-safe`, `min-h-stage`, `snap-strip` | `@layer utilities { .inset-safe {…} .min-h-stage {…} }` in `app/lumiere/utilities.css` | `snap-strip` is unused in Lumière TSX — do not port. |
| `block!`, `inline-block!` (v4 trailing important) | `!block`, `!inline-block` | Needed: the text engine sets `display:flex` inline on its container, the `!` wins. |
| `min-[930px]:block/hidden` | Already valid in Tailwind 3.2+ (`min-[...]` arbitrary breakpoint) | Keep. |
| `h-svh`, `min-h-lvh`, `size-*`, `w-lvw`, `h-lvh` | Exist in 3.4 | Keep. |
| `text-wrap: pretty`, `container-type: size` + `cqh`, `color-mix()` | Plain CSS in the BEM file / inline style | Browser features, not Tailwind; unchanged. |
| `@media (prefers-color-scheme: dark)` overriding `--background/--foreground` | **Drop** (owner decision D-12) | Cha Jewels has no dark mode; Lumière's dark override would turn the page body neutral-950 for dark-OS visitors while the paper sections stay cream. |
| `@font-face` via `next/font/local` (`fonts.ts`) | `next/font/local` identical API in Next 15 (verified: `src[]` with `path/weight/style`, `variable`, `display`, `preload`, `adjustFontFallback`, `declarations`) | Add `declarations` only if the exact family names `instrumentSerif`/`manrope`/`interTight` must be preserved for the verbatim CSS; otherwise the CSS vars are enough. |
| Root `html { font-size: …vw }` rem grid (`@layer base`) | **Not ported** (see §3.1) | — |

Deliverable files (P1): `app/lumiere/tokens.css`, `app/lumiere/blocks.css` (BEM verbatim), `app/lumiere/utilities.css`, `tailwind.config.ts` extension, `app/fonts.ts`.

## 3. Coexistence: rem grid, Lenis, existing pages, modals, checkout, Paidy

### 3.1 The adaptive rem grid
Lumière has two halves: CSS `html{font-size}` in vw steps (`≤1920: 0.8333vw`, `≤1440: 1.1111vw`, `≤1024: 1.5625vw`, `≤640: 4.4444vw`) and `<AdaptiveGrid>` writing an inline root font-size above 1920 px (coef 0.6666). **None of the five Lumière sections use rem** — they size from `--raw-unit-design` (ADR-0019 in Lumière's vault: the grid's 0.6666 damping would break "same size relative to viewport"). The only rem in those sections is the `2.25rem` floor inside `--raw-text-display-fluid` (= 36 px at 16 px root).

This repo has no root font-size rule and mixes px literals (`text-[13.5px]`, `clamp(28px,3.6vw,44px)`) with rem utilities (`text-sm`, spacing scale, `max-w-site`). Adopting the vw grid would shrink every rem utility to 78 % at 800 px wide and jump to 178 % at 640 px while px literals stay put.

**Plan: do not port the rem grid or `AdaptiveGrid`.** Use `--raw-unit-design` for Lumière sections and the §7 reference patterns, px/clamp for everything else, and replace the `2.25rem` floor with `36px`. (Decision D-11 confirms.)

### 3.2 Lenis
Lumière: `new Lenis({ smoothWheel: true, wheelMultiplier: 0.65 })` scrolling the **window** (no `wrapper`/`content`), own rAF, `lenis.stop()/start()` via a zustand store, `window.scrollTo(0,0)` on mount, hash scroll after 300 ms. Native scroll position still moves, so `window.scrollY`, `getBoundingClientRect`, `IntersectionObserver`, `position: sticky` and `scrollIntoView` keep working — Lenis only smooths wheel input and offers `animatedScroll` (fractional) for pinned scrubs.

What in this repo must change or be wired:

| Existing code | Interaction with Lenis | Action |
|---|---|---|
| `app/globals.css:6` `html { scroll-behavior: smooth; scroll-padding-top: 76px }` | Double smoothing on anchor jumps | Remove `scroll-behavior`; route anchors through `lenis.scrollTo(target, { offset })`. Keep `scroll-padding-top` only for the reduced-motion/no-JS path. |
| `header-shell.tsx:64` scroll listener (`window.scrollY`, hide/show, `--hdr-h`) | Works (native scroll moves). Lumière's header is absolute inside the hero; ours must stay fixed on every page and recolour (invert on the hero photo) | Rebuild as the Lumière header in P3 with the same `--hdr-h` contract so every sticky consumer (`faq-nav`, `catalog-grid .cg-bar`, `sticky-column`, `legal-toc`, `account-shell`) keeps working. |
| `home/hero.tsx`, `tier-ladder.tsx`, `legal-toc.tsx` scroll listeners | Work | Replaced/restyled in P2/P4 anyway; migrate per-frame readers onto the shared ticker. |
| `body.style.overflow = "hidden"` lockers: `mobile-nav.tsx:94`, `search-box.tsx:150`, `layaway-piece-picker.tsx:118`, `catalog-grid.tsx:467` | Lenis keeps consuming wheel on the window; the overlay's inner scroll fights it | One `lib/scroll-lock.ts` (`lock()` = `lenis.stop()` + overflow hidden, `unlock()` = reverse) used by all four; `data-lenis-prevent` on every inner scroll container (drawer body, search sheet, picker list, filter sheet, mega-menu panels `max-h-[calc(100vh-96px)]`, `product-gallery` thumb strip, `faq-nav` horizontal list, `gallery-viewer .vf-root`). |
| `checkout-flow.tsx:605,609` `scrollIntoView({behavior:"auto"})` | Native jump; Lenis resyncs on the native `scroll` event | Keep, or swap to `lenis.scrollTo(el, { immediate: true })`. Verify in P1 smoke test (PLAUSIBLE, not yet proven in this repo). |
| `ring-size-context.tsx` `scrollTop` on an inner box; `faq-nav` horizontal `scrollTo` | Inner elements | `data-lenis-prevent`. |
| Fixed chrome: `.messenger-fab`, `.consent-banner`, mobile tab bar, flash notice, `.stickact` cart bar, `.buybar` | Unaffected by Lenis | Restyled only. |
| `html, body { overflow-x: clip }` | Fine | Keep (DESIGN.md: no horizontal scroll). |
| Blanket `prefers-reduced-motion` CSS (`animation: none !important; transition: none !important`) | Fine | Keep; add `respectReducedMotion: true` (default) **and** skip creating Lenis at all under the media query so the cost is zero. |
| Paidy promotional widget (`paidy-widget.tsx`): a `<div class="_paidy-promotional-messaging">` filled by `cdn.paidy.com/.../paidy-upsell-widget.js`, `lazyOnload`, `_paidy("pm:refresh")` on amount change | In-flow DOM, no scroll container of its own (whether it opens an iframe modal is UNVERIFIED — not in our code) | No change expected. Add `data-lenis-prevent` on the widget wrapper defensively; re-test the "learn more" interaction in P4. |
| `/account/orders/[id]/pay-card` (enforced CSP, Square card form) | Lenis is a first-party module script → allowed by `'self' 'strict-dynamic'` + nonce | **Recommendation (D-13): do not mount Lenis on `/checkout/**` and `/account/**`** — zero-risk transactional pages, and the Lumière feel there comes from type/tokens, not smooth scroll. |

Where it mounts: `app/layout.tsx` and `app/[lang]/layout.tsx` share the root layout; a `<ScrollLayout>` client wrapper around `{children}` with a path allow-list (home + public pages) — single instance, single rAF, shared `lib/animation/ticker.ts`.

### 3.3 Preloader vs existing "LCP rule"
`components/fx/boot-marker.tsx` enforces "nothing above the fold starts hidden on first load". A full-screen preloader deliberately hides the fold. The spec (P1) already decided: preloader on the **home page only, first visit per session, capped**. The marker stays for inner pages; the home page is exempted by design.

## 4. Exact CSP change (`lib/csp.ts`)

Current report-only policy (every non-pay-card page): `default-src 'self'`; `script-src 'self' 'unsafe-inline' [dev 'unsafe-eval'] + Square/Paidy/Metricool/Facebook/GTM/vercel.live`; `img-src 'self' data: blob: https:`; `media-src 'self' blob: https:`; `connect-src 'self' …`; `frame-src https:`; `frame-ancestors 'none'`; `form-action 'self'`; `base-uri 'self'`; `object-src 'none'`; `report-uri /api/csp-report`. **No `worker-src`, no `'wasm-unsafe-eval'`.** Live check: `curl` from outside returned no CSP headers on `/` today (UNVERIFIED whether the middleware matcher excludes `/` for anonymous requests or Vercel strips them for curl; `tests/csp.test.mjs` says they are set). Enforced pay-card policy: nonce + `'strict-dynamic'`, Square only.

What the three.js stack needs:
1. **`'wasm-unsafe-eval'` in `script-src`** — Meshopt decoder (`WebAssembly.instantiate`). Without it the decoder throws under an enforced policy and generates reports under report-only.
2. **`worker-src 'self'`** — the EXR decode worker is a same-origin bundled module worker. Today it would already pass through the `script-src 'self'` fallback (no `worker-src`/`child-src` present), but naming it keeps the policy explicit and future-proof against adding `child-src`.
3. Nothing else: `connect-src 'self'` covers `fetch()` of `/lumiere/env/hotel-room.exr` and `.glb`; `img-src blob:` already covers any object-URL textures GLTFLoader might create; shaders are inline GLSL strings (not CSP-gated); fonts are `next/font/local` (`font-src 'self'`). **No third-party origin is added.**

Exact edit (report-only policy only; pay-card untouched — it has no 3D):
```
script-src  'self' 'unsafe-inline' 'wasm-unsafe-eval' [existing hosts…]
worker-src  'self'
```
Plus one assertion each in `tests/csp.test.mjs` (`'wasm-unsafe-eval'` present in report-only, absent in pay-card; `worker-src 'self'` present in report-only). `app/api/csp-report/route.ts` unchanged.

## 5. Japanese typography plan

Facts: Instrument Serif (27 KB woff2 ×2), Manrope Medium (31 KB), Inter Tight Regular (105 KB, **unsubsetted**) hold no CJK. The site already loads **Noto Serif JP 500** (a Mincho) via `next/font/google` as `--font-jp`, with `:lang(ja) h1,h2,h3 { font-family: var(--font-jp) }` and a gate (`lib/jp-font-defer.ts` + `components/site/jp-font-gate.tsx`) that defers the 37 unicode-range slices (568 KB) until `window.load` — today only on `/ja` (home).

Plan:
1. **Display face per language**: EN headings `--font-instrument-serif`; JA headings `--font-jp` (Noto Serif JP 500) with Latin fragments inside JA lines (e.g. "Cha Jewels", "K18") in Instrument Serif via `font-family: var(--font-instrument-serif), var(--font-jp)` fallback order — the browser picks Instrument Serif for Latin glyphs and Noto for CJK automatically, so no span juggling.
2. **Italic capitals**: Lumière's `TextRun.italic` is applied only when the run is Latin; a `runsFor(lang)` helper strips `italic` for JA (DESIGN.md: "never fake an italic on Japanese"). JA lines open on a roman character.
3. **Letter reveals**: `spring-text-engine` splits plain strings on ASCII space and letters with `split("")`. For JA: no spaces → the whole line is one "word", animated per UTF-16 code unit. Kana/kanji in the BMP are safe; a JA string containing a surrogate pair (rare kanji, emoji) would split into two broken halves — guard by routing text through `Array.from()`/`Intl.Segmenter` before building runs (the existing `fx/split-text.tsx` already does this; reuse the segmenter) and by pre-splitting JA lines into one `LetterReveal` per visual line. Consequence to accept: `wordBlur` (per-word blur in swaps) blurs a JA line as one block — that is correct behaviour for a line that has no words; `wrap` mode (tagline) cannot wrap JA, so the JA tagline is set in named lines like the headline.
4. **Tracking/uppercase**: Lumière's `uppercase` + `tracking-utility` utility labels (nav, pills, "EXPLORE COLLECTIONS") are Latin-only idioms. JA labels get `text-transform: none; letter-spacing: 0` via `:lang(ja)` rules; JA label strings come from `lib/i18n.ts` as today (no CJK literals in `.tsx`, `check:i18n`).
5. **Font gate scope** (D-15): keep the existing deferral on `/ja` for P1–P3; evaluate extending `deferJpFont` to all JA routes in P5 with the LCP numbers in hand (the gate exists precisely for this).
6. **Inter Tight**: subset to Latin + punctuation with `pyftsubset` into `public/lumiere/fonts/` (expect ~105 KB → ~25 KB). Instrument Serif and Manrope are already small.
7. Line heights: Lumière's negative `margin-block` cap-trims (`capTrim(size, leading, cap)`) assume Latin cap heights (0.725 serif / 0.7625 sans). For JA set `--cap-ratio` to 0.88 (full-height ideographs) so trims do not clip; keep leading ≥ 1.1 as Lumière's text-engine rule demands.

## 6. File-by-file port list (Lumière → this repo)

Legend: **P** = port verbatim (types kept, paths rewritten), **A** = adapt (data-driven / Cha Jewels content), **N** = not ported, **R** = replaced by our existing system.

| Lumière file | → Target | Mode | Note |
|---|---|---|---|
| `src/app/fonts.ts` + `src/app/fonts/*.woff2` | `app/fonts.ts`, `public/lumiere/fonts/` (or `app/fonts/`) | A | Inter Tight subset; Playfair/Inter stay until P3 then removed (D-14). |
| `src/app/globals.css` `:root` tiers + media overrides | `app/lumiere/tokens.css` | P | See §2. Drop dark-mode block (D-12). |
| `globals.css` `@layer components` (`.collections*`, `.featured*`, `.philosophy*`, `.footer*`) | `app/lumiere/blocks.css` | P | Verbatim; the `.footer*` block is then extended for Cha Jewels columns (§8). |
| `globals.css` `@utility inset-safe/min-h-stage` | `app/lumiere/utilities.css` | P | `snap-strip` dropped (unused). |
| `globals.css` `@layer base html{font-size}` | — | N | §3.1. |
| `src/app/layout.tsx` | `app/layout.tsx` (merge) | A | Take `<ScrollLayout>`, `<ReducedMotion>`; keep our fonts gate, analytics, consent, JSON-LD, metadata. `origin-sync` script N (we have canonical handling). |
| `src/app/page.tsx`, `views/home.tsx` | `app/page.tsx`, `components/lumiere/home/home-view.tsx` | A | `robot` prop and `RobotProvider` N. |
| `src/app/robot-view/*`, `src/proxy.ts`, `utils/bot-ua.ts`, `components/common/robot-view.tsx`, `robot-text.tsx` (robot branch), `types/robot-view.d.ts` | — | N | Spec §3.4. `RobotText`'s lazy-mount branch (plain text until near view) is kept inside `letter-reveal`. |
| `src/app/robots.ts`, `sitemap.ts`, `lib/site.ts`, `utils/seo/*`, `app/privacy-policy/*`, `views/legal/*`, `data/mocks/legal.ts`, `app/api/contact/route.ts`, `lib/api/index.ts`, `src/env.ts`, `components/common/cookie/*` | — | N / R | Ours exist (SEO governance; `consent-banner.tsx`; `contact-form.tsx`). Cookie banner **look** is re-created on our `consent-banner.tsx` (P3). |
| `src/components/common/grid/*`, `hooks/use-adaptive-grid.ts` | — | N | §3.1. `utils/design-unit.ts` (`cssNumber`, `designUnit`) **P** → `lib/lumiere/design-unit.ts`. |
| `src/layouts/scroll-layout.tsx`, `hooks/smooth-scroll/use-scroll.ts` | `components/lumiere/scroll-layout.tsx`, `lib/lumiere/scroll-store.ts` | A | Add path allow-list, reduced-motion skip, `lib/scroll-lock.ts` bridge for the four existing lockers. |
| `src/lib/animation/{ticker,doc-box,smooth-scroll-y}.ts` | `lib/animation/*` | P | Shared ticker becomes the one rAF for HeaderShell too. |
| `src/hooks/animation/{use-render-loop,user-resize-loop,use-motion-off}.ts`, `hooks/{use-scroll-progress,use-in-view,use-window-size}.ts` | `hooks/animation/*`, `hooks/*` | P | `use-scroll-progress` reads `getBoundingClientRect` per frame — move onto doc-box in P5 (forced-reflow item, §10). |
| `src/stores/preload-store.ts` | `lib/lumiere/preload-store.ts` | P | |
| `src/components/common/{letter-reveal,text-swap,preloader,reduced-motion,warm-below-fold}.tsx` | `components/lumiere/common/*` | A | Preloader: session-once + cap (spec P1), Cha Jewels logo plate; `letter-reveal` gains the JA segmenter path (§5). |
| `src/utils/scroll-to.ts` | `lib/lumiere/scroll-to.ts` | A | Route through `lenis.scrollTo`. |
| `src/lib/scene/device.ts`, `jewellery-presets.ts`, `pendant-ready.ts`, `rings-ready.ts`, `pendant/{gem-material,pendant-scene,studio-environment,studio-hdri,exr-decode.worker}.ts`, `rings/rings-scene.ts` | `lib/scene/**` | P | Shaders, `M_presets`, budgets, `DISPERSION==2`, worker — character for character. Asset URLs → `/lumiere/models/**`, `/lumiere/env/hotel-room.exr`. |
| `src/views/home/hero/*` (20 files: `hero.config.ts`, `hero-geometry.ts`, `hero-section/stage/cluster/pendant/header/headline/footer/hover/reveal/motion/progress/text-swap/icons`, `category-index.tsx`, `text-runs.tsx`, `use-hero-tilt.ts`) | `components/lumiere/hero/*` | P (geometry/motion) + A (content) | Constants verified identical to the master prompt (`DESIGN, TABLET, CARD, CLUSTER, FRAME_2, TIMELINE, CATEGORY, CATEGORY_SCALE, PENDANT*, PENDANT_FOG, TEXT_SWAP, HERO_INTRO, HERO_TILT, FRAME_3_COMPACT, RING_TOP, FLIPPED_POSITIONS`). `hero-header.tsx` is **replaced** by the P3 site header (same motion, our links/sign-in/cart/search/lang). `category-index` → 5 pills. |
| `src/views/home/collections/*` (`collections.config.ts`, `cap-trim.ts`, `reveal-queue.ts`, `collection-card.tsx`, `collections-reveal.tsx`, `collections-section.tsx`) | `components/lumiere/collections/*` | P + A | 5 real categories (D-8 layout). |
| `src/views/home/featured/*` (`featured.config.ts`, `-easing`, `-trajectory`, `-progress`, `-motion`, `-stage`, `-rings`, `-icons`) | `components/lumiere/featured/*` | P + A | Pieces come from `lib/lumiere/placeholders.ts` now, Hub later; "Add to cart" pill → `components/commerce/add-to-cart.tsx` Server Action. Prices: D-7. |
| `src/views/home/philosophy/*` | `components/lumiere/philosophy/*` | P + A | Lines from `lib/content/about.ts`/`why` (D-6); "Our story" → `/about`. |
| `src/views/home/footer/*` (`footer.config.ts`, `footer-section.tsx`, `footer-icons.tsx`, `subscribe-form.tsx`) | `components/site/footer.tsx` (rebuilt in Lumière CSS) | A / R | `subscribe-form.tsx` **R** by our `newsletter-form.tsx` (Server Action, honeypot, rate limit) restyled. |
| `src/data/mocks/{home,collections,featured,philosophy,footer}.ts` | `lib/lumiere/placeholders.ts` (assets, names, prices, alts) + `lib/content/lumiere-home.ts` (real Cha Jewels copy, JA/EN) | A | Every money figure and "Rose gold"/"Yellow gold" label in the mocks is placeholder-only and never reaches production (§9). |
| `public/assets/**` (28 MB PNG/JPG), `public/models/**` (928 KB), `public/env/hotel-room.exr` (189 KB) | `public/lumiere/{hero,collections,featured,philosophy,models,env}/**` | P | Convert the PNG photographs to lossless-ish WebP/JPG sources ≤ 1 MB each before commit (repo weight; `next/image` serves AVIF/WebP anyway). `logo.png` (Lumière wordmark) **N** — replaced by the Cha Jewels logo (D-3). |
| `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.cursorrules`, `obsidian/`, `assets-source/`, root `hero-*.jpg`, `yarn.lock`, `.vercel/`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `eslint.config.mjs` | — | N | Repo rules win. `obsidian/meta/optimization-history.md` invariants are honoured in code (§10). |

## 7. Route-by-route restyle list

All 45 bare routes + 22 `app/[lang]/**` wrappers (which re-export the bare page; no separate work). Phase = when it gets the Lumière design. Reference = §7 pattern of the spec. Every form keeps its validation, honeypot, consent and agreement gates unchanged.

| Route(s) | Phase | Reference pattern | Notes |
|---|---|---|---|
| `/`, `/[lang]` | P2 | Lumière home (5 blocks) + Cards Almanac (layaway steps, testimonials), Carousel Spotlight (new arrivals), Colonnade (why/services), Brewns (calculator digits) | Sections in order: preloader → hero → collections (5) → featured → philosophy → new arrivals → testimonials → layaway band + calculator (EN only) → loyalty (new, D-21) → footer. `RecentlyViewed` and `ValuesBento` content folds into philosophy/why columns (nothing dropped: values copy reused). |
| every page (header, footer, announcement bar, Messenger FAB, consent banner, mobile tab bar, flash notice) | P3 | Lumière header/footer; Halden recolouring header + giant footer wordmark | `--hdr-h`/`--announcement-h` contracts kept. |
| `/collections`, `/collections/[slug]`, `/categories/[slug]`, `/sale`, `/search` | P4 | Halden (grid, filter pills, full-screen search overlay) | `CatalogGrid` filter sheet → Halden pills; `/search` stays `noindex,follow`; JSON-LD/breadcrumbs untouched. |
| `/products/[slug]` | P4 | Herbier Blanc (envelope → certificate; paper sheets) + Brewns card lean; Aerra turntable later | PriceBlock/AddToCart/ReserveWithLayaway (EN)/LayawayCalculator (EN)/PointsLine/PaidyWidget/BuyBar/OriginBadge/ReviewList/GalleryViewer all kept. **No 3D on product pages** (DESIGN.md rule; D-4). |
| `/about`, `/why-cha-jewels`, `/affiliations` | P4 | Aerra (numbers out of blur) + Colonnade | `fx/emblem.tsx` restyled; about timeline numbers = the "counting" numbers. |
| `/blog`, `/blog/[slug]` | P4 | Lumière type + letter reveals | Comments form (signed-in Server Action), share bar kept; BlogPosting JSON-LD untouched. |
| `/faq`, `/jewelry-guide`, `/shopping-guide` | P4 | Lumière type; Colonnade for guide chapters | `FaqNav` sticky, ring/necklace sizers kept; FAQ JSON-LD untouched. |
| `/layaway` (EN only), `/loyalty`, `/loyalty/join` (gated), `/wholesale` | P4 | Cards Almanac (steps), Brewns (calculator), Colonnade | `/layaway` stays `notFound()` on ja; tier medallions (`fx/tier-icon.tsx`) **kept as-is**, restyled around. `InquiryForm` kept. |
| `/legal/{privacy,returns,terms,tokusho}` | P4 | Lumière legal type (restrained) | No announcement/consent banner (existing rule); JA layaway articles stay dropped; company block verbatim (D-1). |
| `/contact` | P4 | Lumière forms | `ContactForm` Server Action, honeypot, rate limit kept. |
| `/cart`, `/cart/restore` | P4 | Lumière + Brewns price card | `.stickact` bar restyled; layaway gating kept. |
| `/checkout`, `/checkout/complete/[order_id]`, `/checkout/complete/d/[draft_id]` | P4 | Lumière forms, no smooth scroll (D-13) | Mode fieldset, agreement step (`agreement_required`/`agreement_unverified`, fail closed), points/consent/cart-reminder checkboxes, card = 501 — unchanged. |
| `/account`, `/account/{orders,orders/[id],orders/[id]/pay-card,layaway,layaway/[id],receipts,receipts/[id]/pdf,addresses,service-requests,complete-profile}` | P4 | Lumière forms/tables | `pay-card` enforced CSP + nonce untouched (no Lenis, no 3D); `/account/layaway*` stay EN-only `notFound`. |
| `/login`, `/auth/confirm`, `/auth/callback`, `/already-registered`, `/review/[token]`, `/receipts/verify`, `/newsletter/unsubscribe`, `/cart-reminders/unsubscribe` | P4 | Lumière forms | `noindex` flags kept; `ReviewForm` honeypot/photo limits kept. |
| `/not-found`, `/error`, `/robots.ts`, `/sitemap.ts`, `opengraph-image`, all `app/api/*` routes | P4 (not-found/error) / never | — | SEO and API files are not touched. |

## 8. Where every Cha Jewels detail lands

| Detail (owner brief) | Source today | Lands in Lumière |
|---|---|---|
| Cha Jewels logo (header, preloader, footer) | `public/images/brand/logo-badge-{96,192,512}.webp` (square badge, WebP only, no SVG) + text wordmark "Cha Jewels" (`.gilt`, Playfair) | Lumière's wordmark slot is an image plate recoloured with `brightness-0 invert` for the inverted/footer state. The badge works for that filter; the text wordmark is reset in Instrument Serif. **D-3** asks whether the owner supplies a transparent full-logo asset. |
| JA/EN toggle (JA primary) | `lang-switcher.tsx` (plain `<a href>` to switch target, or `POST /api/lang` + refresh; never orange) | Header right group next to Log in / Cart, Lumière roll-hover label; JA first. Same component logic. |
| Nav links | `nav` + `navMenu` in `lib/i18n.ts`: Collections ▾ (Hub collections + 5 categories + MenuStory), Company ▾ (About, Why, FAQ, Blog, News, Contact, Affiliations), Layaway (EN), Sale (when any), Loyalty, Wholesale, Shopping Guide, Jewelry Guide | Lumière header has 4 left labels. Plan: left = Collections, Blog, About, Layaway (EN) / Guide (JA) with roll hover; everything else in the Collections and Company mega-panels restyled as Lumière cream panels; the phone burger menu lists **all** links (not Lumière's five). **D-19** on keeping the mobile tab bar. |
| Live sign-in, cart count | `readSession()` server-side; `cartCount()` from `cj-cart` cookie; `CartBump` on `cj:cart-added` | "Log in" → signed-in `AccountMenu` (My account, Orders, Layaway EN, Receipts, Addresses, Service requests, Points, Sign out); "Cart (n)" with live `n`, bump kept. |
| Search | `search-box.tsx` combobox → `/api/search`, Enter → `/search` | Halden full-screen overlay restyle of the same component; `/` shortcut kept. |
| Announcement bar | Hub `settings.announcement`, sessionStorage dismiss, never on `/legal/*` | Thin ink band above the fixed header; publishes `--announcement-h` as today. |
| Messenger button | `.messenger-fab` on product/collection/cart/checkout/layaway/loyalty/wholesale paths | Same paths, Lumière pill styling (`--raw-color-featured-pill` family). |
| Hero copy JA/EN | `hero.h1a/h1b`, `lede`, `lede2`, `home.heroSince`, `brand.originNote` | Headline (rest): EN "Timeless beauty to wear." / JA 「身につける、時を超える美しさ。」; headline (photo): EN "Lasting value to pass on." / JA 「受け継がれる、確かな価値。」; tagline (rest): first clause of `hero.lede`; tagline (photo): `home.valuesP`-derived line. All four are **new placements of existing lines** and the JA line-breaks are new → **D-5** approval. `brand.originNote` keeps its exact wording in the hero footer band (only approved origin phrasing). |
| Hero category index + collections block (5) | Hub categories `fine-jewelry`, `preloved-jewelry`, `preloved-branded-jewelry`, `preloved-watches`, `preloved-designer-accessories`; blurbs in `lib/content/frame.ts` | Index: 5 pills, `categoryStops` becomes `[0, .096, .192, .288, .384]` over the same 0.48 rotation (one more step, same pitch 42). Collections: 5 cards — **D-8** chooses 2+3 rows vs 2 rows + full-width fifth. Notes = `CATEGORY_BLURB[slug][lang]`; links `/{lang}/categories/{slug}`. |
| Featured block | Lumière stage + 5 rings | Stage/3D unchanged; names/prices/materials from `lib/lumiere/placeholders.ts`, marked placeholder; "Add to cart" → existing Server Action (disabled while the piece is a placeholder). Prices: **D-7**. |
| Philosophy block | `lib/content/about.ts` questions/closing, `why.sub/close`, `home.valuesH/P` | Display lines: EN "Is it authentic?" / "What could it be worth in the future?" / "Real materials. Clear details." / "Jewelry you can choose with confidence." / "Find a piece that becomes part of your story."; JA 「これは本物ですか。」「将来、どれくらいの価値になりますか。」「確かな素材。明確な情報。」「自信を持ってお選びいただけるジュエリーです。」「お客様の物語の一部となる一点を。」 Notes from `valuesP`/`lede2`. "Our story" → `/about`. **D-6** approval (JA line splits are new). |
| Testimonials | `hub.testimonials()` + `hub.reviews()` via `lib/stories.ts` (layaway stories EN-only) | Cards Almanac stack; quotes verbatim `pre-wrap`. |
| New arrivals | `hub.featured(8)` → `isShowableArrival` → `ArrivalCard` | Carousel Spotlight ring; `ProductCard` data unchanged. |
| Layaway band (EN) + calculator | `layaway-band.tsx` (copy `home.lay*`), `layaway-calculator.tsx` → `layawayQuote` → `hub.layawayQuote` | Band as Cards Almanac steps; calculator logic file unchanged, new surface; `RollingValue` replaced by Brewns digit-roll (still only displaying Hub figures); gate `layawayOffered(lang)` at the caller. |
| Loyalty | `/loyalty` only today (no home section) | New home band "Points & levels" linking `/loyalty`, medallions untouched. **D-21** confirms adding it. |
| Footer: Hub settings | `lib/settings.ts`: `social.follow` keys `email|facebook|messenger|whatsapp|line`, `footer.tagline`, `contact.email` | Social row = those five (Instagram/TikTok dropped per spec); tagline under the logo only (owner 2026-09-26). |
| Footer: company block | `lib/content/legal.ts`: `COMPANY_NAME` = `Ｃｈａ　Ｊｅｗｅｌｓ株式会社` (fullwidth, never normalised), `COMPANY_NAME_DISPLAY.en` "Cha Jewels Co., Ltd. (…)", `REPRESENTATIVE_NAME`, `COMPANY_ADDRESS`, `SECONDHAND_PERMIT_NO 307762418064`, `INVOICE_REG_NO T7011801044120`, phones; trust ledger strings in `i18n.trust` | Lumière footer gets a fourth "Company" column rendering these constants. **No 法人番号 constant exists** and the spec's "株式会社チャジュエルズ" contradicts the registered name in code → **D-1, D-2**. |
| Payment marks | `card-marks.tsx` (Visa, Mastercard, Amex, JCB, Diners, Discover) + `PaidyMark`, always shown | Bottom row, monochrome on ink. |
| Newsletter | `newsletter-form.tsx` + `subscribeAction` (honeypot `company`, regex, `hub.subscribe`, 429 handling) | Lumière e-mail line markup, our action. Note copy from `footer.newsletterNote` not Lumière's. |
| Legal links + rights line | `/legal/privacy`, `/legal/terms`, `/legal/returns`, `/legal/tokusho` (+ FAQ, guides, Cookie settings button) | Bottom-left meta row; "© {year} Cha Jewels" from `COMPANY_NAME_DISPLAY[lang]`. |
| Consent banner | `consent-banner.tsx`, `localStorage cj-consent`, ads gating | Logic untouched; Lumière card styling, bottom-left on `lg`. |
| Every inner route | §7 | §7 |

## 9. Placeholder guard

Facts: `scripts/` already hosts eight `check:*` scripts with the same shape (scan dirs, regex, self-test arrays). CI (`.github/workflows/ci.yml`) runs on `push`/`pull_request` to `main` and `develop` only — **PRs into `redesign/lumiere` currently run no CI** (D-17). Vercel sets `VERCEL_ENV=production` only for `main` deploys; branch previews are `preview`.

Design:
1. **Single registry** `lib/lumiere/placeholders.ts`: exports `PLACEHOLDER_ROOT = "/lumiere/placeholder/"` and typed objects `heroCards`, `pendantPosters`, `collectionsPhotos`, `featuredPieces` (name, price text, materials, photo, poster, model), `philosophyPlates`, each tagged `placeholder: true as const`. **All** Lumière imagery lives under `public/lumiere/placeholder/**`; shared non-placeholder assets (fonts, `paper` texture, EXR studio) live under `public/lumiere/shared/**` so the path prefix alone separates "must go" from "may stay".
2. **`scripts/check-placeholders.mjs`** (`npm run check:placeholders`):
   - scans `app/ components/ lib/ public/` text files for `lib/lumiere/placeholders` imports and the literal `/lumiere/placeholder/`;
   - in **lenient** mode (default) prints the count and passes;
   - in **strict** mode fails on any hit. Strict is on when `VERCEL_ENV === "production"` or `--strict` is passed;
   - self-tests `MUST_CATCH` / `MUST_PASS` like `check-money.mjs`.
3. **Runtime belt**: `placeholders.ts` throws at import when `process.env.VERCEL_ENV === "production"` (server) — a production build that still references it fails during `next build`, before deploy.
4. **CI**: add a step `check:placeholders --strict` guarded by `if: github.base_ref == 'develop' || github.base_ref == 'main'`; add `redesign/**` to the workflow's `pull_request.branches` so redesign PRs run the whole suite in lenient mode (D-17).
5. **Build hook**: `npm run build` on Vercel keeps the default command; the script runs inside `prebuild` only when `VERCEL_ENV=production` (so preview builds never block).

## 10. Performance plan

Baseline (this repo's recorded production Lighthouse, mobile Moto G/Slow 4G, `docs/seo/PERF-STEP3-FINDINGS.md` 2026-10-29 and `docs/perf-baseline.md`): `/ja` 61–68 perf, LCP 7.4 s, TBT 62 ms; `/en` 85–86, LCP 4.1 s, TBT 28 ms; collection/category pages 88–90, LCP 3.7 s; product 78, LCP 4.6 s; CLS 0 everywhere; desktop 95–100. **No real-user CWV exist** (Speed Insights mounted, no field data recorded). Lumière reference (its vault, M1 Pro / Lighthouse mobile): 85–87 real-visitor, LCP 2.15 s, TBT 403–444 ms, open issue mobile TBT ≈ 340 ms (hydration + pendant build); its PageSpeed 100 was measured on the robot view, which we do not port. A fresh PageSpeed run for this report was blocked by API quota — rerun at P1 start and record in `docs/perf-baseline.md`.

Target: real-visitor mobile LCP, INP, CLS **no worse than production** per route. Plan, in order:

1. **Hero photo at q95 (Lumière's mobile LCP cause).** Lumière forces `quality={95}` on card-06/card-08 because the sources are 1024 px PNGs that block at q75 when stretched full-screen. Plan: ship ≥ 1440 px long-side sources (ask owner for Cha Jewels photos, D-16; interim: re-encode Lumière's PNG masters at 1440 px from `assets-source/` if present, else accept softness), set `quality={82}`, `sizes="100vw"` only for the frame-3 photo, `priority` only on the poster that is actually visible for the breakpoint (Lumière's `[data-preload] img` visibility rule already does this), `fetchPriority="high"` on exactly one image.
2. **Forced reflow.** Lumière's `use-scroll-progress.ts` calls `getBoundingClientRect` per frame on collections cards and the hero exit; our `HeaderShell` reads `scrollY` on every scroll event. Plan: all per-frame readers on the shared ticker, all geometry from `doc-box` (ResizeObserver-cached), header on the same ticker. Budget: zero layout reads inside the rAF (Lumière's own invariant).
3. **310 ms max-potential FID / INP.** Sources: hydration of the home tree + `PendantScene` construction (PMREM + BVH build + shader compile) + `RingsScene`. Plan: pendant build after the preloader's fonts/images settle, split with `yieldTask()` like the rings; rings 4 s after curtain (Lumière). On the mobile budget (`pointer: coarse` or `< 768`), **D-10** decides between live pendant (Lumière's choice, TBT ≈ 340 ms) and poster-only. Everything below the hero is `next/dynamic` client islands; the server-rendered copy stays real text.
4. **Inter Tight 103 KB.** Subset to Latin (§5.6). All four faces self-hosted with `next/font/local`, `display: swap`, `adjustFontFallback` on (CLS 0 kept).
5. **Lenis + springs cost.** One rAF for ticker + Lenis + spring loop; springs use `set()` for scroll stages (no async settle); `will-change` only on the moving nodes.
6. **Repo weight.** Lumière's 28 MB of PNG photos become ≤ 6 MB of WebP/JPG sources; `.glb` + `.exr` (1.1 MB) unchanged.
7. **Measurement gates (P5).** Lighthouse mobile ×3 median per route (Lumière's method), real-visitor UA (preloader and 3D on), plus Speed Insights 7-day INP once the preview has traffic. Record in `docs/perf-baseline.md` with the status vocabulary (READY FOR QA → VERIFIED).

## 11. Risks

1. **DESIGN.md conflicts** (hard rules today): "no scroll-jacking", "no pill buttons, glassmorphism navbars", "Orange means buy", "3D stays on stage — no WebGL on product pages or cards", "gilt is earned", contrast ledger. Lumière breaks the first three on purpose (pinned scrubbed sequences, frosted pills, no accent colour) and its featured block is a 3D product card. Without an explicit owner ruling the redesign violates the repo's own design law (D-4).
2. **Scroll regressions in transactional flows** (checkout step scrolling, card form, drawers). Mitigation: Lenis off on `/checkout/**`, `/account/**`; `lib/scroll-lock.ts`; P4 keyboard/scroll test on every dialog.
3. **Japanese text in a Latin-designed engine**: no wrapping, no italics, cap-trim mismatch, surrogate pairs. Mitigation §5; JA fidelity is reviewed at 375 px on every PR.
4. **Mobile TBT/INP** from two WebGL scenes + hydration; the Lumière reference itself does not meet the "no worse than production" INP bar on phones without the mobile budget decision (D-10).
5. **Repo weight and Vercel build time** from 28 MB of assets if committed raw; mitigated by re-encoding before P1.
6. **CI gap**: redesign PRs run no checks until `ci.yml` branches include `redesign/**` (D-17). All `check:*` scripts will be run locally and the output pasted in each PR until then.
7. **Terminology guard friction**: Lumière mocks say "Rose gold"/"Yellow gold" (allowed — not `<country> gold`) and "jewellery" (spelling rule: "jewelry"). Placeholders stay behind the guard; `check:terms` will be extended with `jewellery` as a forbidden spelling in Cha Jewels copy files.
8. **Fidelity vs. the owner's bar**: the master prompt and the Next source agree on every constant checked; the remaining risk is the Tailwind-3 spacing translation (`--spacing: var(--step)` → prefixed scale) producing a one-unit drift somewhere. Mitigation: pixel-diff at 1440 and 375 against the GetLayers preview in P2 QA.
9. **Preloader vs LCP**: a curtain delays LCP by design; the session-once rule limits it to one paint per visit. Lighthouse (fresh session) will always see it — document the trade-off in `perf-baseline.md` rather than game it with a robot view.
10. **Company data mismatch** between spec and code (D-1, D-2) — must be settled before P3 footer work.

## 12. Owner decisions needed (one bundled list)

Each item: what, options, recommendation. Nothing in P1–P5 starts until these are answered or explicitly deferred.

- **D-1 Registered company name in the footer/legal block.** Spec §5 says 株式会社チャジュエルズ; `lib/content/legal.ts` (owner-confirmed, PRODUCT.md) says `Ｃｈａ　Ｊｅｗｅｌｓ株式会社` / "Cha Jewels Co., Ltd." Recommend: keep the code's registered name verbatim.
- **D-2 Corporate number (法人番号).** No constant exists; only the invoice registration `T7011801044120` and permit `307762418064`. Supply the 13-digit number to add, or confirm the footer shows invoice + permit only. Recommend: supply it.
- **D-3 Logo asset.** Only the square WebP badge (96/192/512) and a text wordmark exist. Lumière's header/preloader/footer use one image plate recoloured by filter. Options: (a) badge + Instrument Serif "Cha Jewels" wordmark; (b) owner supplies a transparent SVG/PNG of the full logo. Recommend (b) if available, (a) otherwise.
- **D-4 DESIGN.md supersession.** Confirm that for `redesign/lumiere` the Lumière rules replace: no-scroll-jacking, no pill buttons/glass, Orange-means-buy (Lumière has no accent: keep orange only on buy/pay/contact actions? or drop it?), gilt rule, and the "no 3D on product cards" rule for the featured block only (product pages stay 3D-free). Recommend: adopt Lumière for home chrome; keep orange on buy/pay/contact CTAs; product pages remain 3D-free.
- **D-5 Hero copy placements (new lines, JA/EN).** Rest headline EN "Timeless beauty to wear." / JA 「身につける、時を超える美しさ。」; photo headline EN "Lasting value to pass on." / JA 「受け継がれる、確かな価値。」; rest tagline = first sentence of `hero.lede`; photo tagline from `home.valuesP`. Approve wording and JA line breaks.
- **D-6 Philosophy display lines (JA/EN)** as listed in §8, drawn from `about.ts` and `why`. Approve or edit.
- **D-7 Featured placeholder prices.** Lumière shows USD; the rule says every customer-facing figure comes from the Hub. Options: (a) show "¥ —" / "価格はお問い合わせ" placeholder pills on preview; (b) show Lumière's $ figures on preview only (never production, guarded). Recommend (a).
- **D-8 Five-card collections layout.** (a) 2 + 3 rows (narrow/wide/narrow third row); (b) Lumière's 2×2 plus one full-width fifth card; (c) 2×2 with the fifth category as the hero of the category index only. Recommend (a).
- **D-9 Preloader rule.** Spec P1 says home only, first visit per session, capped. Confirm cap (recommend 6 s like Lumière) and that inner pages never show it.
- **D-10 Phones and 3D.** (a) Live pendant and rings on phones with Lumière's mobile budget (TBT ≈ 340 ms risk); (b) posters only on phones, live on tablet/desktop. Recommend (b) until INP field data proves otherwise.
- **D-11 Rem grid.** Do not port the vw root font-size / AdaptiveGrid (§3.1). Confirm.
- **D-12 Dark mode.** Drop Lumière's `prefers-color-scheme: dark` override; site stays light. Confirm.
- **D-13 Lenis scope.** All public pages, **off** on `/checkout/**`, `/account/**`, `/login`, `/auth/**`. Confirm.
- **D-14 Fonts.** Replace Playfair Display + Inter with Instrument Serif + Manrope (+ Inter Tight for small sans) site-wide at P3; Noto Serif JP 500 stays as the JA Mincho. Confirm.
- **D-15 JA font deferral scope.** Keep deferral on `/ja` only until P5, then extend to all JA routes if LCP allows. Confirm.
- **D-16 Hero photographs.** Lumière cards are 1024 px PNGs upscaled on desktop. Provide Cha Jewels photos (≥ 1440 px long side) for the eight hero cards, four/five collection cards, five featured photos and the philosophy hand, or accept Lumière's as interim. (Interim is assumed.)
- **D-17 CI on redesign PRs.** Add `redesign/**` to `ci.yml` branch filters (lenient placeholder check) and `check:placeholders --strict` on `develop`/`main` bases. Confirm.
- **D-18 Header composition.** Which four labels sit left of the wordmark on desktop (recommend Collections · Blog · About · Layaway [EN] / Jewelry Guide [JA]); the rest live in the Collections/Company panels and the full phone menu.
- **D-19 Mobile tab bar.** Keep the existing 5-item bottom tab bar (restyled) alongside Lumière's burger menu, or drop it in favour of the burger only. Recommend keep (nothing dropped; it carries Account/Loyalty reach).
- **D-20 Existing motion primitives (`components/fx/*`).** Retire SplitText/Reveal/HeroShine/Spotlight/etc. in favour of the spring engine at P5; keep `tier-icon.tsx`/`tier-ladder.tsx` medallions. Confirm.
- **D-21 Loyalty on home.** No loyalty section exists on the home page today (only nav/tab links). Add a new Lumière band linking `/loyalty`, or keep links only. Recommend add.
- **D-22 Spelling guard.** Add "jewellery" to `check:terms` as a forbidden spelling in `lib/i18n*`, `lib/content/**`, `app/**`, `components/**` (placeholders file exempt). Confirm.

---
Appendix A — Master prompt vs Next source: every named constant in `hero.config.ts`, `featured.config.ts`, `philosophy.config.ts`, `collections.config.ts` matches the master prompt (`DESIGN`, `TABLET`, `CARD`, `CLUSTER`, `FRAME_2`, `TIMELINE`, `CATEGORY`, `CATEGORY_SCALE`, `PENDANT`, `PENDANT_COMPACT`, `PENDANT_FOG`, `TEXT_SWAP`, `HERO_INTRO`, `HERO_TILT`, `SLOTS`, `F_TIMELINE`, `SPREAD`, `RING_3D`, `PIECE_SWITCH`, `LETTER_REVEAL`, `REVEAL`, spring configs, `M_presets`). Differences are delivery-only: the prompt hotlinks WebP from `storage.getlayers.ai` and uses an import map and a Blob worker; the source has PNG/JPG under `public/assets`, `next/font/local` and a bundled worker. The source wins for the port; the prompt is the fidelity checklist.

Appendix B — UNVERIFIED items carried into P1: live CSP headers on `/` (curl saw none); Paidy widget iframe internals; Hub-side newsletter double opt-in; Lenis resync after native `scrollIntoView` in this repo; `block!` necessity against the engine's inline flex (Lumière's comments say yes).
