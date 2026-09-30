import { pageMeta } from "@/lib/page-meta";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hubMe } from "@/lib/session";
import { isNotLinked, profileUrl, withQuery } from "@/lib/profile";
import type { HubMe } from "@/lib/types";
import { alertLight } from "@/lib/form-classes";
import { AccountShell } from "@/components/account/account-shell";

export const generateMetadata = () => pageMeta("addresses");
export const dynamic = "force-dynamic";

/**
 * The customer's saved addresses, as the Hub holds them. READ-ONLY: the only
 * write path in the whole site is checkout's saveAddressAction, which appends
 * one and makes it the default. There is no edit, delete or set-default here or
 * anywhere else, and the page copy says so rather than implying otherwise.
 */
export default async function AddressesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [lang, query] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/addresses");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let me: HubMe | null = null;
  let failed = false;
  let notLinked = false;
  if (jwt) {
    try { me = await hubMe(jwt); } catch (e) {
      // 404 not_linked = no customer record yet: the profile step, not a dead end.
      if (isNotLinked(e)) notLinked = true;
      else failed = true;
    }
  } else {
    failed = true;
  }
  if (notLinked) redirect(profileUrl(withQuery("/account/addresses", query)));

  return (
    <AccountShell lang={lang} current="addresses" eyebrow={t("accountMenu", "addresses")} title={t("account", "addressesH")}>
      <p className="mb-6 max-w-[62ch] text-[15px] leading-relaxed text-charcoal-deep">{t("account", "addressesP")}</p>

      {failed && <p className={`mb-6 ${alertLight} p-5 text-sm`}>{t("account", "unavailable")}</p>}

      {me && me.addresses.length === 0 && <p className="border border-hairline bg-white p-5 text-charcoal-deep">{t("account", "noAddresses")}</p>}

      {me && me.addresses.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {me.addresses.map((a, i) => (
            <li key={a.id ?? i} className="border border-hairline bg-white p-5 text-sm leading-relaxed text-charcoal-deep">
              {a.is_default && <span className="mb-2 inline-block border border-gold-dark px-2 py-0.5 text-[11px] text-gold-dark">{t("account", "default")}</span>}
              <p className="font-medium">{a.recipient_name ?? me.customer.full_name}</p>
              <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
              <p>{[a.city, a.region, a.postal_code].filter(Boolean).join(" ")}</p>
              <p className="text-charcoal/75">{a.country}</p>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
