/**
 * What the product gallery and its full-screen viewer share. A plain module,
 * so the viewer chunk (loaded on first open) does not import the gallery.
 */
export type GalleryImage = { url: string; alt: string | null };

/** next/image cannot optimise SVG or data URLs (fixtures use both); real Hub photos are optimised. */
export const passthrough = (url: string) => url.startsWith("data:") || /\.svg(\?|$)/i.test(url);

/** The gallery photo's rendered width. The viewer reuses it for its placeholder, which is then a cache hit. */
export const SIZES = "(min-width:768px) 50vw, 100vw";

/** A lib/motion.ts ease as a CSS / Web Animations timing function. */
export const cubic = (b: readonly number[]) => `cubic-bezier(${b.join(",")})`;

/** Resolve once an <img> has decoded (or failed) — nothing slides onto a blank. */
export function whenDecoded(img: HTMLImageElement | null | undefined): Promise<void> {
  return new Promise((resolve) => {
    if (!img) return resolve();
    const go = () => img.decode().then(() => resolve(), () => resolve());
    if (img.complete) go(); else img.addEventListener("load", go, { once: true });
    img.addEventListener("error", () => resolve(), { once: true });
  });
}
