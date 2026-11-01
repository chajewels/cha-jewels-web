# Recreate this site as a single HTML file: Lumière

You are an expert creative front-end developer. Produce a **single self-contained `index.html`**
that reproduces the jewellery-atelier landing page below **exactly**: the same layout, sections,
photographs, two live three.js scenes, scroll choreography and type entrances. Pure
HTML/CSS/JS in one file. No build step, no framework, no bundler. Load three.js **r0.186.1**,
**three-mesh-bvh 0.9.17** and **Lenis 1.3.23** as ES modules through an import map from jsDelivr.
Hardcode every value given here as a fixed constant.

This prompt has two halves:

1. **The spec**: what the page is, how every block is laid out and moves, and what each scene does.
   Read it first; it is the design.
2. **The reference implementation**: the exact stylesheet, the exact markup and the exact script of a
   working single-file build. Use them **verbatim**. Every number in the spec is in that code, and the
   code wins if the two ever seem to differ. The scene engine and the gem shaders in particular must not
   be paraphrased: the look of the stones *is* that code.

## What it is

Lumière is a small jewellery atelier's landing page, five blocks on one cream paper page.

- **The palette:** bone `#f4f0ec` with a faint paper texture, near-black ink `#1c1c1c`, grey `#cfcfd0`
  for faded steps. The UI has no accent colour at all. The emerald, the gold and the warm stone of the
  photographs carry the colour, and one black stage sets the rings off.
- **The type:** every heading is Instrument Serif and opens on an italic capital, mixing roman and italic
  mid-word. Each heading is set in named lines, never left to wrap. The UI is Manrope Medium, small, with
  tight leading.
- **The motion:** slow and settling. Headings come up letter by letter out of a blur, small type lifts and
  fades, nothing overshoots, and the two big sequences are **pinned and scrubbed by the scroll**, not played
  on a timer.

The blocks:

1. **Hero, a pinned three-frame sequence.**
   - Eight photo cards stand on an exact circle around a live, ray-traced **emerald pendant** hanging on a
     gold chain.
   - As you scroll, the ring turns one full revolution while a vertical category index steps through Rings,
     Necklaces, Earrings and Bracelets.
   - Then the whole ring rotates +45° and scales 3.8872×, so that card 6 grows in place into a hero
     photograph.
   - Finally it crossfades to card 8's full photograph: a hand on a stone wearing turquoise rings. The
     chrome inverts to white, and the headline and standfirst swap to their second copy.
2. **Collections.** "Four Collections. Endless Stories.", set letter by letter, then four photo cards
   with a designed hover state.
3. **Featured, pinned.**
   - A sunlit product photo panel sits beside a black stage where five live 3D rings turn through three
     slots as you scroll.
   - The panel shows the piece's serif name, metals, an Add-to-cart pill and a price pill, with progress
     dots.
4. **Philosophy.** A cream card of large serif lines around a small photo of a ring on a hand, over a
   blurred backdrop, entering in reading order.
5. **Footer.** The wordmark, three link columns, a working e-mail line and the legal row.

## Page shell & libraries

- **One import map** (exactly this):

```html
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/","three-mesh-bvh":"https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.9.17/build/index.module.js","lenis":"https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.mjs"}}</script>
```

- **Fonts** are self-hosted from the bucket with `@font-face`; the stylesheet below already declares them:
  - Instrument Serif Regular and Italic (display);
  - Manrope Medium (UI);
  - Inter Tight Regular (small sans runs).
- **The design unit.** Every block is drawn on a 1440 × 800 frame and sized in
  `--raw-unit-design: calc(100vw / 1440)`, so the four blocks scale together at 1440, 1920 and 2560. The
  rem grid damps scale-up by 0.6666, which is why the hero does not use it.
  - The tablet band (768–1024) has its own 850 × 1150 canvas.
  - Phones have their own compact composition: the ring centre sits at 57 % of the height (`--ring-top`),
    and a longer-chained pendant poster hangs from the top edge.
  - These numbers exist twice on purpose, in the CSS and in the hero constants, and they must agree.
- **Scroll.** Lenis with `smoothWheel: true` and `wheelMultiplier: 0.65`, driven from its own rAF.
  - A single shared ticker serves every per-frame reader.
  - Scroll stages are written with `set`, never animated. A spring would lag and settle asynchronously,
    so scrubbing back would not land on the values it passed on the way down. Lenis already smooths the
    input.
  - Stages read a **cached document box** (re-measured on resize). They never call
    `getBoundingClientRect()` per frame.
- **Reduced motion.** Every entrance is at rest, the pinned sequences still scrub, and the cursor tilt is
  off.

## The preloader

A full-screen gate built from the page's own motifs: the Lumière wordmark, a hairline rule that fills with
progress, and a small uppercase percentage. The progress is real. It counts:

- the hero's **visible** `<img>`s (`[data-preload] img` with client rects; the other breakpoint's poster
  is skipped);
- the webfonts;
- both scenes reporting ready (each capped at 6 s).

The rule is a spring (tension 140, friction 26). At 100 % the gate fades on a spring (tension 180,
friction 30) after a 190 ms beat, the page unlocks, and the hero is told to start 45 % into that 480 ms
fade, so the two overlap.

**The ring then deals its cards in** (`HERO_INTRO`):
- delay 100 ms, duration 1150 ms;
- the cards come up one by one clockwise from 12 o'clock, each taking 42 % of the span;
- each card comes out of a 14-unit blur and from 0.86 of its size;
- meanwhile the whole ring swings 40° along its own circle into place.

The headline letters come out of the same blur at a 24 ms stagger over 1300 ms. The chrome, tagline and
CTA lift and fade at 340, 520 and 620 ms (880 ms easeOutCubic).

## Hero — the pinned timeline

The track is `pinHeights + 1` = 3 viewports tall, and the stage sticks to the top. Progress `p` (0..1) is
the fraction of that travel consumed.

**Geometry.** Eight cards (105.398 × 124.47 units, radius 32) sit on a circle of radius 202.78 at 45°
steps, starting at 12 o'clock.
- Each card is rotated so its top edge points away from the centre.
- Positions 2, 3, 4, 5 and 8 also carry a vertical flip, and 7 does too from 1024 up. With the rotation
  this composes into a reflection, which is what keeps the earrings upright.

**Phase A**, `p` 0 → 0.48:
- The cluster turns exactly **one** full revolution. It must stay a whole number, or a different
  photograph lands in the centre.
- The category index advances a pill at `p` = 0, 0.14, 0.28 and 0.42.
- The index is one strip of hairline pills (34 tall on a 42 pitch, 1-unit `#cfcfd0` stroke) behind a fixed
  vertical alpha mask, translated one pitch per step. The "active" pill is just the mask's opaque middle.

**Frame 2**, `p` 0.48 → 0.72:
- One rigid similarity: rotate +45°, scale 3.8872×, cluster centre moving to (1375.83, 519.8).
- Its fixed point is card 6, which therefore grows in place into the hero photo.
- The seven other cards fade over `p` 0.55 → 0.68.
- The pendant does not move. It dissolves into fog over `p` 0.48 → 0.60: it fades, blurs up to 28 units,
  and washes toward the paper (contrast down and brightness up by 0.45).

**Frame 3**, `p` 0.72 → 1:
- The card finishes covering the screen.
- Over `p` 0.75 → 0.90 the photo crossfades to card 8's full image (anchored to the top, `center 0%`).
- Over `p` 0.70 → 0.85 the chrome inverts to white and the category index leaves.
- The headline and tagline hand over at `p` 0.80 going down and back at 0.74 going up, so a reader resting
  on the boundary does not set the copy flickering:
  - "Jewellery for everyday rituals." becomes "Made by hand, worn every day.";
  - "Crafted jewellery designed to accompany everyday rituals" becomes "Shaped and finished by hand, in
    small batches, in our own studio".
- The handover is a TextSwap. The old letters exit over 420 ms, the new ones enter 160 ms later, each
  word blurring as one.
- The scroll cue's opacity lifts from 0.3 to 0.65 over the photograph.
- Once the pin lets go, the photograph lags the page by 40 % as the hero scrolls away, so it reads as
  lying behind the card.

**Phone and tablet crops of frame 3:**

| band | scaleBoost | shiftX | shiftY |
|---|---|---|---|
| tablet | 0.25 | 148 | 143 |
| phone | 0.42 | 267 | 129 |

**Cursor tilt** (fine pointers only, faded out across the pendant's exit): the pendant and the ring turn
together toward the cursor as one piece, on one heavy spring (tension 90, friction 24). The maximum is yaw
0.28 rad and pitch 0.1 rad at the screen edge, with perspective 1600 units.

**The header** is fixed:
- Shop / Collections / Blog / About on the left, at the 40-unit gutter;
- the Lumière script wordmark centred;
- Log in / Cart (0) on the right.
- On hover each label **rolls** up to its twin (460 ms easeOutCubic). On a phone the left links fold into
  a menu (two-line burger) with five links.

**The bottom band:** the tagline (left), a "scroll" cue with a mouse glyph (centre), and an
"EXPLORE COLLECTIONS ↳" link with a hairline rule (right). The CTA's "e" and "c" are italic.

## Collections

- **The header:** "Four Collections." and "Endless Stories.", each word opening on an italic capital.
  - It comes in letter by letter out of a blur, the run carried from one line into the next, when the
    header reaches 15 % above the bottom of the viewport.
  - It stays arrived: there is no replay on the way back up.
- **The lead:** "Each piece is thoughtfully designed and meticulously crafted in small batches." It lifts
  and fades rather than letter-revealing.
- **The cards:** four photo cards (Rings, Necklaces, Earrings, Bracelets), the whole card being the link.
  Hovering (only behind `(hover: hover)`) changes exactly five things:
  1. the index 01–04 appears;
  2. the label grows from 32 to 48 units;
  3. the label rises;
  4. a note appears beside it: "Forms that stay close to you." / "Objects to carry with you." / "Small
     details. Quiet presence." / "Made for everyday rituals.";
  5. an "explore collection" link appears under it.
- There is no lift, no shadow and no zoom. The photograph only parallaxes against its card as the card
  scrolls through the viewport.

## Featured — the pinned ring strip

The track is `transitions × 0.8` viewports of travel plus one, with 4 transitions and 5 states, and the
stage sticks inside it. Two progresses are read on the same frame:
- `entry`: how far the section has risen into view. It brings the left panel in over 0.6 of a viewport.
- `pin`: the fraction of the pinned travel consumed. It turns the rings.

**The left panel** is a warm product photograph (`photo-ring-0N`).
- It carries the piece's name in serif: "Trinity." / "Solace." / "Aurum." / "Verdant." / "Tidal.".
- It has an "Add to cart" pill and a price pill: $2,450 / $1,890 / $1,650 / $2,100 / $2,780.
- Its metals row reads like "Rose gold • Diamonds • Handmade".
- The piece in the centre slot changes once per crossing of a transition's middle, with 0.06 of
  hysteresis.
- The photo changes behind a soft-edged mask that travels from the foot up (feather 45 %, a 5 % zoom).
- The photo parallaxes by 0.22.

**The right panel** is a black stage.
- A "Scroll to explore" pill sits at its top.
- Three slots, centre and two sides:
  - the centre box is 245 × 265 at top 235, opacity 1;
  - the side boxes are 109.5 × 118.4 at top 248, offset 226, opacity 0.6;
  - off-slot rings sit at offset 340, scale 0.36, opacity 0.
- Every view renders at the centre box and scales down to reach the sides, so nothing animates its width
  or height.
- The spread is opened by 1.15 on desktop.
- Each transition turns a ring a quarter turn.
- **The live rings are drawn by one WebGL canvas over the stage.** The carousel's slot trajectory hands the
  scene a screen position, size, opacity and spin per ring every frame. The 3D rings and the DOM poster
  images under them therefore never disagree.
- Under them is a row of progress dots. The 6 px marks are spaced 24 px apart, and each is a 24 px button
  edge to edge, held on its line by `margin-block: -9px`. A dot is `#67563C` at a fifth, lifting to full as
  its ring nears the centre.

## Philosophy

- **The layout:** a cream card over a blurred backdrop plate (stretched onto its frame, one plate per
  regime).
- **The display lines,** each opening on italic capitals:
  - "Jewellery Doesn`t" / "Need To Be Quite."
  - "We Like Unusual Shapes"
  - "The Longer You" / "Look At Them."
  - "Keep It Interesting."
- **The centre:** a small photograph of a raised hand wearing two rings, with an "Our story" pill on it.
- **The notes:** "Some pieces blend in. / Ours don't always try to." above, "rough edges, unexpected
  details" left, "and things / that get better" right, and "the kind of details that become more /
  interesting the longer you look" under.
- **The entry** is a 0..1 progress, with windows in reading order. The windows overlap, so the block reads
  as one movement passing down it:
  1. the ground and the card;
  2. the first line;
  3. the photograph;
  4. the lines under it;
  5. last, the pill.

## Footer

- **Top:** the wordmark, which is the hero's own logo plate recoloured with a filter.
- **Link columns:**
  - SHOP: Rings, Necklaces, Earrings, Bracelets;
  - EXPLORE: Collections, Blog, About;
  - HELP: Shipping & Returns, Materials & Care, FAQ, Contact.
- **The e-mail line:** "Notes on new pieces, collections & things worth keeping." over a real
  `input[type=email]` ("YOUR E-MAIL") with an arrow submit.
- **Bottom row:** INSTAGRAM • TIKTOK, Privacy Policy • Terms & Conditions, and "Lumiére 2026. All rights
  reserved".

## The two WebGL scenes

Both are raw three.js, and each is built only after the page is up.
- The pendant is built for the hero.
- The rings are built in idle time, 4 s after the curtain lifts: context → studio → each ring in its own
  task, yielding after each ring.
- Until a scene has drawn, its **poster image** shows in its place: Cycles renders framed exactly as the
  scene frames itself. The poster also stays if WebGL fails.

**Materials** are rebuilt in code from the Blender values, one to one (linear colours, AgX tone mapping).

| metal | colour | roughness |
|---|---|---|
| yellow gold | (1.0, 0.64, 0.2) | 0.16 |
| rose gold | (0.96, 0.58, 0.46) | 0.14 |
| white gold | (0.86, 0.86, 0.88) | 0.10 |

**The gems are ray-traced against their own facets.**
- The stone's geometry goes into a `three-mesh-bvh` BVH that the fragment shader walks.
- Rays refract in, bounce internally, and exit into a photographed studio: the
  `env/hotel-room.exr` room, read as a finite sphere around the stone, pre-filtered through PMREM.
- Dispersion is **one trace, split at the exit facet** (`DISPERSION == 2`).
- Bounces come from the device budget: emerald 4 and diamond 5 on desktop, fewer on phones.

| stone | IOR | dispersion |
|---|---|---|
| diamond | 2.42 | 0.044 |
| emerald | 1.58 | 0.014 |
| peridot | 1.67 | 0.02 |
| teal sapphire | 1.77 | 0.018 |

**Frame budget:**
- The EXR decodes in a worker. In one file this is a Blob worker that imports three through jsDelivr's
  `+esm` URLs; the main thread is the fallback.
- Desktop draws behind a 12 ms gate. Phones have no frame cap.
- Device pixel ratio is clamped.
- Both loops run only while their section is in view.

## Fixed parameters (bake these in)

All of them are in the reference script below, by name:
- the hero: `DESIGN`, `TABLET`, `CARD`, `CLUSTER`, `FRAME_2`, `TIMELINE`, `CATEGORY`, `CATEGORY_SCALE`,
  `PENDANT`, `PENDANT_COMPACT`, `PENDANT_FOG`, `TEXT_SWAP`, `HERO_INTRO` and `HERO_TILT`;
- the featured strip: `SLOTS`, `F_TIMELINE`, `SPREAD`, `RING_3D` and `PIECE_SWITCH`;
- the type and the springs: `LETTER_REVEAL`, `REVEAL` and the spring configs;
- the scenes: every preset in `M_presets`.

## Assets

Every file loads from one public folder, with `crossorigin="anonymous"` on anything whose pixels are read.

```
ASSET_BASE_URL = https://storage.getlayers.ai/assets/lumi-re-9893947dfd
```

- **fonts/:** InstrumentSerif-Regular.woff2, InstrumentSerif-Italic.woff2, Manrope-Medium.woff2,
  InterTight-Regular.woff2
- **hero/:**
  - card-01.webp … card-08.webp (card 6 grows into the hero; card 8 is the frame-3 photograph);
  - logo.webp (the wordmark plate);
  - paper.webp (the page texture);
  - pendant-emerald.webp (the desktop pendant poster, 842 × 1112);
  - pendant-emerald-compact.webp (the long-chain phone poster, 1024 × 1536).
- **collections/:** rings.webp, necklaces.webp, earrings.webp, bracelets.webp
- **featured/:**
  - photo-ring-01.webp … photo-ring-05.webp (the product photos);
  - ring-01.webp … ring-05.webp (the ring posters).
- **philosophy/:**
  - backdrop-frame.webp (from 1024 up);
  - backdrop-frame-412.webp (below 1024);
  - hand-with-ring.webp.
- **models/:**
  - pendant-emerald.glb;
  - rings/ring-01.glb … ring-05.glb (Trinity, Solace, Aurum, Verdant, Tidal).
- **env/:** hotel-room.exr (the studio the stones reflect).

If a model, the EXR or an image fails to load, show a **visible** red banner at the bottom of the page.
The banner names the URL; never leave a silent blank canvas. Keep the poster on screen.

---

# Reference implementation

Assemble `index.html` as follows:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Lumière — Jewellery for everyday rituals</title>
  <link rel="preconnect" href="https://storage.getlayers.ai" crossorigin>
  <style>/* 1. THE STYLESHEET */</style>
</head>
<!-- 2. THE MARKUP (starts at <body …>) -->
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/","three-mesh-bvh":"https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.9.17/build/index.module.js","lenis":"https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.mjs"}}</script>
<script type="module">/* 3. THE SCENE ENGINE, then 4. THE PAGE RUNTIME */</script>
</body>
</html>
```

## 1. The stylesheet (verbatim)

```css
@font-face { font-family: instrumentSerif; src: url("https://storage.getlayers.ai/assets/lumi-re-9893947dfd/fonts/InstrumentSerif-Regular.woff2") format("woff2"); font-display: swap; font-weight: 400; font-style: normal; }
@font-face { font-family: instrumentSerif; src: url("https://storage.getlayers.ai/assets/lumi-re-9893947dfd/fonts/InstrumentSerif-Italic.woff2") format("woff2"); font-display: swap; font-weight: 400; font-style: italic; }
@font-face { font-family: "instrumentSerif Fallback"; src: local("Arial"); ascent-override: 128.92%; descent-override: 40.37%; line-gap-override: 0%; size-adjust: 76.79%; }
.__className_278282 { font-family: instrumentSerif, "instrumentSerif Fallback"; }
.__variable_278282 { --font-instrument-serif: 'instrumentSerif', 'instrumentSerif Fallback'; }
@font-face { font-family: interTight; src: url("https://storage.getlayers.ai/assets/lumi-re-9893947dfd/fonts/InterTight-Regular.woff2") format("woff2"); font-display: swap; font-weight: 400; font-style: normal; }
@font-face { font-family: "interTight Fallback"; src: local("Arial"); ascent-override: 99.65%; descent-override: 24.81%; line-gap-override: 0%; size-adjust: 97.21%; }
.__className_dc1238 { font-family: interTight, "interTight Fallback"; font-weight: 400; font-style: normal; }
.__variable_dc1238 { --font-inter-tight: 'interTight', 'interTight Fallback'; }
@font-face { font-family: manrope; src: url("https://storage.getlayers.ai/assets/lumi-re-9893947dfd/fonts/Manrope-Medium.woff2") format("woff2"); font-display: swap; font-weight: 500; font-style: normal; }
@font-face { font-family: "manrope Fallback"; src: local("Arial"); ascent-override: 100.97%; descent-override: 28.41%; line-gap-override: 0%; size-adjust: 105.58%; }
.__className_f45bdb { font-family: manrope, "manrope Fallback"; font-weight: 500; font-style: normal; }
.__variable_f45bdb { --font-manrope: 'manrope', 'manrope Fallback'; }
@layer properties;
@layer theme, base, components, utilities;
@layer theme {
  :root, :host { --font-sans: var(--font-manrope); --font-serif: var(--font-instrument-serif); --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace; --color-blue-500: oklch(62.3% 0.214 259.815); --color-black: #000; --spacing: var(--step); --text-xs: 0.75rem; --text-xs--line-height: calc(1 / 0.75); --text-sm: 0.875rem; --text-sm--line-height: calc(1.25 / 0.875); --text-base: 1rem; --text-base--line-height: calc(1.5 / 1); --text-lg: 1.125rem; --text-lg--line-height: calc(1.75 / 1.125); --text-xl: 1.25rem; --text-xl--line-height: calc(1.75 / 1.25); --text-3xl: 1.875rem; --text-3xl--line-height: calc(2.25 / 1.875); --text-5xl: 3rem; --text-5xl--line-height: 1; --text-6xl: 3.75rem; --text-6xl--line-height: 1; --font-weight-medium: 500; --font-weight-bold: 700; --leading-tight: 1.25; --leading-snug: 1.375; --leading-relaxed: 1.625; --radius-lg: 0.5rem; --radius-xl: 0.75rem; --ease-out: cubic-bezier(0, 0, 0.2, 1); --blur-sm: 8px; --blur-xl: 24px; --default-transition-duration: 150ms; --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); --default-font-family: var(--font-manrope); --default-mono-font-family: var(--font-mono); --color-background: var(--background); --color-foreground: var(--foreground); --radius-card: var(--corner-card); --radius-panel: var(--corner-panel); --radius-pill: var(--corner-pill); --leading-display: 1.1; --ease-entrance: cubic-bezier(0.2, 0, 0, 1); }
}
@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button { box-sizing: border-box; margin: 0px; padding: 0px; border: 0px solid; }
  html, :host { line-height: 1.5; text-size-adjust: 100%; tab-size: 4; font-family: var(--default-font-family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"); font-feature-settings: var(--default-font-feature-settings, normal); font-variation-settings: var(--default-font-variation-settings, normal); -webkit-tap-highlight-color: transparent; }
  hr { height: 0px; color: inherit; border-top-width: 1px; }
  abbr:where([title]) { text-decoration: underline dotted; }
  h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
  a { color: inherit; text-decoration: inherit; }
  b, strong { font-weight: bolder; }
  code, kbd, samp, pre { font-family: var(--default-mono-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace); font-feature-settings: var(--default-mono-font-feature-settings, normal); font-variation-settings: var(--default-mono-font-variation-settings, normal); font-size: 1em; }
  small { font-size: 80%; }
  sub, sup { font-size: 75%; line-height: 0; position: relative; vertical-align: baseline; }
  sub { bottom: -0.25em; }
  sup { top: -0.5em; }
  table { text-indent: 0px; border-color: inherit; border-collapse: collapse; }
  progress { vertical-align: baseline; }
  summary { display: list-item; }
  ol, ul, menu { list-style: none; }
  img, svg, video, canvas, audio, iframe, embed, object { display: block; vertical-align: middle; }
  img, video { max-width: 100%; height: auto; }
  button, input, select, optgroup, textarea, ::file-selector-button { font: inherit; letter-spacing: inherit; color: inherit; border-radius: 0px; background-color: transparent; opacity: 1; }
  :where(select:is([multiple], [size])) optgroup { font-weight: bolder; }
  :where(select:is([multiple], [size])) optgroup option { padding-inline-start: 20px; }
  ::file-selector-button { margin-inline-end: 4px; }
  ::placeholder { opacity: 1; }
  @supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px) {
  ::placeholder {
  color: currentcolor;
  @supports (color: color-mix(in lab, red, red)) {
  color: color-mix(currentcolor, transparent);
}
}
}
  textarea { resize: vertical; }
  ::-webkit-search-decoration { appearance: none; }
  ::-webkit-date-and-time-value { min-height: 1lh; text-align: inherit; }
  ::-webkit-datetime-edit { display: inline-flex; }
  ::-webkit-datetime-edit-fields-wrapper { padding: 0px; }
  ::-webkit-datetime-edit, ::-webkit-datetime-edit-year-field, ::-webkit-datetime-edit-month-field, ::-webkit-datetime-edit-day-field, ::-webkit-datetime-edit-hour-field, ::-webkit-datetime-edit-minute-field, ::-webkit-datetime-edit-second-field, ::-webkit-datetime-edit-millisecond-field, ::-webkit-datetime-edit-meridiem-field { padding-block: 0px; }
  ::-webkit-calendar-picker-indicator { line-height: 1; }
  button, input:where([type="button"], [type="reset"], [type="submit"]), ::file-selector-button { appearance: button; }
  ::-webkit-inner-spin-button, ::-webkit-outer-spin-button { height: auto; }
  [hidden]:where(:not([hidden="until-found"])) { display: none !important; }
}
@layer utilities {
  .pointer-events-auto { pointer-events: auto; }
  .pointer-events-none { pointer-events: none; }
  .collapse { visibility: collapse; }
  .invisible { visibility: hidden; }
  .visible { visibility: visible; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border-width: 0px; }
  .absolute { position: absolute; }
  .fixed { position: fixed; }
  .relative { position: relative; }
  .static { position: static; }
  .sticky { position: sticky; }
  .inset-0 { inset: calc(var(--step) * 0); }
  .inset-x-0 { inset-inline: calc(var(--step) * 0); }
  .inset-y-0 { inset-block: calc(var(--step) * 0); }
  .start { inset-inline-start: var(--step); }
  .end { inset-inline-end: var(--step); }
  .top-0 { top: calc(var(--step) * 0); }
  .top-1\/2 { top: calc(50%); }
  .top-26 { top: calc(var(--step) * 26); }
  .top-29 { top: calc(var(--step) * 29); }
  .top-\[3px\] { top: 3px; }
  .top-\[calc\(29\*var\(--raw-unit-design\)_\+_22px\)\] { top: calc(29 * var(--raw-unit-design) + 22px); }
  .top-\[var\(--headline-top\)\] { top: var(--headline-top); }
  .top-full { top: 100%; }
  .right-4 { right: calc(var(--step) * 4); }
  .right-40 { right: calc(var(--step) * 40); }
  .right-\[10px\] { right: 10px; }
  .bottom-0 { bottom: calc(var(--step) * 0); }
  .bottom-4 { bottom: calc(var(--step) * 4); }
  .bottom-\[var\(--footer-cue-bottom\)\] { bottom: var(--footer-cue-bottom); }
  .bottom-\[var\(--footer-tagline-bottom\)\] { bottom: var(--footer-tagline-bottom); }
  .left-0 { left: calc(var(--step) * 0); }
  .left-1\/2 { left: calc(50%); }
  .left-4 { left: calc(var(--step) * 4); }
  .left-40 { left: calc(var(--step) * 40); }
  .left-\[3px\] { left: 3px; }
  .isolate { isolation: isolate; }
  .z-0 { z-index: 0; }
  .z-10 { z-index: 10; }
  .z-20 { z-index: 20; }
  .z-30 { z-index: 30; }
  .z-40 { z-index: 40; }
  .z-50 { z-index: 50; }
  .z-\[100\] { z-index: 100; }
  .container {
  width: 100%;
  @media (width >= 40rem) {
  max-width: 40rem;
}
  @media (width >= 48rem) {
  max-width: 48rem;
}
  @media (width >= 64rem) {
  max-width: 64rem;
}
  @media (width >= 80rem) {
  max-width: 80rem;
}
  @media (width >= 96rem) {
  max-width: 96rem;
}
}
  .mx-auto { margin-inline: auto; }
  .-my-\[0\.15em\] { margin-block: calc(-0.15em); }
  .my-\[20px\] { margin-block: 20px; }
  .my-auto { margin-block: auto; }
  .mt-1 { margin-top: calc(var(--step) * 1); }
  .mt-3 { margin-top: calc(var(--step) * 3); }
  .mt-6 { margin-top: calc(var(--step) * 6); }
  .mt-10 { margin-top: calc(var(--step) * 10); }
  .-mr-\[10px\] { margin-right: calc(-10px); }
  .block { display: block; }
  .block\! { display: block !important; }
  .contents { display: contents; }
  .flex { display: flex; }
  .grid { display: grid; }
  .hidden { display: none; }
  .inline { display: inline; }
  .inline-block { display: inline-block; }
  .inline-block\! { display: inline-block !important; }
  .inline-flex { display: inline-flex; }
  .table { display: table; }
  .size-12 { width: calc(var(--step) * 12); height: calc(var(--step) * 12); }
  .size-16 { width: calc(var(--step) * 16); height: calc(var(--step) * 16); }
  .size-\[44px\] { width: 44px; height: 44px; }
  .size-full { width: 100%; height: 100%; }
  .h-6 { height: calc(var(--step) * 6); }
  .h-8 { height: calc(var(--step) * 8); }
  .h-\[18px\] { height: 18px; }
  .h-full { height: 100%; }
  .h-lvh { height: 100lvh; }
  .h-px { height: 1px; }
  .h-svh { height: 100svh; }
  .max-h-\[calc\(100dvh-1\.5rem\)\] { max-height: calc(100dvh - 1.5rem); }
  .min-h-stage { min-height: 100dvh; }
  .min-h-0 { min-height: calc(var(--step) * 0); }
  .min-h-\[44px\] { min-height: 44px; }
  .min-h-lvh { min-height: 100lvh; }
  .w-8 { width: calc(var(--step) * 8); }
  .w-11 { width: calc(var(--step) * 11); }
  .w-350 { width: calc(var(--step) * 350); }
  .w-\[18px\] { width: 18px; }
  .w-\[48px\] { width: 48px; }
  .w-\[calc\(100vw-1\.5rem\)\] { width: calc(-1.5rem + 100vw); }
  .w-\[min\(calc\(100vw-80\*var\(--raw-unit-design\)\)\,var\(--footer-tagline-width\)\)\] { width: min(calc(100vw - 80 * var(--raw-unit-design)), var(--footer-tagline-width)); }
  .w-auto { width: auto; }
  .w-fit { width: fit-content; }
  .w-full { width: 100%; }
  .w-lvw { width: 100lvw; }
  .max-w-\[48rem\] { max-width: 48rem; }
  .max-w-\[560px\] { max-width: 560px; }
  .max-w-\[calc\(100vw-80\*var\(--raw-unit-design\)\)\] { max-width: calc(100vw - 80 * var(--raw-unit-design)); }
  .max-w-none { max-width: none; }
  .min-w-0 { min-width: calc(var(--step) * 0); }
  .flex-1 { flex: 1 1 0%; }
  .shrink { flex-shrink: 1; }
  .shrink-0 { flex-shrink: 0; }
  .grow { flex-grow: 1; }
  .origin-bottom-left { transform-origin: 0px 100%; }
  .origin-left { transform-origin: 0px center; }
  .-translate-x-1\/2 { --tw-translate-x: calc(calc(1 / 2 * 100%) * -1); translate: var(--tw-translate-x) var(--tw-translate-y); }
  .-translate-y-1\/2 { --tw-translate-y: calc(calc(1 / 2 * 100%) * -1); translate: var(--tw-translate-x) var(--tw-translate-y); }
  .rotate-90 { rotate: 90deg; }
  .transform { transform: var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,); }
  .transform-gpu { transform: translateZ(0) var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,); }
  .cursor-not-allowed { cursor: not-allowed; }
  .cursor-pointer { cursor: pointer; }
  .resize { resize: both; }
  .list-none { list-style-type: none; }
  .flex-col { flex-direction: column; }
  .flex-col-reverse { flex-direction: column-reverse; }
  .flex-wrap { flex-wrap: wrap; }
  .items-center { align-items: center; }
  .items-end { align-items: flex-end; }
  .items-start { align-items: flex-start; }
  .justify-between { justify-content: space-between; }
  .justify-center { justify-content: center; }
  .justify-end { justify-content: flex-end; }
  .justify-start { justify-content: flex-start; }
  .gap-1 { gap: calc(var(--step) * 1); }
  .gap-2 { gap: calc(var(--step) * 2); }
  .gap-3 { gap: calc(var(--step) * 3); }
  .gap-4 { gap: calc(var(--step) * 4); }
  .gap-5 { gap: calc(var(--step) * 5); }
  .gap-6 { gap: calc(var(--step) * 6); }
  .gap-8 { gap: calc(var(--step) * 8); }
  .gap-12 { gap: calc(var(--step) * 12); }
  .gap-24 { gap: calc(var(--step) * 24); }
  .gap-48 { gap: calc(var(--step) * 48); }
  .gap-\[4px\] { gap: 4px; }
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .overflow-hidden { overflow: hidden; }
  .overflow-y-auto { overflow-y: auto; }
  .rounded { border-radius: 0.25rem; }
  .rounded-\[10px\] { border-radius: 10px; }
  .rounded-card { border-radius: var(--corner-card); }
  .rounded-full { border-radius: calc(infinity * 1px); }
  .rounded-lg { border-radius: var(--radius-lg); }
  .rounded-pill { border-radius: var(--corner-pill); }
  .rounded-xl { border-radius: var(--radius-xl); }
  .border { border-style: var(--tw-border-style); border-width: 1px; }
  .border-border-muted { border-color: var(--border-muted); }
  .border-foreground\/10 {
  border-color: var(--foreground);
  @supports (color: color-mix(in lab, red, red)) {
  border-color: color-mix(in oklab, var(--foreground) 10%, transparent);
}
}
  .border-foreground\/15 {
  border-color: var(--foreground);
  @supports (color: color-mix(in lab, red, red)) {
  border-color: color-mix(in oklab, var(--foreground) 15%, transparent);
}
}
  .bg-background { background-color: var(--background); }
  .bg-background\/95 {
  background-color: var(--background);
  @supports (color: color-mix(in lab, red, red)) {
  background-color: color-mix(in oklab, var(--background) 95%, transparent);
}
}
  .bg-black\/40 {
  background-color: color-mix(in srgb, rgb(0, 0, 0) 40%, transparent 60%);
  @supports (color: color-mix(in lab, red, red)) {
  background-color: color-mix(in oklab, var(--color-black) 40%, transparent);
}
}
  .bg-blue-500 { background-color: var(--color-blue-500); }
  .bg-content { background-color: var(--content); }
  .bg-current { background-color: currentcolor; }
  .bg-foreground { background-color: var(--foreground); }
  .bg-foreground\/15 {
  background-color: var(--foreground);
  @supports (color: color-mix(in lab, red, red)) {
  background-color: color-mix(in oklab, var(--foreground) 15%, transparent);
}
}
  .bg-surface { background-color: var(--surface); }
  .bg-transparent { background-color: transparent; }
  .stroke-1 { stroke-width: 1; }
  .object-cover { object-fit: cover; }
  .object-fill { object-fit: fill; }
  .p-5 { padding: calc(var(--step) * 5); }
  .px-2 { padding-inline: calc(var(--step) * 2); }
  .px-4 { padding-inline: calc(var(--step) * 4); }
  .px-40 { padding-inline: calc(var(--step) * 40); }
  .py-1 { padding-block: calc(var(--step) * 1); }
  .py-2 { padding-block: calc(var(--step) * 2); }
  .py-3\.5 { padding-block: calc(var(--step) * 3.5); }
  .py-\[0\.15em\] { padding-block: 0.15em; }
  .inset-safe { padding-left: max(0px, env(safe-area-inset-left)); padding-right: max(0px, env(safe-area-inset-right)); padding-top: max(0px, env(safe-area-inset-top)); padding-bottom: max(0px, env(safe-area-inset-bottom)); }
  .pt-24 { padding-top: calc(var(--step) * 24); }
  .pb-8 { padding-bottom: calc(var(--step) * 8); }
  .pb-24 { padding-bottom: calc(var(--step) * 24); }
  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  .font-sans { font-family: var(--font-manrope); }
  .font-serif { font-family: var(--font-instrument-serif); }
  .font-tight { font-family: var(--font-inter-tight); }
  .text-3xl { font-size: var(--text-3xl); line-height: var(--tw-leading, var(--text-3xl--line-height)); }
  .text-5xl { font-size: var(--text-5xl); line-height: var(--tw-leading, var(--text-5xl--line-height)); }
  .text-6xl { font-size: var(--text-6xl); line-height: var(--tw-leading, var(--text-6xl--line-height)); }
  .text-base { font-size: var(--text-base); line-height: var(--tw-leading, var(--text-base--line-height)); }
  .text-body { font-size: var(--type-body); line-height: var(--tw-leading, var(--type-body-leading)); }
  .text-caption { font-size: var(--type-caption); line-height: var(--tw-leading, var(--type-caption-leading)); }
  .text-card-cta { font-size: var(--type-card-cta); line-height: var(--tw-leading, var(--type-card-cta-leading)); }
  .text-card-index { font-size: var(--type-card-index); line-height: var(--tw-leading, var(--type-card-index-leading)); }
  .text-card-note { font-size: var(--type-card-note); line-height: var(--tw-leading, var(--type-card-note-leading)); }
  .text-card-title { font-size: var(--type-card-title); line-height: var(--tw-leading, var(--type-card-title-leading)); }
  .text-collections-heading { font-size: var(--type-collections-heading); line-height: var(--tw-leading, var(
    --type-collections-heading-leading
  )); }
  .text-collections-lead { font-size: var(--type-collections-lead); line-height: var(--tw-leading, var(--type-collections-lead-leading)); }
  .text-display { font-size: var(--type-display); line-height: var(--tw-leading, var(--type-display-leading)); }
  .text-lg { font-size: var(--text-lg); line-height: var(--tw-leading, var(--text-lg--line-height)); }
  .text-nav { font-size: var(--type-nav); line-height: var(--tw-leading, var(--type-nav-leading)); }
  .text-sm { font-size: var(--text-sm); line-height: var(--tw-leading, var(--text-sm--line-height)); }
  .text-utility { font-size: var(--type-utility); line-height: var(--tw-leading, var(--type-utility-leading)); }
  .text-xl { font-size: var(--text-xl); line-height: var(--tw-leading, var(--text-xl--line-height)); }
  .text-xs { font-size: var(--text-xs); line-height: var(--tw-leading, var(--text-xs--line-height)); }
  .text-\[clamp\(28px\,8vw\,34px\)\] { font-size: clamp(28px, 8vw, 34px); }
  .leading-\[1\.2\] { --tw-leading: 1.2; line-height: 1.2; }
  .leading-display { --tw-leading: 1.1; line-height: 1.1; }
  .leading-none { --tw-leading: 1; line-height: 1; }
  .leading-relaxed { --tw-leading: var(--leading-relaxed); line-height: var(--leading-relaxed); }
  .leading-snug { --tw-leading: var(--leading-snug); line-height: var(--leading-snug); }
  .leading-tight { --tw-leading: var(--leading-tight); line-height: var(--leading-tight); }
  .font-bold { --tw-font-weight: var(--font-weight-bold); font-weight: var(--font-weight-bold); }
  .font-medium { --tw-font-weight: var(--font-weight-medium); font-weight: var(--font-weight-medium); }
  .tracking-card-cta { --tw-tracking: var(--track-card-cta); letter-spacing: var(--track-card-cta); }
  .tracking-utility { --tw-tracking: var(--track-utility); letter-spacing: var(--track-utility); }
  .whitespace-nowrap { white-space: nowrap; }
  .text-background { color: var(--background); }
  .text-content { color: var(--content); }
  .text-content-inverse { color: var(--content-inverse); }
  .text-foreground { color: var(--foreground); }
  .text-foreground\/60 {
  color: var(--foreground);
  @supports (color: color-mix(in lab, red, red)) {
  color: color-mix(in oklab, var(--foreground) 60%, transparent);
}
}
  .text-foreground\/70 {
  color: var(--foreground);
  @supports (color: color-mix(in lab, red, red)) {
  color: color-mix(in oklab, var(--foreground) 70%, transparent);
}
}
  .uppercase { text-transform: uppercase; }
  .italic { font-style: italic; }
  .underline { text-decoration-line: underline; }
  .underline-offset-2 { text-underline-offset: 2px; }
  .underline-offset-4 { text-underline-offset: 4px; }
  .opacity-30 { opacity: 0.3; }
  .opacity-55 { opacity: 0.55; }
  .opacity-80 { opacity: 0.8; }
  .shadow { --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); }
  .shadow-2xl { --tw-shadow: 0 25px 50px -12px var(--tw-shadow-color, rgb(0 0 0 / 0.25)); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); }
  .ring { --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); }
  .outline { outline-style: var(--tw-outline-style); outline-width: 1px; }
  .blur { --tw-blur: blur(8px); filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,); }
  .brightness-0 { --tw-brightness: brightness(0%); filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,); }
  .invert { --tw-invert: invert(100%); filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,); }
  .filter { filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,); }
  .backdrop-blur-sm { --tw-backdrop-blur: blur(var(--blur-sm)); backdrop-filter: var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,); }
  .backdrop-blur-xl { --tw-backdrop-blur: blur(var(--blur-xl)); backdrop-filter: var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,); }
  .backdrop-filter { backdrop-filter: var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,); }
  .transition { transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transition-duration: var(--tw-duration, var(--default-transition-duration)); }
  .transition-colors { transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transition-duration: var(--tw-duration, var(--default-transition-duration)); }
  .transition-opacity { transition-property: opacity; transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); transition-duration: var(--tw-duration, var(--default-transition-duration)); }
  .duration-\[var\(--duration-fast\)\] { --tw-duration: var(--duration-fast); transition-duration: var(--duration-fast); }
  .ease-entrance { --tw-ease: cubic-bezier(0.2, 0, 0, 1); transition-timing-function: cubic-bezier(0.2, 0, 0, 1); }
  .ease-out { --tw-ease: var(--ease-out); transition-timing-function: var(--ease-out); }
  .will-change-transform { will-change: transform; }
  .backface-hidden { backface-visibility: hidden; }
  .hover\:bg-foreground\/5 {
  &:hover {
  @media (hover: hover) {
  background-color: var(--foreground);
  @supports (color: color-mix(in lab, red, red)) {
  background-color: color-mix(in oklab, var(--foreground) 5%, transparent);
}
}
}
}
  .hover\:text-foreground {
  &:hover {
  @media (hover: hover) {
  color: var(--foreground);
}
}
}
  .hover\:text-foreground\/70 {
  &:hover {
  @media (hover: hover) {
  color: var(--foreground);
  @supports (color: color-mix(in lab, red, red)) {
  color: color-mix(in oklab, var(--foreground) 70%, transparent);
}
}
}
}
  .hover\:opacity-70 {
  &:hover {
  @media (hover: hover) {
  opacity: 0.7;
}
}
}
  .hover\:opacity-90 {
  &:hover {
  @media (hover: hover) {
  opacity: 0.9;
}
}
}
  .focus-visible\:opacity-70 {
  &:focus-visible { opacity: 0.7; }
}
  .focus-visible\:outline-2 {
  &:focus-visible { outline-style: var(--tw-outline-style); outline-width: 2px; }
}
  .focus-visible\:outline-offset-2 {
  &:focus-visible { outline-offset: 2px; }
}
  .focus-visible\:outline-foreground {
  &:focus-visible { outline-color: var(--foreground); }
}
  .min-\[930px\]\:block {
  @media (width >= 930px) {
  display: block;
}
}
  .min-\[930px\]\:hidden {
  @media (width >= 930px) {
  display: none;
}
}
  .sm\:right-12 {
  @media (width >= 40rem) {
  right: calc(var(--step) * 12);
}
}
  .sm\:bottom-12 {
  @media (width >= 40rem) {
  bottom: calc(var(--step) * 12);
}
}
  .sm\:left-auto {
  @media (width >= 40rem) {
  left: auto;
}
}
  .sm\:w-\[420px\] {
  @media (width >= 40rem) {
  width: 420px;
}
}
  .sm\:flex-row {
  @media (width >= 40rem) {
  flex-direction: row;
}
}
  .sm\:items-center {
  @media (width >= 40rem) {
  align-items: center;
}
}
  .sm\:justify-between {
  @media (width >= 40rem) {
  justify-content: space-between;
}
}
  .sm\:p-6 {
  @media (width >= 40rem) {
  padding: calc(var(--step) * 6);
}
}
  .sm\:p-7 {
  @media (width >= 40rem) {
  padding: calc(var(--step) * 7);
}
}
  .sm\:text-lg {
  @media (width >= 40rem) {
  font-size: var(--text-lg); line-height: var(--tw-leading, var(--text-lg--line-height));
}
}
  .md\:right-40 {
  @media (width >= 48rem) {
  right: calc(var(--step) * 40);
}
}
  .md\:right-auto {
  @media (width >= 48rem) {
  right: auto;
}
}
  .md\:left-\[10px\] {
  @media (width >= 48rem) {
  left: 10px;
}
}
  .md\:left-auto {
  @media (width >= 48rem) {
  left: auto;
}
}
  .md\:mr-0 {
  @media (width >= 48rem) {
  margin-right: calc(var(--step) * 0);
}
}
  .md\:-ml-\[10px\] {
  @media (width >= 48rem) {
  margin-left: calc(-10px);
}
}
  .md\:flex {
  @media (width >= 48rem) {
  display: flex;
}
}
  .md\:flex-row-reverse {
  @media (width >= 48rem) {
  flex-direction: row-reverse;
}
}
  .md\:px-6 {
  @media (width >= 48rem) {
  padding-inline: calc(var(--step) * 6);
}
}
  .md\:pt-28 {
  @media (width >= 48rem) {
  padding-top: calc(var(--step) * 28);
}
}
  .lg\:top-14 {
  @media (width >= 64rem) {
  top: calc(var(--step) * 14);
}
}
  .lg\:top-\[calc\(50\%-104\*var\(--raw-unit-design\)\)\] {
  @media (width >= 64rem) {
  top: calc(50% - 104 * var(--raw-unit-design));
}
}
  .lg\:right-40 {
  @media (width >= 64rem) {
  right: calc(var(--step) * 40);
}
}
  .lg\:left-auto {
  @media (width >= 64rem) {
  left: auto;
}
}
  .lg\:block {
  @media (width >= 64rem) {
  display: block;
}
}
  .lg\:hidden {
  @media (width >= 64rem) {
  display: none;
}
}
  .lg\:w-281 {
  @media (width >= 64rem) {
  width: calc(var(--step) * 281);
}
}
  .lg\:w-350 {
  @media (width >= 64rem) {
  width: calc(var(--step) * 350);
}
}
  .lg\:translate-y-0 {
  @media (width >= 64rem) {
  --tw-translate-y: calc(var(--step) * 0); translate: var(--tw-translate-x) var(--tw-translate-y);
}
}
  .lg\:text-left {
  @media (width >= 64rem) {
  text-align: left;
}
}
  .xl\:px-8 {
  @media (width >= 80rem) {
  padding-inline: calc(var(--step) * 8);
}
}
}
:root { --raw-color-white: #ffffff; --raw-color-neutral-100: #ededed; --raw-color-neutral-900: #171717; --raw-color-neutral-950: #0a0a0a; --raw-duration-fast: 150ms; --raw-duration-normal: 250ms; --raw-color-bone-50: #f9f7f4; --raw-color-bone-100: #f4f0ec; --raw-color-grey-300: #cfcfd0; --raw-color-ink-900: #1c1c1c; --raw-color-black: #000000; --raw-unit-design: calc(100vw / 1440); --ring-top: 50%; --headline-top: calc(150 * var(--raw-unit-design)); --hero-category-scale: 1; --footer-tagline-bottom: calc(29.2 * var(--raw-unit-design)); --footer-cta-bottom: calc(38.5 * var(--raw-unit-design)); --footer-cue-bottom: calc(40 * var(--raw-unit-design)); --footer-tagline-width: calc(340 * var(--raw-unit-design)); --wordmark-width: calc(79.07 * var(--raw-unit-design)); --wordmark-height: calc(40 * var(--raw-unit-design)); --pendant-width: calc(421 * var(--raw-unit-design)); --pendant-height: calc(556 * var(--raw-unit-design)); --pendant-top: calc(50% - 426 * var(--raw-unit-design)); --pendant-shift: 0; --pendant-oval-centre: 0.766187; --pendant-oval-span: 0.323040; --hero-tilt-perspective: calc(1600 * var(--raw-unit-design)); --frame3-crop: center 0%; --raw-text-display-fluid: clamp(2.25rem, 13vw, calc(82 * var(--raw-unit-design))); --raw-text-display: calc(82 * var(--raw-unit-design)); --raw-text-display-leading: calc(73.8 * var(--raw-unit-design)); --raw-text-wordmark: calc(28 * var(--raw-unit-design)); --raw-text-wordmark-leading: calc(22.4 * var(--raw-unit-design)); --raw-text-body: calc(18 * var(--raw-unit-design)); --raw-text-body-leading: calc(23.4 * var(--raw-unit-design)); --raw-text-utility: calc(16 * var(--raw-unit-design)); --raw-text-utility-leading: calc(12.8 * var(--raw-unit-design)); --raw-text-nav: calc(14 * var(--raw-unit-design)); --raw-text-nav-leading: calc(11.2 * var(--raw-unit-design)); --raw-text-caption: calc(13 * var(--raw-unit-design)); --raw-text-caption-leading: calc(10.4 * var(--raw-unit-design)); --raw-text-micro: calc(7 * var(--raw-unit-design)); --raw-text-micro-leading: calc(5.6 * var(--raw-unit-design)); --raw-tracking-micro: 0.04em; --raw-tracking-utility: 0.03em; --raw-radius-card: calc(32 * var(--raw-unit-design)); --raw-radius-panel: calc(21.3333 * var(--raw-unit-design)); --raw-radius-pill: calc(8 * var(--raw-unit-design)); --raw-text-collections-heading: calc(64 * var(--raw-unit-design)); --raw-text-collections-heading-leading: calc(57.6 * var(--raw-unit-design)); --raw-text-collections-lead: calc(16 * var(--raw-unit-design)); --raw-text-collections-lead-leading: calc(20.8 * var(--raw-unit-design)); --raw-text-card-label: calc(32 * var(--raw-unit-design)); --raw-text-card-label-leading: calc(28.8 * var(--raw-unit-design)); --raw-text-card-title: calc(48 * var(--raw-unit-design)); --raw-text-card-title-leading: calc(43.2 * var(--raw-unit-design)); --raw-text-card-index: calc(18 * var(--raw-unit-design)); --raw-text-card-index-leading: calc(16.2 * var(--raw-unit-design)); --raw-text-card-note: calc(14 * var(--raw-unit-design)); --raw-text-card-note-leading: calc(14 * var(--raw-unit-design)); --raw-text-card-cta: calc(16 * var(--raw-unit-design)); --raw-text-card-cta-leading: calc(12.8 * var(--raw-unit-design)); --raw-tracking-card-cta: 0.03em; --raw-duration-hover-in: 400ms; --raw-duration-hover-out: 500ms; --raw-ease-hover: cubic-bezier(0.16, 1, 0.3, 1); }
:root { --background: var(--raw-color-white); --foreground: var(--raw-color-neutral-900); --duration-fast: var(--raw-duration-fast); --duration-normal: var(--raw-duration-normal); --surface: var(--raw-color-bone-100); --content: var(--raw-color-black); --content-inverse: var(--raw-color-white); --border-muted: var(--raw-color-grey-300); --index-active: var(--raw-color-ink-900); --index-active-inverse: var(--raw-color-bone-50); --corner-card: var(--raw-radius-card); --corner-panel: var(--raw-radius-panel); --corner-pill: var(--raw-radius-pill); --step: var(--raw-unit-design); --type-display: var(--raw-text-display); --type-display-leading: var(--raw-text-display-leading); --type-wordmark: var(--raw-text-wordmark); --type-wordmark-leading: var(--raw-text-wordmark-leading); --type-body: var(--raw-text-body); --type-body-leading: var(--raw-text-body-leading); --type-utility: var(--raw-text-utility); --type-utility-leading: var(--raw-text-utility-leading); --type-nav: var(--raw-text-nav); --type-nav-leading: var(--raw-text-nav-leading); --type-caption: var(--raw-text-caption); --type-caption-leading: var(--raw-text-caption-leading); --type-micro: var(--raw-text-micro); --type-micro-leading: var(--raw-text-micro-leading); --track-micro: var(--raw-tracking-micro); --track-utility: var(--raw-tracking-utility); --type-collections-heading: var(--raw-text-collections-heading); --type-collections-heading-leading: var(
    --raw-text-collections-heading-leading
  ); --type-collections-lead: var(--raw-text-collections-lead); --type-collections-lead-leading: var(--raw-text-collections-lead-leading); --type-card-label: var(--raw-text-card-label); --type-card-label-leading: var(--raw-text-card-label-leading); --type-card-title: var(--raw-text-card-title); --type-card-title-leading: var(--raw-text-card-title-leading); --type-card-index: var(--raw-text-card-index); --type-card-index-leading: var(--raw-text-card-index-leading); --type-card-note: var(--raw-text-card-note); --type-card-note-leading: var(--raw-text-card-note-leading); --type-card-cta: var(--raw-text-card-cta); --type-card-cta-leading: var(--raw-text-card-cta-leading); --track-card-cta: var(--raw-tracking-card-cta); --duration-hover-in: var(--raw-duration-hover-in); --duration-hover-out: var(--raw-duration-hover-out); --ease-hover-role: var(--raw-ease-hover); }
@media (prefers-color-scheme: dark) {
  :root { --background: var(--raw-color-neutral-950); --foreground: var(--raw-color-neutral-100); }
}
body { background: var(--background); color: var(--foreground); }
@layer base {
  html { font-size: 16px; }
  @media (max-width: 1920px) {
  html { font-size: 0.833333vw; }
}
  @media (max-width: 1440px) {
  html { font-size: 1.11111vw; }
}
  @media (max-width: 1024px) {
  html { font-size: 1.5625vw; }
}
  @media (max-width: 640px) {
  html { font-size: 4.44444vw; }
}
}
@layer utilities;
@media (max-width: 1439.98px) {
  :root { --raw-unit-design: calc(100vw / 1440); --type-display: var(--raw-text-display-fluid); --type-display-leading: calc(0.95 * var(--raw-text-display-fluid)); --raw-text-body: max(16px, calc(18 * var(--raw-unit-design))); --raw-text-body-leading: max(21px, calc(23.4 * var(--raw-unit-design))); --raw-text-nav: max(13px, calc(14 * var(--raw-unit-design))); --raw-text-nav-leading: max(13px, calc(11.2 * var(--raw-unit-design))); --raw-text-utility: max(14px, calc(16 * var(--raw-unit-design))); --raw-text-utility-leading: max(14px, calc(12.8 * var(--raw-unit-design))); --raw-text-caption: max(12px, calc(13 * var(--raw-unit-design))); --raw-text-caption-leading: max(12px, calc(10.4 * var(--raw-unit-design))); }
}
@media (max-width: 929px) {
  :root { --raw-unit-design: 0.6452px; --raw-radius-card: 32px; --raw-radius-panel: 21.3333px; --raw-radius-pill: 8px; --frame3-crop: center 6%; --ring-top: 57%; --pendant-width: calc(1243.4 * var(--raw-unit-design)); --pendant-height: calc(1865.1 * var(--raw-unit-design)); --pendant-top: calc(var(--ring-top) - 1603.5 * var(--raw-unit-design)); --pendant-shift: 0; --pendant-oval-centre: 0.859740; --pendant-oval-span: 0.109378; --pendant-nudge-x: 0px; }
}
@media (min-width: 1024px) and (max-width: 1439.98px) {
  :root { --hero-category-scale: 1.35; }
}
@media (max-width: 1023.98px) {
  :root { --footer-tagline-bottom: calc(104 * var(--raw-unit-design)); }
}
@media (max-width: 767.98px) {
  :root { --frame3-crop: center 8%; --raw-unit-design: min(0.6452px, calc(100svh / 1258.5)); --type-display-leading: calc(1.05 * var(--raw-text-display-fluid)); --raw-text-body: max(18px, calc(18 * var(--raw-unit-design))); --raw-text-body-leading: max(23.4px, calc(23.4 * var(--raw-unit-design))); --footer-tagline-width: calc(460 * var(--raw-unit-design)); --footer-tagline-bottom: calc(
      109.2 * var(--raw-unit-design) + 1.12569 * var(--type-utility) - 17.448px
    ); --raw-text-display-fluid: clamp(2.25rem, min(14.1vw, 6.6vh), 55px); --raw-text-utility: max(14px, calc(16 * 100vw / 390)); --raw-text-utility-leading: max(11.2px, calc(12.8 * 100vw / 390)); --raw-text-nav: max(14px, calc(14 * 100vw / 390)); --raw-text-nav-leading: max(11.2px, calc(11.2 * 100vw / 390)); --wordmark-width: max(64px, calc(79.07 * 100vw / 390)); --wordmark-height: max(32.4px, calc(40 * 100vw / 390)); }
}
@media (orientation: landscape) and (max-height: 500px) and (max-width: 767.98px) {
  :root { --headline-top: calc(150 * var(--raw-unit-design) + 8px); }
}
@media (min-width: 768px) and (max-width: 1023.98px) {
  :root { --raw-unit-design: min(calc(100vw / 850), calc(100vh / 1150)); --raw-radius-card: calc(32 * var(--raw-unit-design)); --raw-radius-pill: calc(8 * var(--raw-unit-design)); --headline-top: calc(112 * var(--raw-unit-design)); --footer-tagline-bottom: calc(47.2 * var(--raw-unit-design)); --footer-cue-bottom: calc(47.2 * var(--raw-unit-design)); --footer-tagline-width: calc(305 * var(--raw-unit-design)); --raw-text-body: max(16px, calc(20 * var(--raw-unit-design))); --raw-text-body-leading: max(21px, calc(26 * var(--raw-unit-design))); --raw-text-utility: max(14px, calc(18 * var(--raw-unit-design))); --raw-text-utility-leading: max(14px, calc(14.4 * var(--raw-unit-design))); --raw-text-nav: max(13px, calc(15 * var(--raw-unit-design))); --raw-text-nav-leading: max(13px, calc(12 * var(--raw-unit-design))); --raw-text-caption: max(12px, calc(14 * var(--raw-unit-design))); --raw-text-caption-leading: max(12px, calc(11.2 * var(--raw-unit-design))); }
}
@media (max-width: 1439.98px) {
  :root { --raw-text-collections-heading: clamp(
      32px,
      calc(32px + 32 * (100vw - 320px) / 1120),
      64px
    ); --raw-text-collections-heading-leading: calc(
      0.9 * var(--raw-text-collections-heading)
    ); --raw-text-collections-lead: clamp(
      14px,
      calc(14px + 2 * (100vw - 320px) / 1120),
      16px
    ); --raw-text-collections-lead-leading: calc(
      1.3 * var(--raw-text-collections-lead)
    ); --raw-text-card-title: clamp(
      30px,
      calc(30px + 18 * (100vw - 320px) / 1120),
      48px
    ); --raw-text-card-title-leading: calc(0.9 * var(--raw-text-card-title)); --raw-text-card-note: clamp(
      13px,
      calc(13px + 1 * (100vw - 320px) / 1120),
      14px
    ); --raw-text-card-note-leading: var(--raw-text-card-note); --raw-text-card-index: clamp(
      16px,
      calc(16px + 2 * (100vw - 320px) / 1120),
      18px
    ); --raw-text-card-index-leading: calc(0.9 * var(--raw-text-card-index)); --raw-text-card-cta: clamp(
      13px,
      calc(13px + 3 * (100vw - 320px) / 1120),
      16px
    ); --raw-text-card-cta-leading: calc(0.8 * var(--raw-text-card-cta)); }
}
@layer components {
  .collections { --coll-gutter: max(
      calc(40 * var(--raw-unit-design)),
      env(safe-area-inset-left)
    ); --coll-gutter-right: max(
      calc(40 * var(--raw-unit-design)),
      env(safe-area-inset-right)
    ); --coll-gap: calc(12 * var(--raw-unit-design)); --coll-pad: calc(24 * var(--raw-unit-design)); height: calc(1134 * var(--raw-unit-design)); }
  .collections__heading { position: absolute; z-index: 10; left: var(--coll-gutter); top: calc(64 * var(--raw-unit-design)); width: calc(377 * var(--raw-unit-design)); }
  .collections__lead { position: absolute; z-index: 10; right: var(--coll-gutter-right); top: calc(135 * var(--raw-unit-design)); width: calc(275 * var(--raw-unit-design)); text-align: right; }
  .collections__grid { position: absolute; z-index: 10; left: var(--coll-gutter); top: calc(208 * var(--raw-unit-design)); display: flex; flex-direction: column; gap: var(--coll-gap); }
  .collections__row { display: flex; gap: var(--coll-gap); align-items: stretch; }
  .collections__card { position: relative; display: block; overflow: hidden; border-radius: var(--corner-panel); opacity: var(--card-shown, 0); height: calc(425 * var(--raw-unit-design)); --label-rise: calc(174.5 * var(--raw-unit-design)); --label-scale: 0.6666666667; }
  .collections__card--narrow { width: calc(560 * var(--raw-unit-design)); }
  .collections__card--wide { width: calc(788 * var(--raw-unit-design)); }
  .collections__photo-frame { position: absolute; top: calc(var(--photo-room, 0%) * -1); right: 0px; bottom: calc(var(--photo-room, 0%) * -1); left: 0px; display: block; will-change: transform; }
  .collections__photo { object-fit: cover; object-position: var(--card-crop); scale: var(--card-zoom); }
  .collections__body { position: absolute; inset: 0px; display: flex; flex-direction: column; justify-content: space-between; padding: var(--coll-pad); color: var(--content-inverse); z-index: 1; }
  .collections__index { display: block; width: 100%; }
  .collections__middle { display: flex; align-items: center; justify-content: space-between; width: 100%; }
  .collections__note { display: block; width: var(--note-w); text-align: right; }
  .collections__cta { display: flex; width: fit-content; flex-direction: column; gap: calc(8 * var(--raw-unit-design)); position: relative; }
  .collections__cta::after { content: ""; position: absolute; inset: calc(50% - 22px) 0px; min-height: 44px; }
  .collections__cta-row { display: flex; align-items: center; gap: calc(12 * var(--raw-unit-design)); }
  .collections__rule { width: 100%; overflow: hidden; height: calc(1 * var(--raw-unit-design)); }
  .collections [data-card-reveal] { opacity: 0; transition: opacity var(--duration-hover-out) var(--ease-hover-role); }
  .collections [data-card-label] { transform: translateY(var(--label-rise)) scale(var(--label-scale)); transition: transform var(--duration-hover-out) var(--ease-hover-role); }
  @media (hover: hover) and (pointer: fine) {
  .collections [data-collection-card]:hover [data-card-reveal], .collections [data-collection-card]:focus-visible [data-card-reveal] { opacity: 1; transition-duration: var(--duration-hover-in); }
  .collections [data-collection-card]:hover [data-card-label], .collections [data-collection-card]:focus-visible [data-card-label] { transform: none; transition-duration: var(--duration-hover-in); }
}
  .collections [data-collection-card]:focus-visible [data-card-reveal] { opacity: 1; transition-duration: var(--duration-hover-in); }
  .collections [data-collection-card]:focus-visible [data-card-label] { transform: none; transition-duration: var(--duration-hover-in); }
  @media (hover: none), (pointer: coarse) {
  .collections [data-card-reveal] { opacity: 1; }
  .collections [data-card-label] { transform: none; }
}
  @media (prefers-reduced-motion: reduce) {
  .collections [data-card-reveal], .collections [data-card-label] { transition-duration: 0ms; }
}
  @media (max-width: 1439.98px) {
  .collections { --coll-gap: 12px; --coll-pad: 24px; display: grid; grid-template-columns: minmax(0px, 1fr) auto; grid-template-areas: "heading lead" "grid grid"; align-items: start; height: auto; padding: calc(64 * var(--raw-unit-design)) var(--coll-gutter-right)
        calc(64 * var(--raw-unit-design)) var(--coll-gutter); row-gap: calc(40 * var(--raw-unit-design)); }
  .collections__heading, .collections__lead, .collections__grid { position: static; inset: auto; }
  .collections__heading { grid-area: heading; width: auto; max-width: 100%; }
  .collections__heading, .collections__lead { align-self: last baseline; }
  .collections__lead { grid-area: lead; width: clamp(220px, 26vw, 275px); text-wrap: pretty; }
  .collections__grid { grid-area: grid; width: 100%; }
  .collections__card { height: auto; align-self: stretch; container-type: size; --label-rise: calc(
        0.46286 * (100cqh - 2 * var(--coll-pad))
      ); }
  .collections__cta { gap: 0.5em; }
  .collections__cta-row { gap: 0.75em; }
  .collections__rule { height: max(1px, calc(1 * var(--raw-unit-design))); }
  .collections__middle { gap: 16px; align-items: center; }
  .collections__card--narrow { width: auto; flex: 1 1 41.5%; aspect-ratio: 560 / 425; }
  .collections__card--wide { width: auto; flex: 1 1 57.4%; }
}
  @media (min-width: 768px) and (max-width: 1439.98px) {
  .collections__card { --scrim-foot: 0.5; --scrim-foot-end: 75%; --scrim-head: 0.25; --scrim-head-end: 20%; }
  .collections__card::after { content: ""; position: absolute; inset: 0px; pointer-events: none; background: linear-gradient(
          to top,
          rgb(0 0 0 / var(--scrim-foot)) 0%,
          rgb(0 0 0 / 0) var(--scrim-foot-end)
        ),
        linear-gradient(
          to bottom,
          rgb(0 0 0 / var(--scrim-head)) 0%,
          rgb(0 0 0 / 0) var(--scrim-head-end)
        ); }
}
  @media (min-width: 768px) and (max-width: 1023.98px) {
  .collections { column-gap: calc(40 * var(--raw-unit-design)); }
  .collections__lead { width: clamp(280px, 39vw, 300px); }
  .collections__card--narrow, .collections__card--wide { flex: 1 1 calc(50% - var(--coll-gap) / 2); aspect-ratio: 560 / 425; }
  .collections__card { --label-scale: 0.699; }
}
  @media (max-width: 767.98px) {
  .collections { grid-template-columns: minmax(0px, 1fr); grid-template-areas: "heading" "lead" "grid"; --coll-pad: 20px; --phone-head-gap: 24px; --phone-grid-gap: 28px; --heading-trim: calc(0.0875 * var(--type-collections-heading)); --lead-trim: calc(0.26875 * var(--type-collections-lead)); row-gap: calc(
        var(--phone-head-gap) + var(--heading-trim) + var(--lead-trim)
      ); --raw-text-card-title-phone: 36px; --raw-text-card-title-phone-leading: 32.4px; --raw-text-card-note-phone: 12px; --raw-text-card-note-phone-leading: 12px; --type-card-title: var(--raw-text-card-title-phone); --type-card-title-leading: var(--raw-text-card-title-phone-leading); --type-card-note: var(--raw-text-card-note-phone); --type-card-note-leading: var(--raw-text-card-note-phone-leading); }
  .collections__lead { width: 100%; padding-top: 0px; text-align: left; justify-self: start; }
  .collections__grid { margin-top: calc(
        var(--phone-grid-gap) - var(--phone-head-gap) - var(--heading-trim)
      ); }
  .collections__row { flex-direction: column; }
  .collections__card--narrow, .collections__card--wide { flex: 0 0 auto; width: 100%; aspect-ratio: 4 / 3; }
  .collections__photo { object-position: var(--card-crop-mobile); scale: var(--card-zoom-mobile); translate: 0
        calc(var(--card-aim-mobile) * (50% - 50% / var(--card-zoom-mobile))); }
  .collections__note { display: none; }
  .collections__body { display: grid; grid-template-rows: 1fr auto 1fr; justify-items: start; }
  .collections__index { align-self: start; }
  .collections__middle { align-self: center; }
  .collections__cta { align-self: end; }
}
  .featured { --raw-color-featured-panel: var(--raw-color-black); --raw-color-featured-cue: rgb(255 255 255 / 0.12); --raw-color-featured-cue-ink: #ece7df; --raw-color-featured-pill: rgb(255 255 255 / 0.72); --raw-color-featured-pill-hover: rgb(255 255 255 / 0.92); --raw-color-featured-pill-ink: var(--raw-color-black); --featured-pill-blur: calc(14 * var(--raw-unit-design)); --featured-shade-foot: 0.62; --featured-shade-foot-end: 50%; --featured-shade-head: 0.32; --featured-shade-head-end: 28%; --raw-color-featured-mark: #c9b994; --featured-gutter: calc(40 * var(--raw-unit-design)); --featured-seam: calc(12 * var(--raw-unit-design)); --featured-panel: calc(674 * var(--raw-unit-design)); --featured-pad-y: calc(48 * var(--raw-unit-design)); --featured-radius: calc(100 * var(--raw-unit-design)); position: relative; height: 100svh; }
  @media (min-width: 1024px) {
  .featured { --raw-unit-design: min(100vw / 1440, 100svh / 800); }
}
  .featured__panels { position: absolute; z-index: 10; inset: var(--featured-gutter); display: flex; gap: var(--featured-seam); }
  .featured__panel { position: relative; display: flex; flex: 0 0 calc((100% - var(--featured-seam)) / 2); min-width: 0px; flex-direction: column; align-items: center; overflow: hidden; border-radius: var(--corner-panel); padding-block: var(--featured-pad-y); }
  .featured__panel--photo { justify-content: space-between; padding-inline: calc(228 * var(--raw-unit-design)); color: var(--content-inverse); }
  .featured__photo-frame { position: absolute; inset: 0px; z-index: 0; overflow: hidden; transform-origin: center center; will-change: transform, opacity; }
  .featured__photo-frame::after { content: ""; position: absolute; inset: 0px; pointer-events: none; background: linear-gradient(
        to top,
        rgb(0 0 0 / var(--featured-shade-foot)) 0%,
        rgb(0 0 0 / 0) var(--featured-shade-foot-end)
      ),
      linear-gradient(
        to bottom,
        rgb(0 0 0 / var(--featured-shade-head)) 0%,
        rgb(0 0 0 / 0) var(--featured-shade-head-end)
      ); }
  .featured__photo-drift { position: absolute; top: calc(var(--photo-room, 0%) * -1); right: 0px; bottom: calc(var(--photo-room, 0%) * -1); left: 0px; will-change: transform; }
  .featured__photo-layer, .featured__photo-zoom { position: absolute; inset: 0px; }
  .featured__photo-zoom { transform-origin: 50% 100%; }
  .featured__photo { object-fit: cover; object-position: center center; }
  .featured__title, .featured__meta { position: relative; z-index: 1; }
  .featured__title { font-size: calc(40 * var(--raw-unit-design)); line-height: calc(36 * var(--raw-unit-design)); text-align: center; white-space: nowrap; }
  .featured__meta { display: flex; flex-direction: column; align-items: center; gap: calc(20 * var(--raw-unit-design)); }
  .featured__pills { display: flex; align-items: stretch; gap: calc(4 * var(--raw-unit-design)); font-size: calc(16 * var(--raw-unit-design)); }
  .featured__pill { display: flex; align-items: center; gap: calc(6 * var(--raw-unit-design)); padding: calc(10 * var(--raw-unit-design)) calc(12 * var(--raw-unit-design)); border-radius: var(--featured-radius); background: var(--raw-color-featured-pill); color: var(--raw-color-featured-pill-ink); backdrop-filter: blur(var(--featured-pill-blur)); font-family: var(--font-inter-tight); font-size: calc(16 * var(--raw-unit-design)); font-weight: 500; line-height: calc(12.8 * var(--raw-unit-design)); text-transform: uppercase; white-space: nowrap; }
  .featured__pill--cta { cursor: pointer; transition: background-color 200ms var(--ease-hover-role); }
  @media (hover: hover) and (pointer: fine) {
  .featured__pill--cta:hover { background: var(--raw-color-featured-pill-hover); }
}
  .featured__pill--cta:focus-visible { background: var(--raw-color-featured-pill-hover); }
  .featured__pill-row { display: flex; align-items: center; gap: calc(6 * var(--raw-unit-design)); }
  .featured__pill-icon { display: block; width: calc(13 * var(--raw-unit-design)); height: calc(13 * var(--raw-unit-design)); flex: 0 0 auto; }
  .featured__materials { display: flex; align-items: center; gap: calc(12 * var(--raw-unit-design)); font-size: calc(18 * var(--raw-unit-design)); line-height: calc(18 * var(--raw-unit-design)); white-space: nowrap; }
  .featured__material { display: flex; align-items: center; gap: calc(12 * var(--raw-unit-design)); }
  .featured__materials-row { display: flex; align-items: center; gap: calc(12 * var(--raw-unit-design)); }
  .featured__material-dot { display: block; width: calc(4 * var(--raw-unit-design)); height: calc(4 * var(--raw-unit-design)); flex: 0 0 auto; }
  .featured__panel--stage { justify-content: space-between; background: var(--raw-color-featured-panel); }
  .featured__cue { position: relative; z-index: 1; display: flex; align-items: center; gap: calc(6 * var(--raw-unit-design)); padding: calc(10 * var(--raw-unit-design)); border-radius: var(--featured-radius); background: var(--raw-color-featured-cue); color: var(--raw-color-featured-cue-ink); font-family: var(--font-inter-tight); font-size: calc(13 * var(--raw-unit-design)); font-weight: 500; line-height: calc(10.4 * var(--raw-unit-design)); text-transform: uppercase; white-space: nowrap; }
  .featured__cue-icon { display: block; width: calc(10 * var(--raw-unit-design)); height: calc(10 * var(--raw-unit-design)); flex: 0 0 auto; }
  .featured__crosses { position: absolute; top: 50%; left: 50%; margin-top: calc(-158 * var(--raw-unit-design)); margin-left: calc(-157 * var(--raw-unit-design)); display: block; width: calc(314 * var(--raw-unit-design)); height: calc(316 * var(--raw-unit-design)); color: var(--raw-color-featured-mark); }
  .featured__cross { position: absolute; display: block; width: calc(17 * var(--raw-unit-design)); height: calc(17 * var(--raw-unit-design)); }
  .featured__cross--tl { top: 0px; left: 0px; }
  .featured__cross--tr { top: 0px; right: 0px; }
  .featured__cross--bl { bottom: 0px; left: 0px; }
  .featured__cross--br { bottom: 0px; right: 0px; }
  .featured__rings { position: absolute; inset: 0px; }
  .featured__ring { position: absolute; top: 50%; left: 50%; width: calc(245 * var(--raw-unit-design)); height: calc(265 * var(--raw-unit-design)); margin-top: calc(-132.5 * var(--raw-unit-design)); margin-left: calc(-122.5 * var(--raw-unit-design)); transform-origin: center center; will-change: transform, opacity; }
  .featured__ring--anchor { visibility: hidden; pointer-events: none; will-change: auto; }
  .featured__rings-canvas { position: absolute; inset: 0px; pointer-events: none; }
  .featured__ring[data-slot="centre"] { opacity: 1; transform: translate3d(calc(0.5 * var(--raw-unit-design)), 0, 0) scale(1); }
  .featured__ring[data-slot="right"] { opacity: 0.15; transform: translate3d(
        calc(226 * var(--raw-unit-design)),
        calc(0.5 * var(--raw-unit-design)),
        0
      )
      scale(0.4467); }
  .featured__ring[data-slot="left"] { opacity: 0.15; transform: translate3d(
        calc(-226 * var(--raw-unit-design)),
        calc(0.5 * var(--raw-unit-design)),
        0
      )
      scale(0.4467); }
  .featured__ring-plate { object-fit: contain; }
  .featured__indicator { position: relative; z-index: 1; display: flex; align-items: center; margin-block: -9px; }
  .featured__dot { position: relative; display: grid; width: 24px; height: 24px; cursor: pointer; place-items: center; }
  .featured__dot-mark { display: block; width: calc(6 * var(--raw-unit-design)); height: calc(6 * var(--raw-unit-design)); border-radius: 50%; background: var(--raw-color-featured-mark); }
  @media (max-width: 1023.98px) {
  .featured { height: 100svh; padding-block: var(--featured-gutter); }
  .featured__panels { position: static; flex-direction: column; width: auto; height: 100%; gap: var(--featured-gutter); margin-inline: var(--featured-gutter); }
  .featured__panel { width: 100%; height: auto; flex: 1 1 0px; min-height: 0px; padding-block: 4%; }
  .featured__panel--photo { padding-inline: 8%; }
  .featured__ring { inset: 0px; width: auto; height: 62%; aspect-ratio: 245 / 265; margin: auto; }
  .featured__crosses { top: 28.5%; left: 26.7%; width: 46.6%; height: auto; margin: 0px; aspect-ratio: 314 / 316; }
  .featured__title { font-size: clamp(28px, 23.7746px + 1.12676vw, 40px); line-height: 0.9; }
  .featured__pill, .featured__pills { font-size: clamp(14px, 13.2958px + 0.187793vw, 16px); }
  .featured__pill { padding: 0.625em 0.75em; min-height: 44px; line-height: 0.8; }
  .featured__materials { font-size: clamp(14px, 12.5915px + 0.375587vw, 18px); line-height: 1; flex-wrap: wrap; justify-content: center; }
  .featured__materials-row { flex-wrap: wrap; justify-content: center; }
  .featured__cue { font-size: clamp(11px, 10.2958px + 0.187793vw, 13px); padding: 0.77em; line-height: 0.8; }
  .featured__cue-icon { width: 0.77em; height: 0.77em; }
  .featured__pill-icon { width: 0.8125em; height: 0.8125em; }
  .featured__pill-row { gap: 0.375em; }
  .featured__material-dot { width: 0.222em; height: 0.222em; }
  .featured__dot-mark { width: 6px; height: 6px; }
}
  @media (min-width: 768px) and (max-width: 1023.98px) {
  .featured .featured__ring { height: 78%; }
  .featured .featured__crosses { inset: 0px; width: auto; height: 62%; aspect-ratio: 314 / 316; margin: auto; }
  .featured__pill { padding-inline: 1em; }
  .featured__pills { gap: 0.4em; }
}
  @media (max-width: 767.98px) {
  .featured__panel { padding-block: 5%; }
  .featured__panel--photo { padding-inline: 6%; }
  .featured__pill, .featured__pills { font-size: clamp(12px, 10.0916px + 0.508906vw, 14px); }
  .featured__pill { min-height: 0px; padding: 0.8em 0.86em; }
  .featured__pills { gap: 0.4em; }
  .featured__pill--cta { position: relative; }
  .featured__pill--cta::after { content: ""; position: absolute; inset-block: calc(50% - 22px); inset-inline: 0px; }
}
  .philosophy { --raw-color-philosophy-card: #e4dcd1; --raw-color-philosophy-pill: rgb(42 33 27 / 0.8); --raw-color-philosophy-pill-hover: rgb(42 33 27 / 0.95); --philosophy-gutter: calc(40 * var(--raw-unit-design)); --philosophy-radius: calc(100 * var(--raw-unit-design)); --philosophy-text-left: calc(32.45 * var(--raw-unit-design)); position: relative; overflow: hidden; height: calc(800 * var(--raw-unit-design)); background: rgb(255, 255, 255); color: rgb(0, 0, 0); font-family: var(--font-instrument-serif); }
  @media (max-width: 1439.98px) {
  .philosophy { --raw-unit-design: calc(100vw / 1440); }
}
  @media (max-width: 1023.98px) {
  .philosophy { --philosophy-gutter: clamp(16px, calc(16px + 24 * (100vw - 375px) / 1064), 40px); --philosophy-gap: clamp(20px, calc(20px + 20 * (100vw - 375px) / 1064), 40px); --philosophy-inset: var(--philosophy-gutter); height: auto; padding-block: var(--philosophy-gutter); }
  .philosophy .philosophy__card { position: static; display: flex; width: calc(100% - 2 * var(--philosophy-inset)); height: auto; flex-direction: column; align-items: center; margin-inline: auto; padding: var(--philosophy-gap) var(--philosophy-gutter); gap: var(--philosophy-gap); }
  .philosophy .philosophy__top, .philosophy .philosophy__shapes, .philosophy .philosophy__middle, .philosophy .philosophy__bottom { position: static; width: 100%; margin: 0px; transform: none; }
  .philosophy .philosophy__top, .philosophy .philosophy__middle, .philosophy .philosophy__bottom, .philosophy .philosophy__bottom-row { flex-direction: column; align-items: center; justify-content: flex-start; gap: var(--philosophy-gap); }
  .philosophy .philosophy__display { width: 100%; font-size: clamp(32px, 13.6729px + 4.88722vw, 84px); line-height: 0.9; text-align: center; }
  .philosophy .philosophy__note, .philosophy .philosophy__note-line { width: auto; font-size: clamp(12px, 9.88534px + 0.56391vw, 18px); line-height: 1.35; text-align: center; }
  .philosophy .philosophy__aside--left, .philosophy .philosophy__aside--right { width: auto; text-align: center; }
  .philosophy .philosophy__frame { width: 70%; height: auto; aspect-ratio: 291 / 329; overflow: hidden; }
  .philosophy .philosophy__cta { inset: 0px; width: fit-content; height: fit-content; min-height: 44px; margin: auto; padding: 0.625em 1em; font-size: clamp(14px, 13.2958px + 0.187793vw, 16px); line-height: 0.8; gap: 0.375em; }
  .philosophy .philosophy__cta-icon { width: 0.8125em; height: 0.8125em; }
  .philosophy .philosophy__cta::after { content: ""; position: absolute; inset-block: calc(50% - 22px); inset-inline: 0px; }
  .philosophy .philosophy__top, .philosophy .philosophy__bottom-row { gap: 0px; }
  .philosophy .philosophy__display ~ .philosophy__display { padding-top: 0.175em; }
  .philosophy .philosophy__note--top, .philosophy .philosophy__note--bottom { order: 1; margin-top: var(--philosophy-gap); }
  .philosophy .philosophy__note--bottom, .philosophy .philosophy__note--top, .philosophy .philosophy__shapes, .philosophy .philosophy__aside, .philosophy .philosophy__keep { display: none; }
  .philosophy .philosophy__note--top { width: auto; flex-flow: wrap; justify-content: center; gap: 0.3em; }
}
  @media (max-width: 767.98px) {
  .philosophy .philosophy__cta { min-height: 0px; padding: 0.8em 0.86em; font-size: clamp(12px, 10.0916px + 0.508906vw, 14px); }
}
  @media (max-width: 1023.98px) {
  .philosophy .philosophy__card { gap: 0px; }
  .philosophy .philosophy__middle, .philosophy .philosophy__bottom { margin-top: 37px; }
  .philosophy .philosophy__card { font-size: clamp(32px, 13.6729px + 4.88722vw, 84px); padding-block: calc(96px - var(--philosophy-gutter) + 0.0875em); }
  .philosophy .philosophy__bottom { gap: calc(0.175em + 39px); }
}
  .philosophy__backdrop { position: absolute; inset: 0px; overflow: hidden; }
  .philosophy__backdrop-frame { position: absolute; top: -85.08%; left: 0px; width: 100%; height: 221.02%; transform-origin: center center; will-change: transform; }
  .philosophy__backdrop-plate { object-fit: fill; }
  .philosophy__card { position: absolute; top: calc(55 * var(--raw-unit-design)); left: 50%; width: calc(1131 * var(--raw-unit-design)); height: calc(689 * var(--raw-unit-design)); margin-left: calc(-565.5 * var(--raw-unit-design)); overflow: clip; border-radius: var(--corner-panel); background: var(--raw-color-philosophy-card); will-change: transform, opacity; }
  .philosophy__card-grain { z-index: 0; object-fit: cover; }
  .philosophy__display { position: relative; z-index: 1; font-size: calc(64 * var(--raw-unit-design)); line-height: calc(57.6 * var(--raw-unit-design)); white-space: nowrap; }
  .philosophy__note { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: calc(4 * var(--raw-unit-design)); font-family: var(--font-inter-tight); font-size: calc(18 * var(--raw-unit-design)); will-change: transform, opacity; }
  .philosophy__note-line { font-family: var(--font-inter-tight); font-size: calc(18 * var(--raw-unit-design)); line-height: calc(18 * var(--raw-unit-design)); text-align: center; }
  .philosophy__note-line--right { text-align: right; }
  .philosophy__top { position: absolute; top: calc(32 * var(--raw-unit-design)); left: var(--philosophy-text-left); z-index: 1; display: flex; align-items: flex-end; gap: calc(55 * var(--raw-unit-design)); }
  .philosophy__note--top { width: 10.4444em; }
  .philosophy__shapes { position: absolute; top: calc(102 * var(--raw-unit-design)); left: calc(304.5 * var(--raw-unit-design)); }
  .philosophy__middle { position: absolute; top: calc(180 * var(--raw-unit-design)); left: 50%; z-index: 1; display: flex; align-items: center; gap: calc(24 * var(--raw-unit-design)); transform: translateX(-50%); }
  .philosophy__aside { width: 8.3889em; flex: 0 0 auto; will-change: transform, opacity; }
  .philosophy__aside--left { text-align: right; }
  .philosophy__aside--right { width: 8.3889em; text-align: left; }
  .philosophy__frame { position: relative; width: calc(291 * var(--raw-unit-design)); height: calc(329 * var(--raw-unit-design)); flex: 0 0 auto; border-radius: var(--corner-panel); }
  .philosophy__photo { position: absolute; inset: 0px; overflow: hidden; border-radius: var(--corner-panel); transform-origin: center center; will-change: transform, opacity; }
  .philosophy__photo-plate { top: -1.56%; left: -0.6%; width: 115.12%; height: 121.32%; object-fit: cover; }
  .philosophy__cta { position: absolute; top: calc(148 * var(--raw-unit-design)); left: calc(91 * var(--raw-unit-design)); display: flex; align-items: center; padding: calc(10 * var(--raw-unit-design)); border-radius: var(--philosophy-radius); background: var(--raw-color-philosophy-pill); color: rgb(255, 255, 255); font-family: var(--font-inter-tight); font-size: calc(13 * var(--raw-unit-design)); font-weight: 500; line-height: calc(10.4 * var(--raw-unit-design)); text-transform: uppercase; white-space: nowrap; cursor: pointer; transition: background-color 200ms var(--ease-hover-role); will-change: transform, opacity; }
  @media (hover: hover) {
  .philosophy__cta:hover { background: var(--raw-color-philosophy-pill-hover); }
}
  .philosophy__cta:focus-visible { outline: 2px solid var(--raw-color-philosophy-pill-hover); outline-offset: 2px; }
  .philosophy__cta-row { display: flex; align-items: center; gap: calc(6 * var(--raw-unit-design)); }
  .philosophy__cta-icon { display: block; width: calc(12 * var(--raw-unit-design)); height: calc(12 * var(--raw-unit-design)); flex: 0 0 auto; }
  .philosophy__bottom { position: absolute; top: calc(541 * var(--raw-unit-design)); left: var(--philosophy-text-left); z-index: 1; display: flex; width: calc(1067 * var(--raw-unit-design)); flex-direction: column; align-items: center; gap: calc(24 * var(--raw-unit-design)); }
  .philosophy__bottom-row { display: flex; width: 100%; align-items: flex-end; justify-content: space-between; }
  .philosophy__note--bottom { width: 14em; }
  .philosophy__note--bottom .philosophy__note-line:first-child { white-space: nowrap; }
  .philosophy__keep { width: 100%; text-align: center; }
  @media (min-width: 1024px) {
  .philosophy { --philosophy-note-centre: calc(533.05 * var(--raw-unit-design)); }
  .philosophy__note--top, .philosophy__note--bottom { position: absolute; bottom: 0px; }
  .philosophy__note--top { left: calc(var(--philosophy-note-centre) - 5.2222em); }
  .philosophy__note--top + .philosophy__display { margin-left: calc(243 * var(--raw-unit-design)); }
  .philosophy__bottom-row { position: relative; }
  .philosophy__note--bottom { left: calc(var(--philosophy-note-centre) - 7em); }
}
  .footer { --site-footer-ground: var(--raw-color-black); --site-footer-dim: rgb(255 255 255 / 0.5); --site-footer-rule: rgb(255 255 255 / 0.2); --site-footer-gutter: calc(40 * var(--raw-unit-design)); --site-footer-tap: 44px; --site-footer-icon: calc(12 * var(--raw-unit-design)); position: relative; height: calc(320 * var(--raw-unit-design)); background: var(--site-footer-ground); color: rgb(255, 255, 255); font-family: var(--font-manrope); font-size: calc(14 * var(--raw-unit-design)); font-weight: 500; line-height: calc(11.2 * var(--raw-unit-design)); }
  @media (max-width: 1439.98px) {
  .footer { --site-footer-gutter: clamp(20px, calc(20px + 20 * (100vw - 375px) / 1064), 40px); --site-footer-icon: 12px; display: grid; height: auto; padding-inline: var(--site-footer-gutter); gap: 40px 24px; font-size: 14px; line-height: 11.2px; grid-template-areas: "logo . subscribe" "columns columns columns" "rights legal social"; grid-template-columns: auto 1fr auto; }
  .footer .footer__logo, .footer .footer__columns, .footer .footer__subscribe, .footer .footer__rights, .footer .footer__meta { position: static; inset: auto; }
  .footer .footer__logo { position: relative; width: 79.07px; height: 40px; grid-area: logo; }
  .footer .footer__columns { gap: 50px; grid-area: columns; }
  .footer .footer__subscribe { width: 331px; max-width: 100%; grid-area: subscribe; }
  .footer .footer__rights { grid-area: rights; }
  .footer .footer__meta--legal { grid-area: legal; justify-self: center; }
  .footer .footer__meta--social { grid-area: social; justify-self: end; }
  .footer.footer { --site-footer-dim: rgb(255 255 255 / 0.55); }
  .footer .footer__note { font-size: 14px; line-height: 16.8px; }
  .footer .footer__dot { width: 4px; height: 4px; }
  .footer .footer__meta, .footer .footer__meta-item { gap: 12px; }
  .footer .footer__column { gap: 16px; }
  .footer .footer__list { gap: 0px; }
  .footer .footer__field { padding-bottom: 10px; }
}
  @media (min-width: 768px) and (max-width: 1439.98px) {
  .footer { grid-template-areas: "logo logo logo logo" "columns columns columns subscribe" "rule rule rule rule" "rights rights social social" "legal legal legal legal"; padding-block: 40px; grid-template-columns: repeat(3, max-content) minmax(0px, 1fr); gap: 0px 48px; }
  .footer .footer__subscribe { width: auto; margin-top: 48px; }
  @media (min-width: 1024px) {
  .footer.footer { grid-template-areas: "logo columns subscribe" "rights legal social"; grid-template-columns: calc(25% + 23 * var(--raw-unit-design))
          max-content
          minmax(0, 1fr); grid-template-rows: auto 1fr; height: 320px; column-gap: 0px; }
  .footer.footer .footer__rule { display: none; }
  .footer.footer .footer__logo, .footer.footer .footer__columns, .footer.footer .footer__subscribe { margin-top: 0px; }
  .footer.footer .footer__field { margin-top: 0px; }
  .footer.footer .footer__subscribe { max-width: clamp(235px, -1.30769px + 23.0769vw, 331px); place-self: start end; }
  .footer.footer .footer__columns { display: flex; width: auto; grid-template-columns: none; column-gap: calc(50 * var(--raw-unit-design)); }
  .footer.footer .footer__rights, .footer.footer .footer__meta--legal, .footer.footer .footer__meta--social { align-self: end; margin-top: 0px; padding-top: 0px; }
  .footer.footer .footer__meta--legal { justify-self: start; }
  .footer.footer .footer__meta--social { justify-self: end; }
}
  .footer .footer__field { margin-top: auto; }
  .footer .footer__columns { display: grid; width: 100%; grid-template-columns: subgrid; column-gap: 48px; }
  .footer .footer__columns { margin-top: 48px; }
  .footer .footer__rule { display: block; height: 1px; margin-top: 49px; background: var(--site-footer-rule); grid-area: rule; }
  .footer .footer__rights { padding-top: 26px; }
  .footer .footer__meta--social { margin-top: 26px; }
  .footer .footer__meta--legal { margin-top: 29px; }
  .footer .footer__rights, .footer .footer__meta--legal, .footer .footer__meta--social { place-self: start; }
  .footer .footer__meta--social { justify-self: end; }
}
  @media (min-width: 768px) and (max-width: 1023.98px) {
  .philosophy.philosophy { --philosophy-inset: calc(40 * min(100vw / 850, 100vh / 1150)); }
}
  @media (min-width: 1024px) and (max-width: 1439.98px) {
  .philosophy.philosophy { --philosophy-inset: calc(40 * var(--raw-unit-design)); }
}
  @media (max-width: 767.98px) {
  .footer { grid-template-areas: "logo" "columns" "subscribe" "social" "rule" "legal" "rights"; grid-template-columns: minmax(0px, 1fr); row-gap: 0px; padding-top: 32px; padding-bottom: calc(var(--site-footer-gutter) + 4px); }
  .footer .footer__logo { width: 60px; height: 30.36px; }
  .footer .footer__column:last-child { grid-column: 1 / -1; }
  .footer .footer__column:last-child .footer__list { display: grid; grid-auto-flow: column; grid-template-columns: repeat(2, minmax(0px, 1fr)); grid-template-rows: repeat(2, auto); column-gap: 24px; }
  .footer .footer__columns { display: grid; margin-top: 49px; gap: 32px 24px; grid-template-columns: repeat(2, minmax(0px, 1fr)); }
  .footer .footer__subscribe { width: auto; margin-top: 50px; gap: 24px; }
  .footer .footer__meta--social { margin-top: calc(48.602px); }
  .footer .footer__rule { display: block; height: 1px; margin-top: 34px; background: var(--site-footer-rule); grid-area: rule; }
  .footer .footer__meta--legal { margin-top: 24px; }
  .footer .footer__rights { padding-top: 30px; }
  .footer .footer__meta--legal, .footer .footer__meta--social { justify-self: start; }
  .footer .footer__input { font-size: 16px; }
}
  .footer__rule { display: none; }
  .footer__logo { position: absolute; top: calc(40 * var(--raw-unit-design)); left: var(--site-footer-gutter); display: block; width: calc(79.07 * var(--raw-unit-design)); height: calc(40 * var(--raw-unit-design)); overflow: hidden; }
  .footer__mark { position: absolute; max-width: none; filter: brightness(0) invert(1); }
  .footer__columns { position: absolute; top: calc(40.602 * var(--raw-unit-design)); left: calc(25% + 23 * var(--raw-unit-design)); display: flex; align-items: flex-start; gap: calc(50 * var(--raw-unit-design)); }
  .footer__column { display: flex; flex-direction: column; gap: calc(16 * var(--raw-unit-design)); }
  .footer__column-title { text-transform: uppercase; white-space: nowrap; }
  .footer__list { display: flex; flex-direction: column; margin: 0px; padding: 0px; gap: 0px; list-style: none; }
  .footer__link { display: flex; align-items: center; min-height: 24px; color: var(--site-footer-dim); text-decoration: none; white-space: nowrap; transition: color 200ms var(--ease-hover-role); margin-block: 0px !important; }
  .footer__link--bright { color: rgb(255, 255, 255); text-transform: uppercase; }
  @media (hover: hover) {
  .footer__link:hover { color: rgb(255, 255, 255); }
}
  .footer__link:focus-visible { outline: rgb(255, 255, 255) solid 1px; outline-offset: 2px; }
  .footer__subscribe { position: absolute; top: calc(42.916 * var(--raw-unit-design)); left: calc(75% - 11 * var(--raw-unit-design)); display: flex; width: calc(331 * var(--raw-unit-design)); flex-direction: column; gap: calc(24 * var(--raw-unit-design)); }
  .footer__note { color: var(--site-footer-dim); font-size: calc(12 * var(--raw-unit-design)); line-height: calc(14.4 * var(--raw-unit-design)); }
  .footer__field { display: flex; align-items: center; justify-content: space-between; padding-bottom: calc(10 * var(--raw-unit-design)); border-bottom: 1px solid rgb(255, 255, 255); }
  .footer__field:focus-within { box-shadow: rgb(255, 255, 255) 0px 1px 0px 0px; }
  .footer__input { min-width: 0px; flex: 1 1 0%; border: 0px; background: transparent; color: rgb(255, 255, 255); font: inherit; text-transform: uppercase; outline: none; }
  .footer__input::placeholder { color: rgb(255, 255, 255); opacity: 1; }
  .footer__submit { display: flex; flex: 0 0 auto; align-items: center; justify-content: center; padding: calc((var(--site-footer-tap) - var(--site-footer-icon)) / 2); margin: calc((var(--site-footer-tap) - var(--site-footer-icon)) / -2); background: none; color: inherit; cursor: pointer; }
  .footer__arrow { display: block; width: var(--site-footer-icon); height: var(--site-footer-icon); transform: rotate(90deg); }
  .footer__submit:focus-visible { outline: rgb(255, 255, 255) solid 1px; outline-offset: -14px; }
  .footer__rights { position: absolute; top: calc(286.602 * var(--raw-unit-design)); left: var(--site-footer-gutter); white-space: nowrap; }
  .footer__meta { position: absolute; top: calc(286.602 * var(--raw-unit-design)); display: flex; align-items: center; margin: 0px; padding: 0px; gap: calc(12 * var(--raw-unit-design)); list-style: none; }
  .footer__meta--legal { left: calc(25% + 23 * var(--raw-unit-design)); }
  .footer__meta--social { left: calc(75% - 11 * var(--raw-unit-design)); }
  .footer__meta-item { display: flex; align-items: center; gap: calc(12 * var(--raw-unit-design)); }
  .footer__dot { display: block; width: calc(4 * var(--raw-unit-design)); height: calc(4 * var(--raw-unit-design)); flex: 0 0 auto; color: var(--site-footer-dim); }
  .footer__meta--social .footer__dot { color: rgb(255, 255, 255); }
}
@property --tw-translate-x { syntax: "*"; inherits: false; initial-value: 0; }
@property --tw-translate-y { syntax: "*"; inherits: false; initial-value: 0; }
@property --tw-translate-z { syntax: "*"; inherits: false; initial-value: 0; }
@property --tw-rotate-x { syntax: "*"; inherits: false; }
@property --tw-rotate-y { syntax: "*"; inherits: false; }
@property --tw-rotate-z { syntax: "*"; inherits: false; }
@property --tw-skew-x { syntax: "*"; inherits: false; }
@property --tw-skew-y { syntax: "*"; inherits: false; }
@property --tw-border-style { syntax: "*"; inherits: false; initial-value: solid; }
@property --tw-leading { syntax: "*"; inherits: false; }
@property --tw-font-weight { syntax: "*"; inherits: false; }
@property --tw-tracking { syntax: "*"; inherits: false; }
@property --tw-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-shadow-color { syntax: "*"; inherits: false; }
@property --tw-shadow-alpha { syntax: "<percentage>"; inherits: false; initial-value: 100%; }
@property --tw-inset-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-inset-shadow-color { syntax: "*"; inherits: false; }
@property --tw-inset-shadow-alpha { syntax: "<percentage>"; inherits: false; initial-value: 100%; }
@property --tw-ring-color { syntax: "*"; inherits: false; }
@property --tw-ring-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-inset-ring-color { syntax: "*"; inherits: false; }
@property --tw-inset-ring-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-ring-inset { syntax: "*"; inherits: false; }
@property --tw-ring-offset-width { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --tw-ring-offset-color { syntax: "*"; inherits: false; initial-value: #fff; }
@property --tw-ring-offset-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-outline-style { syntax: "*"; inherits: false; initial-value: solid; }
@property --tw-blur { syntax: "*"; inherits: false; }
@property --tw-brightness { syntax: "*"; inherits: false; }
@property --tw-contrast { syntax: "*"; inherits: false; }
@property --tw-grayscale { syntax: "*"; inherits: false; }
@property --tw-hue-rotate { syntax: "*"; inherits: false; }
@property --tw-invert { syntax: "*"; inherits: false; }
@property --tw-opacity { syntax: "*"; inherits: false; }
@property --tw-saturate { syntax: "*"; inherits: false; }
@property --tw-sepia { syntax: "*"; inherits: false; }
@property --tw-drop-shadow { syntax: "*"; inherits: false; }
@property --tw-drop-shadow-color { syntax: "*"; inherits: false; }
@property --tw-drop-shadow-alpha { syntax: "<percentage>"; inherits: false; initial-value: 100%; }
@property --tw-drop-shadow-size { syntax: "*"; inherits: false; }
@property --tw-backdrop-blur { syntax: "*"; inherits: false; }
@property --tw-backdrop-brightness { syntax: "*"; inherits: false; }
@property --tw-backdrop-contrast { syntax: "*"; inherits: false; }
@property --tw-backdrop-grayscale { syntax: "*"; inherits: false; }
@property --tw-backdrop-hue-rotate { syntax: "*"; inherits: false; }
@property --tw-backdrop-invert { syntax: "*"; inherits: false; }
@property --tw-backdrop-opacity { syntax: "*"; inherits: false; }
@property --tw-backdrop-saturate { syntax: "*"; inherits: false; }
@property --tw-backdrop-sepia { syntax: "*"; inherits: false; }
@property --tw-duration { syntax: "*"; inherits: false; }
@property --tw-ease { syntax: "*"; inherits: false; }
@layer properties {
  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
  *, ::before, ::after, ::backdrop { --tw-translate-x: 0; --tw-translate-y: 0; --tw-translate-z: 0; --tw-rotate-x: initial; --tw-rotate-y: initial; --tw-rotate-z: initial; --tw-skew-x: initial; --tw-skew-y: initial; --tw-border-style: solid; --tw-leading: initial; --tw-font-weight: initial; --tw-tracking: initial; --tw-shadow: 0 0 #0000; --tw-shadow-color: initial; --tw-shadow-alpha: 100%; --tw-inset-shadow: 0 0 #0000; --tw-inset-shadow-color: initial; --tw-inset-shadow-alpha: 100%; --tw-ring-color: initial; --tw-ring-shadow: 0 0 #0000; --tw-inset-ring-color: initial; --tw-inset-ring-shadow: 0 0 #0000; --tw-ring-inset: initial; --tw-ring-offset-width: 0px; --tw-ring-offset-color: #fff; --tw-ring-offset-shadow: 0 0 #0000; --tw-outline-style: solid; --tw-blur: initial; --tw-brightness: initial; --tw-contrast: initial; --tw-grayscale: initial; --tw-hue-rotate: initial; --tw-invert: initial; --tw-opacity: initial; --tw-saturate: initial; --tw-sepia: initial; --tw-drop-shadow: initial; --tw-drop-shadow-color: initial; --tw-drop-shadow-alpha: 100%; --tw-drop-shadow-size: initial; --tw-backdrop-blur: initial; --tw-backdrop-brightness: initial; --tw-backdrop-contrast: initial; --tw-backdrop-grayscale: initial; --tw-backdrop-hue-rotate: initial; --tw-backdrop-invert: initial; --tw-backdrop-opacity: initial; --tw-backdrop-saturate: initial; --tw-backdrop-sepia: initial; --tw-duration: initial; --tw-ease: initial; }
}
}
```

## 2. The markup (verbatim; it opens `<body>`)

```html
<body class="__variable_f45bdb __variable_278282 __variable_dc1238">
<div class="scroll-layout"><div class="scroll-layout-content">
<main><div role="status" aria-live="polite" aria-label="Loading" class="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-content text-content-inverse inset-safe" style="opacity:1;pointer-events:auto"><div class="my-auto flex flex-col items-center" style="gap:clamp(12px, 3.5vh, calc(28 * var(--raw-unit-design)))"><span class="relative block overflow-hidden" style="width:clamp(96px, 26vw, calc(79.07 * var(--raw-unit-design)));height:calc(clamp(96px, 26vw, calc(79.07 * var(--raw-unit-design))) * 0.5058808650562793)"><img alt="Lumière" width="1536" height="1024" decoding="async" data-nimg="1" class="absolute max-w-none brightness-0 invert" style="color:transparent;width:190.59%;height:251.16%;left:-48.82%;top:-60.47%" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/logo.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/logo.webp" crossorigin="anonymous"/></span><span class="relative block overflow-hidden" style="width:min(60vw, calc(160.0000 * var(--raw-unit-design)));height:calc(0.7000 * var(--raw-unit-design));background-color:color-mix(in srgb, currentColor 20%, transparent)"><span class="absolute inset-y-0 left-0 block bg-current" style="width:0%"></span></span><span class="font-sans text-caption font-medium uppercase opacity-30">0<!-- -->%</span></div></div><div class="relative" style="height:300svh"><div class="sticky top-0 h-svh overflow-hidden"><section aria-labelledby="hero-headline" data-preload="" class="relative isolate h-svh w-full overflow-hidden bg-surface" style="color:rgb(0 0 0)"><img alt="" aria-hidden="true" decoding="async" data-nimg="fill" class="z-0 object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/paper.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/paper.webp" crossorigin="anonymous"/><div class="absolute inset-0 z-10"><div class="pointer-events-none absolute inset-0"><div class="absolute left-1/2" style="width:var(--pendant-width);height:var(--pendant-height);top:var(--pendant-top);translate:calc(-50% + var(--pendant-nudge-x, 0px)) var(--pendant-shift, 0)"><div class="h-full w-full" style="filter:none;opacity:1"><div class="relative h-full w-full"><div class="absolute inset-0" style="opacity:1"><img alt="Emerald pendant in a diamond halo on a gold chain" width="421" height="556" decoding="async" data-nimg="1" class="hidden h-full w-full max-w-none object-fill min-[930px]:block" style="color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/pendant-emerald.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/pendant-emerald.webp" crossorigin="anonymous"/><img alt="Emerald pendant in a diamond halo on a gold chain" width="1024" height="1536" decoding="async" data-nimg="1" class="h-full w-full max-w-none object-fill min-[930px]:hidden" style="color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/pendant-emerald-compact.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/pendant-emerald-compact.webp" crossorigin="anonymous"/></div><div aria-hidden="true" class="absolute inset-0" style="opacity:0"></div></div></div></div><ul class="absolute inset-0 list-none" style="transform-origin:50% var(--ring-top);transform:none"><li data-card="1" class="absolute left-1/2 overflow-hidden will-change-transform" style="top:var(--ring-top);width:calc(105.3980 * var(--raw-unit-design));height:calc(124.4700 * var(--raw-unit-design));z-index:1;transform:translate(-50%, -50%) translate(-130.3445px, -155.3385px) rotate(-40deg) scale(0.86);opacity:0;filter:blur(14px);border-radius:calc(32.0000 * var(--raw-unit-design))"><img alt="Gold ear cuff resting on a linen backdrop" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-01.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-01.webp" crossorigin="anonymous"/></li><li data-card="2" class="absolute left-1/2 overflow-hidden will-change-transform" style="top:var(--ring-top);width:calc(105.3980 * var(--raw-unit-design));height:calc(124.4700 * var(--raw-unit-design));z-index:1;transform:translate(-50%, -50%) translate(17.6734px, -202.0084px) rotate(5deg) scale(0.86) scaleY(-1);opacity:0;filter:blur(14px);border-radius:calc(32.0000 * var(--raw-unit-design))"><img alt="Hand wearing a sculpted gold ring" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-02.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-02.webp" crossorigin="anonymous"/></li><li data-card="3" class="absolute left-1/2 overflow-hidden will-change-transform" style="top:var(--ring-top);width:calc(105.3980 * var(--raw-unit-design));height:calc(124.4700 * var(--raw-unit-design));z-index:1;transform:translate(-50%, -50%) translate(155.3385px, -130.3445px) rotate(50deg) scale(0.86) scaleY(-1);opacity:0;filter:blur(14px);border-radius:calc(32.0000 * var(--raw-unit-design))"><img alt="Stacked gold rings worn across a hand" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-03.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-03.webp" crossorigin="anonymous"/></li><li data-card="4" class="absolute left-1/2 overflow-hidden will-change-transform" style="top:var(--ring-top);width:calc(105.3980 * var(--raw-unit-design));height:calc(124.4700 * var(--raw-unit-design));z-index:1;transform:translate(-50%, -50%) translate(202.0084px, 17.6734px) rotate(95deg) scale(0.86) scaleY(-1);opacity:0;filter:blur(14px);border-radius:calc(32.0000 * var(--raw-unit-design))"><img alt="Hand wearing layered silver rings" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;object-position:center bottom;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-04.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-04.webp" crossorigin="anonymous"/></li><li data-card="5" class="absolute left-1/2 overflow-hidden will-change-transform" style="top:var(--ring-top);width:calc(105.3980 * var(--raw-unit-design));height:calc(124.4700 * var(--raw-unit-design));z-index:1;transform:translate(-50%, -50%) translate(130.3445px, 155.3385px) rotate(140deg) scale(0.86) scaleY(-1);opacity:0;filter:blur(14px);border-radius:calc(32.0000 * var(--raw-unit-design))"><img alt="Pearl drop earrings on a linen backdrop" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-05.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-05.webp" crossorigin="anonymous"/></li><li data-card="6" class="absolute left-1/2 overflow-hidden" style="top:var(--ring-top);width:calc(105.3980 * var(--raw-unit-design));height:calc(124.4700 * var(--raw-unit-design));z-index:2;transform:translate(-50%, -50%) translate(-17.6734px, 202.0084px) rotate(185deg) scale(0.86);opacity:0;filter:blur(14px);border-radius:32px"><img alt="Hand wearing a larimar cocktail ring" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;object-position:center bottom;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-06.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-06.webp" crossorigin="anonymous"/><div class="absolute inset-0" style="opacity:0;transform:translate3d(0, 0%, 0)"><img alt="Hand resting on a stone, wearing silver and turquoise rings" loading="eager" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;object-position:var(--frame3-crop);color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-08.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-08.webp" crossorigin="anonymous"/></div></li><li data-card="7" class="absolute left-1/2 overflow-hidden will-change-transform" style="top:var(--ring-top);width:calc(105.3980 * var(--raw-unit-design));height:calc(124.4700 * var(--raw-unit-design));z-index:1;transform:translate(-50%, -50%) translate(-155.3385px, 130.3445px) rotate(230deg) scale(0.86);opacity:0;filter:blur(14px);border-radius:calc(32.0000 * var(--raw-unit-design))"><img alt="Gold sunburst pendant on a linen backdrop" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-07.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-07.webp" crossorigin="anonymous"/></li><li data-card="8" class="absolute left-1/2 overflow-hidden will-change-transform" style="top:var(--ring-top);width:calc(105.3980 * var(--raw-unit-design));height:calc(124.4700 * var(--raw-unit-design));z-index:1;transform:translate(-50%, -50%) translate(-202.0084px, -17.6734px) rotate(275deg) scale(0.86) scaleY(-1);opacity:0;filter:blur(14px);border-radius:calc(32.0000 * var(--raw-unit-design))"><img alt="Hand wearing a turquoise ring" decoding="async" data-nimg="fill" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-08.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/card-08.webp" crossorigin="anonymous"/></li></ul></div></div><h1 id="hero-headline" class="absolute left-40 z-30 flex max-w-[calc(100vw-80*var(--raw-unit-design))] flex-col items-start font-serif text-display top-[var(--headline-top)] w-auto lg:top-[calc(50%-104*var(--raw-unit-design))] lg:w-350"><span class="grid"><span class="block" style="grid-area:1 / 1"><span class="block whitespace-nowrap invisible "><span class="italic">J</span><span>ewellery</span></span><span class="block whitespace-nowrap invisible "><span>for everyday</span></span><span class="block whitespace-nowrap invisible "><span>rituals.</span></span></span><span aria-hidden="true" class="block" style="grid-area:1 / 1"><span class="block whitespace-nowrap invisible "><span class="italic">M</span><span>ade by hand,</span></span><span class="block whitespace-nowrap invisible "><span>worn every</span></span><span class="block whitespace-nowrap invisible "><span>day.</span></span></span></span></h1><header class="pointer-events-none absolute inset-x-0 top-0 z-20"><nav aria-label="Primary" class="pointer-events-auto absolute top-29 left-40 hidden lg:block"><ul class="flex list-none items-center gap-48 font-sans text-nav font-medium uppercase"><li style="opacity:0;transform:translate3d(0, 18px, 0)"><a class="inline-flex" href="#"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em">Shop</span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em">Shop</span></span></span></a></li><li style="opacity:0;transform:translate3d(0, 18px, 0)"><a class="inline-flex" href="#"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em">Collections</span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em">Collections</span></span></span></a></li><li style="opacity:0;transform:translate3d(0, 18px, 0)"><a class="inline-flex" href="#"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em">Blog</span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em">Blog</span></span></span></a></li><li style="opacity:0;transform:translate3d(0, 18px, 0)"><a class="inline-flex" href="#"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em">About</span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em">About</span></span></span></a></li></ul></nav><a aria-label="Lumière — jewellery atelier, home" class="pointer-events-auto absolute left-1/2 block -translate-x-1/2 overflow-hidden -translate-y-1/2 top-[calc(29*var(--raw-unit-design)_+_22px)] lg:top-14 lg:translate-y-0" style="width:var(--wordmark-width);height:var(--wordmark-height)" href="#"><img alt="" aria-hidden="true" width="1536" height="1024" decoding="async" data-nimg="1" class="absolute max-w-none" style="color:transparent;width:190.59%;height:251.16%;left:-48.82%;top:-60.47%" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/logo.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/logo.webp" crossorigin="anonymous"/><div aria-hidden="true" class="absolute inset-0" style="opacity:0"><img alt="" width="1536" height="1024" decoding="async" data-nimg="1" class="absolute max-w-none brightness-0 invert" style="color:transparent;width:190.59%;height:251.16%;left:-48.82%;top:-60.47%" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/logo.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/logo.webp" crossorigin="anonymous"/></div></a><nav aria-label="Account" class="pointer-events-auto absolute top-29 right-40 hidden lg:block"><ul class="flex list-none items-center gap-48 font-sans text-nav font-medium uppercase"><li style="opacity:0;transform:translate3d(0, 18px, 0)"><a class="inline-flex" href="#"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em">Log in</span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em">Log in</span></span></span></a></li><li style="opacity:0;transform:translate3d(0, 18px, 0)"><a class="inline-flex" href="#"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em">Cart (0)</span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em">Cart (0)</span></span></span></a></li></ul></nav><div class="pointer-events-auto absolute inset-x-0 top-29 z-50 flex items-center justify-between px-40 md:flex-row-reverse lg:hidden " style="opacity:0;transform:translate3d(0, 10px, 0)"><a class="flex min-h-[44px] items-center font-sans text-nav font-medium uppercase" href="#"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em">Cart (0)</span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em">Cart (0)</span></span></span></a><button type="button" aria-expanded="false" aria-controls="hero-menu" class="relative -mr-[10px] size-[44px] md:-ml-[10px] md:mr-0"><span class="sr-only">Open menu</span><span aria-hidden="true" class="absolute top-1/2 right-[10px] block h-px bg-current md:right-auto md:left-[10px]" style="width:24px;transform:translateY(-3px) rotate(0deg)"></span><span aria-hidden="true" class="absolute top-1/2 right-[10px] block h-px bg-current md:right-auto md:left-[10px]" style="width:15.84px;transform:translateY(3px) rotate(0deg)"></span></button></div></header><nav aria-label="Collections" class="absolute top-1/2 right-40 z-20 hidden -translate-y-1/2 lg:block" style="width:calc(calc(85.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));height:calc(calc(160.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));mask-image:linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 0.15) 10%, rgb(0 0 0 / 1) 50%, rgb(0 0 0 / 0.15) 90%, transparent 100%);-webkit-mask-image:linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 0.15) 10%, rgb(0 0 0 / 1) 50%, rgb(0 0 0 / 0.15) 90%, transparent 100%);opacity:1;pointer-events:auto"><ul class="flex list-none flex-col items-end will-change-transform" style="gap:calc(calc(8.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));transform:translateY(63px)"><li><a class="flex w-full items-center justify-center rounded-pill border-border-muted font-serif whitespace-nowrap transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70" style="height:calc(calc(34.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));padding-inline:calc(calc(10.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));border-width:calc(calc(1.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));font-size:max(12px, calc(calc(16.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1)));line-height:max(12px, calc(calc(15.2000 * var(--raw-unit-design)) * var(--hero-category-scale, 1)))" href="#"><span class="italic">R</span>ings</a></li><li class="w-full"><a class="flex w-full items-center justify-center rounded-pill border-border-muted font-serif whitespace-nowrap transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70" style="height:calc(calc(34.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));padding-inline:calc(calc(10.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));border-width:calc(calc(1.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));font-size:max(12px, calc(calc(16.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1)));line-height:max(12px, calc(calc(15.2000 * var(--raw-unit-design)) * var(--hero-category-scale, 1)))" href="#"><span class="italic">N</span>ecklaces</a></li><li><a class="flex w-full items-center justify-center rounded-pill border-border-muted font-serif whitespace-nowrap transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70" style="height:calc(calc(34.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));padding-inline:calc(calc(10.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));border-width:calc(calc(1.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));font-size:max(12px, calc(calc(16.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1)));line-height:max(12px, calc(calc(15.2000 * var(--raw-unit-design)) * var(--hero-category-scale, 1)))" href="#"><span class="italic">E</span>arrings</a></li><li class="w-full"><a class="flex w-full items-center justify-center rounded-pill border-border-muted font-serif whitespace-nowrap transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70" style="height:calc(calc(34.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));padding-inline:calc(calc(10.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));border-width:calc(calc(1.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1));font-size:max(12px, calc(calc(16.0000 * var(--raw-unit-design)) * var(--hero-category-scale, 1)));line-height:max(12px, calc(calc(15.2000 * var(--raw-unit-design)) * var(--hero-category-scale, 1)))" href="#"><span class="italic">B</span>racelets</a></li></ul></nav><div class="pointer-events-none absolute inset-x-0 bottom-0 z-20"><p class="absolute left-40 font-sans text-body font-medium bottom-[var(--footer-tagline-bottom)] w-[min(calc(100vw-80*var(--raw-unit-design)),var(--footer-tagline-width))] lg:w-281" style="opacity:0;transform:translate3d(0, 14px, 0)"><span class="grid"><span class="block" style="grid-area:1 / 1"><span class="block   ">Crafted jewellery designed to accompany everyday rituals</span></span><span aria-hidden="true" class="block" style="grid-area:1 / 1"><span class="block  invisible ">Shaped and finished by hand, in small batches, in our own studio</span></span></span></p><p class="absolute bottom-[var(--footer-cue-bottom)] left-1/2 hidden -translate-x-1/2 items-center gap-6 font-sans text-caption font-medium uppercase md:flex" style="opacity:0.3"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" class="size-16"><g transform="translate(3 0.5)" fill="currentColor"><path d="M6.5 15H4.5C3.30653 15 2.16193 14.5259 1.31802 13.682C0.474106 12.8381 0 11.6935 0 10.5V4.5C0 3.30653 0.474106 2.16193 1.31802 1.31802C2.16193 0.474106 3.30653 0 4.5 0H6.5C7.69347 0 8.83807 0.474106 9.68198 1.31802C10.5259 2.16193 11 3.30653 11 4.5V10.5C11 11.6935 10.5259 12.8381 9.68198 13.682C8.83807 14.5259 7.69347 15 6.5 15ZM4.5 1C3.57174 1 2.6815 1.36875 2.02513 2.02513C1.36875 2.6815 1 3.57174 1 4.5V10.5C1 11.4283 1.36875 12.3185 2.02513 12.9749C2.6815 13.6313 3.57174 14 4.5 14H6.5C7.42826 14 8.3185 13.6313 8.97487 12.9749C9.63125 12.3185 10 11.4283 10 10.5V4.5C10 3.57174 9.63125 2.6815 8.97487 2.02513C8.3185 1.36875 7.42826 1 6.5 1H4.5Z"></path><path d="M5.5 8C5.36739 8 5.24021 7.94732 5.14645 7.85355C5.05268 7.75979 5 7.63261 5 7.5V3.5C5 3.36739 5.05268 3.24021 5.14645 3.14645C5.24021 3.05268 5.36739 3 5.5 3C5.63261 3 5.75979 3.05268 5.85355 3.14645C5.94732 3.24021 6 3.36739 6 3.5V7.5C6 7.63261 5.94732 7.75979 5.85355 7.85355C5.75979 7.94732 5.63261 8 5.5 8Z"></path></g></svg>scroll</p><a class="pointer-events-auto absolute left-40 flex w-fit flex-col items-start gap-8 md:right-40 md:left-auto lg:right-40 lg:left-auto" style="bottom:var(--footer-cta-bottom);opacity:0;transform:translate3d(0, 14px, 0)" href="#"><span class="flex items-center gap-12 font-serif text-utility uppercase tracking-utility"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollections</span></span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollections</span></span></span></span><span class="block will-change-transform" style="transform:translate3d(0px, 0, 0)"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="size-12 rotate-90"><path d="M1.5 10.5H6.9V1.5M10.5 5.35714L6.9 1.5L3.3 5.35714" stroke="currentColor" stroke-width="0.7"></path></svg></span></span><span class="w-full overflow-hidden" style="height:calc(0.7000 * var(--raw-unit-design))"><span class="block h-full w-full origin-left bg-current" style="transform:scaleX(1);transform-origin:right"></span></span></a></div></section></div></div><section aria-labelledby="collections-heading" class="collections relative isolate w-full overflow-hidden bg-surface text-content"><img alt="" aria-hidden="true" loading="lazy" decoding="async" data-nimg="fill" class="z-0 object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/paper.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/paper.webp" crossorigin="anonymous"/><h2 id="collections-heading" class="collections__heading font-serif text-collections-heading" style="margin-block:-0.08750000000000002em;transform:translate3d(0, 0em, 0)"><span class="block whitespace-nowrap invisible "><span class="italic">F</span><span>our </span><span class="italic">C</span><span>ollections.</span></span><span class="block whitespace-nowrap invisible "><span class="italic">E</span><span>ndless </span><span class="italic">S</span><span>tories.</span></span></h2><p class="collections__lead font-tight text-collections-lead" style="margin-block:-0.26875000000000004em;opacity:0;transform:translate3d(0, 14px, 0)">Each piece is thoughtfully designed and meticulously crafted in small batches.</p><div class="collections__grid"><div class="collections__row"><a data-collection-card="true" class="collections__card collections__card--narrow" style="--card-crop:50% 100%;--card-crop-mobile:13% 50%;--card-zoom:1;--card-zoom-mobile:1.4;--card-aim-mobile:1;--note-w:8.071428571428571em;--photo-room:18%" href="#"><span class="collections__photo-frame" style="transform:translate3d(0, 0%, 0)"><img alt="A hand at rest, wearing a heavy gold ring" loading="lazy" decoding="async" data-nimg="fill" class="collections__photo" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/collections/rings.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/collections/rings.webp" crossorigin="anonymous"/></span><div class="collections__body"><span aria-hidden="true" data-card-reveal="true" class="collections__index font-serif text-card-index italic underline" style="margin-block:-0.08750000000000001em">01</span><span class="collections__middle"><span data-card-label="true" class="block origin-bottom-left font-serif text-card-title whitespace-nowrap" style="margin-block:-0.08750000000000006em"><span class="italic">R</span><span>ings.</span></span><span aria-hidden="true" data-card-reveal="true" class="collections__note font-tight text-card-note" style="margin-block:-0.14285714285714285em"><span class="block">Forms that stay close to you.</span></span></span><span aria-hidden="true" data-card-reveal="true" class="collections__cta"><span class="collections__cta-row font-serif text-card-cta tracking-card-cta uppercase"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em"><span class="block" style="margin-block:-0.03750000000000003em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollection</span></span></span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em"><span class="block" style="margin-block:-0.03750000000000003em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollection</span></span></span></span></span><span class="block will-change-transform" style="transform:translate3d(0px, 0, 0)"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="size-12 rotate-90"><path d="M1.5 10.5H6.9V1.5M10.5 5.35714L6.9 1.5L3.3 5.35714" stroke="currentColor" stroke-width="0.7"></path></svg></span></span><span class="collections__rule"><span class="block h-full w-full bg-current" style="transform:scaleX(1);transform-origin:right"></span></span></span></div></a><a data-collection-card="true" class="collections__card collections__card--wide" style="--card-crop:50% 50%;--card-crop-mobile:30% 50%;--card-zoom:1;--card-zoom-mobile:1.35;--card-aim-mobile:-1;--note-w:8.071428571428571em;--photo-room:14.000000000000002%" href="#"><span class="collections__photo-frame" style="transform:translate3d(0, 0%, 0)"><img alt="A fine chain and pendant at the collarbone" loading="lazy" decoding="async" data-nimg="fill" class="collections__photo" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/collections/necklaces.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/collections/necklaces.webp" crossorigin="anonymous"/></span><div class="collections__body"><span aria-hidden="true" data-card-reveal="true" class="collections__index font-serif text-card-index italic underline" style="margin-block:-0.08750000000000001em">02</span><span class="collections__middle"><span data-card-label="true" class="block origin-bottom-left font-serif text-card-title whitespace-nowrap" style="margin-block:-0.08750000000000006em"><span class="italic">N</span><span>ecklaces.</span></span><span aria-hidden="true" data-card-reveal="true" class="collections__note font-tight text-card-note" style="margin-block:-0.14285714285714285em"><span class="block">Objects to carry with you.</span></span></span><span aria-hidden="true" data-card-reveal="true" class="collections__cta"><span class="collections__cta-row font-serif text-card-cta tracking-card-cta uppercase"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em"><span class="block" style="margin-block:-0.03750000000000003em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollection</span></span></span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em"><span class="block" style="margin-block:-0.03750000000000003em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollection</span></span></span></span></span><span class="block will-change-transform" style="transform:translate3d(0px, 0, 0)"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="size-12 rotate-90"><path d="M1.5 10.5H6.9V1.5M10.5 5.35714L6.9 1.5L3.3 5.35714" stroke="currentColor" stroke-width="0.7"></path></svg></span></span><span class="collections__rule"><span class="block h-full w-full bg-current" style="transform:scaleX(1);transform-origin:right"></span></span></span></div></a></div><div class="collections__row"><a data-collection-card="true" class="collections__card collections__card--wide" style="--card-crop:0% 34.4%;--card-crop-mobile:0% 50%;--card-zoom:1.02;--card-zoom-mobile:1;--card-aim-mobile:0;--note-w:8.071428571428571em;--photo-room:16%" href="#"><span class="collections__photo-frame" style="transform:translate3d(0, 0%, 0)"><img alt="A textured gold earring against loose hair" loading="lazy" decoding="async" data-nimg="fill" class="collections__photo" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/collections/earrings.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/collections/earrings.webp" crossorigin="anonymous"/></span><div class="collections__body"><span aria-hidden="true" data-card-reveal="true" class="collections__index font-serif text-card-index italic underline" style="margin-block:-0.08750000000000001em">03</span><span class="collections__middle"><span data-card-label="true" class="block origin-bottom-left font-serif text-card-title whitespace-nowrap" style="margin-block:-0.08750000000000006em"><span class="italic">E</span><span>arrings.</span></span><span aria-hidden="true" data-card-reveal="true" class="collections__note font-tight text-card-note" style="margin-block:-0.14285714285714285em"><span class="block">Small details.</span><span class="block">Quiet presence.</span></span></span><span aria-hidden="true" data-card-reveal="true" class="collections__cta"><span class="collections__cta-row font-serif text-card-cta tracking-card-cta uppercase"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em"><span class="block" style="margin-block:-0.03750000000000003em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollection</span></span></span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em"><span class="block" style="margin-block:-0.03750000000000003em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollection</span></span></span></span></span><span class="block will-change-transform" style="transform:translate3d(0px, 0, 0)"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="size-12 rotate-90"><path d="M1.5 10.5H6.9V1.5M10.5 5.35714L6.9 1.5L3.3 5.35714" stroke="currentColor" stroke-width="0.7"></path></svg></span></span><span class="collections__rule"><span class="block h-full w-full bg-current" style="transform:scaleX(1);transform-origin:right"></span></span></span></div></a><a data-collection-card="true" class="collections__card collections__card--narrow" style="--card-crop:43.8% 97.5%;--card-crop-mobile:100% 50%;--card-zoom:1.029;--card-zoom-mobile:1;--card-aim-mobile:0;--note-w:8.642857142857142em;--photo-room:20%" href="#"><span class="collections__photo-frame" style="transform:translate3d(0, 0%, 0)"><img alt="A slim gold bangle at the wrist, under a linen cuff" loading="lazy" decoding="async" data-nimg="fill" class="collections__photo" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/collections/bracelets.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/collections/bracelets.webp" crossorigin="anonymous"/></span><div class="collections__body"><span aria-hidden="true" data-card-reveal="true" class="collections__index font-serif text-card-index italic underline" style="margin-block:-0.08750000000000001em">04</span><span class="collections__middle"><span data-card-label="true" class="block origin-bottom-left font-serif text-card-title whitespace-nowrap" style="margin-block:-0.08750000000000006em"><span class="italic">B</span><span>racelets.</span></span><span aria-hidden="true" data-card-reveal="true" class="collections__note font-tight text-card-note" style="margin-block:-0.14285714285714285em"><span class="block">Made for everyday rituals.</span></span></span><span aria-hidden="true" data-card-reveal="true" class="collections__cta"><span class="collections__cta-row font-serif text-card-cta tracking-card-cta uppercase"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em"><span class="block" style="margin-block:-0.03750000000000003em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollection</span></span></span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em"><span class="block" style="margin-block:-0.03750000000000003em"><span class="italic">e</span><span>xplore </span><span class="italic">c</span><span>ollection</span></span></span></span></span><span class="block will-change-transform" style="transform:translate3d(0px, 0, 0)"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="size-12 rotate-90"><path d="M1.5 10.5H6.9V1.5M10.5 5.35714L6.9 1.5L3.3 5.35714" stroke="currentColor" stroke-width="0.7"></path></svg></span></span><span class="collections__rule"><span class="block h-full w-full bg-current" style="transform:scaleX(1);transform-origin:right"></span></span></span></div></a></div></div></section><div class="relative" style="height:420svh"><div class="sticky top-0 flex h-svh items-center"><section aria-labelledby="featured-title" class="featured relative isolate w-full overflow-hidden bg-surface text-content"><img alt="" aria-hidden="true" loading="lazy" decoding="async" data-nimg="fill" class="z-0 object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/paper.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/paper.webp" crossorigin="anonymous"/><div class="featured__panels"><div class="featured__panel featured__panel--photo"><div class="featured__photo-frame" style="opacity:0;transform:scale(1.04)"><div class="featured__photo-drift" style="--photo-room:22%;transform:translate3d(0, 0%, 0)"><div aria-hidden="false" class="featured__photo-layer"><div class="featured__photo-zoom"><img alt="A rose-gold three-stone ring on a driftwood slab in pale sand" decoding="async" data-nimg="fill" class="featured__photo" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-01.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-01.webp" crossorigin="anonymous"/></div></div><div aria-hidden="true" class="featured__photo-layer" style="mask-image:linear-gradient(to top, rgba(0, 0, 0, 1) -45%, rgba(0, 0, 0, 0) 0%);-webkit-mask-image:linear-gradient(to top, rgba(0, 0, 0, 1) -45%, rgba(0, 0, 0, 0) 0%);visibility:hidden"><div class="featured__photo-zoom" style="transform:scale(1.05)"><img alt="A rose-gold solitaire with a white-gold head on a sunlit block of limestone" loading="lazy" decoding="async" data-nimg="fill" class="featured__photo" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-02.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-02.webp" crossorigin="anonymous"/></div></div><div aria-hidden="true" class="featured__photo-layer" style="mask-image:linear-gradient(to top, rgba(0, 0, 0, 1) -45%, rgba(0, 0, 0, 0) 0%);-webkit-mask-image:linear-gradient(to top, rgba(0, 0, 0, 1) -45%, rgba(0, 0, 0, 0) 0%);visibility:hidden"><div class="featured__photo-zoom" style="transform:scale(1.05)"><img alt="A yellow-gold six-claw solitaire on weathered driftwood in warm sand" loading="lazy" decoding="async" data-nimg="fill" class="featured__photo" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-03.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-03.webp" crossorigin="anonymous"/></div></div><div aria-hidden="true" class="featured__photo-layer" style="mask-image:linear-gradient(to top, rgba(0, 0, 0, 1) -45%, rgba(0, 0, 0, 0) 0%);-webkit-mask-image:linear-gradient(to top, rgba(0, 0, 0, 1) -45%, rgba(0, 0, 0, 0) 0%);visibility:hidden"><div class="featured__photo-zoom" style="transform:scale(1.05)"><img alt="A yellow-gold ring with a green peridot, side diamonds and a pavé band on travertine" loading="lazy" decoding="async" data-nimg="fill" class="featured__photo" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-04.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-04.webp" crossorigin="anonymous"/></div></div><div aria-hidden="true" class="featured__photo-layer" style="mask-image:linear-gradient(to top, rgba(0, 0, 0, 1) -45%, rgba(0, 0, 0, 0) 0%);-webkit-mask-image:linear-gradient(to top, rgba(0, 0, 0, 1) -45%, rgba(0, 0, 0, 0) 0%);visibility:hidden"><div class="featured__photo-zoom" style="transform:scale(1.05)"><img alt="A white-gold ring with a teal sapphire between pear-cut diamonds on a sandstone dome" loading="lazy" decoding="async" data-nimg="fill" class="featured__photo" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-05.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/photo-ring-05.webp" crossorigin="anonymous"/></div></div></div></div><h2 id="featured-title" class="featured__title font-serif" style="margin-block:-0.0875em"><span class="grid"><span class="block" style="grid-area:1 / 1"><span class="block! whitespace-nowrap " style="position:relative;column-gap:0.3em;display:flex;flex-wrap:wrap"><span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;user-select:none"><span class="italic">T</span><span>rinity.</span></span><span aria-hidden="true" style="display:contents"><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">T</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">r</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">i</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">n</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">i</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">t</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">y</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">.</span></span></span></span></span></span><span aria-hidden="true" class="block" style="grid-area:1 / 1"><span class="block whitespace-nowrap invisible "><span class="italic">S</span><span>olace.</span></span></span><span aria-hidden="true" class="block" style="grid-area:1 / 1"><span class="block whitespace-nowrap invisible "><span class="italic">A</span><span>urum.</span></span></span><span aria-hidden="true" class="block" style="grid-area:1 / 1"><span class="block whitespace-nowrap invisible "><span class="italic">V</span><span>erdant.</span></span></span><span aria-hidden="true" class="block" style="grid-area:1 / 1"><span class="block whitespace-nowrap invisible "><span class="italic">T</span><span>idal.</span></span></span></span></h2><div class="featured__meta"><div class="featured__pills" style="opacity:0;transform:translate3d(0, 0.75em, 0)"><button type="button" class="featured__pill featured__pill--cta"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em"><span class="featured__pill-row"><span class="featured__pill-icon"><svg viewBox="0 0 13 13" fill="none" aria-hidden="true" focusable="false" class="block size-full"><path d="M3.77 3.28V2.6a2.73 2.73 0 0 1 5.46 0v.68h2.02c.3 0 .55.25.53.55l-.5 8.02a.54.54 0 0 1-.54.5H2.26a.54.54 0 0 1-.54-.5l-.5-8.02c-.02-.3.23-.55.53-.55H3.77Zm1.08 0h3.3V2.6a1.65 1.65 0 0 0-3.3 0v.68Z" fill="currentColor"></path></svg></span><span style="margin-block:-0.018750000000000044em">Add to cart</span></span></span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em"><span class="featured__pill-row"><span class="featured__pill-icon"><svg viewBox="0 0 13 13" fill="none" aria-hidden="true" focusable="false" class="block size-full"><path d="M3.77 3.28V2.6a2.73 2.73 0 0 1 5.46 0v.68h2.02c.3 0 .55.25.53.55l-.5 8.02a.54.54 0 0 1-.54.5H2.26a.54.54 0 0 1-.54-.5l-.5-8.02c-.02-.3.23-.55.53-.55H3.77Zm1.08 0h3.3V2.6a1.65 1.65 0 0 0-3.3 0v.68Z" fill="currentColor"></path></svg></span><span style="margin-block:-0.018750000000000044em">Add to cart</span></span></span></span></span></button><span class="featured__pill"><span class="grid "><span aria-hidden="false" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:1;filter:none;visibility:visible"><span style="margin-block:-0.018750000000000044em">$2,450</span></span><span aria-hidden="true" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:0;filter:blur(0.28em);visibility:hidden"><span style="margin-block:-0.018750000000000044em">$1,890</span></span><span aria-hidden="true" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:0;filter:blur(0.28em);visibility:hidden"><span style="margin-block:-0.018750000000000044em">$1,650</span></span><span aria-hidden="true" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:0;filter:blur(0.28em);visibility:hidden"><span style="margin-block:-0.018750000000000044em">$2,100</span></span><span aria-hidden="true" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:0;filter:blur(0.28em);visibility:hidden"><span style="margin-block:-0.018750000000000044em">$2,780</span></span></span></span></div><p class="featured__materials font-tight" style="opacity:0;transform:translate3d(0, 0.6667em, 0)"><span class="grid featured__materials-swap"><span aria-hidden="false" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:1;filter:none;visibility:visible"><span class="featured__materials-row"><span class="featured__material"><span style="margin-block:-0.11875000000000001em">Rose gold</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Diamonds</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Handmade</span></span></span></span><span aria-hidden="true" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:0;filter:blur(0.28em);visibility:hidden"><span class="featured__materials-row"><span class="featured__material"><span style="margin-block:-0.11875000000000001em">Rose gold</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Diamond</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Handmade</span></span></span></span><span aria-hidden="true" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:0;filter:blur(0.28em);visibility:hidden"><span class="featured__materials-row"><span class="featured__material"><span style="margin-block:-0.11875000000000001em">Yellow gold</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Diamond</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Handmade</span></span></span></span><span aria-hidden="true" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:0;filter:blur(0.28em);visibility:hidden"><span class="featured__materials-row"><span class="featured__material"><span style="margin-block:-0.11875000000000001em">Yellow gold</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Peridot</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Diamonds</span></span></span></span><span aria-hidden="true" class="flex items-center justify-center" style="grid-area:1 / 1;opacity:0;filter:blur(0.28em);visibility:hidden"><span class="featured__materials-row"><span class="featured__material"><span style="margin-block:-0.11875000000000001em">White gold</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Sapphire</span></span><span class="featured__material"><span aria-hidden="true" class="featured__material-dot"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="block size-full"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg></span><span style="margin-block:-0.11875000000000001em">Diamonds</span></span></span></span></span></p></div></div><div class="featured__panel featured__panel--stage"><span class="featured__cue font-tight" style="opacity:0;transform:translate3d(0, 0.6154em, 0)"><span class="featured__cue-icon"><svg viewBox="0 0 10 10" fill="none" aria-hidden="true" focusable="false" class="block size-full"><path d="M8.22172 1.1763L8.87318 1.07542C9.12018 1.03695 9.28919 0.805527 9.25072 0.558556C9.21226 0.311584 8.98083 0.142546 8.73384 0.181015L6.94546 0.457888C6.69851 0.495933 6.52918 0.726957 6.56722 0.973907L6.84412 2.76245C6.88235 3.00944 7.11355 3.17867 7.36054 3.14043C7.60753 3.1022 7.77676 2.871 7.73853 2.62401L7.61865 1.84859C9.34166 3.28657 9.57272 5.84904 8.13477 7.57206C6.69682 9.29507 4.13432 9.52613 2.41131 8.08816C0.688297 6.65018 0.457231 4.08771 1.89518 2.3647C2.27754 1.90656 2.75611 1.53825 3.29688 1.28594C3.83765 1.03364 4.42735 0.903527 5.02409 0.904859C5.27394 0.904859 5.47649 0.702315 5.47649 0.452459C5.47649 0.202603 5.27394 5.94006e-05 5.02409 5.94006e-05C2.26272 -0.0132583 0.0133771 2.21451 5.94005e-05 4.97591C-0.0132583 7.7373 2.21451 9.98664 4.9759 9.99995C7.7373 10.0133 9.98663 7.7855 9.99995 5.02411C10.0035 4.29164 9.84604 3.56735 9.53876 2.90244C9.23148 2.23754 8.78186 1.64827 8.22172 1.1763Z" fill="currentColor"></path></svg></span><span style="margin-block:-0.018750000000000027em">Scroll to explore</span></span><span aria-hidden="true" class="featured__crosses" style="opacity:0;transform:scale(0.96)"><svg viewBox="0 0 17 17" fill="none" aria-hidden="true" focusable="false" class="featured__cross featured__cross--tl"><path d="M8.5 0c.638 0 1.154.517 1.154 1.155v6.19h6.19c.639 0 1.156.517 1.156 1.155s-.517 1.155-1.155 1.155h-6.19v6.19c0 .638-.517 1.155-1.155 1.155s-1.155-.517-1.155-1.155v-6.19h-6.19C.517 9.655 0 9.138 0 8.5s.517-1.155 1.155-1.155h6.19v-6.19C7.345.517 7.862 0 8.5 0Z" fill="currentColor" fill-opacity="0.2"></path></svg><svg viewBox="0 0 17 17" fill="none" aria-hidden="true" focusable="false" class="featured__cross featured__cross--tr"><path d="M8.5 0c.638 0 1.154.517 1.154 1.155v6.19h6.19c.639 0 1.156.517 1.156 1.155s-.517 1.155-1.155 1.155h-6.19v6.19c0 .638-.517 1.155-1.155 1.155s-1.155-.517-1.155-1.155v-6.19h-6.19C.517 9.655 0 9.138 0 8.5s.517-1.155 1.155-1.155h6.19v-6.19C7.345.517 7.862 0 8.5 0Z" fill="currentColor" fill-opacity="0.2"></path></svg><svg viewBox="0 0 17 17" fill="none" aria-hidden="true" focusable="false" class="featured__cross featured__cross--bl"><path d="M8.5 0c.638 0 1.154.517 1.154 1.155v6.19h6.19c.639 0 1.156.517 1.156 1.155s-.517 1.155-1.155 1.155h-6.19v6.19c0 .638-.517 1.155-1.155 1.155s-1.155-.517-1.155-1.155v-6.19h-6.19C.517 9.655 0 9.138 0 8.5s.517-1.155 1.155-1.155h6.19v-6.19C7.345.517 7.862 0 8.5 0Z" fill="currentColor" fill-opacity="0.2"></path></svg><svg viewBox="0 0 17 17" fill="none" aria-hidden="true" focusable="false" class="featured__cross featured__cross--br"><path d="M8.5 0c.638 0 1.154.517 1.154 1.155v6.19h6.19c.639 0 1.156.517 1.156 1.155s-.517 1.155-1.155 1.155h-6.19v6.19c0 .638-.517 1.155-1.155 1.155s-1.155-.517-1.155-1.155v-6.19h-6.19C.517 9.655 0 9.138 0 8.5s.517-1.155 1.155-1.155h6.19v-6.19C7.345.517 7.862 0 8.5 0Z" fill="currentColor" fill-opacity="0.2"></path></svg></span><div class="featured__rings"><div aria-hidden="true" class="featured__ring featured__ring--anchor"></div><div class="featured__ring" style="opacity:1;transform:translate3d(0.2041%, 0%, 0) scale(1)"><div class="absolute inset-0" style="opacity:1;transform:scale(1.7778)"><img alt="Rose-gold three-stone ring, round diamonds on crossed trellis prongs" loading="lazy" decoding="async" data-nimg="fill" class="featured__ring-plate" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-01.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-01.webp" crossorigin="anonymous"/></div></div><div class="featured__ring" style="opacity:0.6;transform:translate3d(106.0816%, 0.1887%, 0) scale(0.44694)"><div class="absolute inset-0" style="opacity:1;transform:scale(1.7778)"><img alt="Rose-gold split-shank solitaire with a white-gold four-prong head" loading="lazy" decoding="async" data-nimg="fill" class="featured__ring-plate" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-02.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-02.webp" crossorigin="anonymous"/></div></div><div class="featured__ring" style="opacity:0;transform:translate3d(159.5918%, 0.1887%, 0) scale(0.36)"><div class="absolute inset-0" style="opacity:1;transform:scale(1.7778)"><img alt="Yellow-gold solitaire, a round diamond held by six claws" loading="lazy" decoding="async" data-nimg="fill" class="featured__ring-plate" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-03.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-03.webp" crossorigin="anonymous"/></div></div><div class="featured__ring" style="opacity:0;transform:translate3d(159.5918%, 0.1887%, 0) scale(0.36)"><div class="absolute inset-0" style="opacity:1;transform:scale(1.7778)"><img alt="Yellow-gold ring with a round peridot, two side diamonds and a channel of small stones" loading="lazy" decoding="async" data-nimg="fill" class="featured__ring-plate" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-04.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-04.webp" crossorigin="anonymous"/></div></div><div class="featured__ring" style="opacity:0;transform:translate3d(159.5918%, 0.1887%, 0) scale(0.36)"><div class="absolute inset-0" style="opacity:1;transform:scale(1.7778)"><img alt="White-gold ring with a teal sapphire between two pear-cut diamonds" loading="lazy" decoding="async" data-nimg="fill" class="featured__ring-plate" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-05.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/featured/ring-05.webp" crossorigin="anonymous"/></div></div><div aria-hidden="true" class="featured__rings-canvas" style="opacity:0"></div></div><span class="featured__indicator"><button type="button" class="featured__dot"><span class="featured__dot-mark" style="opacity:1"></span><span class="sr-only">Ring 1 of 5</span></button><button type="button" class="featured__dot"><span class="featured__dot-mark" style="opacity:0.2"></span><span class="sr-only">Ring 2 of 5</span></button><button type="button" class="featured__dot"><span class="featured__dot-mark" style="opacity:0.2"></span><span class="sr-only">Ring 3 of 5</span></button><button type="button" class="featured__dot"><span class="featured__dot-mark" style="opacity:0.2"></span><span class="sr-only">Ring 4 of 5</span></button><button type="button" class="featured__dot"><span class="featured__dot-mark" style="opacity:0.2"></span><span class="sr-only">Ring 5 of 5</span></button></span></div></div></section></div></div><section class="philosophy"><div class="philosophy__backdrop"><div class="philosophy__backdrop-frame" style="transform:scale(1.08)"><picture><source media="(min-width: 1024px)" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/philosophy/backdrop-frame.webp"/><img alt="" decoding="async" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/philosophy/backdrop-frame-412.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/philosophy/backdrop-frame-412.webp" crossorigin="anonymous" class="philosophy__backdrop-plate"/></picture></div></div><div class="philosophy__card" style="opacity:0;transform:translate3d(0, 3%, 0)"><img alt="" loading="lazy" decoding="async" data-nimg="fill" class="philosophy__card-grain" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/paper.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/paper.webp" crossorigin="anonymous"/><div class="philosophy__top"><p class="philosophy__display" style="margin-block:-0.08750000000000002em"><span class="block! whitespace-nowrap " style="position:relative;column-gap:0.3em;display:flex;flex-wrap:wrap"><span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;user-select:none"><span class="italic">J</span><span>ewellery </span><span class="italic">D</span><span>oesn`t</span></span><span aria-hidden="true" style="display:contents"><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">J</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">w</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">l</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">l</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">r</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">y</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">D</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">o</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">s</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">n</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">`</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">t</span></span></span></span></span></p><div class="philosophy__note philosophy__note--top" style="opacity:0;transform:translate3d(0, 0.5em, 0)"><p class="philosophy__note-line" style="margin-block:-0.11875000000000001em">Some pieces blend in.</p><p class="philosophy__note-line philosophy__note-line--right" style="margin-block:-0.11875000000000001em">Ours don’t always try to.</p></div><p class="philosophy__display" style="margin-block:-0.08750000000000002em"><span class="block! whitespace-nowrap " style="position:relative;column-gap:0.3em;display:flex;flex-wrap:wrap"><span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;user-select:none"><span class="italic">N</span><span>eed T</span><span class="italic">o</span><span> B</span><span class="italic">e</span><span> Q</span><span class="italic">uite.</span></span><span aria-hidden="true" style="display:contents"><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">N</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">d</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">T</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">o</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">B</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">Q</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">u</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">i</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">t</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">.</span></span></span></span></span></p></div><p class="philosophy__display philosophy__shapes" style="margin-block:-0.08750000000000002em"><span class="block whitespace-nowrap "><span class="sr-only">We Like Unusual Shapes</span><span aria-hidden="true"><span class="inline-block! whitespace-nowrap " style="position:relative;column-gap:0.3em;display:flex;flex-wrap:wrap"><span style="display:contents"><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">W</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">L</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">i</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">k</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">U</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">n</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">u</span></span></span></span></span><span class="inline-block! whitespace-nowrap " style="position:relative;column-gap:0.3em;display:flex;flex-wrap:wrap"><span style="display:contents"><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">s</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">u</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">a</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">l</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">S</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">h</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">a</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">p</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">s</span></span></span></span></span></span></span></p><div class="philosophy__middle"><p class="philosophy__note-line philosophy__aside philosophy__aside--left" style="margin-block:-0.11875000000000001em;opacity:0;transform:translate3d(0, 0.5em, 0)">rough edges, unexpected details</p><div class="philosophy__frame" style="transform:none"><div class="philosophy__photo" style="opacity:0;transform:scale(1.06)"><img alt="A hand raised to the lips, two rings on the fingers" loading="lazy" decoding="async" data-nimg="fill" class="philosophy__photo-plate" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/philosophy/hand-with-ring.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/philosophy/hand-with-ring.webp" crossorigin="anonymous"/></div><button type="button" class="philosophy__cta" style="opacity:0;transform:translate3d(0, 0.6em, 0)"><span class="relative block overflow-hidden" style="margin-block:calc(0.4em * -1)"><span class="block will-change-transform" style="transform:translate3d(0, 0%, 0)"><span class="block" style="padding-block:0.4em"><span class="philosophy__cta-row"><span style="margin-block:-0.018750000000000027em">Our story</span><svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="philosophy__cta-icon"><path d="M0.536494 8.61122e-05C0.432686 -0.00183879 0.330845 0.0285492 0.245065 0.0870452C0.159286 0.145541 0.0938086 0.229253 0.0576941 0.326596C0.0215796 0.423939 0.0166136 0.5301 0.0434836 0.63039C0.0703536 0.730679 0.127731 0.820137 0.207676 0.886385L3.2672 3.5056L0.205786 6.12481C0.149856 6.16558 0.102986 6.2175 0.0681321 6.2773C0.0332782 6.3371 0.0111977 6.40347 0.00328418 6.47223C-0.00462938 6.54099 0.00179588 6.61064 0.0221543 6.67679C0.0425127 6.74294 0.0763624 6.80415 0.121567 6.85656C0.166772 6.90897 0.22235 6.95145 0.284794 6.9813C0.347237 7.01115 0.415191 7.02773 0.484367 7.03C0.553542 7.03227 0.622437 7.02018 0.686703 6.99448C0.750969 6.96879 0.809211 6.93005 0.857754 6.88072L4.3576 3.88922C4.41264 3.84221 4.45683 3.78382 4.48714 3.71808C4.51744 3.65234 4.53313 3.58082 4.53313 3.50843C4.53313 3.43605 4.51744 3.36452 4.48714 3.29878C4.45683 3.23305 4.41264 3.17466 4.3576 3.12765L0.857754 0.1267C0.768637 0.0484405 0.655042 0.00367061 0.536494 8.61122e-05Z" fill="currentColor" transform="translate(3.7308 2.4852)"></path></svg></span></span><span aria-hidden="true" class="absolute inset-x-0 top-full block" style="padding-block:0.4em"><span class="philosophy__cta-row"><span style="margin-block:-0.018750000000000027em">Our story</span><svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="philosophy__cta-icon"><path d="M0.536494 8.61122e-05C0.432686 -0.00183879 0.330845 0.0285492 0.245065 0.0870452C0.159286 0.145541 0.0938086 0.229253 0.0576941 0.326596C0.0215796 0.423939 0.0166136 0.5301 0.0434836 0.63039C0.0703536 0.730679 0.127731 0.820137 0.207676 0.886385L3.2672 3.5056L0.205786 6.12481C0.149856 6.16558 0.102986 6.2175 0.0681321 6.2773C0.0332782 6.3371 0.0111977 6.40347 0.00328418 6.47223C-0.00462938 6.54099 0.00179588 6.61064 0.0221543 6.67679C0.0425127 6.74294 0.0763624 6.80415 0.121567 6.85656C0.166772 6.90897 0.22235 6.95145 0.284794 6.9813C0.347237 7.01115 0.415191 7.02773 0.484367 7.03C0.553542 7.03227 0.622437 7.02018 0.686703 6.99448C0.750969 6.96879 0.809211 6.93005 0.857754 6.88072L4.3576 3.88922C4.41264 3.84221 4.45683 3.78382 4.48714 3.71808C4.51744 3.65234 4.53313 3.58082 4.53313 3.50843C4.53313 3.43605 4.51744 3.36452 4.48714 3.29878C4.45683 3.23305 4.41264 3.17466 4.3576 3.12765L0.857754 0.1267C0.768637 0.0484405 0.655042 0.00367061 0.536494 8.61122e-05Z" fill="currentColor" transform="translate(3.7308 2.4852)"></path></svg></span></span></span></span></button></div><p class="philosophy__note-line philosophy__aside philosophy__aside--right" style="margin-block:-0.11875000000000001em;opacity:0;transform:translate3d(0, 0.5em, 0)">and things<br/>that get better</p></div><div class="philosophy__bottom"><div class="philosophy__bottom-row"><p class="philosophy__display" style="margin-block:-0.08750000000000002em"><span class="block! whitespace-nowrap " style="position:relative;column-gap:0.3em;display:flex;flex-wrap:wrap"><span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;user-select:none"><span class="italic">T</span><span>he </span><span class="italic">L</span><span>onger </span><span class="italic">Y</span><span>ou</span></span><span aria-hidden="true" style="display:contents"><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">T</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">h</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">L</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">o</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">n</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">g</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">r</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">Y</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">o</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">u</span></span></span></span></span></p><div class="philosophy__note philosophy__note--bottom" style="opacity:0;transform:translate3d(0, 0.5em, 0)"><p class="philosophy__note-line" style="margin-block:-0.11875000000000001em">the kind of details that become more</p><p class="philosophy__note-line" style="margin-block:-0.11875000000000001em">interesting the longer you look</p></div><p class="philosophy__display" style="margin-block:-0.08750000000000002em"><span class="block! whitespace-nowrap " style="position:relative;column-gap:0.3em;display:flex;flex-wrap:wrap"><span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;user-select:none"><span class="italic">L</span><span>ook</span><span class="italic"> A</span><span>t</span><span class="italic"> T</span><span>hem.</span></span><span aria-hidden="true" style="display:contents"><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">L</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">o</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">o</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">k</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">A</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">t</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">T</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">h</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">m</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">.</span></span></span></span></span></p></div><p class="philosophy__display philosophy__keep" style="margin-block:-0.08750000000000002em"><span class="block whitespace-nowrap "><span class="sr-only">Keep It Interesting.</span><span aria-hidden="true"><span class="inline-block! whitespace-nowrap " style="position:relative;column-gap:0.3em;display:flex;flex-wrap:wrap"><span style="display:contents"><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">K</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">p</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">I</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">t</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class=""> </span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span class="italic"><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">I</span></span></span><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">n</span></span></span></span></span><span class="inline-block! whitespace-nowrap " style="position:relative;column-gap:0.3em;display:flex;flex-wrap:wrap"><span style="display:contents"><span style="overflow:initial;display:inline-block;user-select:auto" class="line-word"><span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">t</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">r</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">e</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">s</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">t</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">i</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">n</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">g</span><span style="display:inline-block;user-select:auto;opacity:0;filter:blur(0.28em)" class="">.</span></span></span></span></span></span></span></p></div></div></section><footer class="footer"><span class="footer__logo"><img alt="Lumière" loading="lazy" width="1536" height="1024" decoding="async" data-nimg="1" class="footer__mark" style="color:transparent;width:190.59%;height:251.16%;left:-48.82%;top:-60.47%" srcset="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/logo.webp" src="https://storage.getlayers.ai/assets/lumi-re-9893947dfd/hero/logo.webp" crossorigin="anonymous"/></span><nav class="footer__columns" aria-label="Footer"><div class="footer__column"><p class="footer__column-title" style="margin-block:-0.043000000000000024em">Shop</p><ul class="footer__list"><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Rings</a></li><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Necklaces</a></li><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Earrings</a></li><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Bracelets</a></li></ul></div><div class="footer__column"><p class="footer__column-title" style="margin-block:-0.043000000000000024em">Explore</p><ul class="footer__list"><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Collections</a></li><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Blog</a></li><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">About</a></li></ul></div><div class="footer__column"><p class="footer__column-title" style="margin-block:-0.043000000000000024em">Help</p><ul class="footer__list"><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Shipping &amp; Returns</a></li><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Materials &amp; Care</a></li><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">FAQ</a></li><li><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Contact</a></li></ul></div></nav><div class="footer__subscribe"><p class="footer__note" style="margin-block:-0.24300000000000002em">Notes on new pieces, collections &amp; things worth keeping.</p><form class="footer__field"><input type="email" required="" autoComplete="email" placeholder="Your e-mail" aria-label="Your e-mail" class="footer__input" style="margin-block:-0.043000000000000024em" name="email" value=""/><button type="submit" class="footer__submit"><span class="sr-only">Subscribe</span><svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="footer__arrow"><path d="M1.5 10.5H6.9V1.5M10.5 5.35714L6.9 1.5L3.3 5.35714" stroke="currentColor"></path></svg></button></form></div><span class="footer__rule" aria-hidden="true"></span><p class="footer__rights" style="margin-block:-0.043000000000000024em">Lumiére 2026. All rights reserved</p><ul class="footer__meta footer__meta--legal"><li class="footer__meta-item"><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Privacy Policy</a></li><li class="footer__meta-item"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="footer__dot"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg><a href="#" class="footer__link" style="margin-block:-0.043000000000000024em">Terms &amp; Conditions</a></li></ul><ul class="footer__meta footer__meta--social"><li class="footer__meta-item"><a href="#" class="footer__link footer__link--bright" style="margin-block:-0.043000000000000024em">Instagram</a></li><li class="footer__meta-item"><svg viewBox="0 0 4 4" fill="none" aria-hidden="true" focusable="false" class="footer__dot"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg><a href="#" class="footer__link footer__link--bright" style="margin-block:-0.043000000000000024em">TikTok</a></li></ul></footer></main>
</div></div>
```

## 3. The scene engine (verbatim, at the top of the module script)

`M_presets` holds the shared metals and gems. `M_gem` is the ray-traced gem material, and its two GLSL
shaders are the stones' look, character for character. `M_hdri` decodes the EXR studio, and `M_studio`
builds the PMREM environment. `M_pendant` is the hero pendant and `M_rings` the featured rings.

```js
import { BufferAttribute, Color, Vector3, Matrix3, Matrix4, ShaderMaterial, ClampToEdgeWrapping, DataTexture, EquirectangularReflectionMapping, LinearFilter, HalfFloatType, LinearMipmapLinearFilter, WebGLCubeRenderTarget, AdditiveBlending, BackSide, CubeCamera, DoubleSide, Mesh, PMREMGenerator, PlaneGeometry, Scene, SphereGeometry, AgXToneMapping, Box3, Group, MeshPhysicalMaterial, OrthographicCamera, WebGLRenderer, NeutralToneMapping, Sphere } from "three";
import { BVHShaderGLSL, MeshBVH, MeshBVHUniformStruct } from "three-mesh-bvh";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import Lenis from "lenis";

const EXR_WORKER_URL = URL.createObjectURL(new Blob(["import { HalfFloatType } from \"https://cdn.jsdelivr.net/npm/three@0.186.1/+esm\";\nimport { EXRLoader } from \"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/EXRLoader.js/+esm\";\nself.onmessage = async ({ data: url }) => {\n    try {\n        const response = await fetch(url);\n        if (!response.ok)\n            throw new Error(`${url}: ${response.status}`);\n        const loader = new EXRLoader();\n        loader.setDataType(HalfFloatType);\n        const { width, height, data, format, colorSpace, type } = loader.parse(await response.arrayBuffer());\n        if (!data)\n            throw new Error(`${url}: no pixel data`);\n        self.postMessage({ ok: true, texData: { width, height, data, format, colorSpace, type } }, { transfer: [data.buffer] });\n    }\n    catch (error) {\n        self.postMessage({ ok: false, error: String(error) });\n    }\n};\n"], { type: "text/javascript" }));

// ============================================================================
// SCENE ENGINE — lib/scene/** from the project, verbatim (types stripped)
// ============================================================================
const M_presets = (() => {

const YELLOW_GOLD = {
    color: new Color(1.0, 0.64, 0.2),
    roughness: 0.16,
};
const ROSE_GOLD = {
    color: new Color(0.96, 0.58, 0.46),
    roughness: 0.14,
};
const WHITE_GOLD = {
    color: new Color(0.86, 0.86, 0.88),
    roughness: 0.1,
};
const DIAMOND = {
    ior: 2.42,
    tint: new Color(1, 1, 1),
    absorption: new Vector3(0, 0, 0),
    dispersion: 0.044,
    fire: 1.0,
    highlight: 0.35,
    sparkle: { amount: 0.05, scale: 120 },
    blur: { refraction: 1.2, reflection: 1.6 },
    roomRadius: 2.0,
    polish: { amount: 0.03, scale: 12 },
    envYaw: 2.1,
    envKnee: 6,
    envSaturation: 0.3,
    intensity: 1.8,
};
const COLOURED_STONE = {
    fire: 1.0,
    highlight: 0.15,
    sparkle: { amount: 0.04, scale: 40 },
    blur: { refraction: 2.4, reflection: 2.6 },
    roomRadius: 2.0,
    polish: { amount: 0.06, scale: 1.6 },
    envYaw: 2.1,
    envKnee: 2.5,
    envSaturation: 0,
};
const PERIDOT = {
    ...COLOURED_STONE,
    ior: 1.67,
    tint: new Color(0.32, 0.56, 0.02),
    absorption: new Vector3(0.58, 0.22, 0.96).multiplyScalar(2.2),
    dispersion: 0.02,
    intensity: 1.7,
};
const TEAL_SAPPHIRE = {
    ...COLOURED_STONE,
    ior: 1.77,
    tint: new Color(0.0, 0.32, 0.34),
    absorption: new Vector3(0.95, 0.5, 0.45).multiplyScalar(2.6),
    dispersion: 0.018,
    intensity: 1.8,
};
const BLUR_REFERENCE_SIZE = 512;
const gemBlur = (blur, cubeSize) => {
    const shift = Math.log2(cubeSize / BLUR_REFERENCE_SIZE);
    return {
        refraction: Math.max(0, blur.refraction + shift),
        reflection: Math.max(0, blur.reflection + shift),
    };
};
const toFloatPositions = (geometry) => {
    const source = geometry.getAttribute("position");
    if (source.array instanceof Float32Array && !source.normalized)
        return;
    const values = new Float32Array(source.count * 3);
    for (let i = 0; i < source.count; i += 1) {
        values[i * 3] = source.getX(i);
        values[i * 3 + 1] = source.getY(i);
        values[i * 3 + 2] = source.getZ(i);
    }
    geometry.setAttribute("position", new BufferAttribute(values, 3));
};

return { YELLOW_GOLD, ROSE_GOLD, WHITE_GOLD, DIAMOND, PERIDOT, TEAL_SAPPHIRE, gemBlur, toFloatPositions };
})();

const M_gem = (() => {

const vertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    // Object-space, but in world-sized units: the GLB may carry quantised
    // positions with the dequantising scale on the node.
    vLocalPosition = position * vec3(
      length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)
    );
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;
const fragmentShader = `
  ${BVHShaderGLSL.bvh_struct_definitions}
  ${BVHShaderGLSL.common_functions}
  ${BVHShaderGLSL.bvh_ray_functions}

  uniform BVH bvh;
  uniform samplerCube envMap;
  uniform mat4 uModelMatrix;
  uniform mat4 uModelInverse;
  uniform float uIor;
  uniform float uDispersion;
  uniform float uFire;
  uniform float uHighlight;
  uniform vec2 uSparkle;
  uniform vec3 uTint;
  uniform vec3 uAbsorption;
  uniform float uIntensity;
  uniform vec2 uBlur;
  uniform vec3 uEnvCenter;
  uniform float uEnvRadius;
  uniform vec2 uWave;
  uniform mat3 uEnvRotation;
  uniform float uEnvKnee;
  uniform float uEnvSaturation;
  uniform float uOpacity;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPosition;

  // Sampled from a blurred mip, not the sharp base level: a real stone sees a
  // soft room, so each facet carries a gradient instead of a hard-edged cut-out.
  // A photographed room holds a window hundreds of times brighter than its
  // walls. Seen through a coloured stone at that level, the tint burns out to
  // white, so radiance rolls off toward uEnvKnee — highlights stay bright but
  // keep the stone's colour.
  //
  // The room's own colours are then pulled toward grey by uEnvSaturation. A
  // furnished room seen through a green stone mixed its yellow chair, wood
  // floor and blue window into olive and brown; jewellery is shot in a neutral
  // studio so the stone alone colours the light.
  vec3 sampleEnv(vec3 direction, float lod) {
    vec3 radiance = textureLod(envMap, uEnvRotation * direction, lod).rgb;
    float peak = max(radiance.r, max(radiance.g, radiance.b));
    radiance *= uEnvKnee / (uEnvKnee + peak);
    float luma = dot(radiance, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(luma), radiance, uEnvSaturation);
  }
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  // Smooth value noise, so the grain reads as glitter rather than pixel static.
  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
          mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
          mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  // The room is not at infinity. Treat it as a sphere of radius uEnvRadius
  // around the stone and look the cube up toward where the ray actually hits
  // it. Two pixels of one flat facet then leave from different points and see
  // different parts of the room, so the facet carries a gradient instead of a
  // single flat fill. With an infinitely distant room and a parallel
  // (orthographic) view, every pixel of a facet read the same texel.
  vec3 roomLookup(vec3 point, vec3 direction) {
    vec3 offset = point - uEnvCenter;
    float b = dot(offset, direction);
    float c = dot(offset, offset) - uEnvRadius * uEnvRadius;
    float t = -b + sqrt(max(b * b - c, 0.0));
    return normalize(offset + direction * t);
  }

  // Low-frequency waviness on the polished surface: real facets are never
  // optically flat, and the slight wander is what makes their reflections look
  // photographed rather than drawn.
  vec3 polishWave(vec3 p) {
    return vec3(
      valueNoise(p),
      valueNoise(p + vec3(17.1, 3.7, 9.2)),
      valueNoise(p + vec3(5.3, 21.9, 13.4))
    ) - 0.5;
  }

  // Returns the world-space direction the ray leaves the stone in; also the
  // world-space distance it travelled inside and the world point it left from.
  vec3 traceExit(vec3 viewDir, vec3 normal, float ior, out float travelled, out vec3 exitPoint) {
    travelled = 0.0;
    vec3 entry = refract(viewDir, normal, 1.0 / ior);
    vec3 rayOrigin = (uModelInverse * vec4(vWorldPosition, 1.0)).xyz;
    vec3 rayDirection = normalize((uModelInverse * vec4(entry, 0.0)).xyz);
    rayOrigin += rayDirection * 1e-4;

    for (int i = 0; i < BOUNCES; i++) {
      uvec4 faceIndices = uvec4(0u);
      vec3 faceNormal = vec3(0.0, 0.0, 1.0);
      vec3 barycoord = vec3(0.0);
      float side = 1.0;
      float dist = 0.0;
      bool hit = bvhIntersectFirstHit(bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist);
      if (!hit) break;

      travelled += dist * length((uModelMatrix * vec4(rayDirection, 0.0)).xyz);
      vec3 hitPosition = rayOrigin + rayDirection * dist;
      // faceNormal is flipped to face the incoming ray, so this is the
      // stone-to-air refraction at the far facet.
      vec3 exitDirection = refract(rayDirection, faceNormal, ior);
      if (dot(exitDirection, exitDirection) > 0.0) {
        rayDirection = exitDirection;
        rayOrigin = hitPosition;
        break;
      }
      rayDirection = reflect(rayDirection, faceNormal);
      rayOrigin = hitPosition + rayDirection * 1e-4;
    }

    exitPoint = (uModelMatrix * vec4(rayOrigin, 1.0)).xyz;
    return normalize((uModelMatrix * vec4(rayDirection, 0.0)).xyz);
  }

  // As traceExit, at one index, also reporting the ray inside the stone and
  // the facet it leaves through — so each colour can be split there.
  vec3 traceExitAt(vec3 viewDir, vec3 normal, float ior, out float travelled, out vec3 exitPoint, out vec3 insideDir, out vec3 exitNormal, out bool exited) {
    travelled = 0.0;
    exited = false;
    insideDir = vec3(0.0);
    exitNormal = vec3(0.0, 0.0, 1.0);
    vec3 entry = refract(viewDir, normal, 1.0 / ior);
    vec3 rayOrigin = (uModelInverse * vec4(vWorldPosition, 1.0)).xyz;
    vec3 rayDirection = normalize((uModelInverse * vec4(entry, 0.0)).xyz);
    rayOrigin += rayDirection * 1e-4;

    for (int i = 0; i < BOUNCES; i++) {
      uvec4 faceIndices = uvec4(0u);
      vec3 faceNormal = vec3(0.0, 0.0, 1.0);
      vec3 barycoord = vec3(0.0);
      float side = 1.0;
      float dist = 0.0;
      bool hit = bvhIntersectFirstHit(bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist);
      if (!hit) break;

      travelled += dist * length((uModelMatrix * vec4(rayDirection, 0.0)).xyz);
      vec3 hitPosition = rayOrigin + rayDirection * dist;
      vec3 exitDirection = refract(rayDirection, faceNormal, ior);
      if (dot(exitDirection, exitDirection) > 0.0) {
        insideDir = rayDirection;
        exitNormal = faceNormal;
        exited = true;
        rayDirection = exitDirection;
        rayOrigin = hitPosition;
        break;
      }
      rayDirection = reflect(rayDirection, faceNormal);
      rayOrigin = hitPosition + rayDirection * 1e-4;
    }

    exitPoint = (uModelMatrix * vec4(rayOrigin, 1.0)).xyz;
    return normalize((uModelMatrix * vec4(rayDirection, 0.0)).xyz);
  }

  // One colour's way out through the exit facet, at its own index; where that
  // colour is held inside (total internal reflection), it leaves with green.
  vec3 splitExit(vec3 insideDir, vec3 exitNormal, float ior, vec3 fallback) {
    vec3 out_ = refract(insideDir, exitNormal, ior);
    if (dot(out_, out_) <= 0.0) return fallback;
    return normalize((uModelMatrix * vec4(out_, 0.0)).xyz);
  }

  vec3 refractedLight(vec3 viewDir, vec3 normal, float ior, out float travelled) {
    vec3 exitPoint;
    vec3 exitDirection = traceExit(viewDir, normal, ior, travelled, exitPoint);
    return sampleEnv(roomLookup(exitPoint, exitDirection), uBlur.x);
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = isOrthographic
      ? normalize(vec3(-viewMatrix[0][2], -viewMatrix[1][2], -viewMatrix[2][2]))
      : normalize(vWorldPosition - cameraPosition);
    if (dot(normal, viewDir) > 0.0) normal = -normal;
    normal = normalize(normal + polishWave(vLocalPosition * uWave.y) * uWave.x);

    float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
    float cosTheta = clamp(dot(-viewDir, normal), 0.0, 1.0);
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
    vec3 reflection = sampleEnv(roomLookup(vWorldPosition, reflect(viewDir, normal)), uBlur.y);

    vec3 refraction;
    #if DISPERSION == 2
      // One path through the stone, at green's index; red and blue part from
      // it at the facet the light leaves through, where the fire is made.
      // A third of the full split's cost (three traces): the diamonds' halo
      // ran at 46–66 fps with it on an M1 Pro, 120 without.
      float travelled;
      vec3 exitPoint;
      vec3 insideDir;
      vec3 exitNormal;
      bool exited;
      vec3 dirG = traceExitAt(viewDir, normal, uIor, travelled, exitPoint, insideDir, exitNormal, exited);
      vec3 dirR = exited ? splitExit(insideDir, exitNormal, uIor - uDispersion, dirG) : dirG;
      vec3 dirB = exited ? splitExit(insideDir, exitNormal, uIor + uDispersion, dirG) : dirG;
      refraction.r = sampleEnv(roomLookup(exitPoint, dirR), uBlur.x).r;
      refraction.g = sampleEnv(roomLookup(exitPoint, dirG), uBlur.x).g;
      refraction.b = sampleEnv(roomLookup(exitPoint, dirB), uBlur.x).b;
      refraction *= exp(-uAbsorption * travelled);
      float luma = dot(refraction, vec3(0.2126, 0.7152, 0.0722));
      refraction = max(mix(vec3(luma), refraction, uFire), 0.0);
    #elif DISPERSION
      // Each channel takes its own path through the stone, and pays its own
      // absorption for it — where the paths part at a facet edge, the light
      // splits into a fringe.
      float travelledR;
      float travelledG;
      float travelledB;
      refraction.r = refractedLight(viewDir, normal, uIor - uDispersion, travelledR).r;
      refraction.g = refractedLight(viewDir, normal, uIor, travelledG).g;
      refraction.b = refractedLight(viewDir, normal, uIor + uDispersion, travelledB).b;
      refraction *= exp(-uAbsorption * vec3(travelledR, travelledG, travelledB));
      float luma = dot(refraction, vec3(0.2126, 0.7152, 0.0722));
      refraction = max(mix(vec3(luma), refraction, uFire), 0.0);
    #else
      float travelled;
      refraction = refractedLight(viewDir, normal, uIor, travelled);
      refraction *= exp(-uAbsorption * travelled);
    #endif
    refraction *= uTint;

    vec3 color = mix(refraction, reflection, fresnel);
    // Lift what is already bright, so lit facets flare against dark ones.
    float peak = max(color.r, max(color.g, color.b));
    color += color * smoothstep(0.5, 1.5, peak) * uHighlight;
    // Grain fixed to the stone: it travels with the facets as the piece turns.
    float grain = valueNoise(vLocalPosition * uSparkle.y) - 0.5;
    color *= 1.0 + grain * 2.0 * uSparkle.x;

    gl_FragColor = vec4(color * uIntensity, uOpacity);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const createGemMaterial = (geometry, envMap, options) => {
    const bvh = new MeshBVH(geometry);
    const bvhStruct = new MeshBVHUniformStruct();
    bvhStruct.updateFrom(bvh);
    const modelMatrix = new Matrix4();
    const modelInverse = new Matrix4();
    geometry.computeBoundingSphere();
    const localCentre = geometry.boundingSphere?.center.clone() ?? new Vector3();
    const envCentre = new Vector3();
    const material = new ShaderMaterial({
        defines: {
            BOUNCES: Math.max(1, Math.round(options.bounces)),
            DISPERSION: options.dispersion > 0 ? 2 : 0,
        },
        uniforms: {
            bvh: { value: bvhStruct },
            envMap: { value: envMap },
            uModelMatrix: { value: modelMatrix },
            uModelInverse: { value: modelInverse },
            uIor: { value: options.ior },
            uDispersion: { value: options.dispersion },
            uFire: { value: options.fire },
            uHighlight: { value: options.highlight },
            uSparkle: { value: [options.sparkle.amount, options.sparkle.scale] },
            uTint: { value: options.tint },
            uAbsorption: { value: options.absorption },
            uIntensity: { value: options.intensity },
            uBlur: { value: [options.blur.refraction, options.blur.reflection] },
            uEnvCenter: { value: envCentre },
            uEnvRadius: { value: options.roomRadius },
            uWave: { value: [options.polish.amount, options.polish.scale] },
            uEnvRotation: {
                value: new Matrix3().setFromMatrix4(new Matrix4().makeRotationY(options.envYaw)),
            },
            uEnvKnee: { value: options.envKnee },
            uEnvSaturation: { value: options.envSaturation },
            uOpacity: { value: 1 },
        },
        vertexShader,
        fragmentShader,
    });
    return {
        material,
        attach: (mesh) => {
            mesh.onBeforeRender = () => {
                modelMatrix.copy(mesh.matrixWorld);
                modelInverse.copy(mesh.matrixWorld).invert();
                envCentre.copy(localCentre).applyMatrix4(mesh.matrixWorld);
            };
        },
        setOpacity: (opacity) => {
            material.uniforms.uOpacity.value = opacity;
        },
        dispose: () => {
            bvhStruct.dispose();
            material.dispose();
        },
    };
};

return { createGemMaterial };
})();

const M_hdri = (() => {

const STUDIO_HDRI_URL = "https://storage.getlayers.ai/assets/lumi-re-9893947dfd/env/hotel-room.exr";
const decoded = new Map();
const decodeInWorker = (url) => new Promise((resolve, reject) => {
    const worker = new Worker(EXR_WORKER_URL, { type: "module" });
    worker.onmessage = ({ data, }) => {
        worker.terminate();
        if (!data.ok || !data.texData) {
            reject(new Error(data.error ?? "EXR worker failed"));
            return;
        }
        const { width, height, format, type, colorSpace } = data.texData;
        const texture = new DataTexture(data.texData.data, width, height, format, type, undefined, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearFilter, 1, colorSpace);
        texture.needsUpdate = true;
        resolve(texture);
    };
    worker.onerror = (event) => {
        worker.terminate();
        reject(new Error(event.message));
    };
    worker.postMessage(new URL(url, location.href).href);
});
const decodeOnMainThread = (url) => {
    const loader = new EXRLoader();
    loader.setDataType(HalfFloatType);
    return loader.loadAsync(url);
};
const decodeExr = (url) => {
    const cached = decoded.get(url);
    if (cached)
        return cached;
    const pending = (typeof Worker === "undefined"
        ? decodeOnMainThread(url)
        : decodeInWorker(url).catch(() => decodeOnMainThread(url))).then((texture) => {
        texture.mapping = EquirectangularReflectionMapping;
        return texture;
    });
    pending.catch(() => decoded.delete(url));
    decoded.set(url, pending);
    return pending;
};
const loadHdriCube = async (renderer, url, size) => {
    const texture = await decodeExr(url);
    const target = new WebGLCubeRenderTarget(size, {
        type: HalfFloatType,
        generateMipmaps: true,
        minFilter: LinearMipmapLinearFilter,
    });
    target.fromEquirectangularTexture(renderer, texture);
    texture.dispose();
    return { cube: target.texture, size, dispose: () => target.dispose() };
};

return { STUDIO_HDRI_URL, loadHdriCube };
})();

const M_studio = (() => {

const WARM = [1, 0.95, 0.88];
const WHITE = [1, 1, 1];
const area = (position, side, watts, color = WARM) => ({
    position,
    size: [side, side],
    radiance: watts / (Math.PI * side * side),
    color,
});
const SKY_RADIUS = 50;
const LIGHT_STUDIO = {
    panels: [
        area([-4, 5, 6], 3, 900),
        area([5, 1, 5], 4, 350, [1, 0.9, 0.8]),
        area([2, 4, -5], 3, 500),
        area([0, 7, 2], 2, 400),
        area([-2.5, 1.5, 8], 0.6, 250, WHITE),
        area([2.8, -1, 7], 0.6, 250, WHITE),
        { position: [0, 3, 7], size: [5, 1.5], radiance: 6, color: WHITE },
        { position: [-6, 1, 4], size: [1.5, 6], radiance: 5, color: WHITE },
        { position: [6, 0, 3], size: [1.5, 6], radiance: 4, color: WHITE },
    ],
    sky: {
        low: new Color(0.18, 0.15, 0.12),
        high: new Color(1.0, 0.92, 0.8),
        lowAt: 0.3,
        highAt: 0.7,
        strength: 1.2,
        variation: 0.4,
    },
    panelGain: 1.2,
    cubeSize: 256,
    feather: 0.25,
};
const DARK_STUDIO = {
    panels: [
        { position: [-1.2, 2.6, 8], size: [6, 3], radiance: 4.2, color: WARM },
        { position: [-5, 3.5, 3.5], size: [4.5, 5], radiance: 4.5, color: WARM },
        { position: [5.5, 1.5, 2], size: [3.5, 6], radiance: 3, color: WARM },
        { position: [0, 8, 0], size: [9, 7], radiance: 2.6, color: WHITE },
        { position: [-7, 0, -0.5], size: [0.9, 9], radiance: 14, color: WHITE },
        { position: [7, 0.5, -1], size: [0.9, 9], radiance: 11, color: WHITE },
        { position: [1, 3, -7], size: [8, 1.4], radiance: 6, color: WHITE },
        { position: [3.2, 0.8, 7.5], size: [1.2, 1.2], radiance: 12, color: WHITE },
        { position: [0, -2.5, 8], size: [9, 2], radiance: 1, color: WARM },
        { position: [0, -7, 1], size: [14, 12], radiance: 0.5, color: WARM },
    ],
    sky: {
        low: new Color(0.02, 0.016, 0.012),
        high: new Color(0.13, 0.12, 0.105),
        lowAt: -0.4,
        highAt: 0.9,
        strength: 1,
        variation: 0.5,
    },
    panelGain: 1,
    cubeSize: 512,
    feather: 0.12,
};
const createStudioEnvironment = (renderer, rig = LIGHT_STUDIO) => {
    const { sky } = rig;
    const scene = new Scene();
    const disposables = [];
    const skyGeometry = new SphereGeometry(SKY_RADIUS, 48, 24);
    const skyMaterial = new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        uniforms: {
            uLow: { value: sky.low },
            uHigh: { value: sky.high },
            uRange: { value: [sky.lowAt, sky.highAt] },
            uStrength: { value: sky.strength },
            uVariation: { value: sky.variation },
        },
        vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform vec3 uLow;
      uniform vec3 uHigh;
      uniform vec2 uRange;
      uniform float uStrength;
      uniform float uVariation;
      varying vec3 vDirection;

      float hash13(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.zyx + 31.32);
        return fract((p.x + p.y) * p.z);
      }
      float valueNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
              mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
          mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
              mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
          f.z);
      }
      float fbm(vec3 p) {
        return valueNoise(p) * 0.55 + valueNoise(p * 2.1) * 0.3 + valueNoise(p * 4.3) * 0.15;
      }

      void main() {
        vec3 d = normalize(vDirection);
        float t = clamp((d.y - uRange.x) / (uRange.y - uRange.x), 0.0, 1.0);
        float cloud = fbm(d * 2.6 + 7.0);
        float bands = 0.5 + 0.5 * sin(d.y * 7.0 + cloud * 3.0);
        float variation = mix(1.0 - uVariation, 1.0 + uVariation, cloud * 0.6 + bands * 0.4);
        gl_FragColor = vec4(mix(uLow, uHigh, t) * uStrength * variation, 1.0);
      }
    `,
    });
    scene.add(new Mesh(skyGeometry, skyMaterial));
    disposables.push(skyGeometry, skyMaterial);
    const origin = new Vector3();
    for (const panel of rig.panels) {
        const geometry = new PlaneGeometry(panel.size[0], panel.size[1]);
        const material = softboxMaterial(new Color(...panel.color).multiplyScalar(panel.radiance * rig.panelGain), rig.feather);
        const mesh = new Mesh(geometry, material);
        mesh.position.set(...panel.position);
        mesh.lookAt(origin);
        scene.add(mesh);
        disposables.push(geometry, material);
    }
    const studioTarget = new WebGLCubeRenderTarget(rig.cubeSize, {
        type: HalfFloatType,
    });
    new CubeCamera(0.1, SKY_RADIUS * 2, studioTarget).update(renderer, scene);
    const pmrem = new PMREMGenerator(renderer);
    const radianceTarget = pmrem.fromCubemap(studioTarget.texture);
    pmrem.dispose();
    studioTarget.dispose();
    disposables.forEach((item) => item.dispose());
    return {
        radiance: radianceTarget.texture,
        dispose: () => radianceTarget.dispose(),
    };
};
const softboxMaterial = (color, feather) => new ShaderMaterial({
    side: DoubleSide,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    uniforms: { uColor: { value: color }, uFeather: { value: feather } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uFeather;
      varying vec2 vUv;
      void main() {
        vec2 offset = vUv - 0.5;
        vec2 edge = min(vUv, 1.0 - vUv);
        float feather = smoothstep(0.0, uFeather, edge.x) * smoothstep(0.0, uFeather, edge.y);
        float falloff = feather * (0.7 + 0.6 * exp(-dot(offset, offset) * 6.0));
        gl_FragColor = vec4(uColor * falloff, 1.0);
      }
    `,
});

return { LIGHT_STUDIO, DARK_STUDIO, createStudioEnvironment };
})();

const M_pendant = (() => {
const { DIAMOND, YELLOW_GOLD, gemBlur, toFloatPositions } = M_presets;
const { createGemMaterial } = M_gem;
const { STUDIO_HDRI_URL, loadHdriCube } = M_hdri;
const { createStudioEnvironment } = M_studio;
const PENDANT_MODEL_URL = "https://storage.getlayers.ai/assets/lumi-re-9893947dfd/models/pendant-emerald.glb";
const EMERALD = {
    ior: 1.58,
    tint: new Color(0.02, 0.58, 0.16),
    absorption: new Vector3(0.95, 0.25, 0.75).multiplyScalar(1.2),
    dispersion: 0.014,
    fire: 1.0,
    highlight: 0.15,
    sparkle: { amount: 0.04, scale: 40 },
    blur: { refraction: 2.4, reflection: 2.6 },
    roomRadius: 2.0,
    polish: { amount: 0.06, scale: 1.6 },
    envYaw: 2.1,
    envKnee: 2.5,
    envSaturation: 0,
    intensity: 1.85,
};
const NODE = {
    emerald: "Emerald",
    diamonds: ["Halo_Diamonds", "Bail_Diamonds"],
    halo: "Halo_Gallery",
};
const IDLE_YAW = { amplitude: 0.2, speed: 0.38 };
const CAMERA_DEPTH = 40;
const isMesh = (object) => object.isMesh === true;
class PendantScene {
    budget;
    isAnimated;
    renderer;
    scene = new Scene();
    camera = new OrthographicCamera();
    pivot = new Group();
    environment;
    gems = [];
    gold;
    hdri = null;
    haloWidth = 2;
    tilt = { yaw: 0, pitch: 0 };
    isDirty = true;
    constructor(canvas, budget, isAnimated) {
        this.budget = budget;
        this.isAnimated = isAnimated;
        this.renderer = new WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.toneMapping = AgXToneMapping;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, budget.maxPixelRatio));
        this.environment = createStudioEnvironment(this.renderer);
        this.scene.environment = this.environment.radiance;
        this.gold = new MeshPhysicalMaterial({
            color: YELLOW_GOLD.color,
            metalness: 1,
            roughness: YELLOW_GOLD.roughness,
            envMapIntensity: 1,
        });
        this.camera.near = 0.1;
        this.camera.far = CAMERA_DEPTH * 2;
        this.camera.position.set(0, 0, CAMERA_DEPTH);
        this.scene.add(this.pivot);
    }
    static async create(canvas, budget, isAnimated) {
        const instance = new PendantScene(canvas, budget, isAnimated);
        await instance.load();
        return instance;
    }
    async load() {
        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        const [gltf, hdri] = await Promise.all([
            loader.loadAsync(PENDANT_MODEL_URL),
            loadHdriCube(this.renderer, STUDIO_HDRI_URL, this.budget.gemCubeSize),
        ]);
        this.hdri = hdri;
        const model = gltf.scene;
        model.updateMatrixWorld(true);
        const halo = model.getObjectByName(NODE.halo);
        if (halo) {
            const size = new Box3().setFromObject(halo).getSize(new Vector3());
            this.haloWidth = size.x;
        }
        const replaced = [];
        model.traverse((object) => {
            if (!isMesh(object))
                return;
            const previous = object.material;
            replaced.push(...(Array.isArray(previous) ? previous : [previous]));
            const isEmerald = object.name === NODE.emerald;
            const isDiamond = NODE.diamonds.includes(object.name);
            if (!isEmerald && !isDiamond) {
                object.material = this.gold;
                return;
            }
            toFloatPositions(object.geometry);
            const stone = isEmerald ? EMERALD : DIAMOND;
            const gem = createGemMaterial(object.geometry, hdri.cube, {
                ...stone,
                bounces: isEmerald
                    ? this.budget.emeraldBounces
                    : this.budget.diamondBounces,
                dispersion: this.budget.gemDispersion ? stone.dispersion : 0,
                blur: gemBlur(stone.blur, hdri.size),
            });
            gem.attach(object);
            object.material = gem.material;
            this.gems.push(gem);
        });
        replaced.forEach((material) => material.dispose());
        this.pivot.add(model);
        await this.renderer.compileAsync(this.scene, this.camera);
    }
    setSize(width, height, framing) {
        if (width <= 0 || height <= 0)
            return;
        this.renderer.setSize(width, height, false);
        const unitsPerPx = this.haloWidth / (framing.span * width);
        const halfWidth = (width * unitsPerPx) / 2;
        const halfHeight = (height * unitsPerPx) / 2;
        this.camera.left = -halfWidth;
        this.camera.right = halfWidth;
        this.camera.top = halfHeight;
        this.camera.bottom = -halfHeight;
        this.camera.position.y = (framing.centre - 0.5) * height * unitsPerPx;
        this.camera.updateProjectionMatrix();
        this.isDirty = true;
    }
    setTilt(yaw, pitch) {
        if (!this.isAnimated)
            return;
        this.tilt.yaw = yaw;
        this.tilt.pitch = pitch;
    }
    render(timeMs) {
        if (!this.isAnimated && !this.isDirty)
            return;
        if (this.isAnimated) {
            const time = timeMs / 1000;
            this.pivot.rotation.y =
                Math.sin(time * IDLE_YAW.speed) * IDLE_YAW.amplitude + this.tilt.yaw;
            this.pivot.rotation.x = -this.tilt.pitch;
        }
        this.renderer.render(this.scene, this.camera);
        this.isDirty = false;
    }
    dispose() {
        this.scene.traverse((object) => {
            if (isMesh(object))
                object.geometry.dispose();
        });
        this.gems.forEach((gem) => gem.dispose());
        this.gold.dispose();
        this.environment.dispose();
        this.hdri?.dispose();
        this.renderer.dispose();
        this.renderer.forceContextLoss();
    }
}

return { PENDANT_MODEL_URL, PendantScene };
})();

const M_rings = (() => {
const { DIAMOND, PERIDOT, TEAL_SAPPHIRE, gemBlur, toFloatPositions } = M_presets;
const { createGemMaterial } = M_gem;
const { STUDIO_HDRI_URL, loadHdriCube } = M_hdri;
const { DARK_STUDIO, createStudioEnvironment } = M_studio;
const RING_REST_VIEW = { yaw: 0.55, tilt: 0.3 };
const GEMS = {
    Diamond: { preset: DIAMOND, coloured: false },
    Peridot: { preset: PERIDOT, coloured: true },
    Teal_Sapphire: { preset: TEAL_SAPPHIRE, coloured: true },
};
const RING_METALS = {
    Yellow_Gold: {
        color: new Color(1.0, 0.69, 0.28),
        roughness: 0.07,
    },
    Rose_Gold: { color: new Color(0.96, 0.67, 0.57), roughness: 0.07 },
    White_Gold: { color: new Color(0.86, 0.86, 0.87), roughness: 0.05 },
};
const REFERENCE_RADIUS = 1.3;
const CAMERA_DEPTH = 50;
const HIDDEN_BELOW = 0.005;
const fadeAfterToneMapping = (material, fade) => {
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uRingFade = fade;
        shader.fragmentShader = shader.fragmentShader
            .replace("void main() {", "uniform float uRingFade;\nvoid main() {")
            .replace("#include <dithering_fragment>", "#include <dithering_fragment>\n  gl_FragColor.rgb *= uRingFade;");
    };
};
const isMesh = (object) => object.isMesh === true;
const yieldTask = () => new Promise((resolve) => setTimeout(resolve, 0));
class RingsScene {
    budget;
    renderer;
    scene = new Scene();
    camera = new OrthographicCamera();
    environment = null;
    hdri = null;
    rings = [];
    width = 1;
    height = 1;
    unitPx = 100;
    constructor(canvas, budget) {
        this.budget = budget;
        this.renderer = new WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.toneMapping = NeutralToneMapping;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, budget.maxPixelRatio));
        this.camera.near = 0.1;
        this.camera.far = CAMERA_DEPTH * 2;
        this.camera.position.set(0, 0, CAMERA_DEPTH);
    }
    static async create(canvas, budget, sources) {
        const instance = new RingsScene(canvas, budget);
        await yieldTask();
        instance.environment = createStudioEnvironment(instance.renderer, DARK_STUDIO);
        instance.scene.environment = instance.environment.radiance;
        await yieldTask();
        await instance.load(sources);
        return instance;
    }
    async load(sources) {
        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        const [hdri, ...gltfs] = await Promise.all([
            loadHdriCube(this.renderer, STUDIO_HDRI_URL, this.budget.gemCubeSize),
            ...sources.map((source) => loader.loadAsync(source.url)),
        ]);
        this.hdri = hdri;
        for (const [index, gltf] of gltfs.entries()) {
            const pose = sources[index];
            const model = gltf.scene;
            model.updateMatrixWorld(true);
            const bounds = new Box3().setFromObject(model);
            const sphere = bounds.getBoundingSphere(new Sphere());
            model.position.sub(bounds.getCenter(new Vector3()));
            const spin = new Group();
            spin.rotation.y = RING_REST_VIEW.yaw;
            spin.add(model);
            const tilt = new Group();
            tilt.rotation.x = RING_REST_VIEW.tilt + pose.pitch;
            tilt.add(spin);
            const roll = new Group();
            roll.rotation.z = pose.roll;
            roll.add(tilt);
            const outer = new Group();
            outer.add(roll);
            outer.visible = false;
            this.scene.add(outer);
            const entry = {
                outer,
                spin,
                radius: sphere.radius,
                metals: [],
                fade: { value: 1 },
                gems: [],
            };
            const metalByName = new Map();
            const replaced = [];
            model.traverse((object) => {
                if (!isMesh(object))
                    return;
                const source = object.material;
                replaced.push(source);
                const gem = GEMS[source.name];
                if (gem) {
                    toFloatPositions(object.geometry);
                    const material = createGemMaterial(object.geometry, hdri.cube, {
                        ...gem.preset,
                        bounces: gem.coloured
                            ? this.budget.emeraldBounces
                            : this.budget.diamondBounces,
                        dispersion: this.budget.gemDispersion ? gem.preset.dispersion : 0,
                        blur: gemBlur(gem.preset.blur, hdri.size),
                    });
                    material.material.transparent = true;
                    material.attach(object);
                    object.material = material.material;
                    entry.gems.push(material);
                    return;
                }
                const preset = RING_METALS[source.name] ?? RING_METALS.Yellow_Gold;
                let metal = metalByName.get(source.name);
                if (!metal) {
                    metal = new MeshPhysicalMaterial({
                        color: preset.color,
                        metalness: 1,
                        roughness: preset.roughness,
                    });
                    fadeAfterToneMapping(metal, entry.fade);
                    metalByName.set(source.name, metal);
                    entry.metals.push(metal);
                }
                object.material = metal;
            });
            replaced.forEach((material) => material.dispose());
            this.rings.push(entry);
            await yieldTask();
        }
        this.rings.forEach((ring) => (ring.outer.visible = true));
        await this.renderer.compileAsync(this.scene, this.camera);
        this.rings.forEach((ring) => (ring.outer.visible = false));
    }
    setSize(width, height, centreSize) {
        if (width <= 0 || height <= 0 || centreSize <= 0)
            return;
        this.width = width;
        this.height = height;
        this.renderer.setSize(width, height, false);
        this.unitPx = centreSize / (2 * REFERENCE_RADIUS);
        const halfWidth = width / 2 / this.unitPx;
        const halfHeight = height / 2 / this.unitPx;
        this.camera.left = -halfWidth;
        this.camera.right = halfWidth;
        this.camera.top = halfHeight;
        this.camera.bottom = -halfHeight;
        this.camera.updateProjectionMatrix();
    }
    render(slots) {
        this.rings.forEach((ring, index) => {
            const slot = slots[index];
            if (!slot || slot.opacity < HIDDEN_BELOW) {
                ring.outer.visible = false;
                return;
            }
            ring.outer.visible = true;
            ring.outer.position.set((slot.cx - this.width / 2) / this.unitPx, (this.height / 2 - slot.cy) / this.unitPx, 0);
            ring.outer.scale.setScalar(slot.size / (2 * ring.radius) / this.unitPx);
            ring.spin.rotation.y = RING_REST_VIEW.yaw + slot.spin;
            ring.fade.value = slot.opacity;
            ring.gems.forEach((gem) => gem.setOpacity(slot.opacity));
        });
        this.renderer.render(this.scene, this.camera);
    }
    dispose() {
        this.scene.traverse((object) => {
            if (isMesh(object))
                object.geometry.dispose();
        });
        this.rings.forEach((ring) => {
            ring.metals.forEach((metal) => metal.dispose());
            ring.gems.forEach((gem) => gem.dispose());
        });
        this.environment?.dispose();
        this.hdri?.dispose();
        this.renderer.dispose();
        this.renderer.forceContextLoss();
    }
}

return { RING_REST_VIEW, RingsScene };
})();

const { PendantScene } = M_pendant;
const { RingsScene } = M_rings;
const ASSET_BASE = "https://storage.getlayers.ai/assets/lumi-re-9893947dfd";
```

## 4. The page runtime (verbatim, after the scene engine)

It contains, in this order:
- the visible failure banner;
- the shared ticker;
- Lenis;
- the springs;
- the letter reveal and TextSwap;
- the hero (its config, geometry and every component);
- collections, featured and philosophy;
- the preloader and the below-fold image warmer.

```js
// ============================================================================
// PAGE RUNTIME — the React components, ported
// ============================================================================
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// ---------------------------------------------------------------------------
// Asset failures are VISIBLE (D-021): a scene that cannot fetch its model or
// its HDRI says so on screen, naming the URL, instead of a quiet console line.
// ---------------------------------------------------------------------------
let banner = null;
const assetFailed = (what, error) => {
  if (window.console) console.error("[lumi-re]", what, error);
  if (banner) return;
  banner = document.createElement("div");
  banner.setAttribute("role", "alert");
  banner.style.cssText =
    "position:fixed;left:0;right:0;bottom:0;z-index:100;padding:.75rem 1rem;" +
    "font:500 13px/1.4 ui-monospace,monospace;background:#b3261e;color:#fff;text-align:center";
  banner.textContent =
    "Assets failed to load — " + what + " (" + (error && error.message ? error.message : error) + "). " +
    "If this template is not published yet: node tools/sync-r2.mjs assets assets/lumi-re-9893947dfd";
  document.body.appendChild(banner);
};
$$("img").forEach((img) => {
  const fail = () => assetFailed(img.currentSrc || img.src, new Error("image did not load"));
  if (img.complete && img.naturalWidth === 0 && img.getAttribute("loading") !== "lazy") fail();
  img.addEventListener("error", fail, { once: true });
});

// ---------------------------------------------------------------------------
// lib/animation/ticker — one rAF for every per-frame reader (verbatim)
// ---------------------------------------------------------------------------
const subscribers = new Set();
let rafId = null;
const frame = (time) => {
  for (const sub of [...subscribers]) {
    if (!subscribers.has(sub)) continue;
    if (time - sub.last <= sub.getFramerate()) continue;
    sub.last = time;
    try { sub.callback(time); } catch (error) { console.error("[ticker] subscriber threw:", error); }
  }
  rafId = requestAnimationFrame(frame);
};
const subscribeToTicker = (callback, getFramerate) => {
  const subscriber = { callback, getFramerate, last: performance.now() };
  subscribers.add(subscriber);
  if (rafId === null) rafId = requestAnimationFrame(frame);
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0 && rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  };
};
const everyFrame = () => 0;

// lib/animation/doc-box (verbatim)
const createDocBox = (element) => {
  let top = 0;
  let height = 0;
  const measure = () => {
    const rect = element.getBoundingClientRect();
    top = rect.top + window.scrollY;
    height = rect.height;
  };
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(element);
  observer.observe(document.documentElement);
  window.addEventListener("resize", measure, { passive: true });
  return { get top() { return top; }, get height() { return height; } };
};

// ---------------------------------------------------------------------------
// The scroll — layouts/scroll-layout: Lenis, wheelMultiplier 0.65
// ---------------------------------------------------------------------------
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
window.scrollTo(0, 0);
const lenis = new Lenis({ smoothWheel: true, wheelMultiplier: 0.65 });
window.lenis = lenis;
const lenisRaf = (time) => { lenis.raf(time); requestAnimationFrame(lenisRaf); };
requestAnimationFrame(lenisRaf);

// lib/animation/smooth-scroll-y (verbatim)
const OUT_OF_SYNC_PX = 2;
const smoothScrollY = () => {
  const native = window.scrollY;
  const animated = lenis.animatedScroll;
  return Math.abs(animated - native) > OUT_OF_SYNC_PX ? native : animated;
};

// ---------------------------------------------------------------------------
// Springs — the slice of react-spring the page uses. Physics configs integrate
// exactly as react-spring v10 does (1 ms steps); duration configs are eased.
// Reduced motion skips every animation (react-spring's useReducedMotion).
// ---------------------------------------------------------------------------
const easings = {
  linear: (x) => x,
  easeOutCubic: (x) => 1 - (1 - x) ** 3,
  easeInCubic: (x) => x * x * x,
  easeOutExpo: (x) => (x === 1 ? 1 : 1 - 2 ** (-10 * x)),
};
const DEFAULT_CONFIG = { tension: 170, friction: 26, mass: 1 };
const activeSprings = new Set();
let springRaf = 0;
let lastSpringTime = 0;
const springLoop = (now) => {
  const dt = Math.min(64, now - lastSpringTime || 16);
  lastSpringTime = now;
  for (const spring of [...activeSprings]) spring._advance(now, dt);
  springRaf = activeSprings.size ? requestAnimationFrame(springLoop) : 0;
};
const wake = () => {
  if (!springRaf) { lastSpringTime = performance.now(); springRaf = requestAnimationFrame(springLoop); }
};
class Spring {
  constructor(value = 0, config = DEFAULT_CONFIG) {
    this.value = value;
    this.velocity = 0;
    this.config = config;
    this.listeners = new Set();
    this.anim = null;
  }
  get() { return this.value; }
  onChange(fn) { this.listeners.add(fn); fn(this.value); return () => this.listeners.delete(fn); }
  _emit() { for (const fn of this.listeners) fn(this.value); }
  set(value) {
    this.anim = null;
    activeSprings.delete(this);
    this.velocity = 0;
    if (value === this.value) return;
    this.value = value;
    this._emit();
  }
  start(to, { config = this.config, delay = 0, onRest, immediate = false } = {}) {
    if (REDUCED || immediate) {
      this.set(to);
      onRest && onRest();
      return;
    }
    if (this.anim && this.anim.to === to && !delay) return;
    this.anim = { to, from: this.value, config, startAt: performance.now() + delay, onRest, began: false };
    activeSprings.add(this);
    wake();
  }
  _advance(now) {
    const a = this.anim;
    if (!a) { activeSprings.delete(this); return; }
    if (now < a.startAt) return;
    if (!a.began) { a.began = true; a.from = this.value; a.last = a.startAt; }
    const c = a.config;
    if (c.duration !== undefined) {
      const t = Math.min(1, (now - a.startAt) / c.duration);
      const e = (c.easing || easings.linear)(t);
      this.value = a.from + (a.to - a.from) * e;
      if (t >= 1) this.value = a.to;
    } else {
      const tension = c.tension ?? 170;
      const friction = c.friction ?? 26;
      const mass = c.mass ?? 1;
      const precision = c.precision ?? (a.from === a.to ? 0.005 : Math.min(1, Math.abs(a.to - a.from) * 0.001));
      const steps = Math.ceil(Math.min(64, now - a.last));
      a.last = now;
      let pos = this.value;
      let vel = this.velocity;
      for (let i = 0; i < steps; i++) {
        const springForce = -tension * 0.000001 * (pos - a.to);
        const dampingForce = -friction * 0.001 * vel;
        vel += ((springForce + dampingForce) / mass) * 1;
        pos += vel * 1;
      }
      this.velocity = vel;
      this.value = pos;
      if (Math.abs(vel) < precision && Math.abs(a.to - pos) < precision) {
        this.value = a.to;
        this.velocity = 0;
      }
    }
    this._emit();
    if (this.value === a.to) {
      this.anim = null;
      activeSprings.delete(this);
      a.onRest && a.onRest();
    }
  }
}
/** Bind several springs to one writer, like react-spring's `to([a, b], fn)`. */
const bind = (springs, write) => {
  const run = () => write(...springs.map((s) => s.get()));
  springs.forEach((s) => s.onChange(run));
};

// ---------------------------------------------------------------------------
// Window size — hooks/use-window-size (debounced 300 ms)
// ---------------------------------------------------------------------------
const windowSize = { width: window.innerWidth, height: window.innerHeight };
const sizeListeners = new Set();
let sizeDebounce = 0;
window.addEventListener("resize", () => {
  clearTimeout(sizeDebounce);
  sizeDebounce = setTimeout(() => {
    if (windowSize.width === window.innerWidth && windowSize.height === window.innerHeight) return;
    windowSize.width = window.innerWidth;
    windowSize.height = window.innerHeight;
    sizeListeners.forEach((fn) => fn());
  }, 300);
}, { passive: true });

// components/common/grid — scale the root font above 1920 (coef 0.6666)
const applyGrid = () => {
  const widthReduction = ((1920 - window.innerWidth) / 1920) * 100;
  const size = 16 - (16 * widthReduction * 0.6666) / 100;
  if (size > 16) document.documentElement.style.setProperty("font-size", `${size}px`);
  else document.documentElement.style.removeProperty("font-size");
};
applyGrid();
let gridWidth = window.innerWidth;
subscribeToTicker(() => { if (gridWidth !== window.innerWidth) { gridWidth = window.innerWidth; applyGrid(); } }, () => 100);

// ---------------------------------------------------------------------------
// stores/preload-store — hasLoaded, the moment the gate starts to lift
// ---------------------------------------------------------------------------
let hasLoaded = false;
const loadedListeners = [];
const whenLoaded = (fn) => (hasLoaded ? fn() : loadedListeners.push(fn));
const setLoaded = () => { if (hasLoaded) return; hasLoaded = true; loadedListeners.splice(0).forEach((fn) => fn()); };

// lib/scene/pendant-ready + rings-ready
const gate = () => {
  let resolve;
  const ready = new Promise((r) => (resolve = r));
  return { mark: () => resolve(), when: (ms) => Promise.race([ready, new Promise((r) => setTimeout(r, ms))]) };
};
const pendantReady = gate();
const ringsReady = gate();

// lib/scene/device (verbatim)
const BOT_PATTERN = /bot|crawler|spider|slurp|crawling|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|preview/i;
const isLikelyBot = () => BOT_PATTERN.test(navigator.userAgent);
const supportsWebGL2 = () => {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    const isSupported = context !== null;
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return isSupported;
  } catch { return false; }
};
const DESKTOP_BUDGET = { tier: "desktop", maxPixelRatio: 2, frameGapMs: 12, emeraldBounces: 4, diamondBounces: 5, gemDispersion: true, gemCubeSize: 512, pointerTilt: true };
const MOBILE_BUDGET = { tier: "mobile", maxPixelRatio: 1.5, frameGapMs: 0, emeraldBounces: 3, diamondBounces: 3, gemDispersion: true, gemCubeSize: 256, pointerTilt: false };
const getSceneBudget = () =>
  window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768 ? MOBILE_BUDGET : DESKTOP_BUDGET;

// ---------------------------------------------------------------------------
// Copy (data/mocks)
// ---------------------------------------------------------------------------
const R = (text, italic) => (italic ? { text, italic: true } : { text });
const COPY = {
  headline: [[R("J", 1), R("ewellery")], [R("for everyday")], [R("rituals.")]],
  headlinePhoto: [[R("M", 1), R("ade by hand,")], [R("worn every")], [R("day.")]],
  tagline: "Crafted jewellery designed to accompany everyday rituals",
  taglinePhoto: "Shaped and finished by hand, in small batches, in our own studio",
  collectionsHeading: [
    [R("F", 1), R("our "), R("C", 1), R("ollections.")],
    [R("E", 1), R("ndless "), R("S", 1), R("tories.")],
  ],
  featuredNames: [[R("T", 1), R("rinity.")], [R("S", 1), R("olace.")], [R("A", 1), R("urum.")], [R("V", 1), R("erdant.")], [R("T", 1), R("idal.")]],
  philosophy: {
    jewellery: [R("J", 1), R("ewellery "), R("D", 1), R("oesn`t")],
    quite: [R("N", 1), R("eed T"), R("o", 1), R(" B"), R("e", 1), R(" Q"), R("uite.", 1)],
    shapes: [R("W", 1), R("e "), R("L", 1), R("ike "), R("U", 1), R("nusual "), R("S", 1), R("hapes")],
    longer: [R("T", 1), R("he "), R("L", 1), R("onger "), R("Y", 1), R("ou")],
    look: [R("L", 1), R("ook"), R(" A", 1), R("t"), R(" T", 1), R("hem.")],
    keep: [R("K", 1), R("eep "), R("I", 1), R("t "), R("I", 1), R("nteresting.")],
  },
};
const RING_MODELS = [
  { url: `${ASSET_BASE}/models/rings/ring-01.glb`, roll: -9, pitch: 4 },
  { url: `${ASSET_BASE}/models/rings/ring-02.glb`, roll: 11, pitch: -3 },
  { url: `${ASSET_BASE}/models/rings/ring-03.glb`, roll: -5, pitch: 9 },
  { url: `${ASSET_BASE}/models/rings/ring-04.glb`, roll: 7, pitch: 2 },
  { url: `${ASSET_BASE}/models/rings/ring-05.glb`, roll: -12, pitch: -4 },
];

// ---------------------------------------------------------------------------
// components/common/letter-reveal — spring-text-engine's DOM, letter by letter
// ---------------------------------------------------------------------------
const LETTER_REVEAL = { stagger: 24, duration: 1300, blur: "0.28em", rootMargin: "0px 0px -15% 0px" };
const BLUR_EM = 0.28;
const NBSP = " ";
const SR_ONLY = "position: absolute; width: 1px; height: 1px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; border: 0px; pointer-events: none; user-select: none;";
const letterCount = (runs) => runs.reduce((total, run) => total + run.text.length, 0);
const plainText = (runs) => runs.map((run) => run.text).join("");
const el = (tag, className, style, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (style) node.style.cssText = style;
  if (text !== undefined) node.textContent = text;
  return node;
};
const runSpan = (run, text = run.text) => el("span", run.italic ? "italic" : "", "", text);
const splitRuns = (runs, at) => {
  const left = [];
  const right = [];
  let seen = 0;
  for (const run of runs) {
    const end = seen + run.text.length;
    if (end <= at) left.push(run);
    else if (seen >= at) right.push(run);
    else {
      left.push({ ...run, text: run.text.slice(0, at - seen) });
      right.push({ ...run, text: run.text.slice(at - seen) });
    }
    seen = end;
  }
  return [left, right];
};

/**
 * One spring-text-engine instance. `children` is either TextRun[] (each run a
 * wrapper element, its words split on spaces — spaces are NBSP, so a run is one
 * word) or a plain string (`wrap`). Letters go from `out` to `in` over 1300 ms
 * easeOutExpo, each `delay + i * stagger` after the engine comes into view.
 */
const textEngine = ({ runs, text, className = "", delay, stagger, seo, rootMargin, wordBlur, columnGap = 0.3 }) => {
  const root = el("span", className, `position: relative; column-gap: ${columnGap}em; display: flex; flex-wrap: wrap;`);
  if (seo) {
    const sr = el("span", "", SR_ONLY);
    if (runs) runs.forEach((run) => sr.appendChild(runSpan(run, run.text.replace(/ /g, NBSP))));
    else sr.textContent = text;
    root.appendChild(sr);
  }
  const body = el("span", "", "display: contents;");
  body.setAttribute("aria-hidden", "true");
  root.appendChild(body);
  const letters = [];
  const word = (chars, wrapper) => {
    const lw = el("span", "line-word", "overflow: initial; display: inline-block; user-select: auto;");
    const host = wrapper ? runSpan(wrapper, "") : lw;
    for (const ch of chars) {
      const letter = el("span", "", "display: inline-block; user-select: auto;" + (wordBlur ? " opacity: 0;" : ` opacity: 0; filter: blur(${LETTER_REVEAL.blur});`), ch);
      letter.className = "";
      host.appendChild(letter);
      letters.push(letter);
    }
    if (wrapper) lw.appendChild(host);
    body.appendChild(lw);
  };
  if (runs) {
    runs.forEach((run) =>
      run.text.replace(/ /g, NBSP).split(" ").filter((w) => w.length > 0).forEach((w) => word(w.split(""), run)),
    );
  } else {
    text.split(" ").filter((w) => w.length > 0).forEach((w) => word(w.split("")));
  }
  const play = () => {
    letters.forEach((letter, i) => {
      const s = new Spring(0);
      s.onChange((t) => {
        letter.style.opacity = t;
        if (!wordBlur) letter.style.filter = `blur(${(BLUR_EM * (1 - t)).toFixed(4)}em)`;
      });
      s.start(1, { delay: Math.max(0, delay + i * stagger), config: { duration: LETTER_REVEAL.duration, easing: easings.easeOutExpo } });
    });
    if (wordBlur) wordBlurRun(root, delay, stagger);
  };
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); play(); }
  }, { rootMargin });
  io.observe(root);
  return root;
};

/** WordBlur — per-word blur, one filter per word rather than one per letter. */
const wordBlurRun = (box, delay, stagger) => {
  const spans = [];
  let index = 0;
  $$(".line-word", box).forEach((node) => {
    const letters = Math.max(1, node.querySelectorAll('span[style*="inline-block"]').length);
    const at = (i) => delay + i * stagger;
    const first = Math.min(at(index), at(index + letters - 1));
    const middle = at(index + Math.floor((letters - 1) / 2));
    index += letters;
    spans.push({ node, first, middle });
  });
  if (REDUCED) return;
  let origin = 0;
  const step = (now) => {
    if (!origin) origin = now;
    const t = now - origin;
    let busy = false;
    for (const { node, first, middle } of spans) {
      if (t < first) { node.style.filter = ""; busy = true; continue; }
      const k = easings.easeOutExpo(Math.min(1, Math.max(0, t - middle) / LETTER_REVEAL.duration));
      const blur = BLUR_EM * (1 - k);
      if (blur < 0.002) node.style.filter = "";
      else { node.style.filter = `blur(${blur.toFixed(4)}em)`; busy = true; }
    }
    if (busy) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

/** LetterReveal — the plain (`still` / not ready) form, or the engine. */
const letterReveal = ({ runs, delay = 0, direction = "forward", stagger = LETTER_REVEAL.stagger, ready = true, still = false, wrap, rootMargin = LETTER_REVEAL.rootMargin, className = "", wordBlur = false }) => {
  if (!ready || still) {
    const span = el("span", `block ${wrap ? "" : "whitespace-nowrap"} ${ready ? "" : "invisible"} ${className}`);
    if (wrap) span.textContent = plainText(runs);
    else runs.forEach((run) => span.appendChild(runSpan(run, run.text.replace(/ /g, NBSP))));
    return span;
  }
  if (wrap) {
    return textEngine({ text: plainText(runs), className, delay, stagger, seo: true, rootMargin, wordBlur, columnGap: wrap.gap });
  }
  const count = letterCount(runs);
  if (direction === "centre") {
    const [left, right] = splitRuns(runs, Math.floor(count / 2));
    const leftCount = letterCount(left);
    const outer = el("span", `block whitespace-nowrap ${className}`);
    outer.appendChild(el("span", "sr-only", "", plainText(runs)));
    const hidden = el("span");
    hidden.setAttribute("aria-hidden", "true");
    hidden.appendChild(textEngine({ runs: left, className: "inline-block! whitespace-nowrap ", delay: delay + Math.max(0, leftCount - 1) * stagger, stagger: -stagger, seo: false, rootMargin }));
    hidden.appendChild(textEngine({ runs: right, className: "inline-block! whitespace-nowrap ", delay, stagger, seo: false, rootMargin }));
    outer.appendChild(hidden);
    return outer;
  }
  const backward = direction === "backward";
  return textEngine({
    runs,
    className: `block! whitespace-nowrap ${className}`,
    delay: backward ? delay + Math.max(0, count - 1) * stagger : delay,
    stagger: backward ? -stagger : stagger,
    seo: true,
    rootMargin,
    wordBlur,
  });
};

// ---------------------------------------------------------------------------
// components/common/text-swap — TextSwap (letters) and FadeSwap (layers)
// ---------------------------------------------------------------------------
const TEXT_SWAP_TIMING = { exit: 420, enterAfter: 160 };
const textSwap = (host, { versions, first, wrap, stagger = LETTER_REVEAL.stagger }) => {
  const grid = el("span", "grid");
  host.replaceChildren(grid);
  let active = 0;
  let swaps = 0;
  let firstReady = first ? first.ready : true;
  const slots = versions.map(() => null);
  const starts = (lines) => lines.map((_, i) => lines.slice(0, i).reduce((t, runs) => t + letterCount(runs), 0));
  const idle = (index) => {
    const span = el("span", "block", "grid-area: 1 / 1;");
    span.setAttribute("aria-hidden", "true");
    versions[index].forEach((runs) => span.appendChild(letterReveal({ runs, wrap, ready: false })));
    return span;
  };
  const shown = (index) => {
    const lines = versions[index];
    const s = starts(lines);
    const isFirst = swaps === 0;
    const base = isFirst ? (first?.delay ?? 0) : TEXT_SWAP_TIMING.enterAfter;
    const span = el("span", "block", "grid-area: 1 / 1;");
    lines.forEach((runs, line) =>
      span.appendChild(letterReveal({
        runs, wrap, stagger,
        still: isFirst && !first,
        ready: isFirst && first ? firstReady : true,
        wordBlur: !isFirst,
        delay: base + s[line] * stagger,
        rootMargin: "0px",
      })),
    );
    return span;
  };
  const place = (index, node) => {
    if (slots[index]) slots[index].replaceWith(node);
    else grid.appendChild(node);
    slots[index] = node;
  };
  versions.forEach((_, index) => place(index, index === active ? shown(index) : idle(index)));
  return {
    ready() {
      if (firstReady) return;
      firstReady = true;
      if (swaps === 0) place(active, shown(active));
    },
    setActive(next) {
      if (next === active) return;
      const was = active;
      active = next;
      swaps += 1;
      // the outgoing copy blurs away as one block
      const leaving = el("span", "block", "grid-area: 1 / 1;");
      leaving.setAttribute("aria-hidden", "true");
      versions[was].forEach((runs) => leaving.appendChild(letterReveal({ runs, wrap, stagger, still: true })));
      place(was, leaving);
      const t = new Spring(1);
      t.onChange((v) => {
        leaving.style.opacity = v;
        leaving.style.filter = `blur(${((1 - v) * BLUR_EM).toFixed(4)}em)`;
      });
      t.start(0, { config: { duration: TEXT_SWAP_TIMING.exit, easing: easings.easeInCubic }, onRest: () => { if (slots[was] === leaving && active !== was) place(was, idle(was)); } });
      place(next, shown(next));
    },
  };
};
const fadeSwap = (grid) => {
  const layers = [...grid.children];
  const springs = layers.map((layer, index) => {
    const s = new Spring(index === 0 ? 1 : 0, { duration: TEXT_SWAP_TIMING.exit, easing: easings.easeOutCubic });
    s.onChange((v) => {
      layer.style.opacity = v;
      layer.style.filter = v >= 1 ? "none" : `blur(${((1 - v) * BLUR_EM).toFixed(4)}em)`;
      layer.style.visibility = v <= 0.001 ? "hidden" : "visible";
      layer.setAttribute("aria-hidden", v < 0.5 ? "true" : "false");
    });
    return s;
  });
  return { setActive: (active) => springs.forEach((s, i) => s.start(i === active ? 1 : 0)) };
};

// ---------------------------------------------------------------------------
// hero-hover — HoverRoll (copy rolls up to its twin), the arrow nudge, the rule
// ---------------------------------------------------------------------------
const HOVER_CONFIG = { duration: 460, easing: easings.easeOutCubic };
const isRoll = (node) => node.classList.contains("will-change-transform") && /margin-block:\s*calc\(0\.4em \* -1\)/.test(node.parentElement?.getAttribute("style") || "");
const hoverable = (host, { roll, arrow, rule } = {}) => {
  const t = new Spring(0, HOVER_CONFIG);
  t.onChange((v) => {
    if (roll) roll.style.transform = `translate3d(0, ${-v * 100}%, 0)`;
    if (arrow) arrow.style.transform = `translate3d(${v * 6}px, 0, 0)`;
    if (rule) {
      rule.style.transform = `scaleX(${1 - Math.sin(Math.PI * v)})`;
      rule.style.transformOrigin = v < 0.5 ? "right" : "left";
    }
  });
  const on = () => t.start(1);
  const off = () => t.start(0);
  host.addEventListener("pointerenter", on);
  host.addEventListener("pointerleave", off);
  host.addEventListener("pointercancel", off);
  host.addEventListener("focus", on, true);
  host.addEventListener("blur", off, true);
};
const rollIn = (root) => $$(".will-change-transform", root).find(isRoll);

// ---------------------------------------------------------------------------
// hero-reveal — the entrance springs (880 ms easeOutCubic)
// ---------------------------------------------------------------------------
const REVEAL = { headline: 120, chrome: 340, tagline: 520, cta: 620 };
const ITEM_STAGGER = 90;
const MENU_LEAD = 90;
const MENU_EXIT_MS = 320;
const ENTER_CONFIG = { duration: 880, easing: easings.easeOutCubic };
const enterSpring = (node, rise = 14) => {
  const t = new Spring(0, ENTER_CONFIG);
  t.onChange((v) => {
    node.style.opacity = v;
    node.style.transform = `translate3d(0, ${(1 - v) * rise}px, 0)`;
  });
  return t;
};
const revealOnLoad = (node, delay, rise = 14) => {
  const t = enterSpring(node, rise);
  whenLoaded(() => t.start(1, { delay }));
};

// ---------------------------------------------------------------------------
// HERO — hero.config + hero-geometry (verbatim), then the components
// ---------------------------------------------------------------------------
const DESIGN = { width: 1440, height: 800 };
const TABLET = { min: 768, max: 1024, designWidth: 850, designHeight: 1150 };
const CARD = { width: 105.398, height: 124.47, radius: 32 };
const CLUSTER = { centerX: 0.5, centerY: 0.5, radius: 202.78, count: 8, step: 45, startAngle: -90 };
const FRAME_2 = { scale: 3.8872, rotate: 45, centerX: 1375.83, centerY: 519.8, radius: 788.16, heroIndex: 5 };
const FRAME_2_OFFSET = { x: FRAME_2.centerX - DESIGN.width / 2, y: FRAME_2.centerY - DESIGN.height / 2 };
const HERO_TILT = { yaw: 0.28, pitch: 0.1, spring: { tension: 90, friction: 24 } };
const TIMELINE = {
  pinHeights: 2, rotateEnd: 0.48, frame2End: 0.72, frame3End: 1, turns: 1,
  categoryStops: [0, 0.14, 0.28, 0.42], cardFade: [0.55, 0.68], pendantExit: [0.48, 0.6],
  crossfade: [0.75, 0.9], invert: [0.7, 0.85], categoryExit: [0.7, 0.85],
};
const FRAME_3_COMPACT = { tablet: { scaleBoost: 0.25, shiftX: 148, shiftY: 143 }, phone: { scaleBoost: 0.42, shiftX: 267, shiftY: 129 } };
const RING_TOP = { desktop: 0.5, compact: 0.57 };
const FLIPPED_POSITIONS = [2, 3, 4, 5, 8];
const FLIPPED_POSITIONS_WIDE = [...FLIPPED_POSITIONS, 7];
const CATEGORY = { itemHeight: 34, gap: 8, paddingX: 10, borderWidth: 1, fontSize: 16, lineHeight: 15.2, width: 85, fullWidthIndexes: [1, 3], windowHeight: 160, pitch: 42 };
const CATEGORY_SCALE = { min: 1024, max: 1440, factor: 1.35 };
const categoryScaleFor = (width) => (width >= CATEGORY_SCALE.min && width < CATEGORY_SCALE.max ? CATEGORY_SCALE.factor : 1);
const SCROLL_CUE_OPACITY = { onPage: 0.3, onPhoto: 0.65 };
const FRAME_3_PARALLAX = 0.4;
const PENDANT_FOG = { blur: 28, wash: 0.45 };
const TEXT_SWAP = { toPhoto: 0.8, toRest: 0.74 };
const HERO_INTRO = { delay: 100, duration: 1150, spin: 40, cardSpan: 0.42, blur: 14, scaleFrom: 0.86 };

const cssNumber = (value) => value.toFixed(4);
const clamp01 = (value) => Math.min(1, Math.max(0, value));
const clampAbs = (value, limit) => Math.min(limit, Math.max(-limit, value));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const range = (p, start, end) => clamp01((p - start) / (end - start));
const NO_CANVAS_RATIO = { scale: 1, offset: 1 };
const FRAME_2_TABLET_REST = 0.12;
const clusterStateAt = (p, offsetScale = 1, canvasRatio = NO_CANVAS_RATIO) => {
  const turn = 360 * TIMELINE.turns;
  if (p <= TIMELINE.rotateEnd) return { rotate: turn * (p / TIMELINE.rotateEnd), scale: 1, dx: 0, dy: 0 };
  const t = easeInOut(range(p, TIMELINE.rotateEnd, TIMELINE.frame2End));
  const rotate = turn + FRAME_2.rotate * t;
  const scale = 1 + (FRAME_2.scale * canvasRatio.scale - 1) * t;
  if (offsetScale === 0) {
    const heroAngle = ((CLUSTER.startAngle + FRAME_2.heroIndex * CLUSTER.step + rotate) * Math.PI) / 180;
    const radius = CLUSTER.radius * scale;
    return { rotate, scale, dx: -radius * Math.cos(heroAngle) * t, dy: -radius * Math.sin(heroAngle) * t };
  }
  return { rotate, scale, dx: FRAME_2_OFFSET.x * canvasRatio.offset * t, dy: FRAME_2_OFFSET.y * canvasRatio.offset * t };
};
const frameTwoCanvasRatio = (viewportWidth, viewportHeight, unitPx) => {
  const none = { scale: 1, offset: 1 };
  if (!viewportWidth || !viewportHeight || !unitPx) return none;
  if (viewportWidth < TABLET.min || viewportWidth >= TABLET.max) return none;
  const canvasWidth = viewportWidth / unitPx;
  const scale = Math.sqrt((canvasWidth / DESIGN.width) * (viewportHeight / unitPx / DESIGN.height));
  const halfCard = (CARD.height * FRAME_2.scale * scale) / 2;
  const target = FRAME_2_TABLET_REST * canvasWidth + halfCard - canvasWidth / 2;
  const offset = (target + CLUSTER.radius * FRAME_2.scale * scale) / FRAME_2_OFFSET.x;
  return { scale, offset };
};
const cardStateAt = (index, p, offsetScale = 1, canvasRatio = NO_CANVAS_RATIO) => {
  const cluster = clusterStateAt(p, offsetScale, canvasRatio);
  const degrees = CLUSTER.startAngle + index * CLUSTER.step + cluster.rotate;
  const radians = (degrees * Math.PI) / 180;
  const radius = CLUSTER.radius * cluster.scale;
  return { x: cluster.dx + radius * Math.cos(radians), y: cluster.dy + radius * Math.sin(radians), rotate: index * CLUSTER.step + cluster.rotate, scale: cluster.scale };
};
const frameTwoOffsetScale = (viewportWidth) => (viewportWidth >= TABLET.min ? 1 : 0);
const isCompactFor = (viewportWidth) => viewportWidth < TABLET.max;
const coverScale = (width, height, unitPx) => {
  if (!width || !height || !unitPx) return DESIGN.width / CARD.width;
  return Math.max(width / unitPx / CARD.width, height / unitPx / CARD.height);
};
const maxRestOffset = (cardSide, scale, viewportSide, unitPx) => Math.max(0, (cardSide * scale) / 2 - viewportSide / unitPx / 2);
const heroStateAt = (p, width, height, unitPx, offsetScale = 1) => {
  const base = cardStateAt(FRAME_2.heroIndex, Math.min(p, TIMELINE.frame2End), offsetScale, frameTwoCanvasRatio(width, height, unitPx));
  const isCompact = isCompactFor(width);
  const centreShift = isCompact ? ((RING_TOP.desktop - RING_TOP.compact) * height) / unitPx : 0;
  if (p <= TIMELINE.frame2End) return { ...base, radius: CARD.radius / base.scale };
  const t = easeInOut(range(p, TIMELINE.frame2End, TIMELINE.frame3End));
  const framing = !isCompact ? null : offsetScale === 0 ? FRAME_3_COMPACT.phone : FRAME_3_COMPACT.tablet;
  const cover = coverScale(width, height, unitPx) * (1 + (framing?.scaleBoost ?? 0));
  const scale = base.scale + (cover - base.scale) * t;
  const restX = clampAbs(framing?.shiftX ?? 0, maxRestOffset(CARD.width, cover, width, unitPx));
  const restY = clampAbs(framing?.shiftY ?? 0, maxRestOffset(CARD.height, cover, height, unitPx));
  const upright = Math.ceil(base.rotate / 360) * 360;
  const visualRadius = CARD.radius * (1 - t);
  return { x: base.x * (1 - t) + restX * t, y: base.y * (1 - t) + (centreShift + restY) * t, rotate: base.rotate + (upright - base.rotate) * t, scale, radius: visualRadius / scale };
};
const radiusScaleAt = (p, unitPx, isCompact) =>
  isCompact ? unitPx + (1 - unitPx) * easeInOut(range(p, TIMELINE.rotateEnd, TIMELINE.frame2End)) : unitPx;
const UNIT_FLOOR_PX = 0.6452;
const PHONE_DESIGN_HEIGHT = 1258.5;
const unitPxFor = (viewportWidth, viewportHeight = 0) => {
  const width = viewportWidth || DESIGN.width;
  if (width >= TABLET.min && width < TABLET.max) {
    const byWidth = width / TABLET.designWidth;
    return viewportHeight ? Math.min(byWidth, viewportHeight / TABLET.designHeight) : byWidth;
  }
  if (width < TABLET.min && viewportHeight) return Math.min(UNIT_FLOOR_PX, viewportHeight / PHONE_DESIGN_HEIGHT);
  return Math.max(UNIT_FLOOR_PX, width / DESIGN.width);
};
const toTransform = (state, unitPx, flip = false) =>
  ["translate(-50%, -50%)", `translate(${cssNumber(state.x * unitPx)}px, ${cssNumber(state.y * unitPx)}px)`, `rotate(${cssNumber(state.rotate)}deg)`, `scale(${cssNumber(state.scale)})`, flip ? "scaleY(-1)" : ""]
    .filter(Boolean).join(" ");
const cardOpacityAt = (p) => 1 - range(p, TIMELINE.cardFade[0], TIMELINE.cardFade[1]);
const categoryPositionAt = (p) => {
  const stops = TIMELINE.categoryStops;
  for (let i = stops.length - 1; i >= 0; i -= 1) {
    if (p < stops[i]) continue;
    if (i === stops.length - 1) return i;
    const gap = stops[i + 1] - stops[i];
    return i + easeInOut(range(p, stops[i + 1] - gap / 3, stops[i + 1]));
  }
  return 0;
};
const placements = Array.from({ length: CLUSTER.count }, (_, index) => {
  const angle = ((CLUSTER.startAngle + index * CLUSTER.step) * Math.PI) / 180;
  return { position: index + 1, x: CLUSTER.radius * Math.cos(angle), y: CLUSTER.radius * Math.sin(angle), rotate: index * CLUSTER.step };
});

/** use-scroll-progress — -1..1 of an element's centre against the viewport's, tracked near view. */
const scrollProgress = (target) => {
  const progress = new Spring(0);
  if (REDUCED || !target) return progress;
  let unsubscribe = null;
  const track = () => {
    const { top, height } = target.getBoundingClientRect();
    const viewport = window.innerHeight;
    const travel = (viewport + height) / 2;
    if (travel <= 0) return;
    progress.set(Math.max(-1, Math.min(1, (top + height / 2 - viewport / 2) / travel)));
  };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !unsubscribe) { track(); unsubscribe = subscribeToTicker(track, everyFrame); }
    else if (!entry.isIntersecting && unsubscribe) { unsubscribe(); unsubscribe = null; }
  }, { rootMargin: "25% 0px" }).observe(target);
  return progress;
};

// --- hero-motion: the pin -------------------------------------------------
const heroStage = $('section[aria-labelledby="hero-headline"]');
const heroSticky = heroStage.parentElement;
const heroTrack = heroSticky.parentElement;
const heroProgress = new Spring(0);
if (REDUCED) {
  heroTrack.style.removeProperty("height");
  heroSticky.className = "overflow-hidden";
} else {
  heroTrack.style.height = `${(TIMELINE.pinHeights + 1) * 100}svh`;
  const box = createDocBox(heroTrack);
  subscribeToTicker(() => {
    const top = box.top - smoothScrollY();
    const travel = box.height - window.innerHeight;
    if (travel <= 0) return;
    heroProgress.set(Math.min(1, Math.max(0, -top / travel)));
  }, everyFrame);
}

// --- hero-stage: chrome inverts as the photograph takes the screen ----------
heroProgress.onChange((p) => {
  const channel = Math.round(255 * range(p, TIMELINE.invert[0], TIMELINE.invert[1]));
  heroStage.style.color = `rgb(${channel} ${channel} ${channel})`;
});

// --- use-hero-tilt: pendant + ring turn toward the cursor -------------------
const tiltX = new Spring(0, HERO_TILT.spring);
const tiltY = new Spring(0, HERO_TILT.spring);
if (getSceneBudget().pointerTilt && !REDUCED) {
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    tiltX.start((event.clientX / window.innerWidth) * 2 - 1);
    tiltY.start(1 - (event.clientY / window.innerHeight) * 2);
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { tiltX.start(0); tiltY.start(0); });
}

// --- hero-cluster -------------------------------------------------------------
const clusterRoot = $(".pointer-events-none.absolute.inset-0", heroStage.querySelector(".absolute.inset-0.z-10"));
const pendantFog = clusterRoot.firstElementChild.firstElementChild; // the animated fog div
const ring = clusterRoot.querySelector("ul");
const cardNodes = $$("li[data-card]", ring);
const heroOverlay = cardNodes[FRAME_2.heroIndex].querySelector(":scope > div");
const introT = new Spring(0, { duration: HERO_INTRO.duration, easing: easings.linear });
whenLoaded(() => introT.start(1, { delay: HERO_INTRO.delay }));
const exit = scrollProgress(clusterRoot);
const easeOutCubic = easings.easeOutCubic;
const INTRO_GAP = (1 - HERO_INTRO.cardSpan) / (cardNodes.length - 1);
const appearAt = (index, t) => easeOutCubic(range(t, index * INTRO_GAP, index * INTRO_GAP + HERO_INTRO.cardSpan));
const swungBy = (state, degrees, centre) => {
  if (degrees === 0) return state;
  const radians = (degrees * Math.PI) / 180;
  const x = state.x - centre.dx;
  const y = state.y - centre.dy;
  return { ...state, x: centre.dx + x * Math.cos(radians) - y * Math.sin(radians), y: centre.dy + x * Math.sin(radians) + y * Math.cos(radians), rotate: state.rotate + degrees };
};
let geo = null;
const measureHero = () => {
  const { width, height } = windowSize;
  const unitPx = unitPxFor(width, height);
  const offsetScale = frameTwoOffsetScale(width);
  const canvasRatio = frameTwoCanvasRatio(width, height, unitPx);
  const isCompact = isCompactFor(width);
  const frameThreeCardPx = CARD.height * unitPx * heroStateAt(1, width, height, unitPx, offsetScale).scale;
  geo = { width, height, unitPx, offsetScale, canvasRatio, isCompact, flipped: isCompact ? FLIPPED_POSITIONS : FLIPPED_POSITIONS_WIDE, screenPerCard: frameThreeCardPx > 0 ? height / frameThreeCardPx : 0 };
};
measureHero();
const writeCards = () => {
  const p = heroProgress.get();
  const t = introT.get();
  const g = geo;
  cardNodes.forEach((node, index) => {
    const isHero = index === FRAME_2.heroIndex;
    const state = isHero ? heroStateAt(p, g.width, g.height, g.unitPx, g.offsetScale) : cardStateAt(index, p, g.offsetScale, g.canvasRatio);
    const appear = appearAt(index, t);
    const spin = -HERO_INTRO.spin * (1 - easeOutCubic(t));
    const swung = swungBy(state, spin, clusterStateAt(p, g.offsetScale, g.canvasRatio));
    const grow = HERO_INTRO.scaleFrom + (1 - HERO_INTRO.scaleFrom) * appear;
    node.style.transform = toTransform(grow === 1 ? swung : { ...swung, scale: swung.scale * grow }, g.unitPx, g.flipped.includes(placements[index].position));
    node.style.opacity = isHero ? appear : cardOpacityAt(p) * appear;
    node.style.filter = appear >= 1 ? "none" : `blur(${((1 - appear) * HERO_INTRO.blur * g.unitPx).toFixed(2)}px)`;
    if (isHero) node.style.borderRadius = `${state.radius * radiusScaleAt(p, g.unitPx, g.isCompact)}px`;
  });
  heroOverlay.style.opacity = range(p, TIMELINE.crossfade[0], TIMELINE.crossfade[1]);
};
bind([heroProgress, introT], writeCards);
exit.onChange((e) => {
  heroOverlay.style.transform = `translate3d(0, ${(Math.max(0, -e) * FRAME_3_PARALLAX * geo.screenPerCard * 100).toFixed(3)}%, 0)`;
});
sizeListeners.add(() => { measureHero(); writeCards(); });
const TILT_EPSILON = 0.0005;
bind([tiltX, tiltY, heroProgress], (x, y, p) => {
  const weight = 1 - range(p, TIMELINE.pendantExit[0], TIMELINE.pendantExit[1]);
  const yaw = x * HERO_TILT.yaw * weight;
  const pitch = y * HERO_TILT.pitch * weight;
  ring.style.transform = Math.abs(yaw) < TILT_EPSILON && Math.abs(pitch) < TILT_EPSILON
    ? "none"
    : `perspective(var(--hero-tilt-perspective)) rotateX(${pitch}rad) rotateY(${yaw}rad)`;
});
heroProgress.onChange((p) => {
  const fog = range(p, TIMELINE.pendantExit[0], TIMELINE.pendantExit[1]);
  if (fog <= 0) pendantFog.style.filter = "none";
  else {
    const wash = PENDANT_FOG.wash * fog;
    pendantFog.style.filter = `blur(${(PENDANT_FOG.blur * fog * geo.unitPx).toFixed(2)}px) contrast(${(1 - wash).toFixed(3)}) brightness(${(1 + wash * 0.6).toFixed(3)})`;
  }
  pendantFog.style.opacity = 1 - fog * fog * (3 - 2 * fog);
});

// --- hero-pendant: the ray-traced emerald ---------------------------------
{
  const box = pendantFog.firstElementChild;
  const [poster, mount] = box.children;
  const fade = new Spring(0, { tension: 120, friction: 26 });
  fade.onChange((v) => { poster.style.opacity = v > 0.995 ? 0 : 1; mount.style.opacity = v; });
  if (isLikelyBot() || !supportsWebGL2()) pendantReady.mark();
  else {
    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    mount.appendChild(canvas);
    const budget = getSceneBudget();
    let isInView = true;
    PendantScene.create(canvas, budget, !REDUCED)
      .then((scene) => {
        const readFraming = () => {
          const style = getComputedStyle(box);
          return { centre: parseFloat(style.getPropertyValue("--pendant-oval-centre")), span: parseFloat(style.getPropertyValue("--pendant-oval-span")) };
        };
        const resize = () => scene.setSize(box.clientWidth, box.clientHeight, readFraming());
        resize();
        new ResizeObserver(resize).observe(box);
        new IntersectionObserver(([entry]) => { isInView = entry.isIntersecting; }, { rootMargin: "100% 0px" }).observe(box);
        subscribeToTicker((time) => {
          if (!isInView || document.hidden) return;
          const exitT = range(heroProgress.get(), TIMELINE.pendantExit[0], TIMELINE.pendantExit[1]);
          if (exitT >= 1) return;
          const weight = 1 - exitT;
          scene.setTilt(tiltX.get() * HERO_TILT.yaw * weight, tiltY.get() * HERO_TILT.pitch * weight);
          scene.render(time);
        }, () => budget.frameGapMs);
        scene.render(performance.now());
        fade.start(1);
        pendantReady.mark();
      })
      .catch((error) => {
        assetFailed(`${ASSET_BASE}/models/pendant-emerald.glb or env/hotel-room.exr`, error);
        pendantReady.mark();
      });
  }
}

// --- hero-headline + hero-footer tagline: TextSwap on the photo handover ----
const headlineSwap = textSwap($("#hero-headline"), { versions: [COPY.headline, COPY.headlinePhoto], first: { ready: false, delay: REVEAL.headline } });
whenLoaded(() => headlineSwap.ready());
const heroFooter = $(".pointer-events-none.absolute.inset-x-0.bottom-0.z-20", heroStage);
const [taglineP, cueP] = heroFooter.querySelectorAll(":scope > p");
const taglineSwap = textSwap(taglineP, { versions: [[[{ text: COPY.tagline }]], [[{ text: COPY.taglinePhoto }]]], wrap: { gap: 0.2 }, stagger: 10 });
revealOnLoad(taglineP, REVEAL.tagline);
let isPhoto = false;
subscribeToTicker(() => {
  const p = heroProgress.get();
  const next = isPhoto ? p > TEXT_SWAP.toRest : p >= TEXT_SWAP.toPhoto;
  if (next === isPhoto) return;
  isPhoto = next;
  headlineSwap.setActive(isPhoto ? 1 : 0);
  taglineSwap.setActive(isPhoto ? 1 : 0);
}, everyFrame);
heroProgress.onChange((p) => {
  const t = range(p, TIMELINE.invert[0], TIMELINE.invert[1]);
  cueP.style.opacity = SCROLL_CUE_OPACITY.onPage + (SCROLL_CUE_OPACITY.onPhoto - SCROLL_CUE_OPACITY.onPage) * t;
});
{
  const cta = heroFooter.querySelector(":scope > a");
  revealOnLoad(cta, REVEAL.cta);
  const row = cta.firstElementChild;
  hoverable(cta, { roll: rollIn(row), arrow: row.children[1], rule: cta.children[1].firstElementChild });
}

// --- category-index ------------------------------------------------------------
{
  const nav = $('nav[aria-label="Collections"]', heroStage);
  const list = nav.querySelector("ul");
  const write = () => {
    const p = heroProgress.get();
    const unitPx = unitPxFor(windowSize.width) * categoryScaleFor(windowSize.width);
    const exitOpacity = 1 - range(p, TIMELINE.categoryExit[0], TIMELINE.categoryExit[1]);
    nav.style.opacity = exitOpacity;
    nav.style.pointerEvents = exitOpacity < 0.05 ? "none" : "auto";
    list.style.transform = `translateY(${(1.5 - categoryPositionAt(p)) * CATEGORY.pitch * unitPx}px)`;
  };
  heroProgress.onChange(write);
  sizeListeners.add(write);
}

// --- hero-header ---------------------------------------------------------------
{
  const header = $("header", heroStage);
  const [primary, wordmarkLink, account, bar] = header.children;
  const items = [...$$("li", primary), ...$$("li", account)];
  items.forEach((li, index) => {
    revealOnLoad(li, REVEAL.chrome + index * ITEM_STAGGER, 18);
    const link = li.querySelector("a");
    hoverable(link, { roll: rollIn(link) });
  });
  const inverted = wordmarkLink.querySelector(":scope > div");
  heroProgress.onChange((p) => { inverted.style.opacity = range(p, TIMELINE.invert[0], TIMELINE.invert[1]); });

  // the compact bar (below lg): cart + the menu button
  const chrome = enterSpring(bar, 10);
  whenLoaded(() => chrome.start(1, { delay: REVEAL.chrome }));
  const cartLink = bar.querySelector("a");
  hoverable(cartLink, { roll: rollIn(cartLink) });
  const button = bar.querySelector("button");
  const [, barTop, barBottom] = button.children;
  const icon = new Spring(0, { tension: 320, friction: 26 });
  icon.onChange((t) => {
    barTop.style.transform = `translateY(${-3 + 3 * t}px) rotate(${45 * t}deg)`;
    barBottom.style.width = `${24 * (0.66 + 0.34 * t)}px`;
    barBottom.style.transform = `translateY(${3 - 3 * t}px) rotate(${-45 * t}deg)`;
  });
  let isOpen = false;
  let panel = null;
  let unmount = 0;
  const masked = (label, delay) => {
    const outer = el("span", "block overflow-hidden", "margin-block: calc(0.22em * -1); margin-inline: calc(0.1em * -1);");
    const mover = el("span", "block will-change-transform", "transform: translate3d(0, 100%, 0);");
    mover.appendChild(el("span", "block", "padding-block: 0.22em; padding-inline: 0.1em;", label));
    outer.appendChild(mover);
    const t = new Spring(0, ENTER_CONFIG);
    t.onChange((v) => { mover.style.transform = `translate3d(0, ${(1 - v) * 100}%, 0)`; });
    return { outer, t, delay };
  };
  const build = () => {
    const root = el("div", "fixed inset-0 z-40 flex flex-col justify-center bg-surface text-content lg:hidden",
      "padding-left: max(24px, env(safe-area-inset-left)); padding-right: max(24px, env(safe-area-inset-right)); padding-top: max(32px, env(safe-area-inset-top)); padding-bottom: max(32px, env(safe-area-inset-bottom)); opacity: 0;");
    root.id = "hero-menu";
    const inner = el("div", "my-auto");
    const items = [];
    const list = (label, links, offset) => {
      const nav = el("nav");
      nav.setAttribute("aria-label", label);
      const ul = el("ul", "flex list-none flex-col gap-[4px] font-serif");
      links.forEach((text, index) => {
        const li = el("li");
        const a = el("a", "flex min-h-[44px] items-center text-[clamp(28px,8vw,34px)] leading-[1.2]");
        a.href = "#";
        a.addEventListener("click", () => setOpen(false));
        const m = masked(text, MENU_LEAD + (offset + index) * ITEM_STAGGER);
        items.push(m);
        a.appendChild(m.outer);
        li.appendChild(a);
        ul.appendChild(li);
      });
      nav.appendChild(ul);
      return nav;
    };
    inner.appendChild(list("Primary", ["Shop", "Collections", "Blog", "About"], 0));
    const divider = el("span", "my-[20px] block w-[48px] origin-left bg-current opacity-30", "height: calc(0.7000 * var(--raw-unit-design)); transform: scaleX(0);");
    divider.setAttribute("aria-hidden", "true");
    inner.appendChild(divider);
    inner.appendChild(list("Account", ["Log in"], 5));
    root.appendChild(inner);
    const opacity = new Spring(0, { duration: MENU_EXIT_MS, easing: easings.easeOutCubic });
    opacity.onChange((v) => { root.style.opacity = v; });
    const divide = new Spring(0, { tension: 120, friction: 26 });
    divide.onChange((v) => { divider.style.transform = `scaleX(${v})`; });
    header.appendChild(root);
    return { root, items, opacity, divide };
  };
  const setOpen = (open) => {
    isOpen = open;
    button.setAttribute("aria-expanded", String(open));
    button.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
    header.classList.toggle("z-50", open);
    header.classList.toggle("z-20", !open);
    bar.classList.toggle("text-content", open);
    if (open) { bar.style.opacity = ""; bar.style.transform = ""; } else { bar.style.opacity = chrome.get(); bar.style.transform = `translate3d(0, ${(1 - chrome.get()) * 10}px, 0)`; }
    icon.start(open ? 1 : 0);
    clearTimeout(unmount);
    if (open) {
      document.documentElement.style.overflow = "hidden";
      if (!panel) panel = build();
      panel.root.style.pointerEvents = "auto";
      panel.opacity.start(1);
      panel.items.forEach((m) => m.t.start(1, { delay: m.delay }));
      panel.divide.start(1, { delay: MENU_LEAD + 4 * ITEM_STAGGER });
    } else if (panel) {
      document.documentElement.style.removeProperty("overflow");
      panel.root.style.pointerEvents = "none";
      panel.opacity.start(0);
      panel.items.forEach((m) => m.t.start(0));
      panel.divide.start(0);
      const closing = panel;
      unmount = setTimeout(() => { if (!isOpen && panel === closing) { closing.root.remove(); panel = null; } }, MENU_EXIT_MS);
    }
  };
  button.addEventListener("click", () => setOpen(!isOpen));
}

// ---------------------------------------------------------------------------
// COLLECTIONS
// ---------------------------------------------------------------------------
const inView = (node, margin, fn) => {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin: margin });
  io.observe(node);
};
const COLLECTIONS_PARALLAX = { photo: [0.18, 0.14, 0.16, 0.2], heading: 0.5 };
{
  const section = $("section.collections");
  const heading = $("#collections-heading");
  const lead = $(".collections__lead", section);
  const starts = COPY.collectionsHeading.map((_, i) => COPY.collectionsHeading.slice(0, i).reduce((t, line) => t + letterCount(line), 0));
  heading.replaceChildren(...COPY.collectionsHeading.map((runs) => letterReveal({ runs, ready: false })));
  const leadT = enterSpring(lead, 14);
  inView(heading, "0px 0px -15% 0px", () => {
    heading.replaceChildren(...COPY.collectionsHeading.map((runs, i) => letterReveal({ runs, ready: true, delay: starts[i] * LETTER_REVEAL.stagger })));
    leadT.start(1, { delay: 420 });
  });
  const drift = scrollProgress(section);
  drift.onChange((p) => { heading.style.transform = `translate3d(0, ${(-p * COLLECTIONS_PARALLAX.heading).toFixed(4)}em, 0)`; });

  let lastSlot = Number.NEGATIVE_INFINITY;
  const takeRevealSlot = (gap) => {
    const now = performance.now();
    const slot = Math.max(now, lastSlot + gap);
    lastSlot = slot;
    return slot - now;
  };
  $$(".collections__card", section).forEach((card, index) => {
    const depth = COLLECTIONS_PARALLAX.photo[index];
    const frameEl = card.querySelector(".collections__photo-frame");
    scrollProgress(card).onChange((p) => {
      frameEl.style.transform = `translate3d(0, ${((-p * depth * 100) / (1 + 2 * depth)).toFixed(3)}%, 0)`;
    });
    const write = (v) => card.style.setProperty("--card-shown", v.toFixed(4));
    inView(card, "0px 0px -15% 0px", () => {
      if (REDUCED) { write(1); return; }
      const t = new Spring(0);
      t.onChange(write);
      t.start(1, { delay: takeRevealSlot(180), config: { duration: 880, easing: easings.easeOutCubic }, onRest: () => write(1) });
    });
    const cta = card.querySelector(".collections__cta");
    const row = cta.querySelector(".collections__cta-row");
    hoverable(cta, { roll: rollIn(row), arrow: row.children[1], rule: cta.querySelector(".collections__rule > span") });
  });
}

// ---------------------------------------------------------------------------
// FEATURED — the pinned five-ring strip
// ---------------------------------------------------------------------------
const easeSite = (() => {
  const x1 = 0.16, y1 = 1, x2 = 0.3, y2 = 1;
  const a = (p, q) => 1 - 3 * q + 3 * p;
  const b = (p, q) => 3 * q - 6 * p;
  const c = (p) => 3 * p;
  const at = (t, p, q) => ((a(p, q) * t + b(p, q)) * t + c(p)) * t;
  const slope = (t, p, q) => 3 * a(p, q) * t * t + 2 * b(p, q) * t + c(p);
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      const error = at(t, x1, x2) - x;
      if (Math.abs(error) < 1e-6) return at(t, y1, y2);
      t -= error / d;
    }
    let low = 0;
    let high = 1;
    t = x;
    while (high - low > 1e-6) {
      if (at(t, x1, x2) > x) high = t;
      else low = t;
      t = (low + high) / 2;
    }
    return at(t, y1, y2);
  };
})();
const lerp = (from, to, t) => from + (to - from) * t;
const stage = (progress, from, to) => easeSite(clamp01((progress - from) / (to - from)));
const SLOTS = { centre: { width: 245, height: 265, top: 235, offset: 0, opacity: 1 }, side: { width: 109.5, height: 118.4, top: 248, offset: 226, opacity: 0.6 } };
const SIDE_SCALE = SLOTS.side.width / SLOTS.centre.width;
const OFF_SLOT = { offset: 340, scale: 0.36, opacity: 0 };
const F_TIMELINE = { transitions: 4, states: 5, viewportsPerTransition: 0.8 };
const SPREAD_OPEN = 1.15;
const SPREAD = { wide: (SLOTS.side.offset / SLOTS.centre.width) * SPREAD_OPEN, tablet: 0.75 * SPREAD_OPEN, phone: 161.7 / 210.5 };
const RING_3D = { fit: 1.6, maxPanelShare: 0.92, posterFit: 0.9, turnsPerTransition: 0.25 };
const STRIP_OVERRUN = 1.5;
const PHOTO_PARALLAX = 0.22;
const PIECE_SWITCH = { start: 0, span: 1, feather: 45, zoom: 0.05, hysteresis: 0.06 };
const ENTRY_TRAVEL = 0.6;
const CENTRE_X = 0.5 / SLOTS.centre.width;
const OFF_RATIO = OFF_SLOT.offset / SLOTS.side.offset;
const ringOnStrip = (d, spread) => {
  const away = Math.abs(d);
  const side = Math.sign(d) || 1;
  const SIDE_X = spread;
  const OFF_X = spread * OFF_RATIO;
  if (away <= 1) {
    return { x: d * SIDE_X + CENTRE_X * (1 - away), y: lerp(0, 0.5, away), scale: lerp(1, SIDE_SCALE, away), opacity: lerp(SLOTS.centre.opacity, SLOTS.side.opacity, away) };
  }
  const f = Math.min(1, (away - 1) / 0.5);
  return { x: side * lerp(SIDE_X, OFF_X, f), y: 0.5, scale: lerp(SIDE_SCALE, OFF_SLOT.scale, f), opacity: lerp(SLOTS.side.opacity, OFF_SLOT.opacity, f) };
};
{
  const section = $("section.featured");
  const sticky = section.parentElement;
  const track = sticky.parentElement;
  const pin = new Spring(0);
  const entry = new Spring(0);
  const strip = new Spring(0);
  const spreadNow = () =>
    window.matchMedia("(max-width: 767.98px)").matches ? SPREAD.phone : window.matchMedia("(max-width: 1439.98px)").matches ? SPREAD.tablet : SPREAD.wide;
  let spread = spreadNow();
  if (REDUCED) {
    track.style.removeProperty("height");
    sticky.className = "";
    entry.set(1);
  } else {
    track.style.height = `${(F_TIMELINE.transitions * F_TIMELINE.viewportsPerTransition + 1) * 100}svh`;
    const box = createDocBox(track);
    subscribeToTicker(() => {
      const top = box.top - smoothScrollY();
      const travel = box.height - window.innerHeight;
      if (travel <= 0) return;
      pin.set(clamp01(-top / travel));
      strip.set(Math.min(Math.max((-top / travel) * F_TIMELINE.transitions, -STRIP_OVERRUN), F_TIMELINE.transitions + STRIP_OVERRUN));
      entry.set(clamp01((window.innerHeight - top) / (window.innerHeight * (1 + ENTRY_TRAVEL))));
    }, everyFrame);
  }
  ["(max-width: 1439.98px)", "(max-width: 767.98px)"].forEach((q) =>
    window.matchMedia(q).addEventListener("change", () => { spread = spreadNow(); strip._emit(); }),
  );
  const scrollToState = (index) => {
    const travel = track.offsetHeight - window.innerHeight;
    if (travel <= 0) return;
    window.scrollTo({ top: track.offsetTop + (travel * index) / F_TIMELINE.transitions, behavior: "smooth" });
  };

  // photo panel
  const photoFrame = $(".featured__photo-frame", section);
  entry.onChange((e) => {
    photoFrame.style.opacity = stage(e, 0, 0.7);
    photoFrame.style.transform = `scale(${lerp(1.04, 1, stage(e, 0, 1))})`;
  });
  const drift = $(".featured__photo-drift", section);
  drift.style.setProperty("--photo-room", `${PHOTO_PARALLAX * 100}%`);
  const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
  const wipeAt = (s, index) => easeInOutSine(clamp01((s - (index - 1) - PIECE_SWITCH.start) / PIECE_SWITCH.span));
  const wipeMask = (r) => {
    const edge = r * (100 + PIECE_SWITCH.feather);
    return `linear-gradient(to top, #000 ${(edge - PIECE_SWITCH.feather).toFixed(2)}%, transparent ${edge.toFixed(2)}%)`;
  };
  const layers = $$(".featured__photo-layer", section);
  strip.onChange((s) => {
    const t = s < 0 ? -clamp01(-s / STRIP_OVERRUN) : clamp01((s - F_TIMELINE.transitions) / STRIP_OVERRUN);
    drift.style.transform = `translate3d(0, ${((t * PHOTO_PARALLAX * 100) / (1 + 2 * PHOTO_PARALLAX)).toFixed(3)}%, 0)`;
    layers.forEach((layer, index) => {
      if (index === 0) return;
      const w = wipeAt(s, index);
      const mask = wipeMask(w);
      layer.style.maskImage = mask;
      layer.style.webkitMaskImage = mask;
      layer.style.visibility = w <= 0 ? "hidden" : "visible";
      layer.firstElementChild.style.transform = `scale(${(1 + PIECE_SWITCH.zoom * (1 - w)).toFixed(4)})`;
    });
  });

  // copy: name / price / materials hand over at the half-way point (with hysteresis)
  const titleSwap = textSwap($("#featured-title"), { versions: COPY.featuredNames.map((name) => [name]), first: { ready: true, delay: 0 } });
  const priceSwap = fadeSwap($(".featured__pill:not(.featured__pill--cta) > .grid", section));
  const materialsSwap = fadeSwap($(".featured__materials-swap", section));
  let active = 0;
  subscribeToTicker(() => {
    const s = Math.min(Math.max(strip.get(), 0), 4);
    if (Math.abs(s - active) <= 0.5 + PIECE_SWITCH.hysteresis) return;
    const next = Math.min(4, Math.max(0, Math.round(s)));
    if (next === active) return;
    active = next;
    layers.forEach((layer, i) => layer.setAttribute("aria-hidden", String(i !== active)));
    titleSwap.setActive(active);
    priceSwap.setActive(active);
    materialsSwap.setActive(active);
  }, everyFrame);
  const rise = (t, fromUnits, fontUnits) => `translate3d(0, ${(lerp(fromUnits, 0, t) / fontUnits).toFixed(4)}em, 0)`;
  const pills = $(".featured__pills", section);
  const materials = $(".featured__materials", section);
  const cue = $(".featured__cue", section);
  const crosses = $(".featured__crosses", section);
  entry.onChange((e) => {
    pills.style.opacity = stage(e, 0.3, 0.9);
    pills.style.transform = rise(stage(e, 0.3, 0.9), 12, 16);
    materials.style.opacity = stage(e, 0.45, 1);
    materials.style.transform = rise(stage(e, 0.45, 1), 12, 18);
    cue.style.opacity = stage(e, 0.2, 0.8);
    cue.style.transform = rise(stage(e, 0.2, 0.8), 8, 13);
    crosses.style.opacity = stage(e, 0.35, 0.95);
    crosses.style.transform = `scale(${lerp(0.96, 1, stage(e, 0.35, 0.95))})`;
  });
  const ctaPill = $(".featured__pill--cta", section);
  hoverable(ctaPill, { roll: rollIn(ctaPill) });

  // the indicator
  $$(".featured__dot", section).forEach((dot, index) => {
    const mark = dot.querySelector(".featured__dot-mark");
    strip.onChange((s) => {
      const c = Math.min(Math.max(s, 0), F_TIMELINE.transitions);
      mark.style.opacity = lerp(0.2, 1, clamp01(1 - Math.abs(c - index)));
    });
    dot.addEventListener("click", () => scrollToState(index));
  });

  // featured-rings: posters on the strip, the live scene over them
  const container = $(".featured__rings", section);
  const anchor = $(".featured__ring--anchor", container);
  const ringEls = $$(".featured__ring:not(.featured__ring--anchor)", container);
  const mount = $(".featured__rings-canvas", container);
  ringEls.forEach((ringEl, index) => {
    strip.onChange((s) => {
      const at = ringOnStrip(index - s, spread);
      ringEl.style.opacity = at.opacity;
      ringEl.style.transform = `translate3d(${(at.x * 100).toFixed(4)}%, ${((at.y / SLOTS.centre.height) * 100).toFixed(4)}%, 0) scale(${at.scale.toFixed(5)})`;
    });
    ringEl.firstElementChild.style.transform = `scale(${(RING_3D.fit / RING_3D.posterFit).toFixed(4)})`;
  });
  const fade = new Spring(0, { tension: 120, friction: 26 });
  fade.onChange((v) => {
    mount.style.opacity = v;
    ringEls.forEach((ringEl) => { ringEl.firstElementChild.style.opacity = v > 0.995 ? 0 : 1; });
  });
  if (isLikelyBot() || !supportsWebGL2()) ringsReady.mark();
  else {
    const budget = getSceneBudget();
    let isInView = false;
    let isDirty = true;
    let lastStrip = Number.NaN;
    let lastSpread = -1;
    const box = { cx: 0, cy: 0, width: 1, height: 1, ring: 1 };
    let scene = null;
    const measure = () => {
      const outer = container.getBoundingClientRect();
      const inner = anchor.getBoundingClientRect();
      box.cx = inner.left - outer.left + inner.width / 2;
      box.cy = inner.top - outer.top + inner.height / 2;
      box.width = inner.width;
      box.height = inner.height;
      box.ring = Math.min(box.width * RING_3D.fit, outer.height * RING_3D.maxPanelShare);
      scene?.setSize(outer.width, outer.height, box.ring);
      isDirty = true;
    };
    const slotsAt = (s) => RING_MODELS.map((_, index) => {
      const d = index - s;
      const at = ringOnStrip(d, spread);
      return { cx: box.cx + at.x * box.width, cy: box.cy + (at.y / SLOTS.centre.height) * box.height, size: box.ring * at.scale, opacity: at.opacity, spin: -d * Math.PI * 2 * RING_3D.turnsPerTransition };
    });
    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    mount.appendChild(canvas);
    RingsScene.create(canvas, budget, RING_MODELS.map((m) => ({ url: m.url, roll: (m.roll * Math.PI) / 180, pitch: (m.pitch * Math.PI) / 180 })))
      .then((created) => {
        scene = created;
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(container);
        ro.observe(anchor);
        subscribeToTicker(() => {
          if (!isInView || document.hidden) return;
          const s = strip.get();
          if (!isDirty && s === lastStrip && spread === lastSpread) return;
          lastStrip = s;
          lastSpread = spread;
          isDirty = false;
          created.render(slotsAt(s));
        }, () => budget.frameGapMs);
        created.render(slotsAt(strip.get()));
        fade.start(1);
        ringsReady.mark();
      })
      .catch((error) => {
        assetFailed(`${ASSET_BASE}/models/rings/ring-0N.glb or env/hotel-room.exr`, error);
        ringsReady.mark();
      });
    new IntersectionObserver(([e]) => { isInView = e.isIntersecting; if (isInView) isDirty = true; }, { rootMargin: "25% 0px" }).observe(container);
  }
}

// ---------------------------------------------------------------------------
// PHILOSOPHY — the card of display type
// ---------------------------------------------------------------------------
{
  const ENTRY = { backdrop: [0, 1], card: [0, 0.5], topNote: [0.2, 0.7], photo: [0.22, 0.78], sideNotes: [0.28, 0.78], pill: [0.55, 0.9] };
  const RISE = { note: 0.5, pill: 0.6 };
  const HEADING = {
    jewellery: { delay: 0, direction: "forward" }, quite: { delay: 90, direction: "backward" }, shapes: { delay: 180, direction: "centre" },
    longer: { delay: 0, direction: "forward" }, look: { delay: 90, direction: "backward" }, keep: { delay: 180, direction: "centre" },
  };
  const section = $("section.philosophy");
  const entry = new Spring(0);
  const drift = new Spring(0);
  if (REDUCED) entry.set(1);
  else {
    const box = createDocBox(section);
    subscribeToTicker(() => {
      const top = box.top - window.scrollY;
      const bottom = top + box.height;
      const shown = Math.min(window.innerHeight, bottom) - Math.max(0, top);
      entry.set(clamp01(shown / Math.min(box.height, window.innerHeight)));
      const d = (top + box.height / 2 - window.innerHeight / 2) / ((window.innerHeight + box.height) / 2);
      drift.set(Math.abs(d) < 0.01 ? 0 : d);
    }, everyFrame);
  }
  const zoom = (t, from) => `scale(${(from + (1 - from) * t).toFixed(5)})`;
  const backdrop = $(".philosophy__backdrop-frame", section);
  bind([entry, drift], (e, d) => {
    const percent = -d * 8;
    const t = stage(e, ...ENTRY.backdrop);
    backdrop.style.transform = percent === 0 ? zoom(t, 1.08) : `translate3d(0, ${percent.toFixed(4)}%, 0) ${zoom(t, 1.08)}`;
  });
  const card = $(".philosophy__card", section);
  entry.onChange((e) => {
    const t = stage(e, ...ENTRY.card);
    card.style.opacity = t;
    card.style.transform = `translate3d(0, ${((1 - t) * 3).toFixed(4)}%, 0)`;
  });
  const enter = (node, win, em) => bind([entry, drift], (e) => {
    const t = stage(e, win[0], win[1]);
    node.style.opacity = t;
    node.style.transform = `translate3d(0, ${((1 - t) * em).toFixed(4)}em, 0)`;
  });
  enter($(".philosophy__note--top", section), ENTRY.topNote, RISE.note);
  $$(".philosophy__aside", section).forEach((node) => enter(node, ENTRY.sideNotes, RISE.note));
  enter($(".philosophy__note--bottom", section), ENTRY.sideNotes, RISE.note);
  const frameEl = $(".philosophy__frame", section);
  drift.onChange((d) => { frameEl.style.transform = d === 0 ? "none" : `translate3d(0, ${(d * 12).toFixed(4)}%, 0)`; });
  const photo = $(".philosophy__photo", section);
  entry.onChange((e) => {
    const t = stage(e, ...ENTRY.photo);
    photo.style.opacity = t;
    photo.style.transform = zoom(t, 1.06);
  });
  const cta = $(".philosophy__cta", section);
  enter(cta, ENTRY.pill, RISE.pill);
  hoverable(cta, { roll: rollIn(cta) });
  // the six display lines, in document order
  const keys = ["jewellery", "quite", "shapes", "longer", "look", "keep"];
  $$(".philosophy__display", section).forEach((p, index) => {
    const key = keys[index];
    p.replaceChildren(letterReveal({ runs: COPY.philosophy[key], delay: HEADING[key].delay, direction: HEADING[key].direction, rootMargin: "0px" }));
  });
}

// footer — the subscribe form does not post anywhere
$$("form.footer__field").forEach((form) => form.addEventListener("submit", (event) => event.preventDefault()));

// ---------------------------------------------------------------------------
// PRELOADER — waits for the hero's shown images, the fonts and both scenes
// ---------------------------------------------------------------------------
{
  const gateEl = $('main > [role="status"]');
  const ruleFill = gateEl.querySelector(".bg-current");
  const percent = gateEl.querySelector(".text-caption");
  const root = document.documentElement;
  root.style.overflow = "hidden";
  const images = $$("[data-preload] img").filter((image) => image.getClientRects().length > 0);
  const total = images.length + 3;
  let settled = 0;
  const rule = new Spring(0, { tension: 140, friction: 26 });
  rule.onChange((v) => { ruleFill.style.width = `${v}%`; });
  const exitSpring = new Spring(1, { tension: 180, friction: 30 });
  exitSpring.onChange((v) => { gateEl.style.opacity = v; });
  let done = false;
  const settle = () => {
    settled += 1;
    const progress = settled / total;
    rule.start(Math.round(progress * 100));
    percent.textContent = `${Math.round(progress * 100)}%`;
    if (progress >= 1 && !done) {
      done = true;
      root.style.removeProperty("overflow");
      gateEl.style.pointerEvents = "none";
      exitSpring.start(0, { delay: 190 });
      setTimeout(setLoaded, 190 + 480 * 0.45);
      setTimeout(() => gateEl.remove(), 190 + 480);
    }
  };
  document.fonts.ready.then(settle).catch(settle);
  pendantReady.when(6000).then(settle);
  ringsReady.when(6000).then(settle);
  const pending = new Set();
  const finish = (image) => { if (pending.delete(image)) settle(); };
  images.forEach((image) => {
    if (image.complete) { settle(); return; }
    pending.add(image);
    image.addEventListener("load", () => finish(image), { once: true });
    image.addEventListener("error", () => finish(image), { once: true });
  });
  setTimeout(() => [...pending].forEach(finish), 6000);
}

// warm-below-fold — once the page is up, decode the lazy images one by one
whenLoaded(() => setTimeout(() => {
  const images = $$('main img[loading="lazy"]');
  const idle = (run) => (window.requestIdleCallback ? requestIdleCallback(run, { timeout: 1000 }) : setTimeout(run, 50));
  const next = () => {
    const image = images.shift();
    if (!image) return;
    image.loading = "eager";
    image.decode().catch(() => undefined).then(() => idle(next));
  };
  idle(next);
}, 2500));
```