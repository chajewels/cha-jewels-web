import { isSitePath, splitPath, stripLocale } from "@/lib/locale";

/**
 * THE STATUTORY PAGES: /legal and /legal/*, in either language, prefixed or not.
 *
 * ONE RULE, ONE PLACE (Phase 2A of docs/seo/SEO-MIGRATION-MAP.md, finding F3).
 * The legal pages are read without anything competing for the reader: the
 * tokusho page is a statutory disclosure under the Specified Commercial
 * Transactions Act, and its neighbours are read on the same terms. Two live
 * checks key on this path, and both used to spell it out as a literal:
 *
 *  1. the cookie banner never asks by itself there
 *     (components/site/consent-banner.tsx), and
 *  2. the announcement bar is not rendered there
 *     (app/layout.tsx, `announcementBarAllowed` below).
 *
 * Once locale URLs exist, `/en/legal/tokusho` and `/ja/legal/tokusho` must keep
 * both suppressions, so both now ask this function, and it looks past a locale
 * prefix. Behaviour for the existing unprefixed pages is unchanged.
 *
 * NOT A THIRD CHECK: the advertising tags have no /legal rule. `adsLoadsOn`
 * (lib/ads.ts) excludes only /account/* (a customer's own pages, PCI scope), and
 * on /legal the visitor is simply not asked, so tags load there only if consent
 * was already given elsewhere. That is today's behaviour, it is not touched
 * here, and it is already identical for a prefixed legal path (tests/
 * statutory-path.test.mjs proves the parity). Suppressing ads on /legal would be
 * a behaviour change and an owner decision.
 */
export function isStatutoryPath(pathname: string | null | undefined): boolean {
  if (!isSitePath(pathname)) return false;
  const bare = splitPath(stripLocale(pathname)).path;
  return bare === "/legal" || bare.startsWith("/legal/");
}

/**
 * Whether the announcement bar may render for this path.
 *
 * FAILS SAFE, exactly as the layout's `bannerAllowed` did: the path comes from
 * the `x-cj-path` header the middleware sets, because a layout is never told the
 * pathname. NO HEADER MEANS NO BAR, and so does a value that is not a site path
 * (empty, no leading slash, protocol-relative, or malformed: a backslash, a
 * control character, an empty segment such as "/en//legal/x"): a path we cannot
 * classify is one we cannot show is not the legal notice, so the answer that
 * cannot put a banner on it is the only safe one.
 */
export function announcementBarAllowed(path: string | null | undefined): boolean {
  if (!isSitePath(path)) return false;
  return !isStatutoryPath(path);
}
