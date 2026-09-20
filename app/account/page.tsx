import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hubMe } from "@/lib/session";
import type { HubMe } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { SignOutButton } from "@/components/account/sign-out-button";

export const generateMetadata = () => pageMeta("account");
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
    try { me = await hubMe(jwt); } catch { failure = failure ?? "hub"; }
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
          <p className="mt-8 border border-garnet-light/60 bg-charcoal-deep p-5 text-sm text-chalk/85">
            {t("account", "unavailable")}
          </p>
        )}

        {me && (
          <div className="rule-grid mt-10 grid gap-px md:grid-cols-2">
            <div className="bg-charcoal p-6">
              <h2 className="font-display text-xl text-gold-pale">{t("account", "profile")}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k={t("account", "name")} v={me.customer.full_name ?? "—"} />
                <Row k={t("account", "email")} v={me.customer.email ?? "—"} />
                <Row k={t("account", "code")} v={me.customer.customer_code ?? "—"} />
              </dl>
            </div>

            <div id="loyalty" className="bg-charcoal p-6">
              <h2 className="font-display text-xl text-gold-pale">{t("account", "loyalty")}</h2>
              {me.loyalty.enrolled ? (
                <>
                  <dl className="mt-4 space-y-2 text-sm">
                    <Row k={t("account", "tier")} v={me.loyalty.tier ?? "—"} />
                    <Row k={t("account", "points")} v={me.loyalty.points.toLocaleString()} />
                    <Row k={t("loyalty", "multiplier")} v={me.loyalty.multiplier === null ? "—" : t("loyalty", "times", { n: String(me.loyalty.multiplier) })} />
                  </dl>
                  {me.loyalty.reduced === true && (
                    <div className="mt-4 border border-garnet-light/60 bg-charcoal-deep p-4 text-sm" data-testid="level-reduced">
                      <p className="font-display text-base text-gold-pale">{t("account", "levelReduced")}</p>
                      <p className="mt-1 text-chalk/75">{t("account", "levelReducedP")}</p>
                      <dl className="mt-3 space-y-2">
                        {me.loyalty.earned_tier && <Row k={t("account", "earnedLevel")} v={me.loyalty.earned_tier} />}
                        {typeof me.loyalty.regain_jpy === "number" && <Row k={t("account", "regain")} v={formatMoney(me.loyalty.regain_jpy, "JP")} />}
                      </dl>
                    </div>
                  )}
                  <p className="mt-4 text-xs text-chalk/55">
                    {t("account", "levelRule")}{" "}
                    <Link href="/loyalty" className="underline hover:text-gold-pale">{t("nav", "loyalty")}</Link>
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-chalk/75">
                  {t("account", "notEnrolled")}{" "}
                  <Link href="/loyalty" className="underline hover:text-gold-pale">{t("nav", "loyalty")}</Link>
                </p>
              )}
            </div>

            <div className="bg-charcoal p-6 md:col-span-2">
              <h2 className="font-display text-xl text-gold-pale">{t("account", "addresses")}</h2>
              {me.addresses.length === 0 ? (
                <p className="mt-4 text-sm text-chalk/75">{t("account", "noAddresses")}</p>
              ) : (
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {me.addresses.map((a, i) => (
                    <li key={a.id ?? i} className="border border-rule p-4 text-sm text-chalk/80">
                      {a.is_default && <span className="mb-2 inline-block border border-gold px-2 py-0.5 text-[11px] text-gold-pale">{t("account", "default")}</span>}
                      <p>{a.recipient_name ?? me.customer.full_name}</p>
                      <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                      <p>{[a.city, a.region, a.postal_code].filter(Boolean).join(" ")}</p>
                      <p className="text-chalk/55">{a.country}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/*
          A SIGN-IN THAT FINDS NOTHING SAYS SO (2026-09-15).
          `records` counts this customer's orders and plans in the Hub. Zero has
          two quite different causes and they need different advice: a new
          customer, or a customer whose history sits on a second record carrying
          the same email — eight such addresses exist, and six of them resolve
          to the record WITHOUT the plan. That case used to render as an account
          page with nothing on it and no explanation at all. The Hub also raises
          a staff notification for it, because the customer cannot fix the data
          and staff can.
        */}
        {me?.records && me.records.layaway === 0 && me.records.orders === 0 && (
          <p className="mt-10 border border-gold/60 bg-charcoal-deep p-5 text-sm text-chalk/85">
            {me.shares_email ? t("account", "noRecordsShared") : t("account", "noRecords")}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/account/orders" className="text-gold-pale underline underline-offset-4">{t("orders", "h1")}</Link>
          <Link href="/account/layaway" className="text-gold-pale underline underline-offset-4">{t("plans", "h1")}</Link>
          <Link href="/account/service-requests" className="text-gold-pale underline underline-offset-4">{t("service", "h1")}</Link>
          <span className="text-sm text-chalk/55">{t("account", "soon")}</span>
        </div>

        {/* What the other surface is for. Every action a customer can take on
            their account still lives in the portal; this site shows and sells.
            The link is the Hub's own builder, so a legacy customer gets their
            token and everyone else gets the bare URL. */}
        {me?.portal_url && (
          <div className="mt-10 border border-rule bg-charcoal p-6">
            <h2 className="font-display text-xl text-gold-pale">{t("account", "portalH")}</h2>
            <p className="mt-2 max-w-[62ch] text-sm text-chalk/75">{t("account", "portalP")}</p>
            <a
              href={me.portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-gold-pale underline underline-offset-4"
            >
              {t("plans", "portalCta")}
            </a>
            <p className="mt-3 text-xs text-chalk/55">{t("plans", "portalFallback")}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
      <dt className="text-chalk/55">{k}</dt>
      <dd className="text-right text-chalk">{v}</dd>
    </div>
  );
}
