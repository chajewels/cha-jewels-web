import { pageMeta } from "@/lib/page-meta";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
export const generateMetadata = () => pageMeta("layaway");
export default async function LayawayPage() {
  const [lang, fx] = await Promise.all([getLang(), hub.fx().catch(() => ({ jpy_php: 0.39, as_of: "" }))]);
  const t = tr(lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap grid gap-12 md:grid-cols-2">
        <div><h1 className="text-[clamp(36px,5.5vw,80px)]">{t("home", "layH")}</h1><p className="mt-5 max-w-[52ch] text-champagne/80">{t("home", "layP")}</p></div>
        <LayawayCalculator lang={lang} phpRate={fx.jpy_php} phpRateAsOf={fx.as_of} />
      </div>
    </section>
  );
}
