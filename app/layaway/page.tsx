import Link from "next/link";
import { localePath } from "@/lib/locale";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/page-meta";
import { JsonLd } from "@/components/site/json-ld";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { LayawayPiecePicker } from "@/components/commerce/layaway-piece-picker";
import { ProductCard } from "@/components/catalog/product-card";
import { Eyebrow } from "@/components/site/support-stage";
import { H_DISPLAY, H_HEAD, LEDE_DARK, SEC, StageBand } from "@/components/site/brand-ui";
import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import { getLang } from "@/lib/i18n-server";
import { layawayOffered } from "@/lib/layaway-availability";
import { catalogue, isAvailable } from "@/lib/catalog-context";
import { getFaq, type ViewFaqItem } from "@/lib/faq";
import { fromVariant, type Product } from "@/lib/queries/products";
import { cardImage } from "@/lib/product-media";
import { productName } from "@/lib/catalog-i18n";
import { isFigure } from "@/lib/utils";
import { initialPieceSlug, type PickerPiece } from "@/lib/layaway-picker";

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
 * The picker's row for one reservable piece: only what it draws, never the
 * whole Product. The price is the same variant field the panel always showed.
 */
function pickerPiece(p: Product, lang: Lang): PickerPiece | null {
  const v = fromVariant(p);
  if (!v) return null;
  const img = cardImage(p);
  return { slug: p.slug, name: productName(p, lang), sku: p.sku, price_jpy: v.price_jpy, image: img ? { kind: img.kind, src: img.src } : null };
}

/**
 * THE LAYAWAY FAQ ON THIS PAGE (Phase 3): the Hub FAQ's "Payments and layaway"
 * section, narrowed to the questions that actually mention layaway. ONE SOURCE:
 * the same `getFaq` the /faq page renders, so the two pages cannot disagree and
 * an owner edit in the Hub reaches both. English only — the page is notFound on
 * ja before this runs. Secondary: a Hub FAQ that cannot be read costs this page
 * its FAQ block, never the page.
 */
const FAQ_SECTION = "payments-and-layaway";
const LAYAWAY = /layaway/i;
async function layawayFaq(lang: Lang): Promise<ViewFaqItem[]> {
  const sections = await getFaq(lang).catch(() => []);
  const section = sections.find((s) => s.slug === FAQ_SECTION) ?? sections.find((s) => LAYAWAY.test(s.heading));
  return (section?.items ?? []).filter((i) => LAYAWAY.test(i.question) || LAYAWAY.test(i.answerText));
}

/**
 * LAYAWAY (build step 5; comp page-comps/brand-programmes "layaway"; SEO
 * Phase 3 made it a crawlable page at /en/layaway, app/[lang]/layaway/page.tsx).
 *
 *  1. The dark stage: the page's own H1 (layawayPage.h1; the homepage band
 *     keeps home.layH), the pitch and the three numbered steps (keys
 *     home.lay*). The orange step discs are the one place DESIGN.md allows
 *     orange as ornament, inside the layaway band.
 *  2. The calculator, on a REAL PIECE (audit Product #6): the first piece in
 *     the Hub's order that can be reserved today, on its own dark panel, and
 *     the calculator in piece mode beside it — no price field, launched terms
 *     only ("coming soon" terms are not listed here), every figure the Hub's
 *     quote for that piece's price (hub.layawayQuote). Its one orange action
 *     goes to the piece. If no piece can be reserved, the calculator falls
 *     back to its price field, as on the homepage. "Choose another piece"
 *     opens an in-page picker over the same pool (owner 2026-10-18,
 *     components/commerce/layaway-piece-picker.tsx); ?piece=<slug> opens on
 *     that piece, and an unknown slug opens on the default.
 *  3. Pieces you can reserve today: four real cards with their Hub down
 *     payments.
 *  4. Layaway questions (Phase 3): the Hub FAQ's layaway answers, with FAQPage
 *     structured data for exactly the questions shown, and a link to the full
 *     payments-and-layaway section of /faq.
 *  5. Before you reserve (Phase 3): the Shopping Guide, the Jewelry Guide and
 *     Why Cha Jewels — the conversion path's supporting pages, as real links.
 *
 * The homepage's LayawayBand is no longer rendered here; it is unchanged on
 * the homepage.
 */
export default async function LayawayPage({ searchParams }: { searchParams: Promise<{ piece?: string | string[] }> }) {
  const lang = await getLang();

  // 404, NOT a redirect and NOT the English page inside a Japanese site.
  // Layaway does not exist on ja (owner decision 2026-09-15), and a 404 is the
  // only honest answer: a redirect to / swallows the link without saying why,
  // and rendering English copy under a Japanese header claims the site offers
  // something it does not. The sitemap lists only /en/layaway to match (Phase
  // 3), so no URL is advertised that does not resolve. Since 2026-09-25
  // /account/layaway is gated the same way (nothing layaway-related on the
  // Japanese site).
  if (!layawayOffered(lang)) notFound();

  const t = tr(lang);
  const L = (h: string) => localePath(h, lang);
  const [all, faq] = await Promise.all([catalogue(), layawayFaq(lang)]);
  const pool = all.filter(reservable);
  const chosen = pool.find((p) => cardImage(p)) ?? pool[0] ?? null;
  const pieces = pool.map((p) => pickerPiece(p, lang)).filter((p): p is PickerPiece => p !== null);
  // ?piece=<slug> opens on that piece when it is in the pool; anything else
  // (unknown, sold, not reservable) opens on the default piece.
  const requested = (await searchParams).piece;
  const startSlug = chosen ? initialPieceSlug(pieces, typeof requested === "string" ? requested : null, chosen.slug) : null;
  const strip = pool.filter((p) => p.slug !== chosen?.slug).slice(0, 4);

  const more = [
    { href: L("/shopping-guide"), label: t("nav", "shoppingGuide") },
    { href: L("/jewelry-guide"), label: t("nav", "jewelryGuide") },
    { href: L("/why-cha-jewels"), label: t("layawayPage", "whyLink") },
  ];

  return (
    <>
      {/* Same markdown, flattened once by the renderer, for the visible answer
          and the structured data: Google is never shown an answer a reader
          cannot find on this page. */}
      {faq.length > 0 && <JsonLd type="faq" items={faq.map((i) => ({ q: i.question, a: i.answerText }))} />}
      <StageBand>
        <div className={`wrap ${SEC}`}>
          <Eyebrow dark rule>{t("home", "layPill")}</Eyebrow>
          <h1 className={`gilt mt-4 max-w-[22ch] ${H_DISPLAY}`}>{t("layawayPage", "h1")}</h1>
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
        {startSlug ? (
          <LayawayPiecePicker lang={lang} pieces={pieces} initialSlug={startSlug} />
        ) : (
          <LayawayCalculator lang={lang} cta={{ label: t("home", "layCta"), href: L("/collections") }} className="max-w-2xl" />
        )}
      </section>

      {strip.length > 0 && (
        <section className="wrap pb-14 sm:pb-[88px]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-[clamp(22px,2.4vw,30px)] text-charcoal-deep">{t("layawayPage", "reserveToday")}</h2>
            <Link href={L("/collections")} className="inline-flex min-h-11 items-center text-sm text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{t("layawayPage", "allPieces")}</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-8">
            {strip.map((p, i) => <ProductCard key={p.id} product={p} lang={lang} index={i} />)}
          </div>
        </section>
      )}

      {faq.length > 0 && (
        <section aria-labelledby="layaway-faq-h" className="wrap pb-14 sm:pb-[88px]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <h2 id="layaway-faq-h" className="text-[clamp(22px,2.4vw,30px)] text-charcoal-deep">{t("layawayPage", "faqH")}</h2>
            <Link href={L(`/faq#${FAQ_SECTION}`)} className="inline-flex min-h-11 items-center text-sm text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{t("layawayPage", "faqAll")}</Link>
          </div>
          {/* The /faq page's accordion rows, unchanged in shape so the two pages
              read as one document. Markdown from lib/markdown.ts, escaped before
              it is parsed; `.faq-answer` in globals.css styles it. */}
          <div className="border-b border-hairline">
            {faq.map((item) => (
              <details key={item.key} className="group border-t border-hairline">
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-5 py-3 text-[16px] font-medium leading-normal text-charcoal-deep [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">{item.question}</span>
                  <span aria-hidden="true" className="grid h-8 w-8 flex-none place-items-center rounded-full border border-gold-dark/60 text-gold-dark">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <div className="faq-answer pb-5 text-charcoal/85 lg:pr-[60px]" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
              </details>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="layaway-more-h" className="wrap pb-14 sm:pb-[88px]">
        <h2 id="layaway-more-h" className="text-[clamp(22px,2.4vw,30px)] text-charcoal-deep">{t("layawayPage", "moreH")}</h2>
        <p className="mt-2 max-w-[60ch] text-[15.5px] leading-relaxed text-charcoal/80">{t("layawayPage", "moreP")}</p>
        <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
          {more.map((m) => (
            <li key={m.href}>
              <Link href={m.href} className="inline-flex min-h-11 items-center text-[15px] text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{m.label}</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
