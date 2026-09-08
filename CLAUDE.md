# Cha Jewels website — working rules

## Ownership (same rule as Cha Jewels Hub ERP)
- **Claude Code** owns everything under `app/`, `components/`, `lib/` (frontend, UI, read-only audits).
- **Lovable** owns `supabase/functions/` and applies migrations. Claude Code may DRAFT SQL in `supabase/migrations/` and RPC contracts in `supabase/contracts/`, but never runs them.
- **Cynthia** runs all SQL in the Supabase SQL Editor.
- This is the SAME Supabase project as the Hub. Never create tables that duplicate Hub tables (`customers`, `orders`, `layaway_plans`, `layaway_payments`, `loyalty_ledger`). Read them; do not fork them.

## Non-negotiable business rules
- Layaway math is NEVER computed in the browser or in Next.js. Call the `layaway_quote` RPC. Same for points (`award_points`, `redeem_points`).
- Products are added in the Hub only. This site has no product editor.
- Cost basis, margin, and CSR commission columns must never be selected in any query that runs with the anon or authenticated role.

## Terminology (hard rule)
- Gold is described as **K18 gold, Made in Japan**.
- Forbidden anywhere in copy, alt text, metadata or product data: "Japan gold", "Japanese gold", "Saudi gold", "Italian gold", or any `<country> gold` phrasing as a purity claim.
- `npm run check:terms` must pass before every commit. It is also run in CI.

## Stack
Next.js 15 App Router, TypeScript strict, Tailwind, shadcn/ui components copied into `components/ui`, Supabase via `@supabase/ssr`. Product and collection pages are ISR (60 s) with on-demand revalidation from the Hub.
