import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import { CatalogGrid, type GridItem, type GridLabels } from "@/components/catalog/catalog-grid";
import { ProductCard } from "@/components/catalog/product-card";
import { HubImage } from "@/components/media/hub-image";
import { SocialGlyph } from "@/components/site/social-icons";
import { Button } from "@/components/ui/button";
import { tr, dict, type Lang } from "@/lib/i18n";
import { collectionName } from "@/lib/catalog-i18n";
import { fromPrice, type Product } from "@/lib/queries/products";
import { productMetals, metalLabel } from "@/lib/metals";
import { isBuyable, productAvailability } from "@/lib/availability";
import { typeVisual } from "@/lib/type-icons";
import { TypeIconWell } from "@/components/catalog/type-icon";
import type { CollectionWithProducts } from "@/lib/catalog-context";

/**
 * The server half of a collection or category grid (step 2 build): each piece
 * rendered as its ProductCard, with the facts CatalogGrid filters on; the
 * dictionary labels; the "ask a person" tile. The first row's photos are the
 * page's largest paint and load with priority.
 */
export function CatalogSection({ products, lang, messenger }: { products: Product[]; lang: Lang; messenger: string | null }) {
  const t = tr(lang);
  const items: GridItem[] = products.map((p, i) => ({
    key: p.id,
    node: <ProductCard product={p} lang={lang} index={i} priority={i < 4} />,
    preloved: p.condition === "Preloved",
    type: p.item_type ?? null,
    metals: productMetals(p).map((m) => metalLabel(m, lang)),
    sold: !isBuyable(productAvailability(p)),
    price: fromPrice(p),
  }));
  const labels: GridLabels = {
    condition: t("collection", "condition"), all: t("collection", "filterAll"), new: t("collection", "filterNew"), preloved: t("collection", "filterPreloved"),
    type: t("collection", "type"), types: { Jewelry: t("collection", "typeJewelry"), Watch: t("collection", "typeWatch"), Accessory: t("collection", "typeAccessory") },
    metal: t("collection", "metal"), availableOnly: t("collection", "availableOnly"),
    sort: t("collection", "sort"), sortLabel: dict.collection.sortLabel[lang], sorts: { newest: t("collection", "sortNewest"), low: t("collection", "sortLow"), high: t("collection", "sortHigh") },
    filter: t("collection", "filter"), filters: t("collection", "filters"), clear: t("collection", "clear"), show: dict.collection.show[lang], close: t("collection", "close"),
    count: dict.collection.count[lang], countOne: dict.collection.countOne[lang], includingSold: t("collection", "includingSold"), emptyFiltered: t("collection", "emptyFiltered"),
  };
  return <CatalogGrid items={items} labels={labels} tile={<AskTile lang={lang} messenger={messenger} />} />;
}

/** The row filler: a person, not padding. The permit line shows from two cells (CatalogGrid). */
function AskTile({ lang, messenger }: { lang: Lang; messenger: string | null }) {
  const t = tr(lang);
  return (
    <>
      <div>
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-pale before:h-px before:w-7 before:bg-gold [:lang(ja)_&]:text-xs [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{t("collection", "askEyebrow")}</p>
        <p className="mt-3 font-display text-[clamp(20px,2.2vw,26px)] leading-tight text-gold-pale [:lang(ja)_&]:font-jp [:lang(ja)_&]:font-medium [:lang(ja)_&]:leading-snug">{t("collection", "askTitle")}</p>
      </div>
      <div className="border-t border-gold/30 text-[13px]">
        <p className="flex items-center gap-2.5 border-b border-gold/30 py-2.5"><ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-pale" strokeWidth={1.5} />{t("home", "valueQualityP")}</p>
        <p className="cg-permit items-center gap-2.5 border-b border-gold/30 py-2.5"><FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-pale" strokeWidth={1.5} />{t("footer", "secondhandPermit")}</p>
      </div>
      <Button asChild variant="outline" className="w-full whitespace-nowrap border-chalk/80 px-3 text-chalk hover:border-chalk">
        <a href={messenger ?? "/contact"} {...(messenger ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          <SocialGlyph name="messenger" size={18} />{t("social", "messenger")}
        </a>
      </Button>
    </>
  );
}

/** The dark header band: eyebrow, the Hub title and description, the available count, and the owner's photo. */
export function CollectionHead({ eyebrow, title, description, available, photo, lang }: {
  eyebrow: string; title: string; description: string | null; available: number; photo: string | null; lang: Lang;
}) {
  return (
    <section className="band-dark grid bg-[#17140f] text-chalk md:min-h-[340px] md:grid-cols-2">
      {photo && (
        <div className="relative h-[190px] overflow-hidden md:order-2 md:h-auto">
          <HubImage src={photo} alt="" fill priority sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
          <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,#17140f_0%,rgb(23_20_15/0)_45%)] md:bg-[linear-gradient(90deg,#17140f_0%,rgb(23_20_15/0)_30%)]" />
        </div>
      )}
      <div className={`flex flex-col justify-end gap-3.5 px-[clamp(18px,4vw,48px)] pb-7 pt-7 md:pb-12 md:pt-14 md:pl-[max(clamp(18px,4vw,48px),calc((100vw-1240px)/2+48px))] ${photo ? "" : "md:col-span-2"}`}>
        <p className="cs-eyebrow">{eyebrow}</p>
        <h1 className="cs-title !mt-0">{title}</h1>
        {description && <p className="cs-desc !mt-0">{description}</p>}
        <CountLine available={available} lang={lang} />
      </div>
    </section>
  );
}

/** "3 pieces available" (and its Japanese), the figure in Pale Gilt. */
export function CountLine({ available, lang }: { available: number; lang: Lang }) {
  const tpl = (available === 1 ? dict.collection.availableOne : dict.collection.available)[lang];
  const [pre, post] = tpl.split("{n}");
  return (
    <p className="text-[13px] text-chalk/75">
      {pre}<b className="mr-1.5 font-display text-xl font-normal text-gold-pale [font-variant-numeric:lining-nums_tabular-nums]">{available}</b>{post}
    </p>
  );
}

/**
 * 0 RESULTS (comp "collection-empty"): the existing empty-shelf sentence with
 * its way on, the collections that DO have stock (with counts), and four
 * available pieces. Never a dead end.
 */
export function EmptyCatalog({ lang, stocked, now, messenger }: {
  lang: Lang; stocked: { col: CollectionWithProducts; n: number }[]; now: Product[]; messenger: string | null;
}) {
  const t = tr(lang);
  return (
    <>
      <section className="wrap grid items-center gap-6 pb-2 pt-7 md:grid-cols-[1.1fr_1fr] md:gap-12 md:pb-6 md:pt-14">
        <div className="grid gap-4 border-t border-charcoal-deep pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark [:lang(ja)_&]:text-xs [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{dict.collection.count[lang].replace("{n}", "0")}</p>
          <p className="text-[15px] leading-[1.7] md:text-[17px]">{t("collection", "empty")}</p>
          <div className="flex flex-wrap gap-2.5">
            <Button asChild variant="outline"><Link href="/collections">{t("collection", "emptyCta")}</Link></Button>
            {messenger && (
              <Button asChild variant="ghost">
                <a href={messenger} target="_blank" rel="noopener noreferrer"><SocialGlyph name="messenger" size={18} />{t("social", "messenger")}</a>
              </Button>
            )}
          </div>
        </div>
        {stocked.length > 0 && (
          <ul className="grid grid-cols-2 gap-3">
            {stocked.map(({ col, n }) => {
              const visual = typeVisual(col);
              return (
                <li key={col.slug}>
                  <Link href={`/collections/${col.slug}`} className="group block">
                    <span className="relative block aspect-[4/3] overflow-hidden bg-hairline">
                      {visual.kind === "photo"
                        ? <HubImage src={visual.url} alt="" fill sizes="(min-width:768px) 22vw, 45vw" className="object-cover transition-transform duration-[1.2s] [transition-timing-function:var(--ease-lux)] group-hover:scale-[1.04] motion-reduce:transition-none" />
                        : <TypeIconWell icon={visual.icon} iconClassName="h-8 w-8" />}
                    </span>
                    <span className="flex items-baseline justify-between gap-1.5 pt-2 text-sm font-medium leading-snug">
                      <span>{collectionName(col, lang)}</span>
                      <span className="text-xs text-charcoal/70 [font-variant-numeric:lining-nums_tabular-nums]">{dict.collection.count[lang].replace("{n}", String(n))}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {now.length > 0 && (
        <section className="wrap pb-28 pt-8 lg:pb-24">
          <div className="mb-6 flex items-end justify-between gap-5">
            <h2 className="text-[clamp(30px,4vw,52px)] leading-[1.08]">{t("collection", "availableNow")}</h2>
            <Link href="/collections" className="shrink-0 border-b border-gold-dark pb-0.5 text-sm font-medium text-gold-dark hover:text-charcoal-deep">{t("collection", "viewAll")}</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[834px]:grid-cols-3 min-[834px]:gap-x-6 min-[834px]:gap-y-8 lg:grid-cols-4">
            {now.map((p, i) => <ProductCard key={p.slug} product={p} lang={lang} index={i} />)}
          </div>
        </section>
      )}
    </>
  );
}
