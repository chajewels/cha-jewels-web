import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { orderLineTitle } from "@/lib/catalog-i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { orderStatusLabel, refundLabel } from "@/lib/order-status";
import { StatusBadge } from "@/components/account/status-badge";
import { Button } from "@/components/ui/button";
import { TransferDetails } from "@/components/commerce/transfer-details";

export const generateMetadata = () => pageMeta("order");
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [lang, { id }] = await Promise.all([getLang(), params]);
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/login?next=/account/orders/${id}`);
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  const detail = jwt ? await hub.order(jwt, id).catch(() => null) : null;
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

  const { order, items, transfer_methods: methods } = detail;
  const status = orderStatusLabel(order, lang);
  const address = order.ship_to_address;
  const due = order.transfer_due_at ? new Date(order.transfer_due_at) : null;
  const locale = lang === "ja" ? "ja-JP" : "en-GB";
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });
  const cancelled = order.status === "cancelled" || order.payment_status === "cancelled";
  const refund = refundLabel(order.refund_status, lang);

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[820px]">
        <Link href="/account/orders" className="text-sm text-chalk/55 underline underline-offset-4">{t("orders", "back")}</Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-mono text-[clamp(24px,3vw,38px)] text-gold-pale">{order.web_reference ?? order.invoice_number ?? "—"}</h1>
          <StatusBadge tone={status.tone} text={status.text} />
        </div>

        {/* A Hub-arranged order records its pieces on the invoice, not in this
            table: 153 of the 154 carry no lines and none carries a saved
            address. Rendering an empty list left the page showing a total and
            nothing else. */}
        {items.length === 0 && (
          <p className="mt-10 text-sm text-chalk/70">{t("orders", "arrangedWithUs")}</p>
        )}

        {items.length > 0 && (
        <ul className="rule-grid mt-10 grid gap-px">
          {items.map((line) => (
            <li key={line.id} className="flex flex-wrap items-baseline justify-between gap-4 bg-charcoal p-5">
              <div>
                <p className="text-chalk">{orderLineTitle(line, lang)}</p>
                <p className="mt-1 text-xs text-chalk/55">
                  {line.sku ? `SKU ${line.sku}` : ""}{line.quantity > 1 ? ` · × ${line.quantity}` : ""}
                </p>
              </div>
              <p className="font-display text-xl text-gold-pale">{formatMoney(Number(line.line_total_jpy), order.currency)}</p>
            </li>
          ))}
        </ul>
        )}

        <dl className="mt-6 space-y-2 border-t border-gold pt-4 text-sm">
          {order.shipping_fee != null && Number(order.shipping_fee) > 0 && (
            <Row k={t("checkout", "shipping")} v={formatMoney(Number(order.shipping_fee), order.currency)} />
          )}
          <Row k={t("orders", "total")} v={formatMoney(Number(order.total_amount), order.currency)} />
        </dl>

        {address && (
          <div className="mt-10 border border-rule p-5 text-sm text-chalk/80">
            <h2 className="font-display text-lg text-gold-pale">{t("orders", "shipTo")}</h2>
            <p className="mt-2">{address.recipient_name ?? "—"}</p>
            <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
            <p>{[address.city, address.region, address.postal_code].filter(Boolean).join(" ")}</p>
            <p className="text-chalk/55">{address.country}</p>
          </div>
        )}

        {/* The Hub decided the cancellation and the refund; this block only reports them. */}
        {cancelled && (
          <div className="mt-10 border border-rule p-6 text-sm text-chalk/80">
            <h2 className="font-display text-xl text-gold-pale">{t("orders", "statusCancelled")}</h2>
            <dl className="mt-4 space-y-2">
              {order.cancelled_at && <Row k={t("orders", "cancelledOn")} v={fmtDate(order.cancelled_at)} />}
              {order.cancellation_reason && <Row k={t("orders", "cancelReason")} v={order.cancellation_reason} />}
              {refund && <Row k={t("orders", "refund")} v={refund} />}
            </dl>
            {order.refund_note && <p className="mt-4 whitespace-pre-line text-chalk/55">{order.refund_note}</p>}
          </div>
        )}

        {order.status === "expired" && (
          <p className="mt-10 text-sm text-chalk/55">
            {t("orders", "statusExpired")}{order.expired_at ? ` · ${fmtDate(order.expired_at)}` : ""}
          </p>
        )}

        {order.tracking_number && (
          <p className="mt-6 text-sm text-chalk/75">
            {t("orders", "tracking")} <span className="font-mono text-gold-pale">{order.tracking_number}</span>
          </p>
        )}

        {/* Instructions only while the money is still outstanding. */}
        {order.payment_status === "pending_transfer" && (
          <div className="mt-10">
            <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-chalk/55">
              {t("complete", "instructions")}
            </h2>
            {due && (
              <p className="mb-3 text-sm text-chalk/70">
                {t("complete", "deadline")} {due.toLocaleString(lang === "ja" ? "ja-JP" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
            <TransferDetails methods={methods} lang={lang} />
            {methods.length > 0 && (
              <p className="mt-4 text-sm text-chalk/60">{t("complete", "keepRef")}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-chalk/55">{k}</dt>
      <dd className="text-chalk">{v}</dd>
    </div>
  );
}
