"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export function MobileNav({ links, claim }: { links: { href: string; label: string }[]; claim: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  return (
    <>
      <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-sm border border-rule lg:hidden">
        <span className="block h-px w-[18px] bg-current" /><span className={`my-1 block h-px w-[18px] bg-current ${open ? "opacity-0" : ""}`} /><span className="block h-px w-[18px] bg-current" />
      </button>
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[68px] z-30 flex flex-col gap-1 overflow-y-auto bg-velvet-deep px-[clamp(18px,4vw,48px)] py-8 lg:hidden">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-rule-soft py-3 font-display text-3xl">{l.label}</Link>)}
          <Link href="/live" onClick={() => setOpen(false)} className="mt-6 border border-gold px-6 py-3 text-center text-gold-pale">{claim}</Link>
        </div>
      )}
    </>
  );
}
