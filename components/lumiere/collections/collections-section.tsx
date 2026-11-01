import Image from "next/image";

import type { LumiereCollectionsContent } from "@/lib/content/lumiere-home";

import { CollectionCard } from "./collection-card";
import { CollectionsReveal } from "./collections-reveal";
import { PARALLAX } from "./collections.config";

/**
 * The collections block — Get Layers "Hero 5 (Collections)", 1443:7.
 *
 * Two rows of two, and the widths swap between them: 560 + 788 above, 788 + 560
 * below, always 12 apart. That is a pair of flex rows rather than a grid,
 * because a grid would need a column template that changes per row and there is
 * nothing to align down the middle — the seam moves on purpose.
 *
 * This site has five categories (report §8, D-8): the reference's 2×2 and a
 * fifth, full-width card as a third row. Everything is in design units, so the
 * block reproduces Figma exactly at 1440 and holds its proportions either side
 * of it; the breakpoints restate it in flow (app/lumiere/blocks.css).
 */
export const CollectionsSection = ({ content }: { content: LumiereCollectionsContent }) => {
  const [a, b, c, d, e] = content.cards;
  return (
    <section
      aria-labelledby="collections-heading"
      className="collections collections--five relative isolate w-full overflow-hidden bg-surface text-content"
    >
      <Image
        src="/lumiere/shared/paper.webp"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="z-0 object-cover"
      />

      <CollectionsReveal heading={content.heading} headingText={content.headingText} lead={content.lead} />

      <div className="collections__grid collections__grid--five">
        <div className="collections__row">
          <CollectionCard card={a} cta={content.cta} depth={PARALLAX.photo[0]} />
          <CollectionCard card={b} cta={content.cta} depth={PARALLAX.photo[1]} />
        </div>
        <div className="collections__row">
          <CollectionCard card={c} cta={content.cta} depth={PARALLAX.photo[2]} />
          <CollectionCard card={d} cta={content.cta} depth={PARALLAX.photo[3]} />
        </div>
        <div className="collections__row">
          <CollectionCard card={e} cta={content.cta} depth={PARALLAX.photo[4]} />
        </div>
      </div>
    </section>
  );
};
