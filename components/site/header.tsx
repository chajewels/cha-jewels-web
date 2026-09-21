import Link from "next/link";
import { Info, Gem, CircleHelp, BookOpen, Megaphone, MessageCircle, Landmark } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { getCollections } from "@/lib/queries/products";
import { hub } from "@/lib/hub-api";
import { collectionName } from "@/lib/catalog-i18n";
import { NavMenu, NavMenuItem } from "./nav-menu";
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
 * wordmark, the primary nav, search, the EN/JA toggle and the cart. No
 * currency toggle. mobile-nav.tsx and flash-notice.tsx offset by the 68px row.
 *
 * Below `sm` the row keeps four controls — badge + wordmark, magnifier, cart,
 * menu — and the language toggle moves into the drawer, next to the search
 * box. Five controls overflowed a 375px viewport by 52px (scrollWidth 427).
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
  // The catalog reads are the homepage's own: hub-api's `call` defaults to
  // next { revalidate: 60, tags: ["catalog"] }, so the menu is cached and
  // revalidated on the same terms as every other catalog surface, and a Hub
  // that cannot answer costs the customer a menu section, not the header.
  const [session, collections, categories] = await Promise.all([
    readSession(),
    getCollections().catch(() => []),
    hub.categories().catch(() => []),
  ]);
  const name = session ? (await customerFirstName(session)) ?? t("accountMenu", "fallback") : null;

  // Two items point at /blog until News is filtered (plan §2), so the key is
  // explicit rather than the href.
  const companyItems = [
    { key: "about", href: "/about", label: t("navMenu", "about"), desc: t("navMenu", "aboutDesc"), icon: <Info className="h-5 w-5" /> },
    { key: "why", href: "/why-cha-jewels", label: t("navMenu", "why"), desc: t("navMenu", "whyDesc"), icon: <Gem className="h-5 w-5" /> },
    { key: "faq", href: "/faq", label: t("navMenu", "faq"), desc: t("navMenu", "faqDesc"), icon: <CircleHelp className="h-5 w-5" /> },
    { key: "blog", href: "/blog", label: t("navMenu", "blog"), desc: t("navMenu", "blogDesc"), icon: <BookOpen className="h-5 w-5" /> },
    { key: "news", href: "/blog", label: t("navMenu", "news"), desc: t("navMenu", "newsDesc"), icon: <Megaphone className="h-5 w-5" /> },
    { key: "contact", href: "/contact", label: t("navMenu", "contact"), desc: t("navMenu", "contactDesc"), icon: <MessageCircle className="h-5 w-5" /> },
    { key: "affiliations", href: "/affiliations", label: t("navMenu", "affiliations"), desc: t("navMenu", "affiliationsDesc"), icon: <Landmark className="h-5 w-5" /> },
  ];

  const typeItems = collections.map((c) => ({ key: c.slug, href: `/collections/${c.slug}`, label: collectionName(c, lang) }));
  const categoryItems = categories.map((c) => ({ key: c.slug, href: `/categories/${c.slug}`, label: lang === "ja" ? c.name_ja ?? c.name : c.name }));

  // The drawer carries the same destinations without the descriptions.
  const groups = [
    { key: "company", label: t("navMenu", "company"), sections: [{ items: companyItems.map(({ key, href, label }) => ({ key, href, label })) }] },
    {
      key: "collections",
      label: t("navMenu", "collections"),
      sections: [
        { heading: t("navMenu", "shopByType"), items: typeItems },
        { heading: t("navMenu", "categories"), items: categoryItems },
        { items: [{ key: "all", href: "/collections", label: t("navMenu", "viewAll") }] },
      ],
    },
  ];

  const links: { href: string; label: string }[] = [
    { href: "/", label: t("nav", "home") },
    // Layaway is offered in English only (owner decision 2026-09-15) — one rule,
    // in lib/layaway-availability. The ACCOUNT entry below is deliberately NOT
    // gated: an existing plan must stay reachable in either language.
    ...(layawayOffered(lang) ? [{ href: "/layaway", label: t("nav", "layaway") }] : []),
    { href: "/loyalty", label: t("nav", "loyalty") },
    { href: "/wholesale", label: t("nav", "wholesale") },
    // Blog is NOT here: it is a Company item now, and carrying it in both
    // places gave the same destination two rows in one nav.
    ...(session ? [] : [{ href: "/account", label: t("nav", "account") }]),
  ];
  const tailLinks = links.filter((l) => l.href !== "/");

  const accountItems = [
    { href: "/account", label: t("accountMenu", "myAccount") },
    { href: "/account/orders", label: t("accountMenu", "orders") },
    { href: "/account/layaway", label: t("accountMenu", "layaway") },
    { href: "/account/addresses", label: t("accountMenu", "addresses") },
    { href: "/account/service-requests", label: t("accountMenu", "service") },
    { href: "/account#loyalty", label: t("accountMenu", "points") },
  ];
  const account = session && name ? { name, menuLabel: t("accountMenu", "menu"), items: accountItems, signOut: t("accountMenu", "signOut") } : null;

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-chalk/95 text-charcoal shadow-[0_1px_8px_rgba(0,0,0,0.03)] backdrop-blur-md">
      <div className="wrap flex h-[68px] items-center justify-between gap-3 sm:gap-4">
        <Link href="/" className="flex items-center gap-1.5 whitespace-nowrap sm:gap-3" aria-label="Cha Jewels">
          <img src="/images/brand/logo-badge-96.webp" srcSet="/images/brand/logo-badge-96.webp 1x, /images/brand/logo-badge-192.webp 2x" width={44} height={44} alt="" className="h-11 w-11 shrink-0" />
          <span className="gilt font-display text-[22px] font-medium tracking-wide sm:text-[26px]">Cha Jewels</span>
        </Link>
        <nav aria-label={t("nav", "primary")} className="hidden xl:block">
          <ul className="flex items-center gap-4 whitespace-nowrap text-sm text-charcoal/80 2xl:gap-5">
            <li><Link href="/" className="hover:text-gold-dark">{t("nav", "home")}</Link></li>
            <li>
              <NavMenu label={t("navMenu", "company")} menuLabel={t("navMenu", "companyMenu")}>
                <div className="grid w-[min(92vw,560px)] gap-0.5 md:grid-cols-2">
                  {companyItems.map((it) => (
                    <NavMenuItem key={it.key} href={it.href} title={it.label} description={it.desc} icon={it.icon} />
                  ))}
                </div>
              </NavMenu>
            </li>
            <li>
              <NavMenu label={t("navMenu", "collections")} menuLabel={t("navMenu", "collectionsMenu")}>
                <div className="grid w-[min(92vw,560px)] gap-x-4 md:grid-cols-2">
                  <div>
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal/70">{t("navMenu", "shopByType")}</p>
                    {typeItems.map((it) => <NavMenuItem key={it.key} href={it.href} title={it.label} />)}
                  </div>
                  <div>
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal/70">{t("navMenu", "categories")}</p>
                    {categoryItems.map((it) => <NavMenuItem key={it.key} href={it.href} title={it.label} />)}
                  </div>
                </div>
                <div className="mt-2 border-t border-hairline pt-2">
                  <NavMenuItem href="/collections" title={t("navMenu", "viewAll")} />
                </div>
              </NavMenu>
            </li>
            {tailLinks.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-gold-dark">{l.label}</Link></li>)}
          </ul>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <SearchBox lang={lang} />
          <div className="hidden sm:block"><LangSwitcher lang={lang} /></div>
          <CartButton lang={lang} />
          {account && <div className="hidden xl:block"><AccountMenu name={account.name} items={account.items} signOut={account.signOut} menuLabel={account.menuLabel} /></div>}
          <MobileNav lang={lang} links={links} groups={groups} openLabel={t("nav", "openMenu")} closeLabel={t("nav", "closeMenu")} account={account} />
        </div>
      </div>
    </header>
  );
}
