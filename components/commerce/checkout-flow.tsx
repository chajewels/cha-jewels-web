"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { payAction, quoteAction, saveAddressAction } from "@/lib/checkout-actions";
import { TransferDetails } from "@/components/commerce/transfer-details";
import type { CartItem } from "@/lib/cart";
import type { HubAddress, HubQuote, OrderType } from "@/lib/types";

type Step = 1 | 2 | 3;

const ORDER_TYPES: OrderType[] = ["SELF", "GIFT", "PROXY"];

export function CheckoutFlow({ lang, items, subtotal, initialAddresses }: {
  lang: Lang; items: CartItem[]; subtotal: number; initialAddresses: HubAddress[];
}) {
  const t = tr(lang);
  const router = useRouter();
  const [pending, start] = useTransition();

  const [step, setStep] = useState<Step>(1);
  const [addresses, setAddresses] = useState<HubAddress[]>(initialAddresses);
  const [addressId, setAddressId] = useState<string>(
    initialAddresses.find((a) => a.is_default)?.id ?? initialAddresses[0]?.id ?? "",
  );
  const [showNew, setShowNew] = useState(initialAddresses.length === 0);
  const [orderType, setOrderType] = useState<OrderType>("SELF");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [quote, setQuote] = useState<HubQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errorCopy = (code: string) =>
    code === "transfer_unavailable" ? t("checkout", "transferUnavailable")
    : code === "sold_out" ? t("checkout", "soldOut")
    : code === "expired" ? t("checkout", "expired")
    : code === "empty_cart" ? t("checkout", "emptyCart")
    : code === "address_required" ? t("checkout", "addressRequired")
    : t("checkout", "failed");

  function saveAddress(form: FormData) {
    setError(null);
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
      if (!res.ok) { setError(errorCopy(res.code)); return; }
      setAddresses(res.data);
      setAddressId(res.data.find((a) => a.is_default)?.id ?? res.data[0]?.id ?? "");
      setShowNew(false);
    });
  }

  function toReview() {
    setError(null);
    start(async () => {
      const res = await quoteAction({
        ship_to_address_id: addressId,
        order_type: orderType,
        recipient_name: orderType === "SELF" ? undefined : recipientName,
        recipient_phone: orderType === "SELF" ? undefined : recipientPhone,
        gift_note: orderType === "GIFT" ? giftNote : undefined,
      });
      if (!res.ok) { setError(errorCopy(res.code)); return; }
      setQuote(res.data);
      setStep(2);
    });
  }

  function placeOrder() {
    if (!quote) return;
    setError(null);
    start(async () => {
      const res = await payAction(quote.quote_id);
      if (!res.ok) {
        setError(errorCopy(res.code));
        // A stale quote is recoverable by going back and re-pricing.
        if (res.code === "expired" || res.code === "sold_out") setStep(1);
        return;
      }
      router.push(`/checkout/complete/${res.data.order_id}`);
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {([[1, t("checkout", "step1")], [2, t("checkout", "step2")], [3, t("checkout", "step3")]] as const).map(([n, label]) => (
            <li key={n} className={n === step ? "text-gold-pale" : "text-champagne/45"}>
              <span className="font-display">{n}.</span> {label}
            </li>
          ))}
        </ol>

        {error && (
          <p role="alert" className="mb-6 border border-garnet/60 bg-velvet-deep p-4 text-sm text-champagne/85">{error}</p>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <fieldset>
              <legend className="font-display text-xl text-gold-pale">{t("checkout", "chooseAddress")}</legend>
              {addresses.length > 0 && (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {addresses.map((a, i) => (
                    <li key={a.id ?? i}>
                      <label className={`block cursor-pointer border p-4 text-sm ${addressId === a.id ? "border-gold text-champagne" : "border-rule text-champagne/70"}`}>
                        <input
                          type="radio" name="address" className="sr-only"
                          checked={addressId === a.id}
                          onChange={() => setAddressId(a.id ?? "")}
                        />
                        <span className="block">{a.recipient_name ?? "—"}</span>
                        <span className="block">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</span>
                        <span className="block">{[a.city, a.region, a.postal_code].filter(Boolean).join(" ")}</span>
                        <span className="block text-champagne/50">{a.country}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              {!showNew ? (
                <button type="button" onClick={() => setShowNew(true)} className="mt-4 text-sm text-gold-pale underline underline-offset-4">
                  {t("checkout", "newAddress")}
                </button>
              ) : (
                <form
                  className="mt-4 grid gap-3 border border-rule p-4 sm:grid-cols-2"
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
              <legend className="font-display text-xl text-gold-pale">{t("checkout", "orderType")}</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type} type="button" onClick={() => setOrderType(type)}
                    className={`border px-4 py-2 text-sm ${orderType === type ? "border-gold text-gold-pale" : "border-rule text-champagne/65"}`}
                  >
                    {type === "SELF" ? t("checkout", "self") : type === "GIFT" ? t("checkout", "gift") : t("checkout", "proxy")}
                  </button>
                ))}
              </div>
              {orderType !== "SELF" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-champagne/70">
                    {t("checkout", "recipientName")}
                    <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="mt-1 w-full border border-rule bg-velvet-deep px-3 py-2 text-champagne" />
                  </label>
                  <label className="text-sm text-champagne/70">
                    {t("checkout", "recipientPhone")}
                    <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="mt-1 w-full border border-rule bg-velvet-deep px-3 py-2 text-champagne" />
                  </label>
                  {orderType === "GIFT" && (
                    <label className="text-sm text-champagne/70 sm:col-span-2">
                      {t("checkout", "giftNote")}
                      <textarea value={giftNote} onChange={(e) => setGiftNote(e.target.value)} rows={3} className="mt-1 w-full border border-rule bg-velvet-deep px-3 py-2 text-champagne" />
                    </label>
                  )}
                </div>
              )}
            </fieldset>

            <Button disabled={pending || !addressId} onClick={toReview}>{t("checkout", "continue")}</Button>
          </div>
        )}

        {step === 2 && quote && (
          <div className="space-y-6">
            <ul className="rule-grid grid gap-px">
              {quote.items.map((line) => (
                <li key={line.variant_id} className="flex items-baseline justify-between gap-4 bg-velvet p-4 text-sm">
                  <span>{line.name} × {line.qty}</span>
                  <span className="font-display text-lg text-gold-pale">{formatMoney(line.line_total_jpy)}</span>
                </li>
              ))}
            </ul>
            {quote.requires_manual_quote && (
              <p className="border border-gold px-4 py-3 text-sm text-gold-pale">{t("checkout", "manualQuote")}</p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={pending}>{t("checkout", "back")}</Button>
              <Button onClick={() => setStep(3)} disabled={pending || quote.requires_manual_quote}>{t("checkout", "continue")}</Button>
            </div>
          </div>
        )}

        {step === 3 && quote && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-gold-pale">{t("checkout", "payHeading")}</h2>
            {/* A region with no complete, active method in the Hub is not
                offered transfer at all. Showing the method and failing at the
                last click — or worse, taking an order we cannot be paid for —
                is the outcome this prevents. The Hub enforces the same rule
                server-side; this is the courteous half of it. */}
            {quote.transfer_available ? (
              <>
                <div className="border border-rule bg-velvet p-4 text-sm text-champagne/80">
                  <p>{t("checkout", "transferOnly")}</p>
                  <p className="mt-2">{t("checkout", "transferPreview")}</p>
                  <p className="mt-2">{t("checkout", "deadlineNote")}</p>
                </div>
                {/* The Hub sends only this destination's region, so these are
                    the accounts this customer will actually pay into — and the
                    other region's are not in the payload to leak. */}
                <TransferDetails methods={quote.transfer_methods} lang={lang} />
              </>
            ) : (
              <p role="alert" className="border border-gold px-4 py-3 text-sm text-gold-pale">
                {t("checkout", "transferUnavailable")}
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={pending}>{t("checkout", "back")}</Button>
              <Button onClick={placeOrder} disabled={pending || !quote.transfer_available}>
                {pending ? t("checkout", "placing") : t("checkout", "placeOrder")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside className="h-fit border border-rule bg-velvet p-6">
        <ul className="space-y-2 text-sm text-champagne/75">
          {items.map((i) => (
            <li key={i.variant_id} className="flex justify-between gap-4">
              <span>{i.name}{i.qty > 1 ? ` × ${i.qty}` : ""}</span>
              <span>{formatMoney(i.line_total_jpy)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-rule pt-4 text-sm">
          <Line k={t("checkout", "subtotal")} v={formatMoney(quote?.subtotal_jpy ?? subtotal)} />
          <Line
            k={t("checkout", "shipping")}
            v={quote === null ? "—" : quote.shipping_jpy === null ? "—" : quote.shipping_jpy === 0 ? t("checkout", "free") : formatMoney(quote.shipping_jpy)}
          />
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-gold pt-4">
          <span className="text-champagne/70">{t("checkout", "total")}</span>
          <span className="font-display text-2xl text-gold-pale">{formatMoney(quote?.total_jpy ?? subtotal)}</span>
        </div>
        <Link href="/cart" className="mt-4 inline-block text-xs text-champagne/55 underline underline-offset-4">
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
    <label className={`text-sm text-champagne/70 ${className ?? ""}`}>
      {label}{required && <span className="text-gold-pale"> *</span>}
      <input name={name} required={required} defaultValue={defaultValue} className="mt-1 w-full border border-rule bg-velvet-deep px-3 py-2 text-champagne" />
    </label>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-champagne/55">{k}</dt>
      <dd className="text-champagne">{v}</dd>
    </div>
  );
}
