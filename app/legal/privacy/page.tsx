import { pageMeta } from "@/lib/page-meta";
import { LegalArticles, legalToc } from "@/components/site/legal-articles";
import { LegalFrame } from "@/components/site/legal-frame";
import { getLang } from "@/lib/i18n-server";
import { legalArticlesFor, legalTitles, privacyArticles, privacyUpdated } from "@/lib/content/legal";
import { layawayOffered } from "@/lib/layaway-availability";

export const generateMetadata = () => pageMeta("privacy");

export default async function PrivacyPage() {
  // Follows the language toggle like every other page: the selected language,
  // end to end. Content and the caveats on it live in lib/content/legal.ts.
  const lang = await getLang();
  // Through the same filter as terms and returns, so a layaway-only article
  // added here later is dropped on the Japanese site too.
  const articles = legalArticlesFor(privacyArticles, layawayOffered(lang));
  return (
    <LegalFrame lang={lang} page="privacy" title={legalTitles.privacy[lang]} updated={privacyUpdated[lang]} toc={legalToc(articles, lang)}>
      <LegalArticles lang={lang} articles={articles} />
    </LegalFrame>
  );
}
