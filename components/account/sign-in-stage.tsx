import { HubImage } from "@/components/media/hub-image";
import type { HeroPiece } from "@/lib/hero-deck";

/**
 * THE SIGN-IN PAGE'S STAGE (build step 4, D4-4): the hero's dark stage — the
 * pool of light, the gold floor, the cut-out shadow — with up to three real
 * pieces standing on it, chosen by `stagePieces` exactly as the hero and the
 * category banner choose them (components/catalog/category-stage.tsx, whose
 * CSS this reuses). A piece without a hero cut-out stands in its framed well,
 * never cropped. With nothing in stock there is no stage.
 *
 * Decorative here: the pictures are not links and are hidden from screen
 * readers; the list beside them says what the account holds.
 */
function placeOf(j: number, n: number): number {
  return n === 3 ? (j + 1) % 3 : j;
}

export function SignInStage({ pieces }: { pieces: HeroPiece[] }) {
  const n = pieces.length;
  if (n === 0) return null;
  return (
    <div aria-hidden="true" className="cs-stage !h-[150px] [--floor:18px] sm:!h-[240px] lg:!flex-none" data-count={n}>
      <span className="cs-floor" />
      {pieces.map((p, j) => {
        const place = placeOf(j, n);
        const photo = p.photos[0];
        const c = photo.cutout;
        return (
          <span
            key={p.slug}
            className="cs-pc"
            data-place={place}
            data-feat={n === 3 ? (place === 1 ? "" : undefined) : ""}
            data-framed={c ? undefined : ""}
          >
            <span className="cs-shadow" />
            {c ? (
              <span className="cs-cut"><HubImage src={c.url} alt="" fill sizes="(min-width:1024px) 240px, 40vw" className="object-contain object-bottom" /></span>
            ) : (
              <span className="cs-well"><span><HubImage src={photo.url} alt="" fill sizes="(min-width:1024px) 240px, 40vw" className="object-contain" /></span></span>
            )}
          </span>
        );
      })}
    </div>
  );
}
