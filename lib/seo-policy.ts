/**
 * WHICH PATHS ARE NEVER SEARCH LANDING PAGES — ONE LIST, ONE PLACE.
 *
 * Phase 1 of docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md (docs/seo/SEO-BASELINE.md
 * has the route-by-route audit behind this list).
 *
 * A page a customer reaches through a form, a session or a one-use link has no
 * business in a search index: /cart and /login answered 200 with nothing to say
 * "do not index", so any link to them was indexable. They are marked `noindex`
 * in the page itself (root layout's generateMetadata), NOT blocked in
 * robots.txt: a Disallow stops a crawler from fetching the page, and a crawler
 * that cannot fetch it never reads the noindex. robots.txt keeps only the areas
 * that need a hard stop (account, checkout, API, review tokens).
 *
 * `follow` is true only where the page's own links are ordinary public links
 * worth following (the search results list real products). Session and token
 * pages say nofollow.
 *
 * Pure on purpose, so tests/seo-index-policy.test.mjs can state the policy
 * without rendering a page. The root layout and <SeoLinks /> read it; nothing
 * else re-expresses it.
 */

export type Indexing = { index: false; follow: boolean };

/** A route and everything under it. Matched by whole path segment, never by string prefix. */
const NOINDEX: readonly { route: string; follow: boolean }[] = [
  { route: "/search", follow: true },
  { route: "/cart", follow: true },
  { route: "/login", follow: true },
  { route: "/auth", follow: false },
  { route: "/account", follow: false },
  { route: "/checkout", follow: false },
  // /loyalty is a public, listed page; only the join step is private.
  { route: "/loyalty/join", follow: false },
  { route: "/already-registered", follow: false },
  { route: "/review", follow: false },
  { route: "/receipts", follow: false },
  { route: "/newsletter/unsubscribe", follow: false },
  { route: "/cart-reminders", follow: false },
];

const clean = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);

function match(pathname: string) {
  const p = clean(pathname);
  return NOINDEX.find(({ route }) => p === route || p.startsWith(`${route}/`)) ?? null;
}

export function isNoindexPath(pathname: string): boolean {
  return match(pathname) !== null;
}

/** The robots directive for this path, or null when the page is meant to be indexable. */
export function indexingFor(pathname: string): Indexing | null {
  const m = match(pathname);
  return m ? { index: false, follow: m.follow } : null;
}

/**
 * Does this path declare a canonical and language alternates? Not when it says
 * noindex: Google treats a noindex page that also names a canonical as a mixed
 * signal, and there is nothing to consolidate onto a page nobody should find.
 */
export function emitsCanonical(pathname: string): boolean {
  return !isNoindexPath(pathname);
}
