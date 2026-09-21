# Phase 3 — Palette: velvet green → charcoal. Dark theme, plan

> **Decisions 1 and 5 are superseded by `phase4-light-plan.md`** (2026-09-21): the inner pages go light, so the site no longer stays dark and chalk is no longer confined to the homepage collections band. Everything else below stands.

Supersedes the light-theme plan of the same name (2026-09-19, earlier). Read from `origin/develop` = `7a9529d`. Investigation only: no branch, no edits, no commits.

## Owner decisions 2026-09-19 (settled — applied here, not re-opened)

1. The site stays **dark**. Velvet green → charcoal. No light theme (gold-pale on chalk is 1.37:1).
2. **Gold text is kept as is.** `gold-pale #E8D28A` remains headings, prices, links, figures; `gold #C9A227` remains rules, borders, dividers. Neither is remapped.
3. **Orange `#FFA500` = CTA fills only** (primary buttons, toggles, badge fills) with charcoal label text. Never body or heading text.
4. **Teal `#1ABC9C` = ornament only.** Never text, never a focus ring, never a state-carrying border.
5. **Chalk `#F5F5F2` appears in exactly one place:** the homepage collections band, as built. No other light surface.
6. Fonts are done. `app/layout.tsx` and `fontFamily` are not touched for typography.
7. **`.gilt` wordmark stays.** The brand logo badge is **added beside it**, not instead.

Two places where the codebase as built sits against the letter of a decision — flagged in §6, not decided here.

---

## 0. Inventory

Scope: class tokens and colour literals in `app/`, `components/`, `lib/order-status.ts`, `tailwind.config.ts`, `app/globals.css`; comment lines excluded; `lib/i18n.ts`, `lib/content/*`, `lib/fixtures.ts`, `lib/blog.ts` excluded (prose that contains the word "gold"). Step 1's "66 files / ~700" counted those prose files and word-boundary hits.

| | Files | Palette tokens present | **Change under the dark rename** | Stay (gold text/borders, rule) |
|---|---|---|---|---|
| A tokens + globals + chrome + logo + bugs | 9 | 65 | 22 | 43 |
| B buttons + CTA fills | 1 file + 4 lines in other files | 8 | 1 (+4 lines) | 7 |
| C everything else, mechanical | 44 | 521 | 302 | 219 |
| D status dots (optional) | 1 | 6 | 2 | 4 |
| **Total** | **55** | **600** | **327** | **273** |

Distinct utilities that **change** (`git grep -o`): `bg-velvet-deep` 38 · `bg-velvet` 27 · `bg-velvet/80` 3 · `bg-velvet/90` 1 · `bg-velvet-deep/90` 1 · `hover:bg-velvet` 1 · `focus-visible:bg-velvet` 1 · `text-champagne` 23 · `/85` 17 · `/80` 28 · `/75` 43 · `/70` 24 · `/65` 5 · `/60` 15 · `/55` 59 · `/50` 3 · `/45` 12 · `hover:text-champagne` 3 · `text-ink` 5 · `bg-gold` fills 4 + gradient 1 · `border-garnet/60` 8 · `text-garnet` 3.

Distinct utilities that **stay**: `text-gold-pale` 121 · `border-rule` 57 · `border-gold` 44 · `border-rule-soft` 15 · `border-gold/60` 4 · `border-gold-pale` 4 · `outline-gold-pale` 2 · `hover:bg-gold/10` 1 · `before:bg-gold` 2 · `decoration-gold-pale/50` 1 · `border-gold-pale/40` `/25` 2 · `.gilt` · `GoldMotif` `#C9A227` · loyalty tier bar `#8A6B12→#E8D28A` · `divide-[rgba(201,162,39,…)]` 2.

Bug found while counting: `components/commerce/checkout-flow.tsx:724` `accent-[var(--gold)]` — `--gold` is defined nowhere. Group A.

---

## 1. Tokens — verified against every existing utility

Proposed `tailwind.config.ts` `colors` (as given), with one addition and one note:

```ts
colors: {
  charcoal: { DEFAULT: "#333333", deep: "#222222", mid: "#444444" },
  chalk:    "#F5F5F2",
  gold:     { DEFAULT: "#C9A227", pale: "#E8D28A", dark: "#8A6B12" },   // unchanged
  orange:   { DEFAULT: "#FFA500", hover: "#FFB733" },
  teal:     "#1ABC9C",
  garnet:   { DEFAULT: "#7A1E2B", light: "#F28B94" },
},
borderColor: { rule: "rgba(201,162,39,.32)", "rule-soft": "rgba(201,162,39,.16)" },  // unchanged, see below
```

Every utility in use resolves: `bg-velvet*` → `bg-charcoal*`; `text-champagne*` → `text-chalk*` (Tailwind derives `/alpha` from a plain hex, so `chalk: "#F5F5F2"` supports `text-chalk/55`); `text-ink` → `text-charcoal-deep`; `garnet` → `garnet-light` on every current use (all are on dark fills); `bg-gold` fills → `bg-orange`. `velvet.soft` and `ink` are deleted with no orphan: `velvet-soft` has 0 uses, `ink` has exactly the 5 listed in §2. `gold.dark` stays because `.gilt` and the loyalty bar use the literal `#8A6B12` (not the token) — keep the token for the day they are tokenised, or drop it; no class references it.

**Hairline `rule` / `rule-soft` — measured, no change proposed.** Composite gold@32% over the surface vs the surface: velvet 1.80, charcoal 1.77, charcoal-deep 1.85; gold@16%: velvet 1.31, charcoal 1.32, charcoal-deep 1.33. On `#333333` the rule reads 1.7% fainter than today; `.34` would restore exact parity. Below the noise of a monitor; leave at `.32`/`.16`. (`--rule` at `globals.css:5` is the same value and stays.)

**`.pomelli-*` literals → tokens.** CSS cannot use Tailwind class names, so the pomelli block uses `theme()`: `color: theme('colors.orange.DEFAULT')`, `background: theme('colors.charcoal.mid')`, `background: theme('colors.chalk')`, etc. Tailwind 3 resolves `theme()` in any CSS the PostCSS plugin processes; `globals.css` qualifies. Literal count to convert: `#FFA500` ×4 (73, 106, 145, 176, 274 — five, one is the gradient at 271), `#1ABC9C` ×2 (112, 170) + gradient 271 + `rgba(26,188,156,…)` ×4 (129, 199, 209, 292), `#333333` ×3 (116, 211, 233) + `rgba(51,51,51,…)` ×5, `#444444` ×1 (262), `#F5F5F2` ×1 (210), `rgba(255,165,0,.13)` ×1 (208). White/black rgba scrims and text-shadows stay literal. This is the only CSS-level change in the plan beyond `body`.

---

## 2. Mapping verification — "close to a rename": it is, with 27 exceptions

Pure renames (sed-safe, same alpha, same role): `bg-velvet(-deep)?(/\d+)?` → `bg-charcoal…`; `text-champagne(/\d+)?` for alpha ≥ 55 → `text-chalk…`; `hover:text-champagne` → `hover:text-chalk`; `border-garnet/60` → `border-garnet-light/60`; `text-garnet` → `text-garnet-light`; `text-ink` → `text-charcoal-deep`. **300 of the 327 changing tokens are these.**

**Every place it is NOT a pure rename** (file:line, verbatim, what changes and why):

**(a) alpha too low — `champagne/45` and `/50` must become `chalk/55`** (chalk/45 = 3.66:1 and chalk/50 = 4.16:1 on `#333333`; today's champagne/45 is already 3.76 on velvet, so this fixes an existing failure). 15 lines:

```
app/account/layaway/[id]/page.tsx:180   ${owes(row) ? "text-gold-pale" : "text-champagne/45"}
app/account/layaway/[id]/page.tsx:222   <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-champagne/45">
app/account/layaway/[id]/page.tsx:249   <p className="mt-4 text-xs text-champagne/50">
app/account/orders/[id]/page.tsx:127    <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-champagne/45">
app/account/page.tsx:151                <p className="mt-3 text-xs text-champagne/50">
app/checkout/complete/[order_id]/page.tsx:59   <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-champagne/45">
app/faq/page.tsx:45                     <span aria-hidden="true" className="shrink-0 text-champagne/45 …">+</span>
components/commerce/checkout-flow.tsx:397   className={n === stepperAt ? "text-gold-pale" : "text-champagne/45"}
components/commerce/checkout-flow.tsx:429   <span className="block text-champagne/50">{a.country}</span>
components/commerce/checkout-flow.tsx:563   <span className="block text-[11px] text-champagne/45">
components/commerce/checkout-flow.tsx:565   <span className="block text-[11px] text-champagne/45">
components/commerce/checkout-flow.tsx:660   <h3 className="mt-6 text-xs uppercase tracking-[0.14em] text-champagne/45">
components/commerce/layaway-pay-form.tsx:83    <span className="mt-1 block text-[11px] text-champagne/45">
components/commerce/layaway-pay-form.tsx:115   <span className="mt-1 block text-[11px] text-champagne/45">
lib/order-status.ts:65                  : tone === "dead" ? "border-rule text-champagne/45"
```
(`faq:45` is a decorative `+` with `aria-hidden`; it may stay at /45. The other 14 are read text.)

**(b) gold fill → orange fill with charcoal-deep label** (Group B; two classes change per line):

```
app/layout.tsx:53                          bg-gold px-3 py-2 text-ink            → bg-orange … text-charcoal-deep
components/site/cart-button.tsx:32         bg-gold px-1 text-[11px] font-medium text-ink → bg-orange … text-charcoal-deep
components/site/lang-switcher.tsx:13       ${lang === l ? "bg-gold text-ink" : "text-champagne/75"}   → "bg-orange text-charcoal-deep" : "text-chalk/75"
components/commerce/layaway-calculator.tsx:57   ${display === cur ? "bg-gold text-ink" : "text-champagne/75"}   → same
components/ui/button.tsx:8   solid: "border-transparent bg-[linear-gradient(100deg,#8A6B12,#C9A227_45%,#E8D28A_75%,#C9A227)] bg-[length:200%_100%] text-ink hover:bg-[position:100%_0]"
                             → solid: "border-transparent bg-orange text-charcoal-deep hover:bg-orange-hover"
```
The gradient's `transition-[transform,background-position]` on line 6 becomes `transition-[transform,background-color]`. Three `bg-gold` grep hits are **not** CTA fills and stay gold: `app/loyalty/page.tsx:50` and `app/wholesale/page.tsx:24` (`before:bg-gold` 1px bullet rules) and `checkout-flow.tsx:600` (`hover:bg-gold/10` tint on a gold-outlined link).

**(c) the two bugs** (Group A):

```
components/commerce/checkout-flow.tsx:724   className="mt-1 h-4 w-4 shrink-0 accent-[var(--gold)]"   → accent-gold
components/site/mobile-nav.tsx:31           className="border-b border-rule-soft py-3 font-display text-3xl"   → add text-chalk
```
`accent-gold` is generated by Tailwind from `colors.gold.DEFAULT`; no `--gold` variable needed. (Defining `--gold` in `:root` also works; `accent-gold` is one token and greppable.)

**(d) `globals.css`**, not sed-able:

```
7    body { @apply bg-velvet text-champagne font-sans antialiased; }   → bg-charcoal text-chalk
73,106,145,176,271,274   #FFA500 / #1ABC9C literals   → theme('colors.orange.DEFAULT') / theme('colors.teal')
116,211,233,262,210      #333333 / #444444 / #F5F5F2  → theme('colors.charcoal.DEFAULT') / .mid / theme('colors.chalk')
```

**(e) logo insertion** (Group A; new markup, §4): `components/site/header.tsx:47`, `components/site/footer.tsx:18`.

**(f) status tones** (Group D, optional): `lib/order-status.ts:63–66` gains a dot; classes otherwise rename.

Nothing else. In particular: the homepage `app/page.tsx:42` hero CTA (`border-[#FFA500] bg-[#FFA500] text-[#333333] hover:bg-[#ffb733]`) becomes `<Button>` default once B lands — a class deletion, not a colour change — and `page.tsx:44` `border-white/70 text-white` (cta2) is already correct for a dark band and stays.

---

## 3. Groups

### A — tokens, globals (pomelli hex → tokens), chrome, logo, two bugs, `garnet-light` token
**9 files · 65 tokens · 22 change.** `tailwind.config.ts`, `app/globals.css`, `components/site/header.tsx`, `footer.tsx`, `flash-notice.tsx`, `mobile-nav.tsx`, `account-menu.tsx`, `cart-button.tsx`, `lang-switcher.tsx`; plus the one-line fix in `components/commerce/checkout-flow.tsx:724`.
Non-rename lines: §2 (c), (d), (e). `garnet-light` is *defined* here; its 11 uses are renamed in C (they are pure renames). `cart-button.tsx:32` and `lang-switcher.tsx:13` are renamed here for `velvet`/`champagne` and touched again in B for the fill.
Ships: header/footer/drawer/toast on charcoal, body on charcoal, pomelli block tokenised, logo badge, drawer links safe.

### B — buttons and CTA fills
**1 file + 4 lines · 8 tokens · 5 lines change.** `components/ui/button.tsx:6,8`; `app/layout.tsx:53`; `components/site/cart-button.tsx:32`; `components/site/lang-switcher.tsx:13`; `components/commerce/layaway-calculator.tsx:57`.
Non-rename lines: §2 (b). This is the one *visual* change in the whole phase: primary buttons go from the gold gradient to flat orange with charcoal-deep text (8.06:1), matching the approved hero CTA. Preview: every `<Button>` (home hero, product add-to-cart, checkout pay, loyalty join, wholesale submit), plus the three toggles and the cart badge.

### C — everything else, one mechanical pass
**44 files · 521 tokens · 302 change.** All of `app/**` and `components/**` not in A/B, plus `components/commerce/layaway-calculator.tsx` (rename part). Sed rules, applied in this order:

```
s/\bbg-velvet-deep\b/bg-charcoal-deep/g
s/\bbg-velvet\b/bg-charcoal/g            # also covers hover:bg-velvet, focus-visible:bg-velvet, bg-velvet\/80, \/90
s/\btext-champagne\/45\b/text-chalk\/55/g
s/\btext-champagne\/50\b/text-chalk\/55/g
s/\btext-champagne\b/text-chalk/g        # remaining alphas unchanged
s/\btext-ink\b/text-charcoal-deep/g
s/\bborder-garnet\//border-garnet-light\//g
s/\btext-garnet\b/text-garnet-light/g
```
Confirmed diff is class-rename only for all 44 files **except**: `app/faq/page.tsx:45` (decorative `+`, may stay /45 — reviewer's call, one line) and `checkout-flow.tsx:724` (done in A). Files and change counts: `checkout-flow.tsx` 55 · `account/layaway/[id]` 23 · `account/page` 22 · `account/orders/[id]` 16 · `loyalty/page` 15 · `layaway-pay-form` 13 · `inquiry-form` 12 · `account/layaway/page` 10 · `login-form` 10 · `layaway-calculator` 10 · `account/orders/page` 9 · `cart-lines` 9 · `product-card` 9 · `account/addresses` 8 · `product-gallery` 7 · `products/[slug]` 7 · `about` 6 · `checkout/complete` 6 · `transfer-details` 6 · `legal-articles` 6 · `loyalty/join` 5 · `join-button` 5 · `gold-guide` 4 · `cart` 3 · `collections/[slug]` 3 · `faq` 3 · `wholesale` 3 · `blog` 2 · `blog/[slug]` 2 · `collections` 2 · `layout.tsx` 2 (line 53 only; typography untouched) · `auth/confirm` 1 · `checkout/page` 1 · `layaway/page` 1 · `login/page` 1 · `not-found` 1 · `page.tsx` 1 · `price-block` 1 · `reserve-with-layaway` 1 · `tokusho` 1 · badges ×3 and `add-to-cart` 0 (gold only, untouched).
Gate for C: after sed, `git grep -n -E 'velvet|champagne|text-ink|\bgarnet\b(?!-light)'` over `app components lib` returns only `tailwind.config.ts` history (none) — i.e. **nothing**.

### D — status dots (optional, own PR)
**1 file · 6 tokens · 2 change**, plus 2 call sites. `lib/order-status.ts:63–66` `toneClass` and its consumers (`app/account/orders/page.tsx:71`-area, `app/account/layaway/[id]/page.tsx` via `toneClass`). Colour-only status is a WCAG 1.4.1 failure independent of theme. Proposal: `toneClass` returns the existing classes (gold-pale / chalk / border-gold — all pass on charcoal) **and** each status label is prefixed by an 8px dot: `good` teal, `pending` orange, `dead` `chalk/40` — the Stitch availability-pill pattern, ornament use of teal and orange consistent with decisions 3–4. Markup change in two files; keep out of C so C stays a pure rename.

---

## 4. Logo — Group A

Assets arrive via an `assets/logo` branch or the local session; **not generated here**. Expected: `public/images/brand/logo-badge-96.webp` 4,928 B · `logo-badge-192.webp` 12,830 B · `logo-badge-512.webp` 49,120 B. Verify sizes before use. The Stitch "Cha Jewels Brand Logo" SVG (screen `2f773bbab3e9…`) is an AI recreation and is **never** used.

**Header** — `components/site/header.tsx:47` today:
```tsx
<Link href="/" className="gilt whitespace-nowrap font-display text-[26px] font-medium tracking-wide" aria-label="Cha Jewels">Cha Jewels</Link>
```
becomes (badge 44px, 2× via `srcSet`; `.gilt` is background-clip text, so it must stay on its own inline element, not on the flex parent):
```tsx
<Link href="/" className="flex items-center gap-3 whitespace-nowrap" aria-label="Cha Jewels">
  <img src="/images/brand/logo-badge-96.webp" srcSet="/images/brand/logo-badge-96.webp 1x, /images/brand/logo-badge-192.webp 2x" width={44} height={44} alt="" className="h-11 w-11 shrink-0" />
  <span className="gilt font-display text-[26px] font-medium tracking-wide">Cha Jewels</span>
</Link>
```
Plain `<img>` rather than `next/image`: two distinct source files for 1×/2× is exactly what `srcSet` is for, and `next/image` cannot pick between two files. `alt=""` because the Link already carries `aria-label`. The `h-[68px]` bar (line 46) fits a 44px badge with 12px above and below.

**Footer** — `components/site/footer.tsx:18` today:
```tsx
<div><p className="gilt font-display text-xl">Cha Jewels</p><p className="mt-3 max-w-[38ch] text-champagne/75">{t("footer", "blurb")}</p></div>
```
becomes (64px, using the 192 asset at 3× density headroom):
```tsx
<div>
  <img src="/images/brand/logo-badge-192.webp" width={64} height={64} alt="" className="h-16 w-16" />
  <p className="gilt mt-4 font-display text-xl">Cha Jewels</p>
  <p className="mt-3 max-w-[38ch] text-chalk/75">{t("footer", "blurb")}</p>
</div>
```

**OG image — what is there today:** nothing. There is no `app/opengraph-image.*`, no `icon.*`, no `favicon`, no `public/images/brand/`. `app/layout.tsx:24` sets `openGraph: { type, siteName, locale, alternateLocale }` with **no `images`**; `lib/page-meta.tsx:pageMeta()` returns title/description only; `app/products/[slug]/page.tsx:25` is the only place setting `openGraph.images` (the product photo). Options: (i) add `images: [{ url: "/images/brand/logo-badge-512.webp", width: 512, height: 512 }]` to the root `openGraph` — one line in `layout.tsx` (see §6 on decision 6); (ii) the file convention `app/opengraph-image.png` — Next accepts `.jpg/.jpeg/.png/.gif` only, **not `.webp`**, and the assets are not to be recreated, so (ii) is out unless a PNG is supplied. A 512² badge is a valid square OG image; the recommended 1200×630 landscape card is a separate asset decision.

---

## 5. Gates

Per PR: `npm run check:terms` · `npx tsc -p tsconfig.json --noEmit` · `npm run build` · `node scripts/check-contrast.mjs`.

`scripts/check-contrast.mjs` (to be added in A): WCAG 2.1 relative luminance, alpha composited onto the declared surface, fixed pair table, exits 1 on any pair below its threshold (4.5 text · 3.0 for ≥24px headings and non-text). Rendered check on the preview with `@axe-core/playwright` `color-contrast` for text over the hero video and images.

**Pair table, computed** (✓ ≥ threshold):

| Text / element | `#222222` deep | `#333333` | `#444444` mid | Need | Today on velvet `#0F2A22` |
|---|---|---|---|---|---|
| chalk | 14.57 ✓ | 11.57 ✓ | 8.92 ✓ | 4.5 | champagne 12.89 |
| chalk/85 | 10.82 ✓ | 8.85 ✓ | 6.96 ✓ | 4.5 | |
| chalk/80 | 9.79 ✓ | 8.02 ✓ | 6.43 ✓ | 4.5 | |
| chalk/75 | 8.73 ✓ | 7.23 ✓ | 5.87 ✓ | 4.5 | |
| chalk/70 | 7.83 ✓ | 6.57 ✓ | 5.35 ✓ | 4.5 | |
| chalk/65 | 6.92 ✓ | 5.88 ✓ | 4.85 ✓ | 4.5 | |
| chalk/60 | 6.15 ✓ | 5.25 ✓ | **4.38 ✗** | 4.5 | |
| chalk/55 | 5.37 ✓ | 4.71 ✓ | **3.95 ✗** | 4.5 | champagne/55 4.88 |
| chalk/50 | 4.72 ✓ | **4.16 ✗** | 3.54 ✗ | 4.5 | champagne/50 4.27 ✗ |
| chalk/45 | **4.08 ✗** | **3.66 ✗** | 3.20 ✗ | 4.5 | champagne/45 **3.76 ✗** |
| gold-pale (text) | 10.62 ✓ | 8.43 ✓ | 6.50 ✓ | 4.5 | 10.20 |
| gold (border, non-text) | 6.58 ✓ | 5.22 ✓ | 4.03 ✓ | 3.0 | 6.32 |
| gold as text (none today) | 6.58 ✓ | 5.22 ✓ | **4.03 ✗** | 4.5 | |
| outline-gold-pale (focus) | 10.62 ✓ | 8.43 ✓ | 6.50 ✓ | 3.0 | |
| garnet `#7A1E2B` text | **1.55 ✗** | **1.23 ✗** | **1.05 ✗** | 4.5 | **1.49 ✗** (already failing) |
| garnet/60 border | — | — | — | 3.0 | 1.27 ✗ → on deep 1.24 ✗ |
| garnet-light `#F28B94` text | 6.74 ✓ | 5.35 ✓ | **4.13 ✗** | 4.5 | |
| garnet-light/60 border on deep | 3.32 ✓ | | | 3.0 | |
| orange as fill edge (non-text) | 8.06 ✓ | 6.40 ✓ | 4.93 ✓ | 3.0 | |
| teal ornament (non-text) | 6.60 ✓ | 5.24 ✓ | 4.04 ✓ | 3.0 | |
| charcoal-deep on orange (CTA label) | **8.06 ✓** | | | 4.5 | ink on gold today ≈ 9 |
| charcoal-deep on orange-hover | **9.15 ✓** | | | 4.5 | |
| white / chalk on orange | 1.97 ✗ / 1.81 ✗ | | | 4.5 | never |
| hairline rule gold@32% vs surface | 1.85 | 1.77 | 1.62 | parity ref 1.80 | 1.80 |
| charcoal text on chalk band | 11.57 ✓ | | | 4.5 | |
| pomelli card h3 orange on `#444444` | | | 4.93 ✓ (≥24px → 3.0) | see §6 | |

**Minimum passing alphas, by surface:** on `#222222` `chalk/50`; on `#333333` `chalk/55`; on `#444444` `chalk/65`. Rule for the sed pass: `/45` and `/50` → `/55`, everything else unchanged. No `chalk` text sits on `#444444` today (the pomelli card uses `rgba(255,255,255,.72)` = 6.0 ✓); if any is added, `/65` is the floor. `garnet-light` is never placed on `#444444`.

---

## 6. Two conflicts between the code as built and the decisions — for confirmation, not re-opened here

1. **Decision 3 vs the homepage as built.** `globals.css` uses orange as *text* in five pomelli rules: hero headline (73), values eyebrow (145), value h3 (176), collection-card h3 (274), plus `page.tsx` hero `<em>`. Decision 5 says the homepage stays "as already built". Both pass contrast (6.4 on `#333333`; 4.93 on `#444444`, above the 3.0 large-text threshold and below 4.5). The tokenising pass in A will carry those five as `theme('colors.orange.DEFAULT')` unchanged unless told to make them `gold-pale` (8.43 / 6.50). Recording the exemption in the plan is enough; say which.
2. **Decision 6 vs two unavoidable lines in `app/layout.tsx`.** Line 53 (skip link `bg-gold text-ink`) is a Group B fill, and the OG image option (i) is one metadata line. Neither touches fonts or `fontFamily`. Reading decision 6 as "no typography changes in layout.tsx" allows both; reading it literally blocks the skip link's colour and leaves OG images undefined. Confirm the reading.

---

## Not adopted: semantic surface tokens

The earlier plan proposed `--fg` / `--surface` variables switched by `data-surface`. With one dark surface family and a single deliberate light band that already carries its own colours, there is no second surface for a token to switch to. **Not adopting.** The rename above is the whole mechanism.

---

## 7. Group A resolutions and record (2026-09-19, PR feature/palette-a)

Resolved by the owner before Group A was implemented:

1. **§6 conflict 1 — homepage orange text stays orange.** The five pomelli rules (`.pomelli-hero__headline`, `.pomelli-values__eyebrow`, `.pomelli-value h3`, `.pomelli-collection-card h3`, and the ornament/bar fills) and the hero `<em>` are carried as `theme('colors.orange.DEFAULT')`, colour unchanged. **This is the sole exemption to decision 3:** orange text is permitted in the pomelli homepage sections only. `check-contrast.mjs` measures it as large text (≥24px, 3:1): 6.40 on `#333333`, 4.93 on `#444444`.
2. **§6 conflict 2 — decision 6 is fonts-only.** `app/layout.tsx` may be edited for the skip link (Group B) and anything that is not typography.

Recorded from the implementation:

- **OG image, favicon, apple icon are file conventions, not metadata.** `app/opengraph-image.png` (1200×630), `app/icon.png` (512²) and `app/apple-icon.png` (180²) ship from `brand-assets.zip` (md5 `dd91acd8493bc8ff31e0707786f098bd`). §4 option (i) (an `images` entry in the root `openGraph`) is therefore **not applied**; Next emits the tags from the files.
- **Transitional aliases.** `tailwind.config.ts` keeps `velvet { DEFAULT #333333, deep #222222 }`, `champagne #F5F5F2` and `ink #222222` as aliases of the new values until Group C renames the 300 remaining uses, so nothing renders unstyled between the two PRs. **Group C deletes the three alias lines.** `velvet.soft` is gone (0 uses). `gold.dark` stays: `.gilt`, `button.tsx` and the loyalty tier bar still use `#8A6B12` as a literal.
- **Brand badge assets** at `public/images/brand/logo-badge-{96,192,512}.webp` (4,928 / 12,830 / 49,120 bytes). The Stitch "Brand Logo" SVG was not used.
- **Contrast gate** lives at `scripts/check-contrast.mjs`, run by `npm run check:contrast`; 48 approved pairs plus three must-fail sanity pairs. It also asserts every hex in its table exists in `tailwind.config.ts`, so the table cannot drift from the tokens silently.
