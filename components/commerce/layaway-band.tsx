import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { tr, type Lang } from "@/lib/i18n";
import { SplitHeading } from "@/components/fx/split-text";
import { RevealGroup, RevealItem } from "@/components/fx/reveal";
import { STAGGER } from "@/lib/motion";

/**
 * The layaway band: the pill, the pitch, the three steps and the calculator.
 *
 * Extracted from the homepage's §7 so /layaway can carry the same band rather
 * than a second telling of it. The markup is the homepage's, moved unchanged —
 * the homepage's rendered output is byte-identical across the extraction, which
 * is checked rather than assumed.
 *
 * The section className is the homepage's, unchanged and deliberately WITHOUT
 * `.band-dark`: that class is for the new dark hero bands this phase adds, and
 * adding it here would alter the homepage's rendered markup, which the
 * extraction is required not to do. The band carries no .rule-grid, so it has
 * no hairline to scope anyway.
 *
 * It stays DARK through the Phase 4 light pass. The band is the one place on
 * these pages where the calculator sits, and the calculator's own `tone="light"`
 * panel is what reads against it; inverting the band would leave a light panel
 * on a light page with nothing to separate them.
 *
 * Whether it renders at all is the caller's decision, not this component's:
 * layaway is English-only (owner decision 2026-09-15) and the rule lives in
 * lib/layaway-availability, where both callers read it.
 *
 * `fx` (the homepage passes it; /layaway does not, so that page is unchanged):
 * the heading rises in by split text; the pill, the pitch, each step and the
 * calculator panel arrive one after another; a gold connector draws down from
 * each step's disc to the next; the calculator's call to action carries a
 * soft gold glow and a shine border (app/globals.css, "LAYAWAY BAND").
 *
 * NO NUMBER HERE IS ANIMATED. The only figures outside the calculator are the
 * step numerals 1–3, which are not amounts; the calculator's figures are the
 * Hub's quote and the calculator is Phase 2 (docs/tasks/web-motion-signature
 * .md). Its markup and logic are untouched — the glow is applied from out
 * here, through `.lay-cta-fx`.
 */
export function LayawayBand({ lang, fx = false }: { lang: Lang; fx?: boolean }) {
  const t = tr(lang);
  if (fx) return <LayawayBandFx lang={lang} />;
  return (
    <section id="layaway" className="w-full scroll-mt-20 bg-charcoal-deep py-16 text-chalk lg:py-20">
      <div className="wrap grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <span className="inline-block rounded-full bg-orange px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-deep">{t("home", "layPill")}</span>
          <h2 className="mt-5 max-w-[20ch] font-display text-[clamp(28px,3.6vw,44px)] text-gold-pale">{t("home", "layH")}</h2>
          <p className="mt-4 max-w-[46ch] text-chalk/75">{t("home", "layP")}</p>
          <ol className="mt-8 grid gap-5">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className="flex gap-4">
                <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange font-display text-sm font-medium text-charcoal-deep">{n}</span>
                <div>
                  <p className="font-medium text-chalk">{t("home", `layStep${n}H`)}</p>
                  <p className="mt-1 text-sm text-chalk/75">{t("home", `layStep${n}P`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <LayawayCalculator
          lang={lang}
          header={{ title: t("home", "layCalcH"), sub: t("home", "layCalcP"), chip: t("home", "layCalcChip") }}
          // NEVER /layaway. This band renders on the homepage AND on /layaway
          // itself, where that href was a link to the page you are reading. A
          // layaway is started from a piece at checkout, never from a
          // calculator, so the button goes to the pieces.
          cta={{ label: t("home", "layCta"), href: "/collections" }}
          className="lg:col-span-6"
        />
      </div>
    </section>
  );
}

/** The homepage's band: the same content and classes as above, with entrances. */
function LayawayBandFx({ lang }: { lang: Lang }) {
  const t = tr(lang);
  return (
    <section id="layaway" className="w-full scroll-mt-20 bg-charcoal-deep py-16 text-chalk lg:py-20">
      <RevealGroup className="wrap grid items-center gap-10 lg:grid-cols-12 lg:gap-12" stagger={STAGGER.card}>
        <div className="lg:col-span-6">
          <RevealItem index={0}><span className="inline-block rounded-full bg-orange px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-deep">{t("home", "layPill")}</span></RevealItem>
          <SplitHeading text={t("home", "layH")} lang={lang} className="mt-5 max-w-[20ch] font-display text-[clamp(28px,3.6vw,44px)] text-gold-pale" />
          <RevealItem index={1}><p className="mt-4 max-w-[46ch] text-chalk/75">{t("home", "layP")}</p></RevealItem>
          <ol className="mt-8 grid gap-5">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className="reveal-item relative flex gap-4" style={{ ["--i" as string]: n + 1 }}>
                {/* The gold line down to the next disc, drawn after this step arrives. */}
                {n < 3 && <span aria-hidden="true" className="lay-connector" />}
                <span aria-hidden="true" className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange font-display text-sm font-medium text-charcoal-deep">{n}</span>
                <div>
                  <p className="font-medium text-chalk">{t("home", `layStep${n}H`)}</p>
                  <p className="mt-1 text-sm text-chalk/75">{t("home", `layStep${n}P`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <RevealItem index={5} className="lay-cta-fx lg:col-span-6">
          <LayawayCalculator
            lang={lang}
            header={{ title: t("home", "layCalcH"), sub: t("home", "layCalcP"), chip: t("home", "layCalcChip") }}
            // NEVER /layaway — see the band above.
            cta={{ label: t("home", "layCta"), href: "/collections" }}
          />
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
