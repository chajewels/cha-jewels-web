import Link from "next/link";
import { getCollections, getFeaturedProducts } from "@/lib/queries/products";
import { tr } from "@/lib/i18n";
import { CollectionCard } from "@/components/catalog/collection-card";
import { ShowroomDepth } from "@/components/site/showroom-depth";
import { showroomCopy } from "@/lib/i18n-showroom";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
import { ProductCard } from "@/components/catalog/product-card";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/site/json-ld";
export const revalidate = 60;

export default async function Home() {
  const [lang, collections, featured, fx] = await Promise.all([getLang(), getCollections().catch(() => []), getFeaturedProducts(8).catch(() => []), hub.fx().catch(() => ({ jpy_php: 0.39, as_of: "" }))]);
  const t = tr(lang);
  return (
    <>
      <JsonLd type="store" />
      <section className="showroom-hero border-b border-rule-soft py-[clamp(40px,6vw,88px)]">
        <div className="wrap grid items-center gap-12 md:grid-cols-2">
          <div className="showroom-intro">
            <p className="mb-6 text-xs tracking-[0.2em] text-gold-pale">{showroomCopy[lang].eyebrow}</p>
            <h1 className="text-[clamp(40px,6.4vw,96px)]"><span className="gilt">{t("hero", "h1a")}</span><br /><em className={lang === "ja" ? "not-italic" : ""}>{t("hero", "h1b")}</em></h1>
            <p className="mt-7 max-w-[50ch] text-[clamp(16px,1.3vw,19px)] text-champagne/85">{t("hero", "lede")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild><Link href="/collections">{t("hero", "cta1")}</Link></Button>
              <Button asChild variant="ghost"><Link href="/layaway">{t("hero", "cta2")}</Link></Button>
            </div>
          </div>
          {featured[0] && <ShowroomDepth><ProductCard product={featured[0]} lang={lang} featured /></ShowroomDepth>}
        </div>
      </section>
      <section className="border-b border-rule-soft py-[clamp(64px,9vw,120px)]">
        <div className="wrap">
          <h2 className="max-w-[20ch] text-[clamp(32px,4.4vw,60px)]">{t("home", "colsH")}</h2>
          <p className="mt-4 max-w-[58ch] text-champagne/75">{t("home", "colsP")}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => <CollectionCard key={c.id} collection={c} lang={lang} />)}
          </div>
        </div>
      </section>
      <section className="border-b border-rule-soft py-[clamp(64px,9vw,120px)]">
        <div className="wrap">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-[20ch] text-[clamp(32px,4.4vw,60px)]">{t("home", "newH")}</h2>
            <Link className="text-gold-pale underline underline-offset-4" href="/collections">{t("home", "viewAll")}</Link>
          </div>
          <div className="rule-grid grid grid-cols-2 lg:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} product={p} lang={lang} />)}</div>
        </div>
      </section>
      <section id="layaway" className="border-b border-rule-soft py-[clamp(64px,9vw,120px)]">
        <div className="wrap grid gap-12 md:grid-cols-2">
          <div><h2 className="max-w-[20ch] text-[clamp(32px,4.4vw,60px)]">{t("home", "layH")}</h2><p className="mt-4 max-w-[46ch] text-champagne/75">{t("home", "layP")}</p></div>
          <LayawayCalculator lang={lang} phpRate={fx.jpy_php} phpRateAsOf={fx.as_of} />
        </div>
      </section>
    </>
  );
}
