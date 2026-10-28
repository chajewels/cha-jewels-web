// Locale-tree canonical/hreflang metadata (lib/locale-meta.ts), Phase 2B. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_SITE_URL = "https://www.chajewelsjp.com";
const { localeAlternates, localizedMeta } = await import("@/lib/locale-meta");
const B = "https://www.chajewelsjp.com";

test("a bilingual page: self canonical, both alternates, English x-default (OD-2)", () => {
  const m = localeAlternates("ja", "/faq");
  assert.equal(m.alternates.canonical, `${B}/ja/faq`);
  assert.deepEqual(m.alternates.languages, { en: `${B}/en/faq`, ja: `${B}/ja/faq`, "x-default": `${B}/en/faq` });
  assert.equal(localeAlternates("en", "/faq").alternates.canonical, `${B}/en/faq`);
});

test("the locale home: /en and /ja, never a trailing slash", () => {
  const m = localeAlternates("en", "/");
  assert.equal(m.alternates.canonical, `${B}/en`);
  assert.deepEqual(m.alternates.languages, { en: `${B}/en`, ja: `${B}/ja`, "x-default": `${B}/en` });
});

test("an English-only resource names no Japanese alternate; x-default is itself (OD-8)", () => {
  const m = localeAlternates("en", "/blog/english-only", { en: true, ja: false });
  assert.deepEqual(m.alternates.languages, { en: `${B}/en/blog/english-only`, "x-default": `${B}/en/blog/english-only` });
});

test("a Japanese-only resource: x-default is its own eligible URL, never a 404 English one", () => {
  const m = localeAlternates("ja", "/blog/japanese-only", { en: false, ja: true });
  assert.deepEqual(m.alternates.languages, { ja: `${B}/ja/blog/japanese-only`, "x-default": `${B}/ja/blog/japanese-only` });
});

test("localizedMeta: merges the legacy metadata with the alternates", async () => {
  const gen = localizedMeta((p) => `/products/${p.slug}`, async () => ({ title: "T", description: "D" }));
  const m = await gen({ params: Promise.resolve({ lang: "ja", slug: "x" }) });
  assert.equal(m.title, "T");
  assert.equal(m.alternates.canonical, `${B}/ja/products/x`);
});

test("localizedMeta: an invalid or ineligible language says NOTHING (X1: a 404 carries no tags)", async () => {
  const gen = localizedMeta(() => "/blog/p", async () => ({ title: "T" }), () => ({ en: true, ja: false }));
  assert.deepEqual(await gen({ params: Promise.resolve({ lang: "ja" }) }), {});
  assert.deepEqual(await gen({ params: Promise.resolve({ lang: "fr" }) }), {});
  assert.ok((await gen({ params: Promise.resolve({ lang: "en" }) })).alternates);
});
