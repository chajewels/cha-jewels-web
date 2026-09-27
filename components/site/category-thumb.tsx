import { Watch, Wallet } from "lucide-react";
import { HubImage } from "@/components/media/hub-image";
import type { CategoryThumb as Thumb } from "@/lib/category-thumbs";

/**
 * One category's thumbnail in the Collections menu and the drawer. What it
 * shows is decided in lib/category-thumbs.ts (the live rule, unchanged):
 *
 *   photo   the owner's Hub photo, covering the tile
 *   piece   a real in-stock piece, contained — never cropped. Site frame
 *           (2026-09-27): it stands on the hero's dark stage (charcoal-deep
 *           with a warm top light), the way the hero and the category banner
 *           show pieces; a cut-out gets a little air around it
 *   icon    nothing in stock: a gold line icon for the kind of category —
 *           a watch for watches, a wallet for accessories, a ring for
 *           everything else. On chalk, gold-dark (4.59:1)
 *
 * `size` is the square's side in px. Decorative: the row's title names the
 * category, so every image is alt="".
 */
export function CategoryThumb({ slug, thumb, size = 40 }: { slug: string; thumb: Thumb; size?: number }) {
  const box = "relative block shrink-0 overflow-hidden rounded-sm border";
  const dim = { width: size, height: size };
  if (thumb.kind === "photo") {
    return <span className={`${box} border-hairline`} style={dim}><HubImage src={thumb.url} alt="" width={size} height={size} sizes={`${size}px`} className="h-full w-full object-cover" /></span>;
  }
  if (thumb.kind === "piece") {
    return (
      // Padding in px from the tile's own size: a % padding resolves against
      // the ROW, not this square, and swallowed the whole image.
      <span className={`${box} border-charcoal-deep bg-[radial-gradient(120%_90%_at_50%_0%,#3a3226_0%,#222222_70%)]`} style={{ ...dim, padding: thumb.cutout ? Math.round(size * 0.12) : 0 }}>
        <HubImage src={thumb.url} alt="" width={size} height={size} sizes={`${size}px`} className="h-full w-full object-contain" />
      </span>
    );
  }
  const Icon = /watch/.test(slug) ? Watch : /accessor/.test(slug) ? Wallet : RingIcon;
  return (
    <span className={`${box} flex items-center justify-center border-hairline bg-white text-gold-dark`} style={dim}>
      <Icon aria-hidden="true" className="h-5 w-5" />
    </span>
  );
}

/** A ring with a set stone, drawn in lucide's line style (24 grid, 2px stroke, round caps): lucide has no ring. */
function RingIcon(props: { className?: string; "aria-hidden"?: "true" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="15" r="6.5" />
      <path d="M9.5 5.5 12 8.5l2.5-3L13.5 3h-3z" />
    </svg>
  );
}
