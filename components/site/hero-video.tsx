"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Hero background video. Muted, looping, inline on iOS, with a visible
 * pause/play control. Honours prefers-reduced-motion by not autoplaying.
 * The poster is the first frame of the clip so there is no flash on load.
 */
export function HeroVideo({ playLabel, pauseLabel }: { playLabel: string; pauseLabel: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      setPaused(true);
    }
  }, []);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { void v.play(); setPaused(false); }
    else { v.pause(); setPaused(true); }
  }

  return (
    <>
      <video
        ref={ref}
        className="pomelli-hero__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/home/hero-poster.webp"
        aria-hidden="true"
      >
        <source src="/videos/hero-artisan.webm" type="video/webm" />
        <source src="/videos/hero-artisan.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        className="pomelli-hero__toggle"
        aria-label={paused ? playLabel : pauseLabel}
        aria-pressed={paused}
        onClick={toggle}
      >
        {paused ? "▶" : "❚❚"}
      </button>
    </>
  );
}
