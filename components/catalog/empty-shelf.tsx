import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/**
 * What a category or collection shows when it holds nothing.
 *
 * ONE COMPONENT FOR BOTH PAGES, because the two had drifted already: the same
 * sentence was rendered from two places and only one of them offered the
 * condition filter's variant. An empty shelf is a dead end, so it carries a way
 * off it — /collections, which is the one page that cannot itself be empty
 * while the shop has any stock at all.
 *
 * NO BUTTON ON THE FILTERED VARIANT. "No pieces match this filter" already has
 * its exit: the filter row directly above, which is still on screen. A second
 * one sending the reader to a different page would be telling them to give up
 * on a choice they can undo in one click.
 */
export function EmptyShelf({ lang, filtered = false }: { lang: Lang; filtered?: boolean }) {
  const t = tr(lang);
  return (
    <div className="mt-12 border border-hairline p-6">
      <p className="text-charcoal">{t("collection", filtered ? "emptyFiltered" : "empty")}</p>
      {!filtered && (
        <Button asChild className="mt-5">
          <Link href="/collections">{t("collection", "emptyCta")}</Link>
        </Button>
      )}
    </div>
  );
}
