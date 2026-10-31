import Link from "next/link";
import { Suspense } from "react";
import { User } from "lucide-react";

import { tr, type Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale";
import type { SwitchTargets } from "@/lib/locale-nav";
import { layawayOffered } from "@/lib/layaway-availability";
import { hub } from "@/lib/hub-api";
import { getCollections } from "@/lib/queries/products";
import { collectionName } from "@/lib/catalog-i18n";
import { readSession, customerFirstName } from "@/lib/session";
import { saleListed } from "@/lib/sale";
import { catalogue } from "@/lib/catalog-context";
import {
  LUMIERE_HOME_STRINGS,
  lumiereCollections,
  lumiereFeatured,
  lumiereHero,
  lumierePhilosophy,
} from "@/lib/content/lumiere-home";
import { AssetBanner } from "@/components/lumiere/common/asset-banner";
import { Preloader } from "@/components/lumiere/common/preloader";
import { WarmBelowFold } from "@/components/lumiere/common/warm-below-fold";
import { HeroSection } from "@/components/lumiere/hero/hero-section";
import type { HeroChrome, HeroNavLink } from "@/components/lumiere/hero/hero-content";
import { CollectionsSection } from "@/components/lumiere/collections/collections-section";
import { FeaturedSection } from "@/components/lumiere/featured/featured-section";
import { PhilosophySection } from "@/components/lumiere/philosophy/philosophy-section";
import { FooterSection } from "@/components/lumiere/footer/footer-section";
import { CartButton } from "@/components/site/cart-button";
import { AccountMenu } from "@/components/site/account-menu";
import { LangSwitcher } from "@/components/site/lang-switcher";
import { SearchBox } from "@/components/site/search-box";

/**
 * THE LUMIÈRE HOME (P2; docs/tasks/lumiere-redesign.md §6, report §7 home row).
 *
 * A Server Component, as the reference's `HomeView`: the sections are added
 * here and each interactive one is a client leaf of its own. In order —
 * preloader (home only, once per session, D-9) → hero → collections (2×2 +
 * the full-width fifth, D-8) → featured → philosophy → footer. The existing
 * home's secondary sections (new arrivals, customer stories, the EN layaway
 * band and calculator, the loyalty band) are part B of this phase and are
 * mounted here as they land.
 *
 * Every string is §13/§14 copy or an existing `lib/i18n` key
 * (lib/content/lumiere-home.ts); every photograph and model is a registered
 * placeholder (lib/lumiere/placeholders.ts). The chrome inside the hero is the
 * site's own: the live cart count, the account menu, the language toggle and
 * the search are rendered here, on the server, and handed to the hero's header.
 *
 * The reference's robot form (a crawler-only page) is not ported: this HTML is
 * the one page every visitor and every crawler gets, with the copy as real
 * text and the posters in place of the scenes until they draw.
 */
export const LumiereHome = async ({ lang, switchTargets }: { lang: Lang; switchTargets?: SwitchTargets }) => {
  const L = (h: string) => localePath(h, lang);
  const t = tr(lang);
  const layaway = layawayOffered(lang);
  const strings = LUMIERE_HOME_STRINGS[lang];
  const categoryHref = (slug: string) => L(`/categories/${slug}`);

  // Chrome reads, every one caught: the header is chrome and degrades (the
  // same rule as components/site/header.tsx).
  const [session, collections, saleCount] = await Promise.all([
    readSession(),
    getCollections().catch(() => []),
    catalogue().then((all) => all.filter(saleListed).length).catch(() => 0),
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

  // The phone menu lists every existing destination (report §8 "Nav").
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

  const chrome: HeroChrome = {
    nav,
    utilities: {
      // JA first (report §8): the existing switcher's own order.
      langSwitcher: <LangSwitcher lang={lang} targets={switchTargets} compact />,
      account,
      cart: <CartButton lang={lang} />,
      search: <SearchBox lang={lang} />,
    },
    menu,
    homeHref: L("/"),
    labels: {
      home: `Cha Jewels — ${t("nav", "home")}`,
      menu: strings.menuTitle,
      openMenu: t("nav", "openMenu"),
      closeMenu: t("nav", "closeMenu"),
      primary: t("nav", "primary"),
      account: strings.accountTitle,
      collectionsIndex: strings.collectionsIndex,
    },
  };

  return (
    <div className="lumiere-home bg-surface text-content">
      <Preloader label={strings.loading} />
      <WarmBelowFold />
      <AssetBanner />
      <HeroSection lang={lang} content={lumiereHero(lang, categoryHref, L("/collections"))} chrome={chrome} />
      <CollectionsSection content={lumiereCollections(lang, categoryHref)} />
      <FeaturedSection content={lumiereFeatured(lang)} />
      <PhilosophySection lang={lang} content={lumierePhilosophy(lang, L("/about"))} />
      <FooterSection lang={lang} />
    </div>
  );
};

/** The customer's given name, resolved on its own clock (as the site header does). */
async function AccountName({ session, fallback }: { session: NonNullable<Awaited<ReturnType<typeof readSession>>>; fallback: string }) {
  const name = await customerFirstName(session).catch(() => null);
  return <>{name ?? fallback}</>;
}

// `hub` is imported so a future Hub-driven slot (featured pieces, hero cards)
// has its client beside the content it replaces; unused in P2 A.
void hub;
