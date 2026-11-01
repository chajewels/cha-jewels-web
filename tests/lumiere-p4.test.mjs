// P4 (redesign/lumiere-p4-pages): the stories belt, the layaway band, the footer, the palette, the pages — pinned at the source.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const read = (p) => readFileSync(p, "utf8");
const strip = (s) => s.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(f)) out.push(p);
  }
  return out;
};

test("item 1 — the stories belt keeps the reference's constants and mechanics", () => {
  const belt = strip(read("components/lumiere/stories/stories-belt.tsx"));
  for (const [k, v] of [["cardRatio", "1.34"], ["tilt", "-32"], ["spacing", "0.3"], ["cardY", "0.64"], ["autoScroll", "0.22"], ["drag", "0.9"], ["damp", "0.92"], ["fadeFar", "0.24"], ["nearHide", "0.4"]]) {
    assert.match(belt, new RegExp(`${k}: ${v.replace(".", "\\.")},`), k);
  }
  assert.match(belt, /const slots = Math\.max\(MIN_SLOTS, n\);/);
  assert.match(belt, /const MIN_SLOTS = 9;/);
  assert.match(belt, /document\.elementFromPoint\(x, y\)/, "hover by elementFromPoint, not CSS :hover");
  assert.ok(!/addEventListener\("wheel"/.test(belt), "the wheel is never taken (Lenis is not hijacked)");
  assert.match(belt, /e\.key === "ArrowRight"/);
  assert.match(belt, /if \(!reduce\) pos -= P\.autoScroll \* k;/, "no drift under reduced motion");
  assert.match(belt, /document\.hidden/);
  const css = read("app/lumiere/pages.css");
  assert.match(css, /touch-action: pan-y;/);
  assert.match(css, /transform: rotateY\(var\(--tilt, -32deg\)\);/);
  assert.ok(!/position: fixed;\s*inset: 0;\s*overflow: hidden;\s*z-index: 1/.test(css), "an in-flow band, not a fixed full-viewport stage");
  assert.ok(!/fonts\.googleapis|getlayers\.ai\/storage/.test(belt + css), "no Google Fonts, no hotlinked images");
});

test("item 1 — every story is on the belt, the dialog shows it verbatim, the Almanac stack is gone", () => {
  const section = read("components/lumiere/stories/stories-section.tsx");
  assert.ok(!/stories\.slice\(|STORIES_ON_HOME/.test(section));
  const dialog = read("components/lumiere/stories/story-dialog.tsx");
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /e\.key === "Escape"/);
  assert.match(dialog, /\{s\.quote\}/, "the whole quote, as held");
  assert.match(read("app/lumiere/pages.css"), /\.slip-dialog__quote \{[^}]*white-space: pre-wrap/);
  assert.equal(statSync("components/lumiere/stories").isDirectory(), true);
  assert.ok(!readdirSync("components/lumiere/stories").some((f) => /almanac/.test(f)));
  assert.ok(!/almanac/i.test(strip(read("components/lumiere/common/engine-island.tsx"))));
});

test("item 2 — the layaway band: calculator over the scene, illustrated steps, money logic untouched", () => {
  const band = read("components/lumiere/layaway/layaway-section.tsx");
  assert.match(band, /<CalculatorIsland lang=\{lang\} header=\{content\.calculator\} cta=\{content\.cta\} \/>/);
  assert.match(band, /<StepVisual step=/);
  assert.match(band, /if \(!layawayOffered\(lang\)\) return null;/);
  assert.ok(!/layawayQuote|toPhp|phpRate|\* 0\.3|\/ 100/.test(strip(band)), "no money maths in the band");
  assert.match(read("components/lumiere/layaway/calculator-island.tsx"), /variant="lumiere"/);
  assert.match(read("scripts/check-contrast.mjs"), /caption chip white on the black\/82 chip/);
});

test("items 3–4 — the footer: whole wordmark, readable company panel, one legal list", () => {
  const css = read("app/lumiere/chrome.css");
  const giant = css.slice(css.indexOf(".footer--cha .footer__giant {"), css.indexOf("}", css.indexOf(".footer--cha .footer__giant {")));
  assert.match(giant, /overflow: visible;/);
  assert.match(giant, /line-height: 1\.2;/);
  const line = css.slice(css.indexOf(".footer--cha .footer__company-line {"), css.indexOf("}", css.indexOf(".footer--cha .footer__company-line {")));
  assert.match(line, /font-size: 14px;/);
  assert.match(line, /rgb\(255 255 255 \/ 0\.86\)/);
  const footer = read("components/lumiere/footer/footer-section.tsx");
  assert.ok(!/footer__meta--legal/.test(footer), "the bottom legal row is gone (the Care column keeps them)");
  assert.match(footer, /className="footer__company-panel"/);
  for (const k of ["COMPANY_NAME_DISPLAY[lang]", "REPRESENTATIVE_NAME[lang]", "COMPANY_ADDRESS[lang]", "CORPORATE_NO", 't("footer", "invoiceReg")', 't("footer", "secondhandPermit")', 't("trust", "founded")', 't("trust", "auth")']) assert.ok(footer.includes(k), k);
});

test("item 5 — the loyalty labels are in the label style, the figures and names in the display face", () => {
  assert.match(read("components/lumiere/loyalty/loyalty-section.tsx"), /loyalty__tier-rate-label font-manrope/);
  assert.match(read("app/loyalty/page.tsx"), /text-\[11px\] font-medium uppercase[^"]*tracking-\[0\.1em\]/);
  assert.match(read("app/lumiere/sections.css"), /\.loyalty__tier-name \{ font-family: var\(--lm-font-display\); \}/);
});

test("D-4 — no orange anywhere: no class, no token, Button is the black pill", () => {
  const hits = [];
  for (const f of [...walk("app"), ...walk("components"), ...walk("lib")].filter((p) => !p.startsWith("lib/i18n"))) {
    const s = strip(read(f));
    if (/\b(bg|text|border|ring|outline|from|via|to|fill|stroke|decoration)-orange\b/.test(s)) hits.push(f);
  }
  assert.deepEqual(hits, []);
  assert.ok(!/orange:/.test(read("tailwind.config.ts")));
  const button = read("components/ui/button.tsx");
  assert.match(button, /solid: "border-transparent bg-content text-content-inverse/);
  assert.match(button, /rounded-pill/);
  assert.match(read("tailwind.config.ts"), /pill: "999px"/);
});

test("the palette: ink, bone, no gold; the gate scene keeps its brass", () => {
  const cfg = read("tailwind.config.ts");
  assert.match(cfg, /charcoal: \{ DEFAULT: "#1c1c1c", deep: "#000000", mid: "#2b2b2b" \}/);
  assert.match(cfg, /chalk: "#f4f0ec"/);
  assert.match(cfg, /gold: \{ DEFAULT: "#a39d94", pale: "#d9d3ca", dark: "#2a2724", deep: "#000000" \}/);
  assert.match(read("lib/scene/gate/gate-scene.ts"), /colGoldDark: "#8a6b12"/);
  assert.ok(!/#C9A227|#E8D28A|rgb\(201[ _]162[ _]39/i.test(walk("app").concat(walk("components")).filter((f) => !f.includes("tier-icon") && !f.startsWith("app/lumiere")).map(read).join("\n")), "no raw gold literal outside the tier medallions and the Lumière stylesheets");
});

test("every h1 resolves word by word with real text; Japanese breaks at phrases", () => {
  const reveal = read("components/lumiere/common/reveal-text.tsx");
  assert.match(reveal, /new Intl\.Segmenter\("ja", \{ granularity: "word" \}\)/);
  assert.match(reveal, /className="lm-w"/);
  const css = read("app/lumiere/pages.css");
  assert.match(css, /@supports \(animation-timeline: view\(\)\)/);
  let wrapped = 0;
  for (const f of [...walk("app"), ...walk("components")]) {
    const s = read(f);
    for (const m of s.matchAll(/<h1\b[^>\n]*>\s*\{?[^<\n]*<Reveal>/g)) wrapped += 1;
  }
  assert.ok(wrapped >= 30, `h1s wrapped: ${wrapped}`);
});

test("the certificate envelope is gated on the Hub's own data and shows nothing today", async () => {
  const { certificateOf } = await import("@/lib/certificate");
  const { products } = await import("@/lib/fixtures");
  for (const p of products) assert.equal(certificateOf(p), null, p.slug);
  assert.equal(certificateOf({ certificate: { kind: "  GIA  ", issuer: "GIA", number: "123" } }).kind, "GIA");
  assert.equal(certificateOf({ certificate: { kind: "" } }), null);
  assert.equal(certificateOf({ certificate: "yes" }), null);
  assert.match(read("app/products/[slug]/page.tsx"), /\{certificate && \(/);
});

test("the product page: sheets, leaning related cards, no 3D", () => {
  const page = read("app/products/[slug]/page.tsx");
  assert.match(page, /className="pdp-sheets"/);
  assert.match(page, /<LeanCard key=\{x\.slug\}>/);
  for (const p of ["components/catalog/product-card.tsx", "components/catalog/lean-card.tsx", "components/catalog/certificate-envelope.tsx"]) assert.ok(!/three|WebGL|canvas/i.test(strip(read(p))), p);
});
