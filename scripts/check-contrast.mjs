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
  "gold-dark": "#8A6B12", white: "#FFFFFF", hairline: "#E5E5E0",
};

// Guard: the table above must agree with tailwind.config.ts.
const cfg = readFileSync(new URL("../tailwind.config.ts", import.meta.url), "utf8");
const TAILWIND_BUILTIN = new Set(["white"]); // not spelled out in the config
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
// Error colour on dark surfaces.
for (const bg of DARK) add("garnet-light text", "garnet-light", bg, TEXT);
add("garnet-light/60 border", "garnet-light", "charcoal-deep", NONTEXT, 0.6);
// Orange: CTA fills (edge) and the pomelli heading exemption (>=24px, large text).
for (const bg of [...DARK, "charcoal-mid"]) { add("orange fill edge", "orange", bg, NONTEXT); add("orange heading >=24px (pomelli exemption)", "orange", bg, LARGE); add("teal ornament", "teal", bg, NONTEXT); }
add("charcoal-deep on orange (CTA label)", "charcoal-deep", "orange", TEXT);
add("charcoal-deep on orange-hover", "charcoal-deep", "orange-hover", TEXT);
add("charcoal on orange (hero CTA label)", "charcoal", "orange", TEXT);
add("charcoal text on chalk band", "charcoal", "chalk", TEXT);
// GOLD TEXT RULE (Phase 4): gold-pale on dark bands, gold-dark on light bands.
// gold-pale on chalk is 1.37:1 and must never be used there.
add("gold-dark text on chalk (light band)", "gold-dark", "chalk", TEXT);
add("gold-dark text on white (card)", "gold-dark", "white", TEXT);
add("charcoal text on white (card)", "charcoal", "white", TEXT);
add("gold-dark heading >=24px on chalk", "gold-dark", "chalk", LARGE);

// Sanity: known-bad pairs must FAIL, or the arithmetic is broken.
const mustFail = [["chalk", "charcoal", 0.45, TEXT], ["garnet", "charcoal", 1, TEXT], ["chalk", "orange", 1, TEXT], ["gold-pale", "chalk", 1, TEXT], ["orange", "chalk", 1, TEXT]];

let bad = 0;
const w = Math.max(...pairs.map((p) => p.label.length));
for (const p of pairs) {
  const r = ratio(p.fg, p.bg, p.alpha);
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
