import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { readSession, customerFirstName } from "@/lib/session";
import { LangSwitcher } from "./lang-switcher";
import { MobileNav } from "./mobile-nav";
import { CartButton } from "./cart-button";
import { AccountMenu } from "./account-menu";
import { Button } from "@/components/ui/button";

/**
 * Signed out: the nav's last link is "Account" → /login. Signed in: that link
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
    { href: "/layaway", label: t("nav", "layaway") },
    { href: "/loyalty", label: t("nav", "loyalty") },
    { href: "/wholesale", label: t("nav", "wholesale") },
    { href: "/blog", label: t("nav", "blog") },
    ...(session ? [] : [{ href: "/login", label: t("nav", "account") }]),
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
    <header className="sticky top-0 z-40 border-b border-rule bg-velvet/90 backdrop-blur">
      <div className="wrap flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="gilt whitespace-nowrap font-display text-[26px] font-medium tracking-wide" aria-label="Cha Jewels">Cha Jewels</Link>
        <nav aria-label={t("nav", "primary")} className="hidden xl:block"><ul className="flex gap-5 whitespace-nowrap text-sm text-champagne/75">{links.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-gold-pale">{l.label}</Link></li>)}</ul></nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LangSwitcher lang={lang} />
          <CartButton lang={lang} />
          {account && <div className="hidden xl:block"><AccountMenu name={account.name} items={account.items} signOut={account.signOut} menuLabel={account.menuLabel} /></div>}
          <Button asChild variant="ghost" className="hidden min-h-10 whitespace-nowrap px-4 text-sm xl:inline-flex"><Link href="/live">{t("nav", "claim")}</Link></Button>
          <MobileNav links={links} claim={t("nav", "claim")} openLabel={t("nav", "openMenu")} closeLabel={t("nav", "closeMenu")} account={account} />
        </div>
      </div>
    </header>
  );
}
