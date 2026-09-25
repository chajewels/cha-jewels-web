# Cha Jewels website — working rules

## Ownership (same rule as Cha Jewels Hub ERP)
- **Claude Code** owns everything under `app/`, `components/`, `lib/` (frontend, UI, read-only audits).
- **Lovable** owns `supabase/functions/` and applies migrations. Claude Code may DRAFT SQL in `supabase/migrations/` and RPC contracts in `supabase/contracts/`, but never runs them.
- **Cynthia** runs all SQL in the Supabase SQL Editor.
- `main` is production and deploys to Vercel automatically. Work on `develop`; open a PR `develop` -> `main` and wait for Cynthia to merge. Vercel posts a preview URL on every PR; that is what she reviews.
  Short-lived feature branches are fine, but they merge into `develop`, never into `main`. Never push directly to `main`.
- The website talks to the Hub ONLY through the Website API (`lib/hub-api.ts`, spec in `supabase/contracts/api.md`). No direct table reads. The Hub's backend is Lovable Cloud today and will move to Cynthia's own Supabase before Phase 2; the API contract is what keeps that move invisible to the site.

## Before you start, and where you work

- **Check whether the work already exists.** Run `git fetch`, then look at open
  AND recently merged PRs (`gh pr list --state all --limit 20`) and at the remote
  branches, for the same work. If it already exists, stop and report it instead
  of rebuilding it. This is not hypothetical: on 2026-09-23 a record-only
  migration was built here from scratch and only discovered to be already merged
  at `git push`, because the branch name was taken.
- **One session, one working tree.** If another Claude Code session may be
  working on this repo, work in your own git worktree
  (`git worktree add ../<name> <branch>`); never share a working tree or a
  checked-out branch between sessions. Copy the untracked env files
  (`.env.local`) into the worktree by hand — they are gitignored and do not come
  across with the checkout. Never commit them.

## Non-negotiable business rules
- Layaway math is NEVER computed in the browser or in Next.js. Call `POST /layaway/quote` via `hub.layawayQuote`. Same for points.
- **Nothing layaway-related is visible on the Japanese site (owner decision 2026-09-25, final, no exceptions).** One gate: `layawayOffered(lang)` (`lib/layaway-availability.ts`). It covers nav, home, product, checkout, footer, FAQ, the account's plan pages (`/account/layaway` and `/account/layaway/[id]` are not found on `ja`, and nothing links to them), and the Japanese legal pages. Legal: an article or tokusho row that is only about layaway is `layaway: true` and dropped by `legalArticlesFor` / `tokushoRowsFor` (sections renumbered); a Japanese sentence that also covers something else has its layaway part removed from the `ja` text. English text is never changed for this rule. **Guard:** `npm run check:layaway-ja` (run by `check:i18n`, so in CI) renders the Japanese legal and FAQ content through those filters and fails on 分割予約 / レイアウェイ; an i18n key may contain them only if it is in `LAYAWAY_GATED_KEYS` in `scripts/check-layaway-ja.mjs`, i.e. rendered only behind `layawayOffered`.
- Products are added in the Hub only. This site has no product editor.
- Cost basis, margin, and CSR commission fields never cross the API. If they appear in a response, that is a Hub bug to report, not data to render.

## Terminology (hard rule)
- Gold is described by purity: **K18 gold**. Origin is per-product DATA from the Hub (`origin`: JAPAN | BRAND | OTHER | UNKNOWN). `components/catalog/origin-badge.tsx` is the only file allowed to render "Made in Japan" / 日本製, and only when `origin === "JAPAN"`; a branded piece shows its brand name and claims no origin. Site-wide copy may say "authenticated in Japan" / "hallmark checked in Japan", never an origin.
- Forbidden anywhere in copy, alt text, metadata or product data: "Japan gold", "Japanese gold", "Saudi gold", "Italian gold", or any `<country> gold` phrasing as a purity claim.
- Exception (owner decision 2026-09-25): the approved clarifier sentence (EN/JA, exact text, key brand.originNote) and the Hub footer tagline may say Made in Japan / 日本製. The clarifier is, exactly: EN "Our new jewelry is made in Japan, and so are many of our preloved pieces. Preloved branded pieces are made by their original brands and authenticated in Japan." / JA 「新品ジュエリーはすべて日本製で、中古品にも日本製が多くあります。中古ブランド品は各ブランドの製品で、日本で真贋鑑定済みです。」 `check:terms` also accepts, by exact text, the FAQ question the clarifier answers ("Is everything made in Japan?" / 「すべて日本製ですか？」). Nothing else, and nothing added without an owner decision.
- Customer testimonials are shown exactly as written; the gold terminology rule applies to Cha Jewels' own text, not to customer quotes.
- `npm run check:terms` must pass before every commit. It is also run in CI.

## Sign-in (email link)
- `LoginForm` calls `signInWithOtp` with `emailRedirectTo = <origin>/auth/callback?next=…`; `/auth/callback` accepts a PKCE `code` **or** `token_hash`+`type`, names GoTrue `error`/`error_code` as `/login?error=…`, and always redirects — it never renders and never 500s.
- **Every storefront origin must be on the Hub project's Supabase Auth redirect allow-list**: production (`chajewelsjp.com`, `www.`), the Vercel production alias `https://cha-jewels-web.vercel.app/**`, the team alias `https://cha-jewels-web-cha-jewels.vercel.app/**` (NOT covered by the wildcard — the `*` needs a segment between the two dashes), and the project-scoped preview wildcard `https://cha-jewels-web-*-cha-jewels.vercel.app/**` (covers `-git-<branch>-` and `-<hash>-` hosts). A `redirect_to` outside the list makes GoTrue fall back to the project Site URL (the Hub) — the customer sees the Hub's black splash and the code is never exchanged. That is a Lovable Cloud auth setting, not code; see Bug #264 in the Hub repo. Never add a bare `https://*.vercel.app/**` — it would let any Vercel deployment receive this project's sign-in codes.
- **Linking after sign-in (2026-09-24).** Every entry point calls `hub.authCustomer(jwt)` with no profile — `/auth/callback`, `confirmSignInAction`, `/checkout`, `/loyalty/join` — and all four read the answer through `lib/profile.ts`: 422 `profile_required` (no customer holds her email; the Hub creates nobody) → `/account/complete-profile?next=<where she was going>`; 409 `already_registered` (her details match an existing customer) → `/already-registered`, which shows the owner's wording, links to `/contact`, and signs her out; anything else is unchanged (e.g. `/account?link=failed`). `/account` and `/account/addresses` send a `/me` 404 to the profile step too. The profile form is the Hub New Customer modal minus Notes; `lib/countries.ts` COUNTRIES is copied verbatim from the Hub — re-copy it, never edit it here.
- The sign-in email is sent by the Hub's `auth-email-hook`, which picks the Cha Jewels template by the link's target host. Staff emails are untouched.
- **Test sign-in from the branch alias, never from a per-deployment URL.** Vercel gives every deployment two hosts: the branch alias `https://cha-jewels-web-git-<branch>-cha-jewels.vercel.app` (matched by the wildcard above) and a per-deployment host such as `cha-jewels-web-3m47fl3tm-cha-jewels.vercel.app`. Only the alias is guaranteed to be on the allow-list; a per-deployment host that GoTrue does not recognise falls back to the Site URL and the Hub template arrives (2026-09-13, Bug #264 follow-up). Preview reviews and sign-in tests use the `-git-develop-` alias or the PR's branch alias.

## Cart and checkout (Phase 2 step 2)
- The cart is a **cookie** (`cj-cart`, `lib/cart.ts`), holding only `{variant_id, slug, qty}`. Prices and stock are never stored in it — they are re-read from the Hub on every render, and the Hub re-prices again at `/checkout/quote` and once more inside `create_web_order_atomic`. Nothing on this side is trusted for money.
- Cart mutations are **Server Actions** (`lib/cart-actions.ts`); checkout calls are Server Actions too (`lib/checkout-actions.ts`), so the customer JWT is paired with `HUB_API_KEY` on the server and never travels with a browser fetch.
- **A quote does not reserve stock.** Stock is decremented only when the order is created, so an abandoned checkout never sits on a one-of-a-kind piece. A transfer order holds stock for 72 hours; the Hub cancels it and restores stock after that.
- `/cart` is open to anonymous visitors. `/checkout` and `/account/*` are gated in `middleware.ts` — but that gate decides what to RENDER; the Hub independently requires the JWT.
- **A web order is a Hub `cash_order`**, not a separate `orders` table. The customer sees `web_reference` (`CJ-W-000123`); the Hub's financial key stays the numeric `invoice_number`. See `docs/WEBSITE-VERCEL.md` in the Hub repo.
- Layaway checkout (`mode: 'layaway'`) is LIVE via `payLayawayAction` (`lib/checkout-actions.ts`) and is gated on the signed layaway agreement: the action verifies the signature server-side through `lib/agreement-lookup.ts` before calling the Hub and fails closed, refusing with `agreement_required` (the customer has not signed) or `agreement_unverified` (the lookup could not answer) — two codes, never one, from `lib/layaway-agreement.ts`. The agreement is one document written in Tagalog with English (no separate English or Tagalog version) and is served from `agreement.chajewelsjp.com`. Card payment (`method: 'square'`) still answers **501** and is skipped by owner decision (2026-09-13); do not stub it locally — the 501 is the contract.
- **Live claims are a Hub feature, not a storefront checkout (owner decision 2026-09-19).** Phase 2 step 5 (the `/live/claim/[code]` page, the "Claim from Live" nav button, `LiveClaim`, the claims fixture and the `/claims/:code` client call) is withdrawn and removed from this repo. A live order is created in the Hub from a Page365 order link and reaches the customer through the existing `/account` reads (`GET /me/orders`, `GET /me/layaway`); nothing on this side reads or writes a claim. Do not re-add a `/live` route or nav entry.

## Stack
Next.js 15 App Router, TypeScript strict, Tailwind, shadcn/ui components copied into `components/ui`, Supabase via `@supabase/ssr`. Product and collection pages are ISR (60 s) with on-demand revalidation from the Hub.
