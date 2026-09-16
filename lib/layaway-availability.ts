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

/**
 * TERMS THAT EXIST BUT ARE NOT LAUNCHED (owner decision 2026-09-16).
 *
 * 10-month and 12-month plans are configured in the Hub's `plan_configurations`
 * — the Hub sends them in `allowed_terms`, the DB trigger accepts them, and a
 * staff member can create one — but they are NOT OPEN to web customers yet. The
 * terms of service say what is: "three-month and six-month plans", with longer
 * plans for qualifying purchases. 8M is a launched longer plan and stays
 * selectable behind its own ¥300,000 minimum.
 *
 * MARKED, NOT REMOVED. The owner asked for them to stay visible as coming, so a
 * customer sees that a 12-month plan exists and is not yet open, and so nobody
 * later wonders whether the Hub's config and this list have quietly diverged.
 * Filtering them out of the list would make the two look identical when they
 * are not.
 *
 * TWO REASONS A TERM CAN BE UNSELECTABLE, and they must never share one label:
 * `eligible: false` from the Hub means "this basket is under that term's
 * minimum" and a bigger basket fixes it; not launched means "nobody can have
 * this yet" and no basket fixes it.
 *
 * NOT A SECURITY BOUNDARY EITHER, and less of one than the language rule: the
 * authoritative gate is `plan_configurations.is_active` in the Hub, which only
 * Cynthia can change in SQL. Until she does, the Hub will still sell a 12-month
 * plan to anything that asks it. The server refusal in checkout-actions closes
 * the storefront's own path; see the PR for the one-line SQL that closes the
 * Hub's.
 *
 * TO LAUNCH A TERM: remove it from this array. Nothing else in the storefront
 * needs to change.
 */
export const UNLAUNCHED_TERMS: readonly number[] = [10, 12];

export function termLaunched(months: number): boolean {
  return !UNLAUNCHED_TERMS.includes(months);
}

/** The refusal code the checkout action returns, and the UI has copy for. */
export const TERM_NOT_LAUNCHED = "term_not_launched";
