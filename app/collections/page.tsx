import { pageMeta } from "@/lib/page-meta";
import { CollectionCard } from "@/components/catalog/collection-card";
import { getCollections } from "@/lib/queries/products";
import { getLang, } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";

export const generateMetadata = () => pageMeta("collections");
export const revalidate = 60;
export default async function CollectionsIndex() {
  const [lang, collections] = await Promise.all([getLang(), getCollections().catch(() => [])]);
  const t = tr(lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <h1 className="text-[clamp(36px,5.5vw,80px)]">{t("nav", "collections")}</h1>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => <CollectionCard key={c.id} collection={c} lang={lang} />)}
        </div>
      </div>
    </section>
  );
}
