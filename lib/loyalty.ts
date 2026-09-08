import type { Lang } from "./i18n";
/**
 * Level thresholds are 12-month rolling spend in JPY.
 * PROPOSED VALUES — confirm with Cynthia before launch. Perks mirror the Hub's tier definitions.
 * The binding tier is computed by the Hub (loyalty_ledger); this file is display-only.
 */
export type Tier = { slug: string; name: string; thresholdJpy: number; holdMinutes: number; perks: Record<Lang, string[]> };
export const tiers: Tier[] = [
  { slug: "glimmer", name: "Glimmer", thresholdJpy: 0, holdMinutes: 60, perks: { ja: ["ポイント付与開始（¥10,000＝100pt）", "ライブ販売の事前告知", "予約商品の確保 60分"], en: ["Points start (¥10,000 = 100 pts)", "Live drop previews before the public post", "Claimed pieces held 60 minutes"] } },
  { slug: "radiant", name: "Radiant", thresholdJpy: 100000, holdMinutes: 180, perks: { ja: ["予約商品の確保 3時間", "お誕生日ポイント 500pt", "パールの糸替え1回無料"], en: ["Claimed pieces held 3 hours", "500 birthday points", "One free pearl restring"] } },
  { slug: "elite", name: "Elite", thresholdJpy: 300000, holdMinutes: 720, perks: { ja: ["予約商品の確保 12時間", "分割予約 最長8か月（金額を問わず）", "年2回のクリーニング無料"], en: ["Claimed pieces held 12 hours", "8-month layaway on any amount", "Cleaning twice a year, free"] } },
  { slug: "crown", name: "Crown VIP", thresholdJpy: 1000000, holdMinutes: 1440, perks: { ja: ["予約商品の確保 24時間", "新作・プレラブド入荷の先行案内", "専任アドバイザー", "サイズ直し・修理 永年無料"], en: ["Claimed pieces held 24 hours", "First pick of new and preloved arrivals", "A dedicated advisor", "Resizing and repair free for life"] } },
];
export const POINTS_PER_10K = 100;
export const INACTIVITY_MONTHS = 6;
