import { normalize } from "@/lib/search-normalize";

/**
 * How a results page was reached: from the header combobox, or straight to the
 * URL (a pasted link, a bookmark, a back-navigation).
 *
 * WHY A MARKER AT ALL. The `search` event has exactly one emitter — the results
 * page — because two emitters is what made the number unreadable: a search
 * typed in the box was counted twice and a pasted link once, so the total was
 * neither searches nor page views. Moving to a single emitter fixes the count
 * but loses the one thing the combobox knew and the page does not, which is
 * that a person typed it. This carries that fact across the navigation without
 * carrying a second event with it.
 *
 * ONE-SHOT. `take` clears the marker as it reads it, so a reload of the same
 * results page reads "direct" — which is true: the second visit was not typed.
 * The stored query must also match the page's, so a marker left behind by an
 * abandoned navigation cannot relabel a different search later, and it expires,
 * so one left in a tab overnight cannot relabel anything at all.
 *
 * sessionStorage rather than a URL parameter: /search?q= is a link people paste
 * to each other, and a marker in the query string would travel with it and
 * arrive labelled as typed on someone else's machine. It would also have to be
 * stripped with replaceState on read, which rewrites history on a page that has
 * done nothing wrong.
 *
 * Every access is wrapped: storage throws in a private window and is absent
 * during SSR. A marker that cannot be written or read simply means "direct",
 * which is the safe answer — it under-claims rather than invents a typed search.
 */
export type SearchOrigin = "box" | "direct";

const KEY = "cj:search-origin";
/** Long enough to cross a slow navigation, short enough that a forgotten tab cannot relabel a later search. */
const MAX_AGE_MS = 30_000;

/** Called by the combobox immediately before it navigates to /search. */
export function markSearchFromBox(q: string): void {
  const term = normalize(q);
  if (!term) return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ q: term, t: Date.now() }));
  } catch {
    // Private window, blocked storage, or no window at all. The page will read
    // "direct"; the event itself is unaffected.
  }
}

/** Called once by the results page. Reads AND clears — that is what makes it one-shot. */
export function takeSearchOrigin(q: string): SearchOrigin {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    if (!raw) return "direct";
    const parsed = JSON.parse(raw) as { q?: unknown; t?: unknown };
    const marked = typeof parsed.q === "string" ? parsed.q : "";
    const at = typeof parsed.t === "number" ? parsed.t : 0;
    if (!marked || marked !== normalize(q)) return "direct";
    if (Date.now() - at > MAX_AGE_MS) return "direct";
    return "box";
  } catch {
    return "direct";
  }
}
