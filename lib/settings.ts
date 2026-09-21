import "server-only";
import { cache } from "react";
import { hub } from "@/lib/hub-api";
import { dict, type Lang } from "@/lib/i18n";
import { FOLLOW, LOYALTY_GROUPS, type SocialKey, type SocialLink } from "@/lib/social";
import type { SettingsAnnouncement, SettingsSocialLink, SiteSettings } from "@/lib/types";

/**
 * OWNER-EDITABLE SITE SETTINGS, WITH THE SITE AS IT IS TODAY AS THE FLOOR.
 *
 * Every getter here answers the same question twice: what did the Hub say, and
 * — if it said nothing usable — what does this repo already render? The second
 * answer is the live site's current values (lib/social.ts, lib/i18n.ts), so the
 * worst case of a Hub outage, a half-migrated settings table or a typo in one
 * row is that the page looks exactly as it did before this feature existed.
 *
 * NOTHING HERE THROWS. These are read from the footer, which is in the root
 * layout: an exception would be a 500 on every page on the site, including the
 * ones that have nothing to do with settings. A failure is a fallback, never an
 * error, and it is not logged — a Hub that is down is already saying so
 * somewhere that is actually monitored.
 *
 * lib/social.ts is now THE FALLBACK and nothing else. Read it as the record of
 * what ships when the Hub is silent, not as the list the site renders.
 */

/**
 * One fetch and one validation pass per request, however many getters run.
 * `cache()` is per-request; the HTTP caching (60s, tag "content") is in
 * hub-api and is what survives between requests.
 */
const load = cache(async (): Promise<SiteSettings> => {
  try {
    const raw = await hub.settings();
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
});

/**
 * Hrefs come from a person typing into the Hub, so the scheme is checked here
 * rather than assumed. `javascript:` and `data:` are the ones that matter;
 * relative paths are allowed because an announcement usually points at a page
 * on this site.
 */
function safeHref(value: unknown, { allowRelative = false } = {}): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return allowRelative ? href : null;
  return /^(https?:|mailto:)/i.test(href) ? href : null;
}

/** Keys SocialIcons can actually draw. A row naming anything else is dropped. */
const SOCIAL_KEYS = new Set<SocialKey>(["email", "facebook", "messenger", "whatsapp", "line"]);

function socialLinks(value: unknown, fallback: SocialLink[]): SocialLink[] {
  if (!Array.isArray(value)) return fallback;
  const out: SocialLink[] = [];
  for (const row of value as SettingsSocialLink[]) {
    if (!row || typeof row !== "object") continue;
    const key = row.key as SocialKey;
    const href = safeHref(row.href);
    // A glyph we cannot draw would render an empty circle, which reads as a
    // broken page rather than as a link nobody added an icon for yet.
    if (!SOCIAL_KEYS.has(key) || !href) continue;
    out.push({ key, href });
  }
  // An EMPTY list is treated as "the Hub has nothing to say", not as "the owner
  // deleted every social account" — the second is a decision nobody makes by
  // accident, and the first is what a half-migrated table looks like.
  return out.length ? out : fallback;
}

function langText(value: unknown, lang: Lang): string | null {
  if (!value || typeof value !== "object") return null;
  const text = (value as Record<string, unknown>)[lang];
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

/** The public social row: footer and /contact. */
export async function follow(): Promise<SocialLink[]> {
  return socialLinks((await load())["social.follow"], FOLLOW);
}

/** The member-only chat groups, shown once GET /me reports loyalty.enrolled. */
export async function loyaltyGroups(): Promise<SocialLink[]> {
  return socialLinks((await load())["social.loyalty_groups"], LOYALTY_GROUPS);
}

/**
 * The address a customer writes to.
 *
 * The fallback is the mailto already in FOLLOW rather than a literal, so there
 * is still exactly one place in this repo that holds the address.
 *
 * NOTE FOR THE STATUTORY PAGE: /legal/tokusho keeps printing the email from
 * lib/content/legal.ts and is NOT read from here. A statutory disclosure is
 * not owner-editable copy, and the two are allowed to differ only in the sense
 * that the Hub can be wrong — if they ever do differ, the tokusho row is the
 * one that is right.
 */
export async function contactEmail(): Promise<string> {
  const fromHub = (await load())["contact.email"];
  if (typeof fromHub === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromHub.trim())) return fromHub.trim();
  const mailto = FOLLOW.find((l) => l.key === "email")?.href ?? "";
  return mailto.replace(/^mailto:/i, "");
}

/** The footer's brand paragraph, in the language of the page. */
export async function footerTagline(lang: Lang): Promise<string> {
  return langText((await load())["footer.tagline"], lang) ?? dict.footer.blurb[lang];
}

/** What the bar renders, once it has been decided that it renders at all. */
export type Announcement = { text: string; href: string | null };

/**
 * The announcement bar's copy for this language, or `null` for "do not render".
 *
 * Three conditions, all of them required, and the ORDER of the last two is the
 * point: a bar with no text in the reader's language is not a bar with an empty
 * line in it, and an expired bar is not a bar that says nothing. Either one is
 * nothing at all.
 *
 *   active   the owner's switch
 *   text     non-empty IN THIS LANGUAGE — a Japanese-only announcement is
 *            simply absent for an English reader, never a blank strip
 *   until    an inclusive end date, YYYY-MM-DD, or null for "no end". Compared
 *            against today IN TOKYO, because the owner means the day she is
 *            living in; a UTC "today" would end a campaign nine hours early.
 *
 * There is NO default announcement: a Hub that says nothing announces nothing.
 * That is why this getter alone has no fallback to today's values.
 */
export async function announcement(lang: Lang): Promise<Announcement | null> {
  const value = (await load()).announcement as SettingsAnnouncement | undefined;
  if (!value || typeof value !== "object") return null;
  if (value.active !== true) return null;

  const text = langText(value.text, lang);
  if (!text) return null;

  if (typeof value.until === "string" && value.until.trim()) {
    const until = value.until.trim();
    // Lexicographic comparison is exact for zero-padded YYYY-MM-DD and needs no
    // Date parsing, which is where time zones get invented by accident.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(until) || todayInTokyo() > until) return null;
  }

  return { text, href: safeHref(value.href, { allowRelative: true }) };
}

/** Today in Asia/Tokyo as YYYY-MM-DD. `en-CA` is the locale that formats that way. */
function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
