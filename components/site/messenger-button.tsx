"use client";
import { usePathname } from "next/navigation";
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
 * in-page Messenger links). Decided here, from the client pathname, because
 * the root layout is not re-rendered on a client navigation — a server-side
 * path check would keep whatever the first page decided. Its look is the site
 * frame's: charcoal with a gold edge (D1-1), not orange. On a phone the cart
 * and checkout sticky bar lifts it (commerce-ui.tsx, [data-sticky-act]).
 *
 * Look, position, tab-bar clearance, footer clearance and the focus ring are
 * `.messenger-fab` in app/globals.css. Below `sm` it is a 52px round icon and
 * the label is its accessible name; from `sm` up the label shows as well.
 */
const SHOWN_ON = ["/products", "/collections", "/categories", "/cart", "/checkout", "/layaway", "/loyalty", "/wholesale"];

export function MessengerButton({ href, label }: { href: string; label: string }) {
  const path = usePathname();
  if (!SHOWN_ON.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return (
    <MessengerAnchor
      href={href}
      ariaLabel={label}
      className="messenger-fab btn-press inline-flex h-[52px] w-[52px] items-center justify-center gap-2.5 rounded-full border border-gold bg-charcoal-deep text-[15px] font-medium text-chalk hover:bg-charcoal sm:h-12 sm:w-auto sm:rounded-sm sm:px-5"
    >
      <span aria-hidden="true" className="text-gold-pale"><SocialGlyph name="messenger" size={20} /></span>
      <span className="hidden sm:inline">{label}</span>
    </MessengerAnchor>
  );
}
