# Cha Jewels website

Implements Phase 0 and Phase 1 of the implementation plan (foundations, catalog and brand) plus the Phase 2 cart, checkout and account surfaces. Products are managed in the Cha Jewels Hub; this site reads them through the Hub's Website API (`supabase/contracts/api.md`). It has no direct database connection.

## Setup
1. Give Lovable `supabase/contracts/LOVABLE_PROMPT.md` (with `api.md` and the two migrations). It returns `HUB_API_URL`, `HUB_API_KEY`, `REVALIDATE_SECRET`.
2. `cp .env.example .env.local`, fill those three in, set `NEXT_PUBLIC_PREVIEW_FIXTURES=0`.
3. `npm install && npm run dev`
4. Add a product in the Hub with status `active`, attach it to a collection, and it appears on `/collections/<slug>` within 60 s (or instantly once `notify_website` is wired).

## Preview without Supabase
`NEXT_PUBLIC_PREVIEW_FIXTURES=1 npm run dev` renders the site with sample products from `lib/fixtures.ts` so design can be reviewed before the Hub is connected.

## Commands
- `npm run check:terms` — fails on any forbidden gold terminology. Run before every commit.
- `npm run typecheck`
- `npm run e2e:signup`: live end-to-end signup test, run by hand only (below).

## End-to-end signup test (live, run by hand)
`npm run e2e:signup` (`e2e/signup.spec.ts`) drives a real browser through storefront signup on a real deployment and the **LIVE Hub**. It is not part of CI or any other script, so run it only when you mean to. The test (not the site) reads and writes the Hub database with the service-role key, to set up, check and clean up.

- **Scenario B (runs first):** a new login fills in the profile with the name of an existing customer (CJ-2026-00688). The test expects `/already-registered` with the owner's wording, the session signed out, no customer created, and exactly one `duplicate_signup_blocked` staff notification that names the test email and CJ-2026-00688.
- **Scenario A:** a new login fills in a fresh profile (International / Denmark, plus a fake `+45 00 …` mobile that `find_customer_matches` first confirms nobody holds) and lands on `/account`. The new customer row is marked `is_test = true` straight away, then checked field by field.
- **Sign-in without email:** test users are created with the service role (email confirmed), and `auth.admin.generateLink` makes a magic link without sending anything. The test opens the storefront's own `/auth/callback?token_hash=…&type=magiclink`, the same server-side path a customer's email link takes. Addresses look like `e2e-signup-<timestamp>-a@cha-jewels-e2e.test`, and `.test` addresses are never delivered.
- **Cleanup always runs**, even after a failure. It deletes the test customers (by email), this run's `duplicate_signup_blocked` notifications and both auth users, then prints what it deleted and anything left behind. If anything is left behind, the run fails.

Setup, once:
1. `npx playwright install chromium`
2. `cp .env.e2e.example .env.e2e.local`, then fill in `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY` and, optionally, `E2E_BASE_URL` (default `https://www.chajewelsjp.com`). The file is gitignored; never commit the key.

To test a preview instead of production, set `E2E_BASE_URL` to the branch alias (`https://cha-jewels-web-git-<branch>-cha-jewels.vercel.app`), never a per-deployment URL. The deployment must sign in against the same Supabase project as `E2E_SUPABASE_URL`.

## Routes
`/` · `/about` · `/blog` · `/blog/[slug]` · `/loyalty` · `/loyalty/join` · `/collections/[slug]` · `/products/[slug]` · `/layaway` · `/legal/tokusho` · `/sitemap.xml` · `/robots.txt` · `POST /api/revalidate` · `POST /api/region`

## Deliberately not here
- No product editor (Hub only).
- No layaway or points math (RPCs only).
- No checkout yet (Phase 2: auth, cart, Stripe JP, PayMongo PH).
- No AI voice agent (decision: not building).

## Still to add in Phase 1
`/wholesale`, `/loyalty`, `/faq`, `/about`, `/gold-guide`, `/legal/privacy`, `/legal/terms`. Use the copy from the design comp (`cha-jewels-home.html`) as the source for these.
