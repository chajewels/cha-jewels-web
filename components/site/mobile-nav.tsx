"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { signOutAction } from "@/lib/session-actions";

export type DrawerAccount = { name: string; menuLabel: string; items: { href: string; label: string }[]; signOut: string };

/**
 * The drawer below `xl`. When the customer is signed in, `account` adds a
 * section after the page links: their name as its heading, the account pages,
 * and Sign out on its own at the bottom — the same list the desktop menu shows.
 *
 * The panel is portalled to <body>. The header's `backdrop-blur` makes the
 * header the containing block for fixed descendants, so a panel rendered
 * inside it had its top/bottom measured against the 68px bar and collapsed to
 * nothing — the links spilled out unstyled over the page. Outside the header
 * the panel fills the viewport below the bar as intended.
 */
export function MobileNav({ links, claim, openLabel, closeLabel, account }: { links: { href: string; label: string }[]; claim: string; openLabel: string; closeLabel: string; account?: DrawerAccount | null }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  return (
    <>
      <button type="button" aria-label={open ? closeLabel : openLabel} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-sm border border-rule xl:hidden">
        <span className="block h-px w-[18px] bg-current" /><span className={`my-1 block h-px w-[18px] bg-current ${open ? "opacity-0" : ""}`} /><span className="block h-px w-[18px] bg-current" />
      </button>
      {open && createPortal(
        <div className="fixed inset-x-0 bottom-0 top-[68px] z-30 flex flex-col gap-1 overflow-y-auto bg-velvet-deep px-[clamp(18px,4vw,48px)] py-8 xl:hidden">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-rule-soft py-3 font-display text-3xl">{l.label}</Link>)}
          {account && (
            <section aria-label={account.menuLabel} className="mt-8 border-t border-rule pt-6">
              <p className="font-display text-2xl text-gold-pale">{account.name}</p>
              <ul className="mt-3">
                {account.items.map((it) => (
                  <li key={it.href}><Link href={it.href} onClick={() => setOpen(false)} className="block border-b border-rule-soft py-3 text-lg text-champagne/85 hover:text-gold-pale">{it.label}</Link></li>
                ))}
              </ul>
              <form action={signOutAction} className="mt-5">
                <button type="submit" className="min-h-11 text-lg text-gold-pale underline underline-offset-4">{account.signOut}</button>
              </form>
            </section>
          )}
          <Link href="/live" onClick={() => setOpen(false)} className="mt-6 border border-gold px-6 py-3 text-center text-gold-pale">{claim}</Link>
        </div>,
        document.body,
      )}
    </>
  );
}
