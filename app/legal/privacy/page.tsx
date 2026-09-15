import { pageMeta } from "@/lib/page-meta";
import { LegalDoc } from "@/components/site/legal-doc";
import { getLang } from "@/lib/i18n-server";
import { legalTitles, privacySections } from "@/lib/content/legal";

export const generateMetadata = () => pageMeta("privacy");

export default async function PrivacyPage() {
  // The page follows the language toggle: LegalDoc leads with the reader's
  // language and keeps the other below for cross-checking.
  const lang = await getLang();
  return <LegalDoc lang={lang} title={legalTitles.privacy} sections={privacySections} />;
}
