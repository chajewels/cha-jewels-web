import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hubMe } from "@/lib/session";
import type { HubMe } from "@/lib/types";
import { alertLight } from "@/lib/form-classes";

export const generateMetadata = () => pageMeta("addresses");
export const dynamic = "force-dynamic";

/**
 * The customer's saved addresses, as the Hub holds them. READ-ONLY: the only
 * write path in the whole site is checkout's saveAddressAction, which appends
 * one and makes it the default. There is no edit, delete or set-default here or
 * anywhere else, and the page copy says so rather than implying otherwise.
 */
export default async function AddressesPage() {
  const lang = await getLang();
  const t = tr(lang);
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/addresses");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let me: HubMe | null = null;
  let failed = false;
  if (jwt) {
    try { me = await hubMe(jwt); } catch { failed = true; }
  } else {
    failed = true;
  }

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[900px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("account", "addressesH")}</h1>
          <Link href="/account" className="text-sm text-charcoal/70 underline underline-offset-4">{t("account", "h1")}</Link>
        </div>
        <p className="mt-4 max-w-[58ch] text-charcoal">{t("account", "addressesP")}</p>

        {failed && (
          <p className={`mt-8 ${alertLight} p-5 text-sm`}>{t("account", "unavailable")}</p>
        )}

        {me && me.addresses.length === 0 && <p className="mt-10 text-charcoal">{t("account", "noAddresses")}</p>}

        {me && me.addresses.length > 0 && (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {me.addresses.map((a, i) => (
              <li key={a.id ?? i} className="border border-hairline p-4 text-sm text-charcoal">
                {a.is_default && <span className="mb-2 inline-block border border-gold-dark px-2 py-0.5 text-[11px] text-gold-dark">{t("account", "default")}</span>}
                <p>{a.recipient_name ?? me.customer.full_name}</p>
                <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                <p>{[a.city, a.region, a.postal_code].filter(Boolean).join(" ")}</p>
                <p className="text-charcoal/70">{a.country}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
