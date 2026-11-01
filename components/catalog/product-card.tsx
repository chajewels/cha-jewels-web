import Link from "next/link";
import { localePath } from "@/lib/locale";
import { fromPrice, fromVariant } from "@/lib/product-facts";
import type { Product } from "@/lib/types";
import { CardFx } from "@/components/fx/card-fx";
import { ComponentStyle } from "@/components/fx/component-style";
import { HubImage } from "@/components/media/hub-image";
import { formatWeight, formatYenPeso, isFigure } from "@/lib/utils";
import { SalePrice } from "@/components/commerce/sale-price";
import { metalsLabel, productMetals } from "@/lib/metals";
import { trOf } from "@/lib/i18n-client";
import { collection as collectionDict } from "@/lib/i18n/sections/collection";
import { product as productDict } from "@/lib/i18n/sections/product";
import { home as homeDict } from "@/lib/i18n/sections/home";
import { type Lang } from "@/lib/i18n-core";
import { productName } from "@/lib/catalog-i18n";
import { availabilityKey, isBuyable, productAvailability } from "@/lib/availability";
import { layawayOffered } from "@/lib/layaway-availability";
import { cardImage } from "@/lib/product-media";
import { OriginBadge } from "@/components/catalog/origin-badge";

/**
 * THE PRODUCT CARD (step 2 build; comp page-comps/product-collection, "New
 * product card"). Top to bottom:
 *
 *   well     a 1:1 chalk well: the cut-out standing with air around it, or
 *            the WHOLE photo contained, never cropped (lib/product-media.ts).
 *            Status badges sit on its corner: Sold, Preloved.
 *   body     the origin badge (OriginBadge: the Japanese-origin label only
 *            from Hub data, else the brand name as text), the EXACT Hub name
 *            in at most three lines, metal · weight as the Hub sends them, the
 *            yen price in lining figures, and — English only, and only when
 *            the Hub sent BOTH figures — "Down payment ¥… (₱…)". Nothing here
 *            is computed.
 *
 * ONE HOVER RESPONSE — LUMIÈRE, after Halden's catalogue (P4): a black pill band
 * slides up from the foot of the plate carrying "View details →", and the
 * photograph eases up a touch. No tilt, glint or photo swap (the product cards
 * stay 3D-free, D-4); CardFx is kept for the entrance only (`quiet`). On a
 * touch screen there is no hover, so no band — the whole card is the link.
 *
 * A SOLD CARD is shown, quietly: the photo and price muted, and no reserve
 * line. It still opens the piece.
 * D2-5 (revised 2026-10-15): a strike means a sale and only a sale — the Hub's
 * full_price_jpy struck beside the sale price. A sold piece is muted
 * (opacity/colour), never struck.
 *
 * `index` is the card's place in its grid (the entrance runs row by row);
 * `priority` marks the first row's photos, a grid page's largest paint.
 */
const CSS = `
.pcard-plate { position: relative; aspect-ratio: 4 / 5; overflow: hidden; border-radius: var(--corner-panel); background: #ebe6df; isolation: isolate; }
.pcard-pic { transition: transform 900ms var(--ease-lux); }
.pcard:hover .pcard-pic, .pcard:focus-visible .pcard-pic { transform: scale(1.035); }
.pcard-band { position: absolute; left: 10px; right: 10px; bottom: 10px; z-index: 3; display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: 0 18px; border-radius: 999px; background: #000; color: #fff; font-family: var(--font-manrope), "Helvetica Neue", Arial, sans-serif; font-size: 13px; font-weight: 500; letter-spacing: .02em; transform: translateY(calc(100% + 16px)); transition: transform 520ms var(--ease-lux); pointer-events: none; }
.pcard:hover .pcard-band, .pcard:focus-visible .pcard-band { transform: none; }
@media (hover: none) { .pcard-band { display: none; } }
.pcard-cut { position: absolute; inset: 10%; filter: drop-shadow(0 14px 14px rgb(35 29 18 / .18)); }
.pcard[data-sold] .pcard-pic { opacity: .55; filter: grayscale(.4); }
.pcard-name { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px; line-height: 1.45; font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1; }
:lang(ja) .pcard-name { font-family: var(--font-jp), serif; font-weight: 500; font-size: 12.5px; line-height: 1.6; letter-spacing: 0; }
@media (min-width: 640px) { .pcard-name { font-size: 15px; } :lang(ja) .pcard-name { font-size: 14px; } }
.pcard-fig { font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; }
.badge-status { display: inline-flex; align-items: center; min-height: 24px; padding: 3px 12px; border-radius: 999px; font-family: var(--font-manrope), "Helvetica Neue", Arial, sans-serif; font-size: 11px; font-weight: 600; line-height: 1.3; letter-spacing: .12em; text-transform: uppercase; }
:lang(ja) .badge-status { letter-spacing: .04em; text-transform: none; }
@media (prefers-reduced-motion: reduce) { .pcard-band, .pcard-pic { transition: none; } }`;

export function ProductCard({ product, lang, index = 0, priority = false }: { product: Product; lang: Lang; index?: number; priority?: boolean }) {
  const t = trOf({ collection: collectionDict, product: productDict, home: homeDict }, lang);
  const price = fromPrice(product);
  // The reserve figures belong to the variant whose price is shown, and are
  // the Hub's own (down_payment_jpy / down_payment_php) — never price × 30%.
  const dpVariant = fromVariant(product);
  const dpJpy = dpVariant?.down_payment_jpy;
  const dpPhp = dpVariant?.down_payment_php;
  const metals = productMetals(product);
  const spec = [metals.length ? metalsLabel(metals, lang) : null, formatWeight(product.weight_g)].filter(Boolean).join(" · ");
  const img = cardImage(product);
  const name = productName(product, lang);
  // The SAME word the product page shows (lib/availability.ts).
  const avail = productAvailability(product);
  const sold = !isBuyable(avail);
  const preloved = product.condition === "Preloved";
  return (
    <CardFx index={index} tilt={false} quiet className="h-full">
      <ComponentStyle id="fx-pcard" css={CSS} />
      <Link href={localePath(`/products/${product.slug}`, lang)} data-sold={sold ? "" : undefined} className="pcard relative flex h-full flex-col">
        <div className="pcard-plate">
          {img ? (
            <span className={`pcard-pic ${img.kind === "cut" ? "pcard-cut" : "absolute inset-0"}`}>
              <HubImage src={img.src} alt={img.alt?.trim() || name} fill priority={priority} sizes="(min-width:1024px) 25vw, (min-width:834px) 33vw, 50vw" className="object-contain" />
            </span>
          ) : <GoldMotif />}
          <span aria-hidden="true" className="pcard-band"><span>{t("home", "newDetail")}</span><span>→</span></span>
          {(sold || preloved) && (
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
              {sold && <span className="badge-status bg-charcoal-deep text-chalk">{t("product", availabilityKey(avail))}</span>}
              {preloved && <span className="badge-status border border-hairline bg-chalk text-charcoal/70">{t("collection", "filterPreloved")}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-1 pb-2 pt-3.5 sm:pt-4">
          <div className="empty:hidden"><OriginBadge origin={product.origin} brand={product.brand} lang={lang} /></div>
          {/* h2: the card sits directly under the page's h1 (axe heading-order). */}
          <h2 className="pcard-name font-display text-charcoal-deep">{name}</h2>
          {spec && <p className="pcard-fig font-manrope text-[12px] font-medium tracking-[0.04em] text-charcoal/70">{spec}</p>}
          {price != null && (
            <p className={`pcard-fig mt-auto pt-2 font-display text-[20px] leading-tight sm:text-[24px] ${sold ? "text-charcoal/70" : "text-charcoal-deep"}`}><SalePrice price={price} full={dpVariant?.full_price_jpy} onSale={dpVariant?.on_sale} sold={sold} lang={lang} tone="light" /></p>
          )}
          {/* No reserve line on a sold piece, on the Japanese site
              (layawayOffered), or when the Hub sent either figure short. */}
          {!sold && layawayOffered(lang) && isFigure(dpJpy) && isFigure(dpPhp) && (
            <p className="pcard-fig text-[12px] text-charcoal/70 sm:text-[12.5px]">{t("collection", "downPayment", { dp: formatYenPeso(dpJpy, dpPhp) })}</p>
          )}
        </div>
      </Link>
    </CardFx>
  );
}

function GoldMotif() {
  return <svg viewBox="0 0 200 200" fill="none" stroke="#2a2724" strokeWidth="1" aria-hidden="true" className="absolute inset-0 m-auto h-[46%] w-[46%] opacity-55"><circle cx="100" cy="100" r="62" /><circle cx="100" cy="100" r="54" strokeOpacity=".5" /><path d="M100 30 L108 44 L100 52 L92 44 Z" strokeWidth="1.2" /></svg>;
}
