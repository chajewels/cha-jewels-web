"use client";

import { DigitRoll } from "@/components/lumiere/common/digit-roll";
import { useInView } from "@/hooks/use-in-view";

/**
 * The loyalty band's two-cell ledger, its figures rolling into place as the
 * band is seen (the Brewns digit roll, components/lumiere/common/digit-roll.tsx).
 * The figures are the programme page's own strings — "1%", "1 = ¥1" — set as
 * figures, not computed (lib/i18n.ts `loyalty.*Value`).
 */
export const LoyaltyLedger = ({ cells, note }: { cells: { label: string; value: string }[]; note: string }) => {
  const [ref, seen] = useInView<HTMLDListElement>();
  return (
    <dl ref={ref} className="loyalty__ledger">
      {cells.map((cell, i) => (
        <div key={cell.label} className="loyalty__cell">
          <dt className="loyalty__label font-manrope">{cell.label}</dt>
          <dd className="loyalty__value font-serif">
            <DigitRoll value={cell.value} ready={seen} delayIn={i * 160} />
            {i === cells.length - 1 && <span className="loyalty__note font-manrope">{note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
};
