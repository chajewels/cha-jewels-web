import Link from "next/link";
import { localePath } from "@/lib/locale";
import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { CatalogSection, CollectionHead } from "@/components/catalog/catalog-section";
import { Button } from "@/components/ui/button";
import { catalogue } from "@/lib/catalog-context";
import { saleListed } from "@/lib/sale";
import { follow } from "@/lib/settings";
export const generateMetadata = () => pageMeta("sale");
export const revalidate = 60;

/**
 * SALE (owner decisions 2026-10-18). Every piece on sale across the whole
 * catalogue, EN and JA, in the Hub's order: the catalogue's cached read
 * filtered by `saleListed` — the one rule the grid's Sale chip and the
 * header's Sale link use too, so the three never disagree. Rendered with the
 * collection pages' grid (toolbar, filters, sort); every figure is the card's,
 * from the Hub.
 *
 * With nothing on sale the header hides its link, but the URL can still be
 * opened directly: it answers 200 with a short message and the way on to the
 * collections — never a 404, and never an empty grid.
 */
export default async function SalePage() {
  const [lang, all] = await Promise.all([getLang(), catalogue()]);
  const t = tr(lang);
  const pieces = all.filter(saleListed);
  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);
  return (
    <>
      <CollectionHead
        eyebrow={t("nav", "collections")}
        title={t("salePage", "h1")}
        description={t("salePage", "lede")}
        available={pieces.length}
        photo={null}
        lang={lang}
      />
      {pieces.length > 0 ? (
        <CatalogSection products={pieces} lang={lang} messenger={messenger} />
      ) : (
        <section className="wrap pb-28 pt-7 md:pb-24 md:pt-14">
          <div className="grid max-w-xl gap-4 border-t border-charcoal-deep pt-6">
            <p className="text-[15px] leading-[1.7] md:text-[17px]">{t("salePage", "empty")}</p>
            <div>
              <Button asChild variant="outline"><Link href={localePath("/collections", lang)}>{t("salePage", "emptyCta")}</Link></Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
