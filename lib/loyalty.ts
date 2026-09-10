import type { Lang } from "./i18n";
/**
 * Tier ladder — reconciled against the Hub's `loyalty_tiers` table 2026-09-10.
 *
 * The Hub is the binding source: it computes a member's tier and serves the
 * ladder from GET /loyalty/tiers. The /loyalty page renders THIS list only when
 * the Hub is unreachable, so it must not drift from the table. These are the
 * real values, not proposals.
 *
 * thresholdJpy   12-month rolling spend that earns the tier.
 * requalifyJpy   spend needed to keep the tier for another period (null = none).
 * multiplier     points multiplier on every purchase.
 *
 * EVERY tier holds a claimed piece for 60 minutes. Hold time is NOT a tier
 * benefit and must never be advertised as one — see HOLD_MINUTES.
 */
export type Tier = {
  slug: string;
  name: string;
  thresholdJpy: number;
  requalifyJpy: number | null;
  multiplier: number;
  holdMinutes: number;
  perks: Record<Lang, string[]>;
};

/** Uniform across every tier. State it once, never per tier. */
export const HOLD_MINUTES = 60;

export const tiers: Tier[] = [
  {
    slug: "glimmer",
    name: "Glimmer",
    thresholdJpy: 0,
    requalifyJpy: null,
    multiplier: 1,
    holdMinutes: HOLD_MINUTES,
    perks: {
      ja: ["通常ポイント付与", "ロイヤルティ特典のご利用", "会員限定プロモーションのご案内"],
      en: ["Standard points accumulation", "Access to loyalty rewards", "Access to member promotions"],
    },
  },
  {
    slug: "radiant",
    name: "Radiant",
    thresholdJpy: 1000000,
    requalifyJpy: 500000,
    multiplier: 2,
    holdMinutes: HOLD_MINUTES,
    perks: {
      ja: ["全商品ポイント2倍", "会員限定プロモーションの優先ご案内", "フラッシュセールへの優先ご参加"],
      en: [
        "Double points on all purchases",
        "Access to exclusive member promotions",
        "Priority access to flash sales",
      ],
    },
  },
  {
    slug: "elite",
    name: "Elite",
    thresholdJpy: 4000000,
    requalifyJpy: 2000000,
    multiplier: 2,
    holdMinutes: HOLD_MINUTES,
    perks: {
      ja: [
        "全商品ポイント2倍",
        "4点ご購入ごとに送料無料（1点あたり¥8,000以上）",
        "1回のご注文¥50,000ごとに2%割引",
        "Elite限定特典のご利用",
      ],
      en: [
        "Double points on all purchases",
        "Free shipping every 4 items purchased (min ¥8,000/item)",
        "2% discount for every ¥50,000 order in one invoice",
        "Access to Elite exclusive rewards",
      ],
    },
  },
  {
    slug: "crown-vip",
    name: "Crown VIP",
    thresholdJpy: 8000000,
    requalifyJpy: 4000000,
    multiplier: 3,
    holdMinutes: HOLD_MINUTES,
    perks: {
      ja: [
        "全商品ポイント3倍",
        "3点ご購入ごとに送料無料（1点あたり¥8,000以上）",
        "1回のご注文¥50,000ごとに3%割引",
        "ご発送ごとにミステリーギフトを同封",
        "Crown VIP限定特典のご利用",
      ],
      en: [
        "Triple points on all purchases",
        "Free shipping every 3 items purchased (min ¥8,000/item)",
        "3% discount for every ¥50,000 order in one invoice",
        "Mystery gift with every shipment",
        "Access to Crown VIP exclusive rewards",
      ],
    },
  },
];
export const POINTS_PER_10K = 100;
export const INACTIVITY_MONTHS = 6;
