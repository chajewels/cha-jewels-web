import type { Lang } from "@/lib/i18n";

/**
 * Dates and times shown to customers are in JAPAN time, always — the shop's
 * clock, the same clock the Hub's emails quote ("Sat 3 October 2026 at 01:59
 * JST"). Pages render on the server (UTC on Vercel), so a bare
 * toLocaleString() printed the UTC wall clock with no zone: a deadline of
 * 01:59 JST on 3 Oct showed as "2 Oct, 16:59" (found in the owner's draft-mode
 * acceptance test, 2026-09-30). Every customer-facing date goes through here.
 */
export const SITE_TIME_ZONE = "Asia/Tokyo";

const locale = (lang: Lang) => (lang === "ja" ? "ja-JP" : "en-GB");

/** A moment the customer must act by, with the zone named: "3 Oct 2026, 01:59 JST". */
export function formatDeadline(iso: string, lang: Lang): string {
  const s = new Date(iso).toLocaleString(locale(lang), { dateStyle: "medium", timeStyle: "short", timeZone: SITE_TIME_ZONE });
  return lang === "ja" ? `${s}（日本時間）` : `${s} JST`;
}

/** A calendar date in Japan time. Date-only strings ("2026-10-15") keep their day. */
export function formatSiteDate(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(locale(lang), { dateStyle: "medium", timeZone: SITE_TIME_ZONE });
}

/** YYYY-MM-DD of a timestamp in Japan time; a date-only string is returned as is. */
export function siteDay(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}
