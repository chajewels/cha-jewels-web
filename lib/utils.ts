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
export const toPhp = (jpy: number, rate: number) => Math.round(jpy * rate);
