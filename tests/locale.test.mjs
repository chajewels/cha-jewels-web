// Locale path helpers (lib/locale.ts): Phase 2A of docs/seo/SEO-MIGRATION-MAP.md.
// Pure functions only. No /en or /ja route exists yet. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const L = await import("@/lib/locale");

test("the supported locales are exactly en and ja", () => {
  assert.deepEqual([...L.LOCALES], ["en", "ja"]);
  assert.equal(L.isLocale("en"), true);
  assert.equal(L.isLocale("ja"), true);
  for (const v of ["fr", "EN", "en-US", "", null, undefined, 1]) assert.equal(L.isLocale(v), false, String(v));
});

test("localeOf reads a whole first segment only", () => {
  assert.equal(L.localeOf("/en"), "en");
  assert.equal(L.localeOf("/ja"), "ja");
  assert.equal(L.localeOf("/en/"), "en");
  assert.equal(L.localeOf("/en/products/x"), "en");
  assert.equal(L.localeOf("/ja/legal/tokusho?x=1#y"), "ja");
  for (const p of ["/", "/products/x", "/english", "/enjoy/x", "/jaja", "/EN/x", "/Ja", "/fr/x", "/products/en", "//en/x", "en/x", ""]) {
    assert.equal(L.localeOf(p), null, `${JSON.stringify(p)} carries no locale prefix`);
  }
});

test("stripLocale removes the prefix and normalises, keeping query and fragment", () => {
  const cases = [
    ["/en", "/"], ["/ja", "/"], ["/en/", "/"], ["/ja//", "/"],
    ["/en/products/x", "/products/x"], ["/ja/legal/tokusho", "/legal/tokusho"],
    ["/en/products/x?y=1#z", "/products/x?y=1#z"], ["/en?lang=ja", "/?lang=ja"], ["/ja#top", "/#top"],
    ["/products/x/", "/products/x"], ["/", "/"],
  ];
  for (const [input, want] of cases) assert.equal(L.stripLocale(input), want, input);
});

test("an unknown prefix, a wrong case and a non-site string are left alone", () => {
  for (const p of ["/fr/x", "/EN/x", "/english", "/products/en", "//evil.example/x", "en/x", "", "https://x.example/en/y"]) {
    assert.equal(L.stripLocale(p), p, JSON.stringify(p));
  }
  assert.equal(L.stripLocale(undefined), undefined);
  assert.equal(L.stripLocale(null), null);
});

test("splitPath separates the path from the query and fragment", () => {
  assert.deepEqual(L.splitPath("/a/b"), { path: "/a/b", suffix: "" });
  assert.deepEqual(L.splitPath("/a?x=1#y"), { path: "/a", suffix: "?x=1#y" });
  assert.deepEqual(L.splitPath("/a#y?x"), { path: "/a", suffix: "#y?x" });
});

test("localePath prefixes a public path and nothing else", () => {
  assert.equal(L.localePath("/", "en"), "/en");
  assert.equal(L.localePath("/", "ja"), "/ja");
  assert.equal(L.localePath("/products/k18-chain", "ja"), "/ja/products/k18-chain");
  assert.equal(L.localePath("/collections", "en"), "/en/collections");
  assert.equal(L.localePath("/legal/tokusho", "en"), "/en/legal/tokusho");
  assert.equal(L.localePath("/blog/what-is-kihei?type=news#a", "en"), "/en/blog/what-is-kihei?type=news#a");
  assert.equal(L.localePath("/products/x/", "ja"), "/ja/products/x", "no trailing slash, the app convention");
});

test("localePath swaps an existing prefix rather than stacking one", () => {
  assert.equal(L.localePath("/en/products/x", "ja"), "/ja/products/x");
  assert.equal(L.localePath("/ja", "en"), "/en");
  assert.equal(L.localePath("/en/products/x", "en"), "/en/products/x");
});

test("localePath never prefixes a private, utility or unknown path", () => {
  for (const p of ["/cart", "/login", "/account", "/account/orders/1", "/checkout", "/search", "/auth/callback", "/loyalty/join", "/review/tok", "/receipts/verify", "/api/lang", "/nonexistent", "/faq/extra", "/loyalty/join?x=1"]) {
    assert.equal(L.localePath(p, "en"), p, `${p} must come back unchanged`);
    assert.equal(L.localePath(p, "ja"), p, `${p} must come back unchanged`);
  }
});

test("there is no way to mint /ja/layaway (policy); /en/layaway is the one layaway page (Phase 3)", () => {
  for (const p of ["/layaway", "/en/layaway", "/ja/layaway"]) {
    assert.equal(L.localePath(p, "ja"), p, `${p} -> ja must come back unchanged`);
    assert.equal(L.siblingPath(p, "ja"), null, `${p} has no Japanese sibling`);
  }
  assert.equal(L.localePath("/layaway", "en"), "/en/layaway");
  assert.equal(L.localePath("/en/layaway", "en"), "/en/layaway");
  assert.equal(L.localePath("/ja/layaway", "en"), "/ja/layaway", "a Japanese-prefixed layaway path is not a site page in any language: unchanged");
  assert.equal(L.isLocalizable("/layaway"), true);
  assert.equal(L.isLocalizable("/en/layaway"), true);
  assert.equal(L.isLocalizable("/ja/layaway"), false);
});

test("localePath tolerates a bad locale or a bad input", () => {
  assert.equal(L.localePath("/products/x", "fr"), "/products/x");
  assert.equal(L.localePath("//evil/x", "en"), "//evil/x");
  assert.equal(L.localePath("", "en"), "");
});

test("siblingPath names the same resource in the other language, or null", () => {
  assert.equal(L.siblingPath("/en/products/x", "ja"), "/ja/products/x");
  assert.equal(L.siblingPath("/ja/products/x", "en"), "/en/products/x");
  assert.equal(L.siblingPath("/products/x", "en"), "/en/products/x");
  assert.equal(L.siblingPath("/en", "ja"), "/ja");
  assert.equal(L.siblingPath("/ja/legal/tokusho", "en"), "/en/legal/tokusho");
  assert.equal(L.siblingPath("/en/cart", "ja"), null, "private routes have no locale sibling");
  assert.equal(L.siblingPath("/cart", "ja"), null);
  assert.equal(L.siblingPath("/en/nonexistent", "ja"), null);
  assert.equal(L.siblingPath("/products/x", "xx"), null);
});

test("isLocalizable: public families yes, everything else no", () => {
  for (const p of ["/", "/en", "/ja/", "/products/x", "/categories/necklaces", "/collections", "/collections/kihei", "/blog", "/blog/a-post", "/jewelry-guide", "/shopping-guide", "/faq", "/about", "/why-cha-jewels", "/contact", "/affiliations", "/loyalty", "/sale", "/wholesale", "/legal/privacy", "/legal/terms", "/legal/returns", "/legal/tokusho", "/en/legal/tokusho", "/layaway", "/en/layaway"]) {
    assert.equal(L.isLocalizable(p), true, p);
  }
  for (const p of ["/loyalty/join", "/faq/extra", "/sale/x", "/cart", "/account", "/checkout/complete/1", "/ja/layaway", "/search", "/xx", "/constructor", "/__proto__", "/toString", "/hasOwnProperty", "", "//x"]) {
    assert.equal(L.isLocalizable(p), false, JSON.stringify(p));
  }
});

test("the helpers are idempotent", () => {
  for (const p of ["/", "/products/x", "/en/products/x", "/ja/legal/tokusho?z=1#a"]) {
    assert.equal(L.stripLocale(L.stripLocale(p)), L.stripLocale(p), p);
    assert.equal(L.localePath(L.localePath(p, "en"), "en"), L.localePath(p, "en"), p);
  }
});

// ---------------------------------------------------------------------------
// Batch A review: unsafe input, and forward compatibility with Phase 3.

const UNSAFE = [
  "/en//evil.com", "/ja//evil.com/x", "/en//legal/tokusho", "/products//x",
  "/\\evil.com", "/en/\\evil.com", "/en/x\\y",
  "/en/x\nSet-Cookie: a=b", "/en/products/x\r", "/\u0000", "/en/x\u007f",
  "//evil.com", "///evil.com", "https://evil.com/en/x", "javascript:alert(1)", "en/x", "",
];

test("isSitePath accepts real site paths and rejects anything a browser could read as another host", () => {
  for (const p of ["/", "/en", "/en/", "/ja/products/x?a=1#b", "/products/x/", "/legal/tokusho", "/blog/a-b-c", "/products/%E6%97%A5%E6%9C%AC"]) {
    assert.equal(L.isSitePath(p), true, JSON.stringify(p));
  }
  for (const p of UNSAFE) assert.equal(L.isSitePath(p), false, JSON.stringify(p));
  for (const p of [null, undefined, 7, {}, []]) assert.equal(L.isSitePath(p), false, String(p));
});

test("a query or fragment may contain slashes; only the path part is checked for empty segments", () => {
  assert.equal(L.isSitePath("/login?next=//x"), true);
  assert.equal(L.stripLocale("/en?next=//x"), "/?next=//x");
});

test("an unsafe path is returned UNCHANGED by every helper, never turned into a protocol-relative URL", () => {
  for (const p of UNSAFE) {
    assert.equal(L.stripLocale(p), p, `stripLocale ${JSON.stringify(p)}`);
    assert.equal(L.localePath(p, "en"), p, `localePath ${JSON.stringify(p)}`);
    assert.equal(L.localePath(p, "ja"), p, `localePath ${JSON.stringify(p)}`);
    assert.equal(L.localeOf(p), null, `localeOf ${JSON.stringify(p)}`);
    assert.equal(L.isLocalizable(p), false, `isLocalizable ${JSON.stringify(p)}`);
    assert.equal(L.siblingPath(p, "ja"), null, `siblingPath ${JSON.stringify(p)}`);
  }
});

test("nothing the helpers return for a site path can start with // or contain a backslash", () => {
  const inputs = ["/", "/en", "/ja/", "/en/products/x", "/en/x/", "/fr/x", "/products/x?next=//evil.com#//x"];
  for (const p of inputs) {
    for (const out of [L.stripLocale(p), L.localePath(p, "en"), L.localePath(p, "ja"), L.siblingPath(p, "en"), L.siblingPath(p, "ja")]) {
      if (out === null) continue;
      assert.equal(out.startsWith("//"), false, `${p} -> ${out}`);
      assert.equal(out.split(/[?#]/)[0].includes("\\"), false, `${p} -> ${out}`);
    }
  }
});

test("familyOf reports the rule for the family, prefixed or not", () => {
  assert.equal(L.familyOf("/products/x").shape, "children");
  assert.equal(L.familyOf("/en/products/x").shape, "children");
  assert.equal(L.familyOf("/faq").shape, "exact");
  assert.equal(L.familyOf("/faq/extra"), null);
  assert.equal(L.familyOf("/"), L.familyOf("/en"));
  assert.equal(L.familyOf("/cart"), null);
  assert.equal(L.familyOf("/constructor"), null);
  assert.deepEqual(L.familyOf("/layaway").locales, ["en"], "layaway exists in English only");
  assert.equal(L.familyOf("/layaway").live, true, "and its locale route is live (Phase 3)");
});

test("PHASE 3: the layaway family is English-only AND live in the shipped table; every family is live", () => {
  const rule = L.FAMILY_RULES.get("layaway");
  assert.deepEqual([...rule.locales], ["en"], "never add ja: nothing layaway-related on the Japanese site");
  assert.equal(rule.live, true);
  // `guides` is deliberately dark until the first guide is published with approved copy (tests/guides.test.mjs binds the two).
  const DARK_UNTIL_PUBLISHED = new Set(["guides"]);
  for (const [name, r] of L.FAMILY_RULES) assert.equal(r.live, !DARK_UNTIL_PUBLISHED.has(name), `${name} is ${DARK_UNTIL_PUBLISHED.has(name) ? "deliberately not live" : "live"}`);
});

test("PHASE 3 (shipped table): /layaway localises to /en/layaway only; /ja/layaway can never be minted", () => {
  const live = L;
  // Enabled: the English route is produced, from either the bare or the prefixed form.
  assert.equal(live.localePath("/layaway", "en"), "/en/layaway");
  assert.equal(live.localePath("/en/layaway", "en"), "/en/layaway");
  assert.equal(live.isLocalizable("/layaway"), true);
  assert.equal(live.siblingPath("/layaway", "en"), "/en/layaway");
  // Never Japanese, whatever the input or the flag.
  for (const p of ["/layaway", "/en/layaway", "/ja/layaway", "/layaway?x=1#y"]) {
    assert.equal(live.localePath(p, "ja"), p, `${p} must never become /ja/layaway`);
    assert.equal(live.siblingPath(p, "ja"), null, `${p} has no Japanese sibling`);
  }
  assert.equal(live.isLocalizable("/ja/layaway"), false);
  assert.equal(live.localePath("/en/layaway", "ja"), "/en/layaway");
  assert.equal(live.siblingPath("/en/layaway", "ja"), null);
  // The query and fragment travel with the English link (the ?piece= deep link).
  assert.equal(live.localePath("/layaway?piece=p1#calc", "en"), "/en/layaway?piece=p1#calc");
  // An author-written bare /layaway link on an English page now lands on the locale page.
  assert.equal(L.localizeAuthoredHref("/layaway", "en"), "/en/layaway");
  assert.equal(L.localizeAuthoredHref("/layaway", "ja"), "/layaway", "a Japanese page never gets an English layaway link minted for it");
});

test("ROLLBACK COMPAT: a table with layaway not live behaves as Option ii did (bare stays bare)", () => {
  const families = new Map(L.FAMILY_RULES);
  families.set("layaway", { ...families.get("layaway"), live: false });
  const off = L.createLocaleRules(families);
  for (const loc of ["en", "ja"]) assert.equal(off.localePath("/layaway", loc), "/layaway");
  assert.equal(off.siblingPath("/layaway", "en"), null);
  // No second implementation: the other families behave exactly as in the shipped table.
  for (const p of ["/", "/products/x", "/en/legal/tokusho", "/cart", "/loyalty/join", "/nonexistent"]) {
    for (const loc of ["en", "ja"]) assert.equal(off.localePath(p, loc), L.localePath(p, loc), `${p} ${loc}`);
  }
});

