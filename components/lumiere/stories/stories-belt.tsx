"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import type { Lang } from "@/lib/i18n";
import type { LumiereStoriesStrings } from "@/lib/content/lumiere-home";
import { isOptimizableImage } from "@/lib/image-hosts";
import { subscribeToTicker } from "@/lib/animation/ticker";

import { StoryDialog } from "./story-dialog";

/**
 * THE SLIDER SLIPSTREAM BELT (GetLayers "Slider Slipstream", the owner's
 * prompt: docs/design-refs/slider-slipstream/owner-prompt.md). The reference's
 * motion and composition are kept whole:
 *
 *   - ONE tilted belt of cards in pure CSS 3D (`rotateY(-32deg)`,
 *     perspective ~0.9 × the width, `cardY` .64), each card on `translateX`
 *     from its slot plus the scroll position, wrapped modulo the loop span so
 *     the belt is infinite; opacity fades in from the far edge over 0.24 and
 *     out before the near seam past 0.4;
 *   - idle drift 0.22 px a frame, drag 0.9 with inertia (damp 0.92), arrow
 *     keys nudge the velocity by 0.14 of a step;
 *   - hover is chosen by `elementFromPoint` when the POINTER MOVES, never by
 *     CSS `:hover` (the overlapping 3D cards flip-flop under a still cursor —
 *     the reference's "shake"), and a hovered card holds the belt still;
 *   - the far-edge vignette and the card scrim.
 *
 * What changed for this site (P4 item 1):
 *   - the section is an IN-FLOW dark band of fixed height, not a fixed
 *     full-viewport stage; no reference header, nav or hint copy; Lumière
 *     faces (Instrument Serif, Manrope; the JA Mincho stack), no Google Fonts,
 *     no hotlinked images;
 *   - each card is ONE HUB STORY: the customer's photo when the Hub has one
 *     (an approved review's first photo), otherwise a typographic quote card;
 *     an excerpt, the name, the country, the month and the stars;
 *   - slots = max(9, stories): EVERY published story is on the belt (with
 *     fewer than nine, the stories cycle to fill the ring and the repeats are
 *     hidden from assistive tech);
 *   - click, tap or Enter on the card nearest the front opens the whole story,
 *     verbatim, in an accessible dialog; "See all stories" opens the list;
 *   - the frame runs on the shared ticker while the band is near the viewport
 *     (one requestAnimationFrame for the page), time-normalised so a 120 Hz
 *     screen drifts at the same speed; a hidden tab or an open dialog holds it;
 *   - `touch-action: pan-y`: a vertical swipe scrolls the page (Lenis is never
 *     hijacked: there is no wheel handler), a horizontal one drags the belt;
 *   - reduced motion: no drift, no card transition (the base CSS removes it).
 *     The belt is still draggable — that is the reader's own movement.
 */
export interface BeltStory {
  id: string;
  quote: string;
  excerpt: string;
  qLang: "en" | "ja";
  name: string;
  item: string | null;
  rating: number | null;
  location: string | null;
  dateLabel: string | null;
  dateIso: string | null;
  verified: boolean;
  photos: { src: string; alt: string }[];
}

/** The reference's fixed parameters. */
const P = {
  cardScale: 1,
  cardRatio: 1.34,
  tilt: -32,
  spacing: 0.3,
  perspective: 1,
  cardY: 0.64,
  autoScroll: 0.22,
  drag: 0.9,
  damp: 0.92,
  fadeFar: 0.24,
  nearHide: 0.4,
  /** Movement under this many px is a tap, not a drag. */
  tapSlop: 6,
} as const;
const MIN_SLOTS = 9;
const FRAME_MS = 1000 / 60;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const vis = (f: number) => Math.min(smoothstep(-0.5, -0.5 + P.fadeFar, f), 1 - smoothstep(P.nearHide, 0.5, f));

const Stars = ({ value }: { value: number }) => (
  <span className="slip__stars" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((k) => (
      <svg key={k} viewBox="0 0 24 24" width="12" height="12" className={k <= value ? "-on" : ""}>
        <path strokeLinejoin="round" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8z" />
      </svg>
    ))}
  </span>
);

export const StoriesBelt = ({ stories, strings, lang }: { stories: BeltStory[]; strings: LumiereStoriesStrings; lang: Lang }) => {
  const n = stories.length;
  const slots = Math.max(MIN_SLOTS, n);
  const bandRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const beltRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<{ mode: "story"; index: number } | { mode: "all" } | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const band = bandRef.current;
    const stage = stageRef.current;
    const belt = beltRef.current;
    if (!band || !stage || !belt) return;
    const cards = [...belt.querySelectorAll<HTMLElement>("[data-slot]")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let CW = 230;
    let STEP = 220;
    let SPAN = 1980;
    const layout = () => {
      const vw = stage.clientWidth || window.innerWidth;
      CW = Math.min(250, Math.max(168, vw * 0.16)) * P.cardScale;
      const CH = CW * P.cardRatio;
      STEP = CW * (1 + P.spacing);
      SPAN = STEP * slots;
      stage.style.setProperty("--cw", `${CW}px`);
      stage.style.setProperty("--ch", `${CH}px`);
      stage.style.setProperty("--cy", `${P.cardY * 100}%`);
      stage.style.setProperty("--tilt", `${P.tilt}deg`);
      stage.style.perspective = `${Math.max(800, vw * 0.9 * P.perspective)}px`;
      stage.style.perspectiveOrigin = `50% ${P.cardY * 100}%`;
    };

    let pos = 0;
    let vel = 0;
    let dragging = false;
    let lastX = 0;
    let downX = 0;
    let moved = false;
    let hoverEl: HTMLElement | null = null;
    let lastPlaced = Number.NaN;
    let focusEl: HTMLElement | null = null;

    const place = () => {
      const half = SPAN / 2;
      let nearest = Infinity;
      let nearestEl: HTMLElement | null = null;
      for (let i = 0; i < cards.length; i++) {
        let x = (((i * STEP + pos) % SPAN) + SPAN) % SPAN;
        if (x > half) x -= SPAN;
        const op = vis(x / SPAN);
        const el = cards[i];
        el.style.transform = `translateX(${x.toFixed(1)}px)`;
        el.style.opacity = op.toFixed(3);
        el.style.visibility = op < 0.008 ? "hidden" : "visible";
        if (op > 0.5 && Math.abs(x) < nearest) {
          nearest = Math.abs(x);
          nearestEl = el;
        }
      }
      // The card Enter opens: the one nearest the middle of the belt.
      if (nearestEl !== focusEl) {
        focusEl?.classList.remove("-front");
        focusEl = nearestEl;
        focusEl?.classList.add("-front");
      }
    };

    const setHover = (card: HTMLElement | null) => {
      if (card === hoverEl) return;
      hoverEl?.classList.remove("-active");
      hoverEl = card;
      hoverEl?.classList.add("-active");
    };
    const hoverAt = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y);
      setHover(el ? (el.closest("[data-slot]") as HTMLElement | null) : null);
    };

    const openAt = (card: HTMLElement | null) => {
      if (!card) return;
      const slot = Number(card.dataset.slot);
      returnTo.current = stage;
      setView({ mode: "story", index: slot % n });
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = downX = e.clientX;
      moved = false;
      vel = 0;
      setHover(null);
      stage.classList.add("-drag");
      stage.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        if (Math.abs(e.clientX - downX) > P.tapSlop) moved = true;
        const d = dx * P.drag;
        pos += d;
        vel = d;
      } else if (canHover) {
        hoverAt(e.clientX, e.clientY);
      }
    };
    const onUp = (e: PointerEvent) => {
      const wasTap = dragging && !moved;
      dragging = false;
      stage.classList.remove("-drag");
      if (wasTap) {
        // Pointer capture retargets the event to the stage: hit-test at the release point.
        const el = document.elementFromPoint(e.clientX, e.clientY);
        openAt(el ? (el.closest("[data-slot]") as HTMLElement | null) : null);
      }
    };
    const onCancel = () => {
      dragging = false;
      stage.classList.remove("-drag");
    };
    const onLeave = () => setHover(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        vel += STEP * 0.14;
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        vel -= STEP * 0.14;
        e.preventDefault();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openAt(focusEl);
      }
    };
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onCancel);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("keydown", onKey);

    let last = 0;
    const tick = (time: number) => {
      const k = last ? Math.min(3, (time - last) / FRAME_MS) : 1;
      last = time;
      if (!dragging) {
        const held = !!hoverEl || viewRef.current !== null || document.hidden;
        if (!held) {
          pos += vel * k;
          if (!reduce) pos -= P.autoScroll * k;
        }
        vel *= Math.pow(P.damp, k);
        if (Math.abs(vel) < 0.001) vel = 0;
      }
      if (pos !== lastPlaced) {
        place();
        lastPlaced = pos;
      }
    };
    const every = () => 0;
    let unsubscribe: (() => void) | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !unsubscribe) {
          last = 0;
          unsubscribe = subscribeToTicker(tick, every);
        } else if (!entry.isIntersecting && unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
      },
      { rootMargin: "20% 0px" },
    );
    observer.observe(band);

    const resize = () => {
      layout();
      place();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    layout();
    place();
    band.dataset.ready = "";

    return () => {
      observer.disconnect();
      ro.disconnect();
      unsubscribe?.();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onCancel);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("keydown", onKey);
      delete band.dataset.ready;
    };
  }, [slots, n]);

  const close = () => setView(null);

  return (
    <>
      <div ref={bandRef} className="slip__band" data-slip-band>
        <div ref={stageRef} className="slip__stage" tabIndex={0} role="region" aria-label={strings.region} data-slip-stage>
          <div ref={beltRef} className="slip__belt" aria-hidden="true">
            {Array.from({ length: slots }, (_, i) => {
              const s = stories[i % n];
              const photo = s.photos[0];
              const meta = [s.name, s.location, s.dateLabel].filter(Boolean).join(" · ");
              return (
                <article key={i} className={`slip__card${photo ? "" : " -quote"}`} data-slot={i} lang={s.qLang}>
                  <div className="slip__inner">
                    {photo ? (
                      <Image
                        src={photo.src}
                        alt=""
                        fill
                        sizes="250px"
                        draggable={false}
                        unoptimized={!isOptimizableImage(photo.src)}
                        className="slip__photo"
                      />
                    ) : (
                      <span className="slip__mark font-serif" aria-hidden="true">
                        “
                      </span>
                    )}
                    <div className="slip__scrim" />
                    <div className="slip__foot">
                      <p className="slip__excerpt font-serif">{s.excerpt}</p>
                      <p className="slip__meta font-manrope">{meta}</p>
                      {s.rating != null && <Stars value={s.rating} />}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <div className="slip__vignette" aria-hidden="true" />
        <p className="slip__hint font-manrope" aria-hidden="true">
          {strings.hint}
        </p>
        <button
          type="button"
          className="slip__all font-tight"
          data-analytics="stories-see-all"
          onClick={(e) => {
            returnTo.current = e.currentTarget;
            setView({ mode: "all" });
          }}
        >
          {strings.seeAll} <span aria-hidden="true">→</span>
        </button>
      </div>

      <StoryDialog view={view} stories={stories} strings={strings} lang={lang} onClose={close} onOpen={(index) => setView({ mode: "story", index })} onAll={() => setView({ mode: "all" })} returnTo={returnTo} />
    </>
  );
};
