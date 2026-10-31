// Shared core of scripts/check-seo-live.mjs (raw HTML) and scripts/check-seo-dom.mjs (real browser).
// Pure Node, no dependencies, so tests/seo-check-core.test.mjs can prove every rule in CI.
//
// Four rules live here so the two checkers cannot drift apart:
//  1. CREDENTIALS reach one exact, explicitly authorized origin and nowhere else (never a host the
//     page merely links to, never across a redirect to another origin, never into a log).
//  2. COVERAGE fails closed: every requirement states what is expected; anything not actually
//     checked is reported as missing and fails the run. Skips are listed with their reason.
//  3. The SITEMAP is validated before anything is sampled from it.
//  4. The REQUEST origin (where the pages are fetched) is separate from the PUBLIC origin (what the
//     site declares in its canonicals, hreflang and sitemap): a preview is requested on its own
//     host but declares the production origin.

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

/**
 * Decide, once, whether and where a preview-bypass secret may be used. With no secret: no credentials.
 * With a secret it is used ONLY if `SEO_CHECK_BYPASS_ORIGIN` names the exact checked origin
 * (scheme://host[:port], no path), over https (or to a loopback test origin). Anything else throws
 * BEFORE any request is made. No message ever contains the secret.
 */
export function authorizeCredentials(requestOrigin, env = process.env) {
  const secret = env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (!secret) return { enabled: false };
  const authorized = env.SEO_CHECK_BYPASS_ORIGIN?.trim();
  if (!authorized) throw new Error("a preview secret was supplied but SEO_CHECK_BYPASS_ORIGIN (the one exact origin allowed to receive it) is not set; refusing to run");
  let a;
  try { a = new URL(authorized); } catch { throw new Error("SEO_CHECK_BYPASS_ORIGIN is not a valid URL; refusing to run"); }
  if (a.origin !== authorized.replace(/\/$/, "")) throw new Error("SEO_CHECK_BYPASS_ORIGIN must be an exact origin (scheme://host[:port]) with no path; refusing to run");
  if (a.origin !== requestOrigin) throw new Error(`the secret is authorized for ${a.origin} but the checked origin is ${requestOrigin}; refusing to run`);
  if (a.protocol !== "https:" && !isLoopback(a.hostname)) throw new Error("the secret may only be sent over https (or to a loopback test origin); refusing to run");
  return { enabled: true, origin: a.origin, header: CREDENTIAL_HEADER, secret };
}

/** Headers to add to a request for `url`: the credential header only for the exact authorized origin. */
export function credentialHeadersFor(auth, url) {
  if (!auth?.enabled) return {};
  let origin;
  try { origin = originOf(url); } catch { return {}; }
  return origin === auth.origin ? { [auth.header]: auth.secret } : {};
}

/** Replace every occurrence of the secret in a string (defence in depth for anything that might be printed). */
export function redact(text, auth) {
  return auth?.enabled && auth.secret ? String(text).split(auth.secret).join("[redacted]") : String(text);
}

/**
 * A GET helper pinned to ONE origin. It builds the URL from a site path, refuses anything that would
 * leave the origin (a protocol-relative path, an absolute URL), and NEVER follows a redirect (the
 * Location is returned for the caller to inspect), so a redirect to another host cannot carry a header.
 */
export function makeGet(requestOrigin, auth) {
  return async function get(path) {
    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) throw new Error(`refusing a request path that is not a site path: ${JSON.stringify(path)}`);
    const url = `${requestOrigin}${path}`;
    if (originOf(url) !== requestOrigin) throw new Error("refusing a request that leaves the checked origin");
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": "cha-seo-check/1", ...credentialHeadersFor(auth, url) } });
    const body = res.status >= 300 && res.status < 400 ? "" : await res.text();
    return { status: res.status, location: res.headers.get("location"), xrobots: res.headers.get("x-robots-tag"), cache: res.headers.get("cache-control"), contentType: res.headers.get("content-type"), body };
  };
}

/**
 * Playwright: route every request of a context. A request to a DIFFERENT origin is continued untouched
 * (no header, ever). A request to the authorized origin is fetched with the header and WITHOUT
 * following redirects. A redirect that stays on the authorized origin is followed inside the router (each
 * hop carries the header); a redirect to another origin is returned to the browser as a 3xx, which then
 * requests the other origin itself with no header. (A redirect from another origin back INTO the
 * authorized origin is followed by the browser and is not routed again, so that hop carries no header: a
 * functional limit for a gated preview, never a leak; the checkers do not navigate through other origins.)
 * `extraHTTPHeaders` is never used: it would put the secret on every request of the context,
 * subresources and redirects to other hosts included.
 */
const MAX_SAME_ORIGIN_HOPS = 10;

export async function installCredentialRouting(context, auth) {
  if (!auth?.enabled) return;
  await context.route("**/*", async (route) => {
    const req = route.request();
    // credentialHeadersFor is the single decision: the exact authorized origin, and nothing else (an
    // unparsable URL included) gets the header. No header means the request is continued untouched.
    const credentials = credentialHeadersFor(auth, req.url());
    if (Object.keys(credentials).length === 0) { await route.continue(); return; }
    let url = req.url();
    let response = await route.fetch({ headers: { ...req.headers(), ...credentials }, maxRedirects: 0 });
    // A redirect that stays on the authorized origin is followed HERE so that every hop carries the header (the
    // browser does not route a fulfilled redirect's next hop again). A redirect to ANY other origin is not
    // followed: the 3xx is handed to the browser, which requests the other origin itself with no header.
    for (let hop = 0; hop < MAX_SAME_ORIGIN_HOPS; hop++) {
      const location = response.status() >= 300 && response.status() < 400 ? response.headers()["location"] : null;
      if (!location) break;
      let next;
      try { next = new URL(location, url).href; } catch { break; }
      if (Object.keys(credentialHeadersFor(auth, next)).length === 0) break;
      url = next;
      response = await route.fetch({ url, headers: { ...req.headers(), ...credentials }, maxRedirects: 0 });
    }
    await route.fulfill({ response });
  });
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
 * Validate a fetched sitemap BEFORE anything is sampled from it. Returns { problems, locs, paths }.
 * Every problem is a failure: the checkers must not shrink their coverage silently when the sitemap is
 * empty, unreadable, the wrong type, on the wrong origin or duplicated.
 */
export function validateSitemap(res, { publicOrigin, minUrls = 20 } = {}) {
  const problems = [];
  if (res.status !== 200) problems.push(`status ${res.status}, expected 200`);
  const ct = (res.contentType ?? "").toLowerCase();
  if (!/xml/.test(ct)) problems.push(`content-type ${JSON.stringify(res.contentType)} is not XML`);
  const body = res.body ?? "";
  if (!/<urlset[\s>]/.test(body)) problems.push("no <urlset> root element");
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
  return { problems, locs, paths };
}
