/**
 * The hero's "which clip, or none" rule, on its own: no React and no imports,
 * so a page that only needs the rule (the About logo clip) does not pull in
 * the homepage hero with it — importing it from hero-video.tsx cost the About
 * page 9 kB of JavaScript (hero-video imports the hero's motion context).
 */
/**
 * WHICH CLIP, OR NONE AT ALL.
 *
 * The full clip is 1.86 MB of WebM (3.78 MB of MP4) at 1920x1080. On the
 * measured mobile baseline it was 68% of the homepage's 2.78 MB — the single
 * largest thing the site sends anyone, downloaded into a box 412px wide behind
 * a scrim. See docs/perf-baseline.md.
 *
 *   "none"    the reader has asked for less data, or the connection says it
 *             cannot afford this. The poster is the hero and nothing is
 *             fetched. This outranks everything below, including screen size.
 *   "mobile"  a narrow viewport or a coarse pointer: the 854x480 encode,
 *             397 KiB of WebM / 434 KiB of MP4, same framing and aspect.
 *   "full"    a wide viewport with a fine pointer: unchanged, as before.
 *
 * `prefers-reduced-data` is not implemented everywhere; matchMedia on an
 * unsupported feature simply never matches, which is the right default.
 * `navigator.connection` is Chromium-only, so every read of it is guarded —
 * absent means "no reason to hold back", not "assume the worst".
 */
export type HeroSource = "full" | "mobile" | "none";

export type ConnectionLike = { saveData?: boolean; effectiveType?: string; addEventListener?: (t: string, l: () => void) => void; removeEventListener?: (t: string, l: () => void) => void };
export const SLOW_TYPES = new Set(["slow-2g", "2g", "3g"]);

export function readHeroSource(): HeroSource {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "none";
  if (window.matchMedia("(prefers-reduced-data: reduce)").matches) return "none";
  const conn = (navigator as Navigator & { connection?: ConnectionLike }).connection;
  if (conn) {
    if (conn.saveData === true) return "none";
    if (conn.effectiveType && SLOW_TYPES.has(conn.effectiveType)) return "none";
  }
  const roomy = window.matchMedia("(min-width: 1024px)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  return roomy && fine ? "full" : "mobile";
}
