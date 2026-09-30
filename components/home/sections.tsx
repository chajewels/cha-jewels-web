import { Suspense } from "react";
import Link from "next/link";
import { hub } from "@/lib/hub-api";
import { getFeaturedProducts } from "@/lib/queries/products";
import { tr, type Lang } from "@/lib/i18n";
import { Testimonials } from "@/components/home/testimonials";
import { ArrivalCard, isShowableArrival } from "@/components/home/arrival-card";
import { LayawayBand } from "@/components/commerce/layaway-band";
import { SectionBoundary } from "@/components/home/section-boundary";
import { RevealGroup, RevealItem } from "@/components/fx/reveal";
import { SplitHeading } from "@/components/fx/split-text";
import { ReviewGrid, ReviewSummary } from "@/components/reviews/review-list";
import { showable } from "@/lib/reviews";

/**
 * THE HOMEPAGE'S SECONDARY SECTIONS, EACH WAITING ON ITS OWN.
 *
 * app/page.tsx used to `await Promise.all([...])` on six Hub reads before it
 * rendered a byte, so the slowest of them decided when the hero appeared — and
 * one of them (testimonials) could fail the whole page. Each section is its own
 * async component now, behind its own <Suspense> with a fixed-size fallback
 * and its own error boundary. A section that is slow delays itself; a section
 * that fails renders nothing and takes nothing with it.
 *
 * THE FALLBACKS ARE THE FINISHED SIZE, not a spinner. A placeholder shorter
 * than what replaces it is a layout shift with extra steps.
 */

/** A skeleton that occupies exactly what its section will. */
function Band({ height }: { height: string }) {
  return <div aria-hidden="true" className="border-t border-hairline bg-hairline/20" style={{ height }} />;
}

export function LayawaySection({ lang }: { lang: Lang }) {
  return (
    <SectionBoundary>
      <Suspense fallback={<Band height="640px" />}>
        <LayawayAsync lang={lang} />
      </Suspense>
    </SectionBoundary>
  );
}
function LayawayAsync({ lang }: { lang: Lang }) {
  // No rate is read here any more: the calculator asks the Hub for a peso
  // quote when ₱ is chosen, and the Hub converts (and refuses with
  // fx_unavailable when it has no rate) — nothing on this side guesses one.
  // `fx`: the homepage's entrances (components/commerce/layaway-band.tsx).
  return <LayawayBand lang={lang} fx />;
}

export function TestimonialsSection({ lang }: { lang: Lang }) {
  return (
    <SectionBoundary>
      <Suspense fallback={<Band height="420px" />}>
        <TestimonialsAsync lang={lang} />
      </Suspense>
    </SectionBoundary>
  );
}
async function TestimonialsAsync({ lang }: { lang: Lang }) {
  // NOT caught here. The boundary above turns a failure into no section, which
  // is the same outcome as none published — and, unlike a caught [], it does
  // not let a Hub outage be cached as a homepage that has no customers.
  const items = await hub.testimonials();
  return <Testimonials lang={lang} items={items} />;
}

/**
 * Approved product reviews (PR-R2). Nothing approved yet, nothing rendered: no
 * heading, no gap. Like the testimonials, a Hub failure is not caught here; the
 * boundary turns it into no section without caching an empty one.
 */
export function ReviewsSection({ lang }: { lang: Lang }) {
  return (
    <SectionBoundary>
      <Suspense fallback={null}>
        <ReviewsAsync lang={lang} />
      </Suspense>
    </SectionBoundary>
  );
}
async function ReviewsAsync({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const { reviews, count, average } = await hub.reviews({ lang, limit: 6 });
  const shown = showable(reviews);
  if (shown.length === 0) return null;
  return (
    <section id="customer-reviews" className="scroll-mt-24 border-t border-hairline bg-chalk py-16 lg:py-20">
      <div className="wrap">
        <RevealGroup className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[62ch]">
            <RevealItem index={0}><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">{t("reviews", "eyebrow")}</p></RevealItem>
            <SplitHeading text={t("reviews", "h")} lang={lang} className="mt-3 text-[clamp(28px,3.6vw,44px)]" />
            <RevealItem index={2}><p className="mt-3 text-sm text-charcoal/75">{t("reviews", "p")}</p></RevealItem>
          </div>
          {average != null && count > 0 && <RevealItem index={3}><ReviewSummary average={average} count={count} lang={lang} /></RevealItem>}
        </RevealGroup>
        <ReviewGrid reviews={shown} lang={lang} />
      </div>
    </section>
  );
}

export function ArrivalsSection({ lang }: { lang: Lang }) {
  return (
    <SectionBoundary>
      <Suspense fallback={<Band height="520px" />}>
        <ArrivalsAsync lang={lang} />
      </Suspense>
    </SectionBoundary>
  );
}
async function ArrivalsAsync({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const featured = await getFeaturedProducts(8);
  const arrivals = featured.filter(isShowableArrival).slice(0, 4);
  if (arrivals.length === 0) return null;
  return (
    <section className="border-t border-hairline bg-hairline/40 py-16 lg:py-20">
      <div className="wrap">
        <RevealGroup className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <RevealItem index={0}><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">{t("home", "newEyebrow")}</p></RevealItem>
            <SplitHeading text={t("home", "newH")} lang={lang} className="mt-3 text-[clamp(28px,3.6vw,44px)]" />
          </div>
          <RevealItem index={2}><Link href="/collections" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep underline-offset-4 hover:underline">{t("home", "viewAll")} →</Link></RevealItem>
        </RevealGroup>
        {/* The pieces rise in one after another, and move under a mouse or a
            finger (components/fx/card-fx.tsx). */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {arrivals.map((p, i) => <ArrivalCard key={p.id} product={p} lang={lang} index={i} />)}
        </div>
      </div>
    </section>
  );
}
