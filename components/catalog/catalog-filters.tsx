import Link from "next/link";
import type { Product } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import type { CatalogFilters as Filters } from "@/lib/catalog-filters";
import { metalLabel, productMetals } from "@/lib/metals";
import { showroomCopy } from "@/lib/i18n-showroom";
import { Button } from "@/components/ui/button";

export function CatalogFilters({ products, filters, slug, lang }: { products: Product[]; filters: Filters; slug: string; lang: Lang }) {
  const c = showroomCopy[lang];
  const unique = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
  const metals = unique(products.flatMap(productMetals));
  const stones = unique(products.flatMap(p => p.product_variants.map(v => v.stone)));
  const sizes = unique(products.flatMap(p => p.product_variants.map(v => v.size)));
  const field = "min-h-12 w-full min-w-0 rounded-sm border border-rule bg-velvet px-3 text-base text-champagne";
  return <form action={`/collections/${slug}`} method="get" className="mt-8 border border-rule bg-velvet-deep p-5 sm:p-6">
    <fieldset>
      <legend className="mb-5 font-display text-2xl text-gold-pale">{c.filters}</legend>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <label className="col-span-2 grid gap-2 text-sm lg:col-span-1">{c.search}<input type="search" name="q" defaultValue={filters.q} maxLength={160} placeholder={c.searchPlaceholder} className={field} /></label>
        <label className="grid gap-2 text-sm">{c.budget}<input type="number" name="maxPrice" min={0} step={1} inputMode="numeric" defaultValue={filters.maxPrice ?? ""} className={field} /></label>
        <label className="grid gap-2 text-sm">{c.metal}<select name="metal" defaultValue={filters.metal} className={field}><option value="">{c.any}</option>{metals.map(m => <option key={m} value={m}>{metalLabel(m, lang)}</option>)}</select></label>
        <label className="grid gap-2 text-sm">{c.condition}<select name="condition" defaultValue={filters.condition} className={field}><option value="">{c.all}</option><option value="new">{c.new}</option><option value="preloved">{c.preloved}</option></select></label>
        {stones.length > 0 && <label className="grid gap-2 text-sm">{c.stone}<select name="stone" defaultValue={filters.stone} className={field}><option value="">{c.any}</option>{stones.map(s => <option key={s}>{s}</option>)}</select></label>}
        {sizes.length > 0 && <label className="grid gap-2 text-sm">{c.size}<select name="size" defaultValue={filters.size} className={field}><option value="">{c.any}</option>{sizes.map(s => <option key={s}>{s}</option>)}</select></label>}
        <label className="grid gap-2 text-sm">{c.availability}<select name="stock" defaultValue={filters.stock ? "available" : ""} className={field}><option value="">{c.all}</option><option value="available">{c.inStock}</option></select></label>
        <label className="grid gap-2 text-sm">{c.sort}<select name="sort" defaultValue={filters.sort} className={field}><option value="">{c.recommended}</option><option value="price-asc">{c.priceLow}</option><option value="price-desc">{c.priceHigh}</option></select></label>
      </div>
    </fieldset>
    <div className="mt-5 flex flex-wrap items-center gap-4"><Button type="submit">{c.apply}</Button><Link href={`/collections/${slug}`} className="inline-flex min-h-12 items-center text-sm text-gold-pale underline underline-offset-4">{c.reset}</Link></div>
  </form>;
}
