/**
 * Messenger deep link (owner "deep-link", 2026-10-02): the Page's app scheme
 * for a known m.me username. The m.me href from the Hub (`social.follow`)
 * stays the real link; this only decides what a phone tries FIRST
 * (components/site/messenger-anchor.tsx). A username this map does not know
 * gets no deep link — plain m.me behaviour, never a wrong chat.
 */
const PAGE_IDS: Record<string, string> = {
  // facebook.com/chajewelsjapan — Page id confirmed 2026-10-02 (profile.php?id= redirects to it)
  chajewelsjapan: "109307664336824",
};

export function messengerDeepLink(href: string): string | null {
  const m = /^https?:\/\/m\.me\/([A-Za-z0-9._-]+)\/?$/i.exec(href.trim());
  const id = m ? PAGE_IDS[m[1].toLowerCase()] : undefined;
  return id ? `fb-messenger://user-thread/${id}` : null;
}

export function isPhone(ua: string): boolean {
  return /iPhone|iPad|iPod|Android/i.test(ua);
}
