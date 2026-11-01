import Link from "next/link";

import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale";
import { lumiereWhy } from "@/lib/content/lumiere-home";
import { EngineIsland } from "@/components/lumiere/common/engine-island";

/**
 * WHY CHA JEWELS — the Colonnade reference re-skinned (report §7 home row,
 * "Values copy folds into philosophy/why columns"; docs/design-refs/colonnade).
 * Four chapter columns on paper — the four values of the old home's bento
 * (`home.value*H` as the column's name, `home.value*P` as the chapter's line
 * in the headline above) — each sliding its panel upward as the reader moves
 * between them, one continuous conveyor; the headline swaps in the same
 * motion; the pill goes to /why-cha-jewels.
 *
 * The reference's art panels are generated mesh gradients ("retint freely"):
 * here they are the Lumière palette's own bone, grey and ink in four mixes
 * (app/lumiere/sections.css), no accent colour (D-4). Its header and nav are
 * not carried; the section's own eyebrow and heading stand above the strip.
 *
 * Server-rendered with the first chapter at rest; the engine (why/
 * colonnade-engine.ts) binds when the section nears and slides it in.
 */
export const WHY_ID = "why-cha-jewels";

export const WhySection = ({ lang }: { lang: Lang }) => {
  const content = lumiereWhy(lang, localePath("/why-cha-jewels", lang));
  return (
    <section id={WHY_ID} aria-labelledby="why-heading" className="colonnade" data-colonnade data-start="0">
      <EngineIsland engine="colonnade" target={WHY_ID} />
      <div className="colonnade__intro">
        <p className="colonnade__eyebrow font-manrope">{content.eyebrow}</p>
        <h2 id="why-heading" className="colonnade__heading font-serif">
          {content.heading}
        </h2>
      </div>

      <div className="colonnade__frame">
        <div className="colonnade__strip" role="tablist" aria-label={content.tablistLabel}>
          {content.columns.map((column, i) => (
            <div
              key={column.index}
              role="tab"
              tabIndex={i === 0 ? 0 : -1}
              aria-selected={i === 0}
              aria-controls={`${WHY_ID}-head-${i}`}
              className={`colonnade__col${i === 0 ? " -active" : ""}`}
              data-colonnade-col={i}
            >
              <div className={`colonnade__media${i === 0 ? " -in" : ""}`} data-colonnade-media>
                <div className={`colonnade__scene colonnade__scene--${i + 1}`} />
              </div>
              <div className="colonnade__cap font-manrope">
                <b>{column.index}</b>
              </div>
              <h3 className="colonnade__name font-serif">{column.name}</h3>
            </div>
          ))}
        </div>

        <div className="colonnade__headline">
          {content.columns.map((column, i) => (
            <div
              key={column.index}
              id={`${WHY_ID}-head-${i}`}
              role="tabpanel"
              className={`colonnade__head${i === 0 ? " -in" : ""}`}
              data-colonnade-head={i}
            >
              <p className="colonnade__line font-serif">{column.title}</p>
              <Link href={content.cta.href} className="colonnade__pill font-tight" data-analytics="why-cta">
                {content.cta.label} <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
