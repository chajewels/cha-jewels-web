"use client";

import { useRef, useState, useTransition } from "react";
import { submitLayawayPaymentAction } from "@/lib/layaway-actions";
import { tr, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SettlementCurrency, TransferMethod } from "@/lib/types";
import { alertLight, errorLight, inputLight, labelLight } from "@/lib/form-classes";

/**
 * Reporting a transfer against a plan.
 *
 * This form does not pay anything. It tells Cha Jewels that a transfer was
 * sent, with proof; a reviewer checks it against the bank and only then does
 * the plan's balance move. The copy says so plainly rather than showing a
 * success message that implies the money has landed.
 *
 * Proof is required, as it is on every other way a payment can be reported —
 * the Hub refuses a submission without it, and so does this form, so the
 * customer learns before the upload rather than after.
 */
export function LayawayPayForm({ accountId, lang, currency, suggestedAmount, methods }: {
  accountId: string;
  lang: Lang;
  currency: SettlementCurrency;
  /** What the plan expects next: the deposit, or the earliest unpaid row. */
  suggestedAmount: number;
  methods: TransferMethod[];
}) {
  const t = tr(lang);
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const errorCopy = (code: string) =>
    code === "bad_amount" ? t("plans", "errBadAmount")
    : code === "bad_payment_date" ? t("plans", "errBadDate")
    : code === "payment_method_required" ? t("plans", "errMethod")
    : code === "proof_required" ? t("plans", "errProof")
    : code === "proof_too_large" ? t("plans", "errProofLarge")
    : code === "proof_upload_failed" ? t("plans", "errProofUpload")
    : code === "too_many_submissions" ? t("plans", "errTooMany")
    : code === "exceeds_balance" ? t("plans", "errExceeds")
    : code === "plan_not_live" ? t("plans", "errNotLive")
    : t("plans", "errFailed");

  function submit(form: FormData) {
    setError(null);
    start(async () => {
      const res = await submitLayawayPaymentAction(accountId, form);
      if (!res.ok) { setError(errorCopy(res.code)); return; }
      setSent(true);
      formRef.current?.reset();
    });
  }

  const field = `mt-1 w-full px-3 py-2 ${inputLight}`;
  // Today in the customer's own clock is the sensible default and the latest
  // date that can be true; a transfer cannot have been sent tomorrow.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-10 border border-hairline p-6">
      <h2 className="font-display text-xl text-charcoal-deep">{t("plans", "payH")}</h2>
      <p className="mt-2 max-w-[56ch] text-sm text-charcoal/70">{t("plans", "payP")}</p>

      {error && (
        <p role="alert" className={`mt-4 ${alertLight} p-4 text-sm`}>{error}</p>
      )}
      {sent && !error && (
        <p className="mt-4 border border-gold-dark px-4 py-3 text-sm text-gold-dark">{t("plans", "paySent")}</p>
      )}

      <form ref={formRef} action={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-charcoal/70">
          {t("plans", "payAmount")} <span className="text-gold-dark">*</span>
          <input
            name="amount" type="number" inputMode="numeric" min={1} step={1}
            defaultValue={suggestedAmount > 0 ? suggestedAmount : undefined}
            required className={field}
          />
          <span className="mt-1 block text-[11px] text-charcoal/70">
            {formatMoney(suggestedAmount, currency)}
          </span>
        </label>

        <label className="text-sm text-charcoal/70">
          {t("plans", "payDate")} <span className="text-gold-dark">*</span>
          <input name="payment_date" type="date" max={today} defaultValue={today} required className={field} />
        </label>

        <label className="text-sm text-charcoal/70">
          {t("plans", "payMethod")} <span className="text-gold-dark">*</span>
          {/* The same methods shown above, so what the customer picks here is
              one of the accounts they were actually given. */}
          <select name="payment_method" required defaultValue="" className={field}>
            <option value="" disabled>—</option>
            {methods.map((m) => (
              <option key={m.id} value={lang === "ja" ? m.label_ja : m.label_en}>
                {lang === "ja" ? m.label_ja : m.label_en}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-charcoal/70">
          {t("plans", "payReference")}
          <input name="reference_number" autoComplete="off" className={field} />
        </label>

        <label className="text-sm text-charcoal/70 sm:col-span-2">
          {t("plans", "payProof")} <span className="text-gold-dark">*</span>
          <input name="proof" type="file" accept="image/*,application/pdf" required className={field} />
          <span className="mt-1 block text-[11px] text-charcoal/70">{t("plans", "payProofNote")}</span>
        </label>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? t("plans", "paySending") : t("plans", "paySubmit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
