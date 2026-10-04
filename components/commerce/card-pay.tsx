"use client";

import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { cardAuthorizeAction } from "@/lib/card-actions";
import { CARD_AGREEMENT_RESIGN, cardBilling, squareSdkSrc, type CardBillingForm, type SquareBillingContact } from "@/lib/card";
import { BILLING_COUNTRIES } from "@/lib/billing-countries";
import { AGREEMENT_REQUIRED, AGREEMENT_UNVERIFIED } from "@/lib/layaway-agreement";
import { inputLight, labelLight } from "@/lib/form-classes";
import type { HubAddress, HubOrderCard } from "@/lib/types";
import { CardPaymentStatus } from "@/components/commerce/card-payment-status";

/**
 * Card payment on a confirmed order (Square Web Payments SDK; S3 + the
 * integrity pass SQ17–SQ23, 2026-10-04).
 *
 * Square's own iframe form takes the card — the number never touches this
 * page or Cha Jewels. This component only (1) loads Square's script for the
 * environment the Hub's ids belong to, (2) attaches the card form, (3) asks
 * the SDK for a one-time token WITH buyer verification details
 * (`card.tokenize(verificationDetails)` — 3-D Secure, when the bank asks,
 * runs inside it; nothing here claims it was "verified", SQ18), and (4) hands
 * the token to the server, where the Hub places a HOLD and files it for a
 * reviewer. Nothing is charged here; no figure is computed here — `amount_jpy`
 * is the Hub's, passed through and sent back as `expected_amount_jpy`.
 *
 * THE CARDHOLDER (owner 4A, SQ17): a cardholder-name field, pre-filled with
 * her own name and editable, and "billing address same as delivery" (on by
 * default when the order has a delivery address). The NAME sent to Square and
 * to the Hub is always that field — never the delivery or gift recipient.
 *
 * RESILIENCE (SQ23): the Square card instance is destroyed on a failed attach
 * and on unmount; a second click while a payment is in flight is ignored; a
 * server action that throws is "we couldn't confirm the result", never "not
 * charged"; after a hold (200) or "being confirmed" (202) the page refreshes,
 * and the order page shows the card payment's state.
 *
 * Reference: developer.squareup.com/docs/web-payments/take-card-payment —
 * `Square.payments(appId, locationId)`, `payments.card()`, `card.attach(el)`,
 * `card.tokenize(verificationDetails)` → `{ status: 'OK', token }`.
 */
type TokenResult = { status: string; token?: string; errors?: { message?: string }[] };
type SquareCard = { attach: (el: string | HTMLElement) => Promise<void>; tokenize: (v: VerificationDetails) => Promise<TokenResult>; destroy?: () => Promise<unknown> };
type SquarePayments = { card: () => Promise<SquareCard> };
type SquareGlobal = { payments: (appId: string, locationId: string) => SquarePayments };
type VerificationDetails = {
  amount: string; currencyCode: "JPY"; intent: "CHARGE"; customerInitiated: true; sellerKeyedIn: false;
  billingContact: SquareBillingContact;
};

declare global {
  interface Window { Square?: SquareGlobal }
}

/** The delivery address as the Hub holds it for this order — the address half of "same as delivery". */
export type CardDelivery = Pick<HubAddress, "line1" | "line2" | "city" | "region" | "postal_code" | "country">;

type State = "loading" | "ready" | "tokenizing" | "filing" | "held" | "processing" | "error";

/** Codes after which the form must not be offered again on this render: the page (or a refresh) decides what comes next. */
const FATAL = new Set([
  "sdk_unavailable", "signed_out", AGREEMENT_REQUIRED, AGREEMENT_UNVERIFIED, CARD_AGREEMENT_RESIGN,
  "card_declined_cancelled", "card_mismatch_void_pending", "card_attempt_pending", "card_hold_unfiled",
  "amount_changed", "unconfirmed", "submission_pending", "card_not_offered", "not_ready_for_payment",
]);
/** Codes whose next step is a fresh look at the page (a refresh re-reads the Hub). */
const REFRESH = new Set(["card_attempt_pending", "amount_changed", "unconfirmed", "card_not_offered", "not_ready_for_payment"]);

/** Destroy a Square card instance without letting its failure escape. */
async function destroyCard(c: SquareCard | null | undefined) {
  try { await c?.destroy?.(); } catch (err) { console.warn("[card-pay] card.destroy failed:", err); }
}

export function CardPay({ orderId, card, delivery, amountLabel, lang, nonce }: {
  orderId: string;
  card: HubOrderCard;
  /** The order's delivery address (no recipient name: the cardholder is named separately), or null. */
  delivery: CardDelivery | null;
  /** The Hub's amount, already formatted by the page. */
  amountLabel: string;
  lang: Lang;
  /** The pay-card page's CSP nonce (middleware.ts → x-nonce), for Square's script. */
  nonce?: string;
}) {
  const t = tr(lang);
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [code, setCode] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [held, setHeld] = useState<{ brand: string | null; last4: string | null; captureBy: string | null; reference: string | null } | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [form, setForm] = useState<CardBillingForm>({
    name: (card.cardholder_name ?? "").trim(),
    sameAsDelivery: !!delivery,
    country: "", postalCode: "", state: "", city: "", line1: "", line2: "",
  });
  const cardRef = useRef<SquareCard | null>(null);
  // The double-submit guard (SQ23): a ref, not state, so a second click in the
  // same tick sees it.
  const inFlight = useRef(false);

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
    let mine: SquareCard | null = null;
    (async () => {
      try {
        const Square = window.Square;
        if (!Square) throw new Error("no_sdk");
        const payments = Square.payments(card.app_id, card.location_id);
        mine = await payments.card();
        // Checked BEFORE attach: React's dev double-effect would otherwise
        // attach two forms to one container.
        if (cancelled) { await destroyCard(mine); return; }
        cardRef.current = mine;
        await mine.attach("#cj-card-container");
        if (!cancelled) setState("ready");
      } catch (err) {
        console.error("[card-pay] Square init failed:", err);
        // A failed attach leaves a half-built instance: destroy it (SQ23).
        if (cardRef.current === mine) cardRef.current = null;
        await destroyCard(mine);
        if (!cancelled) { setCode("sdk_unavailable"); setState("error"); }
      }
    })();
    return () => {
      cancelled = true;
      const c = cardRef.current;
      cardRef.current = null;
      void destroyCard(c);
    };
  }, [scriptReady, card.app_id, card.location_id]);

  const set = (patch: Partial<CardBillingForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    if (code === "billing_name_required" || code === "billing_address_required") { setCode(null); setState("ready"); }
  };

  const pay = async () => {
    const c = cardRef.current;
    if (!c || inFlight.current) return;
    if (!agreed) { setCode("terms_required"); setState("error"); return; }
    const billing = cardBilling(form, delivery);
    if (!billing.ok) { setCode(billing.code); setState("ready"); return; }
    inFlight.current = true;
    setCode(null);
    setState("tokenizing");
    try {
      const acceptedAt = new Date().toISOString();
      let token: string;
      try {
        const result = await c.tokenize({
          amount: String(card.amount_jpy),
          currencyCode: "JPY",
          intent: "CHARGE",
          customerInitiated: true,
          sellerKeyedIn: false,
          billingContact: billing.square,
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
      let r: Awaited<ReturnType<typeof cardAuthorizeAction>>;
      try {
        r = await cardAuthorizeAction(orderId, { sourceId: token, termsAcceptedAt: acceptedAt, billing: form, expectedAmountJpy: card.amount_jpy });
      } catch (err) {
        // The request may have reached the Hub and Square: we do not know (SQ22/SQ23).
        console.error("[card-pay] server action failed:", err);
        setCode("unconfirmed");
        setState("error");
        return;
      }
      if (r.ok) {
        if (r.data.outcome === "held") {
          setHeld({ brand: r.data.brand, last4: r.data.last4, captureBy: r.data.captureBy, reference: null });
          setState("held");
        } else {
          setHeld({ brand: null, last4: null, captureBy: null, reference: r.data.reference });
          setState("processing");
        }
        // The order page now shows the card payment's state; this page
        // redirects there once the Hub reports it.
        router.refresh();
        return;
      }
      setCode(r.code);
      setState(FATAL.has(r.code) ? "error" : "ready");
      // The page's own gate decides what an agreement refusal shows.
      if (r.code === AGREEMENT_REQUIRED || r.code === CARD_AGREEMENT_RESIGN || r.code === AGREEMENT_UNVERIFIED) router.refresh();
    } finally {
      inFlight.current = false;
    }
  };

  if (state === "held" || state === "processing") {
    return (
      <CardPaymentStatus lang={lang} state={state === "held" ? "held" : "processing"} brand={held?.brand} last4={held?.last4} captureBy={held?.captureBy} reference={held?.reference}>
        <a href={`/account/orders/${orderId}`} className="mt-4 inline-flex h-11 items-center bg-charcoal-deep px-5 text-[13px] font-medium uppercase tracking-[0.12em] text-white hover:bg-charcoal [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "backToOrder")}</a>
      </CardPaymentStatus>
    );
  }

  const busy = state === "tokenizing" || state === "filing";
  const fatal = state === "error" && !!code && FATAL.has(code);
  const locked = busy || fatal;
  const field = `mt-1 block w-full px-3 py-2 text-[15px] ${inputLight}`;
  const label = `block text-[12px] font-medium ${labelLight}`;
  const deliveryLines = delivery ? [
    [delivery.line1, delivery.line2].filter(Boolean).join(", "),
    [delivery.city, delivery.region, delivery.postal_code].filter(Boolean).join(" "),
    delivery.country ?? "",
  ].filter(Boolean) : [];

  return (
    <div className="border border-hairline bg-white p-5 sm:p-7" data-testid="card-pay">
      <Script src={squareSdkSrc(card.test)} nonce={nonce} strategy="afterInteractive" onLoad={() => setScriptReady(true)} onReady={() => setScriptReady(true)} onError={() => { setCode("sdk_unavailable"); setState("error"); }} />
      <p className="text-[13px] leading-relaxed text-charcoal/80">{t("card", "lede")}</p>
      <dl className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "amount")}</dt>
        <dd className="cj-fig font-display text-[26px] leading-tight text-charcoal-deep">{amountLabel}</dd>
      </dl>

      {/* The cardholder (owner 4A). Her name as on the card, never a recipient's. */}
      <div className="mt-5">
        <label className={label} htmlFor="cj-card-name">{t("card", "cardholderName")}</label>
        <input
          id="cj-card-name" name="cardholder-name" type="text" autoComplete="cc-name" required maxLength={120}
          value={form.name} onChange={(e) => set({ name: e.target.value })} disabled={locked}
          aria-describedby="cj-card-name-hint" aria-invalid={code === "billing_name_required"}
          className={field}
        />
        <p id="cj-card-name-hint" className="mt-1 text-[11px] text-charcoal/70">{t("card", "cardholderHint")}</p>
      </div>

      {/* Square's iframe lands here. Kept in the DOM in every state so attach() has a target. */}
      <div id="cj-card-container" className="mt-5 min-h-[56px]" aria-busy={state === "loading"} />
      {state === "loading" && !fatal && <p className="mt-2 text-[13px] text-charcoal/70">{t("card", "loading")}</p>}

      <fieldset className="mt-4" disabled={locked}>
        <legend className="sr-only">{t("card", "billingTitle")}</legend>
        {delivery && (
          <label className="flex items-start gap-3 text-[13px] leading-relaxed text-charcoal/85">
            <input type="checkbox" checked={form.sameAsDelivery} onChange={(e) => set({ sameAsDelivery: e.target.checked })} className="mt-1 h-4 w-4 shrink-0 accent-gold-dark" data-testid="card-billing-same" />
            <span>{t("card", "billingSame")}</span>
          </label>
        )}
        {form.sameAsDelivery && delivery ? (
          <div className="mt-2 border-l-2 border-hairline pl-3 text-[13px] leading-relaxed text-charcoal/80">
            <p className="text-[11px] text-charcoal/70">{t("card", "billingDelivery")}</p>
            {deliveryLines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="card-billing-fields">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gold-dark sm:col-span-2 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "billingTitle")}</p>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="cj-bill-country">{t("card", "billingCountry")}</label>
              <select id="cj-bill-country" autoComplete="billing country" value={form.country} onChange={(e) => set({ country: e.target.value })} className={field} required>
                <option value="" disabled>{t("card", "billingCountryPlaceholder")}</option>
                {BILLING_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="cj-bill-postal">{t("card", "billingPostal")}</label>
              <input id="cj-bill-postal" type="text" autoComplete="billing postal-code" maxLength={20} value={form.postalCode} onChange={(e) => set({ postalCode: e.target.value })} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="cj-bill-state">{t("card", "billingState")}</label>
              <input id="cj-bill-state" type="text" autoComplete="billing address-level1" maxLength={100} value={form.state} onChange={(e) => set({ state: e.target.value })} className={field} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="cj-bill-city">{t("card", "billingCity")}</label>
              <input id="cj-bill-city" type="text" autoComplete="billing address-level2" maxLength={100} value={form.city} onChange={(e) => set({ city: e.target.value })} className={field} required />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="cj-bill-line1">{t("card", "billingLine1")}</label>
              <input id="cj-bill-line1" type="text" autoComplete="billing address-line1" maxLength={200} value={form.line1} onChange={(e) => set({ line1: e.target.value })} className={field} required />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="cj-bill-line2">{t("card", "billingLine2")}</label>
              <input id="cj-bill-line2" type="text" autoComplete="billing address-line2" maxLength={200} value={form.line2} onChange={(e) => set({ line2: e.target.value })} className={field} />
            </div>
          </div>
        )}
      </fieldset>

      <label className="mt-5 flex items-start gap-3 text-[13px] leading-relaxed text-charcoal/85">
        <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); if (code === "terms_required") { setCode(null); setState("ready"); } }} disabled={locked} className="mt-1 h-4 w-4 shrink-0 accent-gold-dark" />
        <span>{t("card", "terms")}</span>
      </label>
      <button
        type="button"
        onClick={pay}
        disabled={state === "loading" || locked || !agreed}
        aria-busy={busy}
        className="mt-5 inline-flex h-12 w-full items-center justify-center bg-charcoal-deep px-5 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]"
      >
        {busy ? t("card", "filing") : t("card", "button")}
      </button>
      {card.test && <p className="mt-2 text-[12px] text-charcoal/70">{t("card", "testMode")}</p>}
      {code && (
        <div className="mt-3" role="alert">
          <p className="text-sm text-garnet">{errorText(code, t)}</p>
          {REFRESH.has(code) && (
            <button type="button" onClick={() => router.refresh()} className="mt-3 inline-flex h-10 items-center border border-charcoal-deep px-4 text-[12px] font-medium uppercase tracking-[0.12em] text-charcoal-deep hover:bg-gold-pale/40 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "refresh")}</button>
          )}
          {(code === "card_declined_cancelled" || code === "card_hold_unfiled" || code === "card_mismatch_void_pending") && (
            <Link href="/contact" className="mt-3 inline-flex h-10 items-center border border-charcoal-deep px-4 text-[12px] font-medium uppercase tracking-[0.12em] text-charcoal-deep hover:bg-gold-pale/40 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("navMenu", "contact")}</Link>
          )}
        </div>
      )}
      <p className="mt-4 text-[12px] leading-relaxed text-charcoal/70">{t("card", "note")}</p>
    </div>
  );
}

function errorText(code: string, t: ReturnType<typeof tr>): string {
  switch (code) {
    case "card_declined": return t("card", "errDeclined");
    case "card_declined_cancelled": return t("card", "errDeclinedCancelled");
    case "card_mismatch": return t("card", "errMismatch");
    case "card_mismatch_void_pending": return t("card", "errMismatchPending");
    case "card_attempt_pending": return t("card", "errAttemptPending");
    case "card_hold_unfiled": return t("card", "errHoldUnfiled");
    case "amount_changed": return t("card", "errAmountChanged");
    case "unconfirmed": return t("card", "errUnconfirmed");
    case "verification_required": return t("card", "errVerification");
    case "card_not_offered":
    case "not_ready_for_payment": return t("card", "errNotOffered");
    case "submission_pending": return t("card", "errPending");
    case "too_many_submissions":
    case "too_many_attempts": return t("card", "errTooMany");
    case "signed_out": return t("card", "errSignedOut");
    case "terms_required": return t("card", "errTerms");
    case "sdk_unavailable":
    case "card_unavailable": return t("card", "errUnavailable");
    case "billing_name_required": return t("card", "errBillingName");
    case "billing_address_required": return t("card", "errBillingAddress");
    case "form": return t("card", "errForm");
    case AGREEMENT_REQUIRED: return t("card", "signLede");
    case CARD_AGREEMENT_RESIGN: return t("card", "resignAmount");
    case AGREEMENT_UNVERIFIED: return t("card", "unverified");
    // Refused before the card request left (lib/card-actions.ts): nothing charged.
    case "failed": return t("card", "errFailed");
    // Anything unrecognised is treated as "we do not know" — never "not charged".
    default: return t("card", "errUnconfirmed");
  }
}
