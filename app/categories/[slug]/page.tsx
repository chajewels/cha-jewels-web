import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hub } from "@/lib/hub-api";
import { tr } from "@/lib/i18n";
import { categoryDescription, categoryName } from "@/lib/catalog-i18n";
import { getLang } from "@/lib/i18n-server";
import { CATEGORY_PLACEHOLDER } from "@/lib/category-placeholders";
import { HubImage } from "@/components/media/hub-image";
import { EmptyShelf } from "@/components/catalog/empty-shelf";
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
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        {banner && (
          <div className="relative mb-10 aspect-[21/9] overflow-hidden rounded-sm border border-hairline">
            {/* THE PAGE'S LARGEST PAINT. It sits above the fold at every
                width and it is the first thing a category page shows, so it
                is the one image on this site that asks for priority — and
                the only one, because marking a second would mean neither.

                Measured: the banner is the wrap's content box, 339 at 375,
                706.6 at 768 and 1144 at both 1280 and 1440, where
                max-w-site has capped it. `100vw` below that cap
                over-declares by the gutter on purpose — never under, so the
                browser can never pick a candidate too small and land a soft
                banner across the top of the page. 21/9 is the div's and is
                reserved before the bytes arrive. */}
            <HubImage
              src={banner}
              alt=""
              fill
              priority
              sizes="(min-width: 1240px) 1144px, 100vw"
              className="object-cover object-[65%_center]"
            />
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">{t("categories", "eyebrow")}</p>
        <h1 className="mt-3 text-[clamp(40px,6vw,88px)]">{name}</h1>
        {description && <p className="mt-4 max-w-[58ch] text-charcoal">{description}</p>}
        {cat.products.length === 0 ? (
          <EmptyShelf lang={lang} />
        ) : (
          <div className="rule-grid mt-12 grid grid-cols-2 lg:grid-cols-4">
            {cat.products.map((p) => <ProductCard key={p.id} product={p} lang={lang} />)}
          </div>
        )}
      </div>
    </section>
  );
}
