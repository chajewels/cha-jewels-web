"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { signOutAction } from "@/lib/session-actions";
import { SearchBox } from "./search-box";
import { LangSwitcher } from "./lang-switcher";
import type { Lang } from "@/lib/i18n";

/** `name` is a ReactNode: the header streams the real one in. See header.tsx. */
export type DrawerAccount = { name: React.ReactNode; menuLabel: string; items: { href: string; label: string }[]; signOut: string };
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
 *
 * IT IS A DIALOG, AND IT BEHAVES LIKE ONE.
 *
 * It used to be a <div> that appeared: nothing told a screen reader a modal had
 * opened, focus stayed on the page behind it, Tab walked straight out of the
 * drawer into links the reader could not see, and closing left focus wherever
 * it had drifted to. Now: `role="dialog"` + `aria-modal`, named by nav.menu;
 * focus moves to the close button on open and is contained by the Tab handler
 * below; every other child of <body> is `inert` while it is open; Escape
 * closes; and focus goes back to the trigger that opened it.
 *
 * `aria-modal` is a PROMISE that nothing outside the dialog is reachable, so
 * the header goes inert with everything else — including the hamburger, which
 * is why the drawer carries its own close button now. It sits in the drawer's
 * first row, directly under the hamburger it replaces, so the tap lands in the
 * same place. Escape does the same job. Nothing else in the header is lost:
 * the drawer has its own search box and its own Home link.
 */
export function MobileNav({ lang, links, groups = [], menuLabel, openLabel, closeLabel, account }: { lang: Lang; links: { href: string; label: string }[]; groups?: DrawerGroup[]; menuLabel: string; openLabel: string; closeLabel: string; account?: DrawerAccount | null }) {
  const [open, setOpen] = useState(false);
  // One group open at a time is NOT enforced: Collections is long, and a
  // customer who opened it to compare types should not lose it by glancing at
  // Company. Both start closed, so the drawer opens at its shortest.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /**
   * The portal gets a container of its own rather than <body> directly, so the
   * effect below can tell the dialog apart from everything it has to make
   * inert. Portalling straight into <body> left nothing to exclude.
   */
  const [host, setHost] = useState<HTMLElement | null>(null);
  /**
   * WHERE THE HEADER ACTUALLY ENDS.
   *
   * This was a hard-coded `top-[68px]` — the height of the header row on its
   * own. The announcement strip sits ABOVE the sticky header and is part of
   * the flow, so with the strip up the header runs to 124.8px at 375 and the
   * drawer's first 57px were underneath it. That row is the search box, the
   * language toggle and now the close button, so the way out of the dialog was
   * hidden behind the bar the reader had just tapped. Measured at open instead:
   * the strip can be dismissed, and it scrolls away, so the number is not a
   * constant and never was.
   */
  const [top, setTop] = useState(68);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    setHost(el);

    const measure = () => setTop(document.querySelector("header")?.getBoundingClientRect().bottom ?? 68);
    measure();
    window.addEventListener("resize", measure);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // `inert` rather than aria-hidden: it takes the page behind out of the
    // accessibility tree AND out of the tab order AND stops it answering
    // clicks, which is the whole of what aria-modal claims.
    const outside = Array.from(document.body.children).filter((c) => c !== el);
    const hadInert = outside.map((c) => c.hasAttribute("inert"));
    outside.forEach((c) => c.setAttribute("inert", ""));

    return () => {
      window.removeEventListener("resize", measure);
      outside.forEach((c, i) => { if (!hadInert[i]) c.removeAttribute("inert"); });
      document.body.style.overflow = previous;
      el.remove();
      setHost(null);
    };
  }, [open]);

  // Focus in on open, back to the trigger on close. Not in the effect above:
  // that one runs before the panel has been portalled into `host`.
  useEffect(() => {
    if (!host) return;
    // Captured now, not read in the cleanup: by the time this unwinds React
    // may have replaced the node, and the focus has to go back to the button
    // that was actually pressed.
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    return () => { trigger?.focus(); };
  }, [host]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      // Queried per keystroke, never cached: a disclosure the reader just
      // opened adds a dozen links, and a stale list would trap them above it.
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button ref={triggerRef} type="button" aria-label={open ? closeLabel : openLabel} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-sm border border-charcoal/30 text-charcoal xl:hidden">
        <span className="block h-px w-[18px] bg-current" /><span className={`my-1 block h-px w-[18px] bg-current ${open ? "opacity-0" : ""}`} /><span className="block h-px w-[18px] bg-current" />
      </button>
      {host && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={menuLabel}
          style={{ top }}
          className="drawer-in fixed inset-x-0 bottom-0 z-30 flex flex-col gap-1 overflow-y-auto bg-chalk px-[clamp(18px,4vw,48px)] py-8 text-charcoal xl:hidden"
        >
          {/* Below `sm` the header row has no room for the language toggle, so it
              lives here beside the search box; from `sm` the header shows it. */}
          <div className="mb-4 flex items-center gap-3">
            <SearchBox lang={lang} variant="drawer" />
            <div className="shrink-0 sm:hidden"><LangSwitcher lang={lang} /></div>
            {/* The drawer's own close control, because the hamburger behind it
                is inert while this is open. Top-right, where the hamburger was,
                and it is what receives focus when the drawer opens — so the
                first thing a keyboard or screen-reader user lands on is the
                way back out. Tab from here walks the links; Shift+Tab reaches
                the search box and the language toggle beside it. */}
            <button ref={closeRef} type="button" aria-label={closeLabel} onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-charcoal/30 text-charcoal hover:border-gold-dark hover:text-gold-dark">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          {links.filter((l) => l.href === "/").map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className="border-b border-hairline py-3 font-display text-3xl text-charcoal hover:text-gold-dark">{l.label}</Link>
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
                            <Link href={it.href} onClick={close} className="block py-2 pl-1 text-lg text-charcoal/85 hover:text-gold-dark">{it.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {links.filter((l) => l.href !== "/").map((l) => <Link key={l.href} href={l.href} onClick={close} className="border-b border-hairline py-3 font-display text-3xl text-charcoal hover:text-gold-dark">{l.label}</Link>)}
          {account && (
            <section aria-label={account.menuLabel} className="mt-8 border-t border-hairline pt-6">
              <p className="font-display text-2xl text-gold-dark">{account.name}</p>
              <ul className="mt-3">
                {account.items.map((it) => (
                  <li key={it.href}><Link href={it.href} onClick={close} className="block border-b border-hairline py-3 text-lg text-charcoal/85 hover:text-gold-dark">{it.label}</Link></li>
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
