"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { trackHeroSlideCta } from "@/lib/analytics";

export type HeroSlide =
  | { kind: "intro"; layaway: boolean }
  | { kind: "category"; slug: string; name: string; description: string | null; image: string | null; cta: string | null };

const AUTO_ADVANCE_MS = 6000;
const VISIBLE_THRESHOLD = 0.6;

/**
 * The hero deck: slide 0 is the brand headline over the video, then one slide
 * per published category in the Hub's sort_order. Native CSS scroll-snap, no
 * carousel library — the track is a horizontal scroller with mandatory centre
 * snapping, so touch swiping is the browser's own. Arrows from `md`, dots, and
 * ← → when the track has focus. The active index comes from an
 * IntersectionObserver on the slides, so dots and arrows stay in sync after a
 * swipe as well as after a click.
 *
 * Auto-advance every 6s, paused on hover, focus, touch and while the tab is
 * hidden, and off entirely under prefers-reduced-motion (where every
 * programmatic scroll is also instant). There is no pause control for the
 * slides — the video toggle in the corner stays the only control there.
 *
 * LAYERING. The section owns the video and its vertical scrim as the base
 * layer. Slide 0 draws nothing of its own, so the video shows through it
 * exactly as before. A category slide is full-bleed: its photo covers the
 * whole slide and therefore the video, and carries its OWN left-to-right scrim
 * so the copy has something to sit on whether the photo is cream (Fine
 * Jewelry) or near-black (Watches). object-position 65% keeps the subject in
 * frame while the left third is given over to text.
 *
 * Copy is the Hub's or the dictionary's — the name, the description and the
 * button label all come from the category, and nothing here is invented.
 */
export function HeroSlides({ lang, slides }: { lang: Lang; slides: HeroSlide[] }) {
  const t = tr(lang);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);       // hover / focus / touch
  const [hidden, setHidden] = useState(false);   // document.hidden
  const [reduced, setReduced] = useState(false); // prefers-reduced-motion
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    const vis = () => setHidden(document.hidden);
    vis();
    document.addEventListener("visibilitychange", vis);
    return () => { mq.removeEventListener("change", apply); document.removeEventListener("visibilitychange", vis); };
  }, []);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track || count === 0) return;
    const idx = ((i % count) + count) % count;
    const slide = track.children[idx] as HTMLElement | undefined;
    if (!slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: reduced ? "auto" : "smooth" });
  }, [count, reduced]);

  // The scroller decides which slide is current, so a swipe, a snap after a
  // resize, or a keyboard scroll all land on the same truth as a dot click.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slidesEl = Array.from(track.children) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= VISIBLE_THRESHOLD) setActive(slidesEl.indexOf(e.target as HTMLElement));
      }
    }, { root: track, threshold: [VISIBLE_THRESHOLD] });
    slidesEl.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [count]);

  useEffect(() => {
    if (count < 2 || reduced || held || hidden) return;
    const id = setInterval(() => goTo(active + 1), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [active, count, reduced, held, hidden, goTo]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1); }
  }

  // Inset, not negative: the track is edge-to-edge now, so an arrow hung
  // outside it would sit off-screen rather than beside the slide.
  const arrow = "absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-chalk/40 bg-charcoal-deep/50 text-chalk backdrop-blur hover:border-chalk hover:bg-charcoal-deep/70 md:grid";

  return (
    <div
      className="relative h-full"
      aria-roledescription="carousel"
      aria-label={t("home", "slideEyebrow")}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false); }}
      onTouchStart={() => setHeld(true)}
    >
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex h-full snap-x snap-mandatory overflow-x-auto outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-pale"
      >
        {slides.map((s, i) => (
          <div
            key={s.kind === "intro" ? "intro" : s.slug}
            role="group"
            aria-roledescription="slide"
            aria-label={t("home", "slideOf", { n: String(i + 1), total: String(count) })}
            className="relative flex h-full w-full shrink-0 snap-center items-center"
          >
            {s.kind === "intro" ? (
              <div className="wrap w-full py-16 text-center lg:py-24 lg:text-left">
                <div className="mx-auto max-w-[820px] lg:mx-0">
                  <h1 className="text-[clamp(30px,5vw,60px)] leading-[1.15] text-chalk">
                    {t("hero", "h1a")}<br />
                    <span className="text-gold-pale">{t("hero", "h1b")}</span>
                  </h1>
                  <p className="mt-6 text-[15px] leading-relaxed text-chalk/85 lg:text-base">{t("hero", "lede")}</p>
                  <p className="mt-3 line-clamp-5 text-[15px] leading-relaxed text-chalk/75 lg:line-clamp-none lg:text-base">{t("hero", "lede2")}</p>
                  <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
                    <Button asChild><Link href="/collections">{t("hero", "cta1")}</Link></Button>
                    {s.layaway && <Button asChild variant="ghost" className="border-chalk/60 text-chalk hover:border-chalk hover:text-chalk"><Link href="#layaway">{t("hero", "cta2")}</Link></Button>}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {s.image && (
                  <>
                    {/* Hub media may come from hosts next/image is not configured for. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image} alt="" loading={i <= 1 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover object-[65%_center]" />
                    <div aria-hidden="true" className="hero-slide-scrim" />
                  </>
                )}
                <div className="wrap relative z-10 w-full py-16 lg:py-24">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange">{t("home", "slideEyebrow")}</p>
                    <h2 className="mt-4 font-display text-[clamp(32px,4.5vw,56px)] leading-[1.1] text-gold-pale">{s.name}</h2>
                    {s.description && <p className="mt-5 text-[15px] leading-relaxed text-chalk/85 lg:text-base">{s.description}</p>}
                    <div className="mt-8 flex">
                      <Button asChild><Link href={`/categories/${s.slug}`} onClick={() => trackHeroSlideCta(s.slug)}>{s.cta ?? t("home", "slideShop", { name: s.name })}</Link></Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label={t("home", "slidePrev")} onClick={() => goTo(active - 1)} className={`${arrow} left-2 lg:left-5`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" aria-label={t("home", "slideNext")} onClick={() => goTo(active + 1)} className={`${arrow} right-2 lg:right-5`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {/* Overlaid rather than stacked below: the section has a fixed height
              from `lg` up, so a row added under the track would be pushed out
              of it.

              Lifted clear of the mobile tab bar below `lg`. That bar is fixed
              to the bottom of the VIEWPORT while these dots sit at the bottom
              of the SECTION, so at the top of the page the two land on the
              same pixels and the dots cannot be tapped — measured at 375px,
              dots 776–800 under a bar occupying 747–812. */}
          <div className="absolute inset-x-0 bottom-24 z-20 flex justify-center gap-2 lg:bottom-5" role="tablist" aria-label={t("home", "slideEyebrow")}>
            {slides.map((s, i) => (
              <button
                key={s.kind === "intro" ? "intro" : s.slug}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={t("home", "slideDot", { n: String(i + 1) })}
                onClick={() => goTo(i)}
                className="grid h-6 w-6 place-items-center"
              >
                <span className={`block h-2 w-2 rounded-full transition-colors ${i === active ? "bg-orange" : "bg-chalk/50"}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
