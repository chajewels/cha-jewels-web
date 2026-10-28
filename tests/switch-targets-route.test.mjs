// GET /api/switch-targets (app/api/switch-targets/route.ts): security review
// 2026-10-28. The handler is exercised directly; the Hub is the harness stub.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { hub } = await import("@/lib/hub-api");
const { GET } = await import("../app/api/switch-targets/route.ts");

Object.assign(hub, {
  post: async (slug) => ({
    "both": { slug: "both", title_en: "T", body_en: "b", title_ja: "題", body_ja: "本文" },
    "english-only": { slug: "english-only", title_en: "T", body_en: "b" },
    "layaway-post": { slug: "layaway-post", title_en: "T", body_en: "b", title_ja: "題", body_ja: "本文", layaway_only: true },
  })[slug] ?? null,
});

const call = async (path) => {
  const url = path === undefined ? "http://x.test/api/switch-targets" : `http://x.test/api/switch-targets?path=${encodeURIComponent(path)}`;
  const res = await GET(new Request(url));
  return { status: res.status, body: await res.json(), cache: res.headers.get("cache-control"), setCookie: res.headers.get("set-cookie") };
};
const sitePathOrNull = (v) => v === null || (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !/[\\\r\n]/.test(v));

test("a public page answers its siblings; Japanese first in neither order nor meaning", async () => {
  const r = await call("/en/faq");
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { en: "/en/faq", ja: "/ja/faq" });
  assert.equal(r.cache, "private, max-age=60");
  assert.equal(r.setCookie, null, "never writes a cookie");
});

test("query and fragment are dropped: the answer is for the pathname only", async () => {
  assert.deepEqual((await call("/en/faq?lang=ja&x=<script>#top")).body, { en: "/en/faq", ja: "/ja/faq" });
});

test("private routes keep the cookie toggle (null), never a locale link", async () => {
  for (const p of ["/cart", "/checkout", "/account/orders/abc", "/login", "/loyalty/join", "/search"]) {
    const r = await call(p);
    assert.equal(r.status, 200, p);
    assert.deepEqual(r.body, { en: null, ja: null }, p);
  }
});

test("missing siblings fall back to the language home; English-only and layaway-only posts never offer /ja/blog", async () => {
  assert.deepEqual((await call("/en/blog/english-only")).body, { en: "/en/blog/english-only", ja: "/ja" });
  assert.deepEqual((await call("/en/blog/layaway-post")).body, { en: "/en/blog/layaway-post", ja: "/ja" });
  assert.deepEqual((await call("/en/blog/both")).body, { en: "/en/blog/both", ja: "/ja/blog/both" });
});

test("no layaway destination, ever: the entry rendered as a link never names a layaway URL", async () => {
  // The switcher links only to the OTHER language (the current one is a
  // non-link control), so for each requested path the other entry is the
  // destination. It is never /ja/layaway (policy) nor /en/layaway (Phase 3).
  for (const [p, own] of [["/layaway", null], ["/en/layaway", "en"], ["/ja/layaway", "ja"], ["/en/faq", "en"]]) {
    const r = await call(p);
    for (const l of ["en", "ja"]) {
      if (l === own) { assert.equal(r.body[l], p, `${p}: the own-language entry only names the page itself`); continue; }
      assert.ok(!/layaway/.test(r.body[l] ?? ""), `${p} → ${l}: ${r.body[l]}`);
    }
  }
  assert.deepEqual((await call("/layaway")).body, { en: "/en", ja: "/ja" });
});

test("hostile or malformed input is a 400 with nothing in it; every 200 answer is a same-site path", async () => {
  for (const p of [undefined, "", "faq", "//evil.com", "/\\evil.com", "https://evil.com/", "/en//evil.com", "/en/faq\r\nSet-Cookie: x=1", "/\u0000", "/" + "a".repeat(600)]) {
    const r = await call(p);
    assert.equal(r.status, 400, JSON.stringify(p));
    assert.deepEqual(r.body, { error: "bad_path" });
    assert.equal(r.cache, "no-store");
  }
  for (const p of ["/", "/en", "/ja/products/x", "/unknown-page", "/products/../../etc", "/en/%2F%2Fevil.com"]) {
    const r = await call(p);
    assert.equal(r.status, 200, p);
    assert.ok(sitePathOrNull(r.body.en) && sitePathOrNull(r.body.ja), `${p} → ${JSON.stringify(r.body)}`);
  }
});
