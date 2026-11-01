"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A LAZY CLIENT ISLAND for a below-the-fold section (P2, report §10).
 *
 * The section's markup is server-rendered around this — the copy, the links,
 * the images are in the HTML for every reader and every crawler. What waits
 * here is the section's BEHAVIOUR: `children` is rendered only once the
 * island's own box has come within `margin` of the viewport, so the client
 * component inside (and the `import()` it makes) costs the first load nothing.
 * Until then the server renders `fallback` (nothing, by default: the static
 * markup already stands).
 *
 * One-shot: once near, it stays mounted — an engine that unmounted on the way
 * back up would replay its entrance, and the reader has seen it.
 */
export interface NearIslandProps {
  children: ReactNode;
  /** How far outside the viewport counts as near. */
  margin?: string;
  fallback?: ReactNode;
  className?: string;
}

export const NearIsland = ({ children, margin = "75% 0px", fallback = null, className }: NearIslandProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [margin, near]);

  return (
    // `display: contents` would give the observer nothing to intersect
    // (hooks/use-in-view.ts); a zero-height block at the section's own
    // position is enough, and it is what the parent's layout sees either way.
    <div ref={ref} className={className} data-near-island={near ? "mounted" : "waiting"}>
      {near ? children : fallback}
    </div>
  );
};
