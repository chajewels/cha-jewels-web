import Image from "next/image";
import Link from "next/link";

import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale";
import { lumiereWhy } from "@/lib/content/lumiere-home";
import { EngineIsland } from "@/components/lumiere/common/engine-island";

/**
 * WHY CHA JEWELS — the Colonnade reference re-skinned (report §7 home row,
 * "Values copy folds into philosophy/why columns"; docs/design-refs/colonnade).
 * Four chapter columns on paper — the four values of the old home's bento
 * (`home.value*H` as the column's name, `home.value*P` as the chapter's line)
 * — each sliding its panel upward as the reader moves between them, one
 * continuous conveyor; the active column widens; the pill goes to
 * /why-cha-jewels.
 *
 * P2b item 5: every panel carries a photograph (the registered collections
 * placeholders, D-16, under a light paper wash in place of the reference's
 * generated mesh gradients), and the chapter's copy — its line and the pill —
 * sits INSIDE the active panel, riding the same slide, rather than floating
 * over the strip across the column rules as the reference lays it.
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
                <Image
                  src={column.image.src}
                  alt={column.image.alt}
                  fill
                  sizes="(max-width: 859.98px) 100vw, 60vw"
                  className="colonnade__photo"
                />
                <div className={`colonnade__scene colonnade__scene--${i + 1}`} />
              </div>
              {/* The chapter's copy, inside its own panel; shown with the panel. */}
              <div
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
              <div className="colonnade__cap font-manrope">
                <b>{column.index}</b>
              </div>
              <h3 className="colonnade__name font-serif">{column.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
