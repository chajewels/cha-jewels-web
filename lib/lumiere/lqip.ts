import "server-only";

/**
 * AN INSTANT LOW-QUALITY PLACEHOLDER for a hero piece (P5c, owner finding a). The hero's cut-outs come from the Hub's
 * storage and, on a cold optimiser, take seconds to arrive; until they do, `next/image` shows this ~12 px copy of the very
 * piece (a data URL in the HTML, so no request) blurred up on the card's cream plate, and the ring never reads as empty.
 *
 * Built on the server while the home is rendered (ISR, 60 s) from the cut-out's own URL: one small fetch per piece, a
 * module-level cache because a cut-out URL is content-addressed (`…/r1-<hash>/cutout.webp` — a new cut is a new URL), and
 * every failure is `undefined`: the card's plate colour is then its placeholder. `sharp` is the image optimiser's own
 * dependency (next ships it); if it cannot be loaded this degrades the same way and never fails the page.
 */
const cache = new Map<string, string | undefined>();
const MAX_BYTES = 3_000_000;
const SIZE = 12;

export async function lqip(url: string, timeoutMs = 1800): Promise<string | undefined> {
  if (cache.has(url)) return cache.get(url);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "force-cache" });
    if (!res.ok) return undefined;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return undefined;
    const sharp = (await import("sharp")).default;
    const tiny = await sharp(bytes).resize(SIZE, SIZE, { fit: "inside" }).png({ compressionLevel: 9 }).toBuffer();
    const dataUrl = `data:image/png;base64,${tiny.toString("base64")}`;
    cache.set(url, dataUrl);
    return dataUrl;
  } catch {
    // Not cached: a transient failure should be retried on the next render.
    return undefined;
  }
}
