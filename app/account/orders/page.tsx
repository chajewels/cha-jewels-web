import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { isClosedOrder, orderStatusLabel, refundLabel } from "@/lib/order-status";
import { StatusBadge } from "@/components/account/status-badge";
import type { HubOrder } from "@/lib/types";
import { alertLight } from "@/lib/form-classes";

export const generateMetadata = () => pageMeta("orders");
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const lang = await getLang();
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/orders");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let orders: HubOrder[] = [];
  let failed = false;
  if (jwt) {
    try { orders = await hub.orders(jwt); } catch { failed = true; }
  } else {
    failed = true;
  }

  return (
    <section className="surface-light bg-chalk text-charcoal-deep py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[900px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("orders", "h1")}</h1>
          <Link href="/account" className="text-sm text-charcoal/70 underline underline-offset-4">{t("account", "h1")}</Link>
        </div>

        {failed && (
          <p className={`mt-8 ${alertLight} p-5 text-sm`}>{t("account", "unavailable")}</p>
        )}

        {!failed && orders.length === 0 && <p className="mt-10 text-charcoal">{t("orders", "empty")}</p>}

        {orders.length > 0 && (
          <ul className="rule-grid mt-10 grid gap-px">
            {orders.map((order) => {
              const status = orderStatusLabel(order, lang);
              // A cancelled or expired order stays in the list; the reason and the
              // refund decision sit under its badge so the customer need not open it.
              const closedNote = isClosedOrder(order)
                ? [order.cancellation_reason, refundLabel(order.refund_status, lang)].filter(Boolean).join(" · ")
                : "";
              return (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 bg-white p-5">
                  <div>
                    <p className="font-mono text-gold-dark">{order.web_reference ?? order.invoice_number ?? "—"}</p>
                    <p className="mt-1 text-xs text-charcoal/70">
                      {t("orders", "placed")} {(order.order_date ?? order.created_at).slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge tone={status.tone} text={status.text} surface="light" />
                    {closedNote && <p className="max-w-[36ch] text-xs text-charcoal/70">{closedNote}</p>}
                  </div>
                  {/* #26's rule, which the plan rows already followed and these
                      did not: a closed figure is never gold. Derived from the
                      badge's own tone so the two can never disagree. */}
                  <p className={`font-display text-xl ${status.tone === "dead" ? "text-charcoal/70" : "text-gold-dark"}`}>
                    {formatMoney(Number(order.total_amount), order.currency)}
                  </p>
                  <Link href={`/account/orders/${order.id}`} className="text-sm text-gold-dark underline underline-offset-4">
                    {t("orders", "view")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
