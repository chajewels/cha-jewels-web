import Link from "next/link";
import { HubImage } from "@/components/media/hub-image";
import { SocialGlyph } from "@/components/site/social-icons";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { tr, type Lang } from "@/lib/i18n";
import { productName } from "@/lib/catalog-i18n";
import { fromPrice, type Product } from "@/lib/queries/products";
import { cardImage } from "@/lib/product-media";

/**
 * A SOLD PIECE IS NOT A DEAD END (comp page-comps/product-collection, "Sold
 * page"). In place of the buy buttons: the dark stage card — "This piece has
 * sold." — the three closest pieces that ARE available (same category or
 * brand, then the same condition; lib/catalog-context.ts), and one orange
 * action, to ask a person on Messenger. That is the view's only orange.
 *
 * `messenger` is the Hub's own Messenger link (`social.follow`); without one
 * the action goes to /contact instead, so it always reaches a person.
 */
export function SoldCard({ alternatives, messenger, lang }: { alternatives: Product[]; messenger: string | null; lang: Lang }) {
  const t = tr(lang);
  return (
    <div className="band-dark relative grid gap-3.5 bg-[radial-gradient(ellipse_80%_42%_at_50%_30%,rgb(120_92_40/.30)_0%,rgb(0_0_0/0)_72%),radial-gradient(ellipse_120%_90%_at_50%_30%,#231e18_0%,#17140f_60%,#0f0d0a_100%)] p-6 text-chalk outline outline-1 -outline-offset-1 outline-gold/30">
      <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-pale before:h-px before:w-7 before:bg-gold [:lang(ja)_&]:text-xs [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{t("product", "sold")}</p>
      <h2 className="text-[clamp(20px,2.2vw,26px)] leading-tight text-gold-pale">{t("pdp", "soldTitle")}</h2>
      <p className="text-sm text-chalk/80">{t("pdp", "soldBody")}</p>
      {alternatives.length > 0 && (
        <ul className="border-t border-gold/30">
          {alternatives.map((x) => {
            const img = cardImage(x);
            const price = fromPrice(x);
            return (
              <li key={x.slug}>
                <Link href={`/products/${x.slug}`} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 border-b border-gold/30 py-2.5 text-[13px] leading-snug hover:text-gold-pale">
                  <span className="relative grid h-14 w-14 place-items-center bg-chalk">
                    {img && <span className={img.kind === "cut" ? "absolute inset-[7%]" : "absolute inset-0"}><HubImage src={img.src} alt="" fill sizes="56px" className="object-contain" /></span>}
                  </span>
                  <span className="line-clamp-3">{productName(x, lang)}</span>
                  {price != null && <span className="whitespace-nowrap font-display text-[17px] text-gold-pale [font-variant-numeric:lining-nums_tabular-nums]">{formatMoney(price)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Button asChild className="w-full px-4 text-center text-sm sm:text-[15px]">
        <a href={messenger ?? "/contact"} {...(messenger ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          <SocialGlyph name="messenger" size={18} />
          {t("pdp", "soldAsk")}
        </a>
      </Button>
    </div>
  );
}
