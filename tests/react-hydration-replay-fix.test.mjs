// React #418 (SEO record; owner OD-F1): Next 15's bundled React 19.2 replays a
// suspended host element during hydration without rewinding the hydration
// cursor (react/react#37584, fixed in react-dom 19.3.0). The webpack loader
// scripts/react-hydration-replay-fix.cjs copies React 19.3's fix into the
// bundled react-dom client. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const fix = require("../scripts/react-hydration-replay-fix.cjs");
const root = process.cwd();
// The four bundled client files the loader targets (production + development, react-dom + react-dom-experimental).
const FILES = ["react-dom", "react-dom-experimental"].flatMap((d) =>
  ["production", "development"].map((m) => join(root, "node_modules/next/dist/compiled", d, "cjs", `react-dom-client.${m}.js`)),
);
const HELPERS_PRESENT = " function popToNextHostParent(){} var hydrationParentFiber, isHydrating, nextHydratableInstance; ";
// React 19.3.1's own block, verbatim (cjs/react-dom-client.production.js uses `next`, .development.js `unitOfWork`).
const upstream193 = (f) =>
  `switch (${f}.tag) { case 5:\n      resetHooksOnUnwind(${f});\n      var fiber = ${f};\n      fiber === hydrationParentFiber &&\n        (isHydrating\n          ? (popToNextHostParent(fiber),\n            5 === fiber.tag &&\n              null != fiber.stateNode &&\n              (nextHydratableInstance = fiber.stateNode))\n          : (popToNextHostParent(fiber), (isHydrating = !0)));\n    default: x(); }${HELPERS_PRESENT}`;
const unpatched = (f) => `switch (${f}.tag) { case 5: resetHooksOnUnwind(${f}); default: x(); }${HELPERS_PRESENT}`;

test("the fix lands exactly once in every bundled react-dom client (4 files), after the replay's hooks reset", () => {
  assert.equal(FILES.length, 4);
  for (const f of FILES) {
    const src = readFileSync(f, "utf8");
    assert.deepEqual({ ...fix.inspect(src), helpers: [] }, { anchors: 1, ours: 0, upstream: 0, fragments: 0, markers: 0, helpers: [] }, `${f}: unpatched shape`);
    const out = fix.applyReplayFix(src, f);
    assert.deepEqual(fix.inspect(out), { anchors: 0, ours: 1, upstream: 0, fragments: 1, markers: 1, helpers: [] }, `${f}: patched shape`);
    // Between `resetHooksOnUnwind(...)` of the replay's `case 5:` and its `default:`.
    assert.match(out, /case 5:\s*resetHooksOnUnwind\((?:next|unitOfWork)\); \/\* cha-jewels: react 19\.3 hydration replay fix \*\/ var cjReplayFiber = (?:next|unitOfWork); cjReplayFiber === hydrationParentFiber && \(isHydrating \? \(popToNextHostParent\(cjReplayFiber\), 5 === cjReplayFiber\.tag && null != cjReplayFiber\.stateNode && \(nextHydratableInstance = cjReplayFiber\.stateNode\)\) : \(popToNextHostParent\(cjReplayFiber\), \(isHydrating = !0\)\)\);\s*default:/, f);
    assert.doesNotThrow(() => new vm.Script(out, { filename: f }), f);
    assert.equal(fix.applyReplayFix(out, f), out, `${f}: idempotent`);
    assert.ok(fix.TARGET.test(f), `${f}: matched by the loader rule`);
  }
});

test("REMOVAL CRITERION: the bundled React does not yet carry React 19.3's fix; when it does, remove the loader", () => {
  for (const f of FILES) {
    const s = fix.inspect(readFileSync(f, "utf8"));
    assert.equal(
      s.upstream,
      0,
      `${f} already contains React's own replay fix: Next now bundles react-dom 19.3+. Remove the webpack rule in next.config.ts, scripts/react-hydration-replay-fix.cjs and this test (docs/security/SECURITY-HARDENING-2026-10-31.md, W-12).`,
    );
  }
});

test("a React that already carries React 19.3's COMPLETE fix is returned unchanged, in both file shapes", () => {
  for (const f of ["next", "unitOfWork"]) {
    const src = upstream193(f);
    assert.equal(fix.applyReplayFix(src), src, f);
    assert.deepEqual(fix.inspect(src), { anchors: 0, ours: 0, upstream: 1, fragments: 1, markers: 0, helpers: [] }, f);
  }
});

test("marker-only, partial and duplicate structures fail the build instead of being trusted", () => {
  // Marker without the code.
  assert.throws(() => fix.applyReplayFix(`switch (next.tag) { case 5: resetHooksOnUnwind(next); ${fix.MARKER} default: x(); }${HELPERS_PRESENT}`), /marker-only or partial/);
  // The head of React's fix without its tail (what the previous version of this loader accepted).
  assert.throws(() => fix.applyReplayFix(`switch (next.tag) { case 5: resetHooksOnUnwind(next); var fiber = next; fiber === hydrationParentFiber && (isHydrating ? 1 : 2); default: x(); }${HELPERS_PRESENT}`), /partial/);
  // Our block with its tail cut off.
  const ours = fix.applyReplayFix(unpatched("next"));
  assert.throws(() => fix.applyReplayFix(ours.replace("(isHydrating = !0)));", "")), /marker-only or partial/);
  // A fragment elsewhere plus an unpatched anchor.
  assert.throws(() => fix.applyReplayFix(`${unpatched("next")} function other(){ return a === hydrationParentFiber && (isHydrating ? 1 : 2); }`), /fragment/);
  // Two complete structures (ours twice; React's twice; one of each).
  assert.throws(() => fix.applyReplayFix(ours + ours), /duplicate/);
  assert.throws(() => fix.applyReplayFix(upstream193("next") + upstream193("next")), /duplicate/);
  assert.throws(() => fix.applyReplayFix(ours + upstream193("next")), /duplicate/);
  // A complete structure next to a still-unpatched anchor.
  assert.throws(() => fix.applyReplayFix(ours + unpatched("next")), /mixed or partial/);
});

test("an unknown React fails the build instead of silently shipping the bug", () => {
  assert.throws(() => fix.applyReplayFix("function replaySuspendedUnitOfWork(){ switch(x){ case 5: other(); default: y(); } }"), /expected exactly one replay/);
  assert.throws(() => fix.applyReplayFix(`${unpatched("next")}${unpatched("next")}`), /found 2/);
  assert.throws(() => fix.applyReplayFix("case 5: resetHooksOnUnwind(next); default: a;"), /has no popToNextHostParent/);
});

test("the trace names every processed file and its outcome (build evidence)", () => {
  const file = join(mkdtempSync(join(tmpdir(), "replay-fix-")), "trace.log");
  const alreadyPatched = fix.applyReplayFix(unpatched("next"));
  const prev = process.env.REACT_REPLAY_FIX_TRACE;
  process.env.REACT_REPLAY_FIX_TRACE = file;
  try {
    const loader = fix;
    loader.call({ resourcePath: "/x/react-dom-client.production.js" }, unpatched("next"));
    loader.call({ resourcePath: "/x/react-dom-client.development.js" }, upstream193("unitOfWork"));
    loader.call({ resourcePath: "/x/again.js" }, alreadyPatched);
  } finally {
    if (prev === undefined) delete process.env.REACT_REPLAY_FIX_TRACE;
    else process.env.REACT_REPLAY_FIX_TRACE = prev;
  }
  assert.equal(
    readFileSync(file, "utf8"),
    "[react-hydration-replay-fix] applied: /x/react-dom-client.production.js\n[react-hydration-replay-fix] unchanged (React's own fix present): /x/react-dom-client.development.js\n[react-hydration-replay-fix] unchanged (already patched): /x/again.js\n",
  );
});

test("next.config.ts attaches the loader to exactly the bundled react-dom client files", () => {
  const cfg = readFileSync(join(root, "next.config.ts"), "utf8");
  assert.match(cfg, /webpackConfig\.module\.rules\.push\(\{/);
  assert.match(cfg, /loader: path\.join\(__dirname, "scripts\/react-hydration-replay-fix\.cjs"\)/);
  const m = cfg.match(/test: (\/\[\\\\\/\]next\[[^\n]*\.js\$\/),/);
  assert.ok(m, "rule test regex present");
  const rule = eval(m[1]);
  for (const f of FILES) assert.ok(rule.test(f), f);
  assert.equal(rule.test("/x/node_modules/next/dist/compiled/react-dom/cjs/react-dom-server.node.production.js"), false);
  assert.equal(rule.test("/x/node_modules/react-dom/cjs/react-dom-client.production.js"), false);
});
