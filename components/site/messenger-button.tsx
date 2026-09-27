import { SocialGlyph } from "@/components/site/social-icons";

/**
 * The floating "Message us on Messenger" button, bottom-right on EVERY page.
 *
 * AN m.me LINK, NOT A CHAT WIDGET. Meta retired the embedded Messenger chat
 * plugin (May 2024) and guest mode with it. An m.me link opens the visitor's
 * own Messenger — the app on a phone — so only a signed-in Messenger user can
 * write to us, which is what the owner wants: no guest messages.
 *
 * THE HREF IS THE HUB'S. The layout passes the `messenger` row of the Hub's
 * `social.follow` setting (lib/settings.ts); with no such row it renders no
 * button at all. Nothing here knows the Page's address.
 *
 * ON EVERY PAGE (site frame, 2026-09-27). It used to stand down on /checkout
 * and /login; the frame's rule is one Messenger button, bottom-right, on every
 * page and never covered, so a customer stuck at checkout can still reach a
 * person. It is not orange any more (D1-1), so it no longer competes with the
 * page's one orange action. A server component: nothing about it depends on
 * the path now.
 *
 * Look, position, tab-bar clearance, footer clearance and the focus ring are
 * `.messenger-fab` in app/globals.css. Below `sm` it is a 52px round icon and
 * the label is its accessible name; from `sm` up the label shows as well.
 */
export function MessengerButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="messenger-fab btn-press inline-flex h-[52px] w-[52px] items-center justify-center gap-2.5 rounded-full border border-gold bg-charcoal-deep text-[15px] font-medium text-chalk hover:bg-charcoal sm:h-12 sm:w-auto sm:rounded-sm sm:px-5"
    >
      <span aria-hidden="true" className="text-gold-pale"><SocialGlyph name="messenger" size={20} /></span>
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
