import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { LangSwitcher } from "./lang-switcher";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";
export function Header({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const links = [["/", t("nav", "home")], ["/about", t("nav", "about")], ["/collections", t("nav", "collections")], ["/layaway", t("nav", "layaway")], ["/loyalty", t("nav", "loyalty")], ["/wholesale", t("nav", "wholesale")], ["/blog", t("nav", "blog")]] as const;
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-velvet/90 backdrop-blur">
      <div className="wrap flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="gilt font-display text-[26px] font-medium tracking-wide" aria-label="Cha Jewels">Cha Jewels</Link>
        <nav aria-label="Primary" className="hidden lg:block"><ul className="flex gap-6 text-sm text-champagne/75">{links.map(([h, l]) => <li key={h}><Link href={h} className="hover:text-gold-pale">{l}</Link></li>)}</ul></nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LangSwitcher lang={lang} />
          <Button asChild variant="ghost" className="hidden min-h-10 px-4 text-sm lg:inline-flex"><Link href="/live">{t("nav", "claim")}</Link></Button>
          <MobileNav links={links.map(([h, l]) => ({ href: h, label: l }))} claim={t("nav", "claim")} />
        </div>
      </div>
    </header>
  );
}
