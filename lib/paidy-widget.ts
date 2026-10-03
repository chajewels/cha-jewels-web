/**
 * The attributes of Paidy's N-Pay widget tag (owner W1–W5, 2026-10-03; Paidy
 * N-Pay Widget Manual rev. 2026-04-06), kept in plain TypeScript so the unit
 * test can read them without a JSX runtime. The component
 * (components/commerce/paidy-widget.tsx) spreads them onto the div.
 *
 *   W4  magenta logo, 13px, start-aligned, 「円」 (Paidy's default, so no
 *       data-currency-option), the installment months shown, no pre_kyc
 *   W5  data-6-pay-enabled / data-12-pay-enabled are set — released only once
 *       Paidy confirmed 6- and 12-pay are activated on the account
 *
 * The widget hides itself under ¥3,000; below that we render nothing and load
 * no script. The figure it shows is Paidy's own — this site computes nothing.
 */
export const PAIDY_WIDGET_MIN_JPY = 3000;
export const PAIDY_WIDGET_SRC = "https://cdn.paidy.com/promotional-messaging/general/paidy-upsell-widget.js";

export function paidyWidgetAttrs(amountJpy: number): Record<string, string> | null {
  if (!Number.isInteger(amountJpy) || amountJpy < PAIDY_WIDGET_MIN_JPY) return null;
  return {
    className: "_paidy-promotional-messaging",
    "data-amount": String(amountJpy),
    "data-alignment": "start",
    "data-font-size": "13px",
    "data-logo-color": "magenta",
    // A presence flag in Paidy's manual; "" renders it bare, never "true".
    "data-display-installment-months": "",
    // W5 (owner 2026-10-03): 6- and 12-pay, ON only once Paidy confirmed the
    // plans are activated on the account. The manual: 6-pay from ¥6,000,
    // 12-pay from ¥12,000, and 12 needs 6; the widget applies those floors
    // itself, so both flags are simply present.
    "data-6-pay-enabled": "",
    "data-12-pay-enabled": "",
  };
}
