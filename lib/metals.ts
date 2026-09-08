import type { Lang } from "./i18n";
/** Metal values accepted from the Hub. 750 / Au750 / 18K are the SAME metal as K18 and are displayed as K18 (Au750). */
export const METALS = ["K18", "K14", "K10", "PT1000", "PT950", "PT900", "SILVER925"] as const;
export type Metal = (typeof METALS)[number];
export function normalizeMetal(v: string | null | undefined): Metal | null {
  if (!v) return null;
  const k = v.toUpperCase().replace(/\s+/g, "");
  if (["K18", "18K", "750", "AU750"].includes(k)) return "K18";
  if (["K14", "14K", "585"].includes(k)) return "K14";
  if (["K10", "10K", "417"].includes(k)) return "K10";
  if (["SILVER925", "SV925", "925", "SILVER"].includes(k)) return "SILVER925";
  if ((METALS as readonly string[]).includes(k)) return k as Metal;
  return null;
}
export function metalLabel(m: Metal | null, lang: Lang): string {
  if (!m) return "—";
  const map: Record<Metal, Record<Lang, string>> = {
    K18: { ja: "K18 (Au750)", en: "K18 (Au750)" }, K14: { ja: "K14", en: "K14" }, K10: { ja: "K10", en: "K10" },
    PT1000: { ja: "Pt1000", en: "PT1000" }, PT950: { ja: "Pt950", en: "PT950" }, PT900: { ja: "Pt900", en: "PT900" },
    SILVER925: { ja: "シルバー925", en: "Silver 925" },
  };
  return map[m][lang];
}
export const isGold = (m: Metal | null) => m === "K18" || m === "K14" || m === "K10";
