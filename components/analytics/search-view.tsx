"use client";

import { useEffect } from "react";
import { trackSearch } from "@/lib/analytics";

/**
 * Records that a search results page was shown for `q` with `total` matches.
 * Renders nothing. Fires once per mount; a new query is a new mount because the
 * page re-renders with new props, and the same query reloaded is a new search.
 */
export function SearchView({ q, total }: { q: string; total: number }) {
  useEffect(() => { trackSearch(q, total); }, [q, total]);
  return null;
}
