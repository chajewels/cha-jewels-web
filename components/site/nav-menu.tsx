"use client";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

/**
 * A header nav menu: trigger + panel, with the same menu semantics as
 * components/site/account-menu.tsx (role="menu"/"menuitem", arrow keys,
 * Home/End, Escape returning focus to the trigger, outside pointerdown and Tab
 * closing). That file is the house pattern; this one adds what a nav menu
 * needs and the account menu does not.
 *
 * OPENS THREE WAYS, and the way it opened decides whether focus moves:
 *
 *   hover     — pointer devices only, via `(hover: hover) and (pointer: fine)`.
 *               Focus is NOT moved: the pointer is already where the customer
 *               is looking, and yanking focus mid-hover makes the next Tab
 *               land somewhere they never chose. Touch reports no hover, so a
 *               tap is a click, not a hover that sticks open.
 *   click     — toggles. The trigger is a real <button>, so a tap works.
 *   ArrowDown / ArrowUp on the trigger — opens AND focuses the first item,
 *               because a keyboard user has no other way in.
 *
 * The panel is not rendered when closed, so its links are out of the tab order
 * without needing tabindex bookkeeping.
 *
 * The hover region is contiguous: the panel's positioning wrapper carries the
 * gap as padding rather than a margin, so the pointer never crosses dead space
 * on its way down and the menu does not flicker shut between the two.
 */
export function NavMenu({ label, menuLabel, children }: { label: string; menuLabel: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const pathname = usePathname();

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  }, []);

  // Navigating away closes it. Next keeps the header mounted across routes, so
  // without this the panel would still be open on the page it sent you to.
  useEffect(() => { setOpen(false); }, [pathname]);

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

  const focusFirst = () => {
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
  };

  const canHover = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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

  return (
    <div
      className="relative"
      onPointerEnter={() => { if (canHover()) setOpen(true); }}
      onPointerLeave={() => { if (canHover()) setOpen(false); }}
    >
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); focusFirst(); }
        }}
        className={`inline-flex items-center gap-1 whitespace-nowrap text-sm ${open ? "text-gold-dark" : "text-charcoal/80 hover:text-gold-dark"}`}
      >
        {label}
        <svg aria-hidden="true" viewBox="0 0 12 12" className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 pt-2.5">
          <div
            ref={panel}
            id={id}
            role="menu"
            aria-label={menuLabel}
            onKeyDown={onMenuKeyDown}
            className="rounded-sm border border-hairline bg-white p-3 shadow-[0_14px_36px_rgba(0,0,0,0.12)]"
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One row in a menu panel: icon, title, one-line description. The icon is
 * decorative — the title already says where the link goes.
 */
export function NavMenuItem({ href, title, description, icon }: { href: string; title: string; description?: string; icon?: ReactNode }) {
  return (
    <Link
      role="menuitem"
      tabIndex={-1}
      href={href}
      className="flex items-start gap-3 rounded-sm px-3 py-2.5 hover:bg-chalk focus-visible:bg-chalk focus-visible:outline-none"
    >
      {icon && <span aria-hidden="true" className="mt-0.5 shrink-0 text-gold-dark">{icon}</span>}
      <span className="min-w-0">
        <span className="block font-medium text-charcoal-deep">{title}</span>
        {description && <span className="mt-0.5 block text-[13px] leading-snug text-charcoal/70">{description}</span>}
      </span>
    </Link>
  );
}
