import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
import { tiers as fallbackTiers } from "@/lib/loyalty";
import type { HubTier } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { TierLadder } from "@/components/fx/tier-ladder";
import { TierIcon } from "@/components/fx/tier-icon";
import { Eyebrow } from "@/components/site/support-stage";
import { DarkBand, H_DISPLAY, H_HEAD, H_TITLE, LEDE_DARK, Label, SEC, SEC_S, StageBand } from "@/components/site/brand-ui";
export const generateMetadata = () => pageMeta("loyalty");
export const revalidate = 300;


/**
 * "Join free" is NOT orange (owner decision D5-3): joining is neither a buy
 * nor a contact action. Chalk on the dark stage, charcoal on the light band.
 */
const JOIN_ON_DARK = "btn-press inline-flex min-h-12 items-center justify-center rounded-sm bg-chalk px-6 py-3 text-[15px] font-medium text-charcoal-deep hover:bg-white";
const JOIN_ON_LIGHT = "btn-press inline-flex min-h-12 items-center justify-center rounded-sm bg-charcoal-deep px-6 py-3 text-[15px] font-medium text-chalk hover:bg-charcoal";

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
      <StageBand>
        <div className={`wrap ${SEC} grid items-end gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16`}>
          <div>
            <Eyebrow dark rule>{t("nav", "loyalty")}</Eyebrow>
            <h1 className={`gilt mt-4 ${H_DISPLAY}`}>{t("loyalty", "h1")}</h1>
            <p className={`mt-[18px] ${LEDE_DARK}`}>{t("loyalty", "lede")}</p>
            <div className="mt-7"><Link href="/loyalty/join" className={JOIN_ON_DARK}>{t("loyalty", "join")}</Link></div>
          </div>
          <dl className="grid grid-cols-2 border border-rule">
            <div className="border-r border-rule p-4 sm:p-5">
              <dt><Label dark>{t("loyalty", "baseRate")}</Label></dt>
              <dd className="lining-nums mt-1.5 font-display text-[40px] leading-[1.1] text-gold-pale">{t("loyalty", "baseRateValue")}</dd>
              {first && <dd className="mt-1 text-[13px] text-chalk/75">{first}</dd>}
            </div>
            <div className="p-4 sm:p-5">
              <dt><Label dark>{t("loyalty", "pointValue")}</Label></dt>
              <dd className="lining-nums mt-1.5 font-display text-[40px] leading-[1.1] text-gold-pale">{t("loyalty", "pointValueValue")}</dd>
              <dd className="mt-1 text-[13px] text-chalk/75">{t("loyalty", "onNextPiece")}</dd>
            </div>
          </dl>
        </div>
      </StageBand>

      <DarkBand className="border-t border-chalk/10">
        <div className={`wrap ${SEC}`}>
          <h2 className={`text-gold-pale ${H_HEAD}`}>{t("loyalty", "levelsH")}</h2>
          <p className={`mt-[18px] ${LEDE_DARK}`}>{t("loyalty", "levelsP")}{lang === "ja" ? "" : " "}{t("loyalty", "inactivityP")}</p>
          {/* THE LADDER (components/fx/tier-ladder.tsx): a gold rail fills as
              the reader scrolls, each tier lights as it reaches it, and the
              top tier's edge turns slowly in gold. Dark tone on this band. */}
          <TierLadder tone="dark" className="mt-12">
            <ol className="grid border border-rule sm:grid-cols-2 lg:grid-cols-4">
              {tiers.map((tier, i) => {
                const crown = i === tiers.length - 1;
                return (
                  <li
                    key={tier.slug}
                    data-tier=""
                    data-crown={crown ? "" : undefined}
                    className={`flex flex-col gap-4 border-rule p-6 max-lg:border-b sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0 ${crown ? "bg-[linear-gradient(180deg,rgb(201_162_39/.10),transparent_60%)] outline outline-1 -outline-offset-1 outline-gold" : ""}`}
                  >
                    {/* The animated medallion (components/fx/tier-icon.tsx), restored
                        2026-10-03 by owner decision: the step 5 redesign had replaced it
                        with a plain numeral without asking. It lights with the ladder. */}
                    <TierIcon slug={tier.slug} sm={72} lg={88} />
                    <div>
                      <Label dark>{t("loyalty", "level", { n: String(i + 1) })}</Label>
                      <h3 className={`mt-1 text-gold-pale ${H_TITLE}`}>{tier.name}</h3>
                    </div>
                    <p className="lining-nums font-display text-[44px] leading-none text-chalk">
                      <span className="sr-only">{t("loyalty", "multiplier")}: </span>
                      {tier.multiplier === null ? "—" : t("loyalty", "times", { n: String(tier.multiplier) })}
                    </p>
                    <dl className="border-t border-rule">
                      <div className="border-b border-rule py-2.5">
                        <dt className="text-xs text-chalk/70">{t("loyalty", "threshold")}</dt>
                        <dd className="lining-nums mt-0.5 text-[15px] text-chalk">{tier.threshold_jpy === 0 ? t("loyalty", "onJoining") : `${formatMoney(tier.threshold_jpy, "JP")}+`}</dd>
                      </div>
                      <div className="border-b border-rule py-2.5">
                        <dt className="text-xs text-chalk/70">{t("loyalty", "requalify")}</dt>
                        <dd className="lining-nums mt-0.5 text-[15px] text-chalk">{tier.requalify_spend === null ? t("loyalty", "requalifyNone") : formatMoney(tier.requalify_spend, "JP")}</dd>
                      </div>
                    </dl>
                    <div>
                      <p className="sr-only">{t("loyalty", "perks")}</p>
                      <ul className="grid gap-2 text-[13.5px] leading-[1.55] text-chalk/85">
                        {(lang === "ja" ? tier.benefits_ja : tier.benefits_en).map((p) => (
                          <li key={p} className="flex gap-2 before:mt-2 before:h-[5px] before:w-[5px] before:flex-none before:rotate-45 before:bg-gold">{p}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ol>
          </TierLadder>
        </div>
      </DarkBand>

      <section className={`wrap ${SEC_S} flex flex-wrap items-center justify-between gap-5`}>
        <div>
          <h2 className={`text-charcoal-deep ${H_TITLE}`}>{t("loyalty", "joinH")}</h2>
          <p className="mt-1.5 text-charcoal/75">{t("loyalty", "joinP")}</p>
        </div>
        <Link href="/loyalty/join" className={JOIN_ON_LIGHT}>{t("loyalty", "join")}</Link>
      </section>
    </>
  );
}
