"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useRingSize } from "@/components/editorial/ring-size-context";

/**
 * THE ON-SCREEN RING SIZER (/jewelry-guide#ring-size; owner 2026-10-27, from
 * the owner's ring-size template, restyled). A photo-real K18 band seen from
 * above (an owner-approved AI image, captioned as an illustration) is scaled
 * so its INSIDE edge is the chosen size's inside diameter at true size:
 * mm × CSS px per mm × the visitor's calibration. A ring laid on the screen
 * is matched against that inner edge. The gold is the image; code only moves
 * it (owner: code-built gold is not realistic).
 *
 * Data: the page's own RING_SIZES (JCS sizes 1–28), passed in, shown as the
 * table prints them; nothing is computed but the drawing's scale.
 *
 * Calibration: CSS assumes 96 px per inch, which few screens honour, so the
 * visitor scales everything until an on-screen ruler matches a real one, or
 * an on-screen card outline matches a standard card (ISO/IEC 7810 ID-1,
 * 85.60 × 53.98 mm). Both set the same scale, remembered in localStorage when
 * the browser allows it; without it the sizer still works at 100%.
 *
 * Motion: the ring settles to each size with a CSS transform (SIZER.ring on
 * EASE_LUX, lib/motion.ts) — compositor only, no layout; with
 * prefers-reduced-motion it switches instantly. Every word arrives in `copy`
 * (lib/content/jewelry-guide.ts ringSize.sizer).
 */

type Copy = Record<
  | "h" | "instruction" | "screens" | "slider" | "valueText" | "size" | "sizeUnit" | "diameter" | "circumference"
  | "smaller" | "larger" | "calibrateH" | "calibrateLede" | "ruler" | "card" | "rulerHow" | "cardHow"
  | "shrink" | "enlarge" | "reset" | "scale" | "alt" | "saved" | "notCalibrated" | "calibratedAt",
  string
>;
type Size = readonly [size: number, diameterMm: string, circumferenceMm: string];

/** CSS reference pixels per millimetre: 96 px per inch, 25.4 mm per inch. */
const CSS_PX_PER_MM = 96 / 25.4;
const SCALE_MIN = 50;
const SCALE_MAX = 200;
const STORE_KEY = "cj-ring-scale";
const RING_SRC = "/images/jewelry-guide/ring-k18-band-top.webp";
/**
 * The ring image's inside diameter as a share of its width. MEASURED, not
 * guessed (2026-10-27): the owner's 2048 px PNG's alpha channel was read
 * along 720 rays from the hole's centre, the first pixel with alpha ≥ 128 on
 * each ray taken as the inner edge, and a circle least-squares fitted to
 * those points (r = 590.2 px, RMS deviation 2.1 px). The image was then
 * cropped to a 1520 px square centred on the hole, so the hole sits at the
 * image centre and scaling about the centre keeps it there, and exported at
 * 640 px; re-measured on that file the same way: r = 248.5 px, centre
 * (319.9, 320.0) → 497.0 / 640 = 0.7766.
 */
const RING_INNER_RATIO = 0.7766;
/** The image is drawn at this size's inside diameter and scaled from there. */
const BASE_MM = 22;
/** ISO/IEC 7810 ID-1, drawn upright so it fits a phone held upright. */
const CARD_W_MM = 53.98;
const CARD_H_MM = 85.6;
const CARD_R_MM = 3.18;
const RULER_MM = 40;

const clampScale = (v: number) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(v * 2) / 2));

export function RingSizer({ copy, sizes, caption, initial = 13 }: { copy: Copy; sizes: readonly Size[]; caption: string; initial?: number }) {
  const uid = useId();
  // The chosen size lives in the section's RingSizeProvider when there is one,
  // so the size table beside the sizer can show it; otherwise here.
  const shared = useRingSize();
  const [own, setOwn] = useState(() => Math.max(0, sizes.findIndex(([n]) => n === initial)));
  const i = shared?.index ?? own;
  const setI = shared?.setIndex ?? setOwn;
  const [scale, setScale] = useState(100);
  const [calibrated, setCalibrated] = useState(false);
  const [method, setMethod] = useState<"ruler" | "card">("ruler");

  // The saved calibration is read after hydration: the server cannot see it.
  useEffect(() => {
    try {
      const v = Number(window.localStorage.getItem(STORE_KEY));
      if (v >= SCALE_MIN && v <= SCALE_MAX) { setScale(v); setCalibrated(true); }
    } catch { /* blocked site data: stay at 100% */ }
  }, []);
  const setAndSave = (v: number) => {
    const next = clampScale(v);
    setScale(next);
    setCalibrated(true);
    try { window.localStorage.setItem(STORE_KEY, String(next)); } catch { /* not saved; still applied */ }
  };

  const [n, d, c] = sizes[i];
  const pxPerMm = CSS_PX_PER_MM * (scale / 100);
  // The image box is sized for BASE_MM; the chosen size is a transform of it.
  const boxPx = (BASE_MM / RING_INNER_RATIO) * pxPerMm;
  const ringScale = Number(d) / BASE_MM;
  const valueText = copy.valueText.replace("{n}", String(n)).replace("{d}", d);
  const status = calibrated ? copy.calibratedAt.replace("{p}", String(scale)) : copy.notCalibrated;
  // Japanese is never letter-spaced (brand rule); the Latin caption is.
  const capTrack = /^[\x20-\x7E]+$/.test(caption) ? "tracking-[0.08em]" : "";
  const btn = "grid h-11 w-11 shrink-0 place-items-center border border-hairline bg-white text-lg text-charcoal-deep hover:border-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-dark disabled:opacity-40";

  return (
    <div className="border border-hairline bg-white">
      <div className="p-5">
        <h3 className="font-display text-[clamp(20px,2.4vw,28px)] text-charcoal-deep">{copy.h}</h3>
        <p className="mt-2 text-[15px] text-charcoal">{copy.instruction}</p>
        <p className="mt-2 text-sm text-charcoal/80">{copy.screens}</p>
      </div>

      {/* The stage: big enough for size 28 at 200%, so a size change never moves the page. */}
      <div className="relative grid min-h-[240px] place-items-center overflow-hidden bg-chalk py-4">
        <div style={{ width: boxPx, height: boxPx }} className="relative">
          <Image
            src={RING_SRC} alt={copy.alt} width={640} height={640} sizes={`${Math.ceil(boxPx)}px`}
            style={{ transform: `scale(${ringScale})` }}
            className="h-full w-full origin-center drop-shadow-[0_2px_3px_rgba(34,34,34,0.22)] transition-transform duration-[var(--dur-sizer-ring)] ease-[var(--ease-lux)] will-change-transform motion-reduce:transition-none"
          />
          {/* A faint cross at the centre, to place the ring by. */}
          <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-gold-dark/40" />
          <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-gold-dark/40" />
        </div>
        <span aria-hidden="true" className={`absolute bottom-2 right-2 bg-charcoal-deep/85 px-2 py-0.5 text-[11px] text-chalk ${capTrack}`}>{caption}</span>
      </div>

      <dl className="grid grid-cols-3 border-y border-hairline text-center [font-variant-numeric:lining-nums_tabular-nums]">
        <div className="px-2 py-3">
          <dt className="text-xs text-charcoal/80">{copy.size}</dt>
          <dd className="mt-1 font-display text-[clamp(24px,3vw,32px)] leading-none text-gold-dark">{n}<span className="ml-0.5 text-base">{copy.sizeUnit}</span></dd>
        </div>
        <div className="border-x border-hairline px-2 py-3">
          <dt className="text-xs text-charcoal/80">{copy.diameter}</dt>
          <dd className="mt-1 font-display text-[clamp(20px,2.4vw,26px)] leading-none text-charcoal-deep">{d}<span className="ml-1 text-sm">mm</span></dd>
        </div>
        <div className="px-2 py-3">
          <dt className="text-xs text-charcoal/80">{copy.circumference}</dt>
          <dd className="mt-1 font-display text-[clamp(20px,2.4vw,26px)] leading-none text-charcoal-deep">{c}<span className="ml-1 text-sm">mm</span></dd>
        </div>
      </dl>

      <div className="p-5">
        <label htmlFor={`${uid}-size`} className="text-sm font-semibold text-charcoal-deep">{copy.slider}</label>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" className={btn} aria-label={copy.smaller} disabled={i === 0} onClick={() => setI(i - 1)}><Minus aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} /></button>
          <input
            id={`${uid}-size`} type="range" min={0} max={sizes.length - 1} step={1} value={i}
            onChange={(e) => setI(Number(e.target.value))} aria-valuetext={valueText}
            className="h-11 min-w-0 flex-1 cursor-pointer accent-[#8A6B12]"
          />
          <button type="button" className={btn} aria-label={copy.larger} disabled={i === sizes.length - 1} onClick={() => setI(i + 1)}><Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} /></button>
        </div>
        <div aria-hidden="true" className="mt-1 flex justify-between px-14 text-xs text-charcoal/70 [font-variant-numeric:lining-nums_tabular-nums]">
          <span>{sizes[0][0]}{copy.sizeUnit}</span><span>{sizes[sizes.length - 1][0]}{copy.sizeUnit}</span>
        </div>

        <details className="group mt-6 border-t border-hairline pt-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-charcoal-deep [&::-webkit-details-marker]:hidden">
            <span>
              {copy.calibrateH}{" "}
              <span className={`ml-2 text-sm font-normal ${calibrated ? "text-charcoal/80" : "text-gold-deep"}`}>{status}</span>
            </span>
            <Plus aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-dark transition-transform duration-[var(--dur-micro)] group-open:rotate-45 motion-reduce:transition-none" strokeWidth={1.5} />
          </summary>
          <p className="mt-3 text-[15px] text-charcoal">{copy.calibrateLede}</p>
          <div role="radiogroup" aria-label={copy.calibrateH} className="mt-3 inline-flex border border-hairline">
            {(["ruler", "card"] as const).map((m) => (
              <button
                key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                className={`min-h-11 px-4 text-sm ${method === m ? "bg-charcoal-deep text-chalk" : "bg-white text-charcoal-deep hover:text-gold-dark"}`}
              >{m === "ruler" ? copy.ruler : copy.card}</button>
            ))}
          </div>
          <p className="mt-3 text-[15px] text-charcoal">{method === "ruler" ? copy.rulerHow : copy.cardHow}</p>

          <div className="mt-3 grid min-h-[120px] place-items-center overflow-hidden bg-chalk p-2">
            {method === "ruler" ? <Ruler pxPerMm={pxPerMm} /> : <CardOutline pxPerMm={pxPerMm} />}
          </div>

          <label htmlFor={`${uid}-scale`} className="mt-4 block text-sm font-semibold text-charcoal-deep">
            {copy.scale}: <span className="[font-variant-numeric:lining-nums_tabular-nums]">{scale}%</span>
          </label>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" className={btn} aria-label={copy.shrink} disabled={scale <= SCALE_MIN} onClick={() => setAndSave(scale - 1)}><Minus aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} /></button>
            <input
              id={`${uid}-scale`} type="range" min={SCALE_MIN} max={SCALE_MAX} step={0.5} value={scale}
              onChange={(e) => setAndSave(Number(e.target.value))} aria-valuetext={`${scale}%`}
              className="h-11 min-w-0 flex-1 cursor-pointer accent-[#8A6B12]"
            />
            <button type="button" className={btn} aria-label={copy.enlarge} disabled={scale >= SCALE_MAX} onClick={() => setAndSave(scale + 1)}><Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} /></button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-charcoal/80">{copy.saved}</p>
            <button type="button" onClick={() => setAndSave(100)} className="min-h-11 text-sm text-gold-dark underline underline-offset-4 hover:text-charcoal-deep">{copy.reset}</button>
          </div>
        </details>
      </div>
    </div>
  );
}

/** A 40 mm ruler at the calibrated scale: a tick every mm, longer at 5, numbered every cm. */
function Ruler({ pxPerMm }: { pxPerMm: number }) {
  const pad = 2;
  return (
    <svg
      width={(RULER_MM + pad * 2) * pxPerMm} height={12 * pxPerMm} viewBox={`${-pad} 0 ${RULER_MM + pad * 2} 12`}
      aria-hidden="true" focusable="false" className="block max-w-none"
    >
      <rect x={-pad} y={0} width={RULER_MM + pad * 2} height={12} fill="#FFFFFF" stroke="#E5E5E0" strokeWidth={0.2} />
      {Array.from({ length: RULER_MM + 1 }, (_, mm) => (
        <line key={mm} x1={mm} y1={0} x2={mm} y2={mm % 10 === 0 ? 6 : mm % 5 === 0 ? 4.2 : 2.6} stroke="#222222" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
      {[0, 1, 2, 3, 4].map((cm) => (
        <text key={cm} x={cm * 10} y={10.2} textAnchor="middle" fontSize={3} fill="#222222" className="font-sans">{cm}</text>
      ))}
    </svg>
  );
}

/** A standard card's outline at the calibrated scale, upright. */
function CardOutline({ pxPerMm }: { pxPerMm: number }) {
  return (
    <svg
      width={CARD_W_MM * pxPerMm} height={CARD_H_MM * pxPerMm} viewBox={`0 0 ${CARD_W_MM} ${CARD_H_MM}`}
      aria-hidden="true" focusable="false" className="block max-w-none"
    >
      <rect x={0.2} y={0.2} width={CARD_W_MM - 0.4} height={CARD_H_MM - 0.4} rx={CARD_R_MM} fill="#FFFFFF" stroke="#8A6B12" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <rect x={CARD_W_MM - 18} y={8} width={10} height={8} rx={1.4} fill="none" stroke="#C9A227" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <text x={CARD_W_MM / 2} y={CARD_H_MM / 2} textAnchor="middle" fontSize={3.4} fill="#222222" className="font-sans [font-variant-numeric:lining-nums_tabular-nums]">85.60 × 53.98 mm</text>
    </svg>
  );
}
