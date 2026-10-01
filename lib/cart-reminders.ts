/**
 * Cart reminders — the storefront's constants (the Hub's docs/CART-REMINDERS.md).
 * Pure: no server-only imports, so tests and client components may read it.
 */

/**
 * THE WORDING VERSION. The Hub records, with every opt-in, exactly which text
 * the customer saw (the legal record under the Japanese anti-spam and mail-order laws and the PH Data Privacy Act).
 * Change cartReminders.label / .help in lib/i18n.ts → bump this string, in
 * the same commit. Never reuse a version for different words.
 */
export const CART_REMINDER_TEXT_VERSION = "cart-reminder-2026-10";
