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
/**
 * The poster is the hero's whole first paint, so app/page.tsx preloads it —
 * exported from here so the preload and the <video> can never name different
 * files.
 */
export const HERO_POSTER = "/images/home/hero-poster.webp";

/**
 * WHICH CLIP, OR NONE AT ALL.
 *
 * The full clip is 1.86 MB of WebM (3.78 MB of MP4) at 1920x1080. On the
 * measured mobile baseline it was 68% of the homepage's 2.78 MB — the single
 * largest thing the site sends anyone, downloaded into a box 412px wide behind
 * a scrim. See docs/perf-baseline.md.
 *
 *   "none"    the reader has asked for less data, or the connection says it
 *             cannot afford this. The poster is the hero and nothing is
 *             fetched. This outranks everything below, including screen size.
 *   "mobile"  a narrow viewport or a coarse pointer: the 854x480 encode,
 *             397 KiB of WebM / 434 KiB of MP4, same framing and aspect.
 *   "full"    a wide viewport with a fine pointer: unchanged, as before.
 *
 * `prefers-reduced-data` is not implemented everywhere; matchMedia on an
 * unsupported feature simply never matches, which is the right default.
 * `navigator.connection` is Chromium-only, so every read of it is guarded —
 * absent means "no reason to hold back", not "assume the worst".
 */
export type HeroSource = "full" | "mobile" | "none";

type ConnectionLike = { saveData?: boolean; effectiveType?: string; addEventListener?: (t: string, l: () => void) => void; removeEventListener?: (t: string, l: () => void) => void };
const SLOW_TYPES = new Set(["slow-2g", "2g", "3g"]);

function readHeroSource(): HeroSource {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "none";
  if (window.matchMedia("(prefers-reduced-data: reduce)").matches) return "none";
  const conn = (navigator as Navigator & { connection?: ConnectionLike }).connection;
  if (conn) {
    if (conn.saveData === true) return "none";
    if (conn.effectiveType && SLOW_TYPES.has(conn.effectiveType)) return "none";
  }
  const roomy = window.matchMedia("(min-width: 1024px)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  return roomy && fine ? "full" : "mobile";
}

const CLIP: Record<Exclude<HeroSource, "none">, { webm: string; mp4: string }> = {
  full: { webm: "/videos/hero-artisan.webm", mp4: "/videos/hero-artisan.mp4" },
  mobile: { webm: "/videos/hero-artisan-mobile.webm", mp4: "/videos/hero-artisan-mobile.mp4" },
};

export function HeroVideo({ playLabel, pauseLabel }: { playLabel: string; pauseLabel: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { videoOn, paused, toggle, mediaRef } = useHeroMotion();
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  /**
   * null until the client has been asked. It starts null rather than "full"
   * for the same reason `asked` exists in hero.tsx: the server cannot know,
   * and one optimistic render is all it takes to attach a <source> and fetch
   * 1.86 MB on a phone.
   */
  const [source, setSource] = useState<HeroSource | null>(null);
  /** The clip chosen at arm time, frozen. Swapping src later would re-fetch. */
  const chosen = useRef<Exclude<HeroSource, "none"> | null>(null);

  // Subscribed, not read once — a reader can turn Data Saver on, rotate the
  // phone, or move the window to another display while this is on screen, and
  // the answer to "which clip" changes with them. Same pattern as hero.tsx.
  useEffect(() => {
    const apply = () => setSource(readHeroSource());
    apply();
    const queries = [
      window.matchMedia("(prefers-reduced-data: reduce)"),
      window.matchMedia("(min-width: 1024px)"),
      window.matchMedia("(hover: hover) and (pointer: fine)"),
    ];
    queries.forEach((q) => q.addEventListener("change", apply));
    const conn = (navigator as Navigator & { connection?: ConnectionLike }).connection;
    conn?.addEventListener?.("change", apply);
    return () => {
      queries.forEach((q) => q.removeEventListener("change", apply));
      conn?.removeEventListener?.("change", apply);
    };
  }, []);

  // Arm on the first "yes". One-way: see above. "none" never arms, so a
  // reader on Data Saver or a 2g/3g connection never fetches a clip at all.
  useEffect(() => {
    if (!videoOn || source === null || source === "none") return;
    if (!chosen.current) chosen.current = source;
    setArmed(true);
  }, [videoOn, source]);

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
      {/* The scroll sink's scale lives on this wrapper, not on the <video>: the
          element, its sources and its loading are exactly as before. */}
      <div ref={mediaRef} className="absolute inset-0 z-0">
      <video
        ref={ref}
        className="hero-video"
        muted
        loop
        playsInline
        // `none`, not `metadata`: with no <source> yet there is nothing to
        // preload, and once armed the play() below is what starts the fetch.
        preload="none"
        poster={HERO_POSTER}
        aria-hidden="true"
      >
        {armed && chosen.current && (
          <>
            <source src={CLIP[chosen.current].webm} type="video/webm" />
            <source src={CLIP[chosen.current].mp4} type="video/mp4" />
          </>
        )}
      </video>
      </div>
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
