"use client";

import { useEffect } from "react";
import { trackSearch } from "@/lib/analytics";
import { takeSearchOrigin } from "@/lib/search-origin";

/**
 * Records that a search results page was shown for `q` with `total` matches.
 * Renders nothing.
 *
 * THE SINGLE EMITTER of the `search` event. Every route into a search ends
 * here — the header combobox navigates to this page, and so does a pasted
 * link, a bookmark and a back-navigation — so counting here counts each search
 * exactly once, whichever way it arrived. The combobox deliberately does not
 * emit; it leaves a one-shot marker instead (lib/search-origin.ts), which is
 * consumed here so the distinction survives without a second event.
 *
 * Fires once per mount; a new query is a new mount because the page re-renders
 * with new props, and the same query reloaded is a new search.
 */
export function SearchView({ q, total }: { q: string; total: number }) {
  useEffect(() => { trackSearch(q, total, takeSearchOrigin(q)); }, [q, total]);
  return null;
}
