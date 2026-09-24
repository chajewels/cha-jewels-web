"use client";
import { useEffect, useRef, useState } from "react";
import { readHeroSource } from "@/components/site/hero-source";
import { REDUCED } from "@/components/fx/media";

/**
 * THE LOGO, TURNING TO FACE YOU (the About page). A six-second clip of the
 * Cha Jewels sign, lit gold, turning until it faces the reader — played once
 * when it comes on screen, then held on its last, front-facing frame. Played
 * again each time it re-enters view. The same pattern as the Values artisan
 * clip (components/fx/artisan-video.tsx).
 *
 * THE STILL IS THE TILE. A <picture> renders from the server, visible on the
 * first frame: the clip's FIRST frame, so the video starts exactly where the
 * picture is — except under prefers-reduced-motion, where a <source media>
 * serves the FINAL, front-facing frame straight from the HTML (no JavaScript,
 * no flash). The <video> sits on top, invisible until it is actually playing.
 *
 * NOTHING IS FETCHED ON PAGE LOAD. The clip gets its sources only when the
 * tile is within 150px of the viewport. Which clip, or none: the hero video's
 * rules (readHeroSource) — a phone gets the 600×600 pair (≤ 221 KB), a wide
 * screen with a mouse the 900×900 pair (≤ 442 KB); Data Saver, a slow
 * connection or prefers-reduced-data mean no clip at all, and then the still
 * switches to the final frame. Reduced motion likewise never fetches it.
 *
 * Muted, inline, no controls, no audio track. Paused while the tab is hidden.
 */
const CLIPS = {
  full: { webm: "/videos/about-logo.webm", mp4: "/videos/about-logo.mp4" },
  mobile: { webm: "/videos/about-logo-mobile.webm", mp4: "/videos/about-logo-mobile.mp4" },
} as const;

const still = (frame: "first" | "final", ext: "avif" | "webp") =>
  `/images/about/about-logo-${frame}-600.${ext} 600w, /images/about/about-logo-${frame}-900.${ext} 900w`;

export function AboutLogoVideo({ alt, sizes, className = "" }: { alt: string; sizes: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [clip, setClip] = useState<keyof typeof CLIPS | null>(null);
  const [showing, setShowing] = useState(false);
  const [finalOnly, setFinalOnly] = useState(false);
  const inViewRef = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia(REDUCED);
    const source = readHeroSource();
    if (reduced.matches) return; // the <picture> already shows the final frame
    if (source === "none") { setFinalOnly(true); return; }
    let replay = false;

    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setClip(source); near.disconnect(); }
    }, { rootMargin: "0px 0px 150px 0px" });
    const seen = new IntersectionObserver(([e]) => {
      inViewRef.current = e.isIntersecting;
      if (e.isIntersecting && !document.hidden && !reduced.matches) {
        if (replay || v.ended) v.currentTime = 0;
        replay = false;
        void v.play().catch(() => undefined);
      } else if (!e.isIntersecting) {
        replay = true;
        v.pause();
      }
    }, { threshold: 0.35 });
    const onVis = () => {
      if (document.hidden) v.pause();
      else if (inViewRef.current && !v.ended && !reduced.matches) void v.play().catch(() => undefined);
    };
    const onReduced = () => { if (reduced.matches) { v.pause(); setShowing(false); } };
    const onPlaying = () => setShowing(true);
    near.observe(v); seen.observe(v);
    document.addEventListener("visibilitychange", onVis);
    reduced.addEventListener("change", onReduced);
    v.addEventListener("playing", onPlaying);
    return () => {
      near.disconnect(); seen.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      reduced.removeEventListener("change", onReduced);
      v.removeEventListener("playing", onPlaying);
    };
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || !clip) return;
    v.load();
    if (inViewRef.current && !document.hidden) void v.play().catch(() => undefined);
  }, [clip]);

  return (
    <div className={`relative aspect-square overflow-hidden ${className}`}>
      {/* On lg the still sits in the first screen and is the page's LCP
          element; on phones it is far below the fold. So the <img> is lazy
          (a phone does not spend its first second on it — measured +36 ms of
          LCP when eager) and a desktop-only preload fetches it at once
          (measured 286 → 460 ms when lazy without it). React hoists this
          <link> into <head>. */}
      <link rel="preload" as="image" type="image/avif" imageSrcSet={still("first", "avif")} imageSizes={sizes}
        media="(min-width: 1024px) and (prefers-reduced-motion: no-preference)" fetchPriority="high" />
      <picture>
        {/* Reduced motion: the final, front-facing frame, from the HTML. */}
        <source media="(prefers-reduced-motion: reduce)" type="image/avif" srcSet={still("final", "avif")} sizes={sizes} />
        <source media="(prefers-reduced-motion: reduce)" type="image/webp" srcSet={still("final", "webp")} sizes={sizes} />
        <source type="image/avif" srcSet={still(finalOnly ? "final" : "first", "avif")} sizes={sizes} />
        <img
          src={`/images/about/about-logo-${finalOnly ? "final" : "first"}-900.webp`}
          srcSet={still(finalOnly ? "final" : "first", "webp")}
          sizes={sizes}
          alt={alt}
          width={900}
          height={900}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      <video
        ref={ref}
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${showing ? "opacity-100" : "opacity-0"}`}
      >
        {clip && (
          <>
            <source src={CLIPS[clip].webm} type="video/webm" />
            <source src={CLIPS[clip].mp4} type="video/mp4" />
          </>
        )}
      </video>
    </div>
  );
}
