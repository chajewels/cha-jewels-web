import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { getCollections } from "@/lib/queries/products";
import { getLang, } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { collectionDescription, collectionName } from "@/lib/catalog-i18n";
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
            <Link key={c.id} href={`/collections/${c.slug}`} className="flex min-h-[200px] flex-col bg-charcoal hover:underline underline-offset-8">
              {/* hero_media when the Hub has one, else the typographic card. Never a product photo. */}
              {c.hero_media && <img src={c.hero_media} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />}
              <div className="p-6">
                <h2 className="text-[28px] text-gold-pale">{collectionName(c, lang)}</h2>
                {collectionDescription(c, lang) && <p className="mt-2 text-sm text-chalk/75">{collectionDescription(c, lang)}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
