import type { Lang } from "./i18n";
/**
 * Tier ladder — reconciled against the Hub's `loyalty_tiers` table 2026-09-10.
 *
 * The Hub is the binding source: it computes a member's tier and serves the
 * ladder from GET /loyalty/tiers. The /loyalty page renders THIS list only when
 * the Hub is unreachable, so it must not drift from the table. These are the
 * real values, not proposals.
 *
 * thresholdJpy   lifetime spend (cumulative, never resets) that earns the tier.
 * requalifyJpy   comeback spend: after 180 days without a purchase the member
 *                steps down one tier, and this is the extra spend needed to
 *                regain the earned tier (null = none).
 * multiplier     points multiplier on every purchase.
 *
 * HOLD TIME IS NOT A TIER BENEFIT and must never be advertised as one. It is
 * also no longer sixty minutes — see CLAIM_HOLD_HOURS.
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

/**
 * HOW LONG A CLAIMED PIECE IS HELD (owner-confirmed 2026-09-16, via the FAQ).
 *
 * 24 hours for a new customer, 72 for a returning one, the same at every tier.
 * It is NOT a per-tier number any more, which is why it does not live on `Tier`
 * — it turns on the customer's history, not their level.
 *
 * The rendered copy is `dict.loyalty.holdNote`; these constants exist so the
 * rule has one home and the numbers in the dictionary can be checked against
 * something. Do not render them directly.
 *
 * THE HUB STILL SAYS 60 and is NOT authoritative. `loyalty_tiers.hold_minutes`
 * defaults to 60 and GET /loyalty/tiers still serves it, so `HubTier` carries
 * the field and `hold_minutes` below mirrors it — but NOTHING renders it, and
 * nothing should. Worth knowing when reading that field: the Hub does not act
 * on it either. `website_live_claims` has an `expires_at` and an index built
 * for a sweep, but its only reader is a read-only GET, no cron touches it, and
 * its 'expired' / 'released' statuses are never written. So no claim is
 * released after 60 minutes today — and none is released after 24 or 72 hours
 * either. Enforcing this rule is a Hub change and its own PR.
 */
export const CLAIM_HOLD_HOURS = { newCustomer: 24, returning: 72 } as const;

/** The Hub's stale per-tier value, mirrored for the HubTier shape. Never shown. */
const HUB_HOLD_MINUTES = 60;

export const tiers: Tier[] = [
  {
    slug: "glimmer",
    name: "Glimmer",
    thresholdJpy: 0,
    requalifyJpy: null,
    multiplier: 1,
    holdMinutes: HUB_HOLD_MINUTES,
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
    holdMinutes: HUB_HOLD_MINUTES,
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
    holdMinutes: HUB_HOLD_MINUTES,
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
    holdMinutes: HUB_HOLD_MINUTES,
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
/**
 * THE BASE EARNING RATE IS 1%, AT GLIMMER (owner-confirmed 2026-09-16). The
 * higher tiers multiply it — see each tier's `multiplier`.
 *
 * 1% and the old "¥10,000 earns 100 points" are the same arithmetic, because a
 * point is worth ¥1. The difference is that the old phrasing named no tier, so
 * it read as the only rate a customer could ever earn. Stated as a percentage
 * with the tier named, the multipliers below make sense.
 */
export const BASE_EARN_RATE = 0.01;
export const INACTIVITY_MONTHS = 6;
