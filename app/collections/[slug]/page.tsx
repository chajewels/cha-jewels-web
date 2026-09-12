import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCollectionWithProducts, getCollections } from "@/lib/queries/products";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { readFilters, filterProducts, type CatalogParams } from "@/lib/catalog-filters";
import { showroomCopy } from "@/lib/i18n-showroom";
import { collectionDescription, collectionName } from "@/lib/catalog-i18n";
import { getLang } from "@/lib/i18n-server";
import { ProductCard } from "@/components/catalog/product-card";
export const revalidate = 60;
// Pre-render known collections when the Hub is reachable; otherwise build with none and render on demand.
export async function generateStaticParams() { try { return (await getCollections()).map((c) => ({ slug: c.slug })); } catch { return []; } }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [col, lang] = await Promise.all([getCollectionWithProducts((await params).slug), getLang()]);
  return col ? { title: collectionName(col, lang), description: collectionDescription(col, lang) ?? undefined } : {};
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogParams>;
}) {
  const [col, lang, sp] = await Promise.all([
    getCollectionWithProducts((await params).slug),
    getLang(),
    searchParams,
  ]);
  if (!col) notFound();
  const c = showroomCopy[lang];
  const filters = readFilters(sp);
  const products = filterProducts(col.products, filters, lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <h1 className="text-[clamp(40px,6vw,88px)]">{collectionName(col, lang)}</h1>
        {collectionDescription(col, lang) && <p className="mt-4 max-w-[58ch] text-champagne/75">{collectionDescription(col, lang)}</p>}
        <CatalogFilters key={JSON.stringify(filters)} products={col.products} filters={filters} slug={col.slug} lang={lang} />
        <p className="mt-6 text-sm text-champagne/75">{c.results.replace("{count}", String(products.length)).replace("{total}", String(col.products.length))}</p>
        {products.length === 0 ? (
          <p className="mt-12 border border-rule p-6 text-champagne/75">
            {c.empty} <Link href={`/collections/${col.slug}`} className="text-gold-pale underline">{c.reset}</Link>
          </p>
        ) : (
          <div className="rule-grid mt-12 grid grid-cols-2 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} lang={lang} />)}
          </div>
        )}
      </div>
    </section>
  );
}
