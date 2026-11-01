import Link from "next/link";
import { localePath } from "@/lib/locale";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/lumiere/common/reveal-text";
import { catalogue, isAvailable } from "@/lib/catalog-context";
import { InStockStrip, SearchForm } from "@/components/site/support-ui";

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
      <section className="iac-oops">
        <div className="wrap">
          <p aria-hidden="true" className="iac-oops__code cj-fig">404</p>
          <h1 className="lm-h1"><Reveal>{t("notFound", "h1")}</Reveal></h1>
          <p className="iac-oops__lead">{t("notFound", "p")}</p>
          <div className="iac-oops__acts">
            <Button asChild><Link href={localePath("/collections", lang)}>{t("notFound", "back")}</Link></Button>
          </div>
          <SearchForm lang={lang} tone="light" className="iac-oops__search" />
        </div>
      </section>
      <InStockStrip lang={lang} products={pieces} />
    </>
  );
}
