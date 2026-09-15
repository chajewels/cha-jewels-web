import { type Lang } from "@/lib/i18n";

/**
 * IS LAYAWAY OFFERED TO A VISITOR READING THE SITE IN THIS LANGUAGE?
 *
 * ONE RULE, ONE PLACE. Owner decision 2026-09-15: Japanese customers pay cash,
 * layaway is for the Filipino customer base, and the agreement exists only in
 * English and Tagalog. On `ja` layaway does not exist; on `en` it is unchanged.
 *
 * Every surface asks this function. Do not re-express it as `lang === "en"`
 * inline — a rule spread across fifteen components is one somebody half-removes
 * later, and the half that survives is the half nobody tested.
 *
 * WHAT THIS DOES NOT COVER, deliberately:
 *
 *  - A plan that already EXISTS. `/account/layaway`, the plan detail page and
 *    the "report a transfer" form stay available in BOTH languages. Someone
 *    with a live commitment must not lose sight of it because of a language
 *    toggle, and most plans were arranged with Cha Jewels directly rather than
 *    at this checkout. Hiding a balance is worse than showing a product we no
 *    longer sell in that language.
 *  - Statements about the BUSINESS rather than offers to the shopper —
 *    `/legal/tokusho` (statutory, Japanese-only by law) and the About mission
 *    copy. Both still mention layaway in Japanese; see the PR for why that is
 *    flagged rather than changed.
 *
 * NOT A SECURITY BOUNDARY. `lang` comes from the `cj-lang` cookie, which the
 * visitor sets. Someone who switches to English gets layaway — which is the
 * intent, because the language is self-selected. The server refusals exist to
 * stop an INCONSISTENT state (a layaway quote created while the site is
 * Japanese, e.g. by switching language mid-checkout), not to stop a determined
 * visitor from choosing English.
 */
export const LAYAWAY_LANGS: readonly Lang[] = ["en"];

export function layawayOffered(lang: Lang): boolean {
  return LAYAWAY_LANGS.includes(lang);
}

/** The refusal code the checkout actions return, and the UI has copy for. */
export const LAYAWAY_UNAVAILABLE = "layaway_unavailable";
