"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { switchMethodAction } from "@/lib/payment-method-actions";
import { switchErrorKey, type SwitchErrorKey } from "@/lib/switch-method-copy";
import type { CheckoutMethod } from "@/lib/types";

/**
 * WEBSITE PAYMENT LIFECYCLE (task S3, spec §4C, D1). "Pay another way", under
 * her method's box, ONLY while the Hub says she may (`can_switch_method`):
 * her Paidy or card payment was rejected, nothing is in progress, the order is
 * payable. It lists exactly the Hub's `switch_methods` — never a method of its
 * own choosing — and asks once before changing. The Hub re-checks and may
 * refuse; the page is then re-read, so it shows the order as it now stands.
 */
export function SwitchMethod({ orderId, methods, lang }: { orderId: string; methods: CheckoutMethod[]; lang: Lang }) {
  const t = tr(lang);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<CheckoutMethod | null>(null);
  const [error, setError] = useState<SwitchErrorKey | null>(null);
  const [busy, startTransition] = useTransition();
  if (methods.length === 0) return null;

  const name = (m: CheckoutMethod) => (m === "paidy" ? t("checkout", "methodPaidy") : m === "card" ? t("checkout", "methodCard") : t("checkout", "methodTransfer"));
  const confirm = () => {
    if (!picked) return;
    setError(null);
    startTransition(async () => {
      const r = await switchMethodAction(orderId, picked);
      if (r.ok) { setPicked(null); setOpen(false); router.refresh(); return; }
      const key = switchErrorKey(r.code);
      setError(key);
      if (key !== "switchFailed") router.refresh();
    });
  };
  const btn = "inline-flex min-h-11 items-center justify-center px-5 text-[13px] font-medium uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-50 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]";

  return (
    <div className="mb-5" data-testid="switch-method">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} aria-expanded={false} className="text-sm text-gold-dark underline underline-offset-4 hover:text-charcoal-deep">
          {t("orders", "switchLink")}
        </button>
      ) : (
        <div className="border border-hairline bg-white p-4 sm:p-5">
          <p className="font-display text-[17px] text-charcoal-deep">{t("orders", "switchLink")}</p>
          {!picked ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {methods.map((m) => (
                <button key={m} type="button" onClick={() => { setError(null); setPicked(m); }} className={`${btn} border border-charcoal-deep bg-white text-charcoal-deep hover:bg-chalk`} data-method={m}>
                  {name(m)}
                </button>
              ))}
              <button type="button" onClick={() => { setOpen(false); setError(null); }} className={`${btn} text-charcoal/80 hover:text-charcoal-deep`}>{t("orders", "switchCancel")}</button>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-charcoal-deep">{t("orders", "switchConfirm", { method: name(picked) })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={confirm} disabled={busy} className={`${btn} bg-charcoal-deep text-white hover:bg-charcoal`}>{t("orders", "switchConfirmButton")}</button>
                <button type="button" onClick={() => setPicked(null)} disabled={busy} className={`${btn} text-charcoal/80 hover:text-charcoal-deep`}>{t("orders", "switchCancel")}</button>
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-700" role="status">{t("orders", error)}</p>}
        </div>
      )}
    </div>
  );
}
