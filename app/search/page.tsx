import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { normalize, search } from "@/lib/search";
import { ProductCard } from "@/components/catalog/product-card";
import { SearchView } from "@/components/analytics/search-view";

/**
 * Results for a search submitted from the header box, or linked to directly.
 *
 * noindex: these are query permutations of pages that already exist on their
 * own. Letting a crawler in would index an unbounded set of thin duplicates of
 * the collection pages, which is the classic way a storefront dilutes itself.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } };

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? "" : v ?? "");

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const [lang, sp] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  const q = first(sp.q).trim();
  const hasQuery = normalize(q).length >= 1;
  const { products, total } = hasQuery ? await search(q, lang, 60) : { products: [], total: 0 };

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        {hasQuery && <SearchView q={q} total={total} />}
        <h1 className="text-[clamp(32px,5vw,64px)]">{hasQuery ? t("search", "title", { q }) : t("search", "placeholder")}</h1>

        {!hasQuery && <p className="mt-6 max-w-[58ch] text-charcoal">{t("search", "prompt")}</p>}

        {hasQuery && total > 0 && (
          <p className="mt-4 text-sm text-charcoal/70">{total === 1 ? t("search", "countOne") : t("search", "count", { n: String(total) })}</p>
        )}

        {hasQuery && total === 0 && (
          <div className="mt-12 border border-hairline p-6">
            <p className="text-charcoal">{t("search", "none", { q })}</p>
            <Link href="/collections" className="mt-4 inline-block text-gold-dark underline underline-offset-4 hover:text-gold-dark">
              {t("footer", "collections")}
            </Link>
          </div>
        )}

        {products.length > 0 && (
          <div className="rule-grid mt-12 grid grid-cols-2 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} lang={lang} />)}
          </div>
        )}
      </div>
    </section>
  );
}
