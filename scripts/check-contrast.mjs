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
  charcoal: "#1c1c1c", "charcoal-deep": "#000000", "charcoal-mid": "#2b2b2b",
  chalk: "#f4f0ec", gold: "#a39d94", "gold-pale": "#d9d3ca",
  teal: "#1ABC9C",
  garnet: "#7A1E2B", "garnet-light": "#F28B94",
  "gold-dark": "#2a2724", "gold-deep": "#000000", white: "#FFFFFF", hairline: "#dad6d0",
  // Composited homepage tints, measured rather than named in the config:
  // hairline at 40% over chalk, and chalk at 95% over the page beneath.
  tintA: "#eae6e1", tintB: "#efebe6",
};

// LUMIÈRE (redesign/lumiere, P2; DESIGN-LUMIERE.md "Palette", report §15.2).
// The home's flat pairs. The Tier 1 literals live in app/lumiere/tokens.css,
// so these are checked against that file rather than tailwind.config.ts.
const LUMIERE = {
  "lm-surface": "#f4f0ec", "lm-content": "#000000", "lm-white": "#ffffff", "lm-black": "#000000",
  "lm-border-muted": "#cfcfd0", "lm-ink": "#1c1c1c",
  // The spotlight card scrim at its foot: black at 85 % over the darkest a
  // photograph can be assumed to be at the foot (the scrim itself) — the
  // composited floor the title sits on. Not a token; the gradient literal is
  // in app/lumiere/sections.css, which is what the guard below checks.
  "lm-scrim": "#262626",
};
Object.assign(C, LUMIERE);
// LUMIÈRE P4 (app/lumiere/pages.css): the stories belt's near-black stage and
// quote cards, the layaway band's brass on black, the caption chip over the
// Halcyon Gate (black at 82 % over the scene's pale horizon, composited:
// 0.82 × 0 + 0.18 × #e2d0b2 ≈ #292522 — the lightest the chip's ground gets).
// Not tokens: the literals live in pages.css, which the guard below checks.
const P4 = { "p4-slip-bg": "#0a0a0c", "p4-slip-card": "#131318", "p4-brass": "#e8c37d", "p4-chip": "#292522", "p4-scene-sky": "#e2d0b2" };
Object.assign(C, P4);
// NAVIGATION (P4b, app/lumiere/nav.css): the site's own colour language for every
// navigation surface — dedicated tokens, the global `gold` retarget stays.
const NAV = { "nav-ink": "#1c1c1c", "nav-gold": "#c9a227", "nav-gold-text": "#8a6b12", "nav-gold-deep": "#6f5510", "nav-bar-dark": "#222120" };
Object.assign(C, NAV);
const navCss = readFileSync(new URL("../app/lumiere/nav.css", import.meta.url), "utf8").toLowerCase();
for (const name of ["nav-ink", "nav-gold", "nav-gold-text", "nav-gold-deep"]) {
  if (!navCss.includes(NAV[name])) { console.error(`check-contrast: ${name} ${NAV[name]} is not in app/lumiere/nav.css — table is stale`); process.exit(1); }
}
const pagesCss = readFileSync(new URL("../app/lumiere/pages.css", import.meta.url), "utf8").toLowerCase();
for (const name of ["p4-slip-bg", "p4-slip-card", "p4-brass", "p4-scene-sky"]) {
  if (!pagesCss.includes(P4[name])) { console.error(`check-contrast: ${name} ${P4[name]} is not in app/lumiere/pages.css — table is stale`); process.exit(1); }
}
if (!/background: rgb\(0 0 0 \/ 0\.82\)/.test(pagesCss)) { console.error("check-contrast: the layaway caption chip is no longer black/82 — p4-chip is stale"); process.exit(1); }
const tokens = readFileSync(new URL("../app/lumiere/tokens.css", import.meta.url), "utf8").toLowerCase();
const sections = readFileSync(new URL("../app/lumiere/sections.css", import.meta.url), "utf8");
for (const [name, hex] of Object.entries(LUMIERE)) {
  if (name === "lm-scrim") { if (!/rgb\(0 0 0 \/ 0\.85\) 0%/.test(sections)) { console.error("check-contrast: the spotlight scrim is no longer black/85 at the foot — lm-scrim is stale"); process.exit(1); } continue; }
  if (!tokens.includes(hex.toLowerCase())) { console.error(`check-contrast: ${name} ${hex} is not in app/lumiere/tokens.css — table is stale`); process.exit(1); }
}

// Guard: the table above must agree with tailwind.config.ts.
const cfg = readFileSync(new URL("../tailwind.config.ts", import.meta.url), "utf8");
// Not spelled out in the config: `white` is Tailwind's own, and the two tints
// are COMPOSITED surfaces (bg-hairline/40 over chalk; the tab bar's
// chalk/95), so there is no token for the guard to find. They are measured
// values, recorded here because that is what the text actually sits on.
const TAILWIND_BUILTIN = new Set(["white", "tintA", "tintB"]);
for (const [name, hex] of Object.entries(C)) {
  if (TAILWIND_BUILTIN.has(name) || name in LUMIERE || name in P4 || name in NAV) continue;
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
// LUMIÈRE HOME (P2). Type on the paper and on the black stage/footer, and the
// footer's dim role at the two alphas the reference sets (0.5 at 1440 = 5.3:1,
// the reference's own D-017 figure; 0.55 below). The category pills' hairline
// stroke (#cfcfd0 on #f4f0ec, 1.68:1) is decorative — the pill's own black
// label is what identifies the link — so it is not a row; the white type over
// the collection and featured photographs needs the image-sampled rows §15.2
// asks for and is measured in the browser in the P2 QA, not here.
add("lumiere: content on surface (hero, collections, featured paper)", "lm-content", "lm-surface", TEXT);
add("lumiere: ink index-active on surface (lit category pill)", "lm-ink", "lm-surface", TEXT);
add("lumiere: white type on the black stage / footer", "lm-white", "lm-black", TEXT);
add("lumiere: footer dim white/50 on black", "lm-white", "lm-black", TEXT, 0.5);
add("lumiere: footer dim white/55 on black (below 1440)", "lm-white", "lm-black", TEXT, 0.55);
add("lumiere: footer rule white/20 on black (non-text, decorative hairline — recorded, not gated)", "lm-white", "lm-black", 1, 0.2);
add("lumiere: preloader count white/30 on black (decorative percentage; the rule carries the progress)", "lm-white", "lm-black", 1, 0.3);
// PART B (app/lumiere/sections.css): the eyebrows, leads, dates and names are
// black at 60 % / 70 % on the paper and on the white cards; the loyalty band's
// dim role is white at 60 % / 70 % on black; the spotlight card title is white
// over the card scrim (black at 85 %, the reference's); the calculator's
// Lumière variant sets its secondary text black/70 on white.
add("lumiere B: black/60 eyebrow, date, count on surface", "lm-content", "lm-surface", TEXT, 0.6);
add("lumiere B: black/70 lead, name, meta on surface", "lm-content", "lm-surface", TEXT, 0.7);
add("lumiere B: black/60 date on white card", "lm-content", "lm-white", TEXT, 0.6);
add("lumiere B: black/70 calculator secondary text on white", "lm-content", "lm-white", TEXT, 0.7);
add("lumiere B: ink-900 quote on white card", "lm-ink", "lm-white", TEXT);
add("lumiere B: loyalty white/60 label on black", "lm-white", "lm-black", TEXT, 0.6);
add("lumiere B: loyalty white/70 lead on black", "lm-white", "lm-black", TEXT, 0.7);
add("lumiere B: spotlight card title white over the black/85 scrim (foot of the photo)", "lm-white", "lm-scrim", TEXT);
add("lumiere B: pill white on black (CTAs)", "lm-white", "lm-black", TEXT);
add("lumiere B: hairline grey-300 on surface (non-text, decorative — recorded, not gated)", "lm-border-muted", "lm-surface", 1);

// LUMIÈRE P4. Every text on the footer's black, the stories belt, the layaway band.
add("p4 footer: company line white/86 on black (14 px)", "lm-white", "lm-black", TEXT, 0.86);
add("p4 footer: company name white on black (15 px)", "lm-white", "lm-black", TEXT);
add("p4 footer: link white/72 on black", "lm-white", "lm-black", TEXT, 0.72);
add("p4 footer: note, rights white/80 on black", "lm-white", "lm-black", TEXT, 0.8);
add("p4 footer: column title white/90 on black", "lm-white", "lm-black", TEXT, 0.9);
add("p4 stories: eyebrow white/70 on the stage", "lm-white", "p4-slip-bg", TEXT, 0.7);
add("p4 stories: lead white/78 on the stage", "lm-white", "p4-slip-bg", TEXT, 0.78);
add("p4 stories: hint white/62 on the stage", "lm-white", "p4-slip-bg", TEXT, 0.62);
add("p4 stories: card meta white/78 over the scrim", "lm-white", "lm-scrim", TEXT, 0.78);
add("p4 stories: quote-card excerpt white on the card", "lm-white", "p4-slip-card", TEXT);
add("p4 stories: card meta white/78 on the quote card", "lm-white", "p4-slip-card", TEXT, 0.78);
add("p4 stories: card stars white/50 outline on the quote card (non-text)", "lm-white", "p4-slip-card", NONTEXT, 0.5);
add("p4 stories: see-all pill black on white", "lm-black", "lm-white", TEXT);
add("p4 layaway: lead white/80 on black", "lm-white", "lm-black", TEXT, 0.8);
add("p4 layaway: step body white/78 on black", "lm-white", "lm-black", TEXT, 0.78);
add("p4 layaway: brass pill / index on black", "p4-brass", "lm-black", TEXT);
add("p4 layaway: caption chip white on the black/82 chip over the pale scene", "lm-white", "p4-chip", TEXT);
add("p4 loyalty: tier label white/62 on black", "lm-white", "lm-black", TEXT, 0.62);
add("p4 loyalty: tier spend white/90 on black", "lm-white", "lm-black", TEXT, 0.9);

// NAVIGATION (P4b, nav.css). The dark bar is black at 86 % over the lightest
// page it can sit on (bone: 0.14 × #f4f0ec ≈ #222120, the brightest ground the
// white labels and the gold hover text ever meet). The gold ACCENT (#c9a227)
// on paper is a decorative line or mark, never the only cue — the text beside
// it takes the deep gold — so those rows are recorded, not gated.
add("nav: charcoal label on bone (header, menu, tab bar, side list)", "nav-ink", "lm-surface", TEXT);
add("nav: charcoal label on white (account dropdown, side list on cards)", "nav-ink", "lm-white", TEXT);
add("nav: charcoal/66 inactive tab label on bone (11 px)", "nav-ink", "lm-surface", TEXT, 0.66);
add("nav: charcoal/82 side-list label on bone", "nav-ink", "lm-surface", TEXT, 0.82);
// #8a6b12 is 4.42:1 on bone — under 4.5 — so small gold text on BONE uses the deep gold (6.2:1); #8a6b12 only on white (5.0:1).
add("nav: gold-deep eyebrow on bone (11 px; the menu, search and header eyebrows)", "nav-gold-deep", "lm-surface", TEXT);
add("nav: gold-text eyebrow on white (11 px)", "nav-gold-text", "lm-white", TEXT);
// P5 (finding A2): the phone tab bar is an opaque bone surface, so each label AND icon is measured on bone.
add("nav tab bar: inactive label charcoal/66 on the opaque bone bar (11 px)", "nav-ink", "lm-surface", TEXT, 0.66);
add("nav tab bar: inactive icon charcoal/66 on bone (non-text)", "nav-ink", "lm-surface", NONTEXT, 0.66);
add("nav tab bar: current label deep gold on bone (11 px, 600)", "nav-gold-deep", "lm-surface", TEXT);
add("nav tab bar: current icon deep gold on bone (non-text)", "nav-gold-deep", "lm-surface", NONTEXT);
add("nav: gold-deep hover / current label on bone", "nav-gold-deep", "lm-surface", TEXT);
add("nav: gold-deep hover / current label on white", "nav-gold-deep", "lm-white", TEXT);
add("nav: gold-deep hover label on the dropdown's bone hover fill", "nav-gold-deep", "lm-surface", TEXT);
add("nav: gold-deep search focus line on bone (non-text)", "nav-gold-deep", "lm-surface", NONTEXT);
add("nav: white label on the dark bar", "lm-white", "nav-bar-dark", TEXT);
add("nav: gold hover text on the dark bar", "nav-gold", "nav-bar-dark", TEXT);
add("nav: gold footer heading on black (12 px)", "nav-gold", "lm-black", TEXT);
add("nav: gold footer link hover on black", "nav-gold", "lm-black", TEXT);
add("nav: gold accent line on black (non-text)", "nav-gold", "lm-black", NONTEXT);
add("nav: white label on the current account chip (charcoal)", "lm-white", "nav-ink", TEXT);
add("nav: gold accent on the charcoal chip's base line (non-text)", "nav-gold", "nav-ink", NONTEXT);
add("nav: gold accent line on bone (decorative underline / indicator — text beside it carries the state; recorded, not gated)", "nav-gold", "lm-surface", 1);
add("nav: gold accent line on white (decorative indicator; recorded, not gated)", "nav-gold", "lm-white", 1);
// P4b account family (app/lumiere/inner-account.css, prefix iac-).
add("iac: black label on the current side-list pill (bone)", "lm-content", "lm-surface", TEXT);
add("iac: gold-deep hover label on the side-list hover pill (bone)", "nav-gold-deep", "lm-surface", TEXT);
add("iac: ink/70 secondary text on a white plate", "nav-ink", "lm-white", TEXT, 0.7);
add("iac: warm-ink (gold-dark) ledger header on a white plate (11 px)", "gold-dark", "lm-white", TEXT);
add("iac: white step number on the current timeline circle (ink)", "lm-white", "nav-ink", TEXT);
add("iac: gold-deep border on the done timeline circle / bar (non-text)", "nav-gold-deep", "lm-white", NONTEXT);
add("iac: chalk/90 perk row on the black sign-in plate", "chalk", "lm-black", TEXT, 0.9);
add("iac: gold-pale label on the black level plate", "gold-pale", "lm-black", TEXT);
add("iac: ink outline numeral (404) on bone (non-text, display)", "nav-ink", "lm-surface", NONTEXT);
// P4b content family (ic-): inner-content.css. Black bands, plates and pills.
add("ic: white/84 term text on black (wholesale terms)", "lm-white", "lm-black", TEXT, 0.84);
add("ic: white/82 fact text on black (wholesale permit)", "lm-white", "lm-black", TEXT, 0.82);
add("ic: white/80 ask-body text on black", "lm-white", "lm-black", TEXT, 0.8);
add("ic: white/74 method label on the contact plate's raised row (worst case #2b2b2b)", "lm-white", "charcoal-mid", TEXT, 0.74);
add("ic: white method value on the raised row (worst case #2b2b2b)", "lm-white", "charcoal-mid", TEXT);
add("ic: white/75 ledger note on the affiliation plate (worst case #2b2b2b)", "lm-white", "charcoal-mid", TEXT, 0.75);
add("ic: white label on the contents pill number chip (white/14 over black)", "lm-white", "charcoal-mid", TEXT);
add("ic: black label on the hovered contents pill (white)", "lm-black", "lm-white", TEXT);
add("ic: white label on the current legal tab / TOC pill / FAQ pill (black)", "lm-white", "lm-black", TEXT);
add("ic: white pill count on the current FAQ pill (white/16 over black)", "lm-white", "charcoal-mid", TEXT);
add("ic: gold-pale text on the legal summary plate (black)", "gold-pale", "lm-black", TEXT);
add("ic: chalk/90 text on the legal summary plate (black)", "chalk", "lm-black", TEXT, 0.9);
add("ic: black Read band label (white on black, 12 px)", "lm-white", "lm-black", TEXT);
add("ic: charcoal/80 post excerpt on bone plate", "nav-ink", "lm-surface", TEXT, 0.8);
add("ic: charcoal/78 legal meta / TOC link on bone", "nav-ink", "lm-surface", TEXT, 0.78);
add("ic: charcoal/78 legal meta / TOC link on white", "nav-ink", "lm-white", TEXT, 0.78);
add("ic: black Read tag text on hover (white on black)", "lm-white", "lm-black", TEXT);
add("ic: gold label on the contents heading / plate eyebrow (black)", "nav-gold", "lm-black", TEXT);
add("ic: black label on the white light button (ink band CTA)", "lm-black", "lm-white", TEXT);
add("ic: gold-deep legal-aside label on bone raised box", "nav-gold-deep", "lm-surface", TEXT);
// P4b commerce (app/lumiere/inner-commerce.css, prefix icm-): ink plates are white at 7-10 % over black.
Object.assign(C, { "icm-plate": "#121212", "icm-plate-hover": "#1a1a1a", "icm-crown": "#2a2410" });
add("icm: white title on an ink plate", "lm-white", "icm-plate", TEXT);
add("icm: white/80 body on an ink plate (14.5 px)", "lm-white", "icm-plate", TEXT, 0.8);
add("icm: white/80 body on a hovered ink plate", "lm-white", "icm-plate-hover", TEXT, 0.8);
add("icm: white/88 perk on the crown tier plate", "lm-white", "icm-crown", TEXT, 0.88);
add("icm: gold label on an ink plate (11 px)", "nav-gold", "icm-plate", TEXT);
add("icm: gold label on the crown tier plate", "nav-gold", "icm-crown", TEXT);
add("icm: ink/80 body on the bone call-to-action plate", "lm-ink", "lm-surface", TEXT, 0.8);
add("icm: ink/80 label on a bone stepper pill", "lm-ink", "lm-surface", TEXT, 0.8);
add("icm: white on the black current step / black pill", "lm-white", "lm-black", TEXT);
add("icm: black on a white pill on the ink band", "lm-black", "lm-white", TEXT);
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
for (const bg of [...DARK, "charcoal-mid"]) { add("teal ornament", "teal", bg, NONTEXT); }
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
// The cookie banner (components/site/consent-banner.tsx): a white card. Body
// text charcoal, title and button labels charcoal-deep, the privacy link
// gold-dark, and the two equal outline buttons' charcoal/60 edge (non-text).
add("consent banner body: charcoal on white", "charcoal", "white", TEXT);
add("consent banner title + button labels: charcoal-deep on white", "charcoal-deep", "white", TEXT);
add("consent banner privacy link: gold-dark on white", "gold-dark", "white", TEXT);
add("consent banner button edge: charcoal/60 on white", "charcoal", "white", NONTEXT, 0.6);
// Light calculator card (tone="light" in components/commerce/layaway-calculator.tsx).
add("charcoal-deep figures on white (light calculator)", "charcoal-deep", "white", TEXT);
add("gold-dark monthly figure on white (light calculator)", "gold-dark", "white", TEXT);
// charcoal/60 on white is 3.5:1 and FAILS — the light card uses /70 (4.9:1) for
// keys, labels and the note; /60 is in the must-fail set below.
add("charcoal/70 keys, labels and note on white (light calculator)", "charcoal", "white", TEXT, 0.7);
add("charcoal on chalk input (light calculator)", "charcoal", "chalk", TEXT);
add("white on charcoal-deep (selected term)", "white", "charcoal-deep", TEXT);

// HERO v2 FILM SCRIM (app/globals.css .hd-film-scrim), slider v2 2026-09-26.
// It replaced the vertical .hero-scrim when the headline moved to the left
// column. Luma is measured in the headline's OWN band (x 38–55%, y 25–75% —
// where the long lines end; the column's left part is darker), with
// `ffmpeg -vf crop=…,format=gray`:
//   poster          mean 115, p95 208, peaks 255
//   0:15            mean  98, p95 246
//   0:21.3 flare    mean 156, flat
// So every row is taken at 255, the bound no frame can pass, as well as at the
// poster's p95. Desktop: the stop is .82 to the end of the copy column (54%).
// Phone: .78 behind the copy at the top. The scrim is charcoal-deep.
{
  const scrim = hex(C["charcoal-deep"]);
  const surface = (a, luma) => blend(scrim, [luma, luma, luma], a);
  const over = (fgName, bgArr, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), bgArr, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(bgArr)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const rows = [];
  for (const [where, stop] of [["desktop", 0.82], ["phone", 0.78]]) for (const luma of [208, 255]) {
    rows.push([`hero v2 film scrim ${where} .${stop * 100} @ luma ${luma}: chalk headline`, "chalk", stop, 1, LARGE, luma]);
    rows.push([`hero v2 film scrim ${where} .${stop * 100} @ luma ${luma}: gilt stop gold`, "gold", stop, 1, LARGE, luma]);
    rows.push([`hero v2 film scrim ${where} .${stop * 100} @ luma ${luma}: gilt stop gold-pale`, "gold-pale", stop, 1, LARGE, luma]);
    rows.push([`hero v2 film scrim ${where} .${stop * 100} @ luma ${luma}: gold-pale eyebrow`, "gold-pale", stop, 1, TEXT, luma]);
    rows.push([`hero v2 film scrim ${where} .${stop * 100} @ luma ${luma}: chalk/82 origin`, "chalk", stop, 0.82, TEXT, luma]);
    // Hero v3: slide 1's outline button "View all pieces", in the copy column
    // under the clarifier: its chalk label and its chalk/55 edge.
    rows.push([`hero v3 film scrim ${where} .${stop * 100} @ luma ${luma}: chalk outline button label`, "chalk", stop, 1, TEXT, luma]);
    rows.push([`hero v3 film scrim ${where} .${stop * 100} @ luma ${luma}: outline button edge chalk/55`, "chalk", stop, 0.55, NONTEXT, luma]);
  }
  for (const [label, fg, stop, alpha, need, luma] of rows) pairs.push({ label, fg, bg: `film@${stop}/${luma}`, need, alpha, ratio: over(fg, surface(stop, luma), alpha) });
}

// SALE (components/commerce/sale-price.tsx, owner decisions 2026-10-15): the
// struck regular price is chalk/60 on dark bands (price card on charcoal-deep,
// hero caption and Sold card on the stage pool, rows below) and charcoal/70 on
// the light cards — charcoal/60 is 3.5:1 on white and stays in the must-fail
// set. The "Sale" tag is chalk on a gold-dark fill (11px, so TEXT).
add("sale: struck price chalk/60 on charcoal-deep (price card)", "chalk", "charcoal-deep", TEXT, 0.6);
add("sale: struck price charcoal/70 on white (cards)", "charcoal", "white", TEXT, 0.7);
add("sale: struck price charcoal/70 on chalk (search row)", "charcoal", "chalk", TEXT, 0.7);
add("sale: tag chalk on gold-dark", "chalk", "gold-dark", TEXT);
{
  const pool = blend([120, 92, 40], hex("#231e18"), 0.3);
  const fg = blend(hex(C.chalk), pool, 0.6);
  const [L1, L2] = [lum(fg), lum(pool)];
  pairs.push({ label: "sale: struck price chalk/60 on the stage pool (hero caption, Sold card)", fg: "chalk", bg: "stage pool", need: TEXT, alpha: 0.6, ratio: (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) });
}

// SOLD (components/commerce/add-to-cart.tsx, components/catalog/product-card.tsx):
// a muted label, not a button — charcoal/70 on an opaque chalk fill.
add("Sold label: charcoal/70 on chalk", "charcoal", "chalk", TEXT, 0.7);

// FULL-SCREEN VIEWER (components/catalog/gallery-viewer.tsx): chalk counter on
// the charcoal-deep backdrop; controls are a gold edge and a chalk glyph on
// charcoal-deep at 70%. Their worst case is a white photo behind them, so the
// glyph and edge are measured on charcoal-deep/70 composited over white.
add("viewer counter: chalk on charcoal-deep", "chalk", "charcoal-deep", TEXT);
add("viewer focus ring: gold-pale on charcoal-deep", "gold-pale", "charcoal-deep", NONTEXT);
{
  const btn = blend(hex(C["charcoal-deep"]), hex(C.white), 0.7);
  const on = (fgName) => { const [L1, L2] = [lum(hex(C[fgName])), lum(btn)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  pairs.push({ label: "viewer control over white photo: chalk glyph", fg: "chalk", bg: "charcoal-deep/70@white", need: NONTEXT, alpha: 1, ratio: on("chalk") });
}

// GOLD GUIDE PLATES (components/editorial/guide-plate.tsx): text on
// charcoal-deep under a radial gold tint that peaks at gold/16 — measured at
// the peak, the brightest the plate gets.
{
  const tint = blend(hex(C.gold), hex(C["charcoal-deep"]), 0.16);
  const on = (fgName, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), tint, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(tint)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  pairs.push({ label: "guide plate: gold-pale label on gold16 tint", fg: "gold-pale", bg: "charcoal-deep+gold16", need: TEXT, alpha: 1, ratio: on("gold-pale") });
  pairs.push({ label: "guide plate: chalk/75 text on gold16 tint", fg: "chalk", bg: "charcoal-deep+gold16", need: TEXT, alpha: 0.75, ratio: on("chalk", 0.75) });
  pairs.push({ label: "guide plate: chalk/85 text on gold16 tint", fg: "chalk", bg: "charcoal-deep+gold16", need: TEXT, alpha: 0.85, ratio: on("chalk", 0.85) });
  pairs.push({ label: "guide plate: gold edge on charcoal-deep", fg: "gold", bg: "charcoal-deep", need: NONTEXT, alpha: 1, ratio: ratio("gold", "charcoal-deep") });
}
// GOLD GUIDE ILLUSTRATION CAPTION ("Illustration" / "イメージ"): chalk on a
// charcoal-deep/85 label over the photographs' white studio background.
{
  const label = blend(hex(C["charcoal-deep"]), hex(C.white), 0.85);
  const [L1, L2] = [lum(hex(C.chalk)), lum(label)];
  pairs.push({ label: "guide illustration caption: chalk on charcoal-deep/85 over white", fg: "chalk", bg: "charcoal-deep/85@white", need: TEXT, alpha: 1, ratio: (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) });
}
// JEWELRY GUIDE RING TABLE (components/editorial/ring-size-context.tsx): the
// row the ring sizer is on is tinted gold-pale/35 over the white table; its
// size number is gold-deep and its figures charcoal-deep.
{
  const row = blend(hex(C["gold-pale"]), hex(C.white), 0.35);
  const on = (fgName) => { const [L1, L2] = [lum(hex(C[fgName])), lum(row)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  pairs.push({ label: "ring table current row: gold-deep on gold-pale/35 over white", fg: "gold-deep", bg: "white+gold-pale35", need: TEXT, alpha: 1, ratio: on("gold-deep") });
  pairs.push({ label: "ring table current row: charcoal-deep on gold-pale/35 over white", fg: "charcoal-deep", bg: "white+gold-pale35", need: TEXT, alpha: 1, ratio: on("charcoal-deep") });
}
// LOYALTY LADDER (components/fx/tier-ladder.tsx): a lit tier's title turns
// gold-dark over the white card; the inner glow peaks at gold/14 at the edge,
// so the title is measured on that peak.
{
  const glow = blend(hex(C.gold), hex(C.white), 0.14);
  const [L1, L2] = [lum(hex(C["gold-dark"])), lum(glow)];
  pairs.push({ label: "lit tier title: gold-dark on white+gold14 glow", fg: "gold-dark", bg: "white+gold14", need: LARGE, alpha: 1, ratio: (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) });
}

// FAQ CATEGORY NAV (components/faq/faq-nav.tsx): links charcoal-deep/80 on the
// chalk page (and the phone bar's chalk/96 over it); the current one gold-dark.
add("FAQ category link: charcoal-deep/80 on chalk", "charcoal-deep", "chalk", TEXT, 0.8);
add("FAQ current category: gold-dark on chalk", "gold-dark", "chalk", TEXT);

// Values-tile SPOTLIGHT (app/globals.css .spotlight, components/fx/spotlight.tsx).
// Under a mouse, a gold glow sits between the charcoal tile and its copy. Its
// peak is gold at 20% (the radial gradient's centre), so the copy is measured
// on gold/20 composited over charcoal — the brightest the tile ever gets.
// The orange "01"–"04" numerals are 11px bold, so they are held to TEXT.
{
  const lit = blend(hex(C.gold), hex(C.charcoal), 0.20);
  const on = (fgName, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), lit, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(lit)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  pairs.push({ label: "spotlight peak: chalk heading", fg: "chalk", bg: "spotlight@gold20", need: TEXT, alpha: 1, ratio: on("chalk") });
  pairs.push({ label: "spotlight peak: chalk/75 body", fg: "chalk", bg: "spotlight@gold20", need: TEXT, alpha: 0.75, ratio: on("chalk", 0.75) });
}

// HERO v3 STAGE (components/home/hero-slide-views.tsx, app/globals.css
// "HERO v3"), owner approvals 2026-09-26. Slides 2–6 are one dark stage; the
// v2 surfaces (ledger card, film piece panel, cream photo) are gone. Every
// line of text on a category slide — title, caller, description, the Index,
// the name/price line under each piece, the Tokyo readout, the controls —
// sits on the stage ground (#231e18 → #0f0d0a) or on its warm pool of light,
// rgb(120 92 40 / .30) over #231e18: the pool's centre is the LIGHTEST point
// of the stage, the worst case for light text, and every row is measured on
// it. The gilt is only ever a title: its stops are rows at large-text size.
{
  const base = hex("#231e18");
  const pool = blend([120, 92, 40], base, 0.3);
  const on = (fgName, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), pool, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(pool)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const rows = [
    ["chalk/82 piece name (name/price line)", "chalk", 0.82, TEXT],
    ["chalk featured piece name", "chalk", 1, TEXT],
    ["gold-pale piece price", "gold-pale", 1, TEXT],
    ["chalk/80 description", "chalk", 0.8, TEXT],
    ["gold-pale caller line", "gold-pale", 1, TEXT],
    ["gold-pale/75 caller numeral", "gold-pale", 0.75, TEXT],
    ["gilt stop gold (title)", "gold", 1, LARGE],
    ["gilt stop gold-pale (title)", "gold-pale", 1, LARGE],
    ["chalk/70 Index label and count", "chalk", 0.7, TEXT],
    ["gold-pale/70 Index numerals", "gold-pale", 0.7, TEXT],
    ["chalk large Index label (nothing in stock)", "chalk", 1, LARGE],
    ["gold-pale/85 「入荷待ち」 / Coming soon", "gold-pale", 0.85, TEXT],
    ["chalk Tokyo readout figures", "chalk", 1, TEXT],
    ["gold-pale/92 Tokyo readout labels", "gold-pale", 0.92, TEXT],
    ["outline button edge chalk/55", "chalk", 0.55, NONTEXT],
    ["control ring chalk/45", "chalk", 0.45, NONTEXT],
    ["chalk/70 counter total", "chalk", 0.7, TEXT],
    ["chalk/75 slide name", "chalk", 0.75, TEXT],
  ];
  for (const [label, fg, alpha, need] of rows) pairs.push({ label: `hero v3 stage pool: ${label}`, fg, bg: "stage pool", need, alpha, ratio: on(fg, alpha) });
}

// CATEGORY STAGE (components/catalog/category-stage.tsx, app/globals.css
// "CATEGORY STAGE"), 2026-09-26: the /categories/[slug] banner when the Hub has
// no category photo. The hero v3 stage's ground and pool, so the same worst
// case — the pool's centre — and the hero's text colours. The gold-pale
// eyebrow is also the 11px caps line; the title is chalk at display size.
{
  const pool = blend([120, 92, 40], hex("#231e18"), 0.3);
  const on = (fgName, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), pool, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(pool)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  const rows = [
    ["gold-pale eyebrow", "gold-pale", 1, TEXT],
    ["chalk title (h1)", "chalk", 1, TEXT],
    ["chalk/80 description", "chalk", 0.8, TEXT],
  ];
  for (const [label, fg, alpha, need] of rows) pairs.push({ label: `category stage pool: ${label}`, fg, bg: "stage pool", need, alpha, ratio: on(fg, alpha) });
}

// PRODUCT + GRID BUILD (step 2, 2026-09-27). The Sold card and the category
// count line sit on the same stage (worst case: the pool's centre); the
// collection header's text sits on #17140f; the ask tile, the buy bar and the
// price card on charcoal-deep (rows above: chalk/55–100, gold-pale).
{
  const pool = blend([120, 92, 40], hex("#231e18"), 0.3);
  const on = (fgName, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), pool, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(pool)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  for (const [label, fg, alpha, need] of [
    ["Sold card chalk/80 body and piece names", "chalk", 0.8, TEXT],
    ["Sold card gold-pale title, eyebrow, prices", "gold-pale", 1, TEXT],
    ["count line chalk/75", "chalk", 0.75, TEXT],
    ["count line gold-pale figure", "gold-pale", 1, TEXT],
  ]) pairs.push({ label: `step 2 stage pool: ${label}`, fg, bg: "stage pool", need, alpha, ratio: on(fg, alpha) });
  const head = hex("#17140f");
  const onHead = (fgName, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), head, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(head)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  for (const [label, fg, alpha, need] of [
    ["collection header chalk title", "chalk", 1, TEXT],
    ["collection header chalk/80 description", "chalk", 0.8, TEXT],
    ["collection header chalk/75 count", "chalk", 0.75, TEXT],
    ["collection header gold-pale eyebrow and figure", "gold-pale", 1, TEXT],
  ]) pairs.push({ label: `step 2 #17140f: ${label}`, fg, bg: "#17140f", need, alpha, ratio: onHead(fg, alpha) });
}
add("step 2 ask tile chalk/80 Messenger edge on charcoal-deep", "chalk", "charcoal-deep", NONTEXT, 0.8);
add("step 2 trust rows charcoal/80 on chalk", "charcoal", "chalk", TEXT, 0.8);
add("step 2 card spec gold-dark on white", "gold-dark", "white", TEXT);
// Jewelry guide drawings (2026-10-27): every meaningful line is gold-dark, on the white
// panels and the chalk clasp wells; labels are charcoal-deep on white.
add("jewelry guide drawing line gold-dark on white", "gold-dark", "white", NONTEXT);
add("jewelry guide drawing line gold-dark on chalk", "gold-dark", "chalk", NONTEXT);
add("jewelry guide drawing label charcoal-deep on white", "charcoal-deep", "white", TEXT);
add("step 2 card sold price / down payment charcoal/70 on white", "charcoal", "white", TEXT, 0.7);
add("step 2 chip count and 0-option charcoal/70 on chalk", "charcoal", "chalk", TEXT, 0.7);
add("step 2 Sold badge chalk on charcoal-deep", "chalk", "charcoal-deep", TEXT);

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

// The floating Messenger button (components/site/messenger-button.tsx,
// .messenger-fab in app/globals.css). It floats over the chalk page, white
// cards and the charcoal-deep footer, so every edge is measured on all three.
// Orange on chalk (1.81) is already pinned as a must-fail below: the
// charcoal-deep border is what carries the shape on light, as with the
// pending dot. The focus ring is charcoal-deep outside and chalk inside, one
// for each kind of surface. The label and glyph are charcoal-deep on orange
// and orange-hover, rows above.
add("messenger button border (charcoal-deep) on chalk", "charcoal-deep", "chalk", NONTEXT);
add("messenger button border (charcoal-deep) on white", "charcoal-deep", "white", NONTEXT);
add("messenger focus ring outer charcoal-deep on chalk", "charcoal-deep", "chalk", NONTEXT);
add("messenger focus ring outer charcoal-deep on white", "charcoal-deep", "white", NONTEXT);
add("messenger focus ring inner chalk on charcoal-deep", "chalk", "charcoal-deep", NONTEXT);

// Post body links (.post-body a in app/globals.css). The resting gold-dark on
// chalk already has a row above; the HOVER is gold-deep, which is new on this
// surface — gold-deep existed only over the two composited tints until now.
// Underlined at rest as well, so colour is not the only thing carrying them.
add("post body link hover (gold-deep) on chalk", "gold-deep", "chalk", TEXT);

// Customer Stories, the typing slideshow (components/home/story-show.tsx,
// .story-* in app/globals.css). The stage is chalk on the white section; the
// heading column and the controls sit on white. The typed quote and the whole
// quote are the same charcoal-deep; the caret is decorative (aria-hidden).
add("stories quote charcoal-deep on chalk stage", "charcoal-deep", "chalk", TEXT);
add("stories place/date charcoal/70 on chalk stage", "charcoal", "chalk", TEXT, 0.7);
add("stories stars gold-dark on chalk stage", "gold-dark", "chalk", NONTEXT);
add("stories item chip charcoal-deep on white", "charcoal-deep", "white", TEXT);
add("stories up-next label gold-dark on white", "gold-dark", "white", TEXT);
add("stories up-next piece charcoal/70 on white", "charcoal", "white", TEXT, 0.7);
add("stories counter total charcoal-deep/78 on white", "charcoal-deep", "white", TEXT, 0.78);
add("stories progress fill gold-deep on white", "gold-deep", "white", NONTEXT);
add("stories round button glyph charcoal-deep on white", "charcoal-deep", "white", NONTEXT);
add("stories focus ring gold-dark on white", "gold-dark", "white", NONTEXT);
// Our Values (components/home/values-tiles.tsx): numerals and icons move from
// orange to Pale Gilt on the charcoal tiles, and each letter's burst flashes
// gold-pale before settling to chalk / chalk/75 (rows above).
add("values numeral + icon gold-pale on charcoal tile", "gold-pale", "charcoal", TEXT);
add("values burst flash gold-pale on charcoal tile", "gold-pale", "charcoal", TEXT);

// The announcement bar (components/site/announcement-bar.tsx): a charcoal-deep
// strip above the header, chalk sentence, orange link when the Hub's row
// carries an href, and a chalk/75 close glyph.
//
// The LINK ROW IS THE ONE THAT MATTERS. Orange is registered elsewhere in this
// file only as a fill edge (3:1) and as a heading of 24px or more (the pomelli
// exemption) — neither of which covers a 13px sentence. It is measured here at
// 4.5, which it clears on charcoal-deep at 8.06; the exemption is not borrowed
// and the bar's type size is not free to grow into it.
add("announcement text (chalk) on charcoal-deep", "chalk", "charcoal-deep", TEXT);
add("announcement close glyph chalk/75 on charcoal-deep", "chalk", "charcoal-deep", NONTEXT, 0.75);
add("announcement close focus ring gold-pale on charcoal-deep", "gold-pale", "charcoal-deep", NONTEXT);

// The newsletter field in the DARK footer (components/site/newsletter-form.tsx
// tone="dark"). The light form rule does not cross: its white fill would be a
// hole in the band, and its gold-dark ring clears 3:1 on charcoal-deep by only
// 0.18 (3.18). gold-pale is 10.62 — the ring is chosen for margin, not because
// the other one is invalid.
add("newsletter input text (chalk) on charcoal-deep", "chalk", "charcoal-deep", TEXT);
add("newsletter input border chalk/40 on charcoal-deep", "chalk", "charcoal-deep", NONTEXT, 0.4);
add("newsletter focus ring gold-pale on charcoal-deep", "gold-pale", "charcoal-deep", NONTEXT);

// THE SITE FRAME (build step 1, 2026-09-27). Header, mega-menus, search,
// drawer, tab bar, footer, Messenger button.
//
// THE FOCUS RING (audit P1). The global ring was gold-pale, 1.37:1 on chalk;
// it is now gold-dark on light and gold-pale inside a dark surface
// (app/globals.css). Both rings are measured on every surface they meet.
add("focus ring gold-dark on chalk (global, light)", "gold-dark", "chalk", NONTEXT);
add("focus ring gold-dark on white (menu rows, search panel)", "gold-dark", "white", NONTEXT);
add("focus ring gold-dark on tab bar chalk/95", "gold-dark", "tintB", NONTEXT);
add("focus ring gold-pale on charcoal-deep (footer, hero, drawer foot)", "gold-pale", "charcoal-deep", NONTEXT);
// Messenger button (D1-1): charcoal-deep fill, gold edge, gold-pale glyph,
// chalk label. The two-ring focus is gold-pale inside, gold-dark outside.
add("messenger fill charcoal-deep edge on chalk", "charcoal-deep", "chalk", NONTEXT);
add("messenger gold edge on charcoal-deep (over the footer/hero)", "gold", "charcoal-deep", NONTEXT);
add("messenger glyph gold-pale on charcoal-deep", "gold-pale", "charcoal-deep", NONTEXT);
add("messenger label chalk on charcoal-deep", "chalk", "charcoal-deep", TEXT);
add("messenger outer ring gold-dark on chalk", "gold-dark", "chalk", NONTEXT);
add("messenger inner ring gold-pale on charcoal-deep", "gold-pale", "charcoal-deep", NONTEXT);
// Language toggle (DESIGN.md change: not orange). Light: charcoal-deep
// segment with a chalk label; dark (footer, drawer): chalk segment with a
// charcoal-deep label; the edge charcoal/40 on chalk, chalk/40 on charcoal.
add("lang toggle active chalk on charcoal-deep", "chalk", "charcoal-deep", TEXT);
add("lang toggle active charcoal-deep on chalk (dark tone)", "charcoal-deep", "chalk", TEXT);
add("lang toggle idle charcoal/80 on chalk", "charcoal", "chalk", TEXT, 0.8);
add("lang toggle idle chalk/80 on charcoal-deep", "chalk", "charcoal-deep", TEXT, 0.8);
add("lang toggle, search field, chip and close edges charcoal/60 on chalk", "charcoal", "chalk", NONTEXT, 0.6);
add("lang toggle edge chalk/40 on charcoal-deep", "chalk", "charcoal-deep", NONTEXT, 0.4);
// Cart count: a charcoal-deep disc with a gold-pale numeral (not orange).
add("cart count gold-pale on charcoal-deep", "gold-pale", "charcoal-deep", TEXT);
// Mega-menus: eyebrows gold-dark on chalk, descriptions and counts charcoal/75
// on chalk and white, the feature tile and contact card on charcoal-deep.
add("menu eyebrow gold-dark on chalk", "gold-dark", "chalk", TEXT);
add("menu description charcoal/75 on chalk", "charcoal", "chalk", TEXT, 0.75);
add("menu row hover: charcoal/75 on white", "charcoal", "white", TEXT, 0.75);
add("menu icon box edge gold-dark on chalk", "gold-dark", "chalk", NONTEXT);
// The menus' customer-story panel (owner decision on PR #168): the quote in
// chalk, the name and the link in gold-pale, the details in chalk/75, the
// stars in gold (graphics), all on charcoal-deep.
add("menu story quote chalk on charcoal-deep", "chalk", "charcoal-deep", TEXT);
add("menu story name/link gold-pale on charcoal-deep", "gold-pale", "charcoal-deep", TEXT);
add("menu story details chalk/75 on charcoal-deep", "chalk", "charcoal-deep", TEXT, 0.75);
add("menu story stars gold on charcoal-deep", "gold", "charcoal-deep", NONTEXT);
// Search: marked query gold-dark on white and chalk, Sold badge charcoal/75
// on chalk, chips' edge charcoal/40 on white (measured at 0.6: see below).
add("search match gold-dark on white", "gold-dark", "white", TEXT);
add("search match gold-dark on chalk (active row)", "gold-dark", "chalk", TEXT);
add("search Sold badge charcoal/75 on chalk", "charcoal", "chalk", TEXT, 0.75);
// Tab bar: idle labels charcoal/75, active gold-deep, on chalk/95.
add("tab bar idle label charcoal/75 on chalk/95", "charcoal", "tintB", TEXT, 0.75);
add("tab bar active label gold-deep on chalk/95", "gold-deep", "tintB", TEXT);
// Footer: gold-pale headings and figures, chalk/80 links, chalk/75 notes,
// the gold rule at 32% is ornament (the colour change is the divider).
add("footer heading gold-pale on charcoal-deep", "gold-pale", "charcoal-deep", TEXT);
add("footer link chalk/80 on charcoal-deep", "chalk", "charcoal-deep", TEXT, 0.8);
add("footer note chalk/75 on charcoal-deep", "chalk", "charcoal-deep", TEXT, 0.75);
add("footer Sign up gold-pale on charcoal-deep (D1-2)", "gold-pale", "charcoal-deep", TEXT);

// STEP 5 BRAND PAGES (components/site/brand-ui.tsx; About, Why, Affiliations,
// Layaway, Loyalty, Wholesale). The hero stage (StageBand) is the category
// stage's ground and pool, so every line on it is measured at the pool's
// centre, the lightest point; the plain dark band is charcoal-deep (rows
// above cover chalk/70–100 and gold-pale there). The gold rules are
// rgba(201,162,39,.32): ornament, not a boundary — the cells are separated by
// their content, as in the footer ledger.
{
  const pool = blend([120, 92, 40], hex("#231e18"), 0.3);
  const on = (fgName, alpha = 1) => { const fg = alpha < 1 ? blend(hex(C[fgName]), pool, alpha) : hex(C[fgName]); const [L1, L2] = [lum(fg), lum(pool)]; return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  for (const [label, fg, alpha, need] of [
    ["gold-pale eyebrow, labels, step titles, figures", "gold-pale", 1, TEXT],
    ["gilt stop gold (h1)", "gold", 1, LARGE],
    ["chalk/85 lede and piece name", "chalk", 0.85, TEXT],
    ["chalk/80 step text and ledger notes", "chalk", 0.8, TEXT],
    ["chalk/75 ledger small print", "chalk", 0.75, TEXT],
    ["chalk button fill edge (Join free, D5-3)", "chalk", 1, NONTEXT],
  ]) pairs.push({ label: `step 5 stage pool: ${label}`, fg, bg: "stage pool", need, alpha, ratio: on(fg, alpha) });
}
add("step 5 Join free label charcoal-deep on chalk (dark stage)", "charcoal-deep", "chalk", TEXT);
add("step 5 Join free label charcoal-deep on white (hover)", "charcoal-deep", "white", TEXT);
add("step 5 Join free label chalk on charcoal-deep (light band)", "chalk", "charcoal-deep", TEXT);
add("step 5 Join free hover chalk on charcoal", "chalk", "charcoal", TEXT);
add("step 5 lede charcoal/85 on chalk", "charcoal", "chalk", TEXT, 0.85);
add("step 5 tier multiplier chalk on charcoal-deep", "chalk", "charcoal-deep", TEXT);
add("step 5 term minimum chalk/80 on charcoal-deep (selected term)", "chalk", "charcoal-deep", TEXT, 0.8);
add("step 5 term label charcoal-deep on white", "charcoal-deep", "white", TEXT);
add("step 5 term segment edge charcoal/60 on white", "charcoal", "white", NONTEXT, 0.6);
add("step 5 wholesale radio chip edge charcoal/60 on white", "charcoal", "white", NONTEXT, 0.6);
add("step 5 cells charcoal/70 label on white", "charcoal", "white", TEXT, 0.7);
add("step 5 reasons numeral gold-dark on chalk", "gold-dark", "chalk", LARGE);
add("step 5 proof card labels gold-dark on white", "gold-dark", "white", TEXT);
add("step 5 proof card values charcoal/75 on white", "charcoal", "white", TEXT, 0.75);
add("step 5 dark band outline button edge chalk/55 on charcoal-deep", "chalk", "charcoal-deep", NONTEXT, 0.55);
add("step 5 second question gold-dark display on chalk", "gold-dark", "chalk", LARGE);

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
  ["gold-pale", "chalk", 1, TEXT],
  ["charcoal", "white", 0.3, TEXT],
  ["teal", "white", 1, TEXT], ["gold", "white", 1, NONTEXT],
  ["charcoal", "chalk", 0.6, TEXT], ["garnet-light", "chalk", 1, TEXT],
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
