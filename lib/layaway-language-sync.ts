import { LANG_COOKIE } from "@/lib/i18n";

/**
 * ENGLISH LAYAWAY LINKS ACROSS TABS (Gate H interim mitigation, 2026-10-28).
 *
 * English layaway links stay on the bare, crawlable `/layaway` until Phase 3
 * (Option ii). Bare `/layaway` decides its language from the `cj-lang` cookie,
 * and the cookie is shared by every tab: when another tab switches to Japanese,
 * an English tab's Layaway link opens a 404 (the page is English-only).
 *
 * The mitigation: when a person ACTUALLY ACTIVATES a layaway link on an English
 * page, write `cj-lang=en` just before the browser navigates. That is the same
 * explicit choice the visitor is making by pressing an English "Layaway" link;
 * nothing else changes — the href stays `/layaway` (no new crawlable URL, no
 * `?lang=`), navigation is never prevented or rewritten, and the preference is
 * a preference only: authentication, agreements and every eligibility gate are
 * decided on the server exactly as before.
 *
 * Pure, so the activation and target rules are unit-tested here; the browser
 * half is components/site/layaway-language-sync.tsx.
 */

/** The established language-cookie attributes (middleware.ts, lib/checkout-actions.ts). */
export const ENGLISH_LANGUAGE_COOKIE = `${LANG_COOKIE}=en; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

/**
 * Is this event an actual activation of a link?
 * - `click` with the primary button: a mouse click (with or without Ctrl/Cmd/
 *   Shift — those still navigate, in a new tab or window), the keyboard's Enter
 *   on a focused link, and a touch tap all dispatch it.
 * - `auxclick` with the middle button: middle-click opens the link in a new tab.
 * Never hover, focus, pointer movement, the context menu or a prefetch.
 */
export function isActivation(type: string, button: number): boolean {
  return (type === "click" && button === 0) || (type === "auxclick" && button === 1);
}

/** Does this link point at the public layaway page on this site (any query, any fragment)? */
export function isLayawayLink(href: string | null | undefined, origin: string): boolean {
  if (typeof href !== "string" || !href) return false;
  try {
    const url = new URL(href, origin);
    return url.origin === origin && url.pathname === "/layaway";
  } catch {
    return false;
  }
}
