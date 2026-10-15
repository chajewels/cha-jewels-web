import { ComponentStyle } from "@/components/fx/component-style";
import { formatMoney, cn } from "@/lib/utils";
import { tr, type Lang } from "@/lib/i18n";
import { struckFullPrice } from "@/lib/sale";

/**
 * A PRICE, AND ON A SALE THE REGULAR PRICE STRUCK BESIDE IT (owner decisions
 * 2026-10-15). Renders inside the caller's own price element, which keeps its
 * font, size and colour; with no sale (or a sold piece) the output is the
 * formatted price alone — exactly what the surface rendered before.
 *
 * On a sale: the Hub's `full_price_jpy` struck, the price, then a "Sale" tag.
 * `size="lg"` (the product page's price card) stacks the struck figure above
 * the price; the other sizes keep one line that wraps between the three.
 *
 * D2-5 (revised 2026-10-15): a strike means a sale and only a sale — the Hub's
 * full_price_jpy struck beside the sale price. A sold piece is muted
 * (opacity/colour), never struck.
 *
 * Tones, measured in scripts/check-contrast.mjs: on dark bands the struck
 * figure is chalk/60; on light cards charcoal/70 (charcoal/60 is 3.5:1 on
 * white and fails). The tag is chalk on gold-dark on both.
 */
const CSS = `
.badge-status { display: inline-flex; align-items: center; min-height: 24px; padding: 3px 10px; font-size: 11px; font-weight: 600; line-height: 1.3; letter-spacing: .12em; text-transform: uppercase; }
:lang(ja) .badge-status { letter-spacing: .04em; text-transform: none; }
.sale-tag { vertical-align: middle; font-family: var(--font-sans), system-ui, sans-serif; white-space: nowrap; }
.sale-tag[data-size="sm"] { min-height: 20px; padding: 1px 7px; font-size: 10px; }`;

export function SalePrice({ price, full, onSale, sold = false, lang, tone, size = "md" }: {
  price: number;
  /** The variant's `full_price_jpy`, as the Hub sent it. */
  full?: number | null;
  /** The variant's `on_sale`, as the Hub sent it. */
  onSale?: boolean;
  sold?: boolean;
  lang: Lang;
  /** `dark`: gold-pale/chalk bands. `light`: white and chalk cards. */
  tone: "dark" | "light";
  size?: "sm" | "md" | "lg";
}) {
  const struck = struckFullPrice({ full, onSale, sold });
  if (struck == null) return <>{formatMoney(price)}</>;
  const t = tr(lang);
  return (
    <>
      <ComponentStyle id="fx-sale" css={CSS} />
      <s className={cn(
        "font-display [font-feature-settings:'lnum'_1,'tnum'_1] [font-variant-numeric:lining-nums_tabular-nums]",
        tone === "dark" ? "text-chalk/60" : "text-charcoal/70",
        size === "lg" ? "mb-1 block text-[0.55em] leading-tight" : "text-[0.78em]",
      )}>
        <span className="sr-only">{t("product", "wasPrice")} </span>{formatMoney(struck)}
      </s>
      {/* A real space, so a narrow card can wrap the price under the strike. */}
      {size === "lg" ? null : " "}
      <span className="whitespace-nowrap">{formatMoney(price)}</span>
      {" "}
      <span data-size={size === "lg" ? undefined : size} className="badge-status sale-tag ml-[0.3em] bg-gold-dark text-chalk">{t("product", "sale")}</span>
    </>
  );
}
