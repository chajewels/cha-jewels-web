# Cha Jewels website — working rules (core)
Storefront (Next.js 15 App Router, TS strict, Tailwind 3.4, shadcn/ui in `components/ui`, `@supabase/ssr`). Products live in the Hub; this site reads them only via the Website API.
**Full text of every rule below: `docs/CLAUDE-DETAILS.md`. Read its matching section before touching that area.**

## Run / check
`npm run dev` · `npm run typecheck` · `npm run test:unit` · before every commit: `npm run check:terms`, `check:money`, `check:i18n` (all run in CI).

## Key files
`lib/hub-api.ts` (only Hub access; spec `supabase/contracts/api.md`) · `lib/cart*.ts`, `lib/checkout-actions.ts`, `lib/card*.ts` · `lib/layaway-availability.ts` · `lib/site-time.ts` · `middleware.ts`

## Ownership and git
- Claude Code owns `app/`, `components/`, `lib/`. Lovable owns `supabase/functions/` + migrations; Claude only DRAFTS SQL. Cynthia runs all SQL.
- `main` = production (Vercel). Work on `develop` or feature branches into `develop`; PR `develop`→`main`; never push to `main`.
- Before starting: `git fetch` + `gh pr list --state all --limit 20` — if the work exists, stop and report. One session = one worktree; copy `.env.local` by hand, never commit it.

## Non-negotiable (details: CLAUDE-DETAILS.md "Non-negotiable business rules")
- **Money:** every customer-facing figure comes from the Hub. Never compute layaway, points, percentages, deposits or currency conversion in the browser or Next.js (`hub.layawayQuote`; no `toPhp`/`phpRate`/hardcoded rate). Guard: `check:money`.
- **No layaway on the Japanese site**, anywhere, via `layawayOffered(lang)` only. Guard: `check:layaway-ja`.
- Paidy widget, loyalty tier medallions, JST dates (`lib/site-time.ts`), `translate="no"`: owner decisions — see details before changing.
- Cost basis / margin / commission never render; if the API returns them, report a Hub bug.
- Products are added in the Hub only.

## Terminology (details: "Terminology")
- Say **K18 gold**. "Made in Japan"/日本製 only via `origin-badge.tsx` when `origin === "JAPAN"`, or the exact approved clarifier. Never "`<country>` gold".

## Sign-in, cart, checkout, card (details: matching sections)
- Supabase redirect allow-list rules and testing from the branch alias only; never add `https://*.vercel.app/**`.
- Cart cookie holds no prices; Server Actions only; a quote never reserves stock; drafts mode comes from the Hub.
- Layaway and card pay are agreement-gated, fail closed (`agreement_required` / `agreement_unverified`); card is HOLD only; `/checkout` card = 501 by contract. No `/live` route.
- Lock Tailwind at 3.4 (do not upgrade to v4).
