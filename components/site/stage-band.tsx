/** The hero's dark stage: the warm pool of light and a gold floor line at its foot. */
export function StageBand({ children, className = "", as: Tag = "section" }: { children: React.ReactNode; className?: string; as?: "section" | "div" }) {
  return (
    <Tag className={`band-dark relative overflow-hidden bg-charcoal-deep text-chalk ${className}`}>
      <div aria-hidden="true" className="cs-pool" />
      <div className="relative">{children}</div>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,rgb(163_157_148/0),rgb(163_157_148/.55)_25%,rgb(217_211_202/.75)_50%,rgb(163_157_148/.55)_75%,rgb(163_157_148/0))]" />
    </Tag>
  );
}
