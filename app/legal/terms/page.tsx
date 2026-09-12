import { pageMeta } from "@/lib/page-meta";
import { LegalDoc } from "@/components/site/legal-doc";
import { legalTitles, termsSections } from "@/lib/content/legal";

export const generateMetadata = () => pageMeta("terms");

export default function TermsPage() {
  return <LegalDoc title={legalTitles.terms} sections={termsSections} />;
}
