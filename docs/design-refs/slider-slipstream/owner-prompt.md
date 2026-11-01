# Recreate this section: Slider Slipstream

You are an expert front-end developer. Produce a **single self-contained `index.html`** that
renders the section below **exactly** as specified — same layout, styles, typography, colors,
copy, responsive behaviour and interactions. No build step, no framework, no external CSS/JS
(inline everything). Hardcode every value given here as fixed constants.

## What it is

An immersive **infinite 3D carousel** on a near-black stage. Portrait image-cards stand on one
tilted belt built with pure CSS 3D (no WebGL) that recedes diagonally into the dark — the cards on
the right loom large and near, the cards on the left shrink and dissolve into black — and the belt
wraps forever, so it reads as one continuous river of cards. Drag / swipe / arrow-keys to fly
through it; it also idles with a slow leftward drift. Each card is real HTML, so the serif title and
uppercase meta stay perfectly crisp. Type is Fraunces (serif display) + Inter (UI), from Google
Fonts.

## Layout & structure

A full-viewport fixed `#section` (`position: fixed; inset: 0`) containing, in z-order:

- `#stage` — the fixed, focusable 3D stage (`tabindex="0"`, `role="region"`, `aria-label`), with
  `perspective` set on it and holding `#belt`.
- `#belt` — an absolutely-positioned `preserve-3d` layer rotated on Y (`rotateY(--tilt)`). JS fills
  it with the card articles.
- `#vignette` — a fixed cosmetic overlay (far-edge dark fall-off + floor vignette).
- `#top` — fixed header: `#brand` ("Slipstream" + a short rule) on the left, `#nav` (populated by
  JS) on the right.
- `#lede` — a fixed, centered serif headline (`<h1>`), populated by JS, `pointer-events: none`.
- `.hint` — a fixed bottom-center caption reading "Drag to explore".

Each belt card is built by JS as:

```html
<article class="card">
  <div class="card__inner">
    <img src="…" alt="{title}" draggable="false" loading="lazy">
    <div class="card__scrim"></div>
    <div class="card__foot">
      <h3 class="card__title">{title}</h3>
      <p class="card__meta">{meta}</p>
    </div>
  </div>
</article>
```

The body markup (before JS runs):

```html
<div id="section">
  <div id="stage" tabindex="0" role="region" aria-label="Slipstream — draggable 3D card carousel. Use left and right arrow keys to move.">
    <div id="belt"></div>
  </div>
  <div id="vignette"></div>

  <header id="top">
    <div id="brand"><span>Slipstream</span><span class="rule"></span></div>
    <nav id="nav"></nav>
  </header>
  <h1 id="lede"></h1>
  <div class="hint">Drag to explore</div>
</div>
```

Keep the Google Fonts links in `<head>` exactly as:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,340;9..144,400;9..144,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

## Styles

Use this CSS verbatim (it is the pure-CSS 3D tilted belt, the card scrim/overlay, the header chrome,
and all media queries). Colors, radii and type sizes are driven by CSS custom properties on
`#section`; the JS below sets them to the fixed values.

```css
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: #0a0a0c; overflow: hidden; }
#section { position: fixed; inset: 0; color: #fff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --bg: #0a0a0c;
  --corner: 14px; --lift: 1.035; --shadow: 1; --vig: 1;
  --title-size: 20px; --meta-size: 11.5px; --title-color: #ffffff; --scrim: 1;
}

/* ---------- stage + belt ---------- */
#stage { position: fixed; inset: 0; overflow: hidden; z-index: 1;
  background:
    radial-gradient(130% 100% at 72% 62%, #16161c 0%, var(--bg) 62%, #050506 100%);
  perspective: 1500px; perspective-origin: 50% 64%;
  cursor: grab; touch-action: none; user-select: none; outline: none; }
#stage.-drag { cursor: grabbing; }

#belt { position: absolute; inset: 0; transform-style: preserve-3d;
  transform: rotateY(var(--tilt, -32deg)); }

.card { position: absolute; left: 50%; top: var(--cy, 64%);
  width: var(--cw, 230px); height: var(--ch, 308px);
  margin-left: calc(var(--cw, 230px) / -2); margin-top: calc(var(--ch, 308px) / -2);
  transform-style: preserve-3d; will-change: transform, opacity; }

.card__inner { position: absolute; inset: 0; border-radius: var(--corner); overflow: hidden;
  background: #131318;
  box-shadow: 0 40px 80px -24px rgba(0,0,0, calc(.72 * var(--shadow))),
              0 8px 24px -10px rgba(0,0,0, calc(.6 * var(--shadow)));
  transition: transform .34s cubic-bezier(.22,.61,.36,1), box-shadow .34s ease;
  will-change: transform; }
/* .-active is set by JS on the one card under the pointer (never via CSS :hover — see script) */
.card.-active .card__inner { transform: scale(var(--lift));
  box-shadow: 0 52px 100px -24px rgba(0,0,0,.8), 0 10px 30px -10px rgba(0,0,0,.7); }
.card__inner img { position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; display: block; }

.card__scrim { position: absolute; inset: 0; pointer-events: none; opacity: var(--scrim);
  background: linear-gradient(to top,
    rgba(4,4,6,.92) 0%, rgba(4,4,6,.55) 24%, rgba(4,4,6,.08) 46%, rgba(4,4,6,0) 62%); }

.card__foot { position: absolute; left: 16px; right: 14px; bottom: 15px; z-index: 2; }
.card__title { margin: 0; font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-weight: 400; font-size: var(--title-size); line-height: 1.12; letter-spacing: -.005em;
  color: var(--title-color); text-shadow: 0 2px 14px rgba(0,0,0,.55); }
.card__meta { margin: 7px 0 0; font-size: var(--meta-size); font-weight: 500;
  letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.6); }

/* far-edge dark fall-off + floor vignette (purely cosmetic; opacity fade does the real hiding) */
#vignette { position: fixed; inset: 0; z-index: 2; pointer-events: none; opacity: var(--vig);
  background:
    linear-gradient(to right, #050506 0%, rgba(5,5,6,.55) 12%, rgba(5,5,6,0) 34%),
    linear-gradient(to bottom, rgba(5,5,6,0) 62%, rgba(5,5,6,.5) 100%); }

/* ---------- header chrome ---------- */
#top { position: fixed; top: 0; left: 0; right: 0; z-index: 5;
  display: flex; align-items: center; justify-content: space-between;
  padding: 26px clamp(20px, 4vw, 56px); }
#brand { display: flex; align-items: center; gap: 14px; font-weight: 600; font-size: 16px;
  letter-spacing: .02em; }
#brand .rule { width: 34px; height: 1px; background: rgba(255,255,255,.5); display: inline-block; }
#nav { display: flex; gap: clamp(16px, 2.4vw, 34px); }
#nav a { color: rgba(255,255,255,.82); text-decoration: none; font-size: 14px; font-weight: 500;
  letter-spacing: .01em; transition: color .2s; }
#nav a:hover, #nav a:focus-visible { color: #fff; }

#lede { position: fixed; top: clamp(96px, 15vh, 150px); left: 0; right: 0; z-index: 4;
  margin: 0; padding: 0 clamp(22px, 6vw, 48px); text-align: center; pointer-events: none;
  font-family: 'Fraunces', Georgia, serif; font-weight: 340; letter-spacing: -.015em;
  font-size: clamp(27px, 4.4vw, 62px); line-height: 1.1; color: #fff; text-wrap: balance; }

.hint { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 5;
  font-size: 11px; letter-spacing: .3em; text-transform: uppercase; font-weight: 500;
  color: rgba(255,255,255,.34); pointer-events: none; user-select: none; }

a:focus-visible, #stage:focus-visible { outline: 2px solid rgba(255,255,255,.7); outline-offset: 3px; }

@media (max-width: 720px) {
  #nav { display: none; }
  #top { padding: 18px 20px; }
  #brand { font-size: 14px; }
  #brand .rule { width: 22px; }
  #lede { top: clamp(78px, 12vh, 116px); }
  #lede br { display: none; }   /* let the heading wrap naturally instead of the desktop break */
  .hint { bottom: 18px; letter-spacing: .24em; }
}
@media (max-height: 540px) {
  #lede { top: 58px; font-size: clamp(22px, 5.6vw, 38px); }
}
@media (prefers-reduced-motion: reduce) { .card__inner { transition: none; } }
```

## Fixed parameters (bake these in)

All tunables are constants — hardcode them exactly. Keep them in a `const P = { … }` block so the
functions below can read them:

```js
const P = {
  // stage
  bg: '#0a0a0c',
  vignette: 1.4,
  // belt
  slots: 9,
  cardScale: 1,
  cardRatio: 1.34,
  tilt: -32,
  spacing: 0.3,
  perspective: 1,
  cardY: 0.64,
  corner: 14,
  cardShadow: 1,
  // motion
  autoScroll: 0.22,
  drag: 0.9,
  damp: 0.92,
  hoverLift: 1.035,
  // fade
  fadeFar: 0.24,
  nearHide: 0.4,
  // overlay
  scrim: 1.4,
  titleSize: 20,
  metaSize: 11.5,
  titleColor: '#ffffff',
}
```

Header chrome content (baked):

```js
const HEADER = {
  nav: ['Places', 'Authors', 'Journal', 'About', 'Connect'],
  lede: 'Selected and popular stories<br>from the studio right now',
}
```

The cards — the content, in this exact order (image URLs are given in **Assets**; there are 6 cards
and they cycle to fill the 9 belt slots):

```js
const CARDS = [
  { img: `${ASSET_BASE_URL}/tidepool.webp`, title: 'Fluid worlds beneath the surface', meta: 'Places · 6 min' },
  { img: `${ASSET_BASE_URL}/molten.webp`,   title: 'Marbled gold, caught mid-pour',    meta: 'Textures · 4 min' },
  { img: `${ASSET_BASE_URL}/neon.webp`,     title: 'Painting with light in the dark',  meta: 'Studio · 5 min' },
  { img: `${ASSET_BASE_URL}/prism.webp`,    title: 'Colour fields and soft collisions',meta: 'Abstract · 3 min' },
  { img: `${ASSET_BASE_URL}/fauve.webp`,    title: 'Bold strokes, louder palettes',    meta: 'Painting · 7 min' },
  { img: `${ASSET_BASE_URL}/kinetic.webp`,  title: 'Kinetic lines that never rest',    meta: 'Motion · 5 min' },
]
```

## Behaviour & interaction

Write the script as an ES module (`<script type="module">`). Everything below is the section's real
interactivity — reproduce it faithfully.

**Setup.** Read the reduced-motion preference once, grab the three elements, then populate the
header chrome from `HEADER`:

```js
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches
const section = document.getElementById('section')
const stage = document.getElementById('stage')
const belt = document.getElementById('belt')

document.getElementById('nav').innerHTML = HEADER.nav.map(n => `<a href="#" tabindex="0">${n}</a>`).join('')
document.getElementById('lede').innerHTML = HEADER.lede
```

**Build the belt.** Create `P.slots` (9) card articles, cycling through `CARDS` with `i % CARDS.length`:

```js
let cardEls = []
function buildBelt() {
  belt.innerHTML = ''; cardEls = []; hoverEl = null   // drop any stale reference to a removed card
  for (let i = 0; i < P.slots; i++) {
    const cd = CARDS[i % CARDS.length]
    const card = document.createElement('article')
    card.className = 'card'
    card.innerHTML = `
      <div class="card__inner">
        <img src="${cd.img}" alt="${cd.title}" draggable="false" loading="lazy">
        <div class="card__scrim"></div>
        <div class="card__foot">
          <h3 class="card__title">${cd.title}</h3>
          <p class="card__meta">${cd.meta}</p>
        </div>
      </div>`
    belt.appendChild(card)
    cardEls.push(card)
  }
}
```

**Geometry (responsive).** `STEP` and `SPAN` drive the infinite-wrap math. Card width tracks the
viewport (clamped 168–250 px), height is width × ratio, `STEP` is one card + spacing, and `SPAN` is
the whole loop (one full lap of the belt). This also writes the perspective / tilt / belt-height CSS
vars:

```js
let CW = 230, CH = 308, STEP = 220, SPAN = 1980
function layout() {
  const vw = innerWidth
  CW = Math.min(250, Math.max(168, vw * 0.16)) * P.cardScale
  CH = CW * P.cardRatio
  STEP = CW * (1 + P.spacing)
  SPAN = STEP * P.slots
  stage.style.setProperty('--cw', CW + 'px')
  stage.style.setProperty('--ch', CH + 'px')
  stage.style.setProperty('--cy', (P.cardY * 100) + '%')
  stage.style.setProperty('--tilt', P.tilt + 'deg')
  stage.style.perspective = Math.max(800, vw * 0.9 * P.perspective) + 'px'
  stage.style.perspectiveOrigin = '50% ' + (P.cardY * 100) + '%'
}
```

**Style vars.** Push the baked look values onto `#section`:

```js
function applyStyles() {
  const s = section.style
  s.setProperty('--bg', P.bg)
  s.setProperty('--vig', P.vignette)
  s.setProperty('--corner', P.corner + 'px'); s.setProperty('--shadow', P.cardShadow)
  s.setProperty('--lift', P.hoverLift); s.setProperty('--scrim', P.scrim)
  s.setProperty('--title-size', P.titleSize + 'px'); s.setProperty('--meta-size', P.metaSize + 'px')
  s.setProperty('--title-color', P.titleColor)
}
```

**Opacity fade.** A card's opacity is a function of its position along the belt (fraction
`f ∈ [-0.5, 0.5)`): fade **in** from the far/left edge over `fadeFar`, and fade **out** just before
the near seam past `nearHide`. This is what makes the belt dissolve into black on both ends instead
of popping:

```js
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
function vis(f) {
  const far = smoothstep(-0.5, -0.5 + P.fadeFar, f)
  const near = 1 - smoothstep(P.nearHide, 0.5, f)
  return Math.min(far, near)
}
```

**Placement — the infinite wrap.** For each card, compute its wrapped X on the belt from its base
slot offset plus the current scroll `pos`, modulo `SPAN`, re-centered into `[-half, half)`. Set the
transform, opacity, and hide fully-transparent cards. This modular wrap is what makes the river of
cards loop forever:

```js
function place() {
  const half = SPAN / 2
  for (let i = 0; i < cardEls.length; i++) {
    let x = ((i * STEP + pos) % SPAN + SPAN) % SPAN      // [0, SPAN)
    if (x > half) x -= SPAN                              // [-half, half)
    const op = vis(x / SPAN)
    const el = cardEls[i]
    el.style.transform = 'translateX(' + x.toFixed(1) + 'px)'
    el.style.opacity = op.toFixed(3)
    el.style.visibility = op < 0.008 ? 'hidden' : 'visible'
  }
}

window.addEventListener('resize', () => { layout(); place() })
```

**Hover, driven by pointer movement (not CSS `:hover`).** On this overlapping 3D belt, CSS `:hover`
is re-evaluated every frame and flip-flops between overlapping cards even with the cursor still,
pulsing the scale transition (a visible "shake"). Instead, pick the hovered card only when the
pointer actually **moves**, via `elementFromPoint` (one deterministic result per call) — a still
cursor fires no events, so the active card can't change. Touch is excluded (no real hover; a sticky
state would freeze the belt):

```js
const CAN_HOVER = matchMedia('(hover: hover) and (pointer: fine)').matches
let hoverEl = null
function setHover(card) {
  if (card === hoverEl) return
  if (hoverEl) hoverEl.classList.remove('-active')
  hoverEl = card
  if (hoverEl) hoverEl.classList.add('-active')
}
function hoverAt(x, y) {
  const el = document.elementFromPoint(x, y)
  setHover(el ? el.closest('.card') : null)
}
```

**Interaction — drag to fly (inertia) + idle drift + keyboard.** Pointer drag scrolls the belt and
records velocity for a momentum fling; arrow keys nudge the velocity. `drag` scales pointer
movement, so the belt tracks the finger/cursor:

```js
let pos = 0, vel = 0, dragging = false, lastX = 0
stage.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; vel = 0; setHover(null); stage.classList.add('-drag'); stage.setPointerCapture(e.pointerId) })
stage.addEventListener('pointermove', (e) => {
  if (dragging) {
    const dx = e.clientX - lastX; lastX = e.clientX
    const d = dx * P.drag; pos += d; vel = d
  } else if (CAN_HOVER) {
    hoverAt(e.clientX, e.clientY)
  }
})
const end = () => { dragging = false; stage.classList.remove('-drag') }   // leave hover off so a fling glides; it re-arms on the next move
stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end)
stage.addEventListener('pointerleave', () => setHover(null))
stage.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { vel += STEP * 0.14; e.preventDefault() }
  else if (e.key === 'ArrowLeft') { vel -= STEP * 0.14; e.preventDefault() }
})
```

**The animation loop.** While not dragging: if no card is actively hovered, advance by the current
velocity and subtract the slow idle drift (`autoScroll`, unless reduced-motion), then decay velocity
by `damp`. Hovering a card pauses the belt so it can't slide under a resting cursor, but momentum
still decays so nothing jumps when the pointer leaves. Only re-`place()` when `pos` actually changed:

```js
let lastPlaced = NaN
function tick() {
  if (!dragging) {
    if (!hoverEl) { pos += vel; if (!REDUCE) pos -= P.autoScroll }
    vel *= P.damp
  }
  if (pos !== lastPlaced) { place(); lastPlaced = pos }   // only touch the DOM when the belt moved
  requestAnimationFrame(tick)
}
```

**Kick everything off:**

```js
buildBelt(); layout(); applyStyles(); place(); tick()
```

Accessibility to preserve: the stage is keyboard-focusable with the descriptive `aria-label`; arrow
keys move the belt; `:focus-visible` outlines on the stage and nav links; the reduced-motion branch
disables the idle drift and the card transition.

## Responsive

- Card width is fluid: `min(250, max(168, viewportWidth × 0.16)) × cardScale` px, height = width ×
  1.34. Belt geometry and wrap span recompute on every resize, then re-place.
- **≤ 720px wide:** hide `#nav`; tighten `#top` padding to `18px 20px`; shrink `#brand` to 14px and
  its rule to 22px; raise `#lede` and drop its desktop `<br>` (heading wraps naturally); nudge the
  `.hint` up with tighter tracking.
- **≤ 540px tall (landscape/short):** pull `#lede` up to `top: 58px` and shrink it to
  `clamp(22px, 5.6vw, 38px)`.
- The page never scrolls (`html, body { overflow: hidden }`); the section is a fixed full-viewport
  stage. Works down to narrow phone widths.

## Assets

Define once at the top of the script and route every image through it:

```js
const ASSET_BASE_URL = 'https://api.getlayers.ai/storage/v1/object/public/public/assets/slider-slipstream-c3ee71395b'
```

The 6 card images (portrait `.webp`), used in the `CARDS` array above:

- `https://api.getlayers.ai/storage/v1/object/public/public/assets/slider-slipstream-c3ee71395b/tidepool.webp`
- `https://api.getlayers.ai/storage/v1/object/public/public/assets/slider-slipstream-c3ee71395b/molten.webp`
- `https://api.getlayers.ai/storage/v1/object/public/public/assets/slider-slipstream-c3ee71395b/neon.webp`
- `https://api.getlayers.ai/storage/v1/object/public/public/assets/slider-slipstream-c3ee71395b/prism.webp`
- `https://api.getlayers.ai/storage/v1/object/public/public/assets/slider-slipstream-c3ee71395b/fauve.webp`
- `https://api.getlayers.ai/storage/v1/object/public/public/assets/slider-slipstream-c3ee71395b/kinetic.webp`

Fonts: keep the Fraunces + Inter Google Fonts `<link>` tags exactly as given in **Layout &
structure**.