import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { notLinkedProbe, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { orderLineTitle } from "@/lib/catalog-i18n";
import { isAwaitingConfirmation } from "@/lib/reservation";
import { draftStep3Key } from "@/lib/order-display";
import { Button } from "@/components/ui/button";
import { NextSteps } from "@/components/commerce/commerce-ui";
import { ConfirmationActions, ConfirmationLayout, linePicture } from "@/components/commerce/confirmation";
import { MemberGroups } from "@/components/loyalty/member-groups";
import { loyaltyGroups } from "@/lib/settings";

export const generateMetadata = () => pageMeta("complete");
export const dynamic = "force-dynamic";

export default async function CheckoutCompletePage({ params, searchParams }: {
  params: Promise<{ order_id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [lang, { order_id }, groups, query] = await Promise.all([getLang(), params, loyaltyGroups(), searchParams]);
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/login?next=/checkout/complete/${order_id}`);
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  // Read the order back rather than trusting anything passed through the URL —
  // the Hub scopes /orders/:id to the signed-in customer.
  // The order response carries no membership field; `loyalty.enrolled` on
  // GET /me is the one signal. Read alongside the order; a failed /me only
  // hides the member block, never the order.
  // 404 not_linked (no customer record yet) goes to the profile step; 404
  // not_found keeps the "not found" below.
  const link = notLinkedProbe();
  const [detail, me] = jwt
    ? await Promise.all([hub.order(jwt, order_id).catch(link.or(null)), hub.me(jwt).catch(link.or(null))])
    : [null, null];
  if (link.hit) redirect(profileUrl(withQuery(`/checkout/complete/${order_id}`, query)));
  const isMember = me?.loyalty?.enrolled === true;

  if (!detail) {
    return (
      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap max-w-[720px]">
          <h1 className="text-[clamp(28px,3.6vw,44px)]">{t("orders", "notFound")}</h1>
          <Button asChild variant="ghost" className="mt-6"><Link href="/account/orders">{t("orders", "back")}</Link></Button>
        </div>
      </section>
    );
  }

  const { order, items } = detail;
  // TASK S4: this page is the reservation's thank-you only. A confirmed order
  // has its own page — the way to pay, the deadline and every payment state
  // live there — so an old link to this one lands on it.
  if (!isAwaitingConfirmation(order)) redirect(`/account/orders/${order.id}`);
  const money = formatMoney(Number(order.total_amount), order.currency);
  const slabLines = items.map((line) => ({
    key: line.id,
    name: `${orderLineTitle(line, lang)}${line.quantity > 1 ? ` × ${line.quantity}` : ""}`,
    image: linePicture(line.image_url),
    // line_total_jpy is always yen, the price of record: shown on a yen order
    // only. A peso order lists the pieces and gives its total in pesos (D1).
    price: order.currency === "JPY" ? formatMoney(Number(line.line_total_jpy), "JPY") : null,
  }));
  const actions = <ConfirmationActions lang={lang} href={`/account/orders/${order.id}`} label={t("complete", "viewOrder")} />;
  const members = isMember && (
    <div className="mt-10 border border-hairline bg-white p-6">
      <MemberGroups items={groups} lang={lang} />
    </div>
  );

  // RESERVE FIRST (Hub A2). The order read back says whether it is a
  // reservation — the same answer the Hub gives everywhere else, so this page
  // flips with the switch and never on a flag of its own. No bank details, no
  // deadline and no number of hours (D3-8): the deadline arrives with the
  // payment email.
  return (
    <ConfirmationLayout
      lang={lang}
      reference={order.web_reference ?? "—"}
      heading={t("complete", "reservedH1")}
      lede={<>
        <p>{t("complete", "reservedLede")}</p>
        <p className="mt-2 text-[15px] font-semibold">{t("complete", "reservedNoPayment")}</p>
      </>}
      slab={{ title: t("complete", "reservedPieces"), lines: slabLines, rows: [], total: { k: t("complete", "reservedTotal"), v: money } }}
    >
      <NextSteps
        heading={t("complete", "nextH")}
        items={[
          { title: t("complete", "next1"), body: t("complete", "next1p"), now: true },
          { title: t("complete", "next2"), body: t("complete", "next2p") },
          { title: t("complete", draftStep3Key("full", detail.chosen_method ?? undefined)), body: detail.chosen_method === "cod" ? t("complete", "next3CodP") : t("checkout", "deadlineNote") },
          { title: t("complete", detail.chosen_method === "cod" ? "next4Cod" : "next4") },
        ]}
      />
      {actions}
      {members}
    </ConfirmationLayout>
  );
}
