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
import { STAGGER } from "@/lib/motion";

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
async function LayawayAsync({ lang }: { lang: Lang }) {
  // The band needs the day's rate to show peso figures. A rate we cannot get
  // is not a reason to withhold the section — the JPY column is the real one.
  const fx = await hub.fx().catch(() => ({ jpy_php: 0.39, as_of: "" }));
  return <LayawayBand lang={lang} phpRate={fx.jpy_php} />;
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
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">{t("home", "newEyebrow")}</p>
            <h2 className="mt-3 text-[clamp(28px,3.6vw,44px)]">{t("home", "newH")}</h2>
          </div>
          <Link href="/collections" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep underline-offset-4 hover:underline">{t("home", "viewAll")} →</Link>
        </div>
        {/* The pieces rise in one after another (components/fx/reveal.tsx). */}
        <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6" stagger={STAGGER.card}>
          {arrivals.map((p, i) => <RevealItem key={p.id} index={i} className="flex [&>*]:w-full"><ArrivalCard product={p} lang={lang} /></RevealItem>)}
        </RevealGroup>
      </div>
    </section>
  );
}
