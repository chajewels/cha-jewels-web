"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signOutAction } from "@/lib/session-actions";
import { SearchBox } from "./search-box";
import { LangSwitcher } from "./lang-switcher";
import { SocialGlyph } from "./social-icons";
import { MenuStory } from "./menu-story";
import type { Lang } from "@/lib/i18n";
import type { Story } from "@/lib/stories";
import type { TypeVisual } from "@/lib/type-icons";
import { TypeIconWell } from "@/components/catalog/type-icon";

/** `name` is a ReactNode: the header streams the real one in. See header.tsx. */
export type DrawerAccount = { name: React.ReactNode; menuLabel: string; items: { href: string; label: string }[]; signOut: string };
/** A product type tile (photo or line icon, lib/type-icons.ts, + name). */
export type DrawerTile = { key: string; href: string; label: string; thumb: TypeVisual };
/** A row: an optional leading media element (thumbnail or icon), the label, and an optional count. */
export type DrawerRow = { key: string; href: string; label: string; media?: React.ReactNode; count?: string | null; countLabel?: string };
export type DrawerGroup = {
  key: string;
  label: string;
  tiles?: DrawerTile[];
  tilesHeading?: string;
  rows: DrawerRow[];
  rowsHeading?: string;
  footer?: { href: string; label: string };
};

/**
 * THE PHONE DRAWER (site frame, 2026-09-27), below `xl`.
 *
 * Full screen, over the header: its own top row carries the logo and ONE close
 * control (the audit found two). Then search; Collections (the owner's photo
 * tiles, two across, and the category rows with their in-stock counts) and
 * Company as disclosures; Layaway (English only), Loyalty, Wholesale and
 * Account as plain rows. A dark foot is pinned at the bottom with the
 * Messenger action, the language toggle and "Since 2021 · Tokyo". Headings are
 * 20px (Noto Serif JP on Japanese, Playfair on English), down from ~40px live.
 *
 * IT IS A DIALOG, AND IT BEHAVES LIKE ONE. `role="dialog"` + `aria-modal`,
 * portalled to its own container in <body> (the header's backdrop-filter would
 * otherwise be its containing block); every other child of <body> is `inert`
 * while it is open; focus moves to the close button on open, is kept inside by
 * the Tab handler, and returns to the trigger on close; Escape closes.
 *
 * A CUSTOMER STORY sits at the end of the scrolling part, just above the dark
 * foot (owner decision 2026-09-27: below `xl` the mega-menus, and so their
 * story panel, are never seen). It is the menus' own panel
 * (components/site/menu-story.tsx, `place="drawer"`), with all its rules:
 * exact words, English-only layaway stories, only stories that fit, the next
 * story and fresh typing on every open, a tap completes, closing stops it.
 * `mt-auto` pins it to the foot when the drawer is short; when it is long the
 * story scrolls with everything else, so the foot and the rows above it are
 * never pushed out of reach.
 *
 * Motion: `.drawer-in` (220ms, ease-lux); reduced motion shows it at once.
 */
export function MobileNav({ lang, links, groups = [], menuLabel, openLabel, closeLabel, account, accountLink, messenger, since, story }: {
  lang: Lang;
  links: { href: string; label: string }[];
  groups?: DrawerGroup[];
  menuLabel: string;
  openLabel: string;
  closeLabel: string;
  account?: DrawerAccount | null;
  accountLink: { href: string; label: string };
  messenger: { href: string; label: string } | null;
  since: string;
  story?: { stories: Story[]; eyebrow: string; moreLabel: string } | null;
}) {
  const [open, setOpen] = useState(false);
  // Both groups start closed, so the drawer opens at its shortest; opening one
  // does not close the other (a reader comparing types keeps Collections open).
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    setHost(el);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // `inert` rather than aria-hidden: it takes the page behind out of the
    // accessibility tree AND the tab order AND stops it answering clicks.
    const outside = Array.from(document.body.children).filter((c) => c !== el);
    const hadInert = outside.map((c) => c.hasAttribute("inert"));
    outside.forEach((c) => c.setAttribute("inert", ""));
    return () => {
      outside.forEach((c, i) => { if (!hadInert[i]) c.removeAttribute("inert"); });
      document.body.style.overflow = previous;
      el.remove();
      setHost(null);
    };
  }, [open]);

  // Focus in on open, back to the trigger on close (captured now: by cleanup
  // time React may have replaced the node).
  useEffect(() => {
    if (!host) return;
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
      // Queried per keystroke: a disclosure just opened adds a dozen links.
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

  const heading = `${lang === "ja" ? "font-jp font-medium" : "font-display"} text-[20px] leading-tight text-charcoal-deep`;
  const label = `text-[11px] font-semibold text-gold-dark ${lang === "en" ? "uppercase tracking-[0.14em]" : "tracking-[0.05em]"}`;

  return (
    <>
      <button ref={triggerRef} type="button" aria-label={open ? closeLabel : openLabel} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-sm text-charcoal-deep hover:text-gold-dark xl:hidden">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 7h16M4 12h16M9 17h11" /></svg>
      </button>
      {host && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={menuLabel}
          className="drawer-in fixed inset-0 z-50 flex flex-col bg-chalk text-charcoal-deep xl:hidden"
        >
          <div className="wrap flex h-16 w-full shrink-0 items-center justify-between border-b border-hairline">
            <Link href="/" onClick={close} className="flex items-center gap-2 sm:gap-3" aria-label="Cha Jewels">
              <img src="/images/brand/logo-badge-96.webp" srcSet="/images/brand/logo-badge-96.webp 1x, /images/brand/logo-badge-192.webp 2x" width={40} height={40} alt="" className="h-10 w-10" />
              <span className="gilt font-display text-[22px] font-medium tracking-wide sm:text-[26px]">Cha Jewels</span>
            </Link>
            <button ref={closeRef} type="button" aria-label={closeLabel} onClick={close} className="grid h-11 w-11 place-items-center rounded-full border border-charcoal/60 text-charcoal-deep hover:border-gold-dark hover:text-gold-dark">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className="wrap flex min-h-0 w-full flex-1 flex-col overflow-y-auto pb-8 pt-4">
            <SearchBox lang={lang} variant="drawer" onNavigate={close} />

            <div className="mt-4">
              {groups.map((g) => {
                const isOpen = !!expanded[g.key];
                return (
                  <div key={g.key} className="border-b border-hairline">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`drawer-${g.key}`}
                      onClick={() => setExpanded((e) => ({ ...e, [g.key]: !e[g.key] }))}
                      className={`flex min-h-[60px] w-full items-center justify-between text-left hover:text-gold-dark ${heading}`}
                    >
                      {g.label}
                      <svg aria-hidden="true" viewBox="0 0 12 12" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2.5 4.5 6 8l3.5-3.5" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div id={`drawer-${g.key}`} className="pb-5">
                        {g.tiles && g.tiles.length > 0 && (
                          <>
                            {g.tilesHeading && <p className={`${label} pb-3`}>{g.tilesHeading}</p>}
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
                              {g.tiles.map((it) => (
                                <li key={it.key} className="min-w-0">
                                  <Link href={it.href} onClick={close} className="flex min-h-11 items-center gap-3 text-[15px] text-charcoal-deep hover:text-gold-dark">
                                    <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-sm bg-hairline">
                                      {it.thumb.kind === "photo"
                                        ? <img src={it.thumb.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                                        : <TypeIconWell icon={it.thumb.icon} iconClassName="h-5 w-5" on="chalk" />}
                                    </span>
                                    <span className="min-w-0 [line-break:strict] [word-break:auto-phrase]">{it.label}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {g.rowsHeading && <p className={`${label} pb-2 ${g.tiles?.length ? "pt-6" : ""}`}>{g.rowsHeading}</p>}
                        <ul className="border-t border-hairline">
                          {g.rows.map((it) => (
                            <li key={it.key}>
                              <Link href={it.href} onClick={close} className="flex min-h-[52px] items-center gap-3 border-b border-hairline py-1.5 text-[15px] text-charcoal-deep hover:text-gold-dark">
                                {it.media}
                                <span className="min-w-0 flex-1 [line-break:strict] [word-break:auto-phrase]">{it.label}</span>
                                {it.count && <span className="shrink-0 text-xs text-charcoal/75 [font-variant-numeric:lining-nums_tabular-nums]"><span aria-hidden="true">{it.count}</span>{it.countLabel && <span className="sr-only">{it.countLabel}</span>}</span>}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {g.footer && (
                          <Link href={g.footer.href} onClick={close} className="mt-4 inline-flex min-h-11 items-center gap-2 border-b border-gold-dark text-sm font-medium text-gold-dark">
                            {g.footer.label}<ArrowRight aria-hidden="true" className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {[...links, ...(account ? [] : [accountLink])].map((l) => (
                <Link key={l.href} href={l.href} onClick={close} className={`flex min-h-[60px] items-center justify-between border-b border-hairline hover:text-gold-dark ${heading}`}>
                  {l.label}<ArrowRight aria-hidden="true" className="h-5 w-5 text-charcoal/60" strokeWidth={1.5} />
                </Link>
              ))}
            </div>

            {account && (
              <section aria-label={account.menuLabel} className="mt-8">
                <p className={`${heading} text-gold-dark`}>{account.name}</p>
                <ul className="mt-2 border-t border-hairline">
                  {account.items.map((it) => (
                    <li key={it.href}><Link href={it.href} onClick={close} className="flex min-h-12 items-center border-b border-hairline text-[15px] text-charcoal-deep hover:text-gold-dark">{it.label}</Link></li>
                  ))}
                </ul>
                <form action={signOutAction} className="mt-4">
                  <button type="submit" className="min-h-11 text-[15px] text-gold-dark underline underline-offset-4">{account.signOut}</button>
                </form>
              </section>
            )}

            {story && story.stories.length > 0 && (
              <div className="mt-auto shrink-0 pt-8">
                <MenuStory stories={story.stories} lang={lang} eyebrow={story.eyebrow} moreLabel={story.moreLabel} place="drawer" onNavigate={close} />
              </div>
            )}
          </div>

          <div data-surface="dark" className="shrink-0 bg-charcoal-deep pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 text-chalk">
            <div className="wrap w-full">
              {messenger && (
                <a href={messenger.href} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2.5 rounded-sm border border-chalk/70 px-4 text-[15px] font-medium text-chalk hover:border-gold-pale hover:text-gold-pale">
                  <span aria-hidden="true" className="text-gold-pale"><SocialGlyph name="messenger" size={20} /></span>{messenger.label}
                </a>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <LangSwitcher lang={lang} tone="dark" />
                <span className="text-xs text-chalk/75">{since}</span>
              </div>
            </div>
          </div>
        </div>,
        host,
      )}
    </>
  );
}
