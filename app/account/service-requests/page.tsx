import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isNotLinked, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { layawayOffered } from "@/lib/layaway-availability";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { newestFirst } from "@/lib/service-requests";
import type { ServiceRequest } from "@/lib/types";
import { ServiceRequestRow } from "@/components/account/service-request-row";
import { alertLight } from "@/lib/form-classes";
import { AccountShell } from "@/components/account/account-shell";

export const generateMetadata = () => pageMeta("serviceRequests");
export const dynamic = "force-dynamic";

/**
 * Every service request this customer has raised, newest first, each linking
 * back to the order or plan it came from. Requests are RAISED on those pages,
 * next to the piece; this page only reads.
 */
export default async function ServiceRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [lang, query] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/service-requests");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let requests: ServiceRequest[] = [];
  let failed = false;
  if (jwt) {
    try { requests = newestFirst(await hub.serviceRequests(jwt)); } catch (e) {
      // Signed in, no customer record yet: the profile step, not an error.
      if (isNotLinked(e)) redirect(profileUrl(withQuery("/account/service-requests", query)));
      failed = true;
    }
  } else {
    failed = true;
  }

  return (
    <AccountShell lang={lang} current="service" eyebrow={t("accountMenu", "service")} title={t("service", "h1")}>
      <p className="mb-6 max-w-[62ch] text-[15px] leading-relaxed text-charcoal-deep">{t("service", "lede")}</p>

      {failed && <p className={`mb-6 ${alertLight} p-5 text-sm`}>{t("account", "unavailable")}</p>}

      {!failed && requests.length === 0 && (
        <p className="border border-hairline bg-white p-5 text-charcoal-deep">
          {t("service", "empty")}{" "}
          <Link href="/account/orders" className="text-gold-dark underline underline-offset-4">{t("orders", "h1")}</Link>
          {layawayOffered(lang) && (
            <>
              {" · "}
              <Link href="/account/layaway" className="text-gold-dark underline underline-offset-4">{t("plans", "h1")}</Link>
            </>
          )}
        </p>
      )}

      {requests.length > 0 && (
        <ul className="rule-grid grid gap-px border border-hairline">
          {requests.map((r) => <ServiceRequestRow key={r.id} request={r} lang={lang} showTarget />)}
        </ul>
      )}
    </AccountShell>
  );
}
