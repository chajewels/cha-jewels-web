import { Watch, Wallet } from "lucide-react";
import { HubImage } from "@/components/media/hub-image";
import type { CategoryThumb as Thumb } from "@/lib/category-thumbs";

/**
 * One category's 40px thumbnail in the Collections menu and the drawer, the
 * same box and hairline frame as the collection thumbnails beside it
 * (nav-menu.tsx). What it shows is decided in lib/category-thumbs.ts:
 *
 *   photo   the owner's Hub photo, covering the tile like the collection ones
 *   piece   a real in-stock piece on chalk, contained — never cropped; a
 *           cut-out stands with a little air around it
 *   icon    nothing in stock: a gold line icon for the kind of category —
 *           a watch for watches, a wallet for accessories, a ring for
 *           everything else (the jewelry lines, and any category the Hub adds)
 *
 * Decorative: the row's title names the category, so every image is alt="".
 */
export function CategoryThumb({ slug, thumb }: { slug: string; thumb: Thumb }) {
  const box = "relative block h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-hairline";
  if (thumb.kind === "photo") {
    return <span className={box}><HubImage src={thumb.url} alt="" width={40} height={40} sizes="40px" className="h-10 w-10 object-cover" /></span>;
  }
  if (thumb.kind === "piece") {
    return (
      <span className={`${box} bg-chalk ${thumb.cutout ? "p-1" : ""}`}>
        <HubImage src={thumb.url} alt="" width={40} height={40} sizes="40px" className="h-full w-full object-contain" />
      </span>
    );
  }
  const Icon = /watch/.test(slug) ? Watch : /accessor/.test(slug) ? Wallet : RingIcon;
  return (
    <span className={`${box} flex items-center justify-center bg-chalk text-gold-dark`}>
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
