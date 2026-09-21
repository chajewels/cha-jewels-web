// Fails the build if any approved text/surface pair in the charcoal theme falls
// below WCAG 2.1 contrast: 4.5:1 for text, 3:1 for large text (>=24px) and
// non-text (borders, focus rings, fill edges). Alpha is composited onto the
// surface before measuring — `chalk/55` is measured as the colour a viewer
// actually sees, not as #F5F5F2.
//
// The table is the palette policy of docs/tasks/phase3-palette-plan.md §5.
// Add a row when a new pair is introduced; never lower a threshold.
import { readFileSync } from "node:fs";

const C = {
  charcoal: "#333333", "charcoal-deep": "#222222", "charcoal-mid": "#444444",
  chalk: "#F5F5F2", gold: "#C9A227", "gold-pale": "#E8D28A",
  orange: "#FFA500", "orange-hover": "#FFB733", teal: "#1ABC9C",
  garnet: "#7A1E2B", "garnet-light": "#F28B94",
  "gold-dark": "#8A6B12", "gold-deep": "#6F5510", white: "#FFFFFF", hairline: "#E5E5E0",
  // Composited homepage tints, measured rather than named in the config:
  // hairline at 40% over chalk, and chalk at 95% over the page beneath.
  tintA: "#EFEFEB", tintB: "#EBEBE8",
};

// Guard: the table above must agree with tailwind.config.ts.
const cfg = readFileSync(new URL("../tailwind.config.ts", import.meta.url), "utf8");
// Not spelled out in the config: `white` is Tailwind's own, and the two tints
// are COMPOSITED surfaces (bg-hairline/40 over chalk; the tab bar's
// chalk/95), so there is no token for the guard to find. They are measured
// values, recorded here because that is what the text actually sits on.
const TAILWIND_BUILTIN = new Set(["white", "tintA", "tintB"]);
for (const [name, hex] of Object.entries(C)) {
  if (TAILWIND_BUILTIN.has(name)) continue;
  if (!cfg.toLowerCase().includes(hex.toLowerCase())) { console.error(`check-contrast: ${name} ${hex} is not in tailwind.config.ts — table is stale`); process.exit(1); }
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const blend = (fg, bg, a) => fg.map((f, i) => Math.round(f * a + bg[i] * (1 - a)));
function ratio(fgName, bgName, alpha = 1) {
  const bg = hex(C[bgName]);
  const fg = alpha < 1 ? blend(hex(C[fgName]), bg, alpha) : hex(C[fgName]);
  const [L1, L2] = [lum(fg), lum(bg)];
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

const TEXT = 4.5, LARGE = 3.0, NONTEXT = 3.0;
const DARK = ["charcoal-deep", "charcoal"];
const pairs = [];
const add = (label, fg, bg, need, alpha = 1) => pairs.push({ label, fg, bg, need, alpha });

// Body/secondary text on the two page surfaces. /55 is the floor on #333333.
for (const bg of DARK) for (const a of [1, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55]) add(`chalk/${a * 100} text`, "chalk", bg, TEXT, a);
// On #444444 (collection cards) the floor is /65.
for (const a of [1, 0.85, 0.8, 0.75, 0.72, 0.7, 0.65]) add(`chalk/${a * 100} text`, "chalk", "charcoal-mid", TEXT, a);
// Gold text and gold rules — kept exactly as today.
for (const bg of [...DARK, "charcoal-mid"]) { add("gold-pale text", "gold-pale", bg, TEXT); add("gold border", "gold", bg, NONTEXT); add("gold-pale focus ring", "gold-pale", bg, NONTEXT); }
// Muted labels on the LIGHT surfaces, added 2026-09-21 with the Company nav
// and /contact. Both shipped at an alpha that measured under 4.5 and axe caught
// it: charcoal/55 is 3.16 on chalk, and the menu panel's charcoal/50 is 2.85 on
// white. /70 is the floor on both, so these pin it.
for (const a of [0.7, 0.75, 0.8, 0.85, 1]) add(`charcoal/${a * 100} label on chalk`, "charcoal", "chalk", TEXT, a);
for (const a of [0.7, 0.75, 0.8, 0.85, 1]) add(`charcoal/${a * 100} label on white`, "charcoal", "white", TEXT, a);

// Error colour on dark surfaces.
for (const bg of DARK) add("garnet-light text", "garnet-light", bg, TEXT);
add("garnet-light/60 border", "garnet-light", "charcoal-deep", NONTEXT, 0.6);
// Orange: CTA fills (edge) and the pomelli heading exemption (>=24px, large text).
for (const bg of [...DARK, "charcoal-mid"]) { add("orange fill edge", "orange", bg, NONTEXT); add("orange heading >=24px (pomelli exemption)", "orange", bg, LARGE); add("teal ornament", "teal", bg, NONTEXT); }
add("charcoal-deep on orange (CTA label)", "charcoal-deep", "orange", TEXT);
add("charcoal-deep on orange-hover", "charcoal-deep", "orange-hover", TEXT);
add("charcoal on orange (hero CTA label)", "charcoal", "orange", TEXT);
add("charcoal text on chalk band", "charcoal", "chalk", TEXT);
// Status badge tone dots (components/account/status-badge.tsx) on the account
// pages, which are still the dark theme. NON-TEXT (3:1): the dot carries no
// information the badge's own words do not — it is a second, non-colour channel
// for a customer who cannot separate gold from teal — so it is measured as a
// graphical object, not as text.
for (const [label, fg, alpha] of [
  ["status dot good (teal)", "teal", 1],
  ["status dot pending (gold-pale)", "gold-pale", 1],
  ["status dot dead (chalk/40)", "chalk", 0.4],
]) add(`${label} on charcoal`, fg, "charcoal", NONTEXT, alpha);

// GOLD TEXT RULE (Phase 4): gold-pale on dark bands, gold-dark on light bands.
// gold-pale on chalk is 1.37:1 and must never be used there.
add("gold-dark text on chalk (light band)", "gold-dark", "chalk", TEXT);
add("gold-dark text on white (card)", "gold-dark", "white", TEXT);
add("charcoal text on white (card)", "charcoal", "white", TEXT);
add("gold-dark heading >=24px on chalk", "gold-dark", "chalk", LARGE);
// Light calculator card (tone="light" in components/commerce/layaway-calculator.tsx).
add("charcoal-deep figures on white (light calculator)", "charcoal-deep", "white", TEXT);
add("gold-dark monthly figure on white (light calculator)", "gold-dark", "white", TEXT);
// charcoal/60 on white is 3.5:1 and FAILS — the light card uses /70 (4.9:1) for
// keys, labels and the note; /60 is in the must-fail set below.
add("charcoal/70 keys, labels and note on white (light calculator)", "charcoal", "white", TEXT, 0.7);
add("charcoal on chalk input (light calculator)", "charcoal", "chalk", TEXT);
add("white on charcoal-deep (selected term)", "white", "charcoal-deep", TEXT);
add("charcoal-deep on orange (layaway pill, step discs)", "charcoal-deep", "orange", TEXT);

// Hero scrim (app/globals.css .hero-scrim) on the hero video's bright frames.
// The headline sits under the .80 stop; body copy reaches the .52 stop.
// Measured against the scrim composited over a flat grey of the stated luma,
// not against a palette surface.
//
// Luma figures are the mean of the top third of the frame (the headline band),
// sampled with `ffmpeg -vf crop=iw:ih/3:0:0,format=gray`:
//   68  public/images/home/hero-poster.webp
//   98  hero-artisan.mp4 at 0:15
//  160  hero-artisan.mp4 at 0:21.3 — the pour flare, the clip's brightest
//       top-third frame. 0:15 is NOT the peak; the flare is 60% brighter.
{
  const scrim = [20, 18, 16];
  const surface = (a, luma) => blend(scrim, [luma, luma, luma], a);
  const over = (fgName, a, bgArr, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), bgArr, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(bgArr)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const rows = [
    // Poster: the first paint, before any frame decodes.
    ["hero scrim .80 @ luma 68 (poster): gold-pale headline", "gold-pale", 0.80, 1, TEXT, 68],
    ["hero scrim .80 @ luma 68 (poster): white/chalk headline", "chalk", 0.80, 1, TEXT, 68],
    // 0:15.
    ["hero scrim .80 @ luma 98 (0:15): gold-pale headline", "gold-pale", 0.80, 1, TEXT, 98],
    ["hero scrim .80 @ luma 98 (0:15): white/chalk headline", "chalk", 0.80, 1, TEXT, 98],
    // 0:21.3, the pour flare — the brightest top-third frame in the clip.
    ["hero scrim .80 @ luma 160 (flare): gold-pale headline", "gold-pale", 0.80, 1, TEXT, 160],
    ["hero scrim .80 @ luma 160 (flare): white/chalk headline", "chalk", 0.80, 1, TEXT, 160],
    ["hero scrim .52 @ luma 160 (flare): chalk/75 body", "chalk", 0.52, 0.75, TEXT, 160],
  ];
  for (const [label, fg, stop, alpha, need, luma] of rows) pairs.push({ label, fg, bg: `scrim@${stop}`, need, alpha, ratio: over(fg, stop, surface(stop, luma), alpha) });
}

// Hero SLIDE scrim (app/globals.css .hero-slide-scrim) on a full-bleed category
// photo. Horizontal, so the copy sits under the .82 stop at the left edge while
// the photo clears to nothing on the right.
//
// A horizontal scrim over an arbitrary photo is only as good as its worst
// frame, and the photo is DATA — the Hub can replace any of these tomorrow. So
// the deck's real extremes are measured and a pure-white frame is measured with
// them, as the floor no uploaded photo can go under. Left-third mean luma,
// sampled with `ffmpeg -vf crop=iw/3:ih:0:0,format=gray`:
//    39  preloved-branded-jewelry.webp — the darkest
//    44  preloved-watches.webp
//   222  fine-jewelry.webp — the brightest (its lightest pixels reach 241)
// 235 stands in for that bright end with margin, 40 for the dark one. 255 is
// the bound: at the .82 stop even a pure white photo holds gold-pale at 7.2:1,
// so the stop does not have to be revisited when a photo changes.
{
  const scrim = [20, 18, 16];
  const surface = (a, luma) => blend(scrim, [luma, luma, luma], a);
  const over = (fgName, a, bgArr, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), bgArr, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(bgArr)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const rows = [
    ["hero slide .82 @ luma 235 (cream photo): gold-pale name", "gold-pale", 0.82, 1, TEXT, 235],
    ["hero slide .82 @ luma 235 (cream photo): chalk copy", "chalk", 0.82, 1, TEXT, 235],
    ["hero slide .82 @ luma 40 (dark photo): gold-pale name", "gold-pale", 0.82, 1, TEXT, 40],
    ["hero slide .82 @ luma 40 (dark photo): chalk copy", "chalk", 0.82, 1, TEXT, 40],
    ["hero slide .82 @ luma 255 (white bound): gold-pale name", "gold-pale", 0.82, 1, TEXT, 255],
    ["hero slide .82 @ luma 255 (white bound): chalk copy", "chalk", 0.82, 1, TEXT, 255],
  ];
  for (const [label, fg, stop, alpha, need, luma] of rows) pairs.push({ label, fg, bg: `slide@${stop}`, need, alpha, ratio: over(fg, stop, surface(stop, luma), alpha) });
}

// ---------------------------------------------------------------------------
// PHASE 4 GROUP A — the light surfaces.
//
// Chalk (#F5F5F2) is a band; white is a card on it. Rows already covered above
// by the light calculator and the gold text rule are NOT repeated here:
// gold-dark on chalk and on white, charcoal on chalk and on white,
// charcoal-deep on white, and charcoal/70 on white all have rows already.
// ---------------------------------------------------------------------------

// Text.
// The homepage's TINTED surfaces: bg-hairline/40 over chalk, and the mobile
// tab bar's chalk/95. gold-dark is 4.35 and 4.19 there — both under 4.5 — so
// those three elements use gold-deep. Measured on the composited tints.
add("gold-deep on hairline/40 over chalk", "gold-deep", "tintA", TEXT);
add("gold-deep behind the mobile tab bar", "gold-deep", "tintB", TEXT);
add("charcoal/70 placeholder text on chalk", "charcoal", "chalk", TEXT, 0.7);
add("charcoal-deep text on chalk", "charcoal-deep", "chalk", TEXT);
add("charcoal/70 text on chalk", "charcoal", "chalk", TEXT, 0.7);
add("garnet error text on chalk", "garnet", "chalk", TEXT);
add("garnet error text on white", "garnet", "white", TEXT);

// Non-text: the light form rule (lib/form-classes.ts).
// Both of these clear 3.0 by under a point. Lightening either one needs a
// re-run, not a judgement call.
add("charcoal/60 input border on white", "charcoal", "white", NONTEXT, 0.6);
add("gold-dark focus ring on white", "gold-dark", "white", NONTEXT);
add("garnet/60 alert border on white", "garnet", "white", NONTEXT, 0.6);

// Non-text: the light status dots (components/account/status-badge.tsx).
//
// THE PENDING DOT IS MEASURED BY ITS RING, NOT ITS FILL. Orange on chalk is
// 1.81:1 — under the 3.0 a graphical object needs — so a bare orange dot is
// not perceivable on a light surface. The charcoal-deep ring is what carries
// it, and the must-fail set below pins the bare fill at NONTEXT so the ring
// cannot be dropped as decoration later.
//
// Teal has no row here on purpose: it is ornament-only (decision 4) and never
// carries state, so it does not cross to the light surface at all. `good` on
// light is a gold-dark fill.
// The gallery arrow's edge, measured against its own bg-white/85 fill — the
// hairline it replaced was 1.12:1 there and disappeared on a pale photo.
add("gallery arrow border charcoal/60 on white", "charcoal", "white", NONTEXT, 0.6);
add("status dot good (gold-dark) on chalk", "gold-dark", "chalk", NONTEXT);
add("status dot pending RING (charcoal-deep) on chalk", "charcoal-deep", "chalk", NONTEXT);
add("status dot dead hollow (charcoal/70 border) on chalk", "charcoal", "chalk", NONTEXT, 0.7);

// Social icon buttons (components/site/social-icons.tsx): a 40px ring around a
// currentColor glyph. Dark tone on the footer, light tone on white cards and
// the chalk page. The ring is a component boundary and the glyph the whole
// visible label, so both are measured at NONTEXT. A hairline ring on light was
// the first draft and measures 1.16 — hence charcoal/60, the input-border edge.
add("social icon ring chalk/40 on charcoal-deep", "chalk", "charcoal-deep", NONTEXT, 0.4);
add("social icon glyph chalk/75 on charcoal-deep", "chalk", "charcoal-deep", NONTEXT, 0.75);
add("social icon ring charcoal/60 on chalk", "charcoal", "chalk", NONTEXT, 0.6);
add("social icon ring charcoal/60 on white", "charcoal", "white", NONTEXT, 0.6);
add("social icon glyph charcoal-deep on white", "charcoal-deep", "white", NONTEXT);
add("social icon glyph gold-dark (hover) on white", "gold-dark", "white", NONTEXT);

// The newsletter field in the DARK footer (components/site/newsletter-form.tsx
// tone="dark"). The light form rule does not cross: its white fill would be a
// hole in the band, and its gold-dark ring clears 3:1 on charcoal-deep by only
// 0.18 (3.18). gold-pale is 10.62 — the ring is chosen for margin, not because
// the other one is invalid.
add("newsletter input text (chalk) on charcoal-deep", "chalk", "charcoal-deep", TEXT);
add("newsletter input border chalk/40 on charcoal-deep", "chalk", "charcoal-deep", NONTEXT, 0.4);
add("newsletter focus ring gold-pale on charcoal-deep", "gold-pale", "charcoal-deep", NONTEXT);

// Sanity: known-bad pairs must FAIL, or the arithmetic is broken.
// The Phase 4 additions are the tokens that look like they would be fine on a
// light surface and are not:
//   teal on white          2.41 — ornament-only, never text, never a ring
//   gold #C9A227 on white  2.42 — the DARK focus ring; the light one is
//                                 gold-dark, by owner decision
//   charcoal/60 on chalk   3.57 — passes 3.0 as a border and FAILS 4.5 as
//                                 text, which is exactly the trap: it is
//                                 registered at TEXT for that reason
//   garnet-light on chalk  2.16 — the DARK error colour; on light it is garnet
//   orange on chalk        1.81 — at NONTEXT: the bare pending dot without its
//                                 charcoal-deep ring
// gold-pale on chalk (1.37) was already here and stays.
const mustFail = [
  ["chalk", "charcoal", 0.45, TEXT], ["garnet", "charcoal", 1, TEXT],
  ["chalk", "orange", 1, TEXT], ["gold-pale", "chalk", 1, TEXT],
  ["orange", "chalk", 1, TEXT], ["charcoal", "white", 0.6, TEXT],
  ["teal", "white", 1, TEXT], ["gold", "white", 1, NONTEXT],
  ["charcoal", "chalk", 0.6, TEXT], ["garnet-light", "chalk", 1, TEXT],
  ["orange", "chalk", 1, NONTEXT],
];

let bad = 0;
const w = Math.max(...pairs.map((p) => p.label.length));
for (const p of pairs) {
  const r = p.ratio ?? ratio(p.fg, p.bg, p.alpha);
  const ok = r >= p.need;
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${p.label.padEnd(w)}  on ${p.bg.padEnd(13)}  ${r.toFixed(2).padStart(6)}  need ${p.need}`);
}
for (const [fg, bg, a, need] of mustFail) {
  const r = ratio(fg, bg, a);
  if (r >= need) { console.error(`check-contrast: sanity pair ${fg}/${a * 100} on ${bg} unexpectedly passes (${r.toFixed(2)})`); bad++; }
}
if (bad) { console.error(`\n${bad} contrast problem(s).`); process.exit(1); }
console.log(`\nContrast check passed (${pairs.length} pairs).`);
