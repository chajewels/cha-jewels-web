import Link from "next/link";
import { cartCount } from "@/lib/cart";
import { tr, type Lang } from "@/lib/i18n";

/**
 * Header cart link with a live count. Server component — the count comes
 * straight from the cookie, so it is correct on first paint with no client
 * fetch and no flash of an empty badge.
 *
 * The word is hidden below `sm`: the header already carries a logo, a language
 * switcher and the menu trigger at 375px, and a wrapping two-character label
 * looked broken. The bag glyph plus the count reads fine on its own, and the
 * aria-label still says "Cart".
 */
export async function CartButton({ lang }: { lang: Lang }) {
  const count = await cartCount();
  const t = tr(lang);
  const label = count > 0 ? `${t("nav", "cart")} (${count})` : t("nav", "cart");

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-sm border border-gold px-3 text-sm text-gold-pale hover:border-gold-pale"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z" />
        <path d="M9 8V6a3 3 0 1 1 6 0v2" />
      </svg>
      <span className="hidden sm:inline">{t("nav", "cart")}</span>
      {count > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-medium text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}
