import { tr, type Lang } from "@/lib/i18n";
import { formatSiteDate } from "@/lib/site-time";
import { formatMoney } from "@/lib/utils";
import type { HubLatestDecision } from "@/lib/types";

/**
 * WEBSITE PAYMENT LIFECYCLE (task S3, spec §4B). "Your last payment was not
 * accepted" — above the payment box, from the Hub's `latest_decision` only.
 * Whether it shows at all is orderDisplay's call (R17: not while a new payment
 * is being checked, not on a closed order); this only words it.
 *
 * - rejected: method, the Hub's amount and the decision day (Japan time); for
 *   Paidy and card, "nothing was charged" — a reviewer's Reject releases the
 *   Paidy authorisation and voids the card hold, so the rejection itself
 *   establishes it. Never said for a transfer: her money may be with us.
 * - needs_clarification: staff need to hear from her, and how to reply.
 *
 * The staff message is shown exactly as written, as TEXT (React escapes it);
 * its line breaks are kept by CSS, never by injecting HTML.
 */
export function PaymentDecisionNotice({ lang, kind, decision, currency }: {
  lang: Lang;
  kind: "rejected" | "needs_info";
  decision: HubLatestDecision;
  currency: "JPY" | "PHP";
}) {
  const t = tr(lang);
  const method = decision.method === "paidy" ? t("orders", "decisionMethodPaidy")
    : decision.method === "card" ? t("orders", "decisionMethodCard")
    : decision.method === "cod" ? t("orders", "decisionMethodCod")
    : t("orders", "decisionMethodTransfer");
  const message = decision.message?.trim() ? decision.message : null;
  return (
    <div role="status" className="mb-6 border border-gold-dark bg-white p-5 sm:p-6" data-testid="payment-decision-notice" data-kind={kind}>
      <p className="font-display text-lg leading-snug text-charcoal-deep">
        {kind === "rejected"
          ? t("orders", "decisionRejected", { method, amount: formatMoney(Number(decision.amount), currency), date: formatSiteDate(decision.decided_at, lang) })
          : t("orders", "decisionNeedsInfo")}
      </p>
      {message && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("orders", "decisionMessage")}</p>
          <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-charcoal-deep" data-testid="decision-message">{message}</p>
        </div>
      )}
      {kind === "rejected" && (decision.method === "paidy" || decision.method === "card") && (
        <p className="mt-3 text-sm text-charcoal/80">{t("orders", "decisionNothingCharged")}</p>
      )}
      {kind === "needs_info" && <p className="mt-3 text-sm text-charcoal/80">{t("orders", "decisionReplyHint")}</p>}
    </div>
  );
}
