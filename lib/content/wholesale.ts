import type { Lang } from "@/lib/i18n";

/** List-shaped page copy lives here rather than in `dict`, whose leaves are single strings. */
export const wholesaleBullets: Record<Lang, string[]> = {
  ja: [
    "1回のご注文は10点から。チェーン、バングル、リング、ピアスを組み合わせ可。",
    "価格はグラム重量と当日の金相場に連動。",
    "全SKUに写真・仕様書・純度証明書を添付。",
    "在庫品は5営業日以内に東京から保険付きで発送。",
    "円またはペソでお支払い。3回目以降のご注文で30日払いをご相談可。",
  ],
  en: [
    "Minimum 10 pieces per order. Mix chains, bangles, rings and earrings.",
    "Pricing tied to gram weight and the day's gold rate.",
    "Photos, spec sheets and a purity certificate for every SKU.",
    "In-stock items ship insured from Tokyo within 5 business days.",
    "Pay in JPY or PHP. Established partners can apply for 30-day terms after the third order.",
  ],
};

/** Values are the Hub's enums — do not localise them, only their labels. */
export const MARKETS = ["JP", "PH", "BOTH", "OTHER"] as const;
export const VOLUMES = ["TEST", "20_50", "50_200", "200_PLUS"] as const;
export type Market = (typeof MARKETS)[number];
export type Volume = (typeof VOLUMES)[number];

export const marketLabel: Record<Market, Record<Lang, string>> = {
  JP: { ja: "日本", en: "Japan" },
  PH: { ja: "フィリピン", en: "Philippines" },
  BOTH: { ja: "日本とフィリピン", en: "Both" },
  OTHER: { ja: "その他", en: "Elsewhere" },
};

export const volumeLabel: Record<Volume, Record<Lang, string>> = {
  TEST: { ja: "お試し 10〜20点", en: "Testing 10–20" },
  "20_50": { ja: "20〜50点", en: "20–50" },
  "50_200": { ja: "50〜200点", en: "50–200" },
  "200_PLUS": { ja: "200点以上", en: "200+" },
};
