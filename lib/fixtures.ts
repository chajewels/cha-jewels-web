import type { Category, CheckoutMode, Collection, CutoutStatus, ProductCutout, HubDraft, HubDraftDetail, HubDraftPayResult, HubLayawayDetail, HubLayawayPayResult, HubLayawayPlan, HubCartLine, HubLayawayScheduleRow, HubMe, HubOrder, HubCardPayment, HubCardResult, CheckoutMethod, HubCheckoutChoice, HubOrderDetail, HubPayResult, HubPointsPreview, HubQuote, HubQuoteItem, HubTier, LayawayQuote, LayawayScheduleRow, LayawayTerm, OrderType, Product, ServiceRequest, ServiceRequestInput, SettlementCurrency, SiteSettings, HubFaqSection, HubPost, TransferMethod, PaidyCheckoutPayload } from "@/lib/types";
import { tiers as localTiers } from "@/lib/loyalty";
import { faqSections } from "@/lib/content/faq";
import { liveMirrorProducts } from "@/lib/fixtures-live";
import { blocksToMarkdown, sectionSlug } from "@/lib/content/faq-markdown";
/** Local preview data. Active only when NEXT_PUBLIC_PREVIEW_FIXTURES=1. Never shipped to production. */
/** The preview Hub's day rate (PHP per 1 JPY). Preview data only. */
export const FIXTURE_RATE = 0.39;
/** plan_configurations as it stands: months, the yen minimum and the fixed peso minimum. Declared before `products`, which reads it at load. */
const PLAN_MINIMUMS: [number, number, number][] = [[3, 0, 0], [6, 25000, 10500], [8, 300000, 126000], [10, 600000, 252000], [12, 1000000, 420000]];
/**
 * `NEXT_PUBLIC_PREVIEW_NO_FX=1` plays a Hub with no rate on file: variants
 * carry no `down_payment_php`, and a peso layaway quote answers 503
 * fx_unavailable (lib/hub-api.ts), so the "no rate, no peso figure" paths can
 * be seen without the Hub.
 */
export const FIXTURE_NO_FX = process.env.NEXT_PUBLIC_PREVIEW_NO_FX === "1";
/** What the Hub's website_down_payments answers for a price: the 3-month quote's deposit, both currencies. */
function fixtureDownPayments(jpy: number) {
  const jpyDp = quote(jpy, 3, "JPY").down_payment;
  return FIXTURE_NO_FX ? { down_payment_jpy: jpyDp, down_payment_pct: 0.3 } : { down_payment_jpy: jpyDp, down_payment_php: quote(jpy, 3, "PHP").down_payment, down_payment_pct: 0.3 };
}
/**
 * RESERVE FIRST (Hub A2) in preview. `NEXT_PUBLIC_PREVIEW_RESERVATION=1`, with
 * fixtures on, plays the Hub with `web_reservation_mode` switched ON: the quote
 * comes back with `reservation_mode`, checkout lands on a reservation, and the
 * account gains one reserved order and one reserved plan. Unset, every fixture
 * is exactly what it was — the switch-off world.
 */
const PREVIEW_RESERVATION = process.env.NEXT_PUBLIC_PREVIEW_RESERVATION === "1";
/** NEXT_PUBLIC_PREVIEW_PAIDY=1 offers Paidy ato-barai on the preview's yen order (the Hub's test-key shape). */
export const PREVIEW_PAIDY = process.env.NEXT_PUBLIC_PREVIEW_PAIDY === "1";
/**
 * NEXT_PUBLIC_PREVIEW_PAIDY_STATE (QA 2026-10-08), with PREVIEW_PAIDY, on the
 * preview's yen orders: "needs" = she chose Paidy but her names are missing
 * (the requirements form shows); "window" = her Paidy window was left open
 * (payment_state paidy_window_open: notice + Paidy offered again).
 */
const PREVIEW_PAIDY_STATE = process.env.NEXT_PUBLIC_PREVIEW_PAIDY_STATE;
/** NEXT_PUBLIC_PREVIEW_CARD=1 offers a card payment (Square sandbox shape) on the preview's yen order; the Hub's `card` block as it answers in test mode. */
export const PREVIEW_CARD = process.env.NEXT_PUBLIC_PREVIEW_CARD === "1";
/**
 * NEXT_PUBLIC_PREVIEW_CARD_STATE=processing|held|capturing|recording plays an
 * UNRESOLVED card payment on the preview's yen order (SQ22): the Hub then
 * answers `card_payment` with that state and hides every way to pay
 * (`card: null`, `paidy: null`, no transfer methods), exactly as it does live.
 */
const PREVIEW_CARD_STATE = ((v): HubCardPayment["state"] | null => (v === "processing" || v === "held" || v === "capturing" || v === "recording" ? v : null))(process.env.NEXT_PUBLIC_PREVIEW_CARD_STATE);
/** NEXT_PUBLIC_PREVIEW_CARD_RESULT=unknown makes the preview's POST /orders/:id/card answer 202 (Square's answer not known yet). */
const PREVIEW_CARD_RESULT = process.env.NEXT_PUBLIC_PREVIEW_CARD_RESULT === "unknown" ? "unknown" : "ok";
// Website orders (Hub PR 6 / storefront PR 7): NEXT_PUBLIC_PREVIEW_DRAFTS=1
// makes the preview Hub answer checkout with a DRAFT and list drafts in the
// account, as the live Hub does with web_checkout_mode = 'draft'.
const PREVIEW_DRAFTS = process.env.NEXT_PUBLIC_PREVIEW_DRAFTS === "1";
/**
 * WEBSITE PAYMENT LIFECYCLE (Hub H6). NEXT_PUBLIC_PREVIEW_REJECTED=1 adds a
 * confirmed yen web order she chose to pay with Paidy, whose Paidy submission a
 * reviewer REJECTED: the Hub's `latest_decision`, the switch she may make
 * (`can_switch_method`, `switch_methods`) and the list-row fields. Every
 * other fixture order carries none of the new fields — an older Hub.
 */
const PREVIEW_REJECTED = process.env.NEXT_PUBLIC_PREVIEW_REJECTED === "1";
export const REJECTED_ORDER_ID = "order-paidy-rejected";
export const FIXTURE_DRAFT_ID = "00000000-0000-4000-8000-00000000d001";
export const FIXTURE_DRAFT_REFERENCE = "CJ-W-900070";
const RESERVED_ORDER_ID = "order-reserved";
const RESERVED_ORDER_REFERENCE = "CJ-W-000003";
const RESERVED_PLAN_ID = "plan-reserved";
const RESERVED_PLAN_REFERENCE = "CJ-W-900004";

/** Plans in `layawayPlansFixture`, stated here because `meFixture` is declared first. */
const layawayPlansFixtureCount = 7;
export const collections: Collection[] = [
  { id: "c1", slug: "necklaces", name: "Necklaces", name_ja: "ネックレス", hero_media: null, description: "Chains and strands in K18 and pearl, sized for daily wear.", description_ja: "K18とパールのチェーン・ネックレス。毎日身につけやすい長さでご用意しています。" },
  { id: "c2", slug: "pendants", name: "Pendants", name_ja: "ペンダント", hero_media: null, description: "Diamond, pearl and gold pendants to hang on your own chain or ours.", description_ja: "ダイヤモンド、パール、ゴールドのペンダント。お手持ちのチェーンにも、当店のチェーンにも。" },
  { id: "c3", slug: "earrings", name: "Earrings", name_ja: "ピアス・イヤリング", hero_media: null, description: "Hoops, studs and drops in K18 and platinum.", description_ja: "K18とプラチナのフープ、スタッド、ドロップタイプ。" },
  { id: "c4", slug: "bracelets", name: "Bracelets", name_ja: "ブレスレット", hero_media: null, description: "Bangles and chain bracelets, weight stated on every piece.", description_ja: "バングルとチェーンブレスレット。すべての商品に重量を表示しています。" },
  { id: "c5", slug: "rings", name: "Rings", name_ja: "リング", hero_media: null, description: "Solitaires, bands and statement rings, resizable in Japan.", description_ja: "ソリティア、バンド、ステートメントリング。日本国内でサイズ直しを承ります。" },
  { id: "c6", slug: "anklets", name: "Anklets", name_ja: "アンクレット", hero_media: null, description: "Fine K18 anklets for everyday wear.", description_ja: "毎日身につけられる華奢なK18アンクレット。" },
  // One type without Japanese yet: the site must fall back to English, not blank.
  { id: "c7", slug: "sets", name: "Sets", name_ja: null, hero_media: null, description: "Matched pieces sold together at a set price.", description_ja: null },
]; 
const mk = (i: number, name: string, karat: Product["karat"], w: number, jpy: number, stone: string | null, col: string, name_ja: string | null = null): Product & { col: string } => ({
  id: `p${i}`, sku: `CJ-${1000 + i}`, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, name_en: name, name_ja, karat, metals: karat ? [karat] : [], weight_g: w, status: "active", col,
  // Rings are the preloved line in preview data; everything else is New.
  condition: col === "rings" ? "Preloved" : "New",
  // Category membership mirrors that: the preloved ring sits under the preloved
  // line, the branded piece under the branded one, the rest under fine jewelry.
  category_slugs: col === "rings" ? ["preloved-jewelry"] : i === 3 ? ["preloved-branded-jewelry"] : ["fine-jewelry"],
  description_en: `${name}. ${karat} ${stone ? "with " + stone + ", " : ""}hallmark checked in Japan and priced by weight.`, description_ja: null, description_tl: null,
  // Preview origins: p2 is confirmed Japanese, p3 is a branded piece, the rest
  // are UNKNOWN — so the preview exercises every OriginBadge branch honestly.
  origin: i === 2 ? "JAPAN" : i === 3 ? "BRAND" : "UNKNOWN",
  brand: i === 3 ? "Tiffany & Co." : null,
  product_variants: [{ id: `v${i}`, size: null, stone, price_jpy: jpy, price_php: Math.round(jpy * FIXTURE_RATE), ...fixtureDownPayments(jpy), stock_qty: i % 5 === 0 ? 0 : 3, product_media: [] }],
});
/**
 * Preview categories, in sort_order. hero_media is null throughout, so the
 * preview shows what a category looks like before the owner uploads a photo:
 * its own pieces on the banner and in the menu thumbnail (lib/category-thumbs.ts).
 * `NEXT_PUBLIC_PREVIEW_CATEGORY_PHOTO=<slug,…>` plays the owner having uploaded
 * one (a collection photo stands in), so the "owner photo first" path can be seen.
 */
export const categories: Category[] = [
  { id: "cat1", slug: "fine-jewelry", name: "Fine Jewelry", name_ja: "ファインジュエリー", description: "K18 gold, pearls and diamonds, hallmark checked in Japan and priced by weight.", description_ja: "K18ゴールド、パール、ダイヤモンド。日本で刻印を確認し、重量に基づいた価格でご案内します。", hero_media: null, cta_label: "Shop fine jewelry", cta_label_ja: "ファインジュエリーを見る", sort_order: 1 },
  { id: "cat2", slug: "preloved-jewelry", name: "Preloved Jewelry", name_ja: "プレラブドジュエリー", description: "Carefully chosen second-hand pieces, each one checked before it is offered.", description_ja: "丁寧に選んだ中古ジュエリー。一点ずつ確認したうえでご紹介しています。", hero_media: null, cta_label: "Shop preloved", cta_label_ja: "プレラブドを見る", sort_order: 2 },
  { id: "cat3", slug: "preloved-branded-jewelry", name: "Preloved Branded Jewelry", name_ja: "プレラブド ブランドジュエリー", description: "Pieces from iconic houses, with the brand stated and the origin left to the listing.", description_ja: "著名ブランドのジュエリー。ブランド名を明記し、由来は各商品ページに記載しています。", hero_media: null, cta_label: "Shop branded", cta_label_ja: "ブランドジュエリーを見る", sort_order: 3 },
  { id: "cat4", slug: "preloved-watches", name: "Preloved Watches", name_ja: "プレラブドウォッチ", description: "Second-hand watches, movement and condition described on every listing.", description_ja: "中古時計。ムーブメントと状態を各商品ページに記載しています。", hero_media: null, cta_label: "Shop watches", cta_label_ja: "ウォッチを見る", sort_order: 4 },
  { id: "cat5", slug: "preloved-designer-accessories", name: "Preloved Designer Accessories", name_ja: "プレラブド デザイナーアクセサリー", description: "Bags and small leather goods from the houses our customers ask for.", description_ja: "お客様からご要望の多いブランドのバッグや革小物。", hero_media: null, cta_label: "Shop accessories", cta_label_ja: "アクセサリーを見る", sort_order: 5 },
];
for (const slug of (process.env.NEXT_PUBLIC_PREVIEW_CATEGORY_PHOTO ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
  const c = categories.find((x) => x.slug === slug);
  if (c) c.hero_media = "/images/collections/pearls.webp";
}
export const products = [
  mk(1, "Double-sided diamond pendant", "PT900", 16.9, 1480000, "2.62 ct diamonds", "pendants", "両面ダイヤモンドペンダント"),
  mk(2, "Kihei chain 50 cm", "K18", 20.4, 398000, null, "necklaces", "喜平チェーン 50 cm"),
  mk(3, "Twist bangle", "K18", 12.1, 236000, null, "bracelets", "ツイストバングル"),
  mk(4, "Akoya strand 7.5 mm", "K18", 4.2, 168000, "Akoya pearls", "earrings", "あこや真珠 7.5 mm"),
  // No Japanese name yet — the card must show the English one.
  mk(5, "Solitaire ring", "PT950", 3.8, 312000, "0.5 ct diamond", "rings"),
  mk(6, "Hoop earrings", "K18", 5.6, 118000, null, "necklaces"),
  mk(7, "Baby bangle", "K18", 6.3, 124000, null, "bracelets"),
  mk(8, "Freshwater drop earrings", "K18", 3.1, 62000, "freshwater pearls", "earrings"),
  // The hero's preloved medallion (lib/hero-deck.ts), with a 750 stamp shown
  // exactly as sent.
  mk(9, "Layered wave ring", "750" as Product["karat"], 19, 679980, "Diamond 2.70ct", "rings"),
  // Branded pieces for the hero's vitrine. p10 is at zero stock (i % 5), so
  // the vitrine must pass over it.
  mk(10, "Open heart pendant", "K18", 3.4, 88000, null, "necklaces", "オープンハート ペンダント"),
  mk(11, "Spiral band ring", "K18", 9.8, 248000, null, "necklaces", "スパイラル バンドリング"),
  mk(12, "Double loop bracelet", "K18", 5.2, 196000, null, "bracelets", "ダブルループ ブレスレット"),
  // A third branded piece, so the vitrine can be seen with 1, 2 and 3 arches
  // (NEXT_PUBLIC_PREVIEW_SOLD=CJ-1013 and CJ-1012,CJ-1013).
  mk(13, "Open heart ring", "750" as Product["karat"], 3.1, 64800, null, "rings"),
  // The watches slide's pieces: 3 in stock; sell CJ-1014 / CJ-1015 / CJ-1016
  // to see 2, 1 and 0.
  mk(14, "Van Cleef watch", null, 0, 385000, null, "watches"),
  mk(15, "G-SHOCK watch", null, 0, 58000, null, "watches"),
  mk(16, "Cartier watch", null, 0, 468000, null, "watches"),
];
/**
 * REAL HUB NAMES (the live catalogue, 2026-09-26), so the hero and every card
 * are seen with names as long as the Hub's. The hero shows each exactly as
 * sent, and R3341's EN name is the longest in the catalogue (69 characters).
 * Preview data only: the prices and stock stay the fixtures'.
 */
const HUB_NAMES: Record<number, [string, string]> = {
  0: ["R3341 Ring K18WG 16.20g Diamond 3.82ct, 0.80ct Dome Sz# 13 [Preloved]", "R3341 リング K18WG 16.20g ダイヤモンド 3.82ct, 0.80ct ドーム Sz# 13 プレラブド"],
  1: ["AL3 Pendant K18 2.65g Cross INRI", "AL3 ペンダント K18 2.65g クロス INRI"],
  3: ["AL123 Pendant K18 0.98g Heart shaped 15.0mm", "AL123 ペンダント K18 0.98g ハート型 15.0mm"],
  8: ["R7828 Ring 750 YG/WG 19.00g Diamond 2.70ct Layered Wave Sz# 18 [Preloved]", "R7828 リング 750 YG/WG 19.00g ダイヤモンド 2.70ct レイヤードウェーブ Sz# 18 プレラブド"],
  10: ["N4020 Necklace Tiffany & Co. 750 2.0g Open Teardrop 40cm [Preloved]", "N4020 ネックレス Tiffany & Co. 750 2.0g オープンティアドロップ 40cm [プレラブド]"],
  11: ["R3341 Ring K18WG 16.20g Diamond 3.82ct, 0.80ct Dome Sz# 13 [Preloved]", "R3341 リング K18WG 16.20g ダイヤモンド 3.82ct, 0.80ct ドーム Sz# 13 プレラブド"],
};
for (const [i, [en, ja]] of Object.entries(HUB_NAMES)) Object.assign(products[Number(i)], { name: en, name_en: en, name_ja: ja });
products[8].product_variants[0].size = "18";
products[8].product_variants[0].product_media = [{ url: "/fixtures/ring-1.svg", alt: null, sort: 0 }];
for (const i of [9, 10, 11]) {
  const p = products[i];
  p.category_slugs = ["preloved-branded-jewelry"];
  p.condition = "Preloved";
  p.origin = "BRAND";
  p.brand = ["BVLGARI", "Tiffany & Co.", "Cartier"][i - 9];
}
// The branded photos come in all three ratios the Hub sends — square, portrait
// and landscape — so the vitrine is seen showing each one whole.
products[10].product_variants[0].product_media = [{ url: "/fixtures/ring-1.svg", alt: null, sort: 0 }];
products[11].product_variants[0].product_media = [{ url: "/fixtures/tall-1.svg", alt: null, sort: 0 }];
products[12].product_variants[0].product_media = [{ url: "/fixtures/wide-1.svg", alt: null, sort: 0 }];
Object.assign(products[12], {
  name: "R3110 Ring Tiffany & Co. 750 3.10g Open Heart Elsa Perreti Sz# 10.5 [Used]", name_en: "R3110 Ring Tiffany & Co. 750 3.10g Open Heart Elsa Perreti Sz# 10.5 [Used]", name_ja: null,
  category_slugs: ["preloved-branded-jewelry"], condition: "Preloved", origin: "BRAND", brand: "Tiffany & Co.",
});
/** The live Hub watches (names as the Hub sends them), a landscape, a square and a portrait photo. */
const WATCHES: [string, string, string, string][] = [
  ["C0983 Watch Van Cleef & Arpels La Collection Quartz SS White 17cm [Used]", "C0983 ウォッチ Van Cleef & Arpels La Collection クォーツ SS ホワイト 17cm", "Van Cleef & Arpels", "watch-wide"],
  ["C1395 Watch Casio G-SHOCK Full Metal Series Solar SS Black 19cm [Preloved]", "C1395 ウォッチ Casio G-SHOCK フルメタルシリーズ ソーラー SS ブラック 19cm プレラブド", "Casio", "watch-square"],
  ["C2201 Watch Cartier Tank Solo Quartz SS Silver Leather 18cm [Preloved]", "C2201 ウォッチ Cartier タンクソロ クォーツ SS シルバー レザー 18cm プレラブド", "Cartier", "watch-tall"],
];
WATCHES.forEach(([en, ja, brand, photo], k) => {
  const p = products[13 + k];
  Object.assign(p, { name: en, name_en: en, name_ja: ja, description_en: `${en}.`, brand, category_slugs: ["preloved-watches"], condition: "Preloved", origin: "BRAND", weight_g: null, metals: [] });
  p.product_variants[0].stock_qty = 1;
  p.product_variants[0].product_media = [{ url: `/fixtures/${photo}.svg`, alt: null, sort: 0 }];
});
/**
 * HERO v3 CUT-OUTS (supabase/contracts/api.md, "Proposed: product photo
 * cut-outs"). The real background-removed photos of the live pieces, scaled
 * down for preview (public/fixtures/cutouts), on the fixtures that carry those
 * pieces' names — in every status, so the stage is seen with cut-outs, with
 * whole framed photos, and with both on one slide:
 *   shown     R7828, R3110 (approved — approval first, 2026-10-02: only approved is shown)
 *   framed    C0983, C1395 (auto_fixed = To approve, not yet approved), AL123
 *             (needs_review, as the QA held it), the Cartier watch (rejected),
 *             and every fixture with no `cutout` at all
 */
const cut = (k: string, width: number, height: number, status: CutoutStatus): ProductCutout => ({ url: `/fixtures/cutouts/${k}.webp`, width, height, status });
// (Full-size comp cut-outs, long side 900 px; the dimensions below are theirs.)
products[3].product_variants[0].product_media = [{ url: "/fixtures/pendant-2.svg", alt: null, sort: 0, cutout: cut("al123", 623, 773, "needs_review") }];
products[8].product_variants[0].product_media[0].cutout = cut("r7828", 811, 900, "approved");
products[12].product_variants[0].product_media[0].cutout = cut("r3110", 339, 204, "approved");
products[13].product_variants[0].product_media[0].cutout = cut("c0983", 690, 900, "auto_fixed");
products[14].product_variants[0].product_media[0].cutout = cut("c1395", 900, 832, "auto_fixed");
products[15].product_variants[0].product_media[0].cutout = cut("c1395", 900, 832, "rejected");
/**
 * Accessories are at 0 in stock in the Hub today, so the preview has none and
 * slide 6 shows the Index as its stage. `NEXT_PUBLIC_PREVIEW_ACCESSORIES=1|2|3`
 * adds that many (a wallet, a cardholder, a belt; framed photos) so the Index
 * can be seen as the legend beside the pieces.
 */
const ACCESSORIES: [string, string, string][] = [
  ["Wallet Bottega Veneta Intrecciato Long Wallet Leather Brown [Preloved]", "財布 ボッテガ・ヴェネタ イントレチャート 長財布 レザー ブラウン プレラブド", "wallet-1"],
  ["Card Case Hermès Calvi Epsom Leather Gold [Preloved]", "カードケース エルメス カルヴィ エプソン ゴールド プレラブド", "card-1"],
  ["Belt Gucci GG Marmont Leather Black 85cm [Preloved]", "ベルト グッチ GGマーモント レザー ブラック 85cm プレラブド", "belt-1"],
];
ACCESSORIES.slice(0, Math.max(0, Math.min(3, Number(process.env.NEXT_PUBLIC_PREVIEW_ACCESSORIES ?? 0) || 0))).forEach(([en, ja, photo], k) => {
  const p = mk(17 + k, en, null, 0, [128000, 64800, 52800][k], null, "accessories", ja);
  Object.assign(p, { category_slugs: ["preloved-designer-accessories"], condition: "Preloved", origin: "BRAND", weight_g: null, metals: [], brand: ["Bottega Veneta", "Hermès", "Gucci"][k] });
  p.product_variants[0].stock_qty = 1;
  p.product_variants[0].product_media = [{ url: `/fixtures/${photo}.svg`, alt: null, sort: 0 }];
  products.push(p);
});
// `NEXT_PUBLIC_PREVIEW_NO_CUTOUTS=1`: the Hub before cut-outs exist — every
// piece shows its whole photo in its frame. Applied at the end of this file.
const PREVIEW_NO_CUTOUTS = process.env.NEXT_PUBLIC_PREVIEW_NO_CUTOUTS === "1";
/**
 * `NEXT_PUBLIC_PREVIEW_SOLD=CJ-1001,CJ-1002` plays those pieces selling: their
 * stock goes to zero, so the hero can be seen swapping to the next available
 * piece (lib/hero-deck.ts) without touching the Hub.
 */
for (const sku of (process.env.NEXT_PUBLIC_PREVIEW_SOLD ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
  const p = products.find((x) => x.sku === sku);
  if (p) for (const v of p.product_variants) v.stock_qty = 0;
}
// Preview-only photos and a two-stamp piece, so the gallery and "PT900 / K18"
// can be seen without the Hub. The SVGs live in public/fixtures/.
products[0].metals = ["PT900", "K18"];
products[0].product_variants[0].product_media = [1, 2, 3].map((n) => ({ url: `/fixtures/pendant-${n}.svg`, alt: `Double-sided diamond pendant, photo ${n}`, sort: n - 1 }));
products[1].product_variants[0].product_media = [{ url: "/fixtures/chain-1.svg", alt: null, sort: 0 }];
// Hero v3 cut-outs for the two pieces photographed just above (see "HERO v3 CUT-OUTS").
products[0].product_variants[0].product_media[0].cutout = cut("r3341", 867, 900, "ok");
products[1].product_variants[0].product_media[0].cutout = cut("al3", 427, 900, "ok");
// Hero v3 per-piece slideshow (hero-slide-views.tsx): galleries of every
// length. R3341 (products[0]) has 3 photos; AL3 has 3 of which the second is
// HELD by the quality check (skipped), so 2 show; C0983 has 5 (4 show); the
// rest have 1.
products[1].product_variants[0].product_media.push(
  { url: "/fixtures/pendant-3.svg", alt: null, sort: 1, cutout: cut("al123", 623, 773, "needs_review") },
  { url: "/fixtures/pendant-1.svg", alt: null, sort: 2 },
);
products[13].product_variants[0].product_media.push(...["watch-square", "watch-tall", "wide-1", "tall-1"].map((f, i) => ({ url: `/fixtures/${f}.svg`, alt: null, sort: i + 1 })));
// The hero reads only its own record (`hero_cutout`, owner rule 2026-09-28,
// lib/hero-deck.ts); the fixtures' comp cut-outs stand in for both records, so
// the preview hero and the preview product cards look as they did.
for (const p of products) for (const v of p.product_variants) for (const m of v.product_media) {
  const c = m.cutout;
  if (!c) continue;
  m.hero_cutout = c.status === "rejected" ? { status: "rejected" }
    : c.status === "needs_review" || c.status === "failed" ? { status: "held" }
    : { status: "approved", url: c.url, width: c.width, height: c.height };
}
if (PREVIEW_NO_CUTOUTS) for (const p of products) for (const v of p.product_variants) for (const m of v.product_media) { delete m.cutout; delete m.hero_cutout; }
/**
 * HERO ORDER, TICKS MODE (hero order PART 4, 2026-09-29).
 * `NEXT_PUBLIC_PREVIEW_HERO_TICKS=1` plays the Hub with
 * `hero_photo_source = product_ticks`: a photo an admin ticked "Use on hero"
 * carries its PRODUCT cut-out as `hero_cutout` with `picked_at`, every other
 * photo `hero_cutout: null`, and each category read gives every piece a
 * `hero_place` (categoryProducts below). `=unordered` plays the Hub unable to
 * read its order: every `hero_place` null, so the hero orders by `picked_at`.
 * Unset, nothing here runs: the hero-record world above, exactly as before.
 *   Fine Jewelry     AL3 1, R3341 2, Hoop earrings 3 — Baby bangle 4 WAITS;
 *                    Freshwater drop earrings in stock, never ticked, not shown
 *   Preloved         R7828 1; Solitaire ring ticked first but SOLD → null
 *   Branded          R3110 1 only (the other in-stock pieces are not ticked)
 *   Watches          C0983 1 (photos 1 and 5 ticked, photo 5 shows), C1395 2;
 *                    the Cartier watch is not ticked
 *   Accessories      nothing ticked: the slide is as with nothing in stock
 */
const HERO_TICKS = process.env.NEXT_PUBLIC_PREVIEW_HERO_TICKS;
if (HERO_TICKS === "1" || HERO_TICKS === "unordered") {
  const bySku = (sku: string) => products.find((p) => p.sku === sku);
  // Pieces with no photo yet get one, with a product cut-out to tick.
  const photo = (sku: string, url: string, c: ProductCutout) => { const p = bySku(sku); if (p) p.product_variants[0].product_media = [{ url, alt: null, sort: 0, cutout: c }]; };
  photo("CJ-1006", "/fixtures/pendant-2.svg", cut("al112", 623, 773, "ok"));
  photo("CJ-1007", "/fixtures/ring-1.svg", cut("r7828", 811, 900, "ok"));
  photo("CJ-1005", "/fixtures/ring-1.svg", cut("r3110", 339, 204, "approved"));
  const c0983 = bySku("CJ-1014")?.product_variants[0].product_media[4];
  if (c0983) c0983.cutout = cut("c1395", 900, 832, "ok");
  // [sku, gallery position (0 = first), picked_at]
  const TICKED: [string, number, string][] = [
    ["CJ-1014", 0, "2026-09-18T09:00:00Z"], ["CJ-1014", 4, "2026-09-26T09:00:00Z"],
    ["CJ-1005", 0, "2026-09-19T09:00:00Z"],
    ["CJ-1002", 0, "2026-09-20T09:00:00Z"],
    ["CJ-1001", 0, "2026-09-21T09:00:00Z"],
    ["CJ-1006", 0, "2026-09-22T09:00:00Z"],
    ["CJ-1007", 0, "2026-09-23T09:00:00Z"],
    ["CJ-1009", 0, "2026-09-24T09:00:00Z"],
    ["CJ-1015", 0, "2026-09-25T09:00:00Z"],
    ["CJ-1013", 0, "2026-09-26T09:00:00Z"],
  ];
  for (const p of products) for (const v of p.product_variants) for (const m of v.product_media) m.hero_cutout = null;
  for (const [sku, i, at] of TICKED) {
    const m = [...(bySku(sku)?.product_variants[0].product_media ?? [])].sort((a, b) => a.sort - b.sort)[i];
    const c = m?.cutout;
    if (m && c) m.hero_cutout = { status: "approved", url: c.url, width: c.width, height: c.height, picked_at: at };
  }
  bySku("CJ-1005")!.product_variants[0].stock_qty = 0;
}
/**
 * `NEXT_PUBLIC_PREVIEW_LIVE_MIRROR=1`: the hero categories hold exactly the
 * live pieces (lib/fixtures-live.ts) instead of the preview pieces, so the
 * stage can be compared with the approved comps piece for piece, with the
 * Hub's real photos and no cut-outs, as a preview deployment sees them.
 */
if (process.env.NEXT_PUBLIC_PREVIEW_LIVE_MIRROR === "1") {
  const hero = new Set(categories.map((c) => c.slug));
  for (const p of products) p.category_slugs = (p.category_slugs ?? []).filter((c) => !hero.has(c));
  // The whole catalogue too (grids, related pieces, search): only the live
  // pieces, so /collections/rings holds R3341, R7828 and R3110, as live.
  products.length = 0;
  for (const p of liveMirrorProducts) products.push({ ...p, col: p.col ?? "live" });
}
/**
 * FIELDS THE HUB DOES NOT SEND YET (D2-1, supabase/contracts/api.md "Proposed:
 * item type and product video"). Preview only, so the grid's Type filter and
 * the gallery's video slot can be seen before Lovable ships them:
 *   NEXT_PUBLIC_PREVIEW_ITEM_TYPE=1       every piece carries `item_type`
 *                                         (watches Watch, the rest Jewelry)
 *   NEXT_PUBLIC_PREVIEW_VIDEO=<sku,…>     those pieces carry a `video_url`
 *                                         (the site's own gold film stands in)
 * Unset, the pieces carry neither: exactly what every deployment receives.
 */
if (process.env.NEXT_PUBLIC_PREVIEW_ITEM_TYPE === "1") {
  for (const p of products) p.item_type = (p.category_slugs ?? []).includes("preloved-watches") || p.col === "watches" ? "Watch" : "Jewelry";
}
for (const sku of (process.env.NEXT_PUBLIC_PREVIEW_VIDEO ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
  const p = products.find((x) => x.sku === sku);
  if (p) { p.video_url = "/videos/hero-artisan-mobile.mp4"; p.video_poster_url = p.product_variants[0]?.product_media[0]?.url ?? null; }
}
/**
 * One category's pieces as GET /catalog/categories/:slug sends them. In ticks
 * mode (NEXT_PUBLIC_PREVIEW_HERO_TICKS) each carries the Hub's `hero_place`,
 * worked out as the Hub does (hero_lineup_rows): ticked, active and in stock,
 * oldest tick first, ties in the category's order; the rest null. Unset, the
 * pieces are exactly as before, with no `hero_place` at all.
 */
export function categoryProducts(slug: string): Product[] {
  const list = products.filter((p) => (p.category_slugs ?? []).includes(slug));
  if (HERO_TICKS !== "1" && HERO_TICKS !== "unordered") return list;
  const firstTick = (p: Product) => {
    const ts = p.product_variants.flatMap((v) => v.product_media).map((m) => (m.hero_cutout?.status === "approved" ? m.hero_cutout.picked_at : undefined)).filter((x): x is string => !!x).sort();
    return p.status === "active" && p.product_variants.some((v) => v.stock_qty > 0) ? ts[0] ?? null : null;
  };
  const queue = list.filter((p) => firstTick(p)).sort((a, b) => (firstTick(a)! < firstTick(b)! ? -1 : firstTick(a)! > firstTick(b)! ? 1 : 0));
  return list.map((p) => ({ ...p, hero_place: HERO_TICKS === "unordered" || !queue.includes(p) ? null : queue.indexOf(p) + 1 }));
}
/**
 * The calculator's preview answer, in the shape the real SQL function returns:
 * the configured terms with this amount's eligibility already decided, the
 * Hub's floor-and-remainder rounding, and the downgrade flag a write path
 * refuses on. Keeping the shape honest here is what stops preview mode from
 * hiding a field the production page depends on.
 */
export function quote(priceJpy: number, term: number, currency: "JPY" | "PHP"): LayawayQuote {
  // The Hub's `price_jpy` body: a yen price in, converted Hub-side for a peso
  // quote (half-up), and judged against the FIXED peso minimums — never the
  // yen minimum converted.
  const price = currency === "PHP" ? Math.round(priceJpy * FIXTURE_RATE) : priceJpy;
  const terms: LayawayTerm[] = PLAN_MINIMUMS.map(([months, minJpy, minPhp]) => ({
    months, label: `${months} Months`,
    min_amount: currency === "PHP" ? minPhp : minJpy,
    dp_percentage: 0.3,
    eligible: price >= (currency === "PHP" ? minPhp : minJpy),
  }));
  const eligible = terms.filter((t) => t.eligible);
  const wanted = eligible.find((t) => t.months === term);
  const chosen = wanted ?? eligible[eligible.length - 1] ?? terms[0];
  const max = eligible.length ? eligible[eligible.length - 1].months : 3;
  const dp = Math.round(price * 0.3);
  const base = Math.floor((price - dp) / chosen.months);
  const remainder = price - dp - base * chosen.months;
  return {
    down_payment: dp, monthly: base, last_month: base + remainder,
    term_months: chosen.months, total: price, max_term_months: max, currency,
    allowed_terms: terms,
    requested_term_months: term,
    term_downgraded: chosen.months !== term,
    price_jpy: priceJpy,
    fx_rate: currency === "PHP" ? FIXTURE_RATE : null,
    fx_as_of: currency === "PHP" ? "2026-09-08" : null,
  };
}

export const tiers: HubTier[] = localTiers.map((t) => ({ slug: t.slug, name: t.name, threshold_jpy: t.thresholdJpy, requalify_spend: t.requalifyJpy, multiplier: t.multiplier, hold_minutes: t.holdMinutes, benefits_ja: t.perks.ja, benefits_en: t.perks.en }));

/** Preview-mode account data. Obvious placeholders — never real customer data. */
export const meFixture: HubMe = {
  customer: { id: "cust-fixture", customer_code: "CJ-2026-00008", full_name: "Preview Customer", email: "preview@example.com", mobile_number: null },
  addresses: [{ id: "addr-1", label: "home", recipient_name: "Preview Customer", line1: "1-2-3 Tateishi", city: "Katsushika-ku", region: "Tokyo", postal_code: "124-0012", country: "JP", phone: null, is_default: true }],
  loyalty: { enrolled: true, points: 1200, tier: "Glimmer", multiplier: 1, reduced: true, earned_tier: "Radiant", regain_jpy: 397418 },
  saved_card: false,
  records: { layaway: layawayPlansFixtureCount, orders: 1 },
  shares_email: false,
  portal_url: "https://portal.chajewelsjp.com/portal",
  get cart_reminders() { return { opted_in: cartRemindersFixture }; },
};

/** Cart reminders in the preview: one saved cart and one consent flag, in memory. */
let savedCartFixture: HubCartLine[] = [];
let cartRemindersFixture = false;
export const savedCart = (): HubCartLine[] => savedCartFixture.map((l) => ({ ...l }));
export function rememberCart(lines: { variant_id: string; qty: number; slug: string }[]): boolean {
  const next = lines.map((l) => ({ variant_id: l.variant_id, qty: l.qty, slug: l.slug }));
  const changed = JSON.stringify(next) !== JSON.stringify(savedCartFixture);
  savedCartFixture = next;
  return changed;
}
export function rememberCartReminders(optedIn: boolean): boolean {
  cartRemindersFixture = optedIn;
  return optedIn;
}

/**
 * The blank-record case, which is the one that used to render as an empty page:
 * a customer whose sign-in reached a record carrying nothing, while a second
 * record holds the same email. Reachable in preview at /account?fixture=blank.
 */
export const meBlankFixture: HubMe = {
  ...meFixture,
  customer: { ...meFixture.customer, full_name: "Preview Twin", customer_code: "CJ-2026-06256" },
  records: { layaway: 0, orders: 0 },
  shares_email: true,
};

/**
 * Preview-mode checkout. Lets the Vercel preview walk the whole flow with no
 * Hub behind it. Prices are made up; the deadline is a real 72 hours out so the
 * countdown copy renders the way it will in production.
 */
export const FIXTURE_ORDER_ID = "order-fixture";
const FIXTURE_REFERENCE = "CJ-W-000001";
// Obviously fake account values — this fixture only ever renders in preview
// mode, and a realistic-looking account number is exactly what must never
// appear on a page. Real details live only in the Hub.
/**
 * Obviously fake, and deliberately so: these exist to prove the layout renders
 * two methods in order, never to stand in for an account. Real details live
 * only in the Hub and reach the site through the API.
 */
const fixtureMethods: TransferMethod[] = [
  {
    id: "fixture-bank",
    method_type: "bank",
    label_ja: "銀行振込",
    label_en: "Bank transfer",
    bank: {
      name: "PREVIEW BANK (not a real bank)",
      branch: "PREVIEW BRANCH",
      account_type: "普通",
      account_number: "0000000",
      account_holder: "PREVIEW ACCOUNT",
    },
    wallet: null,
    note_ja: "【プレビュー表示】実際のお振込先はHubで管理されています。",
    note_en: "[Preview] Real transfer details are managed in the Hub.",
  },
  {
    id: "fixture-wallet",
    method_type: "gcash",
    label_ja: "GCash",
    label_en: "GCash",
    bank: null,
    wallet: { number: "0000 000 0000", name: "PREVIEW WALLET" },
    note_ja: null,
    note_en: null,
  },
];

export function quoteFixture(body: { items: { variant_id: string; qty: number }[]; order_type: OrderType; mode?: CheckoutMode; term_months?: number; settlement_currency?: SettlementCurrency }): HubQuote {
  const items: HubQuoteItem[] = body.items.map((line) => {
    const product = products.find((p) => p.product_variants.some((v) => v.id === line.variant_id)) ?? products[0];
    const unit = product.product_variants[0].price_jpy;
    return {
      variant_id: line.variant_id, product_id: product.id, sku: product.sku, slug: product.slug,
      name: product.name, name_en: product.name, name_ja: product.name_ja ?? null,
      qty: line.qty, unit_price_jpy: unit, line_total_jpy: unit * line.qty,
    };
  });
  const subtotal = items.reduce((n, i) => n + i.line_total_jpy, 0);
  const shipping = subtotal >= 50000 ? 0 : 800;
  const total = subtotal + shipping;
  const mode: CheckoutMode = body.mode ?? "full";
  const settlement: SettlementCurrency = body.settlement_currency ?? "JPY";
  const rate = settlement === "PHP" ? FIXTURE_RATE : null;
  const inSettlement = (jpy: number) => (rate === null ? jpy : Math.round(jpy * rate));
  return {
    quote_id: "quote-fixture",
    // Reserved on the Hub at quote time for a layaway; nothing for full payment.
    invoice_number: mode === "layaway" ? "900123" : null,
    web_reference: mode === "layaway" ? "CJ-W-900123" : null,
    items, subtotal_jpy: subtotal, shipping_jpy: shipping,
    total_jpy: total, requires_manual_quote: false,
    // In reservation mode the Hub withholds the methods and says why.
    transfer_region: "JP", transfer_methods: PREVIEW_RESERVATION ? [] : fixtureMethods, transfer_available: true,
    ...(PREVIEW_RESERVATION ? { reservation_mode: true } : {}),
    order_type: body.order_type,
    expires_at: new Date(Date.now() + 30 * 60e3).toISOString(),
    // Preview shows the FIRST-ORDER deadline, because that is the case the copy
    // used to get wrong. A returning customer gets 72 from the live Hub.
    deposit_deadline_hours: 24,
    mode,
    settlement_currency: settlement,
    fx_rate: rate,
    fx_rate_date: rate === null ? null : "2026-09-08",
    // Shipping is converted and the subtotal is the remainder, so the parts
    // always sum to the settlement total exactly — the same rule the Hub uses.
    shipping_settlement: inSettlement(shipping),
    total_settlement: inSettlement(total),
    subtotal_settlement: inSettlement(total) - inSettlement(shipping),
    layaway: mode === "layaway" ? layawayPlanOf(inSettlement(total), body.term_months ?? 6) : null,
    // C1–C7 (Hub 2026-10-05): the payment choice and the points panel.
    ...choiceBlockOf(mode, settlement, inSettlement(subtotal), inSettlement(total),
      mode === "layaway" ? layawayPlanOf(inSettlement(total), body.term_months ?? 6).deposit : null, { method: "transfer", points: 0 }),
  };
}

/** Preview only: the shape the Hub answers for the payment choice (FIXTURE_POINTS balance, yen 1:1). */
const FIXTURE_POINTS = 1250;
let fixtureChoiceContext: { mode: CheckoutMode; settlement: SettlementCurrency; subtotal: number; total: number; deposit: number | null } =
  { mode: "full", settlement: "JPY", subtotal: 236000, total: 236000, deposit: null };
function choiceBlockOf(mode: CheckoutMode, settlement: SettlementCurrency, subtotal: number, total: number, deposit: number | null, choice: { method: CheckoutMethod; points: number }): HubCheckoutChoice {
  fixtureChoiceContext = { mode, settlement, subtotal, total, deposit };
  const yen = settlement === "JPY";
  const why = (m: CheckoutMethod) => m === "transfer" ? null : mode === "layaway" ? "layaway" : !yen ? "currency_not_yen" : null;
  const limit = mode === "layaway" ? deposit ?? 0 : subtotal;
  const max = yen ? Math.min(FIXTURE_POINTS, limit) : 0;
  const chosen = Math.min(Math.max(0, Math.floor(choice.points)), max);
  return {
    payment_options: (["transfer", "paidy", "card"] as const).map((m) => ({ method: m, offered: why(m) === null, reason: why(m) })),
    payment_method: choice.method,
    points: {
      usable: max > 0, reason: null, balance: FIXTURE_POINTS, held: 0, available: FIXTURE_POINTS,
      available_value: yen ? FIXTURE_POINTS : 0, max_points: max, max_value: max, chosen, chosen_value: chosen, applies_to: mode === "layaway" ? "deposit" : "pieces",
    },
    totals: { total_after_points: total - chosen, due_now_after_points: (mode === "layaway" ? deposit ?? 0 : total) - chosen },
  };
}
export function checkoutChoiceFixture(choice: { method: CheckoutMethod; points: number }): HubCheckoutChoice {
  const c = fixtureChoiceContext;
  return choiceBlockOf(c.mode, c.settlement, c.subtotal, c.total, c.deposit, choice);
}

/** The same floor-and-remainder rule the Hub uses, so preview figures add up. */
function layawayPlanOf(total: number, termMonths: number) {
  const term = fixtureTerms.some((t) => t.months === termMonths && t.eligible) ? termMonths : 3;
  const deposit = Math.round(total * 0.3);
  const base = Math.floor((total - deposit) / term);
  const remainder = total - deposit - base * term;
  const start = new Date();
  const schedule: LayawayScheduleRow[] = Array.from({ length: term }, (_, i) => {
    const due = new Date(start);
    due.setMonth(due.getMonth() + i + 1);
    return {
      installment_number: i + 1,
      due_date: due.toISOString().slice(0, 10),
      amount: base + (i === term - 1 ? remainder : 0),
    };
  });
  return { term_months: term, deposit, monthly: base, last_month: base + remainder, schedule, allowed_terms: fixtureTerms };
}

const fixtureTerms: LayawayTerm[] = [
  { months: 3, label: "3 Months", min_amount: 0, dp_percentage: 0.3, eligible: true },
  { months: 6, label: "6 Months", min_amount: 25000, dp_percentage: 0.3, eligible: true },
  { months: 8, label: "8 Months", min_amount: 300000, dp_percentage: 0.3, eligible: false },
  { months: 10, label: "10 Months", min_amount: 600000, dp_percentage: 0.3, eligible: false },
  { months: 12, label: "12 Months", min_amount: 1000000, dp_percentage: 0.3, eligible: false },
];

export function draftPayFixture(mode: CheckoutMode = "full"): HubDraftPayResult {
  return {
    draft_id: FIXTURE_DRAFT_ID, web_reference: FIXTURE_DRAFT_REFERENCE, mode, currency: "JPY",
    total: 236000, total_jpy: 236000, shipping_pending: true,
    deposit: mode === "layaway" ? 70800 : null, term_months: mode === "layaway" ? 6 : null,
    provisional: true, awaiting_confirmation: true, transfer_due_at: null, transfer_region: "OVERSEAS", transfer_methods: [],
  };
}

const fixtureDraft: HubDraft = {
  id: FIXTURE_DRAFT_ID, kind: "draft", web_reference: FIXTURE_DRAFT_REFERENCE, status: "to_confirm",
  mode: "full", term_months: null, currency: "JPY", subtotal: 236000, shipping: null, shipping_pending: true,
  total: 236000, deposit: null, schedule: null, provisional: true, decline_reason: null,
  created_at: new Date().toISOString(), decided_at: null, order_id: null, account_id: null,
};

export function draftsFixture(): HubDraft[] {
  if (!PREVIEW_DRAFTS) return [];
  return [
    fixtureDraft,
    { ...fixtureDraft, id: "00000000-0000-4000-8000-00000000d002", web_reference: "CJ-W-900066", status: "declined",
      decline_reason: "The piece did not pass our final inspection.", decided_at: new Date(Date.now() - 864e5).toISOString(),
      created_at: new Date(Date.now() - 2 * 864e5).toISOString(), shipping: 1500, shipping_pending: false, total: 99500, subtotal: 98000 },
  ];
}

export function draftFixture(id: string): HubDraftDetail | null {
  const d = draftsFixture().find((x) => x.id === id) ?? (id === FIXTURE_DRAFT_ID ? fixtureDraft : null);
  if (!d) return null;
  return {
    draft: { ...d, ship_to_address: { line1: "123 Rizal Avenue", city: "Makati", region: "Metro Manila", postal_code: "1200", country: "PH", recipient_name: "Maria Santos" } },
    items: [{ id: "l1", variant_id: null, product_id: null, title: "K18 Diamond Pendant / 45cm", title_ja: "K18 ダイヤモンドペンダント / 45cm", sku: "AL3", quantity: 1, unit_price_jpy: 236000, line_total_jpy: 236000, image_url: null }],
  };
}

export function payFixture(): HubPayResult | HubDraftPayResult {
  if (PREVIEW_DRAFTS) return draftPayFixture("full");
  if (PREVIEW_RESERVATION) {
    return {
      reservation_mode: true, awaiting_confirmation: true,
      order_id: RESERVED_ORDER_ID, web_reference: RESERVED_ORDER_REFERENCE, currency: "JPY", total: 236800, total_jpy: 236800,
      transfer_due_at: null, transfer_region: "JP", transfer_methods: [],
    };
  }
  return {
    order_id: FIXTURE_ORDER_ID, web_reference: FIXTURE_REFERENCE, currency: "JPY", total: 236800, total_jpy: 236800,
    transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
    transfer_region: "JP", transfer_methods: fixtureMethods,
  };
}

export const ordersFixture: HubOrder[] = [{
  id: FIXTURE_ORDER_ID, web_reference: FIXTURE_REFERENCE, invoice_number: "900001",
  status: "pending", payment_status: "pending_transfer", payment_method: "transfer",
  order_type: "SELF", currency: "JPY", total_amount: 236800, total_paid: 0,
  remaining_balance: 236800, shipping_fee: 800,
  transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
  recipient_name: null, gift_note: null, order_date: new Date().toISOString().slice(0, 10),
  created_at: new Date().toISOString(), completed_at: null, cancelled_at: null,
  tracking_number: null, shipped_at: null,
  cancellation_reason: null, refund_status: null, refund_note: null, expired_at: null,
  // Confirmed (with the switch off, the Hub stamps every web order confirmed at
  // creation): this is also what a reservation looks like after staff confirm
  // it — bank details and the deadline on the order page.
  awaiting_confirmation: false, ready_for_payment: true,
},
  // The ended states, added 2026-09-15 so the badge-versus-caption rule on this
  // page can actually be LOOKED at. Before this there was one pending order in
  // the fixture set, so no closed order had ever been rendered here.
  hubOrder({
    id: "order-cancelled", invoice: "19502", status: "cancelled", payment: "cancelled",
    currency: "PHP", total: 84200,
    cancelled: true, reason: "Customer asked to cancel before the transfer arrived.",
    refund: "no_refund",
  }),
  hubOrder({
    id: "order-refunded", invoice: "19488", status: "completed", payment: "refunded",
    currency: "JPY", total: 152300,
    cancelled: true, reason: "Piece arrived damaged in transit.", refund: "refund_issued",
  }),
  // Paid and not yet shipped: nothing due, so the page keeps its usual order
  // and no "How to pay" card leads it (2026-09-24).
  hubOrder({ id: "order-paid", invoice: "19520", status: "pending", payment: "paid", currency: "JPY", total: 112400, paid: true }),
  hubOrder({ id: "order-expired", invoice: "19477", status: "expired", payment: null, currency: "JPY", total: 68900 }),
  // A web order settled in pesos (2026-09-25), confirmed and awaiting the
  // transfer: ₱ total and shipping, its yen lines listed without a price.
  // 236,800 yen at 0.39, half-up; shipping 800 yen converted on its own.
  {
    id: "order-peso", web_reference: "CJ-W-000005", invoice_number: "900005",
    status: "pending", payment_status: "pending_transfer", payment_method: "transfer",
    order_type: "SELF", currency: "PHP", total_amount: 92352, total_paid: 0,
    remaining_balance: 92352, shipping_fee: 312,
    transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
    recipient_name: null, gift_note: null, order_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(), completed_at: null, cancelled_at: null,
    tracking_number: null, shipped_at: null, source_channel: "web",
    cancellation_reason: null, refund_status: null, refund_note: null, expired_at: null,
    awaiting_confirmation: false, ready_for_payment: true,
  },
  // THE LATENT CONTRADICTION THIS FIX CLOSES: shipped, then cancelled. With
  // shipped_at tested first, this row showed a gold "Shipped" badge directly
  // above its own cancellation reason and refund decision. No live order is in
  // this state (0 rows), which is exactly why it needed a fixture.
  hubOrder({
    id: "order-shipped-then-cancelled", invoice: "19461", status: "cancelled", payment: "cancelled",
    currency: "JPY", total: 98400, shipped: true,
    cancelled: true, reason: "Returned to us and cancelled after dispatch.", refund: "store_credit_issued",
  }),
  // Hub H6: a Paidy payment the reviewer rejected; the list row carries the
  // Hub's chosen_method / being_checked / amount_due.
  ...(PREVIEW_REJECTED ? [{
    id: REJECTED_ORDER_ID, web_reference: "CJ-W-000007", invoice_number: "900007",
    status: "pending" as const, payment_status: "pending_transfer" as const, payment_method: "paidy",
    order_type: "SELF" as const, currency: "JPY" as const, total_amount: 236800, total_paid: 0,
    remaining_balance: 236800, shipping_fee: 800,
    transfer_due_at: new Date(Date.now() + 48 * 36e5).toISOString(),
    recipient_name: null, gift_note: null, order_date: new Date().toISOString().slice(0, 10),
    created_at: new Date(Date.now() - 864e5).toISOString(), completed_at: null, cancelled_at: null,
    tracking_number: null, shipped_at: null, source_channel: "web",
    cancellation_reason: null, refund_status: null, refund_note: null, expired_at: null,
    awaiting_confirmation: false, ready_for_payment: true,
    chosen_method: "paidy" as const, being_checked: false, amount_due: 236800,
  }] : []),
  // A reservation staff have not confirmed: held, no deadline, no methods.
  ...(PREVIEW_RESERVATION ? [{
    id: RESERVED_ORDER_ID, web_reference: RESERVED_ORDER_REFERENCE, invoice_number: "900003",
    status: "pending" as const, payment_status: "awaiting_confirmation" as const, payment_method: "transfer",
    order_type: "SELF" as const, currency: "JPY" as const, total_amount: 236800, total_paid: 0,
    remaining_balance: 236800, shipping_fee: 800, transfer_due_at: null,
    recipient_name: null, gift_note: null, order_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(), completed_at: null, cancelled_at: null,
    tracking_number: null, shipped_at: null, source_channel: "web",
    cancellation_reason: null, refund_status: null, refund_note: null, expired_at: null,
    awaiting_confirmation: true, ready_for_payment: false,
  }] : []),
];

/** An order in whatever state the Hub has it. Web fields left null as the Hub leaves them. */
function hubOrder(o: {
  id: string; invoice: string; status: HubOrder["status"]; payment: HubOrder["payment_status"];
  currency: SettlementCurrency; total: number;
  shipped?: boolean; cancelled?: boolean; reason?: string; refund?: HubOrder["refund_status"];
  paid?: boolean;
}): HubOrder {
  const day = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
  return {
    id: o.id, web_reference: null, invoice_number: o.invoice,
    status: o.status, payment_status: o.payment, payment_method: "transfer",
    order_type: "SELF", currency: o.currency, total_amount: o.total, total_paid: o.paid ? o.total : 0,
    remaining_balance: o.paid ? 0 : o.total, shipping_fee: null, transfer_due_at: null,
    recipient_name: null, gift_note: null, order_date: day(30).slice(0, 10),
    created_at: day(30), completed_at: null,
    cancelled_at: o.cancelled ? day(3) : null,
    tracking_number: o.shipped ? "JP1234567890" : null,
    shipped_at: o.shipped ? day(10) : null,
    cancellation_reason: o.reason ?? null,
    refund_status: o.refund ?? null,
    refund_note: null,
    expired_at: o.status === "expired" ? day(2) : null,
    // Every one of these is ended or settled: nothing awaits, nothing to pay.
    awaiting_confirmation: false, ready_for_payment: false,
  };
}

export function orderFixture(id: string): HubOrderDetail | null {
  const order = ordersFixture.find((o) => o.id === id);
  if (!order) return null;
  const payable = order.currency === "JPY" && order.payment_status === "pending_transfer" && order.ready_for_payment !== false;
  // An unresolved card payment hides every way to pay (the Hub's own rule).
  const cardPayment: HubCardPayment | null = PREVIEW_CARD_STATE && payable ? {
    state: PREVIEW_CARD_STATE, reference: "CJW-SQ-PREVIEW1", since: new Date(Date.now() - 5 * 60e3).toISOString(),
    ...(PREVIEW_CARD_STATE === "processing" ? {} : { capture_by: new Date(Date.now() + 6 * 864e5).toISOString(), brand: "VISA", last4: "1111" }),
  } : null;
  // Hub H6: only the rejected-Paidy order carries the decision and the switch.
  const rejected = order.id === REJECTED_ORDER_ID;
  const lifecycle: Partial<HubOrderDetail> = rejected ? {
    chosen_method: "paidy",
    latest_decision: {
      status: "rejected", method: "paidy", amount: Number(order.remaining_balance),
      decided_at: new Date(Date.now() - 3 * 36e5).toISOString(),
      message: "Paidy could not approve this payment. Please choose another way to pay.",
    },
    // Transfer is always offered; card only while the Hub offers it (preview: the card flag).
    switch_methods: PREVIEW_CARD ? ["transfer", "card"] : ["transfer"],
    can_switch_method: true,
  } : {};
  // C1: the Hub offers Paidy / card only on the method she chose (method_not_chosen).
  const chosenInPreview = lifecycle.chosen_method;
  const paidyAllowed = !chosenInPreview || chosenInPreview === "paidy";
  const cardAllowed = !chosenInPreview || chosenInPreview === "card";
  const paidyNeeds = PREVIEW_PAIDY && PREVIEW_PAIDY_STATE === "needs" && payable && !cardPayment;
  const paidyWindow = PREVIEW_PAIDY && PREVIEW_PAIDY_STATE === "window" && payable && !cardPayment;
  return {
    ...lifecycle,
    ...(paidyNeeds || paidyWindow ? { chosen_method: "paidy" as const } : {}),
    ...(paidyNeeds ? { paidy_requirements: { family_name: false, given_name: false, jp_mobile: true, jp_billing_address: true, mobile_number: "08000000001" } } : {}),
    ...(paidyWindow ? { payment_state: "paidy_window_open" as const } : {}),
    order: { ...order, ship_to_address: meFixture.addresses[0] },
    items: [{
      id: "item-1", variant_id: "v3", product_id: "3", title: "Twist bangle", title_ja: "ツイストバングル",
      sku: "CJ-0003", quantity: 1, unit_price_jpy: 236000, line_total_jpy: 236000, image_url: null,
    }],
    // The Hub's own rule: methods only while the transfer is outstanding and
    // never before staff confirm the piece.
    transfer_region: order.currency === "PHP" ? "OVERSEAS" : "JP",
    transfer_methods: order.payment_status === "pending_transfer" && order.ready_for_payment !== false && !cardPayment && !rejected ? fixtureMethods : [],
    pending_submissions: [],
    card_payment: cardPayment,
    ...(PREVIEW_PAIDY && paidyAllowed && payable && !cardPayment && !paidyNeeds ? {
      paidy: {
        offered: true,
        public_key: "pk_test_preview",
        test: true,
        checkout: {
          amount: Number(order.remaining_balance), currency: "JPY", store_name: "Cha Jewels",
          buyer: { email: meFixture.customer.email ?? undefined, name1: meFixture.customer.full_name ?? "Preview Customer", phone: "08000000001" },
          buyer_data: { user_id: "CJ-2026-00008", ltv: 0, account_registration_date: "2026-09-01", order_count: 0 },
          order: { items: [{ id: "v3", quantity: 1, title: "Twist bangle", unit_price: 236000 }], order_ref: order.web_reference ?? undefined, shipping: Number(order.shipping_fee ?? 0), tax: 0 },
          shipping_address: { line1: meFixture.addresses[0].line1, line2: meFixture.addresses[0].line2 ?? undefined, city: meFixture.addresses[0].city ?? undefined, state: meFixture.addresses[0].region ?? undefined, zip: meFixture.addresses[0].postal_code ?? "" },
        },
      },
    } : {}),
    ...(PREVIEW_CARD && cardAllowed && payable && !cardPayment ? {
      card: {
        offered: true,
        app_id: "sandbox-sq0idb-preview00000",
        location_id: "LPREVIEW000000",
        test: true,
        amount_jpy: Math.round(Number(order.remaining_balance)),
        agreement_required: true,
        agreement_min_jpy: 0,
        customer_id: meFixture.customer.id,
        cardholder_name: meFixture.customer.full_name,
        buyer_email: meFixture.customer.email ?? null,
      },
    } : {}),
  };
}

/** The preview Hub's answer to POST /orders/:id/card: a hold placed and filed (200), or 202 "not known yet". */
export function orderCardFixture(): HubCardResult {
  if (PREVIEW_CARD_RESULT === "unknown") return { ok: false, status: "unknown", attempt: { reference: "CJW-SQ-PREVIEW1" } };
  return {
    ok: true, submission: null,
    card: { brand: "VISA", last4: "1111", receipt_url: null, status: "authorized", capture_by: new Date(Date.now() + 6 * 864e5).toISOString() },
    attempt: { reference: "CJW-SQ-PREVIEW1" },
  };
}

/** Preview stand-in for the Hub's POST /orders/:id/paidy/start answer (the Hub builds the real one). */
export function paidyCheckoutFixture(): PaidyCheckoutPayload {
  return {
    amount: 236800, currency: "JPY", store_name: "Cha Jewels",
    buyer: { email: meFixture.customer.email ?? undefined, name1: meFixture.customer.full_name ?? "Preview Customer", phone: "08000000001" },
    buyer_data: { user_id: "CJ-2026-00008", ltv: 0, account_registration_date: "2026-09-01", order_count: 0 },
    order: { items: [{ id: "v3", quantity: 1, title: "Twist bangle", unit_price: 236000 }], shipping: 800, tax: 0 },
    shipping_address: { zip: meFixture.addresses[0].postal_code ?? "" },
  };
}

/** Phase 2 step 4 — layaway preview data. */
const FIXTURE_PLAN_ID = "plan-fixture";
const FIXTURE_PLAN_REFERENCE = "CJ-W-900002";
const fixturePlanTotal = 236800;
const fixturePlanDeposit = Math.round(fixturePlanTotal * 0.3);
const fixturePlanTerm = 6;
const fixturePlanBase = Math.floor((fixturePlanTotal - fixturePlanDeposit) / fixturePlanTerm);
const fixturePlanRemainder = fixturePlanTotal - fixturePlanDeposit - fixturePlanBase * fixturePlanTerm;

function fixtureDueDate(monthsAhead: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toISOString().slice(0, 10);
}

export function layawayPayFixture(): HubLayawayPayResult | HubDraftPayResult {
  if (PREVIEW_DRAFTS) return draftPayFixture("layaway");
  if (PREVIEW_RESERVATION) {
    return {
      mode: "layaway", reservation_mode: true, awaiting_confirmation: true,
      account_id: RESERVED_PLAN_ID, web_reference: RESERVED_PLAN_REFERENCE,
      currency: "JPY", total: fixturePlanTotal, deposit: fixturePlanDeposit, term_months: fixturePlanTerm,
      // Re-dated by the Hub at confirmation, so none is sent before it.
      schedule: [], transfer_due_at: null, transfer_region: "JP", transfer_methods: [],
    };
  }
  return {
    mode: "layaway",
    account_id: FIXTURE_PLAN_ID,
    web_reference: FIXTURE_PLAN_REFERENCE,
    currency: "JPY",
    total: fixturePlanTotal,
    deposit: fixturePlanDeposit,
    term_months: fixturePlanTerm,
    schedule: Array.from({ length: fixturePlanTerm }, (_, i) => ({
      installment_number: i + 1,
      due_date: fixtureDueDate(i + 1),
      amount: fixturePlanBase + (i === fixturePlanTerm - 1 ? fixturePlanRemainder : 0),
    })),
    transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
    transfer_region: "JP",
    transfer_methods: fixtureMethods,
  };
}

/**
 * A plan arranged with Cha Jewels directly, in whatever state the Hub has it.
 *
 * Modelled on the live data rather than invented: no item lines (0 of 1,448
 * Hub plans carry any), a real currency split (792 of them are in pesos), and
 * a positive remaining_balance on the closed ones, which is what the Hub
 * actually stores and what makes the labelling on this page matter.
 */
function hubPlan(o: {
  id: string; invoice: string; status: string; currency: SettlementCurrency;
  total: number; paid: number; remaining: number; months: number;
}): HubLayawayPlan {
  return {
    id: o.id, web_reference: null, invoice_number: o.invoice,
    status: o.status, currency: o.currency,
    total_amount: o.total, total_paid: o.paid, remaining_balance: o.remaining,
    downpayment_amount: Math.round(o.total * 0.3), payment_plan_months: o.months,
    shipping_fee: null, order_date: fixtureDueDate(-o.months), end_date: fixtureDueDate(0),
    transfer_due_at: null, settlement_due_at: null, expired_at: null,
    created_at: new Date(Date.now() - 200 * 864e5).toISOString(),
    completed_at: o.status === "completed" ? new Date(Date.now() - 20 * 864e5).toISOString() : null,
    tracking_number: null, shipped_at: null,
    source_channel: "hub_manual",
    // Never a reservation: the Hub checks the channel first.
    awaiting_confirmation: false,
    ready_for_payment: ["active", "overdue", "extension_active", "reactivated"].includes(o.status),
  };
}

export const layawayPlansFixture: HubLayawayPlan[] = [{
  id: FIXTURE_PLAN_ID, web_reference: FIXTURE_PLAN_REFERENCE, invoice_number: "900002",
  status: "active", currency: "JPY", total_amount: fixturePlanTotal, total_paid: 0,
  remaining_balance: fixturePlanTotal, downpayment_amount: fixturePlanDeposit,
  payment_plan_months: fixturePlanTerm, shipping_fee: 800,
  order_date: new Date().toISOString().slice(0, 10), end_date: fixtureDueDate(fixturePlanTerm),
  transfer_due_at: new Date(Date.now() + 72 * 36e5).toISOString(),
  settlement_due_at: null, expired_at: null,
  created_at: new Date().toISOString(), completed_at: null,
  tracking_number: null, shipped_at: null,
  source_channel: "web",
  // Confirmed — the switch-off shape, and a reservation after staff confirm.
  awaiting_confirmation: false, ready_for_payment: true,
},
  // A reservation staff have not confirmed: active in the Hub, but no deposit
  // deadline, no methods, and a schedule still dated from checkout.
  ...(PREVIEW_RESERVATION ? [{
    id: RESERVED_PLAN_ID, web_reference: RESERVED_PLAN_REFERENCE, invoice_number: "900004",
    status: "active", currency: "JPY" as const, total_amount: fixturePlanTotal, total_paid: 0,
    remaining_balance: fixturePlanTotal, downpayment_amount: fixturePlanDeposit,
    payment_plan_months: fixturePlanTerm, shipping_fee: 800,
    order_date: new Date().toISOString().slice(0, 10), end_date: fixtureDueDate(fixturePlanTerm),
    transfer_due_at: null, settlement_due_at: null, expired_at: null,
    created_at: new Date().toISOString(), completed_at: null,
    tracking_number: null, shipped_at: null,
    source_channel: "web",
    awaiting_confirmation: true, ready_for_payment: false,
  }] : []),
  // EVERY state a Hub plan reaches that a web plan never did. Figures are taken
  // from the real extremes so the layout is checked against them.
  //
  // `cancelled` and `final_forfeited` were added 2026-09-15: without them the
  // closed set could not actually be rendered, so two of the five closed states
  // had never been looked at. Every closed state now has a row.
  hubPlan({ id: "hub-active", invoice: "19311", status: "active", currency: "PHP", total: 523712, paid: 209484, remaining: 314228, months: 6 }),
  hubPlan({ id: "hub-overdue", invoice: "19207", status: "overdue", currency: "JPY", total: 73780, paid: 26314, remaining: 47466, months: 6 }),
  hubPlan({ id: "hub-extension", invoice: "19188", status: "extension_active", currency: "JPY", total: 92035, paid: 73628, remaining: 18407, months: 6 }),
  hubPlan({ id: "hub-forfeited", invoice: "18904", status: "forfeited", currency: "PHP", total: 612300, paid: 133744, remaining: 478556, months: 10 }),
  hubPlan({ id: "hub-final-forfeited", invoice: "18760", status: "final_forfeited", currency: "JPY", total: 128400, paid: 32100, remaining: 96300, months: 8 }),
  hubPlan({ id: "hub-settlement", invoice: "18877", status: "final_settlement", currency: "JPY", total: 64200, paid: 45634, remaining: 18566, months: 8 }),
  hubPlan({ id: "hub-cancelled", invoice: "18655", status: "cancelled", currency: "PHP", total: 41500, paid: 0, remaining: 41500, months: 6 }),
  // THE ROW THIS FIX EXISTS FOR. Paid off and closed: remaining_balance is
  // exactly 0, and 902 of the 954 closed real plans look like this. Before the
  // fix it rendered "Paid in full" above "Unpaid when it closed ₱0".
  hubPlan({ id: "hub-completed", invoice: "18102", status: "completed", currency: "PHP", total: 83311, paid: 83311, remaining: 0, months: 3 }),
  // Paid MORE than the total, which the Hub floors to remaining 0 — TEST-004
  // really did take ₱17,500 against a ₱15,000 plan. Same branch as above, kept
  // separate so an overpaid plan is never silently assumed to match.
  hubPlan({ id: "hub-overpaid", invoice: "18044", status: "completed", currency: "PHP", total: 15000, paid: 17500, remaining: 0, months: 3 }),
];

export function layawayPlanFixture(id: string): HubLayawayDetail | null {
  const plan = layawayPlansFixture.find((p) => p.id === id);
  if (!plan) return null;

  // A Hub-arranged plan: no item lines, a schedule part paid, and a portal link
  // rather than a payment form.
  if (plan.source_channel !== "web") {
    const closed = ["completed", "forfeited", "final_forfeited", "final_settlement", "cancelled"].includes(plan.status);
    const per = Math.round((plan.total_amount - plan.downpayment_amount) / plan.payment_plan_months);
    const paidRows = Math.min(plan.payment_plan_months, Math.floor(plan.total_paid / Math.max(per, 1)));
    return {
      plan,
      schedule: Array.from({ length: plan.payment_plan_months }, (_, i) => {
        const done = i < paidRows;
        // Forfeiture cancels the unpaid rows; settlement leaves them overdue.
        const state = done ? "paid"
          : plan.status === "forfeited" ? "cancelled"
          : plan.status === "completed" ? "paid"
          : i === paidRows ? "overdue" : "pending";
        return {
          id: `${plan.id}-row-${i + 1}`, installment_number: i + 1, due_date: fixtureDueDate(i + 1 - plan.payment_plan_months),
          base_installment_amount: per, penalty_amount: state === "overdue" ? 1000 : 0, carried_amount: 0,
          total_due_amount: per, allocated: done ? per : 0, actual_remaining: done ? 0 : per,
          computed_status: state as HubLayawayScheduleRow["computed_status"],
        };
      }),
      items: [],
      payments: paidRows > 0
        ? [{ id: `${plan.id}-p1`, amount_paid: plan.total_paid, currency: plan.currency, date_paid: fixtureDueDate(-1), payment_method: "Bank transfer", reference_number: null, created_at: new Date().toISOString() }]
        : [],
      pending_submissions: [],
      deposit_paid: plan.total_paid > 0,
      transfer_region: plan.currency === "PHP" ? "OVERSEAS" : "JP",
      transfer_methods: closed ? [] : fixtureMethods,
      portal_url: "https://portal.chajewelsjp.com/portal",
    };
  }

  return {
    plan,
    schedule: Array.from({ length: fixturePlanTerm }, (_, i) => {
      const amount = fixturePlanBase + (i === fixturePlanTerm - 1 ? fixturePlanRemainder : 0);
      return {
        id: `row-${i + 1}`, installment_number: i + 1, due_date: fixtureDueDate(i + 1),
        base_installment_amount: amount, penalty_amount: 0, carried_amount: 0,
        total_due_amount: amount, allocated: 0, actual_remaining: amount,
        computed_status: "pending" as const,
      };
    }),
    items: [{
      id: "item-1", variant_id: "v3", product_id: "3", title: "Twist bangle", title_ja: "ツイストバングル",
      sku: "CJ-0003", quantity: 1, unit_price_jpy: 236000, line_total_jpy: 236000, image_url: null,
    }],
    payments: [],
    pending_submissions: [],
    deposit_paid: false,
    transfer_region: "JP",
    // No bank details before staff confirm (Hub A2).
    transfer_methods: plan.awaiting_confirmation ? [] : fixtureMethods,
  };
}

/**
 * Service requests: one answered request on each fixture record, plus whatever
 * the preview raises. Module state, so a request made in the preview shows up
 * in the list on the next render the way a real one would.
 */
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const serviceRequestsStore: ServiceRequest[] = [
  {
    id: "sr-1", cash_order_id: FIXTURE_ORDER_ID, layaway_plan_id: null, item_title: "Twist bangle", kind: "cleaning",
    details: "The clasp has dulled. Please clean it and check the hinge.", ring_size: null, status: "in_progress",
    customer_note: "Received on Tuesday. It will be back with you within the week.", created_at: daysAgo(6), updated_at: daysAgo(2),
  },
  {
    id: "sr-2", cash_order_id: null, layaway_plan_id: FIXTURE_PLAN_ID, item_title: null, kind: "resize",
    details: "Please size the ring down before it ships.", ring_size: "11", status: "completed",
    customer_note: null, created_at: daysAgo(20), updated_at: daysAgo(12),
  },
];
export function serviceRequestsFixture(): ServiceRequest[] {
  return [...serviceRequestsStore].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export function createServiceRequestFixture(body: ServiceRequestInput): ServiceRequest {
  const now = new Date().toISOString();
  const row: ServiceRequest = {
    id: `sr-${Date.now()}`, cash_order_id: body.cash_order_id ?? null, layaway_plan_id: body.layaway_plan_id ?? null,
    item_title: body.item_title ?? null, kind: body.kind, details: body.details, ring_size: body.ring_size ?? null,
    status: "requested", customer_note: null, created_at: now, updated_at: now,
  };
  serviceRequestsStore.unshift(row);
  return row;
}

/**
 * Preview newsletter memory: the first sign-up for an address is "subscribed",
 * a second is "already_subscribed", so both branches of the form can be seen
 * without a Hub. Module-scope, so it resets whenever the server does — which
 * is the right lifetime for a fixture.
 */
const subscribers = new Set<string>();
export function rememberSubscriber(email: string): boolean {
  const key = email.trim().toLowerCase();
  if (subscribers.has(key)) return true;
  subscribers.add(key);
  return false;
}

/**
 * The seeded site settings — what the Hub's `website_settings` rows hold on the
 * day this shipped, so the preview exercises the SETTINGS path rather than the
 * fallback path. The values are deliberately today's values: a preview that
 * looks different from production would be testing the fixture, not the code.
 *
 * The one exception is `announcement`, which is seeded ACTIVE with no end date.
 * Nothing in production is announcing anything yet, and a bar that cannot be
 * seen cannot be reviewed — this is the flag the accessibility pass and the
 * screenshots are taken against (`NEXT_PUBLIC_PREVIEW_FIXTURES=1`).
 */
export const settingsFixture: SiteSettings = {
  // Not published by the Hub yet (see reservationMode in lib/settings.ts);
  // present here so the reservation-mode hold note on /loyalty can be seen.
  ...(PREVIEW_RESERVATION ? { web_reservation_mode: true } : {}),
  "social.follow": [
    { key: "email", href: "mailto:sales@chajewelsjp.com" },
    { key: "facebook", href: "https://www.facebook.com/chajewelsjapan" },
    { key: "messenger", href: "https://m.me/chajewelsjapan" },
  ],
  "social.loyalty_groups": [
    { key: "whatsapp", href: "https://chat.whatsapp.com/ENdMNvF8N3jB3iG963f6EF" },
    { key: "line", href: "https://line.me/ti/g/5fb8KyBCCJ" },
    { key: "messenger", href: "https://m.me/ch/AbYF1EaEkypQc5Jk/?send_source=cm:copy_invite_link" },
  ],
  "contact.email": "sales@chajewelsjp.com",
  "footer.tagline": {
    ja: "日本で真贋確認済みのK18ゴールド、パール、ダイヤモンドジュエリーと、厳選したプレラブド・ラグジュアリー。東京のお客様と、世界中のフィリピン人ファミリーのために。",
    en: "K18 gold, pearl and diamond jewelry, hallmark checked in Japan, and curated preloved luxury. For our neighbours in Tokyo and Filipino families everywhere.",
  },
  announcement: {
    active: true,
    text: {
      ja: "年末年始の発送スケジュールについてのお知らせ。",
      en: "Holiday shipping dates for Japan and the Philippines.",
    },
    href: "/faq",
    until: null,
  },
};

/**
 * Preview editorial. TWO ROWS, chosen so the preview exercises every branch of
 * lib/posts.ts rather than just the happy one:
 *
 *  - `what-k18-means` carries a cover, so the list thumbnail and the article
 *    header image are both exercised. It is the slug the static post used to
 *    hold, which is now seeded into the Hub (docs/posts-seed.sql).
 *  - `eight-month-layaway-now-open` is `news` and `layaway_only`, so it covers
 *    the ?type=news filter and the Japanese hiding rule at once — and leaves
 *    /blog?type=news EMPTY on Japanese, which is the state the list has to
 *    render rather than crash on.
 *
 * Bodies are MARKDOWN, as the Hub's will be: a heading, a list, a link and
 * emphasis between them, so lib/markdown.ts is exercised by looking at a page.
 */
export const postsFixture: HubPost[] = [
  {
    id: "post-1",
    slug: "what-k18-means",
    type: "article",
    published_at: "2026-09-18",
    cover_url: "/fixtures/pendant-1.svg",
    layaway_only: false,
    title_en: "What K18 means, and how to read the stamp",
    title_ja: "K18の意味と、刻印の読み方",
    excerpt_en: "Seventy-five per cent gold, twenty-five per cent alloy, and what that trade-off buys you in a piece worn every day.",
    excerpt_ja: "金75%、合金25%。毎日身につけるジュエリーにとって、その配合が何を意味するのか。",
    body_en: [
      "K18 means the metal is **75% gold**. The remaining quarter is an alloy of silver and copper, and it is what decides hardness and colour.",
      "## Why not K24",
      "Pure gold is soft. As a ring or a chain it bends out of shape and picks up scratches from ordinary wear, which is why it is kept for bars rather than jewelry.",
      "## Reading the stamp",
      ["- **K18** — the Japanese mark", "- **AU750** — the same purity, written the European way", "- A maker's mark, often beside it"].join("\n"),
      "Any jeweler can read these. If you are not sure what is on a piece you already own, [send us a photo](/contact) and we will tell you.",
    ].join("\n\n"),
    body_ja: [
      "K18は金の含有率が**75%**であることを示します。残りの25%は銀や銅などの合金で、これが硬さと色を決めます。",
      "## K24ではない理由",
      "純金は柔らかく、指輪やチェーンでは日常の着用で曲がり、傷がつきます。インゴットには向いていても、ジュエリーには向きません。",
      "## 刻印の読み方",
      ["- **K18** — 日本の表記", "- **AU750** — 同じ純度のヨーロッパ式の表記", "- メーカーの刻印が並ぶこともあります"].join("\n"),
      "どの宝飾店でも読み取れます。お手持ちの品の刻印がわからない場合は、[写真をお送りください](/contact)。",
    ].join("\n\n"),
  },
  {
    id: "post-2",
    slug: "eight-month-layaway-now-open",
    type: "news",
    published_at: "2026-09-12",
    cover_url: null,
    layaway_only: true,
    title_en: "Eight-month layaway is now open on orders of ¥300,000 and above",
    title_ja: null,
    excerpt_en: "The longer plan is live, with the same 30% deposit and the same 0% interest.",
    excerpt_ja: null,
    body_en: [
      "Orders of ¥300,000 and above can now be spread over *eight* months instead of six.",
      "Everything else is unchanged: 30% on the day, no interest, and a reminder three days before each due date.",
      "See the [layaway terms](/layaway) for the full schedule.",
    ].join("\n\n"),
    body_ja: null,
  },
];

/**
 * The preview FAQ: today's answers, put through the SAME conversion that
 * generated docs/faq-seed.sql. So the preview exercises the Hub path — the
 * markdown renderer, the language filter, the layaway rule — against the real
 * thirty-nine answers rather than against two invented ones, and a conversion
 * that mangles an answer is visible on the page and not only in a gate.
 *
 * `layaway_only` comes from the entry's `layaway: true` in lib/content/faq.ts
 * (owner decision 2026-09-25: nothing layaway-related on the Japanese site).
 *
 * ONE PREVIEW-ONLY DEVIATION: the first question under "Payments and Layaway"
 * is flagged `layaway_only` whatever lib/content/faq.ts says. The flag
 * is a column the owner sets in the Hub, and a rule that cannot be seen cannot
 * be reviewed — this is what the Japanese preview is checked against. Production
 * seeds every row false.
 */
export function faqFixture(): HubFaqSection[] {
  return faqSections.map((section, si) => {
    const slug = sectionSlug(section.h.en);
    return {
      id: `faq-${slug}`,
      slug,
      title_en: section.h.en,
      title_ja: section.h.ja,
      sort_order: (si + 1) * 10,
      items: section.items.map((item, ii) => ({
        id: `faq-${slug}-${ii + 1}`,
        question_en: item.q.en,
        question_ja: item.q.ja,
        answer_en: blocksToMarkdown(item.a, "en"),
        answer_ja: blocksToMarkdown(item.a, "ja"),
        layaway_only: item.layaway === true || (slug === "payments-and-layaway" && ii === 0),
        sort_order: (ii + 1) * 10,
      })),
    };
  });
}

/**
 * Preview stand-in for GET /me/points-preview: a Radiant (2×) member, fixed
 * figures, with a promo bonus so every branch of the line can be looked at.
 * NEXT_PUBLIC_PREVIEW_POINTS=join shows the non-member line instead.
 */
export function pointsPreviewFixture(variantIds: string[]): HubPointsPreview {
  const join = process.env.NEXT_PUBLIC_PREVIEW_POINTS === "join";
  return {
    enabled: true,
    enrolled: !join,
    tier: join ? null : "Radiant",
    multiplier: join ? null : 2,
    items: variantIds.map((id) => join
      ? { variant_id: id, eligible: true, points: 1500, base_points: 1500, promo_points: 0, multiplier: 1, tier: "Glimmer", upgraded_to: null }
      : { variant_id: id, eligible: true, points: 3600, base_points: 3000, promo_points: 600, multiplier: 2, tier: "Radiant", upgraded_to: null }),
  };
}
