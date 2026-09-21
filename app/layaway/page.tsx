import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/page-meta";
import { LayawayBand } from "@/components/commerce/layaway-band";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { hub } from "@/lib/hub-api";
import { layawayOffered } from "@/lib/layaway-availability";
export const generateMetadata = () => pageMeta("layaway");
export default async function LayawayPage() {
  const [lang, fx] = await Promise.all([getLang(), hub.fx().catch(() => ({ jpy_php: 0.39, as_of: "" }))]);

  // 404, NOT a redirect and NOT the English page inside a Japanese site.
  // Layaway does not exist on ja (owner decision 2026-09-15), and a 404 is the
  // only honest answer: a redirect to / swallows the link without saying why,
  // and rendering English copy under a Japanese header claims the site offers
  // something it does not. The sitemap entry is removed to match, so the URL is
  // not advertised as one that resolves. /account/layaway is NOT gated — an
  // existing plan stays reachable in either language.
  if (!layawayOffered(lang)) notFound();

  const t = tr(lang);
  return (
    <>
      <section className="surface-light bg-chalk text-charcoal-deep py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <h1 className="text-[clamp(36px,5.5vw,80px)]">{t("home", "layH")}</h1>
          <p className="mt-5 max-w-[52ch] text-charcoal">{t("home", "layP")}</p>
        </div>
      </section>
      {/* The same band the homepage carries, not a second telling of it. The
          `.band-dark` parent is HERE rather than on the component: the homepage
          renders the same band, and putting the class inside would change the
          homepage's markup, which the extraction is required not to do. It
          scopes `--rule` back to gold for anything drawn inside the band. */}
      <div className="band-dark">
        <LayawayBand lang={lang} phpRate={fx.jpy_php} />
      </div>
    </>
  );
}
