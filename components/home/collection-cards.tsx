import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { collectionDescription, collectionName } from "@/lib/catalog-i18n";
import type { Collection } from "@/lib/types";

export type CollectionCardData = { c: Collection; image: string | null };

/**
 * Collections (Stitch §8), dynamic from the Hub. Four per row on desktop with
 * the remainder centred; on mobile the file's row card with a square thumbnail.
 * Image: c.hero_media, else the first product image, else a chalk block with the
 * name in Playfair. Description is the Hub's or nothing — never invented.
 * Plain <img>: Hub media may come from hosts next/image is not configured for.
 */
export function CollectionCards({ items, lang }: { items: CollectionCardData[]; lang: Lang }) {
  const t = tr(lang);
  return (
    <div className="flex flex-wrap justify-center gap-3 lg:gap-6">
      {items.map(({ c, image }) => {
        const name = collectionName(c, lang);
        const desc = collectionDescription(c, lang);
        return (
          <Link key={c.id} href={`/collections/${c.slug}`} className="group flex w-full items-stretch overflow-hidden rounded-sm border border-hairline bg-white shadow-sm transition-shadow hover:shadow-md lg:w-[calc(25%-18px)] lg:flex-col">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden lg:aspect-[4/3] lg:h-auto lg:w-full">
              {image ? (
                <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-chalk p-3 text-center"><span className="font-display text-lg text-gold-dark lg:text-2xl">{name}</span></div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between p-3 lg:p-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-charcoal lg:text-xl">{name}</h3>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-charcoal/50 transition-transform group-hover:translate-x-1" />
                </div>
                {desc && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-charcoal/70 lg:text-sm">{desc}</p>}
              </div>
              <span className="mt-2 text-[11px] font-semibold text-gold-dark lg:text-xs">{t("home", "colsLink")}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
