/**
 * LOCALE PATH HELPERS: Phase 2A of docs/seo/SEO-MIGRATION-MAP.md (§15).
 *
 * PURE INFRASTRUCTURE. Nothing imports this to build a link, a redirect, a
 * canonical or a sitemap entry yet, and there is no /en or /ja route: those are
 * Phases 2B-2E, each behind its own approval. The only live consumers are the
 * statutory-page checks in lib/statutory-path.ts, which need to recognise a
 * locale prefix before one exists so a prefixed legal page can never lose its
 * suppressions.
 *
 * CONVENTIONS (map §3, resolved as technical conventions):
 *  - The locales are `en` and `ja`, the same two as `Lang` in lib/i18n.ts.
 *  - The app keeps Next's default `trailingSlash: false`, so every path these
 *    functions return has no trailing slash (the root is "/", the locale homes
 *    are "/en" and "/ja"). A trailing slash on input is normalised away.
 *  - A prefix is a WHOLE first segment: "/en" and "/en/x" carry one, "/english"
 *    and "/EN/x" do not (Next routes are case-sensitive). An unknown prefix
 *    ("/fr/x") is just a path whose first segment is "fr": never guessed at.
 *  - Query strings and fragments are carried through untouched.
 *
 * WHAT COUNTS AS A SITE PATH (`isSitePath`), and why it is strict. These
 * functions are meant to feed links, hreflang and, in Phase 2E, redirects, so
 * they must never turn attacker-shaped input into something a browser reads as
 * another host. A string is a site path only if it starts with a single "/",
 * has no backslash (browsers read "/\host" as "//host"), no control character
 * (CR/LF) and no empty segment ("//") in its path part. Anything else is
 * returned UNCHANGED by every function here and is never treated as localised,
 * private, statutory or public. In particular "/en//evil.com" does NOT strip to
 * "//evil.com". "Unchanged" is not "safe": a caller building a redirect must
 * still validate with `isSitePath`.
 *
 * WHAT MAY BE LOCALISED is the public, indexable families of map §4 (R1-R18)
 * plus the deferred `layaway` family. Each family says which locales it exists
 * in and whether its locale routes are LIVE. Private and utility routes stay
 * unprefixed (map §5) and are not in the table.
 *
 * LAYAWAY (Option ii, map §6 and §9 F). `layaway` exists in English only
 * (owner policy: nothing layaway-related on the Japanese site), and its locale
 * route does not exist until Phase 3, so it is `live: false`: no helper produces
 * `/en/layaway`, and the existing English layaway links stay on the bare
 * `/layaway` through Phase 2C. When Phase 3 has created and validated
 * `/en/layaway` it flips that one `live` flag; because the family is English-
 * only, `/ja/layaway` can never be produced, before or after.
 */
import type { Lang } from "@/lib/i18n";

export type Locale = Lang;
export const LOCALES: readonly Locale[] = ["en", "ja"];

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ja";
}

export type Parts = { path: string; suffix: string };

/** Splits "/a/b?x=1#y" into the path and everything from the first "?" or "#". */
export function splitPath(input: string): Parts {
  const cut = input.search(/[?#]/);
  return cut === -1 ? { path: input, suffix: "" } : { path: input.slice(0, cut), suffix: input.slice(cut) };
}

/** No trailing slash, except the root. Does not touch the case or the segments. */
const normalize = (path: string): string => (path.length > 1 ? path.replace(/\/+$/, "") || "/" : path);

const CONTROL = /[\u0000-\u001f\u007f]/;

/**
 * True only for a string that can safely be treated as a path on this site. See
 * the header: single leading slash, no backslash, no control character anywhere,
 * no empty segment in the path part (a trailing slash is allowed and normalised).
 */
export function isSitePath(input: unknown): input is string {
  if (typeof input !== "string" || !input.startsWith("/") || input.startsWith("//")) return false;
  if (CONTROL.test(input)) return false;
  const path = splitPath(input).path;
  if (path.includes("\\")) return false;
  return !normalize(path).includes("//");
}

/** The locale a path is prefixed with, or null (unprefixed, unknown prefix, or not a site path). */
export function localeOf(input: string): Locale | null {
  if (!isSitePath(input)) return null;
  const first = normalize(splitPath(input).path).split("/")[1];
  return isLocale(first) ? first : null;
}

/**
 * The path without its locale prefix, normalised, with the query and fragment
 * kept. "/en" and "/ja" become "/". A path with no prefix or an unknown prefix
 * comes back normalised; anything that is not a site path comes back unchanged.
 */
export function stripLocale(input: string): string {
  if (!isSitePath(input)) return input;
  const { path, suffix } = splitPath(input);
  const clean = normalize(path);
  const locale = localeOf(clean);
  if (!locale) return clean + suffix;
  const rest = clean.slice(locale.length + 1);
  return (rest === "" ? "/" : rest) + suffix;
}

export type FamilyRule = {
  /** `exact` is one page; `children` is a section with pages beneath it. */
  shape: "exact" | "children";
  /** The locales this family has pages in. */
  locales: readonly Locale[];
  /** Whether its locale routes exist (are created and validated). */
  live: boolean;
};

const BOTH: readonly Locale[] = ["en", "ja"];
const page = (): FamilyRule => ({ shape: "exact", locales: BOTH, live: true });
const section = (): FamilyRule => ({ shape: "children", locales: BOTH, live: true });

/** The root "/" (the locale homes "/en" and "/ja"). */
const ROOT: FamilyRule = { shape: "exact", locales: BOTH, live: true };

/**
 * Public families (map §4). `/loyalty/join` is private, so `loyalty` is exact.
 * `layaway` is English-only and NOT live (see the header). Never add "ja" to it.
 */
export const FAMILY_RULES: ReadonlyMap<string, FamilyRule> = new Map<string, FamilyRule>([
  ["products", section()],
  ["categories", section()],
  ["collections", section()],
  ["blog", section()],
  ["legal", section()],
  ["jewelry-guide", page()],
  ["shopping-guide", page()],
  ["faq", page()],
  ["about", page()],
  ["why-cha-jewels", page()],
  ["contact", page()],
  ["affiliations", page()],
  ["loyalty", page()],
  ["sale", page()],
  ["wholesale", page()],
  ["layaway", { shape: "exact", locales: ["en"], live: false }],
]);

/**
 * The helpers that depend on the family table, built from a table so a test can
 * prove what enabling a family does (for example Phase 3 flipping `layaway` live)
 * without a second implementation. The exports below use `FAMILY_RULES`.
 */
export function createLocaleRules(families: ReadonlyMap<string, FamilyRule> = FAMILY_RULES) {
  /** The rule for the family this path belongs to, ignoring any locale prefix; null if none. */
  function familyOf(input: string): FamilyRule | null {
    if (!isSitePath(input)) return null;
    const bare = splitPath(stripLocale(input)).path;
    if (bare === "/") return ROOT;
    const [, family, ...deeper] = bare.split("/");
    const rule = families.get(family);
    if (!rule) return null;
    return rule.shape === "children" || deeper.length === 0 ? rule : null;
  }

  /** True when the path's own prefix (if any) is a locale its family exists in. */
  const prefixAllowed = (input: string, rule: FamilyRule): boolean => {
    const own = localeOf(input);
    return own === null || rule.locales.includes(own);
  };

  /**
   * Whether the path belongs to a family that has LIVE locale routes (and, if it
   * already carries a prefix, a prefix that family exists in). False for private
   * and utility routes, for a family that is not live yet (`/layaway`), for
   * `/ja/layaway`, for unknown paths and for anything that is not a site path.
   */
  function isLocalizable(input: string): boolean {
    const rule = familyOf(input);
    return !!rule && rule.live && prefixAllowed(input, rule);
  }

  /**
   * The path under a locale prefix: "/products/x" and "ja" give "/ja/products/x",
   * "/" gives "/ja". Anything that may not be localised into that locale (private,
   * not live, not in that language, unknown, unsafe) is returned UNCHANGED, so a
   * caller can never mint "/en/cart", "/en/layaway" before Phase 3, or
   * "/ja/layaway" ever. An invalid locale returns the input unchanged too.
   */
  function localePath(input: string, locale: Locale): string {
    if (!isLocale(locale)) return input;
    const rule = familyOf(input);
    if (!rule || !rule.live || !rule.locales.includes(locale) || !prefixAllowed(input, rule)) return input;
    const { path, suffix } = splitPath(stripLocale(input));
    return (path === "/" ? `/${locale}` : `/${locale}${path}`) + suffix;
  }

  /**
   * The same resource in the target language: the path to link to from a language
   * switcher or to name as an hreflang alternate, or null when no such page exists
   * by structure (private route, family not live, not in that language, unknown).
   *
   * PATH-ONLY. It cannot know that one blog post has words in a single language
   * (map F2) or that a fallback-language page should not be offered (OD-9); those
   * are data questions for Phases 2B-2D, and a caller must still ask the data.
   */
  function siblingPath(input: string, target: Locale): string | null {
    if (!isLocale(target) || !isLocalizable(input)) return null;
    const rule = familyOf(input)!;
    return rule.locales.includes(target) ? localePath(input, target) : null;
  }

  return { familyOf, isLocalizable, localePath, siblingPath };
}

export const { familyOf, isLocalizable, localePath, siblingPath } = createLocaleRules();

/**
 * AN AUTHOR-WRITTEN LINK (Hub markdown in posts and FAQ answers, the Hub
 * announcement), localized for the page it appears on (OD-11, corrected
 * 2026-10-28).
 *
 * An UNPREFIXED eligible public path takes the page's language, exactly as
 * `localePath` gives it: "/faq" is "/ja/faq" on a Japanese page and "/en/faq"
 * on an English one. A path the author already prefixed with "/en" or "/ja" is
 * the author's explicit choice of language and is returned AS WRITTEN — never
 * re-based onto the page's language. `localePath` itself swaps a prefix, which
 * is right for the language switcher (it asks for the same page in the other
 * language) and wrong for an editor who deliberately linked one language: an
 * English-only article linked as "/en/blog/…" from a Japanese page used to
 * become "/ja/blog/…", a 404.
 *
 * Everything else behaves as `localePath`: private, utility, unknown and
 * not-yet-live paths (bare "/layaway") and anything that is not a site path
 * come back unchanged; query, fragment and encoding are carried through. This
 * decides a URL only — whether a page may link to another language's content is
 * an editorial decision, not this function's.
 */
export function localizeAuthoredHref(input: string, locale: Locale): string {
  return localeOf(input) ? input : localePath(input, locale);
}

/**
 * Every live URL of one resource: the bare path plus its /en and /ja forms when
 * the family is localizable (Phase 2C; used by cache revalidation so a Hub edit
 * refreshes all three renders). A non-localizable path comes back alone.
 */
export function localeVariants(path: string): string[] {
  return [...new Set([path, localePath(path, "en"), localePath(path, "ja")])];
}

