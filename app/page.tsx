import Link from "next/link";
import { getCollections, getFeaturedProducts } from "@/lib/queries/products";
import { tr } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
import { JsonLd } from "@/components/site/json-ld";
import { DiamondDivider } from "@/components/home/diamond-divider";
import { ValuesBento } from "@/components/home/values-bento";
import { CollectionCards, type CollectionCardData } from "@/components/home/collection-cards";
import { COLLECTION_PLACEHOLDER } from "@/lib/collection-placeholders";
import { buildHeroDeck } from "@/lib/hero-deck";
import { Hero } from "@/components/home/hero";
import { HERO_POSTER } from "@/components/site/hero-video";
import { ArrivalsSection, LayawaySection, TestimonialsSection } from "@/components/home/sections";
import { MobileTabBar, type Tab } from "@/components/home/mobile-tab-bar";
import { RevealGroup, RevealItem } from "@/components/fx/reveal";
import { SplitHeading } from "@/components/fx/split-text";
export const revalidate = 60;

/**
 * Homepage — the Stitch redesign (docs/stitch/cha-desktop.html and
 * cha-mobile.html), JA-first. Section order follows the file: hero, values,
 * layaway calculator (EN only), collections, testimonials, new arrivals. The page is the one chalk (light) surface on the site;
 * the header is global and light, the footer stays charcoal.
 *
 * Every string comes from lib/i18n. Where the file's Japanese differs from an
 * existing dictionary key, the existing key wins (hero.*, home.values*, colsH,
 * newH, viewAll, layH/layP). Product and collection data is the Hub's only.
 */

export default async function Home() {
  // ONLY WHAT THE SHELL AND THE HERO NEED. FX, testimonials and the arrivals
  // deck have moved into their own streamed sections (components/home/
  // sections.tsx) — awaiting all six here meant the slowest Hub read decided
  // when the headline appeared, and one of them could fail the page outright.
  const [lang, collections, categories] = await Promise.all([
    getLang(),
    getCollections().catch(() => []),
    hub.categories().catch(() => []),
  ]);
  const t = tr(lang);
  const layaway = layawayOffered(lang);
  // A card shows the collection's own hero_media, else the Stitch placeholder
  // for that slug, else the typographic state. A product photo never stands in
  // for a category.
  const cards: CollectionCardData[] = collections.map((c) => ({
    c,
    image: c.hero_media ?? COLLECTION_PLACEHOLDER[c.slug] ?? null,
  }));
  // Hero deck (slider v2): the film with one available piece, then one slide
  // per category in the Hub's sort_order, each with its pieces chosen from the
  // Hub's catalogue on this render — only active pieces in stock, never a sold
  // one — and the empty-category switch applied. All of it in lib/hero-deck.ts.
  const slides = await buildHeroDeck(lang, categories);

  const tabs: Tab[] = [
    { href: "/", label: t("home", "tabHome"), icon: "home" },
    { href: "/collections", label: t("home", "tabPieces"), icon: "pieces" },
    // Layaway is offered in English only (owner decision 2026-09-15) — one rule,
    // in lib/layaway-availability. The JA tab bar has four tabs.
    ...(layaway ? [{ href: "/layaway", label: t("home", "tabLayaway"), icon: "layaway" as const }] : []),
    { href: "/loyalty", label: t("home", "tabLoyalty"), icon: "loyalty" },
    { href: "/account", label: t("home", "tabAccount"), icon: "account" },
  ];

  return (
    <div className="bg-chalk text-charcoal pb-20 lg:pb-0">
      <JsonLd type="store" />

      {/* §3 Hero — slider v2 (owner approvals 2026-09-26): the gold film with
          a real piece and its price on slide 1, then one designed slide per
          category. The film is the base layer under slide 1, with the film
          slide's own horizontal scrim (.hd-film-scrim) between it and the
          copy; every category slide covers it. Copy from lib/i18n, pieces and
          figures from the Hub (lib/hero-deck.ts). */}
      {/* THE ONE EAGER IMAGE ON THIS PAGE.
          The hero poster is what a visitor sees first: the clip does not load
          until something decides it should play, and no category slide mounts
          its photo until the deck is coming to it, so for the whole of the
          intro slide this file IS the hero. React hoists the tag into <head>,
          which puts the request in the same breath as the stylesheet instead
          of waiting for the <video> to be parsed. Nothing else on the site
          asks for priority — see components/media/hub-image.tsx. */}
      <link rel="preload" as="image" href={HERO_POSTER} fetchPriority="high" />
      {/* The deck is stacked slides, so the section has a height at every
          width (.hd-hero, app/globals.css). overflow-CLIP, never hidden: see
          hero.tsx, "NOTHING IN THE HERO SCROLLS". */}
      <Hero
        lang={lang}
        slides={slides}
        className="hd-hero relative isolate flex w-full overflow-clip bg-charcoal-deep"
      />

      {/* §6 Diamond divider */}
      <DiamondDivider className="wrap" />

      {/* §5 Values bento */}
      <ValuesBento lang={lang} />

      {/* §7 Layaway band — the pill, the pitch, the three steps and the
          calculator, now shared with /layaway (components/commerce/layaway-band).
          English only (owner decision 2026-09-15): the section and the
          calculator go together, and a calculator with no explanation is worse
          than neither. See lib/layaway-availability. */}
      {layaway && <LayawaySection lang={lang} />}

      {/* §8 Collections — dynamic from the Hub */}
      <section id="collections" className="border-t border-hairline py-16 lg:py-20">
        <div className="wrap">
          {/* Entrance: eyebrow, split-text heading, then the line (components/fx). */}
          <RevealGroup className="mb-10 text-center">
            <RevealItem index={0}><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">{t("home", "colsEyebrow")}</p></RevealItem>
            <SplitHeading text={t("home", "colsH")} lang={lang} className="mt-3 text-[clamp(28px,3.6vw,44px)]" />
            <RevealItem index={2}><p className="mx-auto mt-4 max-w-[52ch] text-charcoal/75">{t("home", "colsP")}</p></RevealItem>
          </RevealGroup>
          <CollectionCards items={cards} lang={lang} />
        </div>
      </section>

      {/* §9 Testimonials — streamed; no section when none are published, and
          no section when the Hub cannot be reached either. */}
      <TestimonialsSection lang={lang} />

      {/* §10 New arrivals — streamed; real pieces only, no section when none */}
      <ArrivalsSection lang={lang} />

      {/* §13 Mobile-only bottom tab bar */}
      <MobileTabBar tabs={tabs} />
    </div>
  );
}
