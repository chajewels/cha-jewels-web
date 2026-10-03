import { TierIconStyle } from "@/components/fx/tier-icon-style";
import { TierCoin } from "@/components/fx/tier-coin";

/**
 * A LOYALTY TIER'S MEDALLION — the mark at the top of its card on /loyalty.
 * Original inline SVG, colours sampled from Cynthia's reference artwork: a
 * disc in the tier's gradient (left → right), a thin gold ring, and the
 * tier's symbol. No text is baked in: the card's <h3> carries the name, so
 * the whole mark is aria-hidden.
 *
 * Picked by the Hub's tier SLUG, never by position — a tier added between two
 * others must not take its neighbour's crown. An unknown slug gets DEFAULT, a
 * plain medallion that claims no rank.
 *
 * Explicit width and height (no layout shift), no request. The motion lives
 * in tier-icon-style.tsx and is started by the ladder
 * (components/fx/tier-ladder.tsx) lighting the card.
 *
 * UPGRADE (owner decision A, 2026-10-03): the disc sits in an engraved gold
 * rim — a bevelled outer ring and a hairline inner ring — with an inner
 * shadow and a top highlight so it reads as struck metal; the whole coin
 * rises and catches one pass of light on arrival (every tier), the Crown
 * carries a breathing gold aura, and on a fine pointer the coin tilts after
 * the cursor (TierCoin, the only script here). The tier symbols and their
 * idle motion are the original artwork's, unchanged.
 */

type Mark = { from: string; to: string; symbol: React.ReactNode; kind: string };

const GOLD_RING = "#E8C37D";

/** A point star, outer radius R, inner r, centred on 32,32, first point up. */
function star(points: number, R: number, r: number) {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI / points) * i - Math.PI / 2;
    const d = i % 2 ? r : R;
    out.push(`${(32 + d * Math.cos(a)).toFixed(2)},${(32 + d * Math.sin(a)).toFixed(2)}`);
  }
  return out.join(" ");
}

const MARKS: Record<string, Mark> = {
  glimmer: {
    kind: "glimmer", from: "#795384", to: "#CC7C73",
    symbol: (
      <g className="ti-sym">
        <polygon className="ti-star" points={star(5, 15, 6.4)} fill="#E8C37D" />
        {/* The glint: a four-point spark off the star's shoulder. */}
        <path className="ti-glint" d="M44 18 l1.2 3.3 3.3 1.2 -3.3 1.2 -1.2 3.3 -1.2 -3.3 -3.3 -1.2 3.3 -1.2z" fill="#FFF6E0" />
      </g>
    ),
  },
  radiant: {
    kind: "radiant", from: "#925871", to: "#D8936A",
    symbol: (
      <g className="ti-sym">
        <g className="ti-rays" stroke="#E0B556" strokeWidth="1.4" strokeLinecap="round">
          {[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1="32" y1="12.5" x2="32" y2="9" transform={`rotate(${a + 30} 32 32)`} />)}
        </g>
        <polygon points={star(6, 15, 8.2)} fill="#E0B556" />
      </g>
    ),
  },
  elite: {
    kind: "elite", from: "#533431", to: "#834343",
    symbol: (
      // A brilliant cut seen from the side: table, crown facets, girdle,
      // pavilion to the culet.
      <g className="ti-sym">
        <path d="M23 19 H41 L50 27 L32 47 L14 27 Z" fill="#FBF0DA" />
        <g fill="none" stroke="#C9A227" strokeWidth=".9" strokeLinejoin="round">
          <path d="M14 27 H50" />
          <path d="M23 19 L20 27 L32 47 L44 27 L41 19" />
          <path d="M28 19 L26 27 L32 47 L38 27 L36 19" />
          <path d="M20 27 L28 19 M44 27 L36 19 M26 27 L32 19 L38 27" />
        </g>
        <path d="M23 19 H41 L50 27 L32 47 L14 27 Z" fill="none" stroke="#C9A227" strokeWidth="1" strokeLinejoin="round" />
        {/* Light crossing the facets, clipped to the stone. */}
        <g clipPath="url(#ti-elite-stone)">
          <rect className="ti-facet-light" x="4" y="14" width="8" height="38" fill="#FFFFFF" transform="skewX(-18)" />
        </g>
        <circle className="ti-flash" cx="32" cy="19" r="2.4" fill="#FFFFFF" />
      </g>
    ),
  },
  "crown-vip": {
    kind: "crown", from: "#5E3231", to: "#793832",
    symbol: (
      <g className="ti-sym">
        <path d="M18 40 L15.5 24 L22.5 31 L24.5 20 L29 29 L32 17.5 L35 29 L39.5 20 L41.5 31 L48.5 24 L46 40 Z" fill="#FCEDD6" strokeLinejoin="round" />
        <rect x="18" y="41.5" width="28" height="3.2" rx="1" fill="#FCEDD6" />
        {[[15.5, 23], [24.5, 19], [32, 16.5], [39.5, 19], [48.5, 23]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.9" fill="#FCEDD6" />)}
        <g clipPath="url(#ti-crown-shape)">
          <rect className="ti-shimmer" x="0" y="12" width="7" height="36" fill="#E8C37D" transform="skewX(-18)" />
        </g>
      </g>
    ),
  },
};

/** Unknown slug: the tier's disc and ring, a small gold star, no rank implied. */
const DEFAULT: Mark = {
  kind: "default", from: "#6E5A4E", to: "#A4876A",
  symbol: <g className="ti-sym"><polygon points={star(5, 10, 4.3)} fill="#E8C37D" /></g>,
};

export function tierMark(slug: string): Mark {
  return MARKS[slug.trim().toLowerCase().replace(/[\s_]+/g, "-")] ?? DEFAULT;
}

/**
 * `sm` px on phones, `lg` from lg up. The attributes carry `sm` so the box is
 * sized before any CSS; the component stylesheet (inline in <head>, so it is
 * there at first paint) switches to `lg` — no shift either way.
 */
export function TierIcon({ slug, sm = 72, lg = 88 }: { slug: string; sm?: number; lg?: number }) {
  const m = tierMark(slug);
  // Ids are per kind: a page shows each tier once, and the default mark uses no id.
  const g = `ti-g-${m.kind}`;
  const k = m.kind;
  return (
    <span aria-hidden="true" className="ti" data-ti={k} style={{ ["--ti-sm" as string]: `${sm}px`, ["--ti-lg" as string]: `${lg}px` }}>
      <TierIconStyle />
      <TierCoin>
      <svg viewBox="0 0 64 64" width={sm} height={sm} focusable="false">
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={m.from} />
            <stop offset="1" stopColor={m.to} />
          </linearGradient>
          <radialGradient id={`ti-glow-${k}`}>
            <stop offset="0" stopColor="#FFF6E0" stopOpacity="1" />
            <stop offset="1" stopColor="#FFF6E0" stopOpacity="0" />
          </radialGradient>
          {/* The rim: brushed gold, lit from the upper left, dark at the lower right. */}
          <linearGradient id={`ti-rim-${k}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F3DFA4" />
            <stop offset=".35" stopColor="#C9A227" />
            <stop offset=".62" stopColor="#8C6A14" />
            <stop offset="1" stopColor="#E5C860" />
          </linearGradient>
          {/* Depth: the disc darkens toward its edge, as a struck coin does. */}
          <radialGradient id={`ti-depth-${k}`} cx=".5" cy=".5" r=".5">
            <stop offset=".62" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".42" />
          </radialGradient>
          {/* The sheen: one soft band of light that crosses the disc on arrival. */}
          <linearGradient id={`ti-sheen-${k}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFF6E0" stopOpacity="0" />
            <stop offset=".5" stopColor="#FFF6E0" stopOpacity=".55" />
            <stop offset="1" stopColor="#FFF6E0" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`ti-disc-${k}`}><circle cx="32" cy="32" r="27" /></clipPath>
          {k === "crown" && (
            <radialGradient id="ti-aura-crown" cx=".5" cy=".5" r=".5">
              <stop offset=".55" stopColor="#E5C860" stopOpacity=".55" />
              <stop offset="1" stopColor="#E5C860" stopOpacity="0" />
            </radialGradient>
          )}
          {m.kind === "elite" && <clipPath id="ti-elite-stone"><path d="M23 19 H41 L50 27 L32 47 L14 27 Z" /></clipPath>}
          {m.kind === "crown" && <clipPath id="ti-crown-shape"><path d="M18 40 L15.5 24 L22.5 31 L24.5 20 L29 29 L32 17.5 L35 29 L39.5 20 L41.5 31 L48.5 24 L46 40 Z M18 41.5 H46 V44.7 H18 Z" /></clipPath>}
        </defs>
        {k === "crown" && <circle className="ti-aura" cx="32" cy="32" r="38" fill="url(#ti-aura-crown)" />}
        {/* Rim: a bevelled gold ring with a dark seat under it, and the hairline inner ring. */}
        <circle cx="32" cy="32" r="31.5" fill="#2A1F12" />
        <circle className="ti-rim" cx="32" cy="32" r="29.6" fill="none" stroke={`url(#ti-rim-${k})`} strokeWidth="3.2" />
        <circle cx="32" cy="32" r="27" fill={`url(#${g})`} />
        <circle cx="32" cy="32" r="27" fill={`url(#ti-depth-${k})`} />
        <circle cx="32" cy="32" r="25.6" fill="none" stroke={GOLD_RING} strokeWidth=".8" opacity=".85" />
        {/* Top-left highlight on the disc, the light the rim is lit by. */}
        <path d="M12 24 A22 22 0 0 1 40 10.5" fill="none" stroke="#FFF6E0" strokeWidth="1.2" strokeLinecap="round" opacity=".28" />
        {m.symbol}
        <g clipPath={`url(#ti-disc-${k})`}>
          <rect className="ti-sheen" x="-26" y="0" width="22" height="64" fill={`url(#ti-sheen-${k})`} transform="skewX(-20)" />
        </g>
        {/* Brightness, as light laid over the mark (opacity only). */}
        <circle className="ti-glow" cx="32" cy="32" r="26" fill={`url(#ti-glow-${k})`} />
      </svg>
      </TierCoin>
    </span>
  );
}
