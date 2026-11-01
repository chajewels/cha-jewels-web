import { pageMeta } from "@/lib/page-meta";
import { localePath } from "@/lib/locale";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
import { tiers as fallbackTiers } from "@/lib/loyalty";
import type { HubTier } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { TierLadder } from "@/components/fx/tier-ladder";
import { TierIcon } from "@/components/fx/tier-icon";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";
import { ResolveNumber } from "@/components/lumiere/common/resolve-number";
export const generateMetadata = () => pageMeta("loyalty");
export const revalidate = 300;


/**
 * LOYALTY (build step 5; comp page-comps/brand-programmes "loyalty").
 *
 * The hero stage carries the gilt headline, the lede and a two-cell ledger of
 * the lede's own base facts. The tier ladder is a four-column gold-ruled
 * ledger on a dark band with the animated tier medallions (restored 2026-10-03,
 * owner decision); the crown tier keeps its gold edge. Tiers,
 * thresholds, multipliers and perks are the Hub's (hub.loyaltyTiers()),
 * shown as they are: Radiant and Elite are both 2x by the owner's rule (D5-4).
 *
 * The order-holds paragraph is gone from this page (owner decision D5-5); it
 * moves to the Hub FAQ as content.
 */
export default async function LoyaltyPage() {
  const lang = await getLang();
  const t = tr(lang);
  // Tiers come from the Hub (the system that actually awards them). Local list is only a fallback if the Hub is unreachable.
  const tiers = await hub.loyaltyTiers().catch(() => fallbackTiers.map((x) => ({ slug: x.slug, name: x.name, threshold_jpy: x.thresholdJpy, requalify_spend: x.requalifyJpy, multiplier: x.multiplier, hold_minutes: x.holdMinutes, benefits_ja: x.perks.ja, benefits_en: x.perks.en }) as HubTier));
  const first = tiers[0]?.name;
  return (
    <>
      {/* P4b: an ink head (Halden band) with the two base facts as plates; the ladder as plates on the ink band below (Aerra's resolving figures). */}
      <PageHead
        tone="ink"
        eyebrow={t("nav", "loyalty")}
        title={t("loyalty", "h1")}
        lead={t("loyalty", "lede")}
        aside={
          <dl className="icm-facts">
            <div className="icm-fact">
              <dt>{t("loyalty", "baseRate")}</dt>
              <dd className="icm-fact__fig"><ResolveNumber>{t("loyalty", "baseRateValue")}</ResolveNumber></dd>
              {first && <dd className="icm-fact__sub">{first}</dd>}
            </div>
            <div className="icm-fact">
              <dt>{t("loyalty", "pointValue")}</dt>
              <dd className="icm-fact__fig"><ResolveNumber>{t("loyalty", "pointValueValue")}</ResolveNumber></dd>
              <dd className="icm-fact__sub">{t("loyalty", "onNextPiece")}</dd>
            </div>
          </dl>
        }
      >
        <div className="mt-7"><Link href={localePath("/loyalty/join", lang)} className="icm-pill icm-pill--light">{t("loyalty", "join")}</Link></div>
      </PageHead>

      <section className="lm-sec lm-sec--ink" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <h2 className="lm-h2">{t("loyalty", "levelsH")}</h2>
          <p className="lm-lead" style={{ color: "rgb(255 255 255 / 0.8)" }}>{t("loyalty", "levelsP")}{lang === "ja" ? "" : " "}{t("loyalty", "inactivityP")}</p>
          {/* THE LADDER (components/fx/tier-ladder.tsx): a rail fills as the reader
              scrolls and each tier lights as it reaches it. The medallions are untouched. */}
          <TierLadder tone="dark" className="mt-12">
            <ol className="icm-tiers">
              {tiers.map((tier, i) => {
                const crown = i === tiers.length - 1;
                return (
                  <li key={tier.slug} data-tier="" data-crown={crown ? "" : undefined} className="icm-tier lm-rise">
                    <TierIcon slug={tier.slug} sm={72} lg={88} />
                    <div>
                      <span className="icm-tier__lab">{t("loyalty", "level", { n: String(i + 1) })}</span>
                      <h3 className="icm-tier__name font-display">{tier.name}</h3>
                    </div>
                    <p className="flex flex-col gap-1">
                      <span className="icm-tier__lab">{t("loyalty", "multiplier")}</span>
                      <span className="icm-tier__mult"><ResolveNumber>{tier.multiplier === null ? "—" : t("loyalty", "times", { n: String(tier.multiplier) })}</ResolveNumber></span>
                    </p>
                    <dl>
                      <div>
                        <dt>{t("loyalty", "threshold")}</dt>
                        <dd>{tier.threshold_jpy === 0 ? t("loyalty", "onJoining") : `${formatMoney(tier.threshold_jpy, "JP")}+`}</dd>
                      </div>
                      <div>
                        <dt>{t("loyalty", "requalify")}</dt>
                        <dd>{tier.requalify_spend === null ? t("loyalty", "requalifyNone") : formatMoney(tier.requalify_spend, "JP")}</dd>
                      </div>
                    </dl>
                    <div>
                      <p className="sr-only">{t("loyalty", "perks")}</p>
                      <ul>
                        {(lang === "ja" ? tier.benefits_ja : tier.benefits_en).map((p) => <li key={p}>{p}</li>)}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ol>
          </TierLadder>
        </div>
      </section>

      <PageSection tone="bone">
        <div className="icm-cta lm-rise">
          <div>
            <h2 className="lm-h2">{t("loyalty", "joinH")}</h2>
            <p>{t("loyalty", "joinP")}</p>
          </div>
          <Link href={localePath("/loyalty/join", lang)} className="icm-pill icm-pill--solid">{t("loyalty", "join")}</Link>
        </div>
      </PageSection>
    </>
  );
}
