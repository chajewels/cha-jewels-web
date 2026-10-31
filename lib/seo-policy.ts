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

import { familyOf, isSitePath, localeOf, splitPath, stripLocale, type Locale } from "@/lib/locale";

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

/**
 * PREFIX-AWARE CLASSIFICATION (Phase 2A of docs/seo/SEO-MIGRATION-MAP.md).
 *
 * What a path is, whether or not a locale prefix is in front of it:
 *  - `private`: one of the routes above, even behind a prefix. "/en/cart" is
 *    never a localised page (private routes stay unprefixed, map §5), so it is
 *    classed private and can never be mistaken for an indexable one.
 *  - `public`: a public, indexable family (lib/locale.ts `familyOf`), in a
 *    language that family exists in. That includes the deferred "/layaway" and
 *    "/en/layaway" (English only) but never "/ja/layaway", which does not and
 *    will not exist. It says nothing about whether the page exists or what it
 *    returns.
 *  - `unknown`: anything else, and anything that is not a site path.
 *
 * NOT WIRED TO ANY LIVE OUTPUT YET. `isNoindexPath`, `indexingFor` and
 * `emitsCanonical` above keep their Phase 1 behaviour for every input, so the
 * robots directive and the canonical/hreflang of every existing URL (and of the
 * locale-looking URLs that 404 today) are exactly what they were. Phase 2B,
 * which introduces the locale routes, is where this classifier replaces them.
 */
export type PathClass = { kind: "private" | "public" | "unknown"; locale: Locale | null; path: string };

/**
 * THE REAL PAGE ROUTES OUTSIDE THE LOCALE TREE, BY SHAPE (SEO foundation batch).
 *
 * `:name` is exactly one dynamic segment; every other segment is literal. This is
 * the list of the `page.tsx` files under `app/` (not under `app/[lang]`), and
 * tests/seo-foundation.test.mjs compares it with the file system so a new or
 * renamed route cannot drift out of it. It is deliberately NOT the family table
 * in lib/locale.ts: a `children` family there means "everything under /products
 * localises", which is right for routing and navigation but wrong for "is this a
 * page that exists" — /products/x/y, /legal/missing and /categories (no index
 * page) are not pages. Routing and navigation keep using the family rules.
 */
const PUBLIC_ROUTES: readonly string[] = [
  "/", "/about", "/affiliations", "/blog", "/blog/:slug", "/categories/:slug", "/collections", "/collections/:slug",
  "/contact", "/faq", "/jewelry-guide", "/layaway", "/legal/privacy", "/legal/returns", "/legal/terms", "/legal/tokusho",
  "/loyalty", "/products/:slug", "/sale", "/shopping-guide", "/wholesale", "/why-cha-jewels",
];
const PRIVATE_ROUTES: readonly string[] = [
  "/account", "/account/addresses", "/account/complete-profile", "/account/layaway", "/account/layaway/:id", "/account/orders",
  "/account/orders/:id", "/account/orders/:id/pay-card", "/account/receipts", "/account/service-requests", "/already-registered",
  "/auth/confirm", "/cart", "/cart-reminders/unsubscribe", "/checkout", "/checkout/complete/:order_id", "/checkout/complete/d/:draft_id",
  "/loyalty/join", "/login", "/newsletter/unsubscribe", "/receipts/verify", "/review/:token", "/search",
];

/** The route shapes, exported so the test can compare them with `app/`. */
export const ROUTE_SHAPES = { public: PUBLIC_ROUTES, private: PRIVATE_ROUTES } as const;

function shapeMatches(shape: string, pathname: string): boolean {
  const want = shape.split("/");
  const got = pathname.split("/");
  return want.length === got.length && want.every((w, i) => (w.startsWith(":") ? got[i] !== "" : w === got[i]));
}

/** True when the path is a PUBLIC route with a dynamic segment (a product, collection, category or post). */
export function isDynamicPublicRoute(pathname: string): boolean {
  if (!isSitePath(pathname) || localeOf(pathname)) return false;
  const p = clean(splitPath(pathname).path);
  return PUBLIC_ROUTES.some((r) => r.includes(":") && shapeMatches(r, p));
}

/** Which kind of real page this path is, by exact route shape; null when no route has this shape. */
export function routeShapeOf(pathname: string): "public" | "private" | null {
  if (!isSitePath(pathname) || localeOf(pathname)) return null;
  const p = clean(splitPath(pathname).path);
  if (PRIVATE_ROUTES.some((r) => shapeMatches(r, p))) return "private";
  if (PUBLIC_ROUTES.some((r) => shapeMatches(r, p))) return "public";
  return null;
}

/**
 * WHAT <SeoLinks /> MAY RENDER FOR A REQUEST PATH (SEO foundation batch).
 *
 * <SeoLinks /> lives in the root layout, which also renders around a 404, so it
 * must decide from the path alone and must never describe a page that does not
 * exist. It used to render a canonical, three hreflang links and an og:url for
 * ANY unprefixed path, then (first correction) for any descendant of a public
 * family, so /products/x/y, /legal/missing and /blog/x/y — real 404s with noindex —
 * still named themselves. Now it describes a path only when the path has the
 * exact shape of a real page route (`routeShapeOf`):
 *  - a locale-prefixed path: null — the locale tree declares its own metadata
 *    (lib/locale-meta.ts), and a locale 404 says nothing;
 *  - no real route has this shape: null — nothing to describe;
 *  - a private/utility route: og:url only, no canonical, no alternates (the page
 *    says noindex; the og:url describes a share, not an index entry);
 *  - a public route: canonical, og:url and the language alternates.
 * A real shape can still name a resource that does not exist ("/products/x"):
 * that request reaches a page that calls notFound(), which is covered by the
 * rendered checks, not by this structural rule. The robots directive of every
 * private PREFIX (`indexingFor`) is unchanged and still covers every descendant.
 * Returns null for anything that is not a site path.
 */
export type SeoLinkPlan = { canonical: boolean; ogUrl: boolean; alternates: boolean };

export function seoLinkPlan(pathname: string, legacyRedirects = false): SeoLinkPlan | null {
  const kind = routeShapeOf(pathname);
  if (kind === null) return null;
  // WITH THE LEGACY REDIRECTS ON (the default; lib/legacy-redirect.ts), a bare dynamic public URL
  // (/products/x, /collections/x, /categories/x, /blog/x) never serves a 200 page: an existing
  // resource answers a 307 to its locale page and a missing one is a 404. The layout's tags would
  // therefore only ever appear on a 404 — and a browser DOM shows them there — so it says nothing.
  // With the redirects OFF (the rollback switch) the bare page renders again and keeps its tags.
  if (legacyRedirects && kind === "public" && isDynamicPublicRoute(pathname)) return null;
  if (kind === "private") return { canonical: false, ogUrl: true, alternates: false };
  return { canonical: true, ogUrl: true, alternates: true };
}

export function classifyPath(input: string): PathClass {
  if (!isSitePath(input)) return { kind: "unknown", locale: null, path: input };
  const locale = localeOf(input);
  const path = splitPath(stripLocale(input)).path;
  if (match(path)) return { kind: "private", locale, path };
  const rule = familyOf(path);
  if (rule && (locale === null || rule.locales.includes(locale))) return { kind: "public", locale, path };
  return { kind: "unknown", locale, path };
}
