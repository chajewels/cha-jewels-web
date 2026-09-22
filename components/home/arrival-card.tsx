import Image from "next/image";
import Link from "next/link";
import { fromPrice, primaryImage } from "@/lib/queries/products";
import type { Product } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { metalsLabel, productMetals } from "@/lib/metals";
import { productName } from "@/lib/catalog-i18n";
import { tr, type Lang } from "@/lib/i18n";
import { OriginBadge } from "@/components/catalog/origin-badge";

/**
 * MAY THIS PIECE GO IN THE DECK? It needs a photo, a name and a price.
 *
 * The section used to guarantee four cards by padding with dashed boxes
 * captioned "Product name / K18 · 0.00g / ¥—", and ArrivalCard itself printed
 * that same "¥—" for a real piece whose price was missing. So the homepage's
 * shop window showed furniture, and a shopper could click a card that named no
 * price and reached a page that did. A shop window with two pieces in it is
 * honest; one with two pieces and two empty frames is not.
 */
export const isShowableArrival = (product: Product): boolean =>
  !!primaryImage(product) && !!productName(product, "en").trim() && fromPrice(product) != null;

/** next/image cannot optimise SVG or data URLs (fixtures use both). */
const passthrough = (url: string) => url.startsWith("data:") || /\.svg(\?|$)/i.test(url);

/**
 * New arrivals card (Stitch §10). Hub data only: image, name, metals chip,
 * weight, price. Origin is rendered by OriginBadge alone, from product data.
 *
 * ONLY EVER RENDERED FOR A PIECE THAT HAS ALL THREE — image, name and price.
 * `isShowableArrival` is the gate and app/page.tsx applies it, so this card
 * does not need a "no price" branch any more. It had one, and it printed the
 * placeholder's "¥—" over a real product page link: a shopper clicked a piece
 * whose price the card could not state.
 */
export function ArrivalCard({ product, lang }: { product: Product; lang: Lang }) {
  const t = tr(lang);
  const name = productName(product, lang);
  // Non-null by construction: app/page.tsx filters with isShowableArrival.
  const img = primaryImage(product)!;
  const price = fromPrice(product)!;
  const metal = metalsLabel(productMetals(product), lang);
  const meta = [metal, product.weight_g ? `${product.weight_g} g` : null].filter(Boolean).join(" · ");
  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col overflow-hidden rounded-sm border border-hairline bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-chalk">
        <Image src={img.url} alt={img.alt ?? name} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized={passthrough(img.url)} />
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
          <span className="text-base font-bold text-charcoal">{formatMoney(price)}</span>
          <span className="text-[11px] font-semibold text-gold-dark group-hover:translate-x-0.5">{t("home", "newDetail")} ›</span>
        </div>
      </div>
    </Link>
  );
}
