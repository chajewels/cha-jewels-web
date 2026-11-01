import { notFound } from "next/navigation";
import { redirectLegacy } from "@/lib/legacy-redirect-server";
import type { Metadata } from "next";
import { listingTitle } from "@/lib/meta-text";
import { hub } from "@/lib/hub-api";
import { tr } from "@/lib/i18n";
import { categoryDescription, categoryName } from "@/lib/catalog-i18n";
import { getLang } from "@/lib/i18n-server";
import { CatalogSection, EmptyCatalog } from "@/components/catalog/catalog-section";
import { catalogue, collectionsWithProducts, isAvailable, stockedCollections } from "@/lib/catalog-context";
import { follow } from "@/lib/settings";
import { PageHead } from "@/components/lumiere/page/page-head";
import { CountTag } from "@/components/commerce/count-tag";
import { HubImage } from "@/components/media/hub-image";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { listingOpenGraph, listingProductSlugs, ogFor } from "@/lib/listing-seo";

export const revalidate = 60;

/**
 * A category landing page, mirroring app/collections/[slug]/page.tsx: the
 * Hub's name and description, then the pieces in it as the same ProductCard
 * grid. The banner is the category's own hero_media, uploaded by the owner in
 * the Hub. Without one, the category's own in-stock pieces stand on the hero's
 * dark stage (CategoryStage), and with none in stock the band carries the text
 * alone. No bundled photo stands in for a category any more (owner rule
 * 2026-09-26: no brand logos as decoration; the old placeholders for the
 * branded lines carried Bvlgari, Cartier, Rolex, YSL, Gucci… marks).
 *
 * The title and description are the CATEGORY's, not a fixed pair from
 * dict.meta: pageMeta() takes a static dictionary key, so routing every
 * category through it would give all five the same <title>. The collections
 * page builds its metadata the same way and for the same reason.
 */
export async function generateStaticParams() {
  try { return (await hub.categories()).map((c) => ({ slug: c.slug })); } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [cat, lang] = await Promise.all([hub.category((await params).slug).catch(() => null), getLang()]);
  return cat ? { title: listingTitle("category", cat.slug, categoryName(cat, lang), lang), description: categoryDescription(cat, lang) ?? undefined, ...ogFor(listingOpenGraph(cat.hero_media, categoryName(cat, lang), lang)) } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [cat, lang] = await Promise.all([hub.category(slug), getLang()]);
  if (!cat) notFound();
  // A bare URL that exists in its language answers a 307 to its locale page
  // (Phase 2E-stage-1; lib/legacy-redirect-server.ts). Never on a locale route.
  await redirectLegacy();
  const t = tr(lang);
  const name = categoryName(cat, lang);
  const description = categoryDescription(cat, lang);
  const eyebrow = t("categories", "eyebrow");
  const available = cat.products.filter(isAvailable).length;
  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);
  const empty = cat.products.length === 0;
  const [cols, all] = empty ? await Promise.all([collectionsWithProducts(), catalogue()]) : [[], []];

  // SEO Step 2: the ItemList is the grid's own list, same array, same order.
  const itemSlugs = listingProductSlugs(cat.products);

  return (
    <>
      {itemSlugs.length > 0 && <JsonLd type="itemlist" slugs={itemSlugs} />}
      {/* Home › this category (Phase 4): a category hangs off the home page's
          hero deck, not off /collections, so the trail starts at Home — visible
          crumb and BreadcrumbList from one array, above the head. */}
      <div className="wrap">
        <Breadcrumbs lang={lang} label={t("pdp", "breadcrumb")} items={[{ name: t("nav", "home"), path: "/" }, { name, path: `/categories/${slug}` }]} />
      </div>
      {/* P4b: the Halden head (eyebrow, display title, lead, count); the owner's Hub
          photo, when there is one, stands beside it as a rounded plate. */}
      <PageHead eyebrow={eyebrow} title={name} lead={description} aside={<CountTag available={available} lang={lang} />}>
        {cat.hero_media && (
          <div className="relative mt-8 aspect-[21/9] w-full overflow-hidden rounded-[22px] bg-chalk">
            <HubImage src={cat.hero_media} alt="" fill priority sizes="(min-width:1240px) 1240px, 100vw" className="object-cover" />
          </div>
        )}
      </PageHead>
      {empty
        ? <EmptyCatalog lang={lang} stocked={stockedCollections(cols)} now={all.filter(isAvailable).slice(0, 4)} messenger={messenger} />
        : <CatalogSection products={cat.products} lang={lang} messenger={messenger} />}
    </>
  );
}
