"use client";

/**
 * THE PRELOADER — adapted from the Lumière reference
 * (src/components/common/preloader.tsx) per owner decision D-9 and
 * docs/tasks/lumiere-p0-report.md §3.3, §6:
 *  - HOME ONLY, FIRST VISIT PER SESSION: a repeat visit in the same tab
 *    (sessionStorage) shows no curtain and marks the page loaded at once, so
 *    the hero's entrance still plays. Mounted on the home in P2; built and
 *    tested here.
 *  - HARD CAP 4 s (the reference waited 6 s): whatever is still loading, the
 *    curtain starts to lift at 4 s. The 3D keeps loading behind the posters
 *    after the lift (the scenes' own `fade` springs).
 *  - THE CHA JEWELS MARK (D-3): the transparent badge
 *    (public/images/brand/logo-badge-192.webp, white through the same
 *    `brightness-0 invert` the header will use) and "Cha Jewels" in Instrument
 *    Serif, in place of the reference's wordmark artwork.
 *  - The scenes register their readiness through lib/lumiere/ready-gates.ts
 *    instead of being imported here (they arrive in P2).
 *  - The scroll lock is the shared one (lib/scroll-lock.ts), so Lenis stops too.
 *
 * Invariant kept from the reference: the gate waits for the hero's OWN
 * rendered images (`[data-preload] img`, visible ones only) and the webfonts
 * — never raw files, which were fetched twice.
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import { animated, useSpring } from "@react-spring/web";

import { designUnit } from "@/lib/lumiere/design-unit";
import { usePreloadStore } from "@/lib/lumiere/preload-store";
import { whenGatesReady } from "@/lib/lumiere/ready-gates";
import { lockScroll } from "@/lib/scroll-lock";

/** The curtain lifts no later than this, whatever is still loading (D-9). */
export const PRELOADER_CAP_MS = 4000;
/** sessionStorage key: set once the curtain has been shown in this tab. */
export const PRELOADER_SEEN_KEY = "cj-lumiere-preloaded";

/**
 * The hero's own rendered images (`[data-preload]`), the variant `next/image`
 * served this screen — not the raw masters. `display: none` copies (the other
 * breakpoint's poster) are skipped: they may never load.
 */
const heroImages = (): HTMLImageElement[] =>
  [...document.querySelectorAll<HTMLImageElement>("[data-preload] img")].filter(
    (image) => image.getClientRects().length > 0,
  );

/** Width of the progress rule, in design units. Capped at 60vw when applied. */
const RULE_WIDTH = 160;
/** The badge: readable on a 320 screen, the header's size at most. */
const BADGE_WIDTH = "clamp(40px, 10vw, calc(56 * var(--raw-unit-design)))";
/** Beat between reaching 100% and starting to leave, in ms. */
const SETTLE_DELAY = 190;
/** How long the fade itself is given before the gate is taken out of the DOM. */
const EXIT_MS = 480;
/**
 * How far into that fade the hero is told to start, as a share of it. Late
 * enough that the gate is mostly transparent, early enough that the two
 * overlap and the page does not sit still between them.
 */
const REVEAL_AT = 0.45;

/** True when this tab has already shown the curtain (D-9: once per session). */
export const preloaderSeen = (): boolean => {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(PRELOADER_SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

const markSeen = (): void => {
  try {
    sessionStorage.setItem(PRELOADER_SEEN_KEY, "1");
  } catch {
    /* private mode: the curtain simply shows again next time */
  }
};

export interface PreloaderProps {
  /** The screen-reader label; the caller passes the `lib/i18n` string. */
  label?: string;
}

/**
 * Full-screen gate shown until the hero's imagery and webfonts are ready.
 *
 * The progress is real: it counts assets as they land. That matters beyond
 * honesty here, because the hero measures itself against the laid-out page, and
 * starting while eleven photographs are still decoding is what makes a scroll
 * animation snap the first time it runs.
 */
export const Preloader = ({ label = "Loading" }: PreloaderProps) => {
  const [progress, setProgress] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  // Decided in an effect, never during render: the server cannot read
  // sessionStorage, and a render-time read would mismatch the HTML.
  const [skipped, setSkipped] = useState<boolean | null>(null);

  useEffect(() => {
    if (preloaderSeen()) {
      setSkipped(true);
      usePreloadStore.getState().setLoaded();
      return;
    }
    setSkipped(false);
    markSeen();
  }, []);

  useEffect(() => {
    if (skipped !== false) return;
    const release = lockScroll();

    let settled = 0;
    let isCancelled = false;
    const images = heroImages();
    const gates = whenGatesReady(PRELOADER_CAP_MS);
    // + the webfonts (the wordmark and the category strip size themselves from
    // real glyph metrics) + every registered scene gate
    const total = images.length + 1 + gates.length;

    const settle = () => {
      settled += 1;
      if (!isCancelled) setProgress(Math.min(1, settled / total));
    };

    document.fonts.ready.then(settle).catch(settle);
    gates.forEach((gate) => gate.then(settle));

    const pending = new Set<HTMLImageElement>();
    const done = (image: HTMLImageElement) => {
      if (!pending.delete(image)) return;
      settle();
    };
    images.forEach((image) => {
      if (image.complete) {
        settle();
        return;
      }
      pending.add(image);
      // `error` settles too — a missing file must not hold the site hostage.
      image.addEventListener("load", () => done(image), { once: true });
      image.addEventListener("error", () => done(image), { once: true });
    });
    // THE HARD CAP (D-9): at 4 s everything still pending counts as landed.
    const cap = setTimeout(() => {
      [...pending].forEach(done);
      if (!isCancelled) setProgress(1);
    }, PRELOADER_CAP_MS);

    return () => {
      isCancelled = true;
      clearTimeout(cap);
      release();
    };
  }, [skipped]);

  useEffect(() => {
    if (progress >= 1) setHasLoaded(true);
  }, [progress]);

  useEffect(() => {
    if (!hasLoaded) return;

    // The hero's entrance is announced part-way through the fade rather than at
    // the top of it. Announced any earlier and the gate is still opaque over
    // the first half of every reveal, so what reaches the viewer is the tail:
    // the headline all but landed and the chrome, which only travels a few
    // pixels, apparently not animating at all.
    const reveal = setTimeout(
      () => usePreloadStore.getState().setLoaded(),
      SETTLE_DELAY + EXIT_MS * REVEAL_AT,
    );

    // Removal is timed rather than driven by the fade's `onRest`. A spring only
    // reports resting if it actually ran, and when every asset is already in
    // cache the gate can reach 100% within the same commit that created the
    // spring — no animation, no callback, and the gate stays up for good.
    const id = setTimeout(() => setIsRemoved(true), SETTLE_DELAY + EXIT_MS);

    return () => {
      clearTimeout(reveal);
      clearTimeout(id);
    };
  }, [hasLoaded]);

  const rule = useSpring({
    width: `${Math.round(progress * 100)}%`,
    config: { tension: 140, friction: 26 },
  });

  const exit = useSpring({
    opacity: hasLoaded ? 0 : 1,
    delay: hasLoaded ? SETTLE_DELAY : 0,
    config: { tension: 180, friction: 30 },
  });

  if (skipped || isRemoved) return null;

  return (
    <animated.div
      // Not `aria-hidden`: a screen reader should be told the page is busy
      // rather than handed a silent, empty document.
      role="status"
      aria-live="polite"
      aria-label={label}
      data-testid="lumiere-preloader"
      // Black, with the mark, rule and count in white — the dark theme the
      // featured stage and the footer use. The gate fades straight from black
      // to the hero's cream.
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-content text-content-inverse inset-safe"
      style={{
        opacity: exit.opacity,
        pointerEvents: hasLoaded ? "none" : "auto",
        // Until the client has decided, the gate is drawn but still, so a
        // first paint never flashes the page under it.
        visibility: skipped === null ? "visible" : undefined,
      }}
    >
      <div
        className="my-auto flex flex-col items-center"
        style={{ gap: "clamp(12px, 3.5vh, calc(28 * var(--raw-unit-design)))" }}
      >
        <span className="flex items-center" style={{ gap: "clamp(10px, 2vw, calc(16 * var(--raw-unit-design)))" }}>
          {/* The same badge and the same inversion the header will use (D-3),
              so the mark does not change when the gate lifts. */}
          <Image
            src="/images/brand/logo-badge-192.webp"
            alt=""
            width={192}
            height={192}
            priority
            sizes="(max-width: 480px) 10vw, 56px"
            className="block brightness-0 invert"
            style={{ width: BADGE_WIDTH, height: BADGE_WIDTH }}
          />
          <span className="font-serif text-wordmark text-content-inverse">Cha Jewels</span>
        </span>

        <span
          className="relative block overflow-hidden"
          style={{
            width: `min(60vw, ${designUnit(RULE_WIDTH)})`,
            height: designUnit(0.7),
            backgroundColor: "color-mix(in srgb, currentColor 20%, transparent)",
          }}
        >
          <animated.span
            className="absolute inset-y-0 left-0 block bg-current"
            style={{ width: rule.width }}
          />
        </span>

        <span className="font-manrope text-caption font-medium uppercase opacity-30">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </animated.div>
  );
};
