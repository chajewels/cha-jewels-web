"use client";
import { useEffect } from "react";

/**
 * FIRST LOAD OR CLIENT NAVIGATION?
 *
 * The LCP rule (docs/tasks/web-motion-signature.md, constraint 2): on the
 * first page load nothing above the fold may start hidden. Entrances that
 * hide first — the hero's split-text headline — are allowed only when the
 * reader has arrived by client-side navigation, when there is no LCP to
 * protect and the page is being built in front of them anyway.
 *
 * `booted` flips in this marker's effect. Every component in the first page
 * load RENDERS before any effect runs, so all of them see false; anything
 * rendered after that is a navigation. Components read it once, at first
 * render (a useState initialiser), so the answer cannot change under them.
 * Mounted once in app/layout.tsx; renders nothing.
 */
let booted = false;
export const isClientNavigation = () => booted;

export function BootMarker() {
  useEffect(() => { booted = true; }, []);
  return null;
}
