import Link from "next/link";
import Image from "next/image";
import { fromPrice, primaryImage, type Product } from "@/lib/queries/products";
import { formatMoney } from "@/lib/utils";
import { metalsLabel, productMetals } from "@/lib/metals";
import { tr, type Lang } from "@/lib/i18n";
import { productName } from "@/lib/catalog-i18n";
import { ConditionBadge } from "@/components/catalog/condition-badge";
export function ProductCard({ product, lang, featured = false }: { product: Product; lang: Lang; featured?: boolean }) {
  const t = tr(lang);
  const price = fromPrice(product);
  const metal = metalsLabel(productMetals(product), lang);
  const img = primaryImage(product);
  const v = product.product_variants[0];
  const name = productName(product, lang);
  return (
    <Link href={`/products/${product.slug}`} className={`flex flex-col bg-velvet ${featured ? "border border-gold p-1.5" : ""}`}>
      <div className={`relative overflow-hidden bg-velvet-deep ${featured ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
        {img ? <Image src={img.url} alt={img.alt ?? name} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" /> : <GoldMotif />}
      </div>
      {featured && v && (
        <dl className="grid grid-cols-3 border-t border-gold bg-velvet-deep">
          <Spec k={t("product", "metal")} v={metal} /><Spec k={t("product", "weight")} v={product.weight_g ? `${product.weight_g} g` : "—"} /><Spec k={t("product", "stone")} v={v.stone ?? "—"} last />
        </dl>
      )}
      <div className="flex flex-1 flex-col p-5">
        {product.condition === "Preloved" && <div className="mb-2"><ConditionBadge condition={product.condition} lang={lang} /></div>}
        <h3 className="font-display text-2xl text-gold-pale">{name}</h3>
        {product.weight_g && <p className="mt-1 text-sm text-champagne/60">{metal} · {product.weight_g} g</p>}
        {price != null && <p className="mt-auto pt-4 text-sm text-champagne/75">{formatMoney(price)}<span className="text-champagne/55"> · {t("product", "reserveFrom")} {formatMoney(Math.round(price * 0.3))}</span></p>}
      </div>
    </Link>
  );
}
function Spec({ k, v, last = false }: { k: string; v: string; last?: boolean }) {
  return <div className={`p-3 ${last ? "" : "border-r border-rule"}`}><dt className="text-[11px] text-champagne/55">{k}</dt><dd className="font-display text-xl text-gold-pale">{v}</dd></div>;
}
function GoldMotif() {
  return <svg viewBox="0 0 200 200" fill="none" stroke="#C9A227" strokeWidth="1" aria-hidden="true" className="absolute inset-0 m-auto h-[46%] w-[46%] opacity-55"><circle cx="100" cy="100" r="62" /><circle cx="100" cy="100" r="54" strokeOpacity=".5" /><path d="M100 30 L108 44 L100 52 L92 44 Z" strokeWidth="1.2" /></svg>;
}
