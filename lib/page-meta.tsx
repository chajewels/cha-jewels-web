import type { Metadata } from "next";
import { headers } from "next/headers";
import { dict, LANG_PARAM, PATH_HEADER, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { siteUrl } from "@/lib/site";

type MetaEntry = { title: Record<Lang, string>; description?: Record<Lang, string> };

/**
 * CANONICAL + hreflang FOR THE PAGE BEING RENDERED.
 *
 * FIXED 2026-09-15. The root layout used to declare a LITERAL
 * `alternates: { canonical: "/", languages: { ja: "/", en: "/?lang=en" } }`.
 * Next merges metadata parent-to-child, so every page that did not set its own
 * `alternates` inherited it — and none did. The served HTML of /faq, /about,
 * /legal/privacy and every product page therefore carried
 *
 *     <link rel="canonical" href="https://www.chajewelsjapan.com"/>
 *
 * which tells Google that none of those URLs should be indexed in its own
 * right. The hreflang pair was broken for a second reason: the two values
 * resolved to the same URL, a contradiction a search engine ignores.
 *
 * WHY THESE ARE RENDERED AS TAGS AND NOT RETURNED AS `alternates`: Next's
 * metadata resolver reduces any URL whose path is "/" to the bare origin and
 * discards the query with it —
 *
 *     resolvedUrl = result.pathname === '/' ? result.origin : result.href
 *     (next/dist/lib/metadata/resolvers/resolve-url.js)
 *
 * so the HOME page's English alternate, /?lang=en, came out identical to its
 * Japanese one and the home page kept exactly the contradiction this change
 * exists to remove. It is not configurable and a URL instance takes the same
 * branch. Rendering the links ourselves is the only way to state the truth
 * about the most important page on the site, so all three are rendered the
 * same way rather than splitting the rule across two mechanisms.
 *
 * The path comes from the header the middleware sets, because generateMetadata
 * and layouts are never given the pathname. When the header is absent (a path
 * the middleware does not match) NOTHING is emitted: saying nothing is
 * correct, and guessing is what caused the bug.
 *
 * Query strings are deliberately dropped from the canonical: ?lang=en selects a
 * language, it does not make a different page, and ?lang, ?utm_* and friends
 * must not each become their own indexable URL.
 */
export async function SeoLinks() {
  const path = (await headers()).get(PATH_HEADER);
  if (!path || !path.startsWith("/")) return null;

  const base = siteUrl();
  const self = `${base}${path === "/" ? "/" : path.replace(/\/+$/, "")}`;
  return (
    <>
      <link rel="canonical" href={self} />
      {/* ja is the site default and needs no parameter. en carries the one the
          middleware honours, so the URL resolves for a crawler that sends no
          Accept-Language — which is most of them. x-default points at the
          default language for anyone we have not matched. */}
      <link rel="alternate" hrefLang="ja" href={self} />
      <link rel="alternate" hrefLang="en" href={`${self}?${LANG_PARAM}=en`} />
      <link rel="alternate" hrefLang="x-default" href={self} />
    </>
  );
}

/**
 * <title> and description follow the language cookie like everything else.
 * Pages export `generateMetadata = () => pageMeta("key")`; the strings live in
 * dict.meta so no page carries a literal title in either language.
 *
 * Pages do NOT need to set alternates: the root layout renders <SeoLinks /> for
 * the current path.
 */
export async function pageMeta(key: Exclude<keyof typeof dict.meta, "site">): Promise<Metadata> {
  const lang = await getLang();
  const m = dict.meta[key] as MetaEntry;
  return { title: m.title[lang], ...(m.description ? { description: m.description[lang] } : {}) };
}
