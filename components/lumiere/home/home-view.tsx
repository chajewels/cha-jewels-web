import Link from "next/link";
import { Suspense } from "react";
import { User } from "lucide-react";

import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import { localePath } from "@/lib/locale";
import type { SwitchTargets } from "@/lib/locale-nav";
import { layawayOffered } from "@/lib/layaway-availability";
import { hub } from "@/lib/hub-api";
import { getCollections } from "@/lib/queries/products";
import { collectionName } from "@/lib/catalog-i18n";
import { readSession, customerFirstName } from "@/lib/session";
import { saleListed } from "@/lib/sale";
import { catalogue } from "@/lib/catalog-context";
import { heroFontKeys } from "@/lib/lumiere/font-urls";
import { FontPreload } from "@/components/lumiere/common/font-preload";
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
import { WhySection } from "@/components/lumiere/why/why-section";
import { ArrivalsSection } from "@/components/lumiere/arrivals/arrivals-section";
import { StoriesSection } from "@/components/lumiere/stories/stories-section";
import { LayawaySection } from "@/components/lumiere/layaway/layaway-section";
import { LoyaltySection } from "@/components/lumiere/loyalty/loyalty-section";
import { RecentlyViewed } from "@/components/catalog/recently-viewed";
import { SectionBoundary } from "@/components/home/section-boundary";
import { lumiereRecentlyViewedTitle } from "@/lib/content/lumiere-home";
import { CartButton } from "@/components/site/cart-button";
import { AccountMenu } from "@/components/site/account-menu";
import { LangSwitcher } from "@/components/site/lang-switcher";
import { SearchIsland } from "@/components/lumiere/hero/search-island";

/**
 * THE LUMIÈRE HOME (P2; docs/tasks/lumiere-redesign.md §6, report §7 home row).
 *
 * A Server Component, as the reference's `HomeView`: the sections are added
 * here and each interactive one is a client leaf of its own. In order —
 * preloader (home only, once per session, D-9) → hero → collections (2×2 +
 * the full-width fifth, D-8) → featured → philosophy → why columns → new
 * arrivals → customer stories → recently viewed → the layaway band and
 * calculator (EN) → the loyalty band (D-21) → footer (report §7 home row).
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
export const LumiereHome = async ({ lang, switchTargets, demo = false }: { lang: Lang; switchTargets?: SwitchTargets; demo?: boolean }) => {
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
      search: <SearchIsland lang={lang} placeholder={t("search", "placeholder")} openLabel={t("search", "open")} />,
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
  };

  return (
    <div className="lumiere-home bg-surface text-content">
      {/* HOME-ONLY FONT PRELOAD (report §10 step 4): the faces the hero draws
          first, at next/font's own built URLs (lib/lumiere/font-urls.ts), as
          `<link rel="preload" as="font">` in THIS page's head. Every other
          page keeps app/fonts.ts's `preload: false`. Without it the faces were
          discovered only after the stylesheet had been laid out (requested at
          ~0.94 s against the stylesheet's 0.11 s, P2 part A). */}
      <FontPreload keys={heroFontKeys(lang)} />
      <Preloader label={strings.loading} />
      <WarmBelowFold />
      <AssetBanner />
      <HeroSection lang={lang} content={lumiereHero(lang, categoryHref, L("/collections"))} chrome={chrome} />

      {/* PROGRESSIVE HYDRATION (report §10, TBT). Every block under the hero
          sits in its own Suspense boundary. The server output is unchanged
          (nothing here suspends, no fallback is ever shown); on the client
          React hydrates the hero first, in its own task, and each boundary
          below in a later one at lower priority — the one long hydration task
          of part A (210–240 ms on a 4× phone) becomes several short ones, and
          the preloader's lift, which waits on the first commit, comes sooner. */}
      <Suspense fallback={null}>
        <CollectionsSection content={lumiereCollections(lang, categoryHref)} />
      </Suspense>
      <Suspense fallback={null}>
        <FeaturedSection content={lumiereFeatured(lang)} />
      </Suspense>
      <Suspense fallback={null}>
        <PhilosophySection lang={lang} content={lumierePhilosophy(lang, L("/about"))} />
      </Suspense>

      {/* PART B — the existing home's sections, re-skinned from the GetLayers
          references (report §7 home row; docs/design-refs/). Order: why columns
          (the values fold) → new arrivals → customer stories → recently viewed
          → the layaway band and calculator (EN only) → the loyalty band (D-21)
          → footer. Each Hub-backed section streams on its own and fails to
          nothing (components/home/sections.tsx explains the boundary); its
          fallback is the finished size, so nothing below it moves. */}
      <Suspense fallback={null}>
        <WhySection lang={lang} />
      </Suspense>
      <SectionBoundary>
        <Suspense fallback={<Band height="720px" />}>
          <ArrivalsSection lang={lang} />
        </Suspense>
      </SectionBoundary>
      <SectionBoundary>
        <Suspense fallback={<Band height="640px" />}>
          <StoriesSection lang={lang} />
        </Suspense>
      </SectionBoundary>
      {/* Recently viewed (owner decision 2026-10-17): above the layaway band;
          drawn in the browser from the slugs the product page recorded, absent
          until there are cards. The component is the site's (P4 restyles the
          cards); the strip's heading takes the serif here. */}
      <div className="lumiere-recent">
        <RecentlyViewed lang={lang} title={lumiereRecentlyViewedTitle(lang)} />
      </div>
      <Suspense fallback={null}>
        <LayawaySection lang={lang} />
      </Suspense>
      <Suspense fallback={null}>
        <LoyaltySection lang={lang} />
      </Suspense>
      <Suspense fallback={null}>
        <FooterSection lang={lang} switchTargets={switchTargets} />
      </Suspense>
    </div>
  );
};

/** A skeleton that occupies exactly what its section will (components/home/sections.tsx). */
function Band({ height }: { height: string }) {
  return <div aria-hidden="true" className="bg-surface" style={{ height }} />;
}

/** The customer's given name, resolved on its own clock (as the site header does). */
async function AccountName({ session, fallback }: { session: NonNullable<Awaited<ReturnType<typeof readSession>>>; fallback: string }) {
  const name = await customerFirstName(session).catch(() => null);
  return <>{name ?? fallback}</>;
}

// `hub` is imported so a future Hub-driven slot (featured pieces, hero cards)
// has its client beside the content it replaces; unused in P2 A.
void hub;
