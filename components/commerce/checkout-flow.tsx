"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { cartItemName, quoteItemName } from "@/lib/catalog-i18n";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { agreementStatusAction, payAction, payLayawayAction, quoteAction, saveAddressAction } from "@/lib/checkout-actions";
import { enrolInLoyaltyAction } from "@/lib/loyalty-actions";
import { TransferDetails } from "@/components/commerce/transfer-details";
import type { CartItem } from "@/lib/cart";
import type { CheckoutMode, HubAddress, HubQuote, LayawayTerm, OrderType, SettlementCurrency } from "@/lib/types";
import { LAYAWAY_UNAVAILABLE, TERM_NOT_LAUNCHED, layawayOffered, termLaunched } from "@/lib/layaway-availability";
import { AGREEMENT_LANG, AGREEMENT_REQUIRED, AGREEMENT_UNVERIFIED } from "@/lib/layaway-agreement";
import { alertLight, errorLight, inputLight, labelLight } from "@/lib/form-classes";
import { quoteIsReservation } from "@/lib/reservation";

/**
 * "sign" is not a numbered step and is not in the stepper.
 *
 * It is a GATE, not a stage of ordering: it appears for layaway only, between
 * choosing the term and seeing Review, and a full-price order never meets it.
 * Numbering it would either add a fourth item to a three-item stepper that the
 * cash flow shares, or renumber Review and Payment — both worse than an
 * unnumbered interstitial that says plainly what it wants.
 */
type Step = 1 | "sign" | 2 | 3;

/** The signing page. Public — the customer navigates to it. */
const AGREEMENT_SIGN_BASE = "https://agreement.chajewelsjp.com/";

/**
 * Where this customer signs, for THIS quote.
 *
 * `session` is the quote id — the key the signature is looked up by. `invoice`
 * is the plan's invoice number, which the Hub reserves the moment a layaway
 * quote is created and carries through to the plan unchanged; the signing page
 * prefills and locks its invoice field when it is present. It is omitted, not
 * sent empty, when the Hub did not return one (an older Hub deploy, or a quote
 * made before numbers were reserved) so the page falls back to asking.
 * `lang=tl` is fixed — the agreement is one document written in Tagalog with
 * English, with no separate English or Tagalog version, so there is nothing to
 * choose.
 */
function signUrl(quoteId: string, invoiceNumber: string | null): string {
  const u = new URL(AGREEMENT_SIGN_BASE);
  u.searchParams.set("session", quoteId);
  const inv = (invoiceNumber ?? "").trim();
  if (inv) u.searchParams.set("invoice", inv);
  u.searchParams.set("lang", AGREEMENT_LANG);
  return u.toString();
}

type AgreementState = { signed: boolean; version: string | null; signed_at: string | null } | null;

const ORDER_TYPES: OrderType[] = ["SELF", "GIFT", "PROXY"];

/**
 * Shown before the first quote, when nothing is known about eligibility yet.
 * These are the months plan_configurations holds; whether this basket reaches
 * one of them is the Hub's answer, and it replaces this list as soon as the
 * quote comes back.
 */
const DEFAULT_TERMS: LayawayTerm[] = [3, 6, 8, 10, 12].map((months) => ({
  months, label: `${months}`, min_amount: 0, dp_percentage: 0.3, eligible: true,
}));

export function CheckoutFlow({ lang, items, subtotal, initialAddresses, initialMode = "full", offerLoyalty = false, initialQuote = null, initialAgreement = null, jpyPhp = null }: {
  lang: Lang; items: CartItem[]; subtotal: number; initialAddresses: HubAddress[];
  /**
   * Pesos per yen from the Hub, read server-side by the page. Used ONLY to show
   * peso figures on the Delivery step before a quote exists; once the Hub has
   * priced the quote, the quote's own settlement figures win. null when the Hub
   * could not supply a rate, in which case the peso figures stay as dashes.
   * Never shown to the customer as a rate (owner decision 2026-09-18).
   */
  jpyPhp?: number | null;
  /**
   * The quote named by `?quote=`, already read back by the server. Present only
   * when the customer returned from signing in the SAME TAB — the signing link
   * opens a new one, so the usual path keeps its React state and never needs
   * this. When present the flow opens on Review rather than Step 1.
   */
  initialQuote?: HubQuote | null;
  /** That quote's signature, read in the same server pass. */
  initialAgreement?: AgreementState;
  /** "layaway" when the shopper arrived from Reserve on a product page. */
  initialMode?: CheckoutMode;
  /**
   * True only for a signed-in customer the Hub reports as NOT enrolled. A member
   * sees nothing — no box, no note, no mention of the programme — and so does
   * anyone whose loyalty state could not be read.
   */
  offerLoyalty?: boolean;
}) {
  const t = tr(lang);
  const router = useRouter();
  const [pending, start] = useTransition();

  // A rehydrated LAYAWAY quote lands on the signing step — always, signed or
  // not (owner decision 2026-09-19): the customer has just come back from the
  // agreement, and this is the page whose "I have signed" carries them on. A
  // rehydrated full-payment quote has nothing to sign and lands on Review.
  // Everyone else starts at the beginning.
  const [step, setStep] = useState<Step>(
    initialQuote ? (initialQuote.mode === "layaway" ? "sign" : 2) : 1,
  );
  const [addresses, setAddresses] = useState<HubAddress[]>(initialAddresses);
  const [addressId, setAddressId] = useState<string>(
    initialAddresses.find((a) => a.is_default)?.id ?? initialAddresses[0]?.id ?? "",
  );
  const [showNew, setShowNew] = useState(initialAddresses.length === 0);
  // Consent. Starts false and is never defaulted true anywhere.
  const [joinLoyalty, setJoinLoyalty] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("SELF");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [giftNote, setGiftNote] = useState("");
  // How this order is paid, and in what. Both are fixed the moment the quote is
  // taken: the Hub writes the order or plan in the settlement currency, and it
  // does not change currency afterwards.
  // LAYAWAY IS ENGLISH-ONLY (owner decision 2026-09-15) — one rule, in
  // lib/layaway-availability. `lang` is a prop refreshed by the server when the
  // toggle is used, but `mode` is client state that router.refresh() does NOT
  // reset: a shopper who picks layaway in English and then switches to Japanese
  // would otherwise still be in layaway mode with the toggle gone. Coerce back
  // to full when it is not offered, and the server refuses as the backstop.
  const layawayOk = layawayOffered(lang);
  // A rehydrated quote fixes the mode too: the quote was taken in it, and the
  // step above was chosen from it.
  const [mode, setMode] = useState<CheckoutMode>(layawayOk ? (initialQuote?.mode ?? initialMode) : "full");
  useEffect(() => { if (!layawayOk && mode === "layaway") { setMode("full"); setQuote(null); } }, [layawayOk, mode]);
  // Seeded from the rehydrated quote when there is one, so that if it later
  // expires the re-quote asks for the same plan the customer already signed for
  // rather than silently reverting to the defaults.
  const [settlement, setSettlement] = useState<SettlementCurrency>(initialQuote?.settlement_currency ?? "JPY");
  const [term, setTerm] = useState(initialQuote?.layaway?.term_months ?? 6);
  const [quote, setQuote] = useState<HubQuote | null>(initialQuote);
  /**
   * What the signing record says, as the SERVER read it. Never set from a
   * customer's assertion — pressing "I have signed" re-asks the server, it does
   * not set this directly. And this is not the gate: payLayawayAction checks
   * again before the plan exists, because anything a browser knows is a claim.
   */
  const [agreement, setAgreement] = useState<AgreementState>(initialAgreement);
  const [error, setError] = useState<string | null>(null);
  // The Hub's request id for the failure on screen. Shown as "Ref: …" so the
  // next "could not complete" is one log lookup away instead of a mystery.
  const [errorRef, setErrorRef] = useState<string | null>(null);

  const errorCopy = (code: string) =>
    code === "transfer_unavailable" ? t("checkout", "transferUnavailable")
    : code === "sold_out" ? t("checkout", "soldOut")
    : code === "expired" ? t("checkout", "expired")
    : code === "empty_cart" ? t("checkout", "emptyCart")
    : code === "address_required" ? t("checkout", "addressRequired")
    : code === "below_plan_minimum" ? t("checkout", "belowMinimum")
    : code === "currency_unsupported" ? t("checkout", "currencyUnsupported")
    : code === "rate_unavailable" ? t("checkout", "rateUnavailable")
    : code === TERM_NOT_LAUNCHED ? t("checkout", "termNotLaunchedHint")
    : code === LAYAWAY_UNAVAILABLE ? t("checkout", "layawayUnavailable")
    // Two codes, never one message: "you have not signed" and "we could not
    // check" need different next steps, and a customer who HAS signed must
    // never be told they have not.
    : code === AGREEMENT_REQUIRED ? t("checkout", "agreementRequired")
    : code === AGREEMENT_UNVERIFIED ? t("checkout", "agreementUnverified")
    : t("checkout", "failed");

  function showError(code: string, requestId?: string | null) {
    setError(errorCopy(code));
    // Only a server-side failure needs a reference; the others say what to do.
    setErrorRef(code === "failed" ? requestId ?? null : null);
  }
  function clearError() { setError(null); setErrorRef(null); }

  // The signing gate is not a numbered step, so while it is showing the stepper
  // keeps Delivery lit — the customer has not reached Review yet.
  const stepperAt: 1 | 2 | 3 = step === "sign" ? 1 : step;

  // The Hub's own term list once a quote exists; the configured months until
  // then. Never a hardcoded array of what the calculator used to offer.
  const termOptions: LayawayTerm[] = quote?.layaway?.allowed_terms ?? DEFAULT_TERMS;
  const plan = mode === "layaway" ? quote?.layaway ?? null : null;
  // RESERVE FIRST (Hub A2). Read off the QUOTE the Hub just priced, never a
  // flag on this side, so checkout changes at the same moment as the Hub's
  // switch. A reservation shows no bank details and no deadline (owner rule):
  // staff confirm the piece first, and the payment email follows.
  const reserving = quoteIsReservation(quote);
  // What this order will actually settle in: the customer's choice, for a full
  // payment and a layaway alike (owner decision 2026-09-25; yen by default).
  // Same value quoteInput() sends, kept in one place.
  const intendedCurrency: SettlementCurrency = settlement;
  // The currency the QUOTE was taken in, not the toggle's current position: the
  // figures on screen belong to the quote, and the toggle may have moved since.
  // A Hub deploy predating settlement currency omits the field and quotes in yen.
  const quoteCurrency: SettlementCurrency = quote === null ? intendedCurrency : quote.settlement_currency ?? "JPY";
  const money = (n: number) => formatMoney(n, quoteCurrency);

  // The summary figures AND the currency they are genuinely in, as one value.
  // Taking the symbol from the toggle and the number from the yen cart is what
  // showed a 679,980 yen piece as 679,980 pesos — plausible, and 2.4x too high,
  // at the moment the customer decides whether they can afford it.
  //
  // Before the quote exists the peso figures are PREVIEWED with the Hub's own
  // arithmetic — Math.round(jpy * jpy_php), the same expression the website
  // function uses for total_settlement — on the rate the page fetched. Shipping
  // is still the Hub's answer and stays a dash, exactly as it does for yen, so
  // this preview differs from the quote only by the shipping the quote adds.
  // The rate itself is never displayed (owner decision 2026-09-18). Without a
  // rate the figures stay dashes rather than guessing.
  const summary: {
    currency: SettlementCurrency;
    subtotal: number | null;
    shipping: number | null;
    total: number | null;
  } = quote !== null && quoteCurrency === intendedCurrency
    ? {
        currency: intendedCurrency,
        subtotal: quote.subtotal_settlement ?? quote.subtotal_jpy,
        shipping: quote.shipping_settlement ?? quote.shipping_jpy,
        total: quote.total_settlement ?? quote.total_jpy,
      }
    : intendedCurrency === "JPY"
      // Yen is the cart's own currency, so the cart's own figures already stand.
      ? { currency: "JPY", subtotal, shipping: null, total: subtotal }
      : jpyPhp !== null && Number.isFinite(jpyPhp) && jpyPhp > 0
        ? { currency: "PHP", subtotal: Math.round(subtotal * jpyPhp), shipping: null, total: Math.round(subtotal * jpyPhp) }
        : { currency: "PHP", subtotal: null, shipping: null, total: null };
  const summaryMoney = (n: number | null) => (n === null ? "\u2014" : formatMoney(n, summary.currency));

  const quoteInput = () => ({
    ship_to_address_id: addressId,
    order_type: orderType,
    recipient_name: orderType === "SELF" ? undefined : recipientName,
    recipient_phone: orderType === "SELF" ? undefined : recipientPhone,
    gift_note: orderType === "GIFT" ? giftNote : undefined,
    mode,
    term_months: term,
    settlement_currency: intendedCurrency,
  });

  function saveAddress(form: FormData) {
    clearError();
    const draft: HubAddress = {
      label: "home",
      recipient_name: String(form.get("recipient_name") ?? "").trim() || null,
      line1: String(form.get("line1") ?? "").trim(),
      line2: String(form.get("line2") ?? "").trim() || null,
      city: String(form.get("city") ?? "").trim() || null,
      region: String(form.get("region") ?? "").trim() || null,
      postal_code: String(form.get("postal_code") ?? "").trim() || null,
      country: String(form.get("country") ?? "JP").trim().toUpperCase() || "JP",
      phone: String(form.get("phone") ?? "").trim() || null,
    };
    start(async () => {
      const res = await saveAddressAction(addresses, draft);
      if (!res.ok) { showError(res.code, res.requestId); return; }
      setAddresses(res.data);
      setAddressId(res.data.find((a) => a.is_default)?.id ?? res.data[0]?.id ?? "");
      setShowNew(false);
    });
  }

  function toReview() {
    clearError();
    start(async () => {
      const res = await quoteAction(quoteInput());
      if (!res.ok) { showError(res.code, res.requestId); return; }
      setQuote(res.data);
      // A full-price order has no agreement to sign and goes straight to Review.
      if (mode !== "layaway") { setAgreement(null); setStep(2); return; }
      // The quote was created a moment ago, so nobody can have signed against
      // its id yet: there is nothing to look up. Go straight to the signing
      // step. (Until 2026-09-18 this asked the signing record here as well —
      // a second server round trip and an Apps Script call on every Continue,
      // whose answer could only ever be "not signed".) "I have signed" and
      // payLayawayAction still read the record themselves; this is not the gate.
      setAgreement({ signed: false, version: null, signed_at: null });
      setStep("sign");
    });
  }

  /**
   * "I have signed" — re-ask the server.
   *
   * The button does not assert anything; it re-reads the signing record. A
   * customer who presses it without signing stays exactly where they are, with
   * the reason on screen.
   */
  function recheckAgreement() {
    if (!quote) return;
    clearError();
    // Already read as signed by the server on this same page load (the ?quote=
    // return): nothing to ask again. Straight to Review. payLayawayAction still
    // verifies before the plan exists, so this shortcut moves a screen, not the
    // gate.
    if (agreement?.signed) { setStep(2); return; }
    start(async () => {
      const st = await agreementStatusAction(quote.quote_id);
      if (!st.ok) { showError(st.code, st.requestId); return; }
      setAgreement(st.data);
      if (st.data.signed) setStep(2);
      else showError(AGREEMENT_REQUIRED);
    });
  }

  function placeOrder() {
    if (!quote) return;
    clearError();
    start(async () => {
      // The Hub reads the mode off the quote, so the two answers differ: an
      // order id for a full payment, a plan id for layaway. Each lands on its
      // own confirmation.
      const res = mode === "layaway"
        ? await payLayawayAction(quote.quote_id)
        : await payAction(quote.quote_id);
      if (res.ok) {
        // ENROLMENT HAPPENS HERE AND NOWHERE EARLIER. The order or plan exists,
        // the stock is committed, and nothing below can undo it — which is what
        // makes "enrolment never fails the order" structural rather than
        // careful. The action never throws and its result is deliberately not
        // read: there is no failure the customer should be shown on a screen
        // that is telling them their order went through.
        //
        // The 2.5s race is for the CLIENT, not the server. The action's request
        // is already in flight and the server runs it to completion whether or
        // not this page is still listening, so capping the wait cannot lose an
        // enrolment — it only stops a slow Hub from holding a confirmation
        // screen hostage after the order is safely placed.
        if (joinLoyalty) {
          const country = addresses.find((a) => a.id === addressId)?.country ?? undefined;
          await Promise.race([
            enrolInLoyaltyAction(country),
            new Promise((resolve) => setTimeout(resolve, 2500)),
          ]);
        }
        router.push(mode === "layaway"
          ? `/account/layaway/${(res.data as { account_id: string }).account_id}?placed=1`
          : `/checkout/complete/${(res.data as { order_id: string }).order_id}`);
        return;
      }

      if (res.code === "expired") {
        // The quote aged out (30 minutes) or was already used. Price the same
        // basket again and land on Review with the fresh figures, saying why.
        const fresh = await quoteAction(quoteInput());
        if (fresh.ok) {
          setQuote(fresh.data);
          // A SIGNATURE BELONGS TO ONE QUOTE. It is keyed on the quote id, so a
          // fresh quote is a fresh session and the old signature does not carry
          // over — a signing detour longer than the quote's 30 minutes means
          // signing again. That is the honest outcome, and the customer is told
          // it here rather than meeting agreement_required at the last click.
          if (mode === "layaway") {
            const st = await agreementStatusAction(fresh.data.quote_id);
            const signed = st.ok && st.data.signed;
            setAgreement(st.ok ? st.data : null);
            setStep(signed ? 2 : "sign");
            setError(signed ? t("checkout", "expiredRequoted") : t("checkout", "expiredResign"));
            setErrorRef(null);
            return;
          }
          setStep(2);
          setError(t("checkout", "expiredRequoted"));
          setErrorRef(null);
        } else {
          setQuote(null);
          setStep(1);
          showError(fresh.code, fresh.requestId);
        }
        return;
      }
      if (res.code === AGREEMENT_REQUIRED || res.code === AGREEMENT_UNVERIFIED) {
        // The server refused at the gate. Back to it, with the reason — never a
        // dead end on the payment screen.
        if (res.code === AGREEMENT_REQUIRED) setAgreement({ signed: false, version: null, signed_at: null });
        setStep("sign");
        showError(res.code);
        return;
      }
      if (res.code === "sold_out") {
        // The piece is gone; the cart still lists it. Say so on the delivery
        // step, where the cart link is, rather than on a payment screen for
        // an order that can no longer exist.
        setQuote(null);
        setStep(1);
        showError(res.code);
        return;
      }
      // transfer_unavailable, signed_out, failed — stay put, show the reason,
      // and for a server failure the Hub's request id.
      showError(res.code, res.requestId);
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {([[1, t("checkout", "step1")], [2, t("checkout", "step2")], [3, t("checkout", "step3")]] as const).map(([n, label]) => (
            <li key={n} className={n === stepperAt ? "text-gold-dark" : "text-charcoal/70"}>
              <span className="font-display">{n}.</span> {label}
            </li>
          ))}
        </ol>

        {error && (
          <div role="alert" className={`mb-6 ${alertLight} p-4 text-sm`}>
            <p>{error}</p>
            {errorRef && (
              <p className="mt-2 font-mono text-xs text-charcoal/70">{t("checkout", "ref")}: {errorRef}</p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <fieldset>
              <legend className="font-display text-xl text-charcoal-deep">{t("checkout", "chooseAddress")}</legend>
              {addresses.length > 0 && (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {addresses.map((a, i) => (
                    <li key={a.id ?? i}>
                      <label className={`block cursor-pointer border p-4 text-sm ${addressId === a.id ? "border-gold-dark text-charcoal-deep" : "border-hairline text-charcoal/70"}`}>
                        <input
                          type="radio" name="address" className="sr-only"
                          checked={addressId === a.id}
                          onChange={() => setAddressId(a.id ?? "")}
                        />
                        <span className="block">{a.recipient_name ?? "—"}</span>
                        <span className="block">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</span>
                        <span className="block">{[a.city, a.region, a.postal_code].filter(Boolean).join(" ")}</span>
                        <span className="block text-charcoal/70">{a.country}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              {!showNew ? (
                <button type="button" onClick={() => setShowNew(true)} className="mt-4 text-sm text-gold-dark underline underline-offset-4">
                  {t("checkout", "newAddress")}
                </button>
              ) : (
                <form
                  className="mt-4 grid gap-3 border border-hairline p-4 sm:grid-cols-2"
                  action={saveAddress}
                >
                  <Field name="recipient_name" label={t("checkout", "recipientName")} />
                  <Field name="phone" label={t("checkout", "phone")} />
                  <Field name="line1" label={t("checkout", "line1")} required className="sm:col-span-2" />
                  <Field name="line2" label={t("checkout", "line2")} className="sm:col-span-2" />
                  <Field name="city" label={t("checkout", "city")} />
                  <Field name="region" label={t("checkout", "region")} />
                  <Field name="postal_code" label={t("checkout", "postal")} />
                  <Field name="country" label={t("checkout", "country")} defaultValue="JP" />
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={pending}>{t("checkout", "saveAddress")}</Button>
                  </div>
                </form>
              )}
            </fieldset>

            <fieldset>
              <legend className="font-display text-xl text-charcoal-deep">{t("checkout", "orderType")}</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type} type="button" onClick={() => setOrderType(type)}
                    className={`border px-4 py-2 text-sm ${orderType === type ? "border-gold-dark text-gold-dark" : "border-hairline text-charcoal/70"}`}
                  >
                    {type === "SELF" ? t("checkout", "self") : type === "GIFT" ? t("checkout", "gift") : t("checkout", "proxy")}
                  </button>
                ))}
              </div>
              {orderType !== "SELF" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-charcoal/70">
                    {t("checkout", "recipientName")}
                    <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className={`mt-1 w-full px-3 py-2 ${inputLight}`} />
                  </label>
                  <label className="text-sm text-charcoal/70">
                    {t("checkout", "recipientPhone")}
                    <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className={`mt-1 w-full px-3 py-2 ${inputLight}`} />
                  </label>
                  {orderType === "GIFT" && (
                    <label className="text-sm text-charcoal/70 sm:col-span-2">
                      {t("checkout", "giftNote")}
                      <textarea value={giftNote} onChange={(e) => setGiftNote(e.target.value)} rows={3} className={`mt-1 w-full px-3 py-2 ${inputLight}`} />
                    </label>
                  )}
                </div>
              )}
            </fieldset>

            {/* One way to pay where layaway is not offered, so there is nothing
                to choose between and the fieldset goes entirely. */}
            {layawayOk && (
            <fieldset>
              <legend className="font-display text-xl text-charcoal-deep">{t("checkout", "modeH")}</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(["full", "layaway"] as const).map((m) => (
                  <button
                    key={m} type="button" onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`border p-4 text-left text-sm ${mode === m ? "border-gold-dark text-charcoal-deep" : "border-hairline text-charcoal/70"}`}
                  >
                    <span className="block text-gold-dark">{m === "full" ? t("checkout", "modeFull") : t("checkout", "modeLayaway")}</span>
                    <span className="mt-1 block text-xs text-charcoal/70">
                      {m === "full" ? t("checkout", "modeFullNote") : t("checkout", "modeLayawayNote")}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            )}

            {/* Yen or pesos, for a full payment and a layaway alike (owner
                decision 2026-09-25), on both languages. The note follows the
                mode: a full payment's never names a plan, so the Japanese site,
                which offers full payment only, carries no layaway wording. */}
            <fieldset>
              <legend className="font-display text-xl text-charcoal-deep">{t("checkout", "settlementH")}</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["JPY", "PHP"] as const).map((cur) => (
                  <button
                    key={cur} type="button" onClick={() => setSettlement(cur)}
                    aria-pressed={settlement === cur}
                    className={`border px-4 py-2 text-sm ${settlement === cur ? "border-orange bg-orange text-charcoal-deep" : "border-hairline text-charcoal/70"}`}
                  >
                    {cur === "JPY" ? t("checkout", "settlementJpy") : t("checkout", "settlementPhp")}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-charcoal/70">
                {mode === "layaway" ? t("checkout", "settlementNote") : t("checkout", "settlementOrderNote")}
              </p>
            </fieldset>

            {/* The term belongs to a plan, not to a one-off payment. */}
            {mode === "layaway" && (
              <>
                <fieldset>
                  <legend className="font-display text-xl text-charcoal-deep">{t("checkout", "termH")}</legend>
                  {/* Before the first quote there is no eligibility to show, so
                      every configured term is offered and the Hub decides. After
                      it, the terms this basket cannot reach are disabled with
                      their minimum named.

                      A NOT-LAUNCHED TERM IS SHOWN AND DISABLED, never hidden
                      (owner decision 2026-09-16): a 12-month plan exists in the
                      Hub and is not yet open to web customers, and the customer
                      should be able to see that rather than wonder why the list
                      stops at eight. Its reason is stated in its own words —
                      "Coming soon", not the basket-too-small message — because
                      the two are fixed by different things and only one of them
                      is the customer's to fix. */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {termOptions.map((tm) => {
                      const launched = termLaunched(tm.months);
                      const pickable = launched && tm.eligible;
                      return (
                        <button
                          key={tm.months} type="button" disabled={!pickable}
                          onClick={() => setTerm(tm.months)}
                          aria-pressed={term === tm.months}
                          title={launched ? (tm.eligible ? undefined : t("checkout", "termUnavailable")) : t("checkout", "termNotLaunchedHint")}
                          className={`border px-4 py-2 text-left text-sm disabled:opacity-40 ${term === tm.months && pickable ? "border-gold-dark text-gold-dark" : "border-hairline text-charcoal/70"}`}
                        >
                          <span className="block">{t("checkout", "termMonths", { n: String(tm.months) })}</span>
                          {!launched ? (
                            <span className="block text-[11px] text-charcoal/70">{t("checkout", "termNotLaunched")}</span>
                          ) : tm.min_amount > 0 ? (
                            <span className="block text-[11px] text-charcoal/70">
                              {t("checkout", "termMin", { amount: formatMoney(tm.min_amount, settlement) })}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            )}

            <Button disabled={pending || !addressId} onClick={toReview}>{t("checkout", "continue")}</Button>
          </div>
        )}

        {/* THE GATE. No plan is created until the agreement is signed (owner
            decision), and this is the path to it — not the enforcement. The
            enforcement is payLayawayAction, which re-checks server-side and
            refuses, so a customer who skips this screen still cannot get a
            plan. The agreement is one document written in Tagalog with English;
            there is no language to pick. */}
        {step === "sign" && quote && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-charcoal-deep">{t("checkout", "agreementHeading")}</h2>
            <div className="border border-hairline p-5 text-sm text-charcoal">
              <p>{t("checkout", "agreementIntro")}</p>
              <p className="mt-3 text-xs text-charcoal/70">{t("checkout", "agreementLanguageNote")}</p>
              {/* A NEW TAB, deliberately. The checkout keeps its state — step,
                  term, currency and quote are React state and a same-tab
                  navigation loses all of it. The ?quote= path exists for the
                  customer who leaves anyway; this is how most never need it. */}
              <a
                href={signUrl(quote.quote_id, quote.invoice_number ?? null)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block border border-gold-dark px-5 py-2 text-sm text-gold-dark hover:bg-gold-dark/10"
              >
                {t("checkout", "agreementOpen")}
              </a>
              <p className="mt-3 text-xs text-charcoal/70">{t("checkout", "agreementNewTabNote")}</p>
            </div>
            {/* What the server already read from the signing record on the way
                back in — shown here so the customer sees the signature landed
                before pressing on; "I have signed" then goes straight to Review. */}
            {agreement?.signed && (
              <p className="border border-hairline bg-white px-4 py-3 text-sm text-charcoal">
                {t("checkout", "agreementSigned", {
                  version: agreement.version ?? "",
                  date: (agreement.signed_at ?? "").slice(0, 10),
                })}
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={pending}>{t("checkout", "back")}</Button>
              <Button onClick={recheckAgreement} disabled={pending}>
                {pending ? t("checkout", "agreementChecking") : t("checkout", "agreementDone")}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && quote && (
          <div className="space-y-6">
            <ul className="rule-grid grid gap-px">
              {quote.items.map((line) => (
                <li key={line.variant_id} className="flex items-baseline justify-between gap-4 bg-white p-4 text-sm">
                  <span>{quoteItemName(line, lang)} × {line.qty}</span>
                  {/* Lines are yen, the price of record. Beside a peso total
                      they would put two currencies on one screen, so a peso
                      quote lists the pieces without a price (owner decision D1). */}
                  {quoteCurrency === "JPY" && (
                    <span className="font-display text-lg text-gold-dark">{formatMoney(line.line_total_jpy)}</span>
                  )}
                </li>
              ))}
            </ul>
            {quote.requires_manual_quote && (
              <p className="border border-gold-dark px-4 py-3 text-sm text-gold-dark">{t("checkout", "manualQuote")}</p>
            )}
            {/* What the server read from the signing record — the version they
                actually signed and when, the same two values the plan will
                store. Shown rather than assumed, so a wrong version is visible
                before the plan exists. */}
            {mode === "layaway" && agreement?.signed && (
              <p className="border border-hairline bg-white px-4 py-3 text-sm text-charcoal">
                {t("checkout", "agreementSigned", {
                  version: agreement.version ?? "",
                  date: (agreement.signed_at ?? "").slice(0, 10),
                })}
              </p>
            )}
            {/* The plan exactly as the Hub computed it, in the currency it will
                be written in. Nothing here is recalculated on this side. */}
            {plan && (
              <div className="border border-hairline p-5">
                <dl className="grid gap-4 sm:grid-cols-3">
                  <PlanFigure k={t("checkout", "layawayDeposit")} v={money(plan.deposit)} />
                  <PlanFigure k={t("checkout", "layawayMonthly")} v={money(plan.monthly)} />
                  <PlanFigure k={t("checkout", "layawayLast")} v={money(plan.last_month)} />
                </dl>
                <h3 className="mt-6 text-xs uppercase tracking-[0.14em] text-charcoal/70">{t("checkout", "layawaySchedule")}</h3>
                <ul className="mt-3 space-y-1 text-sm text-charcoal">
                  {plan.schedule.map((row) => (
                    <li key={row.installment_number} className="flex justify-between gap-4">
                      <span>{row.due_date}</span>
                      <span className="text-charcoal-deep">{money(row.amount)}</span>
                    </li>
                  ))}
                </ul>
                {reserving ? (
                  <>
                    <p className="mt-4 text-xs text-charcoal/70">{t("checkout", "layawayScheduleProvisional")}</p>
                    <p className="mt-2 text-xs text-charcoal/70">{t("checkout", "layawayReserveNote")}</p>
                  </>
                ) : (
                  /* The number the Hub will store — 24 on a first order, 72
                     after that — or no number at all when it sent none. */
                  <p className="mt-4 text-xs text-charcoal/70">
                    {typeof quote.deposit_deadline_hours === "number"
                      ? t("checkout", "layawayDepositWithin", { hours: String(quote.deposit_deadline_hours) }) + (lang === "ja" ? "" : " ")
                      : ""}
                    {t("checkout", "layawayDeadlineNote")}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={pending}>{t("checkout", "back")}</Button>
              <Button onClick={() => setStep(3)} disabled={pending || quote.requires_manual_quote}>{t("checkout", "continue")}</Button>
            </div>
          </div>
        )}

        {step === 3 && quote && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-charcoal-deep">{t("checkout", "payHeading")}</h2>
            {/* A region with no complete, active method in the Hub is not
                offered transfer at all. Showing the method and failing at the
                last click — or worse, taking an order we cannot be paid for —
                is the outcome this prevents. The Hub enforces the same rule
                server-side; this is the courteous half of it. */}
            {quote.transfer_available && reserving ? (
              /* A reservation: how they will pay, and that the details come
                 after we confirm the piece. No accounts, no deadline — the Hub
                 sends no methods in this mode, and this renders none. */
              <div className="border border-hairline bg-white p-4 text-sm text-charcoal">
                <p>{t("checkout", "transferOnly")}</p>
                <p className="mt-2">{t("checkout", "reserveExplain")}</p>
              </div>
            ) : quote.transfer_available ? (
              <>
                <div className="border border-hairline bg-white p-4 text-sm text-charcoal">
                  <p>{t("checkout", "transferOnly")}</p>
                  <p className="mt-2">{t("checkout", "transferPreview")}</p>
                  {/* The number the Hub will actually store, not a constant.
                      Omitted rather than guessed when the Hub sent none: an
                      unnumbered sentence is true, and "72 hours" was not. */}
                  <p className="mt-2">
                    {typeof quote.deposit_deadline_hours === "number"
                      ? t("checkout", "deadlineWithin", { hours: String(quote.deposit_deadline_hours) }) + (lang === "ja" ? "" : " ")
                      : ""}
                    {t("checkout", "deadlineNote")}
                  </p>
                </div>
                {/* The Hub sends only this destination's region, so these are
                    the accounts this customer will actually pay into — and the
                    other region's are not in the payload to leak. */}
                <TransferDetails methods={quote.transfer_methods} lang={lang} />
              </>
            ) : (
              <p role="alert" className={`${alertLight} px-4 py-3 text-sm`}>
                {t("checkout", "transferUnavailable")}
              </p>
            )}
            {/* Offered only to a signed-in non-member, and never pre-ticked:
                this is consent. What they earn is on the label; what we do
                with the details they just typed is in the note. The programme
                itself is explained at /loyalty rather than here. */}
            {offerLoyalty && (
              <div className="mb-2 border border-hairline bg-white p-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    checked={joinLoyalty}
                    onChange={(e) => setJoinLoyalty(e.target.checked)}
                    disabled={pending}
                    className="mt-1 h-4 w-4 shrink-0 accent-gold"
                  />
                  <span>{t("checkout", "joinLoyalty")}</span>
                </label>
                <p className="mt-2 pl-7 text-xs text-charcoal/70">
                  {t("checkout", "joinLoyaltyNote")}{" "}
                  <Link href="/loyalty" className="underline underline-offset-4 hover:text-gold-dark">
                    {t("checkout", "joinLoyaltyLink")}
                  </Link>
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={pending}>{t("checkout", "back")}</Button>
              <Button onClick={placeOrder} disabled={pending || !quote.transfer_available}>
                {reserving
                  ? (pending ? t("checkout", "reserving") : t("checkout", "reserveNow"))
                  : mode === "layaway"
                  ? (pending ? t("checkout", "reserving") : t("checkout", "reservePiece"))
                  : (pending ? t("checkout", "placing") : t("checkout", "placeOrder"))}
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside className="h-fit border border-hairline bg-white p-6">
        <ul className="space-y-2 text-sm text-charcoal">
          {items.map((i) => (
            <li key={i.variant_id} className="flex justify-between gap-4">
              <span>{cartItemName(i, lang)}{i.qty > 1 ? ` × ${i.qty}` : ""}</span>
              {/* Yen cart lines only beside yen totals (owner decision D1). */}
              {summary.currency === "JPY" && <span>{formatMoney(i.line_total_jpy)}</span>}
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-hairline pt-4 text-sm">
          <Line k={t("checkout", "subtotal")} v={summaryMoney(summary.subtotal)} />
          <Line
            k={t("checkout", "shipping")}
            v={summary.shipping === 0 ? t("checkout", "free") : summaryMoney(summary.shipping)}
          />
          {plan && <Line k={t("checkout", "layawayDeposit")} v={money(plan.deposit)} />}
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
          <span className="text-charcoal/70">{t("checkout", "total")}</span>
          <span className="font-display text-2xl text-gold-dark">{summaryMoney(summary.total)}</span>
        </div>
        <Link href="/cart" className="mt-4 inline-block text-xs text-charcoal/70 underline underline-offset-4">
          {t("cart", "h1")}
        </Link>
      </aside>
    </div>
  );
}

function Field({ name, label, required, defaultValue, className }: {
  name: string; label: string; required?: boolean; defaultValue?: string; className?: string;
}) {
  return (
    <label className={`text-sm ${labelLight} ${className ?? ""}`}>
      {label}{required && <span className="text-gold-dark"> *</span>}
      <input name={name} required={required} defaultValue={defaultValue} className={`mt-1 w-full px-3 py-2 ${inputLight}`} />
    </label>
  );
}

function PlanFigure({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-charcoal/70">{k}</dt>
      <dd className="mt-1 font-display text-2xl text-gold-dark">{v}</dd>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-charcoal/70">{k}</dt>
      <dd className="text-charcoal-deep">{v}</dd>
    </div>
  );
}
