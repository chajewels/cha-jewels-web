// Language-switcher destinations (lib/locale-nav.ts, OD-7) and localeVariants.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { hub } = await import("@/lib/hub-api");
const { switchTargets } = await import("@/lib/locale-nav");
const { localeVariants } = await import("@/lib/locale");
const bilingual = { slug: "s", type: "article", published_at: "2026-01-01", title_en: "T", body_en: "B.", title_ja: "タ", body_ja: "本文。" };

test("a bilingual page links each language to its sibling, keeping the query minus ?lang=", async () => {
  assert.deepEqual(await switchTargets("/en/faq"), { en: "/en/faq", ja: "/ja/faq" });
  assert.deepEqual(await switchTargets("/ja/collections/kihei?sort=new&lang=ja#top"), { en: "/en/collections/kihei?sort=new#top", ja: "/ja/collections/kihei?sort=new#top" });
  assert.deepEqual(await switchTargets("/faq"), { en: "/en/faq", ja: "/ja/faq" }, "a legacy page's switcher enters the locale tree");
  assert.deepEqual(await switchTargets("/"), { en: "/en", ja: "/ja" });
});

test("an English-only post: Japanese goes HOME, never to a missing page (OD-7)", async () => {
  hub.post = async () => ({ ...bilingual, title_ja: null, body_ja: null });
  assert.deepEqual(await switchTargets("/en/blog/s"), { en: "/en/blog/s", ja: "/ja" });
  hub.post = async () => ({ ...bilingual, layaway_only: true });
  assert.deepEqual(await switchTargets("/en/blog/s"), { en: "/en/blog/s", ja: "/ja" }, "a layaway-only post is English-only by rule");
  hub.post = async () => { throw new Error("down"); };
  const t = await switchTargets("/en/blog/s");
  assert.equal(t.ja, "/ja", "a Hub failure falls back to the home, never a guessed sibling");
  assert.equal(t.en, "/en/blog/s", "the current language keeps its own URL (the active side never renders as a link)");
});

test("layaway: Japanese goes home; no /en/layaway and no /ja/layaway is ever produced", async () => {
  const t = await switchTargets("/layaway?lang=en");
  assert.equal(t.ja, "/ja");
  assert.ok(t.en === "/en" || t.en === null, `en side must not mint /en/layaway (got ${t.en})`);
  assert.ok(!Object.values(t).some((v) => typeof v === "string" && v.includes("layaway")), JSON.stringify(t));
});

test("private routes keep the cookie toggle: both null", async () => {
  for (const p of ["/cart", "/account/orders/1", "/checkout", "/search?q=x", "/login"]) {
    assert.deepEqual(await switchTargets(p), { en: null, ja: null }, p);
  }
});

test("unsafe or missing paths: both null (the control stays a safe toggle)", async () => {
  for (const p of [null, undefined, "", "//evil.com", "/en//evil.com", "x"]) {
    assert.deepEqual(await switchTargets(p), { en: null, ja: null }, String(p));
  }
});

test("an unknown path offers the homes", async () => {
  assert.deepEqual(await switchTargets("/nonexistent-page"), { en: "/en", ja: "/ja" });
});

test("localeVariants: a localizable path has three URLs; others stand alone", () => {
  assert.deepEqual(localeVariants("/products/x"), ["/products/x", "/en/products/x", "/ja/products/x"]);
  assert.deepEqual(localeVariants("/"), ["/", "/en", "/ja"]);
  assert.deepEqual(localeVariants("/layaway"), ["/layaway"]);
  assert.deepEqual(localeVariants("/account"), ["/account"]);
});

// THE SWITCHER IS NEVER PREFETCHED (found 2026-10-28). Its prefetch of the other
// language's URL ran the middleware's cookie sync — Next strips the router's
// prefetch headers before middleware, so the middleware cannot tell — and
// viewing an English page set cj-lang=ja. It is also the only component that
// links into the other language; every other link is built in the page's own.
test("the language switcher's link is never prefetched, and nothing else links into a fixed language", async () => {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const sw = readFileSync(join(process.cwd(), "components/site/lang-switcher.tsx"), "utf8");
  const links = sw.match(/<Link\b[^>]*>/g) ?? [];
  assert.ok(links.length > 0, "the switcher renders links");
  for (const l of links) assert.match(l, /prefetch=\{false\}/, l);
  const files = [];
  (function walk(d) { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (/\.tsx?$/.test(n)) files.push(f); } })(join(process.cwd(), "components"));
  (function walk(d) { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (/\.tsx?$/.test(n)) files.push(f); } })(join(process.cwd(), "app"));
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    assert.ok(!/localePath\([^)]*,\s*["'](en|ja)["']\)/.test(s), `${f} builds a link into a fixed language`);
    assert.ok(!/href=[{"'`]+\/(en|ja)([/"'`?]|$)/.test(s), `${f} hard-codes a locale href`);
  }
});
