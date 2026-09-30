import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { catalogue, isAvailable } from "@/lib/catalog-context";
import { EmptyStage, InStockStrip, SearchForm } from "@/components/site/support-ui";

/**
 * NOT FOUND (build step 6; comp page-comps/supporting "404"). The live wording
 * on the hero's dark stage with no piece on it (an empty floor, a soft glow,
 * an outline "404"). Under it: back to the collections, a search box, and four
 * real in-stock pieces, so the page is never a dead end.
 *
 * Every notFound() on the site lands here, the Japanese /layaway included, so
 * nothing on it may mention layaway. It does not.
 */
export default async function NotFound() {
  const [lang, all] = await Promise.all([getLang(), catalogue()]);
  const t = tr(lang);
  const pieces = all.filter(isAvailable).slice(0, 4);
  return (
    <>
      <EmptyStage code="404" title={t("notFound", "h1")} lede={t("notFound", "p")}>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/collections" className="btn-press inline-flex min-h-12 items-center justify-center rounded-sm border border-chalk/55 px-6 py-3 text-[15px] font-medium text-chalk hover:border-chalk">
            {t("notFound", "back")}
          </Link>
        </div>
        <SearchForm lang={lang} tone="dark" className="mx-auto mt-6 w-full max-w-[420px]" />
      </EmptyStage>
      <InStockStrip lang={lang} products={pieces} />
    </>
  );
}
