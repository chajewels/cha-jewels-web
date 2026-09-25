"use client";
import { usePathname } from "next/navigation";
import { SocialGlyph } from "@/components/site/social-icons";

/**
 * The floating "Message us on Messenger" button, bottom-right on every page.
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
 * NOT ON CHECKOUT OR SIGN-IN. Both are single-task pages where a floating
 * action competes with the one button that matters. Decided here, from the
 * client pathname, because the root layout is not re-rendered on a client
 * navigation — a server-side path check would keep whatever the first page
 * decided.
 *
 * Position, the tab-bar clearance on the home page, the footer clearance and
 * the focus ring are `.messenger-fab` in app/globals.css. Below `sm` it is an
 * icon-only round button and the label is its accessible name; from `sm` up
 * the label is shown as well.
 */
const HIDDEN_ON = ["/checkout", "/login"];

export function MessengerButton({ href, label }: { href: string; label: string }) {
  const path = usePathname();
  if (HIDDEN_ON.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="messenger-fab btn-press inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-charcoal-deep bg-orange text-[15px] font-medium text-charcoal-deep hover:bg-orange-hover sm:rounded-sm sm:px-5"
    >
      <SocialGlyph name="messenger" size={22} />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
