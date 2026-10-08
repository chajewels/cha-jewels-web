"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { paidyAbandonAction, paidyAuthorizedAction, paidyStartAction } from "@/lib/paidy-actions";
import { paidyStatus } from "@/lib/paidy";
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
 * Shown only when the Hub says `offered` — the Hub's paidy-rules decide (she
 * chose Paidy, a confirmed yen order with money due and nothing paid or
 * pending, a complete Japanese delivery address, her names, a Japanese mobile
 * and a Japanese billing address). While the Paidy window or its payment is
 * being processed the Hub hides every other option (owner rule 2026-10-04).
 *
 * PA15B (owner 2026-10-08 17:17 JST): she chooses where Paidy BILLS her from
 * her own Japanese address-book entries (the Hub lists them, default first,
 * and checks the choice again); the piece still goes to the order's delivery
 * address. Nothing is chosen for her silently.
 *
 * Reference: paidy.com/docs/en/paidycheckout.html — `Paidy.configure({api_key,
 * logo_url, closed})` returns a handler; `handler.launch(payload)`; `closed`
 * receives `{id, amount, currency, created_at, status}` with status
 * AUTHORIZED | REJECTED | CLOSED (the customer left the window).
 */
const PAIDY_SRC = "https://apps.paidy.com/";

// Paidy's reference documents the status in upper case; the live Checkout
// (test run 2026-10-03, pay_asDHekoAAEkAmsmA) sent "authorized" in lower case,
// so paidyStatus() compares case-insensitively. An exact compare dropped a real
// authorisation as "window closed".
type PaidyResult = { id: string; amount: number; currency: string; created_at: string; status: string };

type PaidyHandler = { launch: (payload: PaidyCheckoutPayload) => void };
type PaidyGlobal = { configure: (opts: { api_key: string; logo_url?: string; closed: (r: PaidyResult) => void }) => PaidyHandler };

declare global {
  interface Window { Paidy?: PaidyGlobal }
}

type State = "idle" | "starting" | "open" | "filing" | "rejected" | "error" | "uncertain";

export function PaidyPay({ orderId, paidy, logoUrl, lang }: { orderId: string; paidy: HubOrderPaidy; logoUrl: string; lang: Lang }) {
  const t = tr(lang);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [, start] = useTransition();
  const choices = paidy.billing_choices ?? [];
  const [billingId, setBillingId] = useState<string | null>(paidy.billing_address_id ?? choices[0]?.id ?? null);

  // P06 (2026-10-04): next/script fires onLoad only the first time the script
  // loads. After a client-side navigation back to this page the script is
  // already there and onLoad never fires again, so the button stayed disabled.
  // onReady (below) runs on every mount once loaded; this check covers the
  // same case if the script was injected by an earlier render.
  useEffect(() => {
    if (typeof window !== "undefined" && window.Paidy) setReady(true);
  }, []);

  // Follow-up 2026-10-04 (owner: while Paidy processes, no other way to pay):
  //   1. the Hub records the window BEFORE Paidy opens (paidyStartAction) —
  //      refused when another tab or payment is already in progress;
  //   2. every SDK call is guarded, so an exception never leaves the button
  //      stuck; a launch that throws ends the window on the Hub;
  //   3. Paidy's "closed" / "rejected" end the window so the other options
  //      come back; an AUTHORIZED result is filed;
  //   4. a filing whose outcome is unknown (network, server error) is NOT
  //      retried blindly: the page re-reads the order from the Hub, which
  //      keeps every option hidden while the authorisation is being recovered.
  const open = () => {
    const Paidy = window.Paidy;
    if (!Paidy) return;
    setState("starting");
    setCode(null);
    start(async () => {
      const started = await paidyStartAction(orderId, choices.length > 0 ? billingId : null);
      if (!started.ok) {
        setCode(started.code);
        setState("error");
        if (started.code === "payment_in_progress" || started.code === "paidy_not_offered" || started.code === "billing_address_invalid") router.refresh();
        return;
      }
      const { attemptId, checkout } = started.data;
      // PA04 (2026-10-08): a rejected / closed window still names the payment
      // Paidy created for it — handed to the Hub so its hourly check can
      // verify with Paidy that nothing is held before the window ends.
      const endWindow = (reason: "closed" | "rejected" | "error", paidyPaymentId?: unknown) => {
        start(async () => {
          await paidyAbandonAction(orderId, attemptId, reason, paidyPaymentId);
          router.refresh();
        });
      };
      try {
        const handler = Paidy.configure({
          api_key: paidy.public_key,
          logo_url: logoUrl,
          closed: (result) => {
            const status = paidyStatus(result?.status);
            if (status === "AUTHORIZED" && !result?.id) {
              // Paidy says approved but sent no id: never end the window — the
              // Hub recovers the authorisation from Paidy's own notification.
              setState("uncertain");
              router.refresh();
              return;
            }
            if (status === "AUTHORIZED") {
              setState("filing");
              start(async () => {
                let r: Awaited<ReturnType<typeof paidyAuthorizedAction>>;
                try {
                  r = await paidyAuthorizedAction(orderId, result.id);
                } catch {
                  r = { ok: false, code: "failed" };
                }
                if (r.ok) {
                  router.refresh();
                } else if (r.code === "failed" || r.code === "signed_out") {
                  // Paidy approved it; whatever failed here, the Hub files it
                  // from Paidy's own notification — never ask her to pay again.
                  // Unknown outcome: the authorisation may be on file or be
                  // recovered by the Hub. Show "being processed" and let the
                  // Hub's answer decide what the page offers next.
                  setState("uncertain");
                  router.refresh();
                } else {
                  setCode(r.code);
                  setState("error");
                  router.refresh();
                }
              });
            } else if (status === "REJECTED") {
              setState("rejected");
              endWindow("rejected", result?.id);
            } else if (status === "CLOSED") {
              setState("idle");
              endWindow("closed", result?.id);
            } else {
              // PA15A (2026-10-09): an answer we cannot read is never "closed"
              // — the window is NOT ended (Paidy may still hold an
              // authorisation); the Hub's hourly check decides.
              setState("uncertain");
              router.refresh();
            }
          },
        });
        if (!checkout) throw new Error("no checkout payload");
        setState("open");
        handler.launch(checkout);
      } catch {
        setCode("failed");
        setState("error");
        endWindow("error");
      }
    });
  };

  // "uncertain" lasts until the Hub's answer arrives: the page then shows the
  // processing notice (this component unmounts) — or, if the Hub really holds
  // nothing, the button comes back after a short wait.
  useEffect(() => {
    if (state !== "uncertain") return;
    const t = setTimeout(() => setState("idle"), 30_000);
    return () => clearTimeout(t);
  }, [state]);

  const busy = state === "starting" || state === "open" || state === "filing" || state === "uncertain";

  return (
    <div className="mb-5 border border-gold-dark/60 bg-gold-pale/40 p-4 sm:p-5" data-testid="paidy-pay">
      <Script src={PAIDY_SRC} strategy="afterInteractive" charSet="utf-8" onLoad={() => setReady(true)} onReady={() => setReady(true)} onError={() => setState("error")} />
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
      {choices.length > 0 && (
        <fieldset className="mt-4" data-testid="paidy-billing">
          <legend className="text-xs uppercase tracking-[0.14em] text-charcoal/70 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("paidy", "billingTitle")}</legend>
          <p className="mt-1 text-[12px] leading-relaxed text-charcoal/70">{t("paidy", "billingHelp")}</p>
          <div className="mt-2 space-y-2">
            {choices.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-start gap-3 border border-hairline bg-white p-3 text-[13px] text-charcoal-deep has-[:checked]:border-gold-dark">
                <input
                  type="radio" name="paidy-billing" value={c.id} className="mt-1 accent-charcoal-deep"
                  checked={billingId === c.id} onChange={() => setBillingId(c.id)} disabled={busy}
                />
                <span className="min-w-0 break-words">
                  {c.postal_code ? `〒${c.postal_code} ` : ""}{[c.region, c.city, c.line1, c.line2].filter(Boolean).join(" ")}
                  {c.is_default && <span className="ml-2 text-[11px] text-charcoal/60">({t("paidy", "billingDefault")})</span>}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[12px]">
            <Link href="/account/addresses" className="text-gold-dark underline underline-offset-4 hover:text-charcoal-deep">{t("paidy", "billingAdd")}</Link>
          </p>
        </fieldset>
      )}
      {paidy.test && <p className="mt-2 text-[12px] text-charcoal/60">{t("paidy", "testMode")}</p>}
      {state === "rejected" && <p className="mt-3 text-sm text-red-700" role="status">{t("paidy", "rejected")}</p>}
      {state === "error" && <p className="mt-3 text-sm text-red-700" role="status">{errorText(code, t)}</p>}
      {state === "uncertain" && <p className="mt-3 text-sm text-charcoal/80" role="status">{t("paidy", "uncertain")}</p>}
      <p className="mt-3 text-[12px] leading-relaxed text-charcoal/70">{t("paidy", "note")}</p>
    </div>
  );
}

function errorText(code: string | null, t: ReturnType<typeof tr>): string {
  switch (code) {
    case "paidy_mismatch": return t("paidy", "errMismatch");
    case "paidy_not_offered":
    case "not_ready_for_payment": return t("paidy", "errNotOffered");
    case "submission_pending":
    case "payment_in_progress": return t("paidy", "errPending");
    case "too_many_submissions": return t("paidy", "errTooMany");
    case "signed_out": return t("paidy", "errSignedOut");
    case "billing_address_invalid": return t("paidy", "errBillingInvalid");
    default: return t("paidy", "errFailed");
  }
}
