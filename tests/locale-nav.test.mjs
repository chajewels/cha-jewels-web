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

test("layaway (Phase 3): the English side is /en/layaway, the Japanese side goes home; /ja/layaway is never produced", async () => {
  const bare = await switchTargets("/layaway?lang=en&piece=p1");
  assert.deepEqual(bare, { en: "/en/layaway?piece=p1", ja: "/ja" }, "bare: English sibling keeps the query minus lang; Japanese goes home (OD-7)");
  const en = await switchTargets("/en/layaway?piece=p1");
  assert.deepEqual(en, { en: "/en/layaway?piece=p1", ja: "/ja" }, "on /en/layaway the Japanese control goes home, never to a layaway page");
  for (const t of [bare, en]) assert.ok(!/ja\/layaway/.test(JSON.stringify(t)), JSON.stringify(t));
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
  assert.deepEqual(localeVariants("/layaway"), ["/layaway", "/en/layaway"], "Phase 3: the English layaway page, never a Japanese one");
  assert.deepEqual(localeVariants("/account"), ["/account"]);
});

// THE SWITCHER LOADS A NEW DOCUMENT (found 2026-10-28). Two defects, one cause
// — the root layout is not re-rendered by a client-side navigation:
//  1. a <Link> to the other language was PREFETCHED, the prefetch ran the
//     middleware's cookie sync (Next strips the router's prefetch headers before
//     middleware, so it cannot tell), and viewing an English page set cj-lang=ja;
//  2. a soft switch rendered the Japanese page under the English frame, Layaway
//     link included.
// A plain <a> is never prefetched and always loads a new document. The switcher
// is also the only component that links into the other language; every other
// link is built in the page's own, and is checked here so a new one cannot
// reintroduce defect 1 through its prefetch.
test("the language switcher uses plain anchors (no next/link), and nothing else links into a fixed language", async () => {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  // Comments stripped: the file explains why it does not use <Link>.
  const sw = readFileSync(join(process.cwd(), "components/site/lang-switcher.tsx"), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
  assert.doesNotMatch(sw, /from "next\/link"|<Link\b/, "a next/link would be prefetched and soft-navigate");
  assert.match(sw, /<a href=\{href\} lang=\{l\}/, "each target is a real crawlable anchor");
  assert.match(sw, /useSwitchTargets\(targets\)/, "destinations follow the page on screen, not the layout's first answer");
  const files = [];
  (function walk(d) { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (/\.tsx?$/.test(n)) files.push(f); } })(join(process.cwd(), "components"));
  (function walk(d) { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (/\.tsx?$/.test(n)) files.push(f); } })(join(process.cwd(), "app"));
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    assert.ok(!/localePath\([^)]*,\s*["'](en|ja)["']\)/.test(s), `${f} builds a link into a fixed language`);
    assert.ok(!/href=[{"'`]+\/(en|ja)([/"'`?]|$)/.test(s), `${f} hard-codes a locale href`);
  }
});

// STALE DESTINATIONS (found 2026-10-28): after a client-side navigation the
// layout's targets described the previous page. The hook re-asks the SAME rule
// for the page on screen through /api/switch-targets.
test("switch targets follow the current route through the same switchTargets rule", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const hook = readFileSync(join(process.cwd(), "components/site/use-switch-targets.ts"), "utf8");
  const route = readFileSync(join(process.cwd(), "app/api/switch-targets/route.ts"), "utf8");
  assert.match(hook, /usePathname\(\)/);
  assert.match(hook, /\/api\/switch-targets\?path=\$\{encodeURIComponent\(path\)\}/);
  assert.match(hook, /if \(onLoadedPage\) return initial;/, "the server's answer stands on the page it was computed for");
  assert.match(hook, /const documentPath = typeof window === "undefined" \? null : window\.location\.pathname;/, "the props describe the DOCUMENT's page, not the path when a switcher mounts (the drawer mounts late)");
  assert.doesNotMatch(hook, /useState\(pathname\)/, "a mount-time path would trust stale props in a late-mounted switcher");
  assert.match(hook, /return \(\) => \{ live = false; \};/, "an answer for a path no longer on screen is dropped");
  assert.match(route, /await switchTargets\(splitPath\(raw\)\.path\)/, "one rule: the endpoint answers with the layout's own function, for the pathname only");
  assert.doesNotMatch(route, /cookies\(\)|headers\(\)/, "the answer depends on the path alone, never on the visitor");
  // The endpoint's answers for the pages the browser journey visits.
  assert.deepEqual(await switchTargets("/en/faq"), { en: "/en/faq", ja: "/ja/faq" });
  assert.deepEqual(await switchTargets("/ja/products/p1"), { en: "/en/products/p1", ja: "/ja/products/p1" });
  assert.deepEqual(await switchTargets("/en/about"), { en: "/en/about", ja: "/ja/about" });
});
