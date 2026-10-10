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
