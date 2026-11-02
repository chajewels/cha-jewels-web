"use client";

import { useEffect } from "react";
import Image from "next/image";
import { isOptimizableImage } from "@/lib/image-hosts";
import Link from "next/link";
import { animated, easings, useSpring } from "@react-spring/web";

import type { LumiereCollectionCard as CardData } from "@/lib/content/lumiere-home";
import type { TextRun } from "@/lib/lumiere/text-runs";
import { useInView } from "@/hooks/use-in-view";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { HoverRoll, useHover } from "@/components/lumiere/hero/hero-hover";
import { ArrowIcon } from "@/components/lumiere/hero/hero-icons";
import { TextRuns } from "@/components/lumiere/hero/text-runs";

import { capTrim, capTrimSerif } from "./cap-trim";
import { CARD_REVEAL, TYPE } from "./collections.config";
import { takeRevealSlot } from "./reveal-queue";

/**
 * One collection card, holding both Figma states.
 *
 * The states differ in five things and nothing else — the index appears, the
 * label grows from 32 to 48 and rises, a note appears beside it, and the
 * explore link appears under it. There is no lift, no shadow, no zoom on the
 * photograph: the two frames put the image at identical crops, so it stays put.
 *
 * The whole card is the link. Everything that only appears on hover is
 * `aria-hidden` — it is decoration around a destination the label already
 * names, and a screen reader should not have to hear the label twice.
 *
 * Which state is showing is decided in CSS, in `globals.css`, behind a
 * `(hover: hover)` query so a touch device never leaves the resting state.
 */
export interface CollectionCardProps {
  card: CardData;
  /** The explore link's runs (§13 row 12), shared by every card. */
  cta: TextRun[];
  /**
   * How far the photograph drifts against the card as it scrolls through the
   * viewport, as a share of the card's height (`PARALLAX.photo`).
   */
  depth: number;
}

export const CollectionCard = ({ card, cta, depth }: CollectionCardProps) => {
  const [cardRef, seen] = useInView<HTMLAnchorElement>();
  // 1 as the card enters at the bottom, -1 as it leaves at the top.
  const drift = useScrollProgress(cardRef);

  // The entrance: opacity only, so nothing in the grid moves while it fills.
  // Started by hand rather than declared, because the delay is only known at
  // the moment the card is seen — it is a place in the queue, not an index.
  //
  // The value goes to a custom property the stylesheet reads as the card's
  // opacity, written straight onto the link. Not `animated(Link)`: it does not
  // hand the ref on to the anchor, and the in-view gate and the parallax both
  // measure it. Not an inline `opacity` either: React would own that property
  // and any render that touched the style could put a card back at 0 — a card
  // that has been seen must stay seen. React never writes `--card-shown`.
  const [, reveal] = useSpring(() => ({ shown: 0 }));
  useEffect(() => {
    const node = cardRef.current;
    if (!seen || !node) return;
    const write = (value: number) =>
      node.style.setProperty("--card-shown", value.toFixed(4));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      write(1);
      return;
    }
    reveal.start({
      shown: 1,
      delay: takeRevealSlot(CARD_REVEAL.stagger),
      config: { duration: CARD_REVEAL.duration, easing: easings.easeOutCubic },
      onChange: ({ value }) => write(value.shown),
      // Whatever happens to the frames in between, it ends shown.
      onRest: () => write(1),
    });
  }, [cardRef, reveal, seen]);

  // The explore link behaves exactly as the hero's does — see `hero-hover`. Its
  // own pointer state, not the card's: the link appears when you enter the card
  // and reacts when you actually go for it, which is one gesture per beat
  // rather than everything moving at once.
  const { hovered, handlers } = useHover();
  const { hover } = useSpring({
    hover: hovered ? 1 : 0,
    config: { duration: 460, easing: easings.easeOutCubic },
  });

  return (
    <Link
      ref={cardRef}
      href={card.href}
      data-collection-card
      data-analytics="collection-card"
      className={`collections__card collections__card--${card.width}`}
      style={{
        // Only the per-card data stays inline. Everything the breakpoints
        // restate — size, padding, the label's travel — lives in the stylesheet,
        // because an inline value outranks every media query without help.
        ["--card-crop" as string]: card.image.position,
        ["--card-crop-mobile" as string]: card.image.positionMobile,
        ["--card-zoom" as string]: card.image.scale,
        ["--card-zoom-mobile" as string]: card.image.scaleMobile,
        ["--card-aim-mobile" as string]: card.image.aimMobile,
        // In `em`, so the measure travels with the note's own size. Figma's
        // width divided by Figma's size is the same number of characters at
        // every width, which is what a measure is supposed to be.
        ["--note-w" as string]: `${card.noteWidth / TYPE.note.size}em`,
        // The parallax frame's overhang at each end — see below.
        ["--photo-room" as string]: `${depth * 100}%`,
      }}
    >
      {/* The crop is Figma's fill position, and where Figma zooms past a cover
          fit the extra is a transform — never a width, so nothing about the
          crop can shift the box it sits in. */}
      {/* Parallax: the photograph sits in a frame `depth` of the card taller at
          each end and slides against the card, slower than the page — so the
          picture reads as lying behind the card's window. The shift is a
          percentage of the frame's own height, which is (1 + 2·depth) of the
          card's, hence the division. */}
      <animated.span
        className="collections__photo-frame"
        style={{
          transform: drift.to(
            (p) =>
              `translate3d(0, ${((-p * depth * 100) / (1 + 2 * depth)).toFixed(3)}%, 0)`,
          ),
        }}
      >
        <Image
          src={card.image.src}
          alt={card.image.alt}
          unoptimized={!isOptimizableImage(card.image.src)}
          fill
          // A phone never needs the desktop plate: the widest this card is ever
          // drawn below 768 is the column itself.
          sizes={`(max-width: 767.98px) 100vw, (max-width: 1023.98px) ${card.width === "full" ? "100vw" : "50vw"}, ${
            card.width === "full" ? "95vw" : card.width === "wide" ? "57vw" : "42vw"
          }`}
          className="collections__photo"
        />
      </animated.span>

      <div className="collections__body">
        {/* The index line is the category's eyebrow — "Preloved · Authenticated
            in Japan" — never a number (D-24, secondhand-dealer rule): a
            preloved piece must never read as new. Roman in Japanese (§5.2).
            VISIBLE AT REST on every card at every width (P2b item 1): the
            reference hid its 01–04 until hover; a "Preloved" line that only
            shows on hover is a label most visitors never see. Not
            `data-card-reveal`, not `aria-hidden` — it is content. */}
        <span
          data-card-index
          className="collections__index font-serif text-card-index underline [:lang(en)_&]:italic"
          style={capTrimSerif(TYPE.index.size, TYPE.index.leading)}
        >
          {card.category.index}
        </span>

        <span className="collections__middle">
          {/* Set at its hover size and scaled down at rest, so the change of
              size is a transform. The origin is the bottom left because that
              is the corner both states share — Figma lands the label's cap on
              the same left edge either way, and at rest on the same baseline
              as the explore link it replaces. */}
          <span
            data-card-label
            className="block origin-bottom-left font-serif text-card-title whitespace-nowrap"
            style={capTrimSerif(TYPE.title.size, TYPE.title.leading)}
          >
            <TextRuns runs={card.category.title} />
          </span>

          <span
            aria-hidden
            data-card-reveal
            className="collections__note font-tight text-card-note"
            style={capTrim(TYPE.note.size, TYPE.note.leading, TYPE.note.cap)}
          >
            {card.category.note.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </span>

        <span
          aria-hidden
          data-card-reveal
          className="collections__cta"
          {...handlers}
        >
          <span
            className="collections__cta-row font-serif text-card-cta tracking-card-cta uppercase"
          >
            {/* One inline box: as direct flex children the runs would each
                become an item and pick up the gap. */}
            <HoverRoll active={hovered}>
              <span
                className="block"
                style={capTrimSerif(TYPE.cta.size, TYPE.cta.leading)}
              >
                <TextRuns runs={cta} />
              </span>
            </HoverRoll>
            {/* The arrow leaves ahead of the label, which is what makes the pair
                read as departing rather than merely lighting up. */}
            <animated.span
              className="block will-change-transform"
              style={{
                transform: hover.to((t) => `translate3d(${t * 6}px, 0, 0)`),
              }}
            >
              <ArrowIcon />
            </animated.span>
          </span>
          {/* The rule redraws itself: it retracts to the right and comes back
              from the left, so the underline is struck again rather than
              dimmed. */}
          <span className="collections__rule">
            <animated.span
              className="block h-full w-full bg-current"
              style={{
                transform: hover.to(
                  (t) => `scaleX(${1 - Math.sin(Math.PI * t)})`,
                ),
                transformOrigin: hover.to((t) => (t < 0.5 ? "right" : "left")),
              }}
            />
          </span>
        </span>
      </div>
    </Link>
  );
};
