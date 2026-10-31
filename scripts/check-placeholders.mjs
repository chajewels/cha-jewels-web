// THE PLACEHOLDER GUARD (docs/tasks/lumiere-p0-report.md §9; owner decision
// 2026-10-31, docs/tasks/lumiere-redesign.md §4).
//
// The Lumière redesign ships with the reference's photographs, 3D models and
// featured names as INTERIM content, every one registered in
// lib/lumiere/placeholders.ts and stored under public/lumiere/placeholder/**.
// None of it may reach the live site. This script finds every reference:
//
//   - an import of lib/lumiere/placeholders (by path or by the `@/` alias),
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
import { join, relative } from "node:path";

const ROOTS = ["app", "components", "lib", "public"];
const PLACEHOLDER_DIR = "public/lumiere/placeholder";
const EXEMPT = new Set(["lib/lumiere/placeholders.ts"]);
const EXT = /\.(ts|tsx|js|mjs|css|json|svg)$/;

const RULES = [
  { name: "imports the placeholder registry", re: /from\s+["'](?:@\/|\.{1,2}\/(?:\.\.\/)*)lib\/lumiere\/placeholders["']|import\(\s*["'](?:@\/|\.{1,2}\/(?:\.\.\/)*)lib\/lumiere\/placeholders["']\s*\)|require\(\s*["'][^"']*lib\/lumiere\/placeholders["']\s*\)/ },
  { name: "names a placeholder asset path", re: /\/lumiere\/placeholder\// },
];

const MUST_CATCH = [
  'import { HERO_CARDS } from "@/lib/lumiere/placeholders";',
  "import { FEATURED_PIECES } from '../../lib/lumiere/placeholders';",
  'const mod = await import("@/lib/lumiere/placeholders");',
  'src="/lumiere/placeholder/hero/card-08.webp"',
  "url('/lumiere/placeholder/philosophy/backdrop-frame.jpg')",
  'const PENDANT_URL = "/lumiere/placeholder/models/pendant-emerald.glb";',
];
const MUST_PASS = [
  'import { paperTexture } from "@/lib/lumiere/shared";',
  'src="/lumiere/shared/paper.webp"',
  'src="/lumiere/shared/env/hotel-room.exr"',
  'import { lenisAllowed } from "@/lib/lumiere/lenis-paths";',
  "// placeholders are registered in lib/lumiere/placeholders.ts (prose, no import)",
  'const PLACEHOLDER_ROOT = "/lumiere/placeholder/"; // only in the registry, which is exempt',
];

const strict = process.argv.includes("--strict") || process.env.VERCEL_ENV === "production";
let failed = 0;
const fail = (msg) => { failed++; console.error(`✗ ${msg}`); };
const hits = (line) => RULES.filter((r) => r.re.test(line));

for (const s of MUST_CATCH) if (!hits(s).length) fail(`check-placeholders no longer catches: ${s}`);
// MUST_PASS lines that are prose or the registry's own constant are allowed to
// match the path rule only when they would be exempt or comments; the first
// four must match nothing at all.
for (const s of MUST_PASS.slice(0, 4)) for (const r of hits(s)) fail(`check-placeholders wrongly flags (${r.name}): ${s}`);
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
    for (const r of hits(line)) references.push({ rel, line: i + 1, rule: r.name, text: line.trim() });
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
  console.log(`check:placeholders OK (lenient) — ${summary}; strict on VERCEL_ENV=production or --strict (${MUST_CATCH.length} regressions caught, ${MUST_PASS.length} innocents passed).`);
}
