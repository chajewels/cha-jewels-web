# Performance baseline

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
| **mobile transfer weight** | **2786 KB** | **1264 KB** | **−1522 KB (−55%)** |
| mobile Performance | 88 (78–88) | 87 (77–91) | −1, inside noise |
| mobile simulated LCP | 3936 ms (3930–5645) | 4069 ms (3476–5717) | +133 ms, inside noise |
| mobile observed LCP | 227 ms (200–1283) | 324 ms (256–1297) | +97 ms, inside noise |
| mobile TBT | 10 ms (7–46) | 12 ms (10–20) | +2 ms |
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
| **`hero-artisan-mobile.webm`** | 854×480 VP9 | **406,480 B (397 KiB)** | −79% |
| **`hero-artisan-mobile.mp4`** | 854×480 H.264 | **444,263 B (434 KiB)** | −89% |

```
# WebM (VP9), two-pass, no audio
ffmpeg -i hero-artisan.mp4 -an -vf "scale=854:480:flags=lanczos" \
  -c:v libvpx-vp9 -b:v 130k -pass 1 -row-mt 1 -deadline good -cpu-used 4 -g 240 -f null /dev/null
ffmpeg -i hero-artisan.mp4 -an -vf "scale=854:480:flags=lanczos" \
  -c:v libvpx-vp9 -b:v 130k -pass 2 -row-mt 1 -deadline good -cpu-used 2 -g 240 hero-artisan-mobile.webm

# MP4 (H.264) fallback — iOS Safari before 17.4 has no WebM
ffmpeg -i hero-artisan.mp4 -an -vf "scale=854:480:flags=lanczos" \
  -c:v libx264 -profile:v main -preset slow -b:v 135k -pass 1 -g 240 -pix_fmt yuv420p -f null /dev/null
ffmpeg -i hero-artisan.mp4 -an -vf "scale=854:480:flags=lanczos" \
  -c:v libx264 -profile:v main -preset slow -b:v 135k -pass 2 -g 240 -pix_fmt yuv420p \
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
