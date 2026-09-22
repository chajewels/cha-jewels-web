import Image from "next/image";
import { isOptimizableImage } from "@/lib/image-hosts";

/**
 * An image whose host we may or may not control.
 *
 * Hub media (`hero_media`, product photos) and the Stitch placeholders we ship
 * in /public both arrive here as a bare string, and only some of those strings
 * are hosts the optimiser is allowed to fetch — see lib/image-hosts.ts. Passing
 * an unknown host to next/image is not a degraded image, it is a thrown error,
 * so every one of these call sites used to opt out of next/image entirely and
 * ship the full-size original to a 112px box.
 *
 * This decides per image instead: <Image> when the host is on the list, a plain
 * <img> when it is not. The two render the same box either way —
 *
 *   fill      next/image positions itself absolutely over the parent; the
 *             fallback is given the same `absolute inset-0 h-full w-full` so
 *             the parent's reserved box is what sizes both. The parent must be
 *             positioned, exactly as `fill` already requires.
 *   fixed     both carry the same width/height attributes, so both reserve
 *             their box before the bytes arrive.
 *
 * — which is what keeps the layout identical and the shift at zero whichever
 * branch a given URL takes.
 *
 * LAZY UNLESS TOLD OTHERWISE. Everything here defaults to lazy, and the hero
 * deck additionally refuses to mount a slide's image until that slide is the
 * one coming up (components/home/hero-slides.tsx). `priority` is for the one
 * image on a page that IS the page's largest paint and is above the fold at
 * every width — today that is the /categories/[slug] banner, and nothing else.
 * It is not a hint to be sprinkled: marking a second image priority on the
 * same page means neither of them is.
 *
 * The fallback branch spells the same thing out by hand, because a plain <img>
 * has no `priority`: eager loading plus fetchpriority=high, which is what
 * next/image's own preload amounts to.
 */
type Base = {
  src: string;
  /** Above the fold and the largest thing on the page. See the note above. */
  priority?: boolean;
  /** Empty string for decoration the surrounding copy already names. */
  alt: string;
  /** Applied to both branches: object-fit, object-position, transitions. */
  className?: string;
};

type Props = Base &
  (
    | { fill: true; sizes: string; width?: never; height?: never }
    | { fill?: false; width: number; height: number; sizes?: string }
  );

export function HubImage({ src, alt, className, sizes, priority, ...box }: Props) {
  if (isOptimizableImage(src)) {
    return box.fill ? (
      <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />
    ) : (
      <Image
        src={src}
        alt={alt}
        width={box.width}
        height={box.height}
        sizes={sizes}
        className={className}
        priority={priority}
      />
    );
  }

  // `decoding="async"` and `loading="lazy"` are next/image's own defaults; the
  // fallback matches them so the two branches behave alike as well as measure
  // alike.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      {...(box.fill
        ? {}
        : { width: box.width, height: box.height })}
      className={box.fill ? `absolute inset-0 h-full w-full ${className ?? ""}` : className}
    />
  );
}
