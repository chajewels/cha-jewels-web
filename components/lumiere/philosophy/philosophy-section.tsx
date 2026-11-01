import type { LumierePhilosophyContent } from "@/lib/content/lumiere-home";
import type { Lang } from "@/lib/i18n";

import { PhilosophyStage } from "./philosophy-stage";

/**
 * The philosophy block — Get Layers "Hero 5 (Philosophy)", 1443:61: six serif
 * lines around a photograph on a paper card, entering as the block is scrolled
 * into view. The lines are the four values of `home.valuesP` (§13 rows 17–27,
 * FIX 4) and the pill goes to /about.
 */
export const PhilosophySection = ({ lang, content }: { lang: Lang; content: LumierePhilosophyContent }) => (
  <PhilosophyStage lang={lang} content={content} />
);
