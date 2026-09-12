import { pageMeta } from "@/lib/page-meta";
import { LegalDoc } from "@/components/site/legal-doc";
import { legalTitles, privacySections } from "@/lib/content/legal";

export const generateMetadata = () => pageMeta("privacy");

export default function PrivacyPage() {
  return <LegalDoc title={legalTitles.privacy} sections={privacySections} />;
}
