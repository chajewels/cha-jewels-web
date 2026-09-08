# Cha Jewels website

Implements Phase 0 and Phase 1 of the implementation plan (foundations, catalog and brand) and the entry points for Phase 3 (live claims). Products are managed in the Cha Jewels Hub; this site reads them through the Hub's Website API (`supabase/contracts/api.md`). It has no direct database connection.

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

## Routes
`/` · `/about` · `/blog` · `/blog/[slug]` · `/loyalty` · `/loyalty/join` · `/collections/[slug]` · `/products/[slug]` · `/layaway` · `/live/claim/[code]` · `/legal/tokusho` · `/sitemap.xml` · `/robots.txt` · `POST /api/revalidate` · `POST /api/region`

## Deliberately not here
- No product editor (Hub only).
- No layaway or points math (RPCs only).
- No checkout yet (Phase 2: auth, cart, Stripe JP, PayMongo PH).
- No AI voice agent (decision: not building).

## Still to add in Phase 1
`/wholesale`, `/loyalty`, `/faq`, `/about`, `/gold-guide`, `/legal/privacy`, `/legal/terms`, `/live` landing page. Use the copy from the design comp (`cha-jewels-home.html`) as the source for these.
