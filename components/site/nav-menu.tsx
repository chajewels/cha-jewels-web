"use client";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { TypeVisual } from "@/lib/type-icons";
import { TypeIconWell } from "@/components/catalog/type-icon";

/** Fired when a menu opens, so any other open one closes at once (two panels never overlap). */
const OPEN_EVENT = "cj:navmenu-open";
/** How long a pointer may be outside trigger and panel before the menu closes: a diagonal path from trigger to panel crosses the header. */
const CLOSE_DELAY_MS = 160;

/**
 * A header mega-menu: trigger + full-width panel (site frame, 2026-09-27).
 *
 * Same menu semantics as components/site/account-menu.tsx (role="menu" /
 * "menuitem", arrow keys, Home/End, Escape returning focus to the trigger,
 * outside pointerdown and Tab closing). That file is the house pattern.
 *
 * OPENS THREE WAYS, and the way it opened decides whether focus moves:
 *
 *   hover     — pointer devices only, `(hover: hover) and (pointer: fine)`.
 *               Focus is NOT moved. Leaving trigger and panel closes it after
 *               CLOSE_DELAY_MS, so a diagonal path from the trigger down to
 *               the panel does not snap it shut on the way.
 *   click/tap — toggles. The trigger is a real <button>, so a tap works, and
 *               touch reports no hover, so a tap never "sticks open".
 *   ArrowDown / ArrowUp / Enter / Space on the trigger — opens (click for the
 *               last two) and ArrowDown focuses the first item.
 *
 * FULL WIDTH. The panel is positioned against the <header> (sticky, so it is
 * the containing block), not against this trigger: nothing between them is
 * positioned. The trigger's wrapper runs the header's full height, so moving
 * straight down from the trigger stays inside it until the panel begins.
 *
 * The panel is not rendered when closed, so its links are out of the tab order
 * without tabindex bookkeeping. Motion: `.menu-in` (180ms fade-drop on
 * ease-lux); reduced motion shows it at once (app/globals.css).
 */
export function NavMenu({ label, menuLabel, children }: { label: string; menuLabel: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  /** Did a pointer hover open this, rather than a click or a key? */
  const openedByHover = useRef(false);
  const closeTimer = useRef<number | null>(null);
  const id = useId();
  const pathname = usePathname();

  const cancelClose = () => { if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  }, []);
  const show = useCallback(() => {
    setOpen(true);
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
  }, [id]);

  // Navigating away closes it: Next keeps the header mounted across routes.
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onOther = (e: Event) => { if ((e as CustomEvent<string>).detail !== id) { cancelClose(); setOpen(false); } };
    window.addEventListener(OPEN_EVENT, onOther);
    return () => { window.removeEventListener(OPEN_EVENT, onOther); cancelClose(); };
  }, [id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(true); } };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && !panel.current?.contains(target) && !trigger.current?.contains(target)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open, close]);

  // The panel may be as tall as the space left below the header, measured
  // rather than assumed: the announcement bar above the header moves where the
  // panel starts, and a fixed calc cut the bottom of a long menu off-screen.
  useLayoutEffect(() => {
    if (!open) return;
    // The wrapper's top, not the panel's: .menu-in slides the panel while it opens.
    const fit = () => { const el = panel.current; const top = el?.parentElement?.getBoundingClientRect().top; if (el && top !== undefined) el.style.maxHeight = `${Math.max(240, window.innerHeight - top)}px`; };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open]);

  const focusFirst = () => {
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
  };

  const canHover = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function onMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (nodes.length === 0) return;
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); nodes[(i + 1) % nodes.length].focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); nodes[(i - 1 + nodes.length) % nodes.length].focus(); }
    else if (e.key === "Home") { e.preventDefault(); nodes[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); nodes[nodes.length - 1].focus(); }
    else if (e.key === "Tab") close(false);
  }

  return (
    <div
      className="flex h-full items-center"
      onPointerEnter={() => { if (canHover()) { cancelClose(); if (!open) { openedByHover.current = true; show(); } } }}
      onPointerLeave={() => {
        if (!canHover() || !openedByHover.current) return;
        cancelClose();
        closeTimer.current = window.setTimeout(() => { openedByHover.current = false; setOpen(false); }, CLOSE_DELAY_MS);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          // A click must not undo the hover that just opened this: the first
          // click on a hover-opened menu CLAIMS it, a second one closes it.
          if (open && openedByHover.current) { openedByHover.current = false; return; }
          openedByHover.current = false;
          if (open) setOpen(false); else show();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openedByHover.current = false; show(); focusFirst(); }
        }}
        className={`inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-sm font-medium ${open ? "text-gold-dark" : "text-charcoal-deep hover:text-gold-dark"}`}
      >
        {label}
        <svg aria-hidden="true" viewBox="0 0 12 12" className={`h-3 w-3 shrink-0 text-charcoal/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute inset-x-0 top-full z-50 whitespace-normal border-b border-hairline bg-chalk shadow-[0_24px_48px_rgba(35,29,18,0.14)]"
          onPointerEnter={cancelClose}
        >
          <div
            ref={panel}
            id={id}
            role="menu"
            aria-label={menuLabel}
            onKeyDown={onMenuKeyDown}
            // `whitespace-normal` above is not decoration: the nav <ul>
            // carries `whitespace-nowrap` for the link row and every
            // descendant inherits it, so descriptions painted as one line.
            className="menu-in wrap max-h-[calc(100vh-96px)] overflow-y-auto py-8"
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One ledger row in a menu panel: an icon box or a thumbnail, a title, an
 * optional one-line description and an optional count on the right. `media`
 * is a ready thumbnail element (components/site/category-thumb.tsx).
 *
 * The icon and thumbnail are decorative — the title already names the link —
 * so images are alt="".
 */
export function NavMenuItem({ href, title, description, icon, media, count, countLabel }: { href: string; title: string; description?: string | null; icon?: ReactNode; media?: ReactNode; count?: string | null; countLabel?: string }) {
  return (
    <Link
      role="menuitem"
      tabIndex={-1}
      href={href}
      className="group flex min-h-[64px] min-w-0 items-center gap-4 border-b border-hairline py-3 pr-2 hover:bg-white focus-visible:bg-white focus-visible:outline-offset-[-2px]"
    >
      {media ?? (icon && <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-gold-dark text-gold-dark">{icon}</span>)}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-charcoal-deep [line-break:strict] [word-break:auto-phrase] group-hover:text-gold-dark">{title}</span>
        {description && <span className="mt-0.5 block text-[13px] leading-snug text-charcoal/75">{description}</span>}
      </span>
      {count && <span className="shrink-0 text-xs text-charcoal/75 [font-variant-numeric:lining-nums_tabular-nums]"><span aria-hidden="true">{count}</span>{countLabel && <span className="sr-only">{countLabel}</span>}</span>}
    </Link>
  );
}

/**
 * A collection tile: the owner's 4:3 photo, its name, and the in-stock count
 * when there is stock (D1-6). The photo is decorative (alt="").
 */
export function NavMenuTile({ href, title, thumb, count, countLabel }: { href: string; title: string; thumb: TypeVisual; count?: string | null; countLabel?: string }) {
  return (
    <Link role="menuitem" tabIndex={-1} href={href} className="group block min-w-0 focus-visible:outline-offset-2">
      <span className="block aspect-[4/3] overflow-hidden rounded-sm bg-hairline">
        {thumb.kind === "photo"
          ? <img src={thumb.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]" />
          : <TypeIconWell icon={thumb.icon} iconClassName="h-7 w-7" on="chalk" />}
      </span>
      <span className="mt-2 flex items-baseline justify-between gap-2">
        <span className="min-w-0 text-sm font-medium text-charcoal-deep [line-break:strict] [overflow-wrap:anywhere] [word-break:auto-phrase] group-hover:text-gold-dark">{title}</span>
        {count && <span className="shrink-0 text-xs text-charcoal/75 [font-variant-numeric:lining-nums_tabular-nums]"><span aria-hidden="true">{count}</span>{countLabel && <span className="sr-only">{countLabel}</span>}</span>}
      </span>
    </Link>
  );
}
