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

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animated, useSpring } from "@react-spring/web";

import { designUnit } from "@/lib/lumiere/design-unit";
import { usePreloadStore } from "@/lib/lumiere/preload-store";
import { whenGatesReady } from "@/lib/lumiere/ready-gates";
import { lockScroll } from "@/lib/scroll-lock";

/**
 * The curtain lifts no later than this after the page's FIRST PAINT, whatever
 * is still loading (D-9). Counted from the paint, not from hydration: on a
 * phone the hero's script arrives a second or two after the curtain is first
 * seen, and a cap that started counting then kept the visitor behind the gate
 * for that long again (P2 part A: 5.2–6.7 s to the lift on Lighthouse's
 * mobile profile, every run on the cap).
 */
export const PRELOADER_CAP_MS = 4000;
/**
 * The least the gate keeps counting for once it can (hydration later than the
 * cap): long enough for the rule to be seen reaching the end, no longer.
 */
export const PRELOADER_MIN_MS = 300;
/**
 * How long a 3D scene's gate may hold the curtain after the hero's own images
 * and webfonts have landed. The pendant draws its first frame in about a
 * second on a recent phone and inside the cap on a slow one; past this it
 * fades in over its poster after the lift (hero-pendant.tsx, the `fade`
 * spring) rather than holding the whole page. The rings no longer gate the
 * curtain at all (featured-rings.tsx: built after the pendant, as the block
 * nears).
 */
export const SCENE_GATE_MS = 1500;
/**
 * …and only while the visitor has waited less than this since the first
 * paint. A phone that hydrates late has already looked at the gate for most
 * of the cap; it gets the page the moment the hero's own assets are in, and
 * the pendant arrives over its poster. A fast device (hydrated well inside
 * this) still gives the pendant its full grace, so there the scene is under
 * the curtain as the reference intends.
 */
export const SCENE_DEADLINE_MS = 2500;
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

/**
 * Milliseconds since the document's first paint — the moment the curtain was
 * first seen. The paint entry is the browser's own; before it exists (an
 * effect can run first on a cold cache) the gate was not yet seen, so nothing
 * has elapsed.
 */
const sinceFirstPaint = (): number => {
  try {
    const paint = performance.getEntriesByType("paint").find((entry) => entry.name === "first-paint" || entry.name === "first-contentful-paint");
    return paint ? Math.max(0, performance.now() - paint.startTime) : 0;
  } catch {
    return 0;
  }
};

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
  document.documentElement.setAttribute(PRELOADER_SEEN_ATTR, "");
};

/** Root attribute set before first paint when this tab has seen the curtain (app/globals.css hides the gate). */
export const PRELOADER_SEEN_ATTR = "data-lumiere-preloaded";

/**
 * Runs during HTML parsing, before anything paints: a repeat visit in this
 * tab never shows the black gate, not even for a frame. The same decision the
 * effect below makes, taken earlier. (Server HTML only — React does not run
 * an inline script it renders on the client; on a client navigation the
 * attribute is already on the root from `markSeen`.)
 */
const PREPAINT_SCRIPT = `try{if(sessionStorage.getItem(${JSON.stringify(PRELOADER_SEEN_KEY)})==="1")document.documentElement.setAttribute(${JSON.stringify(PRELOADER_SEEN_ATTR)},"")}catch(e){}`;

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
  // The lock is released when the curtain lifts (below), not only on
  // cleanup: rendering `null` does not unmount a component — it stays alive
  // with its effects intact — so relying on cleanup would leave the page
  // locked for good. Idempotent, so the cleanup may call it again.
  const releaseLock = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (preloaderSeen()) {
      setSkipped(true);
      usePreloadStore.getState().setLoaded();
      return;
    }
    setSkipped(false);
  }, []);

  useEffect(() => {
    if (skipped !== false) return;
    const release = lockScroll();
    releaseLock.current = release;

    let settled = 0;
    let isCancelled = false;
    const images = heroImages();
    // Whatever is left of the cap, measured from the first paint; the scenes'
    // grace shrinks to nothing as the deadline passes.
    const elapsed = sinceFirstPaint();
    const remaining = Math.max(PRELOADER_MIN_MS, PRELOADER_CAP_MS - elapsed);
    const sceneBudget = Math.max(0, Math.min(SCENE_GATE_MS, SCENE_DEADLINE_MS - elapsed, remaining));
    const gates = whenGatesReady(sceneBudget);
    // + the webfonts (the wordmark and the category strip size themselves from
    // real glyph metrics) + every registered scene gate
    const total = images.length + 1 + gates.length;

    // Once the cap has fired the bar stays at 100 %: a late `settle` must not
    // pull it back down during the fade.
    let capped = false;
    const settle = () => {
      settled += 1;
      if (!isCancelled && !capped) setProgress(Math.min(1, settled / total));
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
    // THE HARD CAP (D-9): 4 s after the first paint everything still pending
    // counts as landed.
    const cap = setTimeout(() => {
      capped = true;
      [...pending].forEach(done);
      if (!isCancelled) setProgress(1);
    }, remaining);

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
    // Released here, the moment the curtain starts to lift (see `releaseLock`).
    releaseLock.current();
    // Marked seen once the curtain has actually been shown through to the
    // lift — not at mount, where React's development double-mount would read
    // the key it had just set and never show the gate in `next dev`.
    markSeen();

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
    <>
      {/* Pre-paint: hides the gate on a repeat visit before the first frame. */}
      <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
    <animated.div
      // Not `aria-hidden`: a screen reader should be told the page is busy
      // rather than handed a silent, empty document.
      role="status"
      aria-live="polite"
      aria-label={label}
      data-testid="lumiere-preloader"
      data-lumiere-preloader=""
      // Black, with the mark, rule and count in white — the dark theme the
      // featured stage and the footer use. The gate fades straight from black
      // to the hero's cream.
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-content text-content-inverse inset-safe"
      style={{
        opacity: exit.opacity,
        pointerEvents: hasLoaded ? "none" : "auto",
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
    </>
  );
};
