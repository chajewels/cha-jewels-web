// DP-09 (preparation): the classifier is pure and INERT — never wired to a cookie or a page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const { classifyAcquisition: c } = await import("@/lib/acquisition");
const OWN = "www.chajewelsjp.com";

test("organic search: a known engine referrer, host kept, no paid parameter", () => {
  assert.deepEqual(c("https://www.google.com/", "", OWN), { class: "organic_search", host: "www.google.com" });
  assert.deepEqual(c("https://search.yahoo.co.jp/search?p=k18", "", OWN), { class: "organic_search", host: "search.yahoo.co.jp" });
  assert.deepEqual(c("https://www.bing.com/", "?utm_source=x", OWN), { class: "organic_search", host: "www.bing.com" });
});
test("paid wins over a search referrer: gclid, msclkid, paid utm_medium", () => {
  for (const q of ["?gclid=abc", "?msclkid=1", "?utm_medium=cpc", "?utm_medium=PPC"]) assert.deepEqual(c("https://www.google.com/", q, OWN), { class: "paid" }, q);
});
test("email, social, referral, direct", () => {
  assert.deepEqual(c(null, "?utm_medium=email", OWN), { class: "email" });
  assert.deepEqual(c("https://l.facebook.com/", "", OWN), { class: "social" });
  assert.deepEqual(c(null, "?fbclid=1", OWN), { class: "social" });
  assert.deepEqual(c("https://blog.example.org/post", "", OWN), { class: "referral" });
  assert.deepEqual(c("", "", OWN), { class: "direct" });
  assert.deepEqual(c(undefined, undefined, OWN), { class: "direct" });
});
test("own site, lookalike hosts and malformed referrers are never organic search", () => {
  assert.deepEqual(c("https://www.chajewelsjp.com/en", "", OWN), { class: "direct" });
  assert.deepEqual(c("https://google.evil.example/", "", OWN), { class: "referral" });
  assert.deepEqual(c("https://notgoogle.com/", "", OWN), { class: "referral" });
  assert.deepEqual(c("not a url", "", OWN), { class: "direct" });
});
test("output carries only a class and (for organic search) a hostname — no URL, query or click id", () => {
  const r = c("https://www.google.com/search?q=secret+term", "?gclid=zzz", OWN);
  assert.equal(JSON.stringify(r).includes("secret"), false);
  assert.equal(JSON.stringify(c("https://www.google.com/search?q=secret", "", OWN)).includes("search?q"), false);
});
test("INERT: no source file other than the classifier and its test mentions it, and no cj-src cookie is set anywhere", () => {
  const hits = [];
  (function walk(dir) {
    for (const n of readdirSync(dir)) {
      if (["node_modules", ".next", ".git", "docs", "tests"].includes(n)) continue;
      const f = join(dir, n);
      if (statSync(f).isDirectory()) walk(f);
      else if (/\.(ts|tsx|mjs)$/.test(n)) { const t = readFileSync(f, "utf8"); if (/classifyAcquisition|cj-src/.test(t) && !f.endsWith(join("lib", "acquisition.ts"))) hits.push(f); }
    }
  })(process.cwd());
  assert.deepEqual(hits, [], "tracking must not be enabled before consent and the Hub contract are settled");
});
