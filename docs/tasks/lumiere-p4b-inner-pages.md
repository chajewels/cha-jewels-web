# P4b — inner pages recomposed in the Lumière language (contract for every page)

Owner, 2026-11-01: P4 restyled the catalog, product, About and Why; the rest only took the palette. P4b recomposes **every** remaining inner page. Content, behaviour, SEO and legal wording are unchanged; the composition is new.

## The language (build from `components/lumiere/page/page-head.tsx` + `app/lumiere/inner.css`)
- **Head:** `PageHead` (gold eyebrow with rule, ONE `<h1>` through `Reveal`, lead, optional aside). `tone="ink"` for a black head band on pages that earn it (guides, loyalty, wholesale, layaway); `bone` otherwise. Never a second h1.
- **Grounds:** `PageSection tone="bone|white|sheet|ink"`. Alternate grounds down a page (bone → white sheet with a rounded top that overlaps → bone → ink) instead of one flat bone page with hairlines. Black bands carry the white/brass tokens already in the ledger.
- **Plates:** `.lm-plate` (22 px radius, white, hairline), `.lm-plate--bone`, `.lm-plate--ink`, `.lm-grid--2/--3`; replace square bordered boxes and `divide-y` lists with plates where the content is a set of things (posts, questions groups, contact methods, steps, policies).
- **Buttons / chips:** pills (`Button`, `.lm-pill`, `.lm-tag`, `rounded-pill`); the primary action is the black pill; **no orange**; no square corners left.
- **Type:** display face for headings (`.lm-h1`, `.lm-h2`, `font-display`), Manrope for labels; JA uses the Mincho stack via the tokens; no CJK literals in `.tsx` (strings stay in `lib/i18n.ts` / `lib/content/*`).
- **Motion (Lenis-safe, CSS or the shared tickers only):** `.lm-rise` on plates/sections (view timeline, at rest when unsupported or reduced motion), the head's `Reveal`, hover lifts on link plates. No pinned/scrubbed scroll on forms, checkout, account or legal pages.
- **References (§7 of lumiere-redesign.md):** Halden (catalogue-like lists, plates, sliding black band), Herbier Blanc (sheets lifting between blocks → `PageSection tone="sheet"`), Aerra (numbers), Colonnade (chapter columns, `components/lumiere/why/why-section.tsx`), Brewns (card lean: `components/catalog/lean-card.tsx`), Almanac/Slipstream are home only.
- **Navigation colours** live in `app/lumiere/nav.css` (`--nav-*` tokens): do not hard-code gold; eyebrows use `.lm-eyebrow` / `text-gold-dark` (warm ink) as before.

## Hard constraints (each is a gate)
- Keep every piece of content and every behaviour: forms keep validation, honeypot, rate limits, consent and agreement gates (`agreement_required` / `agreement_unverified` fail closed); card pay is HOLD; `/checkout` card = 501; pay-card keeps its enforced CSP and no Lenis; Lenis off on `/checkout`, `/account`, `/login`, `/auth`.
- **Do not edit** logic files: `lib/**`, `middleware.ts`, server actions, `components/commerce/{checkout-flow,card-pay,layaway-pay-form,paidy-pay,transfer-details,switch-method,paidy-profile-form,card-payment-status}.tsx` beyond className/markup wrappers that leave every handler, prop and branch intact. JSON-LD, metadata, canonical, hreflang untouched.
- Money from the Hub only (`check:money`); no layaway on `/ja` (`layawayOffered`); "K18 gold", "jewelry"; no CJK literals in `.tsx` (`check:i18n`); `check:terms`.
- One `<h1>` per page; no horizontal overflow at 375; every new text/ground pair gets a row in `scripts/check-contrast.mjs`.
- Page-family CSS goes ONLY in your family file: `app/lumiere/inner-content.css`, `inner-commerce.css` or `inner-account.css` (shared `inner.css` is the owner's — ask the lead for changes). Class names prefixed per family (`ic-`, `icm-`, `iac-`).

## Evidence (per page)
What was recomposed, which reference, before/after screenshots (1440 + 375, EN + JA) — the lead gathers them from `…/scratchpad/shots/p4b/<family>-before|after/`.
