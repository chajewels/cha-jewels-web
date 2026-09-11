# Cha Jewels website — working rules

## Ownership (same rule as Cha Jewels Hub ERP)
- **Claude Code** owns everything under `app/`, `components/`, `lib/` (frontend, UI, read-only audits).
- **Lovable** owns `supabase/functions/` and applies migrations. Claude Code may DRAFT SQL in `supabase/migrations/` and RPC contracts in `supabase/contracts/`, but never runs them.
- **Cynthia** runs all SQL in the Supabase SQL Editor.
- `main` is production and deploys to Vercel automatically. Work on `develop`; open a PR `develop` -> `main` and wait for Cynthia to merge. Vercel posts a preview URL on every PR; that is what she reviews.
  Short-lived feature branches are fine, but they merge into `develop`, never into `main`. Never push directly to `main`.
- The website talks to the Hub ONLY through the Website API (`lib/hub-api.ts`, spec in `supabase/contracts/api.md`). No direct table reads. The Hub's backend is Lovable Cloud today and will move to Cynthia's own Supabase before Phase 2; the API contract is what keeps that move invisible to the site.

## Non-negotiable business rules
- Layaway math is NEVER computed in the browser or in Next.js. Call `POST /layaway/quote` via `hub.layawayQuote`. Same for points.
- Products are added in the Hub only. This site has no product editor.
- Cost basis, margin, and CSR commission fields never cross the API. If they appear in a response, that is a Hub bug to report, not data to render.

## Terminology (hard rule)
- Gold is described as **K18 gold, Made in Japan**.
- Forbidden anywhere in copy, alt text, metadata or product data: "Japan gold", "Japanese gold", "Saudi gold", "Italian gold", or any `<country> gold` phrasing as a purity claim.
- `npm run check:terms` must pass before every commit. It is also run in CI.

## Sign-in (email link)
- `LoginForm` calls `signInWithOtp` with `emailRedirectTo = <origin>/auth/callback?next=…`; `/auth/callback` accepts a PKCE `code` **or** `token_hash`+`type`, names GoTrue `error`/`error_code` as `/login?error=…`, and always redirects — it never renders and never 500s.
- **Every storefront origin must be on the Hub project's Supabase Auth redirect allow-list**: production (`chajewelsjapan.com`, `www.`), the Vercel production alias, and the project-scoped preview wildcard `https://cha-jewels-web-*-cha-jewels.vercel.app/**`. A `redirect_to` outside the list makes GoTrue fall back to the project Site URL (the Hub) — the customer sees the Hub's black splash and the code is never exchanged. That is a Lovable Cloud auth setting, not code; see Bug #264 in the Hub repo. Never add a bare `https://*.vercel.app/**` — it would let any Vercel deployment receive this project's sign-in codes.
- The sign-in email is sent by the Hub's `auth-email-hook`, which picks the Cha Jewels template by the link's target host. Staff emails are untouched.

## Cart and checkout (Phase 2 step 2)
- The cart is a **cookie** (`cj-cart`, `lib/cart.ts`), holding only `{variant_id, slug, qty}`. Prices and stock are never stored in it — they are re-read from the Hub on every render, and the Hub re-prices again at `/checkout/quote` and once more inside `create_web_order_atomic`. Nothing on this side is trusted for money.
- Cart mutations are **Server Actions** (`lib/cart-actions.ts`); checkout calls are Server Actions too (`lib/checkout-actions.ts`), so the customer JWT is paired with `HUB_API_KEY` on the server and never travels with a browser fetch.
- **A quote does not reserve stock.** Stock is decremented only when the order is created, so an abandoned checkout never sits on a one-of-a-kind piece. A transfer order holds stock for 72 hours; the Hub cancels it and restores stock after that.
- `/cart` is open to anonymous visitors. `/checkout` and `/account/*` are gated in `middleware.ts` — but that gate decides what to RENDER; the Hub independently requires the JWT.
- **A web order is a Hub `cash_order`**, not a separate `orders` table. The customer sees `web_reference` (`CJ-W-000123`); the Hub's financial key stays the numeric `invoice_number`. See `docs/WEBSITE-VERCEL.md` in the Hub repo.
- Layaway checkout (`mode: 'layaway'`) and card payment (`method: 'square'`) both answer **501** until steps 4 and 3. Do not stub them locally — the 501 is the contract.

## Stack
Next.js 15 App Router, TypeScript strict, Tailwind, shadcn/ui components copied into `components/ui`, Supabase via `@supabase/ssr`. Product and collection pages are ISR (60 s) with on-demand revalidation from the Hub.
