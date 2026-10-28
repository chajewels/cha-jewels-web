import type { Lang } from "@/lib/i18n";
import { isSitePath, localeOf, localePath, splitPath } from "@/lib/locale";

/**
 * PHASE 2E-STAGE-1: BARE LEGACY URLS ANSWER A TEMPORARY 307 TO THEIR LOCALE PAGE
 * (owner-approved 2026-10-28; docs/seo/SEO-MIGRATION-MAP.md §20.2 is the
 * binding table). Pure, so the whole decision table is unit-tested here; the
 * middleware and the four dynamic legacy pages only carry out what it returns.
 *
 * WHICH LANGUAGE. The caller passes `lang`: the language this bare URL would
 * have rendered for this very request, from lib/i18n `langDecision` (`?lang=`,
 * then the cookie, then Accept-Language, then Japanese). Nobody is moved to a
 * language they were not already reading, and a crawler (no cookie, no
 * Accept-Language) always lands on /ja — the content its index holds.
 *
 * WHICH URLS. Two kinds, because "the route family exists" does not prove "this
 * page exists in that language":
 *  - "static": the 16 public pages that answer 200 in both languages whatever
 *    the request (STATIC_PAGES, held equal to the app/[lang] route files by
 *    tests/legacy-redirect.test.mjs). The middleware redirects these itself.
 *  - "dynamic": one product, category, collection or post. Existence is a data
 *    question, so the middleware only hands the target to the legacy page
 *    (LEGACY_REDIRECT_HEADER) and the page redirects AFTER its own data load has
 *    proved the page exists in that language (lib/legacy-redirect-server.ts).
 *    A missing slug, a post not written in that language or a Hub failure
 *    therefore keeps today's response — never a redirect to a 404.
 * Everything else — the root `/` (OD-3), `/layaway` (Phase 3 / OD-6), private,
 * utility and unknown paths, already-prefixed paths — returns null: untouched.
 *
 * WHAT IS NEVER REDIRECTED: anything but GET/HEAD, and a Server Action POST
 * (a tab opened before the release still posts to its bare URL).
 *
 * THE QUERY STRING is kept byte-for-byte in order, minus every `lang`
 * parameter (the URL now says the language). A fragment never reaches the
 * server; browsers carry it over to a Location that has none.
 */
export const LEGACY_REDIRECT_HEADER = "x-cj-legacy-redirect";

/** The static public pages with locale routes, root excluded (bare paths). */
export const STATIC_PAGES: ReadonlySet<string> = new Set([
  "/about",
  "/affiliations",
  "/blog",
  "/collections",
  "/contact",
  "/faq",
  "/jewelry-guide",
  "/legal/privacy",
  "/legal/returns",
  "/legal/terms",
  "/legal/tokusho",
  "/loyalty",
  "/sale",
  "/shopping-guide",
  "/wholesale",
  "/why-cha-jewels",
]);

/** One product, category, collection or post: a single slug segment. */
const DYNAMIC = /^\/(products|categories|collections|blog)\/[^/]+$/;

/** `?a=1&lang=en&b=2` → `?a=1&b=2`; every `lang` key dropped, the rest untouched. */
export function dropLangParam(search: string): string {
  if (!search.startsWith("?")) return "";
  const kept = search.slice(1).split("&").filter((seg) => {
    if (!seg) return false;
    const key = seg.split("=")[0];
    try {
      return decodeURIComponent(key.replace(/\+/g, " ")) !== "lang";
    } catch {
      return true; // a malformed key is not `lang`; keep it as it came
    }
  });
  return kept.length ? `?${kept.join("&")}` : "";
}

export type LegacyRedirect = { kind: "static" | "dynamic"; location: string };

export function legacyRedirect(input: {
  method: string;
  /** True for a Server Action request (`Next-Action` header). */
  isAction: boolean;
  pathname: string;
  /** The raw query string, "" or starting with "?". */
  search: string;
  lang: Lang;
  /** The kill switch (`SEO_LEGACY_REDIRECTS=off` turns every redirect off). */
  enabled: boolean;
}): LegacyRedirect | null {
  const { method, isAction, pathname, search, lang, enabled } = input;
  if (!enabled || isAction || (method !== "GET" && method !== "HEAD")) return null;
  if (!isSitePath(pathname) || splitPath(pathname).suffix !== "" || localeOf(pathname)) return null;
  const kind = STATIC_PAGES.has(pathname) ? "static" : DYNAMIC.test(pathname) ? "dynamic" : null;
  if (!kind) return null;
  const target = localePath(pathname, lang);
  // localePath returns its input unchanged for anything it may not localise;
  // only a path that actually gained this locale is a redirect target.
  if (localeOf(target) !== lang || !isSitePath(target)) return null;
  const location = target + dropLangParam(search);
  return isSitePath(location) ? { kind, location } : null;
}

/** The kill switch, read per request: anything but "off" leaves redirects on. */
export const legacyRedirectsEnabled = (value: string | undefined): boolean => value?.trim().toLowerCase() !== "off";
