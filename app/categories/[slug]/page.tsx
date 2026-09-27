import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hub } from "@/lib/hub-api";
import { tr } from "@/lib/i18n";
import { categoryDescription, categoryName } from "@/lib/catalog-i18n";
import { getLang } from "@/lib/i18n-server";
import { stagePieces } from "@/lib/hero-deck";
import { CategoryStage } from "@/components/catalog/category-stage";
import { CatalogSection, CollectionHead, CountLine, EmptyCatalog } from "@/components/catalog/catalog-section";
import { catalogue, collectionsWithProducts, isAvailable, stockedCollections } from "@/lib/catalog-context";
import { follow } from "@/lib/settings";

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
  return cat ? { title: categoryName(cat, lang), description: categoryDescription(cat, lang) ?? undefined } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [cat, lang] = await Promise.all([hub.category(slug), getLang()]);
  if (!cat) notFound();
  const t = tr(lang);
  const name = categoryName(cat, lang);
  const description = categoryDescription(cat, lang);
  const eyebrow = t("categories", "eyebrow");
  const available = cat.products.filter(isAvailable).length;
  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);
  const empty = cat.products.length === 0;
  const [cols, all] = empty ? await Promise.all([collectionsWithProducts(), catalogue()]) : [[], []];

  return (
    <>
      {/* The owner's Hub photo leads, as on a collection; without one the
          category's own in-stock pieces stand on the hero's dark stage
          (CategoryStage), or its text alone when none is in stock. */}
      {cat.hero_media ? (
        <CollectionHead eyebrow={eyebrow} title={name} description={description} available={available} photo={cat.hero_media} lang={lang} />
      ) : (
        <div className="wrap pt-[clamp(20px,3vw,40px)]">
          <CategoryStage pieces={stagePieces(cat.products, lang)} eyebrow={eyebrow} title={name} description={description} count={<CountLine available={available} lang={lang} />} />
        </div>
      )}
      <div className="h-[clamp(12px,2vw,24px)]" />
      {empty
        ? <EmptyCatalog lang={lang} stocked={stockedCollections(cols)} now={all.filter(isAvailable).slice(0, 4)} messenger={messenger} />
        : <CatalogSection products={cat.products} lang={lang} messenger={messenger} />}
    </>
  );
}
