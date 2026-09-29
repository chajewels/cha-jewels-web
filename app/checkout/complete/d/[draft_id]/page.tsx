import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { notLinkedProbe, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { orderLineTitle } from "@/lib/catalog-i18n";
import { confirmedDestination } from "@/lib/drafts";
import { layawayOffered } from "@/lib/layaway-availability";
import { Button } from "@/components/ui/button";
import { ServiceRequestForm } from "@/components/account/service-request-form";
import { NextSteps } from "@/components/commerce/commerce-ui";
import { ConfirmationActions, ConfirmationLayout, linePicture } from "@/components/commerce/confirmation";
import type { ServiceRequest } from "@/lib/types";

/**
 * WEBSITE ORDERS (Hub PR 6 / storefront PR 7) — a checkout the Hub holds as a
 * DRAFT until staff confirm the piece.
 *
 * - Waiting: what was ordered, the provisional figures, "nothing to pay yet",
 *   and the service request form (W2-5). No bank details, no deadline.
 * - Confirmed: permanently redirects to the real order or plan (W2-9), so the
 *   link in the "we have your order" email keeps working.
 * - Declined / expired: says what happened; nothing was ever charged.
 *
 * Every figure is the Hub's (settlement currency). A LAYAWAY draft is not found
 * on the Japanese site — nothing layaway-related shows there (owner rule).
 */
export const generateMetadata = () => pageMeta("complete");
export const dynamic = "force-dynamic";

export default async function DraftCompletePage({ params, searchParams }: {
  params: Promise<{ draft_id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [lang, { draft_id }, query] = await Promise.all([getLang(), params, searchParams]);
  const t = tr(lang);
  const here = `/checkout/complete/d/${draft_id}`;

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/login?next=${here}`);
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  // Scoped by the Hub to the signed-in customer: another customer's draft is a 404.
  const link = notLinkedProbe();
  const [detail, requests] = jwt
    ? await Promise.all([
        hub.draft(jwt, draft_id).catch(link.or(null)),
        hub.serviceRequests(jwt).catch(link.or<ServiceRequest[]>([])),
      ])
    : [null, [] as ServiceRequest[]];
  if (link.hit) redirect(profileUrl(withQuery(here, query)));

  if (!detail) {
    return (
      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap max-w-[720px]">
          <h1 className="text-[clamp(28px,3.6vw,44px)]">{t("draft", "notFound")}</h1>
          <Button asChild variant="ghost" className="mt-6"><Link href="/account/orders">{t("orders", "back")}</Link></Button>
        </div>
      </section>
    );
  }

  const { draft, items } = detail;
  const isLayaway = draft.mode === "layaway";
  if (isLayaway && !layawayOffered(lang)) notFound();

  const next = confirmedDestination(draft);
  if (next) redirect(next);

  const money = (n: number) => formatMoney(Number(n), draft.currency);

  if (draft.status === "declined" || draft.status === "expired") {
    const declined = draft.status === "declined";
    return (
      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap max-w-[720px]">
          <h1 className="text-[clamp(28px,3.6vw,44px)]">{t("draft", declined ? "declinedH1" : "expiredH1")}</h1>
          <p className="mt-4 text-charcoal">{t("draft", declined ? "declinedLede" : "expiredLede")}</p>
          <dl className="rule-grid mt-8 grid gap-px sm:grid-cols-2">
            <Cell k={t("draft", "reference")} v={draft.web_reference} mono />
            {declined && draft.decline_reason && <Cell k={t("draft", "reason")} v={draft.decline_reason} />}
          </dl>
          {/* No orange on a confirmation page (D3-10): nothing here buys. */}
          <Button asChild variant="outline" className="mt-8"><Link href="/collections">{t("draft", "shop")}</Link></Button>
        </div>
      </section>
    );
  }

  const address = draft.ship_to_address;
  const ownRequests = requests.filter((r) => r.draft_id === draft.id);
  const layawayNext = isLayaway;

  return (
    <ConfirmationLayout
      lang={lang}
      reference={draft.web_reference}
      heading={t("draft", isLayaway ? "layawayH1" : "h1")}
      lede={<>
        <p>{t("draft", isLayaway ? "layawayLede" : "lede")}</p>
        <p className="mt-2 text-[15px] font-semibold">{t("draft", "nothingYet")}</p>
      </>}
      slab={{
        title: t("draft", "pieces"),
        lines: items.map((line) => ({
          key: line.id,
          name: `${orderLineTitle({ title: line.title, title_ja: line.title_ja ?? null }, lang)}${line.quantity > 1 ? ` × ${line.quantity}` : ""}`,
          image: linePicture(line.image_url),
          // Lines are yen, the price of record: shown on a yen draft only
          // (owner decision D1 — two currencies never share a screen).
          price: draft.currency === "JPY" ? formatMoney(Number(line.line_total_jpy), "JPY") : null,
        })),
        rows: [
          { k: t("draft", "shipping"), v: draft.shipping_pending || draft.shipping === null ? t("draft", "shippingLater") : money(draft.shipping) },
          ...(isLayaway && draft.deposit !== null ? [{ k: t("draft", "deposit"), v: money(draft.deposit) }] : []),
          ...(isLayaway && draft.term_months !== null ? [{ k: t("draft", "term"), v: t("draft", "months", { n: String(draft.term_months) }) }] : []),
        ],
        total: { k: t("draft", "totalSoFar"), v: money(draft.total), sub: t("draft", "provisional") },
      }}
    >
      {/* What happens next. The draft is held (its stock came off when it was
          made); staff confirm it — no "within one business day" here, the
          draft copy never promised a time — then the payment email with the
          Hub's own deadline (D3-8: no number of hours on this page). */}
      <NextSteps
        heading={t("complete", "nextH")}
        items={layawayNext ? [
          { title: t("complete", "next1"), body: t("complete", "next1p"), now: true },
          { title: t("complete", "next2Plain"), body: t("complete", "next2p") },
          { title: t("complete", "next3Layaway"), body: t("checkout", "layawayDeadlineNote") },
          { title: t("complete", "next4Layaway"), body: t("complete", "next4LayawayP") },
        ] : [
          { title: t("complete", "next1"), body: t("complete", "next1p"), now: true },
          { title: t("complete", "next2Plain"), body: t("complete", "next2p") },
          { title: t("complete", "next3"), body: t("checkout", "deadlineNote") },
          { title: t("complete", "next4") },
        ]}
      />

      <ConfirmationActions lang={lang} href="/account/orders" label={t("orders", "back")} />

      {/* W2-5: a service on the piece may be asked for now; staff see it on
          the review screen and add the fee before confirming. */}
      <div className="mt-10">
        <ServiceRequestForm
          lang={lang}
          target={{ draft_id: draft.id }}
          items={items.map((line) => ({ value: line.title, label: orderLineTitle({ title: line.title, title_ja: line.title_ja ?? null }, lang) }))}
          initial={ownRequests}
          canRequest={draft.status === "to_confirm"}
        />
      </div>

      {address && (
        <div className="mt-10 border border-hairline bg-white p-5 text-sm text-charcoal-deep">
          <h2 className="font-display text-lg">{t("draft", "shipTo")}</h2>
          <p className="mt-2">{address.recipient_name ?? "—"}</p>
          <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
          <p>{[address.city, address.region, address.postal_code].filter(Boolean).join(", ")}</p>
          <p>{address.country ?? ""}</p>
        </div>
      )}
    </ConfirmationLayout>
  );
}

function Cell({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="bg-white p-5">
      <dt className="text-xs text-charcoal/70">{k}</dt>
      <dd className={`mt-1 text-gold-dark ${mono ? "font-mono text-lg" : "font-display text-xl"}`}>{v}</dd>
    </div>
  );
}
