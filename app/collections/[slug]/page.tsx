import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollectionWithProducts, getCollections } from "@/lib/queries/products";
import { tr } from "@/lib/i18n";
import { collectionDescription, collectionName } from "@/lib/catalog-i18n";
import { getLang } from "@/lib/i18n-server";
import { CatalogSection, CollectionHead, EmptyCatalog } from "@/components/catalog/catalog-section";
import { COLLECTION_PLACEHOLDER } from "@/lib/collection-placeholders";
import { catalogue, collectionsWithProducts, isAvailable, stockedCollections } from "@/lib/catalog-context";
import { follow } from "@/lib/settings";
export const revalidate = 60;
// Pre-render known collections when the Hub is reachable; otherwise build with none and render on demand.
export async function generateStaticParams() { try { return (await getCollections()).map((c) => ({ slug: c.slug })); } catch { return []; } }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [col, lang] = await Promise.all([getCollectionWithProducts((await params).slug), getLang()]);
  return col ? { title: collectionName(col, lang), description: collectionDescription(col, lang) ?? undefined } : {};
}

/**
 * A COLLECTION (step 2 build; comp page-comps/product-collection
 * "collection-rings", "collection-empty"). The dark header with the owner's
 * collection photo (the Hub's hero_media, else the bundled collection photo)
 * beside the Hub title and description and the live "n available" count; the
 * sticky toolbar and the grid (CatalogGrid: filters and sort in the browser,
 * over cards rendered here, so the page stays ISR-cached); or, with nothing
 * in it, the way on (EmptyCatalog). Sold pieces show by default (D2-7).
 */
export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const [col, lang] = await Promise.all([getCollectionWithProducts((await params).slug), getLang()]);
  if (!col) notFound();
  const t = tr(lang);
  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);
  const empty = col.products.length === 0;
  const [cols, all] = empty ? await Promise.all([collectionsWithProducts(), catalogue()]) : [[], []];
  return (
    <>
      <CollectionHead
        eyebrow={t("collection", "eyebrow")}
        title={collectionName(col, lang)}
        description={collectionDescription(col, lang)}
        available={col.products.filter(isAvailable).length}
        photo={col.hero_media ?? COLLECTION_PLACEHOLDER[col.slug] ?? null}
        lang={lang}
      />
      {empty
        ? <EmptyCatalog lang={lang} stocked={stockedCollections(cols)} now={all.filter(isAvailable).slice(0, 4)} messenger={messenger} />
        : <CatalogSection products={col.products} lang={lang} messenger={messenger} />}
    </>
  );
}
