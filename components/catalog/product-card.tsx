import Link from "next/link";
import { fromPrice, fromVariant, type Product } from "@/lib/queries/products";
import { CardFx } from "@/components/fx/card-fx";
import { ComponentStyle } from "@/components/fx/component-style";
import { HubImage } from "@/components/media/hub-image";
import { formatMoney, formatYenPeso, isFigure } from "@/lib/utils";
import { metalsLabel, productMetals } from "@/lib/metals";
import { tr, type Lang } from "@/lib/i18n";
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
 * ONE HOVER RESPONSE (DESIGN.md, the One Quiet Hover Rule): the gold top rule
 * draws in. No tilt, glint or photo swap; CardFx is kept for the entrance
 * only (`quiet`).
 *
 * A SOLD CARD is shown, quietly: the photo and price muted — the price is not
 * struck through, a strike reads as a discount (D2-5) — and no reserve line.
 * It still opens the piece.
 *
 * `index` is the card's place in its grid (the entrance runs row by row);
 * `priority` marks the first row's photos, a grid page's largest paint.
 */
const CSS = `
.pcard-rule { position: absolute; inset: 0 0 auto 0; height: 2px; z-index: 2; background: linear-gradient(90deg, var(--c-gold-dark), var(--c-gold), var(--c-gold-dark)); transform: scaleX(0); transform-origin: left; transition: transform var(--dur-reveal) var(--ease-lux); }
.pcard:hover .pcard-rule, .pcard:focus-visible .pcard-rule { transform: scaleX(1); }
.pcard-cut { position: absolute; inset: 10%; filter: drop-shadow(0 14px 14px rgb(35 29 18 / .18)); }
.pcard[data-sold] .pcard-pic { opacity: .55; filter: grayscale(.4); }
.pcard-name { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px; line-height: 1.45; font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1; }
:lang(ja) .pcard-name { font-family: var(--font-jp), serif; font-weight: 500; font-size: 12.5px; line-height: 1.6; letter-spacing: 0; }
@media (min-width: 640px) { .pcard-name { font-size: 15px; } :lang(ja) .pcard-name { font-size: 14px; } }
.pcard-fig { font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; }
.badge-status { display: inline-flex; align-items: center; min-height: 24px; padding: 3px 10px; font-size: 11px; font-weight: 600; line-height: 1.3; letter-spacing: .12em; text-transform: uppercase; }
:lang(ja) .badge-status { letter-spacing: .04em; text-transform: none; }
@media (prefers-reduced-motion: reduce) { .pcard-rule { transition: none; } }`;

export function ProductCard({ product, lang, index = 0, priority = false }: { product: Product; lang: Lang; index?: number; priority?: boolean }) {
  const t = tr(lang);
  const price = fromPrice(product);
  // The reserve figures belong to the variant whose price is shown, and are
  // the Hub's own (down_payment_jpy / down_payment_php) — never price × 30%.
  const dpVariant = fromVariant(product);
  const dpJpy = dpVariant?.down_payment_jpy;
  const dpPhp = dpVariant?.down_payment_php;
  const metals = productMetals(product);
  const spec = [metals.length ? metalsLabel(metals, lang) : null, product.weight_g ? `${product.weight_g} g` : null].filter(Boolean).join(" · ");
  const img = cardImage(product);
  const name = productName(product, lang);
  // The SAME word the product page shows (lib/availability.ts).
  const avail = productAvailability(product);
  const sold = !isBuyable(avail);
  const preloved = product.condition === "Preloved";
  return (
    <CardFx index={index} tilt={false} quiet className="h-full">
      <ComponentStyle id="fx-pcard" css={CSS} />
      <Link href={`/products/${product.slug}`} data-sold={sold ? "" : undefined} className="pcard relative flex h-full flex-col bg-white">
        <span aria-hidden="true" className="pcard-rule" />
        <div className="relative aspect-square overflow-hidden bg-chalk">
          {img ? (
            <span className={`pcard-pic ${img.kind === "cut" ? "pcard-cut" : "absolute inset-0"}`}>
              <HubImage src={img.src} alt={img.alt?.trim() || name} fill priority={priority} sizes="(min-width:1024px) 25vw, (min-width:834px) 33vw, 50vw" className="object-contain" />
            </span>
          ) : <GoldMotif />}
          {(sold || preloved) && (
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
              {sold && <span className="badge-status bg-charcoal-deep text-chalk">{t("product", availabilityKey(avail))}</span>}
              {preloved && <span className="badge-status border border-hairline bg-chalk text-charcoal/70">{t("collection", "filterPreloved")}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-2.5 pb-3.5 pt-3 sm:px-4 sm:pb-[18px] sm:pt-4">
          <div className="empty:hidden"><OriginBadge origin={product.origin} brand={product.brand} lang={lang} /></div>
          {/* h2: the card sits directly under the page's h1 (axe heading-order). */}
          <h2 className="pcard-name font-display text-charcoal-deep">{name}</h2>
          {spec && <p className="pcard-fig text-[12px] font-medium tracking-[0.04em] text-gold-dark">{spec}</p>}
          {price != null && (
            <p className={`pcard-fig mt-auto pt-2 font-display text-[18px] leading-tight sm:text-[22px] ${sold ? "text-charcoal/70" : "text-charcoal-deep"}`}>{formatMoney(price)}</p>
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
  return <svg viewBox="0 0 200 200" fill="none" stroke="#8A6B12" strokeWidth="1" aria-hidden="true" className="absolute inset-0 m-auto h-[46%] w-[46%] opacity-55"><circle cx="100" cy="100" r="62" /><circle cx="100" cy="100" r="54" strokeOpacity=".5" /><path d="M100 30 L108 44 L100 52 L92 44 Z" strokeWidth="1.2" /></svg>;
}
