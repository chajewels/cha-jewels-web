import type { Lang } from "@/lib/i18n";

/**
 * List-shaped page copy lives here rather than in `dict`, whose leaves are
 * single strings.
 *
 * TWO BULLETS REMOVED, OWNER DECISION 2026-09-22, both because they promised
 * something the business does not do:
 *
 *   "Photos, spec sheets and a purity certificate for every SKU"
 *   「全SKUに写真・仕様書・純度証明書を添付。」
 *     A certificate is issued only when a piece has one, and /faq says so in
 *     as many words: "A certificate or laboratory report is included only when
 *     stated in the product listing." The page was contradicting the
 *     authoritative FAQ, in the one place a buyer is deciding whether to order
 *     ten of something.
 *
 *   "Established partners can apply for 30-day terms after the third order"
 *   「3回目以降のご注文で30日払いをご相談可。」
 *     There is no credit facility, no third-order rule and nothing to apply
 *     to. Payment terms are settled in the written quotation, which the FAQ
 *     also states.
 *
 * The photos-and-spec-sheets half of the first bullet went with the
 * certificate rather than being kept as a shorter promise: it was one sentence
 * the owner asked to remove, and rewriting a removed claim into a smaller one
 * is a decision nobody made. The currency half of the last bullet stays,
 * without the credit clause.
 *
 * The 10-piece minimum stays — it is real, and /faq's wholesale section is
 * careful to say that minimums otherwise vary by quotation.
 */
export const wholesaleBullets: Record<Lang, string[]> = {
  ja: [
    "1回のご注文は10点から。チェーン、バングル、リング、ピアスを組み合わせ可。",
    "在庫品は5営業日以内に東京から発送。",
    "円またはペソでお支払い。",
  ],
  en: [
    "Minimum 10 pieces per order. Mix chains, bangles, rings and earrings.",
    "In-stock items ship from Tokyo within 5 business days.",
    "Pay in JPY or PHP.",
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
