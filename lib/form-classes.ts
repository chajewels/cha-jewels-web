/**
 * The light-surface form rule, as constants.
 *
 * Every form on the site writes its own field classes today, which is how the
 * dark forms drifted. The light pass gets one rule written once, so the inputs
 * on `/checkout`, `/login`, the inquiry form and anything added later cannot
 * disagree about what a field looks like on white.
 *
 * Constants rather than a component: the forms differ in markup — some fields
 * are `<input>`, some `<select>`, one is a `<textarea>`, several sit inside
 * grids with their own spans — and a wrapper component would have to model all
 * of that. A class string composes with whatever markup the form already has.
 *
 * Every pair here is in `scripts/check-contrast.mjs` and passes:
 *   charcoal-deep on white           15.91 : 1   (text, needs 4.5)
 *   charcoal/70 placeholder on white  4.95 : 1   (text, needs 4.5)
 *   charcoal/60 border on white       3.69 : 1   (non-text, needs 3.0)
 *   gold-dark focus ring on white     5.01 : 1   (non-text, needs 3.0)
 *   garnet on white                  10.25 : 1   (text, needs 4.5)
 *   garnet/60 alert border on white   3.61 : 1   (non-text, needs 3.0)
 *
 * Two of those clear their threshold by under half a point — the placeholder
 * at 4.95 and the input border at 3.69. Neither may be lightened without
 * re-running the gate: `charcoal/60` as TEXT is 3.57 on chalk and is a
 * must-fail row precisely because it looks like it would be fine.
 *
 * The focus ring is gold-dark by owner decision. Gold `#C9A227` — the ring on
 * the dark surface — is 2.42 : 1 on white and fails; it is a must-fail row in
 * the gate so it cannot come back by accident.
 *
 * Nothing imports these yet. Group C moves the forms onto them.
 */

/** A text input, select or textarea on a light surface. */
export const inputLight =
  "bg-white border border-charcoal/60 text-charcoal-deep placeholder:text-charcoal/70 focus:outline-none focus:ring-2 focus:ring-gold-dark";

/** The label above a field. Quieter than the value it names, still 7.09 : 1. */
export const labelLight = "text-charcoal/70";

/** Field-level validation text. */
export const errorLight = "text-garnet";

/** A form-level error or warning box. */
export const alertLight = "border border-garnet/60 bg-white text-charcoal-deep";
