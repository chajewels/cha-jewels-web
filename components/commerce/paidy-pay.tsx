"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { paidyAuthorizedAction } from "@/lib/paidy-actions";
import type { HubOrderPaidy, PaidyCheckoutPayload } from "@/lib/types";

/**
 * Paidy "ato-barai" on a confirmed order (Paidy Checkout, 2026-10-03).
 *
 * Paidy's own window does the whole thing — email, Japanese mobile number, SMS
 * code — and comes back with an authorisation. This component only (1) loads
 * Paidy's script, (2) opens that window with the payload the Hub built, and
 * (3) hands the resulting id to the server, where the Hub verifies it and
 * files it for a reviewer. No figure is computed or edited here: `checkout`
 * is passed to `launch()` exactly as the Hub sent it.
 *
 * Shown only when the Hub says `offered` (JP delivery address, yen, money due,
 * nothing pending). The bank details stay underneath — this is one more way
 * to pay, never the only one.
 *
 * Reference: paidy.com/docs/en/paidycheckout.html — `Paidy.configure({api_key,
 * logo_url, closed})` returns a handler; `handler.launch(payload)`; `closed`
 * receives `{id, amount, currency, created_at, status}` with status
 * AUTHORIZED | REJECTED | CLOSED (the customer left the window).
 */
const PAIDY_SRC = "https://apps.paidy.com/";

type PaidyResult = { id: string; amount: number; currency: string; created_at: string; status: "AUTHORIZED" | "REJECTED" | "CLOSED" };
type PaidyHandler = { launch: (payload: PaidyCheckoutPayload) => void };
type PaidyGlobal = { configure: (opts: { api_key: string; logo_url?: string; closed: (r: PaidyResult) => void }) => PaidyHandler };

declare global {
  interface Window { Paidy?: PaidyGlobal }
}

type State = "idle" | "open" | "filing" | "rejected" | "error";

export function PaidyPay({ orderId, paidy, logoUrl, lang }: { orderId: string; paidy: HubOrderPaidy; logoUrl: string; lang: Lang }) {
  const t = tr(lang);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [, start] = useTransition();

  const open = () => {
    const Paidy = window.Paidy;
    if (!Paidy) return;
    setState("open");
    setCode(null);
    const handler = Paidy.configure({
      api_key: paidy.public_key,
      logo_url: logoUrl,
      closed: (result) => {
        if (result.status === "AUTHORIZED") {
          setState("filing");
          start(async () => {
            const r = await paidyAuthorizedAction(orderId, result.id);
            if (r.ok) {
              // The page re-reads the order: the Hub now reports the pending
              // submission, and this button is no longer offered.
              router.refresh();
            } else {
              setCode(r.code);
              setState("error");
            }
          });
        } else if (result.status === "REJECTED") {
          setState("rejected");
        } else {
          setState("idle");
        }
      },
    });
    handler.launch(paidy.checkout);
  };

  const busy = state === "open" || state === "filing";

  return (
    <div className="mb-5 border border-gold-dark/60 bg-gold-pale/40 p-4 sm:p-5" data-testid="paidy-pay">
      <Script src={PAIDY_SRC} strategy="afterInteractive" charSet="utf-8" onLoad={() => setReady(true)} onError={() => setState("error")} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[17px] text-charcoal-deep">{t("paidy", "label")}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-charcoal/80">{t("paidy", "lede")}</p>
        </div>
        <button
          type="button"
          onClick={open}
          disabled={!ready || busy}
          className="inline-flex h-11 items-center justify-center bg-charcoal-deep px-5 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]"
        >
          {state === "filing" ? t("paidy", "filing") : t("paidy", "button")}
        </button>
      </div>
      {paidy.test && <p className="mt-2 text-[12px] text-charcoal/60">{t("paidy", "testMode")}</p>}
      {state === "rejected" && <p className="mt-3 text-sm text-red-700" role="status">{t("paidy", "rejected")}</p>}
      {state === "error" && <p className="mt-3 text-sm text-red-700" role="status">{errorText(code, t)}</p>}
      <p className="mt-3 text-[12px] leading-relaxed text-charcoal/70">{t("paidy", "note")}</p>
    </div>
  );
}

function errorText(code: string | null, t: ReturnType<typeof tr>): string {
  switch (code) {
    case "paidy_mismatch": return t("paidy", "errMismatch");
    case "paidy_not_offered":
    case "not_ready_for_payment": return t("paidy", "errNotOffered");
    case "submission_pending": return t("paidy", "errPending");
    case "too_many_submissions": return t("paidy", "errTooMany");
    case "signed_out": return t("paidy", "errSignedOut");
    default: return t("paidy", "errFailed");
  }
}
