import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export type Region = "JP";
export type Currency = "JPY" | "PHP";
export function formatMoney(amount: number, cur: Region | Currency = "JPY") {
  return cur === "PHP"
    ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(amount)
    : new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(amount);
}
/**
 * A yen figure and its peso twin, both FROM THE HUB, in the owner's format
 * (D3, 2026-09-25): "¥21,894 (₱8,699)" — yen first, peso in brackets. This
 * formats two numbers it is given; it never derives one from the other.
 */
export function formatYenPeso(jpy: number, php: number) {
  return `${formatMoney(jpy, "JPY")} (${formatMoney(php, "PHP")})`;
}
/**
 * Weight in grams (owner, 2026-10-03): two decimals — the Hub stores weight_g
 * as numeric(8,2) and its editor shows "8.80", but JSON drops the trailing
 * zero (8.80 → 8.8), so the site restores it — except a whole number of
 * grams, which shows none ("19 g", not "19.00 g"; owner refinement the same
 * day). Null / 0 / NaN → null (no weight line), never "0.00 g".
 */
export function formatWeight(g: number | null | undefined): string | null {
  if (typeof g !== "number" || !Number.isFinite(g) || g <= 0) return null;
  return Number.isInteger(g) ? `${g} g` : `${g.toFixed(2)} g`;
}
/** A number the Hub actually sent — not absent, not null, not NaN. */
export const isFigure = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);
