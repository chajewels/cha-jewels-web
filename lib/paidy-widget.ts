/**
 * The attributes of Paidy's N-Pay widget tag (owner W1–W5, 2026-10-03; Paidy
 * N-Pay Widget Manual rev. 2026-04-06), kept in plain TypeScript so the unit
 * test can read them without a JSX runtime. The component
 * (components/commerce/paidy-widget.tsx) spreads them onto the div.
 *
 *   W4  magenta logo, 13px, start-aligned, 「円」 (Paidy's default, so no
 *       data-currency-option), the installment months shown, no pre_kyc
 *   W5  data-6-pay-enabled / data-12-pay-enabled: Paidy approved 6- and
 *       12-pay for Cha Jewels effective 1 Nov 2026 (owner, Paidy notice
 *       2026-10-09). They switch on BY THEMSELVES at PAIDY_6_12_FROM (Japan
 *       midnight) — no release that day (owner 2026-10-09 21:22).
 *
 * The widget hides itself under ¥3,000; below that we render nothing and load
 * no script. The figure it shows is Paidy's own — this site computes nothing.
 */
export const PAIDY_WIDGET_MIN_JPY = 3000;

/** 6回・12回あと払い start (Paidy's notice): 1 Nov 2026, 00:00 Japan time. */
export const PAIDY_6_12_FROM = Date.parse("2026-11-01T00:00:00+09:00");

/** True from 1 Nov 2026 00:00 JST. `now` for tests. */
export function paidy612Active(now: number = Date.now()): boolean {
  return now >= PAIDY_6_12_FROM;
}
export const PAIDY_WIDGET_SRC = "https://cdn.paidy.com/promotional-messaging/general/paidy-upsell-widget.js";

export function paidyWidgetAttrs(amountJpy: number, now: number = Date.now()): Record<string, string> | null {
  if (!Number.isInteger(amountJpy) || amountJpy < PAIDY_WIDGET_MIN_JPY) return null;
  // W5: presence flags from 1 Nov 2026 (manual: 6-pay from ¥6,000, 12-pay from
  // ¥12,000, 12 needs 6 — the widget applies those floors itself).
  const plans612: Record<string, string> = paidy612Active(now) ? { "data-6-pay-enabled": "", "data-12-pay-enabled": "" } : {};
  return {
    className: "_paidy-promotional-messaging",
    "data-amount": String(amountJpy),
    "data-alignment": "start",
    "data-font-size": "13px",
    "data-logo-color": "magenta",
    // A presence flag in Paidy's manual; "" renders it bare, never "true".
    "data-display-installment-months": "",
    ...plans612,
  };
}
