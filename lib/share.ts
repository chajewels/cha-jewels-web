import type { Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locale";

/**
 * SHARING A BLOG POST (owner decisions S1–S7, 2026-10-16).
 *
 * Plain links to each platform's own share page: no SDK, no iframe, no script
 * from a third party, so nothing here needs a Content-Security-Policy change
 * (a top-level navigation to another site is not governed by the policy).
 *
 * Pure functions, so every URL the bar can produce is unit-tested
 * (tests/share.test.mjs) without a browser.
 */

/** The link targets, in the order the bar shows them (S2). */
export const SHARE_NETWORKS = ["facebook", "x", "line", "whatsapp", "threads"] as const;
export type ShareNetwork = (typeof SHARE_NETWORKS)[number];

/** Every `utm_source` the bar can send: the five networks, Copy link, and the phone's own share sheet. */
export type ShareSource = ShareNetwork | "copy" | "native";

/**
 * The post's canonical absolute URL in the reader's language (S3). Since Phase
 * 2C a share carries the LOCALE URL — the page's own canonical — instead of the
 * legacy `?lang=en` form; old shared links keep working through the unchanged
 * `?lang=` handling. `base` is lib/site.ts siteUrl(), passed in because it
 * reads server-only environment.
 */
export function postShareUrl(base: string, slug: string, lang: Lang): string {
  return `${base.replace(/\/+$/, "")}${localePath(`/blog/${encodeURIComponent(slug)}`, lang)}`;
}

/** `url` with utm_source=<source>&utm_medium=share appended, keeping any `?lang=`. */
export function withShareUtm(url: string, source: ShareSource): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", "share");
  return u.toString();
}

/** The platform's share page for this post (S4); the post URL carries utm_source=<network>. */
export function buildShareUrl(network: ShareNetwork, url: string, title: string): string {
  const shared = withShareUtm(url, network);
  const u = encodeURIComponent(shared);
  const text = encodeURIComponent(`${title} ${shared}`);
  switch (network) {
    case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "x": return `https://twitter.com/intent/tweet?url=${u}&text=${encodeURIComponent(title)}`;
    case "line": return `https://social-plugins.line.me/lineit/share?url=${u}`;
    case "whatsapp": return `https://api.whatsapp.com/send?text=${text}`;
    case "threads": return `https://www.threads.net/intent/post?text=${text}`;
  }
}
