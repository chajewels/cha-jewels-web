// SHARE BAR (owner S1–S7, 2026-10-16): the post URL in each language, the utm
// pair, and every platform's share link with its encoding (lib/share.ts).
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { SHARE_NETWORKS, postShareUrl, withShareUtm, buildShareUrl } = await import("@/lib/share");

const BASE = "https://www.chajewelsjp.com";
const SLUG = "why-cha-jewels-care-behind-every-piece";
const EN = `${BASE}/blog/${SLUG}?lang=en`;
const JA = `${BASE}/blog/${SLUG}`;

test("the networks, in the bar's order", () => {
  assert.deepEqual([...SHARE_NETWORKS], ["facebook", "x", "line", "whatsapp", "threads"]);
});

test("post URL: English carries ?lang=en, Japanese carries no parameter", () => {
  assert.equal(postShareUrl(BASE, SLUG, "en"), EN);
  assert.equal(postShareUrl(BASE, SLUG, "ja"), JA);
  assert.equal(postShareUrl(`${BASE}/`, SLUG, "ja"), JA, "a trailing slash on the base is not doubled");
  assert.equal(postShareUrl(BASE, "a b/c", "ja"), `${BASE}/blog/a%20b%2Fc`, "the slug is one path segment");
});

test("utm_source and utm_medium=share are added, ?lang=en kept", () => {
  assert.equal(withShareUtm(EN, "copy"), `${EN}&utm_source=copy&utm_medium=share`);
  assert.equal(withShareUtm(JA, "native"), `${JA}?utm_source=native&utm_medium=share`);
});

test("every endpoint, URL-encoded, with its own utm_source", () => {
  const title = "Why Cha Jewels? Care & K18 gold";
  const t = encodeURIComponent(title);
  const shared = (n) => `${EN}&utm_source=${n}&utm_medium=share`;
  const u = (n) => encodeURIComponent(shared(n));
  assert.equal(buildShareUrl("facebook", EN, title), `https://www.facebook.com/sharer/sharer.php?u=${u("facebook")}`);
  assert.equal(buildShareUrl("x", EN, title), `https://twitter.com/intent/tweet?url=${u("x")}&text=${t}`);
  assert.equal(buildShareUrl("line", EN, title), `https://social-plugins.line.me/lineit/share?url=${u("line")}`);
  assert.equal(buildShareUrl("whatsapp", EN, title), `https://api.whatsapp.com/send?text=${t}%20${u("whatsapp")}`);
  assert.equal(buildShareUrl("threads", EN, title), `https://www.threads.net/intent/post?text=${t}%20${u("threads")}`);
});

test("encoding: no raw &, ?, # or space from the title or URL leaks into the share link's query", () => {
  const title = "A&B? #1 です";
  for (const n of SHARE_NETWORKS) {
    const link = new URL(buildShareUrl(n, EN, title));
    const params = [...link.searchParams.keys()];
    assert.ok(params.length <= 2, `${n}: ${params}`);
    const carried = link.searchParams.get("u") ?? link.searchParams.get("url") ?? link.searchParams.get("text");
    assert.ok(carried.includes(`${EN}&utm_source=${n}&utm_medium=share`), `${n} carries the post URL intact`);
    if (n === "x") assert.equal(link.searchParams.get("text"), title);
    if (n === "whatsapp" || n === "threads") assert.equal(carried, `${title} ${EN}&utm_source=${n}&utm_medium=share`);
  }
});

test("Japanese post: shared URL has no lang parameter", () => {
  const link = new URL(buildShareUrl("facebook", JA, "t"));
  assert.equal(link.searchParams.get("u"), `${JA}?utm_source=facebook&utm_medium=share`);
});
