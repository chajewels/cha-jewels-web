"use client";

import { useEffect } from "react";

/**
 * On the pay-card page only (review 2026-10-04): its Content-Security-Policy
 * is ENFORCED, and a CSP header applies to a document load — a Next.js client
 * navigation keeps the current document and its policy. So every same-site
 * link clicked here leaves with a full page load: the next page gets its own
 * (report-only) policy, and Paidy, video and analytics keep working there.
 */
export function FullReloadLinks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.assign(url.toString());
    };
    // Capture phase on document: runs before React's root listener, so the
    // Next.js <Link> handler never starts a client navigation.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
