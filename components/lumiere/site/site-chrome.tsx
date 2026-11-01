import type { Lang } from "@/lib/i18n-core";
import type { SwitchTargets } from "@/lib/locale-nav";
import { chromeFontKeys } from "@/lib/lumiere/font-urls";
import { FontPreload } from "@/components/lumiere/common/font-preload";

import { buildChrome } from "./chrome-data";
import { SiteHeader } from "./site-header";

/**
 * The Lumière header on every page but the home (P3): the chrome's data
 * built on the server (chrome-data.tsx), the fixed bar as a client leaf
 * (site-header.tsx), and the two faces the bar draws above the fold preloaded
 * (lib/lumiere/font-urls.ts). The home renders its own header inside the
 * pinned hero from the same data (components/lumiere/home/home-view.tsx).
 */
export const SiteChrome = async ({ lang, switchTargets }: { lang: Lang; switchTargets?: SwitchTargets }) => {
  const { chrome, crawl, messenger } = await buildChrome({ lang, switchTargets });
  return (
    <>
      <FontPreload keys={chromeFontKeys()} />
      <SiteHeader lang={lang} chrome={chrome} crawl={crawl} messenger={messenger} />
    </>
  );
};
