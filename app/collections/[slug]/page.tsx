import { notFound } from "next/navigation";
import { redirectLegacy } from "@/lib/legacy-redirect-server";
import type { Metadata } from "next";
import { listingTitle } from "@/lib/meta-text";
import { getCollectionWithProducts, getCollections } from "@/lib/queries/products";
import { tr } from "@/lib/i18n";
import { collectionDescription, collectionName } from "@/lib/catalog-i18n";
import { getLang } from "@/lib/i18n-server";
import { CatalogSection, CollectionHead, EmptyCatalog } from "@/components/catalog/catalog-section";
import { COLLECTION_PLACEHOLDER } from "@/lib/collection-placeholders";
import { catalogue, collectionsWithProducts, isAvailable, stockedCollections } from "@/lib/catalog-context";
import { follow } from "@/lib/settings";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { listingOpenGraph, listingProductSlugs, ogFor } from "@/lib/listing-seo";
import { isNoindex, seoDescription, seoTitle } from "@/lib/hub-seo-fields";
export const revalidate = 60;
// Pre-render known collections when the Hub is reachable; otherwise build with none and render on demand.
export async function generateStaticParams() { try { return (await getCollections()).map((c) => ({ slug: c.slug })); } catch { return []; } }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [col, lang] = await Promise.all([getCollectionWithProducts((await params).slug), getLang()]);
  // DP-06: the Hub's SEO fields when present (the full <title>, so `absolute`), else exactly today's text. `noindex` is the Hub's thin-page guard.
  return col ? { title: seoTitle(col, lang) ? { absolute: seoTitle(col, lang)! } : listingTitle("collection", col.slug, collectionName(col, lang), lang), description: seoDescription(col, lang) ?? collectionDescription(col, lang) ?? undefined, ...(isNoindex(col) ? { robots: { index: false, follow: true } } : {}), ...ogFor(listingOpenGraph(col.hero_media, collectionName(col, lang), lang)) } : {};
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
  // A bare URL that exists in its language answers a 307 to its locale page
  // (Phase 2E-stage-1; lib/legacy-redirect-server.ts). Never on a locale route.
  await redirectLegacy();
  const t = tr(lang);
  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);
  const empty = col.products.length === 0;
  const [cols, all] = empty ? await Promise.all([collectionsWithProducts(), catalogue()]) : [[], []];
  // SEO Step 2: the ItemList is the grid's own list, same array, same order.
  const itemSlugs = listingProductSlugs(col.products);
  return (
    <>
      {itemSlugs.length > 0 && <JsonLd type="itemlist" slugs={itemSlugs} />}
      {/* Collections › this collection (Phase 4): the trail the product page
          shows above a piece of this collection, one level up — visible crumb
          and BreadcrumbList from one array, above the dark head. */}
      <div className="wrap">
        <Breadcrumbs lang={lang} label={t("pdp", "breadcrumb")} items={[{ name: t("nav", "collections"), path: "/collections" }, { name: collectionName(col, lang), path: `/collections/${col.slug}` }]} />
      </div>
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
