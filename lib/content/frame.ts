import type { Lang } from "@/lib/i18n";

/**
 * One line under each category in the Collections menu (site frame, build
 * step 1; wording from the comp, page-comps/site-frame, pending owner review).
 *
 * Content, not chrome: it describes what a category holds, so it lives here
 * with the rest of the site copy and moves to the Hub with it (PRODUCT.md,
 * content architecture). Keyed by the Hub's category slug. A category the Hub
 * adds and this table does not know simply shows its name alone; nothing is
 * invented for it.
 *
 * No brand is named and no origin is claimed (CLAUDE.md, terminology).
 */
export const CATEGORY_BLURB: Record<string, Record<Lang, string>> = {
  "fine-jewelry": { ja: "新作のゴールド・パール・ダイヤモンド", en: "New gold, pearl and diamond" },
  "preloved-jewelry": { ja: "ノンブランドのゴールド・プラチナ", en: "Unbranded gold and platinum" },
  "preloved-branded-jewelry": { ja: "ジュエリーハウスのシグネチャー", en: "Signature pieces from jewelry houses" },
  "preloved-watches": { ja: "厳選したブランドウォッチ", en: "Selected branded watches" },
  "preloved-designer-accessories": { ja: "財布、カードケース、ベルト", en: "Wallets, card cases, belts" },
};

export const categoryBlurb = (slug: string, lang: Lang): string | null => CATEGORY_BLURB[slug]?.[lang] ?? null;
