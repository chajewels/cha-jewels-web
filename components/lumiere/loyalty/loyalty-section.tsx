import Link from "next/link";

import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import { localePath } from "@/lib/locale";
import { hub } from "@/lib/hub-api";
import { tiers as fallbackTiers } from "@/lib/loyalty";
import type { HubTier } from "@/lib/types";
import { lumiereLoyalty } from "@/lib/content/lumiere-home";

/**
 * THE LOYALTY BAND (new, D-21 APPROVED) → /loyalty. A black band in the
 * featured stage's and footer's register: the programme's own heading, its
 * one-sentence summary, the two-cell ledger (1 % at Glimmer; one point = ¥1 —
 * the programme page's own strings, set as plain text, P2b item 11), the
 * TIERS AS THE HUB HOLDS THEM (`hub.loyaltyTiers`: name and points
 * multiplier per level, the same read /loyalty makes, the same fallback when
 * the Hub is unreachable) and the "Join free" pill. The medallions stay on
 * the programme page (D-20).
 */
export const LOYALTY_ID = "loyalty";

const fallback = (): HubTier[] =>
  fallbackTiers.map((x) => ({ slug: x.slug, name: x.name, threshold_jpy: x.thresholdJpy, requalify_spend: x.requalifyJpy, multiplier: x.multiplier, hold_minutes: x.holdMinutes, benefits_ja: x.perks.ja, benefits_en: x.perks.en }));

export const LoyaltySection = async ({ lang }: { lang: Lang }) => {
  const t = tr(lang);
  const content = lumiereLoyalty(lang, localePath("/loyalty", lang));
  const tiers = await hub.loyaltyTiers().catch(fallback);
  return (
    <section id={LOYALTY_ID} aria-labelledby="loyalty-heading" className="loyalty">
      <div className="loyalty__copy">
        <p className="loyalty__eyebrow font-manrope">{content.eyebrow}</p>
        <h2 id="loyalty-heading" className="loyalty__heading font-serif">
          {content.heading}
        </h2>
        <p className="loyalty__lead font-tight">{content.lead}</p>
        <Link href={content.cta.href} className="loyalty__pill font-tight" data-analytics="loyalty-join">
          {content.cta.label} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="loyalty__panel">
        <dl className="loyalty__ledger">
          {content.cells.map((cell, i) => (
            <div key={cell.label} className="loyalty__cell">
              <dt className="loyalty__label font-manrope">{cell.label}</dt>
              <dd className="loyalty__value font-serif">
                {cell.value}
                {i === content.cells.length - 1 && <span className="loyalty__note font-manrope">{content.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
        {/* The levels: the Hub's names and multipliers (loyalty.times, "{n}x"). */}
        <ol className="loyalty__tiers font-manrope" aria-label={t("loyalty", "levelsH")}>
          {tiers.map((tier, index) => (
            <li key={tier.slug} className="loyalty__tier">
              <span className="loyalty__tier-index">{t("loyalty", "level", { n: String(index + 1) })}</span>
              <span className="loyalty__tier-name font-serif">{tier.name}</span>
              <span className="loyalty__tier-rate">
                <span className="sr-only">{t("loyalty", "multiplier")}: </span>
                {tier.multiplier === null ? "—" : t("loyalty", "times", { n: String(tier.multiplier) })}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
