# Lumière release plan — `redesign/lumiere` → `develop` → `main`

**DOCUMENT ONLY. Nothing here has been run.** Every step that touches `develop`, `main`, Vercel production, Supabase or DNS needs the owner's go-ahead at that step; this plan is the order and the checks, not an authorisation. Rules that apply throughout (CLAUDE.md): never push to `main`; work on a branch and PR into `develop`; PR `develop` → `main`; no `https://*.vercel.app/**` in the Supabase redirect allow-list; `.env.local` is never committed; SEO systems are assets and keep their status vocabulary (NOT STARTED … OBSERVED IN SEARCH CONSOLE) — nothing is claimed indexed or ranking because code deployed.

## 0. What blocks the release today (decide first)
1. **Placeholders — CLEARED (P5b, 2026-11-02).** The registry (`lib/lumiere/placeholders.ts`) and `public/lumiere/placeholder/**` are deleted; every slot is the Hub's or a Cha Jewels original shipped under `public/images/**` (file-by-slot table: `docs/tasks/lumiere-p5b-media.md`). `npm run check:placeholders --strict` passes on `redesign/lumiere-p5b-release` and keeps the registry from coming back. Open for the owner, not blocking: the Hub fields in `docs/tasks/lumiere-hub-slots.md` §2 would replace the Cha originals with managed uploads, and `products.model_glb_url` / a `home.hero.pendant` site model switch the 3D paths back on.
2. **Performance gate on the deployed preview** (`docs/perf-baseline.md`, "P5"). It is measured with `scripts/perf-preview.mjs` once the owner enables Protection Bypass for Automation on the Vercel project and puts the secret in the untracked `.env.perf.local`. The verdict per page must be "meets production" before step 3.
3. **The owner's signed-in preview test** (list in the P5 PR): sign-in from the branch alias, real account data, checkout end to end, pay-card, review submit, receipts.

## 1. Build the release branch — ONE squashed commit, no evidence images, no rewritten history
`redesign/lumiere` carries merge commits and (since #469) the P4 evidence images in its history; the release must carry neither.
```
git fetch --prune
git switch redesign/lumiere && git pull --ff-only
git merge origin/develop            # merge commit; any conflict → STOP and resolve on redesign/lumiere in its own PR
git push origin redesign/lumiere
# the release tree must be exactly develop + the redesign:
git merge-base --is-ancestor origin/develop redesign/lumiere && echo "develop is contained"
git switch -c release/lumiere origin/develop
git read-tree -u --reset redesign/lumiere     # the redesign tree, nothing else
git commit -m "feat(redesign): the Lumière redesign (P1–P5)"   # ONE commit on top of develop
```
Checks on the branch before any push:
- `git diff --stat origin/develop...release/lumiere` is the redesign and nothing else; **no image file under `docs/`** (`git diff --name-only origin/develop...HEAD | grep -iE '\.(jpe?g|png|webp|gif)$' | grep '^docs/'` prints nothing). The only images allowed are product assets (`public/**`), none of them under `public/lumiere/placeholder/`.
- `git log origin/develop..release/lumiere` shows exactly one commit; none of the `evidence/lumiere-*` branches is an ancestor (they are orphans and are never merged).
- `.gitignore` carries the evidence-image patterns (it does since P4b).
- Full CI step list locally: `check:terms`, `check:i18n`, `check:analytics`, `check:money`, `check:cutouts`, `check:lastmod`, **`check:placeholders --strict`**, `check:contrast`, `test:unit`, `typecheck`, `lint`, `build` + `check:fonts`.

## 2. PR into `develop` (strict)
- `gh pr create --base develop --head release/lumiere`; CI runs the strict placeholder step (base is `develop`) and every other step; `gh pr checks` must be green.
- The PR body carries: what shipped per phase (PR #461, #463, #464, #466, #469, #470, P5), the perf verdict table, the owner-test list, the rollback plan below, and links to `evidence/lumiere-*` for the images.
- **Squash vs merge:** merge the PR as a normal merge (the single commit is already the squash); do not squash again.
- Do not delete `redesign/lumiere` or the evidence branches until production has run a week.

## 3. The owner's review on the develop alias
- Vercel builds `develop` on merge; the **develop alias** is the review surface (behind SSO). The owner signs in **from the alias** (never add `*.vercel.app` to Supabase) and walks the list: home (JA/EN), a collection, a product with Hub photos, cart, checkout (transfer, COD, Paidy, EN layaway agreement gate, card HOLD), pay-card, account pages with real data, receipts, review form, contact, newsletter, the language switch, keyboard and reduced-motion.
- Re-run the performance gate against the develop alias (`scripts/perf-preview.mjs`) and keep the table in `docs/perf-baseline.md`.

## 4. PR `develop` → `main`
- `gh pr create --base main --head develop`; strict placeholders again (base is `main`); CI green; the owner approves on GitHub. Nobody pushes to `main`.
- **Production environment checks before merging** (Vercel → Project → Settings → Environment Variables, Production scope): `NEXT_PUBLIC_PREVIEW_FIXTURES` and `NEXT_PUBLIC_PREVIEW_BLANK` are **unset** (fixtures are ignored on production by code, but the variables must not exist); the Hub URL, key and Square variables are the production ones; `VERCEL_ENV=production` is Vercel's own. `NEXT_PUBLIC_VERCEL_ENV` makes the asset-error banner disappear in production.
- **Domain / Supabase checks** (Supabase dashboard → Authentication): Site URL is `https://www.chajewelsjp.com`; the redirect allow-list holds the production domain and the **branch alias used for testing only**, never `https://*.vercel.app/**`; **the sign-in email is the Cha Jewels template, sent for and linking to `chajewelsjp.com`** (send one to a test inbox and read the sender, subject, the link host and the footer before the merge); the SMTP sender domain still passes SPF/DKIM.
- **Content-Security-Policy:** the redesign changes `lib/csp.ts` in exactly two lines of the **report-only** policy (a `'wasm-unsafe-eval'` source for the 3D scenes' Meshopt decoder, and `worker-src 'self'` for the bundled EXR worker; report §4) and one import path in `middleware.ts` (`@/lib/i18n-core`). The **enforced** pay-card policy (nonce, Square hosts, no 3D) is not touched. Verify on the develop alias: the pay-card response still carries an enforced `content-security-policy` with a nonce, and the report-only policy lists no new violation in the browser console on the home, a product, the cart and the account.

## 5. SEO checks (the existing systems stay; the redesign must not change them)
Compare production against the develop alias, route by route (the acceptance harness under `tests/` and `docs/seo/SEO-QA-REPORT.md` list the pages):
- `/robots.txt` and `/sitemap.xml` identical in structure and URL set (product and collection URLs present, `lastmod` unchanged where content is unchanged); the `X-Robots-Tag: noindex` header is **absent on production** (it is present on previews by design).
- Canonical and `hreflang` (`/en`, `/ja`, `x-default`) unchanged on every route; `noindex` still on `/search`, account and checkout.
- JSON-LD identical per type: JewelryStore, Product (real Hub data only), BlogPosting, FAQPage, BreadcrumbList, ItemList; Open Graph and Twitter tags unchanged; one `<h1>` per page.
- Initial HTML carries the page's real text (the Lumière home is server-rendered; the hero headline is real text in the HTML).
- Record status per `docs/seo/SEO-IMPLEMENTATION-STATUS.md` with the vocabulary: after the merge the redesign is **DEPLOYED**, then **SEARCH ENGINE RECRAWL PENDING**; it is **OBSERVED IN SEARCH CONSOLE** only when Search Console shows it.

## 6. Go-live and watch
- Merge `develop` → `main`; Vercel promotes the production build; wait for the Hub revalidation webhook; hard-check `/`, `/ja`, `/en`, a product, `/cart`, sign-in, one real reservation by the owner.
- Watch for 48 hours: Vercel logs and errors, Speed Insights (LCP, INP, CLS), Search Console coverage and Core Web Vitals, Supabase auth logs, Square and Paidy dashboards, the Messenger link, the newsletter and contact inboxes.

## 7. Rollback
| Trigger | Action | Cost |
|---|---|---|
| A page or flow is broken on production | Vercel → Deployments → the previous production deployment → **Promote / Instant Rollback** (about a minute; no code change, no database change) | none; the redesign stays on `main` but is not live |
| The merge itself must go | `git revert -m 1 <merge commit>` on a branch, PR into `main` (never a force-push) | one PR; the Hub, Supabase and the database are untouched because the redesign carries **no migration and no Edge Function change** |
| Sign-in or checkout regressions | the same Instant Rollback first; then diagnose on the develop alias | — |
| SEO regression (canonical, hreflang, sitemap) | rollback, then compare against step 5 | recrawl delay is the only lasting cost |
Preconditions for a safe rollback: the previous production deployment is not pruned (Vercel keeps them), and no database migration was shipped with the redesign (verify: `git diff --stat origin/main...release/lumiere -- supabase/` is empty).
