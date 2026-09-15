import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCollectionWithProducts, getCollections } from "@/lib/queries/products";
import { tr } from "@/lib/i18n";
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

const FILTERS = [
  { key: "all", label: "filterAll" },
  { key: "new", label: "filterNew" },
  { key: "preloved", label: "filterPreloved" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];
const asFilter = (v: string | string[] | undefined): FilterKey => (v === "new" || v === "preloved" ? v : "all");

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ condition?: string | string[] }>;
}) {
  const [col, lang, sp] = await Promise.all([
    getCollectionWithProducts((await params).slug),
    getLang(),
    searchParams,
  ]);
  if (!col) notFound();
  const t = tr(lang);
  const active = asFilter(sp.condition);
  // Filtering happens here, on the server — no client JS. Reading searchParams
  // makes the RENDER per-request, but the product data is still the ISR/tag-cached
  // Hub fetch, so this adds no extra API traffic.
  const products = col.products.filter((p) =>
    active === "all" ? true : active === "preloved" ? p.condition === "Preloved" : p.condition !== "Preloved",
  );
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <h1 className="text-[clamp(40px,6vw,88px)]">{collectionName(col, lang)}</h1>
        {collectionDescription(col, lang) && <p className="mt-4 max-w-[58ch] text-champagne/75">{collectionDescription(col, lang)}</p>}
        <nav aria-label={t("collection", "filterLabel")} className="mt-8 flex flex-wrap gap-2 text-sm">
          {FILTERS.map((f) => {
            const on = f.key === active;
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? `/collections/${col.slug}` : `/collections/${col.slug}?condition=${f.key}`}
                aria-current={on ? "page" : undefined}
                className={`border px-4 py-2 ${on ? "border-gold text-gold-pale" : "border-rule text-champagne/70 hover:text-gold-pale"}`}
              >
                {t("collection", f.label)}
              </Link>
            );
          })}
        </nav>
        {products.length === 0 ? (
          <p className="mt-12 border border-rule p-6 text-champagne/75">
            {t("collection", active === "all" ? "empty" : "emptyFiltered")}
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
