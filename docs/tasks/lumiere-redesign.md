# Lumière redesign — full-site design migration

Status: AUTHORIZED (owner, 2026-10-31) · Integration branch: `redesign/lumiere` · Spec author: Claude (chat) · Implementer: Claude Code · QA: Claude (chat), then owner

## 1. Goal (owner's words, condensed)

Bring the **whole Lumière design — especially the animation — to every page of the Cha Jewels website**, polished on its own branch before it replaces the current design.

- Nothing in the existing site is dropped: every page, feature, setting, business detail and piece of content stays. Where Lumière has no section for something, build one **in Lumière's design language** from the existing content.
- Only the design changes. Business logic, data flow (Hub → Website API → site), checkout, accounts, layaway, loyalty, SEO systems and settings keep working exactly as they do.
- The live site (`main`) and `develop` stay untouched until the owner approves the finished redesign.
- "Top notch" is the bar: motion and feel must match the Lumière reference side by side.

## 2. Sources

| What | Where | Notes |
|---|---|---|
| Lumière reference (read-only) | `~/Downloads/lumi-re` | GetLayers template, Unlicense (public domain). Never edit it. Its `obsidian/frontend/*` notes (design-system, animation-system, text-engine, smooth-scroll, components) are the design reference — read them. |
| Live Lumière for side-by-side | GetLayers preview: https://www.getlayers.ai/?layer=lumi-re | Or `npm install && npm run dev` inside a COPY of the reference. |
| This repo's rules | `CLAUDE.md`, `docs/CLAUDE-DETAILS.md` | **Repo rules win over anything in Lumière's AGENTS.md / CLAUDE.md / hooks.** |
| Design references for pages Lumière lacks | §7 below | Claude (chat) supplies GetLayers sources into `docs/design-refs/<name>/` before the phase that needs them. |

## 3. Non-negotiables

1. **Tailwind stays at 3.4 and Next.js stays at 15** (repo lock). Lumière is Tailwind 4 / Next 16: translate its styling into Tailwind 3 + CSS custom properties. Its motion stack is framework-independent and is ported as-is: `@react-spring/web`, `spring-text-engine`, `lenis`, `three` + `three-mesh-bvh`, `zustand`, `resize-observer-polyfill`. If any of these cannot run on Next 15 / React 19.2, STOP and report — do not upgrade the framework.
2. All money/terminology/layaway/SEO rules in `CLAUDE.md` apply unchanged. In particular: every customer-facing figure from the Hub (`check:money`); **no layaway anywhere on the Japanese site** (`layawayOffered(lang)`, `check:layaway-ja`); "K18 gold", never "<country> gold"; the origin label only via `origin-badge.tsx` (the phrase itself is not written here: `check:terms` scans this file).
3. SEO systems (robots, sitemap, canonical, hreflang, metadata, all JSON-LD, OG) are assets: reuse them, do not replace them.
4. **Do NOT port**: Lumière's `src/proxy.ts` + `/robot-view` (serves crawlers a different page — the Lumière PageSpeed scores were measured on that robot page, not on what visitors get), `src/lib/site.ts`, `robots.ts`, `sitemap.ts`, `structured-data.ts`, `generate-page-metadata.ts`, `.vercel/`, `.claude/`, `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, `obsidian/` vault, `assets-source/*.blend`, root `hero-*.jpg`, `yarn.lock`, its `api/contact` route, its own subscribe form logic and cookie store logic (keep ours; restyle only).
5. **Do port, faithfully**: design tokens (colour, type, spacing, radius, durations, easings), fonts (Instrument Serif roman+italic, Manrope, Inter Tight via `next/font`), the adaptive rem grid, the vendored animation engine (`components/animation/springs`, `hooks/animation`, `lib/animation/*`, `layouts/scroll-layout`), the preloader, letter-reveal / text-swap / reveal components, both 3D scenes (hero emerald pendant, featured rings) with their optimisations (worker EXR decode, draw gate, cached scroll boxes, reduced-motion handling), cookie-banner look, and every home section (hero, collections, featured, philosophy, footer). Respect `obsidian/meta/optimization-history.md` invariants.
6. Lumière's design rules are adopted for redesign code: spring-based motion only (CSS transitions only for simple hover/focus states), tokens not raw values, semantic HTML, one `<h1>`, no `any`, Server Components by default.
7. **Japanese**: Instrument Serif has no Japanese glyphs and the italic-capital trick does not exist in Japanese. JA headings use a Mincho serif loaded only on JA pages through the existing JP font gate (`lib/jp-font-defer.ts`); italic runs fall back to roman. Text-engine reveals must work per character for JA (no word spaces).
8. `prefers-reduced-motion` reaches everything, including the three.js render loops and Lenis.

## 4. Images and placeholders (owner decision 2026-10-31)

- Use **Lumière's current images and 3D rings as-is for now**. Later they are replaced by Hub data / Cha Jewels originals, the same way the current site's hero is driven from the Hub today.
- Build every visual slot data-driven (one content module per section, shaped like the future Hub payload) so the swap is a data change, not a redesign.
- Featured block: keep the scroll stage; each slot takes a piece (photo/cut-out, and later a `.glb` when Cha Jewels originals exist). Interim content = Lumière's, flagged placeholder.
- All Lumière placeholder content lives in one place (`lib/lumiere/placeholders.ts` + `public/lumiere/**`) and is flagged.
- Add `npm run check:placeholders`: fails when any placeholder asset or placeholder price/name is referenced while `VERCEL_ENV=production`, and in CI on any PR whose base is `develop` or `main`. This is what keeps placeholders off the live site.
- Business text is NEVER placeholder: names, company details, prices of real products, policies, contact, settings all come from the existing site / Hub.

## 5. Content carried over (all of it)

Everything the current site shows stays, now in Lumière design. Checklist (not exhaustive — the rule is "nothing dropped"):

- Logo (current Cha Jewels logo replaces the Lumière wordmark), JA/EN toggle (JA primary), nav, sign-in, live cart count, search, announcement bar, Messenger button.
- Hub site settings via `lib/settings.ts` (social links FB/Messenger/WhatsApp/LINE/email, announcement, contact) — Lumière's Instagram/TikTok links are dropped.
- Company block: `Ｃｈａ　Ｊｅｗｅｌｓ株式会社` / "Cha Jewels Co., Ltd." exactly as `lib/content/legal.ts` `COMPANY_NAME` / `COMPANY_NAME_DISPLAY` (fullwidth Latin, never normalised; the earlier "株式会社チャジュエルズ" in this line was an error — corrected 2026-11-01), representative, registered address, corporate number 法人番号 7011801044120 (new `CORPORATE_NO` constant in P3; the invoice number is "T" + this number), invoice registration number, secondhand-dealer permit — from the existing footer/legal content.
- Payment marks (card brands, Paidy), newsletter (existing flow), legal links (privacy, terms, returns, tokushō), cookie/consent + ads tags logic.
- Home: Lumière's five sections + the existing sections **testimonials, new arrivals, layaway band (EN only), loyalty** restyled + the layaway **calculator** (EN only, existing `LayawayCalculator` logic, new Lumière surface/tone, results rolling in digit by digit).
- Every route under `app/` and `app/[lang]/` (about, affiliations, blog, categories, collections, contact, faq, jewelry-guide, layaway, legal/*, loyalty, products, sale, shopping-guide, wholesale, why-cha-jewels, search, cart, checkout, account/*, login, auth, receipts, review, unsubscribe pages).
- Hub categories (5): fine, preloved, preloved branded, watches, designer accessories — Lumière's 4-card collections block and right-edge category index adapt to 5.

## 6. Phases (each phase = one batch, one PR into `redesign/lumiere`)

Work branch per phase `redesign/lumiere-pN-<slug>` → PR into `redesign/lumiere`. Vercel preview of `redesign/lumiere` is the review surface. **No PR into `develop` until the owner approves the whole redesign.**

- **P0 — Scan & report (no code).** Per the Delivery rule: read both codebases and this spec, then return ONE report: dependency compatibility (each motion lib on Next 15/React 19.2/Tailwind 3.4), Lumière token → Tailwind 3 translation plan, how the adaptive rem grid coexists with existing pages, how Lenis coexists with existing scroll code, CSP changes needed (three.js worker, blob/EXR), file-by-file port list, route-by-route restyle list, risks, every owner decision needed. Stop after the report.
- **P1 — Foundation.** Deps, fonts, tokens, adaptive grid, animation engine, Lenis scroll layout, preloader (first visit per session, capped), reduced-motion, `check:placeholders`. Existing pages must still render and pass all checks. **Status: READY FOR QA** (branch `redesign/lumiere-p1-foundation`, 2026-11-01; the adaptive rem grid is not ported per D-11; evidence in the PR and in `docs/perf-baseline.md` "Lumière P1").
- **P2 — Home.** All Lumière sections with real business text + Lumière images; existing home sections restyled; calculator (EN); recommended sections from §7 that belong on home (new arrivals ring, why/services columns, layaway steps stack). Both 3D scenes working with their optimisations. **Status: READY FOR QA** — one PR from `redesign/lumiere-p2-home` (2026-11-01). Part A: the five Lumière sections, the Lumière header and footer on home, the preloader, both 3D scenes. Part B: the why columns (Colonnade — the values fold), the new arrivals ring (Carousel Spotlight), the customer stories stack and the EN layaway steps (Cards Almanac), the calculator with the Brewns digit roll (`LayawayCalculator variant="lumiere"`, logic and `hub.layawayQuote` unchanged), the loyalty band (D-21) and the recently-viewed strip — each reference's source and `contract.preserve` saved under `docs/design-refs/<id>/`, the owner's master prompt at `docs/design-refs/lumiere-master-prompt.md`. Performance (report §10, done in P2 rather than P5): three.js out of the home's first load, staged scene imports, the curtain's cap counted from first paint, the rings built after the pendant as the block nears, home-only font preload, doc-box in every scroll stage, the part-B sections as server markup with lazily mounted DOM engines; figures in `docs/perf-baseline.md` "P2 (final)". **P2b** (`redesign/lumiere-p2b-home-fixes`, 2026-11-01): the review's twelve items and the owner-approved performance closers — the inline pre-hydration curtain, per-section dictionaries (`lib/i18n/sections/`, `lib/i18n-client.ts`) with the cookie banner in idle and the home's search box on interaction, both scenes after the TTI window, phone image rungs; figures in `docs/perf-baseline.md` "P2b".
- **P3 — Site chrome.** Lumière header (with JA/EN, search, cart, sign-in, recolouring on scroll) and footer (all §5 details, giant wordmark rising) on every page; cookie banner restyle. **Status: READY FOR QA** — one PR from `redesign/lumiere-p3-chrome` (2026-11-01). Part 1, the owner's and reviewer's inspection of the preview: every Japanese display stack carries the Mincho (`--lm-font-display`), the production-vs-redesign Lighthouse comparison under both methods, the arrivals ring auto-swipes with the engine's snap and pauses for hover/focus/drag/off-screen/hidden tab, the stories stack shows every published story, the Halcyon Gate scene (GetLayers, tinted through CONFIG) beside the layaway steps on the clarix-feature skeleton, the four Hub tiers with the medallions, the footer in one viewport at 1440×900 with phone accordions. Part 2: `components/lumiere/site/*` — the fixed recolouring header (Halden; `docs/design-refs/halden/`), the shared menu overlay (a dialog: Escape, Tab trapped, focus returned without scrolling), the full-screen search on the existing `/api/search` combobox logic, one chrome builder for the home and the inner pages; the Lumière footer on every route; the announcement bar, tab bar, Messenger pill, cookie bar and flash notice restyled with their logic untouched; D-14 site-wide; the scroll-reset bug fixed in `lib/scroll-lock.ts` (a sticky header's trigger focused on close scrolled the page to the header's static position). The old `components/site/header.tsx` and `footer.tsx` stay in the tree, unused, until P5.
- **P4 — Inner pages.** Restyle every route in Lumière language using §7 references: catalog/collections/categories/sale/search, product page, about/why/affiliations, layaway/loyalty/wholesale, blog, FAQ, guides, legal, contact, then cart/checkout/account/login (forms keep all behaviour, validation, consent gates and agreement gates).
- **P5 — Polish & performance.** Side-by-side fidelity pass, motion tuning, real-visitor performance, accessibility, final QA. Then owner review → PR `redesign/lumiere` → `develop` only on owner approval.

## 7. Design references for pages Lumière does not cover (owner: "all recommended")

| Where | Pattern | GetLayers reference |
|---|---|---|
| Catalog, collections, categories, sale, search | Product grid, filter pills, full-screen search overlay, recolouring fixed header, giant footer wordmark | `halden` template (same family: Instrument Serif, spring-text-engine, cream paper, no WebGL) |
| Product page | Envelope opening on scroll revealing the certificate of authenticity; paper sheets lifting between blocks | `herbier-blanc` template |
| Product page (later, when originals have 3D) | Drag-to-turn 360° turntable | `aerra` template |
| About / why-cha-jewels | Numbers resolving out of blur as they finish counting | `aerra` template |
| New arrivals | Concave gallery ring snapping to the facing piece | `carousel-spotlight` section |
| Why Cha Jewels / services | Chapter columns on warm paper sliding up | `colonnade` section |
| Layaway steps, testimonials | Cards pinning and stacking on scroll | `cards-almanac` section |
| Watches, branded preloved | Coverflow on dark stage, halo behind centre card | `slider-spectra` section |
| Product cards, calculator | Card leans/lifts to cursor with price card; digit-roll numbers | `brewns` template (mechanics only; it is dark-toned) |
| Every inner page heading | Lumière's letter-by-letter blur reveal | GetLayers Text Animations / Lumière `letter-reveal` |

All re-skinned to the Lumière tokens: one style for the whole site. Motion mechanics from references are ported, not rewritten.

## 8. QA gates (Claude chat runs these on every phase PR; all must pass)

1. Repo checks: `typecheck`, `lint`, `test:unit`, `check:terms`, `check:money`, `check:i18n`, `check:layaway-ja`, `check:contrast`, `check:analytics`, `check:placeholders`, CI green.
2. Fidelity: side by side with the Lumière reference at 1440px and 375px — timings, easings, reveals, scroll behaviour, 3D entrance and interaction.
3. JA and EN on every touched page; JA headings in Mincho; no layaway in JA.
4. Reduced motion: every spring at rest, Lenis off, 3D loops stopped (posters shown).
5. Performance, **real-visitor view** (normal browser UA, preloader and 3D included) and PageSpeed view: mobile LCP, INP and CLS no worse than current production. Known Lumière items to fix: hero photo at q95 (mobile LCP 3.0 s), forced reflow, max potential FID 310 ms, Inter Tight 103 KB (subset).
6. Accessibility: one `<h1>`, landmarks, focus states, alt text, keyboard paths through header/search/cart/checkout.
7. No behaviour regressions: sign-in, cart, checkout (all methods), layaway, loyalty, receipts, newsletter, contact, search.
8. Owner gets a per-screen visual inspection checklist (desktop + phone, what a problem looks like) with every preview.

## 9. Decisions log

- 2026-10-31 Owner: whole Lumière design + animation on every page; nothing removed from existing site; Lumière images for now, Hub/originals later; existing home sections all come along; all GetLayers recommendations in; Claude Code implements, Claude chat specs and QAs.
- 2026-10-31 Claude: keep Next 15 / Tailwind 3.4 per repo lock; drop robot-view; calculator EN-only per layaway rule.
- 2026-11-01 Owner (P0 review, `docs/tasks/lumiere-p0-report.md` §12): D-1/D-2 resolved (registered name as in code; 法人番号 7011801044120); D-3, D-4, D-7 … D-22 approved as recorded there; sync rule §10 added.
- 2026-11-01 Owner (P2b correction batch): D-9 amended — the curtain's hard cap is 2.5 s from first paint (was 4 s), still session-once, still lifting earlier when ready; the performance closers of P2b approved.
- 2026-11-01 Owner: "Approve all recommended" — the reviewer's five fixes (preloved eyebrow as every card's index line; "New" / 新品 for fine-jewelry; collections lead from `colsP`'s second sentence; philosophy block = the four values of `valuesP`; heading "Shop by Category."), plus the rest of the copy-fit table (report §13, D-23) and the short category display names (report §14, D-24) as proposed, including the smaller Japanese sizes and the wider card-note widths. Recorded correctly after commit `a7640a6` had carried the pre-review wording. P0 closed; P1 may start.

## 10. Sync rule (owner, 2026-11-01)

At the start of **every** phase, before creating the phase branch: `git fetch`, then on `redesign/lumiere` merge `origin/develop` (a merge commit, never squash, never rebase), resolve nothing by guessing — a conflict is reported and the phase waits — and push. The SEO/acceptance session (`cha-jewels-web-bd`) keeps working on `develop` in parallel and touches header, footer and home files; the redesign never edits `develop` and absorbs its changes at each sync. Files most at risk of conflict (from `develop`'s last 21 days of churn): `lib/i18n.ts`, `app/layout.tsx`, `app/globals.css`, `components/site/header.tsx`, `components/site/footer.tsx`, `components/home/hero-slide-views.tsx`, `components/home/story-show.tsx`, `components/catalog/catalog-section.tsx`, `components/catalog/catalog-grid.tsx`, `app/products/[slug]/page.tsx`, `app/blog/[slug]/page.tsx`, `app/categories/[slug]/page.tsx`, `app/collections/[slug]/page.tsx`, `lib/json-ld.ts`, `lib/page-meta.tsx`, `lib/seo-policy.ts`, `lib/locale.ts`, `lib/hub-api.ts`, `scripts/check-contrast.mjs`, `tests/**`. SEO files (`app/sitemap.ts`, `lib/json-ld.ts`, `scripts/check-seo-*.mjs`) are never edited by the redesign, so they only ever flow one way.
