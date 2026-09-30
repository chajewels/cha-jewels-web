"use client";

import { useEffect, useRef, useState } from "react";

export type TocItem = { id: string; label: string };

/**
 * The contents list beside a legal document (build step 7).
 *
 * Desktop: a sticky list; the section being read carries a gold-dark bar,
 * followed with an IntersectionObserver on the section headings. Below it,
 * "Print this page". Phone: the same list folded into a <details> panel with
 * 44px rows, which closes itself once a section is picked.
 *
 * Labels are the headings' own text ("1. About Cha Jewels"); nothing here is
 * worded afresh.
 */
export function LegalToc({ items, label, printLabel }: { items: TocItem[]; label: string; printLabel: string }) {
  const [current, setCurrent] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const heads = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    if (heads.length === 0) return;
    // The current section is the last heading that has scrolled above a line a
    // third of the way down the window.
    const pick = () => {
      const line = window.innerHeight / 3;
      let id = heads[0].id;
      for (const h of heads) if (h.getBoundingClientRect().top <= line) id = h.id;
      setCurrent(id);
    };
    const io = new IntersectionObserver(pick, { rootMargin: "0px 0px -60% 0px" });
    heads.forEach((h) => io.observe(h));
    window.addEventListener("scroll", pick, { passive: true });
    pick();
    return () => { io.disconnect(); window.removeEventListener("scroll", pick); };
  }, [items]);

  return (
    <nav aria-label={label} className="sticky top-24 max-h-[calc(100vh-120px)] overflow-auto pb-4 print:hidden">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{label}</p>
      <ol className="mt-3 border-l border-hairline">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={current === i.id ? "true" : undefined}
              className="-ml-px block border-l-2 border-transparent py-[7px] pl-4 text-[13px] leading-[1.45] text-charcoal/75 hover:text-charcoal-deep aria-[current]:border-gold-dark aria-[current]:font-medium aria-[current]:text-charcoal-deep"
            >
              {i.label}
            </a>
          </li>
        ))}
      </ol>
      <PrintLink label={printLabel} className="mt-5" />
    </nav>
  );
}

export function LegalTocPhone({ items, label }: { items: TocItem[]; label: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref} className="group mb-7 border border-hairline bg-white print:hidden">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 font-medium text-charcoal-deep [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <span className="flex items-center gap-3 text-[13px] font-normal text-charcoal/70">
          <span className="cj-fig">{items.length}</span>
          <span aria-hidden="true" className="inline-block h-2 w-2 rotate-45 border-b border-r border-charcoal/60 transition-transform group-open:-rotate-[135deg]" />
        </span>
      </summary>
      <ol className="border-t border-hairline px-4 pb-2.5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              onClick={() => { if (ref.current) ref.current.open = false; }}
              className="flex min-h-[44px] items-center border-b border-hairline py-2 text-sm text-charcoal-deep last:border-b-0"
            >
              {i.label}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function PrintLink({ label, className = "" }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`print-hide text-[13px] text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark ${className}`}
    >
      {label}
    </button>
  );
}
