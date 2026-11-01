// P3 (redesign/lumiere-p3-chrome): the chrome on every page and the home fixes, pinned at the source.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const stripComments = (s) => s.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");

test("item 1 — every Lumière display stack carries the Mincho on a Japanese page", () => {
  const tokens = read("app/lumiere/tokens.css");
  assert.match(tokens, /:root \{\s*--lm-font-display: var\(--font-instrument-serif\), Georgia, serif;/);
  assert.match(tokens, /html:lang\(ja\) \{\s*--lm-font-display: var\(--font-instrument-serif\), var\(--font-jp\), "Hiragino Mincho ProN", "Yu Mincho", serif;/);
  const tailwind = read("tailwind.config.ts");
  assert.match(tailwind, /display: \["var\(--lm-font-display\)"\]/);
  assert.match(tailwind, /serif: \["var\(--lm-font-display\)"\]/);
  // No Lumière stylesheet sets a display line in the serif ALONE (the philosophy block did).
  for (const file of ["app/lumiere/blocks.css", "app/lumiere/sections.css", "app/lumiere/chrome.css", "app/lumiere/utilities.css"]) {
    const css = stripComments(read(file));
    const alone = [...css.matchAll(/font-family:\s*var\(--font-instrument-serif\)[^;]*;/g)].map((m) => m[0]).filter((d) => !d.includes("--font-jp"));
    assert.deepEqual(alone, [], `${file}: ${alone.join(" | ")}`);
  }
});

test("D-14 — Playfair and Inter are gone; the site's faces are Instrument Serif and Manrope (variable)", () => {
  const layout = read("app/layout.tsx");
  assert.ok(!/Playfair_Display|\bInter\b\(/.test(layout));
  assert.match(layout, /Noto_Serif_JP\(/);
  const tokens = read("app/lumiere/tokens.css");
  assert.match(tokens, /--font-display: var\(--font-instrument-serif\), Georgia, serif;/);
  assert.match(tokens, /--font-sans: var\(--font-manrope\), "Helvetica Neue", Arial, sans-serif;/);
  const fonts = read("app/fonts.ts");
  assert.match(fonts, /Manrope-Variable\.woff2", weight: "200 800"/);
});

test("the chrome on every page — the Lumière header and footer from the root layout, the old ones unused", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /<SiteChrome lang=\{lang\} switchTargets=\{targets\} \/>/);
  assert.match(layout, /<FooterSection lang=\{lang\} switchTargets=\{targets\} \/>/);
  assert.ok(!/components\/site\/header"|components\/site\/footer"/.test(layout), "the old header and footer are not imported");
  const header = read("components/lumiere/site/site-header.tsx");
  assert.match(header, /sticky top-0 z-40/);
  assert.match(header, /root\.style\.setProperty\("--hdr-h"/, "the sticky consumers' contract");
  assert.match(header, /const line = bar\.top \+ bar\.height \/ 2;/, "the tone is sampled at the bar's own midline");
  assert.match(header, /\.footer--cha/, "the footer flips the bar dark");
  // one chrome builder for the home and the inner pages
  assert.match(read("components/lumiere/home/home-view.tsx"), /await buildChrome\(\{ lang, switchTargets, demo \}\)/);
  assert.match(read("components/lumiere/site/site-chrome.tsx"), /await buildChrome\(\{ lang, switchTargets \}\)/);
});

test("the search is the Halden overlay on the existing /api/search logic, loaded on the first press", () => {
  const overlay = read("components/lumiere/site/search-overlay.tsx");
  assert.match(overlay, /fetch\(`\/api\/search\?q=\$\{encodeURIComponent\(term\)\}&lang=\$\{lang\}`/);
  assert.match(overlay, /markSearchFromBox\(term\);\s*go\(`\/search\?q=/);
  assert.match(overlay, /role="combobox"/);
  assert.match(overlay, /e\.key === "Escape"/);
  const trigger = read("components/lumiere/site/search-trigger.tsx");
  assert.match(trigger, /dynamic\(\(\) => import\("\.\/search-overlay"\)/);
  assert.match(trigger, /e\.key !== "\/"/, 'the "/" shortcut');
});

test("the scroll-reset bug — the lock restores the position and every dialog hands focus back without scrolling", () => {
  const lock = read("lib/scroll-lock.ts");
  assert.match(lock, /y: typeof window === "undefined" \? 0 : window\.scrollY/);
  assert.match(lock, /export const focusWithoutScroll/);
  for (const p of ["components/site/mobile-nav.tsx", "components/site/search-box.tsx", "components/lumiere/site/menu-overlay.tsx", "components/lumiere/site/search-overlay.tsx"]) {
    assert.match(read(p), /focusWithoutScroll/, p);
  }
  for (const p of ["components/site/nav-menu.tsx", "components/site/account-menu.tsx"]) {
    assert.match(read(p), /focus\(\{ preventScroll: true \}\)/, p);
  }
});

test("item 3 — the arrivals ring advances by itself and pauses for hover, focus, drag, off-screen and a hidden tab; never under reduced motion", () => {
  const engine = stripComments(read("components/lumiere/arrivals/spotlight-engine.ts"));
  assert.match(engine, /export const AUTO = \{\s*interval: 3500,\s*idle: 4000,\s*\}/);
  assert.match(engine, /if \(!REDUCE && !dragging && !hovered && !focused && !document\.hidden && settled/);
  for (const ev of ['"pointerenter"', '"pointerleave"', '"focusin"', '"focusout"']) assert.ok(engine.includes(`root.addEventListener(${ev}`), ev);
  assert.match(engine, /go\(1\);\s*lastAuto = time;/, "the engine's own snap carries the turn");
  assert.match(engine, /if \(Math\.abs\(diff\) < 0\.01\) rot = -targetIndex \* stepDeg;/, "the no-shake settle is kept");
});

test("item 4 — the stories stack shows every published story, newest first", () => {
  const section = read("components/lumiere/stories/stories-section.tsx");
  assert.ok(!/stories\.slice\(|STORIES_ON_HOME/.test(section));
  assert.match(section, /export const REVIEWS_PAGE_MAX = 50;/);
  assert.match(section, /mergeStories\(toStories\(items, lang\), reviewsToStories\(list\?\.reviews \?\? \[\], lang\)\);/);
  assert.ok(!read("lib/content/lumiere-home.ts").includes("STORIES_ON_HOME"));
});

test("item 5 — the Halcyon Gate: tinted through CONFIG only, the shader verbatim, mounted near, paused off screen, poster under D-10", () => {
  const scene = read("lib/scene/gate/gate-scene.ts");
  const config = scene.slice(scene.indexOf("export const GATE_CONFIG"), scene.indexOf("export type GateConfig"));
  for (const [k, v] of [["colSkyTop", "#ece4d8"], ["colWaterDeep", "#5f4319"], ["colGoldLight", "#e8c37d"], ["colGoldDark", "#8a6b12"]]) assert.ok(config.includes(`${k}: "${v}"`), k);
  // the preserved mechanics are in the shader text as the source has them
  for (const needle of ["vec3 worldColor(vec2 uv)", "vec2 waterPlane(vec2 uv)", "ruv.y = uHorizon + depth * uStretch + slope.y * amp;", "for (int i = 0; i < NRIP; i++)"]) assert.ok(scene.includes(needle), needle);
  assert.ok(!/#5fb4ec|#1a5790/.test(scene), "the default sea is not in the port");
  const island = read("components/lumiere/layaway/gate-scene.tsx");
  assert.match(island, /shouldRenderScene\(\)/);
  assert.match(island, /whenAfterTTI\(\)/);
  assert.match(island, /if \(!inView \|\| document\.hidden\) return;/);
  assert.match(island, /ENTRANCE_MS = 2800/);
  assert.match(read("components/lumiere/layaway/layaway-section.tsx"), /className="lw__stage"/);
  assert.match(read("docs/design-refs/halcyon-gate/CONTRACT.md"), /preserve: motion, composition/);
});

test("item 6 — the loyalty band lists the Hub's tiers with the medallions, the qualifying spend and the multiplier", () => {
  const band = read("components/lumiere/loyalty/loyalty-section.tsx");
  assert.match(band, /hub\.loyaltyTiers\(\)\.catch\(fallback\)/);
  assert.match(band, /<TierIcon slug=\{tier\.slug\}/);
  assert.match(band, /tier\.threshold_jpy === 0 \? t\("loyalty", "onJoining"\) : `\$\{formatMoney\(tier\.threshold_jpy, "JP"\)\}\+`/);
  assert.match(band, /t\("loyalty", "times", \{ n: String\(tier\.multiplier\) \}\)/);
  assert.match(band, /localePath\("\/loyalty\/join", lang\)/);
  assert.ok(!/\b(Glimmer|Radiant|Elite|Crown)\b/.test(stripComments(band)), "no tier name is hard-coded");
  assert.ok(read("components/fx/tier-icon.tsx").length > 0);
});

test("item 7 — the footer: accordions on a phone, two columns for a long list, the giant wordmark aria-hidden, nothing dropped", () => {
  const footer = read("components/lumiere/footer/footer-section.tsx");
  assert.match(footer, /<details>\s*<summary className="footer__column-title">/);
  assert.match(footer, /TWO_COLUMNS_FROM = 7/);
  assert.match(footer, /<span className="footer__giant font-serif" aria-hidden="true">/);
  for (const needle of ['t("footer", "collections")', 't("footer", "shop")', 't("trust", "company")', 't("footer", "care")', "CookieSettingsLink", 't("footer", "newsletter")', 't("footer", "follow")', "CardMarks", "PaidyMark", "LangSwitcher", "COMPANY_NAME_DISPLAY", "CORPORATE_NO", 't("footer", "invoiceReg")', 't("footer", "secondhandPermit")']) assert.ok(footer.includes(needle), needle);
  assert.match(read("components/lumiere/footer/giant-wordmark.tsx"), /dynamic\(\(\) => import\("@\/components\/lumiere\/common\/letter-reveal"\)/);
});

test("the cookie bar on every page, the Messenger pill without gold, no orange in the chrome", () => {
  assert.ok(!read("components/site/consent-banner.tsx").includes("isHomePath"));
  assert.match(read("components/site/messenger-button.tsx"), /rounded-pill bg-content/);
  for (const p of ["components/site/announcement-bar.tsx", "components/site/mobile-tab-bar.tsx", "components/site/messenger-button.tsx", "components/site/flash-notice.tsx", "app/layout.tsx", "components/lumiere/site/site-header.tsx", "components/lumiere/site/menu-overlay.tsx", "components/lumiere/site/search-overlay.tsx"]) {
    assert.ok(!/orange|gold-pale|gold-dark|border-gold/.test(stripComments(read(p))), `${p} carries no orange or gold accent`);
  }
});
