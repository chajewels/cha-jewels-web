"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { ChevronDown, ExternalLink, Info, Lock, Plus, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { cartItemName, quoteItemName } from "@/lib/catalog-i18n";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { agreementStatusAction, checkoutChoiceAction, payAction, payLayawayAction, pesoEstimateAction, quoteAction, saveAddressAction } from "@/lib/checkout-actions";
import { checkoutSummary, type PesoEstimateState, amountToPayAfterPoints } from "@/lib/checkout-summary";
import { enrolInLoyaltyAction } from "@/lib/loyalty-actions";
import type { CartItem } from "@/lib/cart";
import type { CheckoutMethod, CheckoutMode, HubAddress, HubCheckoutChoice, HubPaymentOption, HubQuote, LayawayTerm, OrderType, SettlementCurrency } from "@/lib/types";
import { LAYAWAY_UNAVAILABLE, TERM_NOT_LAUNCHED, layawayOffered, termLaunched } from "@/lib/layaway-availability";
import { AGREEMENT_LANG, AGREEMENT_REQUIRED, AGREEMENT_UNVERIFIED } from "@/lib/layaway-agreement";
import { alertLight, inputLight } from "@/lib/form-classes";
import { siteDay } from "@/lib/site-time";
import { CommerceStyle, Notice, OrderSlab, PieceWell, Stepper, StickyAct } from "@/components/commerce/commerce-ui";
import { draftCompletePath, isDraftPayResult } from "@/lib/drafts";
import { initialCheckoutState, type CheckoutStep } from "@/lib/checkout-initial-step";
import { CardMarks, PaidyMark } from "@/components/commerce/card-marks";
import { addressLines } from "@/lib/address-format";
import { cancellationPolicyHref } from "@/lib/cancellation-policy";
import { paidy612Active } from "@/lib/paidy-widget";
import { methodWhyKey } from "@/lib/checkout-method-why";

/**
 * THE FOUR STEPS (build step 3, D3-1; comp page-comps/cart-checkout):
 * 1 Your details (name and email as the Hub holds them, the delivery address)
 * → 2 Delivery (order type, when it ships) → 3 Payment (EN: full or layaway;
 * yen or pesos; how you will pay) → 4 Review, where the piece is reserved.
 * The quote is taken on leaving Payment, with exactly the inputs it always
 * had; only the layout and the order of the screens moved.
 *
 * "sign" is not a numbered step and is not in the stepper.
 *
 * It is a GATE, not a stage of ordering: it appears for layaway only, between
 * Payment and Review, and a full-price order never meets it. While it shows,
 * the stepper keeps Payment lit — the customer has not reached Review yet.
 */
type Step = CheckoutStep;

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

export function CheckoutFlow({ lang, items, subtotal, initialAddresses, customer, aside = null, initialMode = "full", offerLoyalty = false, initialQuote = null, initialAgreement = null }: {
  lang: Lang; items: CartItem[]; subtotal: number; initialAddresses: HubAddress[];
  /**
   * The name and email the Hub holds for this customer (GET /me), shown read
   * only on "Your details" (D3-6): the quote has no name or email field, so an
   * edit typed here would go nowhere. Either may be null.
   */
  customer: { name: string | null; email: string | null };
  /** Rendered under the summary slab: the trust rows, from the server (D3-17). */
  aside?: ReactNode;
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

  // LAYAWAY IS ENGLISH-ONLY (owner decision 2026-09-15) — one rule, in
  // lib/layaway-availability.
  const layawayOk = layawayOffered(lang);
  // Where a ?quote= return opens (lib/checkout-initial-step): a layaway quote on
  // the signing step, a full-payment quote on Review, nothing on Step 1 — and a
  // layaway quote brought back to the Japanese site is dropped with its
  // signature, so it opens like a fresh Japanese checkout. Everything below
  // seeds from `initial`, never from the raw props.
  const initial = initialCheckoutState(initialQuote, initialAgreement, layawayOk);
  const [step, setStep] = useState<Step>(initial.step);
  const [addresses, setAddresses] = useState<HubAddress[]>(initialAddresses);
  const [addressId, setAddressId] = useState<string>(
    initialAddresses.find((a) => a.is_default)?.id ?? initialAddresses[0]?.id ?? "",
  );
  const [showNew, setShowNew] = useState(initialAddresses.length === 0);
  // Consent. Starts false and is never defaulted true anywhere.
  const [joinLoyalty, setJoinLoyalty] = useState(false);
  // Consent tick box (owner 2026-10-10): Privacy Policy + Terms of Service +
  // Cancellation policy. Unticked by default; the order cannot be placed
  // until she ticks it.
  const [consented, setConsented] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("SELF");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [giftNote, setGiftNote] = useState("");
  // How this order is paid, and in what. Both are fixed the moment the quote is
  // taken: the Hub writes the order or plan in the settlement currency, and it
  // does not change currency afterwards.
  // `lang` is a prop refreshed by the server when the toggle is used, but
  // `mode` is client state that router.refresh() does NOT reset: a shopper who
  // picks layaway in English and then switches to Japanese would otherwise
  // still be in layaway mode with the toggle gone. Coerce back to full when it
  // is not offered, and the server refuses as the backstop.
  // A rehydrated quote fixes the mode too: the quote was taken in it, and the
  // step above was chosen from it.
  const [mode, setMode] = useState<CheckoutMode>(layawayOk ? (initial.quote?.mode ?? initialMode) : "full");
  useEffect(() => { if (!layawayOk && mode === "layaway") { setMode("full"); setQuote(null); } }, [layawayOk, mode]);
  // Seeded from the rehydrated quote when there is one, so that if it later
  // expires the re-quote asks for the same plan the customer already signed for
  // rather than silently reverting to the defaults.
  const [settlement, setSettlement] = useState<SettlementCurrency>(initial.quote?.settlement_currency ?? "JPY");
  const [term, setTerm] = useState(initial.quote?.layaway?.term_months ?? 6);
  const [quote, setQuote] = useState<HubQuote | null>(initial.quote);
  /**
   * PAYMENT CHOICE + POINTS (owner C1–C7, 2026-10-05), chosen on Review. The
   * options, the points figures and the totals after points are the Hub's
   * (`choice`, re-read on every change through checkoutChoiceAction); this
   * side only remembers which radio is on and what was typed.
   */
  const [method, setMethod] = useState<CheckoutMethod>(initial.quote?.payment_method ?? "transfer");
  const [choice, setChoice] = useState<HubCheckoutChoice | null>(choiceOf(initial.quote));
  const [usePoints, setUsePoints] = useState((initial.quote?.points?.chosen ?? 0) > 0);
  const [pointsText, setPointsText] = useState(initial.quote?.points?.chosen ? String(initial.quote.points.chosen) : "");
  const [choiceError, setChoiceError] = useState<string | null>(null);
  // A new quote (Review, or a re-quote after it aged out) brings its own
  // options and no points chosen: start the panel again from the Hub's answer.
  const lastQuoteId = useRef<string | null>(initial.quote?.quote_id ?? null);
  useEffect(() => {
    if (!quote || quote.quote_id === lastQuoteId.current) return;
    lastQuoteId.current = quote.quote_id;
    const next = choiceOf(quote);
    setChoice(next);
    setUsePoints(false);
    setPointsText("");
    setChoiceError(null);
    setMethod((m) => (next && !next.payment_options.some((o) => o.method === m && o.offered) ? "transfer" : m));
  }, [quote]);
  /**
   * What the signing record says, as the SERVER read it. Never set from a
   * customer's assertion — pressing "I have signed" re-asks the server, it does
   * not set this directly. And this is not the gate: payLayawayAction checks
   * again before the plan exists, because anything a browser knows is a claim.
   */
  const [agreement, setAgreement] = useState<AgreementState>(initial.agreement);
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
    : code === "manual_quote" ? t("checkout", "manualQuote")
    : code === TERM_NOT_LAUNCHED ? t("checkout", "termNotLaunchedHint")
    : code === LAYAWAY_UNAVAILABLE ? t("checkout", "layawayUnavailable")
    // Two codes, never one message: "you have not signed" and "we could not
    // check" need different next steps, and a customer who HAS signed must
    // never be told they have not.
    : code === AGREEMENT_REQUIRED ? t("checkout", "agreementRequired")
    : code === AGREEMENT_UNVERIFIED ? t("checkout", "agreementUnverified")
    : code === "method_unavailable" ? t("checkout", "methodUnavailable")
    : code === "points_unavailable" ? t("checkout", "pointsUnavailable")
    : t("checkout", "failed");

  function showError(code: string, requestId?: string | null) {
    setError(errorCopy(code));
    // Only a server-side failure needs a reference; the others say what to do.
    setErrorRef(code === "failed" ? requestId ?? null : null);
  }
  function clearError() { setError(null); setErrorRef(null); }

  // The signing gate is not a numbered step, so while it is showing the stepper
  // keeps Payment lit — the customer has not reached Review yet.
  const stepperAt: 1 | 2 | 3 | 4 = step === "sign" ? 3 : step;

  // The Hub's own term list once a quote exists; the configured months until
  // then. Never a hardcoded array of what the calculator used to offer.
  const termOptions: LayawayTerm[] = quote?.layaway?.allowed_terms ?? DEFAULT_TERMS;
  const plan = mode === "layaway" ? quote?.layaway ?? null : null;
  // RESERVE FIRST, ALWAYS (Hub website orders PR 10, 2026-10-01; owner D3).
  // Every checkout is a draft staff confirm: no bank details and no deadline
  // on this screen (owner rule), figures provisional until they confirm, and
  // the payment email follows. The Hub's reserve-first switch is retired, so
  // this no longer reads a flag off the quote.
  const reserving = true;
  // No published rate for this destination: shipping is added when we confirm.
  const shippingLater = quote?.shipping_at_confirmation === true;
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
  // EVERY MONEY FIGURE A CUSTOMER SEES COMES FROM THE HUB (owner rule): the
  // browser never converts. Before a peso quote exists the summary shows the
  // Hub's own peso estimate for the basket (pesoEstimateAction), labelled as an
  // estimate with the yen beside it; the quote then replaces it exactly. The
  // rule is lib/checkout-summary.ts, unit-tested.
  const [peso, setPeso] = useState<PesoEstimateState>({ status: "idle" });
  const needsPesoEstimate = intendedCurrency === "PHP" && !(quote !== null && quoteCurrency === "PHP");
  // A plan's deposit and monthly depend on the term; a full payment's total does not.
  const pesoTerm = mode === "layaway" ? term : 0;
  useEffect(() => {
    if (!needsPesoEstimate) return;
    let live = true;
    setPeso({ status: "loading" });
    pesoEstimateAction({ mode, term_months: pesoTerm || 6 }).then(
      (res) => { if (live) setPeso(res.ok ? { status: "ok", estimate: res.data } : { status: "unavailable" }); },
      () => { if (live) setPeso({ status: "unavailable" }); },
    );
    return () => { live = false; };
  }, [needsPesoEstimate, mode, pesoTerm, subtotal]);
  const summary = checkoutSummary({ quote, intended: intendedCurrency, subtotal, mode, peso });
  const summaryMoney = (n: number | null) => {
    if (n === null) return "\u2014";
    const f = formatMoney(n, summary.currency);
    return summary.estimate ? t("checkout", "pesoApprox", { amount: f }) : f;
  };

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
      if (mode !== "layaway") { setAgreement(null); setStep(4); return; }
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
    if (agreement?.signed) { setStep(4); return; }
    start(async () => {
      const st = await agreementStatusAction(quote.quote_id);
      if (!st.ok) { showError(st.code, st.requestId); return; }
      setAgreement(st.data);
      if (st.data.signed) setStep(4);
      else showError(AGREEMENT_REQUIRED);
    });
  }

  function placeOrder() {
    if (!quote) return;
    clearError();
    // Defence in depth for the Japanese site: never send a layaway quote when
    // layaway is not offered in this language, whatever state got us here —
    // with `mode` coerced to full it would otherwise go to payAction, which
    // does not look at the quote's mode. The generic failure, no new wording.
    if (!layawayOk && (mode === "layaway" || quote.mode === "layaway")) {
      showError("failed");
      return;
    }
    start(async () => {
      // The Hub reads the mode off the quote, so the two answers differ: an
      // order id for a full payment, a plan id for layaway. Each lands on its
      // own confirmation.
      // The Hub's confirmed figure, never the typed one: what the panel showed.
      const points = usePoints ? choice?.points.chosen ?? 0 : 0;
      const res = mode === "layaway"
        ? await payLayawayAction(quote.quote_id, { points })
        : await payAction(quote.quote_id, { method, points });
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
        // Draft mode (Hub PR 6): a draft id, never an order or plan id — the
        // draft page, which moves on to the real order once staff confirm.
        if (isDraftPayResult(res.data)) {
          router.push(draftCompletePath(res.data.draft_id));
          return;
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
            setStep(signed ? 4 : "sign");
            setError(signed ? t("checkout", "expiredRequoted") : t("checkout", "expiredResign"));
            setErrorRef(null);
            return;
          }
          setStep(4);
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

  /** Store a choice on the quote; the Hub answers the figures (C1–C7). */
  function applyChoice(nextMethod: CheckoutMethod, nextPoints: number) {
    if (!quote) return;
    setChoiceError(null);
    start(async () => {
      const res = await checkoutChoiceAction(quote.quote_id, { method: nextMethod, points: nextPoints });
      if (res.ok) { setChoice(res.data); return; }
      if (res.code === "expired") { showError("expired"); return; }
      setChoiceError(res.code === "method_unavailable" ? t("checkout", "methodUnavailable")
        : res.code === "points_unavailable" ? t("checkout", "pointsUnavailable")
        : t("checkout", "choiceFailed"));
    });
  }
  function pickMethod(m: CheckoutMethod) {
    setMethod(m);
    applyChoice(m, usePoints ? choice?.points.chosen ?? 0 : 0);
  }
  function togglePoints(on: boolean) {
    setUsePoints(on);
    if (!on) { setPointsText(""); applyChoice(method, 0); }
  }
  function applyPoints(raw: string) {
    const max = choice?.points.max_points ?? 0;
    const n = Number(raw.trim());
    if (!Number.isInteger(n) || n < 0 || n > max) {
      setChoiceError(t("checkout", "pointsInvalid", { points: max.toLocaleString("en-US") }));
      // The box shows what is APPLIED, never a refused number beside it.
      setPointsText(choice?.points.chosen ? String(choice.points.chosen) : "");
      return;
    }
    applyChoice(method, n);
  }
  const optionWhy = (o: HubPaymentOption) => t("checkout", methodWhyKey(o));
  const methodName = (m: CheckoutMethod) => t("checkout", m === "paidy" ? "methodPaidy" : m === "card" ? "methodCard" : m === "cod" ? "methodCod" : "methodTransfer");
  const methodNote = (m: CheckoutMethod) => t("checkout", m === "paidy" ? (paidy612Active() ? "methodPaidyNote612" : "methodPaidyNote") : m === "card" ? "methodCardNote" : m === "cod" ? "methodCodNote" : "methodTransferNote");
  const pointsWhy = (reason: string | null) =>
    reason === "not_enrolled" ? t("checkout", "pointsWhyNotEnrolled")
    : reason === "no_points" ? t("checkout", "pointsWhyNoPoints")
    : reason === "loyalty_off" ? t("checkout", "pointsWhyOff")
    : t("checkout", "pointsWhyNone");
  // An older Hub sends no options: transfer only, as before.
  const methodOffered = choice
    ? choice.payment_options.some((o) => o.method === method && o.offered)
    : method === "transfer" && !!quote?.transfer_available;
  const pointsChosen = usePoints ? choice?.points.chosen ?? 0 : 0;

  // ── Layout helpers ─────────────────────────────────────────────────────────
  const selectedAddress = addresses.find((a) => a.id === addressId) ?? null;
  const orderTypeLabel = (type: OrderType) => type === "SELF" ? t("checkout", "self") : type === "GIFT" ? t("checkout", "gift") : t("checkout", "proxy");
  const payLabel = mode === "layaway"
    ? `${t("checkout", "modeLayaway")} · ${t("checkout", "termMonths", { n: String(term) })} · ${settlement === "PHP" ? t("checkout", "settlementPhp") : t("checkout", "settlementJpy")}`
    : `${t("checkout", "modeFull")} · ${settlement === "PHP" ? t("checkout", "settlementPhp") : t("checkout", "settlementJpy")}`;
  const steps = [t("checkout", "stepDetails"), t("checkout", "stepDelivery"), t("checkout", "stepPayment"), t("checkout", "stepReview")];

  // The step's ONE orange action. Rendered in the flow from `lg` up and in the
  // phone/tablet sticky bar below it (D3-5) — the same button, never two.
  const primary: { label: string; onClick: () => void; disabled: boolean } | null =
    step === 1 ? { label: t("checkout", "continueDelivery"), onClick: () => { clearError(); setStep(2); }, disabled: pending || !addressId }
    : step === 2 ? { label: t("checkout", "continuePayment"), onClick: () => { clearError(); setStep(3); }, disabled: pending || !addressId }
    : step === 3 ? { label: t("checkout", "continueReview"), onClick: toReview, disabled: pending || !addressId }
    : step === "sign" && quote ? { label: pending ? t("checkout", "agreementChecking") : t("checkout", "agreementDone"), onClick: recheckAgreement, disabled: pending }
    : step === 4 && quote ? {
        // A full payment says "Place order" (checkout.placeOrder, EN + JA);
        // only a layaway (English only) says "Reserve this piece" (owner 2026-10-10).
        label: mode === "layaway"
          ? (pending ? t("checkout", "reserving") : t("checkout", reserving ? "reserveNow" : "reservePiece"))
          : (pending ? t("checkout", "placing") : t("checkout", "placeOrder")),
        onClick: placeOrder,
        disabled: pending || !consented || !methodOffered || quote.requires_manual_quote,
      }
    : null;
  const back: { label: string; to: Step | "cart" } | null =
    step === 1 ? { label: t("checkout", "backToCart"), to: "cart" }
    : step === 2 ? { label: t("checkout", "back"), to: 1 }
    : step === 3 ? { label: t("checkout", "back"), to: 2 }
    : step === "sign" ? { label: t("checkout", "back"), to: 3 }
    : { label: t("checkout", "back"), to: 3 };

  // A new screen starts at its top — on a phone the button that moved the
  // customer on sits at the bottom of the screen, and the next step's first
  // field would otherwise be somewhere above. Not on first paint.
  const topRef = useRef<HTMLDivElement>(null);
  const firstPaint = useRef(true);
  useEffect(() => {
    if (firstPaint.current) { firstPaint.current = false; return; }
    topRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [step]);
  // An error raised from the sticky bar must be seen, not left above the fold.
  const errorRef2 = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error) errorRef2.current?.scrollIntoView({ block: "center", behavior: "auto" }); }, [error]);

  const quoteShown = quote !== null && quoteCurrency === summary.currency;
  const shippingValue = shippingLater
    ? t("checkout", "shippingLaterShort")
    : !quoteShown || summary.shipping === null ? t("cart", "shippingCalc")
    : summary.shipping === 0 ? t("checkout", "free") : summaryMoney(summary.shipping);
  const totalLabel = !quoteShown ? t("checkout", "cartTotal") : t("checkout", shippingLater ? "totalBeforeShipping" : "total");
  // Points chosen on a full payment: the headline is what she PAYS (F1).
  // Cash on delivery chosen: the Hub's COD fee (already in total_after_points).
  const codFee = method === "cod" && choice?.payment_method === "cod" ? choice.totals.cod_fee ?? 0 : 0;
  const toPay = amountToPayAfterPoints({ mode, quoteShown, pointsChosen, totalAfterPoints: choice?.totals.total_after_points ?? null, codFee });
  const headline = toPay !== null ? money(toPay) : summaryMoney(summary.total);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const countLabel = count === 1 ? t("cart", "pieceOne") : t("cart", "pieces", { n: String(count) });

  return (
    <>
      <CommerceStyle />
      {/* Phone and tablet: the order at a glance, under the header (comp).
          It jumps to the full summary below the steps. */}
      <a href="#order-summary" className="band-dark flex min-h-14 items-center justify-between gap-4 bg-charcoal-deep px-4 text-sm text-chalk lg:hidden">
        <span>{t("cart", "summaryH")} · {countLabel}<span className="sr-only"> — {t("checkout", "seeSummary")}</span></span>
        <b className="cj-fig flex items-center gap-1.5 font-display text-[20px] font-normal text-gold-pale">
          {headline}<ChevronDown aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
        </b>
      </a>
      <div ref={topRef} className="wrap scroll-mt-24 pt-6 sm:pt-12">
        <div className="mb-6 sm:mb-8">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark before:h-px before:w-8 before:bg-gold-dark">{t("checkout", mode === "layaway" ? "eyebrow" : "eyebrowOrder")}</p>
          <h1 className="mt-2.5 text-[clamp(34px,4.4vw,56px)]">{t("checkout", "h1")}</h1>
        </div>
        <Stepper steps={steps} current={stepperAt} label={t("checkout", "stepsLabel")} stepOf={(n, label) => t("checkout", "stepOf", { n: String(n), label })} />

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            {error && (
              <div ref={errorRef2} role="alert" className={`mb-6 ${alertLight} p-4 text-sm`}>
                <p>{error}</p>
                {errorRef && (
                  <p className="mt-2 font-mono text-xs text-charcoal/70">{t("checkout", "ref")}: {errorRef}</p>
                )}
              </div>
            )}

            {step === 1 && (
              <section className="border border-hairline bg-white p-5 sm:p-7">
                <h2 className={SEC}>{t("checkout", "stepDetails")}</h2>
                <dl className="grid gap-x-5 gap-y-2.5 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
                  <dt className="text-charcoal/75">{t("account", "name")}</dt><dd className="m-0 break-words text-charcoal-deep">{customer.name ?? "—"}</dd>
                  <dt className="text-charcoal/75">{t("account", "email")}</dt><dd className="m-0 break-all text-charcoal-deep">{customer.email ?? "—"}</dd>
                </dl>

                <fieldset className="mt-7">
                  <legend className={SEC}>{t("checkout", "chooseAddress")}</legend>
                  {addresses.length > 0 && (
                    <ul className="grid gap-2.5">
                      {addresses.map((a, i) => (
                        <li key={a.id ?? i}>
                          <label className={`${OPT} ${addressId === a.id ? OPT_ON : ""}`}>
                            <input type="radio" name="address" className="sr-only" checked={addressId === a.id} onChange={() => setAddressId(a.id ?? "")} />
                            <Radio on={addressId === a.id} />
                            <span className="text-sm text-charcoal-deep">
                              <b className="block text-[15px] font-semibold">{a.recipient_name ?? "—"}</b>
                              <span className="block">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</span>
                              <span className="block">{[a.city, a.region, a.postal_code].filter(Boolean).join(" ")}</span>
                              <span className="block text-charcoal/75">{a.country}</span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!showNew ? (
                    <button type="button" onClick={() => setShowNew(true)} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gold-dark underline underline-offset-4">
                      <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />{t("checkout", "newAddress")}
                    </button>
                  ) : (
                    <form className="mt-2 grid gap-x-4 border border-hairline p-4 sm:grid-cols-2 sm:p-5" action={saveAddress}>
                      <p className="mb-3 text-[15px] font-semibold text-charcoal-deep sm:col-span-2">{t("checkout", "newAddress")}</p>
                      <Field name="recipient_name" label={t("checkout", "recipientName")} autoComplete="name" />
                      <Field name="phone" label={t("checkout", "phone")} autoComplete="tel" type="tel" />
                      <Field name="line1" label={t("checkout", "line1")} required className="sm:col-span-2" autoComplete="address-line1" />
                      <Field name="line2" label={t("checkout", "line2")} className="sm:col-span-2" autoComplete="address-line2" />
                      <Field name="city" label={t("checkout", "city")} autoComplete="address-level2" />
                      <Field name="region" label={t("checkout", "region")} autoComplete="address-level1" />
                      <Field name="postal_code" label={t("checkout", "postal")} autoComplete="postal-code" />
                      <Field name="country" label={t("checkout", "country")} defaultValue="JP" autoComplete="country" />
                      {/* Required, and never the orange action (D3-7): the quote
                          needs a saved address, and "Continue" is this step's buy. */}
                      <div className="sm:col-span-2">
                        <Button type="submit" variant="outline" disabled={pending}>{t("checkout", "saveAddress")}</Button>
                      </div>
                    </form>
                  )}
                </fieldset>
              </section>
            )}

            {step === 2 && (
              <section className="border border-hairline bg-white p-5 sm:p-7">
                <fieldset>
                  <legend className={SEC}>{t("checkout", "orderType")}</legend>
                  <div className="grid gap-2.5">
                    {ORDER_TYPES.map((type) => (
                      <button key={type} type="button" onClick={() => setOrderType(type)} aria-pressed={orderType === type} className={`${OPT} text-left ${orderType === type ? OPT_ON : ""}`}>
                        <Radio on={orderType === type} />
                        <b className="text-[15px] font-semibold text-charcoal-deep">{orderTypeLabel(type)}</b>
                      </button>
                    ))}
                  </div>
                  {orderType !== "SELF" && (
                    <div className="mt-4 grid gap-x-4 sm:grid-cols-2">
                      <label className={FIELD_LABEL}>
                        {t("checkout", "recipientName")}
                        <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} autoComplete="off" className={INPUT} />
                      </label>
                      <label className={FIELD_LABEL}>
                        {t("checkout", "recipientPhone")}
                        <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} type="tel" autoComplete="off" className={INPUT} />
                      </label>
                      {orderType === "GIFT" && (
                        <label className={`${FIELD_LABEL} sm:col-span-2`}>
                          {t("checkout", "giftNote")}
                          <textarea value={giftNote} onChange={(e) => setGiftNote(e.target.value)} rows={3} className={`mt-1.5 w-full px-3.5 py-3 text-[15px] ${inputLight}`} />
                        </label>
                      )}
                    </div>
                  )}
                </fieldset>

                <h2 className={`${SEC} mt-7`}>{t("checkout", "stepDelivery")}</h2>
                <dl className="grid gap-x-5 gap-y-2.5 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
                  <dt className="text-charcoal/75">{t("checkout", "reviewShipTo")}</dt>
                  <dd className="m-0 text-charcoal-deep">
                    {selectedAddress ? addressText(selectedAddress) : "—"}{" "}
                    <ChangeLink label={t("checkout", "change")} srLabel={t("checkout", "changeItem", { item: t("checkout", "reviewShipTo") })} onClick={() => setStep(1)} />
                  </dd>
                  <dt className="text-charcoal/75">{t("checkout", "whenShips")}</dt>
                  <dd className="m-0 text-charcoal-deep">{t("checkout", "shipsWithin")}</dd>
                  <dt className="text-charcoal/75">{t("checkout", "shipping")}</dt>
                  <dd className="m-0 text-charcoal-deep">{t("cart", "shippingCalc")}</dd>
                </dl>
              </section>
            )}

            {step === 3 && (
              <section className="border border-hairline bg-white p-5 sm:p-7">
                {/* One way to pay where layaway is not offered, so there is
                    nothing to choose between and the fieldset goes entirely. */}
                {layawayOk && (
                  <fieldset className="mb-7">
                    <legend className={SEC}>{t("checkout", "modeH")}</legend>
                    <div className="grid gap-2.5">
                      {(["full", "layaway"] as const).map((m) => (
                        <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`${OPT} text-left ${mode === m ? OPT_ON : ""}`}>
                          <Radio on={mode === m} />
                          <span>
                            <b className="block text-[15px] font-semibold text-charcoal-deep">{m === "full" ? t("checkout", "modeFull") : t("checkout", "modeLayaway")}</b>
                            <span className="mt-1 block text-[13px] leading-relaxed text-charcoal/75">{m === "full" ? t("checkout", "modeFullNote") : t("checkout", "modeLayawayNote")}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    {/* The term belongs to a plan, not to a one-off payment.
                        Before the first quote there is no eligibility to show,
                        so every configured term is offered and the Hub
                        decides; after it, the terms this basket cannot reach
                        are disabled with their minimum named. A NOT-LAUNCHED
                        TERM IS SHOWN AND DISABLED, never hidden (owner decision
                        2026-09-16), with its own reason. */}
                    {mode === "layaway" && (
                      <div className="mt-4 sm:ml-9">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">{t("checkout", "termH")}</p>
                        <div className="flex flex-wrap gap-2">
                          {termOptions.map((tm) => {
                            const launched = termLaunched(tm.months);
                            const pickable = launched && tm.eligible;
                            const on = term === tm.months && pickable;
                            return (
                              <button
                                key={tm.months} type="button" disabled={!pickable}
                                onClick={() => setTerm(tm.months)}
                                aria-pressed={term === tm.months}
                                title={launched ? (tm.eligible ? undefined : t("checkout", "termUnavailable")) : t("checkout", "termNotLaunchedHint")}
                                className={`min-h-11 border px-4 py-1.5 text-left text-sm disabled:border-dashed disabled:opacity-60 ${on ? "border-charcoal-deep bg-charcoal-deep text-chalk" : "border-charcoal/60 text-charcoal-deep"}`}
                              >
                                <span className="block font-medium">{t("checkout", "termMonths", { n: String(tm.months) })}</span>
                                {!launched ? (
                                  <span className={`block text-[11px] ${on ? "text-chalk/80" : "text-charcoal/75"}`}>{t("checkout", "termNotLaunched")}</span>
                                ) : tm.min_amount > 0 ? (
                                  <span className={`block text-[11px] ${on ? "text-chalk/80" : "text-charcoal/75"}`}>
                                    {t("checkout", "termMin", { amount: formatMoney(tm.min_amount, settlement) })}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </fieldset>
                )}

                {/* Yen or pesos, for a full payment and a layaway alike (owner
                    decision 2026-09-25), on both languages. Charcoal, not
                    orange (D3-4): orange means buy. The note follows the mode,
                    so the Japanese site carries no layaway wording. */}
                <fieldset>
                  <legend className={SEC}>{t("checkout", "settlementH")}</legend>
                  <div role="group" className="inline-flex border border-charcoal/60">
                    {(["JPY", "PHP"] as const).map((cur) => (
                      <button
                        key={cur} type="button" onClick={() => setSettlement(cur)}
                        aria-pressed={settlement === cur}
                        className={`min-h-11 px-4 text-sm font-medium sm:px-[18px] ${settlement === cur ? "bg-charcoal-deep text-chalk" : "text-charcoal-deep hover:bg-chalk"}`}
                      >
                        {cur === "JPY" ? `${t("checkout", "settlementJpy")} ¥` : `${t("checkout", "settlementPhp")} ₱`}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-charcoal/75">
                    {mode === "layaway" ? t("checkout", "settlementNote") : t("checkout", "settlementOrderNote")}
                  </p>
                </fieldset>

                {/* C1 (2026-10-05): the method is chosen on Review, where the
                    Hub's list for THIS quote (mode, currency, address) is known. */}
                <h2 className={`${SEC} mt-7`}>{t("checkout", "payHeading")}</h2>
                <p className="text-[13px] leading-relaxed text-charcoal/75">{t("checkout", "payChooseOnReview")}</p>
              </section>
            )}

            {/* THE GATE. No plan is created until the agreement is signed
                (owner decision), and this is the path to it — not the
                enforcement. The enforcement is payLayawayAction, which
                re-checks server-side and refuses, so a customer who skips this
                screen still cannot get a plan. The agreement is one document
                written in Tagalog with English; there is no language to pick. */}
            {step === "sign" && quote && (
              <section className="relative border border-hairline bg-white p-5 sm:p-7">
                <span aria-hidden="true" className="cj-slab-rule" />
                <h2 className={SEC}>{t("checkout", "agreementHeading")}</h2>
                <p className="text-sm leading-relaxed text-charcoal-deep">{t("checkout", "agreementIntro")}</p>
                <p className="mt-3 text-[13px] text-charcoal/75">{t("checkout", "agreementLanguageNote")}</p>
                {/* A NEW TAB, deliberately. The checkout keeps its state —
                    step, term, currency and quote are React state and a
                    same-tab navigation loses all of it. The ?quote= path exists
                    for the customer who leaves anyway. */}
                <Button asChild variant="ghost" className="mt-5">
                  <a href={signUrl(quote.quote_id, quote.invoice_number ?? null)} target="_blank" rel="noopener noreferrer">
                    {t("checkout", "agreementOpen")}<ExternalLink aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                  </a>
                </Button>
                <p className="mt-3 text-[13px] text-charcoal/75">{t("checkout", "agreementNewTabNote")}</p>
                {/* What the server already read from the signing record on the
                    way back in — shown so the customer sees the signature
                    landed before pressing on. */}
                {agreement?.signed && (
                  <p className="mt-5 inline-flex items-center gap-2 border border-hairline bg-chalk px-3 py-1.5 text-[13px] font-semibold text-charcoal-deep before:h-2 before:w-2 before:rounded-full before:bg-teal">
                    {t("checkout", "agreementSigned", { version: agreement.version ?? "", date: agreement.signed_at ? siteDay(agreement.signed_at) : "" })}
                  </p>
                )}
              </section>
            )}

            {step === 4 && quote && (
              <section className="border border-hairline bg-white p-5 sm:p-7">
                <h2 className={SEC}>{t("checkout", "stepReview")}</h2>
                <dl className="grid gap-x-5 gap-y-2.5 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
                  <dt className="text-charcoal/75">{t("checkout", "reviewName")}</dt>
                  <dd className="m-0 text-charcoal-deep">{customer.name ?? "—"}</dd>
                  <dt className="text-charcoal/75">{t("checkout", "reviewShipTo")}</dt>
                  <dd className="m-0 text-charcoal-deep">
                    {selectedAddress ? addressText(selectedAddress) : "—"}{" "}
                    <ChangeLink label={t("checkout", "change")} srLabel={t("checkout", "changeItem", { item: t("checkout", "reviewShipTo") })} onClick={() => setStep(1)} />
                  </dd>
                  <dt className="text-charcoal/75">{t("checkout", "orderType")}</dt>
                  <dd className="m-0 text-charcoal-deep">
                    {orderTypeLabel(orderType)}{" "}
                    <ChangeLink label={t("checkout", "change")} srLabel={t("checkout", "changeItem", { item: t("checkout", "orderType") })} onClick={() => setStep(2)} />
                  </dd>
                  <dt className="text-charcoal/75">{t("checkout", "reviewPayment")}</dt>
                  <dd className="m-0 text-charcoal-deep">
                    {payLabel}{" "}
                    <ChangeLink label={t("checkout", "change")} srLabel={t("checkout", "changeItem", { item: t("checkout", "reviewPayment") })} onClick={() => setStep(3)} />
                  </dd>
                </dl>
                {/* What the server read from the signing record — the version
                    they actually signed and when, the same two values the plan
                    will store. Shown rather than assumed. */}
                {mode === "layaway" && agreement?.signed && (
                  <p className="mt-4 inline-flex items-center gap-2 border border-hairline bg-chalk px-3 py-1.5 text-[13px] font-semibold text-charcoal-deep before:h-2 before:w-2 before:rounded-full before:bg-teal">
                    {t("checkout", "agreementSigned", { version: agreement.version ?? "", date: agreement.signed_at ? siteDay(agreement.signed_at) : "" })}
                  </p>
                )}

                <ul className="mt-6 grid gap-px border-y border-hairline bg-hairline">
                  {quote.items.map((line) => {
                    const cartLine = items.find((i) => i.variant_id === line.variant_id);
                    // The cart's own name for the piece (it carries the Hub's
                    // Japanese name); the quote line's title only when the
                    // piece is not in the cart any more.
                    const name = cartLine ? cartItemName(cartLine, lang) : quoteItemName(line, lang);
                    return (
                      <li key={line.variant_id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5 bg-white py-3 text-sm">
                        <PieceWell image={cartLine?.picture ?? null} alt={name} />
                        <span className="text-charcoal-deep [font-variant-numeric:lining-nums]">{name}{line.qty > 1 ? ` × ${line.qty}` : ""}</span>
                        {/* Lines are yen, the price of record. Beside a peso
                            total they would put two currencies on one screen,
                            so a peso quote lists the pieces without a price
                            (owner decision D1). */}
                        <span className="cj-fig whitespace-nowrap font-display text-[17px] text-charcoal-deep">{quoteCurrency === "JPY" ? formatMoney(line.line_total_jpy) : ""}</span>
                      </li>
                    );
                  })}
                </ul>
                {quote.requires_manual_quote && (
                  <Notice icon={<Info className="h-5 w-5" strokeWidth={1.5} />} className="mt-5">{t("checkout", "manualQuote")}</Notice>
                )}
                {shippingLater && (
                  <Notice icon={<Truck className="h-5 w-5" strokeWidth={1.5} />} className="mt-5">{t("checkout", "shippingAtConfirmation")}</Notice>
                )}

                {/* The plan exactly as the Hub computed it, in the currency it
                    will be written in. Nothing here is recalculated. */}
                {plan && (
                  <div className="mt-6 border border-hairline p-5">
                    <dl className="grid gap-4 sm:grid-cols-3">
                      <PlanFigure k={t("checkout", "layawayDeposit")} v={money(plan.deposit)} />
                      <PlanFigure k={t("checkout", "layawayMonthly")} v={money(plan.monthly)} />
                      <PlanFigure k={t("checkout", "layawayLast")} v={money(plan.last_month)} />
                    </dl>
                    <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">{t("checkout", "layawaySchedule")}</h3>
                    <ul className="mt-3 space-y-1 text-sm text-charcoal-deep">
                      {plan.schedule.map((row) => (
                        <li key={row.installment_number} className="cj-fig flex justify-between gap-4">
                          <span>{row.due_date}</span>
                          <span>{money(row.amount)}</span>
                        </li>
                      ))}
                    </ul>
                    {reserving ? (
                      <>
                        <p className="mt-4 text-[13px] text-charcoal/75">{t("checkout", "layawayScheduleProvisional")}</p>
                        {quote.provisional && <p className="mt-2 text-[13px] text-charcoal/75">{t("checkout", "layawayFiguresProvisional")}</p>}
                      </>
                    ) : (
                      /* The number the Hub will store — 24 on a first order,
                         72 after that — or no number at all when it sent none. */
                      <p className="mt-4 text-[13px] text-charcoal/75">
                        {typeof quote.deposit_deadline_hours === "number"
                          ? t("checkout", "layawayDepositWithin", { hours: String(quote.deposit_deadline_hours) }) + (lang === "ja" ? "" : " ")
                          : ""}
                        {t("checkout", "layawayDeadlineNote")}
                      </p>
                    )}
                  </div>
                )}

                {/* HOW SHE WILL PAY (owner C1–C2, C6). The Hub's list for this
                    quote: one that cannot be used is shown greyed with its
                    reason, never hidden. Chosen here, locked for her after she
                    reserves (staff can change it). */}
                {choice ? (
                  <fieldset className="mt-6" data-testid="checkout-methods">
                    <legend className={SEC}>{t("checkout", "methodH")}</legend>
                    <div className="grid gap-2.5">
                      {choice.payment_options.map((o) => {
                        const on = method === o.method && o.offered;
                        return (
                          <button
                            key={o.method} type="button" disabled={!o.offered || pending}
                            onClick={() => pickMethod(o.method)} aria-pressed={on}
                            data-testid={`checkout-method-${o.method}`}
                            className={`${OPT} text-left disabled:cursor-not-allowed disabled:opacity-60 ${on ? OPT_ON : ""}`}
                          >
                            <Radio on={on} />
                            <span>
                              <b className="block text-[15px] font-semibold text-charcoal-deep">{methodName(o.method)}</b>
                              <span className="mt-1 block text-[13px] leading-relaxed text-charcoal/75">{o.offered ? methodNote(o.method) : optionWhy(o)}</span>
                              {/* P05 (owner 2026-10-08): what Paidy needs from the buyer, stated where she chooses it. */}
                              {o.method === "paidy" && o.offered && <span className="mt-1 block text-[12px] leading-relaxed text-charcoal/65" data-testid="checkout-paidy-needs">{t("checkout", "methodPaidyNeeds")}</span>}
                              {o.method === "card" && <CardMarks inline label={t("footer", "cards")} className="mt-2" />}
                              {/* Owner 2026-10-10: the Paidy logo under Paidy, like the card marks under card (only when offered, as #319 does for card). */}
                              {o.method === "paidy" && o.offered && <PaidyMark label={t("footer", "paidy")} className="mt-2" />}
                              {/* Cash on delivery: the Hub's COD fee for this order, never bracketed here. */}
                              {o.method === "cod" && o.offered && typeof o.fee_jpy === "number" && (
                                <span className="cj-fig mt-1 block text-[13px] font-semibold text-charcoal-deep" data-testid="checkout-cod-fee">
                                  {t("checkout", "methodCodFee", { fee: formatMoney(o.fee_jpy, "JPY") })}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2.5 text-[13px] text-charcoal/75">{t("checkout", mode === "layaway" ? "methodLocked" : "methodLockedOrder")}</p>
                  </fieldset>
                ) : !quote.transfer_available ? (
                  <p role="alert" className={`mt-6 ${alertLight} px-4 py-3 text-sm`}>{t("checkout", "transferUnavailable")}</p>
                ) : null}

                {/* POINTS (owner C3–C5, C7). Every figure from the Hub: her
                    balance and its value, the most this order takes (pieces,
                    never shipping; the deposit on a layaway), and the new
                    total. Not usable → why. */}
                {choice && (
                  <div className="mt-6 border border-hairline p-4" data-testid="checkout-points">
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-charcoal-deep">
                      <input
                        type="checkbox" checked={usePoints} disabled={pending || !choice.points.usable}
                        onChange={(e) => togglePoints(e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-gold-dark"
                      />
                      <span className="font-semibold">{t("checkout", "usePoints")}</span>
                    </label>
                    {!choice.points.usable ? (
                      <p className="mt-2 pl-8 text-[13px] text-charcoal/75">{pointsWhy(choice.points.reason)}</p>
                    ) : usePoints && (
                      <div className="mt-3 pl-8 text-sm text-charcoal-deep">
                        <p>{t("checkout", "pointsBalance", { points: choice.points.available.toLocaleString("en-US"), value: money(choice.points.available_value) })}</p>
                        <p className="mt-1 text-[13px] text-charcoal/75">
                          {t("checkout", choice.points.applies_to === "deposit" ? "pointsMaxDeposit" : "pointsMax", { points: choice.points.max_points.toLocaleString("en-US"), value: money(choice.points.max_value) })}
                        </p>
                        <div className="mt-3 flex flex-wrap items-end gap-2">
                          <label className="text-[13px] font-semibold text-charcoal/85">
                            {t("checkout", "pointsInputLabel")}
                            <input
                              value={pointsText} inputMode="numeric" disabled={pending}
                              onChange={(e) => setPointsText(e.target.value.replace(/[^0-9]/g, ""))}
                              className={`mt-1.5 block h-11 w-36 px-3 text-[15px] ${inputLight}`}
                              data-testid="checkout-points-input"
                            />
                          </label>
                          <Button type="button" variant="outline" disabled={pending || pointsText === ""} onClick={() => applyPoints(pointsText)}>{t("checkout", "pointsApply")}</Button>
                          <button type="button" disabled={pending} className="inline-flex min-h-11 items-center text-[13px] font-semibold text-gold-dark underline underline-offset-4"
                            onClick={() => { const m = String(choice.points.max_points); setPointsText(m); applyPoints(m); }}>
                            {t("checkout", "pointsUseAll")}
                          </button>
                        </div>
                        {choice.points.chosen > 0 && (
                          <dl className="mt-3 grid max-w-xs grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm" data-testid="checkout-points-figures">
                            <dt className="text-charcoal/75">{t("checkout", "pointsRow")}</dt>
                            <dd className="cj-fig m-0 text-right">−{money(choice.points.chosen_value)}</dd>
                            <dt className="font-semibold">{t("checkout", mode === "layaway" ? "pointsDepositDue" : "pointsNewTotal")}</dt>
                            <dd className="cj-fig m-0 text-right font-semibold">{money(mode === "layaway" ? choice.totals.due_now_after_points : choice.totals.total_after_points)}</dd>
                          </dl>
                        )}
                        <p className="mt-2 text-[13px] text-charcoal/75">{t("checkout", "pointsHeldNote")}</p>
                        <p className="mt-1 text-[13px] text-charcoal/75">{t("checkout", "pointsNotReturned")}</p>
                      </div>
                    )}
                  </div>
                )}
                {choiceError && <p role="alert" className={`mt-3 ${alertLight} px-4 py-3 text-sm`}>{choiceError}</p>}

                {/* RESERVE FIRST: no accounts, no deadline — the Hub sends no
                    methods in this mode and this renders none (D3-8). */}
                {methodOffered && reserving && (
                  <Notice icon={<Lock className="h-5 w-5" strokeWidth={1.5} />} className="mt-6">
                    <b className="font-semibold">{t("checkout", mode === "layaway" ? "reserveFirstH" : "orderFirstH")}</b>{" "}
                    {mode === "layaway" ? t("checkout", "layawayReserveNote")
                      : method === "paidy" ? t("checkout", "reserveExplainPaidy")
                      : method === "card" ? t("checkout", "reserveExplainCard")
                      : method === "cod" ? t("checkout", "reserveExplainCod")
                      : t("checkout", "reserveExplain")}
                  </Notice>
                )}

                {/* Offered only to a signed-in non-member, and never
                    pre-ticked: this is consent. */}
                {offerLoyalty && (
                  <div className="mt-6 border border-hairline p-4">
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-charcoal-deep">
                      <input
                        type="checkbox"
                        checked={joinLoyalty}
                        onChange={(e) => setJoinLoyalty(e.target.checked)}
                        disabled={pending}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-gold-dark"
                      />
                      <span>{t("checkout", "joinLoyalty")}</span>
                    </label>
                    <p className="mt-2 pl-8 text-[13px] text-charcoal/75">
                      {t("checkout", "joinLoyaltyNote")}{" "}
                      <Link href="/loyalty" className="font-medium text-gold-dark underline underline-offset-4">
                        {t("checkout", "joinLoyaltyLink")}
                      </Link>
                    </p>
                  </div>
                )}

                {/* CONSENT (owner 2026-10-10; was the V10d "by placing your
                    order you agree" line): one required tick box one line above
                    the action. The links open in a new tab so the basket is
                    never lost; the button stays disabled until it is ticked. */}
                <div className="mt-6" data-testid="checkout-policy-note">
                  <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-charcoal-deep">
                    <input
                      type="checkbox"
                      checked={consented}
                      onChange={(e) => setConsented(e.target.checked)}
                      disabled={pending}
                      required
                      aria-describedby={consented ? undefined : "checkout-consent-required"}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-gold-dark"
                      data-testid="checkout-consent"
                    />
                    <span>
                      {t("checkout", "consentPrefix")}
                      <Link href="/legal/privacy" target="_blank" rel="noopener" className="font-medium text-gold-dark underline underline-offset-4" data-testid="checkout-privacy-policy">{t("checkout", "policyPrivacy")}</Link>
                      {t("checkout", "consentComma")}
                      <Link href="/legal/terms" target="_blank" rel="noopener" className="font-medium text-gold-dark underline underline-offset-4" data-testid="checkout-terms">{t("checkout", "policyTerms")}</Link>
                      {t("checkout", "policyJoin")}
                      <Link href={cancellationPolicyHref(lang)} target="_blank" rel="noopener" className="font-medium text-gold-dark underline underline-offset-4" data-testid="checkout-cancellation-policy">{t("checkout", "policyCancel")}</Link>
                      {t("checkout", "consentSuffix")}
                    </span>
                  </label>
                  {!consented && (
                    <p id="checkout-consent-required" className="mt-2 pl-8 text-[13px] text-charcoal/75" data-testid="checkout-consent-required">
                      {t("checkout", "consentRequired")}
                    </p>
                  )}
                </div>
              </section>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              {back?.to === "cart" ? (
                <Link href="/cart" className={BACK}>← {back.label}</Link>
              ) : back ? (
                <button type="button" className={BACK} disabled={pending} onClick={() => { clearError(); setStep(back.to as Step); }}>← {back.label}</button>
              ) : <span />}
              {primary && <Button className="hidden lg:inline-flex" onClick={primary.onClick} disabled={primary.disabled}>{primary.label}</Button>}
            </div>
          </div>

          <div className="grid gap-4">
            <OrderSlab
              id="order-summary"
              title={t("cart", "summaryH")}
              lines={items.map((i) => ({
                key: i.variant_id,
                name: `${cartItemName(i, lang)}${i.qty > 1 ? ` × ${i.qty}` : ""}`,
                image: i.picture,
                // Yen cart lines only beside yen totals (owner decision D1).
                price: summary.currency === "JPY" ? formatMoney(i.line_total_jpy) : null,
              }))}
              rows={[
                { k: t("checkout", "subtotal"), v: summaryMoney(summary.subtotal) },
                { k: t("checkout", "shipping"), v: shippingValue },
                ...(plan ? [{ k: t("checkout", "layawayDeposit"), v: money(plan.deposit) }, { k: t("checkout", "layawayMonthly"), v: money(plan.monthly) }] : []),
                // Before the quote, a peso plan's deposit and monthly are the
                // Hub's estimate for this basket and term.
                ...(!plan && summary.deposit !== null ? [{ k: t("checkout", "layawayDeposit"), v: summaryMoney(summary.deposit) }] : []),
                ...(!plan && summary.monthly !== null ? [{ k: t("checkout", "layawayMonthly"), v: summaryMoney(summary.monthly) }] : []),
                // Points chosen on Review (C7): the Hub's figures for this quote.
                ...(choice && toPay !== null ? [
                  // Full payment: the order total as a row, points off it; the
                  // big figure below is the amount to pay (F1, like the emails).
                  { k: totalLabel, v: summaryMoney(summary.total) },
                  ...(pointsChosen > 0 ? [{ k: t("checkout", "pointsRow"), v: `−${money(choice.points.chosen_value)}` }] : []),
                  // Cash on delivery: the COD fee as its own line (Hub figure).
                  ...(codFee > 0 ? [{ k: t("checkout", "codFeeRow"), v: formatMoney(codFee, "JPY") }] : []),
                ] : choice && pointsChosen > 0 && quoteShown && mode === "layaway" ? [
                  { k: t("checkout", "pointsRow"), v: `−${money(choice.points.chosen_value)}` },
                  { k: t("checkout", "pointsDepositDue"), v: money(choice.totals.due_now_after_points) },
                ] : []),
              ]}
              total={{
                k: toPay !== null ? t("checkout", "amountToPay") : totalLabel,
                v: headline,
                // Pesos chosen: the yen beside the peso total, and what the
                // estimate is — or, with no peso figure, when it will be shown.
                sub: ((summary.yenTotal !== null && toPay === null) || summary.estimate || summary.pesoPending) ? (
                  <>
                    {summary.yenTotal !== null && toPay === null && <span className="block">{formatMoney(summary.yenTotal, "JPY")}</span>}
                    {summary.estimate && <span className="block">{t("checkout", "pesoEstimateNote")}</span>}
                    {summary.pesoPending && <span className="block">{t("checkout", "pesoNextStep")}</span>}
                  </>
                ) : undefined,
              }}
            >
              <Link href="/cart" className="mt-4 inline-flex min-h-11 items-center text-[13px] text-chalk/80 underline underline-offset-4 hover:text-chalk">{t("cart", "h1")}</Link>
            </OrderSlab>
            {aside}
          </div>
        </div>
      </div>

      {primary && (
        <StickyAct label={toPay !== null ? t("checkout", "amountToPay") : t("cart", "summaryH")} figure={headline} note={quoteShown && !shippingLater ? undefined : t("cart", "plusShipping")}>
          <Button onClick={primary.onClick} disabled={primary.disabled}>{primary.label}</Button>
        </StickyAct>
      )}
    </>
  );
}

const SEC = "mb-4 font-display text-[22px] leading-snug text-charcoal-deep [:lang(ja)_&]:text-[19px]";
const OPT = "grid min-h-11 w-full cursor-pointer grid-cols-[22px_minmax(0,1fr)] items-start gap-3.5 border border-hairline bg-white p-4 sm:p-[18px]";
const OPT_ON = "border-gold-dark shadow-[inset_3px_0_0_#8A6B12]";
const BACK = "inline-flex min-h-11 items-center text-sm font-medium text-charcoal/80 hover:text-charcoal-deep disabled:opacity-60";
const FIELD_LABEL = "mb-4 block text-[13px] font-semibold text-charcoal/85";
const INPUT = `mt-1.5 h-12 w-full px-3.5 text-[15px] ${inputLight}`;

function addressText(a: HubAddress): string {
  // WEB-2: the same formatter as the order and pay-card pages.
  return [a.recipient_name, ...addressLines(a)].filter(Boolean).join(" · ");
}

function Radio({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border-[1.5px] ${on ? "border-gold-dark" : "border-charcoal/60"}`}>
      {on && <span className="h-2.5 w-2.5 rounded-full bg-gold-dark" />}
    </span>
  );
}

function ChangeLink({ label, srLabel, onClick }: { label: string; srLabel: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center align-middle text-[13px] font-semibold text-gold-dark underline underline-offset-[3px] sm:min-h-0">
      <span aria-hidden="true">{label}</span><span className="sr-only">{srLabel}</span>
    </button>
  );
}

function Field({ name, label, required, defaultValue, className, autoComplete, type }: {
  name: string; label: string; required?: boolean; defaultValue?: string; className?: string; autoComplete?: string; type?: string;
}) {
  return (
    <label className={`${FIELD_LABEL} ${className ?? ""}`}>
      {label}{required && <span className="text-gold-dark"> *</span>}
      <input name={name} required={required} defaultValue={defaultValue} autoComplete={autoComplete} type={type ?? "text"} className={INPUT} />
    </label>
  );
}

function PlanFigure({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-charcoal/75">{k}</dt>
      <dd className="cj-fig mt-1 font-display text-2xl text-charcoal-deep">{v}</dd>
    </div>
  );
}

/** The Hub's payment-choice block off a quote, or null on an older Hub that sends none. */
function choiceOf(q: HubQuote | null | undefined): HubCheckoutChoice | null {
  if (!q?.payment_options || !q.points || !q.totals) return null;
  return { payment_options: q.payment_options, payment_method: q.payment_method ?? null, points: q.points, totals: q.totals };
}
