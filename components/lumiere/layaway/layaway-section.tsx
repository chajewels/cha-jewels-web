import Link from "next/link";

import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale";
import { layawayOffered } from "@/lib/layaway-availability";
import { lumiereLayaway } from "@/lib/content/lumiere-home";
import { EngineIsland } from "@/components/lumiere/common/engine-island";

import { CalculatorIsland } from "./calculator-island";
import { GateSceneIsland } from "./gate-scene";

/**
 * THE LAYAWAY BAND — English only (`layawayOffered`, lib/layaway-availability:
 * never on the Japanese site). The old band's pill, pitch and three steps, the
 * steps as a Cards Almanac stack (report §7 home row; docs/design-refs/
 * cards-almanac) beside the existing calculator, which keeps its logic and its
 * Hub quote and gains the Brewns digit roll (variant="lumiere").
 *
 * Every string is `home.lay*`. The step cards carry their numeral on a
 * typographic plate where the reference had cover art. The calculator's call
 * to action goes to the pieces, never to /layaway (a layaway starts from a
 * piece — components/commerce/layaway-band.tsx).
 *
 * P3 (item 5): the band opens on the clarix-feature skeleton (GetLayers
 * compositions — the copy stacked left with an index row, the heading, a
 * rule, the lead and the pill; the right half the focal object): the Halcyon
 * Gate scene (gate-scene.tsx) in a plate beside the copy. The steps and the
 * calculator keep their row under it.
 */
export const LAYAWAY_ID = "layaway";
const STEPS_ID = "layaway-steps";

export const LayawaySection = ({ lang }: { lang: Lang }) => {
  if (!layawayOffered(lang)) return null;
  const content = lumiereLayaway(lang, localePath("/collections", lang));
  return (
    <section id={LAYAWAY_ID} aria-labelledby="layaway-heading" className="layaway scroll-mt-20">
      <div className="layaway__feature">
        <div className="layaway__intro">
          <div>
            <p className="layaway__index font-manrope" aria-hidden="true">
              <span>{content.pill}</span>
              <span>{`01 / 0${content.steps.length}`}</span>
            </p>
            <h2 id="layaway-heading" className="layaway__heading font-serif">
              {content.heading}
            </h2>
            <span className="layaway__rule" aria-hidden="true" />
            <p className="layaway__lead font-tight">{content.lead}</p>
          </div>
          <Link href={content.cta.href} className="layaway__pill layaway__cta font-tight" data-analytics="layaway-see-pieces">
            {content.cta.label} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <GateSceneIsland note={content.pill} />
      </div>

      <div className="layaway__grid">
        <div className="almanac almanac--steps">
          <EngineIsland engine="almanac" target={STEPS_ID} />
          <div className="almanac__stack almanac__stack--steps" id={STEPS_ID} data-almanac>
            {content.steps.map((step) => (
              <article key={step.index} className="almanac__card almanac__card--step" data-almanac-card>
                <div className="almanac__media">
                  <div className="almanac__cover almanac__cover--type" aria-hidden="true">
                    <span className="almanac__numeral font-serif">{step.index}</span>
                  </div>
                </div>
                <div className="almanac__body">
                  <p className="almanac__date font-manrope">{step.index}</p>
                  <h3 className="almanac__step-title font-serif">{step.title}</h3>
                  <p className="almanac__text almanac__text--step font-tight">{step.body}</p>
                </div>
              </article>
            ))}
            <div className="almanac__tail almanac__tail--steps" aria-hidden="true" />
          </div>
          <span className="sr-only" aria-live="polite" data-almanac-live data-template={content.count} />
        </div>

        <div className="layaway__calc">
          <CalculatorIsland lang={lang} header={content.calculator} cta={content.cta} />
        </div>
      </div>
    </section>
  );
};
