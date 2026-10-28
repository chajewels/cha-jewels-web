"use client";
import { useEffect } from "react";
import { LANG_COOKIE } from "@/lib/i18n";
import { ENGLISH_LANGUAGE_COOKIE, isActivation, isLayawayLink } from "@/lib/layaway-language-sync";

/**
 * Keeps an English tab's Layaway links working after another tab switched the
 * shared language cookie to Japanese (lib/layaway-language-sync.ts explains).
 *
 * The root layout renders this ONLY on documents where layaway is offered
 * (English), so a Japanese page never has the listener at all.
 *
 * CAPTURE PHASE on window, so the cookie is written before next/link's own
 * handler starts a client-side navigation (and before the browser's default
 * action for a modified or middle click opens a new tab). It never calls
 * preventDefault and never changes where the link goes. Renders nothing.
 */
export function LayawayLanguageSync() {
  useEffect(() => {
    const onActivate = (e: MouseEvent) => {
      try {
        if (!isActivation(e.type, e.button)) return;
        const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
        if (!link || !isLayawayLink(link.getAttribute("href"), window.location.origin)) return;
        if ((document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`)) ?? [])[1] === "en") return;
        document.cookie = ENGLISH_LANGUAGE_COOKIE;
      } catch {
        // A cookie that cannot be written leaves the link exactly as it was.
      }
    };
    window.addEventListener("click", onActivate, true);
    window.addEventListener("auxclick", onActivate, true);
    return () => {
      window.removeEventListener("click", onActivate, true);
      window.removeEventListener("auxclick", onActivate, true);
    };
  }, []);
  return null;
}
