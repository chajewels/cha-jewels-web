import { DrawnDivider } from "@/components/fx/drawn-divider";

/**
 * The Stitch section break: two hairlines and a rotated teal diamond.
 * Ornament only. It draws itself when it comes into view
 * (components/fx/drawn-divider.tsx); the hairlines are gold now, where they
 * were grey, so the drawing can be seen against chalk.
 */
export function DiamondDivider({ className = "" }: { className?: string }) {
  return <DrawnDivider className={className} />;
}
