import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { readCart, hydrateCart, cartSubtotal } from "@/lib/cart";
import { CartLines } from "@/components/commerce/cart-lines";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const generateMetadata = () => pageMeta("cart");
// The cart is a cookie and prices are live; there is nothing here to cache.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [lang, lines] = await Promise.all([getLang(), readCart()]);
  const t = tr(lang);
  const { items, dropped } = await hydrateCart(lines);
  const subtotal = cartSubtotal(items);

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[900px]">
        <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("cart", "h1")}</h1>

        {dropped > 0 && (
          <p className="mt-6 border border-gold px-4 py-3 text-sm text-gold-pale">{t("cart", "dropped")}</p>
        )}

        {items.length === 0 ? (
          <div className="mt-10">
            <p className="text-champagne/75">{t("cart", "empty")}</p>
            <Button asChild variant="ghost" className="mt-6"><Link href="/collections">{t("cart", "browse")}</Link></Button>
          </div>
        ) : (
          <>
            <div className="mt-10"><CartLines items={items} lang={lang} /></div>
            <div className="mt-8 border-t border-gold pt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-champagne/70">{t("cart", "subtotal")}</span>
                <span className="font-display text-3xl text-gold-pale">{formatMoney(subtotal)}</span>
              </div>
              <p className="mt-2 text-sm text-champagne/55">{t("cart", "shippingNote")}</p>
              <Button asChild className="mt-6 w-full sm:w-auto"><Link href="/checkout">{t("cart", "checkout")}</Link></Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
