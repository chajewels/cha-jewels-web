"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { Lang } from "@/lib/i18n-core";

/**
 * THE MAGNIFIER in the header, and the full-screen search behind it — loaded
 * on the first reach for it (P2b's rule: chrome deferred to interaction).
 * The overlay's module (the combobox logic, the Hub image and price
 * components) costs the first load nothing; once opened it stays mounted so
 * closing animates and reopening is instant.
 *
 * `/` anywhere outside a text field opens it, as the site's search always
 * did (components/site/search-box.tsx).
 */
const SearchOverlay = dynamic(() => import("./search-overlay").then((m) => m.SearchOverlay), { ssr: false });

export const SearchTrigger = ({ lang, label }: { lang: Lang; label: string }) => {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const show = () => { setLoaded(true); setOpen(true); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      show();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button ref={button} type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={show} className="lm-chrome__icon" data-search-trigger>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
      </button>
      {loaded && <SearchOverlay lang={lang} open={open} onClose={() => setOpen(false)} returnTo={button} />}
    </>
  );
};
