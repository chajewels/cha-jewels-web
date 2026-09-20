import Image from "next/image";
import Link from "next/link";
import { fromPrice, primaryImage } from "@/lib/queries/products";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { metalsLabel, productMetals } from "@/lib/metals";
import { productName } from "@/lib/catalog-i18n";
import { tr, type Lang } from "@/lib/i18n";
import { OriginBadge } from "@/components/catalog/origin-badge";

/** next/image cannot optimise SVG or data URLs (fixtures use both). */
const passthrough = (url: string) => url.startsWith("data:") || /\.svg(\?|$)/i.test(url);

/**
 * New arrivals card (Stitch §10). Hub data only: image, name, metals chip,
 * weight, price. Origin is rendered by OriginBadge alone, from product data.
 */
export function ArrivalCard({ product, lang }: { product: Product; lang: Lang }) {
  const t = tr(lang);
  const name = productName(product, lang);
  const img = primaryImage(product);
  const price = fromPrice(product);
  const metal = metalsLabel(productMetals(product), lang);
  const meta = [metal, product.weight_g ? `${product.weight_g} g` : null].filter(Boolean).join(" · ");
  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col overflow-hidden rounded-sm border border-hairline bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-chalk">
        {img && <Image src={img.url} alt={img.alt ?? name} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized={passthrough(img.url)} />}
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-sm bg-chalk/90 px-1.5 py-0.5 text-[10px] tracking-tight text-charcoal backdrop-blur-sm">
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-teal" />{t("home", "trust1H")}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-1.5 p-2.5 lg:p-4">
        <div>
          {meta && <span className="block text-[10px] text-charcoal/70 lg:text-xs">{meta}</span>}
          <h3 className="truncate font-display text-base text-charcoal lg:text-lg">{name}</h3>
          <div className="mt-1 flex flex-wrap gap-1"><OriginBadge origin={product.origin} brand={product.brand} lang={lang} /></div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-charcoal">{price != null ? formatMoney(price) : t("home", "phPrice")}</span>
          <span className="text-[11px] font-semibold text-gold-dark group-hover:translate-x-0.5">{t("home", "newDetail")} ›</span>
        </div>
      </div>
    </Link>
  );
}

/** Fills the grid to four when the Hub returns fewer (Stitch §10 placeholder). */
export function ArrivalPlaceholder({ lang }: { lang: Lang }) {
  const t = tr(lang);
  return (
    <div aria-hidden="true" className="flex flex-col overflow-hidden rounded-sm border border-dashed border-charcoal/25 bg-white">
      <div className="grid aspect-square place-items-center bg-chalk"><span className="h-16 w-16 rounded-full border-2 border-dashed border-charcoal/30" /></div>
      <div className="flex flex-1 flex-col justify-between gap-1.5 p-2.5 lg:p-4">
        <div><span className="block text-[10px] text-charcoal/50 lg:text-xs">{t("home", "phMeta")}</span><p className="font-display text-base text-charcoal/50 lg:text-lg">{t("home", "phName")}</p></div>
        <span className="text-base font-bold text-charcoal/50">{t("home", "phPrice")}</span>
      </div>
    </div>
  );
}
