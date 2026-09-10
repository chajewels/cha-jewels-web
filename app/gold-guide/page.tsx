import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { guideSections } from "@/lib/content/gold-guide";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "ゴールドの基礎知識 / Gold guide",
  description: "What K18 means, how to read a hallmark, and how to care for gold and pearls.",
};

export default async function GoldGuidePage() {
  const lang = await getLang();
  const t = tr(lang);
  return (
    <>
      <section className="border-b border-rule-soft py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <h1 className="max-w-[18ch] text-[clamp(36px,5.5vw,80px)]">{t("gold", "h1")}</h1>
          <p className="mt-5 max-w-[58ch] text-champagne/80">{t("gold", "lede")}</p>
        </div>
      </section>
      {guideSections.map((sec) => (
        <section key={sec.h.en} className="border-b border-rule-soft py-[clamp(40px,6vw,80px)]">
          <div className="wrap">
            <h2 className="text-[clamp(28px,3.6vw,48px)]">{sec.h[lang]}</h2>
            <p className="mt-4 max-w-[62ch] text-champagne/80">{sec.body[lang]}</p>
            <dl className="rule-grid mt-8 grid sm:grid-cols-3">
              {sec.facts.map((f) => (
                <div key={f.k.en} className="bg-velvet p-5">
                  <dt className="text-xs text-champagne/55">{f.k[lang]}</dt>
                  <dd className="mt-1 font-display text-xl text-gold-pale">{f.v[lang]}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ))}
      <section className="py-[clamp(48px,7vw,96px)] text-center">
        <div className="wrap">
          <Button asChild><Link href="/collections">{t("gold", "cta")}</Link></Button>
        </div>
      </section>
    </>
  );
}
