import { pageMeta } from "@/lib/page-meta";
import { LegalArticles } from "@/components/site/legal-articles";
import { getLang } from "@/lib/i18n-server";
import { legalTitles, privacyArticles, privacyUpdated } from "@/lib/content/legal";

export const generateMetadata = () => pageMeta("privacy");

export default async function PrivacyPage() {
  // Follows the language toggle like every other page: the selected language,
  // end to end. Content and the caveats on it live in lib/content/legal.ts.
  const lang = await getLang();
  return (
    <LegalArticles
      lang={lang}
      title={legalTitles.privacy}
      updated={privacyUpdated}
      articles={privacyArticles}
    />
  );
}
