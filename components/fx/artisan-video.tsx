"use client";
import { useEffect, useRef, useState } from "react";
import { readHeroSource } from "@/components/site/hero-video";
import { REDUCED } from "@/components/fx/media";

/**
 * THE ARTISAN, MOVING. The "Our Values" photo tile plays a five-second clip
 * made from the same photograph — the camera easing in toward the hands
 * threading pearls — once as the tile comes into view, then holds on its last
 * frame. It plays again each time the tile re-enters view.
 *
 * The photo is still the tile. It renders exactly as before (the caller's
 * <Image>, same crop) and this video sits on top of it, invisible until it is
 * actually playing, so the first frame of the clip replaces the photo it was
 * made from.
 *
 * NOTHING IS FETCHED ON PAGE LOAD. The <video> has no source until the tile is
 * within 150px of the bottom of the viewport — a margin on the bottom only,
 * so on a tall desktop screen, where the tile starts just under the fold, it
 * still waits for the reader to scroll. A visitor who never scrolls there
 * never downloads it, and it is not in the page's load weight.
 *
 * WHICH CLIP, OR NONE: the hero video's own rules (readHeroSource in
 * components/site/hero-video.tsx, #127/#129) — Data Saver, a slow connection
 * or prefers-reduced-data mean the photo only; a phone gets the 854×480 pair
 * (≤ 256 KB), a wide screen with a mouse the 1280×720 pair (≤ 516 KB). And
 * reduced motion means the photo only, never fetched.
 *
 * Muted, inline, no controls, no audio track at all. Paused while the tab is
 * hidden. The tile's entrance wipe and spotlight are on the elements around
 * it and keep working.
 */
const CLIPS = {
  full: { webm: "/videos/values-artisan.webm", mp4: "/videos/values-artisan.mp4" },
  mobile: { webm: "/videos/values-artisan-mobile.webm", mp4: "/videos/values-artisan-mobile.mp4" },
} as const;

export function ArtisanVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [clip, setClip] = useState<keyof typeof CLIPS | null>(null);
  const [showing, setShowing] = useState(false);
  const inViewRef = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia(REDUCED);
    const source = readHeroSource();
    if (reduced.matches || source === "none") return;
    let replay = false;

    // Near the viewport: attach the sources (fetch starts now, not on load).
    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setClip(source); near.disconnect(); }
    }, { rootMargin: "0px 0px 150px 0px" });
    // In view: play from the start; out of view: arm a replay for next time.
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

  // The sources arrive after the first "in view" may already have fired: load
  // them, and start if the tile is still being looked at.
  useEffect(() => {
    const v = ref.current;
    if (!v || !clip) return;
    v.load();
    if (inViewRef.current && !document.hidden) void v.play().catch(() => undefined);
  }, [clip]);

  return (
    <video
      ref={ref}
      muted
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className={`${className} transition-opacity duration-500 ${showing ? "opacity-100" : "opacity-0"}`}
    >
      {clip && (
        <>
          <source src={CLIPS[clip].webm} type="video/webm" />
          <source src={CLIPS[clip].mp4} type="video/mp4" />
        </>
      )}
    </video>
  );
}
