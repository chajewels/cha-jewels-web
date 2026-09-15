import type { Lang } from "@/lib/i18n";
import type { Collection, HubOrderItem, HubQuoteItem, Product } from "@/lib/types";
import type { CartItem } from "@/lib/cart";

/**
 * One rule for every piece of catalog copy: the current language's field,
 * falling back to English when the Japanese is empty (and to Japanese when
 * the English is, so nothing ever renders blank). Components call these and
 * never read a `_ja` / `_en` column directly — that is how a collection name
 * or a product title ends up hardcoded in one language.
 */
function pick(lang: Lang, ja: string | null | undefined, en: string | null | undefined): string {
  const j = ja?.trim() ?? "";
  const e = en?.trim() ?? "";
  if (lang === "ja") return j || e;
  return e || j;
}

export const productName = (p: Pick<Product, "name" | "name_en" | "name_ja">, lang: Lang) =>
  pick(lang, p.name_ja, p.name_en ?? p.name);
export const productDescription = (p: Pick<Product, "description_en" | "description_ja">, lang: Lang) =>
  pick(lang, p.description_ja, p.description_en) || null;

export const collectionName = (c: Pick<Collection, "name" | "name_en" | "name_ja">, lang: Lang) =>
  pick(lang, c.name_ja, c.name_en ?? c.name);
export const collectionDescription = (c: Pick<Collection, "description" | "description_en" | "description_ja">, lang: Lang) =>
  pick(lang, c.description_ja, c.description_en ?? c.description) || null;

export const quoteItemName = (i: Pick<HubQuoteItem, "name" | "name_en" | "name_ja">, lang: Lang) =>
  pick(lang, i.name_ja, i.name_en ?? i.name);
export const cartItemName = (i: Pick<CartItem, "name" | "name_ja">, lang: Lang) =>
  pick(lang, i.name_ja, i.name);
export const orderLineTitle = (l: Pick<HubOrderItem, "title" | "title_ja">, lang: Lang) =>
  pick(lang, l.title_ja, l.title);
