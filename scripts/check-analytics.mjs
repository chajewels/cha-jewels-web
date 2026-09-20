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
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

let failed = 0;
// Read from the module so the two never drift apart.
const MAX_PROPS_EXPECTED = Number(
  (readFileSync("lib/analytics.ts", "utf8").match(/MAX_EVENT_PROPERTIES = (\d+)/) ?? [])[1] ?? 2,
);
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

// 4. The property ceiling is asserted in code, not just documented. A third
//    property is not an error at the provider — it is silently billable (Web
//    Analytics Plus), so nothing would surface it except an invoice.
if (!/Object\.keys\(props\)\.length > MAX_EVENT_PROPERTIES/.test(analytics)) {
  fail("lib/analytics.ts: emit() no longer asserts the MAX_EVENT_PROPERTIES ceiling before calling track().");
}

// 5. The "search" event spends exactly the two properties the plan allows.
const searchCall = analytics.match(/emit\(\s*"search"\s*,\s*\{([\s\S]*?)\}\s*\)/);
if (!searchCall) {
  fail('lib/analytics.ts: no emit("search", { … }) call — trackSearch needs rewriting or this check does.');
} else {
  // Split on top-level commas only: a value like Math.max(0, …) contains its own.
  let depth = 0, current = "", keys = [];
  for (const ch of searchCall[1]) {
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    if (ch === "," && depth === 0) { keys.push(current); current = ""; continue; }
    current += ch;
  }
  if (current.trim()) keys.push(current);
  keys = keys.map((k) => k.trim()).filter(Boolean);
  if (keys.length !== MAX_PROPS_EXPECTED) {
    fail(`lib/analytics.ts: the "search" event carries ${keys.length} propert(ies), not ${MAX_PROPS_EXPECTED}. A third is silently billable.`);
  }
}

// 6. The reported query is capped before it leaves the browser. A search box
//    accepts a pasted paragraph; the dimension is "what do people search for".
if (!/normalize\(q\)\.slice\(0, SEARCH_QUERY_MAX\)/.test(analytics)) {
  fail("lib/analytics.ts: trackSearch no longer normalizes and caps the query at SEARCH_QUERY_MAX.");
}

// 7. ONE EMITTER. This is the invariant the whole design rests on: the results
//    page reports the search and nothing else does. When the header combobox
//    reported one too, a search typed there was counted twice and a pasted
//    /search link once, so the total was neither searches nor page views — and
//    the number looked perfectly healthy while meaning nothing, which is why
//    this is a gate and not a comment.
const SKIP = new Set(["node_modules", ".next", ".git", "scripts"]);
const callers = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { walk(full); continue; }
    if (!/\.tsx?$/.test(name)) continue;
    const rel = relative(process.cwd(), full).split("\\").join("/");
    if (rel === "lib/analytics.ts") continue; // the definition itself
    if (/\btrackSearch\s*\(/.test(stripComments(readFileSync(full, "utf8")))) callers.push(rel);
  }
})(process.cwd());

const EXPECTED_EMITTER = "components/analytics/search-view.tsx";
if (callers.length !== 1 || callers[0] !== EXPECTED_EMITTER) {
  fail(
    `trackSearch must be called from ${EXPECTED_EMITTER} and nowhere else — found: ` +
    `${callers.length ? callers.join(", ") : "no call sites at all"}. Two emitters double-count every ` +
    "search typed in the header while a pasted link counts once.",
  );
}

if (failed) {
  console.error(`\n${failed} analytics invariant(s) broken.`);
  process.exit(1);
}
console.log("analytics check passed: provider mounts first, emit waits for the queue, dedupe records only on send, events stay within the property ceiling, and the search event has exactly one emitter.");
