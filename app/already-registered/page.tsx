import Link from "next/link";
import { localePath } from "@/lib/locale";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EndSessionOnMount } from "@/components/account/end-session-on-mount";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

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
    <div className="iac-shell">
      <PageHead title={t("profile", "registeredH")} />
      <PageSection>
        <div role="status" className="iac-solo iac-plate iac-sheet lm-rise">
          <p className="text-charcoal-deep">{t("profile", "registeredP")}</p>
          <p className="mt-3 text-sm text-charcoal/70">{t("profile", "registeredSignedOut")}</p>
          <Button asChild className="mt-6"><Link href={localePath("/contact", lang)}>{t("profile", "contactCta")}</Link></Button>
        </div>
        <EndSessionOnMount />
      </PageSection>
    </div>
  );
}
