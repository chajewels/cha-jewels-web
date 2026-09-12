import type { Lang } from "./i18n";
import type { Product } from "./types";

/**
 * Metal stamps, shown exactly as stamped. 750 and 18K are NOT folded into K18
 * and nothing is merged into a combined label: a Tiffany piece stamped 750
 * says 750. The one display mapping is SILVER925 → シルバー925 / Silver 925.
 * A piece can carry several stamps (PT900/K18), in the Hub's order.
 */
export const METALS = [
  "K24", "K18", "750", "18K", "K14", "K10",
  "PT1000", "PT950", "PT900", "PT850", "PM", "PM900",
  "SILVER925",
] as const;
export type Metal = (typeof METALS)[number];

/** The stamps on a piece. `metals` from the Hub; `karat` is the one-release fallback for an older response. */
export function productMetals(p: Pick<Product, "metals" | "karat">): string[] {
  const list = (p.metals ?? []).filter((m) => typeof m === "string" && m.trim());
  if (list.length) return list;
  return p.karat ? [p.karat] : [];
}

export function metalLabel(m: string, lang: Lang): string {
  return m === "SILVER925" ? (lang === "ja" ? "シルバー925" : "Silver 925") : m;
}

/** "PT900 / K18" — every stamp, joined, or an em dash when the Hub sent none. */
export function metalsLabel(list: string[], lang: Lang): string {
  return list.length ? list.map((m) => metalLabel(m, lang)).join(" / ") : "—";
}
