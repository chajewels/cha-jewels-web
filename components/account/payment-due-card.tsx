import type { ReactNode } from "react";
import { tr, type Lang } from "@/lib/i18n";

/**
 * "How to pay": the first thing on an order or plan page while money is due
 * (owner request 2026-09-24). Before this, the bank details sat under the
 * items, the totals, the address and the service-request form, and a customer
 * on a phone scrolled past all of it to find out where to send the money.
 *
 * It only arranges figures the Hub sent: `amount` and `deadline` are already
 * formatted by the page from Hub fields, never computed here. The caller
 * decides WHETHER payment is due, with the same checks that gated the bank
 * details before — this card never widens when they show.
 *
 * Printed at the top as well: it is first in the DOM, and print keeps DOM order.
 */
export function PaymentDueCard({
  lang, amountLabel, amount, deadline, children,
}: {
  lang: Lang;
  amountLabel?: string;
  amount: string | null;
  deadline: string | null;
  children: ReactNode;
}) {
  const t = tr(lang);
  return (
    <section aria-labelledby="pay-h" className="mt-8 border border-hairline bg-white p-5 sm:p-7">
      <h2 id="pay-h" className="font-display text-2xl text-charcoal-deep">{t("account", "payH")}</h2>
      {(amount || deadline) && (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {amount && (
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-charcoal/70">{amountLabel ?? t("account", "amountDue")}</dt>
              <dd className="mt-1 font-display text-3xl text-charcoal-deep">{amount}</dd>
            </div>
          )}
          {deadline && (
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-charcoal/70">{t("account", "payBy")}</dt>
              <dd className="mt-1 font-display text-3xl text-gold-dark">{deadline}</dd>
            </div>
          )}
        </dl>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * "Reserved — confirming your piece": the same top slot while staff have not
 * confirmed a reservation. Words only — no amount, no deadline, no bank
 * details before confirmation (owner rule, Hub A2).
 */
export function ReservedStatusCard({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section aria-labelledby="reserved-h" className="mt-8 border border-hairline bg-white p-5 text-sm text-charcoal sm:p-7">
      <h2 id="reserved-h" className="font-display text-xl text-charcoal-deep">{heading}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
