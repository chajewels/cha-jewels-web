import type { ReactNode } from "react";
import { Reveal } from "@/components/lumiere/common/reveal-text";

/**
 * THE LUMIÈRE PAGE HEAD (P4b). Every inner page opens the same way: a gold
 * eyebrow with its rule, ONE `<h1>` in the display face that resolves word by
 * word (real text, `Reveal`), an optional lead, and an optional aside (a
 * badge, a pill, a print button). `tone="ink"` makes it a full-bleed black
 * band with white type (the page below it sits on bone).
 *
 * Plain markup, no state: a Server Component. The h1 takes a string so the
 * reveal keeps the words as real text; pass a ReactNode `lead` freely.
 */
export function PageHead({ eyebrow, title, lead, aside, tone = "bone", className = "", as: Tag = "header", children }: {
  eyebrow?: ReactNode;
  title: string;
  lead?: ReactNode;
  aside?: ReactNode;
  tone?: "bone" | "ink";
  className?: string;
  as?: "header" | "div";
  children?: ReactNode;
}) {
  return (
    <Tag className={`lm-head lm-head--${tone} ${className}`}>
      <div className="wrap lm-head__in">
        <div className="lm-head__text">
          {eyebrow && <p className="lm-eyebrow">{eyebrow}</p>}
          <h1 className="lm-h1"><Reveal>{title}</Reveal></h1>
          {lead && <div className="lm-lead">{lead}</div>}
          {children}
        </div>
        {aside && <div className="lm-head__aside">{aside}</div>}
      </div>
    </Tag>
  );
}

/** A page section on a ground: bone (the page), white, sheet (a white sheet with a rounded top that overlaps the one above) or ink (a black band). */
export function PageSection({ tone = "bone", id, label, className = "", children }: {
  tone?: "bone" | "white" | "ink" | "sheet";
  id?: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-label={label} className={`lm-sec lm-sec--${tone} ${className}`}>
      <div className="wrap">{children}</div>
    </section>
  );
}
