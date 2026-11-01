/**
 * SITEMAP READ POLICY (DP-15, owner-approved 2026-11-01; matrix §S).
 *
 * A failed Hub read must NEVER become a successful empty result: the sitemap is
 * cached, so a swallowed failure ships a truncated 200 to crawlers. An empty
 * list the Hub really sent is data and is accepted for every family (no
 * catalog invariant was approved).
 *
 * - `essential()` runs one read with a per-attempt abort (6 s), up to two
 *   retries (300 ms, 600 ms) and a shared global signal (45 s). Per-attempt and
 *   global cancellation COMPOSE: whichever fires first aborts the request.
 * - A response that is not an array is a failed read, not an empty one.
 * - `strictSitemap()` decides the mode by data source, not environment name:
 *   strict wherever a real Hub is read (production AND the real-data preview);
 *   tolerant, labelled `sitemap-fixture-mode`, only for the fixtures flag or an
 *   unconfigured Hub off production.
 */
export const ATTEMPT_MS = 6000;
export const RETRY_DELAYS_MS = [300, 600] as const;
export const GLOBAL_MS = 45_000;
export const LOOKUP_WAVE = 8;

export class SitemapUnavailable extends Error {
  families: string[];
  constructor(families: string[], cause?: unknown) {
    super(`sitemap unavailable: essential read failed (${families.join(", ")})`);
    this.name = "SitemapUnavailable";
    this.families = families;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export type Timing = { attemptMs: number; retryDelaysMs: readonly number[]; globalMs: number };
export const DEFAULT_TIMING: Timing = { attemptMs: ATTEMPT_MS, retryDelaysMs: RETRY_DELAYS_MS, globalMs: GLOBAL_MS };

/** AbortSignal.any with a fallback for runtimes older than Node 20.3. */
export function anySignal(signals: AbortSignal[]): AbortSignal {
  const native = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (typeof native === "function") return native.call(AbortSignal, signals);
  const c = new AbortController();
  for (const s of signals) {
    if (s.aborted) { c.abort(s.reason); break; }
    s.addEventListener("abort", () => c.abort(s.reason), { once: true });
  }
  return c.signal;
}

/** A retry cannot help a definite client error (401, 403, 400…) — but can help 408, 429 and everything else. */
function retryable(e: unknown): boolean {
  const status = (e as { status?: unknown })?.status;
  if (typeof status === "number" && status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
  return true;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const t = setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve(); }, ms);
    const onAbort = () => { clearTimeout(t); reject(signal.reason); };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** One essential read: abortable attempts, bounded retries, shared global signal. Throws the last error. */
export async function essential<T>(
  read: (signal: AbortSignal) => Promise<T>,
  global: AbortSignal,
  timing: Timing = DEFAULT_TIMING,
  validate: (v: T) => boolean = (v) => Array.isArray(v),
): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= timing.retryDelaysMs.length; attempt++) {
    if (global.aborted) throw global.reason ?? last;
    const signal = anySignal([AbortSignal.timeout(timing.attemptMs), global]);
    try {
      const v = await read(signal);
      if (!validate(v)) throw new Error("invalid response shape");
      return v;
    } catch (e) {
      last = e;
      if (global.aborted || !retryable(e) || attempt === timing.retryDelaysMs.length) throw e;
      await sleep(timing.retryDelaysMs[attempt], global);
    }
  }
  throw last;
}

/** Runs `fn` over `items` in waves of at most `size`. */
export async function inWaves<I, O>(items: readonly I[], size: number, fn: (i: I) => Promise<O>): Promise<O[]> {
  const out: O[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

/**
 * Strict wherever a real Hub is read. Tolerant (fixture mode) only when the
 * fixtures flag is on, or no Hub is configured and this is not production.
 */
export function strictSitemap(env: Record<string, string | undefined> = process.env, fixtures = false): boolean {
  if (fixtures) return false;
  const configured = !!(env.HUB_API_URL && env.HUB_API_KEY);
  if (configured) return true;
  return env.VERCEL_ENV === "production";
}
