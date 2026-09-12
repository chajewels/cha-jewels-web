import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { orderStatusLabel, toneClass } from "@/lib/order-status";
import type { HubOrder } from "@/lib/types";

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
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[900px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("orders", "h1")}</h1>
          <Link href="/account" className="text-sm text-champagne/60 underline underline-offset-4">{t("account", "h1")}</Link>
        </div>

        {failed && (
          <p className="mt-8 border border-garnet/60 bg-velvet-deep p-5 text-sm text-champagne/85">{t("account", "unavailable")}</p>
        )}

        {!failed && orders.length === 0 && <p className="mt-10 text-champagne/75">{t("orders", "empty")}</p>}

        {orders.length > 0 && (
          <ul className="rule-grid mt-10 grid gap-px">
            {orders.map((order) => {
              const status = orderStatusLabel(order, lang);
              return (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 bg-velvet p-5">
                  <div>
                    <p className="font-mono text-gold-pale">{order.web_reference ?? order.invoice_number ?? "—"}</p>
                    <p className="mt-1 text-xs text-champagne/55">
                      {t("orders", "placed")} {(order.order_date ?? order.created_at).slice(0, 10)}
                    </p>
                  </div>
                  <span className={`border px-3 py-1 text-xs ${toneClass(status.tone)}`}>{status.text}</span>
                  <p className="font-display text-xl text-gold-pale">{formatMoney(Number(order.total_amount))}</p>
                  <Link href={`/account/orders/${order.id}`} className="text-sm text-gold-pale underline underline-offset-4">
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
