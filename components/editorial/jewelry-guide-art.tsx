/**
 * THE JEWELRY GUIDE'S DIAMOND 4C SCALES (app/jewelry-guide; owner decisions
 * 2026-10-27). The infographic around the diamond photograph: one scale per
 * C, every label real page text. Grade names are GIA's (4cs.gia.edu, read
 * 2026-10-27); words arrive as props from lib/content/jewelry-guide.ts.
 *
 * Palette: Assay Gold (#8A6B12) for lines and marks that carry meaning (5.01:1
 * on white, so they pass 3:1 as graphics — scripts/check-contrast.mjs), Ink
 * Charcoal for type, Ledger Hairline for edges. The colour strip's tints are
 * illustrative only, edged in hairline so the near-white end stays visible.
 *
 * The ring and necklace sections use images moved by code
 * (components/editorial/ring-sizer.tsx, necklace-sizer.tsx); the clasps are
 * photographs.
 */
const ASSAY = "#8A6B12";

const COLOR_GRADES = "DEFGHIJKLMNOPQRSTUVWXYZ".split("");
const COLOR_MARKED = new Set(["D", "G", "J", "M", "Z"]);
export const CLARITY_GRADES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"] as const;
export const CUT_GRADES = ["Excellent", "Very Good", "Good", "Fair", "Poor"] as const;
const CARATS = [0.5, 1, 1.5, 2] as const;

/** Colourless (D) to light yellow (Z), one cell per grade, D G J M Z named. */
export function ColorScale({ from, to, sr }: { from: string; to: string; sr: string }) {
  // White to a light yellow, evenly; illustrative, not a grading reference.
  const tint = (k: number) => {
    const t = k / (COLOR_GRADES.length - 1);
    const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
    return `rgb(${mix(255, 242)} ${mix(255, 220)} ${mix(255, 138)})`;
  };
  return (
    <figure>
      <figcaption className="sr-only">{sr}</figcaption>
      <div aria-hidden="true">
        <div className="grid grid-cols-[repeat(23,minmax(0,1fr))] border border-hairline">
          {COLOR_GRADES.map((g, k) => <span key={g} className="h-7" style={{ backgroundColor: tint(k) }} />)}
        </div>
        <div className="mt-1 grid grid-cols-[repeat(23,minmax(0,1fr))] text-center font-display text-sm text-charcoal-deep">
          {COLOR_GRADES.map((g) => <span key={g}>{COLOR_MARKED.has(g) ? g : ""}</span>)}
        </div>
        <div className="mt-1 flex justify-between gap-3 text-xs text-charcoal/80"><span>{from}</span><span>{to}</span></div>
      </div>
    </figure>
  );
}

/** FL to I3, best first; each grade a step further along a gold rule. */
export function ClarityScale({ from, to, sr }: { from: string; to: string; sr: string }) {
  return (
    <div>
      <ol aria-label={sr} className="grid grid-cols-6 gap-1">
        {CLARITY_GRADES.map((g, k) => (
          <li
            key={g}
            className="border border-hairline bg-white py-1.5 text-center text-[11px] font-semibold text-charcoal-deep [font-variant-numeric:lining-nums_tabular-nums]"
            style={{ boxShadow: `inset 0 -3px 0 color-mix(in srgb, ${ASSAY} ${Math.round(100 - k * 8)}%, transparent)` }}
          >{g}</li>
        ))}
      </ol>
      <div aria-hidden="true" className="mt-1.5 flex justify-between gap-3 text-xs text-charcoal/80"><span>{from}</span><span>{to}</span></div>
    </div>
  );
}

/** Excellent to Poor, as five ranked steps. */
export function CutScale({ from, to, sr }: { from: string; to: string; sr: string }) {
  return (
    <div>
      <ol aria-label={sr} className="grid grid-cols-5 gap-1">
        {CUT_GRADES.map((g, k) => (
          <li key={g} className="flex flex-col">
            <span aria-hidden="true" className="h-2" style={{ backgroundColor: ASSAY, opacity: 1 - k * 0.19 }} />
            <span className="mt-1.5 text-center text-[11px] leading-tight text-charcoal-deep">{g}</span>
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className="mt-1.5 flex justify-between gap-3 text-xs text-charcoal/80"><span>{from}</span><span>{to}</span></div>
    </div>
  );
}

/**
 * Round brilliants of 0.5, 1, 1.5 and 2 ct, drawn to scale WITH EACH OTHER:
 * stones of one cut have the same proportions, so their width grows with the
 * cube root of their weight. Not to real size.
 */
export function CaratScale({ unit, note, sr }: { unit: string; note: string; sr: string }) {
  const unitW = 30; // the 1 ct stone's width in the drawing
  const gap = 14;
  const widths = CARATS.map((ct) => unitW * Math.cbrt(ct));
  const xs = widths.map((_, k) => widths.slice(0, k).reduce((a, w) => a + w + gap, 0));
  const W = xs[xs.length - 1] + widths[widths.length - 1];
  const H = Math.max(...widths);
  return (
    <figure>
      <figcaption className="sr-only">{sr}</figcaption>
      <svg viewBox={`-2 -2 ${W + 4} ${H + 18}`} className="h-auto w-full max-w-[320px]" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="jg-stone" cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.65" stopColor="#EEF0F2" />
            <stop offset="1" stopColor="#C4C9CF" />
          </radialGradient>
        </defs>
        {CARATS.map((ct, k) => {
          const w = widths[k];
          const cx = xs[k] + w / 2;
          const cy = H - w / 2;
          return (
            <g key={ct}>
              <TopView cx={cx} cy={cy} r={w / 2} />
              <text x={cx} y={H + 12} textAnchor="middle" fontSize={7.5} fill="#222222" className="font-sans [font-variant-numeric:lining-nums_tabular-nums]">{ct.toFixed(1)} ct</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 font-display text-lg text-gold-dark">{unit}</p>
      <p className="mt-1 text-xs text-charcoal/80">{note}</p>
    </figure>
  );
}

/** A round brilliant from above: girdle, octagonal table, star and upper-girdle facets. */
function TopView({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pt = (rad: number, deg: number) => [cx + rad * Math.cos((deg * Math.PI) / 180), cy + rad * Math.sin((deg * Math.PI) / 180)] as const;
  const table = Array.from({ length: 8 }, (_, k) => pt(r * 0.56, k * 45 + 22.5));
  const stars = Array.from({ length: 8 }, (_, k) => pt(r * 0.8, k * 45));
  const rim = Array.from({ length: 16 }, (_, k) => pt(r, k * 22.5 + 11.25));
  return (
    <g strokeLinejoin="round">
      <circle cx={cx} cy={cy} r={r} fill="url(#jg-stone)" stroke="#9AA1A9" strokeWidth={0.6} />
      <g fill="none" stroke="#9AA1A9" strokeWidth={0.35}>
        <polygon points={table.map((p) => p.join(",")).join(" ")} />
        {stars.map((s, k) => {
          const a = table[(k + 7) % 8];
          const b = table[k];
          return <polyline key={k} points={`${a.join(",")} ${s.join(",")} ${b.join(",")}`} />;
        })}
        {rim.map((p, k) => <line key={k} x1={stars[Math.floor(((k + 1) % 16) / 2)][0]} y1={stars[Math.floor(((k + 1) % 16) / 2)][1]} x2={p[0]} y2={p[1]} />)}
      </g>
    </g>
  );
}
