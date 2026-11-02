// THE PLACEHOLDER GUARD (docs/tasks/lumiere-p0-report.md §9; owner decision
// 2026-10-31, docs/tasks/lumiere-redesign.md §4).
//
// The Lumière redesign shipped interim content (reference photographs, 3D models, featured names) registered in
// lib/lumiere/placeholders.ts under public/lumiere/placeholder/**. P5b replaced all of it with the Hub's data and Cha
// Jewels originals (lib/lumiere/home-media.ts) and deleted both; this script keeps them from coming back. It finds every reference:
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


// P5b (release lock): no placeholder remains — the registry, public/lumiere/placeholder/** and every reference are gone, and
// this guard keeps them gone. Any file that reappears under the directory fails in EVERY mode, not only strict.
const referencedFiles = new Set(references.map((r) => r.rel));
const summary = `${references.length} reference(s) in ${referencedFiles.size} file(s), ${assets.length} placeholder asset(s) under ${PLACEHOLDER_DIR}/ (${scanned} files scanned)`;

if (strict) {
  for (const r of references) fail(`${r.rel}:${r.line} — ${r.rule}\n    ${r.text}\n    Lumière placeholder content may not ship to production (lib/lumiere/placeholders.ts; report §9).`);
  if (assets.length) fail(`${PLACEHOLDER_DIR}/ still holds ${assets.length} file(s), e.g. ${assets.slice(0, 3).join(", ")} — delete the directory with the last placeholder.`);
  if (failed) {
    console.error(`\ncheck:placeholders FAILED (strict: ${process.env.VERCEL_ENV === "production" ? "VERCEL_ENV=production" : "--strict"}) — ${summary}.`);
    process.exit(1);
  }
  console.log(`check:placeholders OK (strict) — no placeholder reference and no placeholder asset (${MUST_CATCH.length} regressions caught).`);
} else {
  if (assets.length) { console.error(`\ncheck:placeholders FAILED — ${assets.length} file(s) under ${PLACEHOLDER_DIR}/ (none may remain): ${assets.slice(0, 4).join(", ")}`); process.exit(1); }
  console.log(`\ncheck:placeholders OK (lenient) — ${summary}; strict on VERCEL_ENV=production or --strict (${MUST_CATCH.length} regressions caught, ${MUST_PASS.length} innocents passed).`);
}
