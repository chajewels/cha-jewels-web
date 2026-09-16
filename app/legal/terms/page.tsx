import { pageMeta } from "@/lib/page-meta";
import { LegalArticles } from "@/components/site/legal-articles";
import { getLang } from "@/lib/i18n-server";
import { tosArticles, tosTitle, tosUpdated } from "@/lib/content/legal";

export const generateMetadata = () => pageMeta("terms");

export default async function TermsPage() {
  // The full Terms of Service, thirty-one sections, rendered by the same
  // component as the privacy and returns policies. It REPLACES the seven-
  // section summary this page used to show; what that said and this does not is
  // itemised in the PR.
  //
  // NO LANGUAGE FILTER ANY MORE. The old page dropped its layaway section on
  // `ja` via termsSectionsFor. This document cannot be filtered that way —
  // §11 is one of thirty-one numbered sections and layaway also appears in §2,
  // §14, §16, §22 and §30 — so the Japanese now describes layaway. Flagged for
  // Cynthia rather than decided here; see lib/content/legal.ts on tosTitle.
  const lang = await getLang();
  return <LegalArticles lang={lang} title={tosTitle} updated={tosUpdated} articles={tosArticles} />;
}
