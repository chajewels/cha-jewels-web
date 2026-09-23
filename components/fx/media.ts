"use client";
import { useEffect, useState } from "react";

/**
 * A media query, SUBSCRIBED rather than read once — the same pattern as
 * components/home/hero.tsx. A reader who turns on Reduce Motion, or plugs a
 * mouse into a tablet, while the page is open gets the new answer now.
 *
 * `null` until the client has been asked: the server cannot know, and an
 * optimistic first render is how motion leaks to a reader who asked for none.
 * Every effect here treats null as "not yet — do nothing".
 */
export function useMedia(query: string): boolean | null {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const apply = () => setV(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [query]);
  return v;
}

export const REDUCED = "(prefers-reduced-motion: reduce)";
/** Pointer effects (magnetic, spotlight, tilt) exist only under this query. */
export const FINE = "(hover: hover) and (pointer: fine)";

export const useReduced = () => useMedia(REDUCED);
export const useFinePointer = () => useMedia(FINE);
