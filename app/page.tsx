import Link from "next/link";
import { HeroVideo } from "@/components/site/hero-video";
import { getCollections, getFeaturedProducts } from "@/lib/queries/products";
import { tr } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
import { LayawayBand } from "@/components/commerce/layaway-band";
import { JsonLd } from "@/components/site/json-ld";
import { DiamondDivider } from "@/components/home/diamond-divider";
import { ValuesBento } from "@/components/home/values-bento";
import { CollectionCards, type CollectionCardData } from "@/components/home/collection-cards";
import { COLLECTION_PLACEHOLDER } from "@/lib/collection-placeholders";
import { CATEGORY_PLACEHOLDER } from "@/lib/category-placeholders";
import { categoryCta, categoryDescription, categoryName } from "@/lib/catalog-i18n";
import { HeroSlides, type HeroSlide } from "@/components/home/hero-slides";
import { Testimonials } from "@/components/home/testimonials";
import { ArrivalCard, ArrivalPlaceholder } from "@/components/home/arrival-card";
import { MobileTabBar, type Tab } from "@/components/home/mobile-tab-bar";
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
  const [lang, collections, categories, featured, fx, testimonials] = await Promise.all([
    getLang(),
    getCollections().catch(() => []),
    hub.categories().catch(() => []),
    getFeaturedProducts(8).catch(() => []),
    hub.fx().catch(() => ({ jpy_php: 0.39, as_of: "" })),
    hub.testimonials(),
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
  const placeholders = Math.max(0, 4 - featured.length);

  // Hero deck: the intro, then one slide per category in the Hub's sort_order.
  // The order is the Hub's and nothing rearranges it here — the deck used to
  // put "preloved-" slugs first, which is a merchandising decision the owner
  // now makes in the Hub by setting sort_order. The image is the category's
  // own hero_media, else the placeholder for that slug; never a product photo.
  const slides: HeroSlide[] = [
    { kind: "intro", layaway },
    ...[...categories]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        kind: "category" as const,
        slug: c.slug,
        name: categoryName(c, lang),
        description: categoryDescription(c, lang),
        image: c.hero_media ?? CATEGORY_PLACEHOLDER[c.slug] ?? null,
        cta: categoryCta(c, lang),
      })),
  ];

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

      {/* §3 Hero — the Phase 1 video treatment, not the Stitch image one: full
          bleed, video at full opacity, the single vertical scrim (.hero-scrim)
          between video and content.

          The desktop height is 16:9, matching the source, so the full video
          frame shows on wide screens. It replaces the 19:6 band, which was
          only 56% as tall as the frame at the same width and threw away 44%
          of it. Below lg the section is h-auto and the content wrapper sets
          the height, so the headline and both CTAs are never clipped — if the
          copy runs taller than the viewport the page just scrolls. From lg up
          the height follows 56.25vw, capped at the viewport and floored at
          560px — no max-height and no aspect-ratio utility, both shrink the
          width. The video is absolute inset-0 object-cover at every width, so
          it fills whatever height the section takes; at 16:9 that means the
          full width with no crop until the viewport cap or the 560px floor
          bites, and both crop top and bottom only, around a centred crucible.
          The 1440px max width applies to the content wrapper only. Copy from
          hero.*. */}
      <section className="relative isolate flex h-auto w-full items-center overflow-hidden bg-charcoal py-20 lg:h-[min(56.25vw,100svh)] lg:min-h-[560px] lg:py-0">
        <HeroVideo playLabel={t("hero", "videoPlay")} pauseLabel={t("hero", "videoPause")} />
        <div aria-hidden="true" className="hero-scrim" />
        {/* Slide 0 is the hero copy as before; slides 1..n are the categories.
            Swipe, arrows (md+), dots, ← →; see components/home/hero-slides.tsx.

            No `.wrap` here any more, and no padding: a category slide is
            full-bleed, so its photo has to reach the section's edges. Each
            slide carries its own `.wrap` around its copy instead, so the text
            still lines up with the rest of the page. `self-stretch` makes the
            layer fill the section's height from `lg` up, where the section has
            one, and collapse to the content height below it. */}
        <div className="relative z-10 w-full self-stretch">
          <HeroSlides lang={lang} slides={slides} />
        </div>
      </section>

      {/* §6 Diamond divider */}
      <DiamondDivider className="wrap" />

      {/* §5 Values bento */}
      <ValuesBento lang={lang} />

      {/* §7 Layaway band — the pill, the pitch, the three steps and the
          calculator, now shared with /layaway (components/commerce/layaway-band).
          English only (owner decision 2026-09-15): the section and the
          calculator go together, and a calculator with no explanation is worse
          than neither. See lib/layaway-availability. */}
      {layaway && <LayawayBand lang={lang} phpRate={fx.jpy_php} />}

      {/* §8 Collections — dynamic from the Hub */}
      <section id="collections" className="border-t border-hairline py-16 lg:py-20">
        <div className="wrap">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">{t("home", "colsEyebrow")}</p>
            <h2 className="mt-3 text-[clamp(28px,3.6vw,44px)]">{t("home", "colsH")}</h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-charcoal/75">{t("home", "colsP")}</p>
          </div>
          <CollectionCards items={cards} lang={lang} />
        </div>
      </section>

      {/* §9 Testimonials — from the Hub; placeholder cards until it publishes one */}
      <Testimonials lang={lang} items={testimonials} />

      {/* §10 New arrivals — Hub data only; dashed placeholders fill to four */}
      <section className="border-t border-hairline bg-hairline/40 py-16 lg:py-20">
        <div className="wrap">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">{t("home", "newEyebrow")}</p>
              <h2 className="mt-3 text-[clamp(28px,3.6vw,44px)]">{t("home", "newH")}</h2>
            </div>
            <Link href="/collections" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-dark underline-offset-4 hover:underline">{t("home", "viewAll")} →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {featured.map((p) => <ArrivalCard key={p.id} product={p} lang={lang} />)}
            {Array.from({ length: placeholders }, (_, i) => <ArrivalPlaceholder key={`ph-${i}`} lang={lang} />)}
          </div>
        </div>
      </section>

      {/* §13 Mobile-only bottom tab bar */}
      <MobileTabBar tabs={tabs} />
    </div>
  );
}
