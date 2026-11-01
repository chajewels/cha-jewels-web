"use client";

import { useEffect, useRef } from "react";
import Image, { getImageProps } from "next/image";
import { animated, to, useSpringValue } from "@react-spring/web";

import Link from "next/link";

import type { LumierePhilosophyContent } from "@/lib/content/lumiere-home";
import type { Lang } from "@/lib/i18n";
import { LetterReveal } from "@/components/lumiere/common/letter-reveal";
import { createDocBox } from "@/lib/animation/doc-box";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { capTrim, capTrimSerif } from "@/components/lumiere/collections/cap-trim";
import { CAP_RATIO_SANS } from "@/components/lumiere/featured/featured.config";
import { clamp01, stage } from "@/components/lumiere/featured/featured-easing";
import { HoverRoll, useHover } from "@/components/lumiere/hero/hero-hover";

import { StoryArrow } from "./philosophy-icons";
import {
  CARD_RISE,
  ENTRY,
  HEADING,
  HEADING_ROOT_MARGIN,
  PARALLAX,
  RISE,
  TYPE,
  ZOOM,
} from "./philosophy.config";

/** Run on every frame — the entry is scrubbed, not played. */
const everyFrame = () => 0;

/** `Link` carries its own props through, so the spring can drive it directly. */
const AnimatedLink = animated(Link);

/** Half of a hundredth of the drift's full travel — about 8px of scroll. */
const DEAD_ZONE = 0.01;

const display = capTrimSerif(TYPE.display.size, TYPE.display.leading);
const note = capTrim(
  TYPE.note.size,
  TYPE.note.leading,
  CAP_RATIO_SANS * TYPE.note.size,
);

/**
 * Travel stated in `em` of the element's own type.
 *
 * Not a design unit and not a `var()`: React Spring writes these into a
 * transform string, and a `var()` inside one is mangled between the server and
 * the client render. `em` is self-referential, so it survives, and it scales
 * with the type it moves.
 */
const rise = (t: number, em: number) =>
  `translate3d(0, ${((1 - t) * em).toFixed(4)}em, 0)`;

/** The same idea where there is no type to measure against: a share of self. */
const riseSelf = (t: number, percent: number) =>
  `translate3d(0, ${((1 - t) * percent).toFixed(4)}%, 0)`;

const zoom = (t: number, from: number) =>
  `scale(${(from + (1 - from) * t).toFixed(5)})`;

/**
 * Drift before zoom: written the other way round the scale would multiply it.
 *
 * With no drift the zoom is returned untouched rather than with a zero shift in
 * front of it. A `translate3d` of nothing still promotes the element to a layer
 * of its own, and the card above it then rasterises its type on a different
 * path: measured, an identity shift on the photograph moved not one box and
 * still redrew every serif edge in the block, 1.5% of the frame. The two states
 * have to be the same string, not the same geometry.
 */
const shift = (percent: number) => `translate3d(0, ${percent.toFixed(4)}%, 0)`;

const shiftZoom = (percent: number, t: number, from: number) =>
  percent === 0
    ? zoom(t, from)
    : `translate3d(0, ${percent.toFixed(4)}%, 0) ${zoom(t, from)}`;

/**
 * The blurred plate is stretched onto its frame (`object-fit: fill`), and the
 * frame is 0.81 wide from 1024 px up and 0.27–0.40 below. One plate per
 * regime, each pre-stretched to it, so the drawn pixels are the same and the
 * image's own aspect matches what is drawn (BP image-aspect-ratio).
 */
const BackdropPlate = ({ backdrop }: { backdrop: LumierePhilosophyContent["backdrop"] }) => {
  const common = {
    alt: backdrop.wide.alt,
    fill: true,
    sizes: "100vw",
    // Below the fold: never a priority request (report §10 — one fetchPriority="high" on the page).
    priority: false,
  } as const;
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, src: backdrop.wide.src });
  const { props: compact } = getImageProps({
    ...common,
    src: backdrop.narrow.src,
  });
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={wide} sizes="100vw" />
      <img {...compact} alt={common.alt} className="philosophy__backdrop-plate" />
    </picture>
  );
};

export interface PhilosophyStageProps {
  lang: Lang;
  content: LumierePhilosophyContent;
}

export const PhilosophyStage = ({ lang, content }: PhilosophyStageProps) => {
  const { lines: philosophyLines, notes: philosophyNotes, cta: philosophyCta, backdrop, photo: philosophyPhoto } = content;
  const sectionRef = useRef<HTMLElement>(null);
  const entry = useSpringValue(0);
  const drift = useSpringValue(0);
  const { hovered, handlers } = useHover();

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (still.matches) {
      entry.set(1);
      drift.set(0);
      return;
    }

    const section = sectionRef.current;
    if (!section) return;
    // Re-measured on a size change only — no layout read per frame (doc-box).
    const box = createDocBox(section);

    const unsubscribe = subscribeToTicker(() => {
      const { height } = box;
      const top = box.top - window.scrollY;
      const bottom = top + height;
      // How much of the section is on screen, against the most that ever could
      // be. Not a fixed run of viewports: this is the last section on the page,
      // so there is nothing under it to scroll against — measured, a 1.6
      // viewport run stalled at 0.56 and the pill never arrived at all.
      const shown = Math.min(window.innerHeight, bottom) - Math.max(0, top);
      entry.set(clamp01(shown / Math.min(height, window.innerHeight)));

      // Where the section's middle stands against the screen's, as -1…1. The
      // denominator is the whole distance that middle travels between the two
      // moments the section touches an edge, so the ends land on exactly ±1
      // without a clamp doing the work — and zero falls where the block is
      // centred, which is the arrangement the file states.
      const centre = top + height / 2 - window.innerHeight / 2;
      const d = centre / ((window.innerHeight + height) / 2);

      // A dead zone around the middle, so the composed state is reached exactly
      // rather than approached. Landing on a scroll position where the drift is
      // a thousandth rather than nothing would leave both layers carrying a
      // shift of their own — small enough to see nothing move, large enough
      // that `shiftZoom` writes the longer string and the block stops being the
      // frame Figma states. The step out of the zone is a quarter of a pixel at
      // its largest, on the backdrop, and a twelfth on the photograph.
      drift.set(Math.abs(d) < DEAD_ZONE ? 0 : d);
    }, everyFrame);

    return () => {
      unsubscribe();
      box.dispose();
    };
  }, [entry, drift]);

  const at = (window_: readonly [number, number]) =>
    entry.to((e) => stage(e, window_[0], window_[1]));

  /**
   * The arrival, and the drift where a piece is given one: an element has a
   * single transform, so both travels are written into one string, in `em` of
   * the type they move — neither has to know the design unit.
   *
   * No display row passes `driftEm` today. See PARALLAX.display: two springs on
   * a row redraw its serifs even at a drift of zero, which is a price this
   * block should not pay for three pixels of movement.
   */
  const enter = (
    window_: readonly [number, number],
    em: number,
    driftEm = 0,
  ) => ({
    opacity: at(window_),
    transform: to([entry, drift], (e, d) => {
      const t = stage(e as number, window_[0], window_[1]);
      return `translate3d(0, ${((1 - t) * em + (d as number) * driftEm).toFixed(4)}em, 0)`;
    }),
  });

  return (
    <section className="philosophy" ref={sectionRef}>
      <div className="philosophy__backdrop">
        <animated.div
          className="philosophy__backdrop-frame"
          style={{
            transform: to([entry, drift], (e, d) =>
              shiftZoom(
                -(d as number) * PARALLAX.backdrop,
                stage(e as number, ...ENTRY.backdrop),
                ZOOM.backdrop,
              ),
            ),
          }}
        >
          <BackdropPlate backdrop={backdrop} />
        </animated.div>
      </div>

      <animated.div
        className="philosophy__card"
        style={{
          opacity: at(ENTRY.card),
          transform: entry.to((e) =>
            riseSelf(stage(e, ...ENTRY.card), CARD_RISE),
          ),
        }}
      >
        {/* Figma mirrors the grain rather than repeating it; kept, so the
            texture falls the way the file has it. */}
        <Image
          src="/lumiere/shared/paper.webp"
          alt=""
          fill
          sizes="80vw"
          className="philosophy__card-grain"
        />

        <div className="philosophy__top">
          <p className="philosophy__display" style={display}>
            <LetterReveal
              runs={philosophyLines.jewelry}
              delay={HEADING.jewelry.delay}
              direction={HEADING.jewelry.direction}
              rootMargin={HEADING_ROOT_MARGIN}
              lang={lang}
            />
          </p>

          <animated.div
            className="philosophy__note philosophy__note--top"
            style={enter(ENTRY.topNote, RISE.note)}
          >
            <p className="philosophy__note-line" style={note}>
              {philosophyNotes.top[0]}
            </p>
            <p
              className="philosophy__note-line philosophy__note-line--right"
              style={note}
            >
              {philosophyNotes.top[1]}
            </p>
          </animated.div>

          <p className="philosophy__display" style={display}>
            <LetterReveal
              runs={philosophyLines.quite}
              delay={HEADING.quite.delay}
              direction={HEADING.quite.direction}
              rootMargin={HEADING_ROOT_MARGIN}
              lang={lang}
            />
          </p>
        </div>

        <p className="philosophy__display philosophy__shapes" style={display}>
          <LetterReveal
            runs={philosophyLines.shapes}
            delay={HEADING.shapes.delay}
            direction={HEADING.shapes.direction}
            rootMargin={HEADING_ROOT_MARGIN}
          />
        </p>

        <div className="philosophy__middle">
          <animated.p
            className="philosophy__note-line philosophy__aside philosophy__aside--left"
            style={{ ...note, ...enter(ENTRY.sideNotes, RISE.note) }}
          >
            {philosophyNotes.left[0]}
            <br />
            {philosophyNotes.left[1]}
          </animated.p>

          {/* The pill belongs to the picture, not to the row: kept in a frame
              with it so that when the row becomes a column on a phone the pill
              is still over the photograph and not over whatever follows it. */}
          <animated.div
            className="philosophy__frame"
            style={{
              transform: drift.to((d) =>
                d === 0 ? "none" : shift(d * PARALLAX.photo),
              ),
            }}
          >
            <animated.div
              className="philosophy__photo"
              style={{
                opacity: at(ENTRY.photo),
                transform: entry.to((e) =>
                  zoom(stage(e, ...ENTRY.photo), ZOOM.photo),
                ),
              }}
            >
              <Image
                src={philosophyPhoto.src}
                alt={philosophyPhoto.alt}
                fill
                sizes="30vw"
                className="philosophy__photo-plate"
              />
            </animated.div>

            <AnimatedLink
              href={philosophyCta.href}
              className="philosophy__cta"
              data-analytics="philosophy-about"
              style={enter(ENTRY.pill, RISE.pill)}
              {...handlers}
            >
              <HoverRoll active={hovered}>
                <span className="philosophy__cta-row">
                  <span
                    style={capTrim(
                      TYPE.cta.size,
                      TYPE.cta.leading,
                      CAP_RATIO_SANS * TYPE.cta.size,
                    )}
                  >
                    {philosophyCta.label}
                  </span>
                  <StoryArrow />
                </span>
              </HoverRoll>
            </AnimatedLink>
          </animated.div>

          <animated.p
            className="philosophy__note-line philosophy__aside philosophy__aside--right"
            style={{ ...note, ...enter(ENTRY.sideNotes, RISE.note) }}
          >
            {philosophyNotes.right[0]}
            <br />
            {philosophyNotes.right[1]}
          </animated.p>
        </div>

        <div className="philosophy__bottom">
          <div className="philosophy__bottom-row">
            <p className="philosophy__display" style={display}>
              <LetterReveal
                runs={philosophyLines.longer}
                delay={HEADING.longer.delay}
                direction={HEADING.longer.direction}
                rootMargin={HEADING_ROOT_MARGIN}
                lang={lang}
              />
            </p>

            <animated.div
              className="philosophy__note philosophy__note--bottom"
              style={enter(ENTRY.sideNotes, RISE.note)}
            >
              {philosophyNotes.bottom.map((line) => (
                <p key={line} className="philosophy__note-line" style={note}>
                  {line}
                </p>
              ))}
            </animated.div>

            <p className="philosophy__display" style={display}>
              <LetterReveal
                runs={philosophyLines.look}
                delay={HEADING.look.delay}
                direction={HEADING.look.direction}
                rootMargin={HEADING_ROOT_MARGIN}
                lang={lang}
              />
            </p>
          </div>

          <p className="philosophy__display philosophy__keep" style={display}>
            <LetterReveal
              runs={philosophyLines.keep}
              delay={HEADING.keep.delay}
              direction={HEADING.keep.direction}
              rootMargin={HEADING_ROOT_MARGIN}
              lang={lang}
            />
          </p>
        </div>
      </animated.div>
    </section>
  );
};
