// Fails the build if a .tsx file outside the dictionary (lib/i18n*) and the
// content modules (lib/content/) contains CJK characters. Every user-facing
// string must come from lib/i18n or lib/content so the language toggle governs
// all of it; a Japanese literal in a component is a string that ignores it.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const cjk = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;
const skipDirs = new Set(["node_modules", ".next", ".git"]);
const allowed = (rel) => rel.startsWith("lib/i18n") || rel.startsWith("lib/content/");
let hits = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!name.endsWith(".tsx")) continue;
    const rel = relative(process.cwd(), p).replaceAll("\\", "/");
    if (allowed(rel)) continue;
    readFileSync(p, "utf8").split("\n").forEach((line, i) => {
      if (cjk.test(line)) { hits++; console.error(`${rel}:${i + 1}: CJK literal outside lib/i18n / lib/content -> ${line.trim().slice(0, 120)}`); }
    });
  }
}
walk(process.cwd());
if (hits) { console.error(`\n${hits} hardcoded string(s). Move them into lib/i18n.ts (UI) or lib/content/ (page copy) and read them by lang.`); process.exit(1); }
console.log("i18n check passed: no CJK literals outside lib/i18n and lib/content.");
