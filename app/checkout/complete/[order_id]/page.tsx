import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TransferDetails } from "@/components/commerce/transfer-details";

export const generateMetadata = () => pageMeta("complete");
export const dynamic = "force-dynamic";

export default async function CheckoutCompletePage({ params }: { params: Promise<{ order_id: string }> }) {
  const [lang, { order_id }] = await Promise.all([getLang(), params]);
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/login?next=/checkout/complete/${order_id}`);
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  // Read the order back rather than trusting anything passed through the URL —
  // the Hub scopes /orders/:id to the signed-in customer.
  const detail = jwt ? await hub.order(jwt, order_id).catch(() => null) : null;

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

  const { order, transfer_methods: methods } = detail;
  const due = order.transfer_due_at ? new Date(order.transfer_due_at) : null;

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[720px]">
        <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("complete", "h1")}</h1>
        <p className="mt-4 text-champagne/80">{t("complete", "lede")}</p>

        <dl className="rule-grid mt-10 grid gap-px sm:grid-cols-3">
          <Cell k={t("complete", "reference")} v={order.web_reference ?? "—"} mono />
          <Cell k={t("complete", "amount")} v={formatMoney(Number(order.total_amount))} />
          <Cell
            k={t("complete", "deadline")}
            v={due ? due.toLocaleString(lang === "ja" ? "ja-JP" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}
          />
        </dl>

        <div className="mt-10">
          <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-champagne/45">
            {t("complete", "instructions")}
          </h2>
          <TransferDetails methods={methods} lang={lang} />
          {methods.length > 0 && (
            <p className="mt-4 text-sm text-champagne/60">{t("complete", "keepRef")}</p>
          )}
        </div>

        <p className="mt-8 text-sm text-champagne/60">{t("checkout", "deadlineNote")}</p>

        <Button asChild className="mt-8"><Link href={`/account/orders/${order.id}`}>{t("complete", "viewOrder")}</Link></Button>
      </div>
    </section>
  );
}

function Cell({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="bg-velvet p-5">
      <dt className="text-xs text-champagne/55">{k}</dt>
      <dd className={`mt-1 text-gold-pale ${mono ? "font-mono text-lg" : "font-display text-xl"}`}>{v}</dd>
    </div>
  );
}
