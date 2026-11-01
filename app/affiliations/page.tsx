import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { INVOICE_REG_NO, SECONDHAND_PERMIT_NO } from "@/lib/content/legal";
import { Emblem } from "@/components/fx/emblem";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

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
    <>
      {/* Decorative emblem (components/fx/emblem.tsx); the h1 carries the title. */}
      <PageHead
        eyebrow={t("navMenu", "company")}
        title={t("contact", "affiliationsH")}
        lead={t("contact", "affiliationsLede")}
        aside={<Emblem name="affiliations" sm={96} lg={144} />}
      />
      <PageSection tone="sheet">
        <ul className="lm-grid lm-grid--2">
          {entries.map((e) => (
            <li key={e.key} className="lm-plate lm-plate--bone lm-plate--lift lm-rise grid content-start gap-3">
              <h2 className="ic-aff__name font-display text-charcoal-deep">{e.name}</h2>
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
              <a href={e.href} target="_blank" rel="noreferrer" className="ic-aff__link mt-2 justify-self-start">
                {new URL(e.href).hostname.replace(/^www\./, "")} ↗
              </a>
            </li>
          ))}
        </ul>
      </PageSection>
      <PageSection tone="ink">
        <dl className="lm-grid lm-grid--3">
          {ledger.map((row) => (
            <div key={row.k} className="lm-plate lm-plate--ink lm-rise !border !border-white/20 !bg-white/[0.06]">
              <dt className="lm-eyebrow !mb-0">{row.k}</dt>
              <dd className="mt-3 font-display text-[clamp(22px,2.4vw,32px)] leading-tight text-white lining-nums">{row.v}</dd>
              {row.note && <dd className="mt-1 text-[13px] text-white/75">{row.note}</dd>}
            </div>
          ))}
        </dl>
      </PageSection>
    </>
  );
}
