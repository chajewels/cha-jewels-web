// The pure JSON-LD builder (lib/json-ld.ts), Phase 2B design H. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { buildJsonLd } = await import("@/lib/json-ld");
const B = "https://www.chajewelsjp.com";
// The fixture shape mirrors lib/fixtures.ts: variants carry the media and price.
const product = {
  name: "P1 Ring K18", sku: "P1", slug: "p1-ring-k18", description_en: "A ring.",
  origin: "JAPAN", brand: null, condition: "Preloved", status: "active",
  product_variants: [{ id: "v1", price_jpy: 10000, stock: 1, product_media: [{ url: "https://img.example/1.jpg", sort: 0 }] }],
  metals: [],
};

test("legacy product output is byte-stable: same fields, no inLanguage, no countryOfOrigin", () => {
  const d = buildJsonLd({ type: "product", product }, B, "");
  assert.equal(d["@type"], "Product");
  assert.equal(d.offers.url, `${B}/products/p1-ring-k18`);
  assert.equal(d.offers.itemCondition, "https://schema.org/UsedCondition");
  assert.equal("inLanguage" in d, false, "a legacy page must not gain fields");
  assert.equal(JSON.stringify(d).includes("countryOfOrigin"), false);
  assert.equal(d.brand, undefined, "brand only when the Hub says BRAND");
});

test("a locale page's product URLs carry the prefix and the page language", () => {
  for (const [prefix, lang] of [["/en", "en"], ["/ja", "ja-JP"]]) {
    const d = buildJsonLd({ type: "product", product }, B, prefix);
    assert.equal(d.offers.url, `${B}${prefix}/products/p1-ring-k18`, prefix);
    assert.equal(d.inLanguage, lang, prefix);
  }
});

test("the store: legacy url is the origin; locale url is the locale home", () => {
  assert.equal(buildJsonLd({ type: "store" }, B, "").url, B);
  assert.equal("inLanguage" in buildJsonLd({ type: "store" }, B, ""), false);
  assert.equal(buildJsonLd({ type: "store" }, B, "/ja").url, `${B}/ja`);
  assert.equal(buildJsonLd({ type: "store" }, B, "/ja").inLanguage, "ja-JP");
});

test("a post's @id follows the page, and its inLanguage is the post's own", () => {
  const post = { slug: "what-is-k18", title: "T", excerpt: "E", date: "2026-01-01", cover: null, lang: "en" };
  assert.equal(buildJsonLd({ type: "post", post }, B, "").mainEntityOfPage["@id"], `${B}/blog/what-is-k18`);
  assert.equal(buildJsonLd({ type: "post", post }, B, "/en").mainEntityOfPage["@id"], `${B}/en/blog/what-is-k18`);
  assert.equal(buildJsonLd({ type: "post", post }, B, "/en").inLanguage, "en");
});

test("the FAQ builder is unchanged by a prefix", () => {
  const items = [{ q: "Q?", a: "A." }];
  assert.deepEqual(buildJsonLd({ type: "faq", items }, B, "/en"), buildJsonLd({ type: "faq", items }, B, ""));
});

// ---------------------------------------------------------------- Phase 4: BreadcrumbList
const trail = [{ name: "Collections", path: "/collections" }, { name: "Rings", path: "/collections/rings" }, { name: "CJ-1005", path: "/products/solitaire-ring" }];

test("breadcrumb: positions 1..n, names verbatim, absolute URLs without a prefix on a legacy page", () => {
  const d = buildJsonLd({ type: "breadcrumb", items: trail }, B, "");
  assert.equal(d["@type"], "BreadcrumbList");
  assert.deepEqual(d.itemListElement.map((e) => e.position), [1, 2, 3]);
  assert.deepEqual(d.itemListElement.map((e) => e.name), ["Collections", "Rings", "CJ-1005"]);
  assert.deepEqual(d.itemListElement.map((e) => e.item), [`${B}/collections`, `${B}/collections/rings`, `${B}/products/solitaire-ring`]);
  assert.ok(d.itemListElement.every((e) => e["@type"] === "ListItem"));
});

test("breadcrumb: every URL carries the page's locale prefix", () => {
  for (const prefix of ["/en", "/ja"]) {
    const d = buildJsonLd({ type: "breadcrumb", items: trail }, B, prefix);
    assert.deepEqual(d.itemListElement.map((e) => e.item), [`${B}${prefix}/collections`, `${B}${prefix}/collections/rings`, `${B}${prefix}/products/solitaire-ring`], prefix);
  }
});

test("breadcrumb: a path of '/' is the locale home — the bare origin on a legacy page, never a trailing slash", () => {
  const home = [{ name: "Home", path: "/" }, { name: "Fine Jewelry", path: "/categories/fine-jewelry" }];
  assert.equal(buildJsonLd({ type: "breadcrumb", items: home }, B, "").itemListElement[0].item, B);
  assert.equal(buildJsonLd({ type: "breadcrumb", items: home }, B, "/ja").itemListElement[0].item, `${B}/ja`);
  assert.equal(buildJsonLd({ type: "breadcrumb", items: home }, B, "/en").itemListElement[1].item, `${B}/en/categories/fine-jewelry`);
});

test("breadcrumb: the builder never adds a crumb the page did not pass (two-level trails stay two)", () => {
  const d = buildJsonLd({ type: "breadcrumb", items: trail.slice(0, 2) }, B, "/en");
  assert.equal(d.itemListElement.length, 2);
});

// ---------------------------------------------------------------- Phase 4: JewelryStore entity (§16)
test("store: the legacy key order is untouched and the new fields are appended", () => {
  const keys = Object.keys(buildJsonLd({ type: "store" }, B, ""));
  assert.deepEqual(keys.slice(0, 8), ["@context", "@type", "name", "legalName", "url", "address", "areaServed", "priceRange"]);
  assert.deepEqual(keys.slice(8), ["logo", "telephone"], "email / sameAs only when passed");
});

test("store: full registered address, the original three keys first", () => {
  const a = buildJsonLd({ type: "store" }, B, "").address;
  assert.deepEqual(Object.keys(a), ["@type", "addressLocality", "addressRegion", "addressCountry", "streetAddress", "postalCode"]);
  assert.equal(a.streetAddress, "6-5-1 Tateishi, Time Mansion 301");
  assert.equal(a.postalCode, "124-0012");
  assert.equal(a.addressCountry, "JP");
});

test("store: logo is the absolute badge URL (never locale-prefixed); telephone is the office line in E.164", async () => {
  const { COMPANY_PHONE } = await import("@/lib/content/legal");
  assert.equal(COMPANY_PHONE.office, "03-6657-6129", "the digits the E.164 form is derived from");
  for (const prefix of ["", "/en", "/ja"]) {
    const d = buildJsonLd({ type: "store" }, B, prefix);
    assert.equal(d.logo, `${B}/images/brand/logo-badge-512.webp`, prefix);
    assert.equal(d.telephone, "+81-3-6657-6129", prefix);
  }
});

test("store: email and sameAs come from the Hub only — absent when not passed; mailto: and chat links never become sameAs (BUG-02)", () => {
  const none = buildJsonLd({ type: "store", email: null, sameAs: [] }, B, "");
  assert.equal("email" in none, false);
  assert.equal("sameAs" in none, false);
  const onlyMail = buildJsonLd({ type: "store", sameAs: ["mailto:sales@example.com"] }, B, "");
  assert.equal("sameAs" in onlyMail, false, "a row of mailto links is no sameAs");
  const onlyChat = buildJsonLd({ type: "store", sameAs: ["https://m.me/chajewelsjapan"] }, B, "");
  assert.equal("sameAs" in onlyChat, false, "a row of only chat links is no sameAs (BUG-02: m.me is a messaging endpoint, not an identity profile)");
  const d = buildJsonLd({ type: "store", email: "sales@example.com", sameAs: ["mailto:sales@example.com", "https://www.facebook.com/chajewelsjapan", "https://m.me/chajewelsjapan"] }, B, "/en");
  assert.equal(d.email, "sales@example.com");
  assert.deepEqual(d.sameAs, ["https://www.facebook.com/chajewelsjapan"], "the real Hub row (facebook + m.me) yields the profile only");
  assert.equal("openingHours" in d, false, "customer-service hours are not shop hours");
});

test("isProfileUrl (BUG-02) excludes KNOWN chat endpoints, mailto, relative and malformed hrefs; it is not a validator of social-profile URLs — any other http(s) host passes", async () => {
  const { isProfileUrl } = await import("@/lib/json-ld");
  for (const ok of ["https://www.facebook.com/chajewelsjapan", "https://facebook.com/chajewelsjapan", "https://www.instagram.com/chajewels", "https://www.tiktok.com/@chajewels", "https://www.youtube.com/@chajewels", "https://x.com/chajewels", "http://www.pinterest.com/chajewels", "https://www.threads.net/@chajewels", "https://www.linkedin.com/company/cha-jewels"]) {
    assert.equal(isProfileUrl(ok), true, ok);
  }
  for (const no of ["https://m.me/chajewelsjapan", "https://M.ME/chajewelsjapan", "https://www.messenger.com/t/chajewelsjapan", "https://wa.me/8107083073318", "https://api.whatsapp.com/send?phone=81", "https://line.me/ti/p/abc", "https://lin.ee/abc", "https://t.me/chajewels", "https://viber.com/chajewels", "mailto:sales@example.com", "tel:+81-3-6657-6129", "/contact", "m.me/chajewelsjapan", "https://", "not a url"]) {
    assert.equal(isProfileUrl(no), false, no);
  }
});

test("BUG-02 source guard: the store builder filters sameAs through isProfileUrl, never a bare http(s) test", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../lib/json-ld.ts", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");
  assert.match(src, /sameAs: props\.sameAs\.filter\(isProfileUrl\)/);
  assert.doesNotMatch(src, /filter\(isWebUrl\)/);
});

// ---------------------------------------------------------------- Phase 4: Product — X5 description, §7 reviews
const bilingual = { ...product, description_ja: "指輪です。" };

test("X5: the Japanese page describes the piece in Japanese when the Hub has it; English otherwise", () => {
  assert.equal(buildJsonLd({ type: "product", product: bilingual }, B, "/ja").description, "指輪です。");
  assert.equal(buildJsonLd({ type: "product", product: bilingual }, B, "/en").description, "A ring.");
  assert.equal(buildJsonLd({ type: "product", product: bilingual }, B, "").description, "A ring.", "legacy page unchanged");
  assert.equal(buildJsonLd({ type: "product", product: { ...product, description_ja: "   " } }, B, "/ja").description, "A ring.", "blank Japanese falls back to English");
  assert.equal(buildJsonLd({ type: "product", product: { ...product, description_ja: null } }, B, "/ja").description, "A ring.");
  assert.equal(buildJsonLd({ type: "product", product: { ...product, description_en: null, description_ja: null } }, B, "/ja").description, undefined);
});

const shown = [
  { display_name: "Maria", rating: 5, body: "Lovely piece.", approved_at: "2026-10-01T03:00:00Z" },
  { display_name: "Ken", rating: 4, body: null, approved_at: "2026-10-05T03:00:00Z" },
];

test("reviews: no rating passed, count 0, or a null average → no aggregateRating and no review", () => {
  for (const rating of [undefined, null, { count: 0, average: null, reviews: [] }, { count: 0, average: 5, reviews: [] }, { count: 3, average: null, reviews: shown }]) {
    const d = buildJsonLd({ type: "product", product, rating }, B, "/en");
    assert.equal("aggregateRating" in d, false, JSON.stringify(rating));
    assert.equal("review" in d, false, JSON.stringify(rating));
  }
});

test("reviews: the Hub's count and average verbatim, one Review per card shown, body omitted when null", () => {
  const d = buildJsonLd({ type: "product", product, rating: { count: 7, average: 4.6, reviews: shown } }, B, "/en");
  assert.deepEqual(d.aggregateRating, { "@type": "AggregateRating", ratingValue: 4.6, reviewCount: 7 });
  assert.equal(d.review.length, 2);
  assert.deepEqual(d.review[0], { "@type": "Review", author: { "@type": "Person", name: "Maria" }, reviewRating: { "@type": "Rating", ratingValue: 5 }, reviewBody: "Lovely piece.", datePublished: "2026-10-01T03:00:00Z" });
  assert.equal("reviewBody" in d.review[1], false);
  assert.equal(d.review[1].author.name, "Ken");
});

test("reviews: an aggregate with no cards passed emits aggregateRating alone", () => {
  const d = buildJsonLd({ type: "product", product, rating: { count: 2, average: 5, reviews: [] } }, B, "");
  assert.equal(d.aggregateRating.reviewCount, 2);
  assert.equal("review" in d, false);
});

test("the Product never invents identifiers or origin: no gtin, mpn or countryOfOrigin in any branch", () => {
  const s = JSON.stringify(buildJsonLd({ type: "product", product: bilingual, rating: { count: 7, average: 4.6, reviews: shown } }, B, "/ja"));
  for (const k of ["gtin", "mpn", "countryOfOrigin"]) assert.equal(s.includes(k), false, k);
});
