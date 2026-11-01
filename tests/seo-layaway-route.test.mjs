// PHASE 3: /en/layaway is a real, crawlable, English-only page
// (docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md §12 and PHASE 3; SEO-MIGRATION-MAP.md §6).
// Run: npm run test:unit.
//
// What this file pins:
//  - the locale wrapper exists and declares English-only eligibility, so the
//    page's metadata names a self canonical, an `en` alternate and an English
//    x-default — and NO `ja` alternate (there is no Japanese layaway page);
//  - /ja/layaway says nothing (empty metadata; the page itself is notFound);
//  - every English layaway link in the chrome and the account goes through
//    `localePath`, so none is left on the bare cookie-decided /layaway;
//  - the Messenger button and the tab bar recognise the page under its prefix;
//  - the bare-/layaway cookie mitigation of 2026-10-28 is gone (nothing links
//    to the bare URL any more), and nothing reintroduces it;
//  - the bare /layaway is NOT redirected (OD-6 is a separate, unapproved
//    decision) — see tests/legacy-redirect.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

process.env.NEXT_PUBLIC_SITE_URL = "https://www.chajewelsjp.com";
const B = "https://www.chajewelsjp.com";
const src = (p) => readFileSync(join(process.cwd(), p), "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");

const { localeAlternates, localizedMeta } = await import("@/lib/locale-meta");
const { LAYAWAY_ELIGIBILITY } = await import("@/lib/layaway-availability");

test("the locale wrapper exists and is English-only by data, not by chance", () => {
  const file = "app/[lang]/layaway/page.tsx";
  assert.ok(existsSync(join(process.cwd(), file)), `${file} exists`);
  const s = strip(src(file));
  assert.match(s, /from "@\/app\/layaway\/page"/, "re-exports the legacy page (one implementation)");
  assert.match(s, /localizedMeta\(\s*\(\)\s*=>\s*"\/layaway"/, "metadata for the bare path /layaway");
  assert.match(s, /LAYAWAY_ELIGIBILITY/, "eligibility comes from the one layaway gate module");
});

test("LAYAWAY_ELIGIBILITY mirrors layawayOffered: English yes, Japanese no", async () => {
  const { layawayOffered } = await import("@/lib/layaway-availability");
  assert.deepEqual(LAYAWAY_ELIGIBILITY, { en: layawayOffered("en"), ja: layawayOffered("ja") });
  assert.deepEqual(LAYAWAY_ELIGIBILITY, { en: true, ja: false });
});

test("/en/layaway metadata: self canonical, `en` alternate, English x-default, NO `ja` alternate", async () => {
  const m = localeAlternates("en", "/layaway", LAYAWAY_ELIGIBILITY);
  assert.equal(m.alternates.canonical, `${B}/en/layaway`);
  assert.deepEqual(m.alternates.languages, { en: `${B}/en/layaway`, "x-default": `${B}/en/layaway` });
  const gen = localizedMeta(() => "/layaway", async () => ({ title: "Layaway" }), () => LAYAWAY_ELIGIBILITY);
  const en = await gen({ params: Promise.resolve({ lang: "en" }) });
  assert.equal(en.title, "Layaway");
  assert.equal(en.alternates.canonical, `${B}/en/layaway`);
  assert.equal("ja" in en.alternates.languages, false);
});

test("/ja/layaway metadata is empty: a 404 says nothing (X1 rule), and the legacy page is notFound on ja", async () => {
  const gen = localizedMeta(() => "/layaway", async () => ({ title: "Layaway" }), () => LAYAWAY_ELIGIBILITY);
  assert.deepEqual(await gen({ params: Promise.resolve({ lang: "ja" }) }), {});
  assert.match(strip(src("app/layaway/page.tsx")), /if \(!layawayOffered\(lang\)\) notFound\(\);/);
});

test("every English layaway link goes through localePath (none stays on the bare cookie-decided URL)", () => {
  // The chrome: header nav (L("/layaway")), the phone tab bar, the account's plan page, Why Cha Jewels.
  assert.match(strip(src("components/lumiere/site/chrome-data.tsx")), /L\("\/layaway"\)/);
  const layout = strip(src("app/layout.tsx"));
  assert.match(layout, /localePath\("\/layaway", lang\)/, "tab bar: locale-aware");
  assert.doesNotMatch(layout, /href: "\/layaway"/, "no bare tab href");
  assert.match(strip(src("app/account/layaway/page.tsx")), /localePath\("\/layaway", lang\)/);
  assert.match(strip(src("app/why-cha-jewels/page.tsx")), /localePath\("\/layaway", lang\)/);
  // Nothing under app/ or components/ links to the bare URL with a literal href.
  for (const f of ["app/layout.tsx", "components/lumiere/site/chrome-data.tsx", "components/lumiere/footer/footer-section.tsx", "components/lumiere/site/menu-overlay.tsx", "app/account/layaway/page.tsx", "app/why-cha-jewels/page.tsx", "app/layaway/page.tsx"]) {
    assert.doesNotMatch(strip(src(f)), /href=\{?"\/layaway["?]/, `${f}: a literal bare /layaway href`);
  }
});

test("the Messenger button and the tab bar match the layaway page under its locale prefix", () => {
  const mb = strip(src("components/site/messenger-button.tsx"));
  assert.match(mb, /stripLocale\(/, "the Messenger button compares the bare path");
  assert.match(mb, /"\/layaway"/);
  const tb = strip(src("components/site/mobile-tab-bar.tsx"));
  assert.match(tb, /layaway: \["\/layaway"\]/);
  assert.match(tb, /stripLocale\(path\)/);
});

test("the bare-/layaway cookie mitigation is removed and not reintroduced", () => {
  for (const f of ["lib/layaway-language-sync.ts", "components/site/layaway-language-sync.tsx"]) {
    assert.equal(existsSync(join(process.cwd(), f)), false, `${f} is gone: nothing links to the bare /layaway`);
  }
  assert.doesNotMatch(src("app/layout.tsx"), /LayawayLanguageSync/);
});

test("the layaway page: unique H1, English metadata with a description, FAQ and internal links", async () => {
  const { dict } = await import("@/lib/i18n");
  assert.notEqual(dict.layawayPage.h1.en, dict.home.layH.en, "the page's H1 is not the homepage band's heading");
  assert.ok(dict.meta.layaway.description.en.length > 50 && dict.meta.layaway.description.en.length <= 160, "a real meta description, within the usual length");
  assert.ok(/layaway/i.test(dict.meta.layaway.title.en) && /Japan/.test(dict.meta.layaway.title.en), "title names the service and the market");
  const page = strip(src("app/layaway/page.tsx"));
  assert.match(page, /t\("layawayPage", "h1"\)/, "H1 from the page's own key");
  assert.match(page, /<JsonLd type="faq"/, "FAQPage structured data for the visible FAQ");
  assert.match(page, /getFaq\(/, "FAQ items come from the Hub FAQ (one source), not a second copy");
  for (const link of ["/faq#", '"/shopping-guide"', '"/jewelry-guide"', '"/why-cha-jewels"', '"/collections"']) {
    assert.ok(page.includes(link), `internal link to ${link}`);
  }
});

test("every Japanese layaway word in the new dictionary keys renders only behind layawayOffered (check:layaway-ja list)", () => {
  const guard = src("scripts/check-layaway-ja.mjs");
  for (const key of ["meta.layaway.description", "layawayPage.h1", "layawayPage.faqH"]) {
    assert.ok(guard.includes(`"${key}"`), `${key} is declared gated`);
  }
});
