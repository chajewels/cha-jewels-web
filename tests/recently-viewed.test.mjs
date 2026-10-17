// RECENTLY VIEWED (owner 2026-10-17): the slugs-only list in localStorage
// (lib/recently-viewed.ts). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { VIEWED_KEY, VIEWED_MAX, readViewed, recordViewed } = await import("@/lib/recently-viewed");

function memory(init) {
  const m = new Map(init ? [[VIEWED_KEY, init]] : []);
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, String(v)); }, raw: () => m.get(VIEWED_KEY) };
}

test("empty, missing or garbage reads as []", () => {
  assert.deepEqual(readViewed(memory()), []);
  assert.deepEqual(readViewed(null), []);
  for (const bad of ["x", "null", "[]", '{"v":2,"slugs":["a"]}', '{"v":1}', '{"v":1,"slugs":"a"}', '{"v":1,"slugs":[1]}', '{"v":1,"slugs":["../x"]}', '{"v":1,"slugs":[""]}']) {
    assert.deepEqual(readViewed(memory(bad)), [], bad);
  }
});

test("recordViewed: most recent first, no duplicates", () => {
  const s = memory();
  recordViewed(s, "a"); recordViewed(s, "b"); recordViewed(s, "c");
  assert.deepEqual(readViewed(s), ["c", "b", "a"]);
  recordViewed(s, "a");
  assert.deepEqual(readViewed(s), ["a", "c", "b"]);
  assert.deepEqual(JSON.parse(s.raw()), { v: 1, slugs: ["a", "c", "b"] }, "slugs only, nothing else stored");
});

test("recordViewed caps the list at 12", () => {
  const s = memory();
  for (let i = 0; i < 20; i++) recordViewed(s, `p-${i}`);
  const list = readViewed(s);
  assert.equal(VIEWED_MAX, 12);
  assert.equal(list.length, 12);
  assert.equal(list[0], "p-19");
  assert.equal(list[11], "p-8");
});

test("a storage that throws never throws", () => {
  const boom = { getItem: () => { throw new Error("SecurityError"); }, setItem: () => { throw new Error("QuotaExceededError"); } };
  assert.deepEqual(readViewed(boom), []);
  assert.doesNotThrow(() => recordViewed(boom, "a"));
  const full = { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); } };
  assert.deepEqual(recordViewed(full, "a"), ["a"]);
});

test("an invalid slug is not recorded", () => {
  const s = memory();
  recordViewed(s, "ok-1"); recordViewed(s, "a/b"); recordViewed(s, "");
  assert.deepEqual(readViewed(s), ["ok-1"]);
});
