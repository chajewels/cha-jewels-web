// React #418 (SEO record; owner OD-F1): Next 15's bundled React 19.2 replays a
// suspended host element during hydration without rewinding the hydration
// cursor (react/react#37584, fixed in react-dom 19.3.0). The webpack loader
// scripts/react-hydration-replay-fix.cjs copies React 19.3's fix into the
// bundled react-dom client. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const fix = require("../scripts/react-hydration-replay-fix.cjs");
const root = process.cwd();
const FILES = ["react-dom", "react-dom-experimental"].flatMap((d) =>
  ["production", "development"].map((m) => join(root, "node_modules/next/dist/compiled", d, "cjs", `react-dom-client.${m}.js`)),
);

test("the fix lands exactly once in every bundled react-dom client, after the replay's hooks reset", () => {
  for (const f of FILES) {
    const out = fix.applyReplayFix(readFileSync(f, "utf8"), f);
    assert.equal(out.split(fix.MARKER).length - 1, 1, f);
    // Between `resetHooksOnUnwind(...)` of the replay's `case 5:` and its `default:`.
    assert.match(out, /case 5:\s*resetHooksOnUnwind\((?:next|unitOfWork)\); \/\* cha-jewels: react 19\.3 hydration replay fix \*\/ var cjReplayFiber = (?:next|unitOfWork); cjReplayFiber === hydrationParentFiber && \(isHydrating \? \(popToNextHostParent\(cjReplayFiber\), 5 === cjReplayFiber\.tag && null != cjReplayFiber\.stateNode && \(nextHydratableInstance = cjReplayFiber\.stateNode\)\) : \(popToNextHostParent\(cjReplayFiber\), \(isHydrating = !0\)\)\);\s*default:/, f);
    assert.doesNotThrow(() => new vm.Script(out, { filename: f }), f);
    assert.equal(fix.applyReplayFix(out, f), out, `${f}: idempotent`);
    assert.ok(fix.TARGET.test(f), `${f}: matched by the loader rule`);
  }
});

test("a React that already carries React 19.3's fix is returned unchanged", () => {
  const upstream = "switch (next.tag) { case 5:\n      resetHooksOnUnwind(next);\n      var fiber = next;\n      fiber === hydrationParentFiber &&\n        (isHydrating ? 1 : 2);\n    default: x(); }";
  assert.equal(fix.applyReplayFix(upstream), upstream);
});

test("an unknown React fails the build instead of silently shipping the bug", () => {
  assert.throws(() => fix.applyReplayFix("function replaySuspendedUnitOfWork(){ switch(x){ case 5: other(); default: y(); } }"), /expected exactly one replay/);
  const twice = "case 5: resetHooksOnUnwind(next); default: a; case 5: resetHooksOnUnwind(next); default: b; hydrationParentFiber isHydrating nextHydratableInstance popToNextHostParent";
  assert.throws(() => fix.applyReplayFix(twice), /found 2/);
  assert.throws(() => fix.applyReplayFix("case 5: resetHooksOnUnwind(next); default: a;"), /has no popToNextHostParent/);
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
