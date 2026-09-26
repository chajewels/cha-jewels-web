import Link from "next/link";
import { HubImage } from "@/components/media/hub-image";
import type { HeroPiece } from "@/lib/hero-deck";

/**
 * THE CATEGORY BANNER WHEN THE HUB HAS NO CATEGORY PHOTO (owner rule
 * 2026-09-26: no brand logos as decoration, brand names in text only — the
 * bundled category photos with Bvlgari, Cartier, Rolex, YSL, Gucci… marks are
 * gone, and no bundled photo stands in for any category any more).
 *
 * The same dark stage as the hero's category slides (app/globals.css "HERO
 * v3"; here "CATEGORY STAGE"): the warm pool of light, the gold floor, and up
 * to three of the category's own in-stock pieces standing on it, chosen by
 * `stagePieces` (lib/hero-deck.ts) exactly as the hero chooses them. Each
 * piece is its cut-out when the Hub (or the interim bundled set) has one fit
 * to show, else its WHOLE photo in a framed well, never cropped. A trio stands
 * featured-in-the-centre with the other two set back; a duo and a single stand
 * on their own. There is never an empty place.
 *
 * With nothing in stock the band carries the text alone: no photo, no empty
 * stage.
 *
 * It is still: the hero carries the motion, and this band sits above the
 * product grid. The piece's own link is its picture; the name is read out for
 * screen readers, and the grid below carries the names and prices.
 */

/** A trio stands with the Hub's first piece in the centre. */
function placeOf(j: number, n: number): number {
  return n === 3 ? (j + 1) % 3 : j;
}

const PIECE_SIZES = "(min-width:1024px) 400px, 60vw";

export function CategoryStage({ pieces, eyebrow, title, description }: { pieces: HeroPiece[]; eyebrow: string; title: string; description: string | null }) {
  const n = pieces.length;
  return (
    <div className="cs mb-10" data-count={n}>
      <div aria-hidden="true" className="cs-pool" />
      {n > 0 && (
        <div className="cs-stage" data-count={n}>
          <span aria-hidden="true" className="cs-floor" />
          {pieces.map((p, j) => {
            const place = placeOf(j, n);
            const photo = p.photos[0];
            const c = photo.cutout;
            // THE PAGE'S LARGEST PAINT is the first piece (the featured one):
            // the one priority image on the page (components/media/hub-image.tsx).
            const priority = j === 0;
            return (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="cs-pc"
                data-place={place}
                data-feat={n === 3 ? (place === 1 ? "" : undefined) : ""}
                data-framed={c ? undefined : ""}
              >
                <span aria-hidden="true" className="cs-shadow" />
                {c ? (
                  <span className="cs-cut"><HubImage src={c.url} alt="" fill priority={priority} sizes={PIECE_SIZES} className="object-contain object-bottom" /></span>
                ) : (
                  <span className="cs-well"><span><HubImage src={photo.url} alt="" fill priority={priority} sizes={PIECE_SIZES} className="object-contain" /></span></span>
                )}
                <span className="sr-only">{p.name}</span>
              </Link>
            );
          })}
        </div>
      )}
      <div className="cs-copy">
        <p className="cs-eyebrow">{eyebrow}</p>
        <h1 className="cs-title">{title}</h1>
        {description && <p className="cs-desc">{description}</p>}
      </div>
    </div>
  );
}
