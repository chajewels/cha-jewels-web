import Image from "next/image";
import { HeroVideo } from "@/components/site/hero-video";
import Link from "next/link";
import { getCollections, getFeaturedProducts } from "@/lib/queries/products";
import { tr } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { collectionDescription, collectionName } from "@/lib/catalog-i18n";
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
  const layaway = layawayOffered(lang);
  const values = [
    { title: t("home", "valueTimelessH"), body: t("home", "valueTimelessP") },
    { title: t("home", "valueWorthH"), body: t("home", "valueWorthP") },
    { title: t("home", "valueCraftH"), body: t("home", "valueCraftP") },
    { title: t("home", "valueQualityH"), body: t("home", "valueQualityP") },
  ];
  return (
    <>
      <JsonLd type="store" />
      <section className="pomelli-hero border-b border-rule-soft">
        <HeroVideo playLabel={t("hero", "videoPlay")} pauseLabel={t("hero", "videoPause")} />
        <div className="pomelli-hero__content wrap">
          <h1 className="pomelli-hero__headline">
            <span>{t("hero", "h1a")}</span><br />
            <em className={lang === "ja" ? "not-italic" : ""}>{t("hero", "h1b")}</em>
          </h1>
          <div className="pomelli-ornament" aria-hidden="true"><span /></div>
          <div className="pomelli-hero__lede">
            <p>{t("hero", "lede")}</p>
            <p>{t("hero", "lede2")}</p>
          </div>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild className="border-[#FFA500] bg-[#FFA500] text-[#333333] hover:bg-[#ffb733]"><Link href="/collections">{t("hero", "cta1")}</Link></Button>
            {layaway && <Button asChild variant="ghost" className="border-white/70 text-white hover:border-white"><Link href="/layaway">{t("hero", "cta2")}</Link></Button>}
          </div>
        </div>
      </section>

      <section className="pomelli-values border-b border-rule-soft">
        <div className="pomelli-values__grid wrap">
          <div className="pomelli-values__image">
            <Image
              src="/images/home/pomelli-values.webp"
              alt={t("home", "valuesImageAlt")}
              fill
              sizes="(max-width: 767px) 100vw, 46vw"
              className="object-cover"
            />
          </div>
          <div className="pomelli-values__content">
            <p className="pomelli-values__eyebrow">{t("home", "valuesEyebrow")}</p>
            <h2>{t("home", "valuesH")}</h2>
            <p className="pomelli-values__intro">{t("home", "valuesP")}</p>
            <div className="pomelli-values__list">
              {values.map((value, index) => (
                <article key={value.title} className="pomelli-value">
                  <span className="pomelli-value__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{value.title}</h3>
                    <p>{value.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pomelli-collections border-b border-rule-soft">
        <div className="wrap relative z-[1]">
          <div className="pomelli-collections__heading">
            <h2>{t("home", "colsH")}</h2>
            <div className="pomelli-ornament" aria-hidden="true"><span /></div>
            <p>{t("home", "colsP")}</p>
          </div>
          <div className="pomelli-collections__grid mt-12 grid grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.slug}`} className="pomelli-collection-card min-h-[220px] p-6">
                <h3>{collectionName(c, lang)}</h3>
                {collectionDescription(c, lang) && <p>{collectionDescription(c, lang)}</p>}
              </Link>
            ))}
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
      {/* Layaway is English-only (owner decision 2026-09-15). The section and the
          calculator go together — a calculator with no explanation is worse
          than neither. See lib/layaway-availability. */}
      {layaway && (
        <section id="layaway" className="border-b border-rule-soft py-[clamp(64px,9vw,120px)]">
          <div className="wrap grid gap-12 md:grid-cols-2">
            <div><h2 className="max-w-[20ch] text-[clamp(32px,4.4vw,60px)]">{t("home", "layH")}</h2><p className="mt-4 max-w-[46ch] text-chalk/75">{t("home", "layP")}</p></div>
            <LayawayCalculator lang={lang} phpRate={fx.jpy_php} />
          </div>
        </section>
      )}
    </>
  );
}
