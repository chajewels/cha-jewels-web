import { pageMeta } from "@/lib/page-meta";
import { LegalArticles } from "@/components/site/legal-articles";
import { getLang } from "@/lib/i18n-server";
import { legalArticlesFor, tosArticles, tosTitle, tosUpdated } from "@/lib/content/legal";
import { layawayOffered } from "@/lib/layaway-availability";

export const generateMetadata = () => pageMeta("terms");

export default async function TermsPage() {
  // The full Terms of Service, thirty-one sections, rendered by the same
  // component as the privacy and returns policies. It REPLACES the seven-
  // section summary this page used to show; what that said and this does not is
  // itemised in the PR.
  //
  // NO LAYAWAY ON THE JAPANESE SITE (owner decision 2026-09-25, final). The
  // layaway article (§11) is dropped on `ja` and the rest renumbered 1–30; the
  // layaway mentions in the other sections were removed from the Japanese text
  // itself. See legalArticlesFor in lib/content/legal.ts.
  const lang = await getLang();
  return <LegalArticles lang={lang} title={tosTitle} updated={tosUpdated} articles={legalArticlesFor(tosArticles, layawayOffered(lang))} />;
}
