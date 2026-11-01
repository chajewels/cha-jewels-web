import type { ReactNode } from "react";

/**
 * A NUMBER RESOLVING OUT OF BLUR (Aerra's numbers section: "numbers resolving
 * out of blur as they finish counting", docs/design-refs/aerra/). The figure is
 * plain text in the document; a view timeline (app/lumiere/pages.css `.lm-fig`)
 * sharpens it and lifts it into place as it enters the viewport — at rest where
 * the browser has none, and under reduced motion. The figures it wraps are
 * years and ordinals that are already final (2021, 01…), so the reference's
 * count-up is not used: nothing here pretends a year was ever another number.
 */
export function ResolveNumber({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`lm-fig ${className}`}>{children}</span>;
}
