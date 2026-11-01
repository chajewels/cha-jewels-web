import Link from "next/link";
import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hub } from "@/lib/hub-api";
import { REGISTERED_PATH, isAlreadyRegistered, isNotLinked, isProfileRequired, profileUrl, withQuery } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { JoinButton } from "@/components/loyalty/join-button";
import { MemberGroups } from "@/components/loyalty/member-groups";
import { loyaltyGroups } from "@/lib/settings";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

export const generateMetadata = () => pageMeta("join");
export const dynamic = "force-dynamic";

export default async function JoinPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [lang, query] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  // Owner-editable in the Hub; falls back to lib/social.ts. Resolved here
  // because JoinButton is a client component and lib/settings.ts is server-only.
  const groups = await loyaltyGroups();

  // middleware gates /loyalty/join, but a page that reads customer state must
  // not depend on it: the gate decides what to render, the Hub decides what is
  // allowed. Same split as /checkout.
  const supabase = await supabaseServer();
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let enrolled = false;
  if (jwt) {
    // A customer who has never opened /account has no customers row yet, so
    // link first. authCustomer is idempotent. No customer for her email → the
    // profile step, then back here; her details match an existing customer →
    // the notice. Any other failure: /me below reports it, as before.
    let link: "ok" | "profile" | "registered" = "ok";
    try { await hub.authCustomer(jwt); } catch (e) {
      link = isProfileRequired(e) ? "profile" : isAlreadyRegistered(e) ? "registered" : "ok";
    }
    // redirect() throws, so these stay outside the catch.
    const here = withQuery("/loyalty/join", query);
    if (link === "profile") redirect(profileUrl(here));
    if (link === "registered") redirect(REGISTERED_PATH);
    let notLinked = false;
    try {
      const me = await hub.me(jwt);
      enrolled = me.loyalty?.enrolled === true;
    } catch (e) {
      // 404 not_linked: no customer record to enrol — the profile step.
      // Anything else unreadable falls through to the button — join is idempotent.
      notLinked = isNotLinked(e);
    }
    if (notLinked) redirect(profileUrl(here));
  }

  return (
    <>
      <PageHead eyebrow={t("nav", "loyalty")} title={t("loyalty", "joinH")} lead={<>{t("loyalty", "joinP")}<br /><span className="opacity-90">{t("loyalty", "lede")}</span></>} />
      <PageSection tone="sheet">
        <div className="icm-join">
          {!jwt ? (
            // middleware should have redirected already; if it somehow did not,
            // offer the way in rather than a button that cannot work.
            <div className="icm-join__card grid gap-4 text-sm">
              <Button asChild><Link href="/login?next=/loyalty/join">{t("loyalty", "submit")}</Link></Button>
            </div>
          ) : enrolled ? (
            // Known member: no button at all. Asking someone to join a programme
            // they are already in is the mistake worth spending a /me call on.
            <div className="icm-join__card text-charcoal-deep">
              {t("loyalty", "alreadyMember")}{" "}
              <Link href="/account" className="underline hover:text-charcoal-deep">{t("nav", "account")}</Link>
              <MemberGroups items={groups} lang={lang} className="mt-6 border-t border-hairline pt-5" />
            </div>
          ) : (
            <JoinButton lang={lang} groups={groups} />
          )}
        </div>
      </PageSection>
    </>
  );
}
