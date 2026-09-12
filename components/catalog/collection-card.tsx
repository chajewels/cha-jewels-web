import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Collection } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { collectionDescription, collectionName } from "@/lib/catalog-i18n";
import { getCollectionWithProducts, primaryImage } from "@/lib/queries/products";
import { showroomCopy } from "@/lib/i18n-showroom";

/** Prefer the Hub's collection image, otherwise use a photo from that collection only. */
export async function CollectionCard({ collection, lang }: { collection: Collection; lang: Lang }) {
  const detail = collection.hero_media ? null : await getCollectionWithProducts(collection.slug).catch(() => null);
  const photo = collection.hero_media || detail?.products.map(primaryImage).find((image) => image?.url)?.url;
  return (
    <Link href={`/collections/${collection.slug}`} className="collection-card group relative flex min-h-[300px] flex-col justify-end overflow-hidden border border-rule bg-velvet-deep p-5 sm:min-h-[360px] sm:p-7">
      {photo && <Image src={photo} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="collection-photo object-cover" unoptimized={photo.startsWith("data:") || /\.svg(\?|$)/i.test(photo)} />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-velvet-deep via-velvet-deep/70 to-transparent" />
      <div className="relative">
        <h3 className="text-[clamp(26px,3vw,36px)] text-gold-pale">{collectionName(collection, lang)}</h3>
        {collectionDescription(collection, lang) && <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-champagne/85">{collectionDescription(collection, lang)}</p>}
        <span className="mt-5 inline-flex items-center gap-3 text-sm text-gold-pale">{showroomCopy[lang].explore}<ArrowUpRight size={18} aria-hidden="true" /></span>
      </div>
    </Link>
  );
}
