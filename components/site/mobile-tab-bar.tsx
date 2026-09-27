"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Gem, Home, User, Wallet } from "lucide-react";

export type Tab = { href: string; label: string; icon: "home" | "pieces" | "layaway" | "loyalty" | "account" };
const ICONS = { home: Home, pieces: Gem, layaway: Wallet, loyalty: Award, account: User } as const;

/** Which paths light each tab: Collections owns every catalogue page. */
const OWNS: Record<Tab["icon"], string[]> = {
  home: ["/"],
  pieces: ["/collections", "/categories", "/products", "/search"],
  layaway: ["/layaway"],
  loyalty: ["/loyalty"],
  account: ["/account", "/login"],
};

/**
 * The phone tab bar, on EVERY page below `lg` (site frame, 2026-09-27; it was
 * the home page's alone). Rendered by the root layout. Labels match the nav
 * (Home / Collections / Loyalty / Account in Japanese, and Home /
 * Collections / Layaway / Loyalty / Account in English) at 11px (the audit
 * measured 10px and three names that differed from the nav's).
 *
 * The layaway tab is passed in only when layawayOffered(lang); the bar never
 * decides that. `data-mobile-tab-bar` is how the Messenger button and the
 * footer know to clear it (app/globals.css, .messenger-fab).
 */
export function MobileTabBar({ tabs, label }: { tabs: Tab[]; label: string }) {
  const path = usePathname();
  return (
    <nav aria-label={label} data-mobile-tab-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-chalk/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-around px-1">
        {tabs.map(({ href, label: name, icon }) => {
          const Icon = ICONS[icon];
          const active = OWNS[icon].some((m) => (m === "/" ? path === "/" : path === m || path.startsWith(`${m}/`)));
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex h-14 min-w-[64px] flex-col items-center justify-center gap-1 px-1 text-[11px] leading-none ${active ? "font-semibold text-gold-deep" : "text-charcoal/75 hover:text-charcoal-deep"}`}>
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              <span className="whitespace-nowrap">{name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
