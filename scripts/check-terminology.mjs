// Fails the build if forbidden gold terminology appears anywhere in source or content.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const forbidden = [/\bjapan(?:ese)? gold\b/i, /\bsaudi gold\b/i, /\bitalian gold\b/i, /\bdubai gold\b/i, /\bhk gold\b/i, /\bchinese gold\b/i];
const skip = new Set(["node_modules", ".next", ".git"]);
let hits = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?|mdx?|json|sql|css)$/.test(name) || name === "check-terminology.mjs" || name === "CLAUDE.md") continue;
    const lines = readFileSync(p, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const re of forbidden) if (re.test(line)) { hits++; console.error(`${p}:${i + 1}: forbidden term -> ${line.trim()}`); }
    });
  }
}
walk(process.cwd());
if (hits) { console.error(`\n${hits} forbidden term(s). Use "K18 gold, Made in Japan".`); process.exit(1); }
console.log("Terminology check passed.");
