"use client";
import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { DUR, EASE_LUX, PAGE_RISE } from "@/lib/motion";
import { REDUCED } from "@/components/fx/media";

/**
 * THE PAGE ENTRANCE ON CLIENT NAVIGATION. When the route's path changes, the
 * new page in <main id="main"> fades up PAGE_RISE px over DUR.page. The
 * layout effect runs in the same commit that puts the new page on screen,
 * before it is painted, so the page never flashes in at full strength first.
 *
 * Not app/template.tsx, which the brief named: a client template at the root
 * made Next split the root stylesheet in two (the next/font rules into their
 * own file), a third render-blocking stylesheet on every page — the shape
 * that cost ~60 ms of LCP before (docs/perf-baseline.md). This does the same
 * job from the layout with no wrapper element and no remount.
 *
 * Never on the first load (the LCP rule): the first run of the effect is the
 * first load and is skipped. Never under reduced motion, read at the moment
 * of navigation. No fill: when it ends <main> carries no transform or
 * opacity, so sticky columns and fixed dialogs inside the page are unaffected.
 * Mounted once in app/layout.tsx; renders nothing.
 */
export function PageEnter() {
  const path = usePathname();
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    const main = document.getElementById("main");
    if (!main || typeof main.animate !== "function" || window.matchMedia(REDUCED).matches) return;
    main.animate(
      [{ opacity: 0, transform: `translateY(${PAGE_RISE}px)` }, { opacity: 1, transform: "none" }],
      { duration: DUR.page * 1000, easing: `cubic-bezier(${EASE_LUX.join(",")})` },
    );
  }, [path]);
  return null;
}
