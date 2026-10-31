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

## Delivery rule (owner, 2026-10-31; details: CLAUDE-DETAILS.md "Delivery rule")
- Deliver each agreed priority/phase end to end in ONE batch and ONE reviewable PR. No fragmenting into single findings, single-word changes, or small documentation PRs split away from the batch they record. A documentation-only PR is fine when documentation IS the agreed priority (an audit, a decision record, a register the owner asked for).
- Before coding: complete the requirements/dependency/conflict scan and bundle every blocker and owner decision into one report. After scope is authorized: implement code, tests, documentation and verification together, then return the complete diff, tests, acceptance evidence and limitations at once. QA returns one consolidated correction batch. Production approval gates and other sessions' work are preserved.

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

## SEO Implementation Governance

1. Before implementing any SEO recommendation, inspect the current repository first and confirm whether the functionality already exists.

2. Never implement an SEO recommendation merely because it appears in:
   - `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md`
   - an SEO audit
   - a task description
   - a previous recommendation

3. If functionality already exists:
   - verify it,
   - identify actual defects or gaps,
   - improve the existing implementation,
   - do not create a duplicate SEO system.

4. Treat these existing systems as assets unless a verified defect requires modification:
   - robots
   - sitemap
   - canonical handling
   - hreflang handling
   - metadata
   - Product JSON-LD
   - BlogPosting JSON-LD
   - FAQ JSON-LD
   - JewelryStore JSON-LD
   - OpenGraph metadata
   - image optimization
   - Search Console/analytics integrations

5. SEO work must follow this sequence:

   AUDIT → DESIGN → IMPLEMENT → TEST → VERIFY → DOCUMENT

6. Do not implement multiple high-risk SEO phases in one uncontrolled change.

7. Multilingual route migration, canonical changes, redirect changes, sitemap architecture changes, and indexing changes are high-risk and must be handled in dedicated phases and branches.

8. Never claim a page is indexed, ranking, or receiving rich results merely because code was deployed.

   Use this status vocabulary:
   - NOT STARTED
   - AUDITED
   - IMPLEMENTING
   - BLOCKED
   - READY FOR QA
   - VERIFIED
   - DEPLOYED
   - SEARCH ENGINE RECRAWL PENDING
   - OBSERVED IN SEARCH CONSOLE

9. Maintain these SEO documents when relevant:
   - `docs/seo/SEO-BASELINE.md`
   - `docs/seo/SEO-IMPLEMENTATION-STATUS.md`
   - `docs/seo/SEO-MIGRATION-MAP.md`
   - `docs/seo/SEO-QA-REPORT.md`

10. Do not expose private customer, order, account, payment, API, environment, or Hub secret data through SEO output.

11. Structured data must reflect real visible content and real Hub data. Never fabricate reviews, ratings, GTIN, MPN, shipping rules, returns, brand, origin, or product attributes.

12. Do not begin a later SEO phase until required dependencies from earlier phases have been verified.

13. Preserve production ecommerce behavior, including:
   - checkout
   - payments
   - account/customer pages
   - layaway logic
   - inventory
   - product availability
   - analytics
   - legal pages
   - language behavior

14. Every SEO implementation must include appropriate regression testing.
