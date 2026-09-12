import type { Product } from "./types";
import type { Lang } from "./i18n";
import { productName } from "./catalog-i18n";
import { productMetals } from "./metals";
export type CatalogParams = Record<string, string | string[] | undefined>;
export function readFilters(params: CatalogParams) {
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const rawBudget = value("maxPrice");
  const budget = Number(rawBudget);
  return {
    q: value("q").trim().slice(0, 160), metal: value("metal"), stone: value("stone"), size: value("size"),
    condition: ["new", "preloved"].includes(value("condition")) ? value("condition") : "",
    stock: value("stock") === "available", maxPrice: rawBudget && Number.isFinite(budget) && budget >= 0 ? budget : null,
    sort: ["price-asc", "price-desc"].includes(value("sort")) ? value("sort") : "",
  };
}
export type CatalogFilters = ReturnType<typeof readFilters>;
export function filterProducts(products: Product[], filters: CatalogFilters, lang: Lang) {
  const eligible = (p: Product) => p.product_variants.filter(v =>
    (!filters.stock || v.stock_qty > 0) && (!filters.stone || v.stone === filters.stone) &&
    (!filters.size || v.size === filters.size) && (filters.maxPrice === null || v.price_jpy <= filters.maxPrice));
  const matches = products.filter(p =>
    (!filters.q || `${productName(p, lang)} ${p.sku}`.toLocaleLowerCase().includes(filters.q.toLocaleLowerCase())) &&
    (!filters.metal || productMetals(p).includes(filters.metal)) &&
    (!filters.condition || (filters.condition === "preloved" ? p.condition === "Preloved" : p.condition !== "Preloved")) &&
    eligible(p).length > 0);
  const price = (p: Product) => Math.min(...eligible(p).map(v => v.price_jpy));
  return filters.sort ? matches.sort((a, b) => filters.sort === "price-asc" ? price(a) - price(b) : price(b) - price(a)) : matches;
}
