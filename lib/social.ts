/**
 * Where to find Cha Jewels off the site. One list, rendered only as icon
 * buttons (components/site/social-icons.tsx) — never as visible text, so an
 * address change here is the whole change.
 *
 * FOLLOW is public: the footer. LOYALTY_GROUPS are the member-only chat groups
 * and are shown to a customer only once GET /me reports `loyalty.enrolled`.
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
