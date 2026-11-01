// Lumière P1 — the shared scroll lock (lib/scroll-lock.ts) that the five
// dialogs use instead of writing body.style.overflow by hand: it locks the
// body, stops the Lenis store, counts nested locks and restores what it found.
import { test } from "node:test";
import assert from "node:assert/strict";

// A minimal document for the lock to write to.
const style = () => ({ overflow: "" });
globalThis.document = { body: { style: style() }, documentElement: { style: style() } };

const { lockScroll, scrollLockDepth } = await import("@/lib/scroll-lock");
const { useScroll } = await import("@/lib/lumiere/scroll-store");

test("one lock: body hidden and the scroll store stopped; release restores both", () => {
  document.body.style.overflow = "auto";
  assert.equal(useScroll.getState().isEnableScroll, true);
  const release = lockScroll();
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal(useScroll.getState().isEnableScroll, false);
  assert.equal(scrollLockDepth(), 1);
  release();
  assert.equal(document.body.style.overflow, "auto", "the value found is put back, not cleared");
  assert.equal(useScroll.getState().isEnableScroll, true);
  assert.equal(scrollLockDepth(), 0);
  document.body.style.overflow = "";
});

test("nested locks: the page stays locked until the last release; a release is idempotent", () => {
  const a = lockScroll();
  const b = lockScroll();
  assert.equal(scrollLockDepth(), 2);
  a();
  a(); // twice: no double decrement
  assert.equal(scrollLockDepth(), 1);
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal(useScroll.getState().isEnableScroll, false);
  b();
  assert.equal(scrollLockDepth(), 0);
  assert.equal(document.body.style.overflow, "");
  assert.equal(useScroll.getState().isEnableScroll, true);
});

test("React's development double-mount (lock → release → lock) leaves the page locked, then free", () => {
  const first = lockScroll();
  first();
  const second = lockScroll();
  assert.equal(document.body.style.overflow, "hidden");
  second();
  assert.equal(document.body.style.overflow, "");
});

test("P3: the release puts the page back where it was (the sticky-header focus jump) and tells Lenis", async () => {
  let scrolledTo = null;
  globalThis.window = { scrollY: 900, scrollTo: (opts) => { scrolledTo = opts; globalThis.window.scrollY = opts.top; } };
  const { useScroll } = await import("@/lib/lumiere/scroll-store");
  const lenisCalls = [];
  useScroll.getState().setLenis({ scrollTo: (y, o) => lenisCalls.push([y, o]), stop() {}, start() {} });
  const release = lockScroll();
  window.scrollY = 16; // the jump, while locked
  release();
  assert.deepEqual(scrolledTo, { top: 900, left: 0, behavior: "instant" });
  assert.deepEqual(lenisCalls, [[900, { immediate: true, force: true }]]);
  // Unmoved: nothing is written.
  scrolledTo = null; lenisCalls.length = 0;
  const release2 = lockScroll();
  release2();
  assert.equal(scrolledTo, null);
  assert.equal(lenisCalls.length, 0);
  useScroll.getState().setLenis(null);
  delete globalThis.window;
});
