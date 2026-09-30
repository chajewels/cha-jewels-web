import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { hub } from "@/lib/hub-api";
import { catalogue, isAvailable } from "@/lib/catalog-context";
import { categoryName } from "@/lib/catalog-i18n";
import { fromVariant } from "@/lib/queries/products";
import { contactEmail, follow } from "@/lib/settings";
import { COMPANY_PHONE } from "@/lib/content/legal";
import { formatYenPeso, isFigure } from "@/lib/utils";
import type { Category } from "@/lib/types";
import { Eyebrow } from "@/components/site/support-stage";
import { DarkBand, H_DISPLAY, H_TITLE, LEDE, Proof, ProofCells, ProofRow, SEC_S, specExample } from "@/components/site/brand-ui";

export const generateMetadata = () => pageMeta("why");

/**
 * WHY CHA JEWELS (build step 5; comp page-comps/brand-programmes "why").
 *
 * The title, subheading and intro beside the photograph; then the reasons as
 * a numbered ledger (01–05) with PROOF beside each one, all real:
 *
 *   s1  the founding and incorporation years and the base, on record
 *   s2  the Hub's live count of available pieces per category (D5-2: the
 *       "designer accessories" wording stays and the counts speak for it)
 *   s3  a real piece's metal, weight and stone, from the Hub
 *   s4  layaway, ENGLISH ONLY (layawayOffered): that piece's Hub down payment
 *   s5  the ways to reach a person: the Hub's email and Messenger link, and
 *       the office phone from lib/content/legal.ts
 *
 * A proof whose data is missing renders nothing; the reason stands alone.
 * The headline, the sections and the CTA are LIVE TEXT (EN title "Why Cha
 * Jewels", owner decision D5-1).
 */
export default async function WhyChaJewels() {
  const lang = await getLang();
  const t = tr(lang);
  const layaway = layawayOffered(lang);
  const [all, cats, email, followLinks] = await Promise.all([
    catalogue(),
    hub.categories().catch(() => [] as Category[]),
    contactEmail(),
    follow(),
  ]);
  const messenger = followLinks.find((l) => l.key === "messenger")?.href ?? null;
  const spec = specExample(all, lang);
  const available = all.filter(isAvailable);
  // A COUNT of pieces per category, not a figure of money.
  const counts = cats.map((c) => ({ c, n: available.filter((p) => p.category_slugs?.includes(c.slug)).length }));
  const specProduct = spec ? all.find((p) => p.slug === spec.slug) : undefined;
  const dpVariant = specProduct ? fromVariant(specProduct) : null;

  const proofs: Record<string, React.ReactNode> = {
    s1: (
      <Proof label={t("why", "proofRecord")}>
        <ProofCells cells={[
          { v: "2021", k: t("why", "founded") },
          { v: "2024", k: t("why", "incorporated") },
          { v: t("why", "tokyo"), k: t("why", "tateishi") },
        ]} />
      </Proof>
    ),
    s2: counts.length > 0 ? (
      <Proof label={t("support", "inStockNow")}>
        {counts.map(({ c, n }) => (
          <ProofRow key={c.slug} k={categoryName(c, lang)} v={n === 0 ? t("why", "noneInStock") : n === 1 ? t("why", "piece") : t("why", "pieces", { n: String(n) })} />
        ))}
      </Proof>
    ) : null,
    s3: spec ? (
      <Proof label={<Link href={`/products/${spec.slug}`} className="underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{t("why", "proofExample", { sku: spec.sku })}</Link>}>
        <ProofCells cells={[
          { v: spec.metal, k: t("product", "metal") },
          { v: spec.weight, k: t("product", "weight") },
          ...(spec.stone ? [{ v: spec.stone, k: t("product", "stone") }] : []),
        ]} />
      </Proof>
    ) : null,
    s4: (
      <Proof label={t("home", "layPill")}>
        {spec && dpVariant && isFigure(dpVariant.down_payment_jpy) && isFigure(dpVariant.down_payment_php) && (
          <ProofRow k={t("why", "dpOn", { sku: spec.sku })} v={formatYenPeso(dpVariant.down_payment_jpy, dpVariant.down_payment_php)} />
        )}
        <Link href="/layaway" className="mt-1 inline-flex min-h-11 items-center text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{t("why", "howLayaway")}</Link>
      </Proof>
    ),
    s5: (
      <Proof label={t("why", "proofReach")}>
        {email && <ProofRow k={t("contact", "email")} v={<a href={`mailto:${email}`} className="inline-flex min-h-8 items-center hover:text-gold-dark hover:underline">{email}</a>} />}
        <ProofRow k={t("contact", "phoneOffice")} v={<a href={`tel:${COMPANY_PHONE.office.replace(/-/g, "")}`} className="inline-flex min-h-8 items-center hover:text-gold-dark hover:underline">{COMPANY_PHONE.office}</a>} />
        {messenger && <ProofRow k="Messenger" v={<a href={messenger} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center hover:text-gold-dark hover:underline">{messenger.replace(/^https?:\/\/(www\.)?/, "")}</a>} />}
      </Proof>
    ),
  };

  const sections = [
    { key: "s1", h: t("why", "s1h"), p: t("why", "s1p") },
    { key: "s2", h: t("why", "s2h"), p: t("why", "s2p") },
    { key: "s3", h: t("why", "s3h"), p: t("why", "s3p") },
    ...(layaway ? [{ key: "s4", h: t("why", "s4h"), p: t("why", "s4p") }] : []),
    { key: "s5", h: t("why", "s5h"), p: t("why", "s5p") },
  ];

  return (
    <>
      <section className="bg-chalk pb-12 pt-[clamp(40px,6vw,88px)] text-charcoal">
        <div className="wrap grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
          <div>
            <Eyebrow rule>{t("navMenu", "company")}</Eyebrow>
            <h1 className={`mt-4 text-charcoal-deep ${H_DISPLAY}`}>{t("why", "h1")}</h1>
            <p className={`mt-[22px] font-display text-gold-dark ${H_TITLE}`}>{t("why", "sub")}</p>
            <p className={`mt-[18px] ${LEDE}`}>{t("why", "intro")}</p>
          </div>
          <Image
            src="/images/company/why-cha-jewels.webp"
            alt={t("why", "imageAlt")}
            width={1400}
            height={933}
            // The page's largest element on both layouts, so it is not lazy.
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="aspect-[4/3] w-full rounded-sm object-cover"
          />
        </div>
      </section>

      <section className="wrap pb-14 sm:pb-[72px]">
        <ol className="border-t border-hairline">
          {sections.map((s, i) => (
            <li key={s.key} className="grid grid-cols-[44px_1fr] items-start gap-x-3.5 gap-y-4 border-b border-hairline py-[30px] lg:grid-cols-[72px_1fr_1fr] lg:gap-x-7">
              <span aria-hidden="true" className="font-display text-[30px] leading-none text-gold-dark lining-nums lg:text-[40px]">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="mb-2 font-display text-2xl leading-[1.25] text-charcoal-deep [:lang(ja)_&]:text-xl [:lang(ja)_&]:leading-normal [:lang(ja)_&]:[word-break:auto-phrase]">{s.h}</h2>
                <p className="text-charcoal/80">{s.p}</p>
              </div>
              {proofs[s.key] && <div className="col-span-2 lg:col-span-1">{proofs[s.key]}</div>}
            </li>
          ))}
        </ol>
      </section>

      <DarkBand>
        <div className={`wrap ${SEC_S} flex flex-wrap items-center justify-between gap-5`}>
          <p className={`font-display text-gold-pale ${H_TITLE}`}>{t("why", "close")}</p>
          <Link href="/collections" className="btn-press inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-chalk/55 px-6 py-3 text-[15px] font-medium text-chalk hover:border-chalk">
            {t("why", "cta")} <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </DarkBand>
    </>
  );
}
