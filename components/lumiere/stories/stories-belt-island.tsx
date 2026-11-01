"use client";

import dynamic from "next/dynamic";

import type { Lang } from "@/lib/i18n";
import type { LumiereStoriesStrings } from "@/lib/content/lumiere-home";
import { NearIsland } from "@/components/lumiere/common/near-island";

import type { BeltStory } from "./stories-belt";

/**
 * THE BELT AS A LAZY CLIENT ISLAND (P4 perf: the first build of the belt put
 * its engine, its dialog and every card into the home's hydration — TBT on
 * the English home went 159 → 262 ms). The section's words are server HTML
 * (the heading, the lead, the summary and the verbatim list of every story in
 * stories-section.tsx); the belt itself — an art object — mounts as the band
 * nears the viewport and its chunk is fetched only then. Until it lands, a
 * same-size band holds the space so nothing below it moves.
 */
const StoriesBelt = dynamic(() => import("./stories-belt").then((m) => m.StoriesBelt), {
  ssr: false,
  loading: () => <div className="slip__band" aria-hidden="true" />,
});

export const StoriesBeltIsland = ({ stories, strings, lang }: { stories: BeltStory[]; strings: LumiereStoriesStrings; lang: Lang }) => (
  <NearIsland margin="120% 0px" fallback={<div className="slip__band" aria-hidden="true" />}>
    <StoriesBelt stories={stories} strings={strings} lang={lang} />
  </NearIsland>
);
