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
          <Button asChild className="mt-8"><Link href="/collections">{t("draft", "shop")}</Link></Button>
        </div>
      </section>
    );
  }

  const address = draft.ship_to_address;
  const ownRequests = requests.filter((r) => r.draft_id === draft.id);

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[720px]">
        <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("draft", isLayaway ? "layawayH1" : "h1")}</h1>
        <p className="mt-4 text-charcoal">{t("draft", isLayaway ? "layawayLede" : "lede")}</p>

        <dl className="rule-grid mt-10 grid gap-px sm:grid-cols-2">
          <Cell k={t("draft", "reference")} v={draft.web_reference} mono />
          <Cell k={t("draft", "totalSoFar")} v={money(draft.total)} />
          <Cell k={t("draft", "shipping")} v={draft.shipping_pending || draft.shipping === null ? t("draft", "shippingLater") : money(draft.shipping)} />
          {isLayaway && draft.deposit !== null && <Cell k={t("draft", "deposit")} v={money(draft.deposit)} />}
          {isLayaway && draft.term_months !== null && (
            <Cell k={t("draft", "term")} v={t("draft", "months", { n: String(draft.term_months) })} />
          )}
        </dl>
        <p className="mt-4 text-sm text-charcoal/70">{t("draft", "provisional")}</p>

        {items.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-charcoal/70">{t("draft", "pieces")}</h2>
            <ul className="rule-grid grid gap-px">
              {items.map((line) => (
                <li key={line.id} className="flex flex-wrap items-baseline justify-between gap-4 bg-white p-4 text-sm">
                  <span className="text-charcoal-deep">
                    {orderLineTitle({ title: line.title, title_ja: line.title_ja ?? null }, lang)}
                    {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                  </span>
                  {/* Lines are yen, the price of record: shown on a yen draft only
                      (owner decision D1 — two currencies never share a screen). */}
                  {draft.currency === "JPY" && (
                    <span className="text-charcoal">{formatMoney(Number(line.line_total_jpy), "JPY")}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-8 border border-hairline bg-white px-4 py-3 text-sm text-charcoal-deep">{t("draft", "nothingYet")}</p>

        {/* W2-5: a service on the piece may be asked for now; staff see it on
            the review screen and add the fee before confirming. */}
        <ServiceRequestForm
          lang={lang}
          target={{ draft_id: draft.id }}
          items={items.map((line) => ({ value: line.title, label: orderLineTitle({ title: line.title, title_ja: line.title_ja ?? null }, lang) }))}
          initial={ownRequests}
          canRequest={draft.status === "to_confirm"}
        />

        {address && (
          <div className="mt-10 border border-hairline p-5 text-sm text-charcoal">
            <h2 className="font-display text-lg text-charcoal-deep">{t("draft", "shipTo")}</h2>
            <p className="mt-2">{address.recipient_name ?? "—"}</p>
            <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
            <p>{[address.city, address.region, address.postal_code].filter(Boolean).join(", ")}</p>
            <p>{address.country ?? ""}</p>
          </div>
        )}

        <Button asChild variant="ghost" className="mt-8"><Link href="/account">{t("account", "h1")}</Link></Button>
      </div>
    </section>
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
