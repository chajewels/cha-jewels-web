import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allImages, getProductBySlug, primaryImage } from "@/lib/queries/products";
import { tr } from "@/lib/i18n";
import { productDescription, productName } from "@/lib/catalog-i18n";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
import { PriceBlock } from "@/components/commerce/price-block";
import { KaratBadge } from "@/components/catalog/karat-badge";
import { ConditionBadge } from "@/components/catalog/condition-badge";
import { OriginBadge } from "@/components/catalog/origin-badge";
import { metalsLabel, productMetals } from "@/lib/metals";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { layawayOffered } from "@/lib/layaway-availability";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { ReserveWithLayaway } from "@/components/commerce/reserve-with-layaway";
import { JsonLd } from "@/components/site/json-ld";
import { ProductView } from "@/components/analytics/product-view";
export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [p, lang] = await Promise.all([getProductBySlug((await params).slug), getLang()]);
  if (!p) return {};
  const img = primaryImage(p);
  return { title: productName(p, lang), description: productDescription(p, lang) ?? undefined, openGraph: img ? { images: [img.url] } : undefined };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const [p, lang, fx] = await Promise.all([getProductBySlug((await params).slug), getLang(), hub.fx().catch(() => ({ jpy_php: 0.39, as_of: "" }))]);
  if (!p) notFound();
  const t = tr(lang);
  const layaway = layawayOffered(lang);
  const variant = p.product_variants[0];
  const price = variant?.price_jpy;
  const images = allImages(p).map((m) => ({ url: m.url, alt: m.alt }));
  const metals = productMetals(p);
  const name = productName(p, lang);
  const desc = productDescription(p, lang);
  return (
    <>
      <JsonLd type="product" product={p} />
      <ProductView sku={p.sku} lang={lang} />
      <section className="surface-light bg-chalk text-charcoal-deep py-[clamp(40px,6vw,80px)]">
        <div className="wrap grid gap-10 md:grid-cols-2">
          <figure className="border border-gold-dark bg-white p-1.5">
            <ProductGallery images={images} name={name} lang={lang} />
            <dl className="grid grid-cols-3 border-t border-hairline bg-white">
              <div className="border-r border-hairline p-4"><dt className="text-xs text-charcoal/70">{t("product", "metal")}</dt><dd className="font-display text-2xl text-gold-dark">{metalsLabel(metals, lang)}</dd></div>
              <div className="border-r border-hairline p-4"><dt className="text-xs text-charcoal/70">{t("product", "weight")}</dt><dd className="font-display text-2xl text-gold-dark">{p.weight_g ? `${p.weight_g} g` : "—"}</dd></div>
              <div className="p-4"><dt className="text-xs text-charcoal/70">{t("product", "stone")}</dt><dd className="font-display text-2xl text-gold-dark">{variant?.stone ?? "—"}</dd></div>
            </dl>
          </figure>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <KaratBadge metals={metals} lang={lang} />
              <OriginBadge origin={p.origin} brand={p.brand} lang={lang} />
              <ConditionBadge condition={p.condition} lang={lang} />
            </div>
            <h1 className="mt-4 text-[clamp(32px,4.2vw,60px)]">{name}</h1>
            {price != null && <PriceBlock price={price} lang={lang} className="mt-6" />}
            {desc && <p className="mt-6 max-w-[52ch] text-charcoal">{desc}</p>}
            <p className="mt-4 text-sm text-charcoal/70">SKU {p.sku}{variant?.stock_qty === 0 ? ` · ${t("product", "reserved")}` : ""}</p>
            {/* Two ways to buy the same piece, one basket — but only where
                layaway is offered (English only, owner decision 2026-09-15).
                On ja the piece is cash-only, so Reserve and the calculator both
                go: a calculator for a plan the shopper cannot start is a
                promise the checkout would refuse. See lib/layaway-availability. */}
            {variant && <AddToCart variantId={variant.id} slug={p.slug} sku={p.sku} stockQty={variant.stock_qty} lang={lang} className="mt-6" />}
            {layaway && variant && <ReserveWithLayaway variantId={variant.id} slug={p.slug} sku={p.sku} stockQty={variant.stock_qty} lang={lang} className="mt-3" />}
            {layaway && price != null && <LayawayCalculator lang={lang} initialPrice={price} phpRate={fx.jpy_php} tone="light" className="mt-8" />}
          </div>
        </div>
      </section>
    </>
  );
}
