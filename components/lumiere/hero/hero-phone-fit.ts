"use client";

import { useLayoutEffect, useState } from "react";

/**
 * THE PHONE FIT (P5b, owner decision 2). Below 768 the hero is a column: headline, the card ring, then the standfirst and
 * the CTA, between the announcement bar above and the tab bar below. The ring used to hang at a fixed 57% of the stage
 * and keep the design unit's full size, so on a short or narrow phone it ran into the standfirst (and the standfirst's
 * 2 → 3 lines at 320–375 made it worse). This measures the band that is actually free — from the headline art's foot to
 * the standfirst's top — and fits the ring into it: centred in the band, scaled down only as far as it must.
 *
 * Measured from layout boxes (`offset*`), never from transformed rects, so the entrance's rise and the tilt cannot
 * disturb it. The scale is a visual scale about the ring's own centre applied to the whole ring (hero-cluster.tsx) and
 * eased back to 1 as the hero card leaves the formation (TIMELINE.rotateEnd → frame2End), so frame 2 and 3 are
 * untouched. Desktop and tablet return null and keep their geometry.
 */
export interface PhoneFit {
  /** Scale of the ring at rest, 0.34…1. */
  scale: number;
  /** The ring's centre, in px from the stage's top. */
  centrePx: number;
  /** The same as a fraction of the stage's height (heroStateAt's `ringTop`). */
  centreFraction: number;
}

/** The ring's outer diameter in design units (measured: 281 px at a 0.53 unit, both ways). */
const RING_DIAMETER_UNITS = 530;
/** Daylight kept above and below the ring, px. */
const GAP = 12;
const MIN_SCALE = 0.34;
const PHONE_MAX = 767.98;

export const usePhoneFit = (unitPx: number, enabled: boolean): PhoneFit | null => {
  const [fit, setFit] = useState<PhoneFit | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      setFit(null);
      return;
    }
    const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
    const head = stage?.querySelector<HTMLElement>("[data-hero-headline-art]");
    const tag = stage?.querySelector<HTMLElement>("[data-hero-tagline]");
    if (!stage || !head || !tag) return;

    const measure = () => {
      if (window.innerWidth > PHONE_MAX) {
        setFit(null);
        return;
      }
      const band = tag.offsetParent as HTMLElement | null;
      const top = head.offsetTop + head.offsetHeight;
      const bottom = (band?.offsetTop ?? 0) + tag.offsetTop;
      const free = bottom - top - 2 * GAP;
      const diameter = RING_DIAMETER_UNITS * unitPx;
      if (!(free > 0) || !(diameter > 0) || stage.offsetHeight <= 0) {
        setFit(null);
        return;
      }
      const scale = Math.min(1, Math.max(MIN_SCALE, free / diameter));
      const centrePx = top + GAP + free / 2;
      setFit((was) =>
        was && Math.abs(was.scale - scale) < 0.002 && Math.abs(was.centrePx - centrePx) < 0.5
          ? was
          : { scale, centrePx, centreFraction: centrePx / stage.offsetHeight },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    for (const el of [stage, head, tag]) observer.observe(el);
    // Web fonts change the headline's lines after first paint.
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [enabled, unitPx]);

  return fit;
};
