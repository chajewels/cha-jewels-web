import Image from "next/image";
import Link from "next/link";

import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale";
import { lumiereArrivals } from "@/lib/content/lumiere-home";
import { getFeaturedProducts } from "@/lib/queries/products";
import { fromPrice, fromVariant, primaryImage } from "@/lib/product-facts";
import { isOptimizableImage } from "@/lib/image-hosts";
import { metalsLabel, productMetals } from "@/lib/metals";
import { productName } from "@/lib/catalog-i18n";
import { formatWeight } from "@/lib/utils";
import { isShowableArrival } from "@/components/home/arrival-card";
import { SalePrice } from "@/components/commerce/sale-price";
import { OriginBadge } from "@/components/catalog/origin-badge";
import { EngineIsland } from "@/components/lumiere/common/engine-island";

/**
 * NEW ARRIVALS — the Carousel Spotlight reference re-skinned (report §7 home
 * row; docs/design-refs/carousel-spotlight). A concave ring of the Hub's
 * featured pieces (`hub.featured`, `isShowableArrival` as the old deck: a
 * photo, a name and a price, or the piece is not shown; no section when none),
 * snapping to the piece that faces you. The dock under the ring carries the
 * front piece's name, metals and weight, its Hub price (the Sale strike
 * included), the origin badge (origin only through `origin-badge.tsx`) and
 * the link to the piece — one caption block per piece, server-rendered, shown
 * by the engine.
 *
 * Composition kept from the reference: masthead above the arc, the ghost
 * index behind it, the dock (counter · caption + dots · prev/next). Re-skinned
 * to the Lumière tokens: the paper surface, Instrument Serif, black pills, no
 * accent colour (D-4). The reference's brand header, nav, "Get access" pill,
 * edge labels and rating are not carried — the counter stands where the rating
 * was, the price in the caption.
 *
 * The ring's slots cycle the pieces (the reference fills 14 slots from 7
 * cards): enough slots that the ring reads as a ring, each piece appearing the
 * same number of times.
 */
const slotCount = (pieces: number) => Math.max(pieces, Math.ceil(10 / pieces) * pieces);
const pad2 = (n: number) => String(n).padStart(2, "0");

export const ARRIVALS_ID = "new-arrivals";

export const ArrivalsSection = async ({ lang }: { lang: Lang }) => {
  const strings = lumiereArrivals(lang);
  const featured = await getFeaturedProducts(8);
  const pieces = featured.filter(isShowableArrival).slice(0, 8);
  if (pieces.length === 0) return null;
  const slots = slotCount(pieces.length);
  const step = 360 / slots;

  return (
    <section
      id={ARRIVALS_ID}
      aria-labelledby="arrivals-heading"
      className="spotlight"
      data-count={pieces.length}
    >
      <EngineIsland engine="spotlight" target={ARRIVALS_ID} />
      <div className="spotlight__mast">
        <p className="spotlight__eyebrow font-manrope">{strings.eyebrow}</p>
        <h2 id="arrivals-heading" className="spotlight__headline font-serif">
          {strings.heading}
        </h2>
      </div>

      <div
        className="spotlight__stage"
        tabIndex={0}
        role="region"
        aria-label={strings.region}
        data-spotlight-stage
      >
        <div className="spotlight__floor" aria-hidden="true" />
        <div className="spotlight__ghost font-serif" aria-hidden="true" data-spotlight-ghost>
          01
        </div>
        <div className="spotlight__ring" data-spotlight-ring style={{ ["--rot" as string]: "0deg" }}>
          {Array.from({ length: slots }, (_, i) => {
            const piece = pieces[i % pieces.length];
            const image = primaryImage(piece)!;
            const name = productName(piece, lang);
            return (
              <article
                key={i}
                className={`spotlight__card${i === 0 ? " -front" : ""}`}
                data-slot={i}
                style={{ ["--a" as string]: `${(i * step).toFixed(4)}deg` }}
              >
                <div className="spotlight__card-inner">
                  <Image
                    src={image.url}
                    alt={image.alt ?? name}
                    fill
                    sizes="(max-width: 767.98px) 40vw, 17vw"
                    unoptimized={!isOptimizableImage(image.url)}
                    draggable={false}
                    className="spotlight__photo"
                  />
                  <span className="spotlight__scrim" aria-hidden="true" />
                  <span className="spotlight__no font-manrope">{pad2((i % pieces.length) + 1)}</span>
                  <span className="spotlight__checked font-manrope">
                    <span aria-hidden="true" className="spotlight__dot" />
                    {strings.checked}
                  </span>
                  <div className="spotlight__card-foot">
                    <h3 className="spotlight__card-title font-serif">{name}</h3>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <p className="spotlight__hint font-manrope" aria-hidden="true">
        {strings.hint}
      </p>

      <div className="spotlight__dock">
        <div className="spotlight__count font-manrope">
          <b className="font-serif" data-spotlight-cur>
            01
          </b>{" "}
          <i className="spotlight__of">
            / <span>{pad2(pieces.length)}</span>
          </i>
        </div>

        <div className="spotlight__dock-c">
          {pieces.map((piece, i) => {
            const name = productName(piece, lang);
            const price = fromPrice(piece)!;
            const shown = fromVariant(piece);
            const meta = [metalsLabel(productMetals(piece), lang), formatWeight(piece.weight_g)].filter(Boolean).join(" · ");
            return (
              <div
                key={piece.id}
                className="spotlight__caption"
                data-spotlight-caption={i}
                hidden={i !== 0}
                aria-hidden={i !== 0}
              >
                <h3 className="spotlight__title font-serif">{name}</h3>
                <div className="spotlight__sub font-manrope">
                  <span>{meta}</span>
                  <span className="spotlight__pip" aria-hidden="true" />
                  <span className="spotlight__price">
                    <SalePrice price={price} full={shown?.full_price_jpy} onSale={shown?.on_sale} lang={lang} tone="light" size="sm" />
                  </span>
                  <OriginBadge origin={piece.origin} brand={piece.brand} lang={lang} />
                </div>
                <Link
                  href={localePath(`/products/${piece.slug}`, lang)}
                  className="spotlight__pill font-tight"
                  data-analytics="arrivals-view-piece"
                >
                  {strings.detail}
                </Link>
              </div>
            );
          })}
          <div className="spotlight__dots" role="tablist" aria-label={strings.heading}>
            {pieces.map((piece, i) => (
              <button
                key={piece.id}
                type="button"
                role="tab"
                aria-selected={i === 0}
                aria-label={strings.goTo.replace("{name}", productName(piece, lang))}
                className={`spotlight__dotbtn${i === 0 ? " -on" : ""}`}
                data-spotlight-dot={i}
              />
            ))}
          </div>
          <span className="sr-only" aria-live="polite" data-spotlight-live data-template={strings.count}>
            {strings.count.replace("{n}", "1").replace("{total}", String(pieces.length))}
          </span>
        </div>

        <div className="spotlight__dock-r">
          <button type="button" className="spotlight__navbtn" aria-label={strings.prev} data-spotlight-prev>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="spotlight__navbtn" aria-label={strings.next} data-spotlight-next>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <p className="spotlight__all font-serif">
        <Link href={localePath("/collections", lang)} data-analytics="arrivals-view-all">
          {strings.viewAll} <span aria-hidden="true">→</span>
        </Link>
      </p>

    </section>
  );
};
