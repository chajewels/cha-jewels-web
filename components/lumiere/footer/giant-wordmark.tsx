"use client";

import dynamic from "next/dynamic";

import type { Lang } from "@/lib/i18n-core";
import { NearIsland } from "@/components/lumiere/common/near-island";

/**
 * The footer's giant wordmark, drawn by the letter reveal only once the
 * footer nears the viewport: the text engine's chunk stays out of every
 * page's first load (the footer is the last thing on a page), and until
 * then the name stands as plain text at the same size, so nothing shifts.
 */
const LetterReveal = dynamic(() => import("@/components/lumiere/common/letter-reveal").then((m) => m.LetterReveal), {
  ssr: false,
  loading: () => <span className="block whitespace-nowrap">Cha Jewels</span>,
});

export const GiantWordmark = ({ lang }: { lang: Lang }) => (
  <NearIsland margin="40% 0px" fallback={<span className="block whitespace-nowrap">Cha Jewels</span>}>
    <LetterReveal runs={[{ text: "Cha Jewels" }]} lang={lang} />
  </NearIsland>
);
