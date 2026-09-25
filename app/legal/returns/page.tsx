import { pageMeta } from "@/lib/page-meta";
import { LegalArticles } from "@/components/site/legal-articles";
import { getLang } from "@/lib/i18n-server";
import { legalArticlesFor, returnsArticles, returnsIntro, returnsTitle, returnsUpdated } from "@/lib/content/legal";
import { layawayOffered } from "@/lib/layaway-availability";

export const generateMetadata = () => pageMeta("returns");

export default async function ReturnsPage() {
  // Same shape as /legal/privacy: the selected language end to end, content and
  // every caveat on it in lib/content/legal.ts. The one addition is `intro` —
  // this document opens with an identifying line and a scope paragraph before
  // its first numbered section.
  //
  // IT CONTRADICTS /legal/tokusho AND /legal/terms ON RETURNS. That is reported
  // to Cynthia, not resolved here; see the comment on returnsTitle.
  const lang = await getLang();
  return (
    <LegalArticles
      lang={lang}
      title={returnsTitle}
      updated={returnsUpdated}
      intro={returnsIntro}
      // No layaway section on the Japanese site (owner decision 2026-09-25).
      articles={legalArticlesFor(returnsArticles, layawayOffered(lang))}
    />
  );
}
