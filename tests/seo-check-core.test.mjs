// The shared core of the SEO checkers (scripts/lib/seo-check-core.mjs) and the way the checkers use it:
// credential isolation and failure-path sanitization, fail-closed coverage, sitemap validation (including
// malformed XML), request-origin vs public-origin, and parity of the two checkers' route matrix.
// No browser is needed here (CI-safe): the browser path is proven by scripts/test-seo-check-isolation.mjs.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const core = await import(join(process.cwd(), "scripts/lib/seo-check-core.mjs"));
const { resolveOrigins, authorizeCredentials, credentialHeadersFor, redact, describeFailure, makeGet, bootstrapBrowserCredentials, installBrowserCredentials, Coverage, validateSitemap, sitemapWellFormedness, xmlBalance, FOUNDATION_MATRIX, CREDENTIAL_HEADER, SET_COOKIE_HEADER, MIN_CREDENTIAL_LENGTH } = core;

const SENTINEL = `SENTINEL-${Math.random().toString(36).slice(2)}-do-not-leak`;
const COOKIE_SENTINEL = `COOKIE-${Math.random().toString(36).slice(2)}-do-not-leak`;
const src = (f) => readFileSync(join(process.cwd(), f), "utf8");
const codeOnly = (text) => text.split("\n").filter((l) => !l.trim().startsWith("//")).map((l) => l.replace(/\s\/\/.*$/, "")).join("\n");

/** A tiny controlled origin: records every request's headers and answers from `routes` (a function may handle the raw req/res). */
async function origin(routes = {}, { host = "127.0.0.1" } = {}) {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push({ url: req.url, headers: { ...req.headers } });
    const r = routes[req.url.split("?")[0]];
    if (typeof r === "function") return r(req, res);
    if (r) { res.writeHead(r.status ?? 200, { "content-type": r.type ?? "text/html", ...(r.headers ?? {}) }); return res.end(r.body ?? ""); }
    res.writeHead(404, { "content-type": "text/html" }); res.end("<html><body><h1>404</h1></body></html>");
  });
  await new Promise((ok) => server.listen(0, host, ok));
  const url = `http://${host}:${server.address().port}`;
  return { url, seen, close: () => new Promise((ok) => server.close(ok)), withSecret: () => seen.filter((s) => Object.values(s.headers).some((v) => String(v).includes(SENTINEL) || String(v).includes(COOKIE_SENTINEL))) };
}
const authFor = (o) => authorizeCredentials(o, { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: o });

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
  const e = (o) => ({ VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: o });
  const a = authorizeCredentials("https://p.vercel.app", e("https://p.vercel.app"));
  assert.equal(a.enabled, true); assert.equal(a.origin, "https://p.vercel.app"); assert.equal(a.host, "p.vercel.app"); assert.equal(a.secure, true); assert.equal(a.header, CREDENTIAL_HEADER);
  assert.equal(authorizeCredentials("https://p.vercel.app", e("https://p.vercel.app/")).enabled, true, "a trailing slash is tolerated");
  assert.throws(() => authorizeCredentials("https://p.vercel.app", e("https://p.vercel.app/en")), /no path/);
  assert.throws(() => authorizeCredentials("https://p.vercel.app", e("https://www.chajewelsjp.com")), /authorized for .* checked origin/);
  assert.throws(() => authorizeCredentials("https://q.vercel.app", e("https://p.vercel.app")), /authorized for/);
  assert.throws(() => authorizeCredentials("http://p.example.test", e("http://p.example.test")), /https/);
  assert.equal(authorizeCredentials("http://127.0.0.1:3000", e("http://127.0.0.1:3000")).secure, false, "a loopback test origin is allowed, as a non-secure cookie host");
  assert.throws(() => authorizeCredentials("https://p.vercel.app", e("not a url")), /not a valid URL/);
});

test("no authorization error ever contains the secret; redact() removes the secret AND every bootstrapped cookie value; describeFailure() never carries a credential", () => {
  for (const f of [() => authorizeCredentials("https://p.vercel.app", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL }), () => authorizeCredentials("https://p.vercel.app", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "https://other.test" }), () => authorizeCredentials("http://p.example.test", { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "http://p.example.test" })]) {
    try { f(); assert.fail("should throw"); } catch (e) { assert.ok(!String(e.message).includes(SENTINEL)); }
  }
  const auth = authFor("https://p.vercel.app");
  auth.secrets.push(COOKIE_SENTINEL);
  const out = redact(`header ${SENTINEL} value and cookie ${COOKIE_SENTINEL}=x`, auth);
  assert.ok(!out.includes(SENTINEL) && !out.includes(COOKIE_SENTINEL) && out.includes("[redacted]"));
  const err = new Error(`fetch failed: header ${SENTINEL}`); err.cause = { code: `ECONN-${COOKIE_SENTINEL}` };
  const d = describeFailure(err, auth);
  assert.ok(!d.includes(SENTINEL) && !d.includes(COOKIE_SENTINEL) && d.length <= 300 && !/\n/.test(d));
  const to = new Error("The operation was aborted due to timeout"); to.name = "TimeoutError";
  assert.match(describeFailure(to, auth), /timeout/);
});

test("redaction: every accepted credential is removed whatever its length, longest first, and BEFORE truncation (no partial credential survives a cut)", () => {
  const auth = authFor("https://p.vercel.app");
  const short = "abcdefgh";                                   // exactly the minimum length
  const longer = `${SENTINEL}-tail-${COOKIE_SENTINEL}`;       // contains two other credentials
  auth.secrets.push(COOKIE_SENTINEL, short, longer);
  const out = redact(`a ${longer} b ${SENTINEL} c ${COOKIE_SENTINEL} d ${short} e`, auth);
  for (const v of [SENTINEL, COOKIE_SENTINEL, short]) assert.ok(!out.includes(v), v);
  assert.equal(out, "a [redacted] b [redacted] c [redacted] d [redacted] e", "the longest value is removed whole, not as pieces around the shorter ones");
  // truncation boundary: a credential straddling the 300-character cut of describeFailure must not leak a prefix
  const pad = "x".repeat(300 - 10);
  const d = describeFailure(new Error(`${pad}${SENTINEL} after`), auth);
  assert.ok(d.length <= 300);
  for (let i = 0; i + 6 <= SENTINEL.length; i++) assert.ok(!d.includes(SENTINEL.slice(i, i + 6)), `a 6-character piece of the secret survived the cut: ${SENTINEL.slice(i, i + 6)}`);
  const e2 = new Error("boom"); e2.cause = { code: `${pad}${COOKIE_SENTINEL}` };
  const d2 = describeFailure(e2, auth);
  for (let i = 0; i + 6 <= COOKIE_SENTINEL.length; i++) assert.ok(!d2.includes(COOKIE_SENTINEL.slice(i, i + 6)), "the cause is redacted before it is joined and cut");
});

test("short credentials are refused before use (secret and bypass cookie), with no value in the message, so nothing accepted is ever un-redactable", async () => {
  const tooShort = "abc1234";
  assert.equal(tooShort.length, MIN_CREDENTIAL_LENGTH - 1);
  assert.throws(() => authorizeCredentials("https://p.vercel.app", { VERCEL_AUTOMATION_BYPASS_SECRET: tooShort, SEO_CHECK_BYPASS_ORIGIN: "https://p.vercel.app" }), (e) => { assert.match(e.message, /shorter than 8/); assert.ok(!e.message.includes(tooShort)); return true; });
  assert.equal(authorizeCredentials("https://p.vercel.app", { VERCEL_AUTOMATION_BYPASS_SECRET: "abc12345", SEO_CHECK_BYPASS_ORIGIN: "https://p.vercel.app" }).enabled, true, "exactly the minimum is accepted");
  const A = await origin({ "/": (req, res) => { res.writeHead(307, { location: "/", "set-cookie": `_fake_bypass=${tooShort}; Path=/` }); res.end(); } });
  try {
    await assert.rejects(() => bootstrapBrowserCredentials(authFor(A.url)), (e) => { assert.match(e.message, /shorter than 8/); assert.ok(!e.message.includes(tooShort)); return true; });
  } finally { await A.close(); }
});

// ------------------------------------------------------------------ exact-origin header (raw checker)
test("the credential header is added for the exact authorized origin and for nothing else", () => {
  const auth = authFor("https://p.vercel.app");
  assert.deepEqual(credentialHeadersFor(auth, "https://p.vercel.app/en/faq?x=1"), { [CREDENTIAL_HEADER]: SENTINEL });
  for (const url of ["https://www.chajewelsjp.com/en", "https://q.vercel.app/", "https://p.vercel.app.evil.test/", "https://evil.test/https://p.vercel.app/", "https://p.vercel.app@evil.test/", "http://p.vercel.app/", "https://p.vercel.app:8443/", "https://sub.p.vercel.app/", "https://connect.facebook.net/en_US/fbevents.js", "data:text/plain,hi", "not a url", ""]) {
    assert.deepEqual(credentialHeadersFor(auth, url), {}, `${url} must get no credentials`);
  }
  assert.deepEqual(credentialHeadersFor({ enabled: false }, "https://p.vercel.app/"), {});
});

test("makeGet: the header reaches the authorized origin only; a redirect to another origin is NOT followed; a request leaving the origin is refused", async () => {
  const B = await origin({ "/landing": { body: "B landing" } });
  const A = await origin({ "/ok": { body: "ok" }, "/redirect-out": { status: 302, headers: { location: `${B.url}/landing` } } });
  try {
    const get = makeGet(A.url, authFor(A.url));
    const ok = await get("/ok");
    assert.equal(ok.status, 200);
    assert.equal(A.seen.at(-1).headers[CREDENTIAL_HEADER], SENTINEL, "positive control: the authorized origin receives the header");
    const r = await get("/redirect-out");
    assert.equal(r.status, 302); assert.equal(r.location, `${B.url}/landing`, "the Location is returned, not followed");
    assert.equal(B.seen.length, 0, "the other origin received no request at all");
    await assert.rejects(() => get(`//127.0.0.1:${new URL(B.url).port}/landing`), /not a site path/);
    await assert.rejects(() => get(`${B.url}/landing`), /not a site path/);
    assert.equal(B.withSecret().length, 0);
  } finally { await A.close(); await B.close(); }
});

// ------------------------------------------------------------------ failure paths: timeout, disconnect, reflected error
test("makeGet never throws for a network failure and never carries a credential: timeout, dropped connection, refused socket, reflected error body and Location", async () => {
  const A = await origin({
    "/hang": (req) => { req.socket.setTimeout(0); },
    "/drop": (req) => { req.socket.destroy(); },
    "/reflect": (req, res) => { res.writeHead(500, { "content-type": "text/html" }); res.end(`<html><body>bad gateway: header was ${req.headers[CREDENTIAL_HEADER]}</body></html>`); },
    "/reflect-location": (req, res) => { res.writeHead(302, { location: `/sso?token=${req.headers[CREDENTIAL_HEADER]}` }); res.end(); },
  });
  const auth = authFor(A.url);
  try {
    const get = makeGet(A.url, auth, { timeoutMs: 400 });
    const t = await get("/hang");
    assert.equal(t.status, 0); assert.match(t.error, /timeout/); assert.ok(!t.error.includes(SENTINEL));
    const d = await get("/drop");
    assert.equal(d.status, 0); assert.ok(d.error && !d.error.includes(SENTINEL), d.error);
    const closed = await origin(); const closedUrl = closed.url; await closed.close();
    const refused = await makeGet(closedUrl, authFor(closedUrl), { timeoutMs: 400 })("/");
    assert.equal(refused.status, 0); assert.ok(!refused.error.includes(SENTINEL));
    const r = await get("/reflect");
    assert.ok(r.body.includes(SENTINEL), "the fake server really reflected it");
    assert.ok(!redact(r.body, auth).includes(SENTINEL));
    const l = await get("/reflect-location");
    assert.ok(l.location.includes(SENTINEL) && !redact(`got ${l.status} ${l.location}`, auth).includes(SENTINEL));
  } finally { await A.close(); }
});

// ------------------------------------------------------------------ browser credentials: a cookie, never a header
test("bootstrapBrowserCredentials: ONE request with the secret and x-vercel-set-bypass-cookie, no redirect followed; the cookie is pinned to the authorized host; its value becomes a redacted secret", async () => {
  let bootstrapRequests = 0;
  const A = await origin({
    "/": (req, res) => {
      if (req.headers[CREDENTIAL_HEADER] === SENTINEL && req.headers[SET_COOKIE_HEADER] === "true") {
        bootstrapRequests++;
        res.writeHead(307, { location: "/", "set-cookie": [`_fake_bypass=${COOKIE_SENTINEL}; Domain=evil.example; Path=/admin; HttpOnly; SameSite=Lax`, "other=long-enough-1; Path=/"] });
        return res.end();
      }
      res.writeHead(401, { "content-type": "text/html" }); res.end("gated");
    },
  });
  try {
    const auth = authFor(A.url);
    const cookies = await bootstrapBrowserCredentials(auth);
    assert.equal(bootstrapRequests, 1);
    assert.equal(A.seen.length, 1, "exactly one request, the redirect is not followed");
    assert.deepEqual(cookies.map((c) => ({ name: c.name, domain: c.domain, path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite })), [
      { name: "_fake_bypass", domain: "127.0.0.1", path: "/", secure: false, httpOnly: true, sameSite: "Lax" },
      { name: "other", domain: "127.0.0.1", path: "/", secure: false, httpOnly: false, sameSite: "Lax" },
    ], "the server's Domain and Path attributes are ignored: scoped to the authorized host (host-only), path /");
    assert.equal(cookies[0].value, COOKIE_SENTINEL);
    assert.ok(auth.secrets.includes(COOKIE_SENTINEL), "the cookie value is now a credential redact() removes");
    assert.ok(!redact(`cookie ${COOKIE_SENTINEL}`, auth).includes(COOKIE_SENTINEL));
    const calls = [];
    await installBrowserCredentials({ addCookies: async (c) => calls.push(c), route: () => { throw new Error("must not route"); }, setExtraHTTPHeaders: () => { throw new Error("must not set headers"); } }, cookies);
    assert.equal(calls.length, 1); assert.equal(calls[0], cookies);
    await installBrowserCredentials({ addCookies: async () => { throw new Error("must not be called"); } }, []);
    assert.deepEqual(await bootstrapBrowserCredentials({ enabled: false }), [], "no credentials: nothing happens");
  } finally { await A.close(); }
});

test("bootstrapBrowserCredentials FAILS CLOSED: no Set-Cookie, a non-success status, a timeout or a dropped connection refuse credentialed browser checks, with no credential in the message", async () => {
  const A = await origin({
    "/": (req, res) => { res.writeHead(307, { location: "/" }); res.end(); },
    "/401": (req, res) => { res.writeHead(401, { "set-cookie": `x=${COOKIE_SENTINEL}` }); res.end(); },
    "/hang": (req) => { req.socket.setTimeout(0); },
    "/drop": (req) => { req.socket.destroy(); },
  });
  try {
    for (const [path, re] of [["/", /Set-Cookie/], ["/401", /status 401/], ["/hang", /timeout/], ["/drop", /refusing credentialed browser checks/]]) {
      const auth = authFor(A.url);
      await assert.rejects(() => bootstrapBrowserCredentials(auth, { path, timeoutMs: 400 }), (e) => { assert.match(e.message, re); assert.ok(!e.message.includes(SENTINEL) && !e.message.includes(COOKIE_SENTINEL)); return true; }, path);
    }
  } finally { await A.close(); }
});

test("source guard: no checker uses context-wide headers or request interception; the browser gets only pinned cookies; the secret is never given to the browser; no diagnostics are saved to disk", () => {
  for (const f of ["scripts/check-seo-dom.mjs", "scripts/check-seo-live.mjs", "scripts/check-seo-rollback.mjs", "scripts/lib/seo-check-core.mjs"]) {
    const s = codeOnly(src(f));
    assert.doesNotMatch(s, /extraHTTPHeaders\s*:/, `${f} must not set extraHTTPHeaders`);
    assert.doesNotMatch(s, /setExtraHTTPHeaders/, f);
    assert.doesNotMatch(s, /\.route\(/, `${f} must not intercept requests`);
    assert.doesNotMatch(s, /writeFile|appendFile|createWriteStream/, `${f} saves no diagnostics to disk (if it ever does, they must go through redact())`);
  }
  const dom = codeOnly(src("scripts/check-seo-dom.mjs"));
  assert.match(dom, /installBrowserCredentials\(context, COOKIES\)/);
  assert.match(dom, /redactConsole\(AUTH\)/);
  assert.doesNotMatch(dom, /auth\.secret\b|AUTH\.secret\b/, "the DOM checker never touches the secret itself");
  for (const f of ["scripts/check-seo-live.mjs", "scripts/check-seo-rollback.mjs"]) assert.match(codeOnly(src(f)), /redactConsole\(AUTH\)/, `${f} redacts everything it prints`);
});

// ------------------------------------------------------------------ coverage ledger
test("coverage fails closed: an unmet requirement is MISSING; a skip is listed but does not satisfy a required one", () => {
  const c = new Coverage();
  c.expect("a", "a thing", 3).expect("b", "another", 1).expect("opt", "optional thing", 1, { optional: true }).expect("opt2", "optional but silent", 1, { optional: true });
  c.hit("a", 2); c.hit("b"); c.skip("opt", "none in this deployment");
  assert.deepEqual(c.failures().map((r) => r.key).sort(), ["a", "opt2"]);
  c.skip("a", "could not run"); assert.ok(c.failures().some((r) => r.key === "a"), "a skip never satisfies a required requirement");
  c.hit("a"); c.hit("opt2");
  assert.deepEqual(c.failures(), []);
  for (const word of ["expected", "checked", "missing", "skipped", "none in this deployment"]) assert.match(c.inventory(), new RegExp(word));
  assert.throws(() => c.hit("undeclared"), /never declared/);
});

// ------------------------------------------------------------------ sitemap validation, malformed XML included
const urls = (n, o = "https://www.chajewelsjp.com", prefix = "/en/p") => Array.from({ length: n }, (_, i) => `<url><loc>${o}${prefix}${i}</loc></url>`).join("");
test("validateSitemap rejects every way a sitemap can be unusable, malformed XML included", () => {
  const good = { status: 200, contentType: "application/xml", body: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls(25)}</urlset>` };
  const opts = { publicOrigin: "https://www.chajewelsjp.com", minUrls: 20 };
  assert.deepEqual(validateSitemap(good, opts).problems, []);
  assert.equal(validateSitemap(good, opts).paths.length, 25);
  assert.deepEqual(validateSitemap({ ...good, body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/img</loc><image:image><image:loc>https://cdn.test/a.jpg</image:loc></image:image></url></urlset>` }, opts).problems, [], "namespaced children inside <url> are fine");
  const bad = (patch) => validateSitemap({ ...good, ...patch }, opts).problems.join("|");
  assert.match(bad({ status: 500 }), /status 500/);
  assert.match(bad({ status: 0, error: "timeout", body: "" }), /fetch failed: timeout/);
  assert.match(bad({ contentType: "text/html" }), /not XML/);
  assert.match(bad({ body: "<html>oops</html>" }), /does not start with <urlset>/);
  assert.match(bad({ body: `<urlset>${urls(3)}</urlset>` }), /only 3 URL/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/p1</loc></url></urlset>` }), /duplicate/);
  assert.match(bad({ body: `<urlset>${urls(25, "https://preview.vercel.app")}</urlset>` }), /expected the public origin/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>/en/relative</loc></url></urlset>` }), /not an absolute URL/);
  assert.match(bad({ status: 200, body: "" }), /does not start with <urlset>/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/cut` }), /does not end with <\/urlset>/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url></url></urlset>` }), /has 0 <loc>/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc></loc></url></urlset>` }), /empty <loc>/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/a</loc><loc>https://www.chajewelsjp.com/en/b</loc></url></urlset>` }), /has 2 <loc>/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/a?x=1&y=2</loc></url></urlset>` }), /unescaped &/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/a<b></loc></url></urlset>` }), /markup inside <loc>/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/a</loc></urlset>` }), /mismatched closing tag <\/urlset> \(open: <url>\)/);
  assert.match(bad({ body: `<urlset>${urls(25)}<loc>https://www.chajewelsjp.com/en/stray</loc></urlset>` }), /unexpected content between <url>/);
  assert.match(bad({ body: `garbage<urlset>${urls(25)}</urlset>` }), /does not start with <urlset>/);
  assert.deepEqual(sitemapWellFormedness(`﻿<?xml version="1.0" encoding="UTF-8"?>\n<!-- c -->\n<urlset>${urls(2)}</urlset>\n`), [], "BOM, declaration, comment and trailing newline are fine");
  // malformed XML: unclosed or mismatched nested elements and malformed attributes
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/i</loc><image:image><image:loc>https://cdn.test/a.jpg</image:loc></url></urlset>` }), /mismatched closing tag <\/url> \(open: <image:image>\)/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/a</url></loc></urlset>` }), /mismatched closing tag/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url foo=bar><loc>https://www.chajewelsjp.com/en/a</loc></url></urlset>` }), /malformed tag/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url hidden><loc>https://www.chajewelsjp.com/en/a</loc></url></urlset>` }), /malformed tag/);
  assert.match(bad({ body: `<urlset>${urls(25)}<url><loc>https://www.chajewelsjp.com/en/a</loc>< /url></urlset>` }), /malformed tag or stray/);
  assert.match(bad({ body: `<urlset>${urls(25)}<video:video><video:title>t</video:video></urlset>` }), /mismatched closing tag <\/video:video> \(open: <video:title>\)/);
  // valid sitemap extensions are preserved
  const ext = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${urls(25)}<url><loc>https://www.chajewelsjp.com/en/x</loc><lastmod>2026-10-31</lastmod><xhtml:link rel="alternate" hreflang="ja" href="https://www.chajewelsjp.com/ja/x"/><image:image><image:loc>https://cdn.test/a.jpg</image:loc><image:title>A &amp; B</image:title></image:image><video:video><video:thumbnail_loc>https://cdn.test/t.jpg</video:thumbnail_loc><video:title>T</video:title></video:video></url></urlset>`;
  assert.deepEqual(validateSitemap({ ...good, body: ext }, opts).problems, [], "image, video and xhtml:link extensions, self-closing elements and entities pass");
  assert.deepEqual(xmlBalance(`<a><b x="1" y='2'/><c>t</c></a>`), []);
  assert.deepEqual(xmlBalance(`<a><![CDATA[ <not a tag> ]]><!-- <x> --></a>`), []);
});

// ------------------------------------------------------------------ the route matrix and checker parity
test("both checkers take every route list from FOUNDATION_MATRIX and declare the same coverage keys (the DOM checker adds only client-navigation)", () => {
  const live = codeOnly(src("scripts/check-seo-live.mjs")), dom = codeOnly(src("scripts/check-seo-dom.mjs"));
  for (const [name, s] of [["live", live], ["dom", dom]]) {
    assert.match(s, /FOUNDATION_MATRIX as M/, `${name} imports the matrix`);
    for (const key of ["M.staticTemplates", "M.unlistedByPolicy", "M.notFoundShapes", "M.gatedDescendants", "M.privatePages", "M.queryCases", "M.layaway", "M.FB_ID"]) assert.ok(s.includes(key), `${name} uses ${key}`);
    assert.doesNotMatch(s, /"\/products\/x\/y"|"\/cart\/zzz"|"812262777044447"|"\/account\/missing"/, `${name} has no private copy of a matrix entry`);
    assert.match(s, /PUBLIC_ORIGIN/); assert.match(s, /resolveOrigins\(BASE\)/); assert.match(s, /validateSitemap\(/); assert.match(s, /new Coverage\(\)/); assert.match(s, /cov\.failures\(\)/);
  }
  const keys = (s) => [...s.matchAll(/cov\.expect\("([^"]+)"/g)].map((m) => m[1]).sort();
  const liveKeys = keys(live), domKeys = keys(dom);
  assert.deepEqual(domKeys.filter((k) => k !== "client-navigation"), liveKeys, "parity: the same FOUNDATION coverage keys in both checkers");
  assert.ok(domKeys.includes("client-navigation"));
  assert.match(dom, /M\.navTargets/);
  const m = FOUNDATION_MATRIX;
  assert.ok(m.notFoundShapes.length >= 60 && new Set(m.notFoundShapes).size === m.notFoundShapes.length, "no duplicate 404 shape");
  for (const p of ["/products/x/y", "/collections/x/y", "/categories/x/y", "/blog/x/y", "/legal/missing", "/legal/missing/deeper", "/en/products/x/y", "/ja/legal/missing/deeper", `/products/${m.missingMarker}`, `/en/products/${m.missingMarker}`, "/ja/layaway", "/en/cart", "/fr/about", "/cart/zzz"]) assert.ok(m.notFoundShapes.includes(p), p);
  assert.ok(m.staticTemplates.includes("/collections") && m.unlistedByPolicy.includes("/collections"));
  assert.equal(m.layaway.absent, "ja");
  assert.ok(Object.isFrozen(m));
});

test("DOM checker readiness: the expected path is enforced on every load, the settle signature tracks metadata VALUES, and the only wait is the bounded poll", () => {
  const dom = codeOnly(src("scripts/check-seo-dom.mjs"));
  assert.match(dom, /s\.path === expectPath/, "settle() requires the expected path");
  assert.match(dom, /expectPath: expectPath \?\? path\.split\("\?"\)\[0\]/, "ordinary loads expect their own path");
  assert.match(dom, /expectPath: "\/login"/, "gated loads expect /login");
  for (const v of ['canonical: q(\'link[rel="canonical"]\')', 'og: q(\'meta[property="og:url"]\')', 'fb: q(\'meta[property="fb:app_id"]\')', 'robots: q(\'meta[name="robots"]\')', "title: document.title"]) assert.ok(dom.includes(v), `signature tracks ${v.slice(0, 24)}`);
  assert.match(dom, /hreflang: \[\.\.\.document\.querySelectorAll\('link\[rel="alternate"\]\[hreflang\]'\)\]\.map\(\(e\) => `\$\{e\.getAttribute\("hreflang"\)\}=\$\{e\.getAttribute\("href"\)\}`\)/, "signature tracks hreflang pairs");
  const waits = [...dom.matchAll(/waitForTimeout\(([^)]*)\)/g)].map((x) => x[1].trim());
  assert.deepEqual(waits, ["100"]);
  assert.match(dom, /SETTLE_MS = 10000/);
  assert.match(dom, /navigation-failed/, "a failed navigation is a recorded error, not a crash");
});

// ------------------------------------------------------------------ the real raw checker against controlled fake sites
const tail = (out) => `... output tail:\n${out.slice(-1800)}`;
const run = (args, env) => new Promise((resolve) => {
  const p = spawn(process.execPath, [join(process.cwd(), "scripts/check-seo-live.mjs"), ...args], { env: { PATH: process.env.PATH, ...env }, cwd: process.cwd() });
  let out = "", err = ""; p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
  p.on("close", (code) => resolve({ code, out, err }));
});
const fakeSitemap = (origin, n, prefix) => `<?xml version="1.0"?><urlset>${Array.from({ length: n }, (_, i) => `<url><loc>${origin}${prefix}${i}</loc></url>`).join("")}</urlset>`;
/** A fake site whose sitemap lists `n` URLs under `prefix` on ITS OWN origin; everything else is a 404 (or `extra` routes). */
async function fakeSite(n, prefix = "/en/static", extra = {}) {
  const server = http.createServer((q, s) => {
    const path = q.url.split("?")[0];
    if (path === "/sitemap.xml") { s.writeHead(200, { "content-type": "application/xml" }); return s.end(fakeSitemap(`http://127.0.0.1:${server.address().port}`, n, prefix)); }
    if (extra[path]) return extra[path](q, s);
    s.writeHead(404, { "content-type": "text/html" }); s.end("<h1>404</h1>");
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((ok) => server.close(ok)) };
}

test("the raw checker FAILS CLOSED on an unusable sitemap, reporting expected, checked, missing and skipped coverage", async () => {
  const site = await fakeSite(3);
  try {
    const r = await run([site.url], {});
    assert.equal(r.code, 1, `an unusable sitemap fails the run (exit ${r.code})\n${tail(r.out)}`);
    assert.match(r.out, /only 3 URL/);
    assert.match(r.out, /coverage missing: sitemap/, tail(r.out));
    assert.match(r.out, /coverage missing: dynamic-both-languages/, tail(r.out));
    assert.match(r.out, /expected\s+checked\s+missing\s+skipped/, tail(r.out));
  } finally { await site.close(); }
});

test("the raw checker FAILS CLOSED when a well-formed sitemap lacks the expected template families", async () => {
  const site = await fakeSite(30);
  try {
    const r = await run([site.url], {});
    assert.equal(r.code, 1);
    assert.match(r.out, /the sitemap offers a sample of this family/);
    assert.match(r.out, /coverage missing: dynamic-both-languages/);
    assert.match(r.out, /coverage missing: blog-post/);
    assert.match(r.out, /a known static template is listed in the sitemap in this language/);
    assert.match(r.out, /a known template answers HTTP 200/);
  } finally { await site.close(); }
});

test("credentials end to end: refusal makes NO request; with an authorized loopback origin only that origin receives the header; a reflected secret (error body, canonical, Location) and a failing request never reach stdout or stderr", async () => {
  const reflect = (q, s) => { s.writeHead(200, { "content-type": "text/html" }); s.end(`<html><head><link rel="canonical" href="https://x.test/${q.headers[CREDENTIAL_HEADER]}"><meta property="og:url" content="${q.headers[CREDENTIAL_HEADER]}"></head><body>${q.headers[CREDENTIAL_HEADER]}</body></html>`); };
  const site = await fakeSite(30, "/en/static", {
    "/en/faq": reflect, "/ja/faq": reflect, "/en": reflect, "/ja": reflect, "/cart": reflect,
    "/faq": (q, s) => { s.writeHead(307, { location: `/sso?token=${q.headers[CREDENTIAL_HEADER]}` }); s.end(); },
    "/about": (q, s) => { s.writeHead(500, { "content-type": "text/html" }); s.end(`error: ${q.headers[CREDENTIAL_HEADER]}`); },
    "/search": (q) => { q.socket.destroy(); },
  });
  const A = await origin({ "/sitemap.xml": { type: "application/xml", body: fakeSitemap("http://127.0.0.1:1", 3, "/en/p") } });
  try {
    let r = await run([A.url], { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL });
    assert.equal(r.code, 2, "refuses to run"); assert.equal(A.seen.length, 0, "no request before the refusal"); assert.ok(!(r.out + r.err).includes(SENTINEL));
    r = await run([A.url], { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: "https://elsewhere.test" });
    assert.equal(r.code, 2); assert.equal(A.seen.length, 0); assert.ok(!(r.out + r.err).includes(SENTINEL));
    r = await run([site.url], { VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL, SEO_CHECK_BYPASS_ORIGIN: site.url });
    assert.equal(r.code, 1, "the fake site is not a real site, so the run fails, but it runs");
    assert.match(r.out, /\[redacted\]/, "the reflected values were printed in redacted form, proving the paths were exercised");
    assert.ok(!r.out.includes(SENTINEL), `stdout carries the secret:\n${tail(r.out)}`);
    assert.ok(!r.err.includes(SENTINEL), `stderr carries the secret:\n${r.err.slice(-800)}`);
  } finally { await A.close(); await site.close(); }
});
