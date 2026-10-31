// Shared core of scripts/check-seo-live.mjs (raw HTML), scripts/check-seo-dom.mjs (real browser) and
// scripts/check-seo-rollback.mjs. Pure Node, no dependencies, so tests/seo-check-core.test.mjs can prove
// every rule in CI.
//
// The rules that live here so the checkers cannot drift apart:
//  1. CREDENTIALS. The HEADER (raw checker, and the one bootstrap request) is authorized for one EXACT origin
//     (scheme, host and port) and sent nowhere else. The BROWSER never sees the secret; it gets the bypass
//     COOKIE, which is HOST-SCOPED by the browser's own rules: every port of that host receives it, no
//     subdomain and no parent domain does. That is the contract, no more. No failure path can print a
//     credential: every outbound message goes through `redact()` BEFORE any truncation, every request has a
//     bounded timeout and a caught failure, and a credential shorter than MIN_CREDENTIAL_LENGTH is rejected
//     before use so that every accepted credential is redactable.
//  2. COVERAGE fails closed: every requirement states what is expected; anything not actually checked is
//     reported as missing and fails the run. Skips are listed with their reason.
//  3. The SITEMAP is validated (status, type, well-formed XML, size, duplicates, origin) before anything is
//     sampled from it.
//  4. The REQUEST origin (where the pages are fetched) is separate from the PUBLIC origin (what the site
//     declares in its canonicals, hreflang and sitemap).
//  5. ONE route matrix (`FOUNDATION_MATRIX`) feeds both checkers; a test enforces parity of their coverage keys.

// ------------------------------------------------------------------ origins
const originOf = (u) => new URL(u).origin;
const isLoopback = (host) => host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";

/** `base` is where requests go. `SEO_CHECK_PUBLIC_ORIGIN` is what the pages declare; it defaults to `base`. */
export function resolveOrigins(base, env = process.env) {
  const trimmed = String(base).replace(/\/$/, "");
  const url = new URL(trimmed);
  if (url.pathname !== "/" && url.pathname !== "") throw new Error(`the base URL must be an origin, not a path: ${trimmed}`);
  const requestOrigin = url.origin;
  const pub = env.SEO_CHECK_PUBLIC_ORIGIN?.trim();
  let publicOrigin = requestOrigin;
  if (pub) {
    const p = new URL(pub);
    if (p.origin !== pub.replace(/\/$/, "")) throw new Error("SEO_CHECK_PUBLIC_ORIGIN must be an exact origin (scheme://host[:port]) with no path");
    publicOrigin = p.origin;
  }
  return { requestOrigin, publicOrigin };
}

// ------------------------------------------------------------------ credentials
export const CREDENTIAL_HEADER = "x-vercel-protection-bypass";
export const SET_COOKIE_HEADER = "x-vercel-set-bypass-cookie";
export const REQUEST_TIMEOUT_MS = 30000;
/** A credential shorter than this is refused before use: redacting a very short value by substring would blank ordinary text, so it is not accepted at all. */
export const MIN_CREDENTIAL_LENGTH = 8;

/**
 * Decide, once, whether and where a preview-bypass secret may be used. With no secret: no credentials.
 * With a secret it is used ONLY if `SEO_CHECK_BYPASS_ORIGIN` names the exact checked origin
 * (scheme://host[:port], no path), over https (or to a loopback test origin). Anything else throws
 * BEFORE any request is made. No message ever contains the secret.
 */
export function authorizeCredentials(requestOrigin, env = process.env) {
  const secret = env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (!secret) return { enabled: false, secrets: [] };
  if (secret.length < MIN_CREDENTIAL_LENGTH) throw new Error(`the preview secret is shorter than ${MIN_CREDENTIAL_LENGTH} characters and is not accepted; refusing to run`);
  const authorized = env.SEO_CHECK_BYPASS_ORIGIN?.trim();
  if (!authorized) throw new Error("a preview secret was supplied but SEO_CHECK_BYPASS_ORIGIN (the one exact origin allowed to receive it) is not set; refusing to run");
  let a;
  try { a = new URL(authorized); } catch { throw new Error("SEO_CHECK_BYPASS_ORIGIN is not a valid URL; refusing to run"); }
  if (a.origin !== authorized.replace(/\/$/, "")) throw new Error("SEO_CHECK_BYPASS_ORIGIN must be an exact origin (scheme://host[:port]) with no path; refusing to run");
  if (a.origin !== requestOrigin) throw new Error(`the secret is authorized for ${a.origin} but the checked origin is ${requestOrigin}; refusing to run`);
  if (a.protocol !== "https:" && !isLoopback(a.hostname)) throw new Error("the secret may only be sent over https (or to a loopback test origin); refusing to run");
  // `secrets` is every value redact() must remove: the secret now, the bypass cookie values once obtained.
  // `origin` is exact (header); `host` is what the browser cookie will be scoped to (every port of it).
  return { enabled: true, origin: a.origin, host: a.hostname, secure: a.protocol === "https:", header: CREDENTIAL_HEADER, secret, secrets: [secret] };
}

/** Headers to add to a request for `url`: the credential header only for the exact authorized origin. */
export function credentialHeadersFor(auth, url) {
  if (!auth?.enabled) return {};
  let origin;
  try { origin = originOf(url); } catch { return {}; }
  return origin === auth.origin ? { [auth.header]: auth.secret } : {};
}

/**
 * Remove EVERY accepted credential (the secret and every bypass cookie value, whatever their length: values
 * shorter than MIN_CREDENTIAL_LENGTH were refused before use) from a string, longest first so a credential that
 * contains another is removed whole. Used on EVERY line the checkers print and on every error message they
 * build, and always BEFORE any truncation or other transformation, so a reflected header, an echoing error
 * page, a Location header, a thrown exception or a cut-off line can never carry a credential or a piece of
 * one into stdout, stderr or a report.
 */
export function redact(text, auth) {
  let s = String(text);
  const values = [...new Set((auth?.secrets ?? []).filter((v) => typeof v === "string" && v.length > 0))].sort((a, b) => b.length - a.length);
  for (const v of values) s = s.split(v).join("[redacted]");
  return s;
}

/** Turn any thrown value into a short, redacted, single-line diagnostic (no stack, no headers, no body). Redaction happens first; the cut comes last. */
export function describeFailure(err, auth) {
  const cause = redact(err?.cause?.code || err?.cause?.message || "", auth);
  const msg = redact(err?.name === "TimeoutError" || err?.name === "AbortError" ? "timeout" : (err?.message ?? String(err)), auth);
  return `${msg}${cause && !msg.includes(cause) ? ` (${cause})` : ""}`.replace(/\s+/g, " ").slice(0, 300);
}

/** Route console output through redact() so nothing printed can carry a credential. Idempotent. */
export function redactConsole(auth) {
  if (console.__redacted) return;
  for (const k of ["log", "error", "warn", "info"]) {
    const orig = console[k].bind(console);
    console[k] = (...args) => orig(...args.map((a) => (typeof a === "string" ? redact(a, auth) : a instanceof Error ? redact(a.stack ?? a.message, auth) : redact(JSON.stringify(a), auth))));
  }
  process.on("uncaughtException", (e) => { console.error(`fatal: ${describeFailure(e, auth)}`); process.exitCode = 1; });
  process.on("unhandledRejection", (e) => { console.error(`fatal: ${describeFailure(e, auth)}`); process.exitCode = 1; });
  console.__redacted = true;
}

/**
 * A GET helper pinned to ONE origin. It builds the URL from a site path, refuses anything that would leave the
 * origin (a protocol-relative path, an absolute URL), NEVER follows a redirect (the Location is returned for
 * the caller to inspect, so a redirect to another host cannot carry a header), times out, and never throws
 * for a network failure: a timeout, a dropped connection or a refused socket come back as
 * `{ status: 0, error }` with a redacted one-line diagnostic, so a failing preview can neither hang the run
 * nor print a credential through an exception.
 */
export function makeGet(requestOrigin, auth, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  return async function get(path) {
    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) throw new Error(`refusing a request path that is not a site path: ${JSON.stringify(path)}`);
    const url = `${requestOrigin}${path}`;
    if (originOf(url) !== requestOrigin) throw new Error("refusing a request that leaves the checked origin");
    try {
      const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs), headers: { "user-agent": "cha-seo-check/1", ...credentialHeadersFor(auth, url) } });
      const body = res.status >= 300 && res.status < 400 ? "" : await res.text();
      return { status: res.status, location: res.headers.get("location"), xrobots: res.headers.get("x-robots-tag"), cache: res.headers.get("cache-control"), contentType: res.headers.get("content-type"), body };
    } catch (e) {
      return { status: 0, location: null, xrobots: null, cache: null, contentType: null, body: "", error: describeFailure(e, auth) };
    }
  };
}

/**
 * BROWSER CREDENTIALS: a cookie scoped to the authorized HOST, never a header.
 *
 * Vercel's documented in-browser form of Protection Bypass for Automation: one request that carries the
 * secret AND `x-vercel-set-bypass-cookie: true` is answered with a redirect whose Set-Cookie carries the
 * bypass, and follow-up requests need nothing else (vercel.com/docs, Protection Bypass for Automation, read
 * 2026-10-31; the cookie's name and attributes are not stated there, so they are taken from the response).
 *
 * Why this and not request interception: Playwright cannot intercept the hops of a redirect, so a header
 * added per request either misses the hops (an SSO-gated preview then fails on them) or has to collapse the
 * redirect inside the router, which changes what the browser does. A cookie is carried by the browser itself:
 * redirects, subresources and client navigations behave exactly as they do for a signed-in person. Scope, by
 * the browser's own rules and no more: the cookie goes to EVERY PORT of the authorized host (a port-only
 * difference is not isolated), to NO subdomain of it and to NO parent domain, and to no other host; the
 * harness proves each of these. The secret itself is never given to
 * the browser; it is used by ONE Node request here, to the exact authorized origin, with no redirect
 * followed and a bounded timeout. Fails closed: no Set-Cookie, a failure, or an unexpected status means no
 * credentialed browser run at all (an error is thrown; its message is redacted). The cookie values become
 * credentials too and are added to `auth.secrets` so redact() removes them.
 */
export async function bootstrapBrowserCredentials(auth, { timeoutMs = REQUEST_TIMEOUT_MS, path = "/" } = {}) {
  if (!auth?.enabled) return [];
  const url = `${auth.origin}${path}`;
  let res;
  try {
    res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs), headers: { "user-agent": "cha-seo-check/1", [auth.header]: auth.secret, [SET_COOKIE_HEADER]: "true" } });
  } catch (e) {
    throw new Error(`could not obtain a bypass cookie from the authorized origin: ${describeFailure(e, auth)}; refusing credentialed browser checks`);
  }
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  if (!(res.status >= 200 && res.status < 400) || raw.length === 0) throw new Error(`the authorized origin answered status ${res.status} with ${raw.length} Set-Cookie header(s) to the bypass-cookie request; refusing credentialed browser checks`);
  const cookies = [];
  for (const line of raw) {
    const [pair, ...attrs] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim(), value = pair.slice(eq + 1).trim();
    if (!name || !value) continue;
    if (value.length < MIN_CREDENTIAL_LENGTH) throw new Error(`the authorized origin set a bypass cookie value shorter than ${MIN_CREDENTIAL_LENGTH} characters, which is not accepted; refusing credentialed browser checks`);
    const a = Object.fromEntries(attrs.map((x) => { const [k, ...v] = x.trim().split("="); return [k.toLowerCase(), v.join("=")]; }));
    // Scoped to the authorized HOST (host-only: no leading dot, so no subdomain receives it) and path "/": the
    // server's Domain attribute is deliberately ignored, so a cookie can never be widened to a parent domain.
    // Ports are not part of cookie scope; nothing here changes that. SameSite as the server said, default Lax.
    const sameSite = /^none$/i.test(a.samesite ?? "") ? "None" : /^strict$/i.test(a.samesite ?? "") ? "Strict" : "Lax";
    cookies.push({ name, value, domain: auth.host, path: "/", httpOnly: "httponly" in a, secure: auth.secure, sameSite });
    auth.secrets.push(value);
  }
  if (cookies.length === 0) throw new Error("the bypass-cookie response carried no usable cookie; refusing credentialed browser checks");
  return cookies;
}

/** Install the bootstrapped cookies into a Playwright context. No headers, no routes: the browser is otherwise untouched. */
export async function installBrowserCredentials(context, cookies) {
  if (!cookies?.length) return;
  await context.addCookies(cookies);
}

// ------------------------------------------------------------------ coverage (fails closed)
export class Coverage {
  constructor() { this.items = new Map(); }
  /** Register a requirement. `min` is how many must actually be checked; `optional` items may stay at 0. */
  expect(key, description, min = 1, { optional = false } = {}) {
    if (!this.items.has(key)) this.items.set(key, { key, description, expected: min, checked: 0, skipped: [], optional });
    return this;
  }
  hit(key, n = 1) {
    const it = this.items.get(key);
    if (!it) throw new Error(`coverage key was never declared: ${key}`);
    it.checked += n;
  }
  skip(key, reason) {
    const it = this.items.get(key);
    if (!it) throw new Error(`coverage key was never declared: ${key}`);
    it.skipped.push(reason);
  }
  /** One row per requirement: expected, checked, missing (= expected - checked, never negative), skipped. */
  rows() {
    return [...this.items.values()].map((it) => ({ ...it, missing: Math.max(0, it.expected - it.checked), status: it.checked >= it.expected || (it.optional && it.skipped.length > 0) ? "OK" : "MISSING" }));
  }
  /** The requirements that were not met. A requirement with nothing checked and no way to be skipped fails the run. */
  failures() { return this.rows().filter((r) => r.status === "MISSING"); }
  inventory() {
    const rows = this.rows();
    const w = Math.max(...rows.map((r) => r.key.length), 4);
    const lines = [`${"coverage".padEnd(w)}  expected  checked  missing  skipped  status`];
    for (const r of rows) lines.push(`${r.key.padEnd(w)}  ${String(r.expected).padStart(8)}  ${String(r.checked).padStart(7)}  ${String(r.missing).padStart(7)}  ${String(r.skipped.length).padStart(7)}  ${r.status}${r.skipped.length ? `   (skipped: ${r.skipped.join("; ")})` : ""}`);
    return lines.join("\n");
  }
}

// ------------------------------------------------------------------ sitemap validation
/**
 * Tag balance and attribute syntax for a small XML document, with no XML dependency: every element that is
 * opened is closed by the matching name in order (nested extension elements such as <image:image> and
 * <video:video> included), self-closing elements are fine, every attribute is name="value" or name='value',
 * and no `<` appears where it is not a tag. Comments, the XML declaration and CDATA sections are skipped.
 * Returns problems (at most 8). This is not a full XML parser: entities and DTDs are not interpreted.
 */
export function xmlBalance(text) {
  const problems = [];
  const src = String(text ?? "").replace(/^﻿/, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "").replace(/<\?[\s\S]*?\?>/g, "");
  const NAME = "[A-Za-z_][\\w.:-]*";
  const tag = new RegExp(`<(\\/?)(${NAME})((?:\\s+${NAME}\\s*=\\s*(?:"[^"<]*"|'[^'<]*'))*)\\s*(\\/?)>|<`, "g");
  const stack = [];
  let m;
  while ((m = tag.exec(src)) && problems.length < 8) {
    if (m[0] === "<") { problems.push(`malformed tag or stray "<" at offset ${m.index}: ${src.slice(m.index, m.index + 30)}`); continue; }
    const [, close, name, , selfClose] = m;
    if (close) {
      if (!stack.length) problems.push(`stray closing tag </${name}>`);
      else if (stack[stack.length - 1] !== name) problems.push(`mismatched closing tag </${name}> (open: <${stack[stack.length - 1]}>)`);
      else stack.pop();
    } else if (!selfClose) stack.push(name);
  }
  if (stack.length) problems.push(`unclosed element(s): ${stack.slice(-3).map((n) => `<${n}>`).join(" ")}`);
  return problems.slice(0, 8);
}

/**
 * Well-formedness of a URL sitemap: the document is balanced XML (`xmlBalance`: closed and correctly nested
 * elements, well-formed attributes, no stray markup); a single <urlset> root; <url> elements that do not nest
 * another <url>; exactly one non-empty <loc> per <url>, with no raw markup or unescaped ampersand inside it;
 * nothing but whitespace between <url> elements. Sitemap extensions (image, video, xhtml:link, news) inside a
 * <url> are valid and preserved. Returns problems.
 */
export function sitemapWellFormedness(body) {
  const problems = [];
  const text = String(body ?? "").replace(/^﻿/, "");
  problems.push(...xmlBalance(text));
  const stripped = text.replace(/^\s*<\?xml[^>]*\?>\s*/, "").replace(/<!--[\s\S]*?-->/g, "").trim();
  if (!/^<urlset[\s>]/.test(stripped)) problems.push("the document does not start with <urlset>");
  if (!/<\/urlset>\s*$/.test(stripped)) problems.push("the document does not end with </urlset> (truncated or malformed)");
  const inner = stripped.replace(/^<urlset[^>]*>/, "").replace(/<\/urlset>\s*$/, "");
  const blocks = [...inner.matchAll(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/g)];
  const between = inner.replace(/<url(?:\s[^>]*)?>[\s\S]*?<\/url>/g, "").trim();
  if (between) problems.push(`unexpected content between <url> elements: ${between.slice(0, 40)}`);
  blocks.forEach((m, i) => {
    const b = m[1];
    if (/<url(?=[\s>])/.test(b)) problems.push(`<url> #${i + 1} nests another <url>`);
    const locs = [...b.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((x) => x[1]);
    if (locs.length !== 1) problems.push(`<url> #${i + 1} has ${locs.length} <loc> element(s), expected exactly one`);
    for (const l of locs) {
      if (!l.trim()) problems.push(`<url> #${i + 1} has an empty <loc>`);
      if (/[<>]/.test(l)) problems.push(`<url> #${i + 1} has markup inside <loc>`);
      if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(l)) problems.push(`<url> #${i + 1} has an unescaped & in <loc>`);
    }
  });
  return [...new Set(problems)].slice(0, 8);
}

/**
 * Validate a fetched sitemap BEFORE anything is sampled from it. Returns { problems, locs, paths }.
 * Every problem is a failure: the checkers must not shrink their coverage silently when the sitemap is
 * empty, unreadable, malformed, the wrong type, on the wrong origin or duplicated.
 */
export function validateSitemap(res, { publicOrigin, minUrls = 20 } = {}) {
  const problems = [];
  if (res.error) problems.push(`fetch failed: ${res.error}`);
  if (res.status !== 200) problems.push(`status ${res.status}, expected 200`);
  const ct = (res.contentType ?? "").toLowerCase();
  if (!/xml/.test(ct)) problems.push(`content-type ${JSON.stringify(res.contentType)} is not XML`);
  const body = res.body ?? "";
  problems.push(...sitemapWellFormedness(body));
  const locs = [...body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1].trim());
  if (locs.length < minUrls) problems.push(`only ${locs.length} URL(s), expected at least ${minUrls}`);
  const seen = new Set();
  const dupes = new Set();
  for (const l of locs) { if (seen.has(l)) dupes.add(l); seen.add(l); }
  if (dupes.size) problems.push(`${dupes.size} duplicate URL(s), e.g. ${[...dupes][0]}`);
  const paths = [];
  for (const l of locs) {
    let u;
    try { u = new URL(l); } catch { problems.push(`not an absolute URL: ${l}`); continue; }
    if (publicOrigin && u.origin !== publicOrigin) { problems.push(`URL on ${u.origin}, expected the public origin ${publicOrigin}: ${l}`); break; }
    paths.push(u.pathname);
  }
  return { problems: [...new Set(problems)], locs, paths };
}

// ------------------------------------------------------------------ the one route matrix
/**
 * The FOUNDATION route matrix, shared by the raw-HTML and the live-DOM checker so the two cannot drift.
 * tests/seo-check-core.test.mjs enforces that both scripts take every list from here and declare the same
 * coverage keys (the DOM checker adds `client-navigation`, which has no raw-HTML meaning).
 *
 * Intentional differences between the two checkers, stated here rather than hidden:
 *  - A gated descendant (/account/missing …) is checked by its 307 Location in the raw checker and by the
 *    browser's FINAL URL (/login) in the DOM checker, because a browser follows redirects natively.
 *  - The 404 page's visible UI (heading, way on, search, pieces) is a DOM-only check: it streams after the
 *    first HTML. The legacy 2E-1 redirect matrix and robots.txt stay raw-only (they are about responses).
 */
const X = "nonexistent-seo-check-xyz";
const malformed = ["/products/x/y", "/products/x/y/z", "/collections/x/y", "/collections/x/y/z", "/categories/x/y", "/categories/x/y/z", "/categories", "/blog/x/y", "/blog/x/y/z", "/legal", "/legal/missing", "/legal/missing/deeper", "/legal/privacy/extra", "/faq/x", "/about/x/y", "/jewelry-guide/x", "/shopping-guide/x", "/loyalty/x", "/sale/x", "/wholesale/x", "/layaway/x"];
const privateMalformed = ["/cart/zzz", "/search/zzz", "/login/zzz"];
const localeForms = ["/products/x/y", "/collections/x/y", "/categories/x/y", "/blog/x/y", "/legal/missing", "/legal/missing/deeper", "/legal", "/faq/x", "/products/x/y/z"];
const missingResources = [`/products/${X}`, `/collections/${X}`, `/categories/${X}`, `/blog/${X}`];
export const FOUNDATION_MATRIX = Object.freeze({
  FB_ID: "812262777044447",
  /** Known static templates that exist in both languages. */
  staticTemplates: ["/jewelry-guide", "/shopping-guide", "/faq", "/about", "/legal/tokusho", "/legal/privacy", "/legal/returns", "/legal/terms", "/loyalty", "/sale", "/contact", "/wholesale", "/why-cha-jewels", "/blog", "/collections"],
  /** A real page the sitemap deliberately never lists (app/sitemap.ts, a standing sitemap-policy decision). */
  unlistedByPolicy: ["/collections"],
  missingMarker: X,
  /** Every 404 shape: unknown paths, malformed children of every public family, private descendants, locale forms, missing resources, absent siblings, invalid locales. */
  notFoundShapes: [
    `/${X}`, `/${X}/deeper`, `/${X}/deeper/still`, "/foo/bar", "/foo/bar/baz",
    ...malformed, ...privateMalformed,
    ...localeForms.flatMap((p) => [`/en${p}`, `/ja${p}`]),
    ...missingResources, ...missingResources.flatMap((p) => [`/en${p}`, `/ja${p}`]),
    `/en/${X}`, `/en/${X}/deeper`, `/ja/${X}/deeper`, "/ja/layaway", "/en/cart", "/fr/about", `/fr/${X}/deeper`,
  ],
  /** Malformed descendants of gated private routes: a 307 to /login, nothing rendered. */
  gatedDescendants: ["/account/missing", "/account/orders/1/missing", "/checkout/missing"],
  /** Real private/utility pages: noindex, no canonical or alternates, one og:url, one fb:app_id. */
  privatePages: ["/cart", "/search", "/login"],
  /** Query handling: the identity never follows the query. */
  queryCases: [{ path: "/en/faq", query: "?utm_source=seo-check&lang=ja&ref=a%23b" }, { path: "/ja/faq", query: "?utm_source=seo-check&lang=en&ref=a%23b" }],
  /** Client-side navigation targets from /en/faq (DOM only). */
  navTargets: ["/en/collections", "/en/about"],
  /** Policy: the Japanese layaway page never exists; /en/layaway must name no `ja` alternate. */
  layaway: { bare: "/layaway", existing: "en", absent: "ja" },
});
