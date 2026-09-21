# Phase 4 — Inner pages go light. Plan and record

Supersedes **decisions 1 and 5** of `phase3-palette-plan.md`: the site no longer
stays dark, and chalk is no longer confined to the homepage collections band.
Everything else in that document — decisions 2, 3, 4, 6, 7, the token set, the
`.gilt` wordmark, the orange-text exemption for the pomelli homepage sections —
stands unchanged and is not re-opened here.

---

## ⚠️ The investigation body is missing from this file

**This document is incomplete and must not be treated as the whole plan.**

The inner-pages investigation that this group implements — its inventory, its
per-page findings, and the definitions of Groups B, C, D and E — was produced in
an earlier session and is **not recoverable from this one**. It is not in the
repository, not in any branch, and not in the session memory index. Rather than
reconstruct it from memory and risk enshrining invented analysis as the plan of
record for four later groups, the body is left out and marked here.

**What is below is only what could be sourced first-hand**: the owner decisions
as stated, the Group A record as implemented and measured, and the contrast
table as computed by the gate. Every number here was recomputed in this session.

**To complete this file:** paste the investigation under "§1–§2 — the
investigation" below, and replace this notice with the group definitions. Group
B cannot safely start until that is done, because its scope is defined there and
nowhere else.

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

> **Not present — see the notice above.** The implemented group references
> "§2 of the report" for its contrast rows; those rows are recorded in full
> under "Contrast" below, measured rather than copied, so the gate is complete
> even though the prose is not.

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

**Not defined here — see the notice at the top.** What Group A already commits
them to:

- **B, C** consume `ghost-light` / `outline-light` and `lib/form-classes.ts`.
  Group C is named in `form-classes.ts` as the group that moves the forms.
- **D** trims the print rules that the light base makes dead.
- **E** flips the base theme, moves `--rule`'s light value to `:root`, and
  decides whether the dark `ghost` / `outline` variants survive as `-dark` or go.
