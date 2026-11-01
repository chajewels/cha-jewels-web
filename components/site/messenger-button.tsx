"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stripLocale } from "@/lib/locale";
import { SocialGlyph } from "@/components/site/social-icons";
import { MessengerAnchor } from "@/components/site/messenger-anchor";

/**
 * The floating "Message us on Messenger" button, bottom-right — only on the
 * shopping pages (SHOWN_ON below).
 *
 * AN m.me LINK, NOT A CHAT WIDGET. Meta retired the embedded Messenger chat
 * plugin (May 2024) and guest mode with it. An m.me link opens the visitor's
 * own Messenger — the app on a phone — so only a signed-in Messenger user can
 * write to us, which is what the owner wants: no guest messages. On a phone
 * the click tries the Messenger app's own scheme first and falls back to the
 * m.me page (MessengerAnchor, owner "deep-link" 2026-10-02).
 *
 * THE HREF IS THE HUB'S. The layout passes the `messenger` row of the Hub's
 * `social.follow` setting (lib/settings.ts); with no such row it renders no
 * button at all. Nothing here knows the Page's address.
 *
 * ONLY WHERE A CUSTOMER IS SHOPPING (owner, 2026-09-30, replacing the old
 * "everywhere except checkout and sign-in" rule): product pages, collections
 * and product types, cart and checkout, Layaway, Loyalty and Wholesale.
 * Everywhere else — home, legal, About, FAQ, Contact, search, account,
 * sign-in — has no floating button (Contact, FAQ and search keep their own
 * in-page Messenger links). Since P3 it is a Lumière pill: black, white
 * type, no gold edge (D-4). Decided here, from the client pathname, because
 * the root layout is not re-rendered on a client navigation — a server-side
 * path check would keep whatever the first page decided. Its look is the site
 * frame's: charcoal with a gold edge (D1-1), not orange. On a phone the cart
 * and checkout sticky bar lifts it (commerce-ui.tsx, [data-sticky-act]).
 *
 * Look, position, tab-bar clearance, footer clearance and the focus ring are
 * `.messenger-fab` in app/globals.css. Below `sm` it is a 52px round icon and
 * the label is its accessible name; from `sm` up the label shows as well.
 */
/**
 * STEPS ASIDE FROM WHAT THE VISITOR IS USING (P5, reviewer finding A1: at ~1100 px the button covered the
 * cart's order summary). A fixed button passes over every control as the page scrolls, and no gutter is
 * free at 1024–1280 px, so instead of fighting for space it fades out (and stops taking clicks) while it
 * would sit on a price, a total, a button, a field or a summary, and comes back the moment it is clear.
 * Nothing is lost: the footer and the menu carry the same Messenger link. Never while it has focus.
 */
const PROTECTED = "main a:not(.pcard), main button, main input, main select, main textarea, main summary, main [role=button], main [role=tab], main .cj-fig, main [data-protect], footer input, footer button, footer a";
const useStepAside = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const run = () => {
      frame = 0;
      const fab = document.querySelector<HTMLElement>(".messenger-fab");
      if (!fab) return;
      if (document.activeElement === fab) { fab.removeAttribute("data-dodge"); return; }
      // measure the resting position: the dodge itself moves the button 10px
      const r = fab.getBoundingClientRect();
      const box = fab.hasAttribute("data-dodge") ? { left: r.left, right: r.right, top: r.top - 10, bottom: r.bottom - 10 } : r;
      let over = false;
      for (const el of document.querySelectorAll<HTMLElement>(PROTECTED)) {
        if (fab.contains(el)) continue;
        const b = el.getBoundingClientRect();
        if (b.width < 4 || b.height < 4 || b.bottom < 0 || b.top > innerHeight) continue;
        if (Math.min(box.right, b.right) - Math.max(box.left, b.left) > 4 && Math.min(box.bottom, b.bottom) - Math.max(box.top, b.top) > 4) {
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.display === "none" || cs.pointerEvents === "none") continue;
          over = true;
          break;
        }
      }
      if (over) fab.setAttribute("data-dodge", ""); else fab.removeAttribute("data-dodge");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(run); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const timer = window.setInterval(schedule, 400); // content that arrives or opens without a scroll (checkout steps, accordions)
    schedule();
    return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); window.clearInterval(timer); if (frame) cancelAnimationFrame(frame); document.querySelector(".messenger-fab")?.removeAttribute("data-dodge"); };
  }, [active]);
};

const SHOWN_ON = ["/products", "/collections", "/categories", "/cart", "/checkout", "/layaway", "/loyalty", "/wholesale"];

export function MessengerButton({ href, label }: { href: string; label: string }) {
  // Compared WITHOUT the locale prefix (Phase 3, with /en/layaway live): the
  // list above names bare paths, and the same page is /en/… or /ja/… now.
  const path = stripLocale(usePathname());
  const shown = SHOWN_ON.some((p) => path === p || path.startsWith(`${p}/`));
  useStepAside(shown);
  if (!shown) return null;
  return (
    <MessengerAnchor
      href={href}
      ariaLabel={label}
      className="messenger-fab btn-press inline-flex h-[52px] w-[52px] items-center justify-center gap-2.5 rounded-pill bg-content font-manrope text-[14px] font-medium text-content-inverse hover:opacity-85 sm:h-12 sm:w-auto sm:px-5"
    >
      <span aria-hidden="true"><SocialGlyph name="messenger" size={20} /></span>
      <span className="hidden sm:inline">{label}</span>
    </MessengerAnchor>
  );
}
