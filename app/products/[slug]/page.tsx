import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug, primaryImage } from "@/lib/queries/products";
import { tr, type Lang } from "@/lib/i18n";
import { categoryName, collectionName, productDescription, productName } from "@/lib/catalog-i18n";
import { getLang } from "@/lib/i18n-server";
import { PriceBlock } from "@/components/commerce/price-block";
import { ConditionBadge } from "@/components/catalog/condition-badge";
import { OriginBadge } from "@/components/catalog/origin-badge";
import { metalsLabel, productMetals } from "@/lib/metals";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductTrust } from "@/components/catalog/product-trust";
import { SoldCard } from "@/components/catalog/sold-card";
import { availabilityKey, isBuyable, variantAvailability } from "@/lib/availability";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { layawayOffered } from "@/lib/layaway-availability";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { ReserveWithLayaway } from "@/components/commerce/reserve-with-layaway";
import { BuyBar } from "@/components/commerce/buy-bar";
import { SocialGlyph } from "@/components/site/social-icons";
import { MessengerAnchor } from "@/components/site/messenger-anchor";
import { Button } from "@/components/ui/button";
import { ComponentStyle } from "@/components/fx/component-style";
import { JsonLd } from "@/components/site/json-ld";
import { ProductView } from "@/components/analytics/product-view";
import { galleryItems } from "@/lib/product-media";
import { catalogue, categoryOf, collectionOf, collectionsWithProducts, relatedPieces, soldAlternatives } from "@/lib/catalog-context";
import { follow } from "@/lib/settings";
import { formatMoney } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { hub } from "@/lib/hub-api";
import { showable } from "@/lib/reviews";
import { ReviewGrid, ReviewSummary } from "@/components/reviews/review-list";

export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [p, lang] = await Promise.all([getProductBySlug((await params).slug), getLang()]);
  if (!p) return {};
  const img = primaryImage(p);
  return { title: productName(p, lang), description: productDescription(p, lang) ?? undefined, openGraph: img ? { images: [img.url] } : undefined };
}

/**
 * The page's own rules (components/fx/component-style.tsx says why inline):
 * the name, capped at 30px desktop / 20px phone (26 / 18 in Japanese, which
 * must not break mid-word), in lining figures; the spec line; the ledger.
 */
const CSS = `
.pdp-name { font-size: 20px; line-height: 1.35; letter-spacing: -.005em; font-variant-numeric: lining-nums proportional-nums; font-feature-settings: "lnum" 1; }
:lang(ja) .pdp-name { font-size: 18px; line-height: 1.6; word-break: auto-phrase; line-break: strict; }
@media (min-width: 640px) { .pdp-name { font-size: 30px; line-height: 1.25; } :lang(ja) .pdp-name { font-size: 26px; line-height: 1.5; } }
.pdp-spec > * + *::before { content: "·"; margin-right: 14px; color: rgb(138 107 18 / .6); }
.pdp-fig { font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; }
.pdp-onepiece::before { content: ""; width: 8px; height: 8px; border-radius: 9999px; background: #1ABC9C; flex: none; }
.pdp-label { font-size: 11px; font-weight: 600; line-height: 1.3; letter-spacing: .14em; text-transform: uppercase; }
:lang(ja) .pdp-label { font-size: 12px; letter-spacing: .05em; text-transform: none; }
.badge-status { display: inline-flex; align-items: center; min-height: 24px; padding: 3px 10px; font-size: 11px; font-weight: 600; line-height: 1.3; letter-spacing: .12em; text-transform: uppercase; }
:lang(ja) .badge-status { letter-spacing: .04em; text-transform: none; }`;

/**
 * THE PRODUCT PAGE (step 2 build; comps page-comps/product-collection,
 * owner decision 2026-09-27: every open item built with the recommended
 * option, reviewed on the branch preview).
 *
 *   gallery     square chalk well; the Hub cut-out if there is one, else the
 *               whole photo contained (lib/product-media.ts); a video slot
 *               third when the Hub sends one; rail on desktop, strip on phone
 *   buy column  badges → the EXACT Hub name → the spec line (Hub fields, as
 *               sent) → the dark price card (EN: the Hub down payment ¥ (₱))
 *               → one orange Add to cart (EN adds the gold ghost "Reserve with
 *               layaway") and a quiet Messenger button → "one of a kind" →
 *               the trust block → SKU
 *   sold        no cart button and no buy bar: the Sold card with three
 *               available pieces and the orange Messenger ask (SoldCard)
 *   below       the specification ledger (Hub values only; no size cell
 *               unless the Hub sends a size, D2-8), the Hub description
 *               verbatim, the EN calculator, then four related pieces
 *   phone       the sticky buy bar replaces the tab bar (D2-6)
 *
 * NOTHING ABOUT LAYAWAY ON THE JAPANESE SITE: every layaway element is behind
 * layawayOffered(lang). Every figure is the Hub's; nothing is computed.
 */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const [p, lang] = await Promise.all([getProductBySlug((await params).slug), getLang()]);
  if (!p) notFound();
  const t = tr(lang);
  const layaway = layawayOffered(lang);
  const variant = p.product_variants[0];
  // ONE status for the badge, the buttons and the financing copy.
  const avail = variantAvailability(variant, p.status);
  const buyable = isBuyable(avail);
  const price = variant?.price_jpy;
  const metals = productMetals(p);
  const name = productName(p, lang);
  const desc = productDescription(p, lang);

  // The rest of the catalogue, for the crumb, the ledger's category, related
  // pieces and a sold piece's alternatives. All secondary (lib/catalog-context).
  const [cols, category, all, messenger, reviewData] = await Promise.all([
    collectionsWithProducts(),
    categoryOf(p),
    catalogue(),
    follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null),
    // Secondary: a review read that fails is no review section, never a broken
    // product page (reviews are an addition to the piece, not the piece).
    hub.reviews({ product: p.slug, lang, limit: 12 }).catch(() => null),
  ]);
  const reviews = reviewData ? showable(reviewData.reviews) : [];
  const reviewCount = reviewData?.count ?? 0;
  const reviewAverage = reviewData?.average ?? null;
  const col = collectionOf(p, cols);
  const alternatives = buyable ? [] : soldAlternatives(p, all);
  const related = relatedPieces(p, col, all, 4, alternatives);
  const crumb = col ? { href: `/collections/${col.slug}`, name: collectionName(col, lang) }
    : category ? { href: `/categories/${category.slug}`, name: categoryName(category, lang) } : null;

  const spec = [metals.length ? metalsLabel(metals, lang) : null, p.weight_g ? `${p.weight_g} g` : null, variant?.stone?.trim() || null].filter((x): x is string => !!x);
  const ledger: [string, string][] = [
    [t("product", "metal"), metals.length ? metalsLabel(metals, lang) : "—"],
    [t("product", "weight"), p.weight_g ? `${p.weight_g} g` : "—"],
    [t("product", "stone"), variant?.stone?.trim() || "—"],
    ...(variant?.size?.trim() ? [[t("pdp", "size"), variant.size.trim()] as [string, string]] : []),
    [t("pdp", "condition"), p.condition === "Preloved" ? t("collection", "filterPreloved") : t("collection", "filterNew")],
    // The jewelry type: the piece's collection (Rings, Earrings…) — the one the
    // crumb names. The Hub's product does not carry `category_slugs`, so a
    // merchandising category is only a fallback, and with neither the row is
    // left out rather than showing a dash.
    ...(col ? [[t("pdp", "category"), collectionName(col, lang)] as [string, string]]
      : category ? [[t("pdp", "category"), categoryName(category, lang)] as [string, string]] : []),
    ["SKU", p.sku],
  ];

  return (
    <>
      <JsonLd type="product" product={p} />
      <ProductView sku={p.sku} lang={lang} />
      <ComponentStyle id="fx-pdp" css={CSS} />
      <div className="wrap">
        <nav aria-label={t("pdp", "breadcrumb")} className="py-3.5 text-xs text-charcoal/70 sm:pb-[18px] sm:pt-[22px] sm:text-[13px]">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/collections" className="text-charcoal/80 hover:text-gold-dark">{t("nav", "collections")}</Link></li>
            {crumb && <><li aria-hidden="true" className="text-gold-dark">/</li><li><Link href={crumb.href} className="text-charcoal/80 hover:text-gold-dark">{crumb.name}</Link></li></>}
            <li aria-hidden="true" className="text-gold-dark">/</li>
            <li aria-current="page" className="text-charcoal-deep">{p.sku}</li>
          </ol>
        </nav>

        {/* Owner blueprint 2026-10-01 (every product page): on desktop the
            photo column is a fixed 470 px — square photo + one thumbnail strip —
            so the buy column, with the layaway calculator right under its
            buttons, sits on the first screen. The "one of a kind" note, the
            trust rows and the SKU move under the photos (second row of the
            photo column); the buy column spans both rows. On a phone the DOM
            order is the reading order: photos, buy column, trust rows. */}
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 pb-8 sm:gap-7 lg:grid-cols-[470px_minmax(0,1fr)] lg:gap-10 lg:pb-[72px] xl:gap-14">
          <section aria-label={t("product", "gallery")} className="-mx-[clamp(18px,4vw,48px)] min-w-0 sm:mx-auto sm:w-full sm:max-w-[640px] lg:col-start-1 lg:row-start-1 lg:mx-0 lg:max-w-none">
            <ProductGallery
              items={galleryItems(p)}
              name={name}
              lang={lang}
              badge={buyable ? null : <span className="badge-status bg-charcoal-deep text-chalk">{t("product", availabilityKey(avail))}</span>}
            />
          </section>

          <section className="flex min-w-0 flex-col gap-[18px] lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <div className="flex flex-wrap gap-2 empty:hidden">
              {!buyable && <span className="badge-status bg-charcoal-deep text-chalk">{t("product", availabilityKey(avail))}</span>}
              <ConditionBadge condition={p.condition} lang={lang} />
              <OriginBadge origin={p.origin} brand={p.brand} lang={lang} />
            </div>
            <h1 className="pdp-name">{name}</h1>
            {reviews.length > 0 && reviewAverage != null && (
              <div className="-mt-2"><ReviewSummary average={reviewAverage} count={reviewCount} lang={lang} href="#pdp-reviews" /></div>
            )}
            {spec.length > 0 && (
              <p className="pdp-spec pdp-fig flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] font-medium tracking-[0.06em] text-gold-dark">
                {spec.map((s) => <span key={s}>{s}</span>)}
              </p>
            )}
            {price != null && (
              <PriceBlock price={price} downPayment={{ jpy: variant?.down_payment_jpy, php: variant?.down_payment_php }} lang={lang} showReserve={layaway && buyable} sold={!buyable} />
            )}

            {buyable && variant ? (
              <>
                <div className="grid gap-2.5">
                  <AddToCart id="pdp-atc" variantId={variant.id} slug={p.slug} sku={p.sku} availability={avail} lang={lang} block />
                  {/* EN: the gold ghost for layaway beside the quiet Messenger
                      button; JA: Messenger alone, full width. */}
                  <div className={`grid gap-2.5 ${layaway && messenger ? "sm:grid-cols-2" : ""}`}>
                    {layaway && <ReserveWithLayaway variantId={variant.id} slug={p.slug} sku={p.sku} lang={lang} fill />}
                    {messenger && <MessengerButton href={messenger} lang={lang} />}
                  </div>
                </div>
                {/* The calculator right under the buttons (owner decision
                    2026-10-01) — on a PC it is on the first screen. Not on a
                    sold piece; never on the Japanese site. */}
                {layaway && price != null && <LayawayCalculator lang={lang} initialPrice={price} fixedPiece className="mt-1" />}
              </>
            ) : (
              <SoldCard alternatives={alternatives} messenger={messenger} lang={lang} />
            )}
          </section>

          <section aria-label={t("pdp", "trustRows")} className="flex min-w-0 flex-col gap-[18px] lg:col-start-1 lg:row-start-2">
            {buyable && variant && (
              <>
                {/* Only a single unit is "one of a kind" — the same rule the cart uses
                    (cart-lines.tsx: stock_qty <= 1). A piece with more in stock says how
                    many; the quantity is chosen in the cart. */}
                <p className="pdp-onepiece flex items-center gap-2 text-[13px] text-charcoal/70">
                  {variant.stock_qty <= 1
                    ? t("cart", "oneOfAKind")
                    : t("cart", "inStockCount").replace("{n}", String(variant.stock_qty))}
                </p>
                {layaway && <p className="-mt-2.5 text-xs text-charcoal/70">{t("product", "reserveNote")}</p>}
              </>
            )}
            <ProductTrust lang={lang} />
            <p className="pdp-fig text-[12.5px] text-charcoal/70">SKU {p.sku}</p>
          </section>
        </div>

        <section aria-labelledby="pdp-specs" className="pb-2 pt-8 sm:pb-6 sm:pt-16">
          <h2 id="pdp-specs" className="pdp-label mb-3.5 font-sans text-gold-dark">{t("pdp", "specs")}</h2>
          <dl className="grid grid-cols-2 border-l border-t border-hairline bg-white sm:grid-cols-3">
            {ledger.map(([k, v]) => (
              <div key={k} className="flex flex-col-reverse justify-end gap-1 border-b border-r border-hairline px-3 py-3.5 sm:px-5 sm:py-5">
                <dt className="pdp-label text-charcoal/70">{k}</dt>
                <dd className="pdp-fig break-words text-base font-medium tracking-[0.01em] text-charcoal-deep sm:text-xl">{v}</dd>
              </div>
            ))}
          </dl>
          {desc && (
            <div className="mt-7 grid gap-3 sm:mt-10 md:grid-cols-[1fr_1.4fr] md:gap-14">
              <h2 className="text-[clamp(20px,2.2vw,26px)] leading-tight">{t("pdp", "about")}</h2>
              <p className="max-w-[64ch] whitespace-pre-line text-[15px] leading-[1.8] sm:text-base">{desc}</p>
            </div>
          )}
        </section>

        {reviews.length > 0 && (
          <section id="pdp-reviews" aria-labelledby="pdp-reviews-h" className={`scroll-mt-24 pt-10 sm:pt-14 ${related.length > 0 ? "" : "pb-16 sm:pb-24"}`}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 id="pdp-reviews-h" className="text-[clamp(26px,3.2vw,40px)] leading-[1.1]">{t("reviews", "pdpH")}</h2>
              {reviewAverage != null && <ReviewSummary average={reviewAverage} count={reviewCount} lang={lang} />}
            </div>
            {/* The piece is this page, so the cards do not repeat its name. */}
            <ReviewGrid reviews={reviews} lang={lang} showPiece={false} />
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="pdp-related" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
            <div className="mb-6 flex items-end justify-between gap-5">
              <h2 id="pdp-related" className="text-[clamp(30px,4vw,52px)] leading-[1.08]">{t("pdp", "related")}</h2>
              <Link href={crumb?.href ?? "/collections"} className="shrink-0 border-b border-gold-dark pb-0.5 text-sm font-medium text-gold-dark hover:text-charcoal-deep">{t("collection", "viewAll")}</Link>
            </div>
            <RelatedGrid pieces={related} lang={lang} />
          </section>
        )}
      </div>

      {buyable && variant && price != null && (
        <BuyBar watch="pdp-atc" price={formatMoney(price)} name={name} label={t("pdp", "buyBar")} variantId={variant.id} slug={p.slug} sku={p.sku} lang={lang} />
      )}
    </>
  );
}

function MessengerButton({ href, lang }: { href: string; lang: Lang }) {
  return (
    <Button asChild variant="outline" className="h-full w-full whitespace-nowrap px-4">
      <MessengerAnchor href={href}>
        <SocialGlyph name="messenger" size={18} />
        {tr(lang)("social", "messenger")}
      </MessengerAnchor>
    </Button>
  );
}

function RelatedGrid({ pieces, lang }: { pieces: Product[]; lang: Lang }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[834px]:grid-cols-3 min-[834px]:gap-x-6 min-[834px]:gap-y-8 lg:grid-cols-4">
      {pieces.map((x, i) => <ProductCard key={x.slug} product={x} lang={lang} index={i} />)}
    </div>
  );
}
