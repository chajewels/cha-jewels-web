import Link from "next/link";

import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale";
import { lumiereLoyalty } from "@/lib/content/lumiere-home";

import { LoyaltyLedger } from "./loyalty-ledger";

/**
 * THE LOYALTY BAND (new, D-21 APPROVED) → /loyalty. A black band in the
 * featured stage's and footer's register: the programme's own heading, its
 * one-sentence summary, the two-cell ledger (1 % at Glimmer; one point = ¥1)
 * with the Brewns digit roll, and the "Join free" pill. Every line is an
 * existing string (lib/content/lumiere-home.ts `lumiereLoyalty`); the
 * medallions stay on the programme page (D-20).
 */
export const LOYALTY_ID = "loyalty";

export const LoyaltySection = ({ lang }: { lang: Lang }) => {
  const content = lumiereLoyalty(lang, localePath("/loyalty", lang));
  return (
    <section id={LOYALTY_ID} aria-labelledby="loyalty-heading" className="loyalty">
      <div className="loyalty__copy">
        <p className="loyalty__eyebrow font-manrope">{content.eyebrow}</p>
        <h2 id="loyalty-heading" className="loyalty__heading font-serif">
          {content.heading}
        </h2>
        <p className="loyalty__lead font-tight">{content.lead}</p>
        <Link href={content.cta.href} className="loyalty__pill font-tight" data-analytics="loyalty-join">
          {content.cta.label} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <LoyaltyLedger cells={content.cells} note={content.note} />
    </section>
  );
};
