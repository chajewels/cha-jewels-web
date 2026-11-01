"use client";

import Link from "next/link";
import { animated } from "@react-spring/web";

import { useWindowWidth } from "@/hooks/use-window-size";
import { designUnit } from "@/lib/lumiere/design-unit";

import { useHeroContent } from "./hero-content";
import { categoryPositionAt, range, unitPxFor } from "./hero-geometry";
import {
  CATEGORY,
  CATEGORY_MASK,
  categoryScaleFor,
  TIMELINE,
} from "./hero.config";
import { useHeroProgress } from "./hero-progress";

/**
 * A design pixel for this strip alone — the shared unit times the scale the
 * sheet sets for the band.
 *
 * The sizes go through the custom property rather than through the number
 * computed below, so the server and the client render the same string: the
 * width is not known until the client, and baking it into the markup would
 * hand React a different style on hydration.
 */
const categoryUnit = (value: number): string =>
  `calc(${designUnit(value)} * var(--hero-category-scale, 1))`;

/**
 * The vertical category index pinned to the right edge, centred on the viewport.
 *
 * The strip renders in a single colour and is faded by a fixed alpha mask, so
 * whichever pill sits at the centre of the window reads as active — in Figma
 * every pill carries the same stroke, and the gradient alone does the
 * highlighting. Advancing the index is therefore a translate of the strip, not
 * a restyle of the items.
 *
 * Five pills on this site — the Hub's categories under their short names
 * (§14) — against the reference's four; the stops and the window are in
 * `hero.config.ts`, the strip's width follows the language (§13 row 7).
 */
export const CategoryIndex = () => {
  const { lang, content, chrome } = useHeroContent();
  const { categories } = content;
  const progress = useHeroProgress();
  const width = useWindowWidth();
  // The travel is a pixel figure and cannot read the property, so it takes the
  // same factor from the config. The transform is written after mount, so a
  // client-only number is safe here in a way it is not in the markup above.
  const unitPx = unitPxFor(width) * categoryScaleFor(width);

  // Index sitting in the centre of the masked window at rest. Derived from the
  // list length, so dropping or adding a category keeps the strip centred.
  const centreIndex = (categories.length - 1) / 2;

  const exitOpacity = progress.to(
    (p) => 1 - range(p, TIMELINE.categoryExit[0], TIMELINE.categoryExit[1]),
  );

  return (
    <animated.nav
      aria-label={chrome.labels.collectionsIndex}
      // Desktop only. Below 1024 the index is dropped rather than re-laid out:
      // the composition already fills the screen there, and a second strip of
      // labels under it read as clutter.
      className="absolute top-1/2 right-u-40 z-20 hidden -translate-y-1/2 lg:block"
      style={{
        width: categoryUnit(content.categoryStripWidth),
        height: categoryUnit(CATEGORY.windowHeight),
        maskImage: CATEGORY_MASK,
        WebkitMaskImage: CATEGORY_MASK,
        opacity: exitOpacity,
        // Stops the faded pills from still catching taps over the photograph.
        pointerEvents: exitOpacity.to((v) => (v < 0.05 ? "none" : "auto")),
      }}
    >
      <animated.ul
        className="flex list-none flex-col items-end will-change-transform"
        style={{
          gap: categoryUnit(CATEGORY.gap),
          // Advancing the index is a translate of the whole strip; the mask does
          // the highlighting, so no item ever changes style.
          // Pixels, not calc() — react-spring inlines custom properties when it
          // re-serialises an animated transform, producing a nested calc() the
          // browser discards. See the note on `toTransform`.
          transform: progress.to(
            (p) =>
              `translateY(${(centreIndex - categoryPositionAt(p)) * CATEGORY.pitch * unitPx}px)`,
          ),
        }}
      >
        {categories.map((category, index) => (
          <li
            key={category.href}
            className={
              CATEGORY.fullWidthIndexes.includes(index) ? "w-full" : undefined
            }
          >
            <Link
              href={category.href}
              data-analytics="hero-category"
              className="flex w-full items-center justify-center rounded-pill border-border-muted font-serif whitespace-nowrap transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70"
              style={{
                height: categoryUnit(CATEGORY.itemHeight),
                paddingInline: categoryUnit(CATEGORY.paddingX),
                borderWidth: categoryUnit(CATEGORY.borderWidth),
                fontSize: `max(12px, ${categoryUnit(CATEGORY.fontSize)})`,
                lineHeight: `max(12px, ${categoryUnit(CATEGORY.lineHeight)})`,
              }}
            >
              {/* Each English label opens on an italic capital, as the wordmark
                  and CTA do; Japanese has no italic (§5.2). */}
              {lang === "en" ? (
                <>
                  <span className="italic">{category.label.charAt(0)}</span>
                  {category.label.slice(1)}
                </>
              ) : (
                category.label
              )}
            </Link>
          </li>
        ))}
      </animated.ul>
    </animated.nav>
  );
};
