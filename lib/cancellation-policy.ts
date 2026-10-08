import { legalArticlesFor, returnsArticles } from "@/lib/content/legal";
import type { Lang } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";

/**
 * CANCELLATION POLICY LINK (V10d, owner 2026-10-08).
 *
 * The cancellation rule the Hub applies (same order date in Japan time → the
 * full amount paid as store credit; a later day → 30 % cancellation charge,
 * 70 % store credit; card refunds go back to the card only) is written ONCE,
 * in the Return, Cancellation and Refund Policy — article "Paid-in-Full Order
 * Cancellations" (RETURNS_CANCELLATION_ARTICLE). Checkout and the order page
 * link to that article here, by its rendered heading id.
 *
 * The id is positional (components/site/legal-articles.tsx sectionId), and the
 * Japanese policy drops the layaway article, so the index is looked up through
 * the same filter the page renders with — never hard-coded. Guarded by
 * tests/cancellation-policy.test.mjs.
 */
export const RETURNS_CANCELLATION_ARTICLE = 5;

export function cancellationPolicyHref(lang: Lang): string {
  const articles = legalArticlesFor(returnsArticles, layawayOffered(lang));
  const i = articles.findIndex((a) => a.n === RETURNS_CANCELLATION_ARTICLE);
  // The article is always present (it is not layaway-only); the fallback is the
  // page top, never a broken anchor.
  return i < 0 ? "/legal/returns" : `/legal/returns#s${i + 1}`;
}
