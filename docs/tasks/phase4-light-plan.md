# Phase 4 — Inner pages go light. Plan and record

Supersedes **decisions 1 and 5** of `phase3-palette-plan.md`: the site no longer
stays dark, and chalk is no longer confined to the homepage collections band.
Everything else in that document — decisions 2, 3, 4, 6, 7, the token set, the
`.gilt` wordmark, the orange-text exemption for the pomelli homepage sections —
stands unchanged and is not re-opened here.

---

## Owner decisions (2026-09-21, settled)

1. **The focus ring on a light surface is `gold-dark` `#8A6B12`.** Not gold
   `#C9A227`, which is the ring on the dark surface and measures 2.42 : 1 on
   white — below the 3.0 a non-text indicator needs. The gate carries
   `gold #C9A227 ring on white` as a must-fail row so it cannot return by
   accident.
2. **The `good` status dot on a light surface is `gold-dark`**, 4.59 : 1 on
   chalk.
3. **Teal stays ornament-only, on dark bands.** This restates decision 4 of
   Phase 3 rather than adding to it, and settles the question the light pass
   raised: teal does **not** cross to the light surface in any role. It never
   carries state, so the light `good` dot is gold-dark (2 above) and teal has no
   row in the light half of the contrast table at all.

---

## §1–§2 — the investigation

Report of 2026-09-21, read from `origin/develop` 13f042e (PR #88 merged; the print work from #87 and the status dots from #86 in), reproduced verbatim. Section headings are demoted one level to sit under this heading; nothing else is changed.

One thing first: `docs/tasks/phase3-palette-plan.md` records owner decisions 1 and 5 as "the site stays dark" and "chalk appears in exactly one place". This goal reverses both, and its "Not adopted: semantic surface tokens" reasoning no longer holds because there are now two surface families. Group A should supersede that file with a Phase 4 plan the way Phase 3 superseded its predecessor.

### 1. Findings

**Per route.** Counts are class occurrences in the page file only, comments stripped. "Breaks" is what fails or loses its boundary the moment the body is `bg-chalk text-charcoal-deep`; every page also loses its `.rule-grid` hairlines, because `--rule` is gold at 32% and reads 1.28:1 on chalk.

| route | surfaces today | chalk / gold-pale / charcoal | shared components | breaks | hero band |
|---|---|---|---|---|---|
| about | `bg-charcoal-deep` panel | 5 / 4 / 0 | ui/button | body `chalk/85` ×3 invisible; `gold-pale` h2 and question list 1.37; `border-gold-pale/40` and `/25` rules 1.5; panel stays a dark island | yes, text |
| account | `bg-charcoal` cards, `deep` notes | 13 / 12 / 0 | sign-out-button | 12 gold-pale headings/links; 3 `border-rule` rows; 2 `garnet-light` alerts 2.16 | no |
| account/addresses | `deep` alert | 6 / 1 / 0 | none | address cards `border-rule` vanish; default chip `border-gold` 2.21; alert `garnet-light/60` | no |
| account/layaway | `charcoal`, `deep` | 7 / 4 / 0 | status-badge | plan rows dark islands; 4 gold-pale figures; garnet alert | no |
| account/layaway/[id] | `charcoal`, `deep` | 19 / 9 / 0 | print-button, print-header, service-request-form, status-badge, layaway-pay-form, transfer-details, button | 19 chalk texts; schedule/payment rows; ghost button `text-gold-pale`; `border-gold/60` pending box | no |
| account/orders | `charcoal`, `deep` | 6 / 3 / 0 | status-badge | as account/layaway | no |
| account/orders/[id] | `charcoal` | 15 / 5 / 0 | print-button, print-header, service-request-form, status-badge, transfer-details, button | 15 chalk; item rows; `border-rule` address box; ghost button | no |
| account/service-requests | `deep` alert | 4 / 2 / 0 | service-request-row | 4 chalk; gold-pale links; garnet alert | no |
| auth/confirm | none | 1 / 0 / 0 | confirm-sign-in | one `chalk/75` lede | no |
| blog | none | 2 / 1 / 0 | none | `divide-[rgba(201,162,39,.16)]` and `border-rule-soft` list rules vanish; `chalk/55` dates; `hover:text-gold-pale` | no |
| blog/[slug] | none | 2 / 1 / 0 | none | `chalk/85` body ×1 (whole article), `chalk/55` date, gold-pale back link | no |
| cart | none | 3 / 2 / 0 | cart-lines, button | `border-gold` total rule 2.21 and dropped-notice box; gold-pale subtotal; ghost button; cart-lines rows | no |
| categories/[slug] | none | 2 / 0 / 0 | product-card | `text-orange` eyebrow 1.81 (the pomelli exemption is homepage-only); `border-rule` banner frame; `chalk/75` | no, keeps its image banner |
| checkout | none | 1 / 0 / 0 | checkout-flow, button | everything inside checkout-flow (101 dark tokens) | no |
| checkout/complete/[order_id] | `charcoal` figure cells | 5 / 1 / 0 | transfer-details, button | figure cells dark islands; `chalk/55` h2; gold-pale figures; ghost button | no |
| collections | `charcoal` tiles | 1 / 1 / 0 | none | tiles stay dark; gold-pale h2 on them fine, but `chalk/75` on white after flip | no |
| collections/[slug] | none | 3 / 2 / 0 | product-card | filter chips: on `border-gold text-gold-pale`, off `border-rule text-chalk/70`; empty box `border-rule` | no |
| faq | none | 3 / 1 / 0 | json-ld, legal-articles | h2 gold-pale; `<summary>` `text-chalk`; `border-rule(-soft)` accordion rules | no |
| gold-guide | `charcoal` dl cells | 3 / 1 / 0 | button | fact cells dark islands; `chalk/55` dt; gold-pale dd | no |
| layaway | none | 1 / 0 / 0 | layaway-calculator (dark tone) | `chalk/80` lede; dark calculator card on a light page | yes, plus the calculator band |
| legal/privacy, returns, terms | none | 0 / 0 / 0 | legal-articles | all 11 tokens are in the component | no |
| legal/tokusho | none | 1 / 0 / 0 | none | `divide-[rgba(201,162,39,.32)]`, `border-rule` | no |
| login | none | 1 / 0 / 0 | login-form | form `border-gold bg-charcoal-deep`; inputs `bg-charcoal`; `text-garnet-light` | no |
| loyalty | `charcoal` tier cards, `before:bg-gold` | 13 / 2 / 0 | button | tier cards dark islands; 13 chalk; gradient bar `#8A6B12→#E8D28A` fine on white; gold bullets 2.21 | yes, text |
| loyalty/join | `deep` panel | 3 / 1 / 0 | join-button, button | panel; join-button's own 10 tokens | no |
| products/[slug] | `deep` specs dl | 5 / 3 / 0 | product-view, condition/karat/origin badges, product-gallery, add-to-cart, layaway-calculator, price-block, reserve-with-layaway, json-ld | specs dl `border-gold bg-charcoal-deep`; badges `border-gold text-gold-pale`; gallery arrows `bg-charcoal/80`, thumbs `border-gold`, focus `outline-gold-pale`; ghost reserve button; dark calculator | yes, the price block |
| search | none | 3 / 1 / 0 | search-view, product-card | none-box `border-rule`; gold-pale link with `hover:text-gold` 2.21 | no |
| wholesale | `before:bg-gold` | 2 / 1 / 0 | inquiry-form | gold bullets; h2 gold-pale; form dark | yes, text |

`app/not-found.tsx` (2 tokens) and `app/layout.tsx` (skip link, already orange) ride with the flip.

**Shared components.**

| component | today | verdict |
|---|---|---|
| layaway-calculator | `tone` prop, `dark` default, `light` used by the homepage band | keep; `/layaway` hosts it inside a dark band with `tone="light"` exactly as the homepage does; the product page passes `tone="light"` |
| product-card | dark, no tone, 16 tokens | go light, no prop: rendered only on catalog pages. `bg-white`, image well `bg-chalk`, name `charcoal-deep`, meta `charcoal/70`, featured frame `border-gold-dark`, sold-out chip `bg-white/90 border-charcoal-deep text-charcoal-deep`, motif stroke `#8A6B12` |
| condition/karat/origin badges | `border-gold text-gold-pale` | go light: `border-gold-dark text-gold-dark` |
| product-gallery | 16 tokens | go light; arrow buttons `bg-white/85 border-hairline text-charcoal-deep`, focus `outline-gold-dark` |
| price-block | `border-y border-rule`, gold-pale price | becomes the product page's dark block: `bg-charcoal-deep p-5`, price `gold-pale`, line `chalk/75` |
| legal-articles | 11 tokens | go light |
| checkout-flow | 101 tokens, 24 fills | go light; needs judgement on the summary aside, alert boxes and 6 inline inputs |
| cart-lines, transfer-details, layaway-pay-form, login-form, inquiry-form, join-button, service-request-form, service-request-row | dark forms and rows | go light, form rule below |
| StatusBadge + `toneClass` | gold-pale / chalk on dark, dots teal / gold-pale / chalk-40 | rewrite once for light (see §2); used only on account pages |
| Button | solid orange works on both; ghost `border-gold text-gold-pale`, outline `border-gold text-chalk` fail on light | needs light variants; hero-slides already overrides its ghost with `border-chalk/60 text-chalk` |
| account-menu, mobile-nav, header, footer, search-box, flash-notice | done or chrome | untouched; the dark toast on a light page is fine |
| PrintHeader | print-only, no screen colour | untouched |

**Print stylesheet (#87), `app/globals.css:96-180`.** Nothing has to change for it to keep working. Once the base is light, three rules become dead or misleading: the header comment "The screen theme is dark" (line 93), the `.print-invoice [class*="bg-charcoal"]` selector (line 124, no card will carry it), and `body:has(.print-invoice) { color }` which now restates the screen. The `.rule-grid` shadow-to-border swap (129-133) and `[class*="border-"] → #E5E5E0` (134) stay necessary. Group D should update the comment, drop the dead selector, and verify one print preview; `PrintHeader` is unchanged.

**Dark hero bands.** Only text exists for these; `public/images` holds brand badges, category and collection photos and the three homepage images, nothing for about, loyalty or wholesale. Text-only bands, `bg-charcoal-deep`, h1 `gold-pale`, lede `chalk/80`:

| route | copy | note |
|---|---|---|
| about | `lib/content/about.ts` `h1` (line 39 ja, 79 en) and `intro` | the two `questions` can stay as the band's gold-pale list |
| layaway | `home.layH`, `home.layP`, `home.layPill`, steps `layStep1-3H/P`, calculator `tone="light"` | this is the homepage §7 block; extract it to `components/commerce/layaway-band.tsx` and use it in both places |
| loyalty | `app/loyalty/page.tsx:19-25`, `loyalty.h1` and its lede | tiers and join sections go light |
| wholesale | `app/wholesale/page.tsx:14-19`, `wholesale.h1` and lede | bullets and form go light |
| products/[slug] | price block only | the calculator sits below it in light tone; specs dl goes light |

### 2. The mechanism, with the numbers

Computed with the script's own formula; the rows marked new go into `check-contrast.mjs`.

| pair | ratio | verdict |
|---|---|---|
| charcoal-deep on chalk / white | 14.57 / 15.91 | body text |
| charcoal on chalk / white | 11.57 / 12.63 | secondary |
| charcoal/70 on chalk / white | 4.74 / 4.95 | the muted floor, new rows |
| charcoal/65, /60, /55 on chalk | 4.10, 3.57, 3.16 | fail; nothing below /70 |
| gold-dark on chalk / white | 4.59 / 5.01 | accent text and links, already in the table |
| gold `#C9A227` on chalk | 2.21 | fails as text and as a 3:1 boundary: `border-gold` cannot carry state on light |
| gold-pale on chalk | 1.37 | never |
| teal on chalk / white | 2.21 / 2.41 | fails 3:1: the "good" status dot cannot stay teal |
| orange fill edge on chalk | 1.81 | pre-existing on the homepage CTAs; label 8.06 passes |
| garnet `#7A1E2B` on chalk / white | 9.39 / 10.25 | error text, new rows; `garnet/60` border ≈ 3.7 passes |
| garnet-light on chalk | 2.16 | every one of the 13 uses flips to garnet |
| hairline `#E5E5E0` on white | 1.26 | fine as a divider (same as the homepage), not as a form-control edge |
| charcoal/60 on white as input border | 3.69 | new row; inputs need `border-charcoal/60`, hairline alone is 1.26 |
| gold ring as focus on white | 2.42 | fails; the focus ring on light must be **gold-dark** (5.01). The rules say "focus ring gold"; that only holds on dark bands |

Two pre-existing homepage failures surfaced by the same arithmetic, out of scope but worth a line: `text-charcoal/50` on the arrival placeholders (`components/home/arrival-card.tsx:55-56`, 2.78) and the search placeholder (`search-box.tsx:196`).

Mechanism, three pieces and nothing more:

1. `--rule` becomes surface-scoped. `.rule-grid` draws its dividers from `var(--rule)` (`globals.css:79`). Group A adds `.surface-light { --rule: #E5E5E0 }`; the final flip moves that to `:root` and adds `.band-dark { --rule: rgba(201,162,39,.32) }`. The Tailwind `border-rule` class stays gold for use inside dark bands.
2. Button gains `ghost-light` and `outline-light` variants in A (`border-gold-dark text-gold-dark hover:border-charcoal-deep hover:text-charcoal-deep`; `border-charcoal/60 text-charcoal-deep hover:border-charcoal-deep`). Migrated pages use them; the final flip renames them to `ghost`/`outline` and deletes the dark pair. hero-slides keeps its explicit classes.
3. StatusBadge tones on light: good `border-gold-dark text-gold-dark`, dot solid gold-dark; pending `border-charcoal/60 text-charcoal-deep`, dot orange with a 1px charcoal-deep ring; dead `border-hairline text-charcoal/70`, hollow dot `border-charcoal/70`. Three new NONTEXT rows.

Form rule, one class string reused by every form: input `bg-white border-charcoal/60 text-charcoal-deep focus:outline-none focus:ring-2 focus:ring-gold-dark`, label `charcoal/70`, error `text-garnet`, alert `border-garnet/60 bg-white`.

### 3. Plan

**Sequencing correction.** Flipping the body first is the largest blast radius, not the smallest: 30 routes carry 557 dark tokens and every `text-chalk` becomes chalk on chalk at once. The homepage shows the safe pattern: it lights its own root (`app/page.tsx:77`, `bg-chalk text-charcoal`). So each group makes its routes self-lit with a `surface-light bg-chalk text-charcoal-deep` root, and the body flip is the last, smallest PR, which then strips those 30 root classes. Five PRs into `develop`, in this order.

**A. tokens, globals, primitives, gate.** 5 files, no visible change anywhere. `app/globals.css` (`.surface-light` rule scoping, print comment), `components/ui/button.tsx` (two light variants), `scripts/check-contrast.mjs` (the new rows above, plus must-fail rows for gold-pale on chalk, teal on white, gold ring on white), `docs/tasks/phase4-light-plan.md` (this report, superseding Phase 3 decisions 1 and 5), `tailwind.config.ts` untouched (every token needed exists). Mechanical.

**B. catalog.** 9 files, 55 tokens: `collections`, `collections/[slug]`, `categories/[slug]`, `products/[slug]`, `search`, `product-card`, `product-gallery`, `price-block`, the three badges, `add-to-cart`, `reserve-with-layaway`. Mostly mechanical; judgement on the product page (specs dl, price block band, calculator `tone="light"`, `reserve-with-layaway` → `ghost-light`) and the filter chips.

**C. content.** 16 files, 105 tokens: about, faq, gold-guide, blog ×2, legal ×4, layaway, loyalty, loyalty/join, wholesale, `legal-articles`, `join-button`, `inquiry-form`, plus the new `layaway-band`. Mechanical for faq, gold-guide, blog, legal, tokusho; judgement on the four hero bands, the about panel, the loyalty tier cards and the two forms.

**D. commerce and account.** 23 files, 356 tokens: cart, checkout, checkout/complete, login, auth/confirm, all 8 account routes, `checkout-flow`, `cart-lines`, `transfer-details`, `layaway-pay-form`, `login-form`, `service-request-form`, `service-request-row`, `status-badge`, `lib/order-status.ts`, print stylesheet trim. Mechanical for the six list/detail pages after the sed; judgement in checkout-flow (its 24 fills, 6 inputs, the aside) and the four forms.

**E. body flip.** `globals.css:7` → `bg-chalk text-charcoal-deep`, `--rule` to root with `.band-dark` override, button variants collapsed, `not-found.tsx`, and one sed removing the `surface-light bg-chalk text-charcoal-deep` root class from 30 pages. Mechanical.

**Rename table**, applied in this order in B, C and D, then reviewed. The `\b`-anchored sed lines are safe; the last three rows are the judgement calls.

| from | to | note |
|---|---|---|
| `text-chalk`, `text-chalk/85` | `text-charcoal-deep` | body |
| `text-chalk/80`, `/75` | `text-charcoal` | secondary |
| `text-chalk/70`, `/65`, `/60`, `/55`, `/40` | `text-charcoal/70` | the floor; nothing dimmer |
| `hover:text-chalk` | `hover:text-charcoal-deep` | |
| `border-rule`, `border-rule-soft` | `border-hairline` | dividers only |
| `divide-[rgba(201,162,39,.16\|.32)]` | `divide-hairline` | blog:14, tokusho:30 |
| `garnet-light` | `garnet` | text and `/60` borders |
| `outline-gold-pale` | `outline-gold-dark` | focus rings |
| `hover:text-gold-pale`, `marker:text-gold-pale`, `decoration-gold-pale/50`, `hover:text-gold` | `…gold-dark…` | |
| `before:bg-gold` | `before:bg-gold-dark` | loyalty:50, wholesale:24 bullets |
| `variant="ghost"` / `"outline"` | `"ghost-light"` / `"outline-light"` | until E |
| `text-gold-pale` | `text-gold-dark` for figures, prices, links, chips; `text-charcoal-deep` for headings | **judgement**: 123 uses, roughly half are `font-display` headings |
| `border-gold`, `border-gold/60` | `border-gold-dark` where it carries state (chips, featured, default badge, form frames, pending box); `border-hairline` where it is a divider (cart total, price rule) | **judgement** |
| `bg-charcoal` | `bg-white` inside a `.rule-grid` (the grid draws the hairlines); `bg-white border border-hairline` standalone | **judgement** on standalone boxes |
| `bg-charcoal-deep` | inputs → the form rule; panels → `bg-white border border-hairline`; alerts → `bg-white border-garnet/60`; hero bands stay | **judgement** |
| `text-orange` (categories:52) | `text-gold-dark` | homepage exemption does not travel |

**Anchors to grep**, per group, after the rename and before the PR. Zero hits outside a `.band-dark` block:

```
grep -nE 'text-chalk|text-gold-pale|bg-charcoal|border-rule|garnet-light|outline-gold-pale|rgba\(201,162,39|text-orange|before:bg-gold\b' <group files>
```

and for E, repo-wide over `app components lib` minus `components/home`, `components/site`, `app/page.tsx`: only `.band-dark` blocks and hero-slides.

**Gates per PR**, all exit 0 as today: `check:terms`, `check:i18n`, `check:analytics`, `check:contrast` (with A's rows), `typecheck`, `lint`, `build`; then on the Vercel preview, `@axe-core/playwright` `color-contrast` at 375 and 1440 on every route the group touched, since the table can only measure pairs someone remembered to add.

Two decisions are yours before A starts: the focus ring on light is gold-dark, not gold (the stated rule fails at 2.42), and the "good" status dot moves off teal (2.41).

---

## Group A — tokens, primitives and the gate (SHIPPED)

Branch `feature/light-a`, three commits. **No visible change on any route**:
Group A adds the vocabulary the later groups spend, and applies none of it.

| Commit | |
|---|---|
| `f01e7e4` | `feat(theme): surface-scoped rule colour for the light pass` |
| `8939745` | `feat(ui): light button variants, form rule, StatusBadge light surface` |
| `dbb68ea` | `chore(contrast): light-surface pairs and must-fail rows` |

### What shipped

**`app/globals.css`** — `.surface-light { --rule: #E5E5E0 }` and
`.band-dark { --rule: rgba(201,162,39,.32) }`. `--rule` is the hairline colour,
declared in `:root` and read by `.rule-grid > *`; scoping it per surface lets a
component draw the right divider without knowing which surface it was dropped
onto. **Group E moves the light value to `:root`** when the base theme flips.

Neither class is on any markup yet, so **Tailwind tree-shakes both and they are
absent from the compiled CSS**. That is expected. They begin being emitted the
moment a component carries the class.

The print block's opening comment previously said the screen theme is dark.
From Group E it is not, so it now reads: the base theme is light from Group E,
and these rules normalise the *remaining* dark bands for print. **Every print
rule is kept for now**, including the ones the light base already satisfies;
**Group D trims the dead ones**, once there is a rendered page to check against.

**`components/ui/button.tsx`** — two variants:

```
ghost-light    border-gold-dark text-gold-dark
               hover:border-charcoal-deep hover:text-charcoal-deep
outline-light  border-charcoal/60 text-charcoal-deep
               hover:border-charcoal-deep
```

New variants rather than edits to `ghost` / `outline`, because both surfaces
exist at once until Group E and the tokens do not survive the crossing:
gold-pale is the readable gold on charcoal (8.43 : 1) and is 1.37 : 1 on chalk;
gold-dark is the reverse. **Group E decides** whether the dark pair survives as
`-dark` variants or goes.

**`lib/form-classes.ts`** (new) — `inputLight`, `labelLight`, `errorLight`,
`alertLight`. Constants rather than a component: the forms differ in markup —
`<input>`, `<select>`, a `<textarea>`, several inside grids with their own spans
— and a wrapper would have to model all of it. **Group C moves the forms onto
them**; nothing imports them yet.

**`components/account/status-badge.tsx` + `lib/order-status.ts`** — both take
`surface?: "dark" | "light"`, defaulting to `"dark"` with byte-identical output,
so all four existing call sites are untouched.

| tone | light badge | light dot |
|---|---|---|
| `good` | `border-gold-dark text-gold-dark` | `bg-gold-dark` |
| `pending` | `border-charcoal/60 text-charcoal-deep` | `bg-orange ring-1 ring-charcoal-deep` |
| `dead` | `border-hairline text-charcoal/70` | hollow: `border border-charcoal/70` |

### The one finding worth carrying forward

**The pending dot's ring is load-bearing, not decoration.** Orange on chalk is
**1.81 : 1** — under the 3.0 a graphical object needs — so a bare orange dot is
not perceivable on a light surface. The `charcoal-deep` ring is what carries it,
at 14.57. The gate pins the bare fill at the non-text threshold as a must-fail
row so the ring cannot be dropped later as styling.

---

## Contrast

`scripts/check-contrast.mjs`, 84 pairs (was 73). Every figure below was computed
in this session, not carried over.

### Light rows added

| Pair | Surface | Ratio | Need |
|---|---|---|---|
| charcoal-deep text | chalk | 14.57 | 4.5 |
| charcoal/70 text | chalk | 4.74 | 4.5 |
| garnet error text | chalk | 9.39 | 4.5 |
| garnet error text | white | 10.25 | 4.5 |
| charcoal/60 input border | white | 3.69 | 3.0 |
| gold-dark focus ring | white | 5.01 | 3.0 |
| garnet/60 alert border | white | 3.61 | 3.0 |
| status dot `good` (gold-dark) | chalk | 4.59 | 3.0 |
| status dot `pending` **ring** (charcoal-deep) | chalk | 14.57 | 3.0 |
| status dot `dead` hollow (charcoal/70 border) | chalk | 4.74 | 3.0 |

Already present from the light calculator and the gold text rule, not
duplicated: gold-dark on chalk (4.59) and on white (5.01), charcoal on chalk
(11.57) and on white, charcoal-deep on white (15.91), charcoal/70 on white
(4.95).

**Two of these clear their threshold by under half a point** — the placeholder
at 4.95 and the input border at 3.69. Neither may be lightened without re-running
the gate.

### Must-fail rows added

Each is a token that looks like it would be fine on a light surface and is not.

| Pair | Ratio | Registered at |
|---|---|---|
| teal on white | 2.41 | text |
| gold `#C9A227` ring on white | 2.42 | non-text |
| garnet-light on chalk | 2.16 | text |
| bare orange dot on chalk | 1.81 | non-text |
| charcoal/60 on chalk | 3.57 | **text** |

`charcoal/60 on chalk` is registered at the **text** threshold deliberately: it
*passes* 3.0 as a border and fails 4.5 as text, which is exactly the trap it
exists to catch. `gold-pale on chalk` (1.37) was already a must-fail row and
stays.

Both failure paths were exercised rather than assumed: a sanity row that passes,
and an approved pair that fails, each exit 1.

---

## Gates

All seven at every commit, all exit 0: `check:terms`, `check:i18n`,
`check:analytics`, `check:contrast`, `typecheck`, `lint`, `build`.

**No rendered class changed.** Verified per-selector, not by reading a diff: the
compiled CSS was captured from `origin/develop`, then compared by merging every
declaration that applies to each individual selector, expanding comma groups so
a rule Tailwind regrouped compares equal.

```
selectors: baseline 671, new 678
CHANGED 0 · REMOVED 0 · ADDED 7
```

The seven additions are `.bg-gold-dark`, `.border-charcoal/60`,
`.border-charcoal/70`, `.hover:border-charcoal-deep`, `.hover:text-charcoal-deep`,
`.ring-1` and `.ring-charcoal-deep` — all from the StatusBadge light dots and the
light button variants, none of them rendered. A raw text diff also showed `.ring`
as modified; that is Tailwind factoring a shared `box-shadow` into a grouped
selector, and the merged declarations are identical, which is why the comparison
is per-selector.

---

## Groups B–E

**Defined in §3 of the investigation above** (groups B, C, D and E, their files,
the rename table, the anchors and the gates). What Group A already commits them
to:

- **B, C** consume `ghost-light` / `outline-light` and `lib/form-classes.ts`.
  Group C is named in `form-classes.ts` as the group that moves the forms.
- **D** trims the print rules that the light base makes dead.
- **E** flips the base theme, moves `--rule`'s light value to `:root`, and
  decides whether the dark `ghost` / `outline` variants survive as `-dark` or go.
