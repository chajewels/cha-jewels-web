import type { Lang } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";

/**
 * WEBSITE RECEIPTS (領収書) — the storefront side (owner decisions 2026-10-27;
 * Hub docs/RECEIPTS.md, contract supabase/contracts/api.md "Receipts").
 *
 * The Hub issues ONE receipt per website order (cash order or plan) once it is
 * fully paid, draws the PDF, keeps the download history and marks every
 * download after the first 再発行 / REISSUED. This side only lists them, lets
 * the customer set the addressee (宛名) and purpose line (但し書き), and proxies
 * the PDF from its server. Every figure on a receipt is the Hub's; nothing here
 * computes tax or totals.
 *
 * Plan receipts are hidden on the Japanese site (layawayOffered) — the Hub
 * returns every receipt she owns, plans included.
 */
export type ReceiptKind = "cash" | "layaway";

export type HubReceipt = {
  id: string;
  receipt_number: string;
  kind: ReceiptKind;
  /** The /orders/:id or /layaway/:id id. */
  order_id: string;
  order_number: string;
  status: "issued" | "cancelled";
  currency: "JPY" | "PHP";
  /** Money received, tax included — the Hub's figure. */
  total: number;
  issued_at: string;
  cancelled_at: string | null;
  addressee: string | null;
  purpose: string;
  /** PDF downloads so far; the next one is a reissue when this is > 0. */
  downloads: number;
};

/** The Hub's limits (PATCH /me/receipts/:id). */
export const ADDRESSEE_MAX = 60;
export const PURPOSE_MAX = 40;

export type ReceiptLang = "ja" | "en";

/** Receipts this site may show in this language: no plan receipts on the Japanese site. */
export function visibleReceipts(list: HubReceipt[], lang: Lang): HubReceipt[] {
  return layawayOffered(lang) ? list : list.filter((r) => r.kind !== "layaway");
}

/**
 * The receipt to show on one order or plan page: its ISSUED receipt, else the
 * most recently cancelled one (so a cancelled receipt is explained, not silently
 * gone). null when the order has none.
 */
export function receiptForOrder(list: HubReceipt[], kind: ReceiptKind, orderId: string): HubReceipt | null {
  const own = list.filter((r) => r.kind === kind && r.order_id === orderId);
  const issued = own.find((r) => r.status === "issued");
  if (issued) return issued;
  return [...own].sort((a, b) => (b.cancelled_at ?? b.issued_at).localeCompare(a.cancelled_at ?? a.issued_at))[0] ?? null;
}

const CONTROL = /[\u0000-\u001f\u007f]/;

/** The same shape checks the Hub makes, so a mistake is named before the round trip. */
export function cleanReceiptDetails(addressee: unknown, purpose: unknown):
  | { ok: true; addressee: string; purpose: string }
  | { ok: false; code: "addressee_too_long" | "purpose_too_long" | "invalid_characters" } {
  const a = String(addressee ?? "").trim();
  const p = String(purpose ?? "").trim();
  if (CONTROL.test(a) || CONTROL.test(p)) return { ok: false, code: "invalid_characters" };
  if ([...a].length > ADDRESSEE_MAX) return { ok: false, code: "addressee_too_long" };
  if ([...p].length > PURPOSE_MAX) return { ok: false, code: "purpose_too_long" };
  return { ok: true, addressee: a, purpose: p };
}

/** A verify code as printed under the QR: 40 hexadecimal characters. */
export function normaliseVerifyCode(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase().replace(/\s+/g, "");
  return /^[0-9a-f]{40}$/.test(s) ? s : null;
}

export function receiptLang(v: unknown): ReceiptLang {
  return String(v ?? "").toLowerCase() === "en" ? "en" : "ja";
}

/** The PDF route on this site (the bytes come from the Hub through the server). */
export function receiptPdfHref(id: string, lang: ReceiptLang): string {
  return `/account/receipts/${encodeURIComponent(id)}/pdf?lang=${lang}`;
}

/** Where a failed download sends her back to, with the Hub's code. */
export function receiptErrorHref(code: string): string {
  return `/account/receipts?error=${encodeURIComponent(code)}`;
}

/** The message key for a receipt error code (dict.receipts). */
export function receiptErrorKey(code: string | null | undefined):
  | "errTooLongAddressee" | "errTooLongPurpose" | "errCharacters" | "errCancelled" | "errUnavailable" | "errNotFound" | "errSignedOut" | "errFailed" {
  switch (code) {
    case "addressee_too_long": return "errTooLongAddressee";
    case "purpose_too_long": return "errTooLongPurpose";
    case "invalid_characters": return "errCharacters";
    case "receipt_cancelled": return "errCancelled";
    case "receipt_unavailable": return "errUnavailable";
    case "not_found": return "errNotFound";
    case "signed_out": return "errSignedOut";
    default: return "errFailed";
  }
}
