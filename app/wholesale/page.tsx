import type { Metadata } from "next";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { wholesaleBullets } from "@/lib/content/wholesale";
import { InquiryForm } from "@/components/wholesale/inquiry-form";

export const metadata: Metadata = {
  title: "卸売 / Wholesale",
  description: "K18 gold at trade prices for live sellers, boutiques and family jewelry businesses in Japan and the Philippines.",
};

export default async function WholesalePage() {
  const lang = await getLang();
  const t = tr(lang);
  return (
    <>
      <section className="border-b border-rule-soft py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <h1 className="max-w-[18ch] text-[clamp(36px,5.5vw,80px)]">{t("wholesale", "h1")}</h1>
          <p className="mt-5 max-w-[58ch] text-champagne/80">{t("wholesale", "lede")}</p>
        </div>
      </section>
      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <ul className="space-y-4 text-champagne/80">
            {wholesaleBullets[lang].map((b) => (
              <li key={b} className="relative max-w-[52ch] pl-5 before:absolute before:left-0 before:top-3 before:h-px before:w-3 before:bg-gold">{b}</li>
            ))}
          </ul>
          <div>
            <h2 className="mb-5 font-display text-[clamp(24px,3vw,36px)] text-gold-pale">{t("wholesale", "formH")}</h2>
            <InquiryForm lang={lang} />
          </div>
        </div>
      </section>
    </>
  );
}
