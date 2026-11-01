/**
 * THE CARDS ALMANAC ENGINE — ported from the GetLayers section
 * (docs/design-refs/cards-almanac/cards-almanac.html, its `<script>`). The
 * contract (CONTRACT.md) preserves motion and composition:
 *
 *   - the pile is pure CSS `position: sticky`: each card sticks at
 *     `top: base + i × peekPx`, in DOM order — the stylesheet's job, set here
 *     as `--top` per card exactly as the reference's `layout()` does
 *     (centred pile, never pinned above the `baseVh` floor);
 *   - the incline: an arriving card leans `arriveTilt` and eases flat as it
 *     reaches its pin (`risen`), a buried card reclines `buriedTilt`, shrinks
 *     `scaleStep`, dims `dimStep` and tucks up `liftPx` per card on top of it;
 *     the reveal-on-arrival class `-in` once `revealAt` of the card is on
 *     screen, re-armed when it is back below. Every constant is the
 *     reference's (`STACK`).
 *
 * What changed for this site:
 *   - the markup is server-rendered (stories-section.tsx, layaway-section.tsx);
 *     the engine binds to `[data-almanac]` and its `[data-almanac-card]`s;
 *   - the reference read `getBoundingClientRect().top` of every card on
 *     every scroll frame. A sticky card's position is what the browser computes
 *     from its natural position, its pin and its container's end — so those
 *     three are measured once (doc-box: on size changes only) and the frame
 *     does the same arithmetic. The numbers are the same; the frame reads no
 *     layout (the Lumière invariant, report §10 step 2);
 *   - the frame runs on the shared ticker while the stack is near the
 *     viewport, not on a scroll listener of its own;
 *   - the "save" button and its state are not ported (nothing to save).
 */
import { createDocBox, type DocBox } from "@/lib/animation/doc-box";
import { smoothScrollY } from "@/lib/animation/smooth-scroll-y";
import { subscribeToTicker } from "@/lib/animation/ticker";

/** The reference's `CONFIG.stack`, verbatim. */
export const STACK = {
  baseVh: 5,
  peekPx: 34,
  gapVh: 46,
  revealPx: 480,
  revealAt: 0.5,
  persp: 1500,
  arriveTilt: 15,
  buriedTilt: 3,
  scaleStep: 0.035,
  dimStep: 0.02,
  liftPx: 4,
} as const;

const everyFrame = () => 0;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const NEAR = "50% 0px";

export interface AlmanacHandle {
  destroy(): void;
}

export const mountAlmanac = (stack: HTMLElement): AlmanacHandle => {
  const cards = [...stack.querySelectorAll<HTMLElement>("[data-almanac-card]")];
  const N = cards.length;
  const live = stack.parentElement?.querySelector<HTMLElement>("[data-almanac-live]") ?? null;
  const template = live?.dataset.template ?? "";
  if (N === 0) return { destroy: () => undefined };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  stack.style.setProperty("--gap", `${STACK.gapVh}vh`);

  /* ---------- layout: pin positions (the reference's layout()) ---------- */
  // Each card's natural top is read off a marker before it (the card itself
  // moves when it sticks); the markers and the stack are doc-boxes, measured
  // on size changes only.
  const markers = cards.map((card) => {
    const marker = document.createElement("span");
    marker.setAttribute("aria-hidden", "true");
    marker.className = "almanac__marker";
    card.before(marker);
    return marker;
  });
  const boxes: DocBox[] = markers.map((marker) => createDocBox(marker));
  const stackBox = createDocBox(stack);
  let restTops: number[] = [];
  let cardH = 400;
  let marginBottom = 0;
  const layout = () => {
    const vh = window.innerHeight;
    cardH = cards[0].offsetHeight; // layout height (ignores transform)
    marginBottom = parseFloat(getComputedStyle(cards[0]).marginBottom) || 0;
    // centre the pile: the middle card sits in the middle of the viewport, the rest fan around it
    const centred = (vh - cardH) / 2 - ((N - 1) / 2) * STACK.peekPx;
    const base = Math.max(centred, (STACK.baseVh / 100) * vh); // never pin above the baseVh floor
    restTops = cards.map((card, i) => {
      const t = Math.round(base + i * STACK.peekPx);
      card.style.setProperty("--top", `${t}px`);
      return t;
    });
  };
  layout();
  const resize = new ResizeObserver(layout);
  resize.observe(cards[0]);
  window.addEventListener("resize", layout, { passive: true });

  /* ---------- depth: buried cards shrink + dim as later cards stack over them ---------- */
  const shown = new Array<boolean>(N).fill(false);
  let lastCur = -1;
  const risen: number[] = new Array(N).fill(0);
  const tops: number[] = new Array(N).fill(0);
  const update = () => {
    const vh = window.innerHeight;
    const y = smoothScrollY();
    const revealLine = vh - STACK.revealAt * cardH; // a card reveals once its top rises above this
    const hideLine = vh - 0.04 * cardH; // re-arm once it's scrolled almost fully back below
    // The sticky constraint: between the natural position and the pin, held
    // inside the stack's content box (the last card's margin excluded).
    const stackEnd = stackBox.top + stackBox.height - y;
    for (let i = 0; i < N; i++) {
      const natural = boxes[i].top - y;
      const pinned = Math.min(restTops[i], stackEnd - cardH - marginBottom);
      const top = Math.max(natural, pinned);
      tops[i] = top;
      risen[i] = clamp((restTops[i] + STACK.revealPx - top) / STACK.revealPx, 0, 1);
    }
    let suffix = 0;
    for (let i = N - 1; i >= 0; i--) {
      const b = suffix;
      const el = cards[i];
      if (reduce) {
        el.style.transform = "";
        el.style.filter = "";
      } else {
        // incline while arriving (eases to flat at the pin), recline slightly once buried
        const rx = STACK.arriveTilt * (1 - risen[i]) - STACK.buriedTilt * b;
        el.style.transform = `perspective(${STACK.persp}px) translateY(${(-b * STACK.liftPx).toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) scale(${(1 - STACK.scaleStep * b).toFixed(4)})`;
        el.style.filter = `brightness(${(1 - STACK.dimStep * b).toFixed(4)})`;
      }
      el.style.zIndex = String(10 + i);
      // reveal the card's cover + text once ~half of it is on screen; re-arm when it's back below
      if (!shown[i] && tops[i] <= revealLine) {
        el.classList.add("-in");
        shown[i] = true;
      } else if (shown[i] && tops[i] >= hideLine) {
        el.classList.remove("-in");
        shown[i] = false;
      }
      suffix += risen[i];
    }
    // announce the active card (a11y)
    const cur = clamp(Math.round(risen.reduce((a, r) => a + r, 0)), 1, N);
    if (cur !== lastCur) {
      lastCur = cur;
      if (live && template) live.textContent = template.replace("{n}", String(cur)).replace("{total}", String(N));
    }
  };

  let unsubscribe: (() => void) | null = null;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !unsubscribe) {
        update();
        unsubscribe = subscribeToTicker(update, everyFrame);
      } else if (!entry.isIntersecting && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
    { rootMargin: NEAR },
  );
  observer.observe(stack);
  stack.dataset.almanacEngine = "on";
  update();

  return {
    destroy() {
      observer.disconnect();
      unsubscribe?.();
      resize.disconnect();
      window.removeEventListener("resize", layout);
      boxes.forEach((box) => box.dispose());
      stackBox.dispose();
      markers.forEach((marker) => marker.remove());
      delete stack.dataset.almanacEngine;
    },
  };
};
