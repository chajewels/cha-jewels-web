// The shared core of the two SEO checkers (scripts/lib/seo-check-core.mjs) and the way the checkers use it:
// credential isolation, fail-closed coverage, sitemap validation, request-origin vs public-origin.
// No browser is needed here (CI-safe): the browser path is proven by scripts/test-seo-check-isolation.mjs.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { join } from "node:path";

const core = await import(join(process.cwd(), "scripts/lib/seo-check-core.mjs"));
const { resolveOrigins, authorizeCredentials, credentialHeadersFor, redact, makeGet, installCredentialRouting, Coverage, validateSitemap, CREDENTIAL_HEADER } = core;

const SENTINEL = `SENTINEL-${Math.random().toString(36).slice(2)}-do-not-leak`;

/** A tiny controlled origin: records every request's headers and answers from `routes`. */
async function origin(routes = {}) {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push({ url: req.url, headers: { ...req.headers } });
    const r = routes[req.url.split("?")[0]];
    if (typeof r === "function") return r(req, res);
    if (r) { res.writeHead(r.status ?? 200, { "content-type": r.type ?? "text/html", ...(r.headers ?? {}) }); return res.end(r.body ?? ""); }
    res.writeHead(404, { "content-type": "text/html" }); res.end("<html><body><h1>404</h1></body></html>");
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, seen, close: () => new Promise((ok) => server.close(ok)), withSecret: () => seen.filter((s) => Object.values(s.headers).some((v) => String(v).includes(SENTINEL))) };
}

// ------------------------------------------------------------------ origins
test("request origin and public origin are separate; the public one defaults to the request origin", () => {
  assert.deepEqual(resolveOrigins("https://www.chajewelsjp.com/", {}), { requestOrigin: "https://www.chajewelsjp.com", publicOrigin: "https://www.chajewelsjp.com" });
  assert.deepEqual(resolveOrigins("https://preview-abc.vercel.app", { SEO_CHECK_PUBLIC_ORIGIN: "https://www.chajewelsjp.com" }), { requestOrigin: "https://preview-abc.vercel.app", publicOrigin: "https://www.chajewelsjp.com" });
  assert.throws(() => resolveOrigins("https://x.test/some/path", {}), /origin, not a path/);
  assert.throws(() => resolveOrigins("https://x.test", { SEO_CHECK_PUBLIC_ORIGIN: "https://www.chajewelsjp.com/en" }), /exact origin/);
});

// ------------------------------------------------------------------ credential authorization
test("no secret: no credentials; a secret with no explicit authorized origin refuses to run", () => {
  assert.equal(authorizeCredentials("https://p.vercel.app", {}).enabled, false);
  assert.throws(() => authorizeCredentials("https://p.vercel.app", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL }), /SEO_CHECK_BYPASS_ORIGIN/);
});

test("the authorized origin must be the exact checked origin, https (or loopback), with no path", () => {
  const e = (o, extra = {}) => ({ VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: o, ...extra });
  const a = authorizeCredentials("https://p.vercel.app", e("https://p.vercel.app"));
  assert.equal(a.enabled, true); assert.equal(a.origin, "https://p.vercel.app"); assert.equal(a.header, CREDENTIAL_HEADER);
  assert.equal(authorizeCredentials("https://p.vercel.app", e("https://p.vercel.app/")).enabled, true, "a trailing slash is tolerated");
  assert.throws(() => authorizeCredentials("https://p.vercel.app", e("https://p.vercel.app/en")), /no path/);
  assert.throws(() => authorizeCredentials("https://p.vercel.app", e("https://www.chajewelsjp.com")), /authorized for .* checked origin/, "an authorization for another origin is refused");
  assert.throws(() => authorizeCredentials("https://q.vercel.app", e("https://p.vercel.app")), /authorized for/, "a different preview is refused");
  assert.throws(() => authorizeCredentials("http://p.example.test", e("http://p.example.test")), /https/, "plain http to a remote host is refused");
  assert.equal(authorizeCredentials("http://127.0.0.1:3000", e("http://127.0.0.1:3000")).enabled, true, "a loopback test origin is allowed");
  assert.throws(() => authorizeCredentials("https://p.vercel.app", e("not a url")), /not a valid URL/);
});

test("no error message ever contains the secret, and redact() removes it from anything printed", () => {
  const attempts = [() => authorizeCredentials("https://p.vercel.app", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL }), () => authorizeCredentials("https://p.vercel.app", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "https://other.test" }), () => authorizeCredentials("http://p.example.test", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "http://p.example.test" })];
  for (const f of attempts) { try { f(); assert.fail("should throw"); } catch (e) { assert.ok(!String(e.message).includes(SENTINEL)); } }
  const auth = authorizeCredentials("https://p.vercel.app", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "https://p.vercel.app" });
  assert.ok(!redact(`header ${SENTINEL} value`, auth).includes(SENTINEL));
});

// ------------------------------------------------------------------ exact-origin header routing
test("the credential header is added for the exact authorized origin and for nothing else", () => {
  const auth = authorizeCredentials("https://p.vercel.app", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "https://p.vercel.app" });
  assert.deepEqual(credentialHeadersFor(auth, "https://p.vercel.app/en/faq?x=1"), { [CREDENTIAL_HEADER]: SENTINEL });
  for (const url of ["https://www.chajewelsjp.com/en", "https://q.vercel.app/", "https://p.vercel.app.evil.test/", "https://evil.test/https://p.vercel.app/", "https://p.vercel.app@evil.test/", "http://p.vercel.app/", "https://p.vercel.app:8443/", "https://sub.p.vercel.app/", "https://connect.facebook.net/en_US/fbevents.js", "data:text/plain,hi", "not a url", ""]) {
    assert.deepEqual(credentialHeadersFor(auth, url), {}, `${url} must get no credentials`);
  }
  assert.deepEqual(credentialHeadersFor({ enabled: false }, "https://p.vercel.app/"), {});
});

test("Playwright routing: other origins are continued untouched; the authorized origin is fetched WITHOUT following redirects, then fulfilled", async () => {
  const auth = authorizeCredentials("http://127.0.0.1:4000", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "http://127.0.0.1:4000" });
  let handler;
  await installCredentialRouting({ route: async (pattern, h) => { assert.equal(pattern, "**/*"); handler = h; } }, auth);
  const calls = [];
  // `answers` maps a URL to the response the fake origin gives for it.
  const fakeRoute = (url, answers = {}) => ({ request: () => ({ url: () => url, headers: () => ({ accept: "text/html" }) }), continue: async (o) => calls.push({ url, kind: "continue", opts: o }), fetch: async (o) => { const u = o.url ?? url; calls.push({ url: u, kind: "fetch", opts: o }); const a = answers[u] ?? { status: 200, headers: {} }; return { status: () => a.status, headers: () => a.headers }; }, fulfill: async (o) => calls.push({ url, kind: "fulfill", opts: o }) });
  // the authorized origin: header added, redirects not followed by the fetch itself
  await handler(fakeRoute("http://127.0.0.1:4000/en"));
  let fetched = calls.filter((c) => c.kind === "fetch");
  assert.equal(fetched.length, 1);
  assert.equal(fetched[0].opts.maxRedirects, 0, "redirects are never followed by the credentialed fetch");
  assert.equal(fetched[0].opts.headers[CREDENTIAL_HEADER], SENTINEL);
  assert.equal(calls.filter((c) => c.kind === "fulfill").length, 1);
  // a redirect that stays on the authorized origin is followed inside the router: EVERY hop carries the header
  calls.length = 0;
  await handler(fakeRoute("http://127.0.0.1:4000/a", { "http://127.0.0.1:4000/a": { status: 302, headers: { location: "/b" } }, "http://127.0.0.1:4000/b": { status: 302, headers: { location: "http://127.0.0.1:4000/c" } } }));
  fetched = calls.filter((c) => c.kind === "fetch");
  assert.deepEqual(fetched.map((c) => c.url), ["http://127.0.0.1:4000/a", "http://127.0.0.1:4000/b", "http://127.0.0.1:4000/c"]);
  assert.ok(fetched.every((c) => c.opts.headers[CREDENTIAL_HEADER] === SENTINEL && c.opts.maxRedirects === 0));
  // a redirect to ANOTHER origin is NOT followed: the 3xx goes back to the browser and no request to the other origin is made here
  calls.length = 0;
  await handler(fakeRoute("http://127.0.0.1:4000/out", { "http://127.0.0.1:4000/out": { status: 302, headers: { location: "http://127.0.0.1:4001/landing" } } }));
  fetched = calls.filter((c) => c.kind === "fetch");
  assert.deepEqual(fetched.map((c) => c.url), ["http://127.0.0.1:4000/out"], "the other origin is never fetched with the header");
  assert.equal(calls.filter((c) => c.kind === "fulfill").length, 1);
  // a same-origin redirect loop is bounded
  calls.length = 0;
  await handler(fakeRoute("http://127.0.0.1:4000/loop", { "http://127.0.0.1:4000/loop": { status: 302, headers: { location: "/loop" } } }));
  assert.ok(calls.filter((c) => c.kind === "fetch").length <= 11);
  assert.equal(calls.filter((c) => c.kind === "fulfill").length, 1);
  // every other origin (a subresource, a tracker, a redirect target): no fetch, no header, plain continue
  for (const other of ["http://127.0.0.1:4001/s.js", "https://connect.facebook.net/en_US/fbevents.js", "https://www.googletagmanager.com/gtag/js", "http://127.0.0.1:4000.evil.test/x"]) {
    calls.length = 0;
    await handler(fakeRoute(other));
    assert.deepEqual(calls.map((c) => c.kind), ["continue"], other);
    assert.equal(calls[0].opts, undefined, "continued with NO header overrides");
  }
});

test("source guard: neither checker uses context-wide extraHTTPHeaders (it would put the secret on every request)", async () => {
  const { readFileSync } = await import("node:fs");
  for (const f of ["scripts/check-seo-dom.mjs", "scripts/check-seo-live.mjs", "scripts/lib/seo-check-core.mjs"]) {
    // code only: whole-line comments and trailing comments are not usage
    const src = readFileSync(join(process.cwd(), f), "utf8").split("\n").filter((l) => !l.trim().startsWith("//")).map((l) => l.replace(/\s\/\/.*$/, "")).join("\n");
    assert.doesNotMatch(src, /extraHTTPHeaders\s*:/, `${f} must not set extraHTTPHeaders`);
    assert.doesNotMatch(src, /setExtraHTTPHeaders/, `${f} must not set extra headers on a page or context`);
  }
});

// ------------------------------------------------------------------ the raw-HTML getter: two controlled origins
test("makeGet: the header reaches the authorized origin only; a redirect to another origin is NOT followed; a request leaving the origin is refused", async () => {
  const B = await origin({ "/landing": { body: "B landing" } });
  const A = await origin({ "/ok": { body: "ok" }, "/redirect-out": { status: 302, headers: { location: `${B.url}/landing` } } });
  try {
    const auth = authorizeCredentials(A.url, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: A.url });
    const get = makeGet(A.url, auth);
    const ok = await get("/ok");
    assert.equal(ok.status, 200);
    assert.equal(A.seen.at(-1).headers[CREDENTIAL_HEADER], SENTINEL, "positive control: the authorized origin receives the header");
    const r = await get("/redirect-out");
    assert.equal(r.status, 302); assert.equal(r.location, `${B.url}/landing`, "the Location is returned, not followed");
    assert.equal(B.seen.length, 0, "the other origin received no request at all");
    await assert.rejects(() => get(`//127.0.0.1:${new URL(B.url).port}/landing`), /not a site path/);
    await assert.rejects(() => get(`${B.url}/landing`), /not a site path/);
    assert.equal(B.seen.length, 0);
    assert.equal(B.withSecret().length, 0);
  } finally { await A.close(); await B.close(); }
});

// ------------------------------------------------------------------ coverage ledger
test("coverage fails closed: an unmet requirement is MISSING; a skip is listed but does not satisfy a required one", () => {
  const c = new Coverage();
  c.expect("a", "a thing", 3).expect("b", "another", 1).expect("opt", "optional thing", 1, { optional: true }).expect("opt2", "optional but silent", 1, { optional: true });
  c.hit("a", 2); c.hit("b"); c.skip("opt", "none in this deployment");
  const f = c.failures().map((r) => r.key).sort();
  assert.deepEqual(f, ["a", "opt2"], "a is short by one; opt2 was neither checked nor skipped with a reason");
  c.skip("a", "could not run"); assert.ok(c.failures().some((r) => r.key === "a"), "a skip never satisfies a required requirement");
  c.hit("a"); c.hit("opt2");
  assert.deepEqual(c.failures(), []);
  const inv = c.inventory();
  for (const word of ["expected", "checked", "missing", "skipped", "none in this deployment"]) assert.match(inv, new RegExp(word));
  assert.throws(() => c.hit("undeclared"), /never declared/);
});

// ------------------------------------------------------------------ sitemap validation
test("validateSitemap rejects every way a sitemap can be unusable", () => {
  const urls = (n, origin = "https://www.chajewelsjp.com") => Array.from({ length: n }, (_, i) => `<url><loc>${origin}/en/p${i}</loc></url>`).join("");
  const good = { status: 200, contentType: "application/xml", body: `<?xml version="1.0"?><urlset>${urls(25)}</urlset>` };
  const opts = { publicOrigin: "https://www.chajewelsjp.com", minUrls: 20 };
  assert.deepEqual(validateSitemap(good, opts).problems, []);
  assert.equal(validateSitemap(good, opts).paths.length, 25);
  const bad = (patch) => validateSitemap({ ...good, ...patch }, opts).problems.join("|");
  assert.match(bad({ status: 500 }), /status 500/);
  assert.match(bad({ contentType: "text/html" }), /not XML/);
  assert.match(bad({ body: "<html>oops</html>" }), /no <urlset>/);
  assert.match(bad({ body: `<urlset>${urls(3)}</urlset>` }), /only 3 URL/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/p1</loc></url></urlset>` }), /duplicate/);
  assert.match(bad({ body: `<urlset>${urls(25, "https://preview.vercel.app")}</urlset>` }), /expected the public origin/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>/en/relative</loc></url></urlset>` }), /not an absolute URL/);
  assert.match(bad({ status: 200, body: "" }), /no <urlset>/);
});

// ------------------------------------------------------------------ the real checker against controlled fake sites
const run = (args, env) => new Promise((resolve) => {
  const p = spawn(process.execPath, [join(process.cwd(), "scripts/check-seo-live.mjs"), ...args], { env: { PATH: process.env.PATH, ...env }, cwd: process.cwd() });
  let out = ""; p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d));
  p.on("close", (code) => resolve({ code, out }));
});
const fakeSitemap = (origin, n, prefix = "/en/page") => `<?xml version="1.0"?><urlset>${Array.from({ length: n }, (_, i) => `<url><loc>${origin}${prefix}${i}</loc></url>`).join("")}</urlset>`;

/** A fake site whose sitemap lists `n` URLs under `prefix` on ITS OWN origin; everything else is a 404. */
async function fakeSite(n, prefix = "/en/static") {
  const server = http.createServer((q, s) => {
    if (q.url === "/sitemap.xml") { s.writeHead(200, { "content-type": "application/xml" }); s.end(fakeSitemap(`http://127.0.0.1:${server.address().port}`, n, prefix)); }
    else { s.writeHead(404, { "content-type": "text/html" }); s.end("<h1>404</h1>"); }
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((ok) => server.close(ok)) };
}

test("the raw checker FAILS CLOSED on an unusable sitemap, reporting expected, checked, missing and skipped coverage", async () => {
  const site = await fakeSite(3);                    // far too few URLs
  try {
    const r = await run([site.url], {});
    assert.equal(r.code, 1, "an unusable sitemap fails the run");
    assert.match(r.out, /valid: status 200, XML, a urlset, enough URLs/);
    assert.match(r.out, /only 3 URL/);
    assert.match(r.out, /coverage missing: sitemap/);
    assert.match(r.out, /coverage missing: dynamic-both-languages/);
    assert.match(r.out, /coverage inventory/);
    assert.match(r.out, /expected\s+checked\s+missing\s+skipped/);
  } finally { await site.close(); }
});

test("the raw checker FAILS CLOSED when a well-formed sitemap lacks the expected template families (no product, collection, category or post)", async () => {
  const site = await fakeSite(30);                   // a valid sitemap, but only /en/static0.. : no families
  try {
    const r = await run([site.url], {});
    assert.equal(r.code, 1);
    assert.match(r.out, /the sitemap offers a sample of this family/);
    assert.match(r.out, /coverage missing: dynamic-both-languages/);
    assert.match(r.out, /coverage missing: blog-post/);
    assert.match(r.out, /a known static template is listed in the sitemap in this language/);   // a FAIL row per template (attempted, absent), not silence
    assert.match(r.out, /a known template answers HTTP 200/);
  } finally { await site.close(); }
});

test("credentials: a secret with no authorized origin makes NO request and prints no secret; with an authorized loopback origin only that origin receives it and the output never contains it", async () => {
  const A = await origin({ "/sitemap.xml": { type: "application/xml", body: fakeSitemap("http://127.0.0.1:1", 3) } });
  try {
    let r = await run([A.url], { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL });
    assert.equal(r.code, 2, "refuses to run");
    assert.equal(A.seen.length, 0, "no request was made before the refusal");
    assert.ok(!r.out.includes(SENTINEL));
    r = await run([A.url], { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "https://elsewhere.test" });
    assert.equal(r.code, 2); assert.equal(A.seen.length, 0); assert.ok(!r.out.includes(SENTINEL));
    r = await run([A.url], { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: A.url });
    assert.equal(r.code, 1, "the fake site is not a real site, so the run fails, but it runs");
    assert.ok(A.seen.length > 0 && A.seen.every((s) => s.headers[CREDENTIAL_HEADER] === SENTINEL), "every request to the authorized origin carries the header");
    assert.ok(!r.out.includes(SENTINEL), "the secret is never printed");
  } finally { await A.close(); }
});

test("source guard: the checkers separate request origin from public origin and declare their coverage", async () => {
  const { readFileSync } = await import("node:fs");
  const live = readFileSync(join(process.cwd(), "scripts/check-seo-live.mjs"), "utf8");
  const dom = readFileSync(join(process.cwd(), "scripts/check-seo-dom.mjs"), "utf8");
  for (const [name, src] of [["live", live], ["dom", dom]]) {
    assert.match(src, /PUBLIC_ORIGIN/, `${name}: expected canonical values use the public origin`);
    assert.match(src, /resolveOrigins\(BASE\)/);
    assert.match(src, /validateSitemap\(/);
    assert.match(src, /new Coverage\(\)/);
    assert.match(src, /cov\.failures\(\)/, `${name}: unmet coverage fails the run`);
  }
  assert.match(dom, /installCredentialRouting\(context, AUTH\)/);
  const waits = [...dom.matchAll(/waitForTimeout\(([^)]*)\)/g)].map((m) => m[1].trim());
  assert.deepEqual(waits, ["100"], "the only wait is the 100 ms poll inside the bounded settle(); no fixed-delay-only acceptance");
  assert.match(dom, /SETTLE_MS = 10000/);
});
