import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollectionWithProducts, getCollections } from "@/lib/queries/products";
import { getRegion } from "@/lib/region";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { ProductCard } from "@/components/catalog/product-card";
export const revalidate = 60;
// Pre-render known collections when the Hub is reachable; otherwise build with none and render on demand.
export async function generateStaticParams() { try { return (await getCollections()).map((c) => ({ slug: c.slug })); } catch { return []; } }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const col = await getCollectionWithProducts((await params).slug);
  return col ? { title: col.name, description: col.description ?? undefined } : {};
}
export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const [col, region, lang] = await Promise.all([getCollectionWithProducts((await params).slug), getRegion(), getLang()]);
  if (!col) notFound();
  const t = tr(lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <h1 className="text-[clamp(40px,6vw,88px)]">{col.name}</h1>
        {col.description && <p className="mt-4 max-w-[58ch] text-champagne/75">{col.description}</p>}
        {col.products.length === 0 ? <p className="mt-12 border border-rule p-6 text-champagne/75">{t("collection", "empty")}</p>
          : <div className="rule-grid mt-12 grid grid-cols-2 lg:grid-cols-4">{col.products.map((p) => <ProductCard key={p.id} product={p} region={region} lang={lang} />)}</div>}
      </div>
    </section>
  );
}
