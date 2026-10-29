import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale";
import type { Crumb } from "@/lib/json-ld";

/**
 * The visible trail's rows, from the SAME crumbs the BreadcrumbList JSON-LD is
 * built from (components/site/breadcrumbs.tsx passes one array to both). Every
 * crumb but the last is a link to its locale page — localePath("/", lang) is
 * "/en" or "/ja", never a bare "/" — and the last names the page itself and is
 * not a link (aria-current="page"). Pure, so the mapping is unit-tested against
 * buildJsonLd: row i's href is item i's URL minus the origin.
 */
export type CrumbRow = { name: string; href: string | null };
export function crumbRows(items: Crumb[], lang: Lang): CrumbRow[] {
  return items.map((c, i) => ({ name: c.name, href: i === items.length - 1 ? null : localePath(c.path, lang) }));
}
