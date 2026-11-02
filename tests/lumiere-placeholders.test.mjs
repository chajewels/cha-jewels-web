// Lumière P5b — the release lock (owner decision 5, 2026-11-02): no placeholder registry, no placeholder file and no
// reference to either remains; check:placeholders passes in BOTH modes, and its self-test still catches every old shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const node = (args, env = {}) =>
  spawnSync(process.execPath, args, { encoding: "utf8", env: { ...process.env, VERCEL_ENV: "", ...env } });

test("the registry module and the placeholder directory are gone", () => {
  assert.equal(existsSync("lib/lumiere/placeholders.ts"), false);
  assert.equal(existsSync("public/lumiere/placeholder"), false);
  assert.equal(existsSync("lib/scene/pendant/pendant-assets.ts"), false);
});

test("check:placeholders passes lenient, strict and as VERCEL_ENV=production", () => {
  const lenient = node(["scripts/check-placeholders.mjs"]);
  assert.equal(lenient.status, 0, lenient.stderr);
  assert.match(lenient.stdout, /OK \(lenient\)/);
  const strict = node(["scripts/check-placeholders.mjs", "--strict"]);
  assert.equal(strict.status, 0, strict.stderr);
  assert.match(strict.stdout, /OK \(strict\)/);
  const prod = node(["scripts/check-placeholders.mjs"], { VERCEL_ENV: "production" });
  assert.equal(prod.status, 0, prod.stderr);
});

test("every Cha original the home draws exists under public/images (lib/lumiere/home-media.ts)", () => {
  const src = readFileSync("lib/lumiere/home-media.ts", "utf8");
  const files = [...src.matchAll(/"(\/images\/[^"]+\.webp)"/g)].map((m) => m[1]);
  assert.ok(files.length >= 12, "the registry names its files");
  for (const f of files) assert.ok(existsSync(`public${f}`), `missing ${f}`);
});
