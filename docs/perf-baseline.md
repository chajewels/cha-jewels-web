# Performance baseline

## 2026-09-23 — Motion Phase 3: loyalty ladder, gold guide story, header, page transitions

Before = `47128f2` (gallery approved). After = this commit. `next build` +
`next start`, preview-fixtures mode, same data on both, interleaved pairs on
a throttled phone (4× CPU, 1.6 Mbps / 150 ms), median of 4. CLS measured
over the load AND a scroll down and back up (header hide/show, the ladder,
the pinned story).

| page | observed LCP before | after | CLS | added JS gz (page load) | stylesheets |
|---|---|---|---|---|---|
| `/` | 2926 ms | 2936 ms | 0 → 0 | +1.8 kB | 2 → 2 |
| `/collections/bracelets` | 1296 ms | 1296 ms | 0 → 0 | +1.4 kB | 2 → 2 |
| product (`double-sided-diamond-pendant`) | 1300 ms | 1302 ms | 0 → 0 | +2.0 kB | 2 → 2 |
| `/loyalty` | 1318 ms | 1312 ms | 0 → 0 | +5.9 kB | 2 → 2 |
| `/gold-guide` | 1320 ms | 1300 ms | 0 → 0 | +5.9 kB | 2 → 2 |

All within run-to-run noise. The +1.4–2.0 kB on every page is the header
(scroll behaviour, nav underline) and the page entrance; /loyalty and
/gold-guide add the ladder / story plus split headings and the magnetic CTA.

**A THIRD STYLESHEET, CAUGHT AND REMOVED.** The first build of this phase
shipped three render-blocking stylesheets on every page: Next split the
root CSS, moving the next/font rules (7.5 kB) into a file of their own. The
cause was ~2.6 kB of new Tailwind arbitrary-value classes (mostly the guide
plates). They are component stylesheets now (`ComponentStyle`, like every
other motion component) and the root file is back to one, 66.7 kB — smaller
than before (66.9 kB). **The root CSS sits close to that split point: new
one-off styling belongs in a component stylesheet, not in utility classes.**
The brief's `app/template.tsx` was replaced by `components/fx/page-enter.tsx`
while chasing this; it was not the cause, but it does the same job with no
wrapper element or remount, so it stays.

Videos: `docs/screenshots/web-motion-signature/loyalty-guide-header-desktop-before-after.webm`
(1440px: nav underline, loyalty ladder, header hide/return, client
navigation into the gold guide, the pinned story) and
`loyalty-guide-header-phone-before-after.webm` (390px, same path).
Screenshots: `docs/screenshots/web-motion-signature/phase3/`.

---

## 2026-09-23 — Motion Phase 2B: product gallery slide, zoom, full-screen viewer, Sold state

Before = `101d094`. After = this commit. `next build` + `next start` in
preview-fixtures mode, both builds carrying the same LOCAL, UNCOMMITTED
fixture patch that gives the twist bangle R3341's four real Hub photos (dark
backgrounds), so the dark-photo case could be measured; the patch is not in
the repo. Interleaved pairs on a throttled phone (4× CPU, 1.6 Mbps / 150 ms).

| page | observed LCP before | after | added JS gz (page load) | stylesheets |
|---|---|---|---|---|
| product with R3341 photos (median of 8) | 2788 ms | 2794 ms | +3.8 kB | 2 → 2 |
| `double-sided-diamond-pendant` (median of 4) | 1308 ms | 1296 ms | +3.8 kB | 2 → 2 |

Within run-to-run noise on both. The first photo is still the LCP element,
preloaded, on frame one, untransformed. The full-screen viewer is a separate
**4.9 kB gz** chunk fetched on first open only (verified: not requested on
load). The hover zoom's full-resolution file is fetched only when the cursor
first rests on that photo (verified: no large image request before hover).

**Gallery timing (owner review: "too fast").** One token, `GALLERY` in
lib/motion.ts, for every input on every device. Measured in desktop Chrome /
WebKit iPhone emulation: arrow slide 857 / 863 ms; fast flick 768 / 768 ms
(floor 750 ms — the flick's speed is not carried over); slow drag past the
threshold 753 / 753 ms; spring-back 550 / 565 ms; five presses in ~400 ms
land once on the latest photo. Reduced motion: instant.

Videos: `docs/screenshots/web-motion-signature/gallery-desktop-before-after.webm`
(1440px: arrows, thumbnail, hover zoom, full screen) and
`gallery-phone-before-after.webm` (390px, real touch: slow drag that springs
back, slow drag, fast flicks, arrow, full screen with pinch, pan, double-tap,
swipe, swipe down to close).

---

## 2026-09-23 — Motion Phase 2A: product cards and the product page

Before = `fb2ecee` (Phase 1 accepted). After = `29808b9`. `next build` +
`next start` in preview-fixtures mode (no Hub credentials on this machine),
interleaved pairs on a throttled phone (4× CPU, 1.6 Mbps / 150 ms).

| page | observed LCP before (median of 4) | after | added JS gz | added HTML gz | stylesheets |
|---|---|---|---|---|---|
| `/collections/bracelets` | 1316 ms | 1308 ms | +4.0 kB | +0.8 kB | 2 → 2 |
| `/categories/fine-jewelry` | 1426 ms | 1416 ms | +4.1 kB | +0.9 kB | 2 → 2 |
| product (`double-sided-diamond-pendant`) | 1296 ms | 1298 ms | +6.7 kB | +0.7 kB | 2 → 2 |
| `/` | 2936 ms | 2928 ms | +4.9 kB | +0.8 kB | 2 → 2 |

Homepage mobile weight (Lighthouse): **1029 KiB** (cap 1317). CLS 0 on
every run. No animation library: the gallery's drag and slide, the rolling
figures and the cart bump are Web Animations / rAF, so there is no library
size to report.

**Stylesheets.** The first build put these styles in CSS Modules, as asked
for ("component-scoped files"). Next emitted them as a THIRD render-blocking
stylesheet on every page with a product card — the same shape that cost
the collection and product pages ~60 ms in round 2. So each component now
carries its rules as a string rendered through React 19's hoisted
`<style href precedence>` (components/fx/component-style.tsx): scoped to the
component, inlined into `<head>` once per page, no request, no growth of
`app/globals.css`. Cost: the +0.7–0.9 kB of HTML above.

---

## 2026-09-23 — Motion Phase 1, round 2: bolder homepage (after owner review)

Before = `68bec32` (no motion). After = `b229c56`. Both `next build` +
`next start`, interleaved pair by pair. Both builds in preview-fixtures mode —
this machine has no Hub credentials (`HUB_API_URL`/`HUB_API_KEY` are empty
here and in the main checkout), so the measured pages carry fixture data and
no testimonials section. The recorded videos used a local, uncommitted patch
that gives BOTH builds five labelled placeholder testimonials, so the section
could be shown; the patch was never committed and was not present for any
measurement below.

| gate | before | after | |
|---|---|---|---|
| Observed LCP, throttled phone `/` (4× CPU, 1.6 Mbps; median of 8 pairs) | 2848 ms (2756–2892) | **2912 ms** (2892–2928) | **+64 ms (+2.2%) — just beyond before's own spread** |
| Observed LCP, throttled phone, collection (3 pairs) | 1304 ms | 1300 ms | pass |
| Observed LCP, throttled phone, product (3 pairs) | 1300 ms | 1300 ms | pass |
| Observed LCP, Lighthouse mobile `/` (median of 3 pairs) | 201 ms | 209 ms | pass (within spread) |
| Simulated LCP, Lighthouse mobile `/` | 4140 ms | 4218 ms | pass (spec spread 3476–5717) |
| Homepage mobile weight (cap 1317 KiB) | 1318 KiB | **1023 KiB** | pass |
| Added JS, gzipped (budget 35 kB) | — | **+3.4 kB** | pass |
| Added CSS / HTML, gzipped | — | +2.0 kB / +1.5 kB | |
| CLS | 0 | 0 | pass |

Across the sessions of this round the homepage throttled delta measured +8,
+50 and +64 ms for near-identical bytes; the interleaved method narrows but
does not remove session drift. The collection and product pages sit at
parity.

What it is: bytes in the LCP window again (6.9 KB gzipped across JS, CSS and
HTML), not the animations — an ablation with the push-in or the overlays
switched off measured the same as with them on.

Found and fixed on the way:
- A third render-blocking stylesheet. The new rules pushed `globals.css` past
  the 100 KiB limit Next's CssChunkingPlugin merges up to, splitting Inter's
  `@font-face` into its own file and costing the collection and product
  pages ~60 ms. My comment blocks became one-line pointers; back to two files.
  **globals.css is now close to that limit** — Phase 2 page effects should
  live in route-scoped CSS, not in globals.

Options for the remaining +64 ms, for the owner:
1. Accept it (2.2% on a 1.6 Mbps line; Lighthouse and the other pages flat).
2. Offset it: a 144px header logo for 3× phones instead of the 192px file
   (~5 KB, ~25 ms), plus the same on the footer, which loads the 192px file
   eagerly. No visible change. Not done: brand assets.
3. Trim the effects' HTML: the RevealItem wrappers and their `--i` styles
   repeat in the markup and again in the RSC payload (~1 KB gzipped).

---

## 2026-09-23 — Motion Phase 1: homepage (`feature/web-motion-signature`)

Before = this branch at `68bec32` (develop merged, no motion code). After =
`9d7624f`. Both built with `next build` and served with `next start` on the
same machine; before and after were run **interleaved, pair by pair**,
because runs taken hours apart drifted by more than the effect being
measured (a morning-vs-afternoon comparison of identical code moved
Lighthouse observed LCP by ~75 ms). Lighthouse 12, one binary installed
locally and called directly (the loop works; `npx` inside a loop is what
failed before). No language cookie = the Japanese homepage.

### Budget table

| gate | before | after | result |
|---|---|---|---|
| **Observed LCP, Lighthouse mobile `/`** (median of 5, interleaved) | 227 ms (169–338) | **180 ms** (152–261) | pass — no regression |
| **Observed LCP, throttled phone `/`** (4× CPU, 1.6 Mbps / 150 ms, median of 8 interleaved pairs) | 2840 ms (2748–2860) | **2880 ms** (2864–2892) | **+40 ms (+1.4%) — see below** |
| Observed LCP, throttled phone, `/collections/bracelets` (3 pairs) | 1324 ms | 1312 ms | pass |
| Observed LCP, throttled phone, product `/products/twist-bangle` (3 pairs) | 1320 ms | 1300 ms | pass |
| Simulated mobile LCP `/` (median of 5, interleaved) | 3920 ms (3840–4141) | 3922 ms (3914–4149) | pass — flat |
| **Homepage mobile transfer weight** (Lighthouse, cap 1317 KiB) | 1319 KiB | **1021 KiB** | pass (−298 KiB) |
| Desktop Performance `/` | 100 | 100 | pass |
| CLS (every page, every run) | 0 | 0 | pass |
| TBT mobile `/` | 8 ms | 7 ms | pass |
| **Added client JS, gzipped** (every script the homepage HTML references, `nomodule` polyfills excluded) | 164,427 B | 166,930 B | **+2.5 kB** (budget 35 kB) |
| Collection / product mobile weight (Lighthouse) | 656 / 757 KiB | 355 / 458 KiB | pass |

The weight row falls because of the favicon (`perf(icon)`, own commit):
`app/icon.png` was a 323 KiB, 512 px photographic badge fetched on every page.
At 192 px it is 21 KiB and indistinguishable at any size a browser shows it.
Without that commit the homepage would sit at ~1355 KiB, over the cap — the
baseline was already 1 KiB over it before any motion code, because the 1317
figure predates the 720p encode from #129.

### The one gate not met: +40 ms on a throttled phone

Every one of the 8 throttled pairs has the after build slower, by 20–140 ms,
median +40 ms. What it is, established by elimination:

- **Not the animation library.** The first build used `motion` (+17 KiB at
  first load, +16 KiB lazily) and measured +28 to +68 ms over 5 pairs.
  Removing the library entirely (commit `9d7624f`) left +40 ms.
- **Not the sheen animating during the poster's paint.** Three variants of
  the same build, interleaved with the before build: sheen from 0.35 s
  +48 ms (8 pairs), sheen gated on the poster being decoded +40 ms (6 pairs),
  sheen pushed to 3.5 s +20 ms (5 pairs, two of them after-faster). All three
  sit inside the ±30 ms pair-to-pair spread, so the sheen stays as designed:
  first pass at 0.35 s, from the server markup.
- **It is bytes in the LCP window.** With the HTML delivered instantly (a
  Playwright route that bypasses the throttle for the document), before,
  after and after-without-sheen all measured 2604–2648 ms — identical. On a
  1.6 Mbps link every kilobyte that travels before the poster finishes costs
  it roughly 5 ms, and this pass adds **4.8 KB gzipped** in that window:
  CSS +1.2 KB (every effect's styles), HTML +1.1 KB (the sheen's copy of the
  headline, the reveal attributes), JS +2.5 KB (the effect components).

Options, for the owner:

1. **Accept it.** 40 ms on a 1.6 Mbps line; not visible in Lighthouse
   (observed LCP is lower after, simulated is flat) and not on the other two
   pages.
2. **Offset it with bytes from the same window.** The header logo requests
   `logo-badge-192.webp` (13 KB) on 3× phones for a 44 px box; a 144 px file
   is ~8 KB. That recovers ~25 ms and changes nothing visible. Not done
   here, because it is a brand asset outside this brief.
3. **Trim the effects' own bytes.** The largest single piece is the sheen's
   duplicate headline in the HTML (it is in the markup and again in the RSC
   payload). Rendering it client-side only would save ~0.4 KB but delay the
   first pass until hydration — which on a mid-range phone pushes it past
   the 3-second noticeability rule. Not recommended.

### How it was measured

- Lighthouse: `lighthouse <url> --only-categories=performance --output=json`
  (mobile default) and `--preset=desktop`; medians and ranges read from
  `metrics` (`largestContentfulPaint` and `observedLargestContentfulPaint`)
  and `total-byte-weight`.
- Throttled phone: Playwright + CDP, 390×844 at DPR 3, touch, 4× CPU,
  1.6 Mbps down / 750 kbps up / 150 ms latency, cache disabled; LCP from a
  `largest-contentful-paint` PerformanceObserver, 12 s settle.
- Added JS: every `<script src>` in the served homepage HTML, gzipped, both
  builds.

---

## 2026-09-23 — PR `perf/mobile-weight`: hero clip on phones

Both builds served from `next start` on localhost, so the two differ only by the
code. Medians of 3, one Lighthouse command per invocation. Lighthouse renders
the site with **no language cookie, which resolves to Japanese** — the numbers
below are the JA homepage.

`VERCEL_AUTOMATION_BYPASS_SECRET` is **not** in `.env.local`, so the PR preview
could not be measured behind Deployment Protection. Measured develop vs this
branch locally instead, which is the cleaner comparison anyway: same machine,
same network, no CDN variance.

### Homepage `/` — median of 3 (range)

| | develop | this branch | delta |
|---|---|---|---|
| **mobile transfer weight** | **2786 KB** | **1317 KB** | **−1469 KB (−53%)** |
| mobile Performance | 88 (78–88) | 86 (78–88) | −2, inside noise |
| mobile simulated LCP | 3936 ms (3930–5645) | 4150 ms (3947–5642) | +214 ms, inside noise |
| mobile observed LCP | 227 ms (200–1283) | 288 ms (231–1203) | +61 ms, inside noise |
| mobile TBT | 10 ms (7–46) | 22 ms (19–24) | +12 ms |
| mobile CLS | 0.0000 | 0.0000 | — |
| desktop transfer weight | 2806 KB | 2788 KB | −18 KB |
| desktop Performance | 100 (100–100) | 100 (99–100) | — |
| desktop simulated LCP | 728 ms (723–786) | 804 ms (786–852) | +76 ms |
| desktop observed LCP | 302 ms (214–402) | 285 ms (190–315) | −17 ms |

**Read the weight row, not the LCP rows.** On localhost there is no bandwidth
limit, so removing 1.5 MB cannot show up as a faster LCP — the old build fetched
its 1.9 MB clip almost instantly. Every LCP column above is inside its own
run-to-run spread and none of it is a real signal either way. The saving is real
on a real connection, which is exactly where it matters and exactly what the
local harness cannot show. Re-measure on the PR preview, or on production after
merge, to see it.

### Hero clip encodes

Source: `public/videos/hero-artisan.mp4` (H.264 1920×1080, 1.28 Mbps, 24.67 s,
no audio) — the higher-bitrate of the two existing files, so the least
generational loss. Same framing, same 16:9, no crop.

| file | resolution | size | vs before |
|---|---|---|---|
| `hero-artisan.webm` (desktop, unchanged) | 1920×1080 VP9 | 1,946,820 B (1.86 MB) | — |
| `hero-artisan.mp4` (desktop, unchanged) | 1920×1080 H.264 | 3,961,044 B (3.78 MB) | — |
| **`hero-artisan-mobile.webm`** | 1280×720 VP9 | **442,157 B (431 KiB)** | −77% |
| **`hero-artisan-mobile.mp4`** | 1280×720 H.264 | **452,077 B (441 KiB)** | −89% |


**720p, not 480p — the owner's choice, 2026-09-23.** An 854×480 pair was encoded
first (397 KiB WebM / 434 KiB MP4) and compared against this one at
deviceScaleFactor 3, the density a phone actually renders at. At 720p the gold
grains in the crucible stay defined; at 480p they blur into soft texture. The
extra cost is 35 KiB of WebM and 8 KiB of MP4 — both pairs are two-pass VBR
aimed at the same ~450 KB ceiling, so the target sets the size, not the
resolution. Frames in docs/screenshots/perf-mobile-weight/.

```
# WebM (VP9), two-pass, no audio
ffmpeg -i hero-artisan.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libvpx-vp9 -b:v 142k -pass 1 -row-mt 1 -deadline good -cpu-used 4 -g 240 -f null /dev/null
ffmpeg -i hero-artisan.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libvpx-vp9 -b:v 142k -pass 2 -row-mt 1 -deadline good -cpu-used 2 -g 240 hero-artisan-mobile.webm

# MP4 (H.264) fallback — iOS Safari before 17.4 has no WebM.
# 134k, not 138k: 138k landed at 453 KiB, just over the 450 KB target.
ffmpeg -i hero-artisan.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -profile:v main -preset slow -b:v 134k -pass 1 -g 240 -pix_fmt yuv420p -f null /dev/null
ffmpeg -i hero-artisan.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -profile:v main -preset slow -b:v 134k -pass 2 -g 240 -pix_fmt yuv420p \
  -movflags +faststart hero-artisan-mobile.mp4
```

Side-by-side frames at the size a phone actually renders (412×544, object-cover)
are in `docs/screenshots/perf-mobile-weight/` — current on the left, mobile
encode on the right.

### The font change was attempted and REVERTED — a negative result worth keeping

The brief asked to stop preloading the Japanese face on English pages. Three
configurations were built and measured, English homepage, cold cache:

| configuration | fonts fetched on an EN page |
|---|---|
| develop as-is | 20 files, 411 KB |
| `jp.variable` applied only when `lang === "ja"` | 20 files, 411 KB — **no change** |
| `preload: false` on the JP face only | 20 files, 413 KB — **no change** |
| `preload: false` on ALL THREE faces | 3 files, 168 KB |

Only the last one works, and it works by un-preloading Playfair and Inter too —
the two faces every page actually renders text in. That is a worse trade than
the problem, so nothing was shipped. `app/layout.tsx` is untouched on this
branch.

What this means: the Noto Serif JP unicode-range chunks are pulled on English
pages by something other than that font's own preload flag and other than the
CSS variable being applied. Worth a separate look — most likely the JP face
needs to leave the root layout for a route-scoped one, so English routes never
include its CSS at all. Not attempted here because it moves layout structure,
which is more than a weight fix should do.

---

## 2026-09-23 — full 3-run baseline before the motion pass

Taken on `feature/web-motion-signature` before any motion code, for the budget in
`docs/tasks/web-motion-signature.md`. Lighthouse 12.8.2, one command per
invocation (see "How to run" below — the loop is what fails here, not
Lighthouse). Three runs per page per preset, 18 runs total.

### What was measured, and why not the develop preview alias

The brief asked for the develop preview alias. **It is behind Vercel Deployment
Protection**: `https://cha-jewels-web-git-develop-cha-jewels.vercel.app/` answers
`302` to `vercel.com/sso-api`, so Lighthouse measures the login wall, not the
site.

Measured instead against the public production alias
`https://cha-jewels-web.vercel.app`, which serves **the identical tree**:

```
git diff --stat origin/develop origin/main   # empty
origin/develop 4d2ce95   origin/main ca0dd4a   (main = develop + the merge commit)
```

So the code under test is develop's code. To measure the alias itself in future,
someone with Vercel access needs to either turn Deployment Protection off for
preview, or create a **Protection Bypass for Automation** token and pass it as
the `x-vercel-protection-bypass` header. That is a Vercel dashboard setting, not
code.

Pages: `/`, `/collections/bracelets`, and one product,
`/products/n4020-necklace-tiffany-co-750-2-0g-open-teardrop-40cm-preloved`.

### Mobile (Lighthouse default emulation) — median (range), 3 runs

| page | Performance | LCP ms | FCP ms | TBT ms | CLS |
|---|---|---|---|---|---|
| `/` | **89** (77–93) | **3629** (3056–5243) | 1312 (1256–1868) | 89 (66–91) | 0 (0–0) |
| `/collections/bracelets` | **86** (85–97) | **4081** (2510–4156) | 1437 (1085–1444) | 13 (13–21) | 0 (0–0) |
| product | **82** (81–83) | **4762** (4641–4843) | 1676 (1545–1684) | 41 (16–43) | 0 (0–0) |

### Desktop (`--preset=desktop`) — median (range), 3 runs

| page | Performance | LCP ms | FCP ms | TBT ms | CLS |
|---|---|---|---|---|---|
| `/` | **100** (100–100) | **620** (612–709) | 320 (312–409) | 0 | 0 |
| `/collections/bracelets` | **100** (100–100) | **521** (517–522) | 321 (317–322) | 0 | 0 |
| product | **100** (100–100) | **601** (557–662) | 361 (316–402) | 0 | 0 |

**Run-to-run spread on mobile is wide** — `/` moved 2.2 s of LCP and 16 points of
Performance across three runs of identical code. The first run of each page was
the worst every time (cold edge cache). A single mobile run is not decision
grade; the budget is written against the median for that reason.

### The LCP element, per page

| page | LCP element | what it is |
|---|---|---|
| `/` | `main#main > div.bg-chalk > section.relative > video.hero-video` | the hero **video's poster**, `/images/home/hero-poster.webp` |
| `/collections/bracelets` | `main#main > section > div.wrap > p.mt-4` | **a paragraph of text** — the collection description. No image at all |
| product | `figure.border > div.outline-none > div.relative > img.object-cover` | the gallery's first photo (next/image) |

### LCP phase breakdown (mobile, representative run)

| page | TTFB | Load Delay | Load Time | **Render Delay** |
|---|---|---|---|---|
| `/` | 629 | 1535 | 285 | **1180** |
| `/collections/bracelets` | 631 | **0** | **0** | **3525** |
| product | 626 | **0** | 117 | **4019** |

On the collection and product pages the LCP resource is available immediately —
load delay and load time are zero or near it — and **85–95% of LCP is render
delay**. On the collection page the LCP element is text, so there is no image to
preload, no image to resize, and no image fix that could help it.

### Render-blocking resources and fonts

- **`render-blocking-resources`: empty on all three pages.** Nothing blocks the
  first paint.
- **`font-display`: empty on all three pages.** `display: swap` is already set on
  every face (`app/layout.tsx`).
- **`prioritize-lcp-image`: passes** on `/` and on the product page — the
  `<link rel="preload" as="image" fetchpriority="high">` added in #123 is doing
  its job. `lcp-lazy-loaded`: the LCP image is not lazily loaded.
- Fonts on `/`: **187 KB across 4 files**, all `High` priority, three of them
  preloaded and fetched at 360–407 ms, the fourth (84 KB) at 587–622 ms.
  Collection: 105 KB across 3 files at 179–223 ms.

### Byte mix on `/` (mobile, identical on all three runs)

| type | KB | share |
|---|---|---|
| **Media (hero clip `hero-artisan.webm`)** | **1902** | **68%** |
| Other | 324 | 12% |
| Font | 187 | 7% |
| Script | 169 | 6% |
| Image (incl. the 90 KB poster) | 128 | 5% |
| Stylesheet | 41 | 1% |
| Document | 30 | 1% |
| **total** | **2783** | |

Collection is 652 KB and the product page 778 KB — neither loads a clip.

The poster is requested at 370 ms at `High` priority and finishes at 419 ms. The
clip starts at 689 ms at `Low` priority and is 1.9 MB.

### The finding: this is Lighthouse's simulation, not observed slowness

`configSettings.throttlingMethod` is **`simulate`** — Lighthouse traces the page
unthrottled and then models Slow 4G + 4× CPU over that trace. Both numbers are in
the JSON, and they disagree by 3–5×:

| run | simulated LCP | **observed LCP** | observed FCP |
|---|---|---|---|
| `/` mobile r1 (cold) | 5243 | 2342 | 2342 |
| `/` mobile r2 | 3629 | **623** | 618 |
| `/` mobile r3 | 3056 | **589** | 589 |
| collection mobile r2 | 4156 | **1306** | 1306 |
| collection mobile r3 | 4081 | **1282** | 1282 |
| product mobile r2 | 4762 | **1250** | 1250 |
| product mobile r3 | 4843 | **1269** | 1269 |

**Observed LCP equals observed FCP on all 18 runs**, within a few milliseconds.
The largest element paints at the same moment as the first pixel of content.
There is no real render delay anywhere — the 3.5–4.0 s of "render delay" above is
entirely the model's.

Confirmed independently outside Lighthouse: driving the real page with 4× CPU
throttling and a 1.6 Mbps / 150 ms link (Playwright + CDP), the homepage's LCP
candidates were the hero lede `<p>` at 544 ms and then the poster at **636 ms**,
with the poster fetched 432 → 603 ms.

**So: the site is not slow. The mobile score is a simulation of a slow 4G phone,
and under that simulation the thing that hurts is bytes on the wire.** That
simulation is still worth respecting — a customer on a genuinely slow connection
pays those bytes for real — but it means the lever is payload, not rendering, and
not image preloading (already done, already passing).

### What this implies for the motion budget

Mobile LCP on `/` must not get worse at all against the 3629 ms median. Because
the metric is simulated off byte weight and request count, **every kilobyte of
motion JavaScript shows up in it directly**, which is what the ≤ 35 kB gzipped
budget is there to hold. Desktop has 380 ms of headroom on `/` (620 ms measured,
and desktop Performance is a flat 100 with no LCP threshold pressure).

---

## How to run

One command per invocation. The loop is what fails in this environment, not
Lighthouse — a nested `npx` spawn inside a shell loop produces no report file.

```
npx lighthouse@12 <url> --only-categories=performance \
  --output=json --output-path=<file> --quiet \
  --chrome-flags="--headless=new --no-sandbox"          # mobile is the DEFAULT
npx lighthouse@12 <url> --preset=desktop  …             # desktop
```

There is no `--preset=mobile`; mobile is the default emulation and passing that
value is rejected outright.

Read the numbers out of the JSON rather than the HTML report, and read **both**
`largestContentfulPaint` and `observedLargestContentfulPaint` from the `metrics`
audit — the first is modelled, the second is what happened.

---

## 2026-09-22 — earlier partial attempt (superseded)

Attempted for the UI performance audit (`perf/ui-audit-a`), against **production**
(`https://www.chajewelsjp.com`), before any change on that branch.

**The full matrix did not run.** One desktop run of `/` succeeded (Performance 95,
LCP 1115 ms); every attempt to run the rest inside a shell loop produced no
report file. That is the origin of the "one command per invocation" rule above.
Superseded by the 2026-09-23 baseline.
