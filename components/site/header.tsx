import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { readSession, customerFirstName } from "@/lib/session";
import { LangSwitcher } from "./lang-switcher";
import { SearchBox } from "./search-box";
import { MobileNav } from "./mobile-nav";
import { CartButton } from "./cart-button";
import { AccountMenu } from "./account-menu";

/**
 * The Stitch header (docs/stitch/cha-desktop.html §2) without its top bar
 * (owner decision 2026-09-20): one light chalk 68px row with the badge, the
 * wordmark, the primary nav, the EN/JA toggle and the cart. No currency
 * toggle. mobile-nav.tsx and flash-notice.tsx offset by the 68px row.
 *
 * Signed out: the nav's last link is "Account" → /account, which redirects to
 * /login?next=/account itself (the file's route). Signed in: that link
 * goes, and the customer's given name (or the generic label) opens the account
 * menu next to the cart on desktop; the drawer carries the same list below `xl`.
 * Signed-in state comes from the auth cookie only (lib/session.ts) — no Auth
 * round trip on public pages, and never a token refresh from a layout.
 */
export async function Header({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const session = await readSession();
  const name = session ? (await customerFirstName(session)) ?? t("accountMenu", "fallback") : null;

  const links: { href: string; label: string }[] = [
    { href: "/", label: t("nav", "home") },
    { href: "/about", label: t("nav", "about") },
    { href: "/collections", label: t("nav", "collections") },
    // Layaway is offered in English only (owner decision 2026-09-15) — one rule,
    // in lib/layaway-availability. The ACCOUNT entry below is deliberately NOT
    // gated: an existing plan must stay reachable in either language.
    ...(layawayOffered(lang) ? [{ href: "/layaway", label: t("nav", "layaway") }] : []),
    { href: "/loyalty", label: t("nav", "loyalty") },
    { href: "/wholesale", label: t("nav", "wholesale") },
    { href: "/blog", label: t("nav", "blog") },
    ...(session ? [] : [{ href: "/account", label: t("nav", "account") }]),
  ];
  const accountItems = [
    { href: "/account", label: t("accountMenu", "myAccount") },
    { href: "/account/orders", label: t("accountMenu", "orders") },
    { href: "/account/layaway", label: t("accountMenu", "layaway") },
    { href: "/account/addresses", label: t("accountMenu", "addresses") },
    { href: "/account#loyalty", label: t("accountMenu", "points") },
  ];
  const account = session && name ? { name, menuLabel: t("accountMenu", "menu"), items: accountItems, signOut: t("accountMenu", "signOut") } : null;

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-chalk/95 text-charcoal shadow-[0_1px_8px_rgba(0,0,0,0.03)] backdrop-blur-md">
      <div className="wrap flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 whitespace-nowrap" aria-label="Cha Jewels">
          <img src="/images/brand/logo-badge-96.webp" srcSet="/images/brand/logo-badge-96.webp 1x, /images/brand/logo-badge-192.webp 2x" width={44} height={44} alt="" className="h-11 w-11 shrink-0" />
          <span className="gilt font-display text-[26px] font-medium tracking-wide">Cha Jewels</span>
        </Link>
        <nav aria-label={t("nav", "primary")} className="hidden xl:block"><ul className="flex gap-5 whitespace-nowrap text-sm text-charcoal/80">{links.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-gold-dark">{l.label}</Link></li>)}</ul></nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <SearchBox lang={lang} />
          <LangSwitcher lang={lang} />
          <CartButton lang={lang} />
          {account && <div className="hidden xl:block"><AccountMenu name={account.name} items={account.items} signOut={account.signOut} menuLabel={account.menuLabel} /></div>}
          <MobileNav lang={lang} links={links} openLabel={t("nav", "openMenu")} closeLabel={t("nav", "closeMenu")} account={account} />
        </div>
      </div>
    </header>
  );
}
