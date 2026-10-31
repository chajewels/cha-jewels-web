// Lumière P1 — the placeholder guard (docs/tasks/lumiere-p0-report.md §9):
// the registry names every interim asset and every file exists; the runtime
// belt throws in a production build; the script is lenient by default and
// strict on VERCEL_ENV=production / --strict.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const node = (args, env = {}) =>
  spawnSync(process.execPath, args, { encoding: "utf8", env: { ...process.env, VERCEL_ENV: "", ...env } });

const importRegistry = (env) =>
  node(["--experimental-strip-types", "--no-warnings", "--import", "./tests/register-aliases.mjs", "-e", 'import("@/lib/lumiere/placeholders").then((m) => console.log(JSON.stringify({ n: m.ALL_PLACEHOLDER_ASSETS.length, root: m.PLACEHOLDER_ROOT })))'], env);

test("the registry lists every placeholder file, each flagged and each present under public/", async () => {
  const { ALL_PLACEHOLDER_ASSETS, HERO_CARDS, FEATURED_PIECES, PENDANT, COLLECTION_PHOTOS, PHILOSOPHY, PLACEHOLDER_ROOT, isPlaceholder } = await import("@/lib/lumiere/placeholders");
  assert.equal(PLACEHOLDER_ROOT, "/lumiere/placeholder/");
  assert.equal(HERO_CARDS.length, 8);
  assert.equal(FEATURED_PIECES.length, 5);
  assert.equal(Object.keys(COLLECTION_PHOTOS).length, 4);
  // 8 cards + pendant model + 2 posters + 4 collections + 5 × (model, poster, photo) + 3 philosophy = 33
  assert.equal(ALL_PLACEHOLDER_ASSETS.length, 33);
  for (const a of ALL_PLACEHOLDER_ASSETS) {
    assert.equal(a.placeholder, true, a.src);
    assert.ok(a.src.startsWith(PLACEHOLDER_ROOT), a.src);
    assert.ok(existsSync(join(process.cwd(), "public", a.src)), `missing file for ${a.src}`);
  }
  for (const p of FEATURED_PIECES) {
    assert.equal(p.price, "¥ —", "D-7: the placeholder price is never a figure");
    assert.ok(isPlaceholder(p));
  }
  assert.ok(isPlaceholder(PENDANT.model) && isPlaceholder(PHILOSOPHY.hand));
  assert.equal(isPlaceholder({ src: "/images/x.webp" }), false);
  // Nothing from the shared directory is registered as a placeholder.
  assert.ok(ALL_PLACEHOLDER_ASSETS.every((a) => !a.src.includes("/shared/")));
});

test("the runtime belt: importing the registry throws when VERCEL_ENV=production, and only then", () => {
  const prod = importRegistry({ VERCEL_ENV: "production" });
  assert.notEqual(prod.status, 0, "a production build must fail");
  assert.match(prod.stderr, /placeholder content is still referenced in a production build/);
  const preview = importRegistry({ VERCEL_ENV: "preview" });
  assert.equal(preview.status, 0, preview.stderr);
  assert.deepEqual(JSON.parse(preview.stdout.trim()), { n: 33, root: "/lumiere/placeholder/" });
});

test("check:placeholders is lenient by default and strict on --strict or VERCEL_ENV=production", () => {
  const lenient = node(["scripts/check-placeholders.mjs"]);
  assert.equal(lenient.status, 0, lenient.stderr);
  assert.match(lenient.stdout, /OK \(lenient\)/);
  assert.match(lenient.stdout, /33 placeholder asset\(s\)/);

  // Strict fails while the placeholder directory still holds files (and would
  // fail on any reference in app/, components/ or lib/).
  const strict = node(["scripts/check-placeholders.mjs", "--strict"]);
  assert.equal(strict.status, 1);
  assert.match(strict.stderr, /still holds 33 file\(s\)/);
  const prod = node(["scripts/check-placeholders.mjs"], { VERCEL_ENV: "production" });
  assert.equal(prod.status, 1);
  assert.match(prod.stderr, /VERCEL_ENV=production/);
});
