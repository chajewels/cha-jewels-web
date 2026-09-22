/**
 * WHICH HOSTS THE IMAGE OPTIMISER IS ALLOWED TO FETCH.
 *
 * One list, read by the two places that must never disagree:
 *
 *   next.config.ts        turns it into `images.remotePatterns` — what the
 *                         optimiser will accept at `/_next/image`.
 *   isOptimizableImage()  decides, per image, whether to render <Image> or
 *                         fall back to a plain <img>.
 *
 * Kept as two literals they drift, and the drift is quiet: a host the
 * component trusts but the config does not gives an <Image> whose
 * `/_next/image` request 400s, and a host the config allows but the component
 * does not is simply never optimised. Neither shows up in a type check.
 *
 * THE HUB'S MEDIA lives in Supabase Storage on the Hub's own project — buckets
 * `promotions` (category and collection hero_media, product photos) and
 * `brand-assets` — always under /storage/v1/object/public/. The hostname below
 * is that project, read off a live Hub media URL. CLAUDE.md records that the
 * Hub moves to Cynthia's own Supabase before Phase 2, so it is overridable:
 * set NEXT_PUBLIC_HUB_IMAGE_HOST and the move is a Vercel setting and a
 * rebuild, not a patch. The path prefix is part of the pattern on purpose —
 * allowing the whole host would hand the optimiser every private signed URL
 * shape the project serves, and it only ever needs the public bucket.
 *
 * ANY OTHER HOST IS NOT AN ERROR. An admin can paste a hero_media URL from
 * anywhere; next/image would throw on it, so the components render those as a
 * plain <img> instead — unoptimised, but correct and on the page.
 */
export type OptimizedImageHost = {
  hostname: string;
  /** Optional path restriction, in next.config's `pathname` glob form. */
  pathname?: string;
};

const PUBLIC_STORAGE = "/storage/v1/object/public/";

export const HUB_IMAGE_HOST =
  process.env.NEXT_PUBLIC_HUB_IMAGE_HOST || "pfoicalpzdcmyxzvwyhz.supabase.co";

export const OPTIMIZED_IMAGE_HOSTS: readonly OptimizedImageHost[] = [
  { hostname: HUB_IMAGE_HOST, pathname: `${PUBLIC_STORAGE}**` },
  // Allowed by the optimiser since before responsive images; nothing in this
  // repo emits a Cloudinary URL today, but product media predates this list
  // and removing it here would start throwing inside next/image rather than
  // falling back. Left in place deliberately.
  { hostname: "res.cloudinary.com" },
];

/**
 * SVG is not something the optimiser will touch: `/_next/image` answers 400 for
 * an SVG source unless `dangerouslyAllowSVG` is on, and that flag exists
 * because the optimiser would then be re-serving arbitrary markup — scripts and
 * all — from our own origin. Product media in the preview fixtures is SVG
 * today, so without this an <Image> here is a 400 and a broken thumbnail
 * rather than a slow one. Nothing is lost by declining: a vector is already
 * resolution-independent and already small.
 */
function isSvg(pathname: string): boolean {
  return pathname.toLowerCase().endsWith(".svg");
}

/**
 * True when `src` is something next/image may optimise: a file we ship in
 * /public, or one of the hosts above. Everything else — including a protocol
 * relative `//host/...` URL, which is not ours to trust — is false.
 */
export function isOptimizableImage(src: string | null | undefined): boolean {
  if (!src) return false;
  // Local, from /public. Not `//`, which is a remote URL wearing a local coat.
  if (src.startsWith("/") && !src.startsWith("//")) {
    return !isSvg(src.split(/[?#]/)[0]);
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (isSvg(url.pathname)) return false;

  return OPTIMIZED_IMAGE_HOSTS.some(({ hostname, pathname }) => {
    if (url.hostname !== hostname) return false;
    if (!pathname) return true;
    // The only glob shape this list uses is a trailing `**`.
    return url.pathname.startsWith(pathname.replace(/\*+$/, ""));
  });
}
