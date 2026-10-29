import { Fragment } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { crumbRows } from "@/lib/breadcrumbs";
import type { Crumb } from "@/lib/json-ld";
import { JsonLd } from "@/components/site/json-ld";

/**
 * The page's breadcrumb trail, visible AND structured from one array (Phase 4
 * §8: structured data must reflect real visible content). The <nav> is the
 * product page's original crumb — same classes, "/" separators, the last item
 * the page itself with aria-current="page" and no link — and the BreadcrumbList
 * JSON-LD is built from the same `items`, so the two cannot diverge. Each
 * crumb's `path` is the BARE route ("/collections/rings", "/" for home): the
 * rendered href is localePath(path, lang) and the JSON-LD URL is the same path
 * made absolute with the page's own locale prefix (lib/json-ld.ts).
 *
 * `label` is the nav's accessible name, t("pdp", "breadcrumb") in the page's
 * language — the string scripts/check-seo-live.mjs looks for.
 * `className` replaces the default spacing when a template needs other room.
 */
export function Breadcrumbs({ lang, items, label, className }: { lang: Lang; items: Crumb[]; label: string; className?: string }) {
  const rows = crumbRows(items, lang);
  return (
    <>
      <JsonLd type="breadcrumb" items={items} />
      <nav aria-label={label} className={className ?? "py-3.5 text-xs text-charcoal/70 sm:pb-[18px] sm:pt-[22px] sm:text-[13px]"}>
        <ol className="flex flex-wrap items-center gap-2">
          {rows.map((r, i) => (
            <Fragment key={items[i].path}>
              {i > 0 && <li aria-hidden="true" className="text-gold-dark">/</li>}
              {r.href === null
                ? <li aria-current="page" className="text-charcoal-deep">{r.name}</li>
                : <li><Link href={r.href} className="text-charcoal/80 hover:text-gold-dark">{r.name}</Link></li>}
            </Fragment>
          ))}
        </ol>
      </nav>
    </>
  );
}
