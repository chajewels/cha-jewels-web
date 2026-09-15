import { pageMeta } from "@/lib/page-meta";
import { LegalDoc } from "@/components/site/legal-doc";
import { getLang } from "@/lib/i18n-server";
import { legalTitles, termsSectionsFor } from "@/lib/content/legal";

export const generateMetadata = () => pageMeta("terms");

export default async function TermsPage() {
  // Sections depend on the language now: the layaway section is dropped where
  // layaway is not offered (owner decision 2026-09-15). See termsSectionsFor.
  const lang = await getLang();
  return <LegalDoc title={legalTitles.terms} sections={termsSectionsFor(lang)} />;
}
