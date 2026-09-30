import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { INVOICE_REG_NO, SECONDHAND_PERMIT_NO } from "@/lib/content/legal";
import { Emblem } from "@/components/fx/emblem";
import { ComponentStyle } from "@/components/fx/component-style";
import { Eyebrow } from "@/components/site/support-stage";
import { H_DISPLAY, H_TITLE, LEDE, Label, SEC } from "@/components/site/brand-ui";

export const generateMetadata = () => pageMeta("affiliations");

/**
 * Affiliations — the business organisations Cha Jewels belongs to (build
 * step 5; comp page-comps/brand-programmes "affiliations"): the two
 * memberships as cards with the join date, the section and the link, then the
 * trust ledger (founded, secondhand dealer permit, invoice issuer), the same
 * facts the footer and /legal/tokusho carry, from the same constants.
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
@media (min-width: 640px) { .fx-titled { flex-direction: row; align-items: center; gap: clamp(24px, 3.4vw, 40px); } }`;

export default async function Affiliations() {
  const lang = await getLang();
  const t = tr(lang);

  const entries = [
    {
      key: "cci",
      name: t("contact", "afCciName"),
      joined: t("contact", "afCciJoined"),
      section: t("contact", "afCciSection"),
      href: "https://www.tokyo-cci.or.jp/",
    },
    {
      key: "rotary",
      name: t("contact", "afRotaryName"),
      joined: t("contact", "afRotaryJoined"),
      section: null,
      // The CENTRAL club: Katsushika has several Rotary clubs with similar
      // names, and this is the one whose own site carries this club's name.
      href: "https://www.kcrotary.jp/",
    },
  ];

  const ledger = [
    { k: t("trust", "founded"), v: t("trust", "foundedValue"), note: null },
    { k: t("trust", "permit"), v: t("contact", "permitNo", { n: SECONDHAND_PERMIT_NO }), note: t("contact", "permitAuthority") },
    { k: t("trust", "invoice"), v: INVOICE_REG_NO, note: null },
  ];

  return (
    <section className={`bg-chalk text-charcoal ${SEC}`}>
      <div className="wrap">
        {/* Decorative emblem (components/fx/emblem.tsx); the h1 carries the title. */}
        <ComponentStyle id="fx-titled" css={TITLE_CSS} />
        <div className="fx-titled">
          <Emblem name="affiliations" sm={96} lg={144} />
          <div>
            <Eyebrow rule>{t("navMenu", "company")}</Eyebrow>
            <h1 className={`mt-3.5 text-charcoal-deep ${H_DISPLAY}`}>{t("contact", "affiliationsH")}</h1>
            <p className={`mt-4 ${LEDE}`}>{t("contact", "affiliationsLede")}</p>
          </div>
        </div>

        <ul className="mt-12 grid gap-6 lg:grid-cols-2">
          {entries.map((e) => (
            <li key={e.key} className="grid content-start gap-2.5 border border-t-2 border-hairline border-t-gold-dark bg-white p-6 sm:p-7">
              <h2 className={`text-charcoal-deep ${H_TITLE}`}>{e.name}</h2>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-1.5 text-sm">
                <dt className="text-charcoal/70">{t("contact", "afJoined")}</dt>
                <dd className="text-charcoal-deep">{e.joined}</dd>
                {e.section && (
                  <>
                    <dt className="text-charcoal/70">{t("contact", "afSection")}</dt>
                    <dd className="text-charcoal-deep">{e.section}</dd>
                  </>
                )}
              </dl>
              <a
                href={e.href}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex min-h-11 items-center justify-self-start text-sm font-semibold text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark"
              >
                {new URL(e.href).hostname.replace(/^www\./, "")} ↗
              </a>
            </li>
          ))}
        </ul>

        <dl className="mt-12 grid border-l border-t border-hairline bg-white sm:grid-cols-3">
          {ledger.map((row) => (
            <div key={row.k} className="border-b border-r border-hairline p-5">
              <dt><Label>{row.k}</Label></dt>
              <dd className={`mt-1.5 font-display text-charcoal-deep lining-nums ${H_TITLE}`}>{row.v}</dd>
              {row.note && <dd className="mt-1 text-[13px] text-charcoal/70">{row.note}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
