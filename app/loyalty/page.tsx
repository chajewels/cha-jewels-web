import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { tiers } from "@/lib/loyalty";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
export const metadata: Metadata = { title: "会員プログラム / Loyalty" };
export default async function LoyaltyPage() {
  const lang = await getLang();
  const t = tr(lang);
  return (
    <>
      <section className="border-b border-rule-soft py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <h1 className="max-w-[18ch] text-[clamp(36px,5.5vw,80px)]">{t("loyalty", "h1")}</h1>
          <p className="mt-5 max-w-[58ch] text-champagne/80">{t("loyalty", "lede")}</p>
          <div className="mt-8"><Button asChild><Link href="/loyalty/join">{t("loyalty", "join")}</Link></Button></div>
        </div>
      </section>
      <section className="border-b border-rule-soft py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <h2 className="max-w-[20ch] text-[clamp(30px,4vw,56px)]">{t("loyalty", "levelsH")}</h2>
          <p className="mt-4 max-w-[58ch] text-champagne/75">{t("loyalty", "levelsP")}</p>
          <ol className="rule-grid mt-12 grid sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier, i) => (
              <li key={tier.slug} className="flex flex-col bg-velvet p-6">
                <span className="text-xs text-champagne/55">Level {i + 1}</span>
                <h3 className="mt-1 text-[28px] text-gold-pale">{tier.name}</h3>
                <div className="my-4 h-0.5 bg-[linear-gradient(90deg,#8A6B12,#E8D28A)]" style={{ width: `${25 + i * 25}%` }} />
                <p className="text-xs text-champagne/55">{t("loyalty", "threshold")}</p>
                <p className="font-display text-2xl text-champagne">{tier.thresholdJpy === 0 ? (lang === "ja" ? "入会時" : "On joining") : `${formatMoney(tier.thresholdJpy, "JP")}+`}</p>
                <p className="mt-4 text-xs text-champagne/55">{t("loyalty", "perks")}</p>
                <ul className="mt-1 space-y-1.5 text-sm text-champagne/80">{tier.perks[lang].map((p) => <li key={p} className="relative pl-4 before:absolute before:left-0 before:top-2.5 before:h-px before:w-2 before:bg-gold">{p}</li>)}</ul>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="py-[clamp(48px,7vw,96px)] text-center">
        <div className="wrap"><h2 className="mx-auto text-[clamp(30px,4vw,56px)]">{t("loyalty", "joinH")}</h2><p className="mx-auto mt-4 max-w-[48ch] text-champagne/75">{t("loyalty", "joinP")}</p><div className="mt-8"><Button asChild><Link href="/loyalty/join">{t("loyalty", "join")}</Link></Button></div></div>
      </section>
    </>
  );
}
