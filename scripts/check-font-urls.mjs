// After `next build`: the URLs lib/lumiere/font-urls.ts preloads on the home
// must be the ones the built stylesheet's @font-face rules declare for the
// Lumière faces. A renamed or re-encoded font file would otherwise preload a
// 404 and fetch the real face late — silently, on every home visit.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync("lib/lumiere/font-urls.ts", "utf8");
const hashes = [...src.matchAll(/hash: "([0-9a-f]{16})"/g)].map((m) => m[1]);
if (hashes.length !== 4) { console.error(`check-font-urls: expected 4 hashes in lib/lumiere/font-urls.ts, found ${hashes.length}`); process.exit(1); }

const cssDir = ".next/static/css";
if (!existsSync(cssDir)) { console.error("check-font-urls: no .next/static/css — run `next build` first"); process.exit(1); }
const css = readdirSync(cssDir).filter((f) => f.endsWith(".css")).map((f) => readFileSync(join(cssDir, f), "utf8")).join("\n");
const declared = new Set([...css.matchAll(/url\(\/_next\/static\/media\/([0-9a-f]{16})\.woff2\)/g)].map((m) => m[1]));

let failed = 0;
for (const h of hashes) {
  const file = join(".next/static/media", `${h}.woff2`);
  if (!declared.has(h)) { failed++; console.error(`✗ /_next/static/media/${h}.woff2 is preloaded but no built @font-face declares it`); }
  else if (!existsSync(file)) { failed++; console.error(`✗ ${file} is declared but was not emitted`); }
  else console.log(`✓ ${h}.woff2 declared and emitted`);
}
if (failed) process.exit(1);
console.log("check:fonts OK — the home's preloaded font URLs match the build.");
