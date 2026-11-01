/**
 * THE COLONNADE ENGINE — ported from the GetLayers section
 * (docs/design-refs/colonnade/colonnade.html, its `<script>`). The contract
 * (CONTRACT.md) preserves the "one in one" slide, kept whole:
 *
 *   - each art layer rests at `translateY(101%)` (below), goes to 0 on `-in`
 *     and to `-101%` on `-out`; a `transitionend` handler snaps the exited
 *     layer back below WITH THE TRANSITION DISABLED so it always re-enters
 *     travelling upward — the silent reset, never removed;
 *   - the headline stack rides the same `-in` / `-out` / reset;
 *   - hover (fine pointers only), tap, focus and the arrow keys select a
 *     column; the first chapter slides in when the engine starts.
 *
 * What changed for this site: the markup is server-rendered (why-section.tsx)
 * and the engine binds to `[data-colonnade]`; the dev header, nav and Google
 * Fonts are not ported. Without the engine (no script, a crawler) the
 * stylesheet shows the first chapter at rest (`.colonnade:not([data-colonnade-engine])`).
 */
export interface ColonnadeHandle {
  destroy(): void;
}

export const mountColonnade = (root: HTMLElement): ColonnadeHandle => {
  const cols = [...root.querySelectorAll<HTMLElement>("[data-colonnade-col]")].map((col) => ({
    col,
    media: col.querySelector<HTMLElement>("[data-colonnade-media]"),
    head: root.querySelector<HTMLElement>(`[data-colonnade-head="${col.dataset.colonnadeCol}"]`),
  }));
  if (cols.length === 0) return { destroy: () => undefined };
  const start = Number(root.dataset.start) || 0;
  const CAN_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let active: number | null = null;

  // when a layer finishes sliding up and out, snap it back below (no transition) so it always re-enters upward
  const onEnd = (e: TransitionEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (e.propertyName !== "transform" || !el.classList.contains("-out")) return;
    el.style.transition = "none";
    el.classList.remove("-out");
    void el.offsetWidth;
    el.style.transition = "";
  };
  const enter = (el: HTMLElement | null) => {
    if (!el) return;
    if (el.classList.contains("-out")) {
      el.style.transition = "none";
      el.classList.remove("-out");
      void el.offsetWidth;
      el.style.transition = "";
    }
    el.classList.add("-in");
  };
  const exit = (el: HTMLElement | null) => {
    if (!el) return;
    el.classList.remove("-in");
    el.classList.add("-out");
  };
  cols.forEach((c) => {
    c.media?.addEventListener("transitionend", onEnd);
    c.head?.addEventListener("transitionend", onEnd);
  });

  const setActive = (i: number, focus = false) => {
    if (i === active) return;
    const prev = active;
    active = i;
    if (prev != null) {
      cols[prev].col.classList.remove("-active");
      cols[prev].col.setAttribute("aria-selected", "false");
      cols[prev].col.tabIndex = -1;
      exit(cols[prev].media);
      exit(cols[prev].head);
    }
    const c = cols[i];
    c.col.classList.add("-active");
    c.col.setAttribute("aria-selected", "true");
    c.col.tabIndex = 0;
    enter(c.media);
    enter(c.head);
    if (focus) c.col.focus();
  };

  const handlers = cols.map((c, i) => {
    const onEnter = () => setActive(i);
    const onClick = () => setActive(i);
    const onFocus = () => setActive(i);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setActive((i + 1) % cols.length, true);
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setActive((i - 1 + cols.length) % cols.length, true);
        e.preventDefault();
      }
    };
    if (CAN_HOVER) c.col.addEventListener("pointerenter", onEnter);
    c.col.addEventListener("click", onClick);
    c.col.addEventListener("focus", onFocus);
    c.col.addEventListener("keydown", onKey);
    return { onEnter, onClick, onFocus, onKey };
  });

  // Clear the stylesheet's resting state, then slide the first chapter in.
  root.dataset.colonnadeEngine = "on";
  cols.forEach((c) => {
    c.col.classList.remove("-active");
    c.col.setAttribute("aria-selected", "false");
    c.media?.classList.remove("-in");
    c.head?.classList.remove("-in");
  });
  let raf = requestAnimationFrame(() => {
    raf = requestAnimationFrame(() => setActive(start));
  });

  return {
    destroy() {
      cancelAnimationFrame(raf);
      cols.forEach((c, i) => {
        c.media?.removeEventListener("transitionend", onEnd);
        c.head?.removeEventListener("transitionend", onEnd);
        c.col.removeEventListener("pointerenter", handlers[i].onEnter);
        c.col.removeEventListener("click", handlers[i].onClick);
        c.col.removeEventListener("focus", handlers[i].onFocus);
        c.col.removeEventListener("keydown", handlers[i].onKey);
      });
      delete root.dataset.colonnadeEngine;
    },
  };
};
