"use client";

import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { cardAuthorizeAction } from "@/lib/card-actions";
import { squareSdkSrc } from "@/lib/card";
import { AGREEMENT_REQUIRED, AGREEMENT_UNVERIFIED } from "@/lib/layaway-agreement";
import type { HubOrderCard } from "@/lib/types";

/**
 * Card payment on a confirmed order (Square Web Payments SDK, S3 2026-10-04).
 *
 * Square's own iframe form takes the card — the number never touches this
 * page or Cha Jewels. This component only (1) loads Square's script for the
 * environment the Hub's ids belong to, (2) attaches the card form, (3) asks
 * the SDK for a one-time token WITH buyer verification (3-D Secure runs inside
 * `card.tokenize(verificationDetails)` — Square's current flow; the separate
 * `verifyBuyer()` is deprecated), and (4) hands the token to the server, where
 * the Hub places a HOLD and files it for a reviewer. Nothing is charged here;
 * no figure is computed here — `amount` is the Hub's, passed through.
 *
 * Reference: developer.squareup.com/docs/web-payments/take-card-payment —
 * `Square.payments(appId, locationId)`, `payments.card()`, `card.attach(el)`,
 * `card.tokenize(verificationDetails)` → `{ status: 'OK', token }`.
 */
type TokenResult = { status: string; token?: string; errors?: { message?: string }[] };
type SquareCard = { attach: (el: string | HTMLElement) => Promise<void>; tokenize: (v: VerificationDetails) => Promise<TokenResult>; destroy?: () => Promise<void> };
type SquarePayments = { card: () => Promise<SquareCard> };
type SquareGlobal = { payments: (appId: string, locationId: string) => SquarePayments };
type VerificationDetails = {
  amount: string; currencyCode: "JPY"; intent: "CHARGE"; customerInitiated: true; sellerKeyedIn: false;
  billingContact: BillingContact;
};
export type BillingContact = {
  givenName?: string; familyName?: string; email?: string; phone?: string;
  addressLines?: string[]; city?: string; state?: string; postalCode?: string; countryCode?: string;
};

declare global {
  interface Window { Square?: SquareGlobal }
}

type State = "loading" | "ready" | "tokenizing" | "filing" | "held" | "error";

export function CardPay({ orderId, card, billing, amountLabel, lang }: {
  orderId: string;
  card: HubOrderCard;
  /** The buyer as the Hub knows her, for Square's verification — built on the server from the order. */
  billing: BillingContact;
  /** The Hub's amount, already formatted by the page. */
  amountLabel: string;
  lang: Lang;
}) {
  const t = tr(lang);
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [code, setCode] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [heldCard, setHeldCard] = useState<string>("");
  const [scriptReady, setScriptReady] = useState(false);
  const cardRef = useRef<SquareCard | null>(null);
  const [, start] = useTransition();

  // Attach Square's form once the script is in. The ids are the Hub's; a
  // wrong family never gets here (lib/card.ts cardOffer).
  // `onReady` (not only `onLoad`): next/script fires onLoad once per document
  // per src, so a second mount of this page — back to the order and "Pay by
  // card" again — would wait for a load that never comes (the repo met this
  // in metricool-tracker.tsx). Belt and braces: an SDK already on the window
  // is ready at mount.
  useEffect(() => { if (window.Square) setScriptReady(true); }, []);
  useEffect(() => {
    if (!scriptReady || cardRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const Square = window.Square;
        if (!Square) throw new Error("no_sdk");
        const payments = Square.payments(card.app_id, card.location_id);
        const c = await payments.card();
        // Checked BEFORE attach: React's dev double-effect would otherwise
        // attach two forms to one container.
        if (cancelled) { await c.destroy?.(); return; }
        cardRef.current = c;
        await c.attach("#cj-card-container");
        if (!cancelled) setState("ready");
      } catch (err) {
        console.error("[card-pay] Square init failed:", err);
        cardRef.current = null;
        if (!cancelled) { setCode("card_unavailable"); setState("error"); }
      }
    })();
    return () => {
      cancelled = true;
      const c = cardRef.current;
      cardRef.current = null;
      void c?.destroy?.();
    };
  }, [scriptReady, card.app_id, card.location_id]);

  const pay = async () => {
    const c = cardRef.current;
    if (!c) return;
    if (!agreed) { setCode("terms_required"); setState("error"); return; }
    setCode(null);
    setState("tokenizing");
    const acceptedAt = new Date().toISOString();
    let token: string;
    try {
      const result = await c.tokenize({
        amount: String(card.amount_jpy),
        currencyCode: "JPY",
        intent: "CHARGE",
        customerInitiated: true,
        sellerKeyedIn: false,
        billingContact: billing,
      });
      if (result.status !== "OK" || !result.token) {
        // The form itself refused (bad number, expiry, CVV) or the bank's
        // check did not complete. Nothing left the page.
        setCode(result.status === "Cancel" ? "verification_required" : "form");
        setState("ready");
        return;
      }
      token = result.token;
    } catch (err) {
      console.error("[card-pay] tokenize failed:", err);
      setCode("form");
      setState("ready");
      return;
    }
    setState("filing");
    start(async () => {
      const r = await cardAuthorizeAction(orderId, { sourceId: token, verificationToken: null, termsAcceptedAt: acceptedAt });
      if (r.ok) {
        setHeldCard([r.data.brand, r.data.last4 ? `····${r.data.last4}` : ""].filter(Boolean).join(" "));
        // The confirmation stays on screen; no refresh here — this page would
        // redirect the moment the Hub reports the pending submission. "Back to
        // the order" is a fresh navigation and the action revalidated both paths.
        setState("held");
      } else {
        setCode(r.code);
        setState(r.code === AGREEMENT_REQUIRED || r.code === AGREEMENT_UNVERIFIED || r.code === "signed_out" ? "error" : "ready");
        if (r.code === AGREEMENT_REQUIRED) router.refresh();
      }
    });
  };

  if (state === "held") {
    return (
      <div className="border border-gold-dark bg-gold-pale/40 p-5 sm:p-6" role="status" data-testid="card-held">
        <p className="font-display text-[17px] text-charcoal-deep">{heldCard ? t("card", "held", { card: heldCard }) : t("card", "heldNoCard")}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-charcoal/75">{t("card", "note")}</p>
        <Link href={`/account/orders/${orderId}`} className="mt-4 inline-flex h-11 items-center bg-charcoal-deep px-5 text-[13px] font-medium uppercase tracking-[0.12em] text-white hover:bg-charcoal [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "backToOrder")}</Link>
      </div>
    );
  }

  const busy = state === "tokenizing" || state === "filing";
  const fatal = state === "error" && (code === "card_unavailable" || code === AGREEMENT_REQUIRED || code === AGREEMENT_UNVERIFIED || code === "signed_out");

  return (
    <div className="border border-hairline bg-white p-5 sm:p-7" data-testid="card-pay">
      <Script src={squareSdkSrc(card.test)} strategy="afterInteractive" onLoad={() => setScriptReady(true)} onReady={() => setScriptReady(true)} onError={() => { setCode("card_unavailable"); setState("error"); }} />
      <p className="text-[13px] leading-relaxed text-charcoal/80">{t("card", "lede")}</p>
      <dl className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "amount")}</dt>
        <dd className="cj-fig font-display text-[26px] leading-tight text-charcoal-deep">{amountLabel}</dd>
      </dl>
      {/* Square's iframe lands here. Kept in the DOM in every state so attach() has a target. */}
      <div id="cj-card-container" className="mt-5 min-h-[56px]" aria-busy={state === "loading"} />
      {state === "loading" && !fatal && <p className="mt-2 text-[13px] text-charcoal/60">{t("card", "loading")}</p>}
      <label className="mt-5 flex items-start gap-3 text-[13px] leading-relaxed text-charcoal/85">
        <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); if (code === "terms_required") { setCode(null); setState("ready"); } }} disabled={busy || fatal} className="mt-1 h-4 w-4 shrink-0 accent-gold-dark" />
        <span>{t("card", "terms")}</span>
      </label>
      <button
        type="button"
        onClick={pay}
        disabled={state === "loading" || busy || fatal || !agreed}
        className="mt-5 inline-flex h-12 w-full items-center justify-center bg-charcoal-deep px-5 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]"
      >
        {busy ? t("card", "filing") : t("card", "button")}
      </button>
      {card.test && <p className="mt-2 text-[12px] text-charcoal/60">{t("card", "testMode")}</p>}
      {code && <p className="mt-3 text-sm text-red-700" role="alert">{errorText(code, t)}</p>}
      <p className="mt-4 text-[12px] leading-relaxed text-charcoal/70">{t("card", "note")}</p>
    </div>
  );
}

function errorText(code: string, t: ReturnType<typeof tr>): string {
  switch (code) {
    case "card_declined": return t("card", "errDeclined");
    case "card_mismatch": return t("card", "errMismatch");
    case "verification_required": return t("card", "errVerification");
    case "card_not_offered":
    case "not_ready_for_payment": return t("card", "errNotOffered");
    case "submission_pending": return t("card", "errPending");
    case "too_many_submissions":
    case "too_many_attempts": return t("card", "errTooMany");
    case "signed_out": return t("card", "errSignedOut");
    case "terms_required": return t("card", "errTerms");
    case "card_unavailable": return t("card", "errUnavailable");
    case "form": return t("card", "errForm");
    case AGREEMENT_REQUIRED: return t("card", "signLede");
    case AGREEMENT_UNVERIFIED: return t("card", "unverified");
    default: return t("card", "errFailed");
  }
}
