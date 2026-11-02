// P4b (redesign/lumiere-p4b-pages): the owner's signed-in findings and the navigation colours — pinned at the source.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");

test("A1 — the header sits above all page content and every dropdown is an opaque panel", () => {
  const header = read("components/lumiere/site/site-header.tsx");
  assert.match(header, /className="lm-site-header sticky top-0 z-\[60\]"/, "header z 60 (page content tops out at 50)");
  // the full-screen layers stay above it: menu 70, search 80, story dialog 90, preloader 90, piece picker 75
  assert.match(read("components/lumiere/site/menu-overlay.tsx"), /z-\[70\]/);
  assert.match(read("components/lumiere/site/search-overlay.tsx"), /z-\[80\]/);
  assert.match(read("components/lumiere/common/preloader.tsx"), /fixed inset-0 z-\[90\]/);
  assert.match(read("components/commerce/layaway-piece-picker.tsx"), /fixed inset-0 z-\[75\]/);
  const menu = read("components/site/account-menu.tsx");
  assert.match(menu, /className="lm-dropdown menu-in /);
  const nav = read("app/lumiere/nav.css");
  assert.match(nav, /\.lm-dropdown \{[^}]*background: var\(--nav-panel\) !important;/s, "opaque surface");
  assert.match(nav, /\.lm-dropdown \{[^}]*border: 1px solid/s, "own border");
  assert.match(nav, /\.lm-dropdown \{[^}]*box-shadow:/s, "own shadow");
  // the hero rule that made every panel in the header transparent must leave dropdowns alone
  const sections = read("app/lumiere/sections.css");
  assert.match(sections, /\.hero-utilities :is\(a, button, div, span, kbd, input, svg\):not\(\.lm-dropdown, \.lm-dropdown \*\)/);
  assert.match(sections, /\.hero-utilities \.bg-white:not\(\.lm-dropdown, \.lm-dropdown \*\)/);
});

test("A3 — the logo never meets the controls: the mark is left-aligned below lg and the wide tools hide on a phone with enough specificity", () => {
  const css = read("app/lumiere/chrome.css");
  assert.match(css, /\.lm-site-header \.lm-site-header__wide \{ display: none; \}/);
  assert.match(css, /@media \(max-width: 1023\.98px\) \{\s*\.lm-site-header__bar \{ grid-template-columns: auto minmax\(0, 1fr\); \}/);
});

test("A4 — navigation speaks the site's colour language through dedicated tokens, without reverting the global gold", () => {
  const nav = read("app/lumiere/nav.css");
  for (const [token, hex] of [["--nav-ink", "#1c1c1c"], ["--nav-gold", "#c9a227"], ["--nav-gold-text", "#8a6b12"], ["--nav-gold-deep", "#6f5510"]]) {
    assert.match(nav, new RegExp(`${token}: ${hex};`), token);
  }
  const cfg = read("tailwind.config.ts");
  assert.match(cfg, /gold: \{ DEFAULT: "#a39d94", pale: "#d9d3ca", dark: "#2a2724", deep: "#000000" \}/, "the P4 gold retarget stands");
  assert.match(cfg, /"nav-gold": "#C9A227"/);
  assert.ok(!/orange/i.test(nav.replace(/\/\*[\s\S]*?\*\//g, "")), "never orange in navigation");
  // every navigation surface is covered
  for (const sel of [".lm-site-header__nav a", ".lm-dropdown", ".lm-menu nav a", ".lm-search__eyebrow", ".lm-tab", ".footer--cha .footer__column-title", ".lm-side__link", ".lm-chip"]) {
    assert.ok(nav.includes(sel), sel);
  }
  // small gold text on bone uses the deep gold (#8a6b12 is 4.42:1 there)
  assert.match(nav, /\.lm-nav-eyebrow,[\s\S]*?\{ color: var\(--nav-gold-deep\)/);
  // the account list marks the current page
  const shell = read("components/account/account-shell.tsx");
  assert.match(shell, /aria-current=\{on \? "page" : undefined\}/);
  assert.match(shell, /lm-side__link/);
  assert.match(read("components/site/mobile-tab-bar.tsx"), /className="lm-tab /);
});

test("D — the certificate envelope stays hidden and claims nothing without Hub data", async () => {
  const { certificateOf } = await import("../lib/certificate.ts");
  assert.equal(certificateOf({ slug: "x" }), null);
  assert.equal(certificateOf({ slug: "x", certificate: { kind: " " } }), null);
  assert.equal(certificateOf({ slug: "x", certificate: { kind: "GIA", number: "123" } }).number, "123");
  assert.match(read("docs/tasks/lumiere-p4b-certificate-hub-contract-proposal.md"), /DRAFT for the owner to decide with Lovable/);
});

test("the page head and sections exist for every recomposed page", () => {
  const head = read("components/lumiere/page/page-head.tsx");
  assert.match(head, /<h1 className="lm-h1"><Reveal>\{title\}<\/Reveal><\/h1>/, "one h1, through Reveal");
  assert.match(read("app/globals.css"), /@import "\.\/lumiere\/inner\.css";/);
});

test("A2 (correction) — the account navigation cannot leave the screen: a grid at lg, wrapped chips below it, long data wraps, no stale Lenis class", () => {
  const css = read("app/lumiere/inner-account.css");
  assert.match(css, /@media \(min-width: 1024px\) \{ \.iac-frame \{ grid-template-columns: 252px minmax\(0, 1fr\); \} \}/);
  assert.match(css, /\.iac-frame > \* \{ min-width: 0; \}/);
  assert.match(css, /\.iac-main :where\(dd, dt, td, th, p, li, h2, h3, a, span, label, summary\) \{ overflow-wrap: anywhere; \}/);
  assert.match(css, /\.iac-main :where\(\.cj-fig, \.cj-fig \*, \.font-mono\) \{ overflow-wrap: normal; white-space: nowrap; \}/, "a figure is never broken (P5)");
  const shell = read("components/account/account-shell.tsx");
  assert.match(shell, /className="iac-chips print-hide mb-5 flex flex-wrap gap-2 lg:hidden"/, "chips wrap — nothing scrolls out of sight");
  assert.ok(!/iac-chips[^"]*overflow-x-auto/.test(shell));
  assert.match(shell, /className="iac-side print-hide hidden lg:block"/);
  assert.match(read("components/lumiere/scroll-layout.tsx"), /const LENIS_CLASSES = \["lenis", "lenis-smooth", "lenis-scrolling", "lenis-stopped"/);
  assert.match(read("components/lumiere/scroll-layout.tsx"), /stripLenisClasses\(\);/);
  assert.match(read("scripts/check-account-nav.mjs"), /\[1440, 1\.1\], \[1440, 1\.25\], \[1440, 1\.5\]/, "the check covers browser zoom 110/125/150 % on a 1440 window");
});

test("evidence images stay out of the code history (owner, 2026-11-01)", () => {
  const ignore = read(".gitignore");
  for (const ext of ["jpg", "jpeg", "png", "webp", "gif"]) assert.ok(ignore.includes(`docs/tasks/lumiere-p*-evidence/**/*.${ext}`), ext);
});
