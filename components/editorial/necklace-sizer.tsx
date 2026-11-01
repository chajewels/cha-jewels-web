"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";

/**
 * THE NECKLACE LENGTH SLIDER (/jewelry-guide#necklace-length; owner
 * 2026-10-27). Steps through the five lengths in necklaceLength.lengths, in
 * order. Five owner-approved AI images — one woman in a cream silk blouse,
 * chin to waist, identical framing, one chain length each, captioned as an
 * illustration — are stacked in one fixed 2:3 frame and cross-faded, while
 * the frame zooms like a camera: in on the neckline for the short lengths so
 * the fine chain shows, out to the whole image for the long ones. The gold is
 * the photograph; code only fades and frames it.
 *
 * Loading: the chosen image and its neighbours are mounted (lazily, below the
 * fold) and stay mounted, so a step never waits on the network and the fade
 * never flashes. Motion: opacity on the images and one transform on the
 * stack (scale from the top centre), both on SIZER.fade / EASE_SLIDE
 * (lib/motion.ts) so they move together; compositor only, the frame never
 * changes size. prefers-reduced-motion: instant. Every word arrives as a prop.
 */

type Length = { key: string; name: string; cm: string; where: string };
type Copy = { slider: string; valueText: string; alt: string; shorter: string; longer: string; note: string; rangeNote: string; tip: string };

/** The neckline images' own size (owner originals, served at full size so a 3× zoom stays as sharp as the source allows). */
const IMG_W = 1360;
const IMG_H = 2048;

/**
 * WHERE EACH CHAIN ENDS, as a share of the image height: the lowest pixel of
 * the chain or its pendant. MEASURED (2026-10-27): each image, at 340 × 512,
 * was compared pixel by pixel with the median of all five (identical
 * framing, so what differs is that image's chain), and the lowest row with
 * differing pixels in the neck's column was taken; checked by eye against
 * each image. The neck is centred: chains and pendants sit at x = 50% of the
 * width, so the frame needs no sideways shift.
 */
const CHAIN_END: Record<string, number> = {
  choker: 0.137,
  princess: 0.168,
  matinee: 0.275,
  opera: 0.461,
  rope: 0.553,
};
/**
 * HOW MUCH OF THE IMAGE EACH LENGTH SHOWS, from the top (just under the chin)
 * down: the owner's targets (2026-10-27), checked against the measured chain
 * ends — the pendant sits 39–58% down the frame at every length, and the rope
 * shows the whole image. (Tighter framings were tried and dropped: at 3× the
 * 1360 px source turns soft on a 480 px desktop frame.) Never less than the
 * chain's end plus MARGIN, so no pendant is cut off.
 */
const VIEW: Record<string, number> = { choker: 0.35, princess: 0.42, matinee: 0.55, opera: 0.8, rope: 1 };
const MARGIN = 0.1;
const shown = (key: string) => Math.min(1, Math.max(VIEW[key] ?? 1, (CHAIN_END[key] ?? 1) + MARGIN));
/** The deepest zoom, for the images' `sizes`: the source must cover the zoomed-in view. */
const MAX_ZOOM = Math.max(...Object.keys(VIEW).map((k) => 1 / shown(k)));

export function NecklaceSizer({ lengths, copy, caption, initial = 1 }: { lengths: readonly Length[]; copy: Copy; caption: string; initial?: number }) {
  const uid = useId();
  const [i, setI] = useState(initial);
  // Images mounted so far: the chosen one and its neighbours, never dropped.
  const [mounted, setMounted] = useState(() => new Set([initial - 1, initial, initial + 1]));
  const choose = (k: number) => {
    setI(k);
    setMounted((m) => (m.has(k - 1) && m.has(k) && m.has(k + 1) ? m : new Set([...m, k - 1, k, k + 1])));
  };

  const l = lengths[i];
  const zoom = 1 / shown(l.key);
  const valueText = copy.valueText.replace("{name}", l.name).replace("{cm}", l.cm);
  const capTrack = /^[\x20-\x7E]+$/.test(caption) ? "tracking-[0.08em]" : "";
  const btn = "grid h-11 w-11 shrink-0 place-items-center border border-hairline bg-white text-charcoal-deep hover:border-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-dark disabled:opacity-40";
  const ease = "duration-[var(--dur-sizer-fade)] ease-[var(--ease-slide)] motion-reduce:transition-none";

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      {/* The frame: fixed 2:3, the photo backdrop's colour behind it. */}
      <div className="relative mx-auto aspect-[2/3] w-full max-w-[320px] overflow-hidden bg-[#E4DCD1] lg:max-w-[480px]">
        <div
          className={`absolute left-1/2 top-0 h-full origin-top transition-transform will-change-transform ${ease}`}
          style={{ aspectRatio: `${IMG_W} / ${IMG_H}`, transform: `translateX(-50%) scale(${zoom})` }}
        >
          {lengths.map((x, k) => mounted.has(k) && (
            <Image
              key={x.key}
              src={`/images/jewelry-guide/neckline-${x.key}.webp`}
              alt={k === i ? copy.alt.replace("{name}", x.name).replace("{cm}", x.cm) : ""}
              aria-hidden={k === i ? undefined : true}
              width={IMG_W} height={IMG_H}
              sizes={`(min-width: 1024px) ${Math.ceil(480 * MAX_ZOOM)}px, ${Math.ceil(320 * MAX_ZOOM)}px`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity ${ease} ${k === i ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        <span aria-hidden="true" className={`absolute bottom-2 right-2 bg-charcoal-deep/85 px-2 py-0.5 text-[11px] text-chalk ${capTrack}`}>{caption}</span>
      </div>

      <div className="min-w-0">
        <div className="border border-hairline bg-white p-5">
          <p className="font-display text-[clamp(24px,3vw,36px)] leading-tight text-charcoal-deep">{l.name}</p>
          <p className="mt-1 text-[15px] text-gold-dark [font-variant-numeric:lining-nums_tabular-nums]">{l.cm}</p>
          <p className="mt-3 min-h-[3em] text-[15px] text-charcoal">{l.where}</p>

          <label htmlFor={`${uid}-len`} className="mt-5 block text-sm font-semibold text-charcoal-deep">{copy.slider}</label>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" className={btn} aria-label={copy.shorter.replace("{name}", lengths[Math.max(0, i - 1)].name)} disabled={i === 0} onClick={() => choose(i - 1)}>
              <Minus aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <input
              id={`${uid}-len`} type="range" min={0} max={lengths.length - 1} step={1} value={i}
              onChange={(e) => choose(Number(e.target.value))} aria-valuetext={valueText}
              className="h-11 min-w-0 flex-1 cursor-pointer accent-[#2a2724]"
            />
            <button type="button" className={btn} aria-label={copy.longer.replace("{name}", lengths[Math.min(lengths.length - 1, i + 1)].name)} disabled={i === lengths.length - 1} onClick={() => choose(i + 1)}>
              <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          {/* The five names under the track, for pointer and touch; the slider itself is the accessible control. */}
          <div aria-hidden="true" className="mt-1 grid grid-cols-5 gap-1 whitespace-nowrap text-center text-[11px] leading-tight sm:text-xs">
            {lengths.map((x, k) => (
              <button
                key={x.key} type="button" tabIndex={-1} onClick={() => choose(k)}
                className={`min-h-11 px-0.5 ${k === i ? "font-semibold text-gold-dark" : "text-charcoal/80 hover:text-charcoal-deep"}`}
              >{x.name}</button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-charcoal/80">{copy.note}</p>
        <p className="mt-2 text-sm text-charcoal/80">{copy.rangeNote}</p>
        <p className="mt-3 text-[15px] text-charcoal">{copy.tip}</p>
      </div>
    </div>
  );
}
