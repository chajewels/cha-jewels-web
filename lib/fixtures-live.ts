import type { Product } from "@/lib/types";

/**
 * LIVE MIRROR (preview fixtures only, `NEXT_PUBLIC_PREVIEW_LIVE_MIRROR=1`):
 * the pieces on www.chajewelsjp.com's hero categories on 2026-09-26, with
 * their Hub names, prices and photo galleries (the Hub's public photo URLs,
 * in the Hub's order, read from the public product pages). N4020 is sold.
 * The Hub sends no cut-outs yet, so these carry none — exactly what a
 * preview deployment sees; `?hero_demo=1` adds the comps' cut-outs by SKU
 * (lib/hero-demo.ts). Ordered so each stage stands its pieces where the
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

export const liveMirrorProducts: Product[] = ROWS.map(([sku, category, en, ja, jpy, stock, condition, brand, photos], i) => ({
  id: `live-${i}`, sku, slug: en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: en, name_en: en, name_ja: ja,
  karat: null, metals: [], weight_g: null, description_en: en, description_ja: null, description_tl: null, status: "active",
  condition, origin: brand ? "BRAND" : "UNKNOWN", brand, category_slugs: [category],
  product_variants: [{ id: `live-v${i}`, size: null, stone: null, price_jpy: jpy || 1, stock_qty: stock, product_media: photos.map((url, sort) => ({ url, alt: null, sort })) }],
}));
