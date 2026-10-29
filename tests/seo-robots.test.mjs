// robots.txt (app/robots.ts). Run: npm run test:unit.
//
// Crawl control and index control are different tools. A page that must carry a
// noindex has to stay crawlable, or the crawler never reads the directive.
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: robots } = await import("../app/robots.ts");
const policy = await import("@/lib/seo-policy");
const r = robots();
const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
const disallow = [].concat(rule.disallow ?? []);

test("all crawlers are allowed in by default", () => {
  assert.equal(rule.userAgent, "*");
  assert.equal(rule.allow, "/");
});

test("the sitemap is declared as an absolute URL", () => {
  assert.match(r.sitemap, /^https:\/\/[^/]+\/sitemap\.xml$/);
});

test("customer, checkout and API areas are blocked from crawling", () => {
  for (const p of ["/account", "/checkout", "/api", "/review/"]) {
    assert.ok(disallow.includes(p), `${p} should stay disallowed`);
  }
  assert.deepEqual([...disallow].sort(), ["/account", "/api", "/checkout", "/review/"], "exactly these four; nothing added or dropped silently");
});

test("a page that relies on a noindex directive is not also blocked", () => {
  // /search, /cart and /login return 200 and say noindex in the page; a
  // Disallow would stop the crawler from ever seeing it. /already-registered
  // joined this list in BUG-05 (2026-10-29): it is a public static notice that
  // says noindex, nofollow itself, so it must stay fetchable.
  for (const p of ["/search", "/cart", "/login", "/already-registered"]) {
    assert.equal(policy.isNoindexPath(p), true, `${p} is a noindex page`);
    assert.ok(!disallow.some((d) => p === d || p.startsWith(d)), `${p} must stay crawlable so its noindex is read`);
  }
});

test("no public page is blocked", () => {
  for (const p of ["/", "/products/x", "/collections/kihei", "/categories/x", "/blog/x", "/jewelry-guide", "/faq", "/about", "/legal/privacy", "/loyalty", "/sale"]) {
    assert.ok(!disallow.some((d) => p === d || p.startsWith(d)), `${p} must not be disallowed`);
  }
});
