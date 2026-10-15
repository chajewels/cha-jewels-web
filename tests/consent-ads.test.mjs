// The cookie banner's record (lib/consent.ts), the advertising tags' rules
// (lib/ads.ts) and the events lib/analytics.ts sends them (owner rule
// 2026-10-15: nothing advertising-related loads or fires until Accept).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const mod = (p) => import(pathToFileURL(join(process.cwd(), p)).href);
const consent = await mod("lib/consent.ts");
const ads = await mod("lib/ads.ts");
const analytics = await mod("lib/analytics.ts");
const { dict } = await mod("lib/i18n.ts");

function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    dump: () => Object.fromEntries(m),
  };
}

// ---------------------------------------------------------------- consent

test("a valid record reads back; anything else is unset", () => {
  const ok = JSON.stringify({ v: 1, ads: "granted", at: "2026-10-15T10:00:00.000Z" });
  assert.deepEqual(consent.parseConsent(ok), { v: 1, ads: "granted", at: "2026-10-15T10:00:00.000Z" });
  assert.equal(consent.parseConsent(JSON.stringify({ v: 1, ads: "denied", at: "2026-10-15T10:00:00Z" }))?.ads, "denied");
  for (const bad of [
    null, "", "granted", "{", "null", "[]", "1",
    JSON.stringify({ v: 2, ads: "granted", at: "2026-10-15T10:00:00Z" }),
    JSON.stringify({ v: 1, ads: "yes", at: "2026-10-15T10:00:00Z" }),
    JSON.stringify({ v: 1, ads: "granted" }),
    JSON.stringify({ v: 1, ads: "granted", at: "not a date" }),
  ]) assert.equal(consent.parseConsent(bad), null, `should be unset: ${bad}`);
});

test("write stores {v:1, ads, at} under cj-consent and announces it; clear forgets", () => {
  consent.__resetConsentMemoForTest();
  const store = memoryStorage();
  const events = [];
  globalThis.window = { dispatchEvent: (e) => { events.push(e); return true; } };
  try {
    const rec = consent.writeConsent("granted", new Date("2026-10-15T01:02:03.000Z"), store);
    assert.deepEqual(rec, { v: 1, ads: "granted", at: "2026-10-15T01:02:03.000Z" });
    assert.deepEqual(JSON.parse(store.dump()["cj-consent"]), rec);
    assert.deepEqual(consent.readConsent(store), rec);
    assert.equal(consent.adsGranted(store), true);
    assert.equal(events.at(-1).type, "cj-consent-change");
    assert.deepEqual(events.at(-1).detail, rec);

    consent.writeConsent("denied", new Date("2026-10-16T00:00:00.000Z"), store);
    assert.equal(consent.adsGranted(store), false);

    consent.clearConsent(store);
    assert.equal(store.dump()["cj-consent"], undefined);
    assert.equal(consent.readConsent(store), null);
    assert.equal(events.at(-1).detail, null);
  } finally {
    delete globalThis.window;
  }
});

test("storage that throws never throws into the page, and the choice still holds for this page", () => {
  consent.__resetConsentMemoForTest();
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("quota"); }, removeItem() { throw new Error("blocked"); } };
  assert.equal(consent.readConsent(broken), null);
  assert.doesNotThrow(() => consent.writeConsent("granted", new Date(), broken));
  assert.equal(consent.readConsent(broken)?.ads, "granted");
  assert.doesNotThrow(() => consent.clearConsent(broken));
  assert.equal(consent.readConsent(broken), null);
});

test("an invalid stored value reads as unset, never as consent", () => {
  consent.__resetConsentMemoForTest();
  assert.equal(consent.adsGranted(memoryStorage({ "cj-consent": '{"v":1,"ads":"GRANTED","at":"2026-10-15T00:00:00Z"}' })), false);
  assert.equal(consent.readConsent(memoryStorage({ "cj-consent": "granted" })), null);
});

// ---------------------------------------------------------------- ads rules

test("both ids are required, and must be well-formed (they go into a script URL)", () => {
  assert.deepEqual(ads.adsIds("123456789012345", "AW-1234567890"), { pixel: "123456789012345", aw: "AW-1234567890" });
  assert.equal(ads.adsIds("123456789012345", ""), null);
  assert.equal(ads.adsIds("", "AW-1234567890"), null);
  assert.equal(ads.adsIds(undefined, undefined), null);
  assert.equal(ads.adsIds("123'><script>", "AW-1234567890"), null);
  assert.equal(ads.adsIds("123456789012345", "AW-1&x=1"), null);
  assert.equal(ads.purchaseLabel(""), null);
  assert.equal(ads.purchaseLabel("AbC_12-x"), "AbC_12-x");
  assert.equal(ads.purchaseLabel("a/b"), null);
});

test("the tags never load on a customer's own pages (pay-card included)", () => {
  for (const p of ["/account", "/account/orders/abc", "/account/orders/abc/pay-card"]) assert.equal(ads.adsLoadsOn(p), false, p);
  for (const p of ["/", "/products/k18-chain", "/checkout", "/legal/privacy", "/accounts-of-gold"]) assert.equal(ads.adsLoadsOn(p), true, p);
});

test("page views: allowed only for a URL that is already clean (Metricool's rule)", () => {
  const base = "https://chajewelsjp.com";
  for (const u of ["/", "/products/k18-chain", "/collections?lang=en", "/checkout?mode=full", "/?utm_source=meta&utm_campaign=fall", "/faq#payments"]) {
    assert.equal(ads.adsPageViewAllowed(base + u), true, u);
  }
  for (const u of [
    "/account", "/account/orders/123", "/login?next=/account", "/auth/confirm?token_hash=abc",
    "/checkout/complete/ord-1", "/checkout/complete/d/draft-1", "/search?q=ring", "/checkout?quote=q-1",
    "/?fbclid=abc", "/?gclid=abc", "/#access_token=abc",
  ]) assert.equal(ads.adsPageViewAllowed(base + u), false, u);
  assert.equal(ads.adsPageViewAllowed("not a url"), false);
});

test("Google consent moves every signal together", () => {
  assert.deepEqual(ads.googleConsent("denied"), { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
  assert.deepEqual(Object.values(ads.googleConsent("granted")), ["granted", "granted", "granted", "granted"]);
});

test("the purchase figure is the Hub's own, chosen not computed", () => {
  assert.deepEqual(ads.purchaseFromPayResult({ total: 236800, currency: "JPY", total_jpy: 236800 }), { value: 236800, currency: "JPY" });
  assert.deepEqual(ads.purchaseFromPayResult({ total: 85432, currency: "PHP", total_jpy: 236800 }), { value: 85432, currency: "PHP" });
  assert.deepEqual(ads.purchaseFromPayResult({ total_jpy: 120000 }), { value: 120000, currency: "JPY" }, "an older Hub: yen only");
  assert.equal(ads.purchaseFromPayResult({ total: 0, currency: "JPY" }), null);
  assert.equal(ads.purchaseFromPayResult({}), null);
  assert.equal(ads.purchaseFromPayResult({ total: 100, currency: "yen" }), null);
});

test("purchase payload: Meta always, Google only with a label, never an order reference", () => {
  const p = { value: 236800, currency: "JPY" };
  assert.deepEqual(ads.purchaseCalls(p, "AW-1234567890", null), [
    { tag: "fbq", args: ["track", "Purchase", { value: 236800, currency: "JPY" }] },
  ]);
  const withLabel = ads.purchaseCalls(p, "AW-1234567890", "AbC123");
  assert.deepEqual(withLabel[1], { tag: "gtag", args: ["event", "conversion", { send_to: "AW-1234567890/AbC123", value: 236800, currency: "JPY" }] });
  assert.ok(!JSON.stringify(withLabel).includes("transaction_id"));
  assert.ok(!JSON.stringify(withLabel).includes("CJ-W-"));
});

// ---------------------------------------------------------------- events

const ENV = ["NEXT_PUBLIC_VERCEL_ENV", "NEXT_PUBLIC_META_PIXEL_ID", "NEXT_PUBLIC_GOOGLE_ADS_ID", "NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL", "NEXT_PUBLIC_PREVIEW_FIXTURES"];
const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
function restoreEnv() { for (const k of ENV) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } }

/** A production browser with both tags present and the given stored choice. */
function browser(choice, { label } = {}) {
  consent.__resetConsentMemoForTest();
  analytics.__resetViewedForTest();
  process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
  process.env.NEXT_PUBLIC_META_PIXEL_ID = "123456789012345";
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-1234567890";
  delete process.env.NEXT_PUBLIC_PREVIEW_FIXTURES;
  if (label) process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL = label; else delete process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;
  const calls = [];
  const store = memoryStorage(choice ? { "cj-consent": JSON.stringify({ v: 1, ads: choice, at: "2026-10-15T00:00:00.000Z" }) } : {});
  globalThis.window = {
    location: { hostname: "chajewelsjp.com" },
    localStorage: store,
    va: () => {}, // Vercel's queue, so emit() sends at once instead of polling past the test.
    dispatchEvent: () => true,
    fbq: (...a) => calls.push(["fbq", ...a]),
    gtag: (...a) => calls.push(["gtag", ...a]),
  };
  return calls;
}
beforeEach(() => { delete globalThis.window; restoreEnv(); });

test("no choice, or 'Only necessary': no advertising call at all", () => {
  for (const choice of [null, "denied"]) {
    const calls = browser(choice, { label: "AbC123" });
    analytics.trackProductView("SKU-1", "en");
    analytics.trackAddToCart("SKU-1", "en");
    analytics.trackSearch("Ring", 3);
    analytics.trackInitiateCheckout();
    analytics.trackPurchase({ value: 1000, currency: "JPY" });
    assert.deepEqual(calls, [], `choice ${choice}`);
  }
});

test("Accept: the mirrored events and the purchase reach the tags", () => {
  const calls = browser("granted", { label: "AbC123" });
  analytics.trackProductView("SKU-1", "en");
  analytics.trackAddToCart("SKU-1", "en");
  analytics.trackSearch("  Ring ", 3);
  analytics.trackInitiateCheckout();
  analytics.trackPurchase({ value: 1000, currency: "JPY" });
  assert.deepEqual(calls, [
    ["fbq", "track", "ViewContent", { content_ids: ["SKU-1"], content_type: "product" }],
    ["fbq", "track", "AddToCart", { content_ids: ["SKU-1"] }],
    ["fbq", "track", "Search", { search_string: "ring" }],
    ["fbq", "track", "InitiateCheckout"],
    ["fbq", "track", "Purchase", { value: 1000, currency: "JPY" }],
    ["gtag", "event", "conversion", { send_to: "AW-1234567890/AbC123", value: 1000, currency: "JPY" }],
  ]);
});

test("Accept without a purchase label: Meta only", () => {
  const calls = browser("granted");
  analytics.trackPurchase({ value: 1000, currency: "PHP" });
  assert.deepEqual(calls, [["fbq", "track", "Purchase", { value: 1000, currency: "PHP" }]]);
});

test("not production, or one id missing: nothing, even with Accept", () => {
  let calls = browser("granted");
  process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
  analytics.trackPurchase({ value: 1000, currency: "JPY" });
  assert.deepEqual(calls, []);
  calls = browser("granted");
  delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  analytics.adsEvent("ViewContent", { content_ids: ["x"] });
  assert.deepEqual(calls, []);
});

// ---------------------------------------------------------------- copy

test("the banner and the footer link have their words in both languages", () => {
  for (const key of ["region", "title", "body", "accept", "necessary", "privacy"]) {
    assert.ok(dict.consent[key]?.ja?.trim(), `consent.${key} ja`);
    assert.ok(dict.consent[key]?.en?.trim(), `consent.${key} en`);
  }
  assert.ok(dict.footer.cookieSettings.ja.trim() && dict.footer.cookieSettings.en.trim());
  assert.equal(dict.consent.accept.en, "Accept");
  assert.equal(dict.consent.necessary.en, "Only necessary");
});
