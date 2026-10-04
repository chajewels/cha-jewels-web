import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { FullReloadLinks } from "@/components/commerce/full-reload-links";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { notLinkedProbe, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { cardAgreementGate, cardOffer, cardSignUrl, type CardAgreementGate } from "@/lib/card";
import { cardAgreementContextToken } from "@/lib/card-agreement-link";
import { pendingSubmissions } from "@/lib/paidy";
import { agreementStatus } from "@/lib/agreement-lookup";
import { Button } from "@/components/ui/button";
import { AccountShell } from "@/components/account/account-shell";
import { CardPay, type CardDelivery } from "@/components/commerce/card-pay";

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
 * order's id — and the card form is drawn only once it is there. Four
 * answers, four screens: signed for THIS customer and THIS amount → the form;
 * not signed → the signing link (it brings her back here); signed but for
 * another amount, or a legacy unbound signature → "sign again" with the link
 * (owner 5A); could not check → say so, never "not signed". The signing link
 * carries a context the server signed (lib/card-agreement-link.ts); without
 * the key there is no link, and the page says "could not check". The server
 * action checks all of it again before it touches the Hub.
 *
 * CSP (owner 6A, SQ19): this is the one page with an ENFORCED policy
 * (middleware.ts, lib/csp.ts). The nonce arrives as the `x-nonce` request
 * header and is handed to the Square SDK's <Script>.
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
  const detail = jwt ? await hub.order(jwt, id).catch(link.or(null)) : null;
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
  // Not offered any more (paid, pending, an open card payment, switch off, not
  // yet confirmed): the order page says what is happening; this page has
  // nothing to show.
  if (!card || detail.card_payment || pendingSubmissions(detail).length > 0) redirect(orderPath);

  const reference = order.web_reference ?? order.invoice_number ?? "—";
  const amountLabel = formatMoney(card.amount_jpy, "JPY");
  const eyebrow = <>{t("card", "eyebrow")} · <span className="cj-fig font-mono text-[13px] normal-case tracking-[0.04em] text-charcoal-deep">{reference}</span></>;
  // native: leave pay-card with a full page load so its enforced CSP does not
  // carry over to the order page (Paidy, analytics).
  const back = { href: orderPath, label: t("card", "backToOrder"), native: true };

  // The gate. `?signed=1` is only the return from the signing page — it
  // changes nothing here; the lookup is the only thing that decides.
  let gate: CardAgreementGate["gate"] = "form";
  let resignReason: "amount" | "unbound" | null = null;
  if (card.agreement_required) {
    const status = await agreementStatus({ doc: "card", order: order.id });
    if (!status.ok) console.error("[pay-card] agreement lookup failed:", status.reason);
    const g = cardAgreementGate(status, card);
    gate = g.gate;
    if (g.gate === "resign") resignReason = g.reason;
  }

  // The signing link, signed for THIS customer and amount. No key, no link:
  // the page then says "could not check" rather than handing out an unsigned one.
  let signUrl: string | null = null;
  if (gate === "sign" || gate === "resign") {
    const ctx = card.customer_id ? cardAgreementContextToken({ orderId: order.id, customerId: card.customer_id, amountJpy: card.amount_jpy }) : null;
    if (ctx) signUrl = cardSignUrl(order.id, order.web_reference ?? order.invoice_number, card.amount_jpy, lang === "ja" ? "ja" : "en", ctx);
    else {
      console.error("[pay-card] agreement link could not be signed (AGREEMENT_LOOKUP_TOKEN or customer id missing)");
      gate = "unverified";
    }
  }

  if (gate !== "form") {
    const title = gate === "sign" ? t("card", "signTitle") : gate === "resign" ? t("card", "resignTitle") : t("card", "title");
    const lede = gate === "sign" ? t("card", "signLede") : resignReason === "amount" ? t("card", "resignAmount") : t("card", "resignUnbound");
    return (
      <AccountShell lang={lang} current="orders" eyebrow={eyebrow} title={title} back={back}>
        <FullReloadLinks />
        <div className="max-w-[640px] border border-hairline bg-white p-5 sm:p-7" data-testid="card-gate" data-gate={gate}>
          {gate !== "unverified" && signUrl ? (
            <>
              <p className="text-[15px] leading-relaxed text-charcoal/85">{lede}</p>
              <dl className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "amount")}</dt>
                <dd className="cj-fig font-display text-[26px] leading-tight text-charcoal-deep">{amountLabel}</dd>
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={signUrl} className="inline-flex h-12 items-center justify-center bg-charcoal-deep px-6 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]" data-testid="card-sign">{t("card", "signButton")}</a>
                <a href={`${orderPath}/pay-card?signed=1`} className="inline-flex h-12 items-center justify-center border border-charcoal-deep px-6 text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal-deep transition hover:bg-gold-pale/40 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "signedCheck")}</a>
              </div>
            </>
          ) : (
            <>
              <p className="text-[15px] leading-relaxed text-charcoal/85" role="status">{t("card", "unverified")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`${orderPath}/pay-card`} className="inline-flex h-12 items-center justify-center bg-charcoal-deep px-6 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("card", "signedCheck")}</a>
                <Button asChild variant="outline"><Link href="/contact">{t("navMenu", "contact")}</Link></Button>
              </div>
            </>
          )}
        </div>
      </AccountShell>
    );
  }

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const ship = order.ship_to_address;
  // The address half of "billing same as delivery" — no recipient name: the
  // cardholder is named in her own field (owner 4A).
  const delivery: CardDelivery | null = ship && ship.line1
    ? { line1: ship.line1, line2: ship.line2 ?? null, city: ship.city ?? null, region: ship.region ?? null, postal_code: ship.postal_code ?? null, country: ship.country ?? null }
    : null;

  return (
    <AccountShell lang={lang} current="orders" eyebrow={eyebrow} title={t("card", "title")} back={back}>
      <FullReloadLinks />
      <div className="max-w-[640px]">
        {/* Keyed on the Hub's amount: if it changes, a refresh draws a fresh form for the new figure. */}
        <CardPay key={card.amount_jpy} orderId={order.id} card={card} delivery={delivery} amountLabel={amountLabel} lang={lang} nonce={nonce} />
      </div>
    </AccountShell>
  );
}
