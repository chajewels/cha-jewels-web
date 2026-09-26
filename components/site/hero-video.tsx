"use client";
import { useEffect, useRef, useState } from "react";
import { useHeroMotion } from "@/components/home/hero";
import { readHeroSource, type HeroSource, type ConnectionLike } from "@/components/site/hero-source";


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
 * THE PAUSE CONTROL IS NOT HERE ANY MORE (hero slider v2, 2026-09-26). It
 * lives in the deck's control cluster, bottom-left (components/home/
 * hero-slides.tsx), and it still governs the whole hero through `paused`: the
 * film, the rotation and every light. A play() the browser refuses leaves the
 * poster, which is a correct picture of the hero rather than a black box.
 */
/**
 * The poster is the hero's whole first paint, so app/page.tsx preloads it —
 * exported from here so the preload and the <video> can never name different
 * files.
 */
export const HERO_POSTER = "/images/home/hero-poster.webp";

// The rule lives in hero-source.ts (dependency-free); re-exported here for
// the callers that already import it from this file.
export { readHeroSource, type HeroSource };


const CLIP: Record<Exclude<HeroSource, "none">, { webm: string; mp4: string }> = {
  full: { webm: "/videos/hero-artisan.webm", mp4: "/videos/hero-artisan.mp4" },
  mobile: { webm: "/videos/hero-artisan-mobile.webm", mp4: "/videos/hero-artisan-mobile.mp4" },
};

export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const { videoOn, mediaRef } = useHeroMotion();
  const [armed, setArmed] = useState(false);
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

  // Drive the element from the decision, not the other way round.
  useEffect(() => {
    const v = ref.current;
    if (!v || !armed) return;
    if (videoOn) {
      // play() rejects on a policy refusal and on an interrupted load. Either
      // way the poster is what the reader keeps, which is a correct picture of
      // the hero rather than a black box.
      void v.play().catch(() => undefined);
    } else if (!v.paused) {
      v.pause();
    }
  }, [videoOn, armed]);

  return (
    <>
      {/* Two wrappers, two scales that multiply: the outer one is the scroll
          sink (components/home/hero.tsx), the inner one the first-load
          push-in (.hero-push, app/globals.css). Neither is on the <video>:
          the element, its sources and its loading are exactly as before. */}
      <div ref={mediaRef} className="absolute inset-0 z-0">
      <div className="hero-push">
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
      </div>
    </>
  );
}
