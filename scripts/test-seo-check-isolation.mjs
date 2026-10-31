#!/usr/bin/env node
// Proves, in a REAL browser, that preview credentials reach only the exact authorized origin and that the
// browser's own redirect behaviour is preserved. Usage: node scripts/test-seo-check-isolation.mjs
// (loopback only; a FAKE sentinel secret and a FAKE sentinel cookie; nothing real is used or needed).
//
// Two controlled loopback ORIGINS ON DIFFERENT HOSTS stand in for "the authorized preview" (A, localhost) and
// "any other host" (B, 127.0.0.1). A browser scopes a cookie by HOST, not by port: the harness therefore also
// proves the exact contract with a third server on the same IP: the same host on ANOTHER PORT does receive the
// cookie (a port-only difference is not isolated; stated, not hidden), a SUBDOMAIN (sub.localhost) does not,
// another host does not, and the header is exact-origin. A is GATED like a protected preview: it answers 401 unless the
// request carries the bypass cookie, or is the one bootstrap request that carries the secret header and
// x-vercel-set-bypass-cookie (answered, as Vercel documents, with a redirect that sets the cookie). The page on
// A pulls an image, a script, a stylesheet, an iframe and a fetch() from B; A redirects out to B (one hop and
// two hops), redirects within itself (one hop and two hops), and B redirects back into A. Every request either
// server receives is recorded with its headers. An UNGATED copy of A serves the plain-browser control.
//
//   PASS means, all together: the credentialed context behaves EXACTLY like a plain browser (same final URLs,
//   same redirect hops, same status) on every navigation including redirect chains; every request to A
//   carried the cookie, redirect hops and the redirect-back from B included; B received its subresources,
//   iframe, fetch and landings and NEITHER the cookie NOR the header on any of them; the header itself was
//   sent by the browser to nobody (only the single Node bootstrap request carried it); the old context-wide
//   header behaviour is detected as leaking (control; otherwise this harness could pass vacuously); the real
//   DOM checker refuses without an authorized origin or a cookie, fails closed on bad sitemaps and a dead
//   origin, and never prints a credential, a reflected one included; and no sentinel appears in this script's
//   own stdout or stderr.
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import { authorizeCredentials, bootstrapBrowserCredentials, installBrowserCredentials, CREDENTIAL_HEADER, SET_COOKIE_HEADER } from "./lib/seo-check-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SENTINEL = `SENTINEL-${Math.random().toString(36).slice(2)}-fake-not-a-secret`;
const COOKIE_SENTINEL = `COOKIE-${Math.random().toString(36).slice(2)}-fake-not-a-secret`;
const out = [];
const log = (...a) => { const line = a.join(" "); out.push(line); console.log(line); };
const failures = [];
const check = (name, cond, detail = "") => { log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  [${detail}]`}`); if (!cond) failures.push(name); };
const leaks = (s) => Object.values(s.headers).some((v) => String(v).includes(SENTINEL) || String(v).includes(COOKIE_SENTINEL));
const hasCookie = (s) => String(s.headers.cookie ?? "").includes(COOKIE_SENTINEL);
const hasHeader = (s) => s.headers[CREDENTIAL_HEADER] !== undefined;
const leaksText = (t) => t.includes(SENTINEL) || t.includes(COOKIE_SENTINEL);

async function site(host, handler) {
  const seen = [];
  const server = http.createServer((req, res) => { seen.push({ method: req.method, url: req.url, headers: { ...req.headers } }); handler(req, res, server); });
  await new Promise((ok) => server.listen(0, host, ok));
  return { server, seen, host, port: server.address().port, origin: `http://${host}:${server.address().port}`, close: () => new Promise((ok) => server.close(ok)) };
}
/** B: the other host. `aRef.origin` is whichever A is active. */
const aRef = { origin: null };
async function otherOrigin() {
  return site("127.0.0.1", (req, res) => {
    const path = req.url.split("?")[0];
    if (path === "/redirect-back") { res.writeHead(302, { location: `${aRef.origin}/ok` }); return res.end(); }
    const types = { "/pixel.gif": "image/gif", "/s.js": "text/javascript", "/s.css": "text/css", "/api": "application/json", "/frame": "text/html", "/landing": "text/html" };
    res.writeHead(200, { "content-type": types[path] ?? "text/plain", "access-control-allow-origin": "*" });
    res.end(path === "/frame" || path === "/landing" ? "<html><body>B</body></html>" : "x");
  });
}
/** A: the authorized origin, gated or open. */
async function authorizedOrigin(B, { gated }) {
  let self;
  self = await site("localhost", (req, res) => {
    const path = req.url.split("?")[0];
    if (req.headers[CREDENTIAL_HEADER] === SENTINEL && req.headers[SET_COOKIE_HEADER] === "true") { res.writeHead(307, { location: "/", "set-cookie": `_fake_bypass=${COOKIE_SENTINEL}; Path=/; HttpOnly; SameSite=Lax` }); return res.end(); }
    if (gated && !String(req.headers.cookie ?? "").includes(`_fake_bypass=${COOKIE_SENTINEL}`)) { res.writeHead(401, { "content-type": "text/html" }); return res.end("<html><body>gated</body></html>"); }
    if (path === "/") { res.writeHead(200, { "content-type": "text/html" }); return res.end(`<html><head><link rel="stylesheet" href="${B.origin}/s.css"><script src="${B.origin}/s.js"></script></head><body><img src="${B.origin}/pixel.gif"><img src="/own.gif"><iframe src="${B.origin}/frame"></iframe><script>fetch("${B.origin}/api",{mode:"cors"}).catch(()=>{});fetch("/own-api").catch(()=>{});</script></body></html>`); }
    if (path === "/redirect-out") { res.writeHead(302, { location: `${B.origin}/landing` }); return res.end(); }
    if (path === "/redirect-chain") { res.writeHead(302, { location: `${self.origin}/redirect-out` }); return res.end(); }
    if (path === "/redirect-same") { res.writeHead(302, { location: `${self.origin}/ok` }); return res.end(); }
    if (path === "/redirect-same-chain") { res.writeHead(302, { location: "/redirect-same" }); return res.end(); }
    res.writeHead(200, { "content-type": path === "/own.gif" ? "image/gif" : "text/html" }); res.end("<html><body>ok</body></html>");
  });
  return self;
}

const NAVIGATIONS = ["/", "/redirect-same", "/redirect-same-chain", "/redirect-out", "/redirect-chain"];
// Chromium's Local Network Access checks would block a page on one loopback host from fetching the other, which would
// make B receive nothing for a reason unrelated to credentials and the test vacuous. Off for THIS test browser only.
const launch = () => chromium.launch({ args: ["--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults"] });

/** Drive one context through the navigations and the redirect-back; return what the browser observed (origins normalised). */
async function drive(context, A, B) {
  const page = await context.newPage();
  const trace = [];
  const norm = (u) => u.replace(A.origin, "A").replace(B.origin, "B");
  for (const path of NAVIGATIONS) {
    const r = await page.goto(A.origin + path, { waitUntil: "load" }).catch((e) => ({ status: () => `ERR ${e.message.slice(0, 40)}`, request: () => null }));
    await page.waitForLoadState("networkidle").catch(() => {});
    const hops = []; let req = r.request?.(); while (req?.redirectedFrom?.()) { req = req.redirectedFrom(); hops.unshift(norm(req.url())); }
    trace.push({ path, status: r.status(), final: norm(page.url()), hops });
  }
  const r = await page.goto(`${B.origin}/redirect-back`, { waitUntil: "load" }).catch((e) => ({ status: () => `ERR ${e.message.slice(0, 40)}` }));
  trace.push({ path: "B:/redirect-back", status: r.status(), final: norm(page.url()), hops: [] });
  await page.close();
  return trace;
}

const B = await otherOrigin();
const Aopen = await authorizedOrigin(B, { gated: false });
const Agated = await authorizedOrigin(B, { gated: true });
const browser = await launch();
try {
  // ---- 1. control: a plain browser on the OPEN copy of A defines "native behaviour"
  let ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  aRef.origin = Aopen.origin;
  const plain = await drive(ctx, Aopen, B);
  await ctx.close();
  const bPlain = B.seen.length;
  B.seen.length = 0;

  // ---- 2. the real implementation: cookie bootstrap pinned to the host, no routing, no headers, on the GATED A
  aRef.origin = Agated.origin;
  const auth = authorizeCredentials(Agated.origin, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: Agated.origin });
  const cookies = await bootstrapBrowserCredentials(auth);
  const bootstrapSeen = Agated.seen.length;
  check("bootstrap: exactly ONE Node request carried the secret header, to the authorized origin, and the redirect it answered with was not followed", bootstrapSeen === 1 && hasHeader(Agated.seen[0]) && Agated.seen[0].headers[SET_COOKIE_HEADER] === "true", `requests ${bootstrapSeen}`);
  check("bootstrap: the cookie is scoped to the authorized host (host-only) and path /, and its value is now a redacted credential", cookies.length === 1 && cookies[0].domain === "localhost" && cookies[0].path === "/" && auth.secrets.includes(COOKIE_SENTINEL));
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  await installBrowserCredentials(ctx, cookies);
  const cred = await drive(ctx, Agated, B);
  await ctx.close();
  const aAfter = Agated.seen.slice(bootstrapSeen);

  check("REDIRECT SEMANTICS: the credentialed browser's final URL, status and redirect hops equal a plain browser's on every navigation (same-origin hop and chain, cross-origin hop and chain, redirect-back)", JSON.stringify(cred) === JSON.stringify(plain), `credentialed ${JSON.stringify(cred)}\n      plain ${JSON.stringify(plain)}`);
  const fin = (p) => cred.find((t) => t.path === p)?.final;
  check("redirects were real: cross-origin navigations ended on the OTHER origin, same-origin chains ended on /ok, redirect-back ended on A/ok (nothing was collapsed at the original URL)", fin("/redirect-out") === "B/landing" && fin("/redirect-chain") === "B/landing" && fin("/redirect-same") === "A/ok" && fin("/redirect-same-chain") === "A/ok" && fin("B:/redirect-back") === "A/ok" && cred.find((t) => t.path === "/redirect-chain")?.hops.length === 2, JSON.stringify(cred.map((t) => [t.path, t.final, t.hops])));
  check("the gated origin served every navigation with 200 to the credentialed browser (the cookie is what authenticates)", cred.every((t) => t.status === 200), JSON.stringify(cred.map((t) => [t.path, t.status])));
  const aNoCookie = aAfter.filter((s) => !hasCookie(s));
  check("positive control: EVERY browser request to the authorized origin carried the cookie: page, own subresources, every same-origin redirect hop, and the hop redirected back in from the other origin", aAfter.length > 0 && aNoCookie.length === 0, `without: ${aNoCookie.map((s) => s.url).join(", ")}`);
  check("the authorized origin received the page, its own subresources and all redirect hops", ["/", "/own.gif", "/own-api", "/redirect-same", "/redirect-same-chain", "/redirect-out", "/redirect-chain", "/ok"].every((p) => aAfter.some((s) => s.url.split("?")[0] === p)), aAfter.map((s) => s.url).join(", "));
  check("the browser sent the secret HEADER to nobody (it never had it): zero browser requests to A or B carry it", aAfter.every((s) => !hasHeader(s)) && B.seen.every((s) => !hasHeader(s)));
  const bPaths = new Set(B.seen.map((s) => s.url.split("?")[0]));
  check("the other origin DID receive its stylesheet, script, image, iframe, fetch, the one-hop and two-hop landings and the redirect-back request (the test really exercised them)", ["/s.css", "/s.js", "/pixel.gif", "/frame", "/api", "/landing", "/redirect-back"].every((p) => bPaths.has(p)) && B.seen.length >= bPlain - 1, `B saw ${[...bPaths].join(", ")} (${B.seen.length} requests; plain run ${bPlain})`);
  check("ISOLATION: the other host received the cookie on NONE of its requests and the secret on none", B.seen.length > 0 && B.seen.filter(leaks).length === 0, `leaking: ${B.seen.filter(leaks).map((s) => s.url).join(", ")}`);

  // ---- 2b. the exact cookie contract: same host on another port, a subdomain, and the header's exact-origin rule
  const C = await site("127.0.0.1", (req, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end("<html><body>C</body></html>"); });   // reachable as localhost:pC and sub.localhost:pC
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  await installBrowserCredentials(ctx, cookies);
  const pg = await ctx.newPage();
  await pg.goto(`http://localhost:${C.port}/same-host-other-port`, { waitUntil: "load" }).catch(() => {});
  await pg.goto(`http://sub.localhost:${C.port}/subdomain`, { waitUntil: "load" }).catch(() => {});
  await ctx.close();
  const samePort = C.seen.filter((s) => s.url.startsWith("/same-host-other-port")), sub = C.seen.filter((s) => s.url.startsWith("/subdomain"));
  check("COOKIE SCOPE, stated limit: the same host on ANOTHER PORT does receive the cookie (a port-only difference is not isolated; a Vercel preview host has one port)", samePort.length > 0 && samePort.every(hasCookie), `requests ${samePort.length}, with cookie ${samePort.filter(hasCookie).length}`);
  check("COOKIE SCOPE: a SUBDOMAIN of the authorized host receives the cookie on none of its requests (host-only cookie)", sub.length > 0 && sub.every((s) => !hasCookie(s)), `requests ${sub.length} (host ${sub[0]?.headers.host}), with cookie ${sub.filter(hasCookie).length}`);
  check("the header is exact-origin: no request to the same host on another port or to the subdomain carried it", C.seen.every((s) => !hasHeader(s)));
  await C.close();

  // ---- 3. CONTROL: the old context-wide header behaviour MUST be detected as leaking
  B.seen.length = 0;
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, extraHTTPHeaders: { [CREDENTIAL_HEADER]: SENTINEL } });
  aRef.origin = Aopen.origin;
  await drive(ctx, Aopen, B);
  await ctx.close();
  const leaked = B.seen.filter(leaks);
  check("CONTROL: the old context-wide extraHTTPHeaders behaviour leaks the secret to the other origin, and this harness detects it", leaked.length > 0, "the harness did not detect the leak, so it cannot be trusted");
  log(`      (control: ${leaked.length} request(s) to the other origin carried the secret under the old behaviour)`);
} finally { await browser.close(); }

// ---- 4. the real DOM checker against fake sites: refusal, failure paths, fail-closed coverage, no credential in any output
const runDom = (base, env) => new Promise((resolve) => {
  const p = spawn(process.execPath, [join(ROOT, "scripts/check-seo-dom.mjs"), base], { env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env }, cwd: ROOT });
  let o = "", e = ""; p.stdout.on("data", (d) => (o += d)); p.stderr.on("data", (d) => (e += d));
  p.on("close", (code) => resolve({ code, out: o, err: e }));
});
async function fakeFamilylessSite(n = 30, { cookie = true, reflect = false } = {}) {
  return site("127.0.0.1", (req, res, server) => {
    const path = req.url.split("?")[0];
    if (req.headers[CREDENTIAL_HEADER] === SENTINEL && req.headers[SET_COOKIE_HEADER] === "true") { res.writeHead(307, { location: "/", ...(cookie ? { "set-cookie": `_fake_bypass=${COOKIE_SENTINEL}; Path=/; HttpOnly` } : {}) }); return res.end(); }
    if (path === "/sitemap.xml") { res.writeHead(200, { "content-type": "application/xml" }); return res.end(`<?xml version="1.0"?><urlset>${Array.from({ length: n }, (_, i) => `<url><loc>http://127.0.0.1:${server.address().port}/en/static${i}</loc></url>`).join("")}</urlset>`); }
    if (reflect && (path === "/en" || path === "/ja")) { res.writeHead(200, { "content-type": "text/html" }); return res.end(`<html><head><link rel="canonical" href="https://x.test/${req.headers.cookie ?? "none"}"></head><body><h1>${req.headers.cookie ?? ""}</h1></body></html>`); }
    res.writeHead(404, { "content-type": "text/html" }); res.end("<html><body><h1>404</h1></body></html>");
  });
}
{
  const f = await fakeFamilylessSite();
  let r = await runDom(f.origin, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL });
  check("the DOM checker refuses to run with a secret and no authorized origin (exit 2), before any request, with no credential in stdout or stderr", r.code === 2 && f.seen.length === 0 && !leaksText(r.out + r.err), `exit ${r.code}, requests ${f.seen.length}`);
  r = await runDom(f.origin, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "https://not-the-checked-origin.test" });
  check("the DOM checker refuses when the authorized origin is not the checked origin (exit 2), before any request", r.code === 2 && f.seen.length === 0 && !leaksText(r.out + r.err), `exit ${r.code}, requests ${f.seen.length}`);
  await f.close();
  const g = await fakeFamilylessSite(30, { cookie: false });
  r = await runDom(g.origin, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: g.origin });
  check("FAIL CLOSED: when the authorized origin sets no bypass cookie, the DOM checker refuses credentialed browser checks (exit 2) after the single bootstrap request, with no credential in any output", r.code === 2 && g.seen.length === 1 && /Set-Cookie/.test(r.err) && !leaksText(r.out + r.err), `exit ${r.code}, requests ${g.seen.length}, stderr ${r.err.slice(0, 120)}`);
  await g.close();
  const h = await fakeFamilylessSite(30, { reflect: true });
  r = await runDom(h.origin, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: h.origin });
  // The DOM checker makes TWO Node requests itself (the bootstrap and the sitemap read), both with the header, pinned to the origin; everything else is the browser.
  const nodeReqs = h.seen.filter((s) => s.headers["user-agent"] === "cha-seo-check/1"), browserReqs = h.seen.filter((s) => s.headers["user-agent"] !== "cha-seo-check/1");
  check("the DOM checker FAILS CLOSED on a sitemap lacking the template families (coverage missing, exit 1)", r.code === 1 && /coverage missing: dynamic-both-languages/.test(r.out) && /coverage missing: blog-post/.test(r.out) && /the sitemap offers a sample of this family/.test(r.out), `exit ${r.code}`);
  check("the DOM checker's coverage inventory reports expected, checked, missing and skipped, and names the credential mode", /expected\s+checked\s+missing\s+skipped/.test(r.out) && /skipped:/.test(r.out) && /credentials: bypass cookie pinned to 127\.0\.0\.1/.test(r.out));
  check("every BROWSER request the DOM checker made to the authorized fake site carried the cookie and none the header; its two Node requests (bootstrap, sitemap) carried the header and no cookie", browserReqs.length > 0 && browserReqs.every((s) => hasCookie(s) && !hasHeader(s)) && nodeReqs.length === 2 && nodeReqs.every((s) => hasHeader(s) && !hasCookie(s)), `browser requests ${browserReqs.length} (without cookie: ${browserReqs.filter((s) => !hasCookie(s)).length}, with header: ${browserReqs.filter(hasHeader).length}); node requests ${nodeReqs.length}`);
  check("a page that REFLECTS the cookie into its canonical and heading does not get it into stdout or stderr (redacted), and the redaction marker proves the path was exercised", /\[redacted\]/.test(r.out) && !leaksText(r.out + r.err), r.out.slice(-300));
  await h.close();
  const u = await fakeFamilylessSite(3);
  r = await runDom(u.origin, {});
  check("the DOM checker FAILS CLOSED on an unusable sitemap (exit 1, coverage missing: sitemap)", r.code === 1 && /coverage missing: sitemap/.test(r.out) && /only 3 URL/.test(r.out), `exit ${r.code}`);
  await u.close();
  const dead = await fakeFamilylessSite(30); const deadOrigin = dead.origin; await dead.close();
  r = await runDom(deadOrigin, {});
  check("a dead origin: the DOM checker reports the failure (exit 1, sitemap fetch failed) instead of hanging or crashing", r.code === 1 && /fetch failed/.test(r.out) && /coverage missing: sitemap/.test(r.out), `exit ${r.code} ${r.out.slice(-200)}`);
}

await Aopen.close(); await Agated.close(); await B.close();
check("neither sentinel appears anywhere in this script's own output", !leaksText(out.join("\n")));
log(`\n${failures.length ? `FAILED: ${failures.length} check(s)` : "all credential-isolation, redirect-semantics and fail-closed checks passed"}`);
process.exitCode = failures.length ? 1 : 0;
