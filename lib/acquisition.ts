/**
 * ACQUISITION SOURCE CLASSIFIER (DP-09 preparation; INERT).
 *
 * Pure function from a landing referrer and query string to ONE of six words, plus the search engine's hostname
 * for organic search only. Nothing here reads or sets a cookie, touches the DOM, or is called by any page: tracking is
 * NOT enabled. It is wired in only after consent handling (OD-ATTR-3) and the Hub contract (OD-ATTR-4) are settled
 * (docs/seo/phase-12/ATTRIBUTION-PREPARATION-2026-11-02.md). It stores no URL, query, click id, IP or identifier.
 */
export type AcquisitionClass = "organic_search" | "paid" | "social" | "email" | "referral" | "direct";
export type Acquisition = { class: AcquisitionClass; host?: string };

const SEARCH_HOSTS_STRICT = [/^(?:www\.|m\.)?google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/i, /^(?:www\.|m\.)?bing\.com$/i, /^(?:[a-z]+\.)?search\.yahoo\.(?:com|co\.jp)$/i, /^(?:search\.)?yahoo\.co\.jp$/i, /^(?:www\.)?duckduckgo\.com$/i, /^(?:www\.)?ecosia\.org$/i, /^(?:www\.)?baidu\.com$/i, /^(?:www\.)?yandex\.(?:com|ru|co\.[a-z]{2}|[a-z]{2})$/i, /^(?:search\.)?naver\.com$/i, /^search\.brave\.com$/i];
const SOCIAL = /^(?:[a-z0-9-]+\.)*(?:facebook|instagram|tiktok|twitter|x|t|pinterest|youtube|line|linkedin|threads|messenger)\.(?:com|co|me|jp|net)$/i;
const PAID_MEDIUM = new Set(["cpc", "ppc", "paid", "paidsocial", "paid_social", "display", "cpm", "banner"]);

export function classifyAcquisition(referrer: string | null | undefined, search: string | null | undefined, ownHost: string): Acquisition {
  const q = new URLSearchParams(search ?? "");
  const medium = (q.get("utm_medium") ?? "").trim().toLowerCase();
  if (PAID_MEDIUM.has(medium) || q.has("gclid") || q.has("msclkid")) return { class: "paid" };
  if (medium === "email") return { class: "email" };
  let host = "";
  try { host = referrer ? new URL(referrer).hostname.toLowerCase() : ""; } catch { host = ""; }
  const own = ownHost.toLowerCase().replace(/^www\./, "");
  const self = host.replace(/^www\./, "") === own;
  if (host && !self && SEARCH_HOSTS_STRICT.some((re) => re.test(host))) return { class: "organic_search", host };
  if (q.has("fbclid") || (host && !self && SOCIAL.test(host))) return { class: "social" };
  if (host && !self) return { class: "referral" };
  return { class: "direct" };
}
