import Link from "next/link";
import { cartCount } from "@/lib/cart";
import { tr, type Lang } from "@/lib/i18n";
import { CartBump } from "@/components/fx/cart-bump";

/**
 * Header cart link with a live count. Server component — the count comes
 * straight from the cookie, so it is correct on first paint with no client
 * fetch and no flash of an empty badge.
 *
 * Site frame (2026-09-27): an icon + label tool like Account beside it, no
 * box. The count is a charcoal-deep disc with a gold-pale numeral (10.62:1),
 * not orange: a count is a status, not a buy action (the Orange Means Buy
 * rule). The word shows from `sm`; below it the bag and the count stand alone
 * and the accessible name still says "Cart (n)". 44px tap target.
 */
export async function CartButton({ lang }: { lang: Lang }) {
  const count = await cartCount();
  const t = tr(lang);
  const label = count > 0 ? `${t("nav", "cart")} (${count})` : t("nav", "cart");

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="group inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-1.5 text-sm font-medium text-charcoal-deep hover:text-gold-dark sm:px-2"
    >
      {/* Bumps once when a piece is added (components/fx/cart-bump.tsx). */}
      <span className="relative inline-flex">
        <CartBump>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z" />
            <path d="M9 8V6a3 3 0 1 1 6 0v2" />
          </svg>
        </CartBump>
        {count > 0 && (
          <span aria-hidden="true" className="absolute -right-2 -top-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-charcoal-deep px-1 text-[11px] font-semibold leading-none text-gold-pale [font-variant-numeric:lining-nums_tabular-nums]">
            {count}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">{t("nav", "cart")}</span>
    </Link>
  );
}
