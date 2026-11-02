import { Suspense } from "react";

import { type Lang } from "@/lib/i18n-core";
import { localePath } from "@/lib/locale";
import type { SwitchTargets } from "@/lib/locale-nav";
import { heroFontKeys } from "@/lib/lumiere/font-urls";
import { FontPreload } from "@/components/lumiere/common/font-preload";
import {
  LUMIERE_HOME_STRINGS,
  lumiereCollections,
  lumiereFeatured,
  lumiereHero,
  lumierePhilosophy,
} from "@/lib/content/lumiere-home";
import { buildChrome } from "@/components/lumiere/site/chrome-data";
import { AssetBanner } from "@/components/lumiere/common/asset-banner";
import { Preloader } from "@/components/lumiere/common/preloader";
import { WarmBelowFold } from "@/components/lumiere/common/warm-below-fold";
import { HeroSection } from "@/components/lumiere/hero/hero-section";
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
import { homeHubSlots } from "@/lib/lumiere/home-hub";

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
 * (lib/content/lumiere-home.ts); every photograph is the Hub's or a Cha Jewels
 * original (lib/lumiere/home-hub.ts, lib/lumiere/home-media.ts) — no placeholder. The chrome inside the hero is the
 * site's own: the live cart count, the account menu, the language toggle and
 * the search are rendered here, on the server, and handed to the hero's header.
 *
 * The reference's robot form (a crawler-only page) is not ported: this HTML is
 * the one page every visitor and every crawler gets, with the copy as real
 * text and the posters in place of the scenes until they draw.
 */
export const LumiereHome = async ({ lang, switchTargets, demo = false }: { lang: Lang; switchTargets?: SwitchTargets; demo?: boolean }) => {
  const L = (h: string) => localePath(h, lang);
  const strings = LUMIERE_HOME_STRINGS[lang];
  const categoryHref = (slug: string) => L(`/categories/${slug}`);

  // The chrome — the D-18 labels, the site's own controls, every destination
  // for the menu — built by the one builder the site header uses on every
  // other page (components/lumiere/site/chrome-data.tsx, P3), so the two can
  // never disagree.
  // The chrome and the Hub's image/piece slots are independent reads: one wait, not two (the slots fall back to the placeholders on any failure).
  const [{ chrome }, slots] = await Promise.all([buildChrome({ lang, switchTargets, demo }), homeHubSlots(lang)]);

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
      <HeroSection lang={lang} content={lumiereHero(lang, categoryHref, L("/collections"), slots)} chrome={chrome} />

      {/* PROGRESSIVE HYDRATION (report §10, TBT). Every block under the hero
          sits in its own Suspense boundary. The server output is unchanged
          (nothing here suspends, no fallback is ever shown); on the client
          React hydrates the hero first, in its own task, and each boundary
          below in a later one at lower priority — the one long hydration task
          of part A (210–240 ms on a 4× phone) becomes several short ones, and
          the preloader's lift, which waits on the first commit, comes sooner. */}
      <Suspense fallback={null}>
        <CollectionsSection content={lumiereCollections(lang, categoryHref, slots)} />
      </Suspense>
      {/* The featured block is the Hub's featured pieces (P5b): none available, nothing drawn — no stand-in pieces. */}
      {slots.featured.length > 0 && (
        <Suspense fallback={null}>
          <FeaturedSection content={lumiereFeatured(lang, slots)} />
        </Suspense>
      )}
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
