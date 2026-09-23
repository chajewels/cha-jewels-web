# Web motion signature — task spec

Saved verbatim from the owner's brief (2026-09-23) so the spec lives in the
repo beside the work. Branch: `feature/web-motion-signature`, PR into
`develop`. Reviewed on the branch alias
`https://cha-jewels-web-git-feature-web-motion-signature-cha-jewels.vercel.app`
— the branch alias only, never a per-deployment URL (CLAUDE.md, Bug #264).

---

Read CLAUDE.md first. Ownership and business rules there override anything below.

Repo: chajewels/cha-jewels-web. Branch from develop: feature/web-motion-signature. Never commit to main. Open ONE PR into develop when done; Cynthia reviews on the branch alias https://cha-jewels-web-git-feature-web-motion-signature-cha-jewels.vercel.app (branch alias only, never a per-deployment URL).

FIRST: save this whole message as docs/tasks/web-motion-signature.md and commit it, so the spec lives in the repo.

## GOAL

A signature motion pass for the public website: "gilded maximalism, value-driven luxe", made WILD in craft but never cheap. Principle: each page gets ONE unforgettable moment; everything else moves slowly and with weight. Benchmarks for feel: Bulgari, Cartier, Tiffany editorial pages. Explicitly forbidden: custom cursor, particles/confetti/sparkles, scroll-jacking or smooth-scroll libraries (no Lenis), bouncy springs, parallax on text, autoplaying anything new, motion that blocks reading or tapping.

## HARD CONSTRAINTS (a PR that breaks any of these is not done)

1. Performance. Before touching code, run Lighthouse per docs/perf-baseline.md (one command per invocation, no loops) on preview develop: /, /collections/bracelets, one product — mobile default + --preset=desktop. Record in docs/perf-baseline.md. Re-run on the feature branch at the end. Budget (amended 2026-09-23 after the mobile LCP diagnosis — see docs/perf-baseline.md):

   - **Primary gate: OBSERVED LCP.** Lighthouse `observedLargestContentfulPaint`,
     or a throttled real-browser run, must not regress on /, the collection page
     or the product page. This is the gate because the simulated number is
     modelled rather than measured, and on this site observed LCP equals
     observed FCP on every run taken — the page paints its largest element with
     its first.
   - **Secondary: simulated mobile LCP**, judged on the median of 3 runs, and
     called a regression only if it moves beyond the observed run-to-run spread.
     That spread is wide: 3476–5717 ms across three runs of identical code on
     one machine.
   - **Homepage mobile transfer weight must not increase** beyond the result of
     PR `perf/mobile-weight`: **1317 KB**, down from 2786 KB.
   - Desktop Performance ≥ 95 on /. CLS stays ≤ 0.02. TBT not worse than +50 ms.
     Added client JS ≤ 35 kB gzipped total (report the real number from the
     build output). The medians to beat are in docs/perf-baseline.md — mobile `/` LCP **3629 ms**.
2. LCP rule. On FIRST page load, nothing above the fold may start at opacity 0 or be hidden by clip-path — the hero headline and hero image paint immediately. First-load hero motion is transform/sheen only. Mask/fade entrances above the fold run only on client-side navigation. Below-the-fold reveals may start hidden.
3. Reduced motion. Keep the blanket rule in app/globals.css. Wrap the app in `<MotionConfig reducedMotion="user">`, and additionally give every scroll-linked or pointer effect an explicit static fallback when reduced motion is on. Must react live if the setting changes (hero.tsx already subscribes — follow that pattern).
4. Pointer effects (tilt, magnetic, spotlight, glint) only under `(hover: hover) and (pointer: fine)`. Touch gets a gentler tap/in-view version.
5. Server components stay server components. Motion lives in small client leaf components under components/fx/. No data fetching, pricing, layaway, points, cart or checkout logic changes. Animated numbers only animate the DISPLAY of values the Hub already returned.
6. All copy through lib/i18n (JA and EN). npm run check:terms, check:contrast, check:i18n, check:analytics, typecheck, lint and build must pass. No new colors outside tailwind.config.ts tokens; any new text/background pairing gets a row in the contrast gate.
7. Anything running continuously (sheen loops, conic borders, marquee) pauses off screen (IntersectionObserver) and when document is hidden — same pattern as hero.tsx / testimonial-marquee.tsx.

## FOUNDATION (commit 1)

- Add the `motion` package (import from "motion/react"; React 19 compatible). Use LazyMotion with domAnimation and the `m.` components everywhere to keep the bundle small; load domMax lazily only if a layoutId effect needs it.
- lib/motion.ts: the site's single motion token file. Luxury timing, slower than the Hub: EASE_LUX = [0.16, 1, 0.3, 1]; durations reveal 0.9s, image 1.2s, micro 0.25s, stagger 0.06s; a heavy critically-damped spring for pointer follow. No inline one-off durations anywhere else.
- components/fx/motion-provider.tsx (client): LazyMotion + MotionConfig, mounted in app/layout.tsx.
- components/fx/reveal.tsx: in-view rise+fade, once, amount 0.25, with a stagger variant for grids.
- components/fx/split-text.tsx: splits a heading into units using Intl.Segmenter — grapheme units for Japanese, word units for English — each unit rises from a mask. Must keep the full text in the DOM for screen readers (aria-label on the wrapper, units aria-hidden) and must not break JA line wrapping (wrap units with word-break rules intact; test on 375px).

## 21st.dev SOURCING

- Use 21st.dev as a pattern source for: spotlight/glow card, shine or animated border, text reveal, magnetic button, tilt card. If the 21st.dev Magic MCP is available to you, use it to search; otherwise browse 21st.dev.
- Do NOT run `npx shadcn init` or `shadcn add` (there is no components.json; init would rewrite tailwind.config.ts and globals.css). Copy the source by hand into components/fx/, rewrite it onto our tokens (gold, gold-pale, gold-dark, chalk, charcoal), remove any dependency we don't need, convert it to `m.` + lib/motion.ts timings, and add pointer/reduced-motion guards.
- Only take MIT or similarly permissive code; put a one-line source/license comment at the top of each copied file and list them in the PR.

## SIGNATURE MOMENTS

### Homepage (commit 2)

- Hero: gold sheen sweeps once across the headline/wordmark on load (transform on a pseudo-element, transform-only), then every ~8s while on screen and not paused. On client navigation the headline enters via split-text. As the reader scrolls past, the hero media scales 1.0→1.06 and the content drifts and softens (useScroll/useTransform, transform + opacity only). Integrate with the existing Hero motion context — the existing pause button must also stop the sheen. Do not change video loading behavior.
- Primary CTA buttons: magnetic follow (max 6px), with a gold shine border on hover. Tap: slight press.
- Values bento: spotlight card — a soft gold glow follows the pointer inside each tile and lights the tile's border (21st.dev spotlight/glowing-border pattern).
- Collection cards: on enter, a gold hairline draws across the card top (scaleX 0→1), then the image wipes in (clip-path inset from bottom) with a 1.06→1 settle. Staggered across the row.
- Diamond divider: draws itself (SVG pathLength) when in view.
- Testimonial marquee: add edge fade masks and slow to half speed on hover (keep the existing pause/off-screen logic).
- New arrivals: staggered reveal.

### Catalog + product (commit 3)

- Product card: 3D tilt (max 6°, perspective 900px) plus a specular glint that follows the pointer across the image; image zooms 1.04 on hover. If the product has a second image, crossfade to it on hover. Sold-out cards get no tilt. No layout shift — the tilt lives on an inner wrapper.
- Product page gallery: image changes crossfade with a gentle scale settle; thumbnails get a sliding gold active indicator (layoutId).
- Add to cart: button morphs to a check state on success, and the header cart icon does a single small bump. Only animate after the Server Action returns success.
- Price block / layaway calculator: numbers roll to the Hub-returned value when it changes (display only; yen and peso both).

### Loyalty (commit 4)

- Tier ladder: a vertical gold line fills with scroll progress; each tier card lights up (border → gold, subtle glow) as the line reaches it. Crown VIP card gets a slow rotating conic metallic border (paused off screen). Tier data stays from the Hub.
- Join landing CTA: shine border + magnetic.

### Editorial pages: gold-guide, why-cha-jewels, about (commit 5)

- Gold guide: sticky scroll story — the image column pins while 3–4 text steps scroll past (e.g. what K18 means, the hallmark, how we authenticate in Japan); the pinned image crossfades per step. On mobile it becomes a simple stacked sequence with reveals. Copy must pass check:terms — "K18 gold", "authenticated in Japan", no "<country> gold", no site-wide origin claims.
- Headings on these pages use split-text below the fold, plain on first-load above the fold.

### Global chrome (commit 6)

- Header: hides on scroll down, returns on scroll up, gains a chalk/blur background after 24px. Never hides while a menu or the language switcher is open, and never when focus is inside it.
- Nav: a gold underline slides between hovered/active items (layoutId).
- Client-navigation page transition in app/template.tsx: a quick fade + 12px rise, skipped on the first load (LCP rule) and under reduced motion.

### VERIFY (commit 7)

- Run all checks listed in constraint 6.
- Lighthouse after-numbers next to the before-numbers in docs/perf-baseline.md, with the real added-JS figure.
- Playwright screenshots at 375px and 1440px of /, a collection, a product, /loyalty, /gold-guide — JA and EN — plus a reduced-motion set. Save them under docs/screenshots/web-motion-signature/.
- Record short Playwright videos (.webm) of the homepage scroll, a product card hover, and the loyalty ladder at 1440px, so Cynthia can judge the motion without a phone.
- Keyboard pass: every magnetic or tilt element is still reachable and has a visible gold-dark focus ring on light surfaces.
- Write a PR description listing: each signature moment and where it lives, 21st.dev sources and licenses, the budget table (before/after), and anything cut for performance.

If any effect cannot meet the budget, cut or simplify it and say so in the PR — do not trade LCP for flourish. Do not message Lovable; nothing here needs a deploy or migration.
