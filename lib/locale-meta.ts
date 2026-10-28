import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { isLocale, type Locale } from "@/lib/locale";

/**
 * CANONICAL + HREFLANG FOR THE LOCALE TREE (Phase 2B designs E and F).
 *
 * A /en/* or /ja/* page declares its own metadata here — the root layout's
 * <SeoLinks /> deliberately emits nothing for a locale path, so a locale 404
 * carries no canonical and no hreflang (finding X1, closed for this tree).
 * Next's resolver trap that forced SeoLinks to exist does not apply here:
 * "/en" is not "/", so no URL is reduced to the bare origin.
 *
 * The rules (map §8, OD-2, OD-8, OD-9):
 *  - canonical: the page's own locale URL, absolute, no query, no slash;
 *  - hreflang en / ja: only for a language the resource actually exists and is
 *    eligible in — never an alternate that would 404;
 *  - x-default: the English URL (OD-2); a page with no English version names
 *    its own eligible URL.
 *
 * `eligible` is the data answer (which languages this resource has): structure
 * alone cannot know that a blog post exists in one language (F2), so dynamic
 * wrappers pass a data-driven answer and static pages default to both.
 */
export type EligibleLangs = { en: boolean; ja: boolean };
const BOTH: EligibleLangs = { en: true, ja: true };

export function localeAlternates(lang: Locale, barePath: string, eligible: EligibleLangs = BOTH): Metadata {
  const base = siteUrl();
  const at = (l: Locale) => `${base}/${l}${barePath === "/" ? "" : barePath}`;
  const languages: Record<string, string> = {};
  if (eligible.en) languages.en = at("en");
  if (eligible.ja) languages.ja = at("ja");
  languages["x-default"] = eligible.en ? at("en") : at(lang);
  return { alternates: { canonical: at(lang), languages } };
}

/**
 * `generateMetadata` for a locale wrapper page: the legacy page's own metadata
 * (title, description, OpenGraph images — `getLang()` is URL-authoritative, so
 * the legacy function already answers in the URL's language) plus the locale
 * alternates above. An ineligible or invalid language returns {} — the page
 * itself 404s, and a 404 must say nothing (X1).
 */
export function localizedMeta<P extends Record<string, string>>(
  pathOf: (params: P) => string,
  base?: (args: { params: Promise<P> }) => Metadata | Promise<Metadata>,
  eligibleOf?: (params: P) => EligibleLangs | Promise<EligibleLangs>,
) {
  return async function generateMetadata(args: { params: Promise<P & { lang: string }> }): Promise<Metadata> {
    const params = await args.params;
    const lang = params.lang;
    if (!isLocale(lang)) return {};
    const eligible = eligibleOf ? await eligibleOf(params) : BOTH;
    if (!eligible[lang]) return {};
    const own = base ? await base(args) : {};
    return { ...own, ...localeAlternates(lang, pathOf(params), eligible) };
  };
}
