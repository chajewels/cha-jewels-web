/**
 * THE JEWELRY GUIDE'S ILLUSTRATIONS (app/jewelry-guide; owner decisions
 * 2026-10-27). Original line drawings, inline SVG, in the site palette only:
 * Assay Gold (#8A6B12) for every line that carries meaning — chains, clasps,
 * the light ray, number rings: 5.01:1 on white, 4.59:1 on chalk, so they pass
 * 3:1 as graphics (scripts/check-contrast.mjs). Leaf Gold (#C9A227, 2.42:1 on
 * white) only for the ring's decorative band; Ink Charcoal (#222) for
 * measurement lines and type; Ledger Hairline (#E5E5E0) for guides; Pale
 * Gilt (#E8D28A) only as a fill.
 * No copy lives here: every label arrives as a prop from
 * lib/content/jewelry-guide.ts, so the drawings speak both languages.
 *
 * Each drawing repeats facts the text beside it already states, so it is
 * hidden from assistive tech (aria-hidden) rather than given alt text that
 * would read the same facts twice.
 */
const GOLD = "#C9A227";
const ASSAY = "#8A6B12";
const INK = "#222222";
const RULE = "#E5E5E0";
const PALE = "#E8D28A";
const LABEL = "font-sans text-[11px] [font-variant-numeric:lining-nums_tabular-nums]";

/** Ring seen face-on: the inside diameter across, the inside circumference around. */
export function RingDiagram({ diameter, circumference }: { diameter: string; circumference: string }) {
  return (
    <svg viewBox="0 0 260 230" className="h-auto w-full max-w-[300px]" aria-hidden="true" focusable="false">
      <defs>
        <marker id="jg-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 z" fill={INK} />
        </marker>
        <marker id="jg-arrow-gold" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill={INK} />
        </marker>
      </defs>
      {/* The band: a gold ring with a pale inner face. */}
      <circle cx="130" cy="105" r="80" fill="none" stroke={GOLD} strokeWidth="16" />
      <circle cx="130" cy="105" r="72" fill="none" stroke={PALE} strokeWidth="1.5" />
      {/* Inside circumference: the inner edge, traced. */}
      <path d="M 66 115 A 65 65 0 1 1 194 115" fill="none" stroke={INK} strokeWidth="1.2" strokeDasharray="3 4" markerEnd="url(#jg-arrow-gold)" />
      {/* Inside diameter: straight across the inside. */}
      <line x1="68" y1="105" x2="192" y2="105" stroke={INK} strokeWidth="1.4" markerStart="url(#jg-arrow)" markerEnd="url(#jg-arrow)" />
      <text x="130" y="97" textAnchor="middle" className={LABEL} fill={INK}>{diameter}</text>
      <text x="130" y="222" textAnchor="middle" className={LABEL} fill={INK}>{circumference}</text>
      <line x1="130" y1="171" x2="130" y2="208" stroke={RULE} strokeWidth="1" />
    </svg>
  );
}

/**
 * Neck, shoulders and bust in one line, with five chains falling to their
 * typical depths. The chains carry numbers 1–5 that match the list beside
 * the drawing, so no word has to fit inside it.
 */
export function NecklaceDiagram() {
  // [depth of the lowest point, how far the chain swings out at the bottom]
  const chains: [number, number][] = [[68, 12], [108, 34], [152, 56], [212, 80], [282, 104]];
  return (
    <svg viewBox="0 0 360 300" className="h-auto w-full max-w-[420px]" aria-hidden="true" focusable="false">
      {/* Silhouette: neck, shoulders, collarbones, bust. */}
      <g fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round">
        <path d="M150 0 V36 C150 56 122 64 72 74 C40 80 22 96 18 128 V300" />
        <path d="M210 0 V36 C210 56 238 64 288 74 C320 80 338 96 342 128 V300" />
      </g>
      <g fill="none" stroke={RULE} strokeWidth="1.2" strokeLinecap="round">
        <path d="M96 86 C124 94 150 96 172 90" />
        <path d="M264 86 C236 94 210 96 188 90" />
        <path d="M70 196 C96 232 146 238 176 214" />
        <path d="M290 196 C264 232 214 238 184 214" />
      </g>
      {/* The chains, choker (1) to rope (5). */}
      {chains.map(([depth, swing], i) => {
        const top = 42 + i * 3;
        return (
          <g key={depth}>
            <path d={`M${150 - i * 2} ${top} C ${150 - swing} ${depth}, ${210 + swing} ${depth}, ${210 + i * 2} ${top}`}
              fill="none" stroke={ASSAY} strokeWidth="2" strokeLinecap="round" />
            <circle cx="180" cy={top + (depth - top) * 0.75} r="9" fill="#fff" stroke={ASSAY} strokeWidth="1.2" />
            <text x="180" y={top + (depth - top) * 0.75 + 4} textAnchor="middle" className={LABEL} fill={INK}>{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** One clasp, drawn open-and-close simple: a line drawing in ink with the metal in gold. */
export function ClaspDrawing({ kind }: { kind: "spring" | "lobster" | "box" | "magnetic" | "hook" }) {
  const common = { fill: "none", stroke: INK, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const metal = { fill: "none", stroke: ASSAY, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 160 90" className="h-auto w-full max-w-[200px]" aria-hidden="true" focusable="false">
      {/* A short run of chain coming in from the left, the same on every drawing. */}
      <g {...common} stroke={RULE} strokeWidth={2}>
        <ellipse cx="14" cy="45" rx="8" ry="4.5" />
        <ellipse cx="27" cy="45" rx="8" ry="4.5" />
      </g>
      {kind === "spring" && (
        <>
          <ellipse cx="42" cy="45" rx="7" ry="5" {...metal} />
          {/* The ring, with its gap and the lever that opens it. */}
          <path d="M 96 26 A 21 21 0 1 0 113 38" {...metal} />
          <path d="M 96 26 L 104 30" {...common} />
          <rect x="102" y="24" width="10" height="6" rx="1" {...common} transform="rotate(25 107 27)" />
          {/* The end ring it catches, on the other half of the chain. */}
          <circle cx="128" cy="45" r="7" {...metal} />
          <g {...common} stroke={RULE} strokeWidth={2}><ellipse cx="144" cy="45" rx="8" ry="4.5" /></g>
        </>
      )}
      {kind === "lobster" && (
        <>
          <ellipse cx="42" cy="45" rx="7" ry="5" {...metal} />
          {/* The claw: a curved body open at the front, its sprung gate, and the thumb lever on top. */}
          <path d="M 50 45 C 52 30, 72 22, 92 23 C 110 24, 119 38, 114 52 C 110 62, 96 66, 86 60" {...metal} />
          <path d="M 50 45 C 56 56, 70 60, 82 58" {...metal} />
          <path d="M 86 60 L 84 49 L 100 42" {...common} />
          <path d="M 66 27 L 70 18 L 80 20" {...common} />
          <circle cx="128" cy="45" r="7" {...metal} />
          <g {...common} stroke={RULE} strokeWidth={2}><ellipse cx="144" cy="45" rx="8" ry="4.5" /></g>
        </>
      )}
      {kind === "box" && (
        <>
          {/* The tongue, folded and sprung, entering the box. */}
          <path d="M 36 38 H 70 L 80 45 L 70 52 H 36" {...metal} />
          <path d="M 44 45 H 74" {...common} />
          {/* The box, and the figure-eight safety catch on its side. */}
          <rect x="78" y="31" width="46" height="28" rx="2" {...metal} />
          <rect x="84" y="37" width="34" height="16" rx="1" {...common} stroke={RULE} />
          <path d="M 101 31 C 96 20, 112 16, 110 26 C 108 34, 92 26, 101 31" {...common} />
          <g {...common} stroke={RULE} strokeWidth={2}><ellipse cx="136" cy="45" rx="8" ry="4.5" /><ellipse cx="149" cy="45" rx="8" ry="4.5" /></g>
        </>
      )}
      {kind === "magnetic" && (
        <>
          {/* Two capped ends, a breath apart, drawn to each other. */}
          <rect x="38" y="34" width="34" height="22" rx="4" {...metal} />
          <rect x="88" y="34" width="34" height="22" rx="4" {...metal} />
          <path d="M 76 38 C 79 42, 79 48, 76 52" {...common} />
          <path d="M 84 38 C 81 42, 81 48, 84 52" {...common} />
          <path d="M 70 28 C 76 22, 84 22, 90 28" {...common} stroke={RULE} />
          <path d="M 70 62 C 76 68, 84 68, 90 62" {...common} stroke={RULE} />
          <g {...common} stroke={RULE} strokeWidth={2}><ellipse cx="133" cy="45" rx="8" ry="4.5" /><ellipse cx="146" cy="45" rx="8" ry="4.5" /></g>
        </>
      )}
      {kind === "hook" && (
        <>
          <ellipse cx="42" cy="45" rx="7" ry="5" {...metal} />
          {/* An S-hook through the ring on the other end. */}
          <path d="M 50 45 C 60 45, 66 30, 80 30 C 94 30, 96 45, 86 50 C 76 55, 80 62, 92 62 C 104 62, 106 52, 102 46" {...metal} />
          <circle cx="114" cy="48" r="8" {...metal} />
          <g {...common} stroke={RULE} strokeWidth={2}><ellipse cx="131" cy="48" rx="8" ry="4.5" /><ellipse cx="144" cy="48" rx="8" ry="4.5" /></g>
        </>
      )}
    </svg>
  );
}

/**
 * A round brilliant in profile with one ray of light going in through the top
 * and coming back out (cut), beside the colour scale, the clarity scale and
 * the carat's weight. Labels are props.
 */
export function DiamondDiagram({ labels }: {
  labels: { crown: string; girdle: string; pavilion: string; light: string; colorFrom: string; colorTo: string; clarityFrom: string; clarityTo: string; caratUnit: string };
}) {
  return (
    <svg viewBox="0 0 300 300" className="h-auto w-full max-w-[380px]" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="jg-dz" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={PALE} />
        </linearGradient>
        <marker id="jg-ray" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill={ASSAY} />
        </marker>
      </defs>
      {/* The stone: table, crown, girdle, pavilion, culet. */}
      <g fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
        <path d="M110 46 H190 L230 72 V77 L150 160 L70 77 V72 Z" fill="#fff" />
        <path d="M70 72 H230 M70 77 H230" />
        <path d="M110 46 L128 72 L150 46 L172 72 L190 46 M150 160 L128 77 M150 160 L172 77 M150 160 L100 77 M150 160 L200 77" stroke={RULE} />
      </g>
      {/* One ray in, two bounces off the pavilion, back out through the top. */}
      <polyline points="132,8 132,46 116,104 184,104 168,46 168,10" fill="none" stroke={ASSAY} strokeWidth="1.8" markerEnd="url(#jg-ray)" />
      <text x="240" y="62" className={LABEL} fill={INK}>{labels.crown}</text>
      <text x="240" y="80" className={LABEL} fill={INK}>{labels.girdle}</text>
      <text x="200" y="128" className={LABEL} fill={INK}>{labels.pavilion}</text>
      <text x="178" y="20" className={LABEL} fill={INK}>{labels.light}</text>
      {/* Colour: D to Z. */}
      <rect x="20" y="198" width="260" height="14" fill="url(#jg-dz)" stroke={RULE} />
      <text x="20" y="228" className={LABEL} fill={INK}>{labels.colorFrom}</text>
      <text x="280" y="228" textAnchor="end" className={LABEL} fill={INK}>{labels.colorTo}</text>
      {/* Clarity: from none to visible marks. */}
      <g fill="none" stroke={INK} strokeWidth="1.2">
        <circle cx="34" cy="262" r="11" />
        <circle cx="76" cy="262" r="11" />
        <circle cx="118" cy="262" r="11" />
      </g>
      <g fill={INK}>
        <circle cx="74" cy="259" r="1" />
        <circle cx="114" cy="258" r="1.4" /><circle cx="121" cy="265" r="1.6" /><circle cx="118" cy="257" r="1" />
      </g>
      <text x="34" y="290" textAnchor="middle" className={LABEL} fill={INK}>{labels.clarityFrom}</text>
      <text x="118" y="290" textAnchor="middle" className={LABEL} fill={INK}>{labels.clarityTo}</text>
      {/* Carat: weight. */}
      <text x="280" y="268" textAnchor="end" className={`${LABEL} font-semibold`} fill={INK}>{labels.caratUnit}</text>
    </svg>
  );
}
