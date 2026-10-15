/**
 * THE ADVERTISING CONSENT (owner rule 2026-10-15): nothing advertising-related
 * loads or fires until the visitor presses Accept on the cookie banner.
 *
 * One record in localStorage, `cj-consent` = { v: 1, ads: "granted" | "denied",
 * at: ISO }. Anything else under that key — another version, a typo, a value a
 * browser extension wrote — reads as UNSET, so the visitor is asked again
 * rather than assumed to have agreed. Only `ads === "granted"` lets the Meta
 * Pixel or the Google Ads tag load (components/analytics/ads-tags.tsx).
 *
 * Vercel Analytics, Speed Insights and Metricool are NOT behind this: they are
 * cookieless and anonymous, and already in the privacy policy.
 *
 * Every storage access is caught: a private window, blocked site data or a
 * full quota must cost the remembered choice, never the page. A write that
 * cannot be stored still announces itself, so the banner closes and the tags
 * follow the choice for the rest of this page's life.
 */

export const CONSENT_KEY = "cj-consent";
/** Fired on window after every write and clear; the detail is the new record or null. */
export const CONSENT_CHANGE_EVENT = "cj-consent-change";
/** Fired on window by "Cookie settings" in the footer: the banner opens again. */
export const CONSENT_OPEN_EVENT = "cj-consent-open";

export type AdsConsent = "granted" | "denied";
export type ConsentRecord = { v: 1; ads: AdsConsent; at: string };

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** The record a stored string holds, or null for anything that is not exactly one. Pure. */
export function parseConsent(raw: string | null | undefined): ConsentRecord | null {
  if (!raw) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  if (r.v !== 1) return null;
  if (r.ads !== "granted" && r.ads !== "denied") return null;
  if (typeof r.at !== "string" || Number.isNaN(Date.parse(r.at))) return null;
  return { v: 1, ads: r.ads, at: r.at };
}

function storage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Last record announced in this document: what a page whose storage refused the write still follows. */
let memo: ConsentRecord | null | undefined;

/** The visitor's choice, or null when there is none (or it cannot be read). */
export function readConsent(store: StorageLike | null = storage()): ConsentRecord | null {
  if (store) {
    try {
      const rec = parseConsent(store.getItem(CONSENT_KEY));
      if (rec) return rec;
    } catch {
      // Unreadable storage: fall through to what this page was told.
    }
  }
  return memo ?? null;
}

/** Whether advertising may load and fire right now. */
export const adsGranted = (store?: StorageLike | null): boolean => readConsent(store)?.ads === "granted";

function announce(rec: ConsentRecord | null): void {
  memo = rec;
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: rec }));
  } catch {
    // An event that cannot be dispatched must not break the button that sent it.
  }
}

/** Store the visitor's choice and tell the page. */
export function writeConsent(ads: AdsConsent, now: Date = new Date(), store: StorageLike | null = storage()): ConsentRecord {
  const rec: ConsentRecord = { v: 1, ads, at: now.toISOString() };
  try {
    store?.setItem(CONSENT_KEY, JSON.stringify(rec));
  } catch {
    // Not remembered past this page; still honoured on it.
  }
  announce(rec);
  return rec;
}

/** Forget the choice: the banner asks again. */
export function clearConsent(store: StorageLike | null = storage()): void {
  try {
    store?.removeItem(CONSENT_KEY);
  } catch {
    // Nothing stored that we can reach.
  }
  announce(null);
}

/** Reopen the banner ("Cookie settings"). */
export function openConsent(): void {
  try {
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
  } catch {
    // No window: nothing to open.
  }
}

/** Test seam. Not used by application code. */
export function __resetConsentMemoForTest(): void {
  memo = undefined;
}
