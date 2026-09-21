/**
 * THE FALLBACK LIST, NOT THE RENDERED ONE.
 *
 * Where to find Cha Jewels off the site, rendered only as icon buttons
 * (components/site/social-icons.tsx) and never as visible text. Since the site
 * settings feature these two lists come from the Hub — `social.follow` and
 * `social.loyalty_groups`, read through lib/settings.ts — and what is here is
 * what ships when the Hub has no rows yet, cannot answer, or answers with
 * something malformed. It is the floor, so it is kept current.
 *
 * FOLLOW is public: the footer and /contact. LOYALTY_GROUPS are the member-only
 * chat groups, shown only once GET /me reports `loyalty.enrolled`.
 *
 * Change an address FOR REAL in the Hub. Changing it only here moves the floor
 * and leaves the live value alone.
 */
export type SocialKey = "email" | "facebook" | "messenger" | "whatsapp" | "line";
export type SocialLink = { key: SocialKey; href: string };

export const FOLLOW: SocialLink[] = [
  { key: "email", href: "mailto:sales@chajewelsjp.com" },
  { key: "facebook", href: "https://www.facebook.com/chajewelsjapan" },
  { key: "messenger", href: "https://m.me/chajewelsjapan" },
];

export const LOYALTY_GROUPS: SocialLink[] = [
  { key: "whatsapp", href: "https://chat.whatsapp.com/ENdMNvF8N3jB3iG963f6EF" },
  { key: "line", href: "https://line.me/ti/g/5fb8KyBCCJ" },
  { key: "messenger", href: "https://m.me/ch/AbYF1EaEkypQc5Jk/?send_source=cm:copy_invite_link" },
];
