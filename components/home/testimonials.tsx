import { Star } from "lucide-react";

/**
 * PLACEHOLDER — replace before launch.
 *
 * Client Experiences (Stitch §9), kept exactly as the design file has it: three
 * cards with the file's placeholder strings. Deliberately hardcoded here and NOT
 * in lib/i18n.ts so it is obviously temporary; the same Japanese placeholder
 * shows in both languages until approved testimonials exist.
 */
const PLACEHOLDER_QUOTE = "「確認済みのお客様の声をここに掲載」";
const PLACEHOLDER_NAME = "お客様名";
const PLACEHOLDER_ITEM = "ご購入商品またはご利用サービス";
const PLACEHOLDER_PILL = "日本国内検品済み・ご購入者様";

export function Testimonials() {
  return (
    <section className="bg-white py-8 lg:py-16">
      <div className="wrap">
        <div className="max-w-[62ch] space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-dark">ご愛用者様の声</p>
          <h2 className="font-display text-[clamp(28px,3.4vw,44px)] text-charcoal">お客様の声</h2>
          <p className="text-sm text-charcoal/70">Cha Jewelsでお選びいただいたお客様からのご感想をご紹介します。</p>
        </div>
        <div className="mt-6 grid gap-3 lg:mt-10 lg:grid-cols-3 lg:gap-6">
          {[0, 1, 2].map((i) => (
            <article key={i} className="flex flex-col gap-2 rounded-sm border border-hairline bg-chalk p-5 shadow-sm lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] text-charcoal"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal" />{PLACEHOLDER_PILL}</span>
                <span className="flex text-gold-dark" aria-label="5 / 5">{[0, 1, 2, 3, 4].map((s) => <Star key={s} aria-hidden="true" className="h-4 w-4 fill-current" />)}</span>
              </div>
              <p className="pt-1 text-sm italic leading-relaxed text-charcoal lg:text-base">{PLACEHOLDER_QUOTE}</p>
              <div className="flex items-center justify-between gap-2 pt-2 text-xs">
                <span className="font-medium text-charcoal">{PLACEHOLDER_NAME}</span>
                <span className="text-charcoal/70">{PLACEHOLDER_ITEM}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
