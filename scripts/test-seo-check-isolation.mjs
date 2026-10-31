#!/usr/bin/env node
// Proves, in a REAL browser, that the preview credential reaches only the exact authorized origin.
// Usage: node scripts/test-seo-check-isolation.mjs   (no network beyond loopback; no real secret is used)
//
// Two controlled loopback origins stand in for "the authorized preview" (A) and "any other host" (B);
// they differ by port, which makes them different origins. A FAKE sentinel is the "secret". The page on A
// pulls an image, a script, a stylesheet, an iframe and a fetch() from B, and A redirects to B (one hop and
// two hops); B redirects back to A. Every request either server receives is recorded with its headers.
//
//   PASS means: A received the header on every request to it (positive control), B received it on NONE
//   (and did receive the subresource and redirect requests, so the test really exercised them), and the
//   sentinel appears in no output of this script or of the real checker.
//   CONTROL: the same run with the old context-wide `extraHTTPHeaders` MUST leak to B; if it does not,
//   the harness cannot detect a leak and the test FAILS.
//   It also runs the real scripts/check-seo-dom.mjs against fake sites: it must refuse to run without an
//   explicit authorized origin (making no request), and must fail closed on a sitemap lacking the families.
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import { authorizeCredentials, installCredentialRouting, CREDENTIAL_HEADER } from "./lib/seo-check-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SENTINEL = `SENTINEL-${Math.random().toString(36).slice(2)}-fake-not-a-secret`;
const out = [];
const log = (...a) => { const line = a.join(" "); out.push(line); console.log(line); };
const failures = [];
const check = (name, cond, detail = "") => { log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  [${detail}]`}`); if (!cond) failures.push(name); };

async function site(handler) {
  const seen = [];
  const server = http.createServer((req, res) => { seen.push({ method: req.method, url: req.url, headers: { ...req.headers } }); handler(req, res, server); });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  return { server, seen, port: server.address().port, origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((ok) => server.close(ok)) };
}
const hasSecret = (s) => Object.values(s.headers).some((v) => String(v).includes(SENTINEL));

async function twoOrigins() {
  let A, B;
  B = await site((req, res) => {
    const path = req.url.split("?")[0];
    if (path === "/redirect-back") { res.writeHead(302, { location: `${A.origin}/ok` }); return res.end(); }
    const types = { "/pixel.gif": "image/gif", "/s.js": "text/javascript", "/s.css": "text/css", "/api": "application/json", "/frame": "text/html", "/landing": "text/html" };
    res.writeHead(200, { "content-type": types[path] ?? "text/plain", "access-control-allow-origin": "*" });
    res.end(path === "/frame" || path === "/landing" ? "<html><body>B</body></html>" : "x");
  });
  A = await site((req, res) => {
    const path = req.url.split("?")[0];
    if (path === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(`<html><head><link rel="stylesheet" href="${B.origin}/s.css"><script src="${B.origin}/s.js"></script></head><body><img src="${B.origin}/pixel.gif"><img src="/own.gif"><iframe src="${B.origin}/frame"></iframe><script>fetch("${B.origin}/api",{mode:"cors"}).catch(()=>{});fetch("/own-api").catch(()=>{});</script></body></html>`);
    }
    if (path === "/redirect-out") { res.writeHead(302, { location: `${B.origin}/landing` }); return res.end(); }
    if (path === "/redirect-chain") { res.writeHead(302, { location: `${A.origin}/redirect-out` }); return res.end(); }
    if (path === "/redirect-same") { res.writeHead(302, { location: `${A.origin}/ok` }); return res.end(); }
    res.writeHead(200, { "content-type": path === "/own.gif" ? "image/gif" : "text/html" }); res.end("<html><body>ok</body></html>");
  });
  return { A, B };
}

async function browse(mode) {
  const { A, B } = await twoOrigins();
  // Chromium's Local Network Access checks would block this page's requests to a SECOND loopback origin (a page
  // fulfilled by the router is treated as public), which would make the isolation test vacuous: B would receive
  // nothing for a reason that has nothing to do with the header. They are switched off for THIS test browser only.
  const browser = await chromium.launch({ args: ["--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults"] });
  try {
    const opts = { viewport: { width: 800, height: 600 } };
    if (mode === "naive") opts.extraHTTPHeaders = { [CREDENTIAL_HEADER]: SENTINEL };       // the OLD, leaking behaviour: control only
    const context = await browser.newContext(opts);
    if (mode === "routed") await installCredentialRouting(context, authorizeCredentials(A.origin, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: A.origin }));
    const page = await context.newPage();
    for (const path of ["/", "/redirect-out", "/redirect-chain", "/redirect-same"]) { await page.goto(A.origin + path, { waitUntil: "load" }).catch(() => {}); await page.waitForLoadState("networkidle").catch(() => {}); }
    const aMain = A.seen.slice();                                                             // everything A saw before the last step
    await page.goto(`${B.origin}/redirect-back`, { waitUntil: "load" }).catch(() => {});      // a cross-origin redirect INTO the authorized origin
    await page.waitForLoadState("networkidle").catch(() => {});
    const bPaths = new Set(B.seen.map((s) => s.url.split("?")[0]));
    return { A, B, bPaths, aMain, intoA: A.seen.slice(aMain.length), close: async () => { await context.close(); } };
  } finally { await browser.close(); }
}

// ---- 1. routed credentials (the real implementation)
{
  const r = await browse("routed");
  const aWithout = r.aMain.filter((s) => !hasSecret(s));
  check("positive control: every request to the authorized origin carries the header, redirect hops that stay on it included", r.aMain.length > 0 && aWithout.length === 0, `without: ${aWithout.map((s) => s.url).join(", ")}`);
  check("the authorized origin received the page, its own subresources and every same-origin redirect hop", ["/", "/own.gif", "/redirect-out", "/redirect-chain", "/redirect-same", "/ok"].every((p) => r.aMain.some((s) => s.url.split("?")[0] === p)), r.aMain.map((s) => s.url).join(", "));
  check("the other origin DID receive its subresources, iframe, fetch and redirect landing (so the isolation test really exercised them)", ["/pixel.gif", "/s.js", "/s.css", "/frame", "/api", "/landing"].every((p) => r.bPaths.has(p)), [...r.bPaths].join(", "));
  check("ISOLATION: the other origin received the header on NONE of its requests (image, script, stylesheet, iframe, fetch, one-hop and two-hop redirect landings, redirect-back)", r.B.seen.length >= 7 && r.B.seen.filter(hasSecret).length === 0, `B saw ${r.B.seen.length} request(s); with the header: ${r.B.seen.filter(hasSecret).map((s) => s.url).join(", ")}`);
  log(`      (documented limit: the hop from the other origin back INTO the authorized origin ${r.intoA.length ? `reached it ${r.intoA.every(hasSecret) ? "with" : "without"} the header` : "was not observed"}; it is followed by the browser and not routed again; the checkers never navigate through other origins)`);
  await r.A.close(); await r.B.close();
}
// ---- 2. CONTROL: the old context-wide headers MUST be detected as leaking
{
  const r = await browse("naive");
  const leaked = r.B.seen.filter(hasSecret);
  check("CONTROL: the old context-wide extraHTTPHeaders behaviour leaks to the other origin, and this harness detects it", leaked.length > 0, "the harness did not detect the leak, so it cannot be trusted");
  log(`      (control: ${leaked.length} request(s) to the other origin carried the sentinel under the old behaviour)`);
  await r.A.close(); await r.B.close();
}

// ---- 3. the real DOM checker: refusal without an authorized origin, then fail-closed coverage
const runDom = (base, env) => new Promise((resolve) => {
  const p = spawn(process.execPath, [join(ROOT, "scripts/check-seo-dom.mjs"), base], { env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env }, cwd: ROOT });
  let o = ""; p.stdout.on("data", (d) => (o += d)); p.stderr.on("data", (d) => (o += d));
  p.on("close", (code) => resolve({ code, out: o }));
});
async function fakeFamilylessSite(n = 30) {
  const s = await site((req, res, server) => {
    if (req.url === "/sitemap.xml") { res.writeHead(200, { "content-type": "application/xml" }); return res.end(`<?xml version="1.0"?><urlset>${Array.from({ length: n }, (_, i) => `<url><loc>http://127.0.0.1:${server.address().port}/en/static${i}</loc></url>`).join("")}</urlset>`); }
    res.writeHead(404, { "content-type": "text/html" }); res.end("<html><body><h1>404</h1></body></html>");
  });
  return s;
}
{
  const f = await fakeFamilylessSite();
  let r = await runDom(f.origin, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL });
  check("the DOM checker refuses to run with a secret and no authorized origin (exit 2), before any request", r.code === 2 && f.seen.length === 0 && !r.out.includes(SENTINEL), `exit ${r.code}, requests ${f.seen.length}`);
  r = await runDom(f.origin, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "https://not-the-checked-origin.test" });
  check("the DOM checker refuses when the authorized origin is not the checked origin (exit 2), before any request", r.code === 2 && f.seen.length === 0 && !r.out.includes(SENTINEL), `exit ${r.code}, requests ${f.seen.length}`);
  r = await runDom(f.origin, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: f.origin });
  check("the DOM checker FAILS CLOSED on a sitemap lacking the template families (coverage missing, exit 1)", r.code === 1 && /coverage missing: dynamic-both-languages/.test(r.out) && /coverage missing: blog-post/.test(r.out) && /the sitemap offers a sample of this family/.test(r.out), `exit ${r.code}`);
  check("the DOM checker's coverage inventory reports expected, checked, missing and skipped", /expected\s+checked\s+missing\s+skipped/.test(r.out) && /single-language-posts/.test(r.out) && /skipped:/.test(r.out));
  check("every request the DOM checker made to the authorized fake site carried the header, and its output never contains the secret", f.seen.length > 0 && f.seen.every(hasSecret) && !r.out.includes(SENTINEL), `requests ${f.seen.length}`);
  await f.close();
  const g = await fakeFamilylessSite(3);
  r = await runDom(g.origin, {});
  check("the DOM checker FAILS CLOSED on an unusable sitemap (exit 1, coverage missing: sitemap)", r.code === 1 && /coverage missing: sitemap/.test(r.out) && /only 3 URL/.test(r.out), `exit ${r.code}`);
  await g.close();
}

check("the sentinel appears nowhere in this script's own output", !out.join("\n").includes(SENTINEL));
log(`\n${failures.length ? `FAILED: ${failures.length} check(s)` : "all credential-isolation and fail-closed checks passed"}`);
process.exit(failures.length ? 1 : 0);
