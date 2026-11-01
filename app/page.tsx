import { getLang } from "@/lib/i18n-server";
import { contactEmail, follow } from "@/lib/settings";
import { switchTargets } from "@/lib/locale-nav";
import { PATH_HEADER } from "@/lib/i18n";
import { headers } from "next/headers";
import { JsonLd } from "@/components/site/json-ld";
import { LumiereHome } from "@/components/lumiere/home/home-view";
export const revalidate = 60;

/**
 * Homepage — THE LUMIÈRE HOME (redesign/lumiere P2, docs/tasks/lumiere-redesign.md
 * §6; owner-authorised 2026-10-31). The Stitch home it replaces is kept in the
 * tree, unused, for the Hub swap and the P5 clean-up (components/home/*,
 * lib/hero-deck.ts); nothing of the existing site is dropped:
 *
 *   hero (film + category slides)     → the Lumière hero (card ring, pendant)
 *   values bento                      → the philosophy block (§13 rows 17–27)
 *   collections cards + eyebrow/lead  → the collections block (§13 rows 8–12, §14)
 *   recently viewed, layaway band + calculator, customer stories, new arrivals,
 *   the loyalty band (new, D-21)      → part B of P2 (components/lumiere/home/*)
 *
 * Metadata, canonical, hreflang and the JewelryStore JSON-LD are unchanged;
 * the one <h1> is the hero headline. Every string comes from §13/§14 or
 * lib/i18n (lib/content/lumiere-home.ts); every image is a registered
 * placeholder until the Hub swap (lib/lumiere/placeholders.ts).
 */
export default async function Home() {
  const [lang, h, storeEmail, storeSameAs] = await Promise.all([
    getLang(),
    headers(),
    // Chrome reads for the JewelryStore JSON-LD (Phase 4 §16): the Hub's
    // contact email and social row, caught like the other chrome reads — a
    // failed read omits the field, never the page.
    contactEmail().catch(() => null),
    follow().then((links) => links.map((l) => l.href), () => [] as string[]),
  ]);
  // The language switcher's destinations for this path (lib/locale-nav.ts),
  // the same read the root layout makes for the site header.
  const targets = await switchTargets(h.get(PATH_HEADER)).catch(() => ({ en: null, ja: null } as const));

  return (
    <>
      <JsonLd type="store" email={storeEmail} sameAs={storeSameAs} />
      <LumiereHome lang={lang} switchTargets={targets} />
    </>
  );
}
