// Fails the build if forbidden gold terminology — or an unsourced origin claim —
// appears anywhere in source or content.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Country-branded gold as a purity claim. Banned everywhere, no exceptions.
const forbidden = [/\bjapan(?:ese)? gold\b/i, /\bsaudi gold\b/i, /\bitalian gold\b/i, /\bdubai gold\b/i, /\bhk gold\b/i, /\bchinese gold\b/i];

// An origin claim is DATA: it may be rendered only by OriginBadge, from the
// product's `origin` field. Hardcoded anywhere else it is an assertion about
// pieces nobody checked — branded and preloved items included.
const originClaims = [/\bmade in japan\b/i, /日本製/];
const originAllowed = new Set(["components/catalog/origin-badge.tsx"]);

const skip = new Set(["node_modules", ".next", ".git"]);
let hits = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?|mdx?|json|sql|css)$/.test(name) || name === "check-terminology.mjs" || name === "CLAUDE.md") continue;
    const rel = relative(process.cwd(), p).split("\\").join("/");
    const lines = readFileSync(p, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const re of forbidden) if (re.test(line)) { hits++; console.error(`${p}:${i + 1}: forbidden term -> ${line.trim()}`); }
      if (!originAllowed.has(rel)) {
        for (const re of originClaims) if (re.test(line)) { hits++; console.error(`${p}:${i + 1}: hardcoded origin claim (only OriginBadge may render this, from product data) -> ${line.trim()}`); }
      }
    });
  }
}
walk(process.cwd());
if (hits) { console.error(`\n${hits} problem(s). Describe purity as "K18 gold"; origin comes only from product data via OriginBadge.`); process.exit(1); }
console.log("Terminology check passed.");
