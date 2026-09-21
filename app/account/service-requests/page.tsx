import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { newestFirst } from "@/lib/service-requests";
import type { ServiceRequest } from "@/lib/types";
import { ServiceRequestRow } from "@/components/account/service-request-row";
import { alertLight } from "@/lib/form-classes";

export const generateMetadata = () => pageMeta("serviceRequests");
export const dynamic = "force-dynamic";

/**
 * Every service request this customer has raised, newest first, each linking
 * back to the order or plan it came from. Requests are RAISED on those pages,
 * next to the piece; this page only reads.
 */
export default async function ServiceRequestsPage() {
  const lang = await getLang();
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/service-requests");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let requests: ServiceRequest[] = [];
  let failed = false;
  if (jwt) {
    try { requests = newestFirst(await hub.serviceRequests(jwt)); } catch { failed = true; }
  } else {
    failed = true;
  }

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[900px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("service", "h1")}</h1>
          <Link href="/account" className="text-sm text-charcoal/70 underline underline-offset-4">{t("account", "h1")}</Link>
        </div>
        <p className="mt-4 max-w-[62ch] text-charcoal">{t("service", "lede")}</p>

        {failed && (
          <p className={`mt-8 ${alertLight} p-5 text-sm`}>{t("account", "unavailable")}</p>
        )}

        {!failed && requests.length === 0 && (
          <p className="mt-10 text-charcoal">
            {t("service", "empty")}{" "}
            <Link href="/account/orders" className="text-gold-dark underline underline-offset-4">{t("orders", "h1")}</Link>
            {" · "}
            <Link href="/account/layaway" className="text-gold-dark underline underline-offset-4">{t("plans", "h1")}</Link>
          </p>
        )}

        {requests.length > 0 && (
          <ul className="rule-grid mt-10 grid gap-px">
            {requests.map((r) => <ServiceRequestRow key={r.id} request={r} lang={lang} showTarget />)}
          </ul>
        )}
      </div>
    </section>
  );
}
