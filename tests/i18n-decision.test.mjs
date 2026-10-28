// The middleware's language decision (lib/i18n.ts langDecision), Phase 2B / OD-15.
// Legacy paths must reproduce the pre-2B behaviour EXACTLY; locale paths make
// the URL authoritative. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { langDecision, detectLang, LANG_HEADER } = await import("@/lib/i18n");
const legacy = (over) => langDecision({ urlLocale: null, cookieLang: null, paramLang: null, acceptLanguage: null, ...over });

test("the header name is the middleware-owned x-cj-lang", () => {
  assert.equal(LANG_HEADER, "x-cj-lang");
});

test("legacy: ?lang= wins for the request and is persisted (the pre-2B rule)", () => {
  const d = legacy({ paramLang: "en", cookieLang: "ja" });
  assert.deepEqual(d, { lang: "en", header: null, write: "en" });
});

test("legacy: a returning cookie is left alone — no write, no header", () => {
  assert.deepEqual(legacy({ cookieLang: "en", acceptLanguage: "ja" }), { lang: "en", header: null, write: null });
});

test("legacy: a first visit is detected from Accept-Language and persisted", () => {
  assert.deepEqual(legacy({ acceptLanguage: "ja" }), { lang: "ja", header: null, write: "ja" });
  assert.deepEqual(legacy({ acceptLanguage: "tl" }), { lang: "en", header: null, write: "en" });
  assert.deepEqual(legacy({}), { lang: detectLang(null), header: null, write: detectLang(null) });
});

test("locale route: the URL beats the cookie AND ?lang=, and syncs the cookie when it differs", () => {
  assert.deepEqual(legacy({ urlLocale: "en", cookieLang: "ja", paramLang: "ja", acceptLanguage: "ja" }),
    { lang: "en", header: "en", write: "en" });
});

test("locale route: a cookie already in step is not rewritten, but the header is always set", () => {
  assert.deepEqual(legacy({ urlLocale: "ja", cookieLang: "ja" }), { lang: "ja", header: "ja", write: null });
});

test("locale route: Accept-Language has no effect (deep-link determinism)", () => {
  for (const al of [null, "ja", "en", "tl", "*"]) {
    assert.equal(legacy({ urlLocale: "en", acceptLanguage: al }).lang, "en", String(al));
  }
});
