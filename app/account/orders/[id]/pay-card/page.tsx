import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { notLinkedProbe, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { cardOffer, cardSignUrl } from "@/lib/card";
import { pendingSubmissions } from "@/lib/paidy";
import { agreementStatus } from "@/lib/agreement-lookup";
import type { HubMe } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AccountShell } from "@/components/account/account-shell";
import { CardPay, type BillingContact } from "@/components/commerce/card-pay";

export const generateMetadata = () => pageMeta("order");
export const dynamic = "force-dynamic";

/**
 * PAY BY CARD (Square, S3 2026-10-04) — one order, one page, EN and JA.
 *
 * Reached from the order page's "Pay by card" button, which the Hub offers
 * only on a confirmed yen order with money due and nothing pending. The page
 * re-reads the order and the offer here; a direct visit to an order that is
 * not offered a card is sent back to the order page, not refused with a
 * message it cannot act on.
 *
 * THE AGREEMENT COMES FIRST (owner D9). When the Hub says the Card Purchase
 * Agreement is required, the signature is checked server-side — the record
 * lives on agreement.chajewelsjp.com (a Sheet row + PDF), keyed by this
 * order's id — and the card form is drawn only once it is there. Three
 * answers, three screens: signed → the form; not signed → the signing link
 * (it brings her back here); could not check → say so, never "not signed".
 * The server action checks again before it touches the Hub.
 */
export default async function PayCardPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [lang, { id }, query] = await Promise.all([getLang(), params, searchParams]);
  const t = tr(lang);
  const orderPath = `/account/orders/${id}`;

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/login?next=${orderPath}/pay-card`);
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  const link = notLinkedProbe();
  const [detail, me] = jwt
    ? await Promise.all([hub.order(jwt, id).catch(link.or(null)), hub.me(jwt).catch(link.or<HubMe | null>(null))])
    : [null, null];
  if (link.hit) redirect(profileUrl(withQuery(`${orderPath}/pay-card`, query)));
  if (!detail) {
    return (
      <AccountShell lang={lang} current="orders" eyebrow={t("accountMenu", "orders")} title={t("orders", "notFound")} back={{ href: "/account/orders", label: t("orders", "back") }}>
        <Button asChild variant="outline"><Link href="/account/orders">{t("orders", "back")}</Link></Button>
      </AccountShell>
    );
  }

  const { order } = detail;
  const card = cardOffer(detail);
  // Not offered any more (paid, pending, switch off, not yet confirmed): the
  // order page says what is happening; this page has nothing to show.
  if (!card || pendingSubmissions(detail).length > 0) redirect(orderPath);

  const reference = order.web_reference ?? order.invoice_number ?? "—";
  const amountLabel = formatMoney(card.amount_jpy, "JPY");
  const eyebrow = <>{t("card", "eyebrow")} · <span className="cj-fig font-mono text-[13px] normal-case tracking-[0.04em] text-charcoal-deep">{reference}</span></>;
  const back = { href: orderPath, label: t("card", "backToOrder") };

  // The gate. `?signed=1` is only the return from the signing page — it
  // changes nothing here; the lookup is the only thing that decides.
  let gate: "form" | "sign" | "unverified" = "form";
  if (card.agreement_required) {
    const status = await agreementStatus({ doc: "card", order: order.id });
    if (!status.ok) {
      console.error("[pay-card] agreement lookup failed:", status.reason);
      gate = "unverified";
    } else if (!status.signed) {
      gate = "sign";
    }
  }

  if (gate !== "form") {
    const signUrl = cardSignUrl(order.id, order.web_reference ?? order.invoice_number, card.amount_jpy, lang === "ja" ? "ja" : "en");
    return (
      <AccountShell lang={lang} current="orders" eyebrow={eyebrow} title={gate === "sign" ? t("card", "signTitle") : t("card", "title")} back={back}>
        <div className="max-w-[640px] border border-hairline bg-white p-5 sm:p-7">
          {gate === "sign" ? (
            <>
              <p className="text-[15px] leading-relaxed text-charcoal/85">{t("card", "signLede")}</p>
              <dl className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "amount")}</dt>
                <dd className="cj-fig font-display text-[26px] leading-tight text-charcoal-deep">{amountLabel}</dd>
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={signUrl} className="inline-flex h-12 items-center justify-center bg-charcoal-deep px-6 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]" data-testid="card-sign">{t("card", "signButton")}</a>
                <Link href={`${orderPath}/pay-card?signed=1`} className="inline-flex h-12 items-center justify-center border border-charcoal-deep px-6 text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal-deep transition hover:bg-gold-pale/40 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "signedCheck")}</Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-[15px] leading-relaxed text-charcoal/85" role="status">{t("card", "unverified")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`${orderPath}/pay-card`} className="inline-flex h-12 items-center justify-center bg-charcoal-deep px-6 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "signedCheck")}</Link>
                <Button asChild variant="outline"><Link href="/contact">{t("navMenu", "contact")}</Link></Button>
              </div>
            </>
          )}
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell lang={lang} current="orders" eyebrow={eyebrow} title={t("card", "title")} back={back}>
      <div className="max-w-[640px]">
        <CardPay orderId={order.id} card={card} billing={billingContact(detail.order.ship_to_address, me)} amountLabel={amountLabel} lang={lang} />
      </div>
    </AccountShell>
  );
}

/**
 * The buyer for Square's verification (3-D Secure), from what the Hub holds:
 * the order's own delivery address and the customer record. Only a shape is
 * built here; nothing is decided or computed. Fields the Hub does not hold
 * are left out, never invented.
 */
function billingContact(address: { recipient_name?: string | null; line1: string; line2?: string | null; city?: string | null; region?: string | null; postal_code?: string | null; country?: string | null } | null | undefined, me: HubMe | null): BillingContact {
  const name = (address?.recipient_name ?? me?.customer.full_name ?? "").trim();
  const [givenName, ...rest] = name.split(/\s+/).filter(Boolean);
  const familyName = rest.join(" ");
  const country = (address?.country ?? "").trim().toUpperCase();
  return {
    ...(givenName ? { givenName } : {}),
    ...(familyName ? { familyName } : {}),
    ...(me?.customer.email ? { email: me.customer.email } : {}),
    ...(me?.customer.mobile_number ? { phone: me.customer.mobile_number } : {}),
    ...(address ? { addressLines: [address.line1, address.line2 ?? ""].filter(Boolean) } : {}),
    ...(address?.city ? { city: address.city } : {}),
    ...(address?.region ? { state: address.region } : {}),
    ...(address?.postal_code ? { postalCode: address.postal_code } : {}),
    ...(/^[A-Z]{2}$/.test(country) ? { countryCode: country } : {}),
  };
}
