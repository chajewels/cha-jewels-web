// Guards the two invariants that decide whether an event reported from a mount
// effect is recorded at all. Both were violated in production on 2026-09-15:
// `product_view` never fired once while `add_to_cart`, which is reported from a
// click, always did.
//
// The mechanism, from @vercel/analytics 2.0.1 itself:
//   track()      -> window.va?.call(window, "event", …)   undefined = SILENT no-op
//   window.va    <- created by initQueue() inside inject()
//   inject()     <- called from the <Analytics/> component's own useEffect
// So nothing reported before that effect is recorded, and nothing anywhere says
// so. That is why this is a build gate and not a comment: the failure is
// invisible by construction, which is exactly how it shipped.
import { readFileSync } from "node:fs";

let failed = 0;
const fail = (msg) => { failed++; console.error(`✗ ${msg}`); };

// 1. The provider's effect must run before any page's. React runs effects in
//    tree order, so <AnalyticsProvider/> must precede {children}.
// Comments are stripped before locating anything. The first version of this
// check matched the "{children}" inside its own explanatory JSX comment and
// reported the fixed layout as broken — the same mistake as asserting on a
// symbol that only appears in prose.
const stripComments = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")  // {/* JSX comment */}
    .replace(/\/\*[\s\S]*?\*\//g, "")        // /* block */
    .replace(/^\s*\/\/.*$/gm, "");             // // line

const layout = stripComments(readFileSync("app/layout.tsx", "utf8"));
const provider = layout.indexOf("<AnalyticsProvider />");
const children = layout.indexOf("{children}");
if (provider === -1) {
  fail("app/layout.tsx: <AnalyticsProvider /> is not mounted at all.");
} else if (children === -1) {
  fail("app/layout.tsx: {children} not found — this check needs rewriting.");
} else if (provider > children) {
  fail(
    "app/layout.tsx: <AnalyticsProvider /> is mounted AFTER {children}. Its effect " +
    "creates window.va, so any event a page reports from its own mount effect is " +
    "dropped silently. Move it above {children}.",
  );
}

// 2. emit() must not hand an event to track() before the queue exists.
const analytics = stripComments(readFileSync("lib/analytics.ts", "utf8"));
if (!analytics.includes("queueReady")) {
  fail("lib/analytics.ts: emit() no longer waits for the analytics queue (queueReady is gone).");
}

// 3. The de-duplication must not consume a SKU it failed to report. The SKU is
//    recorded in emit()'s onSent callback, never before the call.
const view = analytics.slice(analytics.indexOf("export function trackProductView"));
const addPos = view.indexOf("viewedSkus.add(sku)");
const emitPos = view.indexOf("emit(\"product_view\"");
if (addPos === -1 || emitPos === -1) {
  fail("lib/analytics.ts: trackProductView no longer looks like itself — this check needs rewriting.");
} else if (addPos < emitPos) {
  fail(
    "lib/analytics.ts: trackProductView records the SKU BEFORE emitting. A dropped " +
    "event then consumes that SKU's one slot and every later view of the piece is " +
    "suppressed too. Record it in the onSent callback instead.",
  );
}

if (failed) {
  console.error(`\n${failed} analytics invariant(s) broken.`);
  process.exit(1);
}
console.log("analytics check passed: provider mounts first, emit waits for the queue, dedupe records only on send.");
