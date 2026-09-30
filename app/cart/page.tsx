import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { Info, Lock } from "lucide-react";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { readCart, hydrateCart, cartSubtotal, type CartItem } from "@/lib/cart";
import { catalogue, isAvailable } from "@/lib/catalog-context";
import { CartLines } from "@/components/commerce/cart-lines";
import { CommerceStyle, Notice, OrderSlab, StickyAct } from "@/components/commerce/commerce-ui";
import { ProductTrust } from "@/components/catalog/product-trust";
import { ProductCard } from "@/components/catalog/product-card";
import { cartItemName } from "@/lib/catalog-i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { formatMoney, formatYenPeso, isFigure } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";

export const generateMetadata = () => pageMeta("cart");
// The cart is a cookie and prices are live; there is nothing here to cache.
export const dynamic = "force-dynamic";

/**
 * THE CART (build step 3; comp page-comps/cart-checkout "Cart", NOTES and
 * INVESTIGATION §6). Two columns from `lg`:
 *
 *   left    the lines (components/commerce/cart-lines), the "a cart does not
 *           hold the piece" note, and real available pieces
 *   right   the dark summary slab with the page's ONE orange action,
 *           "Continue to reserve" (D3-3); the trust rows (D3-17, the product
 *           page's approved wording); Continue shopping
 *
 * Below `lg` the orange action moves to the sticky bar (D3-5) and the tab bar
 * steps aside while it is there.
 *
 * MONEY. The subtotal is the cart's re-read Hub prices (yen), as before; the
 * English reserve line is the variant's Hub down payment, shown only for a
 * single piece and only when BOTH Hub figures exist (D3-14). Shipping is
 * never a number here — the Hub prices it after the address (D3-2).
 *
 * EMPTY. Not a dead end (D3-18): one sentence, an outline button, and the
 * pieces available now from live stock. No orange.
 */
export default async function CartPage() {
  const [lang, lines] = await Promise.all([getLang(), readCart()]);
  const t = tr(lang);
  const [{ items, dropped }, all] = await Promise.all([hydrateCart(lines), catalogue()]);
  const subtotal = cartSubtotal(items);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const countLabel = count === 1 ? t("cart", "pieceOne") : t("cart", "pieces", { n: String(count) });

  if (items.length === 0) {
    const now = all.filter(isAvailable).slice(0, 4);
    return (
      <section className="pb-24 pt-[clamp(24px,5vw,48px)]">
        <CommerceStyle />
        <div className="wrap">
          <PageHead eyebrow={t("cart", "pieces", { n: "0" })} title={t("cart", "h1")} />
          {dropped > 0 && <Notice icon={<Info className="h-5 w-5" strokeWidth={1.5} />} className="mb-6">{t("cart", "dropped")}</Notice>}
          <div className="grid items-center gap-5 border border-hairline bg-white p-5 sm:grid-cols-[1fr_auto] sm:p-7">
            <div>
              <p className="font-display text-[22px] text-charcoal-deep">{t("cart", "empty")}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-charcoal/75">{t("cart", "emptyHelp")}</p>
            </div>
            <Button asChild variant="outline"><Link href="/collections">{t("cart", "browse")}</Link></Button>
          </div>
          {now.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-[18px] font-display text-[22px] text-charcoal-deep">{t("cart", "availableNow")}</h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[834px]:grid-cols-4 min-[834px]:gap-x-6">
                {now.map((p, i) => <ProductCard key={p.slug} product={p} lang={lang} index={i} />)}
              </div>
            </section>
          )}
        </div>
      </section>
    );
  }

  const more = alsoLike(items, all).slice(0, 3);
  const single = items.length === 1 && items[0].qty === 1 ? items[0] : null;
  const dp = single && layawayOffered(lang) && isFigure(single.down_payment_jpy) && isFigure(single.down_payment_php)
    ? formatYenPeso(single.down_payment_jpy, single.down_payment_php)
    : null;
  const [pre, post] = t("product", "orReserve", { dp: "\u0001" }).split("\u0001");

  return (
    <section className="pb-24 pt-[clamp(24px,5vw,48px)]">
      <CommerceStyle />
      <div className="wrap">
        <PageHead eyebrow={countLabel} title={t("cart", "h1")} />
        {dropped > 0 && <Notice icon={<Info className="h-5 w-5" strokeWidth={1.5} />} className="mb-6">{t("cart", "dropped")}</Notice>}
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <CartLines items={items} lang={lang} />
            <Notice icon={<Lock className="h-5 w-5" strokeWidth={1.5} />} className="mt-4">{t("cart", "notHeld")}</Notice>
            {more.length > 0 && (
              <section className="mt-12">
                <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-x-4">
                  <h2 className="font-display text-[22px] text-charcoal-deep">{t("cart", "youMayLike")}</h2>
                  <Link href="/collections" className="inline-flex min-h-11 items-center text-sm font-medium text-gold-dark underline-offset-4 hover:underline">{t("cart", "browse")}</Link>
                </div>
                <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-3 sm:gap-x-4 lg:gap-x-6">
                  {more.map((p, i) => <div key={p.slug} className={i === 2 ? "hidden sm:block" : undefined}><ProductCard product={p} lang={lang} index={i} /></div>)}
                </div>
              </section>
            )}
          </div>
          <div className="grid gap-4">
            <OrderSlab
              title={t("cart", "summaryH")}
              lines={items.map((i) => ({ key: i.variant_id, name: cartItemName(i, lang), image: i.picture, price: formatMoney(i.line_total_jpy) }))}
              rows={[
                { k: t("cart", "subtotal"), v: formatMoney(subtotal) },
                { k: t("checkout", "shipping"), v: t("cart", "shippingCalc") },
              ]}
              total={{
                k: t("checkout", "cartTotal"),
                v: formatMoney(subtotal),
                sub: dp ? <>{pre}<b className="font-medium text-gold-pale">{dp}</b>{post}</> : undefined,
              }}
            >
              <Button asChild className="mt-[18px] hidden w-full lg:inline-flex"><Link href="/checkout">{t("cart", "checkout")}</Link></Button>
              <p className="mt-3 text-[13px] leading-relaxed text-chalk/80">{t("cart", "shippingNote")}</p>
            </OrderSlab>
            <div className="border border-hairline bg-white px-4"><ProductTrust lang={lang} /></div>
            <Link href="/collections" className="inline-flex min-h-11 items-center text-sm font-medium text-charcoal/80 hover:text-charcoal-deep">← {t("cart", "continueShopping")}</Link>
          </div>
        </div>
      </div>
      <StickyAct label={t("cart", "summaryH")} figure={formatMoney(subtotal)} note={t("cart", "plusShipping")}>
        <Button asChild><Link href="/checkout">{t("cart", "checkoutShort")}</Link></Button>
      </StickyAct>
    </section>
  );
}

function PageHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6 sm:mb-8">
      <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark before:h-px before:w-8 before:bg-gold-dark">{eyebrow}</p>
      <h1 className="mt-2.5 text-[clamp(34px,4.4vw,56px)]">{title}</h1>
    </div>
  );
}

/** Available pieces that share a category with the cart first, then any available piece, in the Hub's order. */
function alsoLike(items: CartItem[], all: Product[]): Product[] {
  const inCart = new Set(items.map((i) => i.slug));
  const pool = all.filter((p) => !inCart.has(p.slug) && isAvailable(p));
  const cats = new Set(all.filter((p) => inCart.has(p.slug)).flatMap((p) => p.category_slugs ?? []));
  const near = pool.filter((p) => (p.category_slugs ?? []).some((c) => cats.has(c)));
  return [...near, ...pool.filter((p) => !near.includes(p))];
}
