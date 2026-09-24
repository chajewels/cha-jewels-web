import Link from "next/link";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EndSessionOnMount } from "@/components/account/end-session-on-mount";

export const generateMetadata = () => pageMeta("registered");
export const dynamic = "force-dynamic";

/**
 * Shown when the Hub answers 409 already_registered: the details she signed up
 * with match a customer Cha Jewels already holds (full name, Facebook name,
 * mobile or email), so nothing was created and staff were notified. The
 * English sentence is the owner's wording, verbatim.
 *
 * Public on purpose — NOT under /account. She is signed out here (see
 * EndSessionOnMount); a gated path would bounce her to /login instead of
 * telling her why. The way forward is the site's existing contact page.
 */
export default async function AlreadyRegisteredPage() {
  const lang = await getLang();
  const t = tr(lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[720px]">
        <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("profile", "registeredH")}</h1>
        <div role="status" className="mt-8 border border-hairline bg-white p-6">
          <p className="text-charcoal-deep">{t("profile", "registeredP")}</p>
          <p className="mt-3 text-sm text-charcoal/70">{t("profile", "registeredSignedOut")}</p>
          <Button asChild className="mt-6"><Link href="/contact">{t("profile", "contactCta")}</Link></Button>
        </div>
        <EndSessionOnMount />
      </div>
    </section>
  );
}
