"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { animated, type SpringValue } from "@react-spring/web";

import { FadeSwap, TextSwap } from "@/components/lumiere/common/text-swap";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { capTrim, capTrimSerif } from "@/components/lumiere/collections/cap-trim";
import { HoverRoll, useHover } from "@/components/lumiere/hero/hero-hover";

import {
  CartIcon,
  CrossesDecor,
  MaterialDot,
  ScrollCueIcon,
} from "./featured-icons";
import { clamp01, lerp, stage } from "./featured-easing";
import { useFeaturedContent } from "./featured-content";
import { useFeaturedProgress } from "./featured-progress";
import { FeaturedRings } from "./featured-rings";
import {
  CAP_RATIO_SANS,
  PHOTO_PARALLAX,
  PIECE_SWITCH,
  STRIP_OVERRUN,
  TIMELINE,
  TYPE,
} from "./featured.config";

const sans = (size: number, leading: number) =>
  capTrim(size, leading, CAP_RATIO_SANS * size);

/**
 * Figma's `#67563C` at a fifth, lifting to full as its ring nears the centre.
 * Measured along the strip — the first and last dots stay lit while the strip
 * runs on past them as the block scrolls in and out.
 */
const dotOpacity = (strip: number, index: number) => {
  const s = Math.min(Math.max(strip, 0), TIMELINE.transitions);
  return lerp(0.2, 1, clamp01(1 - Math.abs(s - index)));
};

/**
 * A rise, expressed in `em` of the element's own type rather than in design
 * units. React Spring parses a transform string and re-serialises it, and a
 * `var()` nested inside a `calc()` does not survive that — it comes back
 * truncated, and server and client disagree about it. Every unit here is
 * therefore self-referential: `em` for the type, and percentages of their own
 * box for the rings, both of which are already sized in design units.
 */
const rise = (t: number, fromUnits: number, fontUnits: number) =>
  `translate3d(0, ${(lerp(fromUnits, 0, t) / fontUnits).toFixed(4)}em, 0)`;

const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;

/** How far photograph `index` has risen over the one before, 0…1. */
const wipeAt = (strip: number, index: number) =>
  easeInOutSine(
    clamp01((strip - (index - 1) - PIECE_SWITCH.start) / PIECE_SWITCH.span),
  );

/**
 * The soft-edged mask for a photograph `r` of the way in: opaque below the
 * edge, clear above it, with `feather`% of the frame between. The edge travels
 * from the foot to `feather`% past the head, so the photograph starts fully
 * clear and ends fully opaque.
 */
const wipeMask = (r: number) => {
  const edge = r * (100 + PIECE_SWITCH.feather);
  return `linear-gradient(to top, #000 ${(edge - PIECE_SWITCH.feather).toFixed(2)}%, transparent ${edge.toFixed(2)}%)`;
};

/** Read on every frame — the handover follows the scroll. */
const everyFrame = () => 0;

/**
 * The piece in the centre slot, as state — the name, the materials row and the
 * price pill all read it. It is derived from the SAME wipe the photographs
 * follow (`wipeAt`, the same `strip` value, the same frame): the piece is the
 * last photograph whose wipe has passed its midpoint, so the words and the
 * picture change on one frame. The reference switched on the strip's own
 * midpoint with `PIECE_SWITCH.hysteresis` either side, which let the name lag
 * the photograph by up to 0.06 of a transition — "Trinity." over the Solace
 * photograph when the scroll rested there (P2b item 6).
 */
const SWITCH_AT = 0.5;
const pieceAt = (s: number, lastPiece: number): number => {
  let piece = 0;
  for (let index = 1; index <= lastPiece; index++) {
    if (wipeAt(s, index) >= SWITCH_AT) piece = index;
    else break;
  }
  return piece;
};
const useActivePiece = (strip: SpringValue<number>, lastPiece: number): number => {
  const [active, setActive] = useState(0);

  useEffect(
    () =>
      subscribeToTicker(() => {
        const next = pieceAt(strip.get(), lastPiece);
        setActive((was) => (was === next ? was : next));
      }, everyFrame),
    [strip, lastPiece],
  );

  return active;
};

export const FeaturedStage = () => {
  const content = useFeaturedContent();
  const featuredPieces = content.pieces;
  const { entry, strip, scrollToState } = useFeaturedProgress();
  const active = useActivePiece(strip, featuredPieces.length - 1);
  const activePiece = featuredPieces[active];
  // The button rolls the way the nav links do — same helper, so the character
  // is the same by construction rather than by resemblance.
  const { hovered, handlers } = useHover();

  return (
    <section
      aria-labelledby="featured-title"
      className="featured relative isolate w-full overflow-hidden bg-surface text-content"
    >
      <Image
        src="/lumiere/shared/paper.webp"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="z-0 object-cover"
      />

      <div className="featured__panels">
        {/* Left — the photograph, with everything set over it. */}
        <div className="featured__panel featured__panel--photo">
          <animated.div
            className="featured__photo-frame"
            style={{
              opacity: entry.to((e) => stage(e, 0, 0.7)),
              transform: entry.to(
                (e) => `scale(${lerp(1.04, 1, stage(e, 0, 1))})`,
              ),
            }}
          >
            {/* Parallax: a frame `PHOTO_PARALLAX` of the panel taller at each
                end. It drifts only while the section rises in and scrolls out,
                and holds through the pin. The shift is a percentage of the
                frame's own height, which is (1 + 2·r) of the panel's, hence the
                division. */}
            <animated.div
              className="featured__photo-drift"
              style={{
                ["--photo-room" as string]: `${PHOTO_PARALLAX * 100}%`,
                transform: strip.to((s) => {
                  // -1 at the start of the entry, 0 for the whole pin, 1 at
                  // the end of the exit.
                  const t =
                    s < 0
                      ? -clamp01(-s / STRIP_OVERRUN)
                      : clamp01((s - TIMELINE.transitions) / STRIP_OVERRUN);
                  const shift =
                    (t * PHOTO_PARALLAX * 100) / (1 + 2 * PHOTO_PARALLAX);
                  return `translate3d(0, ${shift.toFixed(3)}%, 0)`;
                }),
              }}
            >
              {/* One photograph per ring, stacked in strip order. Each rises
                  over the one before behind a soft edge as its ring comes to
                  the centre, and settles from a slight zoom while it does; the
                  first is the floor and never moves. */}
              {featuredPieces.map((piece, index) => (
                <animated.div
                  key={index}
                  aria-hidden={index !== active}
                  className="featured__photo-layer"
                  style={
                    index === 0
                      ? undefined
                      : {
                          maskImage: strip.to((s) =>
                            wipeMask(wipeAt(s, index)),
                          ),
                          WebkitMaskImage: strip.to((s) =>
                            wipeMask(wipeAt(s, index)),
                          ),
                          visibility: strip.to((s) =>
                            wipeAt(s, index) <= 0 ? "hidden" : "visible",
                          ),
                        }
                  }
                >
                  <animated.div
                    className="featured__photo-zoom"
                    style={
                      index === 0
                        ? undefined
                        : {
                            transform: strip.to(
                              (s) =>
                                `scale(${(1 + PIECE_SWITCH.zoom * (1 - wipeAt(s, index))).toFixed(4)})`,
                            ),
                          }
                    }
                  >
                    <Image
                      src={piece.photo.src}
                      alt={piece.photo.alt}
                      fill
                      sizes="47vw"
                      priority={index === 0}
                      className="featured__photo"
                    />
                  </animated.div>
                </animated.div>
              ))}
            </animated.div>
          </animated.div>

          {/* The site's heading entrance, played as the block is looked at. */}
          {/* The piece's name, once, as the section's heading; the swap's
              stand-ins and engine letters draw aria-hidden beside it (P2b item 2). */}
          <h2 id="featured-title" className="sr-only">
            {activePiece.nameRuns.map((run) => run.text).join("")}
          </h2>
          <div
            aria-hidden="true"
            className="featured__title font-serif"
            style={capTrimSerif(TYPE.title.size, TYPE.title.leading)}
          >
            <TextSwap
              versions={featuredPieces.map((piece) => [piece.nameRuns])}
              active={active}
              first={{ ready: true, delay: 0 }}
            />
          </div>

          <div className="featured__meta">
            <animated.div
              className="featured__pills"
              style={{
                opacity: entry.to((e) => stage(e, 0.3, 0.9)),
                transform: entry.to((e) => rise(stage(e, 0.3, 0.9), 12, TYPE.pill.size)),
              }}
            >
              {/* D-7: while the piece is a placeholder there is nothing to buy —
                  the pill is drawn but disabled, and the price beside it is
                  "¥ —", never a figure. The Hub swap enables it and wires the
                  existing add-to-cart action with its analytics event. */}
              <button
                type="button"
                className="featured__pill featured__pill--cta"
                disabled={activePiece.placeholder}
                aria-disabled={activePiece.placeholder}
                data-analytics="featured-add-to-cart"
                {...handlers}
              >
                {/* Bag and words inside one roll, so they leave and arrive
                    together — two rolls side by side would read as a stumble. */}
                <HoverRoll active={hovered}>
                  <span className="featured__pill-row">
                    <span className="featured__pill-icon">
                      <CartIcon />
                    </span>
                    <span style={sans(TYPE.pill.size, TYPE.pill.leading)}>
                      {content.cta}
                    </span>
                  </span>
                </HoverRoll>
              </button>
              <span className="featured__pill">
                <FadeSwap
                  items={featuredPieces.map((piece, index) => (
                    <span
                      key={index}
                      style={sans(TYPE.pill.size, TYPE.pill.leading)}
                    >
                      {piece.price}
                    </span>
                  ))}
                  active={active}
                />
              </span>
            </animated.div>

            <animated.p
              className="featured__materials font-tight"
              style={{
                opacity: entry.to((e) => stage(e, 0.45, 1)),
                transform: entry.to((e) => rise(stage(e, 0.45, 1), 12, TYPE.materials.size)),
              }}
            >
              <FadeSwap
                className="featured__materials-swap"
                active={active}
                items={featuredPieces.map((piece, pieceIndex) => (
                  <span key={pieceIndex} className="featured__materials-row">
                    {piece.materials.map((material, index) => (
                      <span key={material} className="featured__material">
                        {index > 0 && (
                          <span aria-hidden className="featured__material-dot">
                            <MaterialDot />
                          </span>
                        )}
                        <span
                          style={sans(
                            TYPE.materials.size,
                            TYPE.materials.leading,
                          )}
                        >
                          {material}
                        </span>
                      </span>
                    ))}
                  </span>
                ))}
              />
            </animated.p>
          </div>
        </div>

        {/* Right — the stage. */}
        <div className="featured__panel featured__panel--stage">
          <animated.span
            className="featured__cue font-tight"
            style={{
              // It arrives with the section, then dims with the pin — one is
              // its entrance and the other its retirement, so they multiply.
              /* Only the entry moves this. The cue used to dim as the pin ran
                 and go out by the last state; it now holds at full through the
                 whole scroll. */
              opacity: entry.to((e) => stage(e, 0.2, 0.8)),
              transform: entry.to((e) => rise(stage(e, 0.2, 0.8), 8, TYPE.cue.size)),
            }}
          >
            <span className="featured__cue-icon">
              <ScrollCueIcon />
            </span>
            <span style={sans(TYPE.cue.size, TYPE.cue.leading)}>
              {content.scrollCue}
            </span>
          </animated.span>

          <animated.span
            aria-hidden
            className="featured__crosses"
            style={{
              opacity: entry.to((e) => stage(e, 0.35, 0.95)),
              transform: entry.to(
                (e) => `scale(${lerp(0.96, 1, stage(e, 0.35, 0.95))})`,
              ),
            }}
          >
            <CrossesDecor />
          </animated.span>

          <FeaturedRings />

          <span className="featured__indicator">
            {featuredPieces.map((piece, index) => (
              <button
                key={piece.poster.src}
                type="button"
                className="featured__dot"
                onClick={() => scrollToState(index)}
              >
                <animated.span
                  className="featured__dot-mark"
                  style={{ opacity: strip.to((s) => dotOpacity(s, index)) }}
                />
                <span className="sr-only">{content.ringLabel.replace("{n}", String(index + 1)).replace("{total}", String(featuredPieces.length))}</span>
              </button>
            ))}
          </span>
        </div>
      </div>
    </section>
  );
};
