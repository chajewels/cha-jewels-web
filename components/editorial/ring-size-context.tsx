"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * The size chosen in the ring sizer, shared with the size table beside it
 * (/jewelry-guide#ring-size; impeccable critique 2026-10-27: the table should
 * show the size the sizer is on). The provider wraps the section's columns;
 * the page's server-rendered parts pass straight through it as children.
 */
type Ctx = { index: number; setIndex: (i: number) => void };
const RingSizeContext = createContext<Ctx | null>(null);

export function RingSizeProvider({ initial, children }: { initial: number; children: React.ReactNode }) {
  const [index, setIndex] = useState(initial);
  return <RingSizeContext.Provider value={{ index, setIndex }}>{children}</RingSizeContext.Provider>;
}

export function useRingSize(): Ctx | null {
  return useContext(RingSizeContext);
}

type Size = readonly [size: number, diameterMm: string, circumferenceMm: string];

/**
 * The size table's rows. The sizer's size is tinted and marked aria-current;
 * when it changes, the table's own scroll box (never the page) brings that
 * row into view.
 */
export function RingSizeRows({ sizes }: { sizes: readonly Size[] }) {
  const ctx = useRingSize();
  const current = ctx?.index ?? -1;
  const row = useRef<HTMLTableRowElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const r = row.current;
    const box = r?.closest<HTMLElement>("[data-ring-table]");
    if (!r || !box) return;
    const head = box.querySelector("thead")?.getBoundingClientRect().height ?? 0;
    const top = r.offsetTop - head;
    if (top < box.scrollTop) box.scrollTop = top;
    else if (r.offsetTop + r.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = r.offsetTop + r.offsetHeight - box.clientHeight;
  }, [current]);
  return (
    <tbody>
      {sizes.map(([n, d, c], k) => (
        <tr key={n} ref={k === current ? row : undefined} aria-current={k === current ? "true" : undefined} className={`border-t border-hairline ${k === current ? "bg-gold-pale/35 font-semibold" : ""}`}>
          <th scope="row" className={`px-4 py-2 text-left font-display text-base font-normal ${k === current ? "text-gold-deep" : "text-gold-dark"}`}>{n}</th>
          <td className="px-4 py-2 text-right text-charcoal-deep">{d}</td>
          <td className="px-4 py-2 text-right text-charcoal-deep">{c}</td>
        </tr>
      ))}
    </tbody>
  );
}
