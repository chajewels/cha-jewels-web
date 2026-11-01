import Link from "next/link";
import { localePath } from "@/lib/locale";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/page-meta";
import { JsonLd } from "@/components/site/json-ld";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { LayawayPiecePicker } from "@/components/commerce/layaway-piece-picker";
import { ProductCard } from "@/components/catalog/product-card";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";
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
      {/* P4b: an ink head, the plan as three numbered plates. */}
      <PageHead tone="ink" eyebrow={t("home", "layPill")} title={t("layawayPage", "h1")} lead={t("home", "layP")}>
        <ol className="icm-steps">
          {([1, 2, 3] as const).map((n) => (
            <li key={n} className="icm-step lm-rise">
              <span aria-hidden="true" className="icm-step__n">{n}</span>
              <h2 className="icm-step__h">{t("home", `layStep${n}H`)}</h2>
              <p className="icm-step__p">{t("home", `layStep${n}P`)}</p>
            </li>
          ))}
        </ol>
      </PageHead>

      <PageSection tone="sheet" label={t("home", "layCalcH")}>
        <div className="icm-sechead">
          <div>
            <p className="lm-eyebrow">{t("home", "layCalcH")}</p>
            <h2 className="lm-h2">{t("home", "layCalcP")}</h2>
          </div>
        </div>
        <div className="icm-sheet lm-rise">
          {startSlug ? (
            <LayawayPiecePicker lang={lang} pieces={pieces} initialSlug={startSlug} />
          ) : (
            <LayawayCalculator lang={lang} cta={{ label: t("home", "layCta"), href: L("/collections") }} className="max-w-2xl" />
          )}
        </div>
      </PageSection>

      {strip.length > 0 && (
        <PageSection tone="bone">
          <div className="icm-sechead">
            <h2 className="lm-h2">{t("layawayPage", "reserveToday")}</h2>
            <Link href={L("/collections")} className="icm-pill">{t("layawayPage", "allPieces")}</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-8">
            {strip.map((p, i) => <ProductCard key={p.id} product={p} lang={lang} index={i} />)}
          </div>
        </PageSection>
      )}

      {faq.length > 0 && (
        <PageSection tone="white" id="layaway-faq" label={t("layawayPage", "faqH")}>
          <div className="icm-sechead">
            <h2 id="layaway-faq-h" className="lm-h2">{t("layawayPage", "faqH")}</h2>
            <Link href={L(`/faq#${FAQ_SECTION}`)} className="icm-pill">{t("layawayPage", "faqAll")}</Link>
          </div>
          {/* The /faq page's accordion rows as plates; markdown from lib/markdown.ts,
              escaped before it is parsed; `.faq-answer` in globals.css styles it. */}
          <div className="icm-faq">
            {faq.map((item) => (
              <details key={item.key} className="lm-rise">
                <summary>
                  <span className="min-w-0">{item.question}</span>
                  <span aria-hidden="true" className="icm-faq__mark">
                    <span className="icm-faq__plus">+</span>
                    <span className="icm-faq__minus">−</span>
                  </span>
                </summary>
                <div className="faq-answer pb-5 text-charcoal/85 lg:pr-[60px]" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
              </details>
            ))}
          </div>
        </PageSection>
      )}

      <PageSection tone="bone" label={t("layawayPage", "moreH")}>
        <div className="icm-cta lm-rise">
          <div>
            <h2 id="layaway-more-h" className="lm-h2">{t("layawayPage", "moreH")}</h2>
            <p className="max-w-[60ch] text-[15.5px] leading-relaxed">{t("layawayPage", "moreP")}</p>
          </div>
          <ul className="icm-pills">
            {more.map((m) => (
              <li key={m.href}><Link href={m.href} className="icm-pill">{m.label}</Link></li>
            ))}
          </ul>
        </div>
      </PageSection>
    </>
  );
}
