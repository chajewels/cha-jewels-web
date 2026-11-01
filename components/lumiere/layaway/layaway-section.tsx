import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale";
import { layawayOffered } from "@/lib/layaway-availability";
import { lumiereLayaway } from "@/lib/content/lumiere-home";

import { CalculatorIsland } from "./calculator-island";
import { GateSceneIsland } from "./gate-scene";
import { StepVisual } from "./step-visuals";

/**
 * THE LAYAWAY BAND — English only (`layawayOffered`, lib/layaway-availability:
 * never on the Japanese site). P4 item 2, after the owner found the P3 band
 * generic; the benchmark is the old site's calculator band (components/
 * commerce/layaway-band.tsx on production: a dark band, the pill, the heading,
 * the three steps, the calculator as a white card). Here:
 *
 *   - a RICH CONTRASTING SURFACE: the home's black band, not cream with white
 *     cards, with the brass of the Halcyon Gate carried into the copy;
 *   - the CALCULATOR AS THE CENTREPIECE, large, laid over the Halcyon Gate
 *     scene (the sea and the ring show above and around the card); the scene's
 *     caption is a dark chip that clears contrast over the pale sky;
 *   - THE STEPS WITH REAL VISUALS — line illustrations in brass (a tagged ring,
 *     a calendar filling in, a parcel) joined by a drawn rule, each rising in
 *     as it scrolls into view;
 *   - the figures roll in (the Brewns digit roll, `variant="lumiere"`).
 *
 * MONEY LOGIC IS UNCHANGED: the calculator is the existing LayawayCalculator
 * (state, `hub.layawayQuote`, fail-closed rules); every string is `home.lay*`.
 * Its call to action goes to the pieces, never to /layaway (a layaway starts
 * from a piece — components/commerce/layaway-band.tsx).
 */
export const LAYAWAY_ID = "layaway";

export const LayawaySection = ({ lang }: { lang: Lang }) => {
  if (!layawayOffered(lang)) return null;
  const content = lumiereLayaway(lang, localePath("/collections", lang));
  return (
    <section id={LAYAWAY_ID} aria-labelledby="layaway-heading" className="lw scroll-mt-20" data-chrome-tone="dark">
      <div className="lw__grid">
        <div className="lw__copy">
          <span className="lw__pill font-manrope">{content.pill}</span>
          <h2 id="layaway-heading" className="lw__heading font-serif">
            {content.heading}
          </h2>
          <p className="lw__lead font-tight">{content.lead}</p>

          <ol className="lw__steps">
            {content.steps.map((step, i) => (
              <li key={step.index} className="lw__step" style={{ ["--i" as string]: i }}>
                <span className="lw__visual">
                  <StepVisual step={(i + 1) as 1 | 2 | 3} />
                </span>
                <div className="lw__step-copy">
                  <p className="lw__step-index font-manrope" aria-hidden="true">
                    {step.index}
                  </p>
                  <h3 className="lw__step-title font-serif">{step.title}</h3>
                  <p className="lw__step-body font-tight">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lw__stage">
          <GateSceneIsland note={content.pill} />
          <div className="lw__calc">
            <CalculatorIsland lang={lang} header={content.calculator} cta={content.cta} />
          </div>
        </div>
      </div>
    </section>
  );
};
