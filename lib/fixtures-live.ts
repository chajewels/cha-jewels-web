import type { Product } from "@/lib/types";

/**
 * LIVE MIRROR (preview fixtures only, `NEXT_PUBLIC_PREVIEW_LIVE_MIRROR=1`):
 * the pieces on www.chajewelsjp.com's hero categories on 2026-09-26, with
 * their Hub names, prices and photo galleries (the Hub's public photo URLs,
 * in the Hub's order, read from the public product pages). N4020 is sold.
 * The Hub sends no cut-outs yet, so these carry none — exactly what every
 * deployment receives; on the hero only, the bundled cut-outs
 * (lib/hero-cutouts.ts) attach to these same photo URLs. Ordered so each stage stands its pieces where the
 * approved comps do. Accessories: none, as live.
 */
type Row = [sku: string, category: string, en: string, ja: string, jpy: number, stock: number, condition: "New" | "Preloved", brand: string | null, photos: string[]];
const ROWS: Row[] = [
  ["AL3", "fine-jewelry", "AL3 Pendant K18 2.65g Cross INRI", "AL3 ペンダント K18 2.65g クロス INRI", 87980, 1, "New", null, [
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/81580781/472533236-1777358458.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/81580781/472533237-1777358458.jpeg",
  ]],
  ["AL123", "fine-jewelry", "AL123 Pendant K18 0.98g Heart shaped 15.0mm", "AL123 ペンダント K18 0.98g ハート型 15.0mm", 33980, 1, "New", null, [
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/79213257/437392479-1742360877.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/79213257/462155844-1773026675.jpeg",
  ]],
  ["AL112", "fine-jewelry", "AL112 Pendant K18 1.45g Heart N' Key Top", "AL112 ペンダント K18 1.45g ハート＆キー トップ", 53980, 1, "New", null, [
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/81333344/462264810-1773219921.jpeg",
  ]],
  ["R3341", "preloved-jewelry", "R3341 Ring K18WG 16.20g Diamond 3.82ct, 0.80ct Dome Sz# 13 [Preloved]", "R3341 リング K18WG 16.20g ダイヤモンド 3.82ct, 0.80ct ドーム #13 [プレラブド]", 628980, 1, "Preloved", null, [
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/0be8abc2-12d9-4c0e-b978-bf1a36fa2daf.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/ce6d38a7-ec0a-441b-a157-d9edabf3bbb6.png",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/aa84e60f-801f-4ba4-afc6-56bbecc3e007.png",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/7c441373-41e2-43ed-9fe6-1c0fc02a1d38.png",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/82448658/505636972-1788915886.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/82448658/506961638-1790238677.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/82448658/506961639-1790238677.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/82448658/506961640-1790238678.jpeg",
  ]],
  ["R7828", "preloved-jewelry", "R7828 Ring 750 YG/WG 19.00g Diamond 2.70ct Layered Wave Sz# 18 [Preloved]", "R7828 リング 750 YG/WG 19.00g ダイヤモンド 2.70ct レイヤードウェーブ Sz# 18 [プレラブド]", 679980, 1, "Preloved", null, [
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/5137940f-f947-487d-b71b-50bcd057243a.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/236a9362-1ea6-43e4-8c28-0e3ab5cb3d02.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/43ac5526-c038-4a65-9a88-ba128140921e.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/82448659/505636969-1788915865.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/82448659/505636970-1788915866.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/82448659/505636971-1788915866.jpeg",
  ]],
  ["R3110", "preloved-branded-jewelry", "R3110 Ring Tiffany & Co. 750 3.10g Open Heart Elsa Perreti Sz# 10.5 [Used]", "R3110 リング Tiffany & Co. 750 3.10g オープンハート Elsa Perreti サイズ# 10.5 [中古]", 158980, 1, "Preloved", "Tiffany & Co.", [
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/78321785/428829493-1732601113.jpeg",
  ]],
  ["N4020", "preloved-branded-jewelry", "N4020 Necklace Tiffany & Co. 750 2.0g Open Teardrop 40cm [Preloved]", "N4020 ネックレス Tiffany & Co. 750 2.0g オープンティアドロップ 40cm [プレラブド]", 0, 0, "Preloved", "Tiffany & Co.", [
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/278c3248-f210-4332-b58a-e88af4186f03.jpg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/7f984084-6644-4e1a-a4c0-3928b52e2c6f.jpg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/d3727170-2a5c-4be7-afaf-3992f8a3275a.jpg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/79928723/505512445-1788781065.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/79928723/505512446-1788781065.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/79928723/505512447-1788781065.jpeg",
  ]],
  ["C0983", "preloved-watches", "C0983 Watch Van Cleef & Arpels La Collection Quartz SS White 17cm [Used]", "C0983 ウォッチ Van Cleef & Arpels La Collection クォーツ SS ホワイト 17cm", 95980, 1, "Preloved", "Van Cleef & Arpels", [
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288104/450588971-1758211904.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288104/450588975-1758211904.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288104/450588968-1758211904.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288104/450588969-1758211904.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288104/450588972-1758211904.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288104/450588974-1758211904.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288104/450588970-1758211904.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288104/450588973-1758211904.jpeg",
  ]],
  ["C1395", "preloved-watches", "C1395 Watch Casio G-SHOCK Full Metal Series Solar SS Black 19cm [Preloved]", "C1395 ウォッチ Casio G-SHOCK フルメタルシリーズ ソーラー SS ブラック 19cm プレラブド", 75980, 1, "Preloved", "Casio", [
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288116/450589077-1758212309.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288116/450589078-1758212309.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288116/450589079-1758212309.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288116/450589080-1758212309.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288116/450589076-1758212309.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288116/450589081-1758212309.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288116/450589082-1758212309.jpeg",
    "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/80288116/450589075-1758212309.jpeg",
  ]],
];

/**
 * The rest of each piece's live record, as the storefront showed it on
 * 2026-09-27 (~/Code/reference/page-comps/_shared/data.js): the stamps, the
 * weight and stone fields, the Hub's down payments, the descriptions, origin,
 * the collection it sits in, its slug, and N4020's price before it sold.
 * AL3's weight field really is 0.02 g while its name says 2.65g, and R7828's
 * metal field says K18 while its name says 750: both are the Hub's, as sent.
 */
type Facts = { metals: string[]; weight_g: number | null; stone: string | null; dp: [number, number] | null; en: string; ja: string; origin: "JAPAN" | "BRAND" | "UNKNOWN"; col: string | null; price: number; slug: string };
export const LIVE_FACTS: Record<string, Facts> = {
  AL112: { metals: ["K18"], weight_g: 1.45, stone: null, dp: [16194, 6395], en: "K18 1.45g Heart N' Key Top", ja: "K18 1.45g ハート＆キー トップ", origin: "JAPAN", col: "pendants", price: 53980, slug: "al112-pendant-k18-1-45g-heart-n-key-top" },
  AL123: { metals: ["K18"], weight_g: 0.98, stone: null, dp: [10194, 4026], en: "K18 0.98g Heart shaped", ja: "K18 0.98g ハート型です。", origin: "JAPAN", col: "pendants", price: 33980, slug: "al123-pendant-k18-0-98g-heart-shaped-15-0mm" },
  AL3: { metals: ["K18"], weight_g: 0.02, stone: null, dp: [26394, 10423], en: "K18 2.65g Cross INRI", ja: "K18 2.65g クロス INRIでございます。", origin: "JAPAN", col: "pendants", price: 87980, slug: "al3-pendant-k18-2-65g-cross-inri" },
  R3341: { metals: ["K18"], weight_g: 16.2, stone: "Diamond 3.82ct, 0.80ct", dp: [188694, 74515], en: "K18WG dome ring, 16.20g, set with 3.82ct and 0.80ct diamonds. Size 13. Preloved, authenticated in Japan.", ja: "K18WG製のドームリングです。総重量は16.20gで、3.82ctと0.80ctのダイヤモンドがセッティングされています。サイズは13号です。プレラブド品で、日本で鑑定済みです。", origin: "JAPAN", col: "rings", price: 628980, slug: "r3341-ring-k18-16-20g-diamond-3-82ct-0-80ct-dome-sz-13-preloved" },
  R7828: { metals: ["K18"], weight_g: 19, stone: "Diamond 2.70ct", dp: [203994, 80557], en: "750 yellow and white gold layered wave ring, 19.0g, 2.70ct diamonds. Size 18. Preloved", ja: "750イエローゴールドとホワイトゴールドのレイヤードウェーブリングです。19.0g、2.70ctのダイヤモンドがあしらわれています。サイズは18号です。プレラブド品です。", origin: "UNKNOWN", col: "rings", price: 679980, slug: "r7828-ring-k18-19-00g-diamond-2-70ct-layered-wave-sz-18-preloved" },
  R3110: { metals: ["750"], weight_g: 3.1, stone: null, dp: [47694, 18834], en: "Tiffany & Co. 750 3.10g Open Heart Elsa Perreti Sz# 10.5 [Used]", ja: "Tiffany & Co. 750 3.10g オープンハート Elsa Perreti サイズ# 10.5 [中古]", origin: "BRAND", col: "rings", price: 158980, slug: "r3110-ring-tiffany-co-750-3-10g-open-heart-elsa-perreti-sz-10-5-used" },
  N4020: { metals: ["750"], weight_g: 2.04, stone: null, dp: null, en: "Tiffany & Co. 750 2.0g Open Teardrop 40cm [Preloved]", ja: "Tiffany & Co. 750 2.0g オープンティアドロップ 40cm [プレラブド]", origin: "BRAND", col: "necklaces", price: 72980, slug: "n4020-necklace-tiffany-co-750-2-0g-open-teardrop-40cm-preloved" },
  C0983: { metals: [], weight_g: null, stone: null, dp: [28794, 11371], en: "Brand: Van Cleef & Arpels Model number: 43106 LB5 Serial: 70001 Product rank: B µovement: Quartz Dial: White Bracelet/Strap: SS Case: SS Accessories: None", ja: "ブランド: Van Cleef & Arpels 型番: 43106 LB5 シリアル: 70001 商品ランク: B ムーブメント: クォーツ 文字盤: ホワイト ブレスレット/ストラップ: SS ケース: SS 付属品: なし", origin: "BRAND", col: null, price: 95980, slug: "c0983-watch-van-cleef-arpels-la-collection-quartz-ss-white-17cm-used" },
  C1395: { metals: [], weight_g: null, stone: null, dp: [22794, 9001], en: "Brand: Casio Model number: GM-B2100 Serial: 001C018C Product rank: B Movement: Solar Dial: Black Bracelet/Strap: SS Case: SS Accessories: Box, Case, 2 Frames, Booklet", ja: "ブランド: Casio 型番: GM-B2100 シリアル: 001C018C 商品ランク: B ムーブメント: ソーラー 文字盤: ブラック ブレスレット/ストラップ: SS ケース: SS 付属品: 箱、ケース、コマ2個、取扱説明書", origin: "JAPAN", col: null, price: 75980, slug: "c1395-watch-casio-g-shock-full-metal-series-solar-ss-black-19cm-preloved" },
};

export const liveMirrorProducts: (Product & { col: string | null })[] = ROWS.map(([sku, category, en, ja, jpy, stock, condition, brand, photos], i) => {
  const f = LIVE_FACTS[sku];
  return {
    id: `live-${i}`, sku, slug: f?.slug ?? en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: en, name_en: en, name_ja: ja,
    karat: f?.metals[0] ?? null, metals: f?.metals ?? [], weight_g: f?.weight_g ?? null, description_en: f?.en ?? en, description_ja: f?.ja ?? null, description_tl: null, status: "active",
    condition, origin: f?.origin ?? (brand ? "BRAND" : "UNKNOWN"), brand, category_slugs: [category], col: f?.col ?? null,
    product_variants: [{ id: `live-v${i}`, size: null, stone: f?.stone ?? null, price_jpy: jpy || f?.price || 1, stock_qty: stock,
      ...(f?.dp && stock > 0 ? { down_payment_jpy: f.dp[0], down_payment_php: f.dp[1] } : {}),
      product_media: photos.map((url, sort) => ({ url, alt: null, sort })) }],
  };
});
