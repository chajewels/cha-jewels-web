import Link from "next/link";
import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { Button } from "@/components/ui/button";
import { JoinButton } from "@/components/loyalty/join-button";

export const generateMetadata = () => pageMeta("join");
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const lang = await getLang();
  const t = tr(lang);

  // middleware gates /loyalty/join, but a page that reads customer state must
  // not depend on it: the gate decides what to render, the Hub decides what is
  // allowed. Same split as /checkout.
  const supabase = await supabaseServer();
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let enrolled = false;
  if (jwt) {
    // A customer who has never opened /account has no customers row yet, so
    // link first. authCustomer is idempotent.
    try { await hub.authCustomer(jwt); } catch { /* /me below reports the failure */ }
    try {
      const me = await hub.me(jwt);
      enrolled = me.loyalty?.enrolled === true;
    } catch { /* unreadable /me falls through to the button — join is idempotent */ }
  }

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap grid gap-12 md:grid-cols-2">
        <div><h1 className="text-[clamp(36px,5.5vw,80px)]">{t("loyalty", "joinH")}</h1><p className="mt-5 max-w-[48ch] text-chalk/80">{t("loyalty", "joinP")}</p><p className="mt-4 max-w-[48ch] text-chalk/60">{t("loyalty", "lede")}</p></div>
        {!jwt ? (
          // middleware should have redirected already; if it somehow did not,
          // offer the way in rather than a button that cannot work.
          <div className="grid gap-4 border border-gold bg-charcoal-deep p-6 text-sm">
            <Button asChild><Link href="/login?next=/loyalty/join">{t("loyalty", "submit")}</Link></Button>
          </div>
        ) : enrolled ? (
          // Known member: no button at all. Asking someone to join a programme
          // they are already in is the mistake worth spending a /me call on.
          <div className="border border-gold bg-charcoal-deep p-6 text-gold-pale">
            {t("loyalty", "alreadyMember")}{" "}
            <Link href="/account" className="underline hover:text-chalk">{t("nav", "account")}</Link>
          </div>
        ) : (
          <JoinButton lang={lang} />
        )}
      </div>
    </section>
  );
}
