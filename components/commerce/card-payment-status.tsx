import { tr, type Lang } from "@/lib/i18n";
import { formatDeadline } from "@/lib/site-time";
import type { HubCardPayment } from "@/lib/types";

/**
 * THE STATE OF AN OPEN CARD PAYMENT (SQ22, owner 3A, 2026-10-04).
 *
 * Shown on the order page whenever the Hub reports `card_payment`, in place of
 * every way to pay (the Hub hides them too), and on the pay-card page right
 * after the Hub answers. One sentence per state, each saying only what is true
 * at that step: an authorisation is never "payment received", and "being
 * confirmed" never becomes "not charged". The capture deadline is Japan time
 * through lib/site-time.ts.
 *
 * No hooks, no "use client": it renders on the server (order page) and inside
 * the client card form alike.
 */
export function CardPaymentStatus({ lang, state, brand, last4, captureBy, reference, children }: {
  lang: Lang;
  state: HubCardPayment["state"];
  brand?: string | null;
  last4?: string | null;
  captureBy?: string | null;
  reference?: string | null;
  children?: React.ReactNode;
}) {
  const t = tr(lang);
  const card = [brand ?? "", last4 ? `····${last4}` : ""].filter(Boolean).join(" ");
  const line =
    state === "processing" ? t("card", "processing")
      : state === "capturing" ? t("card", "capturing")
        : state === "recording" ? t("card", "recording")
          : card ? t("card", "held", { card }) : t("card", "heldNoCard");
  const until = state === "held" && captureBy && Number.isFinite(Date.parse(captureBy)) ? formatDeadline(captureBy, lang) : null;
  return (
    <div className="border border-gold-dark bg-gold-pale/40 p-5 sm:p-6" role="status" aria-live="polite" data-testid="card-payment-status" data-state={state}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "statusTitle")}</h2>
      <p className="mt-2 font-display text-[17px] leading-snug text-charcoal-deep">{line}</p>
      {until && <p className="mt-2 text-[13px] leading-relaxed text-charcoal/80"><span className="cj-fig">{t("card", "heldUntil", { date: until })}</span></p>}
      <p className="mt-3 text-[12px] leading-relaxed text-charcoal/75">{t("card", "statusOthersHidden")}</p>
      {reference && <p className="mt-1 font-mono text-[12px] text-charcoal/75">{t("card", "statusRef", { ref: reference })}</p>}
      {children}
    </div>
  );
}
