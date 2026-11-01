"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { Lang } from "@/lib/i18n";

/**
 * THE SEARCH BOX, ARRIVING ON THE FIRST REACH FOR IT (P2b, chrome deferred to
 * interaction). The site's SearchBox is a 400-line combobox with the Hub image
 * and price components behind it; on the home it sat in the hero's header and
 * hydrated with the hero. Here the header carries a static field that looks
 * the same, and the real box loads on the first focus or press and takes the
 * focus over. The site's header (every other page) keeps SearchBox as is.
 */
const SearchBox = dynamic(() => import("@/components/site/search-box").then((m) => m.SearchBox), { ssr: false });

export function SearchIsland({ lang, placeholder, openLabel }: { lang: Lang; placeholder: string; openLabel: string }) {
  const [live, setLive] = useState<"field" | "sheet" | null>(null);
  const box = useRef<HTMLDivElement>(null);
  // Once the real box is in, continue the gesture: focus its field, or open
  // its sheet where the site shows the magnifier (below lg and from xl).
  useEffect(() => {
    if (!live) return;
    const id = requestAnimationFrame(() => {
      const root = box.current;
      if (!root) return;
      if (live === "sheet") root.querySelector<HTMLButtonElement>("button")?.click();
      else root.querySelector<HTMLInputElement>("input")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [live]);
  if (live) {
    return (
      <div ref={box} className="contents">
        <SearchBox lang={lang} />
      </div>
    );
  }
  // The site's header shows the magnifier below lg and from xl, the field at
  // lg only (components/site/search-box.tsx) — the shell mirrors that.
  return (
    <>
      <button
        type="button"
        aria-label={openLabel}
        onClick={() => setLive("sheet")}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-charcoal-deep hover:text-gold-dark lg:hidden xl:grid"
      >
        <Magnifier />
      </button>
      <div className="hidden lg:block lg:w-52 xl:hidden">
        <div className="group flex min-h-11 items-center gap-2.5 rounded-sm border border-charcoal/60 bg-white px-3 text-charcoal-deep">
          <span aria-hidden="true" className="shrink-0 text-charcoal/70"><Magnifier /></span>
          <input
            type="search"
            aria-label={placeholder}
            placeholder={placeholder}
            onFocus={() => setLive("field")}
            onPointerDown={() => setLive("field")}
            className="min-h-10 min-w-0 flex-1 bg-transparent text-sm text-charcoal-deep outline-none placeholder:text-charcoal/70 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </div>
    </>
  );
}

const Magnifier = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
