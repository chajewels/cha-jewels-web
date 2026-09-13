"use client";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { signOutAction } from "@/lib/session-actions";

export type AccountMenuItem = { href: string; label: string };

/**
 * Signed-in account menu for the desktop header. A real menu button: the
 * trigger carries aria-expanded / aria-haspopup / aria-controls, the panel is
 * role="menu" with focus moved to its first item on open, arrow keys move
 * between items, Escape closes and hands focus back to the trigger, and a
 * click outside or Tab closes without stealing focus. Sign out is the last
 * item, separated, and posts to the server action so the cookies clear in the
 * same response that redirects home.
 */
export function AccountMenu({ name, items, signOut, menuLabel }: { name: string; items: AccountMenuItem[]; signOut: string; menuLabel: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(true); } };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && !panel.current?.contains(target) && !trigger.current?.contains(target)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open, close]);

  function onMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (nodes.length === 0) return;
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); nodes[(i + 1) % nodes.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); nodes[(i - 1 + nodes.length) % nodes.length].focus(); }
    else if (e.key === "Home") { e.preventDefault(); nodes[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); nodes[nodes.length - 1].focus(); }
    else if (e.key === "Tab") close(false);
  }

  const itemClass = "block w-full px-4 py-2.5 text-left text-sm text-champagne/85 hover:bg-velvet hover:text-gold-pale focus-visible:bg-velvet focus-visible:text-gold-pale";

  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) { e.preventDefault(); setOpen(true); } }}
        className={`inline-flex min-h-9 max-w-[16ch] items-center gap-1.5 whitespace-nowrap rounded-sm border px-3 text-xs ${open ? "border-gold-pale bg-velvet-deep text-gold-pale" : "border-rule text-gold-pale hover:border-gold-pale"}`}
      >
        <span className="truncate">{name}</span>
        <svg aria-hidden="true" viewBox="0 0 12 12" className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>
      {open && (
        <div
          ref={panel}
          id={id}
          role="menu"
          aria-label={menuLabel}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-[230px] rounded-sm border border-rule bg-velvet-deep py-1.5 shadow-[0_14px_36px_rgba(0,0,0,0.5)]"
        >
          {items.map((it) => (
            <Link key={it.href} role="menuitem" tabIndex={-1} href={it.href} onClick={() => close(false)} className={itemClass}>{it.label}</Link>
          ))}
          <form action={signOutAction} className="mt-1.5 border-t border-rule pt-1.5">
            <button type="submit" role="menuitem" tabIndex={-1} className={itemClass}>{signOut}</button>
          </form>
        </div>
      )}
    </div>
  );
}
