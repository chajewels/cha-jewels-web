"use client";
import { useEffect, useRef, useState } from "react";
import { useHeroMotion } from "@/components/home/hero";

/**
 * Hero background video. Muted, looping, inline on iOS, with a visible
 * pause/play control that governs the whole hero (see components/home/hero.tsx
 * — the same button stops the slide rotation).
 *
 * IT DOES NOT AUTOPLAY, AND IT DOES NOT LOAD UNTIL IT IS WANTED.
 *
 * Before 2026-09-22 this was `autoPlay` with both <source> elements in the
 * markup, so the clip was fetched and decoded on every homepage visit —
 * including behind a full-bleed category slide that covered it completely,
 * after the reader had scrolled past, and in a background tab. The poster is
 * the whole first paint now; the sources are attached only at the moment
 * something first decides the video should play, so a visitor who scrolls
 * straight past the hero, or who arrives with reduced motion on, never
 * downloads it at all.
 *
 * `armed` is one-way. Once the sources exist they stay — re-attaching them on
 * every slide change would re-fetch, and the browser's own buffer is the right
 * thing to be reusing when the reader swipes back to slide 0.
 *
 * THE CONTROL REFLECTS THE MEDIA, NOT OUR INTENTION. It used to be set
 * optimistically in the click handler, so a play() the browser refused left a
 * button reading "pause" over a still poster. `playing` comes from the
 * element's own play/pause events, and a rejected play() simply leaves it
 * false — the poster stays, the button offers "play", and nothing pretends.
 */
export function HeroVideo({ playLabel, pauseLabel }: { playLabel: string; pauseLabel: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { videoOn, paused, toggle } = useHeroMotion();
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Arm on the first "yes". One-way: see above.
  useEffect(() => { if (videoOn) setArmed(true); }, [videoOn]);

  // The element's own events are the only source of `playing`.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onPause);
    return () => { v.removeEventListener("play", onPlay); v.removeEventListener("pause", onPause); v.removeEventListener("ended", onPause); };
  }, [armed]);

  // Drive the element from the decision, not the other way round.
  useEffect(() => {
    const v = ref.current;
    if (!v || !armed) return;
    if (videoOn) {
      // play() rejects on a policy refusal and on an interrupted load. Either
      // way the poster is what the reader keeps, which is a correct picture of
      // the hero rather than a black box.
      void v.play().catch(() => setPlaying(false));
    } else if (!v.paused) {
      v.pause();
    }
  }, [videoOn, armed]);

  return (
    <>
      <video
        ref={ref}
        className="hero-video"
        muted
        loop
        playsInline
        // `none`, not `metadata`: with no <source> yet there is nothing to
        // preload, and once armed the play() below is what starts the fetch.
        preload="none"
        poster="/images/home/hero-poster.webp"
        aria-hidden="true"
      >
        {armed && (
          <>
            <source src="/videos/hero-artisan.webm" type="video/webm" />
            <source src="/videos/hero-artisan.mp4" type="video/mp4" />
          </>
        )}
      </video>
      <button
        type="button"
        className="hero-video__toggle"
        // One control for the whole hero: the label is about the motion, and
        // `paused` is the reader's own choice rather than `playing`, which
        // also goes false when the hero simply scrolls out of view.
        aria-label={paused ? playLabel : pauseLabel}
        aria-pressed={paused}
        onClick={toggle}
      >
        {paused || !playing ? "▶" : "❚❚"}
      </button>
    </>
  );
}
