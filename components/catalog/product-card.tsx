import Link from "next/link";
import { allImages, fromPrice, type Product } from "@/lib/queries/products";
import { CardFx, CardMedia } from "@/components/fx/card-fx";
import { formatMoney } from "@/lib/utils";
import { metalsLabel, productMetals } from "@/lib/metals";
import { tr, type Lang } from "@/lib/i18n";
import { productName } from "@/lib/catalog-i18n";
import { availabilityKey, isBuyable, productAvailability } from "@/lib/availability";
import { layawayOffered } from "@/lib/layaway-availability";
import { ConditionBadge } from "@/components/catalog/condition-badge";
/**
 * `index` is the card's place in its grid — the entrance runs row by row, left
 * to right (components/fx/card-fx.tsx). The motion wraps the card; the card's
 * content, links and copy are unchanged.
 */
export function ProductCard({ product, lang, featured = false, index = 0 }: { product: Product; lang: Lang; featured?: boolean; index?: number }) {
  const t = tr(lang);
  const price = fromPrice(product);
  const metal = metalsLabel(productMetals(product), lang);
  const [img, second] = allImages(product);
  const v = product.product_variants[0];
  const name = productName(product, lang);
  // The SAME word the product page shows. The card said "Sold out" where the
  // page said "Currently reserved", for one piece and one stock number.
  const avail = productAvailability(product);
  const soldOut = !isBuyable(avail);
  return (
    // Sold: no tilt, and none of the hover or press life either (`quiet`) —
    // the card still opens the piece, but it no longer invites a purchase.
    <CardFx index={index} tilt={!soldOut} quiet={soldOut} className="h-full">
    <Link href={`/products/${product.slug}`} className={`flex h-full flex-col bg-white ${featured ? "border border-gold-dark p-1.5" : ""}`}>
      <div className={`relative overflow-hidden bg-chalk ${featured ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
        {img ? <CardMedia src={img.url} second={soldOut ? null : second?.url} alt={img.alt ?? name} sizes="(min-width:1024px) 25vw, 50vw" dim={soldOut} /> : <GoldMotif />}
        {soldOut && (
          <span className="absolute left-3 top-3 border border-hairline bg-chalk px-2.5 py-1 text-xs tracking-wide text-charcoal/70">
            {t("product", availabilityKey(avail))}
          </span>
        )}
      </div>
      {featured && v && (
        <dl className="grid grid-cols-3 border-t border-hairline bg-white">
          <Spec k={t("product", "metal")} v={metal} /><Spec k={t("product", "weight")} v={product.weight_g ? `${product.weight_g} g` : "—"} /><Spec k={t("product", "stone")} v={v.stone ?? "—"} last />
        </dl>
      )}
      <div className="flex flex-1 flex-col p-5">
        {product.condition === "Preloved" && <div className="mb-2"><ConditionBadge condition={product.condition} lang={lang} /></div>}
        {/* h2, not h3. This card is rendered directly under the page's h1 on
            /categories/[slug] and /collections/[slug], so an h3 skipped a
            level and axe reported heading-order. Pre-existing; caught by the
            audit's accessibility pass rather than by the audit. */}
        <h2 className="font-display text-2xl text-charcoal-deep">{name}</h2>
        {product.weight_g && <p className="mt-1 text-sm text-charcoal/70">{metal} · {product.weight_g} g</p>}
        {price != null && (
          <p className="mt-auto pt-4 text-sm text-charcoal">
            {formatMoney(price)}
            {/* A piece that cannot be bought carries NO "reserve from ¥…"
                invitation. The badge over the photo already says the state, so
                repeating it here beside the price only made the price line the
                third place the same fact was worded differently. Nor does any
                card in a language where layaway is not offered
                (lib/layaway-availability — English only, owner rule). */}
            {isBuyable(avail) && layawayOffered(lang) && (
              <span className="text-charcoal/70"> · {t("product", "reserveFrom")} {formatMoney(Math.round(price * 0.3))}</span>
            )}
          </p>
        )}
      </div>
    </Link>
    </CardFx>
  );
}
function Spec({ k, v, last = false }: { k: string; v: string; last?: boolean }) {
  return <div className={`p-3 ${last ? "" : "border-r border-hairline"}`}><dt className="text-[11px] text-charcoal/70">{k}</dt><dd className="font-display text-xl text-gold-dark">{v}</dd></div>;
}
function GoldMotif() {
  return <svg viewBox="0 0 200 200" fill="none" stroke="#8A6B12" strokeWidth="1" aria-hidden="true" className="absolute inset-0 m-auto h-[46%] w-[46%] opacity-55"><circle cx="100" cy="100" r="62" /><circle cx="100" cy="100" r="54" strokeOpacity=".5" /><path d="M100 30 L108 44 L100 52 L92 44 Z" strokeWidth="1.2" /></svg>;
}
