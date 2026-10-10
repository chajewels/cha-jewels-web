/**
 * The Paidy button's state rules on the order page (Paidy QC PR-B, owner go
 * 2026-10-09: H3 "wait for the Hub's answer", M8 calm messages). Pure: no
 * figure, no Hub call — only what the button may do next. The Hub decides
 * every payment fact; this file only refuses to let the button run ahead of it.
 */

/**
 * H3: after an "uncertain" answer (Paidy approved but the Hub's filing did not
 * answer, or Paidy's own answer could not be read) or a Hub refusal of an
 * approved payment, the button stays disabled until the HUB reports a final
 * state — never on a timer alone. The longest it waits is 90 minutes: the
 * Hub's 30-minute window plus its hourly check (Paidy second-hold fix,
 * 2026-10-10). By then the Hub has either filed the payment (the page shows
 * "being processed" and this component is gone) or ended the window. Opening
 * Paidy again before that could place a second hold on her Paidy limit — and
 * since the second-hold fix the Hub itself refuses a new window while an
 * approved payment is unverified, so this wait is the browser's courtesy, not
 * the only guard.
 */
export const PAIDY_HOLD_MAX_MS = 90 * 60 * 1000;
/** How often the page asks the Hub again while it waits. */
export const PAIDY_POLL_MS = 15 * 1000;

export type HoldReason = "uncertain" | "releasing";

/**
 * The hold ends when the Hub has shown her Paidy window open and then reports
 * it ended (it ended the window with nothing filed), or after the Hub's window
 * length. A page that never saw the window open since the hold began keeps
 * waiting: the first answers after a failed filing can still be the old ones.
 */
export function holdEnded(h: { since: number; sawWindowOpen: boolean; windowOpen: boolean; now: number }): boolean {
  if (h.now - h.since >= PAIDY_HOLD_MAX_MS) return true;
  return h.sawWindowOpen && !h.windowOpen;
}

/**
 * What the button does after Paidy said AUTHORIZED and the Hub answered the
 * filing with `code` (null = filed). Paidy holds money for her in every case
 * but the first, so the button never simply comes back.
 */
export function afterAuthorized(code: string | null): "filed" | "uncertain" | "releasing" | "refresh" {
  if (code === null) return "filed";
  // No answer, or her session ended: the Hub may have it on file, or files it
  // from Paidy's own notification — never ask her to pay again.
  if (code === "failed" || code === "signed_out" || code === "timeout" || code === "network") return "uncertain";
  // Another payment is already being checked: the refreshed page shows it.
  if (code === "submission_pending" || code === "payment_in_progress") return "refresh";
  // The Hub read the authorisation back and it did not match this order: the
  // Hub releases it at Paidy (its own words for this refusal). Only then.
  if (code === "paidy_mismatch") return "releasing";
  // Any other refusal (rate limit, not offered, an id we could not even send,
  // a code added later): we do not know what Paidy holds — wait for the Hub.
  return "uncertain";
}

/** M8: a server action that never answers is ended here with a calm code. */
export async function withTimeout<T>(p: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => { timer = setTimeout(() => resolve(onTimeout()), ms); });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * M8: a server action call that throws (dropped connection, an action from an
 * older deploy, an expired page) becomes a result code instead of the site's
 * error page.
 */
export async function safeAction<T extends { ok: boolean }>(call: () => Promise<T>, ms: number, fallback: (code: "network" | "timeout") => T): Promise<T> {
  try {
    return await withTimeout(call(), ms, () => fallback("timeout"));
  } catch {
    return fallback("network");
  }
}

/**
 * S-L2: the Hub's start answer is used only when it is whole — an attempt id
 * and a yen payload with an amount. Anything else never opens Paidy.
 */
const ATTEMPT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function startAnswerUsable(r: unknown): boolean {
  if (!r || typeof r !== "object") return false;
  const o = r as { attempt_id?: unknown; checkout?: { amount?: unknown; currency?: unknown } | null };
  if (typeof o.attempt_id !== "string" || !ATTEMPT_ID.test(o.attempt_id)) return false;
  const c = o.checkout;
  return !!c && c.currency === "JPY" && Number(c.amount) > 0;
}

export function isAttemptId(v: unknown): v is string {
  return typeof v === "string" && ATTEMPT_ID.test(v);
}

// --- The hold, as stored in the tab (L3 / L6, Paidy QC 2026-10-10) ---------

/**
 * A hold survives a reload of the page in the same tab (H3). L3: when the
 * filing of an approved payment did not reach the Hub, the Paidy payment id
 * is kept so it can be handed to the Hub again — POST /orders/:id/paidy is
 * idempotent for a known id, and an id the Hub never received is what lets her
 * window end with nothing noted (and a second hold on her Paidy limit follow).
 *
 * Review fix M-1 (2026-10-10): at most PAIDY_MAX_RESENDS re-sends per
 * approval, never a loop, and never at the moment of the failure:
 *   - the first no earlier than one poll interval after the failure (a
 *     dropped connection gets time to come back; a timed-out POST that may
 *     still be running is not duplicated at once);
 *   - the second only after a RELOAD of the page (a fresh page carries fresh
 *     server-action ids — the deploy-skew case, where the old page's action
 *     throws every time), again one poll interval after the last failure.
 *
 *   pending   the Hub has not seen the id yet (a re-send may still be due)
 *   resends   re-sends already made for this approval
 *   failedAt  when the last attempt (filing or re-send) failed
 *   page      the page load that made that attempt (pageId of the mount)
 */
export type PaidyHold = {
  reason: HoldReason; since: number; saw: boolean;
  paidyId?: string; pending?: boolean; resends?: number; failedAt?: number; page?: string;
};

export const PAIDY_MAX_RESENDS = 2;

const PAIDY_PAYMENT_ID = /^pay_[A-Za-z0-9_-]{6,80}$/;

/**
 * Filing answers that mean the Hub never received the id (L3 + review L-1):
 *   network / timeout — the call never answered;
 *   failed            — any non-Hub error between the site's server and the
 *                       Hub, or a Hub 5xx before it read the id;
 *   signed_out        — refused before any Hub call (no session token) or by
 *                       the Hub's sign-in check before the body is read.
 * Any other answer is the Hub's own refusal of an id it has read.
 */
const HUB_NEVER_SAW = new Set(["network", "timeout", "failed", "signed_out"]);
export function hubNeverSawId(code: string | null): boolean {
  return code !== null && HUB_NEVER_SAW.has(code);
}

/** A stored hold, or null when it is missing or not one this code wrote. */
export function parseHold(raw: string | null | undefined): PaidyHold | null {
  if (!raw) return null;
  let h: Partial<PaidyHold>;
  try { h = JSON.parse(raw) as Partial<PaidyHold>; } catch { return null; }
  if (!h || typeof h !== "object") return null;
  if (h.reason !== "uncertain" && h.reason !== "releasing") return null;
  if (typeof h.since !== "number" || !Number.isFinite(h.since)) return null;
  const out: PaidyHold = { reason: h.reason, since: h.since, saw: h.saw === true };
  if (typeof h.paidyId === "string" && PAIDY_PAYMENT_ID.test(h.paidyId)) {
    out.paidyId = h.paidyId;
    out.pending = h.pending === true;
    const n = Number(h.resends);
    out.resends = Number.isInteger(n) && n >= 0 ? Math.min(n, PAIDY_MAX_RESENDS) : PAIDY_MAX_RESENDS;
    out.failedAt = typeof h.failedAt === "number" && Number.isFinite(h.failedAt) ? h.failedAt : out.since;
    if (typeof h.page === "string") out.page = h.page;
  }
  return out;
}

/**
 * L3 / M-1: whether the id may be sent again NOW from the page load `pageId`.
 * One poll interval after the last failure; the first re-send from any page,
 * the second only from a page other than the one whose attempt failed last
 * (i.e. after a reload); never more than PAIDY_MAX_RESENDS.
 */
export function resendDue(h: PaidyHold | null, now: number, pageId: string): boolean {
  if (!h || !h.paidyId || h.pending !== true) return false;
  const n = h.resends ?? PAIDY_MAX_RESENDS;
  if (n >= PAIDY_MAX_RESENDS) return false;
  if (now - (h.failedAt ?? h.since) < PAIDY_POLL_MS) return false;
  return n === 0 || h.page !== pageId;
}

/** A re-send may still come (now or later, possibly only after a reload). */
export function resendPossible(h: PaidyHold | null): boolean {
  return !!h && !!h.paidyId && h.pending === true && (h.resends ?? PAIDY_MAX_RESENDS) < PAIDY_MAX_RESENDS;
}

/**
 * The hold to enter after Paidy said AUTHORIZED and the filing answered
 * `code`. `next` is afterAuthorized(code). The Paidy id is kept for a later
 * re-send only when the Hub never saw it (hubNeverSawId).
 */
export function holdAfterFiling(next: HoldReason, code: string | null, paidyId: string | undefined, now: number, pageId: string): PaidyHold {
  const h: PaidyHold = { reason: next, since: now, saw: false };
  if (hubNeverSawId(code) && typeof paidyId === "string" && PAIDY_PAYMENT_ID.test(paidyId)) {
    Object.assign(h, { paidyId, pending: true, resends: 0, failedAt: now, page: pageId });
  }
  return h;
}

/** Marks a re-send as made BEFORE the call, so a reload during it never repeats it. */
export function holdBeforeResend(h: PaidyHold, now: number, pageId: string): PaidyHold {
  return { ...h, resends: (h.resends ?? 0) + 1, failedAt: now, page: pageId };
}

/**
 * After a re-send (L3): when the Hub still never saw the id the hold stays
 * pending (another re-send only if resendDue allows it — after a reload, at
 * most PAIDY_MAX_RESENDS in all); any Hub answer ends the re-sending. Filed →
 * the hold stays (the refreshed page shows "being processed"); a refusal
 * follows afterAuthorized — "releasing" only where the Hub itself releases
 * the hold at Paidy; anything else keeps waiting.
 */
export function holdAfterResend(h: PaidyHold, code: string | null, now: number): PaidyHold {
  const next = afterAuthorized(code);
  return {
    ...h,
    pending: hubNeverSawId(code),
    failedAt: now,
    reason: next === "releasing" ? "releasing" : h.reason,
  };
}

/**
 * L6: a hold found in the tab when the page loads. Dropped when it is over
 * (holdEnded), and an "uncertain" hold is stale when the Hub shows no open
 * window (the Hub filed it and the order later came back, or nothing is held
 * any more) — EXCEPT while an approved id may still have to be handed to the
 * Hub (L3): that is sent first.
 */
export function holdOnLoad(h: PaidyHold | null, windowOpen: boolean, now: number): "keep" | "drop" | "none" {
  if (!h) return "none";
  if (resendPossible(h)) return "keep";
  if (h.reason === "uncertain" && !windowOpen) return "drop";
  return holdEnded({ since: h.since, sawWindowOpen: h.saw, windowOpen, now }) ? "drop" : "keep";
}

/**
 * L6: every poll tick (and each new Hub answer) while held, on page load
 * `pageId`. A due re-send goes first; a re-send that is not due yet keeps the
 * hold (it must not be released under an id the Hub has never seen while one
 * is still possible from this page); then the hold ends when holdEnded says so
 * (the time limit is checked on every tick, so a page left open ends at the
 * same moment as a reloaded one); otherwise ask the Hub again.
 */
export function holdTick(h: PaidyHold, windowOpen: boolean, now: number, pageId: string): "resend" | "release" | "poll" {
  if (resendDue(h, now, pageId)) return "resend";
  if (resendPossible(h) && ((h.resends ?? 0) === 0 || h.page !== pageId)) return "poll";
  return holdEnded({ since: h.since, sawWindowOpen: h.saw, windowOpen, now }) ? "release" : "poll";
}

/**
 * L6: what Paidy's closed-callback answer leads to (status from paidyStatus).
 *   AUTHORIZED with an id → file it; AUTHORIZED without one → hold (the Hub
 *   recovers it from Paidy's notification; never end the window);
 *   REJECTED / CLOSED → end the window, naming Paidy's id when it gave one
 *   (PA04); UNKNOWN → hold, never a close (PA15A).
 */
export function closedOutcome(status: "AUTHORIZED" | "REJECTED" | "CLOSED" | "UNKNOWN", hasId: boolean): "file" | "hold" | "end_rejected" | "end_closed" {
  if (status === "AUTHORIZED") return hasId ? "file" : "hold";
  if (status === "REJECTED") return "end_rejected";
  if (status === "CLOSED") return "end_closed";
  return "hold";
}

/**
 * M1 / L4 (2026-10-10): what a refused START does. 409 payment_in_progress
 * means something already holds the order — since the Hub's second-hold fix,
 * possibly an approval Paidy reported that the Hub has not filed yet — so the
 * page shows its "being checked" hold, never a live button over an error.
 * Any other refusal is an error line; a TRANSIENT start failure (no answer,
 * a timeout, a Hub 5xx — code "failed") gets the start's own "try again in a
 * moment" words — nothing was opened, so nothing can have been "recorded".
 * A permanent refusal (method_not_chosen, order_cannot_take_payment, any
 * other Hub 4xx) arrives as paidy_not_offered (review L-2; paidy-actions.ts)
 * and keeps its "not available — reload" line.
 */
export function startRefusal(code: string): { hold: true } | { hold: false; code: string } {
  if (code === "payment_in_progress") return { hold: true };
  if (code === "failed" || code === "network" || code === "timeout") return { hold: false, code: "start_failed" };
  return { hold: false, code };
}

/**
 * Review L-2 (2026-10-10): the code a refused START reports. `code` is the
 * filing-style mapping (paidyCode); `hubStatus` the Hub's HTTP status, or null
 * when the Hub never answered. An unnamed Hub 4xx (method_not_chosen,
 * order_not_found, …) is permanent for this page → paidy_not_offered; only a
 * transient failure (no answer, Hub 5xx) stays "failed" (→ start_failed).
 */
export function startFailureCode(code: string, hubStatus: number | null): string {
  if (code !== "failed") return code;
  if (hubStatus !== null && hubStatus >= 400 && hubStatus < 500) return "paidy_not_offered";
  return "failed";
}
