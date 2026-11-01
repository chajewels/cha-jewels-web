// THE PLACEHOLDER GUARD (docs/tasks/lumiere-p0-report.md §9; owner decision
// 2026-10-31, docs/tasks/lumiere-redesign.md §4).
//
// The Lumière redesign ships with the reference's photographs, 3D models and
// featured names as INTERIM content, every one registered in
// lib/lumiere/placeholders.ts and stored under public/lumiere/placeholder/**.
// None of it may reach the live site. This script finds every reference:
//
//   - an import of lib/lumiere/placeholders (every specifier is resolved
//     relative to its file: `./placeholders`, `../lumiere/placeholders.ts`,
//     the `@/` alias, dynamic import(), require(), re-exports),
//   - the literal path `/lumiere/placeholder/` in source or in a public file,
//   - and, in strict mode, the placeholder directory itself still holding files
//
// in app/, components/, lib/ and public/ (ts, tsx, js, mjs, css, json, svg).
// The registry's own file is exempt — it is the one place the path lives.
//
// LENIENT by default: count and pass (previews, redesign/** PRs). STRICT when
// VERCEL_ENV is "production" or `--strict` is passed (CI on a PR whose base is
// develop or main, D-17; `prebuild` on a production build): any reference, or
// any file left in the placeholder directory, fails.
//
// Self-tests first (MUST_CATCH / MUST_PASS, as scripts/check-money.mjs): a
// pattern edited into uselessness fails here instead of passing silently.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOTS = ["app", "components", "lib", "public"];
const PLACEHOLDER_DIR = "public/lumiere/placeholder";
const EXEMPT = new Set(["lib/lumiere/placeholders.ts"]);
const EXT = /\.(ts|tsx|js|mjs|css|json|svg)$/;

const REGISTRY = "lib/lumiere/placeholders";
// Every module specifier a line can carry: static import/export … from "x",
// bare import "x", dynamic import("x"), require("x"). Resolved below relative
// to the importing file (or the `@/` alias = repo root), extension dropped,
// and compared with the registry's path — so `./placeholders` from inside
// lib/lumiere, `../lumiere/placeholders.ts` or `@/lib/lumiere/placeholders`
// are all the same reference. A template-literal dynamic import that names
// the registry is a hit outright.
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)["']([^"'\n]+)["']/g;
const TEMPLATE_IMPORT = /\bimport\s*\(\s*`[^`]*placeholders[^`]*`/;
const resolvesToRegistry = (spec, fromRel) => {
  if (!spec.startsWith(".") && !spec.startsWith("@/")) return false;
  const base = spec.startsWith("@/") ? spec.slice(2) : join(dirname(fromRel), spec);
  const norm = relative(".", resolve(base)).split("\\").join("/").replace(/\.(?:ts|tsx|js|mjs)$/, "");
  return norm === REGISTRY;
};
const importsRegistry = (line, fromRel) => {
  if (TEMPLATE_IMPORT.test(line)) return true;
  for (const m of line.matchAll(SPECIFIER)) if (resolvesToRegistry(m[1], fromRel)) return true;
  return false;
};
const RULES = [
  { name: "imports the placeholder registry", test: (line, rel) => importsRegistry(line, rel) },
  { name: "names a placeholder asset path", test: (line) => /\/lumiere\/placeholder\//.test(line) },
];

// [line, path of the file the line is in]
const MUST_CATCH = [
  ['import { HERO_CARDS } from "@/lib/lumiere/placeholders";', "components/lumiere/hero/x.tsx"],
  ["import { FEATURED_PIECES } from '../../lib/lumiere/placeholders';", "components/lumiere/featured.tsx"],
  ["import { FEATURED_PIECES } from '../../../lib/lumiere/placeholders';", "components/lumiere/featured/x.tsx"],
  ['import { PENDANT } from "./placeholders";', "lib/lumiere/home-content.ts"],
  ['export { FEATURED_PIECES } from "../lumiere/placeholders.ts";', "lib/content/x.ts"],
  ['const mod = await import("@/lib/lumiere/placeholders");', "app/page.tsx"],
  ['const mod = await import(`@/lib/lumiere/${"placeholders"}`);', "app/page.tsx"],
  ['const r = require("../../lib/lumiere/placeholders.js");', "components/a/b.tsx"],
  ['src="/lumiere/placeholder/hero/card-08.webp"', "components/x.tsx"],
  ["url('/lumiere/placeholder/philosophy/backdrop-frame.jpg')", "app/lumiere/x.css"],
  ['const PENDANT_URL = "/lumiere/placeholder/models/pendant-emerald.glb";', "lib/x.ts"],
];
const MUST_PASS = [
  ['import { paperTexture } from "@/lib/lumiere/shared";', "components/x.tsx"],
  ['src="/lumiere/shared/paper.webp"', "components/x.tsx"],
  ['src="/lumiere/shared/env/hotel-room.exr"', "lib/scene/x.ts"],
  ['import { lenisAllowed } from "@/lib/lumiere/lenis-paths";', "components/x.tsx"],
  ['import { useScroll } from "./scroll-store";', "lib/lumiere/scroll-to.ts"],
  ['import placeholders from "@/lib/content/placeholders";', "components/x.tsx"],
];

const strict = process.argv.includes("--strict") || process.env.VERCEL_ENV === "production";
let failed = 0;
const fail = (msg) => { failed++; console.error(`✗ ${msg}`); };
const hits = (line, rel) => RULES.filter((r) => r.test(line, rel));

for (const [s, rel] of MUST_CATCH) if (!hits(s, rel).length) fail(`check-placeholders no longer catches (${rel}): ${s}`);
for (const [s, rel] of MUST_PASS) for (const r of hits(s, rel)) fail(`check-placeholders wrongly flags (${r.name}, ${rel}): ${s}`);
if (failed) { console.error(`\ncheck:placeholders self-test failed (${failed}).`); process.exit(1); }

// Comments are blanked (newlines kept) before matching — prose about the
// registry is not a reference to it.
const stripComments = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/^\s*\/\/.*$/gm, "");

const files = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== "node_modules" && name !== ".next") walk(p); }
    else if (EXT.test(name)) files.push(p);
  }
};
for (const r of ROOTS) walk(r);

const references = [];
let scanned = 0;
for (const file of files) {
  const rel = relative(".", file).split("\\").join("/");
  if (EXEMPT.has(rel) || rel.startsWith(`${PLACEHOLDER_DIR}/`)) continue;
  scanned++;
  stripComments(readFileSync(file, "utf8")).split("\n").forEach((line, i) => {
    for (const r of hits(line, rel)) references.push({ rel, line: i + 1, rule: r.name, text: line.trim() });
  });
}

const assets = [];
const walkAssets = (dir) => {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkAssets(p);
    else assets.push(relative(".", p));
  }
};
walkAssets(PLACEHOLDER_DIR);


// WHICH PLACEHOLDERS REMAIN, AND WHY (P5, owner 2026-11-01: "must report exactly which placeholders remain and why").
// Every file under public/lumiere/placeholder/ belongs to exactly ONE row below; a file that matches none fails the
// check, so this table cannot drift from the directory. `hub` = a Hub source is wired and the placeholder is only the
// fallback while the Hub has nothing (lib/lumiere/home-hub.ts); `none` = the Hub has no source today and one is only
// DRAFTED (docs/tasks/lumiere-hub-slots.md) — nothing is invented.
const MANIFEST = [
  { re: /^hero\/card-0[1-7]\.webp$/, slot: "hero card ring, cards 1–7", status: "hub", why: "real pieces from the Hub's hero deck (lib/hero-deck.ts); the placeholder shows only while the Hub returns fewer than seven available pieces" },
  { re: /^hero\/card-08\.webp$/, slot: "hero frame-3 photograph (a hand wearing a ring)", status: "none", why: "no Hub field for a hero lifestyle photograph" },
  { re: /^hero\/pendant-emerald(-compact)?\.webp$/, slot: "hero pendant poster", status: "none", why: "no Hub source for the hero pendant (3D model) or its poster" },
  { re: /^models\/pendant-emerald\.glb$/, slot: "hero pendant 3D model", status: "none", why: "no Hub source for 3D models" },
  { re: /^collections\/(rings|necklaces|earrings|bracelets)\.webp$/, slot: "collections cards (and the four why-panel photographs)", status: "hub", why: "collections cards take the Hub category photograph (hero_media) when it has one; the four why/value panels have no Hub source and still draw these" },
  { re: /^featured\/photo-ring-0[1-5]\.webp$/, slot: "featured left-panel photographs", status: "hub", why: "the Hub's featured pieces (name, price, metals, photograph, Add to cart); the placeholder shows only for a slot the Hub cannot fill" },
  { re: /^featured\/ring-0[1-5]\.webp$/, slot: "featured ring posters (the right stage)", status: "none", why: "no Hub source for the 3D ring posters" },
  { re: /^models\/rings\/ring-0[1-5]\.glb$/, slot: "featured ring 3D models", status: "none", why: "no Hub source for 3D models" },
  { re: /^philosophy\//, slot: "philosophy backdrop plates and the hand photograph", status: "none", why: "no Hub source for editorial photographs" },
];
const manifestRows = () => {
  const rows = MANIFEST.map((m) => ({ ...m, files: [] }));
  const orphans = [];
  for (const a of assets) {
    const rel = a.slice(PLACEHOLDER_DIR.length + 1);
    const row = rows.find((r) => r.re.test(rel));
    if (row) row.files.push(rel); else orphans.push(rel);
  }
  return { rows, orphans };
};
const printManifest = () => {
  const { rows, orphans } = manifestRows();
  console.log("\nPlaceholders that remain, and why (docs/tasks/lumiere-hub-slots.md):");
  for (const r of rows) if (r.files.length) console.log(`  [${r.status === "hub" ? "fallback of a Hub slot" : "NO Hub source"}] ${r.slot} — ${r.files.length} file(s): ${r.why}`);
  const hub = rows.filter((r) => r.status === "hub").reduce((n, r) => n + r.files.length, 0);
  const none = rows.filter((r) => r.status === "none").reduce((n, r) => n + r.files.length, 0);
  console.log(`  total ${assets.length}: ${hub} are fallbacks of slots the Hub fills, ${none} have no Hub source today${orphans.length ? `, ${orphans.length} UNCLASSIFIED` : ""}.`);
  return orphans;
};

const referencedFiles = new Set(references.map((r) => r.rel));
const summary = `${references.length} reference(s) in ${referencedFiles.size} file(s), ${assets.length} placeholder asset(s) under ${PLACEHOLDER_DIR}/ (${scanned} files scanned)`;

if (strict) {
  for (const r of references) fail(`${r.rel}:${r.line} — ${r.rule}\n    ${r.text}\n    Lumière placeholder content may not ship to production (lib/lumiere/placeholders.ts; report §9).`);
  if (assets.length) fail(`${PLACEHOLDER_DIR}/ still holds ${assets.length} file(s), e.g. ${assets.slice(0, 3).join(", ")} — delete the directory with the last placeholder.`);
  if (failed) {
    printManifest();
    console.error(`\ncheck:placeholders FAILED (strict: ${process.env.VERCEL_ENV === "production" ? "VERCEL_ENV=production" : "--strict"}) — ${summary}.`);
    process.exit(1);
  }
  console.log(`check:placeholders OK (strict) — no placeholder reference and no placeholder asset (${MUST_CATCH.length} regressions caught).`);
} else {
  const orphans = printManifest();
  if (orphans.length) { console.error(`\ncheck:placeholders FAILED — ${orphans.length} placeholder file(s) are not in the manifest (scripts/check-placeholders.mjs MANIFEST): ${orphans.slice(0, 4).join(", ")}`); process.exit(1); }
  console.log(`\ncheck:placeholders OK (lenient) — ${summary}; strict on VERCEL_ENV=production or --strict (${MUST_CATCH.length} regressions caught, ${MUST_PASS.length} innocents passed).`);
}
