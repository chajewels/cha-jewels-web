/** The Stitch section break: two hairlines and a rotated teal diamond. Ornament only. */
export function DiamondDivider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center py-4 ${className}`}>
      <span className="h-px w-16 bg-hairline" />
      <span className="mx-2 inline-block h-1.5 w-1.5 rotate-45 bg-teal" />
      <span className="h-px w-16 bg-hairline" />
    </div>
  );
}
