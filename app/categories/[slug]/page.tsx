import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hub } from "@/lib/hub-api";
import { tr } from "@/lib/i18n";
import { categoryDescription, categoryName } from "@/lib/catalog-i18n";
import { getLang } from "@/lib/i18n-server";
import { CATEGORY_PLACEHOLDER } from "@/lib/category-placeholders";
import { ProductCard } from "@/components/catalog/product-card";

export const revalidate = 60;

/**
 * A category landing page, mirroring app/collections/[slug]/page.tsx: the
 * Hub's name and description, then the pieces in it as the same ProductCard
 * grid. The banner is the category's own hero_media, falling back to the
 * placeholder for that slug and to no banner at all — a product photo never
 * stands in for a category.
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
  const banner = cat.hero_media ?? CATEGORY_PLACEHOLDER[cat.slug] ?? null;

  return (
    <section className="surface-light bg-chalk text-charcoal-deep py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        {banner && (
          <div className="relative mb-10 aspect-[21/9] overflow-hidden rounded-sm border border-hairline">
            {/* Hub media may come from hosts next/image is not configured for. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover object-[65%_center]" />
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">{t("categories", "eyebrow")}</p>
        <h1 className="mt-3 text-[clamp(40px,6vw,88px)]">{name}</h1>
        {description && <p className="mt-4 max-w-[58ch] text-charcoal">{description}</p>}
        {cat.products.length === 0 ? (
          <p className="mt-12 border border-hairline p-6 text-charcoal">{t("collection", "empty")}</p>
        ) : (
          <div className="rule-grid mt-12 grid grid-cols-2 lg:grid-cols-4">
            {cat.products.map((p) => <ProductCard key={p.id} product={p} lang={lang} />)}
          </div>
        )}
      </div>
    </section>
  );
}
