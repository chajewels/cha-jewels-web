import { pageMeta } from "@/lib/page-meta";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import { REGISTERED_PATH, isAlreadyRegistered, profileNext, profileUrl } from "@/lib/profile";
import { CompleteProfileForm } from "@/components/account/complete-profile-form";

export const generateMetadata = () => pageMeta("completeProfile");
export const dynamic = "force-dynamic";

/**
 * "Complete your profile" — where a signed-in customer lands when the Hub
 * holds no customer for her email (422 profile_required from any caller of
 * hub.authCustomer, or a /me 404 on /account).
 *
 * Before showing the form it settles whether the form is needed at all, so a
 * stale or shared link never asks a linked customer to register again:
 *   /me answers                → already linked: straight on to `next`.
 *   /me 404, link by email ok  → a customer held her email: on to `next`.
 *   409 already_registered     → the notice page.
 *   422 profile_required, or anything unreadable → the form. A Hub error is
 *                                 not a reason to hide the form; submitting
 *                                 it reports the failure with its reference.
 *
 * Under /account, so middleware sends a signed-out visitor to /login with
 * `next` back here; the check below repeats that because the gate decides what
 * to render and nothing more.
 */
export default async function CompleteProfilePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [lang, sp] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  const next = profileNext(sp.next);
  const self = profileUrl(next);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect(`/login?next=${encodeURIComponent(self)}`);
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let outcome: "form" | "linked" | "registered" = "form";
  if (jwt) {
    try {
      await hub.me(jwt);
      outcome = "linked";
    } catch (e) {
      if (e instanceof HubError && e.status === 404) {
        try {
          await hub.authCustomer(jwt);
          // Confirm before leaving: a link the Hub reports but /me cannot read
          // would send her back here from /account, round and round.
          await hub.me(jwt);
          outcome = "linked";
        } catch (linkErr) {
          if (isAlreadyRegistered(linkErr)) outcome = "registered";
        }
      }
    }
  }
  // redirect() throws, so both stay outside the try/catch above.
  if (outcome === "linked") redirect(next);
  if (outcome === "registered") redirect(REGISTERED_PATH);

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[760px]">
        <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("profile", "h1")}</h1>
        <p className="mt-4 max-w-[58ch] text-charcoal">{t("profile", "lede")}</p>
        <CompleteProfileForm lang={lang} email={auth.user.email ?? ""} next={next} />
      </div>
    </section>
  );
}
