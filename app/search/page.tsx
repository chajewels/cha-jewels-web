import type { Metadata } from "next";
import { tr, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { normalize, search } from "@/lib/search";
import { hub } from "@/lib/hub-api";
import { catalogue, isAvailable } from "@/lib/catalog-context";
import { categoryName, collectionName } from "@/lib/catalog-i18n";
import { follow } from "@/lib/settings";
import type { Category, Collection, Product } from "@/lib/types";
import { ProductCard } from "@/components/catalog/product-card";
import { SearchView } from "@/components/analytics/search-view";
import { ChipLink, Eyebrow, InStockStrip, MessengerCta, SearchForm } from "@/components/site/support-ui";

/**
 * Results for a search submitted from the header box, or linked to directly
 * (build step 6; comp page-comps/supporting "search" and "search-none").
 *
 * - The query sits in a large gold-edged box; the title and count are the
 *   live strings.
 * - Chips: All (n), In stock (`?stock=1`), and any collection whose name
 *   matches the query, which opens that collection.
 * - Results use the shared product card. When the last row is short, the
 *   empty cells become one dark "tell a person" tile that opens Messenger
 *   (DESIGN: an empty cell is a defect).
 * - No results is no longer a dead end: searches that do find something,
 *   every collection, a Messenger panel, and four in-stock pieces.
 *
 * noindex: these are query permutations of pages that already exist on their
 * own. Letting a crawler in would index an unbounded set of thin duplicates of
 * the collection pages, which is the classic way a storefront dilutes itself.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } };

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
const soft = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback);

/** Tailwind needs literal class names: the tile's span for 1–3 empty cells in a 4-column row. */
const LG_SPAN = ["", "lg:col-span-1", "lg:col-span-2", "lg:col-span-3"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; stock?: string | string[] }> }) {
  const [lang, sp] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  const q = first(sp.q).trim();
  const stockOnly = first(sp.stock) === "1";
  const hasQuery = normalize(q).length >= 1;
  const [{ products: found, total }, cols, messenger] = await Promise.all([
    hasQuery ? search(q, lang, 60) : Promise.resolve({ products: [] as Product[], total: 0 }),
    soft(hub.collections(), [] as Collection[]),
    follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null),
  ]);
  const products = stockOnly ? found.filter(isAvailable) : found;
  const inStockCount = found.filter(isAvailable).length;
  const needle = normalize(q);
  const matchingCols = hasQuery ? cols.filter((c) => normalize(collectionName(c, lang)).includes(needle)) : [];
  const base = `/search?q=${encodeURIComponent(q)}`;

  const none = hasQuery && total === 0;
  const [tries, pieces] = none ? await noResultHelp(lang) : [[], []];

  return (
    <div className="wrap pb-16 sm:pb-24">
      {hasQuery && <SearchView q={q} total={total} />}

      <div className="flex flex-col gap-6 border-b border-hairline pb-6 pt-8 sm:pt-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Eyebrow>{t("support", "search")}</Eyebrow>
          <h1 className="mt-2 break-words text-[clamp(30px,4.2vw,52px)] leading-[1.1] text-charcoal-deep [:lang(ja)_&]:text-[clamp(24px,3vw,38px)] [:lang(ja)_&]:leading-[1.4]">
            {hasQuery ? t("search", "title", { q }) : t("search", "placeholder")}
          </h1>
          {!hasQuery && <p className="mt-3 max-w-[58ch] text-charcoal">{t("search", "prompt")}</p>}
          {hasQuery && total > 0 && (
            <p className="cj-fig mt-2 text-sm text-charcoal/75">{total === 1 ? t("search", "countOne") : t("search", "count", { n: String(total) })}</p>
          )}
          {none && <p className="mt-2 text-sm text-charcoal/75">{t("search", "none", { q })}</p>}
        </div>
        <SearchForm lang={lang} value={q} className="w-full lg:max-w-[380px] lg:flex-[0_1_380px]" />
      </div>

      {hasQuery && total > 0 && (
        <>
          <nav aria-label={t("support", "filters")} className="-mx-[clamp(18px,4vw,48px)] overflow-x-auto px-[clamp(18px,4vw,48px)] py-4 [scrollbar-width:none] sm:pb-6">
            <ul className="flex gap-2">
              <li><ChipLink href={base} on={!stockOnly}>{t("support", "all")} <span className="cj-fig text-[11.5px] opacity-80">{total}</span></ChipLink></li>
              <li><ChipLink href={`${base}&stock=1`} on={stockOnly}>{t("support", "inStock")} <span className="cj-fig text-[11.5px] opacity-80">{inStockCount}</span></ChipLink></li>
              {matchingCols.map((c) => (
                <li key={c.slug}><ChipLink href={`/collections/${c.slug}`}>{collectionName(c, lang)}</ChipLink></li>
              ))}
            </ul>
          </nav>

          {products.length > 0 ? (
            <ResultGrid lang={lang} products={products} messenger={messenger} />
          ) : (
            <p className="border border-hairline bg-white p-5 text-sm text-charcoal-deep">{t("search", "none", { q })}</p>
          )}
        </>
      )}

      {none && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
          <div className="border border-hairline bg-white p-6 sm:p-7">
            {tries.length > 0 && (
              <>
                <Eyebrow>{t("support", "tryThese")}</Eyebrow>
                <ul className="mt-3.5 flex flex-wrap gap-2">
                  {tries.map((x) => <li key={x}><ChipLink href={`/search?q=${encodeURIComponent(x)}`}>{x}</ChipLink></li>)}
                </ul>
              </>
            )}
            {cols.length > 0 && (
              <>
                <Eyebrow className={tries.length > 0 ? "mt-6" : ""}>{t("search", "collections")}</Eyebrow>
                <ul className="mt-3.5 flex flex-wrap gap-2">
                  {cols.map((c) => <li key={c.slug}><ChipLink href={`/collections/${c.slug}`}>{collectionName(c, lang)}</ChipLink></li>)}
                </ul>
              </>
            )}
          </div>
          <div className="band-dark relative grid content-center gap-4 overflow-hidden bg-charcoal-deep p-7 text-chalk outline outline-1 -outline-offset-1 outline-gold/30 sm:p-8">
            <div aria-hidden="true" className="cs-pool" />
            <Eyebrow dark rule className="relative">{t("support", "lookEyebrow")}</Eyebrow>
            <p className="relative font-display text-[clamp(20px,2vw,26px)] leading-snug text-gold-pale [:lang(ja)_&]:text-[18px] [:lang(ja)_&]:leading-[1.6]">{t("support", "lookLine")}</p>
            {messenger && <MessengerCta href={messenger} label={t("social", "messengerButton")} className="relative justify-self-start" />}
          </div>
        </div>
      )}

      {none && <div className="-mx-[clamp(18px,4vw,48px)]"><InStockStrip lang={lang} products={pieces} /></div>}
    </div>
  );
}

/**
 * The results, in the catalogue's grid. A short last row is filled by one dark
 * tile that opens Messenger: on phones (2 columns) when the count is odd, from
 * `lg` (4 columns) across however many cells are left.
 */
function ResultGrid({ lang, products, messenger }: { lang: Lang; products: Product[]; messenger: string | null }) {
  const t = tr(lang);
  const r2 = products.length % 2;
  const r4 = products.length % 4;
  const tile = messenger && (r2 || r4) ? (
    <a
      href={messenger}
      target="_blank"
      rel="noreferrer"
      className={`band-dark relative min-h-[240px] flex-col justify-between gap-6 overflow-hidden bg-charcoal-deep p-5 text-chalk sm:p-6 ${r2 ? "flex" : "hidden"} ${r4 ? `lg:flex ${LG_SPAN[4 - r4]}` : "lg:hidden"}`}
    >
      <span aria-hidden="true" className="cs-pool" />
      <Eyebrow dark className="relative">{t("support", "tileEyebrow")}</Eyebrow>
      <span className="relative font-display text-[clamp(20px,2vw,26px)] leading-snug text-gold-pale [:lang(ja)_&]:text-[17px] [:lang(ja)_&]:leading-[1.6]">{t("support", "tileLine")}</span>
      <span className="relative text-sm text-gold-pale underline decoration-gold-pale/50 underline-offset-4">{t("social", "messengerButton")}</span>
    </a>
  ) : null;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-8">
      {products.map((p, i) => <ProductCard key={p.id} product={p} lang={lang} index={i} />)}
      {tile}
    </div>
  );
}

/**
 * For a search that finds nothing: up to five searches that DO find pieces
 * (category names and the brands most often in stock, each checked against the
 * index), and four in-stock pieces.
 */
async function noResultHelp(lang: Lang): Promise<[string[], Product[]]> {
  const [all, cats] = await Promise.all([catalogue(), soft(hub.categories(), [] as Category[])]);
  const stocked = all.filter(isAvailable);
  const brandCount = new Map<string, number>();
  for (const p of stocked) {
    const b = p.brand?.trim();
    if (b) brandCount.set(b, (brandCount.get(b) ?? 0) + 1);
  }
  const brands = [...brandCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b]) => b);
  const candidates = [...new Set([...cats.map((c) => categoryName(c, lang)), ...brands].filter(Boolean))];
  const checked = await Promise.all(candidates.map(async (c) => ((await search(c, lang, 1)).total > 0 ? c : null)));
  return [checked.filter((c): c is string => !!c).slice(0, 5), stocked.slice(0, 4)];
}
