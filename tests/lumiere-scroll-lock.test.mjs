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
