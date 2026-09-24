import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { Emblem } from "@/components/fx/emblem";
import { ComponentStyle } from "@/components/fx/component-style";

export const generateMetadata = () => pageMeta("affiliations");

/**
 * Affiliations — the business organisations Cha Jewels belongs to.
 *
 * TEXT ONLY, deliberately. No logos and no membership numbers:
 *
 *   A chamber or club logo is that organisation's trade mark, and reproducing
 *   one needs their permission, which nobody has asked for. Their names, which
 *   are facts, need none.
 *
 *   A membership number identifies the account, not the membership, and is of
 *   no use to a reader.
 *
 * Neither membership says anything about a piece of jewelry, so nothing here
 * is phrased as though it did — this is who the business belongs to, next to
 * the address and the registration number, not a quality claim.
 */
/** The emblem beside the title from sm, above it on narrow phones (component CSS — docs/perf-baseline.md). */
const TITLE_CSS = `.fx-titled { display: flex; flex-direction: column; align-items: flex-start; gap: 1.25rem; }
@media (min-width: 640px) { .fx-titled { flex-direction: row; align-items: center; gap: clamp(20px, 3vw, 36px); } }`;

export default async function Affiliations() {
  const lang = await getLang();
  const t = tr(lang);

  const entries = [
    {
      key: "cci",
      name: t("contact", "afCciName"),
      detail: t("contact", "afCciDetail"),
      href: "https://www.tokyo-cci.or.jp/",
    },
    {
      key: "rotary",
      name: t("contact", "afRotaryName"),
      detail: t("contact", "afRotaryDetail"),
      // The CENTRAL club: Katsushika has several Rotary clubs with similar
      // names, and this is the one whose own site carries this club's name.
      href: "https://www.kcrotary.jp/",
    },
  ];

  return (
    <section className="bg-chalk py-[clamp(48px,7vw,96px)] text-charcoal">
      <div className="wrap max-w-2xl">
        {/* Decorative emblem (components/fx/emblem.tsx); the h1 carries the title. */}
        <ComponentStyle id="fx-titled" css={TITLE_CSS} />
        <div className="fx-titled">
          <Emblem name="affiliations" sm={96} lg={120} />
          <h1 className="text-[clamp(32px,5vw,64px)] leading-[1.12] text-charcoal-deep">{t("contact", "affiliationsH")}</h1>
        </div>
        <p className="mt-4 text-[17px] leading-relaxed text-charcoal-deep">{t("contact", "affiliationsLede")}</p>

        <ul className="mt-10 space-y-4">
          {entries.map((e) => (
            <li key={e.key} className="rounded-sm border border-hairline bg-white p-5 sm:p-6">
              <h2 className="font-display text-[clamp(20px,2.4vw,26px)] text-charcoal-deep">{e.name}</h2>
              <p className="mt-1.5 text-sm text-charcoal/70">{e.detail}</p>
              <a
                href={e.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-gold-dark underline-offset-4 hover:underline"
              >
                {new URL(e.href).hostname.replace(/^www\./, "")} →
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
