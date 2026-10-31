"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True once the element has been seen, and true from then on.
 *
 * One-shot on purpose: an entrance that replays every time the section comes
 * back turns a page into a slideshow, and the piece that plays it is by then
 * something the reader has already read.
 *
 * An observer rather than the ticker the pinned blocks use — those scrub their
 * animation against the scroll and need a value every frame; this only needs to
 * know once that the moment has come, and the browser can answer that without
 * waking anything up.
 */
export const useInView = <T extends HTMLElement>(
  margin = "0px 0px -15% 0px",
): [React.RefObject<T | null>, boolean] => {
  // The node has to draw a box. Hung on a `display: contents` wrapper the
  // observer has nothing to intersect and never fires at all — measured, the
  // entrance sat at its start value for as long as the page was open.
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;

    // No observer, no gate: show the content rather than hide it behind a
    // feature that never arrives.
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [margin, seen]);

  return [ref, seen];
};
