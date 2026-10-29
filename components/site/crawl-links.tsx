import Link from "next/link";

export type CrawlLink = { href: string; label: string };

/**
 * The destinations of a menu that is CLOSED, as plain links in the page's
 * initial HTML (SEO Step 1, Master Plan §33.3). The menu panels and the phone
 * drawer mount only while open, so before this a crawler reading the server
 * HTML saw none of the category, collection or company links.
 *
 * `hidden` is the point: display:none takes the list out of the layout, the
 * Tab order and the accessibility tree, so a closed menu looks, tabs and reads
 * exactly as before. It is rendered only while the menu is closed — an open
 * menu has its own real links, so a page never carries a link twice for a
 * user. Hrefs and labels come from the same arrays that build the menus, so
 * the two cannot drift, and every href is already locale-resolved.
 */
export function CrawlLinks({ links }: { links: CrawlLink[] }) {
  if (links.length === 0) return null;
  return (
    <ul hidden data-crawl-links="">
      {links.map((l, i) => (
        <li key={`${l.href}|${i}`}><Link href={l.href} prefetch={false} tabIndex={-1}>{l.label}</Link></li>
      ))}
    </ul>
  );
}
