import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
import { tiers as fallbackTiers } from "@/lib/loyalty";
import type { HubTier } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TierLadder } from "@/components/fx/tier-ladder";
import { TierIcon } from "@/components/fx/tier-icon";
import { Magnetic } from "@/components/fx/magnetic";
import { NavHeading, SplitHeading } from "@/components/fx/split-text";
export const generateMetadata = () => pageMeta("loyalty");
export const revalidate = 300;
export default async function LoyaltyPage() {
  const lang = await getLang();
  const t = tr(lang);
  // Tiers come from the Hub (the system that actually awards them). Local list is only a fallback if the Hub is unreachable.
  const tiers: HubTier[] = await hub.loyaltyTiers().catch(() => fallbackTiers.map((x) => ({ slug: x.slug, name: x.name, threshold_jpy: x.thresholdJpy, requalify_spend: x.requalifyJpy, multiplier: x.multiplier, hold_minutes: x.holdMinutes, benefits_ja: x.perks.ja, benefits_en: x.perks.en })));
  return (
    <>
      <section className="border-b border-hairline py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <NavHeading text={t("loyalty", "h1")} lang={lang} className="max-w-[18ch] text-[clamp(36px,5.5vw,80px)]" />
          <p className="mt-5 max-w-[58ch] text-charcoal">{t("loyalty", "lede")}</p>
          <div className="mt-8"><Magnetic><Button asChild><Link href="/loyalty/join">{t("loyalty", "join")}</Link></Button></Magnetic></div>
        </div>
      </section>
      <section className="border-b border-hairline py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <SplitHeading text={t("loyalty", "levelsH")} lang={lang} className="max-w-[20ch] text-[clamp(30px,4vw,56px)]" />
          <p className="mt-4 max-w-[58ch] text-charcoal">{t("loyalty", "levelsP")}</p>
          <p className="mt-2 max-w-[58ch] text-sm text-charcoal/70">{t("loyalty", "inactivityP")}</p>
          {/* THE LADDER (components/fx/tier-ladder.tsx): a gold rail fills as
              the reader scrolls, each tier lights as it reaches it, and the
              top tier's edge turns slowly in gold. */}
          <TierLadder className="mt-12">
          <ol className="rule-grid grid sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier, i) => (
              <li key={tier.slug} data-tier="" data-crown={i === tiers.length - 1 ? "" : undefined} className="flex flex-col bg-white p-6">
                <TierIcon slug={tier.slug} />
                <span className="text-xs text-charcoal/70">{t("loyalty", "level", { n: String(i + 1) })}</span>
                <h3 className="mt-1 text-[28px] text-charcoal-deep">{tier.name}</h3>
                <div className="my-4 h-0.5 bg-[linear-gradient(90deg,#8A6B12,#E8D28A)]" style={{ width: `${25 + i * 25}%` }} />
                <p className="text-xs text-charcoal/70">{t("loyalty", "threshold")}</p>
                <p className="font-display text-2xl text-charcoal-deep">{tier.threshold_jpy === 0 ? t("loyalty", "onJoining") : `${formatMoney(tier.threshold_jpy, "JP")}+`}</p>
                <dl className="mt-4 space-y-2 text-xs">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-charcoal/70">{t("loyalty", "multiplier")}</dt>
                    <dd className="font-display text-base text-gold-dark">{tier.multiplier === null ? "—" : t("loyalty", "times", { n: String(tier.multiplier) })}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-charcoal/70">{t("loyalty", "requalify")}</dt>
                    <dd className="text-charcoal">{tier.requalify_spend === null ? t("loyalty", "requalifyNone") : formatMoney(tier.requalify_spend, "JP")}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-charcoal/70">{t("loyalty", "perks")}</p>
                <ul className="mt-1 space-y-1.5 text-sm text-charcoal">{(lang === "ja" ? tier.benefits_ja : tier.benefits_en).map((p) => <li key={p} className="relative pl-4 before:absolute before:left-0 before:top-2.5 before:h-px before:w-2 before:bg-gold-dark">{p}</li>)}</ul>
              </li>
            ))}
          </ol>
          </TierLadder>
          <p className="mt-8 max-w-[58ch] text-sm text-charcoal/70">{t("loyalty", "holdNote")}</p>
        </div>
      </section>
      <section className="py-[clamp(48px,7vw,96px)] text-center">
        <div className="wrap"><SplitHeading text={t("loyalty", "joinH")} lang={lang} className="mx-auto text-[clamp(30px,4vw,56px)]" /><p className="mx-auto mt-4 max-w-[48ch] text-charcoal">{t("loyalty", "joinP")}</p><div className="mt-8"><Magnetic><Button asChild><Link href="/loyalty/join">{t("loyalty", "join")}</Link></Button></Magnetic></div></div>
      </section>
    </>
  );
}
