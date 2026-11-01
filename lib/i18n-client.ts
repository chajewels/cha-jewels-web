import type { Lang } from "@/lib/i18n-core";

/**
 * THE CLIENT-SIDE TRANSLATOR (redesign/lumiere P2b; report §10 "per-route
 * dictionaries"). `tr(lang)` in lib/i18n.ts closes over the whole dictionary —
 * 2,000 strings in both languages, 46 kB gzipped — and a client component that
 * imported it shipped all of them on every page. `trOf` closes over only the
 * sections the component hands it, each a generated module under
 * lib/i18n/sections/ (scripts/gen-i18n-sections.mjs), so a page carries the
 * strings its client components name and no more:
 *
 *   import { trOf } from "@/lib/i18n-client";
 *   import { cart } from "@/lib/i18n/sections/cart";
 *   import { product } from "@/lib/i18n/sections/product";
 *   const t = trOf({ cart, product }, lang);
 *   t("cart", "add")
 *
 * The call shape is `tr`'s, so every key keeps working and typechecking;
 * `check:i18n` keeps the generated sections in step with lib/i18n.ts.
 */
type Leaf = { ja: string; en: string };
type Sections = Record<string, Record<string, Leaf>>;

/** The translator `trOf` returns, for a helper that takes one as a parameter. */
export type Translator<D extends Sections> = <S extends keyof D & string, K extends keyof D[S] & string>(section: S, key: K, vars?: Record<string, string>) => string;

export function trOf<D extends Sections>(sections: D, lang: Lang) {
  return function t<S extends keyof D & string, K extends keyof D[S] & string>(section: S, key: K, vars?: Record<string, string>): string {
    let s: string = (sections[section][key] as Leaf)[lang];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  };
}
