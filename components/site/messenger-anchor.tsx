"use client";
import type { MouseEvent, ReactNode } from "react";
import { isPhone, messengerDeepLink } from "@/lib/messenger-link";

/**
 * Every "Message us on Messenger" link on the site (the floating button, the
 * Contact / search / review / error CTAs) goes through this anchor.
 *
 * THE HREF IS STILL THE HUB'S m.me LINK (`social.follow` → messenger), and on a
 * desktop that is exactly what opens, in a new tab. On a PHONE an m.me link
 * opens the browser first and Meta shows its "Open In Messenger" page — one
 * more tap than the customer expects (owner, 2026-10-02: "deep-link"). So on a
 * phone the click first tries the Messenger app's own scheme,
 * fb-messenger://user-thread/<page id>, which lands straight in the chat when
 * the app is installed. If nothing happened after a moment — no app, or the
 * phone refused the scheme — the same tab goes to the m.me link, which is
 * Meta's own fallback page ("Get the Messenger app"). The customer never ends
 * on a blank tab: the m.me URL is also the anchor's real href, so a long
 * press, a copy, a middle click and every crawler see the ordinary link.
 *
 * The page id is looked up from the m.me username (lib/messenger-link.ts), so
 * a Hub change of the link to a username that file does not know simply keeps
 * the plain m.me behaviour — never a wrong deep link.
 */
export function MessengerAnchor({
  href, className, children, ariaLabel,
}: { href: string; className?: string; children: ReactNode; ariaLabel?: string }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (typeof navigator === "undefined" || !isPhone(navigator.userAgent)) return;
    const deep = messengerDeepLink(href);
    if (!deep) return;
    e.preventDefault();
    const started = Date.now();
    let fell = false;
    const fallBack = () => {
      if (fell) return;
      fell = true;
      // The app took the tab away (hidden) → nothing to do. Still visible after
      // the wait → no app answered: open the m.me page in this tab.
      if (document.visibilityState === "visible" && Date.now() - started < 3000) window.location.href = href;
    };
    const timer = window.setTimeout(fallBack, 1400);
    const onHide = () => { if (document.visibilityState === "hidden") { window.clearTimeout(timer); fell = true; } };
    document.addEventListener("visibilitychange", onHide, { once: true });
    window.location.href = deep;
  };
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
