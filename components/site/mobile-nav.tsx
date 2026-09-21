"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { signOutAction } from "@/lib/session-actions";
import { SearchBox } from "./search-box";
import { LangSwitcher } from "./lang-switcher";
import type { Lang } from "@/lib/i18n";

export type DrawerAccount = { name: string; menuLabel: string; items: { href: string; label: string }[]; signOut: string };
export type DrawerItem = { key: string; href: string; label: string };
export type DrawerGroup = { key: string; label: string; sections: { heading?: string; items: DrawerItem[] }[] };

/**
 * The drawer below `xl`. When the customer is signed in, `account` adds a
 * section after the page links: their name as its heading, the account pages,
 * and Sign out on its own at the bottom — the same list the desktop menu shows.
 *
 * The panel is portalled to <body>. The header's `backdrop-blur` makes the
 * header the containing block for fixed descendants, so a panel rendered
 * inside it had its top/bottom measured against the header bar and collapsed to
 * nothing — the links spilled out unstyled over the page. Outside the header
 * the panel fills the viewport below the bar as intended.
 */
export function MobileNav({ lang, links, groups = [], openLabel, closeLabel, account }: { lang: Lang; links: { href: string; label: string }[]; groups?: DrawerGroup[]; openLabel: string; closeLabel: string; account?: DrawerAccount | null }) {
  const [open, setOpen] = useState(false);
  // One group open at a time is NOT enforced: Collections is long, and a
  // customer who opened it to compare types should not lose it by glancing at
  // Company. Both start closed, so the drawer opens at its shortest.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  return (
    <>
      <button type="button" aria-label={open ? closeLabel : openLabel} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-sm border border-charcoal/30 text-charcoal xl:hidden">
        <span className="block h-px w-[18px] bg-current" /><span className={`my-1 block h-px w-[18px] bg-current ${open ? "opacity-0" : ""}`} /><span className="block h-px w-[18px] bg-current" />
      </button>
      {open && createPortal(
        <div className="fixed inset-x-0 bottom-0 top-[68px] z-30 flex flex-col gap-1 overflow-y-auto bg-chalk px-[clamp(18px,4vw,48px)] py-8 text-charcoal xl:hidden">
          {/* Below `sm` the header row has no room for the language toggle, so it
              lives here beside the search box; from `sm` the header shows it. */}
          <div className="mb-4 flex items-center gap-3">
            <SearchBox lang={lang} variant="drawer" />
            <div className="shrink-0 sm:hidden"><LangSwitcher lang={lang} /></div>
          </div>
          {links.filter((l) => l.href === "/").map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-hairline py-3 font-display text-3xl text-charcoal hover:text-gold-dark">{l.label}</Link>
          ))}
          {/* Company and Collections as disclosures. No descriptions here: the
              drawer is a list of destinations, and a second line under each of
              a dozen rows turns it into a page to read. */}
          {groups.map((g) => (
            <div key={g.key} className="border-b border-hairline">
              <button
                type="button"
                aria-expanded={!!expanded[g.key]}
                aria-controls={`drawer-${g.key}`}
                onClick={() => setExpanded((e) => ({ ...e, [g.key]: !e[g.key] }))}
                className="flex w-full items-center justify-between py-3 text-left font-display text-3xl text-charcoal hover:text-gold-dark"
              >
                {g.label}
                <svg aria-hidden="true" viewBox="0 0 12 12" className={`h-4 w-4 shrink-0 transition-transform ${expanded[g.key] ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2.5 4.5 6 8l3.5-3.5" />
                </svg>
              </button>
              {expanded[g.key] && (
                <div id={`drawer-${g.key}`} className="pb-3">
                  {g.sections.map((sec, i) => (
                    <div key={sec.heading ?? `s${i}`} className={i > 0 ? "mt-3" : ""}>
                      {sec.heading && <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal/70">{sec.heading}</p>}
                      <ul>
                        {sec.items.map((it) => (
                          <li key={it.key}>
                            <Link href={it.href} onClick={() => setOpen(false)} className="block py-2 pl-1 text-lg text-charcoal/85 hover:text-gold-dark">{it.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {links.filter((l) => l.href !== "/").map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-hairline py-3 font-display text-3xl text-charcoal hover:text-gold-dark">{l.label}</Link>)}
          {account && (
            <section aria-label={account.menuLabel} className="mt-8 border-t border-hairline pt-6">
              <p className="font-display text-2xl text-gold-dark">{account.name}</p>
              <ul className="mt-3">
                {account.items.map((it) => (
                  <li key={it.href}><Link href={it.href} onClick={() => setOpen(false)} className="block border-b border-hairline py-3 text-lg text-charcoal/85 hover:text-gold-dark">{it.label}</Link></li>
                ))}
              </ul>
              <form action={signOutAction} className="mt-5">
                <button type="submit" className="min-h-11 text-lg text-gold-dark underline underline-offset-4">{account.signOut}</button>
              </form>
            </section>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
