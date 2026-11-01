# Design System: Cha Jewels — Lumière (redesign/lumiere)

Status: ACTIVE on `redesign/lumiere` and its phase branches (owner decision D-4, 2026-11-01, `docs/tasks/lumiere-p0-report.md` §11.1, §12). On this branch it **replaces the visual rules of `DESIGN.md`** ("The Gilded Ledger": orange action colour, square corners, gold hairline bands, no pinned scroll). `DESIGN.md` stays in the tree for `develop`/`main` and for the rules this file keeps (below). When the redesign is approved into `develop`, this file becomes `DESIGN.md`.

Reference: the Lumière template (`~/Downloads/lumi-re`, GetLayers, Unlicense) — its `obsidian/frontend/design-system.md`, `animation-system.md`, `text-engine.md`, `smooth-scroll.md` and `meta/optimization-history.md` are the design and engineering reference; the tokens are ported verbatim into `app/lumiere/tokens.css`. The repo's own rules (`CLAUDE.md`, `docs/CLAUDE-DETAILS.md`) win over anything in the reference.

## What this file keeps from DESIGN.md (unchanged, still binding)

- **Accessibility**: one `<h1>` per page, landmarks, alt text, visible focus (2px outline, 3px offset), keyboard paths through header, search, cart, checkout; 24px minimum targets (the reference's featured dots are 24px for this reason); `prefers-reduced-motion` gets the final state — Lenis is not created, every spring rests, 3D shows its poster.
- **The Contrast Ledger Rule**: every new text/surface pairing, alpha or scrim gets a row in `scripts/check-contrast.mjs` before it ships (P2 adds the rows for white type over the collection photographs at 1440 and 375, the featured title over `photo-ring-0N`, the hero chrome over `card-08` after the invert, the footer's 50 % white). Add a scrim where a row fails; never lighten type.
- **Terminology** (`CLAUDE.md`): "K18 gold", origin only through `origin-badge.tsx`, the approved clarifier only, "jewelry" never "jewellery" (D-22; `check:terms`). Japanese is never uppercase-transformed or wide-tracked, never faked italic, never broken mid-word.
- **Layout safety**: no horizontal page scroll at any width (`overflow-x: clip` on html and body); pinned sections never trap focus or scroll; every dialog locks the page through `lib/scroll-lock.ts`; customer-facing text comes from `lib/i18n` / `lib/content` / the Hub, never a literal in a `.tsx` (`check:i18n`); every money figure from the Hub (`check:money`).
- **Commerce surfaces keep their behaviour**: checkout, payments, account, layaway gates, loyalty medallions (`components/fx/tier-icon.tsx`, owner's design, restyled around and never replaced — D-20), Paidy widget, JST dates.

## What changes (the Lumière rules)

### Palette — no orange accent
The page is Lumière's bone paper; type is black; the featured stage, the preloader and the footer are black with white type. **The "Orange Means Buy" rule is retired on this branch**: there is no orange. Calls to action are pills (black on cream, cream on black). Gold stays only where it is material (the pieces themselves, the loyalty medallions). Tokens (Tier 1 → Tier 2 → Tailwind utilities, `app/lumiere/tokens.css`, `tailwind.config.ts`):

| Role | Token | Utility | Value |
|---|---|---|---|
| Page | `--surface` | `bg-surface` | `#f4f0ec` (bone-100) |
| Type | `--content` | `text-content`, `bg-content` | `#000000` |
| Type on dark | `--content-inverse` | `text-content-inverse` | `#ffffff` |
| Hairline | `--border-muted` | `border-border-muted` | `#cfcfd0` (grey-300) |
| Category index, lit | `--index-active` / `-inverse` | `bg-index-active` | `#1c1c1c` / `#f9f7f4` |

Tier 1 holds the only literals. A new colour is a `--raw-color-*` primitive plus a Tier 2 role plus a `theme.extend.colors` entry — never a hex in a className.

### Typography
Instrument Serif (roman + italic) for display, Manrope 500 for UI, Inter Tight 400 for standfirsts and card notes (`app/fonts.ts`, `font-serif`, `font-manrope`, `font-tight`). Japanese display stays **Noto Serif JP 500** with Latin fragments falling to Instrument Serif; no Japanese italic; JA sizes per the copy-fit table (report §13: headline 56 u, collections heading 56 u / 28 px phone, card titles 44 u, pill strip 100 u). Type tokens are paired size + leading: `text-display`, `text-body`, `text-utility`, `text-nav`, `text-caption`, `text-micro`, `text-wordmark`, `text-collections-*`, `text-card-*`. Playfair Display and Inter leave at P3 (D-14).

### Spacing — the design unit
Everything in the Lumière compositions is a multiple of `--raw-unit-design` (one Figma pixel at 1440; floors and bands in `tokens.css`, identical to the reference's `hero.config.ts`). In markup: the prefixed scale `left-u-40`, `w-u-350`, `gap-u-48` (`tailwind.config.ts`), or `designUnit(n)` from `lib/lumiere/design-unit.ts` in a style. No rem grid (D-11): the existing pages' px/rem utilities are untouched.

### Shape
Pills and soft panels — `rounded-card` (32 u), `rounded-panel` (21.33 u), `rounded-pill` (8 u) — and frosted panels (`backdrop-filter`) for the header and the menus. The square 0–2px corners of `DESIGN.md` do not apply here.

### Motion
Spring-based (`@react-spring/web`, `spring-text-engine`); CSS `transition-*` only for hover/focus colour and opacity with token timing (`duration-[var(--duration-hover-in)] ease-hover`). **Pinned and scrubbed scroll sequences are allowed** (the hero's turn, the featured stage, the philosophy plate) — they read scroll on the shared ticker (`lib/animation/ticker.ts`) from cached document boxes (`lib/animation/doc-box.ts`), never `getBoundingClientRect` per frame. Lenis smooths the wheel on public pages only (D-13: off on `/checkout/**`, `/account/**`, `/login`, `/auth/**`); dialogs scroll inside with `data-lenis-prevent`. Heading entrances are `LetterReveal` (per letter, blur to sharp, 24 ms stagger, 1300 ms expo-out); copy swaps are `TextSwap` / `FadeSwap`. The preloader is home-only, once per session, capped at 2.5 s from first paint (D-9, amended 2026-11-01). The reference's optimisation invariants hold: EXR in a worker, gem dispersion split at the exit facet, rings built in idle in steps, desktop draw gate 12 ms, no phone cap, below-the-fold images warmed after the curtain, `sizes` on every poster.

### 3D
The home's hero pendant and featured rings are the **only** live 3D (D-4, D-10: live on phones too, posters only under Save-Data, `deviceMemory ≤ 4`, no WebGL2 or reduced motion). **Product pages and product cards stay 3D-free** until Cha Jewels originals have models. Every scene has a poster, a ready gate and an asset-error path (`components/lumiere/common/asset-banner.tsx`, preview only).

### Placeholders
Lumière's photographs, models and featured names are interim (D-16). They live in `lib/lumiere/placeholders.ts` + `public/lumiere/placeholder/**` and nowhere else; `npm run check:placeholders` is lenient on previews and strict on `develop`/`main`/production (D-17). Placeholder prices render "¥ —" and Add to cart stays disabled (D-7). Business text is never a placeholder.

## Phase status (docs/tasks/lumiere-redesign.md §6)

| Phase | Status |
|---|---|
| P0 scan & report | DONE (PR #459) |
| P1 foundation (deps, assets, fonts, tokens, engine, Lenis, common components, CSP, guards, this file) | DONE (PR #461) — existing pages render exactly as before |
| P2 home — A: the Lumière sections, header and footer on home, preloader, both scenes | READY FOR QA (`redesign/lumiere-p2-home`) |
| P2 home — B: why columns (Colonnade), new arrivals ring (Carousel Spotlight), stories stack and EN layaway steps (Cards Almanac), calculator digit roll (Brewns), loyalty band (D-21), recently viewed; home performance work (three.js out of the first load, home-only font preload, lazy islands, curtain cap from first paint) | DONE (PR #463) |
| P2b home fixes: the review's twelve items (index line at rest, clean `<h1>`, badge artwork, cookie bar instead of the card, colonnade imagery + copy in the panel, featured one-frame switch, header controls through the inversion, phone band above the tab bar, footer complete, hero demo, Hub loyalty tiers, fixture gating) and the four approved performance closers (inline pre-hydration curtain, per-section dictionaries + idle/interaction chrome, scenes after the TTI window, phone image rungs) | READY FOR QA (`redesign/lumiere-p2b-home-fixes`) |
| P3 chrome · P4 inner pages · P5 polish/performance | NOT STARTED |
