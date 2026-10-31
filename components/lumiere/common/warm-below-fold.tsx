"use client";

// Ported from the Lumière reference (src/components/common/warm-below-fold.tsx);
// invariant "Below-the-fold images are warmed after load" (its optimization-history.md).

import { useEffect } from "react";

import { useHasLoaded } from "@/lib/lumiere/preload-store";

/** After the curtain lifts, how long the hero's entrance gets to itself. */
const AFTER_REVEAL_MS = 2500;
const IDLE_TIMEOUT_MS = 1000;

const whenIdle = (run: () => void): void => {
  // Safari has no requestIdleCallback
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
  } else {
    setTimeout(run, 50);
  }
};

/**
 * Downloads and decodes the page's lazy images ahead of the scroll, in page
 * order, one per idle period — the very `<img>` elements `next/image`
 * rendered, so the variant fetched is the one shown and nothing extra is sent.
 *
 * Left lazy, each collection photo was fetched as it neared the viewport and
 * decoded in the frame that revealed it: a 167 ms frame in 3/3 phone runs
 * (scroll test, the reference's baseline).
 */
export const WarmBelowFold = () => {
  const hasLoaded = useHasLoaded();

  useEffect(() => {
    if (!hasLoaded) return;
    let isCancelled = false;

    const start = window.setTimeout(() => {
      const images = [
        ...document.querySelectorAll<HTMLImageElement>('main img[loading="lazy"]'),
      ];
      const next = () => {
        if (isCancelled) return;
        const image = images.shift();
        if (!image) return;
        image.loading = "eager";
        image
          .decode()
          .catch(() => undefined)
          .then(() => whenIdle(next));
      };
      whenIdle(next);
    }, AFTER_REVEAL_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(start);
    };
  }, [hasLoaded]);

  return null;
};
