import Link from "next/link";
import { Search } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/catalog/product-card";
export { EmptyStage, Eyebrow, MessengerCta } from "@/components/site/support-stage";

/**
 * Shared pieces of the supporting pages (build step 6; comp page-comps/supporting):
 * search results, the 404, Contact and the FAQ. Presentational only. The
 * pages read the Hub, and the Messenger link is always the Hub's `messenger`
 * row (lib/settings.ts `follow()`); with no row, no Messenger action renders.
 */

/** A search box that submits to /search (a plain GET form, so it works before hydration). */
export function SearchForm({ lang, value = "", className = "", tone = "light" }: { lang: Lang; value?: string; className?: string; tone?: "light" | "dark" }) {
  const t = tr(lang);
  const dark = tone === "dark";
  return (
    <form action="/search" method="get" role="search" className={`relative ${className}`}>
      <Search aria-hidden="true" className={`pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${dark ? "text-chalk/75" : "text-charcoal/70"}`} strokeWidth={1.5} />
      <input
        type="search"
        name="q"
        defaultValue={value}
        aria-label={t("search", "placeholder")}
        placeholder={t("search", "placeholder")}
        className={
          dark
            ? "h-12 w-full rounded-sm border border-chalk/40 bg-transparent pl-11 pr-4 text-[15px] text-chalk placeholder:text-chalk/70 focus:border-gold-pale focus:outline-none"
            : "h-12 w-full rounded-sm border border-gold-dark bg-white pl-11 pr-4 text-[15px] text-charcoal-deep placeholder:text-charcoal/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark"
        }
      />
    </form>
  );
}

/** "In stock now": four real available pieces and a link to every collection. */
export function InStockStrip({ lang, products }: { lang: Lang; products: Product[] }) {
  const t = tr(lang);
  if (products.length === 0) return null;
  return (
    <section className="wrap py-10 sm:py-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-[clamp(22px,2.4vw,30px)] text-charcoal-deep">{t("support", "inStockNow")}</h2>
        <Link href="/collections" className="text-sm text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{t("support", "seeAll")}</Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-8">
        {products.map((p, i) => <ProductCard key={p.id} product={p} lang={lang} index={i} />)}
      </div>
    </section>
  );
}

/** A chip: a link that looks like the catalogue's filter chips. `on` is the current one. */
export function ChipLink({ href, on = false, children }: { href: string; on?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-sm border px-3.5 text-[13px] ${on ? "border-charcoal-deep bg-charcoal-deep text-chalk" : "border-hairline bg-white text-charcoal-deep hover:border-charcoal/60"}`}
    >
      {children}
    </Link>
  );
}
