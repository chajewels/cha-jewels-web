// The Content-Security-Policy builder (owner 6A, SQ19): enforced on the
// pay-card page with a nonce, report-only everywhere else; and the report
// reader that keeps query strings out of the logs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { isPayCardPath, newNonce, payCardCsp, reportOnlyCsp, CSP_REPORT_PATH } = await import(pathToFileURL(join(process.cwd(), "lib/csp.ts")).href);
const { readCspViolations, CSP_REPORT_MAX_BYTES } = await import(pathToFileURL(join(process.cwd(), "lib/csp-report.ts")).href);

const directives = (policy) => Object.fromEntries(policy.split(";").map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));

test("the pay-card path is detected, with or without a trailing slash, and nothing else", () => {
  assert.equal(isPayCardPath("/account/orders/12fea41d-557b-4630-b0d3-4d3ed34f9efc/pay-card"), true);
  assert.equal(isPayCardPath("/account/orders/order-1/pay-card/"), true);
  assert.equal(isPayCardPath("/account/orders/order-1"), false);
  assert.equal(isPayCardPath("/account/orders/order-1/pay-card/extra"), false);
  assert.equal(isPayCardPath("/account/orders/pay-card"), false);
  assert.equal(isPayCardPath("/en/account/orders/order-1/pay-card"), false, "the site has no locale prefix");
  assert.equal(isPayCardPath("/"), false);
});

test("a fresh nonce per call, base64 of 16 bytes", () => {
  const a = newNonce(), b = newNonce();
  assert.match(a, /^[A-Za-z0-9+/]{22}==$/);
  assert.notEqual(a, b);
});

test("the enforced policy: nonce + strict-dynamic, Square's hosts, no framing, reports", () => {
  const nonce = newNonce();
  const d = directives(payCardCsp(nonce, { supabaseUrl: "https://abc.supabase.co/" }));
  assert.deepEqual(d["default-src"], ["'self'"]);
  assert.ok(d["script-src"].includes(`'nonce-${nonce}'`));
  assert.ok(d["script-src"].includes("'strict-dynamic'"));
  assert.ok(!d["script-src"].includes("'unsafe-inline'"), "no inline scripts without the nonce");
  assert.ok(!d["script-src"].includes("'unsafe-eval'"));
  for (const h of ["https://sandbox.web.squarecdn.com", "https://web.squarecdn.com"]) assert.ok(d["script-src"].includes(h));
  for (const h of ["https://pci-connect.squareup.com", "https://pci-connect.squareupsandbox.com", "https://web.squareup.com", "https://o160250.ingest.sentry.io", "https://abc.supabase.co"]) assert.ok(d["connect-src"].includes(h), h);
  for (const h of ["https://square-fonts-production-f.squarecdn.com", "https://d1g145x70srn7h.cloudfront.net"]) assert.ok(d["font-src"].includes(h));
  assert.deepEqual(d["frame-src"], ["https:"], "3-D Secure challenges come from the issuer's own domain");
  assert.deepEqual(d["frame-ancestors"], ["'none'"]);
  assert.deepEqual(d["form-action"], ["'self'"]);
  assert.deepEqual(d["base-uri"], ["'self'"]);
  assert.deepEqual(d["object-src"], ["'none'"]);
  assert.ok("upgrade-insecure-requests" in d);
  assert.deepEqual(d["report-uri"], [CSP_REPORT_PATH]);
  assert.equal(CSP_REPORT_PATH, "/api/csp-report");
});

test("dev mode allows eval and the HMR socket; a bad nonce or a junk Supabase URL never gets in", () => {
  const d = directives(payCardCsp(newNonce(), { dev: true, supabaseUrl: "not a url" }));
  assert.ok(d["script-src"].includes("'unsafe-eval'"));
  assert.ok(d["connect-src"].includes("ws:"));
  assert.ok(!("upgrade-insecure-requests" in d));
  assert.ok(!d["connect-src"].some((h) => h.includes("not")));
  assert.throws(() => payCardCsp("x'; script-src *"));
});

test("the report-only policy is broad: inline allowed, the site's known hosts listed, and no nonce", () => {
  const p = reportOnlyCsp({ supabaseUrl: "https://abc.supabase.co" });
  const d = directives(p);
  assert.ok(d["script-src"].includes("'unsafe-inline'"));
  for (const h of ["https://apps.paidy.com", "https://cdn.paidy.com", "https://tracker.metricool.com", "https://web.squarecdn.com"]) assert.ok(d["script-src"].includes(h), h);
  assert.ok(d["connect-src"].includes("wss://abc.supabase.co"));
  assert.ok(!p.includes("nonce-"));
  assert.deepEqual(d["report-uri"], ["/api/csp-report"]);
});

test("violation reports: both formats, path only, never a query string", () => {
  const legacy = readCspViolations({ "csp-report": { "blocked-uri": "https://evil.example/x.js?token=abc", "violated-directive": "script-src-elem", "document-uri": "https://www.chajewelsjp.com/account/orders/123/pay-card?signed=1" } });
  assert.deepEqual(legacy, [{ blocked: "https://evil.example/x.js", directive: "script-src-elem", document: "/account/orders/123/pay-card" }]);
  const modern = readCspViolations([
    { type: "csp-violation", body: { blockedURL: "inline", effectiveDirective: "script-src-elem", documentURL: "https://www.chajewelsjp.com/?q=ring#top" } },
    { type: "deprecation", body: {} },
  ]);
  assert.deepEqual(modern, [{ blocked: "inline", directive: "script-src-elem", document: "/" }]);
  assert.deepEqual(readCspViolations({ hello: 1 }), []);
  assert.deepEqual(readCspViolations(null), []);
  assert.equal(CSP_REPORT_MAX_BYTES, 16384);
  const forged = readCspViolations({ "csp-report": { "blocked-uri": "eval\nFAKE LOG LINE", "violated-directive": "script-src\r\nFAKE", "document-uri": "/x" } });
  assert.ok(!/[\r\n]/.test(forged[0].blocked + forged[0].directive), "no control characters reach a log line");
});

// QC P3-5 (task S5): framing is refused site-wide (enforced frame-ancestors +
// X-Frame-Options), and pay-card FAILS CLOSED when its policy cannot be built.
test("every page but pay-card: enforced frame-ancestors only, plus the report-only policy", async () => {
  const { cspForPath, FRAME_OPTIONS } = await import(pathToFileURL(join(process.cwd(), "lib/csp.ts")).href);
  assert.equal(FRAME_OPTIONS, "DENY");
  for (const p of ["/", "/account/orders/o1", "/checkout", "/products/x"]) {
    const c = cspForPath(p, {});
    assert.equal(c.enforced, "frame-ancestors 'none'", p);
    assert.ok(c.reportOnly && c.reportOnly.includes("report-uri"), p);
    assert.equal(c.nonce, null, p);
  }
});

test("pay-card: the enforced nonce policy, no report-only fallback", async () => {
  const { cspForPath } = await import(pathToFileURL(join(process.cwd(), "lib/csp.ts")).href);
  const c = cspForPath("/account/orders/o1/pay-card", {});
  assert.ok(c.nonce);
  assert.ok(c.enforced.includes(`'nonce-${c.nonce}'`));
  assert.ok(c.enforced.includes("frame-ancestors 'none'"));
  assert.equal(c.reportOnly, null);
});

test("pay-card: a policy that cannot be built fails CLOSED (strict, no scripts), never report-only", async () => {
  const { cspForPath, PAY_CARD_FAILSAFE_CSP } = await import(pathToFileURL(join(process.cwd(), "lib/csp.ts")).href);
  const c = cspForPath("/account/orders/o1/pay-card", {}, () => "bad nonce!");
  assert.equal(c.enforced, PAY_CARD_FAILSAFE_CSP);
  assert.equal(c.reportOnly, null);
  assert.equal(c.nonce, null);
  const d = directives(PAY_CARD_FAILSAFE_CSP);
  assert.deepEqual(d["script-src"], ["'none'"]);
  assert.deepEqual(d["connect-src"], ["'none'"]);
  assert.deepEqual(d["frame-src"], ["'none'"]);
  assert.deepEqual(d["frame-ancestors"], ["'none'"]);
  const thrower = () => { throw new Error("no crypto"); };
  assert.equal(cspForPath("/account/orders/o1/pay-card", {}, thrower).enforced, PAY_CARD_FAILSAFE_CSP);
});

test("the fail-closed pay-card answer is flagged so the page can say so (M-5)", async () => {
  const { cspForPath } = await import(pathToFileURL(join(process.cwd(), "lib/csp.ts")).href);
  assert.equal(cspForPath("/account/orders/o1/pay-card", {}, () => "bad!").failsafe, true);
  assert.equal(cspForPath("/account/orders/o1/pay-card", {}).failsafe, false);
  assert.equal(cspForPath("/", {}).failsafe, false);
});
