---
name: Cha Jewels
description: Gilded maximalism, value-driven luxe. Tokyo fine and preloved jewelry, where K18 purity, gram weight and a yen price are set with the care of the gold itself.
colors:
  gold: "#C9A227"
  gold-pale: "#E8D28A"
  gold-dark: "#8A6B12"
  gold-deep: "#6F5510"
  orange: "#FFA500"
  orange-hover: "#FFB733"
  charcoal-deep: "#222222"
  charcoal: "#333333"
  charcoal-mid: "#444444"
  chalk: "#F5F5F2"
  white: "#FFFFFF"
  hairline: "#E5E5E0"
  garnet: "#7A1E2B"
  garnet-light: "#F28B94"
  teal: "#1ABC9C"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(36px, 5.5vw, 80px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(32px, 4.4vw, 56px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(20px, 2.4vw, 28px)"
    fontWeight: 400
    lineHeight: 1.1
  price:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: 1.1
    fontFeature: "\"lnum\" 1, \"tnum\" 1"
  heading-ja:
    fontFamily: "Noto Serif JP, Hiragino Mincho ProN, serif"
    fontWeight: 500
    letterSpacing: "0.01em"
  body:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  button:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.2
  label:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.14em"
  spec:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
    fontFeature: "\"lnum\" 1, \"tnum\" 1"
rounded:
  none: "0px"
  sm: "2px"
  full: "9999px"
spacing:
  hairline: "1px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  gutter: "clamp(18px, 4vw, 48px)"
  section-mobile: "64px"
  section: "96px"
  container: "1240px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.charcoal-deep}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.orange-hover}"
    textColor: "{colors.charcoal-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.gold-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "48px"
  button-ghost-hover:
    textColor: "{colors.charcoal-deep}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.charcoal-deep}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "48px"
  price-card:
    backgroundColor: "{colors.charcoal-deep}"
    textColor: "{colors.gold-pale}"
    typography: "{typography.price}"
    rounded: "{rounded.none}"
    padding: "20px"
  product-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal-deep}"
    rounded: "{rounded.none}"
    padding: "20px"
  badge-status:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.charcoal}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  badge-origin:
    backgroundColor: "transparent"
    textColor: "{colors.gold-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 12px"
  spec-cell:
    backgroundColor: "transparent"
    textColor: "{colors.charcoal-deep}"
    typography: "{typography.spec}"
    rounded: "{rounded.none}"
    padding: "24px 16px"
  lang-toggle-active:
    backgroundColor: "{colors.charcoal-deep}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    height: "36px"
  sticky-buy-bar:
    backgroundColor: "{colors.charcoal-deep}"
    textColor: "{colors.gold-pale}"
    height: "64px"
    padding: "8px 16px"
---

# Design System: Cha Jewels

<!--
  WHAT THIS FILE IS. It records the live Pomelli/Stitch theme as it ships on
  develop (ac2c408) and extends it to make "gilded maximalism" visible. It
  does not invent a new palette. Every hex above is in tailwind.config.ts.
  Every motion value named below is in lib/motion.ts. Every contrast figure
  is a row in scripts/check-contrast.mjs.

  Status markers used in the body:
    (live)     shipped on develop today
    (planned)  an audit-chosen extension, not built yet; build it to this spec
    (change)   the live code differs; move it to this spec when that surface
               is next touched

  Three frontmatter components are (planned) or (change): spec-cell and
  sticky-buy-bar do not exist yet, and lang-toggle-active is orange in the
  code today. Product rules (terminology, origin, layaway language, "Sold",
  reserve-first) live in PRODUCT.md. This file is visual only.

  NORTH STAR. "The Gilded Ledger", confirmed by the owner 2026-09-25.

  This file is scanned by `npm run check:terms`, so forbidden phrases are
  never written out here.
-->

## Overview

**Creative North Star: "The Gilded Ledger"**

The Gilded Ledger is a gold merchant's ledger bound in dark leather and gold leaf. Its pages are precise: purity, grams, stones, condition, price, each entered in a steady hand. The richness is in the binding, the rules and the gilt headings: dark bands, gold hairlines, gilt display type, light crossing a surface. The *entries* stay exact and quiet enough to trust. Maximalism here means **abundance of real things**: more pieces, more facts, more proof, set densely on rich surfaces. It never means more empty air or more effects.

The site alternates light chalk pages with dark charcoal bands. The dark bands are where gold is loudest: the hero, the price card, the layaway band, the footer. Display type is a high-contrast serif, and the facts are set in a clean sans with lining figures. Motion is slow and weighted: things *arrive* and settle, and light *crosses* gold. Nothing bounces, snaps or sparkles.

The audit found the live site reads "quiet and minimal with gold trim". The upgrade does not add whitespace or new colours. It moves the gilding from trim to structure: gold-ruled dark bands framing every high-value moment, the price set as a gilt figure, spec facts in hairline ledger cells, and a real piece plus its price in the first viewport.

**Key Characteristics:**
- Chalk pages, charcoal bands; the colour change is the divider.
- Gold is the accent and the material. Orange is the only action colour.
- Playfair for names and prices; Inter for facts, with lining tabular numerals.
- Square corners (0 to 2px). Only icon controls and status dots are round.
- Hairline ledger grids instead of boxes.
- Slow, weighted motion on one exponential-out ease. Light moves on its own even ease.
- Real photography leads. 3D appears only in the hero and banners, never on a product.

## Colors

Two materials, gold and charcoal, on a chalk page. One action colour, orange. Three functional colours that never decorate.

### Primary
- **Leaf Gold** (gold): the brand accent as *material*. It is used for rules on dark bands (`border-rule`, 32% alpha), shine borders, card entrance lines, the hero sweep and the gilt gradient's midpoint. It is a non-text colour on light surfaces, and on charcoal-deep it passes as an edge.
- **Pale Gilt** (gold-pale): gold as *type on dark*. It sets headlines, the price figure and labels on charcoal bands (10.62:1 on charcoal-deep, 8.43:1 on charcoal, 6.50:1 on charcoal-mid). **Never on chalk or white** (1.37:1).
- **Assay Gold** (gold-dark): gold as *type on light*. It sets headings, eyebrows, spec values, the ghost button and the origin badge on chalk and white (4.59:1 on chalk, 5.01:1 on white).
- **Deep Assay** (gold-deep): gold-dark taken one step down for *tinted* light surfaces (hairline/40, the chalk/95 tab bar), where gold-dark falls under 4.5:1.

### Secondary
- **Reserve Orange** (orange, orange-hover on hover): **buy and contact actions only**. It fills the primary button (charcoal-deep label, 8.06:1). It may also mark a *numbered step inside the layaway band*, which is itself a buying action.

### Neutral
- **Ink Charcoal** (charcoal-deep): body text on light, the dark band surface, the price card, the footer, the hero curtain.
- **Leather Charcoal** (charcoal): secondary text on light (at 70% or more), the mid dark band.
- **Slate Charcoal** (charcoal-mid): the lightest dark surface. chalk text needs 65% or more on it.
- **Chalk** (chalk): the page. Also the image well behind product photos.
- **White** (white): product-card bodies and form cards sitting on chalk.
- **Ledger Hairline** (hairline): 1px rules, grid dividers and card edges on light. On dark bands the rule is gold at 32% (`--rule` inside `.band-dark`).

### Functional (never decorative)
- **Garnet** (garnet): error text and alert borders on light (garnet-light on dark).
- **Teal** (teal): the "good" status dot and ornament only. It fails as text on light (2.41:1) and is never used for text or a focus ring.

### Named Rules
**The Orange Means Buy Rule.** Orange appears on an element only if tapping it buys, reserves, pays or contacts a person. It never appears on navigation, the language toggle, footer headings, eyebrows or badges.
- (change) The active language toggle (`components/site/lang-switcher.tsx`) moves to charcoal-deep fill with a chalk label.
- (change) The hero slides' orange eyebrow (`components/home/hero-slides.tsx`) moves to gold-pale.
- The old Pomelli homepage exemption for orange headings (≥24px, recorded in `docs/tasks/phase3-palette-plan.md`) is **retired**. Do not use it for new work.

**The Gold Has Two Hands Rule.** On light, gold is Assay Gold or Deep Assay. On dark, it is Pale Gilt or Leaf Gold. Never pale gold on chalk, and never dark gold on charcoal.

**The Contrast Ledger Rule.** Every new colour pairing, alpha or scrim gets a row in `scripts/check-contrast.mjs` before it ships. The script is the source of truth for every ratio quoted in this file.

## Typography

**Display Font:** Playfair Display, 400/500/600, no italic (with Georgia, serif)
**Body Font:** Inter, 400 to 700 (with Helvetica Neue, Arial, sans-serif)
**Japanese Headings:** Noto Serif JP, 500 (with Hiragino Mincho ProN, serif)

**Character:** A high-contrast engraved serif for names, headings and the price, the gilt titles of the ledger. A neutral grotesque for every fact, figure and instruction, the entries. The serif carries emotion; the sans carries trust.

### Hierarchy
- **Display** (400, clamp(36px→80px), line-height 1.02, tracking -0.01em): collection and category headers and page heroes, at one per page. Gilt (see Named Rules) is allowed at this size.
- **Headline** (400, clamp(32px→56px), 1.02): section headings and the homepage hero h1 (which runs clamp(30px→60px) at 1.15).
- **Title** (400, clamp(20px→28px), 1.1): the **short product name**, card titles and sub-sections. (planned) The product-page H1 is capped at 36–40px desktop and 26–28px mobile, and holds only the short name.
- **Price** (Playfair 400, 36px, lining + tabular figures): the yen price in the price card, in Pale Gilt on charcoal-deep. Playfair's default old-style figures make "19.00g" and "¥679,980" bounce. (change) Apply `font-variant-numeric: lining-nums tabular-nums` wherever Playfair sets digits.
- **Body** (Inter 400, 17px long-form and 15–16px UI, line-height 1.625, max 68ch): descriptions, posts, FAQ answers.
- **Spec** (Inter 500, 13px, tracking 0.04em, lining + tabular): (planned) the spec line under a product name, e.g. `K18 YG · 19.00 G · D 2.70 CT · SIZE 18`, and spec-cell values. Uppercase on EN only.
- **Label** (Inter 600, 11px, tracking 0.14em, uppercase on EN): eyebrows, badges, spec-cell captions, footer headings. In Assay Gold on light and Pale Gilt on dark.
- **Japanese headings** use Noto Serif JP 500, tracking 0.01em.

### Named Rules
**The Names Are Short Rule.** A product's display name is a few words ("Layered Wave Ring"). The Hub's SKU string never sets as a headline. (planned) The name comes first, then the spec line, then the price. The SKU goes in a muted caption.

**The Lining Figures Rule.** Any digit that is a price, weight, carat, size or date is set with lining tabular figures, in any font.

**The Japanese Is Not Tracked Rule.** Never uppercase-transform or wide-track Japanese. JA labels use the label size with 0.05em tracking. Headings must not break mid-word (`word-break: auto-phrase` or BudouX). Never fake an italic on Japanese.

**The Gilt Is Earned Rule.** The `.gilt` gradient text (dark to pale to leaf gold) and the hero sheen are the site's signature gilding. Use them only at Display or Headline size (≥32px), on at most one element per viewport, and never on a price or a fact. The owner confirmed the gilt glow on headlines (2026-09-25), with exactly these limits.

## Layout

- **Container:** max 1240px, gutter `clamp(18px, 4vw, 48px)` (`.wrap`).
- **Section rhythm:** 64px vertical on mobile, 96px on desktop (live pages use `py-16` / `lg:py-24`). (planned) One shared section token for every home band, so the rhythm stops varying.
- **Bands:** chalk pages alternate with full-bleed charcoal bands (`.band-dark`). The colour change is the divider, so no ornamental dividers go between them.
- **Density:** maximalist means *full*. A half-empty grid row, a blank right column or a tall empty card is a defect. Fill it with product, proof (hallmark macro, spec cells, a customer quote) or photography, never with extra padding.
- **Product grid (planned, Apple-style grid):**
  - 4 columns at 1024px and up, 3 at 834–1023px, 2 on phones and tablets down to ~360px.
  - Gutters: 24px desktop, 12px mobile.
  - Cards fill left to right with equal widths. A 2-item collection still reads as intentional (auto-fill grid, or an editorial category tile fills the row).
- **Product image:** (planned) a 1:1 square with the whole piece contained (`object-fit: contain`, ~10% inset) on the chalk image well. 4:5 only for necklaces and pendants, where the drop matters. (change) Cards use a 4:3 cover crop today, which cuts rings.
- **Product page:**
  - On phones the order is image → name → spec line → price card → primary action.
  - Leave at least 40px between the gallery and the next unrelated block.
  - (planned) Sticky buy bar: see Components.
- **Hero:** a full-bleed film or 3D centerpiece with the headline anchored bottom-left over a bottom-weighted scrim.
  - (planned) A real piece and its price appear in the first viewport, via the first slide or a product strip overlapping the hero's bottom edge.
  - Phones get their own art-directed crop.
- **Responsive:** breakpoints are Tailwind's defaults (sm 640, md 768, lg 1024, xl 1280). No horizontal page scroll at any width (`overflow-x: clip` on html and body).

## Elevation & Depth

This is a hybrid system. **Depth comes mostly from tone.** Chalk sits beside charcoal, and the dark bands and the price card are the "raised" material. Shadows are warm, layered and rare. **Light** is the third depth cue: a gold sweep crosses the hero, a shine runs around a focused CTA, and a spotlight follows the pointer on dark cards.

### Shadow Vocabulary
- **Card rest** (`0 1px 2px rgb(35 29 18 / 6%), 0 5px 14px rgb(35 29 18 / 7%), 0 16px 32px rgb(35 29 18 / 5%)`): collection cards at rest (`.card-depth`). It is warm brown-black, never neutral grey.
- **Card lifted** (`0 2px 4px rgb(35 29 18 / 8%), 0 10px 24px rgb(35 29 18 / 10%), 0 28px 56px rgb(35 29 18 / 8%)`): pre-rendered on `::after` and revealed by opacity on hover and focus. The shadow itself is never animated.
- **Gold halo** (`0 0 26px gold / 40%, 0 0 2px gold-pale / 80%`): the layaway CTA inside the dark band only.

### Named Rules
**The One Quiet Hover Rule.** A card gets one hover response: the shadow reveal, the image second-photo swap, or a tilt of at most 6°. Never lift + border + colour at once.

**The Light Crosses, Things Arrive Rule.** Motion uses the tokens in `lib/motion.ts`:
- **Arriving** content uses `--ease-lux` (cubic-bezier(0.16, 1, 0.3, 1)) over 0.9s for text and 1.2s for images.
- **Light** uses `--ease-sheen` over 2.6s.
- **Hover and tap** use 0.25s.
- **Press** is scale 0.985: 80ms in, 200ms out.

A one-off duration anywhere is a bug. `prefers-reduced-motion` gets the final state from first paint. No particles, no custom cursor, no scroll-jacking, no bounce.

**The 3D Stays On Stage Rule.**
- 3D appears only in the hero and banners, as a decorative centerpiece.
- Banners use pre-rendered stills or loops, not live WebGL.
- There is always a still-image fallback for slow connections, `Save-Data`, low-power phones and reduced motion.
- **No 3D, WebGL or rendered models on product pages or product cards, ever.** A product is shown by photographs and, later, MP4 video.

## Shapes

The shapes are square and engraved. Cards, images, bands, the price card, badges and spec cells have 0px corners. Buttons, inputs, the language toggle and shine borders have a 2px `rounded-sm`, just enough to read as pressed metal rather than paper. **Full rounding is reserved for** icon controls over photos (the gallery and hero arrows, the play/pause toggle), social icons, and status dots. Never use pill buttons or rounded double-bezel cards. Divider ornaments are the drawn diamond and the gold hairline; nothing else.

## Components

### Buttons
Buttons are tactile and certain, like a stamped gold bar.
- **Shape:** gently squared (2px), minimum height 48px, 24px side padding, Inter 15px/500.
- **Primary (Reserve Orange):** orange fill, charcoal-deep label. Used for buy, reserve, checkout, pay, send and contact. Use one per view, or one per card.
- **Ghost (Assay Gold):** a gold-dark 1px edge and gold-dark label on light. On hover the edge and label turn charcoal-deep. Used for secondary paths (calculate layaway, view collection). On a dark band the call site overrides it to chalk (`hero-slides.tsx` is the one example).
- **Outline (charcoal):** a charcoal/60 edge and charcoal-deep label. Used for a quiet alternative next to a primary.
- **Press:** scale 0.985 (`.btn-press`). Disabled controls never animate.
- **Focus:** a 2px outline, 3px offset. (change) Use gold-dark on light surfaces and gold-pale on dark. The global gold-pale ring is 1.37:1 on chalk (audit P1).

### Price Card (Ferrari-style name / spec line / price)
The price card is the most "value-driven luxe" object on the site.
- (live) A charcoal-deep slab (`.band-dark`, 20px padding). The yen price is set in Playfair 36px in Pale Gilt. Below it, a chalk/75 line gives the layaway reserve and 0% note (EN only).
- (planned) Above it, the three-tier grammar:
  1. the short name (Title),
  2. the spec line (Spec, gold-dark on light),
  3. the price card.
- (planned) The peso price appears as a second line, from the Hub FX. A customer may pay in pesos; the Hub converts at checkout.
- (change) The reserve figure must come from the Hub quote, not the current local 30% calculation.

### Spec Table (Bugatti-style hairline ledger)
- (planned) Sits on the product page directly under the price card. It is a 4-column grid, 2 columns on phones, of **value over LABEL** cells:
  - the value is in Spec at 20–24px, tabular;
  - the caption is in Label, muted;
  - cells are separated by 1px hairlines (`.rule-grid`), gold 32% on dark;
  - no fills, no boxes.
- Cells: Purity (K18 YG/WG), Weight (19.00 g), Stones (D 2.70 ct), Size, Condition, SKU.
- JA values localised (号 for ring size).
- It replaces the repeated description sentence and the lone SKU line.
- The live card's 3-cell Metal/Weight/Stone strip is the seed of this pattern.

### Product Card
- (live) White body on a chalk image well. The Sold badge sits over the image, followed by the condition badge, the name (Title), the metal and weight line, and the price. A second photo appears on hover, with a tilt of up to 6°. Sold cards are quiet: no tilt, no reserve line.
- (planned) Status badges (Sold / 売約済み, Preloved) go over the image corner. The body holds only name → spec line → price. The SKU becomes a caption, never the title.
- (change) Square 1:1 contained image (see Layout).
- **Depends on photography.** One consistent backdrop and the whole piece in frame.

### Badges
- **Status** (Sold, Preloved): chalk fill, hairline edge, charcoal/70, Label size.
- **Origin** (`origin-badge.tsx`, the only origin renderer): gold-dark 1px edge and gold-dark text. It shows either the Japanese-origin label (only when the Hub says JAPAN) or the brand name. It is never restyled into a site-wide claim.
- **Karat:** purity as data, e.g. "K18".

### Navigation
- The header is light, hides on scroll down and returns on scroll up (`HEADER` in `lib/motion.ts`). It turns solid past 24px.
- Menus open with a 180ms fade-drop. The mobile drawer is a dialog, with a 220ms entrance.
- Labels are Inter and consistent across surfaces: one name per destination, in both languages.
- **Language toggle:** a 2px-edged segmented control. (change) The active segment is charcoal-deep with a chalk label, not orange.
- **Mobile tab bar:** Home, Pieces, Layaway (EN only), Loyalty, Account. JA labels are 11px minimum (change: 10px today).

### Sticky Buy Bar (Apple-style)
- (planned) Mobile product page only.
- It appears once the primary action scrolls out of view: a 64px charcoal-deep bar with a gold rule on top.
- The yen price in Pale Gilt (lining figures) sits on the left, the orange primary action on the right, and an optional "Layaway" text link (EN only).
- It hides for Sold pieces.

### Layaway Band (EN only)
- (live) The best-designed block on the site: a dark band with a gold-pale→gold connector drawing between three numbered steps, a live calculator (¥/₱), the honest footnote, and the orange CTA with the gold halo and shine.
- It is the model for how every dark band should feel.
- All figures come from `hub.layawayQuote`.

### Loyalty Tier Ladder
- (live) Four tier medallions (Glimmer, Radiant, Elite, Crown VIP) light as a gold rail passes each one.
- The Crown VIP card has a slow metallic border lap.
- Tier timings are in `TIER_ICON` / `LADDER` (`lib/motion.ts`).
- The medallion art should be redrawn in the gold/charcoal palette (the audit notes off-palette mauve).

### Hero & Banners
- (live) Molten-gold film (with 720p mobile encode and poster), vertical scrim, vignette, a gold sweep and headline sheen, category slides behind a horizontal scrim, and a gold-edged curtain between slides.
- (planned) This is the only place, with banners, where 3D may appear (see the 3D rule).
- Every text-over-image pairing has a row in `check-contrast.mjs`.
- (live) Category page banner without a Hub photo: the hero v3 stage, still, with up to three of the category's in-stock pieces (cut-out, or whole photo in a framed well), or the text alone when none is in stock. No brand logo is ever decoration (owner rule 2026-09-26).
- (live) Collections-menu category thumbnails (desktop panel and drawer): the owner's Hub photo, else one real in-stock piece contained on chalk (cut-out with air around it, or the whole photo), else a gold line icon for the kind of category (ring, watch, wallet). Same 40px hairline tile as the collection thumbnails.
- **Depends on photography:** a real piece in the first viewport, and art-directed mobile crops.

### Components that depend on better photography
Code can only stopgap these (contain on one neutral well):
- Product card and grid
- Product gallery and full-screen viewer
- Home "New on the bench" arrivals
- Hero first viewport and mobile crops
- Collection and category headers
- Category slides
- About and Why pages (people and place)
- Loyalty medallion art (illustration)

## Do's and Don'ts

### Do:
- **Do** put the gold in the structure: dark bands, gold hairline rules (32% on dark), the gilt price, shine borders. Keep it off the facts.
- **Do** set every price, weight, carat and size with lining tabular figures.
- **Do** split product text into short name → spec line → price, and move specs into hairline ledger cells.
- **Do** fill every grid row and column with product, proof or photography. An empty cell is a defect.
- **Do** use orange only on the action that buys, reserves, pays or contacts, with a charcoal-deep label (8.06:1).
- **Do** use Assay Gold (gold-dark, 4.59:1) for gold text on chalk, and Pale Gilt (gold-pale) for gold text on charcoal.
- **Do** time every movement from `lib/motion.ts`, and render the reduced-motion state from first paint.
- **Do** take all text from props, `lib/i18n` or `lib/content`, so content can move to the Hub later.
- **Do** add a `check-contrast.mjs` row for every new pairing, alpha or scrim.

### Don't:
- **Don't** use orange on navigation, the language toggle, eyebrows, footer headings or badges.
- **Don't** put gold-pale on chalk or white (1.37:1), or teal as text or a focus ring.
- **Don't** set a SKU string as a headline, or let a product-page H1 exceed 40px desktop / 28px mobile.
- **Don't** use 3D, WebGL or rendered models on a product page or product card. Don't ship 3D without a still fallback.
- **Don't** apply the gilt gradient or sheen below 32px, to more than one element per viewport, or to a price or fact.
- **Don't** add pill buttons, glassmorphism navbars, rounded double-bezel cards, mesh gradients, particles, custom cursors or bounce.
- **Don't** answer "maximalism" with more whitespace or more colours. Answer it with more real pieces, facts and proof.
- **Don't** uppercase or wide-track Japanese, fake a Japanese italic, or let a Japanese heading break mid-word.
- **Don't** hardcode Japanese in `.tsx`, or hardcode content copy in a component.
- **Don't** borrow any other brand's colours, fonts, logos or names from the reference DESIGN.md files. Take structural patterns only.
