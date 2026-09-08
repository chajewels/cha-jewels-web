import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
export function Footer({ lang }: { lang: Lang }) {
  const t = tr(lang);
  return (
    <footer className="bg-velvet-deep py-14 text-sm">
      <div className="wrap grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div><p className="gilt font-display text-xl">Cha Jewels</p><p className="mt-3 max-w-[38ch] text-champagne/75">{t("footer", "blurb")}</p></div>
        <div><h4 className="mb-3 font-display text-lg text-gold-pale">{t("footer", "shop")}</h4><ul className="space-y-2 text-champagne/75"><li><Link href="/collections/necklaces">Necklaces</Link></li><li><Link href="/collections/earrings">Earrings</Link></li><li><Link href="/collections/bracelets">Bracelets</Link></li><li><Link href="/collections/rings">Rings</Link></li><li><Link href="/collections">All</Link></li></ul></div>
        <div><h4 className="mb-3 font-display text-lg text-gold-pale">{t("footer", "help")}</h4><ul className="space-y-2 text-champagne/75"><li><Link href="/layaway">{t("footer", "terms")}</Link></li><li><Link href="/loyalty">{t("nav", "loyalty")}</Link></li><li><Link href="/about">{t("nav", "about")}</Link></li><li><Link href="/blog">{t("nav", "blog")}</Link></li></ul></div>
        <div><h4 className="mb-3 font-display text-lg text-gold-pale">{t("footer", "legal")}</h4><ul className="space-y-2 text-champagne/75"><li><Link href="/legal/tokusho" lang="ja">特定商取引法に基づく表記</Link></li><li><Link href="/legal/privacy">{t("footer", "privacy")}</Link></li><li><Link href="/legal/terms">{t("footer", "sale")}</Link></li></ul></div>
      </div>
      <div className="wrap mt-10 flex flex-wrap justify-between gap-4 border-t border-rule pt-5 text-xs text-champagne/55"><span>© {new Date().getFullYear()} 株式会社チャジュエルズ Cha Jewels Co., Ltd. · 東京都葛飾区立石</span><span lang="ja">適格請求書発行事業者登録番号 T7011801044120</span></div>
    </footer>
  );
}
