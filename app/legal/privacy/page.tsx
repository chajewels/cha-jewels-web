import { pageMeta } from "@/lib/page-meta";
import { LegalArticles } from "@/components/site/legal-articles";
import { getLang } from "@/lib/i18n-server";
import { legalArticlesFor, legalTitles, privacyArticles, privacyUpdated } from "@/lib/content/legal";
import { layawayOffered } from "@/lib/layaway-availability";

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
      // Through the same filter as terms and returns, so a layaway-only article
      // added here later is dropped on the Japanese site too.
      articles={legalArticlesFor(privacyArticles, layawayOffered(lang))}
    />
  );
}
