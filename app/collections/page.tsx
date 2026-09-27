import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { getCollections } from "@/lib/queries/products";
import { getLang, } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { collectionDescription, collectionName } from "@/lib/catalog-i18n";
import { typeVisual } from "@/lib/type-icons";
import { TypeIconWell } from "@/components/catalog/type-icon";
import { HubImage } from "@/components/media/hub-image";
export const generateMetadata = () => pageMeta("collections");
export const revalidate = 60;
export default async function CollectionsIndex() {
  const [lang, collections] = await Promise.all([getLang(), getCollections().catch(() => [])]);
  const t = tr(lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <h1 className="text-[clamp(36px,5.5vw,80px)]">{t("nav", "collections")}</h1>
        <div className="rule-grid mt-12 grid grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link key={c.id} href={`/collections/${c.slug}`} className="flex min-h-[200px] flex-col bg-white hover:underline underline-offset-8">
              {/* hero_media when the Hub has one, else the Stitch placeholder for
                  that slug, else the type's line icon (lib/type-icons.ts), so
                  every card in the grid has the same 4/3 box. Never a product photo.

                  Two columns of the wrap below `lg` and three above it, so the
                  card is a fraction of the viewport until the wrap stops
                  growing: measured 169 at 375, 353 at 768 and 381 at both 1280
                  and 1440, where the 1240px wrap has capped it. `50vw` rather
                  than a pixel figure below `lg` because the width really is
                  fluid there — it also over-declares by the gutter, which
                  costs nothing and can never land a soft image. The 4/3 box is
                  the <div>'s, reserved before the bytes arrive. */}
              {(() => {
                const visual = typeVisual(c);
                return (
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    {visual.kind === "photo"
                      ? <HubImage src={visual.url} alt="" fill sizes="(min-width: 1024px) 381px, 50vw" className="object-cover" />
                      : <TypeIconWell icon={visual.icon} iconClassName="h-10 w-10 lg:h-16 lg:w-16" />}
                  </div>
                );
              })()}
              <div className="p-6">
                <h2 className="text-[28px] text-charcoal-deep">{collectionName(c, lang)}</h2>
                {collectionDescription(c, lang) && <p className="mt-2 text-sm text-charcoal">{collectionDescription(c, lang)}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
