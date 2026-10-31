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
 * Safety: the anchor must match exactly once, or the build FAILS (a silent
 * no-op would ship the bug again). A React that already contains the fix
 * (Next 16.2+, react-dom 19.3+) is returned unchanged. Remove this loader when
 * Next is upgraded (docs/security/SECURITY-HARDENING-2026-10-31.md, W-12).
 */
"use strict";

const MARKER = "/* cha-jewels: react 19.3 hydration replay fix */";

// The unpatched `case 5:` of the replay switch: resetHooksOnUnwind falls
// straight through to `default:`. `next` in the production file,
// `unitOfWork` in the development file.
const ANCHOR = /(case 5:\s*resetHooksOnUnwind\((next|unitOfWork)\);)(\s*default:)/g;

// Already fixed upstream (React 19.3+): the replay case reads the hydration parent.
const UPSTREAM_FIXED = /case 5:\s*resetHooksOnUnwind\((?:next|unitOfWork)\);\s*var fiber = (?:next|unitOfWork);\s*fiber === hydrationParentFiber/;

function fixCode(fiberVar) {
  const f = "cjReplayFiber";
  return (
    ` ${MARKER} var ${f} = ${fiberVar}; ` +
    `${f} === hydrationParentFiber && (isHydrating ? (popToNextHostParent(${f}), ` +
    `5 === ${f}.tag && null != ${f}.stateNode && (nextHydratableInstance = ${f}.stateNode)) ` +
    `: (popToNextHostParent(${f}), (isHydrating = !0)));`
  );
}

function applyReplayFix(source, resourcePath = "react-dom-client") {
  if (source.includes(MARKER) || UPSTREAM_FIXED.test(source)) return source;
  const matches = [...source.matchAll(ANCHOR)];
  if (matches.length !== 1) {
    throw new Error(
      `[react-hydration-replay-fix] expected exactly one replay "case 5:" anchor in ${resourcePath}, found ${matches.length}. ` +
        "The bundled React changed: check whether it already contains React 19.3's fix (then remove this loader) or update the anchor.",
    );
  }
  for (const name of ["popToNextHostParent", "hydrationParentFiber", "isHydrating", "nextHydratableInstance"]) {
    if (!new RegExp(`\\b${name}\\b`).test(source)) {
      throw new Error(`[react-hydration-replay-fix] ${resourcePath} has no ${name}; the fix cannot be applied safely.`);
    }
  }
  return source.replace(ANCHOR, (_m, head, fiberVar, tail) => `${head}${fixCode(fiberVar)}${tail}`);
}

module.exports = function reactHydrationReplayFixLoader(source) {
  return applyReplayFix(source, this && this.resourcePath);
};
module.exports.applyReplayFix = applyReplayFix;
module.exports.MARKER = MARKER;
// The files the loader is attached to (next.config.ts), exported for the tests.
module.exports.TARGET = /[\\/]next[\\/]dist[\\/]compiled[\\/]react-dom(?:-experimental)?[\\/]cjs[\\/]react-dom-client\.(?:production|development)\.js$/;
