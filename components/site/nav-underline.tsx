"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ComponentStyle, mix } from "@/components/fx/component-style";

const CSS = `
.fx-navline {
  position: absolute; left: 0; top: 0; height: 1.5px; width: var(--w, 0px); pointer-events: none; opacity: 0;
  background: linear-gradient(90deg, var(--c-gold-dark), var(--c-gold), var(--c-gold-dark)); box-shadow: 0 0 6px ${mix("gold", 50)};
  transform: translate(var(--x, 0px), var(--y, 0px));
  transition: transform var(--dur-reveal) var(--ease-lux), width var(--dur-reveal) var(--ease-lux), opacity var(--dur-micro) var(--ease-lux);
}
.fx-navline[data-on] { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .fx-navline { transition: none; } }`;

/** Does this path belong to the item? "/" only matches itself; anything else matches its section. */
const owns = (match: string, path: string) =>
  match.split(" ").some((m) => (m === "/" ? path === "/" : path === m || path.startsWith(`${m}/`)));

/**
 * A gold underline that slides between the primary nav's items: it rests
 * under the section the reader is in, glides to whatever the pointer is over
 * or keyboard focus is on, and glides back when they leave. Rendered inside
 * the <nav>, after its list; each <li> says which paths it owns in
 * `data-match` (space separated). Position and width go into custom
 * properties; nothing re-renders on hover. Reduced motion: it moves without
 * gliding.
 */
export function NavUnderline() {
  const ref = useRef<HTMLSpanElement>(null);
  const path = usePathname();

  useEffect(() => {
    const line = ref.current;
    const nav = line?.parentElement;
    if (!line || !nav) return;
    const items = [...nav.querySelectorAll<HTMLElement>("li[data-match]")];
    const active = () => items.find((li) => owns(li.dataset.match ?? "", path)) ?? null;
    let placed: HTMLElement | null = null;
    const place = (li: HTMLElement | null) => {
      placed = li;
      const target = li?.querySelector<HTMLElement>("a, button");
      if (!target) { delete line.dataset.on; return; }
      const n = nav.getBoundingClientRect(), r = target.getBoundingClientRect();
      line.style.setProperty("--x", `${r.left - n.left}px`);
      line.style.setProperty("--y", `${r.bottom - n.top + 4}px`);
      line.style.setProperty("--w", `${r.width}px`);
      line.dataset.on = "";
    };
    const over = (e: Event) => { const li = (e.target as HTMLElement).closest<HTMLElement>("li[data-match]"); if (li && li !== placed) place(li); };
    const home = () => place(active());
    const out = (e: FocusEvent) => { if (!nav.contains(e.relatedTarget as Node)) home(); };
    home();
    // Web fonts can land after the first measurement and change every width.
    document.fonts?.ready.then(() => home(), () => undefined);
    nav.addEventListener("pointerover", over);
    nav.addEventListener("pointerleave", home);
    nav.addEventListener("focusin", over);
    nav.addEventListener("focusout", out);
    window.addEventListener("resize", home);
    return () => {
      nav.removeEventListener("pointerover", over);
      nav.removeEventListener("pointerleave", home);
      nav.removeEventListener("focusin", over);
      nav.removeEventListener("focusout", out);
      window.removeEventListener("resize", home);
    };
  }, [path]);

  return (
    <>
      <ComponentStyle id="fx-navline" css={CSS} />
      <span ref={ref} aria-hidden="true" className="fx-navline" />
    </>
  );
}
