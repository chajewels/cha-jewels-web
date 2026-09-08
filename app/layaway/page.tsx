import type { Metadata } from "next";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { getRegion } from "@/lib/region";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
export const metadata: Metadata = { title: "分割予約 / Layaway" };
export default async function LayawayPage() {
  const [region, lang] = await Promise.all([getRegion(), getLang()]);
  const t = tr(lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap grid gap-12 md:grid-cols-2">
        <div><h1 className="text-[clamp(36px,5.5vw,80px)]">{t("home", "layH")}</h1><p className="mt-5 max-w-[52ch] text-champagne/80">{t("home", "layP")}</p></div>
        <LayawayCalculator region={region} lang={lang} />
      </div>
    </section>
  );
}
