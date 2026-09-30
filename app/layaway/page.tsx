import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/page-meta";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { ProductCard } from "@/components/catalog/product-card";
import { HubImage } from "@/components/media/hub-image";
import { Eyebrow } from "@/components/site/support-stage";
import { H_DISPLAY, H_HEAD, LEDE_DARK, SEC, StageBand } from "@/components/site/brand-ui";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { layawayOffered } from "@/lib/layaway-availability";
import { catalogue, isAvailable } from "@/lib/catalog-context";
import { fromVariant, type Product } from "@/lib/queries/products";
import { cardImage } from "@/lib/product-media";
import { productName } from "@/lib/catalog-i18n";
import { formatMoney, isFigure } from "@/lib/utils";

export const generateMetadata = () => pageMeta("layaway");

/**
 * A piece that can be reserved today: available, and the variant whose price
 * the card shows is in stock and carries BOTH of the Hub's down payments (the
 * card's own rule for its reserve line). Nothing here computes a figure.
 */
function reservable(p: Product): boolean {
  const v = fromVariant(p);
  return isAvailable(p) && !!v && v.stock_qty > 0 && isFigure(v.down_payment_jpy) && isFigure(v.down_payment_php);
}

/**
 * LAYAWAY (build step 5; comp page-comps/brand-programmes "layaway").
 *
 *  1. The dark stage: the pitch and the three numbered steps (the homepage
 *     band's words, keys home.lay*). The orange step discs are the one place
 *     DESIGN.md allows orange as ornament, inside the layaway band.
 *  2. The calculator, on a REAL PIECE (audit Product #6): the first piece in
 *     the Hub's order that can be reserved today, on its own dark panel, and
 *     the calculator in piece mode beside it — no price field, launched terms
 *     only ("coming soon" terms are not listed here), every figure the Hub's
 *     quote for that piece's price (hub.layawayQuote). Its one orange action
 *     goes to the piece. If no piece can be reserved, the calculator falls
 *     back to its price field, as on the homepage.
 *  3. Pieces you can reserve today: four real cards with their Hub down
 *     payments.
 *
 * The homepage's LayawayBand is no longer rendered here; it is unchanged on
 * the homepage.
 */
export default async function LayawayPage() {
  const lang = await getLang();

  // 404, NOT a redirect and NOT the English page inside a Japanese site.
  // Layaway does not exist on ja (owner decision 2026-09-15), and a 404 is the
  // only honest answer: a redirect to / swallows the link without saying why,
  // and rendering English copy under a Japanese header claims the site offers
  // something it does not. The sitemap entry is removed to match, so the URL is
  // not advertised as one that resolves. Since 2026-09-25 /account/layaway is
  // gated the same way (nothing layaway-related on the Japanese site).
  if (!layawayOffered(lang)) notFound();

  const t = tr(lang);
  const pool = (await catalogue()).filter(reservable);
  const chosen = pool.find((p) => cardImage(p)) ?? pool[0] ?? null;
  const chosenVariant = chosen ? fromVariant(chosen) : null;
  const chosenImage = chosen ? cardImage(chosen) : null;
  const strip = pool.filter((p) => p.slug !== chosen?.slug).slice(0, 4);

  return (
    <>
      <StageBand>
        <div className={`wrap ${SEC}`}>
          <Eyebrow dark rule>{t("home", "layPill")}</Eyebrow>
          <h1 className={`gilt mt-4 max-w-[16ch] ${H_DISPLAY}`}>{t("home", "layH")}</h1>
          <p className={`mt-[18px] ${LEDE_DARK}`}>{t("home", "layP")}</p>
          {/* The three steps, joined by a gold line: across from sm, down the
              discs on a phone. */}
          <ol className="relative mt-10 grid gap-6 before:absolute before:bottom-[22px] before:left-[22px] before:top-[22px] before:w-px before:bg-[linear-gradient(180deg,#E8D28A,#C9A227)] sm:grid-cols-3 sm:gap-0 sm:before:bottom-auto sm:before:right-[22px] sm:before:h-px sm:before:w-auto sm:before:bg-[linear-gradient(90deg,#E8D28A,#C9A227)]">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className="relative grid grid-cols-[44px_1fr] gap-x-4 sm:block sm:pr-8">
                <span aria-hidden="true" className="lining-nums relative grid h-11 w-11 place-items-center rounded-full bg-orange text-base font-semibold text-charcoal-deep">{n}</span>
                <div>
                  <h2 className="mt-2 font-display text-[22px] leading-[1.25] text-gold-pale sm:mt-[18px]">{t("home", `layStep${n}H`)}</h2>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-chalk/80">{t("home", `layStep${n}P`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </StageBand>

      <section className={`wrap ${SEC}`}>
        <Eyebrow>{t("home", "layCalcH")}</Eyebrow>
        <h2 className={`mb-7 mt-2.5 text-charcoal-deep ${H_HEAD}`}>{t("home", "layCalcP")}</h2>
        {chosen && chosenVariant ? (
          <div className="grid border border-hairline bg-white lg:grid-cols-[1fr_1.1fr]">
            <StageBand as="div" className="flex flex-col">
              <div className="flex h-full flex-col gap-2.5 p-[26px]">
                <Eyebrow dark>{t("layawayPage", "chosenPiece")}</Eyebrow>
                <Link href={`/products/${chosen.slug}`} className="relative block h-[230px]" aria-label={productName(chosen, lang)}>
                  {chosenImage && (
                    chosenImage.kind === "cut" ? (
                      <span className="absolute inset-x-0 bottom-3 top-2 block [filter:drop-shadow(0_18px_18px_rgb(0_0_0/.55))]">
                        <HubImage src={chosenImage.src} alt="" fill sizes="(min-width:1024px) 400px, 80vw" className="object-contain object-bottom" />
                      </span>
                    ) : (
                      <span className="absolute bottom-3 left-1/2 top-2 block aspect-square -translate-x-1/2 border border-gold/45 bg-[#121110] p-[7%] shadow-[0_18px_30px_rgb(0_0_0/.5)]">
                        <span className="relative block h-full"><HubImage src={chosenImage.src} alt="" fill sizes="(min-width:1024px) 240px, 60vw" className="object-contain" /></span>
                      </span>
                    )
                  )}
                </Link>
                <p className="text-[13.5px] leading-normal text-chalk/85">{productName(chosen, lang)}</p>
                <p className="lining-nums font-display text-[28px] leading-tight text-gold-pale">{formatMoney(chosenVariant.price_jpy)}</p>
                <Link href="/collections" className="inline-flex min-h-11 items-center self-start text-sm text-gold-pale underline decoration-gold-pale/50 underline-offset-4 hover:decoration-gold-pale">{t("layawayPage", "choosePiece")}</Link>
              </div>
            </StageBand>
            <LayawayCalculator
              lang={lang}
              fixedPiece
              initialPrice={chosenVariant.price_jpy}
              cta={{ label: t("layawayPage", "reserveThis"), href: `/products/${chosen.slug}` }}
              className="gap-5 rounded-none border-0 p-6 shadow-none sm:p-7"
            />
          </div>
        ) : (
          <LayawayCalculator lang={lang} cta={{ label: t("home", "layCta"), href: "/collections" }} className="max-w-2xl" />
        )}
      </section>

      {strip.length > 0 && (
        <section className="wrap pb-14 sm:pb-[88px]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-[clamp(22px,2.4vw,30px)] text-charcoal-deep">{t("layawayPage", "reserveToday")}</h2>
            <Link href="/collections" className="inline-flex min-h-11 items-center text-sm text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{t("layawayPage", "allPieces")}</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-8">
            {strip.map((p, i) => <ProductCard key={p.id} product={p} lang={lang} index={i} />)}
          </div>
        </section>
      )}
    </>
  );
}
