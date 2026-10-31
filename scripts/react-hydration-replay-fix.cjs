/**
 * BACKPORT OF REACT 19.3's HYDRATION-REPLAY FIX into the React that Next 15
 * bundles (next/dist/compiled/react-dom*, 19.2.0-canary). A webpack loader,
 * wired in next.config.ts; it rewrites nothing else.
 *
 * The bug (react/react#37584, fixed by PR #35494 in react-dom 19.3.0; React
 * does not backport to 19.2): when a host element (a <div>) suspends while
 * React is reconciling its children during hydration — a child whose code or
 * data arrives a moment late — React later REPLAYS that element without
 * rewinding the hydration cursor. The element has already claimed its server
 * node and moved the cursor inside it, so the replay compares the element with
 * its own first child, reports a mismatch (minified error #418, "server
 * rendered HTML didn't match the client") and throws away the server HTML to
 * re-render the page on the client. Here: <div class="wrap"> in the site
 * header compared with the logo <a> inside it (development build, 2026-10-31),
 * intermittently, on any page — the SEO record's "React #418".
 *
 * The fix is React 19.3.0's own statement block (eight formatted lines
 * upstream), copied from its published
 * cjs/react-dom-client.*.js (replaySuspendedUnitOfWork / replayBeginWork,
 * `case 5:` after resetHooksOnUnwind): if the replayed fiber is the current
 * hydration parent, step back to its host parent and point the cursor at the
 * fiber's own node again. The helpers it uses (popToNextHostParent,
 * hydrationParentFiber, isHydrating, nextHydratableInstance) are identical in
 * 19.2 and 19.3.
 *
 * Safety (correction batch 2026-11-01): a file is returned unchanged ONLY when
 * it carries the COMPLETE fix structure exactly once — React's own (19.3+) or
 * this loader's — with no unpatched anchor left beside it. A marker without
 * the code, a partial structure (the head of the fix without its tail, or a
 * fragment elsewhere) or two structures FAIL the build; so does an unknown
 * React (anchor not found exactly once, or a helper missing). After applying,
 * the loader re-inspects its own output and fails if the result is not
 * exactly one complete structure. Never a silent no-op.
 *
 * Trace: with REACT_REPLAY_FIX_TRACE set, every file the loader processes is
 * reported (an absolute path = append to that file; anything else = stderr),
 * so a build can PROVE which bundled variants it rewrote.
 *
 * Removal criterion: tests/react-hydration-replay-fix.test.mjs FAILS once the
 * bundled React already carries React's fix (Next upgraded to a react-dom
 * 19.3+ bundle) — remove the webpack rule in next.config.ts, this file and that
 * test together (docs/security/SECURITY-HARDENING-2026-10-31.md, W-12).
 */
"use strict";

const fs = require("node:fs");

const MARKER = "/* cha-jewels: react 19.3 hydration replay fix */";
const OURS = "cjReplayFiber";
const FIBER = "(next|unitOfWork)";

// A whitespace-insensitive regex from a code template: every run of spaces in
// the template matches any whitespace (including none); @F@ is the replay's
// fiber variable (`next` in the production file, `unitOfWork` in development),
// captured once and back-referenced after.
function rx(template, flags = "g") {
  let first = true;
  const body = template
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s*")
    .replace(/@F@/g, () => (first ? ((first = false), FIBER) : "\\1"));
  return new RegExp(body, flags);
}

// The unpatched `case 5:` of the replay switch: resetHooksOnUnwind falls
// straight through to `default:`.
const ANCHOR = /(case 5:\s*resetHooksOnUnwind\((next|unitOfWork)\);)(\s*default:)/g;

// React 19.3.0 / 19.3.1, verbatim modulo whitespace (cjs/react-dom-client.{production,development}.js).
const UPSTREAM_COMPLETE = rx(
  "case 5: resetHooksOnUnwind(@F@); var fiber = @F@; fiber === hydrationParentFiber && (isHydrating ? (popToNextHostParent(fiber), 5 === fiber.tag && null != fiber.stateNode && (nextHydratableInstance = fiber.stateNode)) : (popToNextHostParent(fiber), (isHydrating = !0))); default:",
);
// The same block as this loader writes it.
const OURS_COMPLETE = rx(
  `case 5: resetHooksOnUnwind(@F@); ${MARKER} var ${OURS} = @F@; ${OURS} === hydrationParentFiber && (isHydrating ? (popToNextHostParent(${OURS}), 5 === ${OURS}.tag && null != ${OURS}.stateNode && (nextHydratableInstance = ${OURS}.stateNode)) : (popToNextHostParent(${OURS}), (isHydrating = !0))); default:`,
);
// The fix's signature wherever it appears: counts fragments and partial copies.
const FRAGMENT = /===\s*hydrationParentFiber\s*&&\s*\(\s*isHydrating\s*\?/g;
const HELPERS = ["popToNextHostParent", "hydrationParentFiber", "isHydrating", "nextHydratableInstance"];

const count = (re, s) => (s.match(re) || []).length;

/** What a react-dom client file carries. Pure; exported for the tests and the records. */
function inspect(source) {
  return {
    anchors: count(ANCHOR, source),
    ours: count(OURS_COMPLETE, source),
    upstream: count(UPSTREAM_COMPLETE, source),
    fragments: count(FRAGMENT, source),
    markers: source.split(MARKER).length - 1,
    helpers: HELPERS.filter((name) => !new RegExp(`\\b${name}\\b`).test(source)),
  };
}

function fixCode(fiberVar) {
  const f = OURS;
  return (
    ` ${MARKER} var ${f} = ${fiberVar}; ` +
    `${f} === hydrationParentFiber && (isHydrating ? (popToNextHostParent(${f}), ` +
    `5 === ${f}.tag && null != ${f}.stateNode && (nextHydratableInstance = ${f}.stateNode)) ` +
    `: (popToNextHostParent(${f}), (isHydrating = !0)));`
  );
}

function fail(resourcePath, why) {
  return new Error(`[react-hydration-replay-fix] ${resourcePath}: ${why}`);
}

function trace(resourcePath, outcome) {
  const t = process.env.REACT_REPLAY_FIX_TRACE;
  if (!t) return;
  const line = `[react-hydration-replay-fix] ${outcome}: ${resourcePath}\n`;
  if (t.startsWith("/")) fs.appendFileSync(t, line);
  else process.stderr.write(line);
}

function applyReplayFix(source, resourcePath = "react-dom-client") {
  const s = inspect(source);
  const complete = s.ours + s.upstream;
  if (s.markers !== s.ours) {
    throw fail(resourcePath, `the loader's marker appears ${s.markers} time(s) but the complete fix it marks appears ${s.ours} time(s): a marker-only or partial copy of the fix. Refusing to build on it.`);
  }
  if (complete > 1) throw fail(resourcePath, `${complete} complete copies of the replay fix (ours ${s.ours}, React's ${s.upstream}): duplicate structures.`);
  if (complete === 1) {
    if (s.anchors !== 0 || s.fragments !== 1) {
      throw fail(resourcePath, `a complete fix is present but the file also has ${s.anchors} unpatched anchor(s) and ${s.fragments} fix fragment(s) in total: mixed or partial structures.`);
    }
    trace(resourcePath, s.upstream ? "unchanged (React's own fix present)" : "unchanged (already patched)");
    return source;
  }
  if (s.fragments !== 0) throw fail(resourcePath, `${s.fragments} fragment(s) of the replay fix without a complete structure: a partial copy. Refusing.`);
  if (s.anchors !== 1) {
    throw fail(
      resourcePath,
      `expected exactly one replay "case 5:" anchor, found ${s.anchors}. The bundled React changed: check whether it already contains React 19.3's fix (then remove this loader) or update the anchor.`,
    );
  }
  if (s.helpers.length) throw fail(resourcePath, `has no ${s.helpers.join(", ")}; the fix cannot be applied safely.`);
  const out = source.replace(ANCHOR, (_m, head, fiberVar, tail) => `${head}${fixCode(fiberVar)}${tail}`);
  const v = inspect(out);
  if (v.ours !== 1 || v.anchors !== 0 || v.fragments !== 1 || v.markers !== 1 || v.upstream !== 0) {
    throw fail(resourcePath, `self-check after patching failed (${JSON.stringify(v)}); not shipping the result.`);
  }
  trace(resourcePath, "applied");
  return out;
}

module.exports = function reactHydrationReplayFixLoader(source) {
  return applyReplayFix(source, this && this.resourcePath);
};
module.exports.applyReplayFix = applyReplayFix;
module.exports.inspect = inspect;
module.exports.MARKER = MARKER;
module.exports.HELPERS = HELPERS;
// The files the loader is attached to (next.config.ts), exported for the tests.
module.exports.TARGET = /[\\/]next[\\/]dist[\\/]compiled[\\/]react-dom(?:-experimental)?[\\/]cjs[\\/]react-dom-client\.(?:production|development)\.js$/;
