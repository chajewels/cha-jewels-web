import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getProductBySlug, primaryImage } from "@/lib/queries/products";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
import { PriceBlock } from "@/components/commerce/price-block";
import { KaratBadge } from "@/components/catalog/karat-badge";
import { ConditionBadge } from "@/components/catalog/condition-badge";
import { metalLabel, normalizeMetal } from "@/lib/metals";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { JsonLd } from "@/components/site/json-ld";
export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const img = primaryImage(p);
  return { title: p.name, description: p.description_ja ?? p.description_en ?? undefined, openGraph: img ? { images: [img.url] } : undefined };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const [p, lang, fx] = await Promise.all([getProductBySlug((await params).slug), getLang(), hub.fx().catch(() => ({ jpy_php: 0.39, as_of: "" }))]);
  if (!p) notFound();
  const t = tr(lang);
  const variant = p.product_variants[0];
  const price = variant?.price_jpy;
  const img = primaryImage(p);
  const desc = lang === "ja" ? p.description_ja ?? p.description_en : p.description_en ?? p.description_ja;
  return (
    <>
      <JsonLd type="product" product={p} />
      <section className="py-[clamp(40px,6vw,80px)]">
        <div className="wrap grid gap-10 md:grid-cols-2">
          <figure className="border border-gold bg-velvet-deep p-1.5">
            <div className="relative aspect-[4/5] overflow-hidden bg-velvet-deep">{img ? <Image src={img.url} alt={img.alt ?? p.name} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" priority /> : null}</div>
            <dl className="grid grid-cols-3 border-t border-gold bg-velvet-deep">
              <div className="border-r border-rule p-4"><dt className="text-xs text-champagne/55">{t("product", "metal")}</dt><dd className="font-display text-2xl text-gold-pale">{metalLabel(normalizeMetal(p.karat), lang)}</dd></div>
              <div className="border-r border-rule p-4"><dt className="text-xs text-champagne/55">{t("product", "weight")}</dt><dd className="font-display text-2xl text-gold-pale">{p.weight_g ? `${p.weight_g} g` : "—"}</dd></div>
              <div className="p-4"><dt className="text-xs text-champagne/55">{t("product", "stone")}</dt><dd className="font-display text-2xl text-gold-pale">{variant?.stone ?? "—"}</dd></div>
            </dl>
          </figure>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <KaratBadge karat={p.karat} lang={lang} />
              <ConditionBadge condition={p.condition} lang={lang} />
            </div>
            <h1 className="mt-4 text-[clamp(32px,4.2vw,60px)]">{p.name}</h1>
            {price != null && <PriceBlock price={price} lang={lang} className="mt-6" />}
            {desc && <p className="mt-6 max-w-[52ch] text-champagne/80">{desc}</p>}
            <p className="mt-4 text-sm text-champagne/60">SKU {p.sku}{variant?.stock_qty === 0 ? ` · ${t("product", "reserved")}` : ""}</p>
            {/* Full-price purchase. The layaway button waits for step 4; until
                then the calculator below is informational only. */}
            {variant && <AddToCart variantId={variant.id} slug={p.slug} stockQty={variant.stock_qty} lang={lang} className="mt-6" />}
            {price != null && <LayawayCalculator lang={lang} initialPrice={price} phpRate={fx.jpy_php} phpRateAsOf={fx.as_of} className="mt-8" />}
          </div>
        </div>
      </section>
    </>
  );
}
