// Ported verbatim from the Lumière reference (src/lib/animation/doc-box.ts);
// invariant "Scroll stages read no layout per frame" (its optimization-history.md).

/**
 * An element's box in document coordinates, measured once and again only when
 * a size changes — its own, the document's (anything above it growing or
 * shrinking), or the window's.
 *
 * The scroll stages used to call `getBoundingClientRect()` on every ticker
 * frame, for the page's whole life. With spring styles written earlier in the
 * frame, that read forced a synchronous layout of the whole page: 44 ms of one
 * scroll frame on a 4× phone (profile, lumi-re). In document coordinates the
 * box does not move when the page scrolls, so the viewport position is simple
 * arithmetic: `top - window.scrollY` (or `- smoothScrollY()` for Lenis's
 * fractional position).
 *
 * Not for `position: sticky` elements — their document position changes as they
 * stick. Measure the track or section around them instead.
 */
export interface DocBox {
  /** Top edge, px from the top of the document. */
  readonly top: number;
  readonly height: number;
  dispose(): void;
}

export const createDocBox = (element: Element): DocBox => {
  let top = 0;
  let height = 0;
  const measure = () => {
    const rect = element.getBoundingClientRect();
    top = rect.top + window.scrollY;
    height = rect.height;
  };
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(element);
  observer.observe(document.documentElement);
  window.addEventListener("resize", measure, { passive: true });
  return {
    get top() {
      return top;
    },
    get height() {
      return height;
    },
    dispose() {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    },
  };
};
