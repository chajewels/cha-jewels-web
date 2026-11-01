/**
 * THE CAROUSEL SPOTLIGHT ENGINE — ported from the GetLayers section
 * (docs/design-refs/carousel-spotlight/carousel-spotlight.html, the `<script
 * type="module">` block). Its contract (CONTRACT.md) preserves motion and
 * composition, and both are kept whole:
 *
 *   - the ring is one `--rot` on a `preserve-3d` element; every card sits on
 *     it through `rotateY(--a) translateZ(--r * -1)` (concave) with
 *     backface-visibility culling the far half — in the stylesheet, as the
 *     reference has it;
 *   - drag (0.16° per px), inertia (× 0.94 per frame), snap-to-card settling
 *     at 0.14 of the remaining angle per frame, landing EXACTLY on target and
 *     guarded by `lastRot` so a resting ring stops writing transforms (the
 *     no-shake rule); prev/next, arrow keys, click-to-focus (hit-tested at the
 *     release point, because pointer capture retargets the event), dot jump;
 *   - `render()` ties the front card, the dock caption, the counter, the ghost
 *     index and the lit dot to the centred slot.
 *
 * AUTO-SWIPE (P3 item 3): the ring advances one card every `AUTO.interval`
 * ms, settling with the engine's own snap (so a turn reads as a turn and the
 * no-shake rule holds), and PAUSES on hover, on focus inside the section, during
 * a drag, while the section is off screen (the ticker is unsubscribed there
 * already) and while the tab is hidden; after any interaction it waits
 * `AUTO.idle` ms before resuming. Never under reduced motion.
 *
 * What changed for this site:
 *   - the MARKUP IS SERVER-RENDERED (components/lumiere/arrivals/
 *     arrivals-section.tsx) — cards, captions, dots and buttons are in the
 *     HTML; the engine only binds to them. A caption is a block per piece
 *     (name, metals, price, origin badge, the link to the piece), shown and
 *     hidden rather than rewritten, so the Hub's own markup for a price is
 *     what the reader sees;
 *   - the frame loop runs on the shared ticker (lib/animation/ticker.ts) and
 *     only while the section is near the viewport — one requestAnimationFrame
 *     for the page, idle when the ring is off screen;
 *   - the geometry (`--cw`, `--ch`, `--r`, `--push`, perspective) is the
 *     reference's `layout()` written as CSS `clamp()`/`max()` on the stage
 *     (app/lumiere/sections.css), so no script reads the viewport at all;
 *   - the dev control panel, `localStorage` and Google Fonts are not ported.
 */
import { subscribeToTicker } from "@/lib/animation/ticker";

/** The reference's CONFIG, motion and layout values verbatim (its `P`). */
export const SPOTLIGHT = {
  drag: 0.16,
  damp: 0.94,
  /** Snap: the share of the remaining angle closed per frame. */
  snap: 0.14,
  /** Below this velocity (deg/frame) the ring is settling, not drifting. */
  rest: 0.05,
  /** Movement under this many px is a tap, not a drag. */
  tapSlop: 6,
  /** The ring is live while within this margin of the viewport. */
  nearMargin: "50% 0px",
} as const;

/** The auto-swipe (P3 item 3), in ms. */
export const AUTO = {
  /** One card every this often while nobody is touching it. */
  interval: 3500,
  /** After an interaction, this long before the ring moves by itself again. */
  idle: 4000,
} as const;

const everyFrame = () => 0;
const pad2 = (n: number) => String(n).padStart(2, "0");

export interface SpotlightHandle {
  destroy(): void;
}

/**
 * Binds the engine to a server-rendered `.spotlight` section.
 *
 * Expects, inside `root`: `[data-spotlight-stage]` with `[data-spotlight-ring]`
 * holding `[data-slot]` cards whose `--a` is set; `[data-spotlight-ghost]`;
 * `[data-spotlight-cur]`; `[data-spotlight-caption="<i>"]` blocks;
 * `[data-spotlight-dot="<i>"]` buttons; `[data-spotlight-prev]` /
 * `[data-spotlight-next]`; and `data-count` (unique pieces) on the root.
 */
export const mountSpotlight = (root: HTMLElement): SpotlightHandle => {
  const stage = root.querySelector<HTMLElement>("[data-spotlight-stage]");
  const ring = root.querySelector<HTMLElement>("[data-spotlight-ring]");
  if (!stage || !ring) return { destroy: () => undefined };
  const cards = [...ring.querySelectorAll<HTMLElement>("[data-slot]")];
  const slots = cards.length;
  const count = Math.max(1, Number(root.dataset.count) || 1);
  const ghost = root.querySelector<HTMLElement>("[data-spotlight-ghost]");
  const cur = root.querySelector<HTMLElement>("[data-spotlight-cur]");
  const captions = [...root.querySelectorAll<HTMLElement>("[data-spotlight-caption]")];
  const dots = [...root.querySelectorAll<HTMLElement>("[data-spotlight-dot]")];
  const prev = root.querySelector<HTMLElement>("[data-spotlight-prev]");
  const next = root.querySelector<HTMLElement>("[data-spotlight-next]");
  const live = root.querySelector<HTMLElement>("[data-spotlight-live]");
  const countTemplate = live?.dataset.template ?? "";
  if (slots === 0) return { destroy: () => undefined };

  const stepDeg = 360 / slots;
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- front-card tracking → dock + ghost ---------- */
  let lastCard = -1;
  let lastFrontSlot = -1;
  const frontSlot = () => ((Math.round(-rot / stepDeg) % slots) + slots) % slots;
  const render = () => {
    const fs = frontSlot();
    if (fs !== lastFrontSlot) {
      if (lastFrontSlot >= 0) cards[lastFrontSlot]?.classList.remove("-front");
      cards[fs]?.classList.add("-front");
      lastFrontSlot = fs;
    }
    const ci = fs % count;
    if (ci !== lastCard) {
      lastCard = ci;
      captions.forEach((caption) => {
        const on = Number(caption.dataset.spotlightCaption) === ci;
        caption.hidden = !on;
        caption.setAttribute("aria-hidden", on ? "false" : "true");
      });
      if (cur) cur.textContent = pad2(ci + 1);
      if (ghost) ghost.textContent = pad2(ci + 1);
      dots.forEach((dot, i) => {
        dot.classList.toggle("-on", i === ci);
        dot.setAttribute("aria-selected", i === ci ? "true" : "false");
      });
      if (live && countTemplate) live.textContent = countTemplate.replace("{n}", String(ci + 1)).replace("{total}", String(count));
    }
  };

  /* ---------- interaction: drag / inertia / snap / prev-next / keyboard / click-to-focus ---------- */
  let rot = 0;
  let vel = 0;
  let dragging = false;
  let lastX = 0;
  let downX = 0;
  let moved = false;
  let targetIndex = 0;
  let settled = true;
  let lastRot = Number.NaN;
  /* ---------- auto-swipe state ---------- */
  let hovered = false;
  let focused = false;
  let lastInteraction = -Infinity;
  let lastAuto = -Infinity;
  const touched = (time = performance.now()) => { lastInteraction = time; };
  const applyRot = () => {
    if (rot !== lastRot) {
      ring.style.setProperty("--rot", `${rot}deg`);
      lastRot = rot;
    }
  };

  const nearestCenter = () => Math.round(-rot / stepDeg);
  const go = (delta: number) => {
    targetIndex = nearestCenter() + delta;
    settled = true;
    vel = 0;
  };
  // centre an exact ring slot (nearest copy)
  const focusSlot = (slot: number) => {
    const cs = nearestCenter();
    let d = ((((slot - (cs % slots)) % slots) + slots) % slots);
    if (d > slots / 2) d -= slots;
    targetIndex = cs + d;
    settled = true;
    vel = 0;
  };
  // centre a unique work by its dot index
  const focusWork = (i: number) => {
    const cs = nearestCenter();
    let d = ((((i - (cs % count)) % count) + count) % count);
    if (d > count / 2) d -= count;
    targetIndex = cs + d;
    settled = true;
    vel = 0;
  };

  const onDown = (e: PointerEvent) => {
    touched();
    dragging = true;
    lastX = downX = e.clientX;
    moved = false;
    vel = 0;
    settled = false;
    stage.classList.add("-drag");
    stage.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    if (Math.abs(e.clientX - downX) > SPOTLIGHT.tapSlop) moved = true;
    const d = -dx * SPOTLIGHT.drag;
    rot += d;
    vel = d;
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    settled = false;
    stage.classList.remove("-drag");
    if (!moved) {
      // a tap/click → bring that card to the front; pointer capture redirects
      // the event target to the stage, so hit-test at the release point
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const card = el?.closest<HTMLElement>("[data-slot]");
      if (card) focusSlot(Number(card.dataset.slot));
    }
  };
  const onCancel = () => {
    dragging = false;
    stage.classList.remove("-drag");
  };
  const onKey = (e: KeyboardEvent) => {
    touched();
    if (e.key === "ArrowRight") {
      go(1);
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      go(-1);
      e.preventDefault();
    }
  };
  const onPrev = () => { touched(); go(-1); };
  const onNext = () => { touched(); go(1); };
  const onEnter = () => { hovered = true; };
  const onLeave = () => { hovered = false; touched(); };
  const onFocusIn = () => { focused = true; };
  const onFocusOut = (e: FocusEvent) => { if (!root.contains(e.relatedTarget as Node | null)) { focused = false; touched(); } };
  const dotHandlers = dots.map((dot, i) => {
    const handler = () => { touched(); focusWork(i); };
    dot.addEventListener("click", handler);
    return handler;
  });

  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onCancel);
  stage.addEventListener("keydown", onKey);
  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);
  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);

  /* ---------- the frame, on the shared ticker, only while near ---------- */
  const tick = (time: number) => {
    // The auto-swipe: only at rest, only when nobody is near it, never when
    // the tab is hidden or motion is reduced; the first turn waits a full
    // interval from the moment the ring came on screen.
    if (!REDUCE && !dragging && !hovered && !focused && !document.hidden && settled && Math.abs(vel) < SPOTLIGHT.rest) {
      if (lastAuto === -Infinity) lastAuto = time;
      if (time - lastInteraction >= AUTO.idle && time - lastAuto >= AUTO.interval) {
        go(1);
        lastAuto = time;
      }
    }
    if (!dragging) {
      rot += vel;
      vel *= SPOTLIGHT.damp;
      if (Math.abs(vel) < SPOTLIGHT.rest) {
        // snap mode: settle a card dead-centre
        if (!settled) {
          targetIndex = nearestCenter();
          settled = true;
        }
        const diff = -targetIndex * stepDeg - rot;
        // land exactly → --rot stops changing → hover is rock-steady
        if (Math.abs(diff) < 0.01) rot = -targetIndex * stepDeg;
        else rot += diff * (REDUCE ? 1 : SPOTLIGHT.snap);
      } else settled = false;
    }
    applyRot();
    render();
  };

  let unsubscribe: (() => void) | null = null;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !unsubscribe) {
        // Coming on screen restarts the auto-swipe clock: a full interval first.
        lastAuto = -Infinity;
        unsubscribe = subscribeToTicker(tick, everyFrame);
      } else if (!entry.isIntersecting && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
    { rootMargin: SPOTLIGHT.nearMargin },
  );
  observer.observe(root);

  root.dataset.spotlightEngine = "on";
  root.dataset.spotlightAuto = REDUCE ? "off" : "on";
  applyRot();
  render();

  return {
    destroy() {
      observer.disconnect();
      unsubscribe?.();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onCancel);
      stage.removeEventListener("keydown", onKey);
      prev?.removeEventListener("click", onPrev);
      next?.removeEventListener("click", onNext);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      dots.forEach((dot, i) => dot.removeEventListener("click", dotHandlers[i]));
      delete root.dataset.spotlightEngine;
    },
  };
};
