import Link from "next/link";
import { Suspense } from "react";
import { User } from "lucide-react";

import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import { localePath } from "@/lib/locale";
import type { SwitchTargets } from "@/lib/locale-nav";
import { layawayOffered } from "@/lib/layaway-availability";
import { getCollections } from "@/lib/queries/products";
import { collectionName } from "@/lib/catalog-i18n";
import { readSession, customerFirstName } from "@/lib/session";
import { saleListed } from "@/lib/sale";
import { catalogue } from "@/lib/catalog-context";
import { follow } from "@/lib/settings";
import { LUMIERE_HOME_STRINGS, lumiereCollections } from "@/lib/content/lumiere-home";
import type { HeroChrome, HeroNavLink } from "@/components/lumiere/hero/hero-content";
import { CartButton } from "@/components/site/cart-button";
import { AccountMenu } from "@/components/site/account-menu";
import { LangSwitcher } from "@/components/site/lang-switcher";
import type { CrawlLink } from "@/components/site/crawl-links";
import { SearchTrigger } from "./search-trigger";

/**
 * THE CHROME'S DATA, built once per request on the server for whichever
 * header renders it — the hero's header on the home (components/lumiere/
 * home/home-view.tsx) and the fixed site header on every other page
 * (components/lumiere/site/site-chrome.tsx, P3). One builder, so the two can
 * never list different destinations:
 *
 *   nav        the D-18 labels — Collections · Blog · About · Layaway (EN) /
 *              Jewelry Guide (JA)
 *   utilities  the site's own controls, rendered here and handed down as
 *              nodes: the JA/EN toggle (JA first), the account menu (signed
 *              in) or the account link, the live cart count (CartBump), the
 *              search trigger (the full-screen overlay loads on the first press)
 *   menu       every existing destination in groups — the categories (§14
 *              short names), the Hub's collections, the company pages, Sale
 *              while something is on sale, the guides, layaway (EN)
 *   crawl      the same destinations as plain hidden links while the menu is
 *              closed (components/site/crawl-links.tsx), so a crawler reading
 *              the server HTML finds them
 *   messenger  the Hub's Messenger link, for the menu's action
 *
 * Every Hub read is caught: the chrome degrades, it never breaks a page (the
 * rule components/site/header.tsx set).
 */
export interface LumiereChromeData {
  chrome: HeroChrome;
  crawl: CrawlLink[];
  messenger: { href: string; label: string } | null;
}

export const buildChrome = async ({ lang, switchTargets, demo = false }: { lang: Lang; switchTargets?: SwitchTargets; demo?: boolean }): Promise<LumiereChromeData> => {
  const L = (h: string) => localePath(h, lang);
  const t = tr(lang);
  const layaway = layawayOffered(lang);
  const strings = LUMIERE_HOME_STRINGS[lang];
  const categoryHref = (slug: string) => L(`/categories/${slug}`);

  const [session, collections, saleCount, followLinks] = await Promise.all([
    readSession(),
    getCollections().catch(() => []),
    catalogue().then((all) => all.filter(saleListed).length).catch(() => 0),
    follow().catch(() => []),
  ]);

  const fallbackName = t("accountMenu", "fallback");
  const accountItems = [
    { href: L("/account"), label: t("accountMenu", "myAccount") },
    { href: L("/account/orders"), label: t("accountMenu", "orders") },
    ...(layaway ? [{ href: L("/account/layaway"), label: t("accountMenu", "layaway") }] : []),
    { href: L("/account/receipts"), label: t("accountMenu", "receipts") },
    { href: L("/account/addresses"), label: t("accountMenu", "addresses") },
    { href: L("/account/service-requests"), label: t("accountMenu", "service") },
    { href: L("/account#loyalty"), label: t("accountMenu", "points") },
  ];
  const account = session ? (
    <AccountMenu
      name={<Suspense fallback={fallbackName}><AccountName session={session} fallback={fallbackName} /></Suspense>}
      items={accountItems}
      signOut={t("accountMenu", "signOut")}
      menuLabel={t("accountMenu", "menu")}
    />
  ) : (
    <Link href={L("/account")} className="inline-flex min-h-[44px] items-center gap-1 whitespace-nowrap">
      <User aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
      <span>{t("nav", "account")}</span>
    </Link>
  );

  // D-18: Collections · Blog · About · Layaway (EN) / Jewelry Guide (JA).
  const nav: HeroNavLink[] = [
    { label: t("nav", "collections"), href: L("/collections") },
    { label: t("nav", "blog"), href: L("/blog") },
    { label: t("nav", "about"), href: L("/about") },
    layaway ? { label: t("nav", "layaway"), href: L("/layaway") } : { label: t("nav", "jewelryGuide"), href: L("/jewelry-guide") },
  ];

  // The menu lists every existing destination (report §8 "Nav").
  const categoryGroup = lumiereCollections(lang, categoryHref).cards.map((card) => ({ label: card.category.title.map((r) => r.text).join("").replace(/[.。]$/, ""), href: card.href }));
  const menu: HeroChrome["menu"] = [
    { title: t("navMenu", "categories"), links: [...categoryGroup, { label: t("navMenu", "viewAll"), href: L("/collections") }] },
    ...(collections.length ? [{ title: t("navMenu", "shopByType"), links: collections.map((c) => ({ label: collectionName(c, lang), href: L(`/collections/${c.slug}`) })) }] : []),
    {
      title: t("navMenu", "company"),
      links: [
        { label: t("navMenu", "why"), href: L("/why-cha-jewels") },
        { label: t("navMenu", "faq"), href: L("/faq") },
        { label: t("navMenu", "news"), href: L("/blog?type=news") },
        { label: t("navMenu", "contact"), href: L("/contact") },
        { label: t("navMenu", "affiliations"), href: L("/affiliations") },
        ...(saleCount > 0 ? [{ label: t("nav", "sale"), href: L("/sale") }] : []),
        { label: t("nav", "loyalty"), href: L("/loyalty") },
        { label: t("nav", "wholesale"), href: L("/wholesale") },
        { label: t("nav", "shoppingGuide"), href: L("/shopping-guide") },
        ...(layaway ? [{ label: t("nav", "jewelryGuide"), href: L("/jewelry-guide") }] : []),
      ],
    },
  ];

  const messengerHref = followLinks.find((l) => l.key === "messenger")?.href ?? null;

  return {
    chrome: {
      nav,
      utilities: {
        // JA first (report §8): the existing switcher's own order.
        langSwitcher: <LangSwitcher lang={lang} targets={switchTargets} compact />,
        account,
        cart: <CartButton lang={lang} />,
        search: <SearchTrigger lang={lang} label={t("search", "open")} />,
      },
      menu,
      homeHref: L("/"),
      demo: demo ? { label: t("home", "heroDemoTag") } : undefined,
      labels: {
        home: `Cha Jewels — ${t("nav", "home")}`,
        menu: strings.menuTitle,
        openMenu: t("nav", "openMenu"),
        closeMenu: t("nav", "closeMenu"),
        primary: t("nav", "primary"),
        account: strings.accountTitle,
        collectionsIndex: strings.collectionsIndex,
      },
    },
    crawl: [...nav, ...menu.flatMap((g) => g.links)].map(({ href, label }) => ({ href, label })),
    messenger: messengerHref ? { href: messengerHref, label: t("social", "messengerButton") } : null,
  };
};

/** The customer's given name, resolved on its own clock (as the site header does). */
async function AccountName({ session, fallback }: { session: NonNullable<Awaited<ReturnType<typeof readSession>>>; fallback: string }) {
  const name = await customerFirstName(session).catch(() => null);
  return <>{name ?? fallback}</>;
}
