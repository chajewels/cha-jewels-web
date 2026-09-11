import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import type { HubMe } from "@/lib/types";
import { SignOutButton } from "@/components/account/sign-out-button";

export const metadata: Metadata = { title: "アカウント / Account" };
// Customer data is per-request by definition; never cache this page.
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const [lang, sp] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let me: HubMe | null = null;
  let failure: string | null = sp.link === "failed" ? "link" : null;
  if (jwt) {
    try { me = await hub.me(jwt); } catch { failure = failure ?? "hub"; }
  } else {
    failure = failure ?? "session";
  }

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("account", "h1")}</h1>
          <SignOutButton lang={lang} />
        </div>

        {failure && (
          <p className="mt-8 border border-garnet/60 bg-velvet-deep p-5 text-sm text-champagne/85">
            {t("account", "unavailable")}
          </p>
        )}

        {me && (
          <div className="rule-grid mt-10 grid gap-px md:grid-cols-2">
            <div className="bg-velvet p-6">
              <h2 className="font-display text-xl text-gold-pale">{t("account", "profile")}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k={t("account", "name")} v={me.customer.full_name ?? "—"} />
                <Row k={t("account", "email")} v={me.customer.email ?? "—"} />
                <Row k={t("account", "code")} v={me.customer.customer_code ?? "—"} />
              </dl>
            </div>

            <div className="bg-velvet p-6">
              <h2 className="font-display text-xl text-gold-pale">{t("account", "loyalty")}</h2>
              {me.loyalty.enrolled ? (
                <dl className="mt-4 space-y-2 text-sm">
                  <Row k={t("account", "tier")} v={me.loyalty.tier ?? "—"} />
                  <Row k={t("account", "points")} v={me.loyalty.points.toLocaleString()} />
                  <Row k={t("loyalty", "multiplier")} v={me.loyalty.multiplier === null ? "—" : lang === "ja" ? `${me.loyalty.multiplier}倍` : `${me.loyalty.multiplier}x`} />
                </dl>
              ) : (
                <p className="mt-4 text-sm text-champagne/75">
                  {t("account", "notEnrolled")}{" "}
                  <Link href="/loyalty" className="underline hover:text-gold-pale">{t("nav", "loyalty")}</Link>
                </p>
              )}
            </div>

            <div className="bg-velvet p-6 md:col-span-2">
              <h2 className="font-display text-xl text-gold-pale">{t("account", "addresses")}</h2>
              {me.addresses.length === 0 ? (
                <p className="mt-4 text-sm text-champagne/75">{t("account", "noAddresses")}</p>
              ) : (
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {me.addresses.map((a, i) => (
                    <li key={a.id ?? i} className="border border-rule p-4 text-sm text-champagne/80">
                      {a.is_default && <span className="mb-2 inline-block border border-gold px-2 py-0.5 text-[11px] text-gold-pale">{t("account", "default")}</span>}
                      <p>{a.recipient_name ?? me.customer.full_name}</p>
                      <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                      <p>{[a.city, a.region, a.postal_code].filter(Boolean).join(" ")}</p>
                      <p className="text-champagne/55">{a.country}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Orders landed in step 2. Layaway plans arrive in step 4. */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/account/orders" className="text-gold-pale underline underline-offset-4">{t("orders", "h1")}</Link>
          <span className="text-sm text-champagne/55">{t("account", "soon")}</span>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
      <dt className="text-champagne/55">{k}</dt>
      <dd className="text-right text-champagne">{v}</dd>
    </div>
  );
}
