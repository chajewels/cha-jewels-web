"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Gem, Home, User, Wallet } from "lucide-react";

export type Tab = { href: string; label: string; icon: "home" | "pieces" | "layaway" | "loyalty" | "account" };
const ICONS = { home: Home, pieces: Gem, layaway: Wallet, loyalty: Award, account: User } as const;

/**
 * The mobile file's fixed bottom tab bar (Stitch §13). Hidden from lg up; the
 * page adds matching bottom padding so nothing sits behind it. The layaway tab
 * is passed in only when layawayOffered(lang) — the bar never decides that.
 */
export function MobileTabBar({ tabs }: { tabs: Tab[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-chalk/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-around px-1">
        {tabs.map(({ href, label, icon }) => {
          const Icon = ICONS[icon];
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex h-12 min-w-[56px] flex-col items-center justify-center gap-0.5 text-[10px] tracking-wide ${active ? "text-gold-deep" : "text-charcoal/70 hover:text-charcoal"}`}>
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
