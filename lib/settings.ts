import "server-only";
import { cache } from "react";
import { hub } from "@/lib/hub-api";
import type { Lang } from "@/lib/i18n";
import type { SettingsAnnouncement, SettingsSocialLink, SiteSettings, SocialKey, SocialLink } from "@/lib/types";

/**
 * OWNER-EDITABLE SITE SETTINGS. The Hub is the only source.
 *
 * Until 2026-09-22 every getter here answered twice: what did the Hub say, and
 * — if it said nothing usable — what did this repo hardcode? The second answer
 * lived in lib/social.ts and in a handful of lib/i18n.ts keys, and it is gone.
 * All of it is in the Hub now (owner-verified).
 *
 * SO "MISSING" MEANS MISSING, AND IT RENDERS NOTHING. A settings map with no
 * `social.follow` is a site with no social row, not a site quietly showing
 * addresses from a file nobody has looked at since. Every caller treats an
 * empty answer as "there is nothing to show here" and omits the block, heading
 * and all — the same rule the testimonials section follows.
 *
 * THAT IS NOT THE SAME AS AN OUTAGE. A Hub that cannot be reached THROWS, and
 * every getter here lets it: what the failure MEANS belongs to the caller, not
 * to this file. Chrome catches and omits — the footer, the announcement bar.
 * Content does not — /contact's ways-to-reach-us panel is the page, so it lets
 * the error out. Same getter, two answers. See the header of lib/hub-api.ts.
 */
const load = cache(async (): Promise<SiteSettings> => {
  const raw = await hub.settings();
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
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

function socialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
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
  return out;
}

function langText(value: unknown, lang: Lang): string | null {
  if (!value || typeof value !== "object") return null;
  const text = (value as Record<string, unknown>)[lang];
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

/** The public social row: footer and /contact. Empty means render no row. */
export async function follow(): Promise<SocialLink[]> {
  return socialLinks((await load())["social.follow"]);
}

/** The member-only chat groups, shown once GET /me reports loyalty.enrolled. */
export async function loyaltyGroups(): Promise<SocialLink[]> {
  return socialLinks((await load())["social.loyalty_groups"]);
}

/**
 * The address a customer writes to, or null when the Hub holds none.
 *
 * NOTE FOR THE STATUTORY PAGE: /legal/tokusho keeps printing the email from
 * lib/content/legal.ts and is NOT read from here. A statutory disclosure is not
 * owner-editable copy, and it must not be able to go blank because a settings
 * row was deleted.
 */
export async function contactEmail(): Promise<string | null> {
  const fromHub = (await load())["contact.email"];
  return typeof fromHub === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromHub.trim()) ? fromHub.trim() : null;
}

/** The footer's brand paragraph, in the language of the page, or null. */
export async function footerTagline(lang: Lang): Promise<string | null> {
  return langText((await load())["footer.tagline"], lang);
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
