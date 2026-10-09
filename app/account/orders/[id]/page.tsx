import { pageMeta } from "@/lib/page-meta";
import { formatDeadline, formatSiteDate, siteDay } from "@/lib/site-time";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { notLinkedProbe, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { orderLineTitle } from "@/lib/catalog-i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { orderStatusLabel, refundLabel } from "@/lib/order-status";
import { isAwaitingConfirmation, isReadyForPayment } from "@/lib/reservation";
import type { ServiceRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { TransferDetails } from "@/components/commerce/transfer-details";
import { PaidyPay } from "@/components/commerce/paidy-pay";
import { PaidyProfileForm } from "@/components/commerce/paidy-profile-form";
import { siteUrl } from "@/lib/site";
import { paidyOffer, paidyProcessing as paidyHoldsOrder, paidyWindowOpen, pendingSubmissions } from "@/lib/paidy";
import { cardOffer } from "@/lib/card";
import { CardPaymentStatus } from "@/components/commerce/card-payment-status";
import { StatusBadge } from "@/components/account/status-badge";
import { PrintButton } from "@/components/account/print-button";
import { PrintHeader } from "@/components/account/print-header";
import { ServiceRequestForm } from "@/components/account/service-request-form";
import { PaymentDueCard } from "@/components/account/payment-due-card";
import { AccountShell } from "@/components/account/account-shell";
import { cancellationPolicyHref } from "@/lib/cancellation-policy";
import { OrderProgress } from "@/components/account/order-progress";
import { cardFallsBackToTransfer, orderDisplay, payBoxes } from "@/lib/order-display";
import { PaymentDecisionNotice } from "@/components/account/payment-decision-notice";
import { SwitchMethod } from "@/components/commerce/switch-method";
import { Notice, PieceWell } from "@/components/commerce/commerce-ui";
import { linePicture } from "@/components/commerce/confirmation";
import { CardMarks } from "@/components/commerce/card-marks";
import { addressLines } from "@/lib/address-format";

export const generateMetadata = () => pageMeta("order");
export const dynamic = "force-dynamic";

/**
 * ONE ORDER (build step 4; comp page-comps/account-signin "Order detail").
 * The reference is the eyebrow and the status is the heading; under it the
 * five-stage status line, then — while money is due — how to pay (owner
 * request 2026-09-24: payment first), or the live reserved note while staff
 * confirm. The pieces sit left, and a side card holds when it was placed,
 * where it goes, how it is paid and the Hub's total. Print / save as PDF is
 * beside the heading.
 */
export default async function OrderDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [lang, { id }, query] = await Promise.all([getLang(), params, searchParams]);
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/login?next=/account/orders/${id}`);
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  // The requests are read alongside the order; a Hub that cannot answer for
  // them must not take the order page down with it, so they fall back to none.
  //
  // 404 not_linked (no customer record yet) goes to the profile step; 404
  // not_found (no such order, or not hers) keeps the "not found" below.
  const link = notLinkedProbe();
  const [detail, requests] = jwt
    ? await Promise.all([hub.order(jwt, id).catch(link.or(null)), hub.serviceRequests(jwt).catch(link.or<ServiceRequest[]>([]))])
    : [null, [] as ServiceRequest[]];
  if (link.hit) redirect(profileUrl(withQuery(`/account/orders/${id}`, query)));
  if (!detail) {
    return (
      <AccountShell lang={lang} current="orders" eyebrow={t("accountMenu", "orders")} title={t("orders", "notFound")} back={{ href: "/account/orders", label: t("orders", "back") }}>
        <Button asChild variant="outline"><Link href="/account/orders">{t("orders", "back")}</Link></Button>
      </AccountShell>
    );
  }

  const { order, items, transfer_methods: methods } = detail;
  const paidy = paidyOffer(detail);
  const card = cardOffer(detail);
  // C1 (2026-10-05): the method she chose at checkout (or staff since). A
  // website order shows ONLY that one; the Hub already sends no other.
  const chosen = detail.chosen_method ?? null;
  const status = orderStatusLabel(order, lang, chosen);
  const address = order.ship_to_address;
  const fmtDate = (iso: string) => formatSiteDate(iso, lang);
  const cancelled = order.status === "cancelled" || order.payment_status === "cancelled";
  const refund = refundLabel(order.refund_status, lang);
  const ownRequests = requests.filter((r) => r.cash_order_id === order.id);
  // A submission the Hub is still checking replaces the payment card: she
  // has paid (or Paidy has authorised), and asking again would be wrong.
  const pending = pendingSubmissions(detail);
  // An OPEN card payment (SQ22, owner 3A): in flight, authorised, being
  // captured or being recorded. While it is open EVERY way to pay is hidden —
  // the Hub already answers no card, no Paidy and no transfer methods, and
  // this page does not offer the payment card at all — and its state is
  // shown instead. Its own submission is then not listed twice.
  const cardPayment = detail.card_payment ?? null;
  const pendingShown = cardPayment ? pending.filter((p) => p.payment_method !== "square") : pending;
  // Owner rule 2026-10-04: while Paidy processes this order (its window, an
  // authorisation waiting, or a capture not yet recorded) NO way to pay is
  // shown — not Paidy again, not the card, not the bank details. The Hub
  // decides (payment_state) and refuses the same server-side.
  const paidyProcessing = paidyHoldsOrder(detail);
  // P04 QA (2026-10-08): her own open window is NOT a payment — Paidy is
  // offered again at once; transfer and card wait for the hourly check.
  const windowOpen = paidyWindowOpen(detail);
  const payDue = order.payment_status === "pending_transfer" && isReadyForPayment(order) && pending.length === 0 && !cardPayment && !paidyProcessing;
  // While a payment is being checked (a card hold, Paidy, or a slip) the
  // heading says so instead of "Awaiting transfer" — she has already paid or
  // authorised, and the page shows no way to pay (2026-10-04 test run).
  const beingChecked = order.payment_status === "pending_transfer" && (!!cardPayment || paidyProcessing || pending.length > 0 || order.being_checked === true);
  // Payment lifecycle (S1/S3): headline, step line, step-3 label and the
  // reviewer's notice, from one pure helper over the Hub's own fields.
  const display = orderDisplay({ order, chosenMethod: chosen, beingChecked, latestDecision: detail.latest_decision ?? null });
  const headline = display.headlineKey ? t("orders", display.headlineKey) : beingChecked ? t("orders", "pending") : status.text;
  const stage = display.stage;
  const decision = display.notice ? detail.latest_decision ?? null : null;
  // Staff asked her a question (needs clarification): no way to pay until it is answered — her money may already be with us.
  const payOpen = payDue && !beingChecked && !display.payBlocked;
  // "Pay another way" (D1): only the Hub's own list, only while the Hub says so.
  const switchMethods = detail.can_switch_method ? (detail.switch_methods ?? []) : [];
  const methodName = (m: string | null) => (m === "paidy" ? t("orders", "methodPaidy") : m === "square" ? t("orders", "methodCard") : m === "transfer" || m === "bank_transfer" || !m ? t("orders", "methodTransfer") : m);
  const reference = order.web_reference ?? order.invoice_number ?? "—";
  const placed = siteDay(order.order_date ?? order.created_at);
  // C1: only her method's box. The Hub decides what is offered; this only narrows it.
  const transferSent = (methods ?? []).length > 0;
  const boxes = payBoxes({ chosen, paidyOffered: !!paidy, cardOffered: !!card, transferSent });
  const cardFallback = cardFallsBackToTransfer({ chosen, cardOffered: !!card, transferSent });
  const showTransfer = boxes.transfer;
  const payment = chosen === "paidy" ? t("orders", "chosenPaidy")
    : chosen === "card" ? t("orders", "chosenCard")
    : order.payment_method === "transfer"
    ? t("orders", "payVia", { method: t("orders", "bankTransfer"), currency: order.currency === "PHP" ? t("orders", "currencyPHP") : t("orders", "currencyJPY") })
    : null;
  const pointsApplied = Number(detail.points_applied ?? 0);
  // P05 (owner 2026-10-08): she chose Paidy and the Hub reports a buyer
  // requirement missing (names, Japanese mobile, Japanese billing address):
  // ask for it here instead of "contact us". The Hub re-decides after she saves.
  const paidyReq = detail.paidy_requirements ?? null;
  const paidyNeedsProfile = chosen === "paidy" && !paidy && !!paidyReq && !(paidyReq.family_name && paidyReq.given_name && paidyReq.jp_mobile && paidyReq.jp_billing_address);
  // Chose Paidy or card, but the Hub offers it on this order no longer: say so.
  const chosenUnavailable = ((chosen === "paidy" && !paidy) || (chosen === "card" && !card)) && !paidyNeedsProfile;
  const shipping = order.shipping_fee != null && Number(order.shipping_fee) > 0 ? formatMoney(Number(order.shipping_fee), order.currency) : null;

  return (
    <AccountShell
      lang={lang}
      current="orders"
      className="print-invoice"
      back={{ href: "/account/orders", label: t("orders", "back") }}
      eyebrow={<>{t("draft", "reference")} <span className="cj-fig font-mono text-[13px] normal-case tracking-[0.04em] text-charcoal-deep">{reference}</span></>}
      title={headline}
      headAside={<PrintButton label={t("account", "print")} />}
    >
      <PrintHeader lang={lang} invoiceNumber={order.invoice_number} reference={order.web_reference} date={placed} />

      {stage ? <div className="print-hide"><OrderProgress lang={lang} stage={stage} stage3Key={display.stage3Key} /></div> : <div className="mb-6"><StatusBadge tone={status.tone} text={headline} /></div>}

      {/* PAYMENT FIRST (owner request 2026-09-24). While money is due, how to
          pay is the first thing under the heading, on screen and on paper —
          and, since reserve-first, only once the Hub says the order can be
          paid. A reservation reads payment_status "awaiting_confirmation", so
          the first test already excludes it; the second is belt and braces,
          the same pair the Hub checks before it sends any methods. */}
      {/* The reviewer's last decision (S3, spec §4B): above the payment box.
          Hidden while a new payment is being checked or the order is closed (R17). */}
      {decision && display.notice && <PaymentDecisionNotice lang={lang} kind={display.notice} decision={decision} currency={order.currency} />}

      {payOpen && (
        <div className="mb-6 [&>section]:mt-0">
          <PaymentDueCard
            lang={lang}
            amount={Number(order.remaining_balance) > 0 ? formatMoney(Number(order.remaining_balance), order.currency) : null}
            deadline={order.transfer_due_at ? formatDeadline(order.transfer_due_at, lang) : null}
          >
            {/* Paidy (ato-barai) first when the Hub offers it (PD2): a
                Japanese delivery address, a yen order, nothing pending. The
                bank details stay underneath — one more way to pay. */}
            {windowOpen && (
              <div className="mb-5 border border-gold-dark bg-white p-4 sm:p-5" role="status" data-testid="paidy-window-open">
                <h3 className="font-display text-[17px] text-charcoal-deep">{t("paidy", "windowOpenTitle")}</h3>
                <p className="mt-1 text-sm text-charcoal/80">{t("paidy", "windowOpenBody")}</p>
              </div>
            )}
            {paidy && boxes.paidy && <PaidyPay orderId={order.id} paidy={paidy} logoUrl={`${siteUrl()}/apple-icon.png`} lang={lang} />}
            {/* Paidy can refuse her inside its own window and leave no record
                here, so no switch: she is told to contact us instead (§4C). */}
            {paidy && boxes.paidy && chosen === "paidy" && switchMethods.length === 0 && !windowOpen && (
              <p className="-mt-2 mb-5 text-sm text-charcoal/80" data-testid="paidy-contact-to-switch">{t("orders", "paidyContactToSwitch")}</p>
            )}
            {/* Card (Square, S3 2026-10-04) when the Hub offers it: any
                country, yen, nothing pending. The form lives on its own page
                behind the Card Purchase Agreement gate (owner D9). */}
            {card && boxes.card && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-hairline bg-white p-4 sm:p-5" data-testid="card-offer">
                <div className="min-w-0">
                  <p className="font-display text-[17px] text-charcoal-deep">{t("card", "orderButton")}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-charcoal/80">{t("card", "orderLede")}</p>
                  <CardMarks label={t("footer", "cards")} className="mt-2" />
                </div>
                {/* A full page load, not a client navigation: the pay-card page's enforced CSP header only applies to a document load. */}
                <a href={`/account/orders/${order.id}/pay-card`} className="inline-flex h-11 items-center justify-center bg-charcoal-deep px-5 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "orderButton")}</a>
              </div>
            )}
            {paidyNeedsProfile && paidyReq && <PaidyProfileForm orderId={order.id} requirements={paidyReq} lang={lang} />}
            {chosenUnavailable && (
              <p className="mb-5 border border-hairline bg-white p-4 text-sm text-charcoal-deep" data-testid="chosen-method-unavailable">{t("orders", cardFallback ? "cardFallbackNote" : "methodUnavailableNote")}</p>
            )}
            {switchMethods.length > 0 && <SwitchMethod orderId={order.id} methods={switchMethods} lang={lang} />}
            {showTransfer && !windowOpen && (
              <>
                <h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-charcoal/70">{t("complete", "instructions")}</h3>
                <TransferDetails methods={methods} lang={lang} />
                {methods.length > 0 && <p className="mt-4 text-sm text-charcoal/70">{t("complete", "keepRef")}</p>}
              </>
            )}
          </PaymentDueCard>
        </div>
      )}

      {cardPayment && (
        <div className="mb-6">
          <CardPaymentStatus lang={lang} state={cardPayment.state} brand={cardPayment.brand} last4={cardPayment.last4} captureBy={cardPayment.capture_by} reference={cardPayment.reference} />
        </div>
      )}

      {paidyProcessing && !cardPayment && pending.length === 0 && (
        <div className="mb-6 border border-gold-dark bg-white p-5" role="status" data-testid="paidy-processing">
          <h2 className="font-display text-lg text-charcoal-deep">{t("paidy", "processingTitle")}</h2>
          <p className="mt-2 text-sm text-charcoal/80">{t("paidy", "processingBody")}</p>
        </div>
      )}

      {pendingShown.length > 0 && (
        <div className="mb-6 border border-gold-dark bg-white p-5">
          <h2 className="font-display text-lg text-charcoal-deep">{t("orders", "pending")}</h2>
          <ul className="mt-3 space-y-1 text-sm text-charcoal/80">
            {pendingShown.map((sub) => (
              <li key={sub.id}>
                {t("orders", "pendingNote", { amount: formatMoney(Number(sub.submitted_amount), order.currency), date: fmtDate(sub.payment_date), method: methodName(sub.payment_method) })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* A reservation staff have not confirmed yet (Hub A2): what happens
          next, and no payment details until it is confirmed. */}
      {isAwaitingConfirmation(order) && (
        <Notice icon={<Lock className="h-5 w-5" strokeWidth={1.5} />} className="mb-6">{t("orders", "reservedNote")}</Notice>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {/* A Hub-arranged order records its pieces on the invoice, not in
              this table: most carry no lines and no saved address. */}
          {items.length === 0 ? (
            <p className="border border-hairline bg-white p-5 text-sm leading-relaxed text-charcoal/80">{t("orders", "arrangedWithUs")}</p>
          ) : (
            <ul className="grid gap-3">
              {items.map((line) => {
                const name = orderLineTitle(line, lang);
                return (
                  <li key={line.id} className="grid grid-cols-[80px_minmax(0,1fr)] items-start gap-3.5 border border-hairline bg-white p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5 sm:p-5">
                    <PieceWell image={linePicture(line.image_url, name)} alt={name} />
                    <div className="min-w-0">
                      <p className="font-display text-[15px] leading-[1.45] text-charcoal-deep [font-variant-numeric:lining-nums] sm:text-[17px]">{name}</p>
                      <p className="mt-1.5 text-xs text-charcoal/75">
                        {line.sku ? `SKU ${line.sku}` : ""}{line.quantity > 1 ? ` · × ${line.quantity}` : ""}
                      </p>
                      {/* line_total_jpy is always yen, the price of record: shown
                          on a yen order only. A peso order lists its pieces
                          without a price and gives the total in pesos (D1). */}
                      {order.currency === "JPY" && (
                        <p className="cj-fig mt-2.5 font-display text-[20px] text-charcoal-deep">{formatMoney(Number(line.line_total_jpy), "JPY")}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* The Hub decided the cancellation and the refund; this block only reports them. */}
          {cancelled && (
            <div className="mt-6 border border-hairline bg-white p-5 text-sm text-charcoal sm:p-6">
              <h2 className="font-display text-xl text-charcoal-deep">{t("orders", "statusCancelled")}</h2>
              <dl className="mt-4 space-y-2">
                {order.cancelled_at && <Row k={t("orders", "cancelledOn")} v={fmtDate(order.cancelled_at)} />}
                {order.cancellation_reason && <Row k={t("orders", "cancelReason")} v={order.cancellation_reason} />}
                {refund && <Row k={t("orders", "refund")} v={refund} />}
              </dl>
              {order.refund_note && <p className="mt-4 whitespace-pre-line text-charcoal/70">{order.refund_note}</p>}
            </div>
          )}

          {order.status === "expired" && (
            <p className="mt-6 text-sm text-charcoal/75">
              {t("orders", "statusExpired")}{order.expired_at ? ` · ${fmtDate(order.expired_at)}` : ""}
            </p>
          )}

          {/* Work on the piece — a resize, a cleaning, a repair — asked for
              here, next to the order it came with. Not on a closed order. */}
          <ServiceRequestForm
            lang={lang}
            target={{ cash_order_id: order.id }}
            items={items.map((line) => ({ value: line.title, label: orderLineTitle(line, lang) }))}
            initial={ownRequests}
            canRequest={status.tone !== "dead"}
          />
        </div>

        <aside className="border border-hairline bg-white p-5 sm:p-6">
          <dl className="grid gap-1 text-sm">
            <Kv k={t("orders", "placed")}><span className="cj-fig">{placed}</span></Kv>
            {address && (
              <Kv k={t("orders", "shipTo")}>
                <span className="block">{address.recipient_name ?? "—"}</span>
                {/* WEB-2: one formatter (Japan top-down with 〒NNN-NNNN). */}
                {addressLines(address).map((l, i, all) => (
                  <span key={i} className={i === all.length - 1 && address.country ? "block text-charcoal/75" : "block"}>{l}</span>
                ))}
              </Kv>
            )}
            {payment && <Kv k={t("orders", "payment")}>{payment}</Kv>}
            {shipping && <Kv k={t("checkout", "shipping")}><span className="cj-fig">{shipping}</span></Kv>}
            {pointsApplied > 0 && <Kv k={t("orders", "pointsUsed")}><span className="cj-fig">−{formatMoney(pointsApplied, order.currency)}</span></Kv>}
            {order.tracking_number && <Kv k={t("orders", "tracking")}><span className="font-mono text-gold-dark">{order.tracking_number}</span></Kv>}
            <Kv k={t("orders", "total")} last={!(pointsApplied > 0 && Number(order.remaining_balance) > 0)}>
              <span className={`cj-fig font-display text-[26px] leading-tight ${status.tone === "dead" ? "text-charcoal/70" : "text-charcoal-deep"}`}>{formatMoney(Number(order.total_amount), order.currency)}</span>
            </Kv>
            {/* Points used (S3, spec §4E): what is left to pay, the Hub's remaining_balance — never computed here. */}
            {pointsApplied > 0 && Number(order.remaining_balance) > 0 && (
              <Kv k={t("orders", "amountToPay")} last>
                <span className="cj-fig font-display text-[20px] leading-tight text-charcoal-deep">{formatMoney(Number(order.remaining_balance), order.currency)}</span>
              </Kv>
            )}
          </dl>
          {/* Owner 2026-10-06: points used are not returned if the order lapses unpaid. */}
          {pointsApplied > 0 && Number(order.remaining_balance) > 0 && order.status === "pending" && (
            <p className="mt-3 text-[13px] text-charcoal/75">{t("orders", "pointsNotReturned")}</p>
          )}
          {/* CANCELLATION POLICY (V10d, owner 2026-10-08): the same article the
              checkout linked to, so the rule is one click away after the order
              too. The Hub decides every cancellation; this is a link only. */}
          <p className="mt-4 border-t border-hairline pt-3 text-[13px] print:hidden">
            <Link href={cancellationPolicyHref(lang)} className="inline-flex min-h-11 items-center font-medium text-gold-dark underline underline-offset-4" data-testid="order-cancellation-policy">
              {t("orders", "cancellationPolicy")} →
            </Link>
          </p>
        </aside>
      </div>
    </AccountShell>
  );
}

function Kv({ k, children, last }: { k: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={last ? "pt-3" : "border-b border-hairline pb-3 pt-3 first:pt-0"}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{k}</dt>
      <dd className="mt-1 text-charcoal-deep">{children}</dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-charcoal/70">{k}</dt>
      <dd className="text-charcoal-deep">{v}</dd>
    </div>
  );
}
