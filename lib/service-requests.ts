import type { Lang } from "@/lib/i18n";
import { service as serviceDict } from "@/lib/i18n/sections/service";
import type { Tone } from "@/lib/order-status";
import type { ServiceRequest, ServiceRequestKind, ServiceRequestStatus } from "@/lib/types";

/**
 * Service requests, the customer-facing half. The Hub owns the row and moves
 * its status; this side only asks and reads. Labels live in lib/i18n under
 * `service`, so the language toggle governs every word.
 */
export const SERVICE_KINDS: readonly ServiceRequestKind[] = ["resize", "cleaning", "repair", "appraisal", "certificate", "other"];

export const isServiceKind = (v: unknown): v is ServiceRequestKind =>
  typeof v === "string" && (SERVICE_KINDS as readonly string[]).includes(v);

/** A ring size means nothing for a cleaning; it is asked for — and required — on a resize only. */
export const needsRingSize = (kind: ServiceRequestKind): boolean => kind === "resize";

export const DETAILS_MAX = 2000;
export const RING_SIZE_MAX = 16;

export function serviceKindLabel(kind: ServiceRequestKind, lang: Lang): string {
  switch (kind) {
    case "resize": return serviceDict.kindResize[lang];
    case "cleaning": return serviceDict.kindCleaning[lang];
    case "repair": return serviceDict.kindRepair[lang];
    case "appraisal": return serviceDict.kindAppraisal[lang];
    case "certificate": return serviceDict.kindCertificate[lang];
    default: return serviceDict.kindOther[lang];
  }
}

/**
 * Status → badge. Tones follow the other account badges: anything staff are
 * still working on is pending, done is good, declined is dead.
 */
export function serviceStatusLabel(status: ServiceRequestStatus, lang: Lang): { text: string; tone: Tone } {
  switch (status) {
    case "completed": return { text: serviceDict.statusCompleted[lang], tone: "good" };
    case "declined": return { text: serviceDict.statusDeclined[lang], tone: "dead" };
    case "in_progress": return { text: serviceDict.statusInProgress[lang], tone: "pending" };
    case "received": return { text: serviceDict.statusReceived[lang], tone: "pending" };
    default: return { text: serviceDict.statusRequested[lang], tone: "pending" };
  }
}

/** The order or plan the request was raised from, as the account page for it. */
export function serviceRequestHref(r: ServiceRequest): { href: string; kind: "order" | "plan" } | null {
  if (r.cash_order_id) return { href: `/account/orders/${r.cash_order_id}`, kind: "order" };
  if (r.layaway_plan_id) return { href: `/account/layaway/${r.layaway_plan_id}`, kind: "plan" };
  // A website order still waiting for confirmation (Hub PR 6). Once staff
  // confirm it the Hub sets cash_order_id / layaway_plan_id and the lines above win.
  if (r.draft_id) return { href: `/checkout/complete/d/${encodeURIComponent(r.draft_id)}`, kind: "order" };
  return null;
}

/** Newest first, whatever order the Hub sent them in. */
export const newestFirst = (rows: ServiceRequest[]): ServiceRequest[] =>
  [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
