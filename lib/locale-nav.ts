import "server-only";
import { isSitePath, localeOf, siblingPath, splitPath, stripLocale, LOCALES, type Locale } from "@/lib/locale";
import { postLanguages } from "@/lib/posts";
import { classifyPath } from "@/lib/seo-policy";

/**
 * WHERE THE LANGUAGE SWITCHER GOES (OD-7, Phase 2C).
 *
 * For each language, the control's destination:
 *  - a string: a crawlable link to that URL — the sibling page when the
 *    resource exists in that language, otherwise the destination language's
 *    HOME ("/en" or "/ja"). Never a missing localized page, never a layaway
 *    page, never a private route.
 *  - null: no URL to go to — the control keeps the pre-2C cookie-toggle
 *    behaviour (private routes such as /cart or /account, where switching must
 *    re-render the same page, and anything unclassifiable).
 *
 * Blog posts are the one per-resource data question (finding F2): a post that
 * has no title+body in the destination language falls back to that language's
 * home rather than minting a 404 (`postLanguages`, one cached Hub read).
 * `/layaway` (and every bare path whose family is not live) is structure-level
 * ineligible, so the Japanese side goes home and no `/en/layaway` is produced.
 * The query string is carried to a sibling, minus any `lang` parameter — the
 * URL now says the language; a destination home carries nothing.
 */
export type SwitchTargets = Record<Locale, string | null>;

const dropLangParam = (suffix: string): string => {
  const [query, hash = ""] = (() => {
    const h = suffix.indexOf("#");
    return h === -1 ? [suffix, ""] : [suffix.slice(0, h), suffix.slice(h)];
  })();
  if (!query.startsWith("?")) return suffix;
  const params = new URLSearchParams(query.slice(1));
  params.delete("lang");
  const q = params.toString();
  return (q ? `?${q}` : "") + hash;
};

export async function switchTargets(path: string | null | undefined): Promise<SwitchTargets> {
  const none: SwitchTargets = { en: null, ja: null };
  if (typeof path !== "string" || !isSitePath(path)) return none;
  const kind = classifyPath(path).kind;
  if (kind === "private") return none; // cookie toggle stays: the page must re-render in place
  const { path: bare, suffix } = splitPath(stripLocale(path));
  const keep = dropLangParam(suffix);
  // A blog article: ask the data which languages it exists in.
  const post = /^\/blog\/[^/]+$/.test(bare) ? await postLanguages(bare.split("/")[2]).catch(() => null) : null;
  const out = {} as SwitchTargets;
  for (const l of LOCALES) {
    const sibling = siblingPath(bare, l);
    out[l] = sibling && (!post || post[l]) ? sibling + keep : `/${l}`;
  }
  // The current page itself: if this very URL resolved (it rendered this
  // layout), its own language's entry points at itself so the active segment
  // needs no link — the component treats the current language as active.
  const own = localeOf(path);
  if (own) out[own] = splitPath(path).path + keep;
  return out;
}
